import type { ConversationMode, Difficulty, InterviewCategory, CasualTopic } from "../types";

const CATEGORY_GUIDANCE: Record<InterviewCategory, string> = {
  hr: "HR / behavioral interview questions — background, motivation, strengths/weaknesses, culture fit, career goals, conflict handling.",
  android: "Android engineering interview questions — Kotlin/Java, Android lifecycle, Jetpack, architecture (MVVM/MVI), performance, concurrency, real-world debugging scenarios. Phrase them so they can be answered verbally (no need to write code, but they can describe an approach or algorithm).",
  dsa: "Data Structures & Algorithms interview questions — real, commonly-asked problems (arrays, strings, trees, graphs, dynamic programming, complexity analysis). Phrase each so it can be explained verbally: the problem statement plus \"explain your approach and its time/space complexity\" rather than requiring written code.",
  "system-design": "System design interview questions — designing scalable systems, trade-offs, real-world architecture scenarios appropriate to the stated experience level.",
  behavioral: "Behavioral interview questions using real scenarios (STAR-style) — teamwork, leadership, failure, conflict, prioritization.",
  casual: "Warm, casual interview-style questions — the softer, human side of an interview (tell me about yourself, why this role, what do you enjoy) without hard technical content.",
  custom: "Follow the user's own description closely to decide the subject matter.",
};

const TOPIC_GUIDANCE: Record<CasualTopic, string> = {
  "daily-life": "Everyday life — routines, habits, weekend plans, home life.",
  technology: "Technology and gadgets, apps, the internet, AI — casual opinions and experiences, not technical interview depth.",
  work: "Work and career — casual chat about their job, projects, coworkers, work-life balance (not a formal interview).",
  travel: "Travel — trips taken or dreamed of, favorite places, travel stories.",
  food: "Food and cooking — favorite dishes, cooking habits, restaurants.",
  movies: "Movies and TV shows — favorites, recent watches, opinions.",
  "current-events": "Current events and general news/culture — light opinions, nothing that requires specialist expertise.",
  random: "A fun mix of light, everyday conversation topics.",
  custom: "Follow the user's own description closely to decide the subject matter.",
};

const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  beginner: "Simple, concrete, approachable phrasing. Shorter questions. For interview mode, entry-level/fresher depth.",
  intermediate: "Natural, moderately challenging phrasing and depth — a typical real interview or conversation.",
  advanced: "Sharper, deeper, more nuanced phrasing. For interview mode, senior-level depth including edge cases and trade-offs.",
};

export interface QuestionGeneratorInput {
  mode: ConversationMode;
  category: InterviewCategory;
  topic: CasualTopic;
  description?: string;
  customLabel?: string;
  difficulty: Difficulty;
  count: number;
  avoid?: string[];
}

export function questionGeneratorPrompt(input: QuestionGeneratorInput): string {
  const subject =
    input.mode === "interview"
      ? input.category === "custom" && input.customLabel
        ? input.customLabel
        : CATEGORY_GUIDANCE[input.category]
      : input.topic === "custom" && input.customLabel
        ? input.customLabel
        : TOPIC_GUIDANCE[input.topic];

  return `You are building a set of ${input.mode === "interview" ? "mock interview" : "casual spoken-English practice"} questions for a language learner to answer OUT LOUD, one at a time, with no AI conversation partner reacting in between — so each question must stand completely on its own and make sense read in isolation.

SUBJECT MATTER: ${subject}
${input.description ? `\nThe user specifically asked for: "${input.description}" — prioritize this over the general subject-matter guidance above where they conflict.` : ""}

EXPERIENCE / DIFFICULTY LEVEL: ${DIFFICULTY_GUIDANCE[input.difficulty]}

Draw on real, commonly-asked questions of this kind that you already know from your training — e.g. the kinds of DSA problems, HR questions, and Android/technical interview questions companies actually ask — rather than inventing artificial-sounding ones. You do not have live internet access, so if "current events" come up, stick to well-established, timeless topics rather than guessing at anything recent.

Produce exactly ${input.count} distinct questions.
${input.avoid?.length ? `\nDo NOT repeat or closely rephrase any of these already-used questions:\n${input.avoid.map((q) => `- ${q}`).join("\n")}\n` : ""}
Rules:
- Each question must be self-contained plain text — no numbering, no "Question 1:", no markdown, no meta-commentary, no answer included.
- Vary the phrasing and angle across questions — don't produce near-duplicates of each other.
- Interview-mode questions should sound like something a real interviewer would actually say out loud.
- Casual-mode questions should sound like something a curious friend would actually ask.
- Never mention that this is for English practice, evaluation, or scoring — the questions themselves are just genuine questions.

Respond ONLY with the structured JSON matching the provided schema — no prose, no markdown.`;
}

// Plain JSON Schema — passed directly as Ollama's `format` field.
export const questionGeneratorFormat = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["questions"],
} as const;
