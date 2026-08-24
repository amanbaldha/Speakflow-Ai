import "server-only";

// Everything here talks to a local Ollama server running Gemma 4 — no
// external API, no API key, no internet dependency for AI calls. Ollama
// exposes an HTTP API on localhost, and its "structured outputs" feature
// (the `format` field below) constrains the model's response to a JSON
// schema, the same guarantee Structured Outputs gave us with OpenAI.
//
// Setup on the machine running `npm run dev`:
//   1. Install Ollama (https://ollama.com/download)
//   2. ollama pull gemma4:e4b   (or whatever OLLAMA_MODEL is set to)
//   3. Ollama runs its server automatically once installed/launched.

export const LOCAL_MODEL_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/+$/, "");
export const LOCAL_MODEL_NAME = process.env.OLLAMA_MODEL || "gemma4:e4b";

export type LocalModelErrorCode = "unreachable" | "not-found" | "bad-response";

export class LocalModelError extends Error {
  code: LocalModelErrorCode;
  constructor(code: LocalModelErrorCode, message: string, cause?: unknown) {
    super(message);
    this.code = code;
    this.name = "LocalModelError";
    if (cause) this.cause = cause;
  }
}

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/**
 * Calls the local Gemma model via Ollama's /api/chat endpoint, constraining
 * the response to `format` (a plain JSON Schema object) and parsing the
 * result. Throws LocalModelError with a code the caller/UI can turn into a
 * friendly message (server not running vs. model not pulled vs. anything
 * else going wrong).
 */
export async function generateStructured<T>(messages: ChatMessage[], format: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${LOCAL_MODEL_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LOCAL_MODEL_NAME,
        messages,
        stream: false,
        format,
        options: { temperature: 0.6 },
      }),
    });
  } catch (err) {
    throw new LocalModelError(
      "unreachable",
      `Couldn't reach the local Gemma model at ${LOCAL_MODEL_BASE_URL}. Make sure Ollama is installed and running.`,
      err
    );
  }

  if (res.status === 404) {
    let detail = "";
    try {
      detail = (await res.json())?.error ?? "";
    } catch {
      // ignore
    }
    if (/not found|no such model/i.test(detail) || !detail) {
      throw new LocalModelError(
        "not-found",
        `The "${LOCAL_MODEL_NAME}" model isn't pulled yet. Run: ollama pull ${LOCAL_MODEL_NAME}`
      );
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new LocalModelError("bad-response", `Local model call failed (${res.status}). ${text}`.trim());
  }

  const data = await res.json().catch(() => null);
  const raw: string | undefined = data?.message?.content;
  if (!raw) {
    throw new LocalModelError("bad-response", "Empty response from the local model.");
  }

  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new LocalModelError("bad-response", "The local model returned something that wasn't valid JSON.", err);
  }
}
