import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, EVAL_MODEL } from "@/lib/ai/openai";
import { sessionSummaryPrompt, sessionSummarySchema } from "@/prompts/sessionSummaryPrompt";
import type {
  ConversationMode,
  Difficulty,
  SessionReport,
  Topic,
  TranscriptEntry,
  TurnEvaluation,
} from "@/types";

export const runtime = "nodejs";

interface SummaryRequestBody {
  sessionId: string;
  mode: ConversationMode;
  topic: Topic;
  difficulty: Difficulty;
  startedAt: number;
  transcript: TranscriptEntry[];
  turnEvaluations: TurnEvaluation[];
}

function formatTranscript(transcript: TranscriptEntry[]): string {
  return transcript
    .filter((t) => t.isFinal && t.text.trim())
    .map((t) => `${t.role === "user" ? "USER" : "AI"}: ${t.text.trim()}`)
    .join("\n");
}

function fallbackReport(body: SummaryRequestBody): SessionReport {
  // Used only if the model call fails outright — still gives the user a
  // real, data-derived (if minimal) report instead of a dead end.
  const userTurns = body.transcript.filter((t) => t.role === "user" && t.isFinal);
  const words = userTurns.reduce((sum, t) => sum + t.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const avgScore = (key: keyof TurnEvaluation["scores"]) =>
    body.turnEvaluations.length
      ? Math.round(
          body.turnEvaluations.reduce((s, e) => s + e.scores[key], 0) / body.turnEvaluations.length
        )
      : 60;

  return {
    sessionId: body.sessionId,
    mode: body.mode,
    topic: body.topic,
    difficulty: body.difficulty,
    startedAt: body.startedAt,
    endedAt: Date.now(),
    overallScore: avgScore("fluency"),
    scores: {
      fluency: avgScore("fluency"),
      grammar: avgScore("grammar"),
      vocabulary: avgScore("vocabulary"),
      clarity: avgScore("clarity"),
      confidence: avgScore("confidence"),
    },
    whatYouDidWell: ["You kept the conversation going and completed the session."],
    thingsToImprove: ["We couldn't generate detailed feedback this time — try ending another session."],
    commonMistakes: [],
    betterVocabulary: [],
    stats: {
      totalSpeakingTimeSeconds: Math.round(words / 2.5),
      numberOfTurns: userTurns.length,
      averageResponseLengthWords: userTurns.length ? Math.round(words / userTurns.length) : 0,
      fillerWordCount: body.turnEvaluations.reduce((s, e) => s + e.fillerWordCount, 0),
      longPauseCount: 0,
      questionsAskedByUser: userTurns.filter((t) => t.text.includes("?")).length,
      questionsAnsweredByUser: userTurns.length,
    },
  };
}

export async function POST(req: NextRequest) {
  let body: SummaryRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body?.sessionId || !Array.isArray(body.transcript)) {
    return NextResponse.json({ error: "sessionId and transcript are required." }, { status: 400 });
  }

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: EVAL_MODEL,
      messages: [
        { role: "system", content: sessionSummaryPrompt() },
        {
          role: "user",
          content: JSON.stringify({
            transcript: formatTranscript(body.transcript),
            turnEvaluations: body.turnEvaluations,
          }),
        },
      ],
      response_format: { type: "json_schema", json_schema: sessionSummarySchema },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty completion from model.");
    const parsed = JSON.parse(raw);

    const report: SessionReport = {
      sessionId: body.sessionId,
      mode: body.mode,
      topic: body.topic,
      difficulty: body.difficulty,
      startedAt: body.startedAt,
      endedAt: Date.now(),
      ...parsed,
    };

    return NextResponse.json({ report });
  } catch (err) {
    console.error("[api/summary] falling back to derived report:", err);
    return NextResponse.json({ report: fallbackReport(body), degraded: true });
  }
}
