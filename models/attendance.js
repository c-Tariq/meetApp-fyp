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

const getAttendanceByMeetingId = async (meetingId) => {
  const result = await pool.query(
    `SELECT a.*, u.username 
     FROM attendance a
     JOIN users u ON a.user_id = u.user_id
     WHERE a.meeting_id = $1`,
    [meetingId]
  );
  return result.rows;
};

module.exports = {
  markAttendance,
  getAttendanceByMeetingId,
};
