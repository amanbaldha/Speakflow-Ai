import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionReport as SessionReportType } from "@/types";

function ScoreRing({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full border-4 text-sm font-semibold"
        style={{ borderColor: `hsl(258 90% 66% / ${Math.max(0.25, value / 100)})` }}
      >
        {value}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function SessionReport({ report }: { report: SessionReportType }) {
  const durationMinutes = Math.max(1, Math.round((report.endedAt - report.startedAt) / 60000));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <p className="text-sm text-muted-foreground">Overall Score</p>
          <p className="text-5xl font-semibold text-accent">{report.overallScore}</p>
          <p className="text-xs text-muted-foreground">/ 100</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-6">
            <ScoreRing label="Fluency" value={report.scores.fluency} />
            <ScoreRing label="Grammar" value={report.scores.grammar} />
            <ScoreRing label="Vocabulary" value={report.scores.vocabulary} />
            <ScoreRing label="Clarity" value={report.scores.clarity} />
            <ScoreRing label="Confidence" value={report.scores.confidence} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What You Did Well</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {report.whatYouDidWell.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-success">✓</span> {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Things To Improve</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              {report.thingsToImprove.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground">{i + 1}.</span> {item}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {report.commonMistakes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Common Mistakes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.commonMistakes.map((m, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
                <p className="text-muted-foreground">
                  You said: <span className="text-foreground">&ldquo;{m.said}&rdquo;</span>
                </p>
                <p className="mt-1 text-muted-foreground">
                  Better: <span className="text-success">&ldquo;{m.better}&rdquo;</span>
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">{m.explanation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {report.betterVocabulary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Better Vocabulary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {report.betterVocabulary.map((v, i) => (
                <div key={i} className="rounded-full border border-border bg-surface-2 px-3.5 py-1.5 text-sm">
                  <span className="text-muted-foreground line-through">{v.original}</span>{" "}
                  <span className="text-accent">→ {v.suggestion}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Speaking Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Stat label="Speaking time" value={`${durationMinutes} min`} />
            <Stat label="Turns" value={report.stats.numberOfTurns} />
            <Stat label="Avg. response length" value={`${report.stats.averageResponseLengthWords} words`} />
            <Stat label="Filler words" value={report.stats.fillerWordCount} />
            <Stat label="Questions you asked" value={report.stats.questionsAskedByUser} />
            <Stat label="Questions you answered" value={report.stats.questionsAnsweredByUser} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
