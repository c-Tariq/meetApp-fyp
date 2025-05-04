const express = require('express');
const router = express.Router({ mergeParams: true }); // Access :spaceId, :meetingId, :topicId
const documentController = require('../controllers/documentController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { checkSpaceMembership } = require('../middleware/authMiddleware');
// const upload = require('../middleware/upload'); // Import removed
const { param, validationResult } = require('express-validator'); // Import validators

// Add imports needed for multer setup
const multer = require('multer');
const fs = require('fs'); 
const path = require('path');

// --- Multer Configuration for Document Uploads (Moved from middleware) ---
const baseUploadDir = path.join(__dirname, '..', 'uploads'); // Base uploads directory path
const documentDir = path.join(baseUploadDir, 'documents');     // Path for documents

// Ensure the documents upload directory exists
fs.mkdirSync(documentDir, { recursive: true }); 

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentDir); // Save documents to the documents subdirectory
  },
  filename: (req, file, cb) => {
    // Keep the timestamped filename logic
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const storedFileName = uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'); // Replace spaces for safety
    cb(null, storedFileName);
  },
});

const documentUploadMiddleware = multer({ storage: documentStorage }).single('file');
// --- End Multer Configuration ---

// Validation middleware helper
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Validation rules
const documentIdValidation = [param('documentId', 'Valid Document ID is required').isInt({ min: 1 })];

// Protected routes with authorization
router.post('/', 
    ensureAuthenticated, 
    checkSpaceMembership, // Check if user is member of the space derived from topicId
    // upload.single('file'), // Use the middleware defined above
    documentUploadMiddleware, // Use the middleware defined in this file
    documentController.uploadDocument
); // POST /spaces/:spaceId/meetings/:meetingId/topics/:topicId/documents

router.get('/', 
    ensureAuthenticated, 
    checkSpaceMembership, // Check if user is member of the space derived from topicId
    documentController.getTopicDocuments
); // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/documents

// GET /:documentId - Download a specific document
router.get('/:documentId',
    ensureAuthenticated,
    documentIdValidation, // Validate documentId format
    validate, 
    checkSpaceMembership, // Ensure user is member of space containing the topic the doc belongs to
    documentController.downloadDocument
); // GET /spaces/:spaceId/meetings/:meetingId/topics/:topicId/documents/:documentId

// DELETE /:documentId - Delete a specific document
router.delete('/:documentId',
    ensureAuthenticated,
    documentIdValidation, // Validate documentId format
    validate, 
    checkSpaceMembership, // Ensure user is member of space containing the topic
    documentController.deleteDocument
); // DELETE /spaces/:spaceId/meetings/:meetingId/topics/:topicId/documents/:documentId

module.exports = router;