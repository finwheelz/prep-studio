# Prep Studio

Placement preparation workspace for data, ML and product roles. Local-first: no backend, no accounts, no AI calls. SQL runs on real PostgreSQL in the browser (PGlite, WASM); Python runs on Pyodide in a Web Worker. The Python runtime and every wheel (numpy, pandas, matplotlib, seaborn, scipy, scikit-learn, statsmodels) are served from this site; nothing loads from a CDN at runtime.

## Run

```bash
npm install        # postinstall copies the Pyodide core into public/pyodide
npm run wheels     # once: fetches the wheels (~150 MB) from the Pyodide GitHub release, sha256-checked
npm run dev        # http://localhost:3000
npm run verify     # every check CI runs: types, integrity, Python tests in Pyodide, SQL
```

Node 22+. TypeScript is pinned to 5.6: Next 14 does not resolve the `@/` alias under TypeScript 7.

## The four pillars

| Pillar | Route | Workspace | Component |
|---|---|---|---|
| 1 Data & Analytics | `/problems?pillar=data` → `/p/:id` | Split-pane code studio | `components/studio/ProblemStudio.tsx` |
| 2 Applied ML & Systems | `/problems?pillar=ml` → `/p/:id` | Lab / pipeline / derivation / checks canvas | `components/ml/ConceptCanvas.tsx`, `labs.tsx` |
| 3 Product & Business | `/problems?pillar=product` → `/p/:id` | Case-tree workbench, guesstimate builder, structured free response | `components/cases/*` |
| 4 Daily Drill & OA | `/drill`, `/drill/oa/:id` | Daily triad, activity matrix, full-screen timed room | `app/drill/*` |

`/p/[id]/Workspace.tsx` picks the workspace from `problem.kind` (`sql`, `python`, `concept`, `rca`, `guesstimate`, `open`).

## Layout

```
src/
  app/                    routes (App Router)
    layout.tsx            fonts, KaTeX css, <Shell>
    Dashboard.tsx         daily target, readiness radar, company tracks
    problems/             filterable list; filters live in the URL
    p/[id]/               one route for every problem kind
    drill/                triad + OA sets + history; drill/oa/[id] is the assessment room
  components/
    shell/                sidebar, top bar, command palette (Ctrl/Cmd+K), streak indicator
    studio/               ProblemPanel (left pane), ProblemStudio, Editor (CodeMirror), ResultTable (windowed), SplitLayout
    ml/                   ConceptCanvas, Pipeline, Derivation, Checks, labs (threshold, regularisation, gradient descent, A/B size)
    cases/                RcaStudio (stepper + hypothesis tree + matrix), GuesstimateStudio, OpenStudio
    dashboard/            Radar, ActivityMatrix, Triad
    ui/                   Md (markdown-lite + KaTeX), badges, tooltip, bar
  data/                   all content: taxonomy, datasets (DDL + seeds), problems-*, oa
  lib/
    types.ts              Problem, TestCase, Company, Category, UserProgress, DailyChallenge, OaSet …
    store.ts              zustand + localStorage: drafts, attempts, notes, activity, streak, OA results
    sql-engine.ts         PGlite: seed → run → compare result sets → EXPLAIN ANALYZE
    py-engine.ts          Pyodide worker client with a kill-on-timeout
    daily.ts              deterministic daily triad
public/py-worker.js       Python harness (stdout capture, per-test eval)
```

## Design tokens

`tailwind.config.ts` and `src/app/globals.css`. Neutral zinc scale through CSS variables (`bg`, `panel`, `inset`, `line`, `fg`, `muted`, `faint`), one accent (emerald) used only for status, streaks and success, radii capped at 6px, 13px body / 12px tables, Geist Sans + Geist Mono. Dark is the default; light is a class swap.

## Keyboard

| Keys | Action |
|---|---|
| Ctrl/Cmd + K | Command palette |
| Ctrl/Cmd + Enter | Submit (code studio), check answers (concept), grade (cases) |
| Ctrl/Cmd + ' | Run on sample data |
| Ctrl/Cmd + B | Collapse sidebar |
| ← → | Step the pipeline walkthrough; move between OA questions |
| Esc | Close palette / dialogs |

## Checks (CI runs all of these on every push and pull request)

| Script | Fails when |
|---|---|
| `tsc --noEmit` | any type error |
| `scripts/stats.mts` | duplicate ids, bad MCQ answer index, numeric item without tolerance, new item without a time benchmark, a `verified.json` entry whose item changed |
| `scripts/verify-py.mts` | any Python solution fails any test, or any starter does not compile. Runs in Pyodide under Node with the same wheels and the same harness (`public/py-harness.py`) as the browser |
| `scripts/verify-sql.mts` | any SQL solution or starter errors on any seed |

A failing check blocks the deploy; the live site keeps the last good build.

### Verified vs [UNVERIFIED]

`src/data/verified.json` maps an item id to a hash of its prompt, options, answer and tolerance. Only verification scripts write it, after computing or proving the answer. The site shows `[UNVERIFIED]` on any item whose entry is missing or whose hash no longer matches, so editing an item by hand un-verifies it until its check is re-run. Never edit `verified.json` by hand.

## Practice engine

- Topic quiz: `?mode=all|new|wrong|due`, plus `?timed=1` (per-question countdown at the item's benchmark; time-out counts as wrong).
- `/quiz/mix-due`: every missed item due today. A miss comes back 1, 3 and 7 days later; a miss on any repeat restarts the cycle (`nextRepeat` in `lib/store.ts`).
- `/quiz/mix-weak`: items from weak topics (3+ attempts under 70%, or 3+ errors in 30 days), logged errors first.
- `/revise`: repeats due, weak topics, accuracy and average time per topic, and the error log (choice, time, timeout, date).
- Sectional mocks: give an `OaSet` a `sections` array (`title`, `minutes`, `cutoffPct`, `topics`). Each section has its own clock and locks when closed; the result shows each cutoff cleared or missed.
- "Report wrong answer" opens a prefilled GitHub issue labelled `wrong-answer`. Fix the item, re-run its check, close the issue.

All of it lives in localStorage (`prep-studio/v1`); Backup on the dashboard exports it.

## Adding content

Everything is data. Append an object to the right file in `src/data/`:

- Quiz item (new content): call `Item({ id, d, prompt, options?, answer, tol?, explain, fast, trap, secs, src })` after the topic's `T(...)` in its syllabus file. `id` is permanent: never reuse or renumber it, and never delete it from a learner's point of view (retire by archiving). `secs` is the time benchmark; `fast` is the fastest method, `trap` the common wrong method and why it fails, `src` the pattern source with a date. The old `Q()`/`N()` helpers derive ids from position and are kept only for legacy content.
- Python: tests are `{ call, expected }` Python expressions. Comparison handles floats (relative 1e-6), numpy arrays and pandas objects (`assert_frame_equal`, dtype-insensitive). Add `packages: ["pandas"]` etc. for libraries (`seaborn` works too). Figures left open by the code are shown under Output, and tests can inspect them, e.g. `call: "plt.gca().get_xlabel()"`. Run `npx tsx scripts/verify-py.mts`.
- SQL: `problems-code.ts`. Give a `datasetId`, `starter`, `solution`, `ordered`, and tests (each test names a seed). Expected output is produced by running `solution` on the same seed, so there are no expected tables to maintain. Run `npx tsx scripts/verify-sql.mts`.
- Concept: pick a `lab` (or `"none"`), optional `pipeline` and `derivation`, and `checks` (MCQ or numeric with tolerance).
- RCA: `scenario`, `clarifications`, a `tree` whose leaves carry `ask`, `evidence` and a model `verdict`, and four `steps`. Top-level tree ids starting `meas`/`ext` appear in step 2, the rest in step 3.
- Guesstimate: `model` rows with numeric `factors`, an optional multiplier, and an accepted `range`.

## Sources and labelling

A problem is tagged "Reported · Company" only where a student reported that company asking it in the BITS Hyderabad Placement Chronicles (Sem 2 AY 2025-26; Eternal from AY 2026-27). Everything else is tagged "Practice". Case data inside reported questions is constructed for practice. "Your pass rate" is your own submissions in this browser; there is no global acceptance rate because there is no backend.

## Known limits

- First load of a library downloads it from this site (pandas ~23 MB, scipy ~45 MB); the browser caches it after that.
- Pyodide 0.26.4 ships matplotlib 3.5.2, pandas 2.2.0, scikit-learn 1.4.2: a few newer APIs are missing. Write solutions against these versions.
- PGlite runs on the main thread; a query that explodes (accidental cross join on large data) can freeze the tab. Seeds are small, so this does not happen with the bundled data.
- Python's Format button only normalises whitespace.
