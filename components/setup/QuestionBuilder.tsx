"use client";

import { Select } from "@/components/ui/select";
import type { ConversationMode, Difficulty, InterviewCategory, CasualTopic, QuestionOrder } from "@/types";

const CATEGORY_OPTIONS: Array<{ value: InterviewCategory; label: string }> = [
  { value: "hr", label: "HR" },
  { value: "android", label: "Android" },
  { value: "dsa", label: "DSA" },
  { value: "system-design", label: "System Design" },
  { value: "behavioral", label: "Behavioral" },
  { value: "casual", label: "Casual" },
  { value: "custom", label: "Custom" },
];

const TOPIC_OPTIONS: Array<{ value: CasualTopic; label: string }> = [
  { value: "daily-life", label: "Daily Life" },
  { value: "technology", label: "Technology" },
  { value: "work", label: "Work" },
  { value: "travel", label: "Travel" },
  { value: "food", label: "Food" },
  { value: "movies", label: "Movies" },
  { value: "current-events", label: "Current Events" },
  { value: "random", label: "Random" },
  { value: "custom", label: "Custom" },
];

const DIFFICULTY_OPTIONS: Array<{ value: Difficulty; label: string }> = [
  { value: "beginner", label: "Beginner / Fresher" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced / Senior" },
];

const COUNT_PRESETS = [5, 10, 15];

export interface QuestionBuilderValue {
  mode: ConversationMode;
  category: InterviewCategory;
  topic: CasualTopic;
  customLabel: string;
  difficulty: Difficulty;
  description: string;
  count: number;
  order: QuestionOrder;
}

interface Props {
  value: QuestionBuilderValue;
  onChange: (value: QuestionBuilderValue) => void;
}

export function QuestionBuilder({ value, onChange }: Props) {
  const set = <K extends keyof QuestionBuilderValue>(key: K, v: QuestionBuilderValue[K]) =>
    onChange({ ...value, [key]: v });

  const isCustom = value.mode === "interview" ? value.category === "custom" : value.topic === "custom";

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => set("mode", "casual")}
          className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
            value.mode === "casual" ? "border-accent bg-accent/10" : "border-border bg-surface-2 hover:bg-surface-2/70"
          }`}
        >
          <div className="font-medium">🗣️ Casual Practice</div>
          <div className="text-xs text-muted-foreground">Friendly spoken-English topics, one at a time.</div>
        </button>
        <button
          type="button"
          onClick={() => set("mode", "interview")}
          className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
            value.mode === "interview" ? "border-accent bg-accent/10" : "border-border bg-surface-2 hover:bg-surface-2/70"
          }`}
        >
          <div className="font-medium">🎤 Mock Interview</div>
          <div className="text-xs text-muted-foreground">Real interview questions, answered one by one.</div>
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-muted-foreground">
          {value.mode === "interview" ? "What type of interview?" : "Topic"}
        </label>
        <div className="flex flex-wrap gap-2">
          {(value.mode === "interview" ? CATEGORY_OPTIONS : TOPIC_OPTIONS).map((opt) => {
            const selected = value.mode === "interview" ? value.category === opt.value : value.topic === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  value.mode === "interview"
                    ? set("category", opt.value as InterviewCategory)
                    : set("topic", opt.value as CasualTopic)
                }
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  selected ? "border-accent bg-accent/10 text-foreground" : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {isCustom && (
          <input
            className="mt-2 h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
            placeholder={value.mode === "interview" ? "e.g. Backend engineer, Node.js focus" : "e.g. My hobbies and weekend plans"}
            value={value.customLabel}
            onChange={(e) => set("customLabel", e.target.value)}
          />
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-muted-foreground">
          Describe what you want (optional) — like telling a friend what to ask you
        </label>
        <textarea
          className="min-h-[84px] w-full resize-y rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          placeholder={
            value.mode === "interview"
              ? "e.g. \"I want DSA questions on arrays and dynamic programming, for a 2-year-experience candidate\""
              : "e.g. \"Ask me casual questions about traveling and food\""
          }
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            {value.mode === "interview" ? "Experience level" : "Difficulty"}
          </label>
          <Select
            options={DIFFICULTY_OPTIONS}
            value={value.difficulty}
            onChange={(v) => set("difficulty", v as Difficulty)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">Order</label>
          <Select
            options={[
              { value: "sequential", label: "Sequential" },
              { value: "random", label: "Random / shuffled" },
            ]}
            value={value.order}
            onChange={(v) => set("order", v as QuestionOrder)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-muted-foreground">How many questions?</label>
        <div className="flex flex-wrap items-center gap-2">
          {COUNT_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set("count", n)}
              className={`h-10 w-14 rounded-xl border text-sm transition-colors ${
                value.count === n ? "border-accent bg-accent/10" : "border-border bg-surface-2 hover:bg-surface-2/70"
              }`}
            >
              {n}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={30}
            value={value.count}
            onChange={(e) => set("count", Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
            className="h-10 w-20 rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Custom number of questions"
          />
        </div>
      </div>
    </div>
  );
}
