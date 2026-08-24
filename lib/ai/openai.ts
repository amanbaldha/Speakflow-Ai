import "server-only";
import OpenAI from "openai";

let client: OpenAI | null = null;

/** Lazily-constructed singleton OpenAI client, server-side only. */
export function getOpenAI(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Missing OPENAI_API_KEY. Copy .env.example to .env.local and add your key.'
      );
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const EVAL_MODEL = process.env.OPENAI_EVAL_MODEL || "gpt-4o-mini";
