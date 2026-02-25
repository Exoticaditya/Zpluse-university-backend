// ─────────────────────────────────────────────────────────
//  controllers/auth.controller.js — Auth (Supabase-backed)
// ─────────────────────────────────────────────────────────
//  Authentication is handled by Supabase Auth on the client.
//  These endpoints handle:
//    • Syncing a Supabase user into our `users` table on
//      first login (upsert profile).
//    • Reading & updating the extended user profile stored
//      in our DB (avatar, bio, phone, etc.).
//
//  Flow: Client logs in via Supabase → gets JWT → sends it
//        in Authorization header → our middleware validates
//        it → controller syncs / reads from `users` table.
// ─────────────────────────────────────────────────────────
const { query } = require('../db');

// ─── POST /api/v1/auth/sync ──────────────────────────────
// Called after Supabase login. Upserts user into our users
// table so extended profile data (role, avatar, bio) exists.
exports.syncProfile = async (req, res, next) => {
    try {
        const { id, email } = req.user; // from JWT middleware
        const { full_name, avatar_url, phone } = req.body;

        const result = await query(
            `INSERT INTO users (id, email, full_name, avatar_url, phone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         email      = EXCLUDED.email,
         full_name  = COALESCE(EXCLUDED.full_name, users.full_name),
         avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
         phone      = COALESCE(EXCLUDED.phone, users.phone),
         updated_at = NOW()
       RETURNING id, email, full_name, role, avatar_url, phone, bio, created_at`,
            [id, email, full_name || 'New User', avatar_url || null, phone || null]
        );

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// ─── GET /api/v1/auth/profile ────────────────────────────
// Returns the current user's extended profile from our DB.
exports.getProfile = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT id, email, full_name, role, avatar_url, phone, bio, created_at
       FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found — please sync first via POST /auth/sync'
            });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// ─── PATCH /api/v1/auth/profile ──────────────────────────
// Update editable profile fields.
exports.updateProfile = async (req, res, next) => {
    try {
        const { full_name, avatar_url, phone, bio } = req.body;

        const result = await query(
            `UPDATE users SET
         full_name  = COALESCE($1, full_name),
         avatar_url = COALESCE($2, avatar_url),
         phone      = COALESCE($3, phone),
         bio        = COALESCE($4, bio),
         updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, full_name, role, avatar_url, phone, bio, updated_at`,
            [full_name, avatar_url, phone, bio, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// ─── GET /api/v1/auth/users (Admin) ──────────────────────
// List all platform users — Admin panel.
exports.listUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, role = '' } = req.query;
        const offset = (page - 1) * limit;
        const conditions = [], values = [];
        let idx = 1;

        if (role) {
            conditions.push(`role = $${idx}::user_role`);
            values.push(role);
            idx++;
        }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        const countResult = await query(`SELECT COUNT(*) FROM users ${where}`, values);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataResult = await query(
            `SELECT id, email, full_name, role, avatar_url, phone, created_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
            [...values, parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            data: dataResult.rows,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        next(err);
    }
};

// ─── PATCH /api/v1/auth/users/:id/role (Admin) ───────────
// Promote / demote a user's role.
exports.updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['admin', 'teacher', 'student'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
            });
        }

        const result = await query(
            `UPDATE users SET role = $1::user_role, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, full_name, role`,
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};
