'use strict';

const ROLE_ALIASES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  admin_general: 'SUPER_ADMIN',
  admin: 'ADMIN',
  REGIONAL_ADMIN: 'REGIONAL_ADMIN',
  president_regional: 'REGIONAL_ADMIN',
  Director_Regional: 'REGIONAL_ADMIN',
  director_regional: 'REGIONAL_ADMIN',
  direction_regional: 'REGIONAL_ADMIN',
  PROVINCIAL_ADMIN: 'PROVINCIAL_ADMIN',
  president_provincial: 'PROVINCIAL_ADMIN',
  director_provincial: 'PROVINCIAL_ADMIN',
  direction_provincial: 'PROVINCIAL_ADMIN',
  USER: 'USER',
  user: 'USER'
});

const ROLE_PERMISSIONS = Object.freeze({
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'users:read', 'users:create', 'users:update', 'users:disable',
    'registrations:read', 'registrations:validate',
    'regions:manage', 'provinces:manage', 'statistics:read', 'settings:manage',
    'admins:read', 'admins:create', 'admins:update', 'admins:disable'
  ],
  REGIONAL_ADMIN: [
    'users:read', 'users:update', 'registrations:read', 'registrations:validate',
    'provinces:read', 'statistics:read'
  ],
  PROVINCIAL_ADMIN: [
    'users:read', 'users:update', 'registrations:read', 'registrations:validate',
    'statistics:read'
  ],
  USER: ['registrations:create', 'profile:read', 'profile:update']
});

function normalizeRole(role) {
  return ROLE_ALIASES[role] || null;
}

function hasPermission(role, permission) {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  const permissions = ROLE_PERMISSIONS[normalized] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

function geographicFilter(actor, requested = {}) {
  const role = normalizeRole(actor && actor.role);
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return { ...requested };
  if (role === 'REGIONAL_ADMIN') {
    if (!actor.region) return null;
    if (requested.region && requested.region !== actor.region) return null;
    return { ...requested, region: actor.region };
  }
  if (role === 'PROVINCIAL_ADMIN') {
    if (!actor.province) return null;
    if (requested.province && requested.province !== actor.province) return null;
    return { ...requested, province: actor.province };
  }
  return null;
}

module.exports = { ROLE_PERMISSIONS, normalizeRole, hasPermission, geographicFilter };
