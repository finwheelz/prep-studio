"use client";

import { useRef, useState } from "react";
import { Download, HardDrive, Upload } from "lucide-react";
import { exportProgress, useStore } from "@/lib/store";
import { dayKey } from "@/lib/utils";
import { ICON } from "@/components/ui/bits";

/** Progress lives only in localStorage, so give people a way to carry it between browsers. */
export function Backup({ firstVisit }: { firstVisit: boolean }) {
  const importProgress = useStore((s) => s.importProgress);
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportProgress()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `prep-studio-progress-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: "Backup downloaded." });
  };

  const restore = async (f: File | undefined) => {
    if (!f) return;
    if (!window.confirm("Replace the progress in this browser with the backup? This cannot be undone.")) return;
    try {
      importProgress(await f.text());
      setMsg({ ok: true, text: `Restored from ${f.name}.` });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message || "That file could not be read." });
    } finally {
      if (file.current) file.current.value = "";
    }
  };

  return (
    <section aria-labelledby="h-data" className="pane">
      <div className="pane-head">
        <HardDrive {...ICON} />
        <h2 id="h-data" className="text-fg font-medium">Your progress</h2>
        <span>saved in this browser only</span>
        <span className="ml-auto flex gap-2">
          <button className="btn" onClick={download}><Download {...ICON} /> Back up</button>
          <button className="btn" onClick={() => file.current?.click()}><Upload {...ICON} /> Restore</button>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => restore(e.target.files?.[0])} />
        </span>
      </div>
      <p className="px-3 py-2 text-xs text-muted">
        {firstVisit
          ? "No account needed: solves, streaks, notes and flashcards are stored on this device. Start with today's SQL problem above, then download a backup now and then. Clearing browser data or switching devices otherwise starts you from zero."
          : "Clearing browser data or switching devices starts you from zero. Download a backup now and then, and restore it on the other browser."}
        {msg && <span className={msg.ok ? "text-accent ml-2" : "text-danger ml-2"} role="status">{msg.text}</span>}
      </p>
    </section>
  );
}
