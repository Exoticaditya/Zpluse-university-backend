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

// Priority: DATABASE_URL (standard) then TRANSACTION_POOLER_URL (legacy/alt)
const connectionString =
  process.env.DATABASE_URL ||
  process.env.TRANSACTION_POOLER_URL;

if (!connectionString) {
  console.error('❌ No database URL found. Please set DATABASE_URL (preferred) or TRANSACTION_POOLER_URL in your environment.');
  process.exit(1);
}

// Mask the password for logs to help debug without leaking creds
const maskedUrl = connectionString.replace(/:([^@]+)@/, ':****@');
const hostInfo = connectionString.split('@')[1] || 'unknown host';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Log connection attempt details
console.log(`📡 Database: Attempting connection via ${process.env.DATABASE_URL ? 'DATABASE_URL' : 'TRANSACTION_POOLER_URL'}`);
console.log(`🔗 Target: ${hostInfo}`);

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
