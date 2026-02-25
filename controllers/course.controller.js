// ─────────────────────────────────────────────────────────
//  controllers/course.controller.js — Course CRUD + Filters
// ─────────────────────────────────────────────────────────
const { query } = require('../db');

// ─── GET /api/v1/courses ─────────────────────────────────
// Public — list courses with filtering by college, category, level, teacher
exports.getAll = async (req, res, next) => {
    try {
        const {
            page = 1, limit = 12,
            college_id = '', teacher_id = '',
            category = '', level = '',
            is_live = '', search = ''
        } = req.query;

        const offset = (page - 1) * limit;
        const conditions = ['c.is_published = true'];
        const values = [];
        let idx = 1;

        if (college_id) {
            conditions.push(`c.college_id = $${idx}`);
            values.push(college_id); idx++;
        }
        if (teacher_id) {
            conditions.push(`c.teacher_id = $${idx}`);
            values.push(teacher_id); idx++;
        }
        if (category) {
            conditions.push(`c.category = $${idx}`);
            values.push(category); idx++;
        }
        if (level) {
            conditions.push(`c.level = $${idx}::course_level`);
            values.push(level); idx++;
        }
        if (is_live !== '') {
            conditions.push(`c.is_live = $${idx}`);
            values.push(is_live === 'true'); idx++;
        }
        if (search) {
            conditions.push(`(c.title ILIKE $${idx} OR c.description ILIKE $${idx})`);
            values.push(`%${search}%`); idx++;
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const countResult = await query(
            `SELECT COUNT(*) FROM courses c ${where}`, values
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const dataResult = await query(
            `SELECT
         c.*,
         col.name  AS college_name,
         col.city  AS college_city,
         u.full_name AS teacher_name,
         u.avatar_url AS teacher_avatar
       FROM courses c
       LEFT JOIN colleges col ON col.id = c.college_id
       LEFT JOIN users u      ON u.id   = c.teacher_id
       ${where}
       ORDER BY c.created_at DESC
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

// ─── GET /api/v1/courses/:id ─────────────────────────────
exports.getById = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT
         c.*,
         col.name     AS college_name,
         col.city     AS college_city,
         col.logo_url AS college_logo,
         u.full_name  AS teacher_name,
         u.avatar_url AS teacher_avatar,
         u.bio        AS teacher_bio
       FROM courses c
       LEFT JOIN colleges col ON col.id = c.college_id
       LEFT JOIN users u      ON u.id   = c.teacher_id
       WHERE c.id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Fetch materials count
        const matCount = await query(
            'SELECT COUNT(*) FROM materials WHERE course_id = $1', [req.params.id]
        );

        const course = result.rows[0];
        course.materials_count = parseInt(matCount.rows[0].count, 10);

        res.json({ success: true, data: course });
    } catch (err) {
        next(err);
    }
};

// ─── POST /api/v1/courses ────────────────────────────────
// Admin or Teacher
exports.create = async (req, res, next) => {
    try {
        const {
            college_id, title, description, category,
            level, duration_hours, price, thumbnail_url, is_live, is_published
        } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: 'Course title is required' });
        }

        const result = await query(
            `INSERT INTO courses
         (college_id, teacher_id, title, description, category,
          level, duration_hours, price, thumbnail_url, is_live, is_published)
       VALUES ($1,$2,$3,$4,$5,$6::course_level,$7,$8,$9,$10,$11)
       RETURNING *`,
            [
                college_id || null,
                req.user.id,                           // teacher = logged-in user
                title, description || null, category || null,
                level || 'Beginner', duration_hours || 0, price || 0,
                thumbnail_url || null, is_live || false, is_published || false
            ]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// ─── PUT /api/v1/courses/:id ─────────────────────────────
// Admin or the course's own Teacher
exports.update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            college_id, title, description, category, level,
            duration_hours, price, thumbnail_url, is_live, is_published
        } = req.body;

        // Teachers can only edit their own courses
        if (req.user.role === 'teacher') {
            const own = await query('SELECT teacher_id FROM courses WHERE id = $1', [id]);
            if (!own.rows.length || own.rows[0].teacher_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'You can only edit your own courses' });
            }
        }

        const result = await query(
            `UPDATE courses SET
         college_id     = COALESCE($1, college_id),
         title          = COALESCE($2, title),
         description    = COALESCE($3, description),
         category       = COALESCE($4, category),
         level          = COALESCE($5::course_level, level),
         duration_hours = COALESCE($6, duration_hours),
         price          = COALESCE($7, price),
         thumbnail_url  = COALESCE($8, thumbnail_url),
         is_live        = COALESCE($9, is_live),
         is_published   = COALESCE($10, is_published),
         updated_at     = NOW()
       WHERE id = $11
       RETURNING *`,
            [college_id, title, description, category, level,
                duration_hours, price, thumbnail_url, is_live, is_published, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// ─── DELETE /api/v1/courses/:id ──────────────────────────
// Admin only
exports.remove = async (req, res, next) => {
    try {
        const result = await query(
            'DELETE FROM courses WHERE id = $1 RETURNING id, title', [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.json({ success: true, message: `Course "${result.rows[0].title}" deleted`, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};
