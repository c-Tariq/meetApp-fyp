const express = require("express");
const router = express.Router({ mergeParams: true });
const meetingController = require("../controllers/meetingController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const topicRoutes = require("./topicRoutes");
const attendanceRoutes = require("./attendanceRoutes");
const commentRoutes = require("./commentRoutes");
const { checkSpaceMembership } = require("../middleware/authMiddleware");
const { param, body, validationResult } = require("express-validator");
const aiRoutes = require("./aiRoutes");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

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

router.post("/", ensureAuthenticated, meetingController.createMeeting); // POST api/spaces/:spaceId/meetings
router.get("/", ensureAuthenticated, meetingController.getSpaceMeetings); // GET api/spaces/:spaceId/meetings
router.get("/:meetingId", ensureAuthenticated, meetingController.getMeeting); // GET api/spaces/:spaceId/meetings/:meetingId

router.get("/search", ensureAuthenticated, meetingController.searchMeetings); // GET api/spaces/:spaceId/meetings/search

router.use("/:meetingId/topics", topicRoutes); // api/spaces/:spaceId/meetings/:meetingId/topics
router.use("/:meetingId/attendance", attendanceRoutes); // api/spaces/:spaceId/meetings/:meetingId/attendance
router.use("/:meetingId/comments", commentRoutes);
router.use("/:meetingId/ai", aiRoutes);

router.patch(
  "/:meetingId/status",
  ensureAuthenticated,
  meetingController.updateMeetingStatus
); // PATCH api/spaces/:spaceId/meetings/:meetingId/status

router.get(
  "/",
  ensureAuthenticated,
  checkSpaceMembership,
  meetingController.getSpaceMeetings
); // GET api/spaces/:spaceId/meetings

router.post(
  "/",
  ensureAuthenticated,
  checkSpaceMembership,
  createMeetingValidation,
  validate,
  meetingController.createMeeting
); // POST api/spaces/:spaceId/meetings

router.get(
  "/:meetingId",
  ensureAuthenticated,
  validate,
  checkSpaceMembership,
  meetingController.getMeeting
); // GET api/spaces/:spaceId/meetings/:meetingId

router.put(
  "/:meetingId/status",
  ensureAuthenticated,
  updateStatusValidation,
  validate,
  checkSpaceMembership,
  meetingController.updateMeetingStatus
); // PUT api/spaces/:spaceId/meetings/:meetingId/status

router.patch(
  "/:meetingId",
  ensureAuthenticated,
  validate,
  checkSpaceMembership,
  meetingController.updateMeetingDetails
); // PATCH api/spaces/:spaceId/meetings/:meetingId

router.delete(
  "/:meetingId",
  ensureAuthenticated,
  validate,
  checkSpaceMembership,
  meetingController.deleteMeeting
); // DELETE api/spaces/:spaceId/meetings/:meetingId

module.exports = router;
