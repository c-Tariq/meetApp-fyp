const pool = require('../config/dbConnection');

// Function to create a new space
const createSpace = async (user_id, space_name) => {
  const result = await pool.query(
    'INSERT INTO space (user_id, space_name) VALUES ($1, $2) RETURNING *',
    [user_id, space_name]
  );
  return result.rows[0];
};

// Function to get all spaces with admin details
const getAllSpaces = async () => {
  const result = await pool.query(`
    SELECT 
      s.space_id,
      s.space_name,
      u.username AS admin_username,
      u.email AS admin_email,
      s.created_at
    FROM 
      space s
    JOIN 
      users u
    ON 
      s.user_id = u.user_id
  `);
  return result.rows;
};

// Function to check if the user is the admin of the space
const isSpaceAdmin = async (space_id, user_id) => {
  const result = await pool.query(
    'SELECT * FROM space WHERE space_id = $1 AND user_id = $2',
    [space_id, user_id]
  );
  return result.rows.length > 0;  // Returns true if the user is the admin
};

// Function to delete a space
const deleteSpace = async (space_id) => {
  const result = await pool.query(
    'DELETE FROM space WHERE space_id = $1 RETURNING *',
    [space_id]
  );
  return result.rows[0];  // Returns the deleted space
};

module.exports = {
  createSpace,
  getAllSpaces,
  isSpaceAdmin, 
  deleteSpace,
};