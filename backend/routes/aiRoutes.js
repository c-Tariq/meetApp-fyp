const express = require("express");
// Merge params to access :meetingId from the parent router (meetingRoutes)
const router = express.Router({ mergeParams: true }); 
const aiProcessingController = require("../controllers/aiProcessingController");
const recordingController = require("../controllers/recordingController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const { checkSpaceMembership } = require("../middleware/authMiddleware");
const { param, body, validationResult } = require("express-validator");

// Validation middleware helper (copied from meetingRoutes for now)
// TODO: Consider moving validation logic to a dedicated middleware/util file
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules (copied from meetingRoutes for now)
const meetingIdValidation = [
  param("meetingId", "Valid Meeting ID is required").isInt({ min: 1 }),
];
const transcriptBodyValidation = [
  body("message", "Transcript text (message) is required in the body")
    .notEmpty()
    .isString(),
];

// POST route to process transcript for a specific meeting
// Full path: /api/spaces/:spaceId/meetings/:meetingId/ai/process-transcript
router.post(
  "/process-transcript",
  ensureAuthenticated,
  // meetingIdValidation is not needed here as meetingId comes from merged params
  transcriptBodyValidation, // Validate body has the transcript text
  validate,
  checkSpaceMembership, // User must be member of the space containing the meeting
  aiProcessingController.processTranscript // Use the new controller
);

// POST route to upload RECORDING and trigger processing
// Full path: /api/spaces/:spaceId/meetings/:meetingId/ai/recording
router.post(
  "/recording",
  ensureAuthenticated,
  // meetingIdValidation is not needed here as meetingId comes from merged params
  // validate is not strictly needed here unless more params are added
  checkSpaceMembership, // Check membership *before* multer processes file
  recordingController.recordingUploadMiddleware, // Use middleware exported from controller
  recordingController.uploadAndProcessRecording // Use the recording controller logic
);

module.exports = router; 