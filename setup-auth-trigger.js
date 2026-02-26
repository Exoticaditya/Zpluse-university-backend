const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Aadi%40123%23%23@db.lqqsuhvrzmgpssvkqabq.supabase.co:5432/postgres'
});

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
