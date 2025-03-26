const pollModel = require('../models/votingSession');

exports.createPoll = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { question, expiresAt } = req.body;
    const userId = req.user.user_id; // Use authenticated user's ID

    if (!question) {
      return res.status(400).json({ message: 'Poll question is required' });
    }

    const newPoll = await pollModel.createPoll(topicId, userId, question, expiresAt);
    res.status(201).json(newPoll);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await pollModel.getPollById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    res.json(poll);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.addPollOption = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionText } = req.body;

    if (!optionText) {
      return res.status(400).json({ message: 'Option text is required' });
    }

    const newOption = await pollModel.addPollOption(pollId, optionText);
    res.status(201).json(newOption);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.castVote = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    const userId = req.user.user_id; // Use authenticated user's ID

    if (!optionId) {
      return res.status(400).json({ message: 'Option ID is required' });
    }

    const vote = await pollModel.castVote(pollId, optionId, userId);
    res.status(201).json(vote);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getPollResults = async (req, res) => {
  try {
    const { pollId } = req.params;
    const results = await pollModel.getVotesByPollId(pollId);
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.checkUserVoteStatus = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user.user_id; // Use authenticated user's ID instead of query

    const hasVoted = await pollModel.hasUserVoted(pollId, userId);
    res.json({ hasVoted });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};