"use client";

import type { PreparedSession, SessionReport } from "@/types";

// There's no database yet (Supabase persistence lands in Phase 4 — see
// lib/supabase/client.ts). The prepared question set and the final report
// are handed between screens via sessionStorage, which is perfectly fine
// here: this is a real page running in the user's own browser at
// localhost, not a preview surface, and nothing here needs to survive a
// tab close.

const PREPARED_KEY = "speakflow.preparedSession";
const REPORT_KEY = "speakflow.lastReport";

export function savePreparedSession(session: PreparedSession) {
  try {
    sessionStorage.setItem(PREPARED_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage can be unavailable (private mode, disabled storage) —
    // in that case the user just has to redo setup if they navigate away.
  }
}

export function loadPreparedSession(): PreparedSession | null {
  try {
    const raw = sessionStorage.getItem(PREPARED_KEY);
    return raw ? (JSON.parse(raw) as PreparedSession) : null;
  } catch {
    return null;
  }
}

export function saveSessionReport(report: SessionReport) {
  try {
    sessionStorage.setItem(REPORT_KEY, JSON.stringify(report));
  } catch {
    // If storage is unavailable, the report still rendered once client-side;
    // it just won't survive a navigation. Acceptable for now.
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
