const express = require("express");
const router = express.Router({ mergeParams: true });
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const attendanceController = require("../controllers/attendanceController");
const { checkSpaceMembership } = require("../middleware/authMiddleware");
const { param, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST api/spaces/:spaceId/meetings/:meetingId/attendance
router.post("/", ensureAuthenticated, attendanceController.markAttendance);
router.get(
  "/",
  ensureAuthenticated,
  validate,
  checkSpaceMembership,
  attendanceController.getMeetingAttendance
);

module.exports = router;
