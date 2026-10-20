const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Crop = require('../models/Crop');
const { protect } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Helper to optionally get current user ID without throwing 401
function getOptionalUserId(req) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.id;
    }
  } catch {
    return null;
  }
  return null;
}

// GET /api/farmers - List all farmers with summary statistics
router.get('/', async (req, res) => {
  try {
    const currentUserId = getOptionalUserId(req);

    const farmers = await User.find({ role: 'Farmer' })
      .select('name location bio avatar createdAt')
      .lean();

    const farmerIds = farmers.map((f) => f._id);
    const crops = await Crop.find({ farmer: { $in: farmerIds } })
      .select('name category price unit farmer')
      .lean();

    const cropsByFarmer = {};
    crops.forEach((c) => {
      const fId = c.farmer.toString();
      if (!cropsByFarmer[fId]) cropsByFarmer[fId] = [];
      cropsByFarmer[fId].push(c);
    });

    const enriched = await Promise.all(
      farmers.map(async (farmer) => {
        const fId = farmer._id.toString();
        const farmerCrops = cropsByFarmer[fId] || [];
        const followerCount = await User.countDocuments({ following: farmer._id });
        let isFollowing = false;
        if (currentUserId) {
          const user = await User.findById(currentUserId).select('following').lean();
          isFollowing = user?.following?.some((id) => id.toString() === fId) || false;
        }

        return {
          ...farmer,
          cropCount: farmerCrops.length,
          crops: farmerCrops.slice(0, 3),
          followerCount,
          isFollowing
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error('Fetch farmers error:', error);
    res.status(500).json({ message: 'Failed to fetch farmers list.' });
  }
});

// GET /api/farmers/:id - Get a specific farmer's full profile and available crops
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid farmer ID.' });
    }

    const farmer = await User.findOne({ _id: id, role: 'Farmer' })
      .select('name location bio avatar createdAt role')
      .lean();

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    const crops = await Crop.find({ farmer: id }).sort({ createdAt: -1 }).lean();
    const followerCount = await User.countDocuments({ following: id });

    let isFollowing = false;
    const currentUserId = getOptionalUserId(req);
    if (currentUserId) {
      const user = await User.findById(currentUserId).select('following').lean();
      isFollowing = user?.following?.some((fid) => fid.toString() === id) || false;
    }

    res.json({
      farmer,
      crops,
      cropCount: crops.length,
      followerCount,
      isFollowing
    });
  } catch (error) {
    console.error('Fetch farmer profile error:', error);
    res.status(500).json({ message: 'Failed to load farmer profile.' });
  }
});

// POST /api/farmers/:id/follow - Follow or unfollow a farmer
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid farmer ID.' });
    }

    if (id === currentUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself.' });
    }

    const farmer = await User.findOne({ _id: id, role: 'Farmer' });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found.' });
    }

    const currentUser = await User.findById(currentUserId);
    const isAlreadyFollowing = currentUser.following.some(
      (fid) => fid.toString() === id
    );

    if (isAlreadyFollowing) {
      currentUser.following = currentUser.following.filter(
        (fid) => fid.toString() !== id
      );
    } else {
      currentUser.following.push(farmer._id);
    }

    await currentUser.save();
    const followerCount = await User.countDocuments({ following: id });

    res.json({
      following: !isAlreadyFollowing,
      followerCount,
      message: !isAlreadyFollowing ? `Following ${farmer.name}` : `Unfollowed ${farmer.name}`
    });
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({ message: 'Failed to toggle follow status.' });
  }
});

module.exports = router;
