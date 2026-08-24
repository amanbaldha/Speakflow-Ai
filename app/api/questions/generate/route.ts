import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { generateStructured, LocalModelError } from "@/lib/ai/localModel";
import { questionGeneratorPrompt, questionGeneratorFormat } from "@/prompts/questionGeneratorPrompt";
import type { InterviewQuestion, QuestionSetRequest } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

export async function POST(req: NextRequest) {
  let body: QuestionSetRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body?.mode || !body?.difficulty || !body?.count) {
    return NextResponse.json({ error: "mode, difficulty and count are required." }, { status: 400 });
  }

  const count = Math.min(30, Math.max(1, Math.round(body.count)));

  try {
    const parsed = await generateStructured<{ questions: string[] }>(
      [{ role: "user", content: questionGeneratorPrompt({ ...body, count }) }],
      questionGeneratorFormat
    );

    let texts = parsed.questions.filter((q) => q && q.trim().length > 0);
    if (body.order === "random") texts = shuffle(texts);
    texts = texts.slice(0, count);

    const questions: InterviewQuestion[] = texts.map((text) => ({
      id: randomUUID(),
      text: text.trim(),
      source: "generated",
    }));

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[api/questions/generate] failed:", err);
    const message =
      err instanceof LocalModelError
        ? err.message
        : "Couldn't generate questions right now. Please try again in a moment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
