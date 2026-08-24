"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fromGetUserMediaError, supportsRequiredBrowserFeatures, supportsSpeechRecognition } from "@/lib/utils/errors";
import { CheckCircle2, Mic, AlertCircle } from "lucide-react";

interface MicCheckProps {
  onReady: (ready: boolean) => void;
}

/** A lightweight permission check — SpeechRecognition always uses the
 *  browser's default input device (there's no way to target a specific
 *  microphone from the Web Speech API), so unlike the old device-picker
 *  screen this just confirms access works at all before the session starts. */
export function MicCheck({ onReady }: MicCheckProps) {
  const [status, setStatus] = useState<"idle" | "checking" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function check() {
    setStatus("checking");
    setError(null);

    if (!supportsRequiredBrowserFeatures() || !supportsSpeechRecognition()) {
      setStatus("error");
      setError("Live transcription needs Chrome or Edge on desktop. Please switch browsers to continue.");
      onReady(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setStatus("ready");
      onReady(true);
    } catch (err) {
      setStatus("error");
      setError(fromGetUserMediaError(err, "mic").friendlyMessage);
      onReady(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        {status === "ready" ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : status === "error" ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Mic className="h-4 w-4 text-muted-foreground" />
        )}
        <span>
          {status === "ready"
            ? "Microphone ready"
            : status === "error"
              ? error
              : "We'll need microphone access to hear your answers"}
        </span>
      </div>
      {status !== "ready" && (
        <Button size="sm" variant="secondary" onClick={check} disabled={status === "checking"}>
          {status === "checking" ? "Checking…" : "Check microphone"}
        </Button>
      )}
    </div>
  );
}
