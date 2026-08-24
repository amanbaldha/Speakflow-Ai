# SpeakFlow — Question-by-Question AI Interview Practice

An AI-powered English conversation & mock-interview practice app that runs primarily on your own machine. A local open-source **Gemma 4** model (`gemma4:e4b`) runs through **Ollama** and handles every AI call, so there is no API key, no per-use AI cost, and no dependency on an external AI API for the AI features.

SpeakFlow runs a **setup → question-by-question session → report** flow:

* Build a tailored question set
* Answer each question by speaking out loud
* See a live transcript
* Get AI feedback after every answer
* Receive a final performance report
* Optionally record your screen, camera, and microphone into one downloadable video

There is no conversational voice AI or text-to-speech. Questions are displayed as text, and you answer them by speaking.

---

## Prerequisites

Before running SpeakFlow, make sure you have:

* **Node.js 18+**
* **npm**
* **Ollama**
* Enough disk space for the Gemma model
* A desktop browser such as **Chrome or Edge**

> **Important:** SpeakFlow does not include the Gemma model inside the GitHub repository. The model is downloaded separately through Ollama and stored on the user's own machine.

---

## How a session works

1. **Setup** (`/setup`) — choose Casual or Interview mode.

   For interviews, choose:

   * Category: HR, Android, DSA, System Design, Behavioral, or Custom
   * Difficulty
   * Your own requirements, for example:
     `"I want mostly behavioral questions for a senior Android role."`
   * Number of questions
   * Sequential or shuffled order

   Click **Generate Questions** and the local Gemma model generates the question set from its own knowledge.

2. **Review** — edit the generated questions before starting.

   You can:

   * Remove a question
   * Regenerate a single question
   * Regenerate the entire set
   * Add your own question

3. **Ready screen** — choose whether to record the session.

   Recording requires browser permissions for:

   * Screen sharing
   * Camera
   * Microphone

4. **Session** (`/session`) — answer one question at a time.

   * The question is displayed as text.
   * **Start Speaking** enables browser speech recognition.
   * Your answer appears as a live transcript.
   * **Confirm** sends the answer to `/api/questions/analyze-answer`.
   * The local Gemma model evaluates the answer.
   * You receive scores for relevance, grammar, vocabulary, fluency, clarity, and confidence.
   * You also receive written feedback, corrections, and a model-answer tip.

5. **Report** (`/report`) — after the final question, SpeakFlow generates the final report.

   Overall scores and speaking statistics are calculated from the individual answer analyses. The local AI generates the written narrative, including:

   * What you did well
   * What you should improve
   * Common mistakes
   * Corrections
   * Vocabulary improvements

   If you recorded the session, the final report also contains the recording with a download button.

---

# Local AI: Ollama + Gemma 4

Every AI call in SpeakFlow uses **Gemma 4 running locally through Ollama**:

* Question generation
* Answer analysis
* Final report narrative

Ollama downloads, stores, and serves the model on your own computer.

Your computer looks like this:

```text
┌──────────────────────────────┐
│       Your Computer          │
│                              │
│  SpeakFlow / Next.js         │
│          │                   │
│          ▼                   │
│  http://localhost:11434      │
│          │                   │
│          ▼                   │
│       Ollama                 │
│          │                   │
│          ▼                   │
│     Gemma 4 (e4b)            │
│                              │
└──────────────────────────────┘
```

### Important: downloading SpeakFlow does not include the AI model

The GitHub repository contains the SpeakFlow application code, but it does **not** contain the ~9.6GB Gemma model.

When another person downloads or clones SpeakFlow, **they need to install Ollama and download the model on their own computer**.

Their setup is independent from yours.

For example:

```text
Your computer
    ↓
Your Ollama
    ↓
Your gemma4:e4b model

Other person's computer
    ↓
Their Ollama
    ↓
Their gemma4:e4b model
```

Your Ollama installation and model are never downloaded from your computer when someone clones the GitHub repository.

---

## One-time Ollama setup

### 1. Install Ollama

#### macOS

```bash
brew install ollama
```

Or download Ollama from:

https://ollama.com/download

### 2. Start Ollama

If you installed the Ollama menu-bar application, it may already be running.

Otherwise:

```bash
ollama serve
```

### 3. Download the SpeakFlow model

SpeakFlow currently uses:

```bash
ollama pull gemma4:e4b
```

The model is approximately **9.6GB** and only needs to be downloaded once.

### 4. Verify the model

Run:

```bash
ollama list
```

You should see:

```text
gemma4:e4b
```

### 5. Start SpeakFlow

```bash
npm install
npm run dev
```

Then open:

http://localhost:3000

---

## Model configuration

SpeakFlow uses:

```text
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e4b
```

These can be configured in `.env.local`.

Example:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e4b
```

The default model is:

```text
gemma4:e4b
```

If you want to use another compatible Ollama model, pull it first:

```bash
ollama pull <model-name>
```

Then change:

```env
OLLAMA_MODEL=<model-name>
```

No application code changes should be required as long as the model supports the expected structured output.

---

## Model sizes

Different Gemma 4 model sizes have different hardware requirements.

| Tag                         | Download | Good for                                    |
| --------------------------- | -------: | ------------------------------------------- |
| `gemma4:e2b`                |   ~7.2GB | Lighter/faster — 8–16GB RAM Macs            |
| `gemma4:e4b`                |   ~9.6GB | **Recommended default — good balance**      |
| `gemma4:12b`                |   ~7.6GB | Better quality — 16GB+ free RAM recommended |
| `gemma4:26b` / `gemma4:31b` |  18–20GB | Higher quality — high-RAM machines          |

For SpeakFlow, **`gemma4:e4b` is the recommended default**.

---

# Fully local AI

SpeakFlow intentionally does not depend on web search for AI generation.

The local Gemma model generates questions using its own training knowledge.

This means:

* No OpenAI API key is required
* No cloud AI API is required
* No per-request AI billing
* AI inference happens through the user's local Ollama installation
* Internet access is not required for the AI calls once Ollama and the model are installed

Because the model is local, generated questions are not based on live web search or current online information.

---

# Privacy

SpeakFlow is designed around local AI processing.

When running locally:

```text
Your answer
    ↓
SpeakFlow
    ↓
Local Ollama
    ↓
Local Gemma model
```

Your answers do not need to be sent to OpenAI or another external AI API.

The session recording also remains local. It is not automatically uploaded anywhere and can be downloaded from the report page.

> **Note:** Browser APIs such as speech recognition can have their own browser/platform behavior. SpeakFlow does not control how a browser's built-in speech-recognition service is implemented.

---

# Troubleshooting Ollama

If AI calls fail, first check whether Ollama is running:

```bash
ollama list
```

Then check that the model exists:

```bash
ollama list
```

You should see:

```text
gemma4:e4b
```

If it is missing:

```bash
ollama pull gemma4:e4b
```

If Ollama is not running:

```bash
ollama serve
```

Then restart SpeakFlow:

```bash
npm run dev
```

SpeakFlow expects Ollama to be available at:

```text
http://localhost:11434
```

You can also check the Ollama server directly from your browser:

```text
http://localhost:11434
```

---

# Screen + camera recording

Before the first question, you can choose to record the session.

If recording is enabled:

* The browser requests screen-share, camera, and microphone permissions.
* Your shared screen becomes the main video.
* A small circular live camera view appears in the bottom-right corner.
* A red **Recording** indicator is displayed.
* The recording stops when you finish the session, exit, or stop screen sharing.
* The finished `.webm` recording appears on the report page.
* You can download the recording from there.

The recording is not automatically uploaded anywhere.

Recording uses standard browser APIs:

* `getDisplayMedia`
* `getUserMedia`
* Canvas compositing
* `MediaRecorder`

Chrome or Edge on desktop is recommended.

---

# Architecture

```text
/app
  /api/questions/generate
      Builds question set using local Gemma

  /api/questions/analyze-answer
      Scores each answer using local Gemma

  /api/summary
      Calculates final scores/statistics
      + generates final AI narrative

  /setup
  /session
  /report

/components
  /setup
      MicCheck
      QuestionBuilder
      QuestionReviewList

  /voice
      InterviewRunner
      QuestionCard
      AnswerRecorder

  /evaluation
      FeedbackCard
      SessionReport

  /recording
      CameraPreview
      RecordingPlayback

/lib
  /ai
      localModel.ts
      Ollama/Gemma client

  /speech
      useSpeechRecognition

  /recording
      useSessionRecorder
      recordingStore

  /session
      sessionStorage helpers

  /supabase
      Future persistence stub

  /utils
      Error helpers
      Text statistics

/prompts
  questionGeneratorPrompt
  questionAnalysisPrompt
  sessionSummaryPrompt

/types
  Shared TypeScript types
```

Everything runs inside the Next.js application.

The application communicates with the local Ollama server for AI calls:

```text
Next.js
   │
   ▼
localhost:11434
   │
   ▼
Ollama
   │
   ▼
Gemma 4
```

There is no separate AI worker process.

---

# Environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

| Variable                    | Default                  | Description                     |
| --------------------------- | ------------------------ | ------------------------------- |
| `OLLAMA_BASE_URL`           | `http://localhost:11434` | Local Ollama server             |
| `OLLAMA_MODEL`              | `gemma4:e4b`             | Ollama model used by SpeakFlow  |
| `NEXT_PUBLIC_SUPABASE_*`    | blank                    | Reserved for future persistence |
| `SUPABASE_SERVICE_ROLE_KEY` | blank                    | Reserved for future persistence |

---

# Run locally

```bash
git clone https://github.com/amanbaldha/Speakflow-Ai.git

cd Speakflow-Ai

npm install

cp .env.example .env.local

ollama pull gemma4:e4b

npm run dev
```

If Ollama is not already running:

```bash
ollama serve
```

Then open:

```text
http://localhost:3000
```

---

# Development checks

Run TypeScript checking:

```bash
npm run typecheck
```

Build the application:

```bash
npm run build
```

The Next.js build also runs ESLint as part of the build process.

---

# Deploying

SpeakFlow is a standard Next.js 14 App Router application.

The web/API portion can be deployed using platforms such as Vercel or any server capable of running the Next.js application.

However, there is an important limitation:

> **Deploying the Next.js website does not automatically provide Ollama to website visitors.**

The machine running the Next.js server needs network access to an Ollama server containing the required model.

For local development:

```text
Next.js
   ↓
localhost:11434
   ↓
Ollama
   ↓
Gemma 4
```

For a production deployment:

```text
User
  ↓
Deployed SpeakFlow
  ↓
Your server
  ↓
Ollama server
  ↓
Gemma 4
```

If you deploy SpeakFlow to a platform such as Vercel while keeping Ollama on your personal laptop, the deployed application **cannot use your laptop's `localhost:11434`**.

For a public cloud deployment, you would need a separate server/VM with Ollama and the Gemma model, or add a cloud AI provider as another backend option.

---

# Why three separate AI calls?

SpeakFlow uses three AI stages:

1. **Question generation**

   `/api/questions/generate`

   Runs once during setup.

2. **Per-answer analysis**

   `/api/questions/analyze-answer`

   Runs after each confirmed answer so feedback is available immediately.

3. **Session summary**

   `/api/summary`

   The final numerical scores are calculated from the per-question analyses. The local AI is used only for the written narrative.

This prevents the final report's numerical scores from drifting away from the scores shown during the session.

---

# Not built yet

* Persistent session history
* Previous Sessions dashboard
* Progress over time
* Supabase persistence
* Real pronunciation analysis
* Additional interview categories
* Cloud AI fallback/provider option
* Automatic Ollama installation
* Automatic model downloading from the UI

---

# A note on realism

SpeakFlow does not fake or hardcode AI behavior.

Question generation, answer analysis, and the final report narrative are real calls to the local Gemma model.

If Ollama is not running or `gemma4:e4b` has not been downloaded, AI requests fail with a clear error instead of silently falling back to canned responses.

The final aggregate scores and speaking statistics are intentionally calculated deterministically from the real per-question analyses.

This ensures that the numbers shown during the session match the numbers shown in the final report.
