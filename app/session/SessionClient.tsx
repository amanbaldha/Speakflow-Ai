"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InterviewRunner } from "@/components/voice/InterviewRunner";
import { loadPreparedSession } from "@/lib/session/storage";
import type { PreparedSession } from "@/types";
import { Loader2 } from "lucide-react";

export function SessionClient() {
  const router = useRouter();
  const [prepared, setPrepared] = useState<PreparedSession | null | undefined>(undefined);
  const startedAtRef = useRef(Date.now());
  const sessionIdRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `session-${Date.now()}`
  );

  useEffect(() => {
    const stored = loadPreparedSession();
    if (!stored || stored.questions.length === 0) {
      router.replace("/setup");
      return;
    }
    setPrepared(stored);
  }, [router]);

  if (prepared === undefined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!prepared) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">No questions found. Let&apos;s set up a session first.</p>
        <Button onClick={() => router.push("/setup")}>Back to setup</Button>
      </div>
    );
  }

  return <InterviewRunner prepared={prepared} sessionId={sessionIdRef.current} startedAt={startedAtRef.current} />;
}
