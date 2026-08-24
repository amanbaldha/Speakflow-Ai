import { voice } from "@livekit/agents";
import { casualConversationPrompt } from "../prompts/casualConversationPrompt.js";
import { interviewPrompt } from "../prompts/interviewPrompt.js";
import type { SessionConfig } from "../types/index.js";

const DEFAULT_CONFIG: SessionConfig = {
  mode: "casual",
  difficulty: "intermediate",
  topic: "random",
  personality: "friendly",
  correctionTiming: "end-of-session",
};

/** Parses the SessionConfig the browser attached as participant metadata
 *  when it requested its LiveKit token (see lib/livekit/token.ts). Falls
 *  back to sane defaults if it's missing or malformed, so the agent never
 *  crashes the room over a bad payload. */
export function parseSessionConfig(rawMetadata: string | undefined | null): SessionConfig {
  if (!rawMetadata) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(rawMetadata) as Partial<SessionConfig>;
    return {
      mode: parsed.mode ?? DEFAULT_CONFIG.mode,
      difficulty: parsed.difficulty ?? DEFAULT_CONFIG.difficulty,
      topic: parsed.topic ?? DEFAULT_CONFIG.topic,
      customTopic: parsed.customTopic,
      personality: parsed.personality ?? DEFAULT_CONFIG.personality,
      correctionTiming: parsed.correctionTiming ?? DEFAULT_CONFIG.correctionTiming,
      userName: parsed.userName,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function instructionsFor(config: SessionConfig): string {
  return config.mode === "interview" ? interviewPrompt(config) : casualConversationPrompt(config);
}

export function createConversationAgent(config: SessionConfig): voice.Agent {
  return new voice.Agent({
    instructions: instructionsFor(config),
    allowInterruptions: true,
  });
}
