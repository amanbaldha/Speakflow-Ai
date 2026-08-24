import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, TTS_MODEL, TTS_VOICE } from "@/lib/ai/openai";

export const runtime = "nodejs";

interface TtsRequestBody {
  text: string;
}

export async function POST(req: NextRequest) {
  let body: TtsRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = body?.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "text is required." }, { status: 400 });
  }

  try {
    const openai = getOpenAI();
    const isGroq = !!process.env.GROQ_API_KEY;

    if (isGroq) {
      // Groq TTS (PlayAI) — uses fetch directly as the SDK audio path differs
      const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: TTS_MODEL,
          input: text.slice(0, 4096),
          voice: TTS_VOICE,
          response_format: "mp3",
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq TTS error ${response.status}: ${err}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // OpenAI fallback
    const speech = await openai.audio.speech.create({
      model: TTS_MODEL,
      voice: TTS_VOICE as any,
      input: text.slice(0, 4096),
      response_format: "mp3",
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[api/tts] failed:", err);
    return NextResponse.json({ error: "Couldn't generate audio right now." }, { status: 500 });
  }
}
