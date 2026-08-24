import { NextRequest, NextResponse } from "next/server";
import { generateStructured } from "@/lib/ai/localModel";
import { sessionSummaryPrompt, sessionSummaryFormat } from "@/prompts/sessionSummaryPrompt";
import { countFillerWords, countWords } from "@/lib/utils/textStats";
import type {
  ConversationMode,
  Difficulty,
  InterviewCategory,
  CasualTopic,
  QAEntry,
  SessionReport,
} from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface SummaryRequestBody {
  sessionId: string;
  mode: ConversationMode;
  category: InterviewCategory;
  topic: CasualTopic;
  difficulty: Difficulty;
  startedAt: number;
  qaEntries: QAEntry[];
}

const SCORE_KEYS = ["relevance", "grammar", "vocabulary", "fluency", "clarity", "confidence"] as const;

function computeScores(qaEntries: QAEntry[]): SessionReport["scores"] & { overallScore: number } {
  const analyzed = qaEntries.filter((e) => e.analysis);
  const scores = { relevance: 0, grammar: 0, vocabulary: 0, fluency: 0, clarity: 0, confidence: 0 };

  if (analyzed.length === 0) {
    return { ...scores, overallScore: 0 };
  }

  for (const key of SCORE_KEYS) {
    const sum = analyzed.reduce((acc, e) => acc + (e.analysis?.scores[key] ?? 0), 0);
    scores[key] = Math.round(sum / analyzed.length);
  }
  const overallScore = Math.round(SCORE_KEYS.reduce((acc, key) => acc + scores[key], 0) / SCORE_KEYS.length);
  return { ...scores, overallScore };
}

function computeStats(qaEntries: QAEntry[]): SessionReport["stats"] {
  const answered = qaEntries.filter((e) => e.answerText.trim().length > 0);
  const totalWords = answered.reduce((sum, e) => sum + countWords(e.answerText), 0);
  const totalSpeakingTimeSeconds = Math.round(
    qaEntries.reduce((sum, e) => sum + Math.max(0, e.endedAt - e.startedAt), 0) / 1000
  );
  const fillerWordCount = qaEntries.reduce((sum, e) => sum + countFillerWords(e.answerText), 0);

  return {
    totalSpeakingTimeSeconds,
    numberOfQuestions: qaEntries.length,
    averageResponseLengthWords: answered.length ? Math.round(totalWords / answered.length) : 0,
    fillerWordCount,
    questionsSkipped: qaEntries.length - answered.length,
  };
}

type SummaryNarrative = Pick<SessionReport, "whatYouDidWell" | "thingsToImprove" | "commonMistakes" | "betterVocabulary">;

function fallbackNarrative(): SummaryNarrative {
  return {
    whatYouDidWell: ["You completed the full set of questions — that's real practice in the bank."],
    thingsToImprove: ["We couldn't generate detailed feedback this time — try running another session."],
    commonMistakes: [] as SessionReport["commonMistakes"],
    betterVocabulary: [] as SessionReport["betterVocabulary"],
  };
}

export async function POST(req: NextRequest) {
  let body: SummaryRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body?.sessionId || !Array.isArray(body.qaEntries)) {
    return NextResponse.json({ error: "sessionId and qaEntries are required." }, { status: 400 });
  }

  const { overallScore, ...scores } = computeScores(body.qaEntries);
  const stats = computeStats(body.qaEntries);
  const questionBreakdown = body.qaEntries.map((e) => ({
    questionText: e.question.text,
    answerText: e.answerText,
    analysis: e.analysis,
  }));

  let narrative = fallbackNarrative();
  let degraded = false;

  try {
    narrative = await generateStructured<SummaryNarrative>(
      [
        { role: "system", content: sessionSummaryPrompt() },
        { role: "user", content: JSON.stringify({ questionBreakdown }) },
      ],
      sessionSummaryFormat
    );
  } catch (err) {
    console.error("[api/summary] falling back to minimal narrative:", err);
    degraded = true;
  }

  const report: SessionReport = {
    sessionId: body.sessionId,
    mode: body.mode,
    category: body.category,
    topic: body.topic,
    difficulty: body.difficulty,
    startedAt: body.startedAt,
    endedAt: Date.now(),
    overallScore,
    scores,
    stats,
    questionBreakdown,
    ...narrative,
  };

  return NextResponse.json({ report, degraded });
}
