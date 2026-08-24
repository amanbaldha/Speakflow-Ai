/**
 * Turns the raw per-turn evaluations (see englishEvaluatorPrompt.ts) plus the
 * full transcript into the friendly, easy-to-read learning report shown on
 * the /report screen. This is a third, separate model call — it never talks
 * to the user live and never runs during the conversation.
 */
export function sessionSummaryPrompt(): string {
  return `You are an encouraging English-speaking coach writing a short end-of-session report for a learner who just finished a spoken English practice session with an AI conversation partner.

You will be given:
1. The full transcript of the session (both speakers).
2. A list of per-turn evaluations already computed for the learner's turns (numeric scores + detected issues + filler words + repeated words + suggested corrections).

Your job is to turn this raw data into a warm, specific, genuinely useful summary — never generic. Every strength you list and every mistake you cite must be traceable to something that actually happened in the transcript/evaluations you were given. Do not invent examples.

Guidelines:
- overallScore and the five category scores (fluency, grammar, vocabulary, clarity, confidence) should be reasonable aggregates of the per-turn scores provided (weighted toward longer / more substantive turns), rounded to whole numbers 0-100.
- whatYouDidWell: 2-4 short, specific, genuine strengths (reference real content/phrasing from the transcript where possible, not generic praise like "good job").
- thingsToImprove: 2-5 short, concrete, prioritized improvement areas (e.g. "Past tense for completed actions", "Articles (a/an/the)", "Reduce filler words like 'um' and 'like'") — order by impact, most important first.
- commonMistakes: pick the 5-10 MOST IMPORTANT recurring or illustrative mistakes across the whole session (not every minor issue) from the corrections provided. For each: the exact "said" snippet, the "better" corrected version, and a short plain-language "explanation" a friendly tutor would give.
- betterVocabulary: 3-8 { original, suggestion } word/phrase upgrades actually seen in the transcript (e.g. "good" → "productive", "worked on" → "implemented", "thing" → "feature") — favor upgrades that would make the learner sound noticeably more natural/professional.
- stats: compute from the transcript/evaluations provided — totalSpeakingTimeSeconds (estimate from timestamps if available, else estimate ~2.5 words/second from the user's total word count), numberOfTurns (user turns), averageResponseLengthWords, fillerWordCount (sum), longPauseCount (use 0 if no pause data available), questionsAskedByUser (count of '?' in user turns), questionsAnsweredByUser (user turns that directly follow an agent question).
- Tone throughout: warm, honest, specific, never discouraging. This is meant to build confidence and give a clear, doable next focus — not to overwhelm with every possible error.

Respond ONLY with the structured JSON matching the provided schema — no prose, no markdown, no commentary outside the JSON.`;
}

export const sessionSummarySchema = {
  name: "session_report",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      overallScore: { type: "integer", minimum: 0, maximum: 100 },
      scores: {
        type: "object",
        additionalProperties: false,
        properties: {
          fluency: { type: "integer", minimum: 0, maximum: 100 },
          grammar: { type: "integer", minimum: 0, maximum: 100 },
          vocabulary: { type: "integer", minimum: 0, maximum: 100 },
          clarity: { type: "integer", minimum: 0, maximum: 100 },
          confidence: { type: "integer", minimum: 0, maximum: 100 },
        },
        required: ["fluency", "grammar", "vocabulary", "clarity", "confidence"],
      },
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
      stats: {
        type: "object",
        additionalProperties: false,
        properties: {
          totalSpeakingTimeSeconds: { type: "integer", minimum: 0 },
          numberOfTurns: { type: "integer", minimum: 0 },
          averageResponseLengthWords: { type: "integer", minimum: 0 },
          fillerWordCount: { type: "integer", minimum: 0 },
          longPauseCount: { type: "integer", minimum: 0 },
          questionsAskedByUser: { type: "integer", minimum: 0 },
          questionsAnsweredByUser: { type: "integer", minimum: 0 },
        },
        required: [
          "totalSpeakingTimeSeconds",
          "numberOfTurns",
          "averageResponseLengthWords",
          "fillerWordCount",
          "longPauseCount",
          "questionsAskedByUser",
          "questionsAnsweredByUser",
        ],
      },
    },
    required: [
      "overallScore",
      "scores",
      "whatYouDidWell",
      "thingsToImprove",
      "commonMistakes",
      "betterVocabulary",
      "stats",
    ],
  },
} as const;
