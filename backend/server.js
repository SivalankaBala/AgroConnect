const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const cropRoutes = require('./routes/crops');
const authRoutes = require('./routes/auth');
const enquiryRoutes = require('./routes/enquiries');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/crops', cropRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/enquiries', enquiryRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AgroConnect backend is running!'
  });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully!');
    app.listen(PORT, () => {
      console.log(`AgroConnect server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

startServer();