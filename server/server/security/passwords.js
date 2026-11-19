'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

function safeEqual(left, right) {
  const a = Buffer.from(String(left), 'utf8');
  const b = Buffer.from(String(right), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    throw new Error('Password must contain between 12 and 128 characters.');
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
