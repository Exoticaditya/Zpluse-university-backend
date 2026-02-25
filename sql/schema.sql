-- ═══════════════════════════════════════════════════════════
--  Zplus University — Complete PostgreSQL Schema
--  Target: Supabase SQL Editor (copy-paste & run)
-- ═══════════════════════════════════════════════════════════
--  Tables: users, colleges, courses, materials, enrollments
--  Includes: enums, FKs, indexes, triggers
-- ═══════════════════════════════════════════════════════════

-- ─── Enable UUID generation ──────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ═══════════════════════════════════════════════════════════
--  1. CUSTOM ENUM TYPES
-- ═══════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE course_level AS ENUM ('Beginner', 'Intermediate', 'Advanced');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE material_type AS ENUM ('pdf', 'video', 'image', 'document');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'dropped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════
--  2. USERS TABLE
-- ═══════════════════════════════════════════════════════════
--  Primary identity is managed by Supabase Auth.
--  This table stores extended profile data linked via `id`.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(320) NOT NULL UNIQUE,
  full_name       VARCHAR(200) NOT NULL,
  password_hash   VARCHAR(255),                -- NULL when using Supabase Auth only
  role            user_role NOT NULL DEFAULT 'student',
  avatar_url      TEXT,
  phone           VARCHAR(20),
  bio             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);


-- ═══════════════════════════════════════════════════════════
--  3. COLLEGES TABLE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS colleges (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(300) NOT NULL,
  description       TEXT,
  city              VARCHAR(100),
  state             VARCHAR(100),
  country           VARCHAR(100) DEFAULT 'India',
  logo_url          TEXT,
  cover_image_url   TEXT,
  website           VARCHAR(500),
  type              VARCHAR(50) DEFAULT 'Private',     -- Public | Private | Deemed
  established_year  INT,
  rating            DECIMAL(3,2) DEFAULT 0.00,         -- 0.00 – 5.00
  is_featured       BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_colleges_name        ON colleges (name);
CREATE INDEX IF NOT EXISTS idx_colleges_state       ON colleges (state);
CREATE INDEX IF NOT EXISTS idx_colleges_city        ON colleges (city);
CREATE INDEX IF NOT EXISTS idx_colleges_type        ON colleges (type);
CREATE INDEX IF NOT EXISTS idx_colleges_featured    ON colleges (is_featured);
CREATE INDEX IF NOT EXISTS idx_colleges_rating      ON colleges (rating DESC);


-- ═══════════════════════════════════════════════════════════
--  4. COURSES TABLE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS courses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id      UUID REFERENCES colleges(id) ON DELETE CASCADE,
  teacher_id      UUID REFERENCES users(id)    ON DELETE SET NULL,
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  category        VARCHAR(100),
  level           course_level DEFAULT 'Beginner',
  duration_hours  INT DEFAULT 0,
  price           DECIMAL(10,2) DEFAULT 0.00,
  thumbnail_url   TEXT,
  is_live         BOOLEAN DEFAULT FALSE,
  is_published    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_college   ON courses (college_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher   ON courses (teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_category  ON courses (category);
CREATE INDEX IF NOT EXISTS idx_courses_level     ON courses (level);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses (is_published);


-- ═══════════════════════════════════════════════════════════
--  5. MATERIALS TABLE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS materials (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id             UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  uploaded_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  title                 VARCHAR(300) NOT NULL,
  description           TEXT,
  type                  material_type NOT NULL DEFAULT 'document',
  file_url              TEXT NOT NULL,
  cloudinary_public_id  VARCHAR(500),
  file_size_bytes       BIGINT DEFAULT 0,
  sort_order            INT DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_materials_course     ON materials (course_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploader   ON materials (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_materials_type       ON materials (type);
CREATE INDEX IF NOT EXISTS idx_materials_sort       ON materials (course_id, sort_order);


-- ═══════════════════════════════════════════════════════════
--  6. ENROLLMENTS TABLE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS enrollments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_percent  DECIMAL(5,2) DEFAULT 0.00,           -- 0.00 – 100.00
  status            enrollment_status DEFAULT 'active',
  enrolled_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,

  -- A student can only enroll in a course once
  CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student  ON enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course   ON enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status   ON enrollments (status);


-- ═══════════════════════════════════════════════════════════
--  7. AUTO-UPDATE `updated_at` TRIGGER
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON colleges
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════
--  8. SEED DATA (Optional — for testing)
-- ═══════════════════════════════════════════════════════════
--  Uncomment the block below to insert sample colleges.
-- ═══════════════════════════════════════════════════════════

-- INSERT INTO colleges (name, description, city, state, type, established_year, rating, is_featured)
-- VALUES
--   ('Indian Institute of Technology Delhi',
--    'Premier engineering institute in New Delhi, known for cutting-edge research.',
--    'New Delhi', 'Delhi', 'Public', 1961, 4.80, true),
--
--   ('Indian Institute of Management Ahmedabad',
--    'Top-ranked management school offering MBA, doctoral and executive programmes.',
--    'Ahmedabad', 'Gujarat', 'Public', 1961, 4.90, true),
--
--   ('Birla Institute of Technology and Science',
--    'Private deemed university with campuses in Pilani, Goa, and Hyderabad.',
--    'Pilani', 'Rajasthan', 'Deemed', 1964, 4.50, false),
--
--   ('Vellore Institute of Technology',
--    'Multi-campus private university known for engineering and technology programmes.',
--    'Vellore', 'Tamil Nadu', 'Private', 1984, 4.20, false),
--
--   ('National Law School of India University',
--    'India''s premier law school, offering BA LLB and LLM programmes.',
--    'Bengaluru', 'Karnataka', 'Public', 1987, 4.70, true);


-- ═══════════════════════════════════════════════════════════
--  ✅ Schema creation complete!
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════
