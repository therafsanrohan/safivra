import fs from 'fs';
import pg from 'pg';

const env = fs.readFileSync('.env', 'utf-8');
const dbUrlMatch = env.match(/DATABASE_URL="([^"]+)"/);
const secretKeyMatch = env.match(/SUPABASE_SECRET_KEY=([^\n\r]+)/);

if (dbUrlMatch && secretKeyMatch) {
  const dbUrl = dbUrlMatch[1].replace('[YOUR-PASSWORD]', secretKeyMatch[1]);
  const client = new pg.Client({ connectionString: dbUrl });
  
  async function run() {
    await client.connect();
    const sql = fs.readFileSync('supabase/migrations/20260731000003_remove_demo_data.sql', 'utf-8');
    await client.query(sql);
    console.log('Migration applied successfully.');
    await client.end();
  }
  run().catch(console.error);
} else {
  console.error('Could not parse .env');
}
