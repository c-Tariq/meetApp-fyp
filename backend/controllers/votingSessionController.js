const pollModel = require('../models/votingSession');
const { isSpaceAdmin } = require('../models/space'); // Import isSpaceAdmin

exports.createPoll = async (req, res) => {
  // Validation handled by express-validator
  try {
    const { topicId } = req.params;
    const { question, expiresAt } = req.body;
    const userId = req.user.user_id; // Use authenticated user's ID

    // Basic check removed
    // if (!question) {
    //   return res.status(400).json({ message: 'Poll question is required' });
    // }

    // checkSpaceMembership middleware confirmed user is member
    const newPoll = await pollModel.createPoll(topicId, userId, question, expiresAt);
    res.status(201).json(newPoll);
  } catch (err) {
    console.error('Error creating poll:', err);
    res.status(500).json({ message: 'Server Error creating poll' }); // Use JSON
  }
};

exports.getPoll = async (req, res) => {
  // Validation handled by express-validator
  // Authorization handled by checkSpaceMembership
  try {
    const { pollId } = req.params;
    const poll = await pollModel.getPollById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    res.json(poll);
  } catch (err) {
    console.error('Error fetching poll:', err);
    res.status(500).json({ message: 'Server Error fetching poll' }); // Use JSON
  }
};

exports.addPollOption = async (req, res) => {
  // Validation handled by express-validator
  // Authorization handled by checkSpaceMembership
  try {
    const { pollId } = req.params;
    const { optionText } = req.body;
    const userId = req.user.user_id; // ID of user attempting to add option

    // Basic check removed
    // if (!optionText) {
    //   return res.status(400).json({ message: 'Option text is required' });
    // }

    // Verify poll exists and user is the creator
    const poll = await pollModel.getPollById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    if (poll.user_id !== userId) {
      return res.status(403).json({ message: 'Only the poll creator can add options.' });
    }

    const newOption = await pollModel.addPollOption(pollId, optionText);
    res.status(201).json(newOption);
  } catch (err) {
    console.error('Error adding poll option:', err);
    res.status(500).json({ message: 'Server Error adding poll option' }); // Use JSON
  }
};

exports.castVote = async (req, res) => {
  // Validation handled by express-validator
  // Authorization handled by checkSpaceMembership
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    const userId = req.user.user_id; // Use authenticated user's ID

    // Basic check removed
    // if (!optionId) {
    //   return res.status(400).json({ message: 'Option ID is required' });
    // }

    // Verify option belongs to the poll before casting vote
    const isValidOption = await pollModel.isOptionInPoll(optionId, pollId);
    if (!isValidOption) {
      return res.status(400).json({ message: 'Invalid option for this poll.' });
    }

    const vote = await pollModel.castVote(pollId, optionId, userId);
    res.status(201).json(vote);
  } catch (err) {
    console.error('Error casting vote:', err);
    // Handle potential DB constraint errors if needed, e.g., poll closed (though ON CONFLICT handles user conflict)
    res.status(500).json({ message: 'Server Error casting vote' }); // Use JSON
  }
};

exports.getPollResults = async (req, res) => {
  // Validation handled by express-validator
  // Authorization handled by checkSpaceMembership
  try {
    const { pollId } = req.params;
    // Add check if poll exists? Optional, depends if getVotesByPollId handles it gracefully
    const pollExists = await pollModel.getPollById(pollId);
    if (!pollExists) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    const results = await pollModel.getVotesByPollId(pollId);
    res.json(results);
  } catch (err) {
    console.error('Error fetching poll results:', err);
    res.status(500).json({ message: 'Server Error fetching poll results' }); // Use JSON
  }
};

exports.checkUserVoteStatus = async (req, res) => {
  // Validation handled by express-validator
  // Authorization handled by checkSpaceMembership
  try {
    const { pollId } = req.params;
    const userId = req.user.user_id; // Use authenticated user's ID

    // Add check if poll exists? Optional, depends if hasUserVoted handles it gracefully
    const pollExists = await pollModel.getPollById(pollId);
     if (!pollExists) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const hasVoted = await pollModel.hasUserVoted(pollId, userId);
    res.json({ hasVoted });
  } catch (err) {
    console.error('Error checking vote status:', err);
    res.status(500).json({ message: 'Server Error checking vote status' }); // Use JSON
  }
};

// New controller function for aggregated results
exports.getAggregatedResults = async (req, res) => {
  // Validation handled by express-validator
  // Authorization handled by checkSpaceMembership
  try {
    const { pollId } = req.params;
    
    // Ensure poll exists before trying to get results
    const pollExists = await pollModel.getPollById(pollId);
    if (!pollExists) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const aggregatedResults = await pollModel.getAggregatedPollResults(pollId);
    res.json(aggregatedResults);
  } catch (err) {
    console.error('Error fetching aggregated poll results:', err);
    res.status(500).json({ message: 'Server Error fetching aggregated poll results' }); // Use JSON
  }
};

exports.getPollsForTopic = async (req, res) => {
  // Validation (topicId format) handled by parent router (topicRoutes)
  // Authorization handled by checkSpaceMembership middleware
  try {
    const { topicId } = req.params; // Get topicId from parent route
    // checkSpaceMembership middleware already confirmed user can access this topic
    const polls = await pollModel.getPollsByTopicId(topicId);
    res.json(polls);
  } catch (err) {
    console.error('Error fetching polls for topic:', err);
    res.status(500).json({ message: 'Server Error fetching polls for topic' });
  }
};

exports.getPollOptions = async (req, res) => {
  // Validation handled by express-validator
  // Authorization handled by checkSpaceMembership
  try {
    const { pollId } = req.params;

    // Ensure poll exists first (optional but good practice)
    const pollExists = await pollModel.getPollById(pollId);
    if (!pollExists) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Call the model function to get options
    const options = await pollModel.getOptionsByPollId(pollId);
    res.json(options);

  } catch (err) {
    console.error('Error fetching poll options:', err);
    res.status(500).json({ message: 'Server Error fetching poll options' }); // Use JSON
  }
};

/**
 * Deletes a specific poll.
 * Requires space administrator privileges.
 */
exports.deletePoll = async (req, res) => {
  try {
    // spaceId is needed for auth check, pollId for deletion
    const { spaceId, pollId } = req.params; 
    const loggedInUserId = req.user.user_id;

    // Authorization Check: Is user the space admin?
    const isAdmin = await isSpaceAdmin(spaceId, loggedInUserId);
    if (!isAdmin) {
      return res.status(403).json({ 
        message: "Forbidden: Only the space administrator can delete polls." 
      });
    }

    // Attempt to delete the poll using the correct model function
    const deletedRowCount = await pollModel.deletePoll(pollId);

    if (deletedRowCount === 0) {
      return res.status(404).json({ message: "Poll not found." });
    }

    res.status(204).send(); // Success, No Content

  } catch (err) {
    console.error('Error in deletePoll controller:', err);
    res.status(500).json({ message: 'Server Error deleting poll' });
  }
};

/**
 * Deletes a specific poll option.
 * Requires space administrator privileges.
 */
exports.deletePollOption = async (req, res) => {
  try {
    const { spaceId, optionId } = req.params; // pollId, topicId etc. available if needed for checks
    const loggedInUserId = req.user.user_id;

    // Authorization Check: Is user the space admin?
    // Note: We might also want to check if the option belongs to a poll in this space/meeting/topic
    // For simplicity, only checking admin status for now.
    const isAdmin = await isSpaceAdmin(spaceId, loggedInUserId);
    if (!isAdmin) {
      return res.status(403).json({ 
        message: "Forbidden: Only the space administrator can delete poll options." 
      });
    }

    // TODO: Add check: Can we delete options if votes exist? 
    // For now, we allow deletion regardless of votes, assuming cascade or manual cleanup.

    // Attempt to delete the poll option
    const deletedRowCount = await pollModel.deletePollOption(optionId);

    if (deletedRowCount === 0) {
      return res.status(404).json({ message: "Poll option not found." });
    }

    res.status(204).send(); // Success, No Content

  } catch (err) {
    console.error('Error in deletePollOption controller:', err);
    res.status(500).json({ message: 'Server Error deleting poll option' });
  }
};