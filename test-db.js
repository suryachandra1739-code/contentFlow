const fs = require('fs');
const path = require('path');

// Custom simple parser for .env.local
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
      env[key] = val;
    }
  }
});

async function checkSchema() {
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
  const headers = {
    'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
  };

  try {
    // Call the root of the REST API to get OpenAPI schema which lists all tables
    const res = await fetch(url, { headers });
    const schema = await res.json();
    console.log('Available tables:', Object.keys(schema.definitions || {}));
  } catch (err) {
    console.error('Error fetching tables:', err);
  }
}

checkSchema();
