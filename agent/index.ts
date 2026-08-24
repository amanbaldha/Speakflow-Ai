// SpeakFlow's LiveKit Agent worker.
//
// This is a SEPARATE Node process from the Next.js app (run with
// `npm run agent:dev` / `npm run agent:start`). It connects to whichever
// LiveKit room the browser just created, reads the SessionConfig the
// browser attached as participant metadata (see lib/livekit/token.ts),
// and drives a real OpenAI Realtime speech-to-speech conversation as
// either a casual conversation partner or a mock interviewer.
//
// It also runs the (fully separate, silent) English evaluator after each
// finished user turn and streams the result to the frontend over a LiveKit
// text-stream data channel — the realtime conversational model itself
// never sees or reacts to this.
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env if .env.local isn't found
import { fileURLToPath } from "node:url";
import {
  cli,
  defineAgent,
  ServerOptions,
  voice,
  type JobContext,
} from "@livekit/agents";
import * as openai from "@livekit/agents-plugin-openai";
import { AgentSessionEventTypes } from "@livekit/agents";
import { createConversationAgent, parseSessionConfig } from "./agentFactory.js";
import { evaluateTurn } from "./evaluator.js";
import { TOPIC_TURN_EVALUATION } from "../lib/livekit/topics.js";
import type { TurnEvaluation } from "../types/index.js";

export default defineAgent({
  entry: async (ctx: JobContext) => {
    // Connect as early as possible (recommended by LiveKit) so there's no
    // visible delay between the user joining and the agent being present.
    await ctx.connect();

    const participant = await ctx.waitForParticipant();
    const config = parseSessionConfig(participant.metadata);

    console.log(
      `[agent] room=${ctx.room.name} mode=${config.mode} difficulty=${config.difficulty} topic=${config.topic}`
    );

    const agent = createConversationAgent(config);

    const session = new voice.AgentSession({
      llm: new openai.realtime.RealtimeModel({
        model: process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview",
        voice: process.env.OPENAI_REALTIME_VOICE || "alloy",
        modalities: ["text", "audio"],
        turnDetection: {
          type: "server_vad",
          threshold: 0.5,
          prefixPaddingMs: 300,
          silenceDurationMs: 500,
        },
      }),
    });

    // Rolling plain-text transcript, used as light context for the
    // evaluator (NOT sent to the realtime model — it has its own memory).
    let priorContext = "";

    session.on(AgentSessionEventTypes.ConversationItemAdded, (event) => {
      const item = event.item;
      if (item.type !== "message" || item.role !== "user") return;
      const text = item.textContent?.trim();
      if (!text) return;

      const contextSnapshot = priorContext;
      priorContext += `\nUSER: ${text}`;

      // Fire-and-forget: the evaluator must never block or influence the
      // live conversation. Errors are swallowed inside evaluateTurn.
      void (async () => {
        const evaluation = await evaluateTurn({
          turnText: text,
          priorContext: contextSnapshot,
          difficulty: config.difficulty,
        });
        if (!evaluation) return;

        await publishEvaluation(ctx, evaluation);

        // Best-effort "correct me while speaking" support (spec section 19/20):
        // the ONLY case where the AI is allowed to interject a correction
        // mid-conversation is when the user explicitly opted into real-time
        // correction. It stays brief, kind, and never blocks the flow.
        if (config.correctionTiming === "real-time" && evaluation.corrections.length > 0) {
          const top = evaluation.corrections[0];
          session.say(
            `Quick tip — you could also say "${top.improved}" instead of "${top.original}". Anyway, go on!`,
            { allowInterruptions: true, addToChatCtx: true }
          );
        }
      })();
    });

    session.on(AgentSessionEventTypes.Error, (ev) => {
      console.error("[agent] session error:", ev.error);
    });

    await session.start({ agent, room: ctx.room });

    // Kick off the first turn. The actual opening line/question is fully
    // specified inside the prompt's own instructions (see
    // prompts/casualConversationPrompt.ts / interviewPrompt.ts) — this just
    // tells the model "go ahead and start now".
    session.generateReply({
      instructions:
        "Begin the conversation now, exactly as described in your instructions: a brief, natural opening plus your first question.",
    });
  },
});

async function publishEvaluation(ctx: JobContext, evaluation: TurnEvaluation) {
  try {
    await ctx.room.localParticipant?.sendText(JSON.stringify(evaluation), {
      topic: TOPIC_TURN_EVALUATION,
    });
  } catch (err) {
    console.error("[agent] failed to publish evaluation (non-fatal):", err);
  }
}

// Standard LiveKit Agents CLI bootstrap — supports `dev`, `start`, and
// `download-files` subcommands (see package.json scripts).
cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url) }));
