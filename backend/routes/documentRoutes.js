const express = require("express");
const router = express.Router({ mergeParams: true });
const documentController = require("../controllers/documentController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const { checkSpaceMembership } = require("../middleware/authMiddleware");
const { param, validationResult } = require("express-validator");

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const baseUploadDir = path.join(__dirname, "..", "uploads");
const documentDir = path.join(baseUploadDir, "documents");

fs.mkdirSync(documentDir, { recursive: true });

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const storedFileName =
      uniqueSuffix + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, storedFileName);
  },
});

const documentUploadMiddleware = multer({ storage: documentStorage }).single(
  "file"
);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const documentIdValidation = [
  param("documentId", "Valid Document ID is required").isInt({ min: 1 }),
];

router.post(
  "/",
  ensureAuthenticated,
  checkSpaceMembership,
  documentUploadMiddleware,
  documentController.uploadDocument
); // POST api/spaces/:spaceId/meetings/:meetingId/topics/:topicId/documents

router.get(
  "/",
  ensureAuthenticated,
  checkSpaceMembership,
  documentController.getTopicDocuments
); // GET api/spaces/:spaceId/meetings/:meetingId/topics/:topicId/documents

router.get(
  "/:documentId",
  ensureAuthenticated,
  documentIdValidation,
  validate,
  checkSpaceMembership,
  documentController.downloadDocument
); // GET api/spaces/:spaceId/meetings/:meetingId/topics/:topicId/documents/:documentId

router.delete(
  "/:documentId",
  ensureAuthenticated,
  documentIdValidation,
  validate,
  checkSpaceMembership,
  documentController.deleteDocument
); // DELETE api/spaces/:spaceId/meetings/:meetingId/topics/:topicId/documents/:documentId

module.exports = router;
