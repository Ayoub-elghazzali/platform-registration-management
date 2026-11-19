'use strict';

require('dotenv').config();

const crypto = require('node:crypto');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { getMongoUri } = require('./config/database');
const { hashPassword, verifyPassword } = require('./security/passwords');
const { normalizeRole, hasPermission, geographicFilter } = require('./security/authorization');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const SESSION_COOKIE = 'prm_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:3000')
  .split(',').map(value => value.trim()).filter(Boolean);

if (isProduction && !process.env.CLIENT_ORIGINS) {
  throw new Error('CLIENT_ORIGINS must be configured in production.');
}
if (isProduction && !process.env.COOKIE_SECURE) {
  // Secure cookies are mandatory in production; this guard prevents accidental HTTP deployment.
  process.env.COOKIE_SECURE = 'true';
}

app.disable('x-powered-by');
app.set('trust proxy', isProduction ? 1 : false);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token']
}));
app.use(express.json({ limit: '200kb', strict: true }));

mongoose.set('sanitizeFilter', true);

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, lowercase: true, maxlength: 80, index: true },
  passwordHash: { type: String, select: false },
  password: { type: String, select: false }, // Legacy plaintext field, removed after a verified successful login.
  role: { type: String, required: true, enum: ['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'PROVINCIAL_ADMIN', 'USER', 'admin', 'admin_general', 'president_regional', 'Director_Regional', 'director_regional', 'direction_regional', 'president_provincial', 'director_provincial', 'direction_provincial', 'user'] },
  region: { type: String, trim: true, default: null },
  province: { type: String, trim: true, default: null },
  isActive: { type: Boolean, default: true, index: true },
  passwordChangedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true, strict: true });
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

const userSchema = new mongoose.Schema({
  nom: { type: String, trim: true, maxlength: 100 },
  prenom: { type: String, trim: true, maxlength: 100 },
  age: { type: Number, min: 0, max: 120 },
  cin: { type: String, trim: true, maxlength: 40 },
  profession: { type: String, trim: true, maxlength: 120 },
  region: { type: String, trim: true, maxlength: 120 },
  province: { type: String, trim: true, maxlength: 120, index: true },
  commune: { type: String, trim: true, maxlength: 120 },
  adresse: { type: String, trim: true, maxlength: 300 },
  telephone: { type: String, trim: true, maxlength: 40 },
  email: { type: String, trim: true, lowercase: true, maxlength: 254 },
  status: { type: String, enum: ['en attente', 'accepté', 'refusé'], default: 'en attente', index: true },
  validatedByDirectorRegional: { type: Boolean, default: false }
}, { timestamps: true, strict: true });
userSchema.index({ region: 1, province: 1, status: 1 });
const User = mongoose.models.User || mongoose.model('User', userSchema);

const fieldSchema = new mongoose.Schema({
  type: { type: String, enum: ['province', 'commune'], required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 }
}, { timestamps: true });
fieldSchema.index({ type: 1, name: 1 });
const Field = mongoose.models.Field || mongoose.model('Field', fieldSchema);

const sessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
  csrfToken: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 }
}, { timestamps: true });
const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

const auditEventSchema = new mongoose.Schema({
  event: { type: String, required: true, index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null, index: true },
  targetId: { type: String, default: null },
  ipHash: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
}, { versionKey: false });
const AuditEvent = mongoose.models.AuditEvent || mongoose.model('AuditEvent', auditEventSchema);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
async function writeAudit(event, req, actorId = null, targetId = null) {
  try {
    await AuditEvent.create({
      event,
      actorId: actorId || null,
      targetId: targetId ? String(targetId) : null,
      ipHash: req.ip ? sha256(req.ip) : null
    });
  } catch (_) {
    // Audit persistence failures must not leak request data or break authentication flows.
  }
}
function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}
function cookieValue(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) {
      try { return decodeURIComponent(part.slice(index + 1).trim()); }
      catch (_) { return null; }
    }
  }
  return null;
}
function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction || process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS
  };
}
function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: isProduction || process.env.COOKIE_SECURE === 'true', sameSite: 'lax', path: '/' });
}
function publicAdmin(admin) {
  return {
    id: String(admin._id),
    username: admin.username,
    role: normalizeRole(admin.role),
    legacyRole: admin.role,
    region: admin.region || null,
    province: admin.province || null,
    isActive: admin.isActive !== false
  };
}
function validText(value, min = 1, max = 120) {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
}
function rejectMongoOperators(value, depth = 0) {
  if (depth > 12) return false;
  if (Array.isArray(value)) return value.every(item => rejectMongoOperators(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.entries(value).every(([key, child]) =>
      !key.startsWith('$') && !key.includes('.') && rejectMongoOperators(child, depth + 1)
    );
  }
  return true;
}

const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const LOGIN_IP_MAX_ATTEMPTS = 30;
function loginAttemptKeys(req) {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  return [sha256(`ip:${req.ip}`), sha256(`account:${username}`)];
}
function loginRateLimit(req, res, next) {
  const now = Date.now();
  const [ipKey, accountKey] = loginAttemptKeys(req);
  const ipEntry = loginAttempts.get(ipKey);
  const accountEntry = loginAttempts.get(accountKey);
  if ((ipEntry && ipEntry.resetAt > now && ipEntry.count >= LOGIN_IP_MAX_ATTEMPTS) ||
      (accountEntry && accountEntry.resetAt > now && accountEntry.count >= LOGIN_MAX_ATTEMPTS)) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
  }
  for (const key of [ipKey, accountKey]) {
    const entry = loginAttempts.get(key);
    const updated = !entry || entry.resetAt <= now
      ? { count: 1, resetAt: now + LOGIN_WINDOW_MS }
      : { count: entry.count + 1, resetAt: entry.resetAt };
    loginAttempts.delete(key);
    loginAttempts.set(key, updated);
  }
  if (loginAttempts.size > 5000) {
    let removeCount = loginAttempts.size - 4000;
    for (const key of loginAttempts.keys()) {
      loginAttempts.delete(key);
      removeCount -= 1;
      if (removeCount <= 0) break;
    }
  }
  return next();
}
function resetLoginAttempts(req) {
  for (const key of loginAttemptKeys(req)) loginAttempts.delete(key);
}

function requireSameOrigin(req, res, next) {
  const origin = req.get('origin');
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Origine non autorisée.' });
  }
  return next();
}

async function authenticate(req, res, next) {
  try {
    const rawToken = cookieValue(req, SESSION_COOKIE);
    if (!rawToken || rawToken.length > 200) return res.status(401).json({ error: 'Authentification requise.' });
    const session = await Session.findOne({ tokenHash: sha256(rawToken), expiresAt: mongoose.trusted({ $gt: new Date() }) });
    if (!session) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'Session expirée ou invalide.' });
    }
    const admin = await Admin.findById(session.adminId).select('_id username role region province isActive');
    if (!admin || !admin.isActive) {
      await Session.deleteOne({ _id: session._id });
      clearSessionCookie(res);
      return res.status(401).json({ error: 'Compte désactivé ou introuvable.' });
    }
    req.admin = publicAdmin(admin);
    req.sessionRecord = session;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.admin || !hasPermission(req.admin.role, permission)) {
      return res.status(403).json({ error: 'Permission insuffisante.' });
    }
    return next();
  };
}

function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const supplied = req.get('x-csrf-token');
  if (!supplied || !req.sessionRecord || supplied !== req.sessionRecord.csrfToken) {
    return res.status(403).json({ error: 'Jeton CSRF absent ou invalide.' });
  }
  return next();
}

function scopedQuery(req, requested = {}) {
  return geographicFilter(req.admin, requested);
}

async function createSession(admin, res) {
  const rawToken = randomToken();
  const csrfToken = randomToken(24);
  await Session.create({
    tokenHash: sha256(rawToken),
    adminId: admin._id,
    csrfToken,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS)
  });
  res.cookie(SESSION_COOKIE, rawToken, cookieOptions());
  return csrfToken;
}

app.get('/', (req, res) => res.json({ status: 'ok', service: 'Platform Registration Management API' }));

async function loginHandler(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (!validText(username, 2, 80) || typeof password !== 'string' || password.length < 1 || password.length > 128) {
      return res.status(400).json({ error: 'Identifiants invalides.' });
    }
    const admin = await Admin.findOne({ username: username.trim().toLowerCase() }).select('+password +passwordHash');
    if (!admin || !admin.isActive) {
      await writeAudit('auth.login.failed', req);
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }
    const verification = await verifyPassword(password, admin);
    if (!verification.valid) {
      await writeAudit('auth.login.failed', req, admin._id);
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    if (verification.needsMigration) {
      try {
        const passwordHash = await hashPassword(password);
        const migration = await Admin.updateOne(
          { _id: admin._id, password },
          { $set: { passwordHash, passwordChangedAt: new Date() }, $unset: { password: '' } }
        );
        if (!migration.matchedCount) {
          await writeAudit('auth.password.migration_conflict', req, admin._id);
          return res.status(401).json({ error: 'Identifiants incorrects.' });
        }
        await writeAudit('auth.password.legacy_migrated', req, admin._id);
      } catch (migrationError) {
        // A verified legacy password shorter than current policy is not upgraded automatically.
        await writeAudit('auth.password.reset_required', req, admin._id);
        return res.status(403).json({ error: 'PASSWORD_RESET_REQUIRED', message: 'Votre ancien mot de passe ne respecte plus la politique de sécurité. Contactez un administrateur pour réinitialiser votre accès.' });
      }
    }

    await Session.deleteMany({ adminId: admin._id });
    const csrfToken = await createSession(admin, res);
    resetLoginAttempts(req);
    await writeAudit('auth.login.succeeded', req, admin._id);
    return res.json({ success: true, user: publicAdmin(admin), csrfToken });
  } catch (error) {
    return next(error);
  }
}
app.post('/auth/login', requireSameOrigin, loginRateLimit, loginHandler);
app.post('/loginAdmin', requireSameOrigin, loginRateLimit, loginHandler);

app.use('/auth', authenticate);
app.get('/auth/me', (req, res) => res.json({ user: req.admin }));
app.get('/auth/csrf', (req, res) => res.json({ csrfToken: req.sessionRecord.csrfToken }));
app.post('/auth/logout', requireSameOrigin, requireCsrf, async (req, res, next) => {
  try {
    await Session.deleteOne({ _id: req.sessionRecord._id });
    await writeAudit('auth.logout', req, req.admin.id);
    clearSessionCookie(res);
    return res.status(204).end();
  } catch (error) { return next(error); }
});
app.post('/auth/refresh', requireSameOrigin, requireCsrf, async (req, res, next) => {
  try {
    await Session.deleteOne({ _id: req.sessionRecord._id });
    const admin = { _id: req.admin.id };
    const csrfToken = await createSession(admin, res);
    return res.json({ success: true, csrfToken, expiresInSeconds: SESSION_TTL_MS / 1000 });
  } catch (error) { return next(error); }
});
app.post('/auth/change-password', requireSameOrigin, requireCsrf, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 12 || Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 12 caractères et au maximum 72 octets UTF-8.' });
    }
    const admin = await Admin.findById(req.admin.id).select('+password +passwordHash');
    const verification = await verifyPassword(currentPassword, admin);
    if (!verification.valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    const passwordHash = await hashPassword(newPassword);
    await Admin.updateOne({ _id: admin._id }, { $set: { passwordHash, passwordChangedAt: new Date() }, $unset: { password: '' } });
    await Session.deleteMany({ adminId: admin._id });
    await writeAudit('auth.password.changed', req, admin._id);
    clearSessionCookie(res);
    return res.json({ success: true, message: 'Mot de passe modifié. Veuillez vous reconnecter.' });
  } catch (error) { return next(error); }
});
app.use('/auth', (req, res) => res.status(404).json({ error: 'Route d’authentification introuvable.' }));

// All administrative and private API routes below require an authenticated session and CSRF validation for writes.
app.post('/createUser', requireSameOrigin, async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!rejectMongoOperators(body)) return res.status(400).json({ error: 'Données invalides.' });
    const allowed = ['nom', 'prenom', 'age', 'cin', 'profession', 'region', 'province', 'commune', 'adresse', 'telephone', 'email'];
    const input = Object.fromEntries(allowed.filter(key => body[key] !== undefined).map(key => [key, body[key]]));
    if (!validText(input.nom, 1, 100) || !validText(input.prenom, 1, 100)) {
      return res.status(400).json({ error: 'Nom et prénom obligatoires.' });
    }
    if (input.email && (typeof input.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))) {
      return res.status(400).json({ error: 'Adresse e-mail invalide.' });
    }
    const user = await User.create(input);
    return res.status(201).json({ success: true, id: user._id, message: 'Inscription enregistrée.' });
  } catch (error) { return next(error); }
});

app.use(authenticate);
app.use(requireCsrf);

app.get('/users', requirePermission('users:read'), async (req, res, next) => {
  try {
    const requested = {};
    if (req.query.status && !['en attente', 'accepté', 'refusé'].includes(String(req.query.status))) return res.status(400).json({ error: 'Filtre de statut invalide.' });
    if (req.query.region && !validText(req.query.region, 1, 120)) return res.status(400).json({ error: 'Filtre de région invalide.' });
    if (req.query.province && !validText(req.query.province, 1, 120)) return res.status(400).json({ error: 'Filtre de province invalide.' });
    if (req.query.status) requested.status = String(req.query.status);
    if (req.query.region) requested.region = String(req.query.region);
    if (req.query.province) requested.province = String(req.query.province);
    const scope = scopedQuery(req, requested);
    if (!scope) return res.status(403).json({ error: 'Périmètre géographique interdit.' });
    const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit, 10) || 50));
    const [users, total] = await Promise.all([
      User.find(scope).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(scope)
    ]);
    res.set('X-Total-Count', String(total));
    res.set('X-Page', String(page));
    res.set('X-Limit', String(limit));
    return res.json(users);
  } catch (error) { return next(error); }
});

app.get('/users/:id/status', requirePermission('users:read'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Identifiant invalide.' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    const scope = scopedQuery(req, { region: user.region, province: user.province });
    if (!scope) return res.status(403).json({ error: 'Périmètre géographique interdit.' });
    return res.json({ status: user.status, validatedByDirectorRegional: user.validatedByDirectorRegional });
  } catch (error) { return next(error); }
});

app.post('/users/:id/status', requirePermission('registrations:validate'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Identifiant invalide.' });
    const status = req.body?.status;
    if (!['en attente', 'accepté', 'refusé'].includes(status)) return res.status(400).json({ error: 'Statut invalide.' });
    const existing = await User.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    const scope = scopedQuery(req, { region: existing.region, province: existing.province });
    if (!scope) return res.status(403).json({ error: 'Périmètre géographique interdit.' });
    const user = await User.findOneAndUpdate({ _id: existing._id, ...scope }, { $set: { status } }, { new: true, runValidators: true });
    if (!user) return res.status(403).json({ error: 'Périmètre géographique interdit.' });
    return res.json({ success: true, user });
  } catch (error) { return next(error); }
});

app.post('/addAdmin', requirePermission('admins:create'), async (req, res, next) => {
  try {
    const { username, password, role, province, region } = req.body || {};
    const normalizedRole = normalizeRole(role);
    if (!validText(username, 3, 80) || typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72 ||
        !normalizedRole || !['ADMIN', 'REGIONAL_ADMIN', 'PROVINCIAL_ADMIN'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'Données administrateur invalides.' });
    }
    if (req.admin.role !== 'SUPER_ADMIN' && normalizedRole === 'ADMIN') return res.status(403).json({ error: 'Création de ce rôle interdite.' });
    if (normalizedRole === 'PROVINCIAL_ADMIN' && !validText(province, 1, 120)) return res.status(400).json({ error: 'Province obligatoire.' });
    if (normalizedRole === 'REGIONAL_ADMIN' && !validText(region, 1, 120)) return res.status(400).json({ error: 'Région obligatoire.' });
    const existingAdmin = await Admin.findOne({ username: username.trim().toLowerCase() });
    if (existingAdmin) return res.status(409).json({ error: 'Ce nom d’utilisateur existe déjà.' });
    const passwordHash = await hashPassword(password);
    const admin = await Admin.create({
      username: username.trim().toLowerCase(), passwordHash, role: normalizedRole,
      province: normalizedRole === 'PROVINCIAL_ADMIN' ? province.trim() : null,
      region: normalizedRole === 'REGIONAL_ADMIN' ? region.trim() : null,
      isActive: true
    });
    await writeAudit('admin.created', req, req.admin.id, admin._id);
    return res.status(201).json({ success: true, admin: publicAdmin(admin) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Ce nom d’utilisateur existe déjà.' });
    return next(error);
  }
});

app.get('/admins', requirePermission('admins:read'), async (req, res, next) => {
  try {
    const admins = await Admin.find().select('_id username role region province isActive createdAt').sort({ createdAt: -1 });
    return res.json(admins.map(publicAdmin));
  } catch (error) { return next(error); }
});

app.delete('/deleteAdmin/:username', requirePermission('admins:disable'), async (req, res, next) => {
  try {
    const target = await Admin.findOne({ username: req.params.username.toLowerCase() });
    if (!target) return res.status(404).json({ error: 'Administrateur introuvable.' });
    if (String(target._id) === req.admin.id) return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' });
    if (['SUPER_ADMIN', 'ADMIN'].includes(normalizeRole(target.role)) && req.admin.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Seul le super administrateur peut désactiver un compte administrateur global.' });
    target.isActive = false;
    await target.save();
    await Session.deleteMany({ adminId: target._id });
    await writeAudit('admin.disabled', req, req.admin.id, target._id);
    return res.json({ success: true, message: 'Administrateur désactivé.' });
  } catch (error) { return next(error); }
});

app.get('/users/:province', requirePermission('users:read'), async (req, res, next) => {
  try {
    const province = req.params.province.trim();
    if (!validText(province, 1, 120)) return res.status(400).json({ error: 'Province invalide.' });
    const scope = scopedQuery(req, { province });
    if (!scope) return res.status(403).json({ error: 'Périmètre géographique interdit.' });
    const users = await User.find(scope).sort({ createdAt: -1 }).limit(100);
    return res.json(users);
  } catch (error) { return next(error); }
});

app.post('/addField', requirePermission('provinces:manage'), async (req, res, next) => {
  try {
    const { type, name } = req.body || {};
    if (!['province', 'commune'].includes(type) || !validText(name, 1, 120)) return res.status(400).json({ error: 'Champ invalide.' });
    const existingField = await Field.findOne({ type, name: name.trim() });
    if (existingField) return res.status(409).json({ error: 'Ce champ existe déjà.' });
    const field = await Field.create({ type, name: name.trim() });
    return res.status(201).json({ success: true, field });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Ce champ existe déjà.' });
    return next(error);
  }
});

app.post('/validateDecision/:userId', requirePermission('registrations:validate'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: 'Identifiant invalide.' });
    const existing = await User.findById(userId);
    if (!existing) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    const scope = scopedQuery(req, { region: existing.region, province: existing.province });
    if (!scope) return res.status(403).json({ error: 'Périmètre géographique interdit.' });
    const user = await User.findOneAndUpdate({ _id: userId, ...scope }, { $set: { validatedByDirectorRegional: true } }, { new: true });
    if (!user) return res.status(403).json({ error: 'Périmètre géographique interdit.' });
    return res.json({ success: true, user });
  } catch (error) { return next(error); }
});

app.get('/acceptedUsers', requirePermission('registrations:read'), async (req, res, next) => {
  try {
    const scope = scopedQuery(req, { status: 'accepté' });
    if (!scope) return res.status(403).json({ error: 'Périmètre géographique interdit.' });
    return res.json(await User.find(scope).sort({ createdAt: -1 }).limit(500));
  } catch (error) { return next(error); }
});

app.get('/finalAccepted', requirePermission('registrations:read'), async (req, res, next) => {
  try {
    const scope = scopedQuery(req, { validatedByDirectorRegional: true });
    if (!scope) return res.status(403).json({ error: 'Périmètre géographique interdit.' });
    return res.json(await User.find(scope).sort({ createdAt: -1 }).limit(500));
  } catch (error) { return next(error); }
});

app.get('/security/audit', requirePermission('settings:manage'), async (req, res, next) => {
  try {
    const page = Math.max(1, Math.min(1000, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit, 10) || 50));
    const [events, total] = await Promise.all([
      AuditEvent.find().select('event actorId targetId createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      AuditEvent.countDocuments()
    ]);
    return res.json({ data: events, pagination: { page, limit, total } });
  } catch (error) { return next(error); }
});

app.get('/stats/provinces', requirePermission('statistics:read'), async (req, res, next) => {
  try {
    const scope = scopedQuery(req, {});
    if (!scope) return res.status(403).json({ error: 'Périmètre géographique interdit.' });
    const rows = await User.aggregate([
      { $match: scope },
      { $group: {
        _id: { $ifNull: ['$province', 'Inconnue'] },
        total: { $sum: 1 },
        accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepté'] }, 1, 0] } },
        refused: { $sum: { $cond: [{ $eq: ['$status', 'refusé'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'en attente'] }, 1, 0] } }
      }},
      { $sort: { _id: 1 } }
    ]);
    const stats = Object.fromEntries(rows.map(row => [row._id, {
      total: row.total, accepted: row.accepted, refused: row.refused, pending: row.pending
    }]));
    return res.json(stats);
  } catch (error) { return next(error); }
});

app.use((req, res) => res.status(404).json({ error: 'Route introuvable.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error && error.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalide.' });
  if (error && error.name === 'ValidationError') return res.status(400).json({ error: 'Données invalides.' });
  if (error && error.code === 11000) return res.status(409).json({ error: 'Ressource déjà existante.' });
  // Never serialize request bodies, credentials, cookies, or raw database errors to clients.
  return res.status(500).json({ error: 'Erreur interne du serveur.' });
});

async function connectToDatabase() {
  await mongoose.connect(getMongoUri(), { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB.');
}
async function startServer() {
  await connectToDatabase();
  app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
}
if (require.main === module) {
  startServer().catch(() => {
    console.error('Server startup failed. Check database configuration.');
    process.exit(1);
  });
}

module.exports = { app, startServer, models: { Admin, User, Field, Session, AuditEvent } };
