"use client";

import { useEffect, useRef, useState } from "react";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { fromGetUserMediaError, supportsRequiredBrowserFeatures } from "@/lib/utils/errors";
import type { DeviceOption } from "@/types";
import { CameraOff, Mic, Video } from "lucide-react";

export interface DeviceSelection {
  micDeviceId: string | null;
  cameraDeviceId: string | null;
  speakerDeviceId: string | null;
  cameraEnabled: boolean;
}

interface DeviceSetupProps {
  selection: DeviceSelection;
  onChange: (selection: DeviceSelection) => void;
  onError: (message: string) => void;
  onReady: (ready: boolean) => void;
}

export function DeviceSetup({ selection, onChange, onError, onReady }: DeviceSetupProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mics, setMics] = useState<DeviceOption[]>([]);
  const [cameras, setCameras] = useState<DeviceOption[]>([]);
  const [speakers, setSpeakers] = useState<DeviceOption[]>([]);
  const [requesting, setRequesting] = useState(true);

  // Request permission once up front (this is what unlocks real device
  // labels from enumerateDevices — before permission is granted, browsers
  // return anonymous "Microphone 1" style entries with no deviceId).
  useEffect(() => {
    if (!supportsRequiredBrowserFeatures()) {
      onError(
        "Your browser doesn't support the microphone/WebRTC features SpeakFlow needs. Please use a recent version of Chrome or Edge."
      );
      onReady(false);
      setRequesting(false);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: selection.cameraEnabled,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        const devices = await navigator.mediaDevices.enumerateDevices();
        const toOption = (d: MediaDeviceInfo, fallback: string): DeviceOption => ({
          deviceId: d.deviceId,
          label: d.label || fallback,
        });

        const micList = devices.filter((d) => d.kind === "audioinput").map((d, i) => toOption(d, `Microphone ${i + 1}`));
        const camList = devices.filter((d) => d.kind === "videoinput").map((d, i) => toOption(d, `Camera ${i + 1}`));
        const spkList = devices.filter((d) => d.kind === "audiooutput").map((d, i) => toOption(d, `Speaker ${i + 1}`));

        setMics(micList);
        setCameras(camList);
        setSpeakers(spkList);

        onChange({
          ...selection,
          micDeviceId: selection.micDeviceId ?? micList[0]?.deviceId ?? null,
          cameraDeviceId: selection.cameraDeviceId ?? camList[0]?.deviceId ?? null,
          speakerDeviceId: selection.speakerDeviceId ?? spkList[0]?.deviceId ?? null,
        });
        onReady(true);
      } catch (err) {
        onError(fromGetUserMediaError(err, "mic").friendlyMessage);
        onReady(false);
      } finally {
        if (!cancelled) setRequesting(false);
      }
    }

    void init();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // Re-run only when the user toggles the camera on/off.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.cameraEnabled]);

  return (
    <div className="space-y-5">
      <div className="relative mx-auto aspect-video w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface-2">
        {selection.cameraEnabled ? (
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <CameraOff className="h-8 w-8" />
            <span className="text-sm">Camera off</span>
          </div>
        )}
        {requesting && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-sm text-muted-foreground">
            Requesting permission…
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Video className="h-4 w-4" />
          Camera preview
        </div>
        <Toggle
          checked={selection.cameraEnabled}
          onChange={(cameraEnabled) => onChange({ ...selection, cameraEnabled })}
          label="Toggle camera"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mic className="h-3.5 w-3.5" /> Microphone
          </label>
          <Select
            options={mics.map((m) => ({ value: m.deviceId, label: m.label }))}
            value={selection.micDeviceId ?? ""}
            onChange={(micDeviceId) => onChange({ ...selection, micDeviceId })}
            disabled={mics.length === 0}
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Video className="h-3.5 w-3.5" /> Camera
          </label>
          <Select
            options={cameras.map((c) => ({ value: c.deviceId, label: c.label }))}
            value={selection.cameraDeviceId ?? ""}
            onChange={(cameraDeviceId) => onChange({ ...selection, cameraDeviceId })}
            disabled={!selection.cameraEnabled || cameras.length === 0}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">Speaker</label>
          <Select
            options={speakers.map((s) => ({ value: s.deviceId, label: s.label }))}
            value={selection.speakerDeviceId ?? ""}
            onChange={(speakerDeviceId) => onChange({ ...selection, speakerDeviceId })}
            disabled={speakers.length === 0}
          />
        </div>
      </div>
    </div>
  );
}
