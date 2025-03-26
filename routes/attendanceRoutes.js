const express = require('express');
const router = express.Router({ mergeParams: true }); // Access :spaceId, :meetingId
const attendanceController = require('../controllers/attendanceController');
const { ensureAuthenticated } = require('../middleware/auth');

// Protected routes
router.post('/', ensureAuthenticated, attendanceController.markAttendance);       // POST /spaces/:spaceId/meetings/:meetingId/attendance
router.get('/', ensureAuthenticated, attendanceController.getAttendanceByMeetingId); // GET /spaces/:spaceId/meetings/:meetingId/attendance

module.exports = router;