const { Client } = require('pg');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set in environment variables.');
}

const client = new Client({
  connectionString: databaseUrl
});

client.connect()
  .then(() => {
    console.log("Connected successfully to PostgreSQL!");
    client.end();
  })
  .catch(err => {
    console.error("Connection error:", err.message);
    process.exit(1);
  });
