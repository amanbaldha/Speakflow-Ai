"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MicCheck } from "@/components/setup/MicCheck";
import { QuestionBuilder, type QuestionBuilderValue } from "@/components/setup/QuestionBuilder";
import { QuestionReviewList } from "@/components/setup/QuestionReviewList";
import { savePreparedSession } from "@/lib/session/storage";
import type { ConversationMode, InterviewQuestion, QuestionSetRequest } from "@/types";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

function toRequest(v: QuestionBuilderValue, avoid?: string[]): QuestionSetRequest {
  return {
    mode: v.mode,
    category: v.category,
    topic: v.topic,
    description: v.description.trim() || undefined,
    customLabel: v.customLabel.trim() || undefined,
    difficulty: v.difficulty,
    count: v.count,
    order: v.order,
    avoid,
  };
}

async function requestQuestions(body: QuestionSetRequest): Promise<InterviewQuestion[]> {
  const res = await fetch("/api/questions/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Question generation failed");
  return data.questions as InterviewQuestion[];
}

export function SetupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as ConversationMode) || "casual";

  const [phase, setPhase] = useState<"build" | "review">("build");
  const [builder, setBuilder] = useState<QuestionBuilderValue>({
    mode: initialMode,
    category: "hr",
    topic: "random",
    customLabel: "",
    difficulty: "intermediate",
    description: "",
    count: 10,
    order: "sequential",
  });
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [micReady, setMicReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canStart = useMemo(() => questions.length > 0 && micReady, [questions.length, micReady]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const result = await requestQuestions(toRequest(builder));
      setQuestions(result);
      setPhase("review");
    } catch (err) {
      console.error(err);
      setError("Couldn't generate questions right now. Please try again in a moment.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerateAll() {
    setRegeneratingAll(true);
    setError(null);
    try {
      const avoid = questions.filter((q) => q.source === "generated").map((q) => q.text);
      const result = await requestQuestions(toRequest(builder, avoid));
      setQuestions(result);
    } catch (err) {
      console.error(err);
      setError("Couldn't regenerate questions right now. Please try again.");
    } finally {
      setRegeneratingAll(false);
    }
  }

  async function handleRegenerateOne(id: string) {
    setRegeneratingId(id);
    setError(null);
    try {
      const avoid = questions.map((q) => q.text);
      const [replacement] = await requestQuestions(toRequest({ ...builder, count: 1 }, avoid));
      if (replacement) {
        setQuestions((prev) => prev.map((q) => (q.id === id ? replacement : q)));
      }
    } catch (err) {
      console.error(err);
      setError("Couldn't regenerate that question. Please try again.");
    } finally {
      setRegeneratingId(null);
    }
  }

  function handleRemove(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function handleAddCustom(text: string) {
    setQuestions((prev) => [...prev, { id: crypto.randomUUID(), text, source: "custom" }]);
  }

  function handleStart() {
    savePreparedSession({ request: toRequest(builder), questions });
    router.push("/session");
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        {phase === "build" ? "Build your question set" : "Review your questions"}
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {phase === "build"
          ? "Tell us what to ask you — we'll generate real, relevant questions before you start."
          : "You're in control — remove, regenerate, or add your own before starting."}
      </p>

      <div className="space-y-6">
        {phase === "build" ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
                <CardDescription>Choose what you want to be asked today.</CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionBuilder value={builder} onChange={setBuilder} />
              </CardContent>
            </Card>

            <MicCheck onReady={setMicReady} />

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button size="lg" className="w-full" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Searching the web and preparing your questions…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" /> Generate Questions
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <QuestionReviewList
                  questions={questions}
                  onRemove={handleRemove}
                  onRegenerateOne={handleRegenerateOne}
                  regeneratingId={regeneratingId}
                  onAddCustom={handleAddCustom}
                  onRegenerateAll={handleRegenerateAll}
                  regeneratingAll={regeneratingAll}
                />
              </CardContent>
            </Card>

            <MicCheck onReady={setMicReady} />

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPhase("build")}>
                Back
              </Button>
              <Button size="lg" className="flex-1" disabled={!canStart} onClick={handleStart}>
                Start {builder.mode === "interview" ? "Interview" : "Practice"}
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
