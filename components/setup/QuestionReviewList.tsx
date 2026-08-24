"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { InterviewQuestion } from "@/types";
import { Loader2, Plus, RefreshCw, Sparkles, X } from "lucide-react";

interface QuestionReviewListProps {
  questions: InterviewQuestion[];
  onRemove: (id: string) => void;
  onRegenerateOne: (id: string) => void | Promise<void>;
  regeneratingId: string | null;
  onAddCustom: (text: string) => void;
  onRegenerateAll: () => void | Promise<void>;
  regeneratingAll: boolean;
}

export function QuestionReviewList({
  questions,
  onRemove,
  onRegenerateOne,
  regeneratingId,
  onAddCustom,
  onRegenerateAll,
  regeneratingAll,
}: QuestionReviewListProps) {
  const [customText, setCustomText] = useState("");

  function handleAdd() {
    const trimmed = customText.trim();
    if (!trimmed) return;
    onAddCustom(trimmed);
    setCustomText("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {questions.length} question{questions.length === 1 ? "" : "s"} ready. Remove or regenerate anything that
          doesn&apos;t fit before you start.
        </p>
        <Button size="sm" variant="secondary" onClick={() => void onRegenerateAll()} disabled={regeneratingAll}>
          {regeneratingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Regenerate all
        </Button>
      </div>

      <ol className="space-y-2">
        {questions.map((q, i) => (
          <li
            key={q.id}
            className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3"
          >
            <span className="mt-0.5 text-sm text-muted-foreground">{i + 1}.</span>
            <div className="flex-1">
              <p className="text-sm">{q.text}</p>
              {q.source === "custom" && (
                <Badge variant="muted" className="mt-1.5">
                  Your question
                </Badge>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {q.source === "generated" && (
                <button
                  onClick={() => void onRegenerateOne(q.id)}
                  disabled={regeneratingId === q.id}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground disabled:opacity-50"
                  aria-label="Regenerate this question"
                  title="Regenerate this question"
                >
                  {regeneratingId === q.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </button>
              )}
              <button
                onClick={() => onRemove(q.id)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-destructive"
                aria-label="Remove this question"
                title="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
        {questions.length === 0 && (
          <li className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No questions left — add your own below or regenerate all.
          </li>
        )}
      </ol>

      <div className="flex gap-2 rounded-xl border border-border bg-surface-2 p-2">
        <input
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Type your own question and add it to the list…"
          className="h-10 flex-1 rounded-lg bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Button size="sm" variant="secondary" onClick={handleAdd} disabled={!customText.trim()}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3" /> Questions were generated with the help of live web search where useful.
      </p>
    </div>
  );
}
