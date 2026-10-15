const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['Farmer', 'Buyer'],
      required: true
    },
    phone: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: 'Andhra Pradesh'
    },
    bio: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    businessType: {
      type: String,
      default: ''
    },
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
