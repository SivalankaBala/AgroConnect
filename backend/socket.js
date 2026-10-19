const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const User = require('./models/User');

let io = null;

function initSocket(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins || '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Socket authentication middleware using JWT
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        token = parts.length === 2 ? parts[1] : parts[0];
      }

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.user = decoded;
      next();
    } catch (err) {
      console.warn('Socket connection authentication rejected:', err.message);
      return next(new Error('Authentication error: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    // Join personal user room for private notifications
    socket.join(`user:${userId}`);

    // Join a specific conversation room
    socket.on('join_conversation', async (conversationId) => {
      try {
        if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) return;
        const conv = await Conversation.findById(conversationId).select('participants');
        if (!conv) return;

        const isParticipant = conv.participants.some((p) => p.toString() === userId);
        if (isParticipant) {
          socket.join(`conversation:${conversationId}`);
        }
      } catch (err) {
        console.error('Socket join_conversation error:', err);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Real-time send message via socket
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, text, recipientId, cropId } = data || {};
        if (!text || typeof text !== 'string' || !text.trim()) {
          if (typeof callback === 'function') callback({ error: 'Message text cannot be empty' });
          return;
        }

        if (text.length > 3000) {
          if (typeof callback === 'function') callback({ error: 'Message cannot exceed 3000 characters' });
          return;
        }

        let conv;
        let targetRecipient = recipientId;
        let targetCrop = cropId;

        if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
          conv = await Conversation.findById(conversationId);
          if (!conv) {
            if (typeof callback === 'function') callback({ error: 'Conversation not found' });
            return;
          }

          const isPart = conv.participants.some((p) => p.toString() === userId);
          if (!isPart) {
            if (typeof callback === 'function') callback({ error: 'Access denied' });
            return;
          }

          const other = conv.participants.find((p) => p.toString() !== userId);
          if (other) targetRecipient = other.toString();
          if (!targetCrop && conv.crop) targetCrop = conv.crop;
        } else if (targetRecipient && mongoose.Types.ObjectId.isValid(targetRecipient)) {
          if (targetRecipient === userId) {
            if (typeof callback === 'function') callback({ error: 'Cannot message yourself' });
            return;
          }

          conv = await Conversation.findOne({
            participants: { $all: [userId, targetRecipient], $size: 2 },
            ...(targetCrop ? { crop: targetCrop } : {})
          });

          if (!conv) {
            conv = await Conversation.create({
              participants: [userId, targetRecipient],
              crop: targetCrop || null,
              lastMessage: text.trim(),
              lastSender: userId,
              lastMessageAt: new Date(),
              unreadBy: [targetRecipient]
            });
          }
        } else {
          if (typeof callback === 'function') callback({ error: 'Recipient required' });
          return;
        }

        // Create Message
        const message = await Message.create({
          conversation: conv._id,
          sender: userId,
          recipient: targetRecipient,
          crop: targetCrop || null,
          text: text.trim(),
          read: false
        });

        // Update Conversation metadata
        conv.lastMessage = text.trim();
        conv.lastSender = userId;
        conv.lastMessageAt = new Date();
        if (!conv.unreadBy.some((id) => id.toString() === targetRecipient)) {
          conv.unreadBy.push(targetRecipient);
        }
        await conv.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name role avatar')
          .populate('recipient', 'name role avatar')
          .populate('crop', 'name price unit');

        // Broadcast to conversation room and to both participants
        io.to(`conversation:${conv._id}`).emit('new_message', populatedMessage);
        io.to(`user:${targetRecipient}`).emit('new_message', populatedMessage);
        io.to(`user:${targetRecipient}`).emit('unread_count_updated');
        io.to(`user:${targetRecipient}`).emit('message_notification', populatedMessage);
        io.to(`user:${targetRecipient}`).emit('conversation_updated', {
          conversationId: conv._id,
          lastMessage: text.trim(),
          lastMessageAt: conv.lastMessageAt,
          lastSender: userId
        });
        io.to(`user:${userId}`).emit('conversation_updated', {
          conversationId: conv._id,
          lastMessage: text.trim(),
          lastMessageAt: conv.lastMessageAt,
          lastSender: userId
        });

        if (typeof callback === 'function') {
          callback({ success: true, message: populatedMessage, conversationId: conv._id });
        }
      } catch (err) {
        console.error('Socket send_message error:', err);
        if (typeof callback === 'function') {
          callback({ error: err.message || 'Failed to send message' });
        }
      }
    });

    // Mark messages as read via socket
    socket.on('mark_read', async (conversationId) => {
      try {
        if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) return;
        const conv = await Conversation.findById(conversationId);
        if (!conv) return;

        const isPart = conv.participants.some((p) => p.toString() === userId);
        if (!isPart) return;

        const result = await Message.updateMany(
          { conversation: conversationId, recipient: userId, read: false },
          { $set: { read: true, readAt: new Date() } }
        );

        conv.unreadBy = (conv.unreadBy || []).filter((id) => id.toString() !== userId);
        await conv.save();

        if (result.modifiedCount > 0) {
          io.to(`conversation:${conversationId}`).emit('messages_read', {
            conversationId,
            readBy: userId,
            readAt: new Date()
          });
          io.to(`user:${userId}`).emit('unread_count_updated');
        }
      } catch (err) {
        console.error('Socket mark_read error:', err);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
