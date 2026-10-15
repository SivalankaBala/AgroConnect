const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}

// Register a new account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      password.length < 8 ||
      !['Farmer', 'Buyer'].includes(role)
    ) {
      return res.status(400).json({
        message: 'Enter a name, valid email, password (at least 8 characters), and valid role.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      message: 'Account created successfully.',
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        location: user.location || 'Andhra Pradesh',
        bio: user.bio || '',
        avatar: user.avatar || '',
        businessType: user.businessType || '',
        following: user.following || []
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Could not create account.' });
  }
});

// Log in to an existing account
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ message: 'Enter your email and password.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json({
      message: 'Login successful.',
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        location: user.location || 'Andhra Pradesh',
        bio: user.bio || '',
        avatar: user.avatar || '',
        businessType: user.businessType || '',
        following: user.following || []
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Could not log in.' });
  }
});

// Get current authenticated user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        location: user.location || 'Andhra Pradesh',
        bio: user.bio || '',
        avatar: user.avatar || '',
        businessType: user.businessType || '',
        following: user.following || [],
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Fetch me error:', error.message);
    res.status(500).json({ message: 'Failed to fetch user profile.' });
  }
});

// PUT /api/auth/profile - Update user profile fields
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, location, bio, businessType } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name !== undefined && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }
    if (phone !== undefined && typeof phone === 'string') {
      user.phone = phone.trim();
    }
    if (location !== undefined && typeof location === 'string') {
      user.location = location.trim();
    }
    if (bio !== undefined && typeof bio === 'string') {
      user.bio = bio.trim();
    }
    if (businessType !== undefined && typeof businessType === 'string') {
      user.businessType = businessType.trim();
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        location: user.location || 'Andhra Pradesh',
        bio: user.bio || '',
        avatar: user.avatar || '',
        businessType: user.businessType || '',
        following: user.following || [],
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

module.exports = router;
