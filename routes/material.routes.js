// ─────────────────────────────────────────────────────────
//  routes/material.routes.js
// ─────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const controller = require('../controllers/material.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { upload } = require('../middleware/upload');

// ─── Any authenticated user can READ ─────────────────────
router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);

// ─── Admin or Teacher — with Cloudinary file upload ──────
router.post(
    '/',
    authenticate,
    authorize('admin', 'teacher'),
    upload.single('file'),           // multipart field name = 'file'
    controller.create
);

router.put('/:id', authenticate, authorize('admin', 'teacher'), controller.update);
router.delete('/:id', authenticate, authorize('admin', 'teacher'), controller.remove);

module.exports = router;
