// ─────────────────────────────────────────────────────────
//  routes/enrollment.routes.js
// ─────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const controller = require('../controllers/enrollment.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// ─── Student ─────────────────────────────────────────────
router.post('/', authenticate, authorize('student'), controller.enroll);
router.get('/my', authenticate, authorize('student'), controller.getMyEnrollments);
router.patch('/:id/progress', authenticate, authorize('student'), controller.updateProgress);
router.delete('/:id', authenticate, authorize('student'), controller.unenroll);

// ─── Admin or Teacher ────────────────────────────────────
router.get('/course/:courseId', authenticate, authorize('admin', 'teacher'), controller.getCourseEnrollments);

module.exports = router;
