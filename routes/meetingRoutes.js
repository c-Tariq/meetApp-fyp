const express = require('express');
const router = express.Router({ mergeParams: true }); // Access :spaceId from parent
const meetingController = require('../controllers/meetingController');
const { ensureAuthenticated } = require('../middleware/auth');
const topicRoutes = require('./topicRoutes');
const attendanceRoutes = require('./attendanceRoutes');

// Protected routes
router.post('/', ensureAuthenticated, meetingController.createMeeting);    // POST /spaces/:spaceId/meetings
router.get('/', ensureAuthenticated, meetingController.getSpaceMeetings);  // GET /spaces/:spaceId/meetings
router.get('/:meetingId', ensureAuthenticated, meetingController.getMeeting); // GET /spaces/:spaceId/meetings/:meetingId

// Special case: Search meetings (not tied to a specific space)
router.get('/search', ensureAuthenticated, meetingController.searchMeetings); // GET /spaces/:spaceId/meetings/search

// Mount sub-routers
router.use('/:meetingId/topics', topicRoutes);        // /spaces/:spaceId/meetings/:meetingId/topics
router.use('/:meetingId/attendance', attendanceRoutes); // /spaces/:spaceId/meetings/:meetingId/attendance

module.exports = router;