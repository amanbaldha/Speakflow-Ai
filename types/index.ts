// Shared types used by the frontend and the API routes. There is no
// separate agent process anymore — everything here is consumed by either a
// React client component or a Next.js API route, both within the same app.

export type ConversationMode = "casual" | "interview";

export type Difficulty = "beginner" | "intermediate" | "advanced";

/** Interview-mode question categories (spec: "HR, Android, casual, DSA…"). */
export type InterviewCategory =
  | "hr"
  | "android"
  | "dsa"
  | "system-design"
  | "behavioral"
  | "casual"
  | "custom";

/** Casual-mode topics (kept from the original conversation-topic list). */
export type CasualTopic =
  | "daily-life"
  | "technology"
  | "work"
  | "travel"
  | "food"
  | "movies"
  | "current-events"
  | "random"
  | "custom";

export type QuestionOrder = "sequential" | "random";

/** What the setup screen sends to POST /api/questions/generate. */
export interface QuestionSetRequest {
  mode: ConversationMode;
  category: InterviewCategory;
  topic: CasualTopic;
  /** The free-text "I want this type of question…" chat box. */
  description?: string;
  /** The typed label when category/topic is "custom". */
  customLabel?: string;
  difficulty: Difficulty;
  count: number;
  order: QuestionOrder;
  /** Question texts to avoid repeating — used when regenerating one question
   *  or topping up the set so we don't get duplicates. */
  avoid?: string[];
}

/** What the setup screen hands off to the session screen once the user is
 *  happy with the reviewed/edited question list. */
export interface PreparedSession {
  request: QuestionSetRequest;
  questions: InterviewQuestion[];
}

export interface InterviewQuestion {
  id: string;
  text: string;
  /** "generated" = produced by the question generator (possibly via web
   *  search). "custom" = typed directly by the user on the review screen. */
  source: "generated" | "custom";
}

/** The result of the (separate, silent) per-question analysis call — see
 *  prompts/questionAnalysisPrompt.ts. Scores span both spoken-English
 *  quality AND, for interview mode, how well the question itself was
 *  actually answered. */
export interface QuestionAnalysis {
  scores: {
    /** How well the answer actually addressed the question — correctness /
     *  completeness / relevance. For casual mode this mostly reflects how
     *  fully they engaged with the prompt. */
    relevance: number;
    grammar: number;
    vocabulary: number;
    fluency: number;
    clarity: number;
    confidence: number;
  };
  /** One short, specific, encouraging note — never generic. */
  feedback: string;
  corrections: Array<{
    original: string;
    improved: string;
    explanation: string;
  }>;
  /** What a strong answer would include/say — genuinely useful prep value,
   *  especially for HR/DSA/technical questions. */
  modelAnswerTip: string;
}

export interface QAEntry {
  question: InterviewQuestion;
  answerText: string;
  startedAt: number;
  endedAt: number;
  /** null while analysis is pending/unavailable — the UI and the final
   *  summary both handle a missing analysis gracefully rather than faking
   *  one. */
  analysis: QuestionAnalysis | null;
}

export interface SpeakingStatistics {
  totalSpeakingTimeSeconds: number;
  numberOfQuestions: number;
  averageResponseLengthWords: number;
  fillerWordCount: number;
  questionsSkipped: number;
}

export interface VocabSuggestion {
  original: string;
  suggestion: string;
}

export interface MistakeExample {
  said: string;
  better: string;
  explanation: string;
}

export interface QuestionBreakdownItem {
  questionText: string;
  answerText: string;
  analysis: QuestionAnalysis | null;
}

/** The final report shown on the /report screen, produced by
 *  POST /api/summary from all the QAEntry results. */
export interface SessionReport {
  sessionId: string;
  mode: ConversationMode;
  category: InterviewCategory;
  topic: CasualTopic;
  difficulty: Difficulty;
  startedAt: number;
  endedAt: number;
  overallScore: number;
  scores: {
    relevance: number;
    fluency: number;
    grammar: number;
    vocabulary: number;
    clarity: number;
    confidence: number;
  };
  whatYouDidWell: string[];
  thingsToImprove: string[];
  commonMistakes: MistakeExample[];
  betterVocabulary: VocabSuggestion[];
  stats: SpeakingStatistics;
  questionBreakdown: QuestionBreakdownItem[];
}
