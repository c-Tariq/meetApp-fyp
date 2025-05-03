const pool = require('../config/dbConnection');

const addDocument = async (topicId, originalFileName, fileType, fileSize, storedFileName) => {
  const result = await pool.query(
    `INSERT INTO document 
     (topic_id, file_name, file_type, file_size, stored_file_name, uploaded_at)
     VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
    [topicId, originalFileName, fileType, fileSize, storedFileName]
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

// Function to get a single document by its ID
const getDocumentById = async (documentId) => {
  const result = await pool.query(
    'SELECT * FROM document WHERE document_id = $1',
    [documentId]
  );
  return result.rows[0]; // Returns the document record or undefined if not found
};

// Function to delete a document record by its ID
const deleteDocumentById = async (documentId) => {
  const result = await pool.query(
    'DELETE FROM document WHERE document_id = $1 RETURNING *',
    [documentId]
  );
  return result.rowCount; // Returns the number of rows deleted (should be 1 or 0)
};

module.exports = {
  addDocument,
  getDocumentsByTopicId,
  getDocumentById,
  deleteDocumentById // Export the new function
};