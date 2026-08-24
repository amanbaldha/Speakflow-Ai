"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** A minimal accessible switch — used for on/off controls (recording,
 *  camera, transcript, etc.) throughout the setup and session screens. */
export function Toggle({ checked, onChange, label, disabled, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50",
        checked ? "bg-accent" : "bg-muted",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
        style={{ height: "1.125rem", width: "1.125rem" }}
      />
    </button>
  );
}
