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
            name, description, tagline, city, state, country,
            logo_url, cover_image_url, website, type,
            established_year, rating, is_featured,
            nirf_rank, nirf_category, naac_grade, nba_accredited,
            total_students, faculty_count, student_faculty_ratio,
            placement_rate, avg_package, highest_package, top_recruiters,
            courses, entrance_exams, fee_structure, scholarships,
            affiliation, reviews_summary, facilities, gallery_images,
            campus_area_acres, contact_email, contact_phone, social_links,
            admission_process, admission_open, application_deadline, highlights
        } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'College name is required' });
        }

        const result = await query(
            `INSERT INTO colleges
             (name, description, tagline, city, state, country,
              logo_url, cover_image_url, website, type,
              established_year, rating, is_featured,
              nirf_rank, nirf_category, naac_grade, nba_accredited,
              total_students, faculty_count, student_faculty_ratio,
              placement_rate, avg_package, highest_package, top_recruiters,
              courses, entrance_exams, fee_structure, scholarships,
              affiliation, reviews_summary, facilities, gallery_images,
              campus_area_acres, contact_email, contact_phone, social_links,
              admission_process, admission_open, application_deadline, highlights)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
                     $18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,
                     $33,$34,$35,$36,$37,$38,$39,$40)
             RETURNING *`,
            [
                name, description||null, tagline||null, city||null, state||null, country||'India',
                logo_url||null, cover_image_url||null, website||null, type||'Private',
                established_year||null, rating||0, is_featured||false,
                nirf_rank||null, nirf_category||null, naac_grade||null, nba_accredited||false,
                total_students||null, faculty_count||null, student_faculty_ratio||null,
                placement_rate||null, avg_package||null, highest_package||null,
                top_recruiters ? JSON.stringify(top_recruiters) : '[]',
                courses ? JSON.stringify(courses) : '[]',
                entrance_exams ? JSON.stringify(entrance_exams) : '[]',
                fee_structure||null, scholarships||null,
                affiliation||null, reviews_summary||null,
                facilities ? JSON.stringify(facilities) : '[]',
                gallery_images ? JSON.stringify(gallery_images) : '[]',
                campus_area_acres||null, contact_email||null, contact_phone||null,
                social_links ? JSON.stringify(social_links) : '{}',
                admission_process ? JSON.stringify(admission_process) : '[]',
                admission_open||false, application_deadline||null,
                highlights ? JSON.stringify(highlights) : '[]'
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
            name, description, tagline, city, state, country,
            logo_url, cover_image_url, website, type,
            established_year, rating, is_featured,
            nirf_rank, nirf_category, naac_grade, nba_accredited,
            total_students, faculty_count, student_faculty_ratio,
            placement_rate, avg_package, highest_package, top_recruiters,
            courses, entrance_exams, fee_structure, scholarships,
            affiliation, reviews_summary, facilities, gallery_images,
            campus_area_acres, contact_email, contact_phone, social_links,
            admission_process, admission_open, application_deadline, highlights
        } = req.body;

        const result = await query(
            `UPDATE colleges SET
             name               = COALESCE($1,  name),
             description        = COALESCE($2,  description),
             tagline            = COALESCE($3,  tagline),
             city               = COALESCE($4,  city),
             state              = COALESCE($5,  state),
             country            = COALESCE($6,  country),
             logo_url           = COALESCE($7,  logo_url),
             cover_image_url    = COALESCE($8,  cover_image_url),
             website            = COALESCE($9,  website),
             type               = COALESCE($10, type),
             established_year   = COALESCE($11, established_year),
             rating             = COALESCE($12, rating),
             is_featured        = COALESCE($13, is_featured),
             nirf_rank          = COALESCE($14, nirf_rank),
             nirf_category      = COALESCE($15, nirf_category),
             naac_grade         = COALESCE($16, naac_grade),
             nba_accredited     = COALESCE($17, nba_accredited),
             total_students     = COALESCE($18, total_students),
             faculty_count      = COALESCE($19, faculty_count),
             student_faculty_ratio = COALESCE($20, student_faculty_ratio),
             placement_rate     = COALESCE($21, placement_rate),
             avg_package        = COALESCE($22, avg_package),
             highest_package    = COALESCE($23, highest_package),
             top_recruiters     = COALESCE($24::jsonb, top_recruiters),
             courses            = COALESCE($25::jsonb, courses),
             entrance_exams     = COALESCE($26::jsonb, entrance_exams),
             fee_structure      = COALESCE($27, fee_structure),
             scholarships       = COALESCE($28, scholarships),
             affiliation        = COALESCE($29, affiliation),
             reviews_summary    = COALESCE($30, reviews_summary),
             facilities         = COALESCE($31::jsonb, facilities),
             gallery_images     = COALESCE($32::jsonb, gallery_images),
             campus_area_acres  = COALESCE($33, campus_area_acres),
             contact_email      = COALESCE($34, contact_email),
             contact_phone      = COALESCE($35, contact_phone),
             social_links       = COALESCE($36::jsonb, social_links),
             admission_process  = COALESCE($37::jsonb, admission_process),
             admission_open     = COALESCE($38, admission_open),
             application_deadline = COALESCE($39, application_deadline),
             highlights         = COALESCE($40::jsonb, highlights),
             updated_at         = NOW()
           WHERE id = $41
           RETURNING *`,
            [
                name, description, tagline, city, state, country,
                logo_url, cover_image_url, website, type,
                established_year, rating, is_featured,
                nirf_rank, nirf_category, naac_grade, nba_accredited,
                total_students, faculty_count, student_faculty_ratio,
                placement_rate, avg_package, highest_package,
                top_recruiters ? JSON.stringify(top_recruiters) : null,
                courses ? JSON.stringify(courses) : null,
                entrance_exams ? JSON.stringify(entrance_exams) : null,
                fee_structure, scholarships, affiliation, reviews_summary,
                facilities ? JSON.stringify(facilities) : null,
                gallery_images ? JSON.stringify(gallery_images) : null,
                campus_area_acres, contact_email, contact_phone,
                social_links ? JSON.stringify(social_links) : null,
                admission_process ? JSON.stringify(admission_process) : null,
                admission_open, application_deadline,
                highlights ? JSON.stringify(highlights) : null,
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


// ─── GET /api/v1/colleges/stats ──────────────────────────
// Public — Global stats for homepage metrics
exports.getStats = async (req, res, next) => {
    try {
        // 1. Total Colleges
        const resColleges = await query('SELECT COUNT(*) FROM colleges');
        const totalColleges = parseInt(resColleges.rows[0].count, 10);

        // 2. Total Students
        const resStudents = await query("SELECT COUNT(*) FROM users WHERE role = 'student'");
        const totalStudents = parseInt(resStudents.rows[0].count, 10);

        // 3. (Mock) Placement & Support — these could be expanded later
        res.json({
            success: true,
            data: {
                colleges: totalColleges,
                students: totalStudents,
                placementRate: '98%',
                support: '24/7'
            }
        });
    } catch (err) {
        next(err);
    }
};
