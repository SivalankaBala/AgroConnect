const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get all notifications for the authenticated user (Buyer or Farmer)
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('crop', 'name price unit location')
      .populate('sender', 'name role email')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications.'
    });
  }
});

// Mark a single notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Failed to mark notification read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read.'
    });
  }
});

// Mark all notifications as read for current user
router.put('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Failed to mark all notifications read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read.'
    });
  }
});

// Clear all notifications for the authenticated user
router.delete('/clear-all', protect, async (req, res) => {
  try {
    const result = await Notification.deleteMany({ recipient: req.user.id });
    res.json({
      success: true,
      message: 'All notifications cleared successfully.',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Failed to clear all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear all notifications.'
    });
  }
});

// Delete a single notification for the authenticated user
router.delete('/:id', protect, async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully.'
    });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification.'
    });
  }
});

module.exports = router;
