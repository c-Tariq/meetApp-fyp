const pool = require("../config/dbConnection");


const createMeeting = async (spaceId, title, scheduledTime) => {
  const result = await pool.query(
    "INSERT INTO meeting (space_id, title, scheduled_time, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
    [spaceId, title, scheduledTime]
  );
  return result.rows[0];
};

const getMeetingsBySpaceId = async (spaceId) => {
  const result = await pool.query("SELECT * FROM meeting WHERE space_id = $1 ORDER BY scheduled_time DESC",[spaceId] );
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

const searchMeetingsByName = async (searchTerm) => {
  const result = await pool.query(
    "SELECT * FROM meeting WHERE title ILIKE $1 ORDER BY scheduled_time DESC",
    [`%${searchTerm}%`] 
  );
  return result.rows;
};

const updateMeetingStatus = async (meetingId, newStatus) => {
  const allowedStatuses = ["Upcoming", "In Progress", "Concluded"];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`invalid status value: ${newStatus}`);
  }
  
  const result = await pool.query("UPDATE meeting SET status = $1 WHERE meeting_id = $2 RETURNING *",[newStatus, meetingId]);
  return result.rows[0] || null;
};

const updateMeetingDetails = async (meetingId, updates) => {
  
  const fieldsToUpdate = Object.entries(updates)
    .filter(([key, value]) => value !== undefined)
    .reduce((obj, [key, value]) => {
      const dbKey = key === "scheduledTime" ? "scheduled_time" : key;
      obj[dbKey] = value;
      return obj;
    }, {});

  const keys = Object.keys(fieldsToUpdate);
  if (keys.length === 0) {
    return getMeetingById(meetingId);
  }

  const setClause = keys
    .map((key, index) => `"${key}" = $${index + 2}`)
    .join(", ");
  const values = keys.map((key) => fieldsToUpdate[key]);

  const queryText = `UPDATE meeting SET ${setClause} WHERE meeting_id = $1 RETURNING *`;
  const queryValues = [meetingId, ...values];

  const result = await pool.query(queryText, queryValues);

  if (result.rows.length === 0) {
    throw new Error("Meeting not found or update failed");
  }
  return result.rows[0];
};

const deleteMeetingById = async (meetingId) => {
  const result = await pool.query("DELETE FROM meeting WHERE meeting_id = $1 RETURNING *",[meetingId]);
  return result.rows[0] || null;
};

module.exports = {
  createMeeting,
  getMeetingById,
  isMeetingInSpace,
  getMeetingsBySpaceId,
  searchMeetingsByName,
  updateMeetingStatus,
  updateMeetingDetails, 
  deleteMeetingById, 
};
