const express = require("express");
const router = express.Router({ mergeParams: true });
const topicsController = require("../controllers/topicsController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const { checkSpaceMembership } = require("../middleware/authMiddleware");
const { body, param, validationResult } = require("express-validator");
const commentRoutes = require("./commentRoutes");
const documentRoutes = require("./documentRoutes");
const votingSessionRoutes = require("./votingSessionRoutes");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation Rules

// POST aoi/spaces/:spaceId/meetings/:meetingId/topics
router.post("/", ensureAuthenticated, topicsController.addTopic);

// GET api/spaces/:spaceId/meetings/:meetingId/topics
router.get("/", ensureAuthenticated, topicsController.getMeetingTopics);

// GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId
router.get("/:topicId", ensureAuthenticated, topicsController.getTopic);

// PATCH /spaces/:spaceId/meetings/:meetingId/topics/:topicId
router.patch("/:topicId", ensureAuthenticated, topicsController.updateTopic);

// DELETE /spaces/:spaceId/meetings/:meetingId/topics/:topicId
router.delete("/:topicId", ensureAuthenticated, topicsController.deleteTopic);

// Mount sub-routers
router.use(
  "/:topicId/comments",
  [param("topicId", "Valid Topic ID is required").isInt({ min: 1 })],
  validate,
  commentRoutes
); // /spaces/:spaceId/meetings/:meetingId/topics/:topicId/comments

router.use(
  "/:topicId/documents",
  [param("topicId", "Valid Topic ID is required").isInt({ min: 1 })],
  validate,
  documentRoutes
); // /spaces/:spaceId/meetings/:meetingId/topics/:topicId/documents

router.use(
  "/:topicId/polls",
  [param("topicId", "Valid Topic ID is required").isInt({ min: 1 })],
  validate,
  votingSessionRoutes
); // /spaces/:spaceId/meetings/:meetingId/topics/:topicId/polls

module.exports = router;
