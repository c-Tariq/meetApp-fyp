const pool = require('../config/dbConnection');

const addComment = async (topicId, userId, content) => {
  const result = await pool.query(
    'INSERT INTO comment (topic_id, user_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
    [topicId, userId, content]
  );
  return result.rows[0];
};

const getCommentsByTopicId = async (topicId) => {
  const result = await pool.query(
    `SELECT c.*, u.username 
     FROM comment c
     JOIN users u ON c.user_id = u.user_id
     WHERE c.topic_id = $1`,
    [topicId]
  );
  return result.rows;
};

// Remove getCommentsByMeetingId and createComment as comments are per-topic
/*
/**
 * Fetches comments for a specific meeting, including usernames.
 * @param {number} meetingId - The ID of the meeting.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of comment records.
 */
/*
const getCommentsByMeetingId = async (meetingId) => {
  const result = await pool.query(
    `SELECT 
       c.comment_id, 
       c.meeting_id, 
       c.user_id, 
       c.comment_text, 
       c.created_at, 
       u.username 
     FROM comments c
     JOIN users u ON c.user_id = u.user_id
     WHERE c.meeting_id = $1
     ORDER BY c.created_at ASC`,
    [meetingId]
  );
  return result.rows;
};
*/

/*
/**
 * Creates a new comment for a meeting.
 * @param {number} meetingId - The ID of the meeting.
 * @param {number} userId - The ID of the user making the comment.
 * @param {string} commentText - The text content of the comment.
 * @returns {Promise<object>} - A promise that resolves to the newly created comment object (including username).
 */
/*
const createComment = async (meetingId, userId, commentText) => {
  const result = await pool.query(
    `INSERT INTO comments (meeting_id, user_id, comment_text) 
     VALUES ($1, $2, $3) 
     RETURNING comment_id, meeting_id, user_id, comment_text, created_at`,
    [meetingId, userId, commentText]
  );
  
  // Fetch the newly created comment along with the username
  if (result.rows.length > 0) {
      const newCommentId = result.rows[0].comment_id;
      const commentDetails = await pool.query(
        `SELECT 
            c.comment_id, c.meeting_id, c.user_id, c.comment_text, c.created_at, 
            u.username 
         FROM comments c
         JOIN users u ON c.user_id = u.user_id
         WHERE c.comment_id = $1`,
         [newCommentId]
      );
      return commentDetails.rows[0];
  }
  throw new Error("Failed to create or retrieve comment.");
};
*/

module.exports = {
  addComment,
  getCommentsByTopicId,
  // getCommentsByMeetingId,
  // createComment,
};