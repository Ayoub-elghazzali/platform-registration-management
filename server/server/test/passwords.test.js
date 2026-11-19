'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { hashPassword, verifyPassword } = require('../security/passwords');

test('new passwords are bcrypt-hashed and verifiable', async () => {
  const hash = await hashPassword('A-strong-password-2026!');
  assert.notEqual(hash, 'A-strong-password-2026!');
  assert.equal(await bcrypt.compare('A-strong-password-2026!', hash), true);
});

test('legacy plaintext is accepted only when the exact original value matches', async () => {
  const legacy = { password: 'Legacy-Password-2026' };
  assert.deepEqual(await verifyPassword('Legacy-Password-2026', legacy), { valid: true, needsMigration: true });
  assert.deepEqual(await verifyPassword('different-password', legacy), { valid: false, needsMigration: false });
});

test('hashing enforces the current password policy', async () => {
  await assert.rejects(() => hashPassword('short'), /12 and 128/);
});

test('bcrypt verification rejects inputs beyond its 72-byte boundary', async () => {
  const hash = await hashPassword('A-strong-password-2026!');
  const result = await verifyPassword('A-strong-password-2026!'.padEnd(80, 'x'), { passwordHash: hash });
  assert.deepEqual(result, { valid: false, needsMigration: false });
});

test('long legacy plaintext is verified exactly but cannot be migrated automatically', async () => {
  const legacyPassword = 'Legacy-password-value-that-exceeds-the-bcrypt-input-limit-1234567890';
  const result = await verifyPassword(legacyPassword, { password: legacyPassword });
  assert.deepEqual(result, { valid: true, needsMigration: true });
});
