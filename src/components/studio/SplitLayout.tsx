"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

/** Problem on the left, workspace on the right. Stacks vertically on narrow screens. Sizes persist per id. */
export function SplitLayout({ id, left, right, defaultLeft = 40 }: { id: string; left: ReactNode; right: ReactNode; defaultLeft?: number }) {
  const narrow = useNarrow();
  return (
    <PanelGroup direction={narrow ? "vertical" : "horizontal"} autoSaveId={`split:${id}:${narrow ? "v" : "h"}`} className="h-full">
      <Panel defaultSize={defaultLeft} minSize={narrow ? 15 : 24} className="min-w-0">
        {left}
      </Panel>
      <PanelResizeHandle className={narrow ? "rz-v" : "rz-h"} />
      <Panel minSize={30} className="min-w-0">
        {right}
      </Panel>
    </PanelGroup>
  );
}
