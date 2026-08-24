"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { AgentState, SessionConfig, TranscriptEntry } from "@/types";

interface UseBrowserVoiceAgentProps {
  config: SessionConfig;
  onTurnEvaluated?: (evaluation: any) => void; // Using any for simplicity in hook, typed in component
}

export function useBrowserVoiceAgent({ config, onTurnEvaluated }: UseBrowserVoiceAgentProps) {
  const [state, setState] = useState<AgentState>("initializing");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null); // For mic visualizer fallback if needed
  
  // Track context for the LLM
  const messageHistory = useRef<{role: string, content: string}[]>([]);

  // Initialize Speech Recognition & Synthesis
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    synthRef.current = window.speechSynthesis;
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setState("failed");
      console.error("SpeechRecognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    
    let currentInterimId = "";

    recognition.onstart = () => {
      setState("listening");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        handleUserSpeechFinal(finalTranscript.trim());
      } else if (interimTranscript) {
        // Handle interim if we want to show it
        if (!currentInterimId) currentInterimId = Math.random().toString(36).substring(7);
        setTranscript(prev => {
          const filtered = prev.filter(t => t.id !== currentInterimId);
          return [...filtered, {
            id: currentInterimId,
            role: "user",
            text: interimTranscript,
            isFinal: false,
            timestamp: Date.now()
          }];
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === "not-allowed") {
        setState("failed");
      }
    };

    recognition.onend = () => {
      // Auto-restart if we should be listening and haven't intentionally stopped
      if (state === "listening" && isMicrophoneEnabled) {
        try {
          recognition.start();
        } catch (e) {
          // ignore already started errors
        }
      }
    };

    recognitionRef.current = recognition;
    
    // Set initial instructions for LLM context
    messageHistory.current = [
      {
        role: "system",
        content: `You are an AI English tutor. Mode: ${config.mode}. Difficulty: ${config.difficulty}. Topic: ${config.topic}. Personality: ${config.personality}. Keep responses concise and conversational.`
      }
    ];

    // Kick off first greeting — must seed a user message first, as most LLMs require at least one user turn
    setState("thinking");
    messageHistory.current.push({ role: "user", content: "Hello, please start our session with a greeting and your first question." });
    fetchReply("");

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserSpeechFinal = async (text: string) => {
    if (!text) return;
    
    const entryId = Math.random().toString(36).substring(7);
    
    // 1. Add to transcript
    setTranscript(prev => [...prev.filter(t => t.isFinal), {
      id: entryId,
      role: "user",
      text,
      isFinal: true,
      timestamp: Date.now()
    }]);

    messageHistory.current.push({ role: "user", content: text });
    
    // Stop listening while thinking/speaking
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setState("thinking");
    
    // Fire off evaluation concurrently without awaiting
    if (onTurnEvaluated) {
      const priorContext = messageHistory.current
        .slice(0, -1)
        .map(m => m.role.toUpperCase() + ": " + m.content)
        .join("\n");
        
      fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnText: text, priorContext, difficulty: config.difficulty })
      })
      .then(res => res.json())
      .then(data => {
        if (data.evaluation) onTurnEvaluated(data.evaluation);
      })
      .catch(err => console.error("Evaluation failed", err));
    }

    await fetchReply(text);
  };

  const fetchReply = async (userText: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messageHistory.current, config })
      });
      
      if (!res.ok) throw new Error("API failed");
      
      const data = await res.json();
      const agentReply = data.reply;
      
      messageHistory.current.push({ role: "assistant", content: agentReply });
      
      setTranscript(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        role: "agent",
        text: agentReply,
        isFinal: true,
        timestamp: Date.now()
      }]);
      
      speakText(agentReply);
      
    } catch (err) {
      console.error("Failed to fetch reply", err);
      setState("failed");
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    setState("speaking");
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Pick a natural sounding English voice if available
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith("en-") && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Premium")));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = config.difficulty === "beginner" ? 0.85 : 1.0;
    
    utterance.onend = () => {
      if (isMicrophoneEnabled && recognitionRef.current) {
        setState("listening");
        try {
          recognitionRef.current.start();
        } catch (e) {
          // ignore
        }
      } else {
        setState("idle");
      }
    };
    
    synthRef.current.speak(utterance);
  };

  const toggleMicrophone = useCallback(() => {
    setIsMicrophoneEnabled(prev => {
      const next = !prev;
      if (next && recognitionRef.current) {
        setState("listening");
        try {
          recognitionRef.current.start();
        } catch (e) {}
      } else if (!next && recognitionRef.current) {
        recognitionRef.current.stop();
        setState("idle");
      }
      return next;
    });
  }, []);

  const endSession = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (synthRef.current) synthRef.current.cancel();
    setState("disconnected");
  }, []);

  return {
    state,
    transcript,
    isMicrophoneEnabled,
    toggleMicrophone,
    endSession,
    // Provide a dummy track for the visualizer to not break, 
    // or just leave undefined and handle in UI
    microphoneTrack: undefined 
  };
}
