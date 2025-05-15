const express = require("express");
const router = express.Router({ mergeParams: true });
const aiProcessingController = require("../controllers/aiProcessingController");
const recordingController = require("../controllers/recordingController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const { checkSpaceMembership } = require("../middleware/authMiddleware");
const { param, body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

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
  transcriptBodyValidation,
  validate,
  checkSpaceMembership,
  aiProcessingController.processTranscript
);

// POST route to upload RECORDING and trigger processing
// Full path: /api/spaces/:spaceId/meetings/:meetingId/ai/recording
router.post(
  "/recording",
  ensureAuthenticated,
  checkSpaceMembership,
  recordingController.recordingUploadMiddleware,
  recordingController.uploadAndProcessRecording
);

module.exports = router;
