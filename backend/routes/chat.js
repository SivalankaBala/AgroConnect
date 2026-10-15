const express = require('express');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Crop = require('../models/Crop');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/chat/conversations - List conversations for the authenticated user
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name role avatar location businessType')
      .populate('crop', 'name price unit location category')
      .populate('lastSender', 'name')
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({ message: 'Failed to fetch conversations.' });
  }
});

// GET /api/chat/messages/:conversationId - Get messages for a specific conversation
router.get('/messages/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation ID.' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Verify participant authorization
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied to this conversation.' });
    }

    // Mark messages directed to this user as read
    await Message.updateMany(
      { conversation: conversationId, recipient: userId, read: false },
      { $set: { read: true } }
    );

    // Remove user from unreadBy in conversation
    conversation.unreadBy = (conversation.unreadBy || []).filter(
      (id) => id.toString() !== userId
    );
    await conversation.save();

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name role')
      .populate('recipient', 'name role')
      .populate('crop', 'name price unit')
      .sort({ createdAt: 1 });

    res.json({ conversation, messages });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Failed to fetch conversation messages.' });
  }
});

// POST /api/chat/messages - Send a message in a conversation
router.post('/messages', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId, text, cropId, conversationId } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'Message text cannot be empty.' });
    }

    let targetRecipientId = recipientId;
    let targetCropId = cropId;
    let conversation;

    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found.' });
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId
      );
      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied to this conversation.' });
      }

      // Identify other participant
      const otherParticipant = conversation.participants.find(
        (p) => p.toString() !== userId
      );
      if (otherParticipant) {
        targetRecipientId = otherParticipant.toString();
      }
      if (!targetCropId && conversation.crop) {
        targetCropId = conversation.crop;
      }
    }

    if (!targetRecipientId) {
      return res.status(400).json({ message: 'Recipient is required.' });
    }

    if (targetRecipientId === userId) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself.' });
    }

    // Verify recipient exists
    const recipientUser = await User.findById(targetRecipientId);
    if (!recipientUser) {
      return res.status(404).json({ message: 'Recipient user not found.' });
    }

    // Find or create conversation if not already loaded
    if (!conversation) {
      conversation = await Conversation.findOne({
        participants: { $all: [userId, targetRecipientId], $size: 2 },
        ...(targetCropId ? { crop: targetCropId } : {})
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [userId, targetRecipientId],
          crop: targetCropId || null,
          lastMessage: text.trim(),
          lastSender: userId,
          unreadBy: [targetRecipientId]
        });
      }
    }

    // Create the message
    const message = await Message.create({
      conversation: conversation._id,
      sender: userId,
      recipient: targetRecipientId,
      crop: targetCropId || null,
      text: text.trim(),
      read: false
    });

    // Update conversation metadata
    conversation.lastMessage = text.trim();
    conversation.lastSender = userId;
    if (!conversation.unreadBy.some((id) => id.toString() === targetRecipientId)) {
      conversation.unreadBy.push(targetRecipientId);
    }
    if (targetCropId && !conversation.crop) {
      conversation.crop = targetCropId;
    }
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name role')
      .populate('recipient', 'name role')
      .populate('crop', 'name price unit');

    res.status(201).json({
      message: populatedMessage,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message.', error: error.message });
  }
});

module.exports = router;
