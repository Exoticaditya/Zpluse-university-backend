// ─────────────────────────────────────────────────────────
//  routes/course.routes.js
// ─────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const controller = require('../controllers/course.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// ─── Public routes ───────────────────────────────────────
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// ─── Admin or Teacher ────────────────────────────────────
router.post('/', authenticate, authorize('admin', 'teacher'), controller.create);
router.put('/:id', authenticate, authorize('admin', 'teacher'), controller.update);

// ─── Admin only ──────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;
