const pool = require("../config/dbConnection");

// const createMeeting = async (spaceId, title, scheduledTime, summary, followUps, transcript) => {
//   const result = await pool.query(
//     'INSERT INTO meeting (space_id, title, scheduled_time, created_at, summary, follow_ups, transcript) VALUES ($1, $2, $3, NOW(), $4, $5, $6) RETURNING *',
//     [spaceId, title, scheduledTime, summary, followUps, transcript]
//   );
//   return result.rows[0];
// };

const createMeeting = async (spaceId, title, scheduledTime) => {
  const result = await pool.query(
    // Status column will use the DB default 'Upcoming'
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
    "SELECT * FROM meeting WHERE meeting_id = $1",
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
    [`%${searchTerm}%`] // Wrap in % for partial matching
  );
  return result.rows;
};

const updateMeetingStatus = async (meetingId, newStatus) => {
  // The ENUM type in the DB provides validation, but you could double-check here if desired.
  const allowedStatuses = ["Upcoming", "In Progress", "Concluded"];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Invalid status value: ${newStatus}`);
  }
  const result = await pool.query(
    "UPDATE meeting SET status = $1 WHERE meeting_id = $2 RETURNING *",
    [newStatus, meetingId]
  );
  // Return the updated meeting object, or null if not found
  return result.rows[0] || null;
};

module.exports = {
  createMeeting,
  getMeetingById,
  isMeetingInSpace,
  getMeetingsBySpaceId,
  searchMeetingsByName,
  updateMeetingStatus,
};
