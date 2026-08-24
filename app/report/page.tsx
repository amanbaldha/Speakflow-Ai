"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SessionReport } from "@/components/evaluation/SessionReport";
import { RecordingPlayback } from "@/components/recording/RecordingPlayback";
import { loadSessionReport } from "@/lib/session/storage";
import type { SessionReport as SessionReportType } from "@/types";

export default function ReportPage() {
  const [report, setReport] = useState<SessionReportType | null | undefined>(undefined);

  useEffect(() => {
    setReport(loadSessionReport());
  }, []);

  if (report === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          No session report found. Start a conversation first to see your results here.
        </p>
        <Link href="/">
          <Button>Back to home</Button>
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Session Report</h1>
        <Link href="/">
          <Button variant="secondary">Done</Button>
        </Link>
      </div>
      <div className="mb-6">
        <RecordingPlayback />
      </div>
      <SessionReport report={report} />
      <div className="mt-8 flex justify-center gap-3">
        <Link href={`/setup?mode=${report.mode}`}>
          <Button>Practice again</Button>
        </Link>
      </div>
    </main>
  );
}
