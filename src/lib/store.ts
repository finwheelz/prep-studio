"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Attempt, CardState, Competency, OaResult, TriadSlot, UserProgress } from "./types";
import { addDays, dayKey } from "./utils";
import { dailyFor } from "./daily";
import { PROBLEMS } from "@/data/problems";

interface UiState {
  theme: "dark" | "light";
  sidebarCollapsed: boolean;
  paletteOpen: boolean;
}

interface Actions {
  setDraft: (id: string, code: string) => void;
  clearDraft: (id: string) => void;
  setNote: (key: string, value: string) => void;
  /** Record a graded submission. Returns true if this was the first time the problem was solved. */
  recordSubmit: (id: string, passed: boolean, sec?: number) => boolean;
  addOaResult: (r: OaResult) => void;
  /** Record one quiz answer. Correct answers count toward daily activity. */
  answerQuiz: (id: string, ok: boolean) => void;
  /** Grade a flashcard: 0 again, 1 hard, 2 good, 3 easy (SM-2). */
  gradeCard: (id: string, grade: 0 | 1 | 2 | 3) => void;
  toggleRead: (topicId: string) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setPalette: (open: boolean) => void;
  resetAll: () => void;
  /** Replace all progress with a backup made by exportProgress. Throws on a file that is not one. */
  importProgress: (raw: string) => void;
}

type State = UserProgress & UiState & { hydrated: boolean } & Actions;

const emptyProgress: UserProgress = {
  attempts: {},
  drafts: {},
  notes: {},
  activity: {},
  dailyDone: {},
  oaResults: [],
  quiz: {},
  cards: {},
  read: {},
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...emptyProgress,
      theme: "dark",
      sidebarCollapsed: false,
      paletteOpen: false,
      hydrated: false,

      setDraft: (id, code) => set((s) => ({ drafts: { ...s.drafts, [id]: code } })),
      clearDraft: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.drafts;
          return { drafts: rest };
        }),
      setNote: (key, value) => set((s) => ({ notes: { ...s.notes, [key]: value } })),

      recordSubmit: (id, passed, sec) => {
        const now = Date.now();
        const today = dayKey();
        const prev = get().attempts[id];
        const firstSolve = passed && prev?.status !== "solved";
        const next: Attempt = {
          status: passed || prev?.status === "solved" ? "solved" : "attempted",
          submits: (prev?.submits ?? 0) + 1,
          passes: (prev?.passes ?? 0) + (passed ? 1 : 0),
          firstSolvedAt: prev?.firstSolvedAt ?? (passed ? now : undefined),
          lastAt: now,
          bestSec: passed && sec != null ? Math.min(prev?.bestSec ?? Infinity, sec) : prev?.bestSec,
        };
        set((s) => {
          const patch: Partial<State> = { attempts: { ...s.attempts, [id]: next } };
          if (passed) {
            // Activity counts passing submissions per day (re-solving for revision counts too).
            patch.activity = { ...s.activity, [today]: (s.activity[today] ?? 0) + 1 };
            const triad = dailyFor(today).slots;
            const slot = (Object.keys(triad) as TriadSlot[]).find((k) => triad[k] === id);
            if (slot) {
              patch.dailyDone = { ...s.dailyDone, [today]: { ...s.dailyDone[today], [slot]: true } };
            }
          }
          return patch;
        });
        return firstSolve;
      },

      answerQuiz: (id, ok) =>
        set((s) => {
          const prev = s.quiz[id];
          const today = dayKey();
          return {
            quiz: { ...s.quiz, [id]: { right: (prev?.right ?? 0) + (ok ? 1 : 0), wrong: (prev?.wrong ?? 0) + (ok ? 0 : 1), last: Date.now(), ok } },
            // Ten correct answers weigh about as much as one solved problem in the activity grid.
            activity: ok ? { ...s.activity, [today]: (s.activity[today] ?? 0) + 0.1 } : s.activity,
          };
        }),
      gradeCard: (id, grade) =>
        set((s) => ({ cards: { ...s.cards, [id]: sm2(s.cards[id], grade) }, activity: { ...s.activity, [dayKey()]: (s.activity[dayKey()] ?? 0) + 0.05 } })),
      toggleRead: (topicId) => set((s) => ({ read: { ...s.read, [topicId]: !s.read[topicId] } })),

      addOaResult: (r) => set((s) => ({ oaResults: [r, ...s.oaResults].slice(0, 50) })),
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setPalette: (open) => set({ paletteOpen: open }),
      resetAll: () => set({ ...emptyProgress }),
      importProgress: (raw) => {
        const data = JSON.parse(raw) as { app?: string; progress?: Partial<UserProgress> };
        if (data.app !== BACKUP_APP || !data.progress || typeof data.progress.attempts !== "object") throw new Error("Not a Prep Studio backup file");
        const next = { ...emptyProgress };
        for (const k of Object.keys(emptyProgress) as (keyof UserProgress)[]) {
          const v = data.progress[k];
          if (v != null && typeof v === typeof emptyProgress[k] && Array.isArray(v) === Array.isArray(emptyProgress[k])) (next as Record<string, unknown>)[k] = v;
        }
        set(next);
      },
    }),
    {
      name: "prep-studio/v1",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ hydrated, paletteOpen, ...rest }) => rest,
      // Rehydrate after mount (see useBootStore) so server and first client render agree.
      skipHydration: true,
    },
  ),
);

const BACKUP_APP = "prep-studio";

/** Progress as a downloadable JSON string (drafts and notes included; UI preferences left out). */
export function exportProgress(): string {
  const s = useStore.getState();
  const progress = Object.fromEntries((Object.keys(emptyProgress) as (keyof UserProgress)[]).map((k) => [k, s[k]]));
  return JSON.stringify({ app: BACKUP_APP, version: 1, exportedAt: new Date().toISOString(), progress }, null, 1);
}

/** SM-2 with four buttons. "Again" resets the interval; ease never drops below 1.3. */
export function sm2(prev: CardState | undefined, grade: 0 | 1 | 2 | 3): CardState {
  const c = prev ?? { ease: 2.5, interval: 0, reps: 0, due: dayKey() };
  let { ease, interval, reps } = c;
  if (grade === 0) {
    reps = 0;
    interval = 0; // due again today
    ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    ease = Math.max(1.3, ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0));
    interval = reps === 1 ? (grade === 3 ? 3 : 1) : reps === 2 ? (grade === 1 ? 3 : 6) : Math.round(interval * (grade === 1 ? 1.2 : ease));
  }
  return { ease, interval, reps, due: dayKey(addDays(new Date(), interval)) };
}

// ───────────────────────── Derived selectors ─────────────────────────

/** Consecutive days, ending today or yesterday, with at least one passing submission. */
export function streakOf(activity: Record<string, number>, today = new Date()): { current: number; best: number } {
  let current = 0;
  let d = today;
  if (!activity[dayKey(d)]) d = addDays(d, -1); // today not done yet does not break the streak
  while (activity[dayKey(d)]) {
    current++;
    d = addDays(d, -1);
  }
  const days = Object.keys(activity).filter((k) => activity[k] > 0).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of days) {
    run = prev && dayKey(addDays(new Date(prev + "T00:00:00"), 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return { current, best: Math.max(best, current) };
}

export interface CompetencyStat {
  competency: Competency;
  total: number;
  solved: number;
  attempted: number;
  submits: number;
  passes: number;
  /** Solved / total in the bank. */
  coverage: number;
  /** Passing submissions / all graded submissions; null until there is a submission. */
  winRate: number | null;
}

export function competencyStats(attempts: Record<string, Attempt>): Record<Competency, CompetencyStat> {
  const out = {} as Record<Competency, CompetencyStat>;
  for (const p of PROBLEMS) {
    const s = (out[p.competency] ??= {
      competency: p.competency,
      total: 0,
      solved: 0,
      attempted: 0,
      submits: 0,
      passes: 0,
      coverage: 0,
      winRate: null,
    });
    s.total++;
    const a = attempts[p.id];
    if (a) {
      if (a.status === "solved") s.solved++;
      else s.attempted++;
      s.submits += a.submits;
      s.passes += a.passes;
    }
  }
  for (const s of Object.values(out)) {
    s.coverage = s.total ? s.solved / s.total : 0;
    s.winRate = s.submits ? s.passes / s.submits : null;
  }
  return out;
}
