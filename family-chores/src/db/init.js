/**
 * Database initialization
 * Runs schema and creates default data on first startup
 */

const fs = require('fs');
const path = require('path');
const { pool, query, testConnection } = require('./pool');

/**
 * Check if database tables exist
 * @returns {Promise<boolean>}
 */
async function tablesExist() {
  try {
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'households'
      )
    `);
    return result.rows[0].exists;
  } catch (err) {
    console.error('Database: Error checking tables', err.message);
    return false;
  }
}

/**
 * Run schema SQL file
 * @returns {Promise<void>}
 */
async function runSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await query(schema);
    console.log('Database: Schema applied successfully');
  } catch (err) {
    console.error('Database: Error applying schema', err.message);
    throw err;
  }
}

/**
 * Create default household if none exists
 * @returns {Promise<Object|null>} The created household or null
 */
async function createDefaultHousehold() {
  try {
    const existing = await query('SELECT id FROM households LIMIT 1');

    if (existing.rows.length > 0) {
      console.log('Database: Household already exists');
      return null;
    }

    const result = await query(
      'INSERT INTO households (name) VALUES ($1) RETURNING *',
      ['My Household']
    );

    console.log('Database: Default household created');
    return result.rows[0];
  } catch (err) {
    console.error('Database: Error creating default household', err.message);
    throw err;
  }
}

/**
 * Initialize database
 * Tests connection, runs schema if needed, creates default data
 * @returns {Promise<boolean>} True if initialization successful
 */
async function initialize() {
  console.log('Database: Starting initialization...');

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('Database: Cannot connect to PostgreSQL');
    return false;
  }

  // Check if tables exist
  const exists = await tablesExist();

  if (!exists) {
    console.log('Database: Tables not found, running schema...');
    await runSchema();
    await createDefaultHousehold();
  } else {
    console.log('Database: Tables already exist');
  }

  console.log('Database: Initialization complete');
  return true;
}

module.exports = {
  initialize,
  tablesExist,
  runSchema,
  createDefaultHousehold
};
