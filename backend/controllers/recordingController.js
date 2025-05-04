const fs = require("fs").promises; // Use promises for async file operations
// const fsSync = require("fs"); // No longer needed for sync directory creation
const path = require("path");
const os = require("os");
const ffmpeg = require("fluent-ffmpeg");
const multer = require("multer"); // Add multer import
// Import the path to the ffmpeg executable provided by the installer package
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
// Set the path for fluent-ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Removed Supabase import
// const supabase = require('../config/supabaseClient');
const transcriptionController = require("./transcriptionController"); // Import new controller
const aiModels = require("../models/aiModels"); // Import new AI models
// Need the OpenAI processing logic - let's reuse parts from meetingController
// Ideally, refactor OpenAI logic into its own service, but for now, import needed parts
const {
  isArabic,
  getSystemPrompts,
  callOpenAI,
} = require("./aiProcessingController"); // Import from new AI controller

// --- Directory Setup --- (No longer needed for video disk storage)
// const baseUploadDir = path.join(__dirname, '..', 'uploads'); 
// const videoDir = path.join(baseUploadDir, 'videos');     
// fsSync.mkdirSync(videoDir, { recursive: true }); 

// --- Multer Configuration for Recording Uploads (Using Memory Storage) ---
const memoryStorage = multer.memoryStorage(); // Use memoryStorage again

// const videoStorage = multer.diskStorage({ ... }); // Remove diskStorage config

const fileFilter = (req, file, cb) => {
  // Accept specific video/audio types
  if (
    file.mimetype === "video/webm" ||
    file.mimetype === "video/mp4" ||
    file.mimetype === "audio/webm" || // Allow audio uploads too if needed
    file.mimetype === "audio/mp4" ||
    file.mimetype === "audio/mpeg" 
  ) {
    cb(null, true); // Accept file
  } else {
    console.warn(`Rejected file type: ${file.mimetype}`);
    cb(
      new Error("Invalid file type. Only webm, mp4, mp3 video/audio allowed."),
      false
    ); // Reject file
  }
};

const limits = {
  fileSize: 500 * 1024 * 1024, // 500 MB limit (adjust as needed)
};

const recordingUploadMiddleware = multer({
  storage: memoryStorage, // Use memoryStorage
  fileFilter: fileFilter,
  limits: limits,
}).single("recording");
// --- End Multer Configuration ---

// Helper function for audio extraction - MODIFIED back to accept buffer
async function extractAudio(videoBuffer, inputFileName) { 
  // Write buffer to a temporary file first
  const tempInputPath = path.join(os.tmpdir(), `rec_in_${inputFileName}`);
  await fs.writeFile(tempInputPath, videoBuffer);
  console.log(`Temporarily saved video buffer to: ${tempInputPath}`);

  const outputFileName = `audio_out_${path.parse(inputFileName).name}_${Date.now()}.mp3`;
  const tempOutputPath = path.join(os.tmpdir(), outputFileName);

  console.log(
    `Starting audio extraction from temp file: ${tempInputPath} to: ${tempOutputPath}`
  );

  return new Promise((resolve, reject) => {
    ffmpeg(tempInputPath) // Use the temporary input path
      .noVideo() 
      .audioCodec("libmp3lame") 
      .audioBitrate("192k") 
      .output(tempOutputPath)
      .on("end", async () => {
        console.log("Audio extraction finished successfully.");
        try {
          const audioBuffer = await fs.readFile(tempOutputPath);
          console.log(
            `Read extracted audio buffer size: ${audioBuffer.length}`
          );
          // Clean up temporary AUDIO file AND temporary INPUT file
          await fs.unlink(tempInputPath); 
          await fs.unlink(tempOutputPath);
          console.log("Temporary files deleted:", tempInputPath, tempOutputPath);
          resolve({ audioBuffer, outputFileName });
        } catch (readError) {
          console.error(
            "Error reading or deleting temp audio/video files:",
            readError
          );
          reject(
            new Error("Failed to read/delete temp files after conversion.")
          );
        }
      })
      .on("error", (err) => {
        console.error("Error during ffmpeg processing:", err);
        // Attempt cleanup of both temp files even on error
        fs.unlink(tempInputPath).catch(e => console.error("Error deleting temp input on error:", e));
        fs.unlink(tempOutputPath).catch(e => console.error("Error deleting temp audio output on error:", e));
        reject(new Error(`Audio extraction failed: ${err.message}`));
      })
      .run();
  });
}

exports.uploadAndProcessRecording = async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user?.user_id;
  const file = req.file; // File object from multer (now contains buffer)

  // Basic validation
  if (!file) {
    return res.status(400).json({ message: "No recording file uploaded." });
  }
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated." });
  }

  console.log(`Processing uploaded recording in memory for meeting ${meetingId}`);
  
  let extractedAudioInfo = null;
  let transcript = null;
  let summary = null;
  let tasks = null;
  let processingError = null; // Track errors through the process

  try {
    // 1. Extract Audio from Video Buffer
    console.log(`Extracting audio for meeting ${meetingId}...`);
    // Use originalname or generate one if needed for temp file
    const inputFileName = file.originalname || `meeting_${meetingId}_${Date.now()}.webm`;
    extractedAudioInfo = await extractAudio(file.buffer, inputFileName); 
    console.log(`Audio extracted for meeting ${meetingId}.`);

    // 2. Transcribe using the controller (sends audio buffer)
    console.log(`Requesting transcription for meeting ${meetingId}...`);
    transcript = await transcriptionController.getTranscriptFromFileData(
      extractedAudioInfo.audioBuffer,
      extractedAudioInfo.outputFileName // Send the temp audio filename
    );
    console.log(
      `Transcription received for meeting ${meetingId}. Length: ${transcript?.length}`
    );

    // --- Steps after successful transcription ---
    // 3. Save transcript to DB
    try {
      await aiModels.updateMeetingTranscript(meetingId, transcript);
    } catch (dbError) {
      console.error(
        `Failed to save transcript to DB for meeting ${meetingId}:`,
        dbError
      );
      processingError = "Failed to save transcript to database."; // Log error but continue
    }

    // 4. Process with OpenAI for Summary and Tasks
    try {
      console.log(
        `Processing transcript with OpenAI for meeting ${meetingId}...`
      );
      const isArabicLang = isArabic(transcript);
      const { summaryPrompt, tasksPrompt } = getSystemPrompts(isArabicLang);
      const results = await Promise.allSettled([
        callOpenAI(summaryPrompt, transcript),
        callOpenAI(tasksPrompt, transcript),
      ]);

      if (results[0].status === "fulfilled") {
        summary = results[0].value;
        console.log(`OpenAI summary generated for meeting ${meetingId}.`);
      } else {
        console.error(
          `OpenAI summary generation failed for meeting ${meetingId}:`,
          results[0].reason
        );
        processingError = processingError
          ? `${processingError} OpenAI summary failed.`
          : "OpenAI summary failed.";
      }
      if (results[1].status === "fulfilled") {
        tasks = results[1].value;
        console.log(`OpenAI tasks generated for meeting ${meetingId}.`);
      } else {
        console.error(
          `OpenAI task generation failed for meeting ${meetingId}:`,
          results[1].reason
        );
        processingError = processingError
          ? `${processingError} OpenAI tasks failed.`
          : "OpenAI tasks failed.";
      }

      // 5. Save Summary and Tasks to DB (only if generated)
      if (summary || tasks) {
        try {
          await aiModels.updateMeetingSummaryAndTasks(
            meetingId,
            summary,
            tasks
          );
        } catch (dbError) {
          console.error(
            `Failed to save summary/tasks to DB for meeting ${meetingId}:`,
            dbError
          );
          processingError = processingError
            ? `${processingError} Also failed to save summary/tasks.`
            : "Failed to save summary/tasks.";
        }
      } else if (!processingError && !summary && !tasks) {
        console.warn(
          `Skipping summary/tasks update for meeting ${meetingId} as generation returned empty.`
        );
      } else {
        console.warn(
          `Skipping summary/tasks update for meeting ${meetingId} due to prior errors or empty results.`
        );
      }
    } catch (openAIError) {
      console.error(
        `Error during OpenAI processing stage for meeting ${meetingId}:`,
        openAIError
      );
      processingError = processingError
        ? `${processingError} OpenAI processing failed.`
        : "OpenAI processing failed.";
    }

    // 6. Final Response based on errors collected
    if (processingError) {
      return res.status(207).json({ // 207 Multi-Status
        message: `Recording processed with errors: ${processingError}`,
        // recordingFile: file.filename, // No longer saving original file
        transcript: transcript,
        summary: summary,
        tasks: tasks,
      });
    } else {
      return res.status(200).json({
        message:
          "Recording processed in memory and data saved successfully.", // Updated message
        // recordingFile: file.filename, // No longer saving original file
        transcriptLength: transcript?.length,
        summaryGenerated: !!summary,
        tasksGenerated: !!tasks,
      });
    }
  } catch (error) {
    // Catch errors from Audio Extraction or Transcription controller
    console.error(
      `Critical error during recording processing for meeting ${meetingId}:`,
      error
    );
    const statusCode =
      error.message.includes("Audio extraction failed") ||
      error.message.includes("Transcription failed")
        ? 500
        : 500;
    // Optionally delete the uploaded file if processing fails critically?
    // await fs.unlink(file.path).catch(e => console.error("Error deleting uploaded file on failure:", e));
    return res.status(statusCode).json({
      message: error.message || "Failed to process recording.",
    });
  } 
  // Removed complex finally block, extractAudio handles its temp file cleanup
};

// Export both the controller logic and the configured middleware
module.exports = {
    uploadAndProcessRecording: exports.uploadAndProcessRecording,
    recordingUploadMiddleware // Export the middleware instance
};
