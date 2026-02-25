// ─────────────────────────────────────────────────────────
//  middleware/upload.js — Multer + Cloudinary Upload
// ─────────────────────────────────────────────────────────
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// ── Multer: in-memory storage (buffer → Cloudinary stream) ──
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf',
        'video/mp4', 'video/webm',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }   // 50 MB max
});

// ── Cloudinary stream upload helper ──

/**
 * Upload a Multer buffer to Cloudinary.
 *
 * @param {Buffer} buffer — file buffer from multer
 * @param {Object} options
 * @param {string} options.folder — Cloudinary folder, e.g. 'zplus/materials'
 * @param {string} options.resource_type — 'image' | 'video' | 'raw' (for PDFs)
 * @returns {Promise<{ url: string, public_id: string, bytes: number }>}
 */
const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder || 'zplus/uploads',
                resource_type: options.resource_type || 'auto',
                ...options
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    url: result.secure_url,
                    public_id: result.public_id,
                    bytes: result.bytes
                });
            }
        );

        // Pipe the buffer into the upload stream
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
};

/**
 * Delete a Cloudinary asset by public_id.
 *
 * @param {string} publicId
 * @param {string} resourceType — 'image' | 'video' | 'raw'
 */
const deleteFromCloudinary = (publicId, resourceType = 'image') => {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
    upload,               // Multer instance (use .single('file'), .array('files', 5), etc.)
    uploadToCloudinary,
    deleteFromCloudinary
};
