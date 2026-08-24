import { NextRequest, NextResponse } from "next/server";
import { generateStructured, LocalModelError } from "@/lib/ai/localModel";
import { questionAnalysisPrompt, questionAnalysisFormat } from "@/prompts/questionAnalysisPrompt";
import type { ConversationMode, Difficulty, QuestionAnalysis } from "@/types";

export const runtime = "nodejs";

interface AnalyzeRequestBody {
  mode: ConversationMode;
  difficulty: Difficulty;
  questionText: string;
  answerText: string;
}

export async function POST(req: NextRequest) {
  let body: AnalyzeRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body?.questionText || typeof body.answerText !== "string") {
    return NextResponse.json({ error: "questionText and answerText are required." }, { status: 400 });
  }

  try {
    const analysis = await generateStructured<QuestionAnalysis>(
      [
        { role: "system", content: questionAnalysisPrompt(body.mode, body.difficulty) },
        {
          role: "user",
          content: JSON.stringify({
            question: body.questionText,
            answer: body.answerText.trim() || "(no answer given)",
          }),
        },
      ],
      questionAnalysisFormat
    );

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[api/questions/analyze-answer] failed:", err);
    const message = err instanceof LocalModelError ? err.message : "Analysis failed.";
    return NextResponse.json({ error: message, analysis: null }, { status: 500 });
  }
}
