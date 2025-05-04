const pool = require('../config/dbConnection');

// Add other functions like createPoll, getPollsByTopicId etc. as needed

/**
 * Deletes a poll and potentially its associated options and votes (if CASCADE is set up).
 * @param {number} pollId - The ID of the poll to delete.
 * @returns {Promise<number>} - A promise that resolves to the number of deleted rows (0 or 1).
 */
const deletePoll = async (pollId) => {
    // Assumes ON DELETE CASCADE is set for poll_options and poll_votes referencing poll_id
    const result = await pool.query(
        'DELETE FROM poll WHERE poll_id = $1',
        [pollId]
    );
    return result.rowCount;
};

module.exports = {
    deletePoll,
    // export other functions...
}; 