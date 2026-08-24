# SpeakFlow — Question-by-Question AI Interview Practice

An AI-powered English conversation & mock-interview practice app that runs
entirely on your own machine: a local, open-source **Gemma 4** model (via
[Ollama](https://ollama.com)) handles every AI call, so there's no API key,
no per-use cost, and no dependency on any outside AI service.

SpeakFlow runs a **setup → question-by-question session → report** flow:
you build a tailored question set, answer each question by speaking it out
loud with a live transcript, get a real per-answer analysis immediately
after each one, and finish with a full AI-generated performance report.
Along the way it can record your screen with a small live view of your
face in the corner — one download-ready video, no editing needed.

There is no conversational voice AI and no text-to-speech anywhere in this
app. Questions are shown as plain text; you read them yourself and answer
by speaking.

## How a session works

1. **Setup** (`/setup`) — pick Casual or Interview mode. For interviews,
   pick a category (HR, Android, DSA, System Design, Behavioral, or
   Custom), a difficulty, and describe in your own words what you want
   ("I want mostly behavioral questions for a senior Android role").
   Choose how many questions (5, 10, or a custom number) and whether they
   should be sequential or shuffled. Click **Generate Questions** — the
   local Gemma model writes a full set from its own knowledge (see "Fully
   local — no web search" below).
2. **Review** — the generated set is shown as an editable list. You can
   remove a question, regenerate a single one, regenerate the whole set,
   or add your own custom question before starting.
3. **Ready screen** — before the first question, choose whether to record
   this session. Recording asks your browser for screen-share, camera, and
   microphone permission; skipping goes straight to practicing.
4. **Session** (`/session`) — one question at a time:
   - The question is shown as text on screen.
   - **Start Speaking** turns on the browser's speech recognition and
     shows your words as a live, real-time transcript while you talk.
   - **Confirm** sends your answer text to `/api/questions/analyze-answer`,
     which returns real per-question scores (relevance, grammar,
     vocabulary, fluency, clarity, confidence), written feedback, up to a
     few corrections, and a model-answer tip — shown immediately, before
     you move to the next question.
   - If you're recording, a small live view of your face sits in the
     bottom-right corner the whole time.
   - This repeats for every question in the set.
5. **Report** (`/report`) — after the last question, `/api/summary`
   computes your overall scores and speaking statistics deterministically
   from the per-question analyses (so the numbers you saw live match the
   final report exactly), and makes one more local AI call to write a
   dynamic narrative: what you did well, what to improve, common mistakes
   with corrections, and vocabulary upgrades. If you recorded, the report
   also shows your recording with a download button.

## Local AI: Ollama + Gemma 4

Every AI call in this app — question generation, per-answer scoring, and
the report narrative — goes to a Gemma 4 model running locally through
[Ollama](https://ollama.com), a small program that downloads, stores, and
serves open-source models on your own machine. Nothing about how well the
app works depends on an internet connection, an API key, or a bill.

**One-time setup:**

```bash
# 1. Install Ollama
brew install ollama          # macOS, or download from https://ollama.com/download

# 2. Start it (skip this if you installed the menu-bar app — it runs automatically)
ollama serve

# 3. Pull the model (~9.6GB download, one time)
ollama pull gemma4:e4b
```

That's it — as long as Ollama is running, `npm run dev` will reach it at
`http://localhost:11434` automatically.

**Picking a model size.** Gemma 4 comes in a few sizes; bigger means better
answer-scoring quality but more RAM and disk:

| Tag | Download | Good for |
|---|---|---|
| `gemma4:e2b` | ~7.2GB | Lighter/faster — 8-16GB RAM Macs, or if you want to save disk space |
| `gemma4:e4b` (default here) | ~9.6GB | Best balance — Google's own "efficient on laptops" tier |
| `gemma4:12b` | ~7.6GB | Noticeably better quality — wants 16GB+ free RAM |
| `gemma4:26b` / `gemma4:31b` | 18-20GB | Best quality — wants a high-RAM Mac (32GB+) |

To use a different tag, `ollama pull <tag>` it and set `OLLAMA_MODEL=<tag>`
in `.env.local` — no code changes needed.

**Fully local — no web search.** The previous version of this app used
OpenAI's web search to ground interview questions in real, current
examples. Gemma running locally has no way to browse the web, so question
generation now draws entirely on the model's own training knowledge
instead — still genuinely good at producing realistic HR/DSA/Android/etc.
questions, just not live-search-grounded. This was a deliberate trade so
the whole app has zero external API dependency, as requested.

**If AI calls start failing**, the most common cause is Ollama not running,
or the model tag not pulled yet — the app surfaces a clear message telling
you which. Run `ollama list` to see what's pulled, and `ollama serve` to
make sure the server is up.

## Screen + camera recording

Before your first question, you can choose to record the session. If you
do:

- Your browser asks for screen-share, camera, and microphone permission.
- Your **shared screen** is recorded as the full frame, with a small
  circular **live view of your face** composited into the **bottom-right
  corner** — one single video, exactly like a streamer-style recording
  (think "Apna College"-style prep content), with no separate editing step.
- A red "Recording" indicator shows in the session header the whole time.
- Stopping (via **Finish & See Report**, the **Exit** button, or the
  browser's own "Stop sharing" control) finalizes the video.
- The finished recording appears on the **report page** with a preview
  player and a **Download** button (`.webm`) — it's never uploaded
  anywhere; it only ever exists as a file in your browser until you save
  it.

This all happens with standard browser APIs (`getDisplayMedia`,
`getUserMedia`, canvas compositing, `MediaRecorder`) — Chrome or Edge on
desktop. If your browser doesn't support it, SpeakFlow just skips straight
to practicing without recording.

**Background noise cleanup.** Only your microphone goes into the
recording — no tab/system audio is captured at all — and that mic signal is
cleaned up before it's recorded (`lib/recording/useSessionRecorder.ts`):
the mic is requested with the browser's own echo-cancellation/noise-
suppression/auto-gain turned on, then run through a highpass+lowpass filter
pair (cuts fan/AC rumble and hiss outside the speech band) and a noise-gate
(ducks whatever steady background level remains, like a fan, without
clipping the natural rise and fall of your voice), then a compressor evens
out the levels. This cleans up the **recorded video's audio**; it can't
reach the **live transcript**, since the browser's built-in speech
recognition captures the mic on its own internal path that pages can't
redirect through custom audio processing — Chrome does apply its own noise
handling there too, just not something this app can add to further.

## Architecture

```
/app
  /api/questions/generate         Builds a question set (local Gemma, Structured Outputs)
  /api/questions/analyze-answer   Scores one answer (local Gemma, Structured Outputs)
  /api/summary                    Computes final scores/stats + local AI narrative synthesis
  /setup, /session, /report       The three screens in the user flow
/components
  /setup        MicCheck, QuestionBuilder, QuestionReviewList
  /voice        InterviewRunner (session orchestrator), QuestionCard, AnswerRecorder
  /evaluation   FeedbackCard (per-answer result), SessionReport (final report)
  /recording    CameraPreview (live face bubble), RecordingPlayback (report-page download)
  /ui           Small shadcn-style primitives (button, card, badge, select, toggle)
/lib
  /ai           localModel.ts — the Ollama/Gemma client (structured JSON calls)
  /speech       useSpeechRecognition — a Web Speech API hook (STT)
  /recording    useSessionRecorder (screen+camera capture/compositing), recordingStore
  /session      sessionStorage helpers (stand-in for a DB in this phase)
  /supabase     Stub for a future persistence phase — not wired up yet
  /utils        Error helpers, text stats (filler words, word counts)
/prompts        questionGeneratorPrompt, questionAnalysisPrompt, sessionSummaryPrompt
/types          Shared TypeScript types
```

Everything runs inside the single Next.js app/process, talking out to the
local Ollama server for AI calls — there's no separate worker process to
run alongside it.

### Why three separate AI calls instead of one

1. **Question generation** (`/api/questions/generate`) only runs once, at
   setup.
2. **Per-answer analysis** (`/api/questions/analyze-answer`) runs once per
   question, right after you confirm an answer, so you get feedback while
   the session is still fresh rather than waiting until the very end.
3. **Session summary** (`/api/summary`) does NOT re-score your answers —
   the overall scores and speaking statistics you see in the final report
   are computed in plain code by averaging/aggregating the per-question
   analyses you already saw live. Only the written narrative (strengths,
   improvements, common mistakes, vocabulary) is generated by a final local
   AI call, so the numbers can never drift between what you saw live and
   what the report shows.

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Default | Notes |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Where the local Ollama server listens |
| `OLLAMA_MODEL` | `gemma4:e4b` | Which pulled model tag to use — see the size table above |
| `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | (blank) | Not used yet |

## Run locally

```bash
npm install
cp .env.example .env.local        # defaults work as long as Ollama is running
ollama pull gemma4:e4b            # one-time, if you haven't already
npm run dev
```

Open http://localhost:3000, click **Start Casual Conversation** or **Start
Interview**, build your question set, choose whether to record, grant
microphone/camera/screen permissions when prompted, and go through the
questions.

Only one process is needed for the app itself — `npm run dev` — plus
Ollama running in the background (its own menu-bar app or `ollama serve`).

`npm run typecheck` and `npm run build` (which also runs ESLint as part of
the Next.js build) are wired up for CI or a pre-deploy check.

## Deploying

This is a standard Next.js 14 App Router app for the web/API parts — it
deploys like any other (Vercel, or `next build && next start` anywhere that
runs Node 18+). The one catch: since AI calls go to `OLLAMA_BASE_URL`,
whatever machine runs the Next.js server needs network access to a machine
running Ollama with the model pulled — for personal/local use this is the
same machine, so it just works with the defaults above.

## Not built yet

- **Persistence**: sessions currently live only in the browser's
  `sessionStorage` for the duration of a single session (setup → session →
  report), and the recording only lives in memory until you download it.
  `lib/supabase/client.ts` is a stub for a future phase that would add a
  real `sessions` table and a "Previous Sessions" / progress-over-time view.
- Real pronunciation analysis, and interview categories beyond the current
  built-in set (HR, Android, DSA, System Design, Behavioral, Custom).

## A note on realism

Nothing in this codebase fakes or hardcodes AI behavior. Question
generation, per-answer analysis, and the final report narrative are each
real calls to the local Gemma model — if Ollama isn't running or the model
isn't pulled, those requests fail with a clear message rather than silently
falling back to canned content. The only fully deterministic (non-AI)
numbers are the aggregate scores and speaking statistics in the final
report, which are computed in code directly from the real per-question
analyses you saw during the session — this is intentional, so those
numbers can never disagree with what you were shown live.
