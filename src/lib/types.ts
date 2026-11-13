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

export interface OaSet {
  id: string;
  title: string;
  mirrors: string;
  minutes: number;
  items: OaItem[];
  /** Problem ids from the bank to append as coding sections. */
  codingIds: string[];
  tracks: TrackId[];
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
}
