const pool = require("../config/dbConnection");

const getUser = async (field, value) => {
  const result = await pool.query(`SELECT * FROM users WHERE ${field} = $1`, [
    value,
  ]);
  return result.rows[0];
};

const createNewUser = async (username, email, password) => {
  const result = await pool.query(
    "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
    [username, email, password]
  );
  return result.rows[0];
};

module.exports = {
  getUser,
  createNewUser,
};
