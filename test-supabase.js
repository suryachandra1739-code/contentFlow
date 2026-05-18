require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data: users, error: uError } = await supabase.from('users').select('*');
  console.log('Users:', users, uError);
  
  const { data: authUsers, error: auError } = await supabase.auth.admin.listUsers();
  console.log('Auth Users:', authUsers?.users?.map(u => u.email), auError);
}
test();
