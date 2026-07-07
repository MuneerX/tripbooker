import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ipuruidnljuolifndokh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXJ1aWRubGp1b2xpZm5kb2toIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc4MjczMywiZXhwIjoyMDc5MzU4NzMzfQ.tkU0jQ6NKj1K5F5O51M39Ldp9yHfexVKpsRswVXPJs4'
);

async function check() {
  const { data, error } = await supabase
    .from('tour_bookings')
    .select(`
      *,
      tour_package:package_id (name),
      customer:user_id (full_name, email, avatar_url)
    `)
    .limit(5);
  console.log("BOOKINGS:", JSON.stringify(data, null, 2), error);
}

check();
