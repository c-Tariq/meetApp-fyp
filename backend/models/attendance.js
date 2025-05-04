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
const getAttendanceByMeetingId_OLD = async (meetingId) => {
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

/**
 * Fetches all members of the space containing the meeting,
 * joined with their attendance status for that specific meeting.
 * @param {number} meetingId - The ID of the meeting.
 * @param {number} spaceId - The ID of the space.
 * @returns {Promise<Array<object>>} - A promise resolving to [{ user_id, username, is_present (boolean | null) }]
 */
const getCombinedAttendanceForMeeting = async (meetingId, spaceId) => {
  const result = await pool.query(
    `SELECT
        sm.user_id,
        u.username,
        a.is_present -- Will be null if no attendance record exists for this meeting
     FROM space_members sm
     JOIN users u ON sm.user_id = u.user_id
     LEFT JOIN attendance a ON sm.user_id = a.user_id AND a.meeting_id = $1
     WHERE sm.space_id = $2
     ORDER BY u.username ASC`,
    [meetingId, spaceId]
  );
  // Ensure is_present is explicitly boolean or null/false for consistency
  return result.rows.map(row => ({
    ...row,
    is_present: row.is_present === null ? null : Boolean(row.is_present) // Or default to false: row.is_present ?? false
  }));
};

module.exports = {
  markAttendance,
  getAttendanceByMeetingId_OLD,
  getAttendanceByMeetingId: getCombinedAttendanceForMeeting,
};
