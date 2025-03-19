const pool = require('../config/dbConnection');

const getUserByEmail  = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
};

const getUserById = async (user_id) => {
  const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
  return result.rows[0];
};

const getUserByUsername = async (username) => {
  const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
  return result.rows[0];
};

const createNewUser = async (username, email, password) => {
  const result = await pool.query(
    "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
    [username, email, password]
  );
  return result.rows[0];
};



module.exports = {
  getUserByEmail,
  getUserById,
  getUserByUsername,
  createNewUser,
};
