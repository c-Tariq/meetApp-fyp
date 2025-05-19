require("dotenv").config();
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/speech-to-text";

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
    filename: originalFileName,
  });
  formData.append("model_id", "scribe_v1");

  try {
    const response = await axios.post(ELEVENLABS_API_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
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

module.exports = {
  getTranscriptFromFileData,
};
