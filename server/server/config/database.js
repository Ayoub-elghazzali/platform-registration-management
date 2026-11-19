'use strict';

function getMongoUri(env = process.env) {
  const uri = env.MONGODB_URI;
  if (typeof uri !== 'string' || uri.trim() === '') {
    throw new Error('Missing MONGODB_URI. Configure it in the server environment before startup.');
  }
  return uri.trim();
}

module.exports = { getMongoUri };
