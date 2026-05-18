import fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1).replace(/^"(.*)"$/, '$1')];
    })
);

const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = env;

async function test() {
  const res = await fetch(`${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users`, {
    headers: {
      apikey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    }
  });
  const data = await res.json();
  console.log('Users in public.users:', data);
}
test();
