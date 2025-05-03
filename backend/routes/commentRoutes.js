const express = require('express');
const commentController = require('../controllers/commentController');
const { ensureAuthenticated } = require('../middleware/auth');
const { checkSpaceMembership } = require('../middleware/checkMembership');
const { param, body, validationResult } = require('express-validator');

// Validation middleware helper
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Validation rules
const meetingIdValidation = [param('meetingId', 'Valid Meeting ID is required').isInt({ min: 1 })];
const commentBodyValidation = [
    body('comment_text', 'Comment text cannot be empty').notEmpty().trim()
];

// Important: mergeParams allows accessing :spaceId and :meetingId from parent router
const router = express.Router({ mergeParams: true }); 

// Remove meeting-level comment routes as comments are per-topic
/*
// GET /api/spaces/:spaceId/meetings/:meetingId/comments
router.get('/', 
    ensureAuthenticated, 
    meetingIdValidation, 
    validate, 
    checkSpaceMembership, // Check membership *after* validating meetingId
    commentController.getMeetingComments
);

// POST /api/spaces/:spaceId/meetings/:meetingId/comments
router.post('/', 
    ensureAuthenticated, 
    meetingIdValidation, 
    commentBodyValidation, // Validate request body
    validate, 
    checkSpaceMembership, 
    commentController.addMeetingComment
);
*/

// --- Topic Comment Routes --- 
// These routes are mounted under /api/spaces/:spaceId/meetings/:meetingId/topics/:topicId/comments

// Validation for comment body (ensure it uses 'content')
const topicCommentBodyValidation = [
    body('content', 'Comment content cannot be empty').notEmpty().isString().trim()
];

// GET / (relative to topic) - Fetch comments for the topic
router.get('/', 
    ensureAuthenticated, 
    checkSpaceMembership, // Check membership based on parent topicId/meetingId/spaceId
    commentController.getCommentsByTopic // Corrected: Use getCommentsByTopic instead of getTopicComments
);

// POST / (relative to topic) - Add a comment to the topic
router.post('/', 
    ensureAuthenticated, 
    checkSpaceMembership, 
    topicCommentBodyValidation, // Validate 'content' field
    validate, 
    commentController.addComment // Use the correct controller for adding topic comments
);

// Note: Routes for GET/POST comments for a specific *topic* 
// should exist within topicRoutes.js (or similar)

module.exports = router;