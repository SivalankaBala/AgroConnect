const express = require('express');
const Enquiry = require('../models/Enquiry');
const Crop = require('../models/Crop');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, farmerOnly } = require('../middleware/auth');
const { getIO } = require('../socket');

const router = express.Router();

// Helper to handle order confirmation or rejection with validation, notification & real-time dispatch
async function processOrderAction(req, res, targetStatus) {
  try {
    const enquiry = await Enquiry.findById(req.params.id).populate('crop');

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    if (!enquiry.crop || String(enquiry.crop.farmer) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You cannot update an enquiry for another farmer’s crop.'
      });
    }

    const currentStatus = (enquiry.status || '').toLowerCase();

    // Idempotency & duplicate protection
    if (currentStatus === 'confirmed') {
      if (targetStatus === 'confirmed') {
        return res.status(400).json({ success: false, message: 'This order has already been confirmed.' });
      }
      return res.status(400).json({ success: false, message: 'Confirmed orders cannot be modified.' });
    }

    if (currentStatus === 'rejected') {
      if (targetStatus === 'rejected') {
        return res.status(400).json({ success: false, message: 'This order has already been rejected.' });
      }
      return res.status(400).json({ success: false, message: 'Rejected orders cannot be reopened.' });
    }

    enquiry.status = targetStatus;
    await enquiry.save();

    const cropName = enquiry.crop?.name || 'Crop';
    let notifTitle = '';
    let notifMessage = '';
    let notifType = '';

    if (targetStatus === 'confirmed') {
      notifTitle = 'Order Confirmed!';
      notifMessage = `Good news! Your order for ${cropName} has been confirmed by the farmer. Please check your order details for more information.`;
      notifType = 'order_confirmed';
    } else {
      notifTitle = 'Order Update';
      notifMessage = `Your order for ${cropName} could not be accepted by the farmer. Please check your order details or contact the farmer for more information.`;
      notifType = 'order_rejected';
    }

    // Persist notification in database for the specific buyer only
    const notification = await Notification.create({
      recipient: enquiry.buyer,
      sender: req.user.id,
      type: notifType,
      title: notifTitle,
      message: notifMessage,
      enquiry: enquiry._id,
      crop: enquiry.crop?._id,
      cropName,
      status: targetStatus
    });

    // Real-time notification dispatch via Socket.IO
    try {
      const io = getIO();
      if (io) {
        const buyerRoom = `user:${enquiry.buyer.toString()}`;
        io.to(buyerRoom).emit('notification', notification);
        io.to(buyerRoom).emit('order_status_updated', {
          enquiryId: enquiry._id,
          status: targetStatus,
          cropName
        });
      }
    } catch (socketErr) {
      console.warn('Socket notification dispatch warning:', socketErr.message);
    }

    return res.json({
      success: true,
      message: targetStatus === 'confirmed' ? 'Order confirmed successfully!' : 'Order rejected.',
      enquiry,
      notification
    });
  } catch (error) {
    console.error('Order action failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process order action.',
      error: error.message
    });
  }
}

// Submit a buyer enquiry
router.post('/', protect, async (req, res) => {
  try {
    const { buyerName, buyerEmail, message, cropId } = req.body;

    if (!buyerName || !buyerEmail || !message || !cropId) {
      return res.status(400).json({
        message: 'Please fill in all enquiry fields.'
      });
    }

    const crop = await Crop.findById(cropId);

    if (!crop) {
      return res.status(404).json({
        message: 'Crop listing not found.'
      });
    }

    if (crop.farmer && crop.farmer.toString() === req.user.id) {
      return res.status(400).json({
        message: 'You cannot submit an enquiry for your own crop listing.'
      });
    }

    const emailToUse = (buyerEmail && buyerEmail.trim()) || req.user.email || '';

    const enquiry = await Enquiry.create({
      buyer: req.user.id,
      buyerName: buyerName.trim(),
      buyerEmail: emailToUse.trim().toLowerCase(),
      message: message.trim(),
      crop: crop._id
    });

    res.status(201).json({
      message: 'Enquiry submitted successfully!',
      enquiry
    });
  } catch (error) {
    res.status(400).json({
      message: 'Could not submit enquiry.',
      error: error.message
    });
  }
});

// View enquiries for crops owned by this farmer
router.get('/farmer', protect, farmerOnly, async (req, res) => {
  try {
    const myCrops = await Crop.find({ farmer: req.user.id }).select('_id');
    const cropIds = myCrops.map(crop => crop._id);

    const enquiries = await Enquiry.find({ crop: { $in: cropIds } })
      .populate('crop', 'name price unit location quantity farmer')
      .populate('buyer', 'name email role avatar')
      .sort({ createdAt: -1 });

    res.json(enquiries);
  } catch (error) {
    console.error('Farmer enquiries fetch error:', error);
    res.status(500).json({
      message: 'Failed to fetch buyer enquiries.'
    });
  }
});

// Confirm Order endpoint
router.patch('/:id/confirm', protect, farmerOnly, async (req, res) => {
  return processOrderAction(req, res, 'confirmed');
});

// Reject Order endpoint
router.patch('/:id/reject', protect, farmerOnly, async (req, res) => {
  return processOrderAction(req, res, 'rejected');
});

// Update an enquiry status, but only for the farmer who owns its crop
router.patch('/:id/status', protect, farmerOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const normalizedStatus = (status || '').toLowerCase();

    if (normalizedStatus === 'confirmed') {
      return processOrderAction(req, res, 'confirmed');
    }
    if (normalizedStatus === 'rejected') {
      return processOrderAction(req, res, 'rejected');
    }

    const allowedStatuses = ['Pending', 'Responded', 'Closed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid enquiry status.' });
    }

    const enquiry = await Enquiry.findById(req.params.id).populate('crop');

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found.' });
    }

    if (!enquiry.crop || String(enquiry.crop.farmer) !== req.user.id) {
      return res.status(403).json({
        message: 'You cannot update an enquiry for another farmer’s crop.'
      });
    }

    // Do not allow reopening confirmed or rejected orders via generic status update
    const currentStatus = (enquiry.status || '').toLowerCase();
    if (currentStatus === 'confirmed' || currentStatus === 'rejected') {
      return res.status(400).json({
        message: `This order is already ${currentStatus} and cannot be modified.`
      });
    }

    enquiry.status = status;
    await enquiry.save();

    res.json({
      success: true,
      message: 'Enquiry status updated.',
      enquiry
    });
  } catch (error) {
    console.error('Update enquiry status error:', error);
    res.status(500).json({
      message: 'Failed to update enquiry status.'
    });
  }
});

// Get enquiries submitted by the logged-in buyer
router.get('/my-enquiries', protect, async (req, res) => {
  try {
    const enquiries = await Enquiry.find({
      buyer: req.user.id
    })
      .populate('crop', 'name price unit location quantity farmer farmerName')
      .sort({ createdAt: -1 });

    res.json(enquiries);
  } catch (error) {
    console.error('Buyer enquiries error:', error);
    res.status(500).json({
      message: 'Failed to fetch your enquiries.'
    });
  }
});

module.exports = router;
