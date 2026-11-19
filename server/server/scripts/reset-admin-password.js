'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const { getMongoUri } = require('../config/database');
const { hashPassword } = require('../security/passwords');
const { models } = require('../server');

async function main() {
  const username = process.env.RESET_ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.RESET_ADMIN_PASSWORD;
  if (!username || !password) throw new Error('Set RESET_ADMIN_USERNAME and RESET_ADMIN_PASSWORD in the process environment.');
  await mongoose.connect(getMongoUri());
  const passwordHash = await hashPassword(password);
  const result = await models.Admin.updateOne(
    { username },
    { $set: { passwordHash, passwordChangedAt: new Date() }, $unset: { password: '' } }
  );
  if (!result.matchedCount) throw new Error('Administrator not found.');
  const admin = await models.Admin.findOne({ username });
  await models.Session.deleteMany({ adminId: admin._id });
  console.log(`Password reset completed for administrator: ${username}. All sessions were revoked.`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
});
