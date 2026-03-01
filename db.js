// ─────────────────────────────────────────────────────────
//  db.js — Supabase PostgreSQL Connection Pool
// ─────────────────────────────────────────────────────────
//
//  ⚠️  CONNECTION STRING GUIDE — READ BEFORE DEPLOYING
//
//  On Render (and other hosted platforms) the DIRECT Supabase
//  connection URL uses an IPv6 address on port 5432, which
//  Render's free-tier networking cannot reach. Use the
//  TRANSACTION POOLER URL instead:
//
//    Supabase Dashboard → Project Settings → Database
//    → Connection string → Transaction Pooler
//
//  The pooler URL looks like:
//    postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
//
//  Set this as DATABASE_URL in your Render environment.
//  IMPORTANT: append ?pgbouncer=true to the URL if using
//  prepared statements (e.g., Prisma).
// ─────────────────────────────────────────────────────────
const { Pool } = require('pg');

// TRANSACTION_POOLER_URL is preferred (IPv4, port 6543).
// Fall back to DATABASE_URL so local dev still works.
const connectionString =
  process.env.TRANSACTION_POOLER_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌  No database URL found. Set TRANSACTION_POOLER_URL (preferred) or DATABASE_URL.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,   // Required for Supabase
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
