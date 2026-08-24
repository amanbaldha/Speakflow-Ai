"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { TranscriptEntry } from "@/types";
import { Copy, Eye, EyeOff, Minus, Plus } from "lucide-react";

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  visible: boolean;
  onToggleVisible: () => void;
}

const SIZE_CLASSES = ["text-xs", "text-sm", "text-base", "text-lg"];

export function TranscriptPanel({ entries, visible, onToggleVisible }: TranscriptPanelProps) {
  const [sizeIndex, setSizeIndex] = useState(1);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = entries.map((e) => `${e.role === "user" ? "You" : "AI"}: ${e.text}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked by permissions — fail silently, non-critical.
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-sm font-medium">Transcript</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setSizeIndex((i) => Math.max(0, i - 1))} aria-label="Decrease text size">
            <Minus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSizeIndex((i) => Math.min(SIZE_CLASSES.length - 1, i + 1))} aria-label="Increase text size">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy transcript">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleVisible} aria-label={visible ? "Hide transcript" : "Show transcript"}>
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {visible && (
        <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
          {copied && <div className="text-xs text-success">Copied!</div>}
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground">The conversation will appear here as you talk.</p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="animate-fade-in">
              <div className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {entry.role === "user" ? "You" : "AI"}
              </div>
              <p className={cn(SIZE_CLASSES[sizeIndex], "leading-relaxed")}>{entry.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
