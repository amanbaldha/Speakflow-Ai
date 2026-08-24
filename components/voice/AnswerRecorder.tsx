"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/lib/speech/useSpeechRecognition";
import { cn } from "@/lib/utils/cn";
import { Mic, Square, SkipForward } from "lucide-react";

interface AnswerRecorderProps {
  /** Bumped by the parent whenever it moves to a new question, so this
   *  component knows to clear its transcript even though it never unmounts. */
  resetKey: string;
  onConfirm: (answerText: string, startedAt: number, endedAt: number) => void;
  onSkip: () => void;
  disabled?: boolean;
}

export function AnswerRecorder({ resetKey, onConfirm, onSkip, disabled }: AnswerRecorderProps) {
  const { isSupported, isListening, finalText, interimText, error, start, stop, reset, setFinalText } =
    useSpeechRecognition();

  const startedAtRef = useRef(0);
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const hasStopped = !isListening && (finalText.length > 0 || interimText.length > 0);

  function handleStart() {
    startedAtRef.current = Date.now();
    start();
  }

  function handleStop() {
    stop();
  }

  function handleConfirm() {
    onConfirm(finalText.trim(), startedAtRef.current || Date.now(), Date.now());
  }

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Live transcription needs Chrome or Edge on desktop. Please switch browsers to continue, or{" "}
        <button className="underline" onClick={onSkip}>
          skip this question
        </button>
        .
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isListening && !hasStopped && (
        <div className="flex flex-col items-center gap-3">
          <Button size="lg" onClick={handleStart} disabled={disabled}>
            <Mic className="h-5 w-5" /> Start Speaking
          </Button>
          <button
            onClick={onSkip}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-3 w-3" /> Skip this question
          </button>
        </div>
      )}

      {isListening && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent">
            <span className="absolute inset-0 rounded-full bg-accent/30 animate-pulse-ring" />
            <Mic className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">Listening…</p>
          <div className="min-h-[60px] w-full max-w-xl rounded-xl border border-border bg-surface-2 p-4 text-sm">
            <span>{finalText}</span>{" "}
            <span className="text-muted-foreground italic">{interimText}</span>
            {!finalText && !interimText && <span className="text-muted-foreground">Start talking…</span>}
          </div>
          <Button variant="destructive" onClick={handleStop}>
            <Square className="h-4 w-4" /> Stop Speaking
          </Button>
        </div>
      )}

      {hasStopped && (
        <div className="w-full space-y-3">
          <p className="text-xs text-muted-foreground">
            Here&apos;s what we heard — feel free to fix anything before continuing.
          </p>
          <textarea
            value={finalText}
            onChange={(e) => setFinalText(e.target.value)}
            className={cn(
              "min-h-[100px] w-full resize-y rounded-xl border border-border bg-surface-2 p-4 text-sm outline-none",
              "focus-visible:ring-2 focus-visible:ring-accent"
            )}
          />
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={handleStart}>
              <Mic className="h-4 w-4" /> Re-record
            </Button>
            <Button onClick={handleConfirm}>Confirm Answer</Button>
          </div>
        </div>
      )}

      {error && <p className="text-center text-xs text-destructive">{error}</p>}
    </div>
  );
}
