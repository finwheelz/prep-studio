import type { QuizItem } from "./types";
import manifest from "@/data/verified.json";

/**
 * Verification manifest. Only verification scripts write src/data/verified.json: one entry per item
 * whose answer a script computed or proved, keyed by id, holding a hash of what was verified.
 * Editing an item's prompt, options, answer or tolerance changes the hash, so the item shows as
 * [UNVERIFIED] until the check is re-run. CI fails if a committed entry no longer verifies.
 */
export function itemHash(q: Pick<QuizItem, "prompt" | "options" | "answer" | "tol">): string {
  const s = JSON.stringify([q.prompt, q.options ?? null, q.answer, q.tol ?? null]);
  let h = 0x811c9dc5; // FNV-1a, 32-bit
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

const M = manifest as Record<string, string>;
export const isVerified = (q: QuizItem) => M[q.id] === itemHash(q);
