const dns = require('dns');
// Ensure IPv4 is prioritized to avoid DNS64/NAT64 timeouts with MongoDB Atlas on cellular/ISP networks
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

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
    message: 'AgroConnect backend is running!',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'connecting/disconnected'
  });
});

// Prevent unhandled promise rejections from crashing the process
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled Rejection:', reason);
});

async function startServer() {
  const uri = (process.env.MONGODB_URI || '').trim();
  if (!uri) {
    console.error("MONGODB_URI is not set! Please add MONGODB_URI in your environment.");
    process.exit(1);
  }

  const MAX_INITIAL_RETRIES = 5;
  const RETRY_DELAY_MS = 4000;
  let attempt = 0;
  let connected = false;

  while (!connected) {
    attempt++;
    try {
      console.log(`[MongoDB] Connecting (attempt ${attempt})...`);
      await mongoose.connect(uri, {
        family: 4, // Force IPv4 to completely bypass ISP NAT64/IPv6 connection timeouts
        serverSelectionTimeoutMS: 10000
      });
      connected = true;
      console.log('MongoDB connected successfully!');

      // Set up lifecycle listeners once successfully connected
      mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB] Connection lost. Mongoose will automatically reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('[MongoDB] Reconnected to database successfully.');
      });

      mongoose.connection.on('error', (err) => {
        console.error('[MongoDB] Connection error:', err.message);
      });
    } catch (error) {
      console.error(`[MongoDB] Connection attempt ${attempt} failed:`, error.message);
      if (attempt < MAX_INITIAL_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s (Atlas cluster may be waking up)...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        console.error('\n⚠️ Atlas connection taking longer than expected.');
        console.error('If this persists, check:');
        console.error('• MongoDB Atlas -> Network Access -> Add 0.0.0.0/0 (allow from anywhere)');
        console.error('• Verify your internet connection is active.\n');
        console.log('Retrying connection in 6 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 6000));
      }
    }
  }

  initSocket(server, allowedOrigins);
  console.log('Socket.IO real-time engine initialized.');

  server.listen(PORT, () => {
    console.log(`AgroConnect server running on port ${PORT}`);
  });
}

startServer();