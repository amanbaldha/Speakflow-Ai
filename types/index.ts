// Shared types used by the frontend, the API routes, and the agent worker.
// Keep this file dependency-free (no "server-only" / "react" imports) so it
// can be imported from every part of the stack.

export type ConversationMode = "casual" | "interview";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Topic =
  | "daily-life"
  | "technology"
  | "work"
  | "travel"
  | "food"
  | "movies"
  | "current-events"
  | "random"
  | "custom";

export type AiPersonality =
  | "friendly"
  | "professional"
  | "interviewer"
  | "strict-interviewer";

export type CorrectionTiming = "after-answer" | "end-of-session" | "real-time";

/** Serialized as LiveKit participant metadata so the agent worker can read
 *  it as soon as it joins the room — this is how mode/difficulty/topic are
 *  "sent" to the agent without a separate backchannel. */
export interface SessionConfig {
  mode: ConversationMode;
  difficulty: Difficulty;
  topic: Topic;
  customTopic?: string;
  personality: AiPersonality;
  correctionTiming: CorrectionTiming;
  userName?: string;
}

export type TranscriptRole = "user" | "agent";

export interface TranscriptEntry {
  id: string;
  role: TranscriptRole;
  text: string;
  isFinal: boolean;
  timestamp: number;
}

/** Result of the (separate, silent) evaluator run after each finished user turn. */
export interface TurnEvaluation {
  id: string;
  turnText: string;
  timestamp: number;
  scores: {
    grammar: number;
    vocabulary: number;
    fluency: number;
    sentenceStructure: number;
    clarity: number;
    confidence: number;
    naturalness: number;
  };
  fillerWordCount: number;
  repeatedWords: string[];
  corrections: Array<{
    type: "grammar" | "vocabulary" | "structure";
    original: string;
    improved: string;
    explanation: string;
  }>;
  betterSentence?: string;
  positiveNote?: string;
}

export type AgentState =
  | "connecting"
  | "pre-connect-buffering"
  | "failed"
  | "initializing"
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "disconnected";

export interface SpeakingStatistics {
  totalSpeakingTimeSeconds: number;
  numberOfTurns: number;
  averageResponseLengthWords: number;
  fillerWordCount: number;
  longPauseCount: number;
  questionsAskedByUser: number;
  questionsAnsweredByUser: number;
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

/** The final report shown on the /report screen, produced by
 *  POST /api/summary (sessionSummaryPrompt). */
export interface SessionReport {
  sessionId: string;
  mode: ConversationMode;
  topic: Topic;
  difficulty: Difficulty;
  startedAt: number;
  endedAt: number;
  overallScore: number;
  scores: {
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
}

export interface DeviceOption {
  deviceId: string;
  label: string;
}
