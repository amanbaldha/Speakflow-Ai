"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Mic, MicOff } from "lucide-react";

interface MicVisualizerProps {
  track: MediaStreamTrack | null | undefined;
  muted: boolean;
  active: boolean;
}

/** A small animated bar-waveform driven by a live Web Audio AnalyserNode on
 *  the local microphone track — real audio level, not a decorative loop. */
export function MicVisualizer({ track, muted, active }: MicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!track || muted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let audioCtx: AudioContext | undefined;
    let analyser: AnalyserNode | undefined;
    let source: MediaStreamAudioSourceNode | undefined;

    try {
      audioCtx = new AudioContext();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source = audioCtx.createMediaStreamSource(new MediaStream([track]));
      source.connect(analyser);
    } catch {
      return; // Visualizer is cosmetic — never let it break the session.
    }

    const data = new Uint8Array(analyser.frequencyBinCount);
    const BARS = 20;

    function draw() {
      if (!analyser || !ctx) return;
      analyser.getByteFrequencyData(data);
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      const step = Math.floor(data.length / BARS);
      const barWidth = w / BARS - 2;
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent");

      for (let i = 0; i < BARS; i++) {
        const value = (data[i * step] ?? 0) / 255;
        const barHeight = Math.max(3, value * h);
        ctx.fillStyle = `hsl(${accent} / ${0.35 + value * 0.65})`;
        const x = i * (barWidth + 2);
        ctx.fillRect(x, (h - barHeight) / 2, barWidth, barHeight);
      }

      rafRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      source?.disconnect();
      analyser?.disconnect();
      void audioCtx?.close();
    };
  }, [track, muted]);

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          muted ? "bg-destructive/15 text-destructive" : "bg-accent/15 text-accent"
        )}
      >
        {active && !muted && <span className="absolute inset-0 rounded-full bg-accent/40 animate-pulse-ring" />}
        {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </div>
      <canvas ref={canvasRef} width={160} height={32} className="h-8 w-40" />
    </div>
  );
}
