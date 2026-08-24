"use client";

import { Loader2 } from "lucide-react";
import type { QuestionAnalysis } from "@/types";

interface FeedbackCardProps {
  analysis: QuestionAnalysis | null;
  pending: boolean;
}

const SCORE_LABELS: Array<{ key: keyof QuestionAnalysis["scores"]; label: string }> = [
  { key: "relevance", label: "Relevance" },
  { key: "fluency", label: "Fluency" },
  { key: "grammar", label: "Grammar" },
  { key: "clarity", label: "Clarity" },
];

/** Shown right after the user confirms an answer — a real, per-question
 *  analysis result (never faked): while it's in flight this shows a plain
 *  "Analyzing…" state, and once it resolves shows the actual scores,
 *  feedback, and (if useful) a quick correction and prep tip. */
export function FeedbackCard({ analysis, pending }: FeedbackCardProps) {
  if (pending) {
    return (
      <div className="flex w-full max-w-xl items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your answer…
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface px-4 py-4 text-center text-sm text-muted-foreground">
        We couldn&apos;t analyze this answer right now — it&apos;s still saved and will be part of your final report.
      </div>
    );
  }

  const topCorrection = analysis.corrections[0];

  return (
    <div className="w-full max-w-xl space-y-3 rounded-2xl border border-border bg-surface p-5 text-left">
      <div className="flex flex-wrap gap-4">
        {SCORE_LABELS.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-semibold text-accent">{analysis.scores[key]}</span>
            <span className="text-[11px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <p className="text-sm text-success">{analysis.feedback}</p>

      {topCorrection && (
        <p className="text-sm text-muted-foreground">
          <span className="line-through">{topCorrection.original}</span> →{" "}
          <span className="text-foreground">{topCorrection.improved}</span>
        </p>
      )}

      {analysis.modelAnswerTip && (
        <p className="rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
          💡 {analysis.modelAnswerTip}
        </p>
      )}
    </div>
  );
}
