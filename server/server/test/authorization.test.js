'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeRole, hasPermission, geographicFilter } = require('../security/authorization');

test('legacy administrator roles map to canonical roles', () => {
  assert.equal(normalizeRole('admin_general'), 'SUPER_ADMIN');
  assert.equal(normalizeRole('Director_Regional'), 'REGIONAL_ADMIN');
  assert.equal(normalizeRole('director_provincial'), 'PROVINCIAL_ADMIN');
});

test('permissions are evaluated server-side by role', () => {
  assert.equal(hasPermission('admin_general', 'settings:manage'), true);
  assert.equal(hasPermission('director_provincial', 'settings:manage'), false);
  assert.equal(hasPermission('USER', 'registrations:create'), true);
  assert.equal(hasPermission('unknown', 'users:read'), false);
});

test('provincial administrator is restricted to assigned province', () => {
  const actor = { role: 'PROVINCIAL_ADMIN', province: 'Marrakech' };
  assert.deepEqual(geographicFilter(actor), { province: 'Marrakech' });
  assert.equal(geographicFilter(actor, { province: 'Safi' }), null);
  assert.deepEqual(geographicFilter(actor, { status: 'accepté' }), { status: 'accepté', province: 'Marrakech' });
});

test('regional administrator is restricted to assigned region', () => {
  const actor = { role: 'REGIONAL_ADMIN', region: 'Marrakech-Safi' };
  assert.deepEqual(geographicFilter(actor), { region: 'Marrakech-Safi' });
  assert.equal(geographicFilter(actor, { region: 'Souss-Massa' }), null);
});

test('unscoped lower-privilege accounts cannot query administrative geography', () => {
  assert.equal(geographicFilter({ role: 'USER' }), null);
  assert.equal(geographicFilter({ role: 'PROVINCIAL_ADMIN' }), null);
});
