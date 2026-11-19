'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getMongoUri } = require('../config/database');

test('getMongoUri returns the configured URI without changing it', () => {
  const uri = 'mongodb://127.0.0.1:27017/platform_registration_management';
  assert.equal(getMongoUri({ MONGODB_URI: uri }), uri);
});

test('getMongoUri trims surrounding whitespace', () => {
  assert.equal(getMongoUri({ MONGODB_URI: '  mongodb://localhost/test  ' }), 'mongodb://localhost/test');
});

test('getMongoUri rejects missing configuration', () => {
  assert.throws(() => getMongoUri({}), /Missing MONGODB_URI/);
});

test('getMongoUri rejects an empty configuration', () => {
  assert.throws(() => getMongoUri({ MONGODB_URI: '   ' }), /Missing MONGODB_URI/);
});
