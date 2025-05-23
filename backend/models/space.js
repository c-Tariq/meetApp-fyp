const pool = require("../config/dbConnection");

const createSpace = async (user_id, space_name) => {
  const result = await pool.query(
    "INSERT INTO space (user_id, space_name) VALUES ($1, $2) RETURNING *",
    [user_id, space_name]
  );
  return result.rows[0];
};

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

const isSpaceAdmin = async (space_id, user_id) => {
  const result = await pool.query("SELECT * FROM space WHERE space_id = $1 AND user_id = $2",[space_id, user_id] );
  return result.rows.length > 0; 
};

const deleteSpace = async (space_id) => {
  const result = await pool.query("DELETE FROM space WHERE space_id = $1 RETURNING *", [space_id] );
  return result.rows[0]; 
};

const getSpacesForUser = async (userId) => {
  const result = await pool.query(
    `
    SELECT DISTINCT ON (s.space_id) 
        s.space_id,
        s.space_name,
        u.username AS admin_username,
        u.email AS admin_email,
        s.created_at,
        s.user_id AS admin_user_id 
    FROM
        space s
    JOIN
        users u ON s.user_id = u.user_id 
    LEFT JOIN
        space_members sm ON s.space_id = sm.space_id 
    WHERE
        s.user_id = $1 OR sm.user_id = $1 
    ORDER BY
        s.space_id, s.created_at DESC; 
  `,
    [userId]
  );
  return result.rows;
};

const getSpaceById = async (spaceId, userId) => {
  const result = await pool.query(
    `
    SELECT
        s.space_id,
        s.space_name,
        u.username AS admin_username,
        u.email AS admin_email,
        s.created_at,
        s.user_id AS admin_user_id
    FROM
        space s
    JOIN
        users u ON s.user_id = u.user_id
    LEFT JOIN
        space_members sm ON s.space_id = sm.space_id AND sm.user_id = $2
    WHERE
        s.space_id = $1 
        AND (s.user_id = $2 OR sm.user_id IS NOT NULL) 
  `,
    [spaceId, userId]
  );

  return result.rows[0] || null;
};

module.exports = {
  createSpace,
  getAllSpaces,
  isSpaceAdmin,
  deleteSpace,
  getSpacesForUser,
  getSpaceById,
};