// ─────────────────────────────────────────────────────────
//  controllers/enrollment.controller.js — Enrollment & Progress
// ─────────────────────────────────────────────────────────
const { query } = require('../db');

// ─── POST /api/v1/enrollments ────────────────────────────
// Student: enroll in a course
exports.enroll = async (req, res, next) => {
    try {
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ success: false, message: 'course_id is required' });
        }

        // Verify course exists and is published
        const course = await query(
            'SELECT id, title, is_published FROM courses WHERE id = $1',
            [course_id]
        );

        if (course.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (!course.rows[0].is_published) {
            return res.status(400).json({ success: false, message: 'This course is not yet published' });
        }

        const result = await query(
            `INSERT INTO enrollments (student_id, course_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id, course_id) DO NOTHING
       RETURNING *`,
            [req.user.id, course_id]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({ success: false, message: 'Already enrolled in this course' });
        }

        res.status(201).json({
            success: true,
            message: `Successfully enrolled in "${course.rows[0].title}"`,
            data: result.rows[0]
        });
    } catch (err) {
        next(err);
    }
};

// ─── GET /api/v1/enrollments/my ──────────────────────────
// Student: list own enrollments with course details
exports.getMyEnrollments = async (req, res, next) => {
    try {
        const { status } = req.query;
        const conditions = ['e.student_id = $1'];
        const values = [req.user.id];
        let idx = 2;

        if (status) {
            conditions.push(`e.status = $${idx}::enrollment_status`);
            values.push(status); idx++;
        }

        const result = await query(
            `SELECT
         e.id, e.progress_percent, e.status, e.enrolled_at, e.completed_at,
         c.id            AS course_id,
         c.title         AS course_title,
         c.description   AS course_description,
         c.thumbnail_url AS course_thumbnail,
         c.level         AS course_level,
         c.duration_hours,
         c.is_live,
         col.name        AS college_name,
         u.full_name     AS teacher_name
       FROM enrollments e
       JOIN courses  c   ON c.id   = e.course_id
       LEFT JOIN colleges col ON col.id = c.college_id
       LEFT JOIN users u      ON u.id   = c.teacher_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.enrolled_at DESC`,
            values
        );

        res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (err) {
        next(err);
    }
};

// ─── PATCH /api/v1/enrollments/:id/progress ──────────────
// Student: update progress percentage for a course
exports.updateProgress = async (req, res, next) => {
    try {
        const { progress_percent } = req.body;

        if (progress_percent === undefined || progress_percent < 0 || progress_percent > 100) {
            return res.status(400).json({
                success: false,
                message: 'progress_percent must be a number between 0 and 100'
            });
        }

        const autoComplete = parseFloat(progress_percent) >= 100;

        const result = await query(
            `UPDATE enrollments SET
         progress_percent = $1,
         status           = CASE WHEN $2 THEN 'completed'::enrollment_status ELSE status END,
         completed_at     = CASE WHEN $2 THEN NOW() ELSE completed_at END
       WHERE id = $3 AND student_id = $4
       RETURNING *`,
            [progress_percent, autoComplete, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Enrollment not found or access denied' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// ─── GET /api/v1/enrollments/course/:courseId ────────────
// Admin or Teacher: see who is enrolled in a course
exports.getCourseEnrollments = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Teachers can only see enrollments for their own courses
        if (req.user.role === 'teacher') {
            const own = await query('SELECT teacher_id FROM courses WHERE id = $1', [courseId]);
            if (!own.rows.length || own.rows[0].teacher_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }

        const countResult = await query(
            'SELECT COUNT(*) FROM enrollments WHERE course_id = $1', [courseId]
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const result = await query(
            `SELECT
         e.id, e.progress_percent, e.status, e.enrolled_at, e.completed_at,
         u.id        AS student_id,
         u.full_name AS student_name,
         u.email     AS student_email,
         u.avatar_url AS student_avatar
       FROM enrollments e
       JOIN users u ON u.id = e.student_id
       WHERE e.course_id = $1
       ORDER BY e.enrolled_at DESC
       LIMIT $2 OFFSET $3`,
            [courseId, parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        next(err);
    }
};

// ─── DELETE /api/v1/enrollments/:id ──────────────────────
// Student: drop/unenroll from a course
exports.unenroll = async (req, res, next) => {
    try {
        const result = await query(
            `DELETE FROM enrollments
       WHERE id = $1 AND student_id = $2
       RETURNING id`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Enrollment not found or access denied' });
        }

        res.json({ success: true, message: 'Successfully unenrolled from course' });
    } catch (err) {
        next(err);
    }
};
