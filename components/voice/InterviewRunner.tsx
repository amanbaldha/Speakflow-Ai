"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/voice/QuestionCard";
import { AnswerRecorder } from "@/components/voice/AnswerRecorder";
import { FeedbackCard } from "@/components/evaluation/FeedbackCard";
import { CameraPreview } from "@/components/recording/CameraPreview";
import { useSessionRecorder } from "@/lib/recording/useSessionRecorder";
import { saveSessionReport } from "@/lib/session/storage";
import { supportsRecording } from "@/lib/utils/errors";
import type { PreparedSession, QAEntry, QuestionAnalysis } from "@/types";
import { Loader2, PhoneOff, Video, VideoOff } from "lucide-react";

interface InterviewRunnerProps {
  prepared: PreparedSession;
  sessionId: string;
  startedAt: number;
}

type QuestionStage = "answering" | "skipped" | "confirmed";

export function InterviewRunner({ prepared, sessionId, startedAt }: InterviewRunnerProps) {
  const router = useRouter();
  const { questions, request } = prepared;
  const recorder = useSessionRecorder();

  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<QuestionStage>("answering");
  const [currentAnalysis, setCurrentAnalysis] = useState<QuestionAnalysis | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qaEntriesRef = useRef<QAEntry[]>([]);
  const pendingPromisesRef = useRef<Promise<void>[]>([]);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const canRecord = supportsRecording();

  const runAnalysis = useCallback(
    async (index: number, questionText: string, answerText: string) => {
      setPendingAnalysis(true);
      try {
        const res = await fetch("/api/questions/analyze-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: request.mode,
            difficulty: request.difficulty,
            questionText,
            answerText,
          }),
        });
        const data = await res.json();
        const analysis: QuestionAnalysis | null = res.ok ? data.analysis : null;
        const entry = qaEntriesRef.current[index];
        if (entry) entry.analysis = analysis;
        if (index === currentIndex) setCurrentAnalysis(analysis);
      } catch (err) {
        console.error("Answer analysis failed", err);
        if (index === currentIndex) setCurrentAnalysis(null);
      } finally {
        if (index === currentIndex) setPendingAnalysis(false);
      }
    },
    [currentIndex, request.difficulty, request.mode]
  );

  // Once permissions are granted and recording actually starts, move past
  // the gate screen automatically (rather than making the user click twice).
  useEffect(() => {
    if (recorder.status === "recording") setSessionStarted(true);
  }, [recorder.status]);

  if (!sessionStarted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Ready to begin?</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {canRecord
            ? "You can record this whole session — your screen plus a small live view of your face in the bottom-right corner — as one video you can download afterward. Your browser will ask for screen-share, camera, and microphone permission."
            : "This browser doesn't support screen + camera recording, but you can still practice — live transcript and AI feedback both work normally."}
        </p>

        {recorder.status === "error" && recorder.error && (
          <p className="max-w-md rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {recorder.error.friendlyMessage}
          </p>
        )}

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          {canRecord && (
            <Button
              size="lg"
              onClick={async () => {
                await recorder.start();
              }}
              disabled={recorder.status === "requesting" || recorder.status === "recording"}
            >
              {recorder.status === "requesting" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Requesting permissions…
                </>
              ) : (
                <>
                  <Video className="h-5 w-5" /> Start with Recording
                </>
              )}
            </Button>
          )}
          <Button
            size="lg"
            variant={canRecord ? "secondary" : "default"}
            onClick={() => setSessionStarted(true)}
            disabled={recorder.status === "requesting"}
          >
            <VideoOff className="h-5 w-5" /> {canRecord ? "Skip Recording, Just Practice" : "Start Practicing"}
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    // Only reachable if questions is empty, which SessionClient already
    // guards against before rendering this component at all.
    return null;
  }

  const handleConfirm = (answerText: string, startedAtMs: number, endedAtMs: number) => {
    const entry: QAEntry = {
      question: currentQuestion,
      answerText,
      startedAt: startedAtMs,
      endedAt: endedAtMs,
      analysis: null,
    };
    qaEntriesRef.current[currentIndex] = entry;
    setStage("confirmed");
    setCurrentAnalysis(null);

    if (answerText.trim()) {
      const promise = runAnalysis(currentIndex, currentQuestion.text, answerText);
      pendingPromisesRef.current.push(promise);
    }
  };

  const handleSkip = () => {
    qaEntriesRef.current[currentIndex] = {
      question: currentQuestion,
      answerText: "",
      startedAt: Date.now(),
      endedAt: Date.now(),
      analysis: null,
    };
    setStage("skipped");
  };

  const goToNext = () => {
    setCurrentIndex((i) => i + 1);
    setStage("answering");
    setCurrentAnalysis(null);
    setPendingAnalysis(false);
  };

  const handleFinish = async () => {
    setFinishing(true);
    setError(null);
    try {
      if (recorder.status === "recording") {
        await recorder.stop();
      }
      await Promise.allSettled(pendingPromisesRef.current);
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          mode: request.mode,
          category: request.category,
          topic: request.topic,
          difficulty: request.difficulty,
          startedAt,
          qaEntries: qaEntriesRef.current,
        }),
      });
      const data = await res.json();
      if (data?.report) saveSessionReport(data.report);
    } catch (err) {
      console.error("Failed to generate summary", err);
    } finally {
      router.push("/report");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <p className="text-sm font-medium">
          {request.mode === "interview" ? "Mock Interview" : "Casual Practice"}
        </p>
        <div className="flex items-center gap-3">
          {recorder.status === "recording" && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" /> Recording
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (recorder.status === "recording") await recorder.stop();
              router.push("/");
            }}
          >
            <PhoneOff className="h-4 w-4" /> Exit
          </Button>
        </div>
      </header>

      {error && (
        <div className="border-b border-border bg-surface-2 px-6 py-2 text-center text-sm text-muted-foreground">
          {error}
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12">
        <QuestionCard index={currentIndex} total={questions.length} text={currentQuestion.text} />

        {stage === "answering" && (
          <AnswerRecorder resetKey={currentQuestion.id} onConfirm={handleConfirm} onSkip={handleSkip} />
        )}

        {stage === "skipped" && (
          <div className="w-full max-w-xl rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Question skipped.
          </div>
        )}

        {(stage === "confirmed" || stage === "skipped") && (
          <>
            {stage === "confirmed" && <FeedbackCard analysis={currentAnalysis} pending={pendingAnalysis} />}
            <Button size="lg" onClick={isLast ? handleFinish : goToNext} disabled={finishing}>
              {finishing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Preparing your report…
                </>
              ) : isLast ? (
                "Finish & See Report"
              ) : (
                "Next Question"
              )}
            </Button>
          </>
        )}
      </div>

      <CameraPreview stream={recorder.cameraStream} />
    </div>
  );
}
