const pool = require("../config/dbConnection");
const crypto = require("crypto");

const createInvitation = async (space_id, inviter_id, email, token) => {
  const result = await pool.query(
    `INSERT INTO invitations 
    (space_id, inviter_id, email, token, expires_at) 
    VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
    RETURNING *`,
    [space_id, inviter_id, email, token]
  );
  return result.rows[0];
};

const getInvitationByToken = async (token) => {
  const result = await pool.query(
    "SELECT * FROM invitations WHERE token = $1 AND expires_at > NOW()",
    [token]
  );
  return result.rows[0];
};

const markInvitationUsed = async (token) => {
  await pool.query("UPDATE invitations SET used_at = NOW() WHERE token = $1", [
    token,
  ]);
};

const generateToken = () => crypto.randomBytes(32).toString("hex");

module.exports = {
  createInvitation,
  getInvitationByToken,
  markInvitationUsed,
  generateToken,
};
