// ─────────────────────────────────────────────────────────
//  db.js — Supabase PostgreSQL Connection Pool
// ─────────────────────────────────────────────────────────
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,   // Required for Supabase pooler
  },
  max: 10,                       // Max connections in pool
  idleTimeoutMillis: 30000,      // Close idle clients after 30s
  connectionTimeoutMillis: 10000 // Fail if connect takes > 10s
});

// Log successful connection on first query
pool.on('connect', () => {
  console.log('✅ Database connected — Supabase PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err.message);
  process.exit(1);
});

/**
 * Execute a parameterised SQL query.
 * @param {string} text  — SQL string with $1, $2… placeholders
 * @param {Array}  params — values to bind
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
