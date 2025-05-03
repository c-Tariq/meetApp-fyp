const multer = require('multer');
const fs = require('fs');
const path = require('path');
// documentRoutes.js file uses upload.single('file'), which requires a file upload middleware (e.g., multer).

const uploadDir = 'uploads'; // Relative path

// Ensure the upload directory exists
fs.mkdirSync(path.join(__dirname, '..', uploadDir), { recursive: true }); // Use path.join for cross-platform compatibility

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Construct absolute path relative to the project root (assuming upload.js is in middleware)
    const destPath = path.join(__dirname, '..', uploadDir);
    cb(null, destPath); 
  },
  filename: (req, file, cb) => {
    // Keep the timestamped filename logic
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const storedFileName = uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'); // Replace spaces for safety
    cb(null, storedFileName);
  },
});

const upload = multer({ storage });

module.exports = upload;