const pool = require('../config/dbConnection');

const createPoll = async (topicId, userId, question, expiresAt) => {
    const result = await pool.query(
      `INSERT INTO polls (topic_id, user_id, question, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [topicId, userId, question, expiresAt]
    );
    return result.rows[0];
  };

  const getPollById = async (pollId) => {
    const result = await pool.query('SELECT * FROM polls WHERE poll_id = $1', [pollId]);
    return result.rows[0];
  };

  const isPollInTopic = async (pollId, topicId) => {
    const result = await pool.query(
      'SELECT 1 FROM polls WHERE poll_id = $1 AND topic_id = $2',
      [pollId, topicId]
    );
    return result.rows.length > 0;
  };

  const getPollsByTopicId = async (topicId) => {
    const result = await pool.query(
      'SELECT * FROM polls WHERE topic_id = $1',
      [topicId]
    );
    return result.rows;
  };

//   Add option to a poll
  const addPollOption = async (pollId, optionText) => {
    const result = await pool.query(
      `INSERT INTO poll_options (poll_id, option_text)
      VALUES ($1, $2)
      RETURNING *`,
      [pollId, optionText]
    );
    return result.rows[0];
  };

  const getOptionsByPollId = async (pollId) => {
    const result = await pool.query(
      'SELECT * FROM poll_options WHERE poll_id = $1',
      [pollId]
    );
    return result.rows;
  };
  
//   Check if option exists in pol
  const isOptionInPoll = async (optionId, pollId) => {
    const result = await pool.query(
      'SELECT 1 FROM poll_options WHERE option_id = $1 AND poll_id = $2',
      [optionId, pollId]
    );
    return result.rows.length > 0;
  };
  

  //   Record a vote
  const castVote = async (pollId, optionId, userId) => {
    const result = await pool.query(
      `INSERT INTO votes (poll_id, option_id, user_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (poll_id, user_id)
      DO UPDATE SET option_id = $2
      RETURNING *`,
      [pollId, optionId, userId]
    );
    return result.rows[0];
  };

//    * Get votes for a poll
  const getVotesByPollId = async (pollId) => {
    const result = await pool.query(
      `SELECT v.*, u.username, po.option_text 
      FROM votes v
      JOIN users u ON v.user_id = u.user_id
      JOIN poll_options po ON v.option_id = po.option_id
      WHERE v.poll_id = $1`,
      [pollId]
    );
    return result.rows;
  };

//   Check if user has voted in poll
  const hasUserVoted = async (pollId, userId) => {
    const result = await pool.query(
      'SELECT 1 FROM votes WHERE poll_id = $1 AND user_id = $2',
      [pollId, userId]
    );
    return result.rows.length > 0;
  };


module.exports = {
    createPoll,
    getPollById,
    getPollsByTopicId,
    isPollInTopic,

    addPollOption,
    getOptionsByPollId,
    isOptionInPoll,

    castVote,
    getVotesByPollId,
    hasUserVoted
  };