"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "./store";

/** True once persisted state has been read from localStorage. Gate anything user-specific on it. */
export const useHydrated = () => useStore((s) => s.hydrated);

/** Call once at the app root: reads persisted state from localStorage after mount. */
export function useBootStore() {
  useEffect(() => {
    void Promise.resolve(useStore.persist.rehydrate()).then(() => useStore.setState({ hydrated: true }));
  }, []);
}

/** Global shortcut. `combo` like "mod+k", "mod+enter", "escape", "mod+'". */
export function useHotkey(combo: string, handler: (e: KeyboardEvent) => void, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const parts = combo.toLowerCase().split("+");
    const key = parts[parts.length - 1];
    const needMod = parts.includes("mod");
    const needShift = parts.includes("shift");
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (needMod !== mod || needShift !== e.shiftKey) return;
      if (e.key.toLowerCase() !== key) return;
      ref.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [combo, enabled]);
}

/** Count-up stopwatch in seconds. */
export function useStopwatch(running = true) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  return { sec, reset: () => setSec(0) };
}

export function useIsMac() {
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);
  return mac;
}
