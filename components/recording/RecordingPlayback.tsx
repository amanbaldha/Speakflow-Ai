"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSessionRecording, type SessionRecording } from "@/lib/recording/recordingStore";
import { Download } from "lucide-react";

/** Shows the just-finished session recording (screen + face bubble, one
 *  file) with a preview player and a download button — read once from the
 *  in-memory recordingStore that useSessionRecorder wrote to. Renders
 *  nothing if the user skipped recording or it wasn't supported. */
export function RecordingPlayback() {
  const [recording, setRecording] = useState<SessionRecording | null>(null);

  useEffect(() => {
    setRecording(getSessionRecording());
  }, []);

  if (!recording) return null;

  const extension = recording.mimeType.includes("mp4") ? "mp4" : "webm";
  const seconds = Math.max(1, Math.round(recording.durationMs / 1000));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Recording</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <video src={recording.url} controls className="w-full rounded-xl border border-border bg-black" />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} · ready to upload, no editing needed
          </span>
          <a href={recording.url} download={`speakflow-session.${extension}`}>
            <Button size="sm" variant="secondary">
              <Download className="h-4 w-4" /> Download
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
