// ─────────────────────────────────────────────────────────
//  middleware/rbac.js — Role-Based Access Control
// ─────────────────────────────────────────────────────────

/**
 * Higher-order middleware factory.
 * Returns a middleware that checks whether `req.user.role`
 * is included in the allowed roles list.
 *
 * @param  {...string} allowedRoles — e.g. 'admin', 'teacher'
 * @returns {Function} Express middleware
 *
 * @example
 *   router.post('/', authenticate, authorize('admin'), controller.create);
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden — requires one of: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

module.exports = authorize;
