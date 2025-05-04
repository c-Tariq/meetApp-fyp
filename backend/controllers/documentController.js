const { addDocument, getDocumentsByTopicId, getDocumentById, deleteDocumentById } = require('../models/document');
const path = require('path');
const fs = require('fs');
const { isSpaceAdmin } = require('../models/space');

// Maximum file size allowed: 5MB (in bytes)
// Moved file size check potentially to multer config or keep here
const MAX_FILE_SIZE = 5 * 1024 * 1024;


exports.uploadDocument = async (req, res) => {
  // Authorization handled by checkSpaceMembership middleware
  // File presence check done by multer
  try {
    const { topicId } = req.params;
    const file = req.file;

    // Keep file validation that multer might not cover (or re-check)
    if (!file) {
      // This might occur if multer's fileFilter rejects the file
      return res.status(400).json({ message: 'No file uploaded or file type rejected' });
    }

    // Keep explicit size check, good practice
    if (file.size > MAX_FILE_SIZE) {
      // Ensure multer error handler isn't also sending a response
      return res.status(400).json({ message: 'File size exceeds the limit of 5MB' });
    }

    // checkSpaceMembership confirmed user is member, so they can upload
    const newDocument = await addDocument(
      topicId,
      file.originalname, 
      file.mimetype,    
      file.size,
      file.filename
    );
    res.status(201).json(newDocument);
  } catch (err) {
    console.error('Error in uploadDocument controller:', err);
    // Consider deleting the uploaded file if DB insert fails
    // Requires access to `fs` module and the file path
    res.status(500).json({ message: 'Server Error uploading document' }); // Use JSON
  }
};

/**
 * Retrieves all documents associated with a specific topic ID
 */
exports.getTopicDocuments = async (req, res) => {
  // Validation (topicId format) handled by parent router (topicRoutes)
  // Authorization handled by checkSpaceMembership middleware
  try {
    const { topicId } = req.params;

    // checkSpaceMembership confirmed user is member of the space containing this topic
    const documents = await getDocumentsByTopicId(topicId);

    res.json(documents);
  } catch (err) {
    console.error('Error in getTopicDocuments controller:', err);
    res.status(500).json({ message: 'Server Error fetching documents' }); // Use JSON
  }
};

exports.downloadDocument = async (req, res) => {
  // Validation (documentId format) handled by routes
  // Authorization handled by checkSpaceMembership middleware (applied in routes)
  try {
    const { documentId } = req.params;
    
    // 1. Get document metadata from DB
    const document = await getDocumentById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found in database.' });
    }

    // 2. Construct the full path to the stored file
    // Assumes 'uploads/documents' directory is relative to the project root
    const filePath = path.join(__dirname, '..', 'uploads', 'documents', document.stored_file_name);

    // 3. Check if file exists on disk
    if (!fs.existsSync(filePath)) {
        console.error(`File not found on disk: ${filePath}`);
        // Optionally: Clean up DB record if file is missing? Or just report error.
        return res.status(404).json({ message: 'File not found on server.' });
    }

    // 4. Send the file for download
    // Use the original filename for the download prompt
    res.download(filePath, document.file_name, (err) => {
        if (err) {
            // Handle errors that might occur during streaming/sending the file
            // Avoid sending another response if headers already sent
            if (!res.headersSent) {
                 console.error('Error sending file:', err);
                 res.status(500).json({ message: 'Error downloading file.' });
            } else {
                 console.error('Error after headers sent during file download:', err);
            }
        }
    });

  } catch (err) {
    console.error('Error in downloadDocument controller:', err);
    if (!res.headersSent) { // Avoid error if res.download already sent headers
         res.status(500).json({ message: 'Server Error downloading document' });
    }
  }
};

exports.deleteDocument = async (req, res) => {
  // Validation (documentId format) handled by routes
  // Authorization needs space admin check
  try {
    const { spaceId, documentId } = req.params; // Ensure spaceId is available from params
    const loggedInUserId = req.user.user_id; // Get logged-in user ID

    // --- Authorization Check: Is user the space admin? ---
    const isAdmin = await isSpaceAdmin(spaceId, loggedInUserId);
    if (!isAdmin) {
      return res.status(403).json({ 
        message: "Forbidden: Only the space administrator can delete documents." 
      });
    }
    // --- End Authorization Check ---

    // 1. Get document metadata from DB to find the stored filename
    const document = await getDocumentById(documentId);

    if (!document) {
      // If document doesn't exist in DB, no file to delete either
      return res.status(404).json({ message: 'Document not found.' });
    }

    // 2. Construct the full path to the stored file
    const filePath = path.join(__dirname, '..', 'uploads', 'documents', document.stored_file_name);

    // 3. Attempt to delete the file from the filesystem
    try {
      if (fs.existsSync(filePath)) { // Check if file exists before trying to delete
          await fs.promises.unlink(filePath); // Use async unlink
          console.log(`Deleted file: ${filePath}`);
      } else {
          console.warn(`File not found for deletion, but proceeding to delete DB record: ${filePath}`);
      }
    } catch (fileErr) {
        // Log the error but proceed to delete DB record anyway, 
        // as the primary goal is removing the reference.
        console.error(`Error deleting file from disk: ${filePath}`, fileErr);
        // Optionally, decide if this error should prevent DB deletion (e.g., return 500)
        // For now, we'll proceed.
    }

    // 4. Delete the document record from the database
    const deletedRowCount = await deleteDocumentById(documentId);

    if (deletedRowCount === 0) {
      // This case might happen in a race condition if called twice, 
      // or if the document was already deleted after the initial check.
      console.warn(`Document record already deleted or not found during delete operation: ID ${documentId}`);
      // Still return success as the desired state (no document) is achieved.
    }

    res.status(204).send(); // Success, No Content

  } catch (err) {
    console.error('Error in deleteDocument controller:', err);
    res.status(500).json({ message: 'Server Error deleting document' });
  }
};