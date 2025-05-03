const express = require('express');
const router = express.Router({ mergeParams: true }); // Access :spaceId, :meetingId, :topicId
const documentController = require('../controllers/documentController');
const { ensureAuthenticated } = require('../middleware/auth');
const { checkSpaceMembership } = require('../middleware/checkMembership'); // Import the membership check
const upload = require('../middleware/upload');
const { param, validationResult } = require('express-validator'); // Import validators

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
    upload.single('file'), // Multer handles file presence, size, etc.
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