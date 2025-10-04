const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_change_this_secret';

// Password hashing helpers
function hashPassword(password, salt = null) {
  const _salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, _salt, 100000, 64, 'sha512').toString('hex');
  return { salt: _salt, hash };
}

async function loadUsers() {
  try {
    if (!(await fs.pathExists(USERS_FILE))) {
      return null;
    }
    const users = await fs.readJson(USERS_FILE);
    return users;
  } catch (e) {
    console.error('Error loading users.json:', e);
    return null;
  }
}

async function saveUsers(users) {
  await fs.writeJson(USERS_FILE, users, { spaces: 2 });
}

// Ensure users.json exists with at least admin and hbertini accounts
async function ensureDefaultUsers() {
  const existing = await loadUsers();
  if (existing && Array.isArray(existing) && existing.length > 0) return existing;

  // Default passwords can be overridden via env variables
  const adminPw = process.env.ADMIN_PW || 'adminpass';
  const hbPw = process.env.HBERTINI_PW || 'hbertinipass';

  const adminCred = hashPassword(adminPw);
  const hbCred = hashPassword(hbPw);

  const users = [
    { username: 'admin', role: 'admin', salt: adminCred.salt, hash: adminCred.hash },
    { username: 'hbertini', role: 'admin', salt: hbCred.salt, hash: hbCred.hash }
  ];

  try {
    await saveUsers(users);
    console.log('Created default users (admin, hbertini). Change passwords via environment variables or edit users.json.');
  } catch (e) {
    console.error('Failed to create users.json:', e);
  }
  return users;
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

// Express Router for login
const router = express.Router();

router.post('/login', express.json(), async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const users = await loadUsers() || await ensureDefaultUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  try {
    const ok = verifyPassword(password, user.salt, user.hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, user: { username: user.username, role: user.role } });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'login failed' });
  }
});

// Middleware
function verifyToken(req, res, next) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'missing user' });
    if (req.user.role !== role) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}

module.exports = { router, ensureDefaultUsers, verifyToken, requireRole };

// --- Admin user management routes (mounted on /auth) ---
// Note: these use the same router object so they appear under /auth/*
router.get('/users', verifyToken, requireRole('admin'), async (req, res) => {
  const users = await loadUsers() || [];
  // Don't return hashes/salts
  const publicUsers = users.map(u => ({ username: u.username, role: u.role }));
  res.json(publicUsers);
});

router.post('/users', verifyToken, requireRole('admin'), express.json(), async (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password || !role) return res.status(400).json({ error: 'username,password,role required' });
  const users = await loadUsers() || [];
  if (users.find(u => u.username === username)) return res.status(409).json({ error: 'user exists' });
  const cred = hashPassword(password);
  users.push({ username, role, salt: cred.salt, hash: cred.hash });
  await saveUsers(users);
  res.status(201).json({ username, role });
});

router.put('/users/:username', verifyToken, express.json(), async (req, res) => {
  const username = req.params.username;
  const { password, role } = req.body || {};
  const users = await loadUsers() || [];
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ error: 'not found' });

  // Allow admins to change role/password. Allow a user to change their own password only.
  const isAdmin = req.user && req.user.role === 'admin';
  const isSelf = req.user && req.user.username === username;

  if (!isAdmin && !isSelf) return res.status(403).json({ error: 'forbidden' });

  // Non-admins may only update their own password. Ignore role changes for non-admins.
  if (!isAdmin && role) {
    return res.status(403).json({ error: 'cannot change role' });
  }

  if (role && isAdmin) user.role = role;
  if (password) {
    // If the requester is the user themself (not admin), require currentPassword and verify it
    if (!isAdmin && isSelf) {
      const currentPassword = req.body.currentPassword;
      if (!currentPassword) return res.status(400).json({ error: 'currentPassword required' });
      const ok = verifyPassword(currentPassword, user.salt, user.hash);
      if (!ok) return res.status(401).json({ error: 'invalid current password' });
    }
    const cred = hashPassword(password);
    user.salt = cred.salt;
    user.hash = cred.hash;
  }

  await saveUsers(users);
  res.json({ username: user.username, role: user.role });
});

router.delete('/users/:username', verifyToken, requireRole('admin'), async (req, res) => {
  const username = req.params.username;
  let users = await loadUsers() || [];
  if (!users.find(u => u.username === username)) return res.status(404).json({ error: 'not found' });
  users = users.filter(u => u.username !== username);
  await saveUsers(users);
  res.json({ success: true });
});
