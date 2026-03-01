// ─────────────────────────────────────────────────────────
//  middleware/auth.js — Supabase JWT Verification
// ─────────────────────────────────────────────────────────
//  Supabase Auth is the primary identity provider.
//  This middleware validates the Supabase-issued JWT on
//  every protected request so our Express API never trusts
//  unauthenticated calls.
// ─────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

/**
 * Middleware: verifies the Bearer token issued by Supabase Auth.
 *
 * On success it attaches to `req.user`:
 *   { id, email, role }
 *
 * The `role` is read from the JWT's `app_metadata.role` claim,
 * which you set when creating users in Supabase (default: 'student').
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied — no token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!SUPABASE_JWT_SECRET) {
            console.error('❌ SUPABASE_JWT_SECRET is not set');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);

        // Supabase stores custom sign-up data under `user_metadata`.
        // `app_metadata` can be used for admin-set roles (service role key).
        // We check user_metadata first (set at signup), then app_metadata as fallback.
        req.user = {
            id: decoded.sub,                                     // Supabase user id (UUID)
            email: decoded.email,
            role: decoded.user_metadata?.role || decoded.app_metadata?.role || 'student'
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired — please log in again'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

module.exports = authenticate;
