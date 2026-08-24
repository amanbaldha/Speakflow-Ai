"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Maximize2, Minimize2, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CameraBubbleProps {
  onStreamReady?: (stream: MediaStream) => void;
  className?: string;
}

export function CameraBubble({ onStreamReady, className }: CameraBubbleProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Draggable state
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  
  // Expanded state
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: false // Audio is handled by LiveKit
        });
        
        setStream(mediaStream);
        activeStream = mediaStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        
        if (onStreamReady) {
          onStreamReady(mediaStream);
        }
      } catch (err) {
        console.error("Camera access denied or failed", err);
        setError("Camera not available");
      }
    }
    
    void setupCamera();
    
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onStreamReady]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only drag from the container, not interactive elements inside
    if ((e.target as HTMLElement).tagName === "BUTTON" || (e.target as HTMLElement).closest("button")) return;
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    // Calculate new position
    let newX = e.clientX - dragStartPos.current.x;
    let newY = e.clientY - dragStartPos.current.y;
    
    // Constrain to window bounds
    const rect = containerRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: "none"
      }}
      className={cn(
        "absolute top-0 left-0 z-50 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-border/50 transition-[width,height,border-radius] duration-300 ease-in-out cursor-grab active:cursor-grabbing group",
        isExpanded ? "w-[480px] h-[360px]" : "w-[240px] h-[180px] rounded-full",
        className
      )}
    >
      {error ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-surface-2 text-muted-foreground">
          <VideoOff className="mb-2 h-8 w-8" />
          <span className="text-xs">{error}</span>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover -scale-x-100" // Mirror the video
          />
          
          <div className="absolute inset-0 flex items-start justify-end p-4 opacity-0 transition-opacity group-hover:opacity-100 bg-black/10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
