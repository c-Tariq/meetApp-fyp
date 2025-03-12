const pool = require('../config/dbConnection');

const addDocument = async (topicId, fileName, fileType, fileSize) => {
  const result = await pool.query(
    `INSERT INTO document 
     (topic_id, file_name, file_type, file_size, uploaded_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [topicId, fileName, fileType, fileSize]
  );
  return result.rows[0];
};

const getDocumentsByTopicId = async (topicId) => {
  const result = await pool.query(
    'SELECT * FROM document WHERE topic_id = $1',
    [topicId]
  );
  return result.rows;
};

module.exports = {
  addDocument,
  getDocumentsByTopicId
};