/**
 * PIN hashing utilities using bcrypt
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

/**
 * Hash a PIN using bcrypt
 * @param {string} pin - The PIN to hash
 * @returns {Promise<string>} The hashed PIN
 */
async function hashPin(pin) {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Verify a PIN against a hash
 * @param {string} pin - The PIN to verify
 * @param {string} hash - The hash to verify against
 * @returns {Promise<boolean>} True if PIN matches
 */
async function verifyPin(pin, hash) {
  return bcrypt.compare(pin, hash);
}

module.exports = {
  hashPin,
  verifyPin
};
