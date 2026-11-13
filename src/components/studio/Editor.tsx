"use client";

import CodeMirror from "@uiw/react-codemirror";
import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { python } from "@codemirror/lang-python";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { useMemo } from "react";
import type { Language } from "@/lib/types";

const v = (name: string) => `rgb(var(--${name}))`;

// Colours come from CSS variables, so one theme object serves light and dark.
const theme = createTheme({
  theme: "dark",
  settings: {
    background: v("panel"),
    foreground: v("fg"),
    caret: v("fg"),
    selection: "rgb(var(--accent) / 0.22)",
    selectionMatch: "rgb(var(--accent) / 0.12)",
    lineHighlight: "rgb(var(--inset) / 0.7)",
    gutterBackground: v("panel"),
    gutterForeground: v("faint"),
    gutterBorder: "transparent",
  },
  styles: [
    { tag: [t.keyword, t.operatorKeyword, t.definitionKeyword, t.controlKeyword, t.moduleKeyword], color: v("syn-kw") },
    { tag: [t.string, t.special(t.string)], color: v("syn-str") },
    { tag: [t.number, t.bool, t.null], color: v("syn-num") },
    { tag: [t.comment, t.lineComment, t.blockComment], color: v("syn-com"), fontStyle: "italic" },
    { tag: [t.function(t.variableName), t.standard(t.name)], color: v("syn-fn") },
    { tag: [t.typeName, t.className], color: v("syn-num") },
    { tag: t.operator, color: v("muted") },
    { tag: t.punctuation, color: v("muted") },
  ],
});

export interface EditorProps {
  language: Language;
  value: string;
  onChange: (v: string) => void;
  /** Table → column names, for SQL autocomplete. */
  schema?: Record<string, string[]>;
  onRun?: () => void;
  onSubmit?: () => void;
  readOnly?: boolean;
}

export default function Editor({ language, value, onChange, schema, onRun, onSubmit, readOnly }: EditorProps) {
  const extensions = useMemo(() => {
    const lang = language === "sql" ? sql({ dialect: PostgreSQL, schema, upperCaseKeywords: true }) : python();
    // Highest precedence so Mod-Enter submits instead of inserting a blank line.
    const keys = Prec.highest(
      keymap.of([
        { key: "Mod-Enter", preventDefault: true, run: () => (onSubmit?.(), true) },
        { key: "Mod-'", preventDefault: true, run: () => (onRun?.(), true) },
      ]),
    );
    return [lang, keys, EditorView.lineWrapping];
  }, [language, schema, onRun, onSubmit]);

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={theme}
      extensions={extensions}
      readOnly={readOnly}
      height="100%"
      basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true, autocompletion: true, tabSize: language === "python" ? 4 : 2 }}
      aria-label={`${language} editor`}
    />
  );
}
