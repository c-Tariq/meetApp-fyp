import db from "../config/database.js";
import bcrypt from "bcrypt";

const saltRounds = 10;

export const findUserByEmail = async (email) => {
  const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
};

export const createUser = async (username, email, password) => {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const result = await db.query(
    "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
    [username, email, hashedPassword]
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