'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const { getMongoUri } = require('../config/database');
const { models } = require('../server');

async function main() {
  const username = process.env.SCOPE_ADMIN_USERNAME?.trim().toLowerCase();
  const region = process.env.SCOPE_ADMIN_REGION?.trim();
  const province = process.env.SCOPE_ADMIN_PROVINCE?.trim();
  if (!username || (!region && !province)) {
    throw new Error('Set SCOPE_ADMIN_USERNAME and at least one of SCOPE_ADMIN_REGION or SCOPE_ADMIN_PROVINCE.');
  }
  await mongoose.connect(getMongoUri());
  const admin = await models.Admin.findOne({ username });
  if (!admin) throw new Error('Administrator not found.');
  if (region) admin.region = region;
  if (province) admin.province = province;
  await admin.save();
  console.log(`Geographic scope updated for administrator: ${admin.username}`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
});
