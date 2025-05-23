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
    const result = await pool.query('SELECT 1 FROM polls WHERE poll_id = $1 AND topic_id = $2',[pollId, topicId]);
    return result.rows.length > 0;
  };

  const getPollsByTopicId = async (topicId) => {
    const result = await pool.query('SELECT * FROM polls WHERE topic_id = $1',[topicId]);
    return result.rows;
  };

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
    const result = await pool.query('SELECT * FROM poll_options WHERE poll_id = $1',[pollId]);
    return result.rows;
  };
  
  const isOptionInPoll = async (optionId, pollId) => {
    const result = await pool.query('SELECT 1 FROM poll_options WHERE option_id = $1 AND poll_id = $2',[optionId, pollId]);
    return result.rows.length > 0;
  };
  

  
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

  const hasUserVoted = async (pollId, userId) => {
    const result = await pool.query(
      'SELECT 1 FROM votes WHERE poll_id = $1 AND user_id = $2',
      [pollId, userId]
    );
    return result.rows.length > 0;
  };

  const getAggregatedPollResults = async (pollId) => {
    const result = await pool.query(
      `SELECT 
        po.option_id, 
        po.option_text, 
        COUNT(v.vote_id) AS vote_count
      FROM 
        poll_options po
      LEFT JOIN 
        votes v ON po.option_id = v.option_id AND v.poll_id = $1
      WHERE 
        po.poll_id = $1
      GROUP BY 
        po.option_id, po.option_text
      ORDER BY
        po.option_id; -- Or order by vote_count DESC
      `,
      [pollId]
    );
    return result.rows.map(row => ({ ...row, vote_count: parseInt(row.vote_count, 10) })); 
  };

const deletePoll = async (pollId) => {
    const result = await pool.query('DELETE FROM polls WHERE poll_id = $1',[pollId]);
    return result.rowCount;
};

const deletePollOption = async (optionId) => {
    const result = await pool.query('DELETE FROM poll_options WHERE option_id = $1',[optionId]);
    return result.rowCount;
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
    hasUserVoted,
    getAggregatedPollResults,
    deletePoll,
    deletePollOption
  };