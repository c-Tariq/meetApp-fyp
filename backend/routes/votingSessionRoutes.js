const express = require("express");
const router = express.Router({ mergeParams: true }); // Access :spaceId, :meetingId, :topicId
const votingSessionController = require("../controllers/votingSessionController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const { checkSpaceMembership } = require("../middleware/authMiddleware");
const { param, body, validationResult } = require("express-validator"); // Import validators

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  "/",
  ensureAuthenticated,
  validate,
  votingSessionController.createPoll
);

router.get("/", ensureAuthenticated, votingSessionController.getPollsForTopic);

// POST api//spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls
router.get(
  "/:pollId",
  ensureAuthenticated,
  validate,
  votingSessionController.getPoll
);

// POST api//spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls
router.get(
  "/:pollId/options",
  ensureAuthenticated,
  validate,
  votingSessionController.getPollOptions
);

// POST api//spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/options
router.post(
  "/:pollId/options",
  ensureAuthenticated,
  validate,
  votingSessionController.addPollOption
);

// POST api//spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/vote
router.post(
  "/:pollId/vote",
  ensureAuthenticated,
  validate,
  votingSessionController.castVote
);

// GET api//spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/results
router.get(
  "/:pollId/results",
  ensureAuthenticated,
  validate,
  votingSessionController.getPollResults
);

// GET api/spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/vote-status
router.get(
  "/:pollId/vote-status",
  ensureAuthenticated,
  checkSpaceMembership,
  validate,
  votingSessionController.checkUserVoteStatus
);

router.get(
  "/:pollId/aggregated-results",
  ensureAuthenticated,
  validate,
  votingSessionController.getAggregatedResults
);

router.delete(
  "/:pollId",
  ensureAuthenticated,
  validate,
  votingSessionController.deletePoll
);

router.delete(
  "/:pollId/options/:optionId",
  ensureAuthenticated,
  validate,
  votingSessionController.deletePollOption
);

module.exports = router;
