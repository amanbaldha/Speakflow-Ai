import type { ConversationMode, Difficulty } from "../types";

/**
 * Runs once per finished question, completely separately from anything the
 * user sees live — there is no conversational AI in this app anymore, so
 * this is purely a silent scoring call triggered right after the user
 * stops speaking for a given question.
 */
export function questionAnalysisPrompt(mode: ConversationMode, difficulty: Difficulty): string {
  return `You are a silent interview/speaking coach analyzing ONE question-and-answer pair from a spoken practice session. The learner answered out loud; what you receive is the transcribed text of their answer to a specific question.

Mode: ${mode === "interview" ? "mock interview" : "casual conversation practice"}.
Learner's stated experience/difficulty level: ${difficulty} — calibrate expectations accordingly (don't grade a beginner against senior-level polish).

Evaluate the answer on:
- relevance (0-100): ${mode === "interview" ? "How well did they actually answer THIS question — correctness, completeness, and directness. For technical/DSA questions, judge the accuracy and soundness of their approach, not just whether they said something related." : "How fully and genuinely they engaged with the question (not correctness — there's no wrong answer in casual chat)."}
- grammar (0-100): correctness of tense, agreement, articles, word order.
- vocabulary (0-100): range and appropriateness of word choice.
- fluency (0-100): smoothness of expression — inferred from sentence flow, filler words, repetition, self-correction visible in the transcript.
- clarity (0-100): how easy the answer is to understand.
- confidence (0-100): inferred from sentence completeness, hedging language, and directness.

Also produce:
- feedback: one short, specific, genuinely encouraging sentence about this particular answer (never generic, never omitted).
- corrections: 0-3 of the most important language issues only, each with the exact original snippet, an improved version, and a one-sentence plain-language explanation.
- modelAnswerTip: a short, concrete note on what a strong answer to THIS question would include or mention — genuinely useful interview/conversation prep, not just a language note. If the answer given was already strong, acknowledge that and add one thing that would make it even stronger.

If the answer is extremely short or empty (e.g. they skipped it), still score honestly (low relevance/confidence is fine) but keep corrections empty and make feedback gently encouraging rather than critical.

Respond ONLY with the structured JSON matching the provided schema — no prose, no markdown.`;
}

// A plain JSON Schema object — this is passed directly as Ollama's `format`
// field (see lib/ai/localModel.ts), which is how the local Gemma model is
// constrained to return valid, well-typed JSON instead of free-form prose.
export const questionAnalysisFormat = {
  type: "object",
  additionalProperties: false,
  properties: {
    scores: {
      type: "object",
      additionalProperties: false,
      properties: {
        relevance: { type: "integer", minimum: 0, maximum: 100 },
        grammar: { type: "integer", minimum: 0, maximum: 100 },
        vocabulary: { type: "integer", minimum: 0, maximum: 100 },
        fluency: { type: "integer", minimum: 0, maximum: 100 },
        clarity: { type: "integer", minimum: 0, maximum: 100 },
        confidence: { type: "integer", minimum: 0, maximum: 100 },
      },
      required: ["relevance", "grammar", "vocabulary", "fluency", "clarity", "confidence"],
    },
    feedback: { type: "string" },
    corrections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          original: { type: "string" },
          improved: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["original", "improved", "explanation"],
      },
    },
    modelAnswerTip: { type: "string" },
  },
  required: ["scores", "feedback", "corrections", "modelAnswerTip"],
} as const;
