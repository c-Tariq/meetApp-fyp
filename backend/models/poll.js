const pool = require('../config/dbConnection');

const deletePoll = async (pollId) => {
    const result = await pool.query('DELETE FROM poll WHERE poll_id = $1',[pollId]);
    return result.rowCount;
};

module.exports = {
    deletePoll,
}; 