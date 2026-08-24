// Text-stream topic names shared between the agent worker (Node, plain
// relative imports — see /agent) and the browser frontend (Next.js, "@/"
// alias). Keep this file free of any Next.js- or Node-only imports so both
// sides can use it as-is.
//
// Live transcript itself does NOT need a custom topic: LiveKit's built-in
// "lk.transcription" stream already carries both the user's and the agent's
// speech, synced to audio — see components/transcript/TranscriptPanel.tsx.
// Agent state (listening/thinking/speaking) also ships for free via
// useVoiceAssistant(). This file only covers SpeakFlow's own data: the
// silent, separate per-turn English evaluation.
export const TOPIC_TURN_EVALUATION = "speakflow.evaluation";
