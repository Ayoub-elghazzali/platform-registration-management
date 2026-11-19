'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, models } = require('../server');
const { hashPassword } = require('../security/passwords');

let mongo;
test.before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'prm_auth_test' });
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

async function createAdmin(username, role = 'SUPER_ADMIN', extra = {}) {
  return models.Admin.create({
    username,
    passwordHash: await hashPassword('Correct-Horse-2026!'),
    role,
    isActive: true,
    ...extra
  });
}

async function signIn(username = 'root-admin') {
  const agent = request.agent(app);
  const response = await agent.post('/auth/login').send({ username, password: 'Correct-Horse-2026!' });
  return { agent, response, csrfToken: response.body.csrfToken };
}

test('login succeeds and establishes an HttpOnly cookie session', async () => {
  await createAdmin('root-admin');
  const { response } = await signIn();
  assert.equal(response.status, 200);
  assert.equal(response.body.user.role, 'SUPER_ADMIN');
  const cookie = response.headers['set-cookie']?.find(value => value.startsWith('prm_session='));
  assert.ok(cookie);
  assert.match(cookie, /HttpOnly/i);
});

test('wrong password and unknown account return the same 401 response', async () => {
  const wrong = await request(app).post('/auth/login').send({ username: 'root-admin', password: 'incorrect' });
  const missing = await request(app).post('/auth/login').send({ username: 'missing-account', password: 'incorrect' });
  assert.equal(wrong.status, 401);
  assert.equal(missing.status, 401);
  assert.equal(wrong.body.error, missing.body.error);
});

test('disabled account cannot authenticate', async () => {
  await createAdmin('disabled-admin', 'ADMIN', { isActive: false });
  const response = await request(app).post('/auth/login').send({ username: 'disabled-admin', password: 'Correct-Horse-2026!' });
  assert.equal(response.status, 401);
});

test('private routes reject requests without a session', async () => {
  const response = await request(app).get('/admins');
  assert.equal(response.status, 401);
});

test('authenticated user without admin permission receives 403', async () => {
  await createAdmin('ordinary-user', 'USER');
  const { agent } = await signIn('ordinary-user');
  const response = await agent.get('/admins');
  assert.equal(response.status, 403);
});

test('provincial administrator cannot read another province', async () => {
  await createAdmin('marrakech-admin', 'PROVINCIAL_ADMIN', { province: 'Marrakech' });
  await models.User.create([
    { nom: 'Demo', prenom: 'Marrakech', province: 'Marrakech', region: 'Marrakech-Safi' },
    { nom: 'Demo', prenom: 'Safi', province: 'Safi', region: 'Marrakech-Safi' }
  ]);
  const { agent } = await signIn('marrakech-admin');
  const forbidden = await agent.get('/users/Safi');
  assert.equal(forbidden.status, 403);
  const allowed = await agent.get('/users');
  assert.equal(allowed.status, 200);
  assert.ok(allowed.body.every(user => user.province === 'Marrakech'));
});

test('expired session is rejected', async () => {
  await createAdmin('expired-admin');
  const admin = await models.Admin.findOne({ username: 'expired-admin' });
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await models.Session.create({
    tokenHash, adminId: admin._id, csrfToken: 'expired-csrf-token',
    expiresAt: new Date(Date.now() - 60_000)
  });
  const response = await request(app).get('/auth/me').set('Cookie', `prm_session=${rawToken}`);
  assert.equal(response.status, 401);
});

test('logout revokes the current session', async () => {
  await createAdmin('logout-admin');
  const { agent, response, csrfToken } = await signIn('logout-admin');
  assert.equal(response.status, 200);
  const logout = await agent.post('/auth/logout').set('X-CSRF-Token', csrfToken);
  assert.equal(logout.status, 204);
  const me = await agent.get('/auth/me');
  assert.equal(me.status, 401);
});

test('verified legacy plaintext password is upgraded and removed', async () => {
  await models.Admin.create({
    username: 'legacy-admin', password: 'Legacy-Password-2026', role: 'ADMIN', isActive: true
  });
  const response = await request(app).post('/auth/login').send({
    username: 'legacy-admin', password: 'Legacy-Password-2026'
  });
  assert.equal(response.status, 200);
  const migrated = await models.Admin.findOne({ username: 'legacy-admin' }).select('+password +passwordHash');
  assert.equal(migrated.password, undefined);
  assert.ok(migrated.passwordHash);
});

test('legacy password is not migrated when the supplied value is incorrect', async () => {
  await models.Admin.create({
    username: 'legacy-wrong', password: 'Legacy-Password-2026', role: 'ADMIN', isActive: true
  });
  const response = await request(app).post('/auth/login').send({
    username: 'legacy-wrong', password: 'not-the-original-password'
  });
  assert.equal(response.status, 401);
  const unchanged = await models.Admin.findOne({ username: 'legacy-wrong' }).select('+password +passwordHash');
  assert.equal(unchanged.password, 'Legacy-Password-2026');
  assert.equal(unchanged.passwordHash, undefined);
});


test('authenticated writes require a CSRF token', async () => {
  await createAdmin('csrf-admin');
  const { agent } = await signIn('csrf-admin');
  const response = await agent.post('/addField').send({ type: 'province', name: 'Test Province' });
  assert.equal(response.status, 403);
});

test('session renewal rotates the session and CSRF token', async () => {
  await createAdmin('renew-admin');
  const { agent, csrfToken } = await signIn('renew-admin');
  const renewed = await agent.post('/auth/refresh').set('X-CSRF-Token', csrfToken);
  assert.equal(renewed.status, 200);
  assert.ok(renewed.body.csrfToken);
  assert.notEqual(renewed.body.csrfToken, csrfToken);
  const me = await agent.get('/auth/me');
  assert.equal(me.status, 200);
});

test('regional administrator cannot read records from another region', async () => {
  await createAdmin('regional-admin', 'REGIONAL_ADMIN', { region: 'Marrakech-Safi' });
  await models.User.create([
    { nom: 'Demo', prenom: 'Marrakech', province: 'Marrakech', region: 'Marrakech-Safi' },
    { nom: 'Demo', prenom: 'Agadir', province: 'Agadir', region: 'Souss-Massa' }
  ]);
  const { agent } = await signIn('regional-admin');
  const response = await agent.get('/users?region=Souss-Massa');
  assert.equal(response.status, 403);
  const allowed = await agent.get('/users');
  assert.equal(allowed.status, 200);
  assert.ok(allowed.body.every(user => user.region === 'Marrakech-Safi'));
});

test('password change requires current password and revokes existing session', async () => {
  await createAdmin('change-password-admin');
  const { agent, csrfToken } = await signIn('change-password-admin');
  const changed = await agent.post('/auth/change-password')
    .set('X-CSRF-Token', csrfToken)
    .send({ currentPassword: 'Correct-Horse-2026!', newPassword: 'A-new-strong-password-2026!' });
  assert.equal(changed.status, 200);
  const me = await agent.get('/auth/me');
  assert.equal(me.status, 401);
  const relogin = await request(app).post('/auth/login').send({
    username: 'change-password-admin', password: 'A-new-strong-password-2026!'
  });
  assert.equal(relogin.status, 200);
});


test('disabling an administrator revokes all of that account sessions', async () => {
  await createAdmin('session-target', 'PROVINCIAL_ADMIN', { province: 'Marrakech' });
  const target = await signIn('session-target');
  assert.equal(target.response.status, 200);
  const supervisor = await signIn('root-admin');
  const csrf = supervisor.csrfToken;
  const disabled = await supervisor.agent.delete('/deleteAdmin/session-target').set('X-CSRF-Token', csrf);
  assert.equal(disabled.status, 200);
  const targetMe = await target.agent.get('/auth/me');
  assert.equal(targetMe.status, 401);
});

test('administrative route families reject unauthenticated requests', async () => {
  const checks = [
    request(app).get('/users'),
    request(app).get('/admins'),
    request(app).get('/acceptedUsers'),
    request(app).get('/finalAccepted'),
    request(app).get('/stats/provinces'),
    request(app).get('/security/audit'),
    request(app).post('/addAdmin').send({}),
    request(app).post('/addField').send({}),
    request(app).post('/validateDecision/507f1f77bcf86cd799439011').send({}),
    request(app).delete('/deleteAdmin/some-admin')
  ];
  const responses = await Promise.all(checks);
  assert.ok(responses.every(response => response.status === 401));
});


test('authentication audit events contain no usernames or credential material', async () => {
  await createAdmin('audit-admin');
  const { response } = await signIn('audit-admin');
  assert.equal(response.status, 200);
  const event = await models.AuditEvent.findOne({ event: 'auth.login.succeeded' }).sort({ createdAt: -1 });
  assert.ok(event);
  assert.equal(event.actorId.toString().length, 24);
  const serialized = JSON.stringify(event);
  assert.equal(serialized.includes('audit-admin'), false);
  assert.equal(serialized.includes('Correct-Horse-2026!'), false);
});

test('security audit endpoint requires the settings permission', async () => {
  await createAdmin('audit-reader', 'USER');
  const { agent } = await signIn('audit-reader');
  const response = await agent.get('/security/audit');
  assert.equal(response.status, 403);
});


test('super administrator can inspect audit events without receiving IP hashes', async () => {
  const { agent } = await signIn('root-admin');
  const response = await agent.get('/security/audit');
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.data));
  if (response.body.data[0]) {
    assert.equal(Object.hasOwn(response.body.data[0], 'ipHash'), false);
  }
});

test('administrator listings never expose password fields', async () => {
  const { agent } = await signIn('root-admin');
  const response = await agent.get('/admins');
  assert.equal(response.status, 200);
  assert.ok(response.body.every(admin => !Object.hasOwn(admin, 'password') && !Object.hasOwn(admin, 'passwordHash')));
});

test('repeated login attempts are rate limited', async () => {
  await createAdmin('rate-limited-admin');
  for (let i = 0; i < 8; i += 1) {
    const response = await request(app).post('/auth/login').send({ username: 'rate-limited-admin', password: 'wrong-password' });
    assert.equal(response.status, 401);
  }
  const blocked = await request(app).post('/auth/login').send({ username: 'rate-limited-admin', password: 'wrong-password' });
  assert.equal(blocked.status, 429);
});

test('public registration accepts only whitelisted profile fields', async () => {
  const response = await request(app).post('/createUser').send({
    nom: 'Demo', prenom: 'User', province: 'Marrakech', role: 'SUPER_ADMIN', isAdmin: true
  });
  assert.equal(response.status, 201);
  const created = await models.User.findById(response.body.id);
  assert.equal(created.role, undefined);
  assert.equal(created.isAdmin, undefined);
});
