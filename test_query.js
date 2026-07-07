require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

async function testQuery() {
    const { data, error } = await supabase
    .from('tour_bookings')
    .select(`
      *,
      tour_package:package_id (name),
      customer:user_id (full_name, email, avatar_url)
    `)
    .eq('booking_status', 'pending')
    .order('created_at', { ascending: false });
    
    if (error) {
        console.error("ERROR WITH user_id:", error.message);
    } else {
        console.log("SUCCESS WITH user_id", data.length);
    }
    
    // Now try with profiles
    const { data: d2, error: e2 } = await supabase
    .from('tour_bookings')
    .select(`
      *,
      tour_package:package_id (name),
      customer:profiles!user_id (full_name, email, avatar_url)
    `)
    .eq('booking_status', 'pending')
    .order('created_at', { ascending: false });
    
    if (e2) {
        console.error("ERROR WITH profiles:", e2.message);
    } else {
        console.log("SUCCESS WITH profiles!", d2.length);
    }
}

testQuery();
