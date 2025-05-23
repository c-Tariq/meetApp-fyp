const pool = require("../config/dbConnection");

const addUserToSpace = async (space_id, user_id) => {
  const result = await pool.query(
    "INSERT INTO space_members (space_id, user_id) VALUES ($1, $2) RETURNING *",
    [space_id, user_id]
  );
  return result.rows[0];
};

const isUserMemberOfSpace = async (space_id, user_id) => {
  const result = await pool.query(
    "SELECT * FROM space_members WHERE space_id = $1 AND user_id = $2",
    [space_id, user_id]
  );
  return result.rows.length > 0; 
};

const getAllMembersOfSpace = async (space_id) => {
  const result = await pool.query(
    `
    SELECT 
      sm.space_id,
      sm.user_id,
      u.username AS member_name,
      sm.joined_at
    FROM 
      space_members sm
    JOIN 
      users u
    ON 
      sm.user_id = u.user_id
    WHERE 
      sm.space_id = $1
    `,
    [space_id]
  );
  return result.rows;
};

module.exports = {
  addUserToSpace,
  isUserMemberOfSpace,
  getAllMembersOfSpace,
};
