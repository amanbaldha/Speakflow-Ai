"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppError, fromSpeechRecognitionError, supportsSpeechRecognition } from "@/lib/utils/errors";

// The Web Speech API's SpeechRecognition type isn't in the standard DOM lib
// yet in most TS setups — declare just what we use.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  /** Confirmed, finalized transcript text so far for the current answer. */
  finalText: string;
  /** In-progress text the recognizer hasn't committed to yet — shown lighter/italic. */
  interimText: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  /** Clears the transcript — call when moving to the next question. */
  reset: () => void;
  /** Lets the user manually correct the transcript before it's saved. */
  setFinalText: (text: string) => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldListenRef = useRef(false);
  const isSupported = typeof window !== "undefined" && supportsSpeechRecognition();

  const buildRecognition = useCallback((): SpeechRecognitionLike | null => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return null;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript ?? "";
        if (result?.isFinal) {
          finalChunk += `${transcript} `;
        } else {
          interim += transcript;
        }
      }
      if (finalChunk.trim()) {
        setFinalText((prev) => (prev ? `${prev} ${finalChunk}` : finalChunk).replace(/\s+/g, " ").trim());
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return; // routine, not a real failure
      setError(fromSpeechRecognitionError(event.error).friendlyMessage);
    };

    recognition.onend = () => {
      // Chrome silently ends "continuous" recognition after a stretch of
      // silence even though we never asked it to stop — restart
      // transparently for as long as the user is still supposed to be
      // speaking, so it feels truly continuous from their side.
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          // Already starting — ignore, a real failure will surface via onerror.
        }
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, []);

  const start = useCallback(() => {
    setError(null);
    if (!isSupported) {
      setError(new AppError("speech-recognition-unsupported").friendlyMessage);
      return;
    }
    setInterimText("");
    const recognition = buildRecognition();
    if (!recognition) {
      setError(new AppError("speech-recognition-unsupported").friendlyMessage);
      return;
    }
    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      setError(fromSpeechRecognitionError(String(err)).friendlyMessage);
    }
  }, [buildRecognition, isSupported]);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setInterimText("");
  }, []);

  const reset = useCallback(() => {
    setFinalText("");
    setInterimText("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  return { isSupported, isListening, finalText, interimText, error, start, stop, reset, setFinalText };
}
