"use client";

// A tiny in-memory (client-side only) handoff for the finished session
// recording. There's no backend for this — the video never leaves the
// browser unless the user clicks "Download" — so a plain module-level
// singleton is enough to carry the Blob from the session screen to the
// report screen across a client-side Next.js navigation (the module stays
// loaded as long as the tab doesn't do a full reload).

export interface SessionRecording {
  blob: Blob;
  url: string;
  mimeType: string;
  durationMs: number;
}

let current: SessionRecording | null = null;

export function setSessionRecording(next: SessionRecording | null) {
  if (current?.url) URL.revokeObjectURL(current.url);
  current = next;
}

export function getSessionRecording(): SessionRecording | null {
  return current;
}

export function clearSessionRecording() {
  setSessionRecording(null);
}
