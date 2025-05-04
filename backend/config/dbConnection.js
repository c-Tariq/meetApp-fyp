const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// connection check
pool.connect((err) => {
  if (err) {
    console.error('error connecting to the database:', err.message);
  } else {
    console.log('connected to the database successfully');
  }
});


module.exports = pool;