"use client";

import type { SessionConfig, SessionReport } from "@/types";

// Phase 1 MVP has no database yet (Supabase persistence lands in Phase 4 —
// see lib/supabase/client.ts). Session config and the final report are
// handed between screens via sessionStorage, which is perfectly fine here:
// this is a real page running in the user's own browser at localhost, not a
// preview surface, and nothing here needs to survive a tab close.

const CONFIG_KEY = "speakflow.sessionConfig";
const REPORT_KEY = "speakflow.lastReport";

export function saveSessionConfig(config: SessionConfig) {
  try {
    sessionStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // sessionStorage can be unavailable (private mode, disabled storage) —
    // the setup screen falls back to passing config via the URL in that case.
  }
}

export function loadSessionConfig(): SessionConfig | null {
  try {
    const raw = sessionStorage.getItem(CONFIG_KEY);
    return raw ? (JSON.parse(raw) as SessionConfig) : null;
  } catch {
    return null;
  }
}

export function saveSessionReport(report: SessionReport) {
  try {
    sessionStorage.setItem(REPORT_KEY, JSON.stringify(report));
  } catch {
    // If storage is unavailable, the report still rendered once client-side;
    // it just won't survive a navigation. Acceptable for the MVP.
  }
}

export function loadSessionReport(): SessionReport | null {
  try {
    const raw = sessionStorage.getItem(REPORT_KEY);
    return raw ? (JSON.parse(raw) as SessionReport) : null;
  } catch {
    return null;
  }
}
