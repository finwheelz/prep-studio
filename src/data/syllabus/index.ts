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
import "./p-b7";
import "./p-b8";
import "./p-b9";
import "./p-b10";
import "./p-b11";
import "./p3-ttests";
// v2 lesson anatomy (pilot).
import "./v2-cml-a";
import "./v2-cml-b";
import "./v2-generalisation";
import "./v2-cml-c";
import "./v2-llm-a";
import "./v2-llm-b";
import "./v2-llm-c";
import "./v2-llm-d";
import "./v2-llm-e";
import "./v2-dl-a";
import "./v2-dl-b";
import "./v2-dl-c";
import "./v2-dl-d";
import "./v2-dl-e";
import "./v2-dl-f";
import "./v2-ai-a";
import "./v2-ai-b";
import "./v2-ai-c";
import "./v2-ai-d";
import "./v2-ai-e";
import "./v2-ai-f";
import "./v2-ai-g";
import "./v2-py-a";
import "./v2-py-b";
import "./v2-py-c";
import "./v2-py-d";
import "./v2-py-e";
import "./v2-py-f";
import "./v2-py-g";
import "./v2-py-h";
import "./v2-py-i";
import "./v2-dsa-a";
import "./v2-dsa-b";
import "./v2-dsa-c";
import "./v2-dsa-d";
import "./v2-dsa-e";
import "./v2-dsa-f";
import "./v2-dsa-g";
import "./v2-m-a";
import "./v2-m-b";
import "./v2-m-c";
import "./v2-m-d";
import "./v2-m-e";
import "./v2-m-f";
import "./v2-m-g";
import "./v2-m-h";
import "./v2-m-i";
import "./v2-sd-a";
import "./v2-sd-b";
import "./v2-sd-c";
import type { TrackKey } from "@/lib/types";
import { CARDS, QUIZ, TOPICS } from "./build";

export { CARDS, QUIZ, TOPICS };

export const TRACK_META: { id: TrackKey; label: string; blurb: string; v2?: boolean }[] = [
  { id: "python", label: "Python", blurb: "Core Python, pandas, numpy, plotting and the libraries non-core coding rounds use", v2: true },
  { id: "dsa", label: "DSA", blurb: "Complexity and the patterns coding rounds draw from, solved in Python", v2: true },
  { id: "maths", label: "Maths for ML", blurb: "Linear algebra, calculus, probability, statistics, information theory, A/B testing", v2: true },
  { id: "cml", label: "Classical ML", blurb: "Features, linear and tree models, unsupervised learning, metrics and generalisation", v2: true },
  { id: "dl", label: "Deep learning", blurb: "Training neural networks, CNNs, sequence models, transformers, generative models", v2: true },
  { id: "llm", label: "NLP & LLMs", blurb: "Text, tokenisation, LLM architecture, pre-training, post-training and decoding", v2: true },
  { id: "aieng", label: "AI engineering", blurb: "Inference, prompting, RAG, agents, evals, MLOps and LLMOps", v2: true },
  { id: "sysdesign", label: "ML system design", blurb: "End-to-end AI and ML system designs, from requirements to rollout", v2: true },
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

/** Tracks that have content, in display order. */
export const ACTIVE_TRACKS = TRACK_META.filter((t) => TOPICS.some((x) => x.track === t.id));

/** Topics in the same module as `id`, in order. */
export function moduleOf(id: string) {
  const t = topicById(id);
  return t ? TOPICS.filter((x) => x.track === t.track && x.module === t.module) : [];
}
