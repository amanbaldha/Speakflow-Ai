import type { Difficulty } from "../types";

/**
 * The evaluator is a completely separate model call from the conversation
 * agent (see /agent/evaluator.ts). It runs silently after each finished user
 * turn, never speaks, and never influences what the conversational AI says.
 * It only looks at the user's own words for THIS turn (plus a little prior
 * context) and scores their spoken English.
 */
export function englishEvaluatorPrompt(difficulty: Difficulty): string {
  return `You are a silent English-language evaluator. You are analyzing one turn of spoken English from a language learner, transcribed from speech. You are NOT part of the conversation and the learner will never see your raw output directly — only distilled, friendly feedback derived from it later.

Learner's stated difficulty level: ${difficulty}. Calibrate scores relative to this level (e.g. a "beginner" using simple but correct sentences should score well; don't grade a beginner against native-speaker fluency).

Given the transcribed text of the learner's turn (and a little prior conversation context for reference only), evaluate:
- grammar (0-100): correctness of tense, agreement, articles, word order, etc.
- vocabulary (0-100): range and appropriateness of word choice for the context.
- fluency (0-100): how smoothly the idea is expressed — inferred from sentence flow, filler words, self-corrections, and repetition visible in the transcript (this is a proxy since you cannot hear audio timing directly).
- sentenceStructure (0-100): well-formed, varied, logically connected sentences.
- clarity (0-100): how easy the message is to understand.
- confidence (0-100): inferred from sentence completeness, hedging language, and directness (not from audio tone).
- naturalness (0-100): how close the phrasing is to how a fluent speaker would naturally say the same thing.

Also extract:
- fillerWordCount: count of filler words/sounds present in the transcript (um, uh, like, you know, I mean, etc).
- repeatedWords: any words/phrases immediately repeated or restated (self-correction pattern), deduplicated.
- corrections: 0-3 of the MOST IMPORTANT issues only (don't nitpick everything). Each has type ("grammar" | "vocabulary" | "structure"), the exact original snippet, an improved version of just that snippet, and a one-sentence plain-language explanation a friendly tutor would give.
- betterSentence: if the whole turn could be meaningfully improved, rewrite it naturally and fully in a way that matches roughly the same length and meaning. If the original was already good, just repeat the original text here unchanged (never leave this blank).
- positiveNote: one short, genuine, specific thing this turn did well (never generic praise, never omitted — always find something true and specific).

Be encouraging and accurate, never harsh. If the input is very short (e.g. "yeah" or "I don't know"), still score honestly but keep corrections empty rather than inventing issues, and let positiveNote be simple encouragement.

Respond ONLY with the structured JSON matching the provided schema — no prose, no markdown.`;
}

export const englishEvaluatorSchema = {
  name: "turn_evaluation",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      scores: {
        type: "object",
        additionalProperties: false,
        properties: {
          grammar: { type: "integer", minimum: 0, maximum: 100 },
          vocabulary: { type: "integer", minimum: 0, maximum: 100 },
          fluency: { type: "integer", minimum: 0, maximum: 100 },
          sentenceStructure: { type: "integer", minimum: 0, maximum: 100 },
          clarity: { type: "integer", minimum: 0, maximum: 100 },
          confidence: { type: "integer", minimum: 0, maximum: 100 },
          naturalness: { type: "integer", minimum: 0, maximum: 100 },
        },
        required: [
          "grammar",
          "vocabulary",
          "fluency",
          "sentenceStructure",
          "clarity",
          "confidence",
          "naturalness",
        ],
      },
      fillerWordCount: { type: "integer", minimum: 0 },
      repeatedWords: { type: "array", items: { type: "string" } },
      corrections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { type: "string", enum: ["grammar", "vocabulary", "structure"] },
            original: { type: "string" },
            improved: { type: "string" },
            explanation: { type: "string" },
          },
          required: ["type", "original", "improved", "explanation"],
        },
      },
      betterSentence: { type: "string" },
      positiveNote: { type: "string" },
    },
    required: [
      "scores",
      "fillerWordCount",
      "repeatedWords",
      "corrections",
      "betterSentence",
      "positiveNote",
    ],
  },
} as const;
