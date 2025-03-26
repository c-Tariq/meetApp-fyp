const express = require('express');
const router = express.Router({ mergeParams: true }); // Access :spaceId, :meetingId, :topicId
const documentController = require('../controllers/documentController');
const { ensureAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protected routes
router.post('/', ensureAuthenticated, upload.single('file'), documentController.uploadDocument); // POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/documents
router.get('/', ensureAuthenticated, documentController.getTopicDocuments); // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/documents

module.exports = router;