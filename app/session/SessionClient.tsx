"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionRoom } from "@/components/voice/SessionRoom";
import { loadSessionConfig } from "@/lib/session/storage";
import type { SessionConfig } from "@/types";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SessionClient() {
  const router = useRouter();
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcriptDefault, setTranscriptDefault] = useState(true);
  const startedAtRef = useRef(Date.now());
  const sessionIdRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `session-${Date.now()}`
  );

  useEffect(() => {
    const stored = loadSessionConfig();
    if (!stored) {
      router.replace("/setup");
      return;
    }
    setConfig(stored);

    try {
      const rawDevices = sessionStorage.getItem("speakflow.deviceSelection");
      if (rawDevices) {
        const parsed = JSON.parse(rawDevices);
        if (typeof parsed.transcriptEnabled === "boolean") setTranscriptDefault(parsed.transcriptEnabled);
      }
    } catch {
      // Non-critical UI preference — default (transcript on) is fine.
    }
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => router.push("/setup")}>Back to setup</Button>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Initializing session…</p>
      </div>
    );
  }

  return (
    <SessionRoom
      config={config}
      sessionId={sessionIdRef.current}
      startedAt={startedAtRef.current}
      transcriptEnabledDefault={transcriptDefault}
    />
  );
}
