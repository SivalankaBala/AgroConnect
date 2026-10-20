const express = require('express');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Crop = require('../models/Crop');
const { protect } = require('../middleware/auth');
const { getIO } = require('../socket');

const router = express.Router();

/**
 * GET /api/chat/unread-count
 * Returns total unread messages count for the authenticated user
 */
router.get('/unread-count', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadCount = await Message.countDocuments({
      recipient: userId,
      read: false
    });
    res.json({ unreadCount });
  } catch (error) {
    console.error('Fetch unread count error:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

/**
 * GET /api/chat/conversations
 * List all conversations in which the authenticated user is a participant
 */
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name email role avatar location businessType phone')
      .populate('crop', 'name price unit location category image')
      .populate('lastSender', 'name role')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    // Deduplicate by other participant: if multiple exist, pick the one with lastMessage / latest
    const participantMap = new Map();
    for (const conv of conversations) {
      const other = (conv.participants || []).find((p) => p && p._id.toString() !== userId.toString());
      const otherId = other?._id ? other._id.toString() : conv._id.toString();

      if (!participantMap.has(otherId)) {
        participantMap.set(otherId, conv);
      } else {
        const existing = participantMap.get(otherId);
        if (!existing.lastMessage && conv.lastMessage) {
          participantMap.set(otherId, conv);
        }
      }
    }

    const uniqueConvs = Array.from(participantMap.values());

    // Calculate unread count per conversation for the requesting user
    const conversationsWithUnread = await Promise.all(
      uniqueConvs.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          recipient: userId,
          read: false
        });
        const convObj = conv.toObject();
        convObj.unreadCount = unreadCount;
        return convObj;
      })
    );

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({ message: 'Failed to fetch conversations.' });
  }
});

/**
 * POST /api/chat/conversations
 * Get or create a conversation between the authenticated user and another user (with optional crop)
 */
router.post('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId, cropId } = req.body;

    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: 'Valid recipient ID is required.' });
    }

    if (recipientId.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Cannot start a conversation with yourself.' });
    }

    const recipientUser = await User.findById(recipientId).select('name email role avatar location businessType phone');
    if (!recipientUser) {
      return res.status(404).json({ message: 'Recipient user not found.' });
    }

    // Role check: Buyer <-> Farmer messaging (both directions allowed)
    const currentUserRole = req.user.role;
    const recipientRole = recipientUser.role;

    if (currentUserRole === 'Buyer' && recipientRole !== 'Farmer') {
      return res.status(400).json({ message: 'Buyers can only initiate conversations with Farmers.' });
    }
    if (currentUserRole === 'Farmer' && recipientRole !== 'Buyer') {
      return res.status(400).json({ message: 'Farmers can only initiate conversations with Buyers.' });
    }

    let validCropId = null;
    if (cropId) {
      if (!mongoose.Types.ObjectId.isValid(cropId)) {
        return res.status(400).json({ message: 'Invalid crop ID provided.' });
      }
      const cropDoc = await Crop.findById(cropId);
      if (cropDoc) {
        validCropId = cropDoc._id;
      }
    }

    // Find any existing conversations between these two participants
    const existingConvs = await Conversation.find({
      participants: { $all: [userId, recipientId], $size: 2 }
    }).sort({ lastMessageAt: -1, updatedAt: -1 });

    let conversation = null;
    let isNew = false;

    if (existingConvs.length > 0) {
      conversation = existingConvs[0];

      // Merge and clean up any duplicate conversations
      if (existingConvs.length > 1) {
        for (let i = 1; i < existingConvs.length; i++) {
          const dup = existingConvs[i];
          await Message.updateMany(
            { conversation: dup._id },
            { conversation: conversation._id }
          );
          await Conversation.findByIdAndDelete(dup._id);
        }
      }

      // Update crop if a new validCropId is passed
      if (validCropId && (!conversation.crop || conversation.crop.toString() !== validCropId.toString())) {
        conversation.crop = validCropId;
        await conversation.save();
      }

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email role avatar location businessType phone')
        .populate('crop', 'name price unit location category image')
        .populate('lastSender', 'name role');
    } else {
      const created = await Conversation.create({
        participants: [userId, recipientId],
        crop: validCropId,
        lastMessage: '',
        lastSender: null,
        lastMessageAt: new Date(),
        unreadBy: []
      });

      conversation = await Conversation.findById(created._id)
        .populate('participants', 'name email role avatar location businessType phone')
        .populate('crop', 'name price unit location category image')
        .populate('lastSender', 'name role');

      isNew = true;
    }

    const convObj = conversation.toObject();
    convObj.unreadCount = await Message.countDocuments({
      conversation: conversation._id,
      recipient: userId,
      read: false
    });

    res.status(isNew ? 201 : 200).json(convObj);
  } catch (error) {
    console.error('Create/get conversation error:', error);
    res.status(500).json({ message: 'Failed to open conversation.', error: error.message });
  }
});

/**
 * GET /api/chat/conversations/:id
 * Retrieve a single conversation by ID
 */
router.get('/conversations/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid conversation ID.' });
    }

    const conversation = await Conversation.findById(id)
      .populate('participants', 'name email role avatar location businessType phone')
      .populate('crop', 'name price unit location category image')
      .populate('lastSender', 'name role');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const isParticipant = conversation.participants.some(
      (p) => (p._id || p).toString() === userId
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied to this conversation.' });
    }

    const convObj = conversation.toObject();
    convObj.unreadCount = await Message.countDocuments({
      conversation: conversation._id,
      recipient: userId,
      read: false
    });

    res.json(convObj);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Failed to fetch conversation.' });
  }
});

/**
 * Helper to fetch messages and mark as read
 */
async function getConversationMessages(conversationId, userId, query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 100, 200);
  const skip = (page - 1) * limit;

  // Mark messages sent to this user as read
  const updatedResult = await Message.updateMany(
    { conversation: conversationId, recipient: userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );

  // Update conversation unreadBy
  const conversation = await Conversation.findById(conversationId)
    .populate('participants', 'name email role avatar location businessType phone')
    .populate('crop', 'name price unit location category image');

  conversation.unreadBy = (conversation.unreadBy || []).filter(
    (id) => id.toString() !== userId
  );
  await conversation.save();

  // Real-time notification of read status via Socket.IO
  if (updatedResult.modifiedCount > 0) {
    const io = getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit('messages_read', {
        conversationId,
        readBy: userId,
        readAt: new Date()
      });
      io.to(`user:${userId}`).emit('unread_count_updated');
    }
  }

  const totalMessages = await Message.countDocuments({ conversation: conversationId });
  const messages = await Message.find({ conversation: conversationId })
    .populate('sender', 'name role avatar')
    .populate('recipient', 'name role avatar')
    .populate('crop', 'name price unit')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

  return {
    conversation,
    messages,
    pagination: {
      page,
      limit,
      totalMessages,
      hasMore: skip + messages.length < totalMessages
    }
  };
}

/**
 * GET /api/chat/conversations/:id/messages
 * Load message history for a conversation
 */
router.get('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid conversation ID.' });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied to this conversation.' });
    }

    const data = await getConversationMessages(id, userId, req.query);
    res.json(data);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Failed to fetch conversation messages.' });
  }
});

/**
 * Legacy route GET /api/chat/messages/:conversationId
 * Preserved for backwards-compatibility
 */
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

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied to this conversation.' });
    }

    const data = await getConversationMessages(conversationId, userId, req.query);
    res.json(data);
  } catch (error) {
    console.error('Fetch messages legacy error:', error);
    res.status(500).json({ message: 'Failed to fetch conversation messages.' });
  }
});

/**
 * Helper to process sending a message
 */
async function processSendMessage(userId, { conversationId, recipientId, cropId, text }) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw { status: 400, message: 'Message text cannot be empty.' };
  }

  const trimmedText = text.trim();
  if (trimmedText.length > 3000) {
    throw { status: 400, message: 'Message text cannot exceed 3000 characters.' };
  }

  let conversation;
  let targetRecipientId = recipientId;
  let targetCropId = cropId;

  if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
    conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw { status: 404, message: 'Conversation not found.' };
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant) {
      throw { status: 403, message: 'Access denied to this conversation.' };
    }

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
    throw { status: 400, message: 'Recipient is required.' };
  }

  if (targetRecipientId.toString() === userId.toString()) {
    throw { status: 400, message: 'Cannot send a message to yourself.' };
  }

  const recipientUser = await User.findById(targetRecipientId);
  if (!recipientUser) {
    throw { status: 404, message: 'Recipient user not found.' };
  }

  // Find or create conversation if not yet loaded
  if (!conversation) {
    conversation = await Conversation.findOne({
      participants: { $all: [userId, targetRecipientId], $size: 2 }
    });

    if (conversation) {
      if (targetCropId && (!conversation.crop || conversation.crop.toString() !== targetCropId.toString())) {
        conversation.crop = targetCropId;
        await conversation.save();
      }
    } else {
      conversation = await Conversation.create({
        participants: [userId, targetRecipientId],
        crop: targetCropId || null,
        lastMessage: trimmedText,
        lastSender: userId,
        lastMessageAt: new Date(),
        unreadBy: [targetRecipientId]
      });
    }
  }

  // Create message document
  const message = await Message.create({
    conversation: conversation._id,
    sender: userId,
    recipient: targetRecipientId,
    crop: targetCropId || null,
    text: trimmedText,
    read: false
  });

  // Update conversation
  conversation.lastMessage = trimmedText;
  conversation.lastSender = userId;
  conversation.lastMessageAt = new Date();
  if (!conversation.unreadBy.some((id) => id.toString() === targetRecipientId.toString())) {
    conversation.unreadBy.push(targetRecipientId);
  }
  if (targetCropId && !conversation.crop) {
    conversation.crop = targetCropId;
  }
  await conversation.save();

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name role avatar')
    .populate('recipient', 'name role avatar')
    .populate('crop', 'name price unit');

  // Emit real-time Socket.IO events to rooms without duplicating to multi-room sockets
  const io = getIO();
  if (io) {
    io.to(`conversation:${conversation._id}`).to(`user:${targetRecipientId}`).emit('new_message', populatedMessage);
    io.to(`user:${targetRecipientId}`).emit('unread_count_updated');
    io.to(`user:${targetRecipientId}`).emit('message_notification', populatedMessage);
    io.to(`user:${targetRecipientId}`).emit('conversation_updated', {
      conversationId: conversation._id,
      lastMessage: trimmedText,
      lastMessageAt: conversation.lastMessageAt,
      lastSender: userId
    });
    io.to(`user:${userId}`).emit('conversation_updated', {
      conversationId: conversation._id,
      lastMessage: trimmedText,
      lastMessageAt: conversation.lastMessageAt,
      lastSender: userId
    });
  }

  return {
    message: populatedMessage,
    conversationId: conversation._id
  };
}

/**
 * POST /api/chat/conversations/:id/messages
 * Send message in a specific conversation
 */
router.post('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, cropId } = req.body;
    const result = await processSendMessage(req.user.id, {
      conversationId: id,
      text,
      cropId
    });
    res.status(201).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('Send message in conversation error:', error);
    res.status(500).json({ message: 'Failed to send message.' });
  }
});

/**
 * Legacy route POST /api/chat/messages
 * Send a message (specifying either conversationId or recipientId)
 */
router.post('/messages', protect, async (req, res) => {
  try {
    const { conversationId, recipientId, cropId, text } = req.body;
    const result = await processSendMessage(req.user.id, {
      conversationId,
      recipientId,
      cropId,
      text
    });
    res.status(201).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message.' });
  }
});

/**
 * POST /api/chat/conversations/:id/read
 * Mark all messages in a conversation as read by the recipient
 */
router.post('/conversations/:id/read', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid conversation ID.' });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const result = await Message.updateMany(
      { conversation: id, recipient: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    conversation.unreadBy = (conversation.unreadBy || []).filter(
      (pid) => pid.toString() !== userId
    );
    await conversation.save();

    if (result.modifiedCount > 0) {
      const io = getIO();
      if (io) {
        io.to(`conversation:${id}`).emit('messages_read', {
          conversationId: id,
          readBy: userId,
          readAt: new Date()
        });
        io.to(`user:${userId}`).emit('unread_count_updated');
      }
    }

    res.json({ success: true, count: result.modifiedCount });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read.' });
  }
});

module.exports = router;
