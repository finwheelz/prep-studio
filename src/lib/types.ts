/**
 * Domain model. Content (problems, companies, OA sets) is static and lives in /src/data.
 * User state (drafts, attempts, streaks) is local-first and lives in the zustand store.
 */

// ───────────────────────── Taxonomy ─────────────────────────

export type PillarId = "data" | "ml" | "product" | "drill";

export type Competency =
  | "sql"
  | "python_stats"
  | "ml_llm"
  | "product"
  | "experimentation"
  | "system_design";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type TrackId = "fintech" | "ecommerce" | "consulting" | "apm";

export interface Category {
  id: string; // "sql/window-functions"
  pillar: PillarId;
  competency: Competency;
  label: string;
}

export interface Pillar {
  id: PillarId;
  label: string;
  short: string;
  blurb: string;
  modality: string;
}

export interface Track {
  id: TrackId;
  label: string;
  blurb: string;
}

export interface Company {
  id: string;
  name: string;
  roles: string[];
  tracks: TrackId[];
  /** Rounds as reported in the Placement Chronicles. */
  process: string[];
  tested: string[];
  cgpaCut: number | null;
  cycle: "AY25-26" | "AY26-27";
}

/**
 * Where a question comes from. "reported" = a student wrote in the Placement Chronicles
 * that this company asked it. "practice" = written for this bank, modelled on reported patterns.
 */
export type Source =
  | { kind: "reported"; companyId: string; round?: string }
  | { kind: "practice" };

// ───────────────────────── Problems ─────────────────────────

export interface ProblemBase {
  id: string;
  title: string;
  pillar: PillarId;
  competency: Competency;
  category: string;
  difficulty: Difficulty;
  source: Source;
  tracks: TrackId[];
  tags: string[];
  /** Target time in minutes; drives the studio timer colour. */
  targetMin: number;
  /** Markdown-lite: paragraphs, lists, `code`, ``` fences, **bold**, $inline$ and $$display$$ math. */
  statement: string;
  constraints?: string[];
  context: InterviewContext;
  hints?: string[];
}

export interface InterviewContext {
  why: string;
  traps: string[];
  followUps: string[];
}

// —— Code problems (Pillar 1) ——

export type Language = "sql" | "python";

export interface SqlTestCase {
  id: string;
  name: string;
  hidden: boolean;
  /** Dataset variant to load before running. Falls back to the problem's default dataset. */
  seedId?: string;
}

export interface PyTestCase {
  id: string;
  name: string;
  hidden: boolean;
  /** Python expression evaluated after the user's code, e.g. `two_sum([2,7,11,15], 9)`. */
  call: string;
  /** Python expression for the expected value, compared with ==. */
  expected: string;
}

export interface SqlProblem extends ProblemBase {
  kind: "sql";
  datasetId: string;
  starter: string;
  /** Reference query. Expected output for every test is produced by running this on the same seed. */
  solution: string;
  /** If false, row order is ignored when comparing result sets. */
  ordered: boolean;
  tests: SqlTestCase[];
  sample?: { input: string; output: string };
}

export interface PythonProblem extends ProblemBase {
  kind: "python";
  starter: string;
  solution: string;
  /** Extra Pyodide packages (fetched from the Pyodide CDN on first run). */
  packages?: string[];
  /** Python run before the user's code (fixtures). */
  setup?: string;
  tests: PyTestCase[];
  sample?: { input: string; output: string };
}

export type CodeProblem = SqlProblem | PythonProblem;

// —— Concept problems (Pillar 2, and experimentation / unit economics in Pillar 3) ——

export type LabId =
  | "threshold"
  | "regularization"
  | "gradient-descent"
  | "ab-sample-size"
  | "none";

export interface PipelineStep {
  id: string;
  label: string;
  role: string;
  detail: string;
  /** What breaks here in production; shown as the diagnostic line. */
  failure: string;
  latency?: string;
}

export interface DerivationStep {
  say: string;
  /** KaTeX source. */
  tex?: string;
}

export type Check =
  | {
      id: string;
      type: "mcq";
      prompt: string;
      options: string[];
      answer: number;
      explain: string;
    }
  | {
      id: string;
      type: "numeric";
      prompt: string;
      answer: number;
      /** Absolute tolerance. */
      tol: number;
      unit?: string;
      explain: string;
    };

export interface ConceptProblem extends ProblemBase {
  kind: "concept";
  lab: LabId;
  pipeline?: { title: string; steps: PipelineStep[] };
  derivation?: { title: string; steps: DerivationStep[] };
  checks: Check[];
}

// —— Case problems (Pillar 3) ——

export type Verdict = "root" | "contributing" | "ruled_out";

export interface HypothesisNode {
  id: string;
  label: string;
  /** Top-level buckets are the MECE split; leaves are testable hypotheses. */
  children?: HypothesisNode[];
  /** Leaves only: the data cut you would ask for. */
  ask?: string;
  /** Leaves only: what the interviewer reveals when you ask. */
  evidence?: string;
  verdict?: Verdict;
}

export interface FrameworkStep {
  id: string;
  title: string;
  prompt: string;
  /** Model answer revealed after the candidate writes their own. */
  model: string;
}

export interface RcaProblem extends ProblemBase {
  kind: "rca";
  scenario: { headline: string; metric: string; delta: string; window: string; segment: string };
  /** Clarifying questions the candidate can "ask"; answers narrow the search. */
  clarifications: { q: string; a: string }[];
  tree: HypothesisNode[];
  steps: FrameworkStep[];
}

export interface GuesstimateRow {
  segment: string;
  assumption: string;
  /** Numeric factors that multiply to the row value. */
  factors: number[];
}

export interface GuesstimateProblem extends ProblemBase {
  kind: "guesstimate";
  unit: string;
  approach: "demand" | "supply";
  clarifications: { q: string; a: string }[];
  /** Model build; the candidate builds their own first. */
  model: GuesstimateRow[];
  /** Post-multiplier on the row sum, e.g. shifts or a pairs→gloves factor. */
  modelMultiplier?: { label: string; value: number };
  sanity: string;
  /** Answers within [low, high] count as in range. */
  range: [number, number];
}

export interface OpenProblem extends ProblemBase {
  kind: "open";
  /** Sections the answer should have, in order. */
  sections: { id: string; title: string; prompt: string; model: string }[];
  /** Self-graded checklist an interviewer would score against. */
  rubric: string[];
}

export type CaseProblem = RcaProblem | GuesstimateProblem | OpenProblem;

export type Problem = CodeProblem | ConceptProblem | CaseProblem;
export type ProblemKind = Problem["kind"];

// ───────────────────────── Datasets (schema viewer + seeds) ─────────────────────────

export interface Column {
  name: string;
  type: string;
  key?: "PK" | "FK";
  ref?: string;
  note?: string;
}

export interface TableDef {
  name: string;
  description: string;
  columns: Column[];
}

export interface Dataset {
  id: string;
  label: string;
  tables: TableDef[];
  /** DDL shared by every seed. */
  ddl: string;
  /** Named seeds: "default" is the visible sample; others are hidden edge-case variants. */
  seeds: Record<string, string>;
}

// ───────────────────────── Execution results ─────────────────────────

export interface ResultSet {
  columns: string[];
  rows: (string | number | boolean | null)[][];
}

export interface TestResult {
  id: string;
  name: string;
  hidden: boolean;
  pass: boolean;
  ms: number;
  expected?: ResultSet | string;
  actual?: ResultSet | string;
  error?: string;
}

export interface RunOutput {
  ok: boolean;
  ms: number;
  result?: ResultSet;
  stdout?: string;
  error?: string;
  plan?: string;
  /** Python only: base64 PNGs of matplotlib figures. */
  figures?: string[];
}

// ───────────────────────── OA simulator ─────────────────────────

export interface OaItem {
  id: string;
  topic: string;
  prompt: string;
  /** MCQ if options is set, numeric otherwise. */
  options?: string[];
  answer: number;
  tol?: number;
  explain: string;
}

/** A timed section of a sectional mock. Items belong to the first section whose topics list their topic. */
export interface OaSection {
  title: string;
  minutes: number;
  /** Minimum % correct to clear the section. */
  cutoffPct: number;
  /** OaItem.topic values in this section; "coding" takes the set's coding questions. */
  topics: string[] | "coding";
}

export interface OaSet {
  id: string;
  title: string;
  mirrors: string;
  minutes: number;
  items: OaItem[];
  /** Problem ids from the bank to append as coding sections. */
  codingIds: string[];
  tracks: TrackId[];
  /** Sectional mock: each section has its own clock and cutoff; earlier sections lock. */
  sections?: OaSection[];
}

// ───────────────────────── User state ─────────────────────────

export type AttemptStatus = "attempted" | "solved";

export interface Attempt {
  status: AttemptStatus;
  /** Graded submissions. */
  submits: number;
  /** Submissions that passed everything. */
  passes: number;
  firstSolvedAt?: number;
  lastAt: number;
  bestSec?: number;
}

export type TriadSlot = "sql" | "ml" | "case";

export interface DailyChallenge {
  date: string; // YYYY-MM-DD, local time
  slots: Record<TriadSlot, string>; // problem ids
}

export interface OaResult {
  setId: string;
  at: number;
  score: number;
  total: number;
  secUsed: number;
  byTopic: Record<string, { right: number; total: number }>;
  bySection?: { title: string; right: number; total: number; cutoffPct: number; cleared: boolean }[];
}

export interface UserProgress {
  attempts: Record<string, Attempt>;
  /** Editor drafts keyed by problem id. */
  drafts: Record<string, string>;
  /** Free-form case work keyed by `${problemId}:${field}`. */
  notes: Record<string, string>;
  /** Solves per local day, for the activity matrix and streak. */
  activity: Record<string, number>;
  /** Which triad slots were completed on which day. */
  dailyDone: Record<string, Partial<Record<TriadSlot, boolean>>>;
  oaResults: OaResult[];
  /** Per-question quiz history. */
  quiz: Record<string, QuizStat>;
  /** Flashcard scheduling. Cards never reviewed have no entry. */
  cards: Record<string, CardState>;
  /** Topics whose notes were marked as read. */
  read: Record<string, boolean>;
  /** Wrong answers, newest first, capped at 3,000. */
  errors: ErrorEntry[];
  /** Spaced repeats of missed items, keyed by quiz item id. */
  repeats: Record<string, RepeatState>;
}

// ───────────────────────── Syllabus: learn / practise / revise ─────────────────────────

export type TrackKey =
  | "python" | "dsa" | "maths" | "cml" | "dl" | "llm" | "aieng" | "sysdesign"
  // Pre-rebuild tracks: still served, no new content.
  | "foundations" | "aptitude" | "analyst" | "ml" | "product";

export interface Resource {
  label: string;
  url: string;
  note?: string;
}

/** One syllabus topic. Everything else (quiz items, cards, coding problems) hangs off a topic id. */
export interface Topic {
  id: string;
  track: TrackKey;
  module: string;
  title: string;
  summary: string;
  /** Markdown-lite study notes. */
  notes: string;
  resources?: Resource[];
  /** Problem categories whose coding / case problems belong to this topic. */
  categories?: string[];
  /** Interview questions with a model answer and the points an interviewer listens for. */
  interview?: InterviewQ[];
  /** v2 lesson anatomy. When set, the Learn tab renders the lesson instead of `notes`. */
  lesson?: Lesson;
}

export type LessonKind = "concept" | "interview" | "quiz" | "design";
export type WidgetId = "poly-fit" | "learning-curve" | "threshold" | "regularization" | "gradient-descent";

export interface Lesson {
  kind: LessonKind;
  mins: number;
  /** One-line question the lesson answers. */
  hook: string;
  /** Topic ids worth knowing first. */
  prereq?: string[];
  /** Situation, then the idea in plain words (markdown-lite). */
  intuition?: string;
  widget?: WidgetId;
  /** Derivation / mechanics (markdown-lite). Labelled "Code" for Python and DSA. */
  maths?: string;
  mathsLabel?: "Maths" | "Code";
  /** When to use it, defaults, where it shows up. */
  practice?: string;
  /** The answer that sounds right, and why it's wrong. */
  traps?: { trap: string; why: string }[];
  say?: SayIt;
  terms?: [string, string][];
  /** Every source carries the date it was last checked (YYYY-MM-DD). */
  sources?: { label: string; url?: string; checked: string }[];
}

export interface SayIt {
  prompt: string;
  secs: number;
  /** Points to tick off after answering out loud. */
  check: string[];
  followups: { q: string; a: string }[];
  /** Model answer (markdown-lite). */
  answer: string;
  /** Things that sound fine but cost you the round. */
  avoid: string[];
}

export interface InterviewQ {
  q: string;
  /** Markdown-lite model answer. */
  answer: string;
  /** What a strong answer must contain; the learner grades themselves against it. */
  rubric: string[];
}

/**
 * How a verification script recomputes an item's answer.
 * - `py`: Python run in Pyodide (same runtime as the site); it must assign `answer`
 *   (a number, or the option index for MCQ). Listed packages are loaded first.
 * - `gen`: produced by a generator in src/data/gen whose own solver re-derives the answer.
 */
export type ItemCheck = { py: string; packages?: string[] } | { gen: string };

export interface QuizItem {
  id: string;
  topic: string;
  /** 1 easy, 2 medium, 3 hard. */
  d: 1 | 2 | 3;
  prompt: string;
  /** MCQ when set; numeric otherwise. */
  options?: string[];
  answer: number;
  tol?: number;
  explain: string;
  /** Time benchmark in seconds (required for new content). */
  secs?: number;
  /** Fastest method, shown before the explanation. */
  fast?: string;
  /** The common wrong method and why it fails. */
  trap?: string;
  /** Where the pattern comes from, with a date. */
  src?: string;
  /** True for content authored with an explicit, stable id (see build.ts `Item`). */
  fixedId?: boolean;
  /** Present when a script can recompute the answer; scripts/verify-items.mts uses it to fill verified.json. */
  check?: ItemCheck;
}

export interface Card {
  id: string;
  topic: string;
  front: string;
  back: string;
}

export interface QuizStat {
  right: number;
  wrong: number;
  last: number;
  /** Result of the most recent attempt. */
  ok: boolean;
  /** Total seconds spent across attempts (for per-topic time). Absent on old records. */
  secs?: number;
}

/** One wrong (or timed-out) answer. The error log is append-only and capped. */
export interface ErrorEntry {
  item: string;
  topic: string;
  at: number;
  /** What was chosen or typed; "" for a timeout or blank. */
  given: string;
  secs: number;
  from: "quiz" | "oa";
  timeout?: boolean;
}

/** A missed item comes back 1, 3 and 7 days after the miss; a miss on any repeat restarts the cycle. */
export interface RepeatState {
  /** Day of the miss, YYYY-MM-DD. */
  missed: string;
  /** Repeats already passed: 0, 1 or 2. */
  step: 0 | 1 | 2;
  /** Next due day, YYYY-MM-DD. */
  due: string;
}

/** Extra fields an answer can carry. */
export interface AnswerMeta {
  secs?: number;
  given?: string;
  topic?: string;
  from?: "quiz" | "oa";
  timeout?: boolean;
}

/** SM-2 scheduling state for one flashcard. */
export interface CardState {
  ease: number;
  interval: number;
  reps: number;
  due: string; // YYYY-MM-DD
}
