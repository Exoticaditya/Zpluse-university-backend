// ─────────────────────────────────────────────────────────
//  routes/admin.routes.js — Admin specifics
// ─────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// ─── Admin automation routes ──────────────────────────────
router.post('/scrape-and-create', authenticate, authorize('admin'), controller.scrapeAndCreate);

module.exports = router;
