const pool = require('../config/dbConnection');

const addTopic = async (meetingId, topicTitle) => {
  const result = await pool.query(
    'INSERT INTO topics (meeting_id, topic_title, uploaded_at) VALUES ($1, $2, NOW()) RETURNING *',
    [meetingId, topicTitle]
  );
  return result.rows[0];
};

const getTopicsByMeetingId = async (meetingId) => {
  const result = await pool.query(
    'SELECT * FROM topics WHERE meeting_id = $1',
    [meetingId]
  );
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
  const result = await pool.query(
    'SELECT * FROM topics WHERE topic_id = $1',
    [topicId]
  );
  return result.rows[0];
};

module.exports = {
  addTopic,
  getTopicsByMeetingId,
  isTopicInMeeting,
  getTopicById
};