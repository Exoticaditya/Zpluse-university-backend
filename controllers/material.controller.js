// ─────────────────────────────────────────────────────────
//  controllers/material.controller.js — Study Materials
// ─────────────────────────────────────────────────────────
//  Files are streamed to Cloudinary via the upload middleware.
//  `file_url` and `cloudinary_public_id` are stored in DB.
// ─────────────────────────────────────────────────────────
const { query } = require('../db');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// ─── Cloudinary folder + resource_type by material type ──
const getCloudinaryOptions = (mimetype) => {
    if (mimetype.startsWith('video/')) return { folder: 'zplus/videos', resource_type: 'video' };
    if (mimetype === 'application/pdf') return { folder: 'zplus/pdfs', resource_type: 'raw' };
    if (mimetype.startsWith('image/')) return { folder: 'zplus/images', resource_type: 'image' };
    return { folder: 'zplus/documents', resource_type: 'raw' };
};

// ─── GET /api/v1/materials?course_id=<uuid> ──────────────
exports.getAll = async (req, res, next) => {
    try {
        const { course_id, type } = req.query;

        if (!course_id) {
            return res.status(400).json({ success: false, message: 'course_id query param is required' });
        }

        const conditions = ['m.course_id = $1'];
        const values = [course_id];
        let idx = 2;

        if (type) {
            conditions.push(`m.type = $${idx}::material_type`);
            values.push(type); idx++;
        }

        const result = await query(
            `SELECT m.*, u.full_name AS uploader_name
       FROM materials m
       LEFT JOIN users u ON u.id = m.uploaded_by
       WHERE ${conditions.join(' AND ')}
       ORDER BY m.sort_order ASC, m.created_at ASC`,
            values
        );

        res.json({ success: true, data: result.rows, total: result.rows.length });
    } catch (err) {
        next(err);
    }
};

// ─── GET /api/v1/materials/:id ───────────────────────────
exports.getById = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT m.*, u.full_name AS uploader_name
       FROM materials m
       LEFT JOIN users u ON u.id = m.uploaded_by
       WHERE m.id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// ─── POST /api/v1/materials ──────────────────────────────
// Admin or Teacher — requires multipart/form-data with field `file`
exports.create = async (req, res, next) => {
    try {
        const { course_id, title, description, sort_order } = req.body;

        if (!course_id || !title) {
            return res.status(400).json({ success: false, message: 'course_id and title are required' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded (field name: file)' });
        }

        // Upload to Cloudinary
        const options = getCloudinaryOptions(req.file.mimetype);
        const { url, public_id, bytes } = await uploadToCloudinary(req.file.buffer, options);

        // Derive material type from mimetype
        let materialType = 'document';
        if (req.file.mimetype.startsWith('video/')) materialType = 'video';
        if (req.file.mimetype === 'application/pdf') materialType = 'pdf';
        if (req.file.mimetype.startsWith('image/')) materialType = 'image';

        const result = await query(
            `INSERT INTO materials
         (course_id, uploaded_by, title, description, type,
          file_url, cloudinary_public_id, file_size_bytes, sort_order)
       VALUES ($1,$2,$3,$4,$5::material_type,$6,$7,$8,$9)
       RETURNING *`,
            [
                course_id, req.user.id, title, description || null, materialType,
                url, public_id, bytes, sort_order || 0
            ]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// ─── PUT /api/v1/materials/:id ───────────────────────────
// Update metadata only (no re-upload). For re-upload, delete + create.
exports.update = async (req, res, next) => {
    try {
        const { title, description, sort_order } = req.body;

        const result = await query(
            `UPDATE materials SET
         title       = COALESCE($1, title),
         description = COALESCE($2, description),
         sort_order  = COALESCE($3, sort_order)
       WHERE id = $4
       RETURNING *`,
            [title, description, sort_order, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// ─── DELETE /api/v1/materials/:id ────────────────────────
// Deletes from DB + removes asset from Cloudinary
exports.remove = async (req, res, next) => {
    try {
        // Fetch public_id and type before deleting
        const found = await query(
            'SELECT id, title, cloudinary_public_id, type FROM materials WHERE id = $1',
            [req.params.id]
        );

        if (found.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        const mat = found.rows[0];

        // Delete from Cloudinary
        if (mat.cloudinary_public_id) {
            const resourceType = mat.type === 'video' ? 'video' : mat.type === 'image' ? 'image' : 'raw';
            await deleteFromCloudinary(mat.cloudinary_public_id, resourceType);
        }

        // Delete from DB
        await query('DELETE FROM materials WHERE id = $1', [req.params.id]);

        res.json({ success: true, message: `Material "${mat.title}" deleted from DB and Cloudinary` });
    } catch (err) {
        next(err);
    }
};
