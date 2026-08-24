# SpeakFlow — Phase 1 MVP

An AI English conversation & mock-interview companion. You talk, a real
OpenAI Realtime voice agent talks back, and a completely separate (silent)
evaluator scores your spoken English behind the scenes.

This is **Phase 1** of the 5-phase plan below: a real, working, end-to-end
voice conversation with live transcript and an end-of-session report. No
screen recording, camera overlay, or Supabase persistence yet — those are
Phase 3/4, and the codebase is already structured so they slot in cleanly
later (see "What's next").

## Architecture

```
/app                    Next.js App Router pages
  /api/livekit/token     Mints a short-lived LiveKit join token (server-side)
  /api/summary           Turns transcript + evaluations into the session report (server-side, OpenAI)
  /setup, /session, /report   The three screens in the user flow
/components
  /voice                 SessionRoom, AgentStateIndicator, MicVisualizer
  /transcript            Live transcript panel
  /evaluation            FeedbackCard, LiveScoreBar, SessionReport
  /setup                 Device + mode/topic pickers
  /ui                    Small shadcn-style primitives (button, card, select…)
/lib
  /livekit               Token minting, shared topic names
  /ai                    Server-side OpenAI client (used by /api/summary)
  /session               sessionStorage helpers (stand-in for a DB in Phase 1)
  /supabase              Phase 4 stub — not wired up yet
/prompts                 casualConversationPrompt, interviewPrompt, englishEvaluatorPrompt, sessionSummaryPrompt
/agent                   The LiveKit Agent worker — a SEPARATE Node process
/types                   Shared TypeScript types
```

Three separate "brains" are deliberately kept apart, per the spec:

1. **Conversation agent** (`agent/index.ts` + `prompts/casualConversationPrompt.ts` /
   `interviewPrompt.ts`) — the realtime voice model. It never mentions
   grammar or scoring; it just talks.
2. **English evaluator** (`agent/evaluator.ts` + `prompts/englishEvaluatorPrompt.ts`) —
   a plain (non-realtime) OpenAI chat completion that silently scores each
   finished user turn and streams the result to the frontend. It cannot
   influence what the conversational agent says.
3. **Session summary** (`app/api/summary/route.ts` + `prompts/sessionSummaryPrompt.ts`) —
   a third model call, run once at the end, that turns all the per-turn
   evaluations + transcript into the friendly report on `/report`.

## How the realtime agent works

The Next.js app and the voice agent are **two separate processes**:

- `npm run dev` — the Next.js app (frontend + API routes).
- `npm run agent:dev` — the LiveKit Agent worker (`agent/index.ts`), built on
  `@livekit/agents` + `@livekit/agents-plugin-openai`. It connects to
  LiveKit, waits for the browser participant to join, reads that
  participant's **metadata** (JSON-encoded `SessionConfig` — mode,
  difficulty, topic, personality — attached when the token was minted in
  `lib/livekit/token.ts`), builds the right system prompt, and starts an
  `openai.realtime.RealtimeModel` speech-to-speech session.

Both need to be running for a session to work — see "Run locally" below.

When the browser calls `POST /api/livekit/token`, the server creates a new
LiveKit room name and a token for the browser to join it. LiveKit Agents is
configured for **automatic dispatch** (the default — no `agentName` is set
in `ServerOptions`), so as soon as the browser joins that room, your running
agent worker gets dispatched into it automatically. No manual pairing step
is needed.

Turn detection, interruption handling, and voice activity detection are all
handled by the OpenAI Realtime API itself (via LiveKit's realtime
integration) — this is what lets the user interrupt the AI mid-sentence and
the AI stop and listen.

The **live transcript** is not custom-built: LiveKit Agents' `RoomIO`
automatically forwards both the agent's TTS-aligned speech and the user's
transcribed input to the browser over a built-in `lk.transcription` text
stream, keyed by sender identity. The frontend just calls
`useTranscriptions()` (from `@livekit/components-react`) and renders it.

The **English evaluation** does use a custom channel: after each finished
user turn (`ConversationItemAdded` event with `role: "user"`), the agent
worker calls `evaluateTurn()` (a separate OpenAI chat completion,
`gpt-4o-mini` by default) and publishes the structured result over its own
LiveKit text stream (`speakflow.evaluation`, see `lib/livekit/topics.ts`),
which `SessionRoom.tsx` listens for.

## How English evaluation works

1. **Per turn** (silent, live): `agent/evaluator.ts` sends the turn's text
   (plus a little prior context) to `englishEvaluatorPrompt`, using OpenAI's
   Structured Outputs (`response_format: json_schema`) so you always get
   back well-typed scores, filler-word counts, and 0-3 corrections — never
   free-form prose. This never touches the realtime conversation.
2. **End of session**: the frontend collects the full transcript + every
   per-turn evaluation and posts it to `/api/summary`, which runs
   `sessionSummaryPrompt` once to produce the final report shown on
   `/report` (strengths, priority improvements, common mistakes, vocabulary
   upgrades, speaking stats). If that call fails for any reason, a
   locally-derived fallback report is returned instead of a dead end.

"Correct me while speaking" (real-time correction) is implemented as a
best-effort: when that setting is chosen, the agent worker briefly and
kindly interjects the top correction via `session.say(...)` right after the
silent evaluator returns it — it does not block the conversation. The two
other timing options ("after each answer" and "end of session only") only
affect whether the small `FeedbackCard` pops up live during the session.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `LIVEKIT_URL` / `NEXT_PUBLIC_LIVEKIT_URL` | Create a free project at [cloud.livekit.io](https://cloud.livekit.io) (or self-host) → Settings → the `wss://...` URL |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | Same LiveKit project → Settings → Keys |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) — needs Realtime API access |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) — for the free, ultra-fast LLM fallback |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) — another free alternative for the LLM |
| `OPENAI_EVAL_MODEL` | Defaults to `gpt-4o-mini` (used for evaluation + summary, not the live voice) |
| `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | Leave blank for now — Phase 4 |

**Never** put `LIVEKIT_API_SECRET`, `OPENAI_API_KEY`, or
`SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_*` variable or client
component — they're only ever read server-side (API routes / the agent
worker process).

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values above

# Terminal 1 — the Next.js app
npm run dev

# Terminal 2 — the voice agent worker (must run alongside the app)
npm run agent:dev
```

Open http://localhost:3000, click **Start Casual Conversation** or
**Start Interview**, grant microphone access, and start talking.

(You'll see a one-line `dev mode is deprecated, use 'lk agent dev' instead`
warning from `@livekit/agents` itself when the worker starts — that's the
framework nudging toward its optional separate CLI tool, not an error;
`npm run agent:dev` still works fine.)

`npm run typecheck` / `npm run lint` / `npm run build` are all wired up for
CI or a pre-deploy check.

## Deploying

- **Next.js app**: deploys like any standard Next.js 14 App Router app
  (Vercel, or `next build && next start` anywhere that runs Node 18+). Set
  the same environment variables in your hosting provider.
- **Agent worker**: this is a long-running Node process, not a serverless
  function — it needs to stay connected to LiveKit. Run
  `npm run agent:start` on a small always-on VM/container (Fly.io, Render,
  Railway, an EC2/GCE box, etc.), or use LiveKit Cloud's own agent hosting
  if you'd rather not manage the process yourself. It only needs the
  `LIVEKIT_*` and `OPENAI_*` environment variables — it does not need to be
  reachable from the internet itself, only to be able to reach LiveKit and
  OpenAI outbound.

## Before deploying publicly

`npm audit` currently flags several Next.js 14.x advisories (fixed only by
the Next 15/16 major upgrade, which is a deliberately out-of-scope, breaking
change for this Phase 1 pass — see [nextjs.org/blog/security-update-2025-12-11](https://nextjs.org/blog/security-update-2025-12-11)).
Running locally on your own machine this is low-risk, but plan a Next.js
major-version upgrade before deploying this publicly.

## What's next (Phases 2-5, not built yet)

- **Phase 2 polish**: this MVP already includes a live transcript and
  end-of-session evaluation ahead of schedule, since they were needed to
  prove the realtime pipeline end-to-end.
- **Phase 3**: screen recording (`getDisplayMedia`), camera overlay bubble
  (drag/resize/mirror/border), YouTube "Creator Mode" layout, canvas-based
  compositing of screen + camera + audio into one downloadable video.
- **Phase 4**: wire up `lib/supabase/client.ts` for real — a `sessions`
  table (see schema sketch below), a "Previous Sessions" dashboard, and a
  progress-over-time chart (fluency/grammar/vocabulary/confidence trend
  lines).
- **Phase 5**: real pronunciation analysis, more advanced scoring, multiple
  AI personalities beyond the current four, fully custom interview
  scenarios, recording templates tuned for YouTube.

### Sketch: Phase 4 `sessions` table

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  mode text not null,
  topic text not null,
  difficulty text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  transcript jsonb not null,
  scores jsonb not null,
  mistakes jsonb not null,
  vocabulary_suggestions jsonb not null,
  recording_url text,
  created_at timestamptz not null default now()
);
```

## A note on realism

Nothing in this codebase fakes or hardcodes the AI's responses — every word
the agent says comes from a live OpenAI Realtime API session, and every
score comes from a real (separate) OpenAI evaluation call. If you haven't
configured `OPENAI_API_KEY` / `LIVEKIT_*` yet, the app will fail loudly with
a clear error rather than silently falling back to a canned conversation.
