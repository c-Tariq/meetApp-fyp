const express = require('express');
const router = express.Router({ mergeParams: true }); // Access :spaceId, :meetingId
const attendanceController = require('../controllers/attendanceController');
const { ensureAuthenticated } = require('../middleware/auth');
const { checkSpaceMembership } = require('../middleware/checkMembership');
const { param, validationResult } = require('express-validator'); // Import directly

// Validation middleware helper (copied from meetingRoutes.js)
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Validation rules (copied from meetingRoutes.js)
const meetingIdValidation = [param('meetingId', 'Valid Meeting ID is required').isInt({ min: 1 })];

// Protected routes
router.post('/', ensureAuthenticated, attendanceController.markAttendance);       // POST /spaces/:spaceId/meetings/:meetingId/attendance
router.get('/', 
    ensureAuthenticated, 
    meetingIdValidation, // Use the defined validation rule
    validate,            // Use the defined helper
    checkSpaceMembership,// Ensure user is member of the space containing the meeting
    attendanceController.getMeetingAttendance
);

module.exports = router;