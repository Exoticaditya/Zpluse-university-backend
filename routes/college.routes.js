// ─────────────────────────────────────────────────────────
//  routes/college.routes.js — College Discovery API
// ─────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const controller = require('../controllers/college.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// ─── Public routes ───────────────────────────────────────
router.get('/', controller.getAll);      // List + search + paginate
router.get('/:id', controller.getById);     // Single college detail

// ─── Admin-only routes ──────────────────────────────────
router.post('/', authenticate, authorize('admin'), controller.create);
router.put('/:id', authenticate, authorize('admin'), controller.update);
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;
