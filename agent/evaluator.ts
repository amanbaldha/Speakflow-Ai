import OpenAI from "openai";
import { randomUUID } from "node:crypto";
import { englishEvaluatorPrompt, englishEvaluatorSchema } from "../prompts/englishEvaluatorPrompt.js";
import type { Difficulty, TurnEvaluation } from "../types/index.js";

interface EvaluatorSchemaResult {
  scores: TurnEvaluation["scores"];
  fillerWordCount: number;
  repeatedWords: string[];
  corrections: TurnEvaluation["corrections"];
  betterSentence: string;
  positiveNote: string;
}

export async function evaluateTurn(params: {
  turnText: string;
  priorContext: string;
  difficulty: Difficulty;
}): Promise<TurnEvaluation | null> {
  const text = params.turnText.trim();
  if (!text) return null;

  try {
    const rawKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "missing";
    const isGroq = !!process.env.GROQ_API_KEY || rawKey.startsWith("gsk_");
    
    const client = new OpenAI({
      apiKey: rawKey,
      baseURL: isGroq 
        ? "https://api.groq.com/openai/v1" 
        : (process.env.GEMINI_API_KEY && !rawKey.startsWith("sk-") ? "https://generativelanguage.googleapis.com/v1beta/openai/" : undefined)
    });

    const EVAL_MODEL = isGroq ? "qwen/qwen3.6-27b" : (process.env.GEMINI_API_KEY ? "gemini-1.5-flash" : process.env.OPENAI_EVAL_MODEL || "gpt-4o-mini");

    const completion = await client.chat.completions.create({
      model: EVAL_MODEL,
      messages: [
        { role: "system", content: englishEvaluatorPrompt(params.difficulty) },
        {
          role: "user",
          content: JSON.stringify({
            priorContext: params.priorContext.slice(-2000),
            turnToEvaluate: text,
          }),
        },
      ],
      // For Groq/Gemini, if response_format JSON schema isn't natively supported, 
      // we fallback to type: "json_object" which is more widely supported
      response_format: isGroq || process.env.GEMINI_API_KEY ? { type: "json_object" } : { type: "json_schema", json_schema: englishEvaluatorSchema },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty evaluator completion.");
    const parsed = JSON.parse(raw) as EvaluatorSchemaResult;

    const evaluation: TurnEvaluation = {
      id: randomUUID(),
      turnText: text,
      timestamp: Date.now(),
      ...parsed,
    };
    return evaluation;
  } catch (err) {
    console.error("[evaluator] turn evaluation failed (non-fatal):", err);
    return null;
  }
}
