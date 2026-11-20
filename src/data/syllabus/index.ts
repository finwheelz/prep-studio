/**
 * Syllabus content. Import order fixes the display order of topics within a module.
 * Each file calls T() once per topic, followed by that topic's Q()/N() quiz items and C() cards.
 */
import "./foundations-sql";
import "./foundations-python";
import "./aptitude-quant";
import "./aptitude-reasoning";
import "./analyst";
import "./ml";
import "./product";
// Rebuild concepts (fixed ids, verified answers).
import "./p1-pipelines";
import "./p2-arrangements";
import "./p2-arithmetic";
import "./p1-core-python";
import "./p1-dsa";
import "./p2-b4";
import "./p2-b5";
import "./p-b6";
import "./p3-ttests";
import type { TrackKey } from "@/lib/types";
import { CARDS, QUIZ, TOPICS } from "./build";

export { CARDS, QUIZ, TOPICS };

export const TRACK_META: { id: TrackKey; label: string; blurb: string }[] = [
  { id: "foundations", label: "Foundations", blurb: "SQL, Python, Excel and BI: needed for every role" },
  { id: "aptitude", label: "Aptitude", blurb: "Quant, logical reasoning, DI, verbal and puzzles: the OA gate" },
  { id: "analyst", label: "Analyst", blurb: "Statistics, regression, EDA and business metrics" },
  { id: "ml", label: "ML & AI", blurb: "Classical ML, deep learning, LLMs, RAG and MLOps" },
  { id: "product", label: "Product & Business", blurb: "Product sense, metrics, experiments, cases and HR" },
];

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
export const quizFor = (topicId: string) => QUIZ.filter((q) => q.topic === topicId);
export const cardsFor = (topicId: string) => CARDS.filter((c) => c.topic === topicId);

/** Modules of a track, in first-appearance order, each with its topics. */
export function modulesOf(track: TrackKey) {
  const out: { module: string; topics: typeof TOPICS }[] = [];
  for (const t of TOPICS.filter((x) => x.track === track)) {
    let m = out.find((x) => x.module === t.module);
    if (!m) out.push((m = { module: t.module, topics: [] }));
    m.topics.push(t);
  }
  return out;
}
