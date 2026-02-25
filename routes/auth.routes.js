// ─────────────────────────────────────────────────────────
//  routes/auth.routes.js
// ─────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// ─── Profile (any authenticated user) ───────────────────
router.post('/sync', authenticate, controller.syncProfile);   // Called once after Supabase login
router.get('/profile', authenticate, controller.getProfile);
router.patch('/profile', authenticate, controller.updateProfile);

// ─── Admin user management ───────────────────────────────
router.get('/users', authenticate, authorize('admin'), controller.listUsers);
router.patch('/users/:id/role', authenticate, authorize('admin'), controller.updateUserRole);

module.exports = router;
