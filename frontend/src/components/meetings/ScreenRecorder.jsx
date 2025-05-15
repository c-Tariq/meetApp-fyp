import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ScreenShare, Video, VideoOff, Download, Loader, Upload, Mic, Volume2, FileUp } from 'lucide-react';
import { useParams } from 'react-router-dom';

const ActionButton = ({ onClick, disabled, children, className = '', id = null }) => (
    <button
        id={id}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition ${className}`}
    >
        {children}
    </button>
);

const StatusDisplay = ({ status }) => (
    <div className="text-center my-4 p-3 rounded bg-white border border-blue-200 text-blue-900 text-sm">
        Status: <span className="font-medium">{status}</span>
    </div>
);

export default function ScreenRecorder() {
    // Using props instead of useParams from react-router-dom
    const { spaceId, meetingId } = useParams();

    const [isSelecting, setIsSelecting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [blobForDownload, setBlobForDownload] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [recordingMode, setRecordingMode] = useState('screen'); // 'screen' or 'audio'
    const [recordingStatus, setRecordingStatus] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);

    const videoPreviewRef = useRef(null);
    const audioContextRef = useRef(null);
    const displayStreamRef = useRef(null);
    const micStreamRef = useRef(null);
    const finalStreamRef = useRef(null);
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const fileInputRef = useRef(null);

    const MimeType = recordingMode === 'screen' 
        ? 'video/webm;codecs=vp9,opus' 
        : 'audio/webm;codecs=opus';

    const resetState = useCallback(() => {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.onstop = null;
            recorderRef.current.stop();
        }
        recorderRef.current = null;

        finalStreamRef.current?.getTracks().forEach(track => track.stop());
        displayStreamRef.current?.getTracks().forEach(track => track.stop());
        micStreamRef.current?.getTracks().forEach(track => track.stop());

        finalStreamRef.current = null;
        displayStreamRef.current = null;
        micStreamRef.current = null;

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        audioContextRef.current = null;

        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;

        chunksRef.current = [];
        setBlobForDownload(null);
        setIsSelecting(false);
        setIsRecording(false);
        setIsProcessing(false);
        setIsUploading(false);
        setRecordingStatus('');
    }, []);

    useEffect(() => () => resetState(), [resetState]);

    const handleStreamEnd = useCallback(() => {
        if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
        else resetState();
    }, [resetState]);

    const handleSelectScreenAndMic = useCallback(async () => {
        resetState();
        setIsSelecting(true);
        setRecordingMode('screen');
        setRecordingStatus('Getting screen and microphone access...');

        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always', frameRate: 30 },
                audio: true
            });
            displayStreamRef.current = displayStream;
            displayStream.getVideoTracks()[0].onended = handleStreamEnd;

            try {
                micStreamRef.current = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false
                });
            } catch {
                setRecordingStatus('Warning: Microphone access denied. Only system audio will be recorded.');
            }

            const audioCtx = new AudioContext();
            audioContextRef.current = audioCtx;
            const destination = audioCtx.createMediaStreamDestination();

            if (micStreamRef.current)
                audioCtx.createMediaStreamSource(micStreamRef.current).connect(destination);

            if (displayStream.getAudioTracks().length > 0)
                audioCtx.createMediaStreamSource(displayStream).connect(destination);

            const finalStream = new MediaStream([
                ...displayStream.getVideoTracks(),
                ...destination.stream.getAudioTracks()
            ]);
            finalStreamRef.current = finalStream;

            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = displayStream;
                videoPreviewRef.current.play();
            }
            
            setRecordingStatus('Screen and microphone ready! You can start recording.');
        } catch (err) {
            resetState();
            setRecordingStatus('Failed to access screen or microphone.');
        } finally {
            setIsSelecting(false);
        }
    }, [resetState, handleStreamEnd]);

    const handleSelectAudioOnly = useCallback(async () => {
        resetState();
        setIsSelecting(true);
        setRecordingMode('audio');
        setRecordingStatus('Getting audio access...');

        try {
            // For system audio, we need to request screen capture
            // Most browsers require a visible display capture UI to share system audio
            let systemAudioStream = null;
            try {
                // Request display capture but explicitly mention we want audio
                const tempDisplayStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { width: 1, height: 1 }, // Minimum video required to get system audio
                    audio: true // This is critical for system audio
                });
                
                if (tempDisplayStream.getAudioTracks().length > 0) {
                    // Keep only the audio tracks from the display capture
                    systemAudioStream = new MediaStream(tempDisplayStream.getAudioTracks());
                    
                    // Store the original stream to properly clean up later
                    displayStreamRef.current = tempDisplayStream;
                    
                    // Stop video tracks immediately as we don't need them
                    tempDisplayStream.getVideoTracks().forEach(track => track.stop());
                    
                    console.log('System audio successfully captured');
                } else {
                    console.log('No system audio tracks found in the display stream');
                    tempDisplayStream.getTracks().forEach(track => track.stop());
                }
            } catch (err) {
                console.log('Could not get system audio:', err);
            }

            // Get microphone audio
            try {
                micStreamRef.current = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false
                });
                console.log('Microphone successfully captured');
            } catch (err) {
                console.log('Could not get microphone:', err);
                if (!systemAudioStream) {
                    throw new Error('Neither system audio nor microphone could be accessed');
                }
            }

            // Combine audio streams
            const audioCtx = new AudioContext();
            audioContextRef.current = audioCtx;
            const destination = audioCtx.createMediaStreamDestination();

            if (micStreamRef.current) {
                const micSource = audioCtx.createMediaStreamSource(micStreamRef.current);
                micSource.connect(destination);
                console.log('Microphone audio connected to output');
            }

            if (systemAudioStream && systemAudioStream.getAudioTracks().length > 0) {
                const systemSource = audioCtx.createMediaStreamSource(systemAudioStream);
                systemSource.connect(destination);
                console.log('System audio connected to output');
            }

            finalStreamRef.current = destination.stream;
            
            // Update status based on what we got
            if (micStreamRef.current && systemAudioStream && systemAudioStream.getAudioTracks().length > 0) {
                setRecordingStatus('Microphone and system audio ready for recording!');
            } else if (micStreamRef.current) {
                setRecordingStatus('Microphone ready for recording! (No system audio)');
            } else if (systemAudioStream && systemAudioStream.getAudioTracks().length > 0) {
                setRecordingStatus('System audio ready for recording! (No microphone)');
            }
            
            // Clear video preview for audio-only mode
            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = null;
            }
        } catch (err) {
            resetState();
            setRecordingStatus('Failed to access audio sources: ' + err.message);
        } finally {
            setIsSelecting(false);
        }
    }, [resetState]);

    const handleStartRecording = useCallback(() => {
        if (!finalStreamRef.current) return;

        chunksRef.current = [];
        setBlobForDownload(null);
        setIsProcessing(false);

        try {
            const options = MediaRecorder.isTypeSupported(MimeType)
                ? { mimeType: MimeType }
                : {};
            const recorder = new MediaRecorder(finalStreamRef.current, options);
            recorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                setIsRecording(false);
                setIsProcessing(true);
                setRecordingStatus('Processing recording...');

                const blob = new Blob(chunksRef.current, { type: MimeType });
                if (blob.size > 0) {
                    setBlobForDownload(blob);
                    setRecordingStatus('Recording complete! You can download or upload it now.');
                } else {
                    resetState();
                    setRecordingStatus('Recording failed: No data was captured.');
                }
                setIsProcessing(false);
            };

            recorder.onerror = () => {
                resetState();
                setRecordingStatus('Recording error occurred.');
            };

            recorder.start(1000);
            setIsRecording(true);
            setRecordingStatus(`${recordingMode === 'screen' ? 'Screen' : 'Audio'} recording in progress...`);
        } catch (err) {
            resetState();
            setRecordingStatus('Failed to start recording: ' + err.message);
        }
    }, [resetState, recordingMode, MimeType]);

    const handleStopRecording = useCallback(() => {
        if (recorderRef.current?.state === 'recording') {
            recorderRef.current.stop();
        } else {
            setIsRecording(false);
            setIsProcessing(false);
        }
    }, []);

    const handleDownload = useCallback(() => {
        if (!blobForDownload) return;
        const url = URL.createObjectURL(blobForDownload);
        const a = document.createElement('a');
        a.href = url;
        
        // Set appropriate file extension based on recording mode
        const extension = recordingMode === 'screen' ? 'webm' : 'webm';
        a.download = `recording-${Date.now()}.${extension}`;
        
        a.click();
        URL.revokeObjectURL(url);
    }, [blobForDownload, recordingMode]);

    const handleFileSelect = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Clear previous file
        setUploadedFile(file);
        setBlobForDownload(file);
        
        // Determine file type
        if (file.type.startsWith('video/')) {
            setRecordingMode('screen');
        } else if (file.type.startsWith('audio/')) {
            setRecordingMode('audio');
        }
        
        setRecordingStatus(`File "${file.name}" selected. Ready to upload.`);
        
        // Preview the file if it's a video
        if (file.type.startsWith('video/') && videoPreviewRef.current) {
            const url = URL.createObjectURL(file);
            videoPreviewRef.current.src = url;
            videoPreviewRef.current.onloadedmetadata = () => {
                videoPreviewRef.current.play();
            };
        }
    }, []);

    const handleUpload = useCallback(async () => {
        if (!blobForDownload) {
            console.error("No recording blob available to upload.");
            return;
        }
        if (isUploading) {
            return; // Prevent double uploads
        }

        // Validate spaceId and meetingId
        if (!spaceId || !meetingId) {
            console.error("Space ID and Meeting ID are required for upload.");
            alert("Error: Cannot upload without valid Space ID and Meeting ID.");
            return;
        }

        setIsUploading(true);
        setRecordingStatus('Uploading recording...');

        const formData = new FormData();
        let fileToUpload;
        
        if (uploadedFile) {
            // If we're using an uploaded file, use it directly
            fileToUpload = uploadedFile;
        } else {
            // Otherwise use the recorded blob
            const extension = recordingMode === 'screen' ? 'webm' : 'webm';
            const fileType = recordingMode === 'screen' ? 'video/webm' : 'audio/webm';
            
            fileToUpload = new File(
                [blobForDownload], 
                `recording-${meetingId}-${Date.now()}.${extension}`, 
                { type: fileType }
            );
        }
        
        formData.append('recording', fileToUpload);
        formData.append('recordingType', recordingMode); // Add recording type for server-side handling
        
        try {
            const response = await fetch(`/api/spaces/${spaceId}/meetings/${meetingId}/ai/recording`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Upload failed:', result.message || `HTTP error ${response.status}`);
                alert(`Upload failed: ${result.message || 'Server error'}`);
                setRecordingStatus(`Upload failed: ${result.message || 'Server error'}`);
            } else {
                console.log('Upload successful:', result);
                alert('Recording uploaded and processing started!');
                setRecordingStatus('Recording uploaded successfully!');
                
                // Reset the uploaded file state
                setUploadedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        } catch (error) {
            console.error('Error during upload:', error);
            alert(`Upload error: ${error.message}`);
            setRecordingStatus(`Upload error: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    }, [blobForDownload, isUploading, spaceId, meetingId, recordingMode, uploadedFile]);

    const handleTriggerFileInput = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, []);

    const canSelect = !isSelecting && !isRecording;
    const canRecord = !!finalStreamRef.current && !isRecording && !isSelecting && !isProcessing;
    const canStop = isRecording;
    const canDownload = !!blobForDownload && !isRecording && !isProcessing;

    return (
        <div className="min-h-screen bg-white py-12 px-4">
            <div className="max-w-3xl mx-auto bg-blue-50 rounded-xl shadow-lg border border-blue-200">
                <div className="p-6 sm:p-8">
                    <h1 className="text-2xl font-bold text-center text-blue-900 mb-6">Media Recorder</h1>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <ActionButton
                            id="selectScreenBtn"
                            onClick={handleSelectScreenAndMic}
                            disabled={!canSelect}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {isSelecting && recordingMode === 'screen' ? (
                                <Loader className="animate-spin h-5 w-5 mr-2" />
                            ) : (
                                <ScreenShare className="h-5 w-5 mr-2" />
                            )}
                            {isSelecting && recordingMode === 'screen' ? 'Selecting...' : 'Screen & Audio'}
                        </ActionButton>

                        <ActionButton
                            id="selectAudioBtn"
                            onClick={handleSelectAudioOnly}
                            disabled={!canSelect}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {isSelecting && recordingMode === 'audio' ? (
                                <Loader className="animate-spin h-5 w-5 mr-2" />
                            ) : (
                                <Volume2 className="h-5 w-5 mr-2" />
                            )}
                            {isSelecting && recordingMode === 'audio' ? 'Selecting...' : 'Audio Only'}
                        </ActionButton>
                        
                        <ActionButton
                            id="uploadFileBtn"
                            onClick={handleTriggerFileInput}
                            disabled={isRecording || isProcessing}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            <FileUp className="h-5 w-5 mr-2" />
                            Upload File
                        </ActionButton>
                        
                        {/* Hidden file input */}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="video/*, audio/*"
                            className="hidden"
                            aria-hidden="true"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <ActionButton
                            id="startRecordBtn"
                            onClick={handleStartRecording}
                            disabled={!canRecord}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {recordingMode === 'screen' ? (
                                <Video className="h-5 w-5 mr-2" />
                            ) : (
                                <Mic className="h-5 w-5 mr-2" />
                            )}
                            Start Recording
                        </ActionButton>

                        <ActionButton
                            id="stopRecordBtn"
                            onClick={handleStopRecording}
                            disabled={!canStop}
                            className="bg-blue-900 text-white hover:bg-blue-800"
                        >
                            <VideoOff className="h-5 w-5 mr-2" /> Stop Recording
                        </ActionButton>
                    </div>

                    {recordingStatus && (
                        <StatusDisplay status={recordingStatus} />
                    )}

                    <div className={`bg-blue-900 rounded-lg mb-6 overflow-hidden aspect-video shadow-inner ${recordingMode === 'audio' && !uploadedFile ? 'hidden' : ''}`}>
                        <video
                            ref={videoPreviewRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-contain block"
                            controls={!!uploadedFile}
                        />
                    </div>

                    {recordingMode === 'audio' && !isRecording && !blobForDownload && !uploadedFile && (
                        <div className="flex items-center justify-center h-40 bg-white rounded-lg mb-6 border border-blue-200">
                            <div className="text-center text-blue-900">
                                <Volume2 className="h-16 w-16 mx-auto mb-2" />
                                <p>Audio recording mode selected</p>
                            </div>
                        </div>
                    )}

                    {recordingMode === 'audio' && isRecording && (
                        <div className="flex items-center justify-center h-40 bg-white rounded-lg mb-6 border border-blue-200">
                            <div className="text-center text-blue-900">
                                <div className="flex justify-center space-x-1 mb-2">
                                    <div className="w-2 h-8 bg-blue-600 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-12 bg-blue-600 rounded-full animate-pulse delay-75"></div>
                                    <div className="w-2 h-16 bg-blue-600 rounded-full animate-pulse delay-150"></div>
                                    <div className="w-2 h-10 bg-blue-600 rounded-full animate-pulse delay-300"></div>
                                    <div className="w-2 h-8 bg-blue-600 rounded-full animate-pulse delay-200"></div>
                                </div>
                                <p>Recording audio...</p>
                            </div>
                        </div>
                    )}

                    <div className="text-center space-x-4">
                        <ActionButton
                            id="downloadBtn"
                            onClick={handleDownload}
                            disabled={!canDownload}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            <Download className="h-5 w-5 mr-2" /> Download
                        </ActionButton>
                        <ActionButton
                            id="uploadBtn"
                            onClick={handleUpload}
                            disabled={!blobForDownload || isUploading}
                            className="bg-blue-900 text-white hover:bg-blue-800"
                        >
                            {isUploading ? <Loader className="animate-spin h-5 w-5 mr-2" /> : <Upload className="h-5 w-5 mr-2" />}
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </ActionButton>
                    </div>
                    
                    {uploadedFile && (
                        <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                            <p className="text-sm text-blue-900">
                                <span className="font-medium">Selected file:</span> {uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB)
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}