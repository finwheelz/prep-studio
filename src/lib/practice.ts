import type { ErrorEntry, QuizItem, QuizStat, RepeatState } from "./types";

/** Items whose spaced repeat is due on or before `today`. */
export const dueItems = (items: QuizItem[], repeats: Record<string, RepeatState> | undefined, today: string) =>
  items.filter((q) => repeats?.[q.id] && repeats[q.id].due <= today);

export interface TopicStat {
  topic: string;
  attempts: number;
  right: number;
  accuracy: number;
  avgSecs: number | null;
  /** Errors logged in the last 30 days. */
  recentErrors: number;
}

/** Per-topic accuracy and time from quiz history and the error log. */
export function topicStats(items: QuizItem[], quiz: Record<string, QuizStat>, errors: ErrorEntry[] | undefined, now = Date.now()): TopicStat[] {
  const by = new Map<string, TopicStat & { secs: number; timed: number }>();
  for (const q of items) {
    const s = quiz[q.id];
    if (!s) continue;
    const t = by.get(q.topic) ?? { topic: q.topic, attempts: 0, right: 0, accuracy: 0, avgSecs: null, recentErrors: 0, secs: 0, timed: 0 };
    t.attempts += s.right + s.wrong;
    t.right += s.right;
    if (s.secs) { t.secs += s.secs; t.timed += s.right + s.wrong; }
    by.set(q.topic, t);
  }
  const cutoff = now - 30 * 864e5;
  for (const e of errors ?? []) {
    const t = by.get(e.topic);
    if (t && e.at >= cutoff) t.recentErrors++;
  }
  return [...by.values()].map(({ secs, timed, ...t }) => ({ ...t, accuracy: t.attempts ? t.right / t.attempts : 0, avgSecs: timed ? secs / timed : null }));
}

/**
 * Weak topics: at least 3 attempts and accuracy under 70%, or 3+ errors in the last 30 days.
 * Sorted worst first (accuracy, then recent errors).
 */
export const weakTopics = (stats: TopicStat[]) =>
  stats
    .filter((t) => (t.attempts >= 3 && t.accuracy < 0.7) || t.recentErrors >= 3)
    .sort((a, b) => a.accuracy - b.accuracy || b.recentErrors - a.recentErrors)
    .map((t) => t.topic);

/** Prefilled GitHub issue for "this answer is wrong". No backend: the report is an issue on the repo. */
export function reportUrl(itemId: string, prompt: string, shown: string) {
  const repo = process.env.NEXT_PUBLIC_REPO || "finwheelz/prep-studio";
  const title = `Wrong answer? ${itemId}`;
  const body = `Item: \`${itemId}\`\n\nPrompt:\n> ${prompt.slice(0, 600).replace(/\n/g, "\n> ")}\n\nShown answer: ${shown}\n\nWhat I think is right, and why:\n`;
  return `https://github.com/${repo}/issues/new?labels=wrong-answer&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
