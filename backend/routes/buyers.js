const express = require('express');
const User = require('../models/User');

const router = express.Router();

// GET /api/buyers - Public directory of buyers seeking agricultural produce
// Strictly excludes private email addresses, phone numbers, and credentials
router.get('/', async (req, res) => {
  try {
    const { search, location } = req.query;
    let query = { role: 'Buyer' };

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { businessType: { $regex: q, $options: 'i' } }
      ];
    }

    if (location && location !== 'All') {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    // Exclude private email, password, and phone
    const buyers = await User.find(query)
      .select('name location bio avatar businessType createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json(buyers);
  } catch (error) {
    console.error('Fetch buyers error:', error);
    res.status(500).json({ message: 'Failed to fetch buyers directory.' });
  }
});

module.exports = router;
