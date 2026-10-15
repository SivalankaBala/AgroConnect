const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop'
    },
    lastMessage: {
      type: String,
      default: ''
    },
    lastSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    unreadBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
