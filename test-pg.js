const { Client } = require('pg');
require('dotenv').config();

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  throw new Error('DIRECT_URL is not set in environment variables.');
}

const client = new Client({
  connectionString: directUrl
});

client.connect()
  .then(() => {
    console.log("Connected successfully to PostgreSQL!");
    client.end();
  })
  .catch(err => {
    console.error("Connection error", err.message);
    console.error(err);
  });
