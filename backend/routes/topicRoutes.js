const express = require('express');
const router = express.Router({ mergeParams: true }); // Access :spaceId and :meetingId from parents
const topicsController = require('../controllers/topicsController');
const { ensureAuthenticated } = require('../middleware/auth');
const { checkSpaceMembership } = require('../middleware/checkMembership'); // Import the new middleware
const { body, param, validationResult } = require('express-validator'); // Import validators
const commentRoutes = require('./commentRoutes');
const documentRoutes = require('./documentRoutes');
const votingSessionRoutes = require('./votingSessionRoutes');

// Validation middleware helper
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Validation Rules
const topicIdValidation = [param('topicId', 'Valid Topic ID is required').isInt({ min: 1 })];
const topicBodyValidation = [body('topic_title', 'Topic title is required and must be a non-empty string').notEmpty().isString().trim()];

// Protected routes with validation and authorization
router.post('/', 
    ensureAuthenticated, 
    checkSpaceMembership, // Check if user is member of the space derived from meetingId
    [
        body('topic_title', 'Topic title is required and must be a non-empty string').notEmpty().isString().trim()
    ],
    validate,
    topicsController.addTopic
);          // POST /spaces/:spaceId/meetings/:meetingId/topics

router.get('/', 
    ensureAuthenticated, 
    [
        param('meetingId', 'Valid Meeting ID is required').isInt({ min: 1 })
    ],
    validate, 
    checkSpaceMembership, // Check if user is member of the space derived from meetingId
    topicsController.getMeetingTopics
);   // GET /spaces/:spaceId/meetings/:meetingId/topics

router.get('/:topicId', 
    ensureAuthenticated, 
    [
        param('topicId', 'Valid Topic ID is required').isInt({ min: 1 })
    ],
    validate,
    checkSpaceMembership, // Check if user is member of the space derived from topicId
    topicsController.getTopic
);   // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId

// PATCH /spaces/:spaceId/meetings/:meetingId/topics/:topicId
router.patch('/:topicId',
    ensureAuthenticated,
    topicIdValidation,
    topicBodyValidation, // Validate new title in body
    validate,
    checkSpaceMembership, // Check membership before controller (controller also re-checks admin)
    topicsController.updateTopic
);

// DELETE /spaces/:spaceId/meetings/:meetingId/topics/:topicId
router.delete('/:topicId',
    ensureAuthenticated,
    topicIdValidation,
    validate,
    checkSpaceMembership, // Check membership before controller (controller also re-checks admin)
    topicsController.deleteTopic
);

// Mount sub-routers
// Middleware applied here will run *before* the sub-router's middleware
// We already apply checkSpaceMembership within the sub-routers themselves where needed
router.use('/:topicId/comments', [
    param('topicId', 'Valid Topic ID is required').isInt({ min: 1 })
], validate, commentRoutes);      // /spaces/:spaceId/meetings/:meetingId/topics/:topicId/comments

router.use('/:topicId/documents', [
    param('topicId', 'Valid Topic ID is required').isInt({ min: 1 })
], validate, documentRoutes);    // /spaces/:spaceId/meetings/:meetingId/topics/:topicId/documents

router.use('/:topicId/polls', [
    param('topicId', 'Valid Topic ID is required').isInt({ min: 1 })
], validate, votingSessionRoutes);   // /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls

module.exports = router;