// Central place to turn low-level browser/API errors into the human-readable
// messages required by spec section 22 ("Error Handling") — never surface a
// raw stack trace or DOMException name to the user.

export type AppErrorCode =
  | "mic-permission-denied"
  | "camera-permission-denied"
  | "no-mic-found"
  | "no-camera-found"
  | "device-disconnected"
  | "network-failure"
  | "livekit-connect-failed"
  | "agent-timeout"
  | "browser-unsupported"
  | "token-request-failed"
  | "summary-failed"
  | "unknown";

const MESSAGES: Record<AppErrorCode, string> = {
  "mic-permission-denied":
    "SpeakFlow needs microphone access to hear you. Please allow microphone permission in your browser's address-bar icon, then try again.",
  "camera-permission-denied":
    "Camera access was blocked. You can still practice with audio only, or allow camera permission in your browser settings and refresh.",
  "no-mic-found":
    "No microphone was found. Please connect a microphone and refresh the page.",
  "no-camera-found":
    "No camera was found. You can continue with audio only.",
  "device-disconnected":
    "Your microphone or camera was disconnected. Please reconnect it and rejoin the session.",
  "network-failure":
    "We lost connection to the network. Check your internet connection and try again.",
  "livekit-connect-failed":
    "Couldn't connect to the voice session. This is usually a temporary network issue — please try again in a moment.",
  "agent-timeout":
    "The AI didn't respond in time. Please try again — if this keeps happening, check your OpenAI/LiveKit configuration.",
  "browser-unsupported":
    "Your browser doesn't support a feature SpeakFlow needs (microphone/WebRTC). Please use a recent version of Chrome or Edge.",
  "token-request-failed":
    "We couldn't start a new session right now. Please try again in a moment.",
  "summary-failed":
    "We couldn't generate your session report right now, but your conversation is safe. You can try again from this screen.",
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

export function supportsRequiredBrowserFeatures(): boolean {
  if (typeof navigator === "undefined") return true; // SSR guard
  return Boolean(
    navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      typeof window.RTCPeerConnection === "function"
  );
}
