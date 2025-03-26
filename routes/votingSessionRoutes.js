const express = require('express');
const router = express.Router({ mergeParams: true }); // Access :spaceId, :meetingId, :topicId
const votingSessionController = require('../controllers/votingSessionController');
const { ensureAuthenticated } = require('../middleware/auth');

// Protected routes
router.post('/', ensureAuthenticated, votingSessionController.createPoll);         // POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls
router.get('/:pollId', ensureAuthenticated, votingSessionController.getPoll);      // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId
router.post('/:pollId/options', ensureAuthenticated, votingSessionController.addPollOption); // POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/options
router.post('/:pollId/vote', ensureAuthenticated, votingSessionController.castVote); // POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/vote
router.get('/:pollId/results', ensureAuthenticated, votingSessionController.getPollResults); // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/results
router.get('/:pollId/vote-status', ensureAuthenticated, votingSessionController.checkUserVoteStatus); // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/vote-status

module.exports = router;