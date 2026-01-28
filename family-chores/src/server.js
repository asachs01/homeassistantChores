const express = require('express');
const cors = require('cors');
const path = require('path');
const { initialize } = require('./db/init');
const { testConnection, getPoolStatus } = require('./db/pool');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware configured for Home Assistant integration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// JSON body parser
app.use(express.json());

// Static file serving for frontend
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Database status endpoint
app.get('/api/db/status', async (req, res) => {
  const connected = await testConnection();
  const poolStatus = getPoolStatus();

  res.json({
    connected,
    pool: poolStatus,
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
async function start() {
  try {
    const dbInitialized = await initialize();
    if (!dbInitialized) {
      console.warn('Warning: Database initialization failed, starting without database');
    }

    app.listen(PORT, () => {
      console.log(`Family Household Manager running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
