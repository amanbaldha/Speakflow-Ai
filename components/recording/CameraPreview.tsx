"use client";

import { useEffect, useRef } from "react";

interface CameraPreviewProps {
  stream: MediaStream | null;
}

/** The live "your face, bottom-right corner" bubble shown throughout the
 *  session — a separate, always-visible element from whatever's baked into
 *  the recorded video (see useSessionRecorder), so it stays visible even if
 *  recording itself fails or was skipped. */
export function CameraPreview({ stream }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="fixed bottom-6 right-6 z-50 h-28 w-28 -scale-x-100 rounded-full border-2 border-accent object-cover shadow-lg sm:h-36 sm:w-36"
    />
  );
}
