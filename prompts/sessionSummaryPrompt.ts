/**
 * Turns the full set of already-analyzed question/answer pairs (see
 * questionAnalysisPrompt.ts — each one was already scored right after the
 * user answered it) into the narrative parts of the end-of-session report:
 * strengths, priority improvements, the most important mistakes, and
 * vocabulary upgrades. The numeric scores/stats shown on the report are
 * computed deterministically from the per-question scores in code (see
 * app/api/summary/route.ts) — not by this model call — so the numbers a
 * user saw live during the session always match the final report exactly.
 */
export function sessionSummaryPrompt(): string {
  return `You are an encouraging speaking coach writing the narrative part of an end-of-session report for someone who just finished a practice session of spoken questions and answers (either a mock interview or casual conversation practice).

You will be given a list of question/answer pairs, each with the per-question analysis (scores, feedback, corrections) that was already computed right after that answer. Do not re-score anything — your job is to synthesize across ALL of it into a short, genuinely useful narrative. Every point you make must be traceable to something that actually happened in the data given — never invent an example.

Produce:
- whatYouDidWell: 2-4 short, specific, genuine strengths, referencing real content/phrasing/answers where possible. Never generic praise like "good job".
- thingsToImprove: 2-5 short, concrete, prioritized improvement areas, ordered most-important first. For interview-mode sessions, this can include both language issues (e.g. "Past tense for completed actions") AND content/knowledge gaps that showed up across multiple answers (e.g. "Review time complexity trade-offs", "Structure answers with a clear example, not just a claim").
- commonMistakes: pick the 5-10 MOST important recurring or illustrative mistakes across the whole session from the corrections already provided (don't just dump every minor one). Each needs the exact "said" snippet, the "better" corrected version, and a short plain-language "explanation".
- betterVocabulary: 3-8 {original, suggestion} word/phrase upgrades actually seen across the answers — favor upgrades that would make the person sound noticeably more natural, confident, or professional.

Tone: warm, honest, specific, never discouraging. Build confidence and give a clear, doable next focus.

Respond ONLY with the structured JSON matching the provided schema — no prose, no markdown, no commentary outside the JSON.`;
}

// Plain JSON Schema — passed directly as Ollama's `format` field.
export const sessionSummaryFormat = {
  type: "object",
  additionalProperties: false,
  properties: {
    whatYouDidWell: { type: "array", items: { type: "string" } },
    thingsToImprove: { type: "array", items: { type: "string" } },
    commonMistakes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          said: { type: "string" },
          better: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["said", "better", "explanation"],
      },
    },
    betterVocabulary: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          original: { type: "string" },
          suggestion: { type: "string" },
        },
        required: ["original", "suggestion"],
      },
    },
  },
  required: ["whatYouDidWell", "thingsToImprove", "commonMistakes", "betterVocabulary"],
} as const;
