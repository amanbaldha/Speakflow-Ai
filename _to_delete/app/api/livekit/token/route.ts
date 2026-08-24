import { NextRequest, NextResponse } from "next/server";
import { createLiveKitToken, generateRoomName } from "@/lib/livekit/token";
import type { SessionConfig } from "@/types";

export const runtime = "nodejs";

interface TokenRequestBody {
  config: SessionConfig;
  participantName?: string;
}

export async function POST(req: NextRequest) {
  let body: TokenRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body?.config?.mode || !body?.config?.difficulty || !body?.config?.topic) {
    return NextResponse.json(
      { error: "config.mode, config.difficulty and config.topic are required." },
      { status: 400 }
    );
  }

  const roomName = generateRoomName();
  const identity = `user-${Math.random().toString(36).slice(2, 10)}`;

  try {
    const { token, url } = await createLiveKitToken({
      roomName,
      participantIdentity: identity,
      participantName: body.participantName || "You",
      config: body.config,
    });

    return NextResponse.json({ token, url, roomName, identity });
  } catch (err) {
    console.error("[api/livekit/token] failed to mint token:", err);
    return NextResponse.json(
      { error: "Could not create a session right now. Check your LiveKit configuration." },
      { status: 500 }
    );
  }
}
