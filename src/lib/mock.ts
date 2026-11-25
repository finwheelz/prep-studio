import { TOPICS } from "@/data/syllabus";
import { ROADMAPS } from "@/data/curriculum";
import { shuffled } from "./utils";

/** One spoken interview question with what the interviewer listens for. */
export type MockQ = { id: string; q: string; rubric: string[]; answer: string; lessonId: string; lessonTitle: string; module: string };
export type MockRound = { n: number; title: string; modules: string[]; qs: MockQ[] };

export const ROUND_SIZE = 6;
export const SECS_PER_Q = 180;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** All questions available for a set of roadmap steps: lesson Say-it prompts plus interview-lesson scenarios. */
function pool(steps: { track: string; module: string }[]): MockQ[] {
  const out: MockQ[] = [];
  for (const st of steps) {
    for (const t of TOPICS) {
      if (t.track !== st.track || t.module !== st.module || !t.lesson) continue;
      const s = t.lesson.say;
      if (s) out.push({ id: `${t.id}#say`, q: s.prompt, rubric: s.check, answer: s.answer, lessonId: t.id, lessonTitle: t.title, module: t.module });
      t.interview?.forEach((x, i) => out.push({ id: `${t.id}#iq${i}`, q: x.q, rubric: x.rubric, answer: x.answer, lessonId: t.id, lessonTitle: t.title, module: t.module }));
    }
  }
  return out;
}

/**
 * Three rounds per role, following the roadmap order: round 1 draws from the first third of the
 * role's modules (foundations), round 2 the middle, round 3 the last third (applied / design).
 * Selection is deterministic per role, round and draw (attempt number), and spreads across modules,
 * so each new attempt gets a fresh set of questions.
 */
export function roundsFor(roleId: string, draws: number[] = [0, 0, 0]): MockRound[] {
  const role = ROADMAPS.find((r) => r.id === roleId) ?? ROADMAPS[0];
  const steps = role.steps.filter((s) => TOPICS.some((t) => t.track === s.track && t.module === s.module && t.lesson));
  const third = Math.ceil(steps.length / 3);
  const titles = ["Foundations", "Core depth", "Applied and design"];
  return [0, 1, 2].map((k) => {
    const part = steps.slice(k * third, (k + 1) * third);
    const byModule = part.map((s) => shuffled(pool([s]), hash(`${role.id}-${k}-${draws[k] ?? 0}-${s.track}-${s.module}`)));
    const qs: MockQ[] = [];
    for (let i = 0; qs.length < ROUND_SIZE && byModule.some((m) => m.length > i); i++) {
      for (const m of byModule) if (m[i] && qs.length < ROUND_SIZE) qs.push(m[i]);
    }
    return { n: k + 1, title: titles[k], modules: part.map((s) => s.module), qs: shuffled(qs, hash(`${role.id}-${k}-${draws[k] ?? 0}`)) };
  });
}

export type MockResult = { role: string; round: number; at: number; score: number; total: number; misses: string[] };
const KEY = "prep-studio-mock-results";

export function loadResults(): MockResult[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as MockResult[];
  } catch {
    return [];
  }
}

export function saveResult(r: MockResult) {
  try {
    localStorage.setItem(KEY, JSON.stringify([r, ...loadResults()].slice(0, 100)));
  } catch {
    /* storage unavailable: results stay in memory for this visit */
  }
}
