const multer = require('multer');
// documentRoutes.js file uses upload.single('file'), which requires a file upload middleware (e.g., multer).
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'D:/college-level-10/fyp/meetapp2/uploads/'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });
module.exports = upload;