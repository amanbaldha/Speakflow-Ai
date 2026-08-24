import "server-only";
import { AccessToken } from "livekit-server-sdk";
import type { SessionConfig } from "@/types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
}

/**
 * Mints a short-lived LiveKit room-join token for the browser.
 *
 * The session's mode/difficulty/topic/personality travel as PARTICIPANT
 * METADATA on the token grant — this is how the agent worker (running as a
 * separate process, see /agent) learns how to behave the moment it joins
 * the room, without any extra network hop.
 */
export async function createLiveKitToken(params: {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  config: SessionConfig;
}): Promise<{ token: string; url: string }> {
  const apiKey = requireEnv("LIVEKIT_API_KEY");
  const apiSecret = requireEnv("LIVEKIT_API_SECRET");
  const url = requireEnv("LIVEKIT_URL");

  const at = new AccessToken(apiKey, apiSecret, {
    identity: params.participantIdentity,
    name: params.participantName,
    metadata: JSON.stringify(params.config),
    ttl: "1h",
  });

  at.addGrant({
    room: params.roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });

  return { token: await at.toJwt(), url };
}

export function generateRoomName(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `speakflow-${rand}`;
}
