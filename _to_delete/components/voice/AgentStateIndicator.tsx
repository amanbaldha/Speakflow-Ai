"use client";

import { cn } from "@/lib/utils/cn";
import type { AgentState } from "@/types";
import { Loader2, Mic, Volume2 } from "lucide-react";

const LABEL: Record<AgentState, string> = {
  connecting: "Connecting…",
  "pre-connect-buffering": "Connecting…",
  failed: "Connection failed",
  initializing: "Connecting…",
  idle: "Ready",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  disconnected: "Disconnected",
};

const DOT_CLASS: Record<AgentState, string> = {
  connecting: "bg-muted-foreground",
  "pre-connect-buffering": "bg-muted-foreground",
  failed: "bg-destructive",
  initializing: "bg-muted-foreground",
  idle: "bg-muted-foreground",
  listening: "bg-success",
  thinking: "bg-accent",
  speaking: "bg-accent",
  disconnected: "bg-destructive",
};

export function AgentStateIndicator({ state }: { state: AgentState }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-4 py-1.5 text-sm">
      {state === "thinking" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
      ) : state === "speaking" ? (
        <Volume2 className="h-3.5 w-3.5 text-accent" />
      ) : state === "listening" ? (
        <Mic className="h-3.5 w-3.5 text-success" />
      ) : (
        <span className={cn("h-2 w-2 rounded-full", DOT_CLASS[state])} />
      )}
      <span className="text-foreground">{LABEL[state]}</span>
    </div>
  );
}
