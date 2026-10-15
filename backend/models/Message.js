const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop'
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
