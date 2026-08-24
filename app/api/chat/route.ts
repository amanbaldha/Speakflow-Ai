import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { messages, config } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Evaluate env vars per request so changes in .env.local don't require a server restart
    const rawKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "missing";
    
    // Auto-detect if the user accidentally pasted a Groq key into the OPENAI_API_KEY slot
    const isGroq = !!process.env.GROQ_API_KEY || rawKey.startsWith("gsk_");
    
    const openai = new OpenAI({
      apiKey: rawKey,
      baseURL: isGroq 
        ? "https://api.groq.com/openai/v1" 
        : (process.env.GEMINI_API_KEY && !rawKey.startsWith("sk-") ? "https://generativelanguage.googleapis.com/v1beta/openai/" : undefined)
    });

    const DEFAULT_MODEL = isGroq ? "qwen/qwen3.6-27b" : (process.env.GEMINI_API_KEY ? "gemini-1.5-flash" : "gpt-4o-mini");

    const completion = await openai.chat.completions.create({
      model: process.env.AI_CHAT_MODEL || DEFAULT_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 150, // Keep responses relatively short for voice
    });

    return NextResponse.json({ reply: completion.choices[0]?.message?.content || "" });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 }
    );
  }
}
