const express = require('express');
const router = express.Router({ mergeParams: true }); // Access :spaceId, :meetingId, :topicId
const votingSessionController = require('../controllers/votingSessionController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { checkSpaceMembership } = require('../middleware/authMiddleware');
const { param, body, validationResult } = require('express-validator'); // Import validators

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const pollIdValidation = [param('pollId', 'Valid Poll ID is required').isInt({ min: 1 })];

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

// Protected routes 
// POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls
router.post('/', 
    ensureAuthenticated, 
    checkSpaceMembership, 
    createPollValidation,
    validate, 
    votingSessionController.createPoll
); 

router.get('/',
    ensureAuthenticated,
    checkSpaceMembership, 
    votingSessionController.getPollsForTopic 
);

// POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls
router.get('/:pollId', 
    ensureAuthenticated, 
    checkSpaceMembership, 
    pollIdValidation,
    validate, 
    votingSessionController.getPoll
); 

// POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls
router.get('/:pollId/options',
    ensureAuthenticated,
    checkSpaceMembership, 
    pollIdValidation,     
    validate,
    votingSessionController.getPollOptions
); 

// POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/options
router.post('/:pollId/options', 
    ensureAuthenticated, 
    checkSpaceMembership, 
    pollIdValidation,
    addOptionValidation,
    validate,
    votingSessionController.addPollOption
); 

// POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/vote
router.post('/:pollId/vote', 
    ensureAuthenticated, 
    checkSpaceMembership, 
    pollIdValidation,
    castVoteValidation,
    validate,
    votingSessionController.castVote
); 

// GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/results
router.get('/:pollId/results', 
    ensureAuthenticated, 
    checkSpaceMembership, 
    pollIdValidation,
    validate,
    votingSessionController.getPollResults
); 

// GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/vote-status
router.get('/:pollId/vote-status', 
    ensureAuthenticated, 
    checkSpaceMembership, 
    pollIdValidation,
    validate,
    votingSessionController.checkUserVoteStatus
); 

// GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/aggregated-results
router.get('/:pollId/aggregated-results', 
    ensureAuthenticated, 
    checkSpaceMembership, 
    pollIdValidation,     
    validate,             
    votingSessionController.getAggregatedResults 
); 

// DELETE /:pollId 
// DELETE /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId
router.delete('/:pollId', 
    ensureAuthenticated, 
    pollIdValidation, 
    validate, 
    votingSessionController.deletePoll 
); 

// DELETE /:pollId/options/:optionId 
// DELETE /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls/:pollId/options/:optionId
router.delete('/:pollId/options/:optionId', 
    ensureAuthenticated, 
    [ 
        param('pollId', 'Valid Poll ID is required').isInt({ min: 1 }),
        param('optionId', 'Valid Option ID is required').isInt({ min: 1 })
    ], 
    validate, 
    votingSessionController.deletePollOption 
); 

module.exports = router;