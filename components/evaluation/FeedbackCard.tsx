"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { TurnEvaluation } from "@/types";

interface FeedbackCardProps {
  evaluation: TurnEvaluation | null;
  onDismiss: () => void;
}

/** A small, non-intrusive card — spec section 9: "Do not overwhelm the
 *  user." Shows one positive note plus (at most) one gentle correction,
 *  auto-dismisses after a few seconds, and is fully optional to show. */
export function FeedbackCard({ evaluation, onDismiss }: FeedbackCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!evaluation) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, [evaluation]);

  if (!evaluation || !visible) return null;
  const topCorrection = evaluation.corrections[0];

  return (
    <div className="animate-fade-in pointer-events-auto max-w-sm rounded-2xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-success">{evaluation.positiveNote || "Nice answer!"}</p>
        <button
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss feedback"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {topCorrection && (
        <div className="mt-2 space-y-1 text-sm">
          <p className="text-muted-foreground">
            <span className="line-through">{topCorrection.original}</span> →{" "}
            <span className="text-foreground">{topCorrection.improved}</span>
          </p>
        </div>
      )}
    </div>
  );
}
