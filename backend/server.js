const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const cropRoutes = require('./routes/crops');
const authRoutes = require('./routes/auth');
const enquiryRoutes = require('./routes/enquiries');
const chatRoutes = require('./routes/chat');
const farmerRoutes = require('./routes/farmers');
const buyerRoutes = require('./routes/buyers');
const weatherRoutes = require('./routes/weather');
const notificationRoutes = require('./routes/notifications');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Allow CORS from configured client URL (e.g. Vercel domain) or any origin if not restricted
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : '*';

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

// Root endpoint for status / health checks on Render
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'AgroConnect Backend API',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/crops', cropRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AgroConnect backend is running!'
  });
});

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set! Please add MONGODB_URI in your Render service dashboard under Environment.");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully!');

    initSocket(server, allowedOrigins);
    console.log('Socket.IO real-time engine initialized.');

    server.listen(PORT, () => {
      console.log(`AgroConnect server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

startServer();