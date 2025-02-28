const pool = require('../config/dbConnection');

// Function to create a new user
const createUser = async (username, email, password_hash) => {
  const result = await pool.query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [username, email, password_hash]
  );
  return result.rows[0];
};

// Function to get a user by ID
const getUserById = async (user_id) => {
  const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
  return result.rows[0];
};

module.exports = {
  createUser,
  getUserById,
};