const express = require('express');
const router = express.Router({ mergeParams: true }); // Access :spaceId, :meetingId, :topicId
const commentController = require('../controllers/commentController');
const { ensureAuthenticated } = require('../middleware/auth');

// Protected routes
router.post('/', ensureAuthenticated, commentController.addComment);       // POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/comments
router.get('/', ensureAuthenticated, commentController.getCommentsByTopic); // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/comments

module.exports = router;