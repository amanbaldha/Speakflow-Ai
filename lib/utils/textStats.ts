// Small, deterministic (non-AI) text helpers used when computing session
// statistics — no need to burn a model call on plain arithmetic.

const FILLER_PATTERN = /\b(um+|uh+|erm+|like|you know|i mean|sort of|kind of|basically|actually)\b/gi;

export function countFillerWords(text: string): number {
  const matches = text.match(FILLER_PATTERN);
  return matches ? matches.length : 0;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
