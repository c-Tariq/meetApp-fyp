const multer = require("multer");

// Configure Multer for memory storage
const storage = multer.memoryStorage(); // Store file in memory as a Buffer

// Define file filter (optional, but good practice)
const fileFilter = (req, file, cb) => {
  console.log("ddddddddddddddddddd");
  // Accept specific video types, primarily webm from the frontend example
  if (
    file.mimetype === "video/webm" ||
    file.mimetype === "video/mp4" ||
    file.mimetype === "audio/webm"
  ) {
    cb(null, true); // Accept file
  } else {
    console.warn(`Rejected file type: ${file.mimetype}`);
    cb(
      new Error("Invalid file type. Only webm or mp4 video/audio allowed."),
      false
    ); // Reject file
  }
};

// Define limits (e.g., 500MB)
const limits = {
  fileSize: 500 * 1024 * 1024, // 500 MB limit
};

// Create Multer instance
const recordingUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

module.exports = recordingUpload;
