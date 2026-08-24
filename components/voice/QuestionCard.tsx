"use client";

interface QuestionCardProps {
  index: number;
  total: number;
  text: string;
}

export function QuestionCard({ index, total, text }: QuestionCardProps) {
  return (
    <div className="w-full max-w-2xl text-center">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Question {index + 1} of {total}
      </p>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(index / total) * 100}%` }} />
      </div>
      <h2 className="text-2xl font-medium leading-snug sm:text-3xl">{text}</h2>
    </div>
  );
}
