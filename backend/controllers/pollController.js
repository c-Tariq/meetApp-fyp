const { isSpaceAdmin } = require('../models/space');
const { deletePoll } = require('../models/poll');

// Add other poll/option related controller functions here...

/**
 * Deletes a specific poll.
 * Requires space administrator privileges.
 */
exports.deletePoll = async (req, res) => {
  try {
    const { spaceId, pollId } = req.params;
    const loggedInUserId = req.user.user_id;

    // Authorization Check: Is user the space admin?
    const isAdmin = await isSpaceAdmin(spaceId, loggedInUserId);
    if (!isAdmin) {
      return res.status(403).json({ 
        message: "Forbidden: Only the space administrator can delete polls." 
      });
    }

    // Attempt to delete the poll
    const deletedRowCount = await deletePoll(pollId);

    if (deletedRowCount === 0) {
      return res.status(404).json({ message: "Poll not found." });
    }

    res.status(204).send(); // Success, No Content

  } catch (err) {
    console.error('Error in deletePoll controller:', err);
    res.status(500).json({ message: 'Server Error deleting poll' });
  }
};

// Placeholder for other functions
exports.deletePollOption = async (req, res) => { /* Implement later */ };
exports.getPolls = async (req, res) => { /* Existing or new */ };
exports.createPoll = async (req, res) => { /* Existing or new */ };
// ... etc ... 