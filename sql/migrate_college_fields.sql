-- ═══════════════════════════════════════════════════════════
--  Migration: Add missing college fields used by the UI
--  Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- Add fee_structure column (shown in College Detail page StatCard)
ALTER TABLE colleges
  ADD COLUMN IF NOT EXISTS fee_structure VARCHAR(200);

-- Add affiliation / accreditation (shown in College Detail page StatCard)
ALTER TABLE colleges
  ADD COLUMN IF NOT EXISTS affiliation VARCHAR(300);

-- Add courses array (Programs Offered section in College Detail page)
ALTER TABLE colleges
  ADD COLUMN IF NOT EXISTS courses TEXT[];

-- Add NIRF rank for sorting/display
ALTER TABLE colleges
  ADD COLUMN IF NOT EXISTS nirf_rank INT;

-- Add unique constraint on name for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS idx_colleges_name_unique ON colleges (name);

-- ═══════════════════════════════════════════════════════════
-- ✅ Run this BEFORE running seed_colleges.py
-- ═══════════════════════════════════════════════════════════
