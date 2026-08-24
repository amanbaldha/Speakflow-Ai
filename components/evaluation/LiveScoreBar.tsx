"use client";

import { Button } from "@/components/ui/button";
import type { TurnEvaluation } from "@/types";
import { Eye, EyeOff } from "lucide-react";

interface LiveScoreBarProps {
  evaluations: TurnEvaluation[];
  visible: boolean;
  onToggleVisible: () => void;
}

function average(evaluations: TurnEvaluation[], key: keyof TurnEvaluation["scores"]): number | null {
  if (evaluations.length === 0) return null;
  return Math.round(evaluations.reduce((sum, e) => sum + e.scores[key], 0) / evaluations.length);
}

export function LiveScoreBar({ evaluations, visible, onToggleVisible }: LiveScoreBarProps) {
  const fluency = average(evaluations, "fluency");
  const vocabulary = average(evaluations, "vocabulary");

  return (
    <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm">
      {visible ? (
        <div className="flex items-center gap-5 text-muted-foreground">
          <span>Fluency: <span className="text-foreground">{fluency ?? "—"}{fluency !== null && "%"}</span></span>
          <span>Vocabulary: <span className="text-foreground">{vocabulary ?? "—"}{vocabulary !== null && "%"}</span></span>
        </div>
      ) : (
        <span className="text-muted-foreground">Scores hidden</span>
      )}
      <Button variant="ghost" size="sm" onClick={onToggleVisible}>
        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {visible ? "Hide scores" : "Show scores"}
      </Button>
    </div>
  );
}
