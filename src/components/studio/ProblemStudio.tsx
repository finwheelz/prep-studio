"use client";

import * as Tabs from "@radix-ui/react-tabs";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { AlignLeft, Check, Loader2, Play, RotateCcw, Send, Timer, X } from "lucide-react";
import type { CodeProblem, ResultSet, RunOutput, TestResult } from "@/lib/types";
import { datasetById } from "@/data/datasets";
import { useStore } from "@/lib/store";
import { useHotkey, useHydrated, useIsMac, useStopwatch } from "@/lib/hooks";
import { runSql, testSql, warmSql } from "@/lib/sql-engine";
import { runPython, testPython } from "@/lib/py-engine";
import { cn, fmtClock } from "@/lib/utils";
import { Empty, ICON, Kbd, Tip } from "@/components/ui/bits";
import { ProblemPanel, SchemaViewer } from "./ProblemPanel";
import { ResultTable } from "./ResultTable";
import { SplitLayout } from "./SplitLayout";

const Editor = dynamic(() => import("./Editor"), { ssr: false, loading: () => <div className="h-full bg-panel" /> });

const LANG_LABEL = { sql: "SQL · PostgreSQL", python: "Python 3.12" } as const;

async function formatCode(lang: "sql" | "python", code: string): Promise<string> {
  if (lang === "sql") {
    const { format } = await import("sql-formatter");
    return format(code, { language: "postgresql", keywordCase: "upper", tabWidth: 2 });
  }
  // No Python formatter ships in the browser bundle: normalise whitespace only.
  return code.replace(/\t/g, "    ").replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** Cell-level diff for the Expected vs Actual viewer. */
function diffFn(a: ResultSet, b: ResultSet) {
  return (r: number, c: number) => {
    const x = a.rows[r]?.[c];
    const y = b.rows[r]?.[c];
    if (b.rows[r] === undefined) return true;
    if (x === null || y === null) return x !== y;
    const nx = Number(x);
    const ny = Number(y);
    if (Number.isFinite(nx) && Number.isFinite(ny) && String(x).trim() !== "" && String(y).trim() !== "") return Math.abs(nx - ny) > 1e-9;
    return String(x) !== String(y);
  };
}

function TestCases({ results, running, ordered }: { results: TestResult[] | null; running: boolean; ordered: boolean }) {
  const [sel, setSel] = useState(0);
  useEffect(() => {
    if (results) setSel(Math.max(0, results.findIndex((r) => !r.pass)));
  }, [results]);
  if (running) return <Empty title="Running tests…" />;
  if (!results) return <Empty title="No submission yet" hint="Submit to run your code against the sample and the hidden cases." />;
  const r = results[sel] ?? results[0];
  const passed = results.filter((x) => x.pass).length;
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1.5 px-3 h-9 border-b border-line shrink-0 overflow-x-auto">
        <span className={cn("text-xs font-medium mr-2 whitespace-nowrap", passed === results.length ? "text-accent" : "text-danger")}>
          {passed === results.length ? "Accepted" : "Wrong answer"} <span className="num text-muted font-normal">{passed}/{results.length}</span>
        </span>
        {results.map((x, i) => (
          <button
            key={x.id}
            onClick={() => setSel(i)}
            className={cn("inline-flex items-center gap-1 h-6 px-2 rounded text-xs border whitespace-nowrap", i === sel ? "border-line-strong bg-inset text-fg" : "border-transparent text-muted hover:text-fg")}
          >
            {x.pass ? <Check {...ICON} size={12} className="text-accent" /> : <X {...ICON} size={12} className="text-danger" />}
            {x.name}
            <span className="num text-faint">{x.ms.toFixed(0)}ms</span>
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {r.error && (
          <pre className={cn("m-3 p-2.5 rounded border text-xs font-mono whitespace-pre-wrap", r.pass ? "border-line text-muted" : "border-danger/40 bg-danger/10 text-danger")}>{r.error}</pre>
        )}
        {r.hidden ? (
          <div className="px-3 py-2 text-xs text-muted">
            Hidden case: the data is not shown. {r.pass ? "Passed." : "Think about ties, duplicates, empty inputs and boundaries."}
          </div>
        ) : typeof r.expected === "object" && typeof r.actual === "object" ? (
          <div className="grid grid-cols-2 divide-x divide-line h-[calc(100%-1px)] min-h-32">
            <div className="min-w-0 flex flex-col">
              <div className="label px-3 py-1.5 border-b border-line">Expected{!ordered && " (any row order)"}</div>
              <div className="flex-1 min-h-0">
                <ResultTable data={r.expected} />
              </div>
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="label px-3 py-1.5 border-b border-line">Your output</div>
              <div className="flex-1 min-h-0">
                <ResultTable data={r.actual} diff={ordered && !r.pass ? diffFn(r.actual, r.expected) : undefined} />
              </div>
            </div>
          </div>
        ) : r.expected !== undefined || r.actual !== undefined ? (
          <div className="grid grid-cols-[88px_1fr] text-xs m-3 pane">
            <div className="px-2.5 py-1.5 text-muted border-b border-r border-line bg-inset">Expected</div>
            <pre className="px-2.5 py-1.5 font-mono border-b border-line whitespace-pre-wrap break-all">{String(r.expected ?? "")}</pre>
            <div className="px-2.5 py-1.5 text-muted border-r border-line bg-inset">Your output</div>
            <pre className={cn("px-2.5 py-1.5 font-mono whitespace-pre-wrap break-all", !r.pass && "text-danger")}>{String(r.actual ?? "")}</pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ProblemStudio({ problem, onSolved }: { problem: CodeProblem; onSolved?: () => void }) {
  const hydrated = useHydrated();
  const mac = useIsMac();
  const draft = useStore((s) => s.drafts[problem.id]);
  const setDraft = useStore((s) => s.setDraft);
  const clearDraft = useStore((s) => s.clearDraft);
  const recordSubmit = useStore((s) => s.recordSubmit);

  const [code, setCode] = useState(problem.starter);
  const [tab, setTab] = useState("tests");
  const [busy, setBusy] = useState<null | "run" | "submit">(null);
  const [output, setOutput] = useState<RunOutput | null>(null);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [solvedNow, setSolvedNow] = useState(false);
  const { sec, reset: resetClock } = useStopwatch(!solvedNow);
  const codeRef = useRef(code);
  codeRef.current = code;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  // Load the saved draft once persisted state is available.
  const loaded = useRef(false);
  useEffect(() => {
    if (hydrated && !loaded.current) {
      loaded.current = true;
      if (draft != null) setCode(draft);
    }
  }, [hydrated, draft]);
  useEffect(() => {
    if (problem.kind === "sql") warmSql();
  }, [problem.kind]);

  // Debounced autosave.
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      if (code !== problem.starter || draft != null) setDraft(problem.id, code);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const schema = useMemo(() => {
    if (problem.kind !== "sql") return undefined;
    return Object.fromEntries(datasetById(problem.datasetId).tables.map((t) => [t.name, t.columns.map((c) => c.name)]));
  }, [problem]);

  const run = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = "run"; // set synchronously: the editor keymap and the window hotkey can both fire
    setBusy("run");
    setTab("output");
    const out = problem.kind === "sql" ? await runSql(problem.datasetId, codeRef.current) : await runPython(problem, codeRef.current);
    setOutput(out);
    setBusy(null);
  }, [problem]);

  const submit = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = "submit";
    setBusy("submit");
    setTab("tests");
    const res = problem.kind === "sql" ? await testSql(problem, codeRef.current) : await testPython(problem, codeRef.current);
    setResults(res);
    const passed = res.length > 0 && res.every((r) => r.pass);
    recordSubmit(problem.id, passed, sec);
    if (passed) {
      setSolvedNow(true); // stop the clock on the first accepted submission
      onSolved?.();
    }
    setBusy(null);
  }, [problem, recordSubmit, sec, onSolved]);

  // Shortcuts also work when focus is outside the editor.
  const inEditor = (e: KeyboardEvent) => !!(e.target as HTMLElement | null)?.closest?.(".cm-editor");
  useHotkey("mod+enter", (e) => {
    if (inEditor(e)) return; // the editor's own keymap handles it
    e.preventDefault();
    submit();
  });
  useHotkey("mod+'", (e) => {
    if (inEditor(e)) return;
    e.preventDefault();
    run();
  });

  const reset = () => {
    setCode(problem.starter);
    clearDraft(problem.id);
    setOutput(null);
    setResults(null);
    setSolvedNow(false);
    resetClock();
  };

  const over = sec > problem.targetMin * 60;
  const modKey = mac ? "⌘" : "Ctrl";

  const left = (
    <ProblemPanel
      problem={problem}
      extraTabs={
        problem.kind === "sql"
          ? [{ id: "schema", label: "Schema", content: <SchemaViewer dataset={datasetById(problem.datasetId)} /> }]
          : problem.setup
            ? [{ id: "schema", label: "Fixtures", content: <pre className="font-mono text-xs bg-inset border border-line rounded p-3 overflow-x-auto">{problem.setup}</pre> }]
            : []
      }
      solution={
        <div>
          <div className="label mb-1.5">Reference solution</div>
          <pre className="font-mono text-xs bg-inset border border-line rounded p-3 overflow-x-auto leading-5">{problem.solution}</pre>
        </div>
      }
    />
  );

  const right = (
    <div className="h-full flex flex-col bg-panel">
      {/* Toolbar */}
      <div className="h-10 shrink-0 flex items-center gap-1.5 px-2 border-b border-line overflow-x-auto">
        <span className="inline-flex items-center h-6 px-2 rounded border border-line bg-inset text-xs font-mono text-fg whitespace-nowrap max-[420px]:hidden">{LANG_LABEL[problem.kind]}</span>
        <Tip label={`Target ${problem.targetMin} min`}>
          <span className={cn("inline-flex items-center gap-1.5 h-6 px-2 text-xs num", over ? "text-warn" : "text-muted")} aria-live="off">
            <Timer {...ICON} size={13} />
            {fmtClock(sec)}
          </span>
        </Tip>
        <div className="ml-auto flex items-center gap-1.5">
          <Tip label="Reset to starter code">
            <button className="btn-ghost w-7 px-0" onClick={reset} aria-label="Reset code">
              <RotateCcw {...ICON} />
            </button>
          </Tip>
          <Tip label="Format code">
            <button
              className="btn-ghost w-7 px-0"
              aria-label="Format code"
              onClick={async () => {
                try {
                  setCode(await formatCode(problem.kind, codeRef.current));
                } catch {
                  /* leave unparseable code untouched */
                }
              }}
            >
              <AlignLeft {...ICON} />
            </button>
          </Tip>
          <Tip label={<span className="flex items-center gap-1.5">Run on sample data <Kbd>{modKey}</Kbd><Kbd>&apos;</Kbd></span>}>
            <button className="btn" onClick={run} disabled={!!busy}>
              {busy === "run" ? <Loader2 {...ICON} className="animate-spin" /> : <Play {...ICON} />}
              Run
            </button>
          </Tip>
          <Tip label={<span className="flex items-center gap-1.5">Run all tests <Kbd>{modKey}</Kbd><Kbd>↵</Kbd></span>}>
            <button className="btn-accent" onClick={submit} disabled={!!busy}>
              {busy === "submit" ? <Loader2 {...ICON} className="animate-spin" /> : <Send {...ICON} />}
              Submit
            </button>
          </Tip>
        </div>
      </div>

      <PanelGroup direction="vertical" autoSaveId="studio:right" className="flex-1 min-h-0">
        <Panel defaultSize={58} minSize={20}>
          <Editor language={problem.kind} value={code} onChange={setCode} schema={schema} onRun={run} onSubmit={submit} />
        </Panel>
        <PanelResizeHandle className="rz-v" />
        <Panel defaultSize={42} minSize={12}>
          <Tabs.Root value={tab} onValueChange={setTab} className="h-full flex flex-col">
            <Tabs.List className="flex border-b border-line px-1 shrink-0" aria-label="Results">
              <Tabs.Trigger value="tests" className="tab">
                Test cases
                {results && <span className={cn("ml-1.5 num", results.every((r) => r.pass) ? "text-accent" : "text-danger")}>{results.filter((r) => r.pass).length}/{results.length}</span>}
              </Tabs.Trigger>
              <Tabs.Trigger value="output" className="tab">
                Output
                {output?.result && <span className="ml-1.5 num text-faint">{output.result.rows.length} rows</span>}
              </Tabs.Trigger>
              <Tabs.Trigger value="plan" className="tab">{problem.kind === "sql" ? "Query plan" : "Timing"}</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="tests" className="flex-1 min-h-0 outline-none">
              <TestCases results={results} running={busy === "submit"} ordered={problem.kind === "sql" ? problem.ordered : true} />
            </Tabs.Content>
            <Tabs.Content value="output" className="flex-1 min-h-0 outline-none">
              {busy === "run" ? (
                <Empty title={problem.kind === "python" ? "Running… (the first run loads the Python runtime)" : "Running…"} />
              ) : !output ? (
                <Empty title="Nothing run yet" hint={`Run executes your code on the sample data. ${modKey} + ' from anywhere.`} />
              ) : output.error ? (
                <div className="p-3 overflow-auto h-full">
                  <pre className="p-2.5 rounded border border-danger/40 bg-danger/10 text-danger text-xs font-mono whitespace-pre-wrap">{output.error}</pre>
                  {output.stdout && <pre className="mt-2 text-xs font-mono whitespace-pre-wrap text-muted">{output.stdout}</pre>}
                </div>
              ) : output.result ? (
                <ResultTable data={output.result} />
              ) : (
                <pre className="p-3 text-xs font-mono whitespace-pre-wrap overflow-auto h-full">{output.stdout || "(no output)"}</pre>
              )}
            </Tabs.Content>
            <Tabs.Content value="plan" className="flex-1 min-h-0 outline-none overflow-auto">
              {problem.kind === "sql" ? (
                output?.plan ? (
                  <div className="p-3">
                    <div className="flex gap-4 text-xs text-muted mb-2">
                      <span>Elapsed <span className="num text-fg">{output.ms.toFixed(1)} ms</span></span>
                      <span>Rows <span className="num text-fg">{output.result?.rows.length ?? 0}</span></span>
                      <span className="text-faint">EXPLAIN ANALYZE on the sample data</span>
                    </div>
                    <pre className="text-xs font-mono leading-5 whitespace-pre overflow-x-auto bg-inset border border-line rounded p-3">{output.plan}</pre>
                    <p className="text-xs text-faint mt-2">Read it bottom-up. On tables this small every scan is sequential; what transfers to an interview is the shape: how many sorts, which joins, and whether a window forces a re-sort.</p>
                  </div>
                ) : (
                  <Empty title="No plan yet" hint="Run a single SELECT (or WITH … SELECT) to see its execution plan and timing." />
                )
              ) : results || output ? (
                <div className="p-3 text-xs">
                  {output && <div className="text-muted mb-2">Last run <span className="num text-fg">{output.ms.toFixed(0)} ms</span> (includes runtime start-up on the first run)</div>}
                  {results && (
                    <table className="dt pane">
                      <thead>
                        <tr><th>Test</th><th className="text-right">Time</th><th>Result</th></tr>
                      </thead>
                      <tbody>
                        {results.map((r) => (
                          <tr key={r.id}>
                            <td>{r.name}</td>
                            <td className="num text-right">{r.ms.toFixed(2)} ms</td>
                            <td className={r.pass ? "text-accent" : "text-danger"}>{r.pass ? "pass" : "fail"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <p className="text-faint mt-2">State the time and space complexity aloud before you submit; interviewers ask for it.</p>
                </div>
              ) : (
                <Empty title="No timings yet" hint="Submit to see per-test run time." />
              )}
            </Tabs.Content>
          </Tabs.Root>
        </Panel>
      </PanelGroup>
    </div>
  );

  return <SplitLayout id="code" left={left} right={right} />;
}
