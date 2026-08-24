"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AgentStateIndicator } from "@/components/voice/AgentStateIndicator";
import { MicVisualizer } from "@/components/voice/MicVisualizer";
import { TranscriptPanel } from "@/components/transcript/TranscriptPanel";
import { FeedbackCard } from "@/components/evaluation/FeedbackCard";
import { LiveScoreBar } from "@/components/evaluation/LiveScoreBar";
import { saveSessionReport } from "@/lib/session/storage";
import { friendlyMessageFor, AppError } from "@/lib/utils/errors";
import { useScreenRecorder } from "@/lib/utils/recorder";
import type { SessionConfig, TurnEvaluation } from "@/types";
import { Mic, MicOff, PhoneOff, Loader2, Video, Square, LayoutTemplate } from "lucide-react";
import { CameraBubble } from "@/components/voice/CameraBubble";
import { useBrowserVoiceAgent } from "@/lib/hooks/useBrowserVoiceAgent";

interface SessionRoomProps {
  config: SessionConfig;
  sessionId: string;
  startedAt: number;
  transcriptEnabledDefault: boolean;
}

export function SessionRoom({ config, sessionId, startedAt, transcriptEnabledDefault }: SessionRoomProps) {
  const router = useRouter();

  const [turnEvaluations, setTurnEvaluations] = useState<TurnEvaluation[]>([]);
  const [latestEvaluation, setLatestEvaluation] = useState<TurnEvaluation | null>(null);
  const [transcriptVisible, setTranscriptVisible] = useState(transcriptEnabledDefault);
  const [scoresVisible, setScoresVisible] = useState(true);
  const [creatorMode, setCreatorMode] = useState(false);
  const [ending, setEnding] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const { isRecording, startRecording, stopRecording } = useScreenRecorder();
  
  // Use our new browser-native voice agent instead of LiveKit
  const { 
    state, 
    transcript, 
    isMicrophoneEnabled, 
    toggleMicrophone, 
    endSession: endVoiceAgent,
    microphoneTrack
  } = useBrowserVoiceAgent({ 
    config,
    onTurnEvaluated: (evaluation) => {
      setTurnEvaluations((prev) => [...prev, evaluation]);
      if (config.correctionTiming !== "end-of-session") {
        setLatestEvaluation(evaluation);
      }
    }
  });

  const endSession = useCallback(async () => {
    if (ending) return;
    setEnding(true);
    endVoiceAgent();
    
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          mode: config.mode,
          topic: config.topic,
          difficulty: config.difficulty,
          startedAt,
          transcript,
          turnEvaluations,
        }),
      });
      const data = await res.json();
      if (data?.report) {
        saveSessionReport(data.report);
      }
    } catch (err) {
      console.error("Failed to generate summary", err);
    } finally {
      router.push("/report");
    }
  }, [ending, endVoiceAgent, sessionId, config, startedAt, transcript, turnEvaluations, router]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        toggleMicrophone();
      } else if (e.key.toLowerCase() === "r") {
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      } else if (e.key.toLowerCase() === "c") {
        setCreatorMode(v => !v);
      } else if (e.key === "Escape") {
        void endSession();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleMicrophone, isRecording, startRecording, stopRecording, endSession]);

  const connectionIssue = state === "failed" ? "Browser speech recognition failed. Please use Chrome/Edge." : null;

  return (
    <div className={`flex h-screen flex-col ${isRecording ? "ring-4 ring-red-500/50 inset-0" : ""}`}>
      {creatorMode && <CameraBubble />}
      
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <p className="text-sm font-medium">
            {config.mode === "interview" ? "Interview" : "Casual Conversation"}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {config.topic.replace("-", " ")} · {config.difficulty}
          </p>
        </div>
        <AgentStateIndicator state={state} />
      </header>

      {(connectionIssue || banner) && (
        <div className="border-b border-border bg-surface-2 px-6 py-2 text-center text-sm text-muted-foreground">
          {connectionIssue || banner}
        </div>
      )}

      <div className="flex flex-1 gap-4 overflow-hidden p-4 sm:p-6">
        <div className="relative flex flex-1 flex-col items-center justify-center gap-8">
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 z-10">
            <FeedbackCard evaluation={latestEvaluation} onDismiss={() => setLatestEvaluation(null)} />
          </div>

          <div className="flex h-40 w-40 items-center justify-center rounded-full border border-border bg-surface-2 text-4xl">
            🤖
          </div>

          <MicVisualizer
            track={undefined}
            muted={!isMicrophoneEnabled}
            active={state === "listening"}
          />

          <div className="flex items-center gap-3">
            <Button
              variant={isMicrophoneEnabled ? "secondary" : "destructive"}
              onClick={() => toggleMicrophone()}
            >
              {isMicrophoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              {isMicrophoneEnabled ? "Mute" : "Unmute"}
            </Button>
            <Button 
              variant={creatorMode ? "default" : "secondary"} 
              onClick={() => setCreatorMode(!creatorMode)}
            >
              <LayoutTemplate className="h-4 w-4" />
              Creator Mode
            </Button>
            <Button
              variant={isRecording ? "destructive" : "default"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={ending}
            >
              {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Video className="h-4 w-4" />}
              {isRecording ? "Stop Recording" : "Record Video"}
            </Button>
            <Button variant="destructive" onClick={() => void endSession()} disabled={ending}>
              {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />}
              End Session
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Space to mute · R to record · C for creator mode · Esc to end
          </p>
        </div>

        <aside className="hidden w-96 shrink-0 flex-col sm:flex">
          <TranscriptPanel
            entries={transcript}
            visible={transcriptVisible}
            onToggleVisible={() => setTranscriptVisible((v) => !v)}
          />
          <LiveScoreBar
            evaluations={turnEvaluations}
            visible={scoresVisible}
            onToggleVisible={() => setScoresVisible((v) => !v)}
          />
        </aside>
      </div>
    </div>
  );
}
