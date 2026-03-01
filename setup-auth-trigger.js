// ─────────────────────────────────────────────────────────────────────────────
//  setup-auth-trigger.js
//  Run ONCE to create a Postgres trigger that auto-syncs Supabase Auth users
//  into the public.users table whenever someone signs up.
//
//  HOW TO RUN (two options):
//
//  Option A — Supabase SQL Editor (recommended, no connection issues):
//    Copy the SQL below and paste it into:
//    Supabase Dashboard → SQL Editor → New Query → Run
//
//  Option B — Node.js (requires DB to be reachable):
//    1. Set TRANSACTION_POOLER_URL in your .env
//    2. Run: node setup-auth-trigger.js
// ─────────────────────────────────────────────────────────────────────────────
require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.TRANSACTION_POOLER_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌  Set TRANSACTION_POOLER_URL (or DATABASE_URL) in your .env file first.');
    process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

const triggerSql = `
-- 1. Create a function that copies auth.users data to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create the trigger on the auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;

async function setupTrigger() {
    try {
        console.log('Connecting to Supabase Database...');
        await client.connect();

        console.log('Applying automated sync trigger from auth.users to public.users...');
        await client.query(triggerSql);

        console.log('Success! Supabase auth signups will now automatically appear in public.users.');
    } catch (err) {
        console.error('Error applying trigger:', err.message);
    } finally {
        await client.end();
    }
}

setupTrigger();
