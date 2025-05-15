const express = require("express");
const commentController = require("../controllers/commentController");
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

const router = express.Router({ mergeParams: true });

const topicCommentBodyValidation = [
  body("content", "Comment content cannot be empty")
    .notEmpty()
    .isString()
    .trim(),
];

router.get(
  "/",
  ensureAuthenticated,
  checkSpaceMembership,
  commentController.getCommentsByTopic
);

router.post(
  "/",
  ensureAuthenticated,
  checkSpaceMembership,
  topicCommentBodyValidation,
  commentController.addComment
);

router.delete(
  "/:commentId",
  ensureAuthenticated,
  [param("commentId", "Valid Comment ID is required").isInt({ min: 1 })],
  validate,
  commentController.deleteComment
);

module.exports = router;
