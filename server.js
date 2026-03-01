// ─────────────────────────────────────────────────────────
//  server.js — Zpluse University API Server
// ─────────────────────────────────────────────────────────
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

// ── Import route modules ──
const collegeRoutes = require('./routes/college.routes');
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const materialRoutes = require('./routes/material.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// ─── CORS ────────────────────────────────────────────────
const allowedOrigins = [
    process.env.FRONTEND_URL,                 // https://www.zpluseuniversity.com
    'https://www.zpluseuniversity.com',
    'https://zpluseuniversity.com',
    'http://localhost:3000',
    'http://localhost:5173'                    // Vite dev
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Middleware ──────────────────────────────────────────
app.use(express.json()); // For parsing application/json

// ─── Health check (Render heartbeat) ─────────────────────
app.get('/api/v1/health', async (req, res) => {
    try {
        const dbResult = await pool.query('SELECT NOW()');
        res.json({
            success: true,
            message: 'Zpluse University API is healthy',
            timestamp: dbResult.rows[0].now,
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (err) {
        res.status(503).json({
            success: false,
            message: 'API is running but database is unreachable',
            error: err.message
        });
    }
});

// ─── API Routes ──────────────────────────────────────────
app.use('/api/v1/colleges', collegeRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/materials', materialRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/admin', adminRoutes);

// ─── 404 handler ─────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// ─── Global error handler ────────────────────────────────
app.use((err, req, res, _next) => {
    console.error('🔥 Unhandled error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// ─── Start server ────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🚀 Zpluse University API`);
    console.log(`   Port:        ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health:      http://localhost:${PORT}/api/v1/health\n`);
});

module.exports = app;
