const pool = require("../config/dbConnection");

const markAttendance = async (meetingId, userId, isPresent) => {
  const result = await pool.query(
    `INSERT INTO attendance 
     (meeting_id, user_id, is_present, marked_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (meeting_id, user_id) 
     DO UPDATE SET is_present = $3 RETURNING *`,
    [meetingId, userId, isPresent]
  );
  return result.rows[0];
};

/**
 * Fetches attendance records for a specific meeting, including usernames.
 * @param {number} meetingId - The ID of the meeting.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of attendance records.
 */
const getAttendanceByMeetingId = async (meetingId) => {
  const result = await pool.query(
    `SELECT 
       a.attendance_id, 
       a.meeting_id, 
       a.user_id, 
       a.is_present, 
       a.marked_at, 
       u.username 
     FROM attendance a
     JOIN users u ON a.user_id = u.user_id
     WHERE a.meeting_id = $1
     ORDER BY u.username ASC`,
    [meetingId]
  );
  return result.rows;
};

module.exports = {
  markAttendance,
  getAttendanceByMeetingId,
};
