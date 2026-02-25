// ─────────────────────────────────────────────────────────
//  controllers/college.controller.js — College CRUD
// ─────────────────────────────────────────────────────────
const { query } = require('../db');

// ─── GET /api/v1/colleges ────────────────────────────────
// Public — list all colleges with search, filter & pagination
exports.getAll = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 12,
            search = '',
            state = '',
            city = '',
            type = '',
            featured = ''
        } = req.query;

        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let idx = 1;

        if (search) {
            conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx} OR city ILIKE $${idx})`);
            values.push(`%${search}%`);
            idx++;
        }
        if (state) {
            conditions.push(`state = $${idx}`);
            values.push(state);
            idx++;
        }
        if (city) {
            conditions.push(`city = $${idx}`);
            values.push(city);
            idx++;
        }
        if (type) {
            conditions.push(`type = $${idx}`);
            values.push(type);
            idx++;
        }
        if (featured === 'true') {
            conditions.push(`is_featured = true`);
        }

        const where = conditions.length
            ? 'WHERE ' + conditions.join(' AND ')
            : '';

        // Count total
        const countResult = await query(
            `SELECT COUNT(*) FROM colleges ${where}`,
            values
        );
        const total = parseInt(countResult.rows[0].count, 10);

        // Fetch page
        const dataResult = await query(
            `SELECT * FROM colleges ${where}
       ORDER BY is_featured DESC, rating DESC, created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
            [...values, parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            data: dataResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        next(err);
    }
};

// ─── GET /api/v1/colleges/:id ────────────────────────────
// Public — single college detail
exports.getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM colleges WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// ─── POST /api/v1/colleges ───────────────────────────────
// Admin only — create a new college
exports.create = async (req, res, next) => {
    try {
        const {
            name, description, city, state, country,
            logo_url, cover_image_url, website,
            type, established_year, rating, is_featured
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'College name is required'
            });
        }

        const result = await query(
            `INSERT INTO colleges
         (name, description, city, state, country,
          logo_url, cover_image_url, website,
          type, established_year, rating, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
            [
                name, description || null, city || null, state || null, country || 'India',
                logo_url || null, cover_image_url || null, website || null,
                type || 'Private', established_year || null, rating || 0, is_featured || false
            ]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// ─── PUT /api/v1/colleges/:id ────────────────────────────
// Admin only — update college
exports.update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            name, description, city, state, country,
            logo_url, cover_image_url, website,
            type, established_year, rating, is_featured
        } = req.body;

        const result = await query(
            `UPDATE colleges SET
         name             = COALESCE($1, name),
         description      = COALESCE($2, description),
         city             = COALESCE($3, city),
         state            = COALESCE($4, state),
         country          = COALESCE($5, country),
         logo_url         = COALESCE($6, logo_url),
         cover_image_url  = COALESCE($7, cover_image_url),
         website          = COALESCE($8, website),
         type             = COALESCE($9, type),
         established_year = COALESCE($10, established_year),
         rating           = COALESCE($11, rating),
         is_featured      = COALESCE($12, is_featured),
         updated_at       = NOW()
       WHERE id = $13
       RETURNING *`,
            [
                name, description, city, state, country,
                logo_url, cover_image_url, website,
                type, established_year, rating, is_featured,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// ─── DELETE /api/v1/colleges/:id ─────────────────────────
// Admin only — delete college
exports.remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await query(
            'DELETE FROM colleges WHERE id = $1 RETURNING id, name',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }

        res.json({
            success: true,
            message: `College "${result.rows[0].name}" deleted`,
            data: result.rows[0]
        });
    } catch (err) {
        next(err);
    }
};

