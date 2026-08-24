import "server-only";
import OpenAI from "openai";

let client: OpenAI | null = null;

/** Lazily-constructed singleton AI client. Prefers Groq (free) over OpenAI. */
export function getOpenAI(): OpenAI {
  if (!client) {
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (groqKey) {
      client = new OpenAI({
        apiKey: groqKey,
        baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
      });
    } else if (openaiKey) {
      client = new OpenAI({ apiKey: openaiKey });
    } else {
      throw new Error(
        "Missing AI key. Set GROQ_API_KEY (free) or OPENAI_API_KEY in .env.local."
      );
    }
  }
  return client;
}

const isGroq = !!process.env.GROQ_API_KEY;

export const EVAL_MODEL =
  process.env.GROQ_EVAL_MODEL ||
  process.env.OPENAI_EVAL_MODEL ||
  (isGroq ? "groq/compound" : "gpt-4o-mini");

export const QUESTION_MODEL =
  process.env.GROQ_QUESTION_MODEL ||
  process.env.OPENAI_QUESTION_MODEL ||
  (isGroq ? "groq/compound" : "gpt-4o-mini");

export const TTS_MODEL =
  process.env.GROQ_TTS_MODEL ||
  process.env.OPENAI_TTS_MODEL ||
  (isGroq ? "playai-tts" : "gpt-4o-mini-tts");

export const TTS_VOICE =
  process.env.GROQ_TTS_VOICE ||
  process.env.OPENAI_TTS_VOICE ||
  (isGroq ? "Fritz-PlayAI" : "alloy");
