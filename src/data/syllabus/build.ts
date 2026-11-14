import type { Card, QuizItem, Resource, Topic, TrackKey } from "@/lib/types";

/**
 * Authoring helpers. Content files call these in order; ids are derived from the topic id and
 * position, so always append new items at the end of a topic to keep saved progress valid.
 */
export const TOPICS: Topic[] = [];
export const QUIZ: QuizItem[] = [];
export const CARDS: Card[] = [];

const qn: Record<string, number> = {};
const cn: Record<string, number> = {};
let current = "";

export function T(id: string, track: TrackKey, module: string, title: string, summary: string, notes: string, extra: { resources?: Resource[]; categories?: string[] } = {}) {
  TOPICS.push({ id, track, module, title, summary, notes: notes.trim(), ...extra });
  current = id;
}

/** Multiple choice for the current topic. */
export function Q(d: 1 | 2 | 3, prompt: string, options: string[], answer: number, explain: string) {
  const i = (qn[current] = (qn[current] ?? 0) + 1);
  QUIZ.push({ id: `${current}-q${i}`, topic: current, d, prompt, options, answer, explain });
}

/** Numeric answer for the current topic. */
export function N(d: 1 | 2 | 3, prompt: string, answer: number, tol: number, explain: string) {
  const i = (qn[current] = (qn[current] ?? 0) + 1);
  QUIZ.push({ id: `${current}-q${i}`, topic: current, d, prompt, answer, tol, explain });
}

/** Flashcard for the current topic. */
export function C(front: string, back: string) {
  const i = (cn[current] = (cn[current] ?? 0) + 1);
  CARDS.push({ id: `${current}-c${i}`, topic: current, front, back });
}

export const R = (label: string, url: string, note?: string): Resource => ({ label, url, note });
