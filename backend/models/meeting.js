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
    `SELECT 
       m.*, 
       s.user_id AS admin_user_id -- Get the admin ID from the space table
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

// Function to update summary and tasks (follow-ups) for a meeting
const updateMeetingSummaryAndTasks = async (meetingId, summary, tasks) => {
  const result = await pool.query(
    "UPDATE meeting SET summary = $1, follow_ups = $2 WHERE meeting_id = $3 RETURNING *",
    [summary, tasks, meetingId]
  );
  if (result.rows.length === 0) {
    throw new Error("Meeting not found or update failed");
  }
  return result.rows[0]; // Return the updated meeting object
};

// Function to update just the transcript for a meeting
const updateMeetingTranscript = async (meetingId, transcript) => {
  console.log("this is transcription mooooooooooooooooooooooooodel");
  // console.log(transcript);
  const result = await pool.query(
    "UPDATE meeting SET transcript = $1 WHERE meeting_id = $2 RETURNING meeting_id", // Only need ID back
    [transcript, meetingId]
  );
  if (result.rows.length === 0) {
    throw new Error("Meeting not found or transcript update failed");
  }
  return result.rows[0];
};

// Function to partially update meeting details (e.g., title, scheduled_time)
const updateMeetingDetails = async (meetingId, updates) => {
  // Filter out undefined values to only update provided fields
  const fieldsToUpdate = Object.entries(updates)
    .filter(([key, value]) => value !== undefined)
    .reduce((obj, [key, value]) => {
      // Map frontend keys (camelCase) to DB columns (snake_case) if necessary
      const dbKey = key === "scheduledTime" ? "scheduled_time" : key;
      obj[dbKey] = value;
      return obj;
    }, {});

  const keys = Object.keys(fieldsToUpdate);
  if (keys.length === 0) {
    // If no valid fields were provided, fetch and return the current meeting data
    console.warn(
      "Update meeting details called with no valid fields for meeting:",
      meetingId
    );
    return getMeetingById(meetingId);
  }

  // Build the SET part of the SQL query dynamically
  // Example: SET title = $2, scheduled_time = $3
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
  return result.rows[0]; // Return the updated meeting object
};

const deleteMeetingById = async (meetingId) => {
  const result = await pool.query(
    "DELETE FROM meeting WHERE meeting_id = $1 RETURNING *",
    [meetingId]
  );
  // Returns the deleted meeting object or null if not found
  return result.rows[0] || null;
};

module.exports = {
  createMeeting,
  getMeetingById,
  isMeetingInSpace,
  getMeetingsBySpaceId,
  searchMeetingsByName,
  updateMeetingStatus,
  updateMeetingSummaryAndTasks,
  updateMeetingTranscript, // Export the new function
  updateMeetingDetails, // Export the new function
  deleteMeetingById, // Export the new function
};
