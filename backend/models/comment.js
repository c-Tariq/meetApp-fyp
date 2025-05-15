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

const deleteComment = async (commentId) => {
  const result = await pool.query(
    'DELETE FROM comment WHERE comment_id = $1',
    [commentId]
  );
  return result.rowCount; 
};


module.exports = {
  addComment,
  getCommentsByTopicId,
  deleteComment,
};