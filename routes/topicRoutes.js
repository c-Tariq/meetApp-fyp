const express = require('express');
const router = express.Router({ mergeParams: true }); // Access :spaceId and :meetingId from parents
const topicsController = require('../controllers/topicsController');
const { ensureAuthenticated } = require('../middleware/auth');
const commentRoutes = require('./commentRoutes');
const documentRoutes = require('./documentRoutes');
const votingSessionRoutes = require('./votingSessionRoutes');

// Protected routes
router.post('/', ensureAuthenticated, topicsController.addTopic);          // POST /spaces/:spaceId/meetings/:meetingId/topics
router.get('/', ensureAuthenticated, topicsController.getMeetingTopics);   // GET /spaces/:spaceId/meetings/:meetingId/topics
router.get('/:topicId', ensureAuthenticated, topicsController.getTopic);   // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId

// Mount sub-routers
router.use('/:topicId/comments', commentRoutes);      // /spaces/:spaceId/meetings/:meetingId/topics/:topicId/comments
router.use('/:topicId/documents', documentRoutes);    // /spaces/:spaceId/meetings/:meetingId/topics/:topicId/documents
router.use('/:topicId/polls', votingSessionRoutes);   // /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls

module.exports = router;