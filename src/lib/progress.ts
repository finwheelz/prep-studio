import type { Attempt, CardState, QuizStat, Topic, TrackKey } from "./types";
import { CARDS, QUIZ, TOPICS } from "@/data/syllabus";
import { PROBLEMS } from "@/data/problems";
import { dayKey } from "./utils";

export interface TopicProgress {
  quizTotal: number;
  /** Questions whose latest answer was correct. */
  quizRight: number;
  quizTried: number;
  probTotal: number;
  probSolved: number;
  cardTotal: number;
  cardSeen: number;
  cardDue: number;
}

export const problemsFor = (t: Topic) => (t.categories?.length ? PROBLEMS.filter((p) => t.categories!.includes(p.category)) : []);

export function topicProgress(t: Topic, quiz: Record<string, QuizStat>, attempts: Record<string, Attempt>, cards: Record<string, CardState>): TopicProgress {
  const qs = QUIZ.filter((q) => q.topic === t.id);
  const ps = problemsFor(t);
  const cs = CARDS.filter((c) => c.topic === t.id);
  const today = dayKey();
  return {
    quizTotal: qs.length,
    quizRight: qs.filter((q) => quiz[q.id]?.ok).length,
    quizTried: qs.filter((q) => quiz[q.id]).length,
    probTotal: ps.length,
    probSolved: ps.filter((p) => attempts[p.id]?.status === "solved").length,
    cardTotal: cs.length,
    cardSeen: cs.filter((c) => cards[c.id]).length,
    cardDue: cs.filter((c) => cards[c.id] && cards[c.id].due <= today).length,
  };
}

export function trackProgress(track: TrackKey, read: Record<string, boolean>, quiz: Record<string, QuizStat>, attempts: Record<string, Attempt>, cards: Record<string, CardState>) {
  const topics = TOPICS.filter((t) => t.track === track);
  const sum = { topics: topics.length, read: 0, quizTotal: 0, quizRight: 0, quizTried: 0, probTotal: 0, probSolved: 0, cardTotal: 0, cardSeen: 0, cardDue: 0 };
  const seen = new Set<string>();
  for (const t of topics) {
    if (read[t.id]) sum.read++;
    const p = topicProgress(t, quiz, attempts, cards);
    sum.quizTotal += p.quizTotal;
    sum.quizRight += p.quizRight;
    sum.quizTried += p.quizTried;
    sum.cardTotal += p.cardTotal;
    sum.cardSeen += p.cardSeen;
    sum.cardDue += p.cardDue;
    // A problem category can be linked from two topics: count each problem once per track.
    for (const pr of problemsFor(t)) {
      if (seen.has(pr.id)) continue;
      seen.add(pr.id);
      sum.probTotal++;
      if (attempts[pr.id]?.status === "solved") sum.probSolved++;
    }
  }
  return sum;
}
