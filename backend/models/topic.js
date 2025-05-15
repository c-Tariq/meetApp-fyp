const pool = require('../config/dbConnection');

const addTopic = async (meetingId, topicTitle) => {
  const result = await pool.query(
    'INSERT INTO topics (meeting_id, topic_title, uploaded_at) VALUES ($1, $2, NOW()) RETURNING *',
    [meetingId, topicTitle]
  );
  return result.rows[0];
};

const getTopicsByMeetingId = async (meetingId) => {
  const result = await pool.query('SELECT * FROM topics WHERE meeting_id = $1',[meetingId]);
  return result.rows;
};

const isTopicInMeeting = async (topicId, meetingId) => {
  const result = await pool.query(
    'SELECT * FROM topics WHERE topic_id = $1 AND meeting_id = $2',
    [topicId, meetingId]
  );
  return result.rows.length > 0;
};

const getTopicById = async (topicId) => {
  const result = await pool.query('SELECT * FROM topics WHERE topic_id = $1',[topicId]);
  return result.rows[0];
};

const updateTopic = async (topicId, newTitle) => {
  const result = await pool.query(
    'UPDATE topics SET topic_title = $1 WHERE topic_id = $2 RETURNING *',
    [newTitle, topicId]
  );
  if (result.rows.length === 0) {
    throw new Error('topic not found or update failed');
  }
  return result.rows[0];
};

const deleteTopic = async (topicId) => {
  const result = await pool.query('DELETE FROM topics WHERE topic_id = $1 RETURNING topic_id',[topicId]);
  if (result.rows.length === 0) {
    throw new Error('topic not found or delete failed');
  }
  return { deleted: true, topic_id: result.rows[0].topic_id };
};

module.exports = {
  addTopic,
  getTopicsByMeetingId,
  isTopicInMeeting,
  getTopicById,
  updateTopic,
  deleteTopic
};