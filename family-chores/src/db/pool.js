/**
 * PostgreSQL connection pool
 * Creates and exports a reusable connection pool
 */

const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool(config);

// Log connection status
pool.on('connect', () => {
  console.log('Database: New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Database: Unexpected error on idle client', err);
});

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Database: Connection test successful');
    return true;
  } catch (err) {
    console.error('Database: Connection test failed', err.message);
    return false;
  }
}

/**
 * Get connection pool status
 * @returns {Object} Pool status information
 */
function getPoolStatus() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

/**
 * Gracefully close all connections
 * @returns {Promise<void>}
 */
async function close() {
  await pool.end();
  console.log('Database: All connections closed');
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  testConnection,
  getPoolStatus,
  close
};
