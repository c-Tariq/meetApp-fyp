const express = require("express");
const router = express.Router({ mergeParams: true }); // Access :spaceId from parent
const meetingController = require("../controllers/meetingController");
// const recordingController = require("../controllers/recordingController"); // No longer used here
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const topicRoutes = require("./topicRoutes");
const attendanceRoutes = require("./attendanceRoutes");
const commentRoutes = require("./commentRoutes"); // Import comment routes
const { checkSpaceMembership } = require("../middleware/authMiddleware"); // Updated path
const { param, body, validationResult } = require("express-validator"); // Import validators
const aiRoutes = require("./aiRoutes"); // Import the new AI routes

// Validation middleware helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules
const meetingIdValidation = [
  param("meetingId", "Valid Meeting ID is required").isInt({ min: 1 }),
];
const createMeetingValidation = [
  body("title", "Title is required").notEmpty().isString().trim(),
  body("scheduled_time", "Scheduled time must be a valid ISO 8601 date string")
    .isISO8601()
    .toDate(),
];
const updateStatusValidation = [
  body("status", "Status is required and must be valid").isIn([
    "Upcoming",
    "In Progress",
    "Concluded",
  ]),
];

// Validation for general meeting update (PATCH)
// Make fields optional and add specific validation
const updateMeetingDetailsValidation = [
  body("title")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty if provided"),
  body("scheduled_time")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage(
      "Scheduled time must be a valid ISO 8601 date string if provided"
    ),
  // Add validation for other updatable fields if necessary
];

// Protected routes
router.post("/", ensureAuthenticated, meetingController.createMeeting); // POST /spaces/:spaceId/meetings
router.get("/", ensureAuthenticated, meetingController.getSpaceMeetings); // GET /spaces/:spaceId/meetings
router.get("/:meetingId", ensureAuthenticated, meetingController.getMeeting); // GET /spaces/:spaceId/meetings/:meetingId

// Special case: Search meetings (not tied to a specific space)
router.get("/search", ensureAuthenticated, meetingController.searchMeetings); // GET /spaces/:spaceId/meetings/search

// Mount sub-routers
router.use("/:meetingId/topics", topicRoutes); // /spaces/:spaceId/meetings/:meetingId/topics
router.use("/:meetingId/attendance", attendanceRoutes); // /spaces/:spaceId/meetings/:meetingId/attendance
router.use("/:meetingId/comments", commentRoutes); // Mount comment routes
router.use("/:meetingId/ai", aiRoutes); // Mount AI routes

router.patch(
  "/:meetingId/status",
  ensureAuthenticated,
  meetingController.updateMeetingStatus
); // PATCH /spaces/:spaceId/meetings/:meetingId/status

// Routes requiring authentication and potentially authorization

// GET meetings for a specific space (Authorization added)
router.get(
  "/",
  ensureAuthenticated,
  checkSpaceMembership, // User must be member of the space
  meetingController.getSpaceMeetings
); // GET /spaces/:spaceId/meetings

// POST create a new meeting in a specific space (Admin check is inside controller)
router.post(
  "/",
  ensureAuthenticated,
  checkSpaceMembership, // Ensure user is member before checking admin
  createMeetingValidation,
  validate,
  meetingController.createMeeting
); // POST /spaces/:spaceId/meetings

// GET a specific meeting (Authorization added)
router.get(
  "/:meetingId",
  ensureAuthenticated,
  meetingIdValidation,
  validate,
  checkSpaceMembership, // User must be member of the space containing the meeting
  meetingController.getMeeting
); // GET /spaces/:spaceId/meetings/:meetingId

// PUT update meeting status (Admin check is inside controller)
router.put(
  "/:meetingId/status",
  ensureAuthenticated,
  meetingIdValidation,
  updateStatusValidation,
  validate,
  checkSpaceMembership, // Ensure user is member before checking admin
  meetingController.updateMeetingStatus
); // PUT /spaces/:spaceId/meetings/:meetingId/status

// POST route to upload RECORDING and trigger processing
/* MOVED to aiRoutes.js
router.post(
  "/:meetingId/recording",
  ensureAuthenticated,
  meetingIdValidation,
  validate, // Validate meetingId first
  checkSpaceMembership, // Check membership *before* multer processes file
  recordingUpload.single("recording"), // Use multer middleware for single file named 'recording'
  recordingController.uploadAndProcessRecording // Call the new controller function
); // POST /api/spaces/:spaceId/meetings/:meetingId/recording (mounted via spaceRoutes.js
*/

// PATCH route for general meeting updates (e.g., title, time)
router.patch(
  "/:meetingId",
  ensureAuthenticated,
  meetingIdValidation, // Validate meetingId param
  updateMeetingDetailsValidation, // Validate optional body fields
  validate, // Apply validation checks
  checkSpaceMembership, // Ensure user is member (adjust if only admin should edit)
  meetingController.updateMeetingDetails // New controller function
); // PATCH /spaces/:spaceId/meetings/:meetingId

// DELETE /:meetingId - Delete a specific meeting
router.delete(
  "/:meetingId",
  ensureAuthenticated,
  meetingIdValidation, // Validate meetingId param
  validate,
  checkSpaceMembership, // Ensure user is member (authorization check done in controller)
  meetingController.deleteMeeting // Use the new delete controller function
); // DELETE /spaces/:spaceId/meetings/:meetingId

module.exports = router;
