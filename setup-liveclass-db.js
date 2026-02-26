const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Aadi%40123%23%23@db.lqqsuhvrzmgpssvkqabq.supabase.co:5432/postgres'
});

const triggerSql = `
-- 1. Create Live Classes Table
CREATE TABLE IF NOT EXISTS live_classes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  status        VARCHAR(50) DEFAULT 'live', -- 'scheduled', 'live', 'ended'
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  ended_at      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Live Class Messages Table (Chat History)
CREATE TABLE IF NOT EXISTS live_class_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_class_id   UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name     VARCHAR(255) NOT NULL, -- Cached for performance
  sender_role     VARCHAR(50) NOT NULL,
  message         TEXT NOT NULL,
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_classes_course ON live_classes (course_id);
CREATE INDEX IF NOT EXISTS idx_live_class_messages_class ON live_class_messages (live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_messages_sent ON live_class_messages (sent_at);
`;

async function setupTables() {
    try {
        console.log('Connecting to Supabase Database...');
        await client.connect();

        console.log('Applying Live Classes schema...');
        await client.query(triggerSql);

        console.log('Success! Tables `live_classes` and `live_class_messages` created successfully.');
    } catch (err) {
        console.error('Error applying schema:', err.message);
    } finally {
        await client.end();
    }
}

setupTables();
