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

const getAttendanceByMeetingId = async (meetingId, spaceId) => {
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
  return result.rows.map(row => ({...row,is_present: row.is_present === null ? null : Boolean(row.is_present) 
  }));
};

module.exports = {
  markAttendance,
  getAttendanceByMeetingId,
};
