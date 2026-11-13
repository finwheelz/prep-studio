# Prep Studio

Placement preparation workspace for data, ML and product roles. Local-first: no backend, no accounts, no AI calls. SQL runs on real PostgreSQL in the browser (PGlite, WASM); Python runs on Pyodide in a Web Worker.

## Run

```bash
npm install        # postinstall copies the Python runtime into public/pyodide
npm run dev        # http://localhost:3000
npm run build && npm start
npx tsx scripts/verify-sql.mts   # runs every SQL reference solution against every seed
```

Node 18.17+. TypeScript is pinned to 5.6: Next 14 does not resolve the `@/` alias under TypeScript 7.

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

## Adding content

Everything is data. Append an object to the right file in `src/data/`:

- SQL: `problems-code.ts`. Give a `datasetId`, `starter`, `solution`, `ordered`, and tests (each test names a seed). Expected output is produced by running `solution` on the same seed, so there are no expected tables to maintain. Run `npx tsx scripts/verify-sql.mts`.
- Python: tests are `{ call, expected }` Python expressions compared with `==`.
- Concept: pick a `lab` (or `"none"`), optional `pipeline` and `derivation`, and `checks` (MCQ or numeric with tolerance).
- RCA: `scenario`, `clarifications`, a `tree` whose leaves carry `ask`, `evidence` and a model `verdict`, and four `steps`. Top-level tree ids starting `meas`/`ext` appear in step 2, the rest in step 3.
- Guesstimate: `model` rows with numeric `factors`, an optional multiplier, and an accepted `range`.

## Sources and labelling

A problem is tagged "Reported · Company" only where a student reported that company asking it in the BITS Hyderabad Placement Chronicles (Sem 2 AY 2025-26; Eternal from AY 2026-27). Everything else is tagged "Practice". Case data inside reported questions is constructed for practice. "Your pass rate" is your own submissions in this browser; there is no global acceptance rate because there is no backend.

## Known limits

- pandas problems boot Pyodide from the jsDelivr CDN on first run (the wheels are not in the npm package), so they need network access.
- PGlite runs on the main thread; a query that explodes (accidental cross join on large data) can freeze the tab. Seeds are small, so this does not happen with the bundled data.
- Python's Format button only normalises whitespace.
