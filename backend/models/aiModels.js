const pool = require("../config/dbConnection");

/**
 * Updates the summary and follow-up tasks for a specific meeting.
 * @param {string|number} meetingId - The ID of the meeting to update.
 * @param {string|null} summary - The generated meeting summary.
 * @param {string|null} tasks - The generated follow-up tasks.
 * @returns {Promise<object>} - The updated meeting object.
 * @throws {Error} - Throws an error if the meeting is not found or the update fails.
 */
const updateMeetingSummaryAndTasks = async (meetingId, summary, tasks) => {
  console.log(`Updating summary/tasks in DB for meeting ${meetingId}...`);
  const result = await pool.query(
    "UPDATE meeting SET summary = $1, follow_ups = $2 WHERE meeting_id = $3 RETURNING *",
    [summary, tasks, meetingId]
  );
  if (result.rows.length === 0) {
    throw new Error("Meeting not found or summary/tasks update failed");
  }
  console.log(`Summary/tasks saved successfully for meeting ${meetingId}.`);
  return result.rows[0]; // Return the updated meeting object
};

/**
 * Updates the transcript for a specific meeting.
 * @param {string|number} meetingId - The ID of the meeting to update.
 * @param {string} transcript - The meeting transcript text.
 * @returns {Promise<object>} - An object containing the meeting_id of the updated record.
 * @throws {Error} - Throws an error if the meeting is not found or the update fails.
 */
const updateMeetingTranscript = async (meetingId, transcript) => {
  console.log(`Updating transcript in DB for meeting ${meetingId}...`);
  const result = await pool.query(
    "UPDATE meeting SET transcript = $1 WHERE meeting_id = $2 RETURNING meeting_id", // Only need ID back
    [transcript, meetingId]
  );
  if (result.rows.length === 0) {
    throw new Error("Meeting not found or transcript update failed");
  }
  console.log(`Transcript saved successfully for meeting ${meetingId}.`);
  return result.rows[0];
};

module.exports = {
  updateMeetingSummaryAndTasks,
  updateMeetingTranscript,
}; 