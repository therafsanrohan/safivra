import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL.replace('[YOUR-PASSWORD]', process.env.SUPABASE_SECRET_KEY) });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT proname, prosrc 
    FROM pg_proc 
    WHERE proname = 'post_transaction';
  `);
  console.log("RPC Found:", res.rows.length);
  if (res.rows.length > 0) {
    console.log(res.rows[0].proname);
  }
  await client.end();
}
run();
