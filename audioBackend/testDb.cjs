const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function test() {
  await client.connect();
  const res = await client.query('SELECT song_key, image_key FROM songs LIMIT 1');
  console.log(res.rows);
  await client.end();
}
test();
