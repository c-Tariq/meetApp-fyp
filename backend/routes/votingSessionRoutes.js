const express = require('express');
const router = express.Router({ mergeParams: true }); // Access :spaceId, :meetingId, :topicId
const votingSessionController = require('../controllers/votingSessionController');
const { ensureAuthenticated } = require('../middleware/auth');
const { checkSpaceMembership } = require('../middleware/checkMembership'); // Import membership check
const { param, body, validationResult } = require('express-validator'); // Import validators

// Validation middleware helper
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Validation rules
const pollIdValidation = [
    param('pollId', 'Valid Poll ID is required').isInt({ min: 1 })
];

const createPollValidation = [
    body('question', 'Poll question is required and must be a non-empty string').notEmpty().isString().trim(),
    body('expiresAt', 'Expiration date must be a valid ISO 8601 date string').optional({ nullable: true }).isISO8601().toDate()
];

const addOptionValidation = [
    body('optionText', 'Option text is required and must be a non-empty string').notEmpty().isString().trim()
];

const castVoteValidation = [
    body('optionId', 'Option ID is required and must be an integer').isInt({ min: 1 })
];

// Protected routes with validation and authorization
router.post('/', 
    ensureAuthenticated, 
    checkSpaceMembership, // User must be member of space (derived from topicId)
    createPollValidation,
    validate, 
    votingSessionController.createPoll
); // POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls

router.get('/',
    ensureAuthenticated,
    checkSpaceMembership, // User must be member of space derived from topicId
    votingSessionController.getPollsForTopic // New controller function
);

router.get('/:pollId', 
    ensureAuthenticated, 
    checkSpaceMembership, // User must be member of space (derived from topicId -> pollId)
    pollIdValidation,
    validate, 
    votingSessionController.getPoll
); // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId

// New route to get options for a specific poll
router.get('/:pollId/options',
    ensureAuthenticated,
    checkSpaceMembership, // User must be member of space
    pollIdValidation,     // Validate pollId format
    validate,
    votingSessionController.getPollOptions
); // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/options

router.post('/:pollId/options', 
    ensureAuthenticated, 
    checkSpaceMembership, // User must be member of space
    pollIdValidation,
    addOptionValidation,
    validate,
    votingSessionController.addPollOption
); // POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/options

router.post('/:pollId/vote', 
    ensureAuthenticated, 
    checkSpaceMembership, // User must be member of space
    pollIdValidation,
    castVoteValidation,
    validate,
    votingSessionController.castVote
); // POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/vote

router.get('/:pollId/results', 
    ensureAuthenticated, 
    checkSpaceMembership, // User must be member of space
    pollIdValidation,
    validate,
    votingSessionController.getPollResults
); // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/results

router.get('/:pollId/vote-status', 
    ensureAuthenticated, 
    checkSpaceMembership, // User must be member of space
    pollIdValidation,
    validate,
    votingSessionController.checkUserVoteStatus
); // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/vote-status

// Route for aggregated results
router.get('/:pollId/aggregated-results', 
    ensureAuthenticated, 
    checkSpaceMembership, // User must be member of space
    pollIdValidation,     // Validate pollId format
    validate,             // Apply validation
    votingSessionController.getAggregatedResults // Call the new controller function
); // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/aggregated-results

module.exports = router;