const express = require('express');
const Enquiry = require('../models/Enquiry');
const Crop = require('../models/Crop');
const User = require('../models/User');
const { protect, farmerOnly } = require('../middleware/auth');

const router = express.Router();

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
      .populate('crop', 'name price unit location')
      .sort({ createdAt: -1 });

    res.json(enquiries);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch buyer enquiries.'
    });
  }
});

// Update an enquiry status, but only for the farmer who owns its crop
router.patch('/:id/status', protect, farmerOnly, async (req, res) => {
  try {
    const { status } = req.body;
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

    enquiry.status = status;
    await enquiry.save();

    res.json({
      message: 'Enquiry status updated.',
      enquiry
    });
  } catch (error) {
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
      .populate('crop', 'name price unit location')
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
