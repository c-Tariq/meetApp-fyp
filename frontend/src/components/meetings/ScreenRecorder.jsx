import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ScreenShare, Video, VideoOff, Download, Loader } from 'lucide-react';

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
    <div className="text-center my-4 p-2 rounded bg-gray-100 text-sm">
        Status: <span className="font-medium text-gray-700">{status}</span>
    </div>
);

export default function ScreenRecorder() {
    const [isSelecting, setIsSelecting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [blobForDownload, setBlobForDownload] = useState(null);

    const videoPreviewRef = useRef(null);
    const audioContextRef = useRef(null);
    const displayStreamRef = useRef(null);
    const micStreamRef = useRef(null);
    const finalStreamRef = useRef(null);
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);

    const MimeType = 'video/webm;codecs=vp9,opus';

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
    }, []);

    useEffect(() => () => resetState(), [resetState]);

    const handleStreamEnd = useCallback(() => {
        if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
        else resetState();
    }, [resetState]);

    const handleSelectScreenAndMic = useCallback(async () => {
        resetState();
        setIsSelecting(true);

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
            } catch {}

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
        } catch (err) {
            resetState();
        } finally {
            setIsSelecting(false);
        }
    }, [resetState, handleStreamEnd]);

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

                const blob = new Blob(chunksRef.current, { type: MimeType });
                if (blob.size > 0) {
                    setBlobForDownload(blob);
                } else {
                    resetState();
                }
                setIsProcessing(false);
            };

            recorder.onerror = () => {
                resetState();
            };

            recorder.start(1000);
            setIsRecording(true);
        } catch {
            resetState();
        }
    }, [resetState]);

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
        a.download = `recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
    }, [blobForDownload]);

    const canSelect = !isSelecting && !isRecording;
    const canRecord = !!finalStreamRef.current && !isRecording && !isSelecting && !isProcessing;
    const canStop = isRecording;
    const canDownload = !!blobForDownload && !isRecording && !isProcessing;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg">
                <div className="p-6 sm:p-8">
                    <h1 className="text-2xl font-bold text-center mb-6">Screen Recorder</h1>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <ActionButton
                            id="selectScreenBtn"
                            onClick={handleSelectScreenAndMic}
                            disabled={!canSelect}
                            className="bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            {isSelecting ? <Loader className="animate-spin h-5 w-5 mr-2" /> : <ScreenShare className="h-5 w-5 mr-2" />}
                            {isSelecting ? 'Selecting...' : 'Select Screen & Mic'}
                        </ActionButton>

                        <ActionButton
                            id="startRecordBtn"
                            onClick={handleStartRecording}
                            disabled={!canRecord}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            <Video className="h-5 w-5 mr-2" /> Start Recording
                        </ActionButton>

                        <ActionButton
                            id="stopRecordBtn"
                            onClick={handleStopRecording}
                            disabled={!canStop}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            <VideoOff className="h-5 w-5 mr-2" /> Stop Recording
                        </ActionButton>
                    </div>

                    <div className="bg-gray-900 rounded-lg mb-6 overflow-hidden aspect-video shadow-inner">
                        <video
                            ref={videoPreviewRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-contain block"
                        />
                    </div>

                    <div className="text-center">
                        <ActionButton
                            id="downloadBtn"
                            onClick={handleDownload}
                            disabled={!canDownload}
                            className="bg-purple-600 text-white hover:bg-purple-700"
                        >
                            <Download className="h-5 w-5 mr-2" /> Download
                        </ActionButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
