"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppError, fromGetDisplayMediaError, fromGetUserMediaError } from "@/lib/utils/errors";
import { setSessionRecording, type SessionRecording } from "@/lib/recording/recordingStore";

export type RecorderStatus = "idle" | "requesting" | "recording" | "stopping" | "stopped" | "error";

// The camera bubble's size/position as a fraction of the recorded canvas —
// bottom-right corner, per the "my face in one corner, bottom-right" ask.
const PIP_SIZE_RATIO = 0.22;
const PIP_MARGIN_RATIO = 0.02;

function pickMimeType(): string {
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "video/webm";
}

/**
 * Records the whole session as one downloadable video: the shared screen as
 * the full frame, with a small circular live camera bubble composited into
 * the bottom-right corner — drawn frame-by-frame onto an offscreen canvas,
 * captured via canvas.captureStream(), and saved with MediaRecorder. Nothing
 * is uploaded anywhere; the result is only ever a local Blob the user can
 * preview/download from the report page.
 *
 * Audio is the user's microphone ONLY (no tab/system audio is mixed in), and
 * it's cleaned up before it ever reaches the recording:
 *  1. The mic is requested with the browser's own echoCancellation/
 *     noiseSuppression/autoGainControl constraints turned on.
 *  2. A highpass + lowpass filter pair narrows the signal to the speech
 *     band, cutting low-frequency rumble (a fan, AC, desk vibration) and
 *     high-frequency hiss outside where a voice actually lives.
 *  3. A noise-gate AudioWorklet (public/noise-gate-processor.js) ducks
 *     whatever steady background level remains further still, without
 *     clipping the natural rise and fall of actual speech.
 *  4. A dynamics compressor evens out levels so the final track sounds
 *     consistent.
 */
export function useSessionRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<AppError | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const screenStreamRef = useRef<MediaStream | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const screenVideoElRef = useRef<HTMLVideoElement | null>(null);
  const camVideoElRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const stopResolveRef = useRef<((rec: SessionRecording | null) => void) | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const screenVideo = screenVideoElRef.current;
    const camVideo = camVideoElRef.current;
    if (canvas && screenVideo && screenVideo.videoWidth) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (canvas.width !== screenVideo.videoWidth || canvas.height !== screenVideo.videoHeight) {
          canvas.width = screenVideo.videoWidth;
          canvas.height = screenVideo.videoHeight;
        }
        ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

        if (camVideo && camVideo.videoWidth) {
          const pipW = canvas.width * PIP_SIZE_RATIO;
          const pipH = pipW * (camVideo.videoHeight / camVideo.videoWidth);
          const margin = canvas.width * PIP_MARGIN_RATIO;
          const x = canvas.width - pipW - margin;
          const y = canvas.height - pipH - margin;
          const radius = Math.min(pipW, pipH) * 0.08;

          const roundedRectPath = () => {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.arcTo(x + pipW, y, x + pipW, y + pipH, radius);
            ctx.arcTo(x + pipW, y + pipH, x, y + pipH, radius);
            ctx.arcTo(x, y + pipH, x, y, radius);
            ctx.arcTo(x, y, x + pipW, y, radius);
            ctx.closePath();
          };

          ctx.save();
          roundedRectPath();
          ctx.clip();
          // Mirror the camera feed for a natural "looking at yourself" framing.
          ctx.translate(x + pipW, y);
          ctx.scale(-1, 1);
          ctx.drawImage(camVideo, 0, 0, pipW, pipH);
          ctx.restore();

          ctx.save();
          ctx.strokeStyle = "rgba(255,255,255,0.85)";
          ctx.lineWidth = Math.max(2, pipW * 0.015);
          roundedRectPath();
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    rafRef.current = requestAnimationFrame(drawFrame);
  }, []);

  const cleanupTracks = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    camStreamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setCameraStream(null);
  }, []);

  useEffect(() => cleanupTracks, [cleanupTracks]);

  const start = useCallback(async () => {
    setStatus("requesting");
    setError(null);
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        // Only the user's mic goes into the recording (see file doc comment
        // above) — no need to ask for or capture tab/system audio at all.
        audio: false,
      });
      screenStreamRef.current = screenStream;

      let camStream: MediaStream;
      try {
        camStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360 },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err) {
        screenStream.getTracks().forEach((t) => t.stop());
        throw fromGetUserMediaError(err, "camera");
      }
      camStreamRef.current = camStream;
      setCameraStream(camStream);

      const screenVideo = document.createElement("video");
      screenVideo.srcObject = screenStream;
      screenVideo.muted = true;
      screenVideo.playsInline = true;
      await screenVideo.play().catch(() => {});
      screenVideoElRef.current = screenVideo;

      const camVideo = document.createElement("video");
      camVideo.srcObject = camStream;
      camVideo.muted = true;
      camVideo.playsInline = true;
      await camVideo.play().catch(() => {});
      camVideoElRef.current = camVideo;

      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      canvasRef.current = canvas;
      rafRef.current = requestAnimationFrame(drawFrame);

      const canvasStream = canvas.captureStream(30);

      // Run the mic through a noise-cleanup chain before it reaches the
      // recording — see the file doc comment for what each stage does.
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const destination = audioCtx.createMediaStreamDestination();
      const micAudioTracks = camStream.getAudioTracks();

      if (micAudioTracks.length) {
        const micSource = audioCtx.createMediaStreamSource(new MediaStream(micAudioTracks));

        // Two cascaded highpass stages for a steeper rolloff on rumble
        // (fans, AC, desk/table vibration) than a single filter gives.
        const highpass1 = audioCtx.createBiquadFilter();
        highpass1.type = "highpass";
        highpass1.frequency.value = 100;
        highpass1.Q.value = 0.7;
        const highpass2 = audioCtx.createBiquadFilter();
        highpass2.type = "highpass";
        highpass2.frequency.value = 90;
        highpass2.Q.value = 0.7;

        // Trim high-frequency hiss/whine above where speech intelligibility
        // actually lives.
        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 8000;

        // Evens out levels and helps push whatever steady low-level noise
        // remains further below the user's actual voice.
        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        micSource.connect(highpass1);
        highpass1.connect(highpass2);
        highpass2.connect(lowpass);

        // The noise gate runs on an AudioWorklet, which needs its module
        // loaded async — if that fails for any reason (older browser,
        // blocked script), fall back to just the filters + compressor
        // rather than losing the recording's audio entirely.
        let gateNode: AudioNode = lowpass;
        try {
          await audioCtx.audioWorklet.addModule("/noise-gate-processor.js");
          const noiseGate = new AudioWorkletNode(audioCtx, "noise-gate-processor");
          lowpass.connect(noiseGate);
          gateNode = noiseGate;
        } catch (err) {
          console.warn("Noise-gate worklet unavailable, continuing without it:", err);
        }

        gateNode.connect(compressor);
        compressor.connect(destination);
      }

      const combined = new MediaStream([...canvasStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);

      const recorder = new MediaRecorder(combined, { mimeType: pickMimeType() });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        const url = URL.createObjectURL(blob);
        const rec: SessionRecording = {
          blob,
          url,
          mimeType: blob.type,
          durationMs: Date.now() - startedAtRef.current,
        };
        setSessionRecording(rec);
        cleanupTracks();
        setStatus("stopped");
        stopResolveRef.current?.(rec);
        stopResolveRef.current = null;
      };

      // If the user stops sharing from the browser's own "Stop sharing" bar,
      // treat it the same as clicking the app's own stop/finish control.
      screenStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
          recorderRef.current.stop();
        }
      });

      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start(1000);
      setStatus("recording");
    } catch (err) {
      cleanupTracks();
      const appError =
        err instanceof AppError ? err : err instanceof DOMException ? fromGetDisplayMediaError(err) : new AppError("unknown", err);
      setError(appError);
      setStatus("error");
    }
  }, [cleanupTracks, drawFrame]);

  const stop = useCallback((): Promise<SessionRecording | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      setStatus("stopping");
      stopResolveRef.current = resolve;
      recorder.stop();
    });
  }, []);

  return { status, error, cameraStream, start, stop };
}
