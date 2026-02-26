const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lqqsuhvrzmgpssvkqabq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcXN1aHZyem1ncHNzdmtxYWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzg5MTUsImV4cCI6MjA4NzYxNDkxNX0.rKyeW_asplQeR4uZfrqZNOHvWanFytrVbC_9j6Ar-QQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
    const { data, error } = await supabase.auth.signUp({
        email: 'test_student_123@zplus.com',
        password: 'password123',
        options: {
            data: {
                full_name: 'Test Student',
                role: 'student'
            }
        }
    });

    if (error) {
        console.error('Signup Error:', error.message);
    } else {
        console.log('Signup Success:', data.user?.email);
    }
}

testSignup();
