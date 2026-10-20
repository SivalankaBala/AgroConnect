const express = require('express');
const Crop = require('../models/Crop');
const User = require('../models/User');
const { protect, farmerOnly } = require('../middleware/auth');
const router = express.Router();

// GET: retrieve all crop listings
router.get('/', async (req, res) => {
  try {
    const crops = await Crop.find().sort({ createdAt: -1 });
    res.json(crops);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch crops' });
  }
});

// POST: create a crop listing
router.post('/', protect, farmerOnly, async (req, res) => {
  try {
    const { name, category, quantity, unit, price, location, description, image } = req.body;

    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'Farmer') {
      return res.status(403).json({
        message: 'Farmer account not found.'
      });
    }

    const crop = await Crop.create({
      name,
      category,
      quantity,
      unit,
      price,
      location,
      description,
      image: image || '',
      farmerName: user.name,
      farmer: user._id
    });

    res.status(201).json(crop);
  } catch (error) {
    res.status(400).json({
      message: 'Could not create crop listing',
      error: error.message
    });
  }
});

// Get crop listings belonging to the logged-in farmer
router.get('/my-listings', protect, farmerOnly, async (req, res) => {
  try {
    const crops = await Crop.find({
      farmer: req.user.id
    }).sort({ createdAt: -1 });

    console.log("Logged-in farmer ID:", req.user.id);
    console.log("Matching crop count:", crops.length);

    res.json(crops);
  } catch (error) {
    console.error('My listings error:', error);
    res.status(500).json({
      message: 'Failed to fetch your crop listings.'
    });
  }
});

// PUT: Update a crop listing (farmer who owns the crop only)
router.put('/:id', protect, farmerOnly, async (req, res) => {
  try {
    const { name, category, quantity, unit, price, location, description, image } = req.body;

    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      return res.status(404).json({ message: 'Crop listing not found.' });
    }

    if (crop.farmer && crop.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You cannot edit another farmer’s crop listing.' });
    }

    if (name !== undefined) crop.name = name.trim();
    if (category !== undefined) crop.category = category.trim();
    if (quantity !== undefined) crop.quantity = Number(quantity);
    if (unit !== undefined) crop.unit = unit.trim();
    if (price !== undefined) crop.price = Number(price);
    if (location !== undefined) crop.location = location.trim();
    if (description !== undefined) crop.description = description.trim();
    if (image !== undefined) crop.image = image;

    await crop.save();

    res.json({ message: 'Crop listing updated successfully.', crop });
  } catch (error) {
    console.error('Update crop error:', error);
    res.status(400).json({ message: 'Failed to update crop listing.', error: error.message });
  }
});

// DELETE: Delete a crop listing (farmer who owns the crop only)
router.delete('/:id', protect, farmerOnly, async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      return res.status(404).json({ message: 'Crop listing not found.' });
    }

    if (crop.farmer && crop.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You cannot delete another farmer’s crop listing.' });
    }

    await Crop.findByIdAndDelete(req.params.id);

    res.json({ message: 'Crop listing deleted successfully.' });
  } catch (error) {
    console.error('Delete crop error:', error);
    res.status(500).json({ message: 'Failed to delete crop listing.' });
  }
});

module.exports = router;
