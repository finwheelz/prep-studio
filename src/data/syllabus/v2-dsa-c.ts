/**
 * v2 DSA, part C: Binary search · Linked lists. Fixed ids; every answer is recomputed in Pyodide.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";
import { D } from "./v2-dsa-src";

const s = (label: string, url: string) => ({ label, url, checked: CHECKED });
/** Sources for this file; every URL opened and checked on 2026-11-25. */
const S = {
  cpBs: s("CP-algorithms: Binary search (lower bound, search on a predicate)", "https://cp-algorithms.com/num_methods/binary_search.html"),
  cycle: s("Wikipedia: Cycle detection (Floyd's tortoise and hare)", "https://en.wikipedia.org/wiki/Cycle_detection"),
};

const { L, Q, C } = lessonWriter("dsa");
const BS = "Binary search";
const LL = "Linked lists";

// ───────────────────────── Binary search ─────────────────────────

L("dsa2-binary-search", BS, "Binary search and the bisect module", "Halving a sorted range in O(log n), the lower-bound form that avoids off-by-one bugs, and Python's bisect_left and bisect_right.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-sorting"],
  hook: "Find the first position of 7 in a sorted list of a million numbers in about 20 comparisons. Then: where do 7s end?",
  intuition: `
**The situation.** Sorted data plus "find", "first/last position", "how many are ≤ x", "where would x be inserted". A linear scan is $O(n)$; you can do it in $O(\\log n)$.

**The idea.** Compare with the middle and throw away the half that can't contain the answer. After $k$ steps the range is $n / 2^k$, so about $\\log_2 n$ steps: 20 for a million.

**Think in boundaries, not "found it".** Most bugs come from loop conditions and \`mid ± 1\`. One safe form: find the **first index where a condition becomes true** (the lower bound). The condition must be false…false, true…true across the array.

- \`bisect_left(a, x)\`: first index with \`a[i] >= x\`.
- \`bisect_right(a, x)\`: first index with \`a[i] > x\`.
- Count of x = \`bisect_right − bisect_left\`.
`,
  maths: `
**In one breath.** \`lo, hi = 0, n\`; while \`lo < hi\`: \`mid = (lo + hi) // 2\`; if \`ok(mid)\`: \`hi = mid\` else \`lo = mid + 1\`; return \`lo\` (first true, or \`n\` if none); $O(\\log n)$.

**Template: first index where \`ok\` is true.**

\`\`\`python
def first_true(lo, hi, ok):          # search in [lo, hi); returns hi if none
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid):
            hi = mid                 # mid might be the answer: keep it
        else:
            lo = mid + 1             # mid is not: discard it
    return lo

a = [1, 3, 3, 3, 7, 9]
first_true(0, len(a), lambda i: a[i] >= 3)   # 1  (same as bisect_left(a, 3))
first_true(0, len(a), lambda i: a[i] > 3)    # 4  (same as bisect_right(a, 3))
\`\`\`

The range shrinks every step (\`hi = mid < hi\` or \`lo = mid + 1 > lo\`), so it always terminates.

**Worked problem 1: first and last position of a target.**

\`\`\`python
from bisect import bisect_left, bisect_right
def first_last(a, x):
    i = bisect_left(a, x)
    if i == len(a) or a[i] != x:
        return [-1, -1]              # not present
    return [i, bisect_right(a, x) - 1]
first_last([5, 7, 7, 8, 8, 10], 8)   # [3, 4]
\`\`\`

**Worked problem 2: count values in a range [lo, hi].** \`bisect_right(a, hi) − bisect_left(a, lo)\`. For \`a = [1, 2, 4, 4, 5, 8, 9]\` and range [3, 8]: 6 − 2 = 4.

**Worked problem 3: insert while keeping order.** \`bisect.insort(a, x)\` finds the spot in $O(\\log n)$ but inserting shifts elements, $O(n)$. Fine for small lists; for many inserts use a heap or a balanced structure.

**Python 3.10+** accepts \`key=\` in bisect functions; the key is applied to list elements, not to \`x\`.

**Edge cases.** Empty list (returns 0); target smaller than all (0) or larger than all (n); duplicates (left vs right); always check \`i < len(a)\` before reading \`a[i]\`.
`,
  practice: `
**Signals:** "sorted", "find first/last", "how many ≤ x", "insert position", "closest value", $O(\\log n)$ required, "timestamps in order".

**Variations.** Closest element (check \`i\` and \`i − 1\` after bisect_left), Time-Based Key-Value Store (bisect_right on timestamps − 1), Search a 2-D Matrix (treat as a flat sorted array of length $m\\cdot n$, row = \`mid // n\`).

**Practise:** Binary Search, Search Insert Position, Find First and Last Position of Element in Sorted Array, Search a 2D Matrix, Time Based Key-Value Store, Find K Closest Elements, Count Negative Numbers in a Sorted Matrix.
`,
  traps: [
    { trap: "while lo <= hi with hi = mid.", why: "With lo = hi = mid the loop never shrinks: infinite loop. Pair 'lo < hi' with 'hi = mid', or 'lo <= hi' with 'hi = mid − 1'; don't mix forms." },
    { trap: "bisect_left(a, x) returns −1 if x is missing.", why: "It returns an insertion point. Check i < len(a) and a[i] == x before treating it as found." },
    { trap: "insort keeps inserts O(log n).", why: "Finding the position is O(log n); shifting elements to insert is O(n)." },
  ],
  say: {
    prompt: "Find the first and last positions of a target in a sorted array with duplicates, in O(log n).",
    secs: 45,
    check: ["Two boundary searches: first ≥ x and first > x", "bisect_left / bisect_right or a hand-written lower bound", "Check presence: i < n and a[i] == x", "Last = bisect_right − 1", "O(log n) time, O(1) space"],
    followups: [
      { q: "How do you count occurrences of x?", a: "bisect_right(a, x) − bisect_left(a, x); 0 if absent. Two O(log n) searches." },
      { q: "Why does mid = (lo + hi) // 2 with hi = mid always terminate?", a: "With lo < hi, mid < hi, so hi = mid strictly shrinks the range; lo = mid + 1 strictly grows lo. The range length decreases every step." },
      { q: "How would you find the element closest to x?", a: "i = bisect_left(a, x); compare a[i] (if i < n) and a[i − 1] (if i > 0) and take the nearer, breaking ties as the problem says." },
    ],
    answer: `I treat it as two boundary searches. The first position is the first index where a[i] ≥ x, which is bisect_left. If that index is past the end or a[i] isn't x, the target is absent and I return −1, −1. The last position is one before the first index where a[i] > x, which is bisect_right minus one.

Each search halves the range: if the condition holds at mid I keep mid as a candidate with hi = mid, otherwise lo = mid + 1, and the loop ends when lo equals hi. That's O(log n) time and O(1) space. Thinking in 'first index where a condition is true' avoids most off-by-one errors.`,
    avoid: ["Finding one match then scanning outwards (O(n) with many duplicates)", "Mixing loop conditions and updates"],
  },
  terms: [["Lower bound", "First index with a[i] ≥ x (bisect_left)."], ["Upper bound", "First index with a[i] > x (bisect_right)."], ["Monotonic predicate", "False…false, true…true across the search range."]],
  sources: [D.bisect, D.bsearch, S.cpBs],
});
Q({ id: "dsa2-bs-1", d: 1, secs: 30, prompt: "a = [1, 3, 3, 3, 7, 9]. What does bisect_right(a, 3) return?", answer: 4, tol: 0.5, explain: "First index with a value > 3.", py: "from bisect import bisect_right\nanswer = bisect_right([1,3,3,3,7,9], 3)" });
Q({ id: "dsa2-bs-2", d: 1, secs: 45, prompt: "How many values of [1, 2, 4, 4, 5, 8, 9] lie in [3, 8] inclusive? (Use bisect.)", answer: 4, tol: 0.5, explain: "bisect_right(a, 8) − bisect_left(a, 3) = 6 − 2.", py: "from bisect import bisect_left, bisect_right\na = [1,2,4,4,5,8,9]\nanswer = bisect_right(a, 8) - bisect_left(a, 3)" });
Q({ id: "dsa2-bs-3", d: 1, secs: 30, prompt: "At most how many iterations does lower-bound binary search need on 1,000,000 elements?", answer: 20, tol: 0.5, explain: "⌈log₂ 10⁶⌉ = 20.", py: "import math\nanswer = math.ceil(math.log2(10**6))" });
Q({ id: "dsa2-bs-4", d: 2, secs: 45, prompt: "First and last position of 8 in [5, 7, 7, 8, 8, 10]. Give first + last.", answer: 7, tol: 0.5, explain: "[3, 4].", py: "from bisect import bisect_left, bisect_right\na = [5,7,7,8,8,10]\nanswer = bisect_left(a, 8) + bisect_right(a, 8) - 1" });
Q({ id: "dsa2-bs-5", d: 2, secs: 45, prompt: "Which loop pairing is guaranteed to terminate?", options: ["while lo <= hi with hi = mid", "while lo < hi with hi = mid and lo = mid + 1", "while lo < hi with lo = mid", "while lo <= hi with lo = mid"], answer: 1, explain: "Both updates strictly shrink [lo, hi) when lo < hi.", py: "a = [1,3,5,7]\ndef run(x):\n    lo, hi, steps = 0, len(a), 0\n    while lo < hi and steps < 100:\n        mid = (lo+hi)//2; steps += 1\n        if a[mid] >= x: hi = mid\n        else: lo = mid+1\n    return steps < 100\nanswer = 1 if all(run(x) for x in range(9)) else 0" });
C("dsa2-bs-c1", "Lower-bound loop", "while lo < hi: mid = (lo+hi)//2; ok(mid) → hi = mid else lo = mid + 1.");
C("dsa2-bs-c2", "bisect", "left: first ≥ x; right: first > x; count = right − left.");

L("dsa2-bsearch-modified", BS, "Binary search on rotated and unsorted-looking arrays", "Using a monotonic test on the index, not the values themselves: rotated arrays, the rotation point, peaks and flattened matrices.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-binary-search"],
  hook: "A sorted array was rotated: [4, 5, 6, 7, 0, 1, 2]. It isn't sorted any more, yet you can still find 0 in O(log n). What stays sorted?",
  intuition: `
**The situation.** Binary search isn't only for fully sorted arrays. It needs a test on \`mid\` that tells you which half to keep.

**The idea.** Find a property that is false on one side and true on the other.

- **Rotation point (minimum):** compare \`a[mid]\` with \`a[-1]\`. Elements ≤ the last element are in the right, lower part. "a[i] ≤ a[−1]" is false…false, true…true: lower bound finds the minimum.
- **Search in a rotated array:** at least one half \`[lo, mid]\` or \`[mid, hi]\` is sorted. Check whether the target lies in the sorted half's range; if so, go there, otherwise go to the other half.
- **Peak element:** if \`a[mid] < a[mid + 1]\` the slope goes up, so a peak exists to the right. "a[i] > a[i + 1]" is monotonic enough to binary search.
`,
  maths: `
**In one breath.** Find a test on mid with a single switch from false to true; then the usual \`lo < hi\`, \`hi = mid\` / \`lo = mid + 1\` loop; $O(\\log n)$.

**Template: minimum of a rotated sorted array (distinct values).**

\`\`\`python
def rotated_min(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] > a[hi]:
            lo = mid + 1             # min is strictly right of mid
        else:
            hi = mid                 # mid could be the min
    return a[lo]
rotated_min([4, 5, 6, 7, 0, 1, 2])   # 0
\`\`\`

**Worked problem 1: search a rotated sorted array.**

\`\`\`python
def rotated_search(a, t):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == t:
            return mid
        if a[lo] <= a[mid]:                  # left half sorted
            if a[lo] <= t < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                                # right half sorted
            if a[mid] < t <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
rotated_search([4, 5, 6, 7, 0, 1, 2], 0)     # 4
\`\`\`

Here the classic \`lo <= hi\` / \`mid ± 1\` form is used because we return on equality.

**Worked problem 2: any peak index.**

\`\`\`python
def peak(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < a[mid + 1]:
            lo = mid + 1             # uphill to the right
        else:
            hi = mid
    return lo
peak([1, 2, 1, 3, 5, 6, 4])          # 5 (value 6); index 1 is also a valid peak
\`\`\`

**Worked problem 3: sorted matrix as a flat array.** For an $m \\times n$ matrix whose rows continue each other, index $k$ maps to \`(k // n, k % n)\`; binary search $k \\in [0, mn)$.

**Edge cases.** Not rotated at all (a[0] < a[−1]); one element; duplicates in rotated arrays (when \`a[mid] == a[hi]\`, you can only shrink \`hi -= 1\`, worst case $O(n)$).
`,
  practice: `
**Signals:** "rotated", "pivot", "find any peak", "bitonic", "sorted rows and columns", "must be O(log n)" with something that isn't plainly sorted.

**Variations.** Find Minimum in Rotated Sorted Array II (duplicates), Single Element in a Sorted Array (pair parity at even indices), Find Peak Element in 2-D (column max + binary search on rows), Median of Two Sorted Arrays (binary search on the partition).

**Practise:** Find Minimum in Rotated Sorted Array, Search in Rotated Sorted Array, Find Peak Element, Search a 2D Matrix, Single Element in a Sorted Array, Peak Index in a Mountain Array, Median of Two Sorted Arrays.
`,
  traps: [
    { trap: "Compare a[mid] with a[lo] to find the rotation minimum.", why: "If the array isn't rotated, a[mid] ≥ a[lo] sends you right past the minimum at index 0. Comparing with a[hi] handles both cases." },
    { trap: "Binary search can't find a peak because the array isn't sorted.", why: "You don't need sortedness, only a test that says which side surely contains an answer. Uphill at mid means a peak exists on the right." },
    { trap: "Rotated search with duplicates is still O(log n).", why: "When a[lo] == a[mid] == a[hi] you can't tell which half is sorted and must shrink by one: worst case O(n)." },
  ],
  say: {
    prompt: "Search for a target in a rotated sorted array in O(log n). How do you decide which half to discard?",
    secs: 45,
    check: ["At least one of the two halves is sorted", "Identify it with a[lo] ≤ a[mid]", "Check whether the target lies within the sorted half's range", "Go there if so, else the other half", "O(log n); duplicates degrade to O(n)"],
    followups: [
      { q: "How would you find the rotation count?", a: "It's the index of the minimum: binary search comparing a[mid] with a[hi], moving lo = mid + 1 when a[mid] > a[hi], else hi = mid." },
      { q: "Why does the peak search always find a peak?", a: "If a[mid] < a[mid + 1], the values rise to the right, and since the array ends (treat outside as −∞), some peak must exist on that side; otherwise one exists at mid or to its left. The range always contains a peak." },
      { q: "How do you binary search a matrix whose rows and columns are each sorted but rows don't continue each other?", a: "That's not a flat sorted array. Use a staircase search from the top-right corner: move left if the value is too big, down if too small: O(m + n)." },
    ],
    answer: `Even after rotation, splitting at mid leaves at least one half fully sorted. If a[lo] ≤ a[mid], the left half is sorted, otherwise the right half is. I check whether the target falls inside the sorted half's range, which is a simple comparison with its endpoints. If it does, I search that half; otherwise the target can only be in the other half.

Each step halves the range, so it's O(log n) time and O(1) space. If there are duplicates, a[lo], a[mid] and a[hi] can all be equal and I can't tell which side is sorted, so I shrink by one, which makes the worst case O(n).`,
    avoid: ["Finding the pivot by a linear scan", "Claiming O(log n) with duplicates"],
  },
  terms: [["Rotation point", "Index of the minimum in a rotated sorted array."], ["Peak", "Element not smaller than its neighbours."], ["Index mapping", "Flat index k → (k // n, k % n) in an m × n matrix."]],
  sources: [D.bsearch, S.cpBs],
});
Q({ id: "dsa2-bm-1", d: 1, secs: 45, prompt: "Minimum of the rotated array [11, 13, 15, 17, 2, 5, 8] found by binary search. What is its index?", answer: 4, tol: 0.5, explain: "Value 2 at index 4.", py: "a = [11,13,15,17,2,5,8]; lo, hi = 0, len(a)-1\nwhile lo < hi:\n    m = (lo+hi)//2\n    if a[m] > a[hi]: lo = m+1\n    else: hi = m\nanswer = lo" });
Q({ id: "dsa2-bm-2", d: 2, secs: 60, prompt: "Search [4, 5, 6, 7, 0, 1, 2] for 3 with rotated binary search. What is returned?", answer: -1, tol: 0.5, explain: "3 isn't present.", py: "def f(a, t):\n    lo, hi = 0, len(a)-1\n    while lo <= hi:\n        m = (lo+hi)//2\n        if a[m] == t: return m\n        if a[lo] <= a[m]:\n            if a[lo] <= t < a[m]: hi = m-1\n            else: lo = m+1\n        else:\n            if a[m] < t <= a[hi]: lo = m+1\n            else: hi = m-1\n    return -1\nanswer = f([4,5,6,7,0,1,2], 3)" });
Q({ id: "dsa2-bm-3", d: 2, secs: 60, prompt: "Peak search (move right when a[mid] < a[mid + 1]) on [1, 2, 1, 3, 5, 6, 4]. Which index does it return?", answer: 5, tol: 0.5, explain: "mid = 3 goes uphill right; it converges on 6 at index 5.", py: "a = [1,2,1,3,5,6,4]; lo, hi = 0, len(a)-1\nwhile lo < hi:\n    m = (lo+hi)//2\n    if a[m] < a[m+1]: lo = m+1\n    else: hi = m\nanswer = lo" });
Q({ id: "dsa2-bm-4", d: 1, secs: 45, prompt: "In a 3 × 4 matrix stored as one sorted run, which column holds flat index 7?", answer: 3, tol: 0.5, explain: "7 % 4 = 3 (row 7 // 4 = 1).", py: "answer = 7 % 4" });
C("dsa2-bm-c1", "Rotated minimum", "a[mid] > a[hi] → lo = mid + 1 else hi = mid.");
C("dsa2-bm-c2", "Rotated search", "One half is sorted; go there if the target is in its range.");

L("dsa2-bsearch-answer", BS, "Binary search on the answer", "When checking 'is x enough?' is easy and the answer is monotonic, binary search over possible answers instead of indices.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-binary-search"],
  hook: "What's the slowest eating speed that finishes all banana piles in h hours? Trying every speed up to 10⁹ is too slow. What's monotonic here?",
  intuition: `
**The situation.** "Minimum capacity to ship within D days", "smallest speed to finish in h hours", "minimise the largest group sum", "maximise the minimum distance". You're asked for an optimal number, not a position.

**The idea.** Turn optimisation into a yes/no check. If a speed works, every faster speed also works: \`feasible(x)\` is false…false, true…true over x. Binary search for the first true.

1. Pick bounds: \`lo\` = smallest conceivable answer, \`hi\` = one that surely works.
2. Write \`feasible(x)\`, usually a greedy $O(n)$ pass.
3. Lower-bound search over \`[lo, hi]\`.

Total cost: $O(n\\log(\\text{range}))$. A range of 10⁹ takes about 30 checks.

**Recognise it** when the answer is a number in a big range, the statement says "minimum … such that" or "maximum … such that", and checking a candidate is easier than finding the optimum.
`,
  maths: `
**In one breath.** \`lo, hi = min_possible, max_possible\`; while \`lo < hi\`: \`mid = (lo + hi) // 2\`; \`feasible(mid)\` → \`hi = mid\` else \`lo = mid + 1\`; $O(n\\log R)$.

**Template.**

\`\`\`python
def min_feasible(lo, hi, feasible):   # smallest x in [lo, hi] with feasible(x)
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
\`\`\`

**Worked problem 1: slowest eating speed.** Piles \`p\`, at most \`h\` hours; at speed \`k\` a pile takes \`ceil(pile / k)\` hours.

\`\`\`python
def min_speed(piles, h):
    def ok(k):
        return sum((x + k - 1) // k for x in piles) <= h   # integer ceil
    return min_feasible(1, max(piles), ok)
min_speed([3, 6, 7, 11], 8)          # 4
\`\`\`

**Worked problem 2: least ship capacity within D days.** Bounds: \`max(w)\` (must carry the heaviest) to \`sum(w)\` (one day).

\`\`\`python
def ship_capacity(w, days):
    def ok(cap):
        need, load = 1, 0
        for x in w:
            if load + x > cap:
                need, load = need + 1, 0     # start a new day
            load += x
        return need <= days
    return min_feasible(max(w), sum(w), ok)
ship_capacity([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5)   # 15
\`\`\`

**Worked problem 3: maximise the minimum gap (place c items on sorted positions).** Now feasibility is true…true, false…false; search for the **last** true: \`mid = (lo + hi + 1) // 2\`, true → \`lo = mid\`, false → \`hi = mid − 1\`. Positions [1, 2, 4, 8, 9], c = 3 → 3.

**Integer square root** is the same idea: the largest x with $x^2 \\le n$.

**Edge cases.** Choose \`hi\` so it's certainly feasible; use integer ceil \`(a + b − 1) // b\`; for "maximise", round mid up or the loop can stall.
`,
  practice: `
**Signals:** "minimum … such that", "maximum … such that", "at most D days/h hours/k groups", answer range up to 10⁹, a greedy check is obvious once the target is fixed.

**Variations.** Split Array Largest Sum (same check as shipping, k groups), Magnetic Force Between Two Balls (maximise minimum gap), Minimum Number of Days to Make m Bouquets, Kth Smallest in a Sorted Matrix (count ≤ mid), real-valued answers (loop a fixed 60–100 times).

**Practise:** Koko Eating Bananas, Capacity To Ship Packages Within D Days, Split Array Largest Sum, Sqrt(x), Magnetic Force Between Two Balls, Minimum Number of Days to Make m Bouquets, Find the Smallest Divisor Given a Threshold.
`,
  traps: [
    { trap: "Set lo = 0 for a speed or divisor.", why: "Dividing by zero crashes the check. The smallest meaningful speed is 1; for capacity it's max(weights)." },
    { trap: "Use mid = (lo + hi) // 2 when searching for the last true.", why: "With lo = mid on success, two adjacent values loop forever. Round up: mid = (lo + hi + 1) // 2." },
    { trap: "Binary search on the answer needs sorted input.", why: "It needs a monotonic feasibility check over the answer. The input itself can be in any order (shipping must keep the given order, for instance)." },
  ],
  say: {
    prompt: "Find the minimum ship capacity to deliver packages in order within D days. Walk through the approach.",
    secs: 50,
    check: ["Recognise monotonic feasibility: larger capacity never hurts", "Bounds: max(weights) to sum(weights)", "Greedy check: fill days in order, count days needed", "Lower-bound binary search over capacity", "O(n log(sum)) time, O(1) space"],
    followups: [
      { q: "Why is the greedy check correct?", a: "For a fixed capacity, loading each day as fully as possible in order never uses more days than any other valid split: delaying a package to the next day can't reduce the count." },
      { q: "How does Split Array Largest Sum relate?", a: "It's the same problem: minimise the largest group sum with k contiguous groups. The check counts groups needed for a cap and compares with k." },
      { q: "What changes if the answer is a real number?", a: "Use floats and loop a fixed number of times (say 100) or until hi − lo < ε, setting hi = mid or lo = mid without ±1." },
    ],
    answer: `The answer is monotonic: if a capacity works, any larger one also works. So I binary search on capacity. The lower bound is the heaviest package, since it must fit on some day, and the upper bound is the total weight, which ships everything in one day.

For a candidate capacity I check feasibility greedily: go through the packages in order, add each to today's load, and start a new day when it would overflow; it's feasible if the days used are at most D. I take the smallest feasible capacity with a lower-bound search. Each check is O(n) and there are about log of the sum checks, so O(n log(sum)) time and O(1) space.`,
    avoid: ["Trying every capacity linearly", "Starting the lower bound at 0 or 1 (ignores the heaviest package)"],
  },
  terms: [["Feasibility check", "Yes/no test of whether a candidate answer works."], ["Search space", "Range of possible answers, not array indices."], ["Last true search", "Round mid up when moving lo = mid."]],
  sources: [S.cpBs, D.bsearch],
});
Q({ id: "dsa2-ba-1", d: 2, secs: 60, prompt: "Piles [30, 11, 23, 4, 20], h = 6 hours. Slowest integer eating speed that finishes?", answer: 23, tol: 0.5, explain: "At 23: 2 + 1 + 1 + 1 + 1 = 6 hours; at 22 it takes 7.", py: "p, h = [30,11,23,4,20], 6\nlo, hi = 1, max(p)\nwhile lo < hi:\n    m = (lo+hi)//2\n    if sum((x+m-1)//m for x in p) <= h: hi = m\n    else: lo = m+1\nanswer = lo" });
Q({ id: "dsa2-ba-2", d: 2, secs: 60, prompt: "Weights [3, 2, 2, 4, 1, 4] shipped in order within 3 days. Least capacity?", answer: 6, tol: 0.5, explain: "[3, 2], [2, 4], [1, 4].", py: "w, D = [3,2,2,4,1,4], 3\ndef ok(c):\n    n, ld = 1, 0\n    for x in w:\n        if ld + x > c: n += 1; ld = 0\n        ld += x\n    return n <= D\nlo, hi = max(w), sum(w)\nwhile lo < hi:\n    m = (lo+hi)//2\n    if ok(m): hi = m\n    else: lo = m+1\nanswer = lo" });
Q({ id: "dsa2-ba-3", d: 2, secs: 60, prompt: "Place 3 items at positions [1, 2, 4, 8, 9] to maximise the minimum gap between any two. What is that gap?", answer: 3, tol: 0.5, explain: "Positions 1, 4, 8 (or 1, 4, 9).", py: "p = sorted([1,2,4,8,9]); c = 3\ndef ok(g):\n    cnt, last = 1, p[0]\n    for x in p[1:]:\n        if x - last >= g: cnt += 1; last = x\n    return cnt >= c\nlo, hi = 1, p[-1]-p[0]\nwhile lo < hi:\n    m = (lo+hi+1)//2\n    if ok(m): lo = m\n    else: hi = m-1\nanswer = lo" });
Q({ id: "dsa2-ba-4", d: 1, secs: 45, prompt: "Integer square root of 2,147,395,599 (largest x with x² ≤ n)?", answer: 46339, tol: 0.5, explain: "46,339² = 2,147,302,921 ≤ n < 46,340².", py: "n = 2147395599; lo, hi = 0, n\nwhile lo < hi:\n    m = (lo+hi+1)//2\n    if m*m <= n: lo = m\n    else: hi = m-1\nanswer = lo" });
C("dsa2-ba-c1", "Binary search on the answer", "Monotonic feasible(x); bounds; first true via hi = mid / lo = mid + 1.");
C("dsa2-ba-c2", "Maximise with binary search", "Last true: mid = (lo+hi+1)//2; ok → lo = mid else hi = mid − 1.");

L("dsa2-bsearch-practice", BS, "Binary search practice", "Boundary searches and answer searches to explain out loud.", {
  kind: "interview", mins: 25, prereq: ["dsa2-binary-search", "dsa2-bsearch-modified", "dsa2-bsearch-answer"],
  hook: "For each: what is monotonic, what are the bounds, and what's the complexity?",
}, [
  iq("Split Array Largest Sum: split nums into k contiguous parts to minimise the largest part's sum.", "Binary search the cap between max(nums) and sum(nums). Check: greedily form parts with sum ≤ cap and count them; feasible if count ≤ k. Larger caps never need more parts, so feasibility is monotonic. O(n log(sum)). A DP alternative is O(k·n²).", ["Monotonic cap", "Bounds max..sum", "Greedy count of parts", "O(n log sum)"]),
  iq("Find a single element in a sorted array where every other element appears exactly twice, in O(log n).", "Before the single element, pairs start at even indices (a[2i] == a[2i+1]); after it, at odd indices. Binary search on even mid: if a[mid] == a[mid+1], go right (lo = mid + 2), else hi = mid. O(log n).", ["Pair parity shifts at the single element", "Search on even indices", "O(log n)"]),
  iq("Time-based key-value store: set(key, value, t) with increasing t; get(key, t) returns the value at the latest time ≤ t.", "Dict from key to a list of (t, value), appended in order so it's sorted. get uses bisect_right on the times and takes index − 1, returning '' if it's −1. set O(1), get O(log n).", ["Per-key sorted list", "bisect_right − 1", "Empty result edge case", "O(log n) get"]),
  iq("Kth smallest element in an n × n matrix with sorted rows and columns.", "Binary search on the value between matrix[0][0] and matrix[n−1][n−1]; count elements ≤ mid with a staircase walk from the bottom-left in O(n); find the smallest value with count ≥ k. O(n log(range)). A heap of row heads gives O(k log n) as an alternative.", ["Search on value, not index", "Staircase count O(n)", "First value with count ≥ k", "Heap alternative"]),
  iq("Median of two sorted arrays in O(log(min(m, n))).", "Binary search a cut i in the shorter array and set j = (m + n + 1)//2 − i in the other, so the left side has half the elements. The cut is right when A[i−1] ≤ B[j] and B[j−1] ≤ A[i] (use ±∞ at edges). The median comes from the max of the left side and min of the right side.", ["Search the partition of the shorter array", "Balance condition for j", "Cross-comparison of boundary values", "Infinity sentinels at edges"]),
  iq("Minimum days to make m bouquets of k adjacent flowers, given bloom days.", "Binary search on the day between min and max bloom day; check counts runs of consecutive bloomed flowers and adds run // k bouquets. If m·k > n, impossible (−1). O(n log(max day)).", ["Impossible case m·k > n", "Monotonic in day", "Run-length check", "O(n log D)"]),
]);

// ───────────────────────── Linked lists ─────────────────────────

L("dsa2-linked-list", LL, "Linked list basics, dummy heads and reversal", "Node-by-node traversal, the dummy head that removes special cases, in-place reversal and removing the n-th node from the end.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-python-costs"],
  hook: "Reverse a singly linked list in place. Three pointers are enough; what goes wrong if you update them in the wrong order?",
  intuition: `
**The situation.** Python's list is an array, so linked lists only appear when the interviewer gives you a \`ListNode\` class. Problems test pointer handling: no indexing, only \`.next\`.

**The idea.** A node holds a value and a reference to the next node. You can insert or delete in $O(1)$ **once you hold the previous node**, but reaching position $k$ takes $O(k)$.

Three habits remove most bugs:

- **Dummy head:** a fake node before the real head, so deleting or inserting at the front is no different from anywhere else. Return \`dummy.next\`.
- **Save \`next\` before you rewire.** Once \`cur.next\` changes, the rest of the list is unreachable unless you saved it.
- **Gap pointers:** to find the n-th from the end in one pass, move \`fast\` n steps ahead, then move both until \`fast\` hits the end.
`,
  maths: `
**In one breath.** \`dummy = ListNode(0, head)\`; reverse: \`prev, cur = None, head\`; loop \`nxt = cur.next; cur.next = prev; prev = cur; cur = nxt\`; return \`prev\`; $O(n)$ time, $O(1)$ space.

**Setup used in all examples.**

\`\`\`python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next

def build(vals):
    dummy = tail = ListNode()
    for v in vals:
        tail.next = ListNode(v); tail = tail.next
    return dummy.next

def to_list(node):
    out = []
    while node:
        out.append(node.val); node = node.next
    return out
\`\`\`

**Template: in-place reversal.**

\`\`\`python
def reverse(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next       # 1. save the rest
        cur.next = prev      # 2. point backwards
        prev, cur = cur, nxt # 3. advance both
    return prev              # new head
to_list(reverse(build([1, 2, 3, 4, 5])))   # [5, 4, 3, 2, 1]
\`\`\`

**Worked problem 1: delete all nodes with a given value.**

\`\`\`python
def remove_value(head, x):
    dummy = cur = ListNode(0, head)
    while cur.next:
        if cur.next.val == x:
            cur.next = cur.next.next   # skip; stay put to check the new next
        else:
            cur = cur.next
    return dummy.next
to_list(remove_value(build([7, 7, 1, 7, 2]), 7))   # [1, 2]
\`\`\`

Without the dummy, leading 7s need a separate loop.

**Worked problem 2: remove the n-th node from the end in one pass.**

\`\`\`python
def remove_nth_from_end(head, n):
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n + 1):           # gap of n + 1 so slow stops BEFORE the target
        fast = fast.next
    while fast:
        fast, slow = fast.next, slow.next
    slow.next = slow.next.next
    return dummy.next
to_list(remove_nth_from_end(build([1, 2, 3, 4, 5]), 2))   # [1, 2, 3, 5]
\`\`\`

**Worked problem 3: reverse only positions left..right.** Walk a pointer to the node before \`left\`, reverse the next \`right − left + 1\` nodes with the same three-step loop, then reconnect both ends.

**Edge cases.** Empty list (\`head is None\`); one node; removing the head (dummy handles it); n equal to the length.
`,
  practice: `
**Signals:** a \`ListNode\` class in the prompt; "in place", "one pass", "reverse", "remove", "insert", "nth from end".

**Variations.** Reverse Nodes in k-Group (reverse k at a time, leave the tail if shorter), Swap Nodes in Pairs, Rotate List (make a ring, cut at length − k % length), Remove Duplicates from Sorted List II (dummy + skip runs).

**Practise:** Reverse Linked List, Reverse Linked List II, Remove Linked List Elements, Remove Nth Node From End of List, Swap Nodes in Pairs, Rotate List, Remove Duplicates from Sorted List, Reverse Nodes in k-Group.
`,
  traps: [
    { trap: "Set cur.next = prev before saving cur.next.", why: "The rest of the list becomes unreachable. Save nxt = cur.next first." },
    { trap: "Move fast exactly n steps ahead from the head when removing the n-th from the end.", why: "Then slow lands on the target, but you need the node before it. Start both at a dummy and give a gap of n + 1." },
    { trap: "Advance cur after deleting cur.next.", why: "The new cur.next hasn't been checked; with consecutive matches you skip one. Advance only when you don't delete." },
  ],
  say: {
    prompt: "Reverse a singly linked list in place, then explain how you'd remove the n-th node from the end in one pass.",
    secs: 50,
    check: ["prev = None, cur = head; save next, rewire, advance", "Return prev as the new head", "O(n) time, O(1) space", "Dummy head before the list for removals", "Gap of n + 1 between fast and slow so slow stops before the target"],
    followups: [
      { q: "How would you reverse a list recursively, and what's the cost?", a: "Reverse the rest, then set head.next.next = head and head.next = None; return the new head from the recursion. O(n) time but O(n) stack, which can hit Python's recursion limit." },
      { q: "Why use a dummy node?", a: "Operations on the head become the same as anywhere else, so you avoid special-casing an empty list or deleting the first node. You return dummy.next." },
      { q: "How do you rotate a list right by k?", a: "Find the length and the tail, link the tail to the head to form a ring, step length − k % length from the tail to the new tail, cut after it. O(n)." },
    ],
    answer: `To reverse, I keep prev starting at None and cur at the head. In each step I save cur.next, point cur.next back at prev, then move prev to cur and cur to the saved node. When cur is None, prev is the new head. It's O(n) time and O(1) space; the order matters because rewiring first would lose the rest of the list.

To remove the n-th node from the end in one pass, I put a dummy node before the head and start two pointers there. I move fast n + 1 steps ahead, then move both until fast is None. Slow is now just before the target, so slow.next = slow.next.next removes it. The dummy covers the case where the head itself is removed.`,
    avoid: ["Copying values into a Python list and rebuilding", "Special-casing the head instead of using a dummy"],
  },
  terms: [["Dummy head", "Sentinel node before the real head; return dummy.next."], ["Gap pointers", "Two pointers a fixed distance apart moving together."], ["In place", "Rewire existing nodes instead of creating new ones."]],
  sources: [D.linked],
});
const LN = "class N:\n    def __init__(s, v, n=None): s.val, s.next = v, n\ndef build(vs):\n    d = t = N(0)\n    for v in vs: t.next = N(v); t = t.next\n    return d.next\ndef tl(h):\n    o = []\n    while h: o.append(h.val); h = h.next\n    return o\n";
Q({ id: "dsa2-ll-1", d: 1, secs: 45, prompt: "Reverse the list 1 → 2 → 3 → 4 → 5 in place. What value does the new head's next node hold?", answer: 4, tol: 0.5, explain: "5 → 4 → 3 → 2 → 1.", py: LN + "def rev(h):\n    p, c = None, h\n    while c:\n        nx = c.next; c.next = p; p, c = c, nx\n    return p\nanswer = rev(build([1,2,3,4,5])).next.val" });
Q({ id: "dsa2-ll-2", d: 2, secs: 60, prompt: "Remove the 2nd node from the end of 10 → 20 → 30 → 40 → 50. What is the sum of the remaining values?", answer: 110, tol: 0.5, explain: "40 is removed: 10 + 20 + 30 + 50.", py: LN + "def rm(h, n):\n    d = N(0, h); f = s = d\n    for _ in range(n+1): f = f.next\n    while f: f, s = f.next, s.next\n    s.next = s.next.next\n    return d.next\nanswer = sum(tl(rm(build([10,20,30,40,50]), 2)))" });
Q({ id: "dsa2-ll-3", d: 2, secs: 60, prompt: "Remove every node with value 6 from 6 → 6 → 1 → 6 → 2 → 6. How many nodes remain?", answer: 2, tol: 0.5, explain: "1 → 2. The dummy handles the leading 6s.", py: LN + "def rmv(h, x):\n    d = c = N(0, h)\n    while c.next:\n        if c.next.val == x: c.next = c.next.next\n        else: c = c.next\n    return d.next\nanswer = len(tl(rmv(build([6,6,1,6,2,6]), 6)))" });
Q({ id: "dsa2-ll-4", d: 2, secs: 60, prompt: "Reverse positions 2..4 (1-indexed) of 1 → 2 → 3 → 4 → 5. What value is at position 2 afterwards?", answer: 4, tol: 0.5, explain: "1 → 4 → 3 → 2 → 5.", py: LN + "def rb(h, l, r):\n    d = N(0, h); p = d\n    for _ in range(l-1): p = p.next\n    c = p.next\n    for _ in range(r-l):\n        nx = c.next; c.next = nx.next; nx.next = p.next; p.next = nx\n    return d.next\nanswer = tl(rb(build([1,2,3,4,5]), 2, 4))[1]" });
C("dsa2-ll-c1", "Reverse a list", "nxt = cur.next; cur.next = prev; prev, cur = cur, nxt; return prev.");
C("dsa2-ll-c2", "n-th from the end", "Dummy; fast n + 1 ahead; move both until fast is None; slow.next = slow.next.next.");

L("dsa2-fast-slow", LL, "Fast and slow pointers", "A pointer moving two steps and one moving one step: the middle node, cycle detection and the cycle's entry, and palindrome lists.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-linked-list"],
  hook: "Does this linked list loop back on itself? You may use O(1) memory, so no set of visited nodes. How can two runners on a track tell?",
  intuition: `
**The situation.** Finding the middle without knowing the length, detecting a cycle, finding where a cycle starts, checking a palindrome list in $O(1)$ space.

**The idea.** \`slow\` moves one step, \`fast\` moves two.

- **Middle:** when \`fast\` reaches the end, \`slow\` is halfway.
- **Cycle:** in a loop, \`fast\` gains one step on \`slow\` every move, so it must catch it; without a loop, \`fast\` hits \`None\`. This is Floyd's tortoise and hare.
- **Cycle entry:** after they meet, put one pointer back at the head and move both one step at a time; they meet at the entry. (If the tail before the cycle is $a$ long and they met $b$ steps into a cycle of length $c$, then $a \\equiv c - b \\pmod c$.)

The same idea works on any sequence $x \\to f(x)$: "happy numbers", finding a duplicate in an array whose values are indices.
`,
  maths: `
**In one breath.** \`slow = fast = head\`; \`while fast and fast.next: slow = slow.next; fast = fast.next.next\`; meet → cycle; reset one to head and step both by one to find the entry; $O(n)$ time, $O(1)$ space.

**Template: middle node.**

\`\`\`python
def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    return slow      # for even length: the second of the two middles
\`\`\`

**Worked problem 1: cycle detection and entry.**

\`\`\`python
def cycle_entry(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:                 # inside the cycle
            p = head
            while p is not slow:
                p, slow = p.next, slow.next
            return p                     # entry node
    return None                          # no cycle
\`\`\`

Compare nodes with \`is\`, not values: two nodes can hold the same value.

**Worked problem 2: palindrome list in O(1) space.** Find the middle, reverse the second half, compare the two halves node by node (optionally reverse back).

\`\`\`python
def is_palindrome(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    prev = None
    while slow:                          # reverse second half
        slow.next, prev, slow = prev, slow, slow.next
    a, b = head, prev
    while b:
        if a.val != b.val:
            return False
        a, b = a.next, b.next
    return True
# 1 -> 2 -> 2 -> 1: True;  1 -> 2 -> 3: False
\`\`\`

**Worked problem 3: duplicate in an array of n + 1 values in 1..n.** Treat \`i → nums[i]\` as a linked list; the duplicate is the cycle entry. [1, 3, 4, 2, 2] → 2, $O(n)$ time, $O(1)$ space, array unmodified.

**Edge cases.** Empty or one-node lists; even-length lists (which middle the problem wants); a cycle that includes the head (entry = head).
`,
  practice: `
**Signals:** "O(1) extra space" with a linked list, "cycle", "middle", "palindrome list", "repeating sequence", "find the duplicate without modifying the array".

**Variations.** Happy Number (iterate digit-square sums; cycle without 1 means not happy), Reorder List (middle + reverse + merge), Delete the Middle Node (stop slow one earlier by starting fast at head.next.next).

**Practise:** Middle of the Linked List, Linked List Cycle, Linked List Cycle II, Palindrome Linked List, Happy Number, Find the Duplicate Number, Reorder List, Delete the Middle Node of a Linked List.
`,
  traps: [
    { trap: "Loop while fast.next and fast.next.next.", why: "If fast is None this raises AttributeError. Check 'while fast and fast.next'." },
    { trap: "Detect a cycle by comparing node values.", why: "Different nodes can hold equal values. Compare identity with 'is'." },
    { trap: "Use a set of visited nodes when O(1) space is asked.", why: "It works in O(n) time but O(n) space; Floyd's method gives O(1) space." },
  ],
  say: {
    prompt: "Detect whether a linked list has a cycle and return the node where it begins, using O(1) extra space.",
    secs: 50,
    check: ["Slow moves 1, fast moves 2", "fast reaching None means no cycle", "Meeting means a cycle exists", "Reset one pointer to head; step both by 1; they meet at the entry", "O(n) time, O(1) space; compare nodes by identity"],
    followups: [
      { q: "Why must fast catch slow inside a cycle?", a: "Once both are in the cycle, the gap between them shrinks by one each step (fast moves 2, slow 1), so it reaches 0 within one lap." },
      { q: "Why does resetting to head find the entry?", a: "If the tail before the cycle has length a and they met b steps into a cycle of length c, then 2(a + b) = a + b + kc, so a = kc − b. Walking a steps from the head and from the meeting point lands both on the entry." },
      { q: "How would you find the cycle length?", a: "After they meet, keep one fixed and move the other until it returns, counting steps." },
    ],
    answer: `I use Floyd's tortoise and hare. Slow moves one node per step, fast moves two. If fast or fast.next becomes None, the list ends and there's no cycle. If there's a cycle, fast gains one node per step and must land on slow.

To find the entry, I move one pointer back to the head and advance both one step at a time; where they meet is the start of the cycle. That works because the distance from the head to the entry equals the distance from the meeting point to the entry, modulo the cycle length. It's O(n) time and O(1) space, and I compare nodes with 'is', not by value.`,
    avoid: ["Comparing node values", "Using a visited set when O(1) space is required"],
  },
  terms: [["Floyd's algorithm", "Tortoise-and-hare cycle detection."], ["Cycle entry", "First node of the cycle reached from the head."], ["Functional graph", "Each value points to exactly one next value: x → f(x)."]],
  sources: [S.cycle, D.linked],
});
Q({ id: "dsa2-fs-1", d: 1, secs: 45, prompt: "Middle node (second middle for even length) of 1 → 2 → 3 → 4 → 5 → 6 with slow/fast pointers. Its value?", answer: 4, tol: 0.5, explain: "Fast stops at None after 3 moves; slow is on 4.", py: LN + "h = build([1,2,3,4,5,6]); s = f = h\nwhile f and f.next: s, f = s.next, f.next.next\nanswer = s.val" });
Q({ id: "dsa2-fs-2", d: 2, secs: 60, prompt: "List 3 → 2 → 0 → −4 with −4 pointing back to the node holding 2. What is the cycle length?", answer: 3, tol: 0.5, explain: "2 → 0 → −4 → 2.", py: LN + "h = build([3,2,0,-4]); t = h\nwhile t.next: t = t.next\nt.next = h.next\ns = f = h\nwhile True:\n    s, f = s.next, f.next.next\n    if s is f: break\nc, p = 1, s.next\nwhile p is not s: p = p.next; c += 1\nanswer = c" });
Q({ id: "dsa2-fs-3", d: 2, secs: 60, prompt: "Find the duplicate in [3, 1, 3, 4, 2] with Floyd's method on i → nums[i].", answer: 3, tol: 0.5, explain: "0 → 3 → 4 → 2 → 3: the cycle is entered at 3.", py: "a = [3,1,3,4,2]\ns = f = 0\nwhile True:\n    s = a[s]; f = a[a[f]]\n    if s == f: break\np = 0\nwhile p != s: p = a[p]; s = a[s]\nanswer = p" });
Q({ id: "dsa2-fs-4", d: 2, secs: 60, prompt: "Is 19 a happy number (repeated sum of squared digits reaches 1)? Answer 1 for yes, 0 for no.", answer: 1, tol: 0.5, explain: "19 → 82 → 68 → 100 → 1.", py: "def nxt(n): return sum(int(d)**2 for d in str(n))\ns, f = 19, nxt(19)\nwhile f != 1 and s != f:\n    s = nxt(s); f = nxt(nxt(f))\nanswer = 1 if f == 1 else 0" });
C("dsa2-fs-c1", "Floyd's cycle detection", "slow 1 step, fast 2; meet → cycle; reset one to head, step both by 1 → entry.");
C("dsa2-fs-c2", "Middle node", "while fast and fast.next: slow = slow.next; fast = fast.next.next.");

L("dsa2-list-merge", LL, "Merging lists and the LRU cache", "Merging sorted lists with a tail pointer, digit-by-digit addition, reordering, and an O(1) LRU cache with a hash map and a doubly linked list.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-linked-list", "dsa2-fast-slow"],
  hook: "Design a cache that evicts the least recently used item, with get and put both in O(1). A dict alone can't track order cheaply. What does?",
  intuition: `
**The situation.** Building a new list from pieces of others: merging sorted lists, adding numbers stored as digit lists, interleaving halves. And one design classic: the LRU cache.

**The idea.**

- **Tail pointer + dummy:** keep \`tail\` at the end of the result; attach the chosen node and move \`tail\`. No special case for the first node.
- **Carry state** (like a digit carry) and keep looping while any input or the carry remains.
- **LRU cache:** a dict maps key → node for $O(1)$ lookup; a doubly linked list keeps usage order, with the most recent at one end. Moving a node to the front or removing the last one is $O(1)$ because each node knows both neighbours. In Python, \`OrderedDict\` with \`move_to_end\` and \`popitem(last=False)\` does exactly this.
`,
  maths: `
**In one breath.** Merge: \`dummy = tail = ListNode()\`; attach the smaller head; \`tail.next = l1 or l2\` at the end; LRU: dict + doubly linked list (or \`OrderedDict\`), $O(1)$ get/put.

**Template: merge two sorted lists.**

\`\`\`python
def merge(l1, l2):
    dummy = tail = ListNode()
    while l1 and l2:
        if l1.val <= l2.val:             # <= keeps it stable
            tail.next, l1 = l1, l1.next
        else:
            tail.next, l2 = l2, l2.next
        tail = tail.next
    tail.next = l1 or l2                 # attach the leftover run
    return dummy.next
# [1, 2, 4] + [1, 3, 4] -> [1, 1, 2, 3, 4, 4]
\`\`\`

$O(m + n)$ time, $O(1)$ extra (nodes are reused).

**Worked problem 1: add two numbers stored in reverse digit order.**

\`\`\`python
def add(l1, l2):
    dummy = tail = ListNode()
    carry = 0
    while l1 or l2 or carry:             # carry can create a final digit
        s = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
        carry, d = divmod(s, 10)
        tail.next = ListNode(d); tail = tail.next
        l1 = l1.next if l1 else None
        l2 = l2.next if l2 else None
    return dummy.next
# 2->4->3 (342) + 5->6->4 (465) = 7->0->8 (807)
\`\`\`

**Worked problem 2: LRU cache.**

\`\`\`python
from collections import OrderedDict
class LRUCache:
    def __init__(self, capacity):
        self.cap, self.d = capacity, OrderedDict()
    def get(self, key):
        if key not in self.d:
            return -1
        self.d.move_to_end(key)          # mark as most recent
        return self.d[key]
    def put(self, key, value):
        self.d[key] = value
        self.d.move_to_end(key)
        if len(self.d) > self.cap:
            self.d.popitem(last=False)   # evict least recent
\`\`\`

Interviewers may ask for the manual version: a dict of key → node and a doubly linked list with dummy \`head\` and \`tail\` nodes; \`remove(node)\` and \`add_front(node)\` are four pointer updates each.

**Worked problem 3: merge k sorted lists.** Push \`(node.val, i, node)\` for each head onto a heap; pop the smallest, attach it, push its successor. $O(N\\log k)$ for $N$ total nodes. The index \`i\` breaks ties so nodes are never compared.

**Edge cases.** One or both lists empty; a final carry (999 + 1); LRU \`put\` on an existing key must update and refresh, not evict; capacity 1.
`,
  practice: `
**Signals:** "merge", "sorted lists", "digits stored in a list", "reorder", "interleave", "design a cache", "least recently used", "O(1) get and put".

**Variations.** Reorder List (middle, reverse second half, merge alternately), Sort List (merge sort on a list: $O(n\\log n)$, split with fast/slow), Copy List with Random Pointer (dict old → new, or interleave copies), LFU Cache (frequency buckets).

**Practise:** Merge Two Sorted Lists, Add Two Numbers, Merge k Sorted Lists, Reorder List, Sort List, Copy List with Random Pointer, LRU Cache, Intersection of Two Linked Lists.
`,
  traps: [
    { trap: "Stop adding when both lists end.", why: "A remaining carry needs one more node: 5 + 5 = 10 is 0 → 1. Loop while l1 or l2 or carry." },
    { trap: "Push (val, node) onto the heap when merging k lists.", why: "Equal values make Python compare ListNode objects, which raises TypeError. Add a tie-breaking index: (val, i, node)." },
    { trap: "In LRU put, update the value without refreshing its position.", why: "A put is a use; the key must become most recent, or it may be evicted next." },
  ],
  say: {
    prompt: "Design an LRU cache with O(1) get and put. What data structures, and what does each operation do?",
    secs: 50,
    check: ["Hash map key → node for O(1) lookup", "Doubly linked list ordered by recency", "get: move node to the front, return value (or −1)", "put: insert/update at the front; evict from the back when over capacity", "Mention OrderedDict.move_to_end / popitem(last=False)"],
    followups: [
      { q: "Why a doubly linked list and not a singly linked one?", a: "To unlink a node in O(1) you need its previous node; a doubly linked node stores it. With a singly linked list, removal from the middle is O(n)." },
      { q: "What do dummy head and tail nodes buy you?", a: "Every real node always has non-null neighbours, so insertion and removal have no special cases for empty lists or end nodes." },
      { q: "How would you make it thread-safe?", a: "Wrap get and put in a lock, since both mutate order; or shard the cache by key hash with a lock per shard to reduce contention." },
    ],
    answer: `I combine a hash map with a doubly linked list. The map goes from key to list node, so I can find any entry in O(1). The list is ordered by recency, most recent at the front, with dummy head and tail nodes so there are no edge cases.

On get, if the key exists I unlink its node and move it to the front, then return the value; otherwise −1. On put, if the key exists I update the value and move it to the front; otherwise I create a node at the front and, if that takes me over capacity, remove the node just before the tail and delete its key from the map. Unlinking and inserting are a few pointer changes, so both operations are O(1). In Python, OrderedDict with move_to_end and popitem(last=False) gives the same behaviour.`,
    avoid: ["Scanning a list to find the least recent item (O(n))", "Forgetting to refresh recency on put"],
  },
  terms: [["Tail pointer", "Reference to the last node of the list being built."], ["Doubly linked list", "Nodes link to both previous and next."], ["LRU", "Least recently used: evict the item untouched for longest."]],
  sources: [D.linked, D.coll, D.heapq],
});
Q({ id: "dsa2-lm-1", d: 1, secs: 45, prompt: "Merge [1, 2, 4] and [1, 3, 4] into one sorted list. What value is at index 3 (0-based)?", answer: 3, tol: 0.5, explain: "[1, 1, 2, 3, 4, 4].", py: LN + "def mg(a, b):\n    d = t = N(0)\n    while a and b:\n        if a.val <= b.val: t.next, a = a, a.next\n        else: t.next, b = b, b.next\n        t = t.next\n    t.next = a or b\n    return d.next\nanswer = tl(mg(build([1,2,4]), build([1,3,4])))[3]" });
Q({ id: "dsa2-lm-2", d: 2, secs: 60, prompt: "Add 9 → 9 → 9 → 9 (9,999) and 9 → 9 (99), digits in reverse order. How many nodes does the result have?", answer: 5, tol: 0.5, explain: "10,098 stored as 8 → 9 → 0 → 0 → 1.", py: LN + "def add(a, b):\n    d = t = N(0); c = 0\n    while a or b or c:\n        s = c + (a.val if a else 0) + (b.val if b else 0)\n        c, dg = divmod(s, 10); t.next = N(dg); t = t.next\n        a = a.next if a else None; b = b.next if b else None\n    return d.next\nanswer = len(tl(add(build([9,9,9,9]), build([9,9]))))" });
Q({ id: "dsa2-lm-3", d: 2, secs: 60, prompt: "LRU cache, capacity 2: put(1, 1), put(2, 2), get(1), put(3, 3), get(2), put(4, 4), get(1), get(3), get(4). Sum of the five get results (−1 for a miss)?", answer: 6, tol: 0.5, explain: "Gets return 1, −1, −1, 3, 4: put(3) evicts 2, put(4) evicts 1.", py: "from collections import OrderedDict\nd = OrderedDict(); cap = 2; out = []\ndef get(k):\n    if k not in d: out.append(-1); return\n    d.move_to_end(k); out.append(d[k])\ndef put(k, v):\n    d[k] = v; d.move_to_end(k)\n    if len(d) > cap: d.popitem(last=False)\nput(1,1); put(2,2); get(1); put(3,3); get(2); put(4,4); get(1); get(3); get(4)\nanswer = sum(out)" });
Q({ id: "dsa2-lm-4", d: 1, secs: 30, prompt: "Merging k sorted lists with N total nodes using a heap of size k costs:", options: ["O(N k)", "O(N log k)", "O(N log N)", "O(k log N)"], answer: 1, explain: "Each of N pops/pushes costs O(log k).", py: "import math\nN, k = 10**6, 8\nanswer = 1 if N*math.log2(k) < N*math.log2(N) else 0" });
C("dsa2-lm-c1", "Build a list", "dummy = tail = ListNode(); tail.next = node; tail = tail.next; return dummy.next.");
C("dsa2-lm-c2", "LRU cache", "dict key → node + doubly linked list by recency (or OrderedDict). O(1) get/put.");

L("dsa2-list-practice", LL, "Linked lists practice", "Pointer problems to talk through, with complexity and edge cases.", {
  kind: "interview", mins: 25, prereq: ["dsa2-linked-list", "dsa2-fast-slow", "dsa2-list-merge"],
  hook: "Say which pointers you keep, what each step rewires, and the edge cases, before writing code.",
}, [
  iq("Reorder List: L0 → Ln → L1 → Ln−1 → …, in place.", "Find the middle with slow/fast, cut, reverse the second half, then merge the two halves alternately. Each step is O(n) and in place: O(n) time, O(1) space.", ["Middle via fast/slow", "Reverse second half", "Alternate merge", "O(1) space"]),
  iq("Find the node where two singly linked lists intersect, if any.", "Two pointers: walk each list; when one reaches the end, jump to the other list's head. They meet at the intersection after at most m + n steps, or both become None. O(m + n) time, O(1) space. Alternative: compare lengths and advance the longer one first.", ["Switch heads trick", "Both reach None if no intersection", "O(m + n), O(1)", "Compare by identity"]),
  iq("Copy a linked list where each node also has a random pointer.", "Dict from old node to new node: first pass creates copies, second sets next and random via the dict. O(n) time and space. O(1)-space version: interleave copies after each original, set randoms via original.random.next, then split.", ["Old → new mapping", "Two passes", "Interleaving for O(1) space", "Random can be None"]),
  iq("Sort a linked list in O(n log n).", "Merge sort: split at the middle with slow/fast (cut the link), sort each half recursively, merge with a dummy tail. O(n log n) time, O(log n) recursion stack; a bottom-up version is O(1) space.", ["Merge sort suits lists (no random access)", "Split with fast/slow", "Merge with dummy", "Space: recursion vs bottom-up"]),
  iq("Reverse nodes in groups of k; leave a final group shorter than k as is.", "Use a dummy and a pointer to the node before each group. Check k nodes exist; reverse them with the three-pointer loop; connect the previous group's tail to the new head and the new tail to the next group; advance. O(n) time, O(1) space.", ["Check k nodes remain", "Reverse within group", "Reconnect both ends", "O(n), O(1)"]),
]);
