const pool = require("../config/dbConnection");

const createMeeting = async (spaceId, title, scheduledTime) => {
  const result = await pool.query(
    "INSERT INTO meeting (space_id, title, scheduled_time, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
    [spaceId, title, scheduledTime]
  );
  return result.rows[0];
};

const getMeetingsBySpaceId = async (spaceId) => {
  const result = await pool.query(
    "SELECT * FROM meeting WHERE space_id = $1 ORDER BY scheduled_time DESC",
    [spaceId]
  );
  return result.rows;
};

const getMeetingById = async (meetingId) => {
  const result = await pool.query(
    `SELECT 
       m.*, 
       s.user_id AS admin_user_id 
     FROM meeting m 
     JOIN space s ON m.space_id = s.space_id 
     WHERE m.meeting_id = $1`,
    [meetingId]
  );
  return result.rows[0];
};

const isMeetingInSpace = async (meetingId, spaceId) => {
  const result = await pool.query(
    "SELECT * FROM meeting WHERE meeting_id = $1 AND space_id = $2",
    [meetingId, spaceId]
  );
  return result.rows.length > 0;
};

const updateMeetingStatus = async (meetingId, newStatus) => {
  const allowedStatuses = ["Upcoming", "In Progress", "Concluded"];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`invalid status value: ${newStatus}`);
  }

  const result = await pool.query(
    "UPDATE meeting SET status = $1 WHERE meeting_id = $2 RETURNING *",
    [newStatus, meetingId]
  );
  return result.rows[0] || null;
};

const deleteMeetingById = async (meetingId) => {
  const result = await pool.query(
    "DELETE FROM meeting WHERE meeting_id = $1 RETURNING *",
    [meetingId]
  );
  return result.rows[0] || null;
};

module.exports = {
  createMeeting,
  getMeetingById,
  isMeetingInSpace,
  getMeetingsBySpaceId,
  updateMeetingStatus,
  deleteMeetingById,
};
