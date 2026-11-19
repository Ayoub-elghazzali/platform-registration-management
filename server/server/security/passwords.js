'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);
if (!Number.isInteger(BCRYPT_ROUNDS) || BCRYPT_ROUNDS < 10 || BCRYPT_ROUNDS > 15) {
  throw new Error('BCRYPT_ROUNDS must be an integer between 10 and 15.');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left), 'utf8');
  const b = Buffer.from(String(right), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Password must contain at least 12 characters and at most 72 UTF-8 bytes.');
  }
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, admin) {
  if (!admin || typeof password !== 'string') return { valid: false, needsMigration: false };
  if (admin.passwordHash) {
    return { valid: await bcrypt.compare(password, admin.passwordHash), needsMigration: false };
  }
  if (typeof admin.password === 'string' && admin.password.length > 0) {
    return { valid: safeEqual(password, admin.password), needsMigration: true };
  }
  return { valid: false, needsMigration: false };
}

module.exports = { hashPassword, verifyPassword, BCRYPT_ROUNDS };
