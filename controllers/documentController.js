const { addDocument, getDocumentsByTopicId } = require('../models/document');

// Maximum file size allowed: 5MB (in bytes)
const MAX_FILE_SIZE = 5 * 1024 * 1024;


exports.uploadDocument = async (req, res) => {
  try {
    const { topicId } = req.params;
    // File details provided by multer middleware
    const file = req.file;

    // Validate that a file was uploaded
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ message: 'File size exceeds the limit of 5MB' });
    }

    const newDocument = await addDocument(
      topicId,
      file.originalname, 
      file.mimetype,    
      file.size        
    );
    res.status(201).json(newDocument);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * Retrieves all documents associated with a specific topic ID
 */
exports.getTopicDocuments = async (req, res) => {
  try {
    const { topicId } = req.params;

    const documents = await getDocumentsByTopicId(topicId);

    res.json(documents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};