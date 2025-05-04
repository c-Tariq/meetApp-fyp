// Controller for handling transcription-related requests.
// Currently, transcription is initiated via recording uploads (recordingController)
// or potentially direct transcript processing (aiProcessingController).
// This file is created as requested but may not have immediate functionality.

require("dotenv").config(); // Ensure env vars are loaded
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// Define ElevenLabs config directly
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/speech-to-text";

/**
 * Calls the ElevenLabs API synchronously to transcribe audio from a given URL.
 * @deprecated Use getTranscriptFromFileData instead for direct upload.
 * @param {string} recordingUrl - The publicly accessible URL of the audio/video file.
 * @returns {Promise<string>} - The transcript text.
 * @throws {Error} - Throws an error if the API call fails or doesn't return text.
 */
async function getTranscriptFromUrl(recordingUrl) {
  // Renamed for clarity
  console.log(`[DEPRECATED] Attempting transcription from URL: ${recordingUrl}`);
  if (!ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY environment variable not set.");
    throw new Error("Transcription service API key not configured.");
  }

  try {
    const response = await axios.post(
      ELEVENLABS_API_URL,
      {
        model_id: "scribe_v1",
        cloud_storage_url: recordingUrl,
      },
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && typeof response.data.text === "string") {
      return response.data.text;
    } else {
      throw new Error("Transcription failed: Invalid response format from API.");
    }
  } catch (error) {
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "Unknown transcription error";
    console.error(
      `Error during URL transcription for ${recordingUrl}:`,
      errorMessage
    );
    throw new Error(`Transcription failed: ${errorMessage}`);
  }
}

/**
 * Calls the ElevenLabs API to transcribe audio by uploading file data directly.
 * Returns the transcript text on success, throws an error on failure.
 * @param {Buffer} audioBuffer - The audio file data as a Buffer.
 * @param {string} originalFileName - An indicative filename (e.g., 'audio.mp3').
 * @returns {Promise<string>} - The transcript text.
 * @throws {Error} - Throws an error if the API call fails or doesn't return text.
 */
async function getTranscriptFromFileData(audioBuffer, originalFileName) {
  console.log(`Attempting direct file transcription for: ${originalFileName}`);
  if (!ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY environment variable not set.");
    throw new Error("Transcription service API key not configured.");
  }
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error("Cannot transcribe empty audio buffer.");
  }

  const formData = new FormData();
  formData.append("file", audioBuffer, {
    filename: originalFileName, // Provide a filename for the API
    // contentType: 'audio/mpeg', // e.g., for mp3
  });
  formData.append("model_id", "scribe_v1");
  // formData.append('language_code', 'en');
  // formData.append('num_speakers', '1');

  try {
    const response = await axios.post(ELEVENLABS_API_URL, formData, {
      headers: {
        ...formData.getHeaders(), // Set Content-Type to multipart/form-data
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      maxBodyLength: Infinity, // Allow large file uploads
      maxContentLength: Infinity,
      // timeout: 300000 // Optional: 5 minute timeout
    });

    if (response.data && typeof response.data.text === "string") {
      console.log(
        `Direct file transcription successful for: ${originalFileName}`
      );
      return response.data.text;
    } else {
      console.error(
        `ElevenLabs API (file upload) did not return expected text format for: ${originalFileName}`,
        response.data
      );
      throw new Error(
        "Transcription failed: Invalid response format from API via file upload."
      );
    }
  } catch (error) {
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      "Unknown transcription error";
    console.error(
      `Error during direct file transcription for ${originalFileName}:`,
      errorMessage,
      error.stack ? error.stack.split("\n")[1] : ""
    );
    throw new Error(`Transcription failed (file upload): ${errorMessage}`);
  }
}

// Export the functions to be used by other parts of the application
module.exports = {
  getTranscriptFromUrl,
  getTranscriptFromFileData,
}; 