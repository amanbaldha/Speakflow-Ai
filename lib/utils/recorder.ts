"use client";

import { useState, useRef, useCallback } from "react";

interface UseScreenRecorderProps {
  onStop?: (blobUrl: string) => void;
}

export function useScreenRecorder({ onStop }: UseScreenRecorderProps = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // 1. Capture the screen (and optionally system/tab audio)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
        },
        audio: true, // Try to capture tab audio
      });

      // 2. Fallback: if tab audio wasn't captured, we could manually mix microphone here,
      // but typical "Creator Mode" recordings will just capture the tab audio directly 
      // when the user shares the tab. We'll rely on tab audio for simplicity and perfect sync.
      
      const options = { mimeType: "video/webm; codecs=vp9,opus" };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(displayStream, options);
      } catch (e) {
        // Fallback if vp9 not supported
        recorder = new MediaRecorder(displayStream);
      }

      mediaRecorderRef.current = recorder;
      streamRef.current = displayStream;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        
        // Auto-download
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `speakflow-session-${new Date().toISOString().replace(/:/g, "-")}.webm`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);

        if (onStop) {
          onStop(url);
        }
        
        setIsRecording(false);
      };

      // Stop recording automatically if the user stops sharing via browser UI
      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
        };
      }

      recorder.start(1000); // collect data every second
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setIsRecording(false);
    }
  }, [onStop]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
}
