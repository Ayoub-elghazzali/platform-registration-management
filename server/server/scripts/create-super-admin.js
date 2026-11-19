'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const { getMongoUri } = require('../config/database');
const { hashPassword } = require('../security/passwords');
const { models } = require('../server');

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD in the process environment.');
  await mongoose.connect(getMongoUri());
  const existing = await models.Admin.findOne({ role: { $in: ['SUPER_ADMIN', 'admin_general'] }, isActive: true });
  if (existing) throw new Error('An active super administrator already exists. Use the controlled reset procedure instead.');
  const passwordHash = await hashPassword(password);
  const admin = await models.Admin.create({ username, passwordHash, role: 'SUPER_ADMIN', isActive: true });
  console.log(`Created initial super administrator: ${admin.username}`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
});
