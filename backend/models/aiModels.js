const pool = require("../config/dbConnection");

const updateMeetingSummaryAndTasks = async (meetingId, summary, tasks) => {
  const result = await pool.query(
    "UPDATE meeting SET summary = $1, follow_ups = $2 WHERE meeting_id = $3 RETURNING *",
    [summary, tasks, meetingId]
  );
  if (result.rows.length === 0) {
    throw new Error("meeting not found or summary/tasks update failed");
  }
  return result.rows[0]; 
};

const updateMeetingTranscript = async (meetingId, transcript) => {
  const result = await pool.query(
    "UPDATE meeting SET transcript = $1 WHERE meeting_id = $2 RETURNING meeting_id", 
    [transcript, meetingId]
  );
  if (result.rows.length === 0) {
    throw new Error("meeting not found or transcript update failed");
  }
  return result.rows[0];
};

module.exports = {
  updateMeetingSummaryAndTasks,
  updateMeetingTranscript,
}; 