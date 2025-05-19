const pollModel = require("../models/votingSession");
const { isSpaceAdmin } = require("../models/space"); // Import isSpaceAdmin

exports.createPoll = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { question, expiresAt } = req.body;
    const userId = req.user.user_id; // Use authenticated user's ID

    const newPoll = await pollModel.createPoll(
      topicId,
      userId,
      question,
      expiresAt
    );
    res.status(201).json(newPoll);
  } catch (err) {
    console.error("Error creating poll:", err);
    res.status(500).json({ message: "Server Error creating poll" }); // Use JSON
  }
};

exports.getPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await pollModel.getPollById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }
    res.json(poll);
  } catch (err) {
    console.error("Error fetching poll:", err);
    res.status(500).json({ message: "Server Error fetching poll" });
  }
};

exports.addPollOption = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionText } = req.body;
    const userId = req.user.user_id;

    const poll = await pollModel.getPollById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }
    if (poll.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Only the poll creator can add options." });
    }

    const newOption = await pollModel.addPollOption(pollId, optionText);
    res.status(201).json(newOption);
  } catch (err) {
    console.error("Error adding poll option:", err);
    res.status(500).json({ message: "Server Error adding poll option" });
  }
};

exports.castVote = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    const userId = req.user.user_id;

    const isValidOption = await pollModel.isOptionInPoll(optionId, pollId);
    if (!isValidOption) {
      return res.status(400).json({ message: "Invalid option for this poll." });
    }

    const vote = await pollModel.castVote(pollId, optionId, userId);
    res.status(201).json(vote);
  } catch (err) {
    console.error("Error casting vote:", err);
    res.status(500).json({ message: "Server Error casting vote" });
  }
};

exports.getPollResults = async (req, res) => {
  try {
    const { pollId } = req.params;
    const pollExists = await pollModel.getPollById(pollId);
    if (!pollExists) {
      return res.status(404).json({ message: "Poll not found" });
    }
    const results = await pollModel.getVotesByPollId(pollId);
    res.json(results);
  } catch (err) {
    console.error("Error fetching poll results:", err);
    res.status(500).json({ message: "Server Error fetching poll results" });
  }
};

exports.checkUserVoteStatus = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user.user_id;

    const pollExists = await pollModel.getPollById(pollId);
    if (!pollExists) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const hasVoted = await pollModel.hasUserVoted(pollId, userId);
    res.json({ hasVoted });
  } catch (err) {
    console.error("Error checking vote status:", err);
    res.status(500).json({ message: "Server Error checking vote status" });
  }
};

exports.getAggregatedResults = async (req, res) => {
  try {
    const { pollId } = req.params;

    const pollExists = await pollModel.getPollById(pollId);
    if (!pollExists) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const aggregatedResults = await pollModel.getAggregatedPollResults(pollId);
    res.json(aggregatedResults);
  } catch (err) {
    console.error("Error fetching aggregated poll results:", err);
    res
      .status(500)
      .json({ message: "Server Error fetching aggregated poll results" });
  }
};

exports.getPollsForTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const polls = await pollModel.getPollsByTopicId(topicId);
    res.json(polls);
  } catch (err) {
    console.error("Error fetching polls for topic:", err);
    res.status(500).json({ message: "Server Error fetching polls for topic" });
  }
};

exports.getPollOptions = async (req, res) => {
  try {
    const { pollId } = req.params;

    const pollExists = await pollModel.getPollById(pollId);
    if (!pollExists) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const options = await pollModel.getOptionsByPollId(pollId);
    res.json(options);
  } catch (err) {
    console.error("Error fetching poll options:", err);
    res.status(500).json({ message: "Server Error fetching poll options" });
  }
};

exports.deletePoll = async (req, res) => {
  try {
    const { spaceId, pollId } = req.params;
    const loggedInUserId = req.user.user_id;

    const isAdmin = await isSpaceAdmin(spaceId, loggedInUserId);
    if (!isAdmin) {
      return res.status(403).json({
        message: "Forbidden: Only the space administrator can delete polls.",
      });
    }

    const deletedRowCount = await pollModel.deletePoll(pollId);

    if (deletedRowCount === 0) {
      return res.status(404).json({ message: "Poll not found." });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Error in deletePoll controller:", err);
    res.status(500).json({ message: "Server Error deleting poll" });
  }
};

exports.deletePollOption = async (req, res) => {
  try {
    const { spaceId, optionId } = req.params;
    const loggedInUserId = req.user.user_id;

    const isAdmin = await isSpaceAdmin(spaceId, loggedInUserId);
    if (!isAdmin) {
      return res.status(403).json({
        message:
          "Forbidden: Only the space administrator can delete poll options.",
      });
    }

    const deletedRowCount = await pollModel.deletePollOption(optionId);

    if (deletedRowCount === 0) {
      return res.status(404).json({ message: "Poll option not found." });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Error in deletePollOption controller:", err);
    res.status(500).json({ message: "Server Error deleting poll option" });
  }
};
