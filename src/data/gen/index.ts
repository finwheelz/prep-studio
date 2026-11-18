import type { QuizItem } from "@/lib/types";
import { ARR_SETS, verifyArrangementSet } from "./arrangements";

/**
 * Generator verifiers, keyed by the name used in an item's `check: { gen }`.
 * Each returns whether the stored item is proven correct by an independent solve.
 */
export const GEN_VERIFIERS: Record<string, (q: QuizItem) => { ok: boolean; why?: string }> = {
  arrangements: (q) => {
    const set = ARR_SETS.find((s) => s.questions.some((x) => `p2-arr-${x.id}` === q.id));
    if (!set) return { ok: false, why: "no generated set for this id" };
    const g = set.questions.find((x) => `p2-arr-${x.id}` === q.id)!;
    if (g.answer !== q.answer || JSON.stringify(g.options) !== JSON.stringify(q.options)) return { ok: false, why: "item differs from generator output" };
    return verifyArrangementSet(set);
  },
};
