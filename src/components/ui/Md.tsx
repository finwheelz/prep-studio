"use client";

import katex from "katex";
import { Fragment, memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MiniChart } from "./MiniChart";

/** KaTeX block or inline. Rendering is synchronous and cheap at this scale. */
export const Tex = memo(function Tex({ tex, block = false, className }: { tex: string; block?: boolean; className?: string }) {
  const html = katex.renderToString(tex, { displayMode: block, throwOnError: false, strict: "ignore" });
  const Tag = block ? "div" : "span";
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});

/** Inline: `code`, **bold**, $math$. */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\$[^$\n]+\$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith("`")) out.push(<code key={k}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("**")) out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else out.push(<Tex key={k} tex={tok.slice(1, -1)} />);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Markdown-lite for problem statements: paragraphs, - lists, 1. lists, ``` fences,
 * $$display math$$ on its own line, and the inline forms above. No HTML passthrough.
 */
export const Md = memo(function Md({ source, className }: { source: string; className?: string }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      blocks.push(
        lang === "chart" ? (
          <MiniChart key={k++} source={buf.join("\n")} />
        ) : (
          <pre key={k++}>
            <code>{buf.join("\n")}</code>
          </pre>
        ),
      );
      continue;
    }
    if (/^\$\$.*\$\$$/.test(line.trim())) {
      blocks.push(<Tex key={k++} block tex={line.trim().slice(2, -2)} />);
      i++;
      continue;
    }
    if (/^- /.test(line) || /^\d+\. /.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const start = ordered ? /^\d+\. / : /^- /;
      // Items may carry indented "- " sub-bullets on the following lines.
      const items: { text: string; sub: string[] }[] = [];
      while (i < lines.length && (start.test(lines[i]) || (items.length > 0 && /^\s+- /.test(lines[i])))) {
        if (start.test(lines[i])) items.push({ text: lines[i].replace(start, ""), sub: [] });
        else items[items.length - 1].sub.push(lines[i].replace(/^\s+- /, ""));
        i++;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={k++}>
          {items.map((it, j) => (
            <li key={j}>
              {inline(it.text, `l${k}-${j}`)}
              {it.sub.length > 0 && (
                <ul className="!mb-0 mt-1">
                  {it.sub.map((sb, m) => (
                    <li key={m}>{inline(sb, `l${k}-${j}-${m}`)}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </List>,
      );
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|- |\d+\. )/.test(lines[i])) buf.push(lines[i++]);
    blocks.push(
      <p key={k++}>
        {buf.map((b, j) => (
          <Fragment key={j}>
            {j > 0 && " "}
            {inline(b, `p${k}-${j}`)}
          </Fragment>
        ))}
      </p>,
    );
  }
  return <div className={cn("prose-dense", className)}>{blocks}</div>;
});
