-- ═══════════════════════════════════════════════════════════
--  Zpluse University — College Table v2 Migration
--  Run in: Supabase Dashboard → SQL Editor → New Query
--  Safe to run multiple times (uses IF NOT EXISTS / DO blocks)
-- ═══════════════════════════════════════════════════════════

-- ── Ranking & Accreditation ──────────────────────────────
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS nirf_rank        INT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS nirf_category    VARCHAR(50);      -- 'Engineering' | 'Management' | 'Overall'
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS naac_grade       VARCHAR(10);      -- 'A++' | 'A+' | 'A' | 'B++' | 'B+' ...
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS nba_accredited   BOOLEAN DEFAULT FALSE;

-- ── Student & Faculty Stats ──────────────────────────────
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS total_students   INT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS faculty_count    INT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS student_faculty_ratio VARCHAR(20); -- e.g. '15:1'

-- ── Placement Data ───────────────────────────────────────
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS placement_rate   DECIMAL(5,2);     -- e.g. 92.50
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS avg_package      VARCHAR(50);      -- e.g. '12 LPA'
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS highest_package  VARCHAR(50);      -- e.g. '45 LPA'
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS top_recruiters   JSONB DEFAULT '[]'; -- ["Google","Microsoft","Infosys"]

-- ── Programs / Courses (rich) ────────────────────────────
-- Each item: { name, degree, duration, fee_per_year, seats, eligibility, entrance_exams }
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS courses          JSONB DEFAULT '[]';
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS entrance_exams   JSONB DEFAULT '[]'; -- ["JEE Main","JEE Advanced"]

-- ── Fees & Scholarship ───────────────────────────────────
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS fee_structure    TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS scholarships     TEXT;

-- ── Accreditation / Affiliation ──────────────────────────
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS affiliation      TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS reviews_summary  TEXT;

-- ── Infrastructure ───────────────────────────────────────
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS facilities       JSONB DEFAULT '[]'; -- ["Hostel","Wi-Fi","Sports"]
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS gallery_images   JSONB DEFAULT '[]'; -- [url1, url2, ...]
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS campus_area_acres DECIMAL(8,2);

-- ── Contact & Social ─────────────────────────────────────
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS contact_email    VARCHAR(320);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS contact_phone    VARCHAR(30);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS social_links     JSONB DEFAULT '{}';
-- social_links shape: { instagram, twitter, linkedin, youtube, facebook }

-- ── Admission ────────────────────────────────────────────
-- Each step: { step, title, description }
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS admission_process JSONB DEFAULT '[]';
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS admission_open    BOOLEAN DEFAULT FALSE;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS application_deadline VARCHAR(50);  -- e.g. 'June 30, 2025'

-- ── SEO / Meta ───────────────────────────────────────────
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS tagline          VARCHAR(300);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS highlights       JSONB DEFAULT '[]'; -- ["Ranked #3 by NIRF 2024"]

-- New indexes
CREATE INDEX IF NOT EXISTS idx_colleges_nirf    ON colleges (nirf_rank ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_colleges_naac    ON colleges (naac_grade);
CREATE INDEX IF NOT EXISTS idx_colleges_place   ON colleges (placement_rate DESC NULLS LAST);

-- ═══════════════════════════════════════════════════════════
--  ✅ Migration complete! All new columns are nullable/default
--     so existing rows are unaffected.
-- ═══════════════════════════════════════════════════════════
