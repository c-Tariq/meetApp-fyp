const fs = require('fs').promises; // Use promises for async file operations
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
// Import the path to the ffmpeg executable provided by the installer package
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// Set the path for fluent-ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Removed Supabase import
// const supabase = require('../config/supabaseClient');
const transcriptionService = require('../services/transcriptionService');
const meetingModel = require('../models/meeting');
// Need the OpenAI processing logic - let's reuse parts from meetingController
// Ideally, refactor OpenAI logic into its own service, but for now, import needed parts
const { isArabic, getSystemPrompts, callOpenAI } = require('./meetingController'); // Assuming these are exported

// Helper function for audio extraction
async function extractAudio(videoBuffer, inputFileName) {
    const tempInputPath = path.join(os.tmpdir(), `rec_in_${inputFileName}`);
    // Output as mp3 for potentially better compatibility/smaller size than wav
    const outputFileName = `audio_out_${path.parse(inputFileName).name}.mp3`; 
    const tempOutputPath = path.join(os.tmpdir(), outputFileName);
    
    console.log(`Temporarily saving video buffer to: ${tempInputPath}`);
    await fs.writeFile(tempInputPath, videoBuffer);
    console.log(`Video buffer saved. Starting audio extraction to: ${tempOutputPath}`);

    return new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
            .noVideo() // Extract audio only
            .audioCodec('libmp3lame') // Specify mp3 codec
            .audioBitrate('192k') // Set bitrate
            .output(tempOutputPath)
            .on('end', async () => {
                console.log('Audio extraction finished successfully.');
                try {
                    const audioBuffer = await fs.readFile(tempOutputPath);
                    console.log(`Read extracted audio buffer size: ${audioBuffer.length}`);
                    // Clean up temporary files after reading
                    await fs.unlink(tempInputPath);
                    await fs.unlink(tempOutputPath);
                    console.log('Temporary files deleted.');
                    resolve({ audioBuffer, outputFileName });
                } catch (readError) {
                    console.error('Error reading or deleting temp audio files:', readError);
                    reject(new Error('Failed to read extracted audio file after conversion.'));
                }
            })
            .on('error', (err) => {
                console.error('Error during ffmpeg processing:', err);
                // Attempt cleanup even on error
                fs.unlink(tempInputPath).catch(e => console.error('Error deleting temp input on error:', e));
                fs.unlink(tempOutputPath).catch(e => console.error('Error deleting temp output on error:', e));
                reject(new Error(`Audio extraction failed: ${err.message}`));
            })
            .run();
    });
}

exports.uploadAndProcessRecording = async (req, res) => {
    const { meetingId } = req.params;
    const userId = req.user?.user_id; 
    const file = req.file; // .webm video file buffer from multer memory storage

    // Basic validation
    if (!file) {
        return res.status(400).json({ message: 'No recording file uploaded.' });
    }
    if (!userId) {
        // Should be caught by ensureAuthenticated, but double-check
        return res.status(401).json({ message: 'User not authenticated.' });
    }
    // Removed Supabase client check

    let extractedAudioInfo = null;
    let transcript = null;
    let summary = null;
    let tasks = null;
    let processingError = null; // Track errors through the process

    try {
        // 1. Extract Audio from Video Buffer
        console.log(`Extracting audio for meeting ${meetingId}...`);
        // Use originalname or generate one if needed
        const inputFileName = file.originalname || `meeting_${meetingId}_${Date.now()}.webm`; 
        extractedAudioInfo = await extractAudio(file.buffer, inputFileName);
        console.log(`Audio extracted for meeting ${meetingId}.`);

        // 2. Transcribe using the service (sends audio buffer)
        console.log(`Requesting transcription for meeting ${meetingId}...`);
        transcript = await transcriptionService.getTranscriptFromFileData(
            extractedAudioInfo.audioBuffer,
            extractedAudioInfo.outputFileName // Send the audio filename
        );
        console.log(`Transcription received for meeting ${meetingId}. Length: ${transcript?.length}`);

        // --- Steps after successful transcription ---
        // 3. Save transcript to DB
        try {
            console.log(`Updating transcript in DB for meeting ${meetingId}...`);
            await meetingModel.updateMeetingTranscript(meetingId, transcript);
            console.log(`Transcript saved successfully for meeting ${meetingId}.`);
        } catch (dbError) {
            console.error(`Failed to save transcript to DB for meeting ${meetingId}:`, dbError);
            processingError = 'Failed to save transcript to database.'; // Log error but continue
        }

        // 4. Process with OpenAI for Summary and Tasks
        try {
            console.log(`Processing transcript with OpenAI for meeting ${meetingId}...`);
            const isArabicLang = isArabic(transcript); 
            const { summaryPrompt, tasksPrompt } = getSystemPrompts(isArabicLang);
            const results = await Promise.allSettled([
                callOpenAI(summaryPrompt, transcript), 
                callOpenAI(tasksPrompt, transcript),   
            ]);

            if (results[0].status === 'fulfilled') {
                summary = results[0].value;
                console.log(`OpenAI summary generated for meeting ${meetingId}.`);
            } else {
                console.error(`OpenAI summary generation failed for meeting ${meetingId}:`, results[0].reason);
                // Append error
                processingError = processingError ? `${processingError} OpenAI summary failed.` : 'OpenAI summary failed.';
            }
            if (results[1].status === 'fulfilled') {
                tasks = results[1].value;
                console.log(`OpenAI tasks generated for meeting ${meetingId}.`);
            } else {
                console.error(`OpenAI task generation failed for meeting ${meetingId}:`, results[1].reason);
                 processingError = processingError ? `${processingError} OpenAI tasks failed.` : 'OpenAI tasks failed.';
            }

            // 5. Save Summary and Tasks to DB (only if generated)
            if (summary || tasks) {
                try {
                    console.log(`Updating summary/tasks in DB for meeting ${meetingId}...`);
                    await meetingModel.updateMeetingSummaryAndTasks(meetingId, summary, tasks);
                    console.log(`Summary/tasks saved successfully for meeting ${meetingId}.`);
                } catch (dbError) {
                    console.error(`Failed to save summary/tasks to DB for meeting ${meetingId}:`, dbError);
                    processingError = processingError ? `${processingError} Also failed to save summary/tasks.` : 'Failed to save summary/tasks.';
                }
            } else if (!processingError && (!summary && !tasks)) {
                 console.warn(`Skipping summary/tasks update for meeting ${meetingId} as generation returned empty.`);
            } else {
                 console.warn(`Skipping summary/tasks update for meeting ${meetingId} due to prior errors or empty results.`);
            }
        } catch(openAIError) {
            console.error(`Error during OpenAI processing stage for meeting ${meetingId}:`, openAIError);
            processingError = processingError ? `${processingError} OpenAI processing failed.` : 'OpenAI processing failed.';
        }

        // 6. Final Response based on errors collected
        if (processingError) {
            // Partial success: Audio extracted & Transcribed, but subsequent steps failed
            return res.status(207).json({ // 207 Multi-Status
                 message: `Recording processed with errors: ${processingError}`,
                 transcript: transcript, // Return transcript
                 summary: summary,       // Return if generated
                 tasks: tasks          // Return if generated
             });
        } else {
            // Full success
            return res.status(200).json({
                message: 'Recording extracted, transcribed, and processed successfully.',
                transcriptLength: transcript?.length,
                summaryGenerated: !!summary,
                tasksGenerated: !!tasks
            });
        }

    } catch (error) {
        // Catch errors from Audio Extraction or Transcription service
        console.error(`Critical error during recording processing for meeting ${meetingId}:`, error);
        // Determine status code based on error type if possible
        const statusCode = error.message.includes('Audio extraction failed') || error.message.includes('Transcription failed') ? 500 : 500;
        return res.status(statusCode).json({ 
            message: error.message || 'Failed to process recording.'
            // Avoid sending back potentially large transcript data on critical failure
        });
    } finally {
        // Ensure cleanup happens even if initial extraction promise was rejected
        // (Though the helper function tries to clean up internally too)
        if(extractedAudioInfo) {
             const tempInputPath = path.join(os.tmpdir(), `rec_in_${file.originalname || `meeting_${meetingId}_${Date.now()}.webm`}`);
             const tempOutputPath = path.join(os.tmpdir(), extractedAudioInfo.outputFileName);
             fs.unlink(tempInputPath).catch(e => console.error('Error deleting temp input in finally:', e));
             fs.unlink(tempOutputPath).catch(e => console.error('Error deleting temp output in finally:', e));
        }
    }
}; 