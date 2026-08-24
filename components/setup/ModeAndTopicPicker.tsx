"use client";

import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import type {
  AiPersonality,
  ConversationMode,
  CorrectionTiming,
  Difficulty,
  Topic,
} from "@/types";

const TOPIC_OPTIONS: Array<{ value: Topic; label: string }> = [
  { value: "daily-life", label: "Daily Life" },
  { value: "technology", label: "Technology" },
  { value: "work", label: "Work" },
  { value: "travel", label: "Travel" },
  { value: "food", label: "Food" },
  { value: "movies", label: "Movies" },
  { value: "current-events", label: "Current Events" },
  { value: "random", label: "Random" },
  { value: "custom", label: "Custom Topic" },
];

const DIFFICULTY_OPTIONS: Array<{ value: Difficulty; label: string }> = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const PERSONALITY_OPTIONS: Array<{ value: AiPersonality; label: string }> = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "interviewer", label: "Interviewer" },
  { value: "strict-interviewer", label: "Strict Interviewer" },
];

const CORRECTION_OPTIONS: Array<{ value: CorrectionTiming; label: string }> = [
  { value: "after-answer", label: "After each answer" },
  { value: "end-of-session", label: "End of session only" },
  { value: "real-time", label: "Real-time (correct me while speaking)" },
];

export interface ModeAndTopicValue {
  mode: ConversationMode;
  difficulty: Difficulty;
  topic: Topic;
  customTopic: string;
  personality: AiPersonality;
  correctionTiming: CorrectionTiming;
  transcriptEnabled: boolean;
  recordingEnabled: boolean;
}

interface Props {
  value: ModeAndTopicValue;
  onChange: (value: ModeAndTopicValue) => void;
}

export function ModeAndTopicPicker({ value, onChange }: Props) {
  const set = <K extends keyof ModeAndTopicValue>(key: K, v: ModeAndTopicValue[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => set("mode", "casual")}
          className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
            value.mode === "casual"
              ? "border-accent bg-accent/10"
              : "border-border bg-surface-2 hover:bg-surface-2/70"
          }`}
        >
          <div className="font-medium">🗣️ Casual Mode</div>
          <div className="text-xs text-muted-foreground">Free-flowing conversation, no fixed questions.</div>
        </button>
        <button
          type="button"
          onClick={() => set("mode", "interview")}
          className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
            value.mode === "interview"
              ? "border-accent bg-accent/10"
              : "border-border bg-surface-2 hover:bg-surface-2/70"
          }`}
        >
          <div className="font-medium">🎤 Interview Mode</div>
          <div className="text-xs text-muted-foreground">A realistic mock interview that adapts to your answers.</div>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">Difficulty</label>
          <Select
            options={DIFFICULTY_OPTIONS}
            value={value.difficulty}
            onChange={(v) => set("difficulty", v as Difficulty)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            {value.mode === "interview" ? "AI personality" : "AI personality"}
          </label>
          <Select
            options={PERSONALITY_OPTIONS}
            value={value.personality}
            onChange={(v) => set("personality", v as AiPersonality)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-muted-foreground">
          {value.mode === "interview" ? "Interview focus" : "Topic"}
        </label>
        <Select options={TOPIC_OPTIONS} value={value.topic} onChange={(v) => set("topic", v as Topic)} />
        {value.topic === "custom" && (
          <input
            className="mt-2 h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
            placeholder={value.mode === "interview" ? "e.g. Frontend engineer interview" : "e.g. My favorite hobbies"}
            value={value.customTopic}
            onChange={(e) => set("customTopic", e.target.value)}
          />
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-muted-foreground">Correction timing</label>
        <Select
          options={CORRECTION_OPTIONS}
          value={value.correctionTiming}
          onChange={(v) => set("correctionTiming", v as CorrectionTiming)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
          <div className="text-sm">Live transcript</div>
          <Toggle checked={value.transcriptEnabled} onChange={(v) => set("transcriptEnabled", v)} label="Toggle transcript" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/60 px-4 py-3 opacity-70">
          <div className="text-sm">
            Screen + camera recording <span className="text-xs text-muted-foreground">(Phase 3)</span>
          </div>
          <Toggle checked={false} onChange={() => {}} disabled label="Recording (coming in Phase 3)" />
        </div>
      </div>
    </div>
  );
}
