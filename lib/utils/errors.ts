// Central place to turn low-level browser/API errors into human-readable
// messages — never surface a raw stack trace or DOMException name to the user.

export type AppErrorCode =
  | "mic-permission-denied"
  | "camera-permission-denied"
  | "screen-share-denied"
  | "no-mic-found"
  | "no-camera-found"
  | "device-disconnected"
  | "network-failure"
  | "speech-recognition-unsupported"
  | "speech-recognition-failed"
  | "recording-unsupported"
  | "local-model-unreachable"
  | "browser-unsupported"
  | "question-generation-failed"
  | "summary-failed"
  | "unknown";

const MESSAGES: Record<AppErrorCode, string> = {
  "mic-permission-denied":
    "SpeakFlow needs microphone access to hear you. Please allow microphone permission in your browser's address-bar icon, then try again.",
  "camera-permission-denied":
    "Camera access was blocked. You can still practice with audio only, or allow camera permission in your browser settings and refresh.",
  "screen-share-denied":
    "Screen sharing was blocked or cancelled. You can still practice without a recording, or try again and allow screen sharing when your browser asks.",
  "no-mic-found":
    "No microphone was found. Please connect a microphone and refresh the page.",
  "no-camera-found":
    "No camera was found. You can continue with audio only.",
  "device-disconnected":
    "Your microphone was disconnected. Please reconnect it and try again.",
  "network-failure":
    "We lost connection to the network. Check your internet connection and try again.",
  "speech-recognition-unsupported":
    "Live transcription needs Chrome or Edge on desktop — your current browser doesn't support it. Please switch browsers to continue.",
  "speech-recognition-failed":
    "We lost the microphone connection for a moment. Click Start Speaking to try again.",
  "recording-unsupported":
    "Screen + camera recording isn't supported in this browser. You can still practice without a recording.",
  "local-model-unreachable":
    "Couldn't reach the local Gemma model. Make sure Ollama is installed and running on this machine, then try again.",
  "browser-unsupported":
    "Your browser doesn't support a feature SpeakFlow needs. Please use a recent version of Chrome or Edge.",
  "question-generation-failed":
    "We couldn't generate questions right now. Please try again in a moment.",
  "summary-failed":
    "We couldn't generate your session report right now, but your answers are safe. You can try again from this screen.",
  unknown: "Something went wrong. Please try again.",
};

export class AppError extends Error {
  code: AppErrorCode;
  constructor(code: AppErrorCode, cause?: unknown) {
    super(MESSAGES[code]);
    this.code = code;
    this.name = "AppError";
    if (cause) this.cause = cause;
  }
  get friendlyMessage() {
    return MESSAGES[this.code];
  }
}

export function friendlyMessageFor(error: unknown): string {
  if (error instanceof AppError) return error.friendlyMessage;
  return MESSAGES.unknown;
}

/** Maps a getUserMedia() DOMException to an AppError. */
export function fromGetUserMediaError(err: unknown, wanted: "mic" | "camera"): AppError {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return new AppError(wanted === "mic" ? "mic-permission-denied" : "camera-permission-denied", err);
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return new AppError(wanted === "mic" ? "no-mic-found" : "no-camera-found", err);
  }
  return new AppError("unknown", err);
}

/** Maps a getDisplayMedia() rejection to an AppError (user declined/cancelled
 *  the "share your screen" browser prompt, or the browser blocked it). */
export function fromGetDisplayMediaError(err: unknown): AppError {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return new AppError("screen-share-denied", err);
  }
  return new AppError("unknown", err);
}

/** Maps a SpeechRecognition error event's `.error` string to an AppError. */
export function fromSpeechRecognitionError(errorType: string): AppError {
  if (errorType === "not-allowed" || errorType === "service-not-allowed") {
    return new AppError("mic-permission-denied");
  }
  if (errorType === "audio-capture") {
    return new AppError("no-mic-found");
  }
  if (errorType === "network") {
    return new AppError("network-failure");
  }
  // "no-speech" and "aborted" are routine — callers should treat those as
  // silent/ignorable rather than surfacing an error banner.
  return new AppError("speech-recognition-failed");
}

export function supportsRequiredBrowserFeatures(): boolean {
  if (typeof navigator === "undefined") return true; // SSR guard
  return Boolean(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function");
}

export function supportsSpeechRecognition(): boolean {
  if (typeof window === "undefined") return true; // SSR guard
  return Boolean(
    (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition
  );
}

/** Screen + camera recording needs getDisplayMedia, getUserMedia, canvas
 *  captureStream, and MediaRecorder — all present in Chrome/Edge, missing in
 *  some browsers (e.g. no getDisplayMedia on most mobile browsers). */
export function supportsRecording(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return true; // SSR guard
  return Boolean(
    typeof navigator.mediaDevices?.getDisplayMedia === "function" &&
      typeof navigator.mediaDevices?.getUserMedia === "function" &&
      typeof HTMLCanvasElement !== "undefined" &&
      "captureStream" in HTMLCanvasElement.prototype &&
      typeof MediaRecorder !== "undefined"
  );
}
