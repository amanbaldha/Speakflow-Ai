"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DeviceSetup, type DeviceSelection } from "@/components/setup/DeviceSetup";
import { ModeAndTopicPicker, type ModeAndTopicValue } from "@/components/setup/ModeAndTopicPicker";
import { saveSessionConfig } from "@/lib/session/storage";
import type { ConversationMode, SessionConfig } from "@/types";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export function SetupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as ConversationMode) || "casual";

  const [devices, setDevices] = useState<DeviceSelection>({
    micDeviceId: null,
    cameraDeviceId: null,
    speakerDeviceId: null,
    cameraEnabled: true,
  });
  const [devicesReady, setDevicesReady] = useState(false);
  const [config, setConfig] = useState<ModeAndTopicValue>({
    mode: initialMode,
    difficulty: "intermediate",
    topic: "random",
    customTopic: "",
    personality: initialMode === "interview" ? "interviewer" : "friendly",
    correctionTiming: "after-answer",
    transcriptEnabled: true,
    recordingEnabled: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const canStart = useMemo(() => devicesReady && !starting, [devicesReady, starting]);

  function handleStart() {
    setStarting(true);
    setError(null);

    const sessionConfig: SessionConfig = {
      mode: config.mode,
      difficulty: config.difficulty,
      topic: config.topic,
      customTopic: config.topic === "custom" ? config.customTopic : undefined,
      personality: config.personality,
      correctionTiming: config.correctionTiming,
    };

    try {
      saveSessionConfig(sessionConfig);
      sessionStorage.setItem(
        "speakflow.deviceSelection",
        JSON.stringify({ ...devices, transcriptEnabled: config.transcriptEnabled })
      );
      router.push("/session");
    } catch {
      setError("Couldn't start the session. Please try again.");
      setStarting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Set up your session</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        You&apos;ll be talking within 10 seconds — just check your mic and pick a topic.
      </p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Camera &amp; microphone</CardTitle>
            <CardDescription>SpeakFlow needs microphone access to hear you.</CardDescription>
          </CardHeader>
          <CardContent>
            <DeviceSetup
              selection={devices}
              onChange={setDevices}
              onError={setError}
              onReady={setDevicesReady}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>Choose how you want to practice today.</CardDescription>
          </CardHeader>
          <CardContent>
            <ModeAndTopicPicker value={config} onChange={setConfig} />
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button size="lg" className="w-full" disabled={!canStart} onClick={handleStart}>
          {starting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Starting…
            </>
          ) : (
            `Start ${config.mode === "interview" ? "Interview" : "Conversation"}`
          )}
        </Button>
      </div>
    </main>
  );
}
