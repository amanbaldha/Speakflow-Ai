import { NextResponse } from "next/server";
import { evaluateTurn } from "@/agent/evaluator";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { turnText, priorContext, difficulty } = body;
    
    const evaluation = await evaluateTurn({ turnText, priorContext, difficulty });
    return NextResponse.json({ evaluation });
  } catch (err: any) {
    console.error("Evaluation API error:", err);
    return NextResponse.json({ error: "Failed to evaluate" }, { status: 500 });
  }
}
