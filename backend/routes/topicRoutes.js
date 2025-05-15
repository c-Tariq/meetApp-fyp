const express = require('express');
const router = express.Router({ mergeParams: true }); 
const topicsController = require('../controllers/topicsController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { checkSpaceMembership } = require('../middleware/authMiddleware');
const { body, param, validationResult } = require('express-validator'); 
const commentRoutes = require('./commentRoutes');
const documentRoutes = require('./documentRoutes');
const votingSessionRoutes = require('./votingSessionRoutes');

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

// POST /spaces/:spaceId/meetings/:meetingId/topics
router.post('/', 
    ensureAuthenticated, 
    checkSpaceMembership,
    [
        body('topic_title', 'Topic title is required and must be a non-empty string').notEmpty().isString().trim()
    ],
    validate,
    topicsController.addTopic
);          

// GET /spaces/:spaceId/meetings/:meetingId/topics
router.get('/', 
    ensureAuthenticated, 
    [
        param('meetingId', 'Valid Meeting ID is required').isInt({ min: 1 })
    ],
    validate, 
    checkSpaceMembership, 
    topicsController.getMeetingTopics
);   

// GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId
router.get('/:topicId', 
    ensureAuthenticated, 
    [
        param('topicId', 'Valid Topic ID is required').isInt({ min: 1 })
    ],
    validate,
    checkSpaceMembership, 
    topicsController.getTopic
);   

// PATCH /spaces/:spaceId/meetings/:meetingId/topics/:topicId
router.patch('/:topicId',
    ensureAuthenticated,
    topicIdValidation,
    topicBodyValidation, 
    validate,
    checkSpaceMembership, 
    topicsController.updateTopic
);

// DELETE /spaces/:spaceId/meetings/:meetingId/topics/:topicId
router.delete('/:topicId',
    ensureAuthenticated,
    topicIdValidation,
    validate,
    checkSpaceMembership, 
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