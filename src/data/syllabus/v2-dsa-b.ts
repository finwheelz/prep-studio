/**
 * v2 DSA, part B: Two pointers and sliding window · Stacks and queues. Fixed ids; every answer is recomputed in Pyodide.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";
import { D } from "./v2-dsa-src";

const s = (label: string, url: string) => ({ label, url, checked: CHECKED });
/** Sources for this file; every URL opened and checked on 2026-11-25. */
const S = {
  dutch: s("Wikipedia: Dutch national flag problem", "https://en.wikipedia.org/wiki/Dutch_national_flag_problem"),
  lcLongest: s("LeetCode: Longest Substring Without Repeating Characters", "https://leetcode.com/problems/longest-substring-without-repeating-characters/"),
  minStack: s("CP-algorithms: Minimum stack / minimum queue", "https://cp-algorithms.com/data_structures/stack_queue_modification.html"),
  lcParens: s("LeetCode: Valid Parentheses", "https://leetcode.com/problems/valid-parentheses/"),
  lcTemps: s("LeetCode: Daily Temperatures", "https://leetcode.com/problems/daily-temperatures/"),
};

const { L, Q, C } = lessonWriter("dsa");
const TP = "Two pointers and sliding window";
const SQ = "Stacks and queues";

// ───────────────────────── Two pointers and sliding window ─────────────────────────

L("dsa2-two-pointers", TP, "Two pointers from both ends", "On sorted data or symmetric checks, move a left and a right pointer towards each other to replace an all-pairs search.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-sorting", "dsa2-hashmap"],
  hook: "The array is sorted and you need a pair that sums to a target, using O(1) extra memory. Which pointer do you move when the sum is too small?",
  intuition: `
**The situation.** A pair search over all $(i, j)$ is $O(n^2)$. When the data is sorted (or you can sort it), or the question is symmetric like a palindrome check, you can do better.

**The idea.** Put \`l\` at the start and \`r\` at the end. Look at the pair, then move the pointer whose move can only help:

- Sum too small → move \`l\` right (the only way to increase it).
- Sum too big → move \`r\` left.
- Each step discards a whole row or column of the pair grid, so the loop runs at most $n$ times.

**Recognise it** when the input is sorted or sortable, you need a pair (or a triple: fix one, two-pointer the rest), or you compare characters from both ends.
`,
  maths: `
**In one breath.** \`l, r = 0, n − 1\`; while \`l < r\`: compare, move the pointer that can fix the comparison; $O(n)$ after an $O(n\\log n)$ sort; $O(1)$ extra space.

**Template.**

\`\`\`python
def pair_with_sum(a, target):        # a is sorted ascending
    l, r = 0, len(a) - 1
    while l < r:
        s = a[l] + a[r]
        if s == target:
            return l, r
        if s < target:
            l += 1                   # need a bigger sum
        else:
            r -= 1                   # need a smaller sum
    return None
\`\`\`

**Worked problem 1: widest water container.** Heights \`h\`; the area between $i < j$ is $(j - i)\\cdot\\min(h_i, h_j)$. Find the maximum.

\`\`\`python
def max_area(h):
    l, r, best = 0, len(h) - 1, 0
    while l < r:
        best = max(best, (r - l) * min(h[l], h[r]))
        if h[l] < h[r]:
            l += 1                   # the shorter wall limits every pair it's in
        else:
            r -= 1
    return best
max_area([1, 8, 6, 2, 5, 4, 8, 3, 7])   # 49
\`\`\`

Why it's safe: if \`h[l]\` is the shorter wall, every pair \`(l, k)\` with \`k < r\` is narrower and no taller, so \`l\` can be dropped. $O(n)$ time, $O(1)$ space.

**Worked problem 2: all unique triples summing to zero.** Sort, fix \`i\`, two-pointer the rest, skip duplicates.

\`\`\`python
def three_sum(nums):
    a, out = sorted(nums), []
    for i in range(len(a) - 2):
        if i and a[i] == a[i - 1]:
            continue                 # same first value: same triples
        l, r = i + 1, len(a) - 1
        while l < r:
            s = a[i] + a[l] + a[r]
            if s < 0: l += 1
            elif s > 0: r -= 1
            else:
                out.append((a[i], a[l], a[r]))
                l += 1
                while l < r and a[l] == a[l - 1]:
                    l += 1           # skip repeated second values
                r -= 1
    return out
three_sum([-1, 0, 1, 2, -1, -4])     # [(-1, -1, 2), (-1, 0, 1)]
\`\`\`

$O(n^2)$ time (better than $O(n^3)$), $O(1)$ extra apart from the output.

**Worked problem 3: palindrome ignoring punctuation.** Skip non-alphanumeric characters from both sides, compare lower-cased characters, stop at the first mismatch. $O(n)$ time, $O(1)$ space.

**Edge cases.** Empty or single-element input (loop never runs); duplicates in k-sum problems; \`l < r\` versus \`l <= r\` (a pair needs two distinct indices).
`,
  practice: `
**Signals:** "sorted array", "pair/triplet with sum", "closest sum", "palindrome", "reverse in place", "container/area between two lines", "squares of a sorted array".

**Variations.** 3Sum Closest (track the best gap), 4Sum (two fixed loops + two pointers, $O(n^3)$), counting pairs with sum < target (when \`a[l] + a[r] < t\`, all of \`l+1..r\` pair with \`l\`: add \`r − l\`).

**Practise:** Two Sum II (Input Array Is Sorted), Valid Palindrome, Container With Most Water, 3Sum, 3Sum Closest, Squares of a Sorted Array, Trapping Rain Water, Boats to Save People.
`,
  traps: [
    { trap: "Two pointers works on any array.", why: "The move rule relies on order: moving l right must increase the sum. On unsorted data, sort first (losing original indices) or use a hash map." },
    { trap: "In 3Sum, deduplicate by putting triples in a set at the end.", why: "That works but hides an O(n³)-style mindset and costs memory; skipping equal neighbours after sorting is the expected O(n²) answer." },
    { trap: "In Container With Most Water, move the taller wall to look for something better.", why: "Area is capped by the shorter wall, so moving the taller one can only shrink width without raising the cap. Always move the shorter one." },
  ],
  say: {
    prompt: "Explain how two pointers solves 'pair with target sum in a sorted array', and why it can't miss the answer.",
    secs: 45,
    check: ["Start at both ends; compare the sum with the target", "Too small → l += 1; too big → r −= 1", "Correctness: each move discards pairs that can't work", "O(n) time, O(1) space (plus O(n log n) if you must sort)", "Extends to 3Sum by fixing one element"],
    followups: [
      { q: "How do you count pairs with sum less than a target?", a: "Sort; when a[l] + a[r] < target, every index from l+1 to r pairs with l, so add r − l and move l; otherwise move r. O(n log n) overall." },
      { q: "Why is 3Sum O(n²) and not better?", a: "For each fixed first element you run an O(n) two-pointer scan, giving n × n. There's no known general approach that is much faster for this problem in practice." },
      { q: "When would you choose a hash map instead?", a: "When the array isn't sorted and you need original indices, or you can't afford to sort; hashing is O(n) time but O(n) space." },
    ],
    answer: `Because the array is sorted, I put one pointer at each end. If the pair sums to the target I'm done. If the sum is too small, the only way to increase it is to move the left pointer right; if it's too big, I move the right pointer left.

It can't miss the answer because each move rules out a whole set of pairs: when the sum is too small, the left element paired with anything at or before r is also too small, so it can be discarded. That's O(n) time and O(1) space. The same idea gives 3Sum in O(n²): sort, fix one element, and two-pointer the rest while skipping duplicates.`,
    avoid: ["Using two pointers on unsorted data without sorting", "Moving the taller wall in the container problem"],
  },
  terms: [["Opposite-end pointers", "l from the start, r from the end, moving inwards."], ["Pruning a pair grid", "Each pointer move discards a row or column of candidate pairs."], ["k-sum reduction", "Fix k − 2 elements, then two-pointer the last two."]],
  sources: [D.twoSum, D.bigO],
});
Q({ id: "dsa2-tp-1", d: 1, secs: 45, prompt: "Maximum container area for heights [1, 8, 6, 2, 5, 4, 8, 3, 7]?", answer: 49, tol: 0.5, explain: "Walls at indices 1 and 8: width 7 × height 7 = 49.", py: "h = [1,8,6,2,5,4,8,3,7]\nl, r, b = 0, len(h)-1, 0\nwhile l < r:\n    b = max(b, (r-l)*min(h[l], h[r]))\n    if h[l] < h[r]: l += 1\n    else: r -= 1\nanswer = b" });
Q({ id: "dsa2-tp-2", d: 2, secs: 60, prompt: "How many unique triples (as value sets) in [−1, 0, 1, 2, −1, −4] sum to 0?", answer: 2, tol: 0.5, explain: "(−1, −1, 2) and (−1, 0, 1).", py: "a = sorted([-1,0,1,2,-1,-4]); out = set()\nfor i in range(len(a)-2):\n    l, r = i+1, len(a)-1\n    while l < r:\n        s = a[i]+a[l]+a[r]\n        if s < 0: l += 1\n        elif s > 0: r -= 1\n        else: out.add((a[i],a[l],a[r])); l += 1; r -= 1\nanswer = len(out)" });
Q({ id: "dsa2-tp-3", d: 2, secs: 60, prompt: "Sorted a = [1, 2, 3, 4, 5, 6]. How many pairs i < j have a[i] + a[j] < 7?", answer: 6, tol: 0.5, explain: "(1,2) (1,3) (1,4) (1,5) (2,3) (2,4): with two pointers add r − l whenever the sum is small enough.", py: "a = [1,2,3,4,5,6]; l, r, c = 0, 5, 0\nwhile l < r:\n    if a[l]+a[r] < 7: c += r-l; l += 1\n    else: r -= 1\nanswer = c" });
Q({ id: "dsa2-tp-4", d: 1, secs: 30, prompt: "Sorted array, sum of a[l] + a[r] is larger than the target. What should you do?", options: ["l += 1", "r −= 1", "Move both pointers", "Restart from the middle"], answer: 1, explain: "Moving r left is the only move that can decrease the sum.", py: "a = [1,3,5,9]; l, r, t = 0, 3, 8\nanswer = 1 if a[l] + a[r-1] < a[l] + a[r] else 0" });
C("dsa2-tp-c1", "Opposite-end two pointers", "Sorted: sum < target → l += 1; sum > target → r −= 1. O(n), O(1) space.");
C("dsa2-tp-c2", "3Sum", "Sort, fix i, two-pointer l..r, skip equal neighbours. O(n²).");

L("dsa2-read-write-pointers", TP, "Same-direction pointers and in-place edits", "A slow 'write' pointer and a fast 'read' pointer to filter, deduplicate, partition and merge arrays in place.", {
  kind: "concept", mins: 20, mathsLabel: "Code", prereq: ["dsa2-two-pointers"],
  hook: "Remove duplicates from a sorted array in place and return the new length, using no extra list. Where does each kept element go?",
  intuition: `
**The situation.** OA problems often say "in place" or "O(1) extra space": remove an element, compact duplicates, move zeros to the end, partition by colour.

**The idea.** Two pointers moving the same way. \`read\` visits every element; \`write\` marks where the next kept element should go. Everything before \`write\` is the finished answer.

- **Filter / compact:** if \`a[read]\` should be kept, copy it to \`a[write]\` and advance \`write\`.
- **Partition into three groups** (Dutch national flag): three pointers \`lo\`, \`mid\`, \`hi\`.
- **Merge into a buffer from the back:** fill from the end so you never overwrite unread data.
`,
  maths: `
**In one breath.** \`w = 0\`; for each \`x\`: if keep(x): \`a[w] = x; w += 1\`; answer is \`a[:w]\`; $O(n)$ time, $O(1)$ space.

**Template.**

\`\`\`python
def compact(a, keep):
    w = 0
    for x in a:                  # read pointer is the loop
        if keep(x):
            a[w] = x
            w += 1
    return w                     # a[:w] is the result
\`\`\`

**Worked problem 1: dedupe a sorted array, allowing each value at most twice.**

\`\`\`python
def dedupe_at_most_two(a):
    w = 0
    for x in a:
        if w < 2 or x != a[w - 2]:   # compare with the element two slots back in the OUTPUT
            a[w] = x
            w += 1
    return w
a = [1, 1, 1, 2, 2, 3]
dedupe_at_most_two(a)            # 5 -> a[:5] == [1, 1, 2, 2, 3]
\`\`\`

Set the 2 to 1 for the classic "each value once" version.

**Worked problem 2: three-way partition (sort 0s, 1s, 2s in one pass).**

\`\`\`python
def sort_colours(a):
    lo, mid, hi = 0, 0, len(a) - 1
    while mid <= hi:
        if a[mid] == 0:
            a[lo], a[mid] = a[mid], a[lo]; lo += 1; mid += 1
        elif a[mid] == 1:
            mid += 1
        else:
            a[mid], a[hi] = a[hi], a[mid]; hi -= 1   # don't advance mid: new a[mid] is unchecked
    return a
sort_colours([2, 0, 2, 1, 1, 0])  # [0, 0, 1, 1, 2, 2]
\`\`\`

**Worked problem 3: merge sorted \`b\` into sorted \`a\`, which has room at the end.** Fill from the back with pointers at the last real element of each and a write pointer at the very end; when \`b\` runs out, the rest of \`a\` is already in place. $O(m + n)$ time, $O(1)$ extra.

**Edge cases.** Empty array (return 0); all elements kept or all removed; in the colour sort, the swapped-in element from \`hi\` must be examined before moving on.
`,
  practice: `
**Signals:** "in place", "O(1) extra space", "return the new length", "move all X to the end", "keep relative order", "partition around a pivot".

**Variations.** Move Zeroes (keep non-zeros, then fill zeros); Remove Element; Is Subsequence (pointer in the short string advances on a match); squares of a sorted array (fill from the back with opposite-end pointers); fast/slow pointers on linked lists (later module).

**Practise:** Remove Duplicates from Sorted Array (I and II), Remove Element, Move Zeroes, Sort Colors, Merge Sorted Array, Is Subsequence, Partition Labels.
`,
  traps: [
    { trap: "In the 'at most twice' dedupe, compare x with a[read − 2].", why: "Compare with the output, a[w − 2]. The input slots behind read may already have been overwritten." },
    { trap: "In the Dutch flag partition, advance mid after swapping with hi.", why: "The element swapped in from hi hasn't been looked at yet. Advance mid only after the 0 and 1 cases." },
    { trap: "Merge two sorted arrays in place from the front.", why: "Writing from the front overwrites elements of a you haven't read. Fill from the back, where the free space is." },
  ],
  say: {
    prompt: "Remove duplicates from a sorted array in place so each value appears at most twice. Walk through your approach.",
    secs: 45,
    check: ["Write pointer w marks the end of the kept prefix", "Keep x if w < 2 or x differs from a[w − 2]", "Compare against the output, not the input", "O(n) time, O(1) extra space", "Return w; the caller reads a[:w]"],
    followups: [
      { q: "How would you generalise to at most k copies?", a: "Keep x if w < k or x != a[w − k]. The sorted order guarantees that if a[w − k] equals x, the last k kept values are all x." },
      { q: "How do you move zeros to the end while keeping the order of the rest?", a: "Compact all non-zeros to the front with a write pointer, then fill a[w:] with zeros. O(n) time, O(1) space, stable for non-zeros." },
      { q: "What's the invariant in the three-way partition?", a: "a[:lo] are 0s, a[lo:mid] are 1s, a[mid:hi+1] are unknown, a[hi+1:] are 2s. The loop shrinks the unknown region by one each step." },
    ],
    answer: `I use a read pointer that scans every element and a write pointer w marking the end of the kept prefix. Because the array is sorted, duplicates are adjacent, so I keep x if fewer than two elements have been written or if x differs from a[w − 2], the element two places back in the output. If it equals that, there are already two copies.

Each kept element is copied to a[w] and w advances. At the end the first w slots hold the answer. It's one pass, O(n) time and O(1) extra space. The comparison must be against the output, not the input, because input slots behind the read pointer may have been overwritten.`,
    avoid: ["Building a new list when O(1) space was asked", "Comparing against input positions that were overwritten"],
  },
  terms: [["Write pointer", "Index of the next free slot in the output prefix."], ["Stable", "Kept elements stay in their original relative order."], ["Dutch national flag", "One-pass three-way partition with lo, mid, hi pointers."]],
  sources: [S.dutch, D.bigO],
});
Q({ id: "dsa2-rw-1", d: 1, secs: 45, prompt: "Remove duplicates in place (each value once) from [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]. What length is returned?", answer: 5, tol: 0.5, explain: "Kept prefix [0, 1, 2, 3, 4].", py: "a = [0,0,1,1,1,2,2,3,3,4]; w = 0\nfor x in a:\n    if w < 1 or x != a[w-1]:\n        a[w] = x; w += 1\nanswer = w" });
Q({ id: "dsa2-rw-2", d: 2, secs: 60, prompt: "Allow each value at most twice: [0, 0, 1, 1, 1, 1, 2, 3, 3]. New length?", answer: 7, tol: 0.5, explain: "[0, 0, 1, 1, 2, 3, 3].", py: "a = [0,0,1,1,1,1,2,3,3]; w = 0\nfor x in a:\n    if w < 2 or x != a[w-2]:\n        a[w] = x; w += 1\nanswer = w" });
Q({ id: "dsa2-rw-3", d: 2, secs: 60, prompt: "After Move Zeroes (stable) on [0, 1, 0, 3, 12], what is the value at index 2?", answer: 12, tol: 0.5, explain: "[1, 3, 12, 0, 0].", py: "a = [0,1,0,3,12]; w = 0\nfor x in a:\n    if x != 0:\n        a[w] = x; w += 1\nfor i in range(w, len(a)): a[i] = 0\nanswer = a[2]" });
Q({ id: "dsa2-rw-4", d: 2, secs: 60, prompt: "Three-way partition of [2, 0, 2, 1, 1, 0] with lo/mid/hi. How many swaps with hi happen?", answer: 2, tol: 0.5, explain: "Each 2 seen at mid is swapped with hi once; there are two 2s and both are found at mid.", py: "a = [2,0,2,1,1,0]; lo = mid = 0; hi = len(a)-1; c = 0\nwhile mid <= hi:\n    if a[mid] == 0:\n        a[lo], a[mid] = a[mid], a[lo]; lo += 1; mid += 1\n    elif a[mid] == 1: mid += 1\n    else:\n        a[mid], a[hi] = a[hi], a[mid]; hi -= 1; c += 1\nanswer = c" });
C("dsa2-rw-c1", "In-place compaction", "w = 0; for x: if keep(x): a[w] = x; w += 1. Result a[:w].");
C("dsa2-rw-c2", "Merge into a buffer", "Fill from the back so unread elements are never overwritten.");

L("dsa2-fixed-window", TP, "Fixed-size sliding window", "Maintain a running sum or count over every window of length k by adding the new element and removing the old one.", {
  kind: "concept", mins: 20, mathsLabel: "Code", prereq: ["dsa2-prefix-sums"],
  hook: "Find the best average over any 7 consecutive days in a year of sales. Recomputing each window costs 7 × 365 additions. What do you really need to change per step?",
  intuition: `
**The situation.** "Every subarray of length k", "every block of k days", "every substring of length m": recomputing each window from scratch is $O(n\\cdot k)$.

**The idea.** Adjacent windows share $k - 1$ elements. When the window slides one step, **add** the element entering on the right and **remove** the one leaving on the left. Keep whatever summary the question needs: a sum, a Counter of characters, a count of vowels.

**Recognise it** when the length of the window is fixed by the problem statement (k, the length of a pattern, a time span).
`,
  maths: `
**In one breath.** Build the first window; then for \`i\` from \`k\` to \`n − 1\`: add \`a[i]\`, remove \`a[i − k]\`, update the answer; $O(n)$ time, $O(1)$ or $O(\\text{alphabet})$ space.

**Template.**

\`\`\`python
def best_window_sum(a, k):
    cur = sum(a[:k])
    best = cur
    for i in range(k, len(a)):
        cur += a[i] - a[i - k]       # enter a[i], leave a[i-k]
        best = max(best, cur)
    return best
best_window_sum([1, 12, -5, -6, 50, 3], 4)   # 51  -> average 12.75
\`\`\`

**Worked problem 1: start indices of anagrams of a pattern.** Keep a Counter for the window and compare it with the pattern's Counter.

\`\`\`python
from collections import Counter
def anagram_starts(s, p):
    k, need, win, out = len(p), Counter(p), Counter(), []
    for i, ch in enumerate(s):
        win[ch] += 1
        if i >= k:
            old = s[i - k]
            win[old] -= 1
            if win[old] == 0:
                del win[old]         # keep equality checks honest
        if win == need:
            out.append(i - k + 1)
    return out
anagram_starts("cbaebabacd", "abc")   # [0, 6]
\`\`\`

Each comparison is $O(26)$ for lowercase letters, so $O(n)$ overall.

**Worked problem 2: maximum vowels in any substring of length k.** Keep a count: add 1 if the entering character is a vowel, subtract 1 if the leaving one was. \`"abciiidef"\`, k = 3 → 3 (\`"iii"\`).

**Worked problem 3: number of windows meeting a threshold.** Count windows of length k whose sum ≥ \`k × threshold\` (compare sums, not floating averages).

**Edge cases.** $k > n$ (no window: return 0 or as specified); $k = n$ (one window); negative numbers (fine: the sum is updated, not assumed to grow).
`,
  practice: `
**Signals:** "subarray/substring of length k", "every k consecutive", "permutation/anagram of a pattern inside a string", "moving average".

**Variations.** Max of every window needs a monotonic deque (next module), not just a sum. Distinct elements in every window: Counter plus a count of keys. 2-D: fixed-size rectangle sums via 2-D prefix sums.

**Practise:** Maximum Average Subarray I, Find All Anagrams in a String, Permutation in String, Maximum Number of Vowels in a Substring of Given Length, Number of Sub-arrays of Size K and Average ≥ Threshold, Grumpy Bookstore Owner.
`,
  traps: [
    { trap: "Compare Counters without deleting zero counts.", why: "Counter equality ignores zero counts in Python 3.10+, but older versions and plain dicts don't. Deleting keys that reach 0 is safe everywhere and makes len(win) the number of distinct items." },
    { trap: "Compute averages as floats and compare with a threshold.", why: "Float rounding can flip borderline comparisons. Compare the integer sum with k × threshold." },
    { trap: "Recompute sum(a[i:i+k]) each step: it's still one loop.", why: "Each slice and sum is O(k), so the total is O(n·k). Update incrementally." },
  ],
  say: {
    prompt: "Find all start indices where an anagram of p appears in s. Explain your approach and complexity.",
    secs: 45,
    check: ["Window length is fixed at len(p)", "Counter for p and for the current window", "Add the entering character, remove the leaving one, delete zeros", "Compare counts each step: O(alphabet)", "O(n) overall; edge case len(p) > len(s)"],
    followups: [
      { q: "How do you avoid comparing whole Counters each step?", a: "Track 'matches', the number of characters whose window count equals the needed count; update it only for the two characters that change. A full match is matches == number of distinct characters in p." },
      { q: "What changes if the window size isn't given?", a: "Then it's a variable window: grow the right edge, shrink the left while a condition is violated, and record the best valid window." },
      { q: "How would you compute the maximum in every window of size k?", a: "A monotonic deque of indices with decreasing values: pop smaller values from the back, pop the front when it leaves the window; the front is the max. O(n) total." },
    ],
    answer: `The window has a fixed length, len(p), so I slide it across s one character at a time. I keep a Counter of p and a Counter of the current window. At each step I add the entering character and remove the leaving one, deleting a key when its count hits zero. If the two Counters are equal, the window is an anagram and I record its start.

Each step does constant work plus a comparison bounded by the alphabet size, so the whole thing is O(n) time for lowercase letters, and O(alphabet) space. If p is longer than s there are no windows and I return an empty list.`,
    avoid: ["Sorting every substring (O(n·k log k))", "Forgetting to remove the leaving character"],
  },
  terms: [["Fixed window", "A window whose length k is set by the problem."], ["Incremental update", "Add the entering element, remove the leaving one."], ["Window summary", "Whatever state the question needs: sum, Counter, count."]],
  sources: [D.coll, D.bigO],
});
Q({ id: "dsa2-fw-1", d: 1, secs: 45, prompt: "Maximum sum of any 4 consecutive elements of [1, 12, −5, −6, 50, 3]?", answer: 51, tol: 0.5, explain: "12 − 5 − 6 + 50 = 51.", py: "a = [1,12,-5,-6,50,3]; k = 4\ncur = sum(a[:k]); b = cur\nfor i in range(k, len(a)):\n    cur += a[i]-a[i-k]; b = max(b, cur)\nanswer = b" });
Q({ id: "dsa2-fw-2", d: 2, secs: 60, prompt: "How many start indices in 'abab' begin an anagram of 'ab'?", answer: 3, tol: 0.5, explain: "Indices 0 ('ab'), 1 ('ba'), 2 ('ab').", py: "from collections import Counter\ns, p = 'abab', 'ab'; k = len(p)\nanswer = sum(Counter(s[i:i+k]) == Counter(p) for i in range(len(s)-k+1))" });
Q({ id: "dsa2-fw-3", d: 1, secs: 45, prompt: "Maximum number of vowels in any substring of length 3 of 'leetcode'?", answer: 2, tol: 0.5, explain: "'lee', 'eet' and 'ode' each have 2.", py: "s, k = 'leetcode', 3\nv = set('aeiou')\ncur = sum(c in v for c in s[:k]); b = cur\nfor i in range(k, len(s)):\n    cur += (s[i] in v) - (s[i-k] in v); b = max(b, cur)\nanswer = b" });
Q({ id: "dsa2-fw-4", d: 2, secs: 60, prompt: "a = [2, 2, 2, 2, 5, 5, 5, 8], k = 3. How many windows of length 3 have average ≥ 4?", answer: 3, tol: 0.5, explain: "Window sums 6, 6, 9, 12, 15, 18: those ≥ 12 are 12, 15, 18.", py: "a = [2,2,2,2,5,5,5,8]; k, t = 3, 4\nanswer = sum(sum(a[i:i+k]) >= k*t for i in range(len(a)-k+1))" });
C("dsa2-fw-c1", "Fixed window step", "cur += a[i] − a[i − k]; update best. O(n).");
C("dsa2-fw-c2", "Anagram windows", "Counter of window vs Counter of pattern; delete keys at 0.");

L("dsa2-variable-window", TP, "Variable-size sliding window", "Grow the right edge, shrink the left edge while the window breaks a rule, and record the longest or shortest valid window.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-fixed-window"],
  hook: "Longest substring without a repeated character, in one pass. When the new character is a repeat, how far must the left edge jump?",
  intuition: `
**The situation.** "Longest substring with at most k distinct characters", "shortest subarray with sum ≥ target", "longest run of 1s if you may flip k zeros". The window length isn't given; you have to find it.

**The idea.** Two pointers that both move forward only. \`r\` extends the window one element at a time. Whenever the window breaks the rule, move \`l\` forward until it's valid again. Each element enters once and leaves once, so the total work is $O(n)$ even though there's a loop inside a loop.

**When it works.** The rule must be **monotonic**: if a window is valid, every smaller window inside it is valid too (or for "shortest", if a window satisfies the goal, every larger one does). Non-negative numbers and "at most k" constraints have this property; sums with negative numbers don't.

- **Longest valid:** shrink while invalid, then record \`r − l + 1\`.
- **Shortest satisfying:** while the window satisfies the goal, record and shrink.
`,
  maths: `
**In one breath.** \`for r in range(n)\`: add \`a[r]\`; \`while invalid: remove a[l]; l += 1\`; record; $O(n)$ because \`l\` and \`r\` each move at most $n$ times.

**Template (longest valid window).**

\`\`\`python
def longest_valid(a, add, remove, invalid):
    l = best = 0
    for r, x in enumerate(a):
        add(x)
        while invalid():
            remove(a[l])
            l += 1
        best = max(best, r - l + 1)
    return best
\`\`\`

**Worked problem 1: longest substring with no repeated character.** Store the last index of each character and jump \`l\` past the previous occurrence.

\`\`\`python
def longest_unique(s):
    last, l, best = {}, 0, 0
    for r, ch in enumerate(s):
        if ch in last and last[ch] >= l:   # repeat inside the current window
            l = last[ch] + 1
        last[ch] = r
        best = max(best, r - l + 1)
    return best
longest_unique("abcabcbb")   # 3 ("abc")
longest_unique("abba")       # 2 -- the >= l check stops l moving backwards
\`\`\`

**Worked problem 2: shortest subarray with sum ≥ target (positive numbers).**

\`\`\`python
def shortest_at_least(a, target):
    l, cur, best = 0, 0, float("inf")
    for r, x in enumerate(a):
        cur += x
        while cur >= target:             # goal met: record, then try shorter
            best = min(best, r - l + 1)
            cur -= a[l]
            l += 1
    return 0 if best == float("inf") else best
shortest_at_least([2, 3, 1, 2, 4, 3], 7)   # 2 ([4, 3])
\`\`\`

**Worked problem 3: longest run of 1s with at most k zeros flipped.** Count zeros in the window; shrink while zeros > k.

\`\`\`python
def longest_ones(a, k):
    l = zeros = best = 0
    for r, x in enumerate(a):
        zeros += x == 0
        while zeros > k:
            zeros -= a[l] == 0
            l += 1
        best = max(best, r - l + 1)
    return best
longest_ones([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2)   # 6
\`\`\`

**Edge cases.** Empty input; no valid window (return 0, not infinity); negative numbers (the method breaks: use prefix sums with a sorted structure or a monotonic deque).
`,
  practice: `
**Signals:** "longest/shortest substring or subarray such that…", "at most k distinct/zeros/replacements", "sum at least target" with positive values, "contains all characters of…".

**Variations.** Longest Repeating Character Replacement (valid while window length − max frequency ≤ k); Fruit Into Baskets (at most 2 distinct); Minimum Window Substring (shortest containing all of t; next lesson).

**Practise:** Longest Substring Without Repeating Characters, Minimum Size Subarray Sum, Max Consecutive Ones III, Longest Repeating Character Replacement, Fruit Into Baskets, Longest Substring with At Most K Distinct Characters, Maximum Erasure Value.
`,
  traps: [
    { trap: "Use a sliding window for the shortest subarray with sum ≥ k when values can be negative.", why: "Shrinking can increase the sum when you drop a negative number, so the monotonic rule fails. Use prefix sums with a monotonic deque instead." },
    { trap: "In longest-unique-substring, set l = last[ch] + 1 unconditionally.", why: "If the previous occurrence is before l, this moves l backwards ('abba'). Only jump when last[ch] ≥ l, or take max(l, last[ch] + 1)." },
    { trap: "The inner while loop makes it O(n²).", why: "l only moves forward and never past r, so across the whole run it moves at most n times. Total O(n)." },
  ],
  say: {
    prompt: "Find the longest substring without repeating characters. Explain the approach and why it's linear.",
    secs: 45,
    check: ["Window [l, r] with no repeats", "Dict of last index per character", "On a repeat inside the window, jump l to last + 1", "Guard against moving l backwards", "O(n) time, O(alphabet) space; each pointer moves forward only"],
    followups: [
      { q: "How would you adapt it to 'at most k distinct characters'?", a: "Keep a Counter of the window; after adding s[r], while len(counter) > k, decrement s[l] (deleting at zero) and advance l; record r − l + 1." },
      { q: "Why does sliding window fail with negative numbers for sum problems?", a: "Validity must be monotonic: growing the window should only push the sum one way. With negatives, adding or removing an element can move the sum either way, so you can't decide when to shrink." },
      { q: "How do you solve Longest Repeating Character Replacement?", a: "Window is valid while its length minus the highest character frequency in it is ≤ k; grow r, shrink l when invalid. You can keep the historical max frequency without decreasing it, since only a bigger max can give a longer answer." },
    ],
    answer: `I keep a window from l to r that has no repeated characters, and a dict with the last index of each character. For each new character at r, if it was last seen inside the window, at an index of at least l, I move l to one past that index. Then I record the character's index and update the best length r − l + 1.

The check that the last index is at least l matters: otherwise a stale occurrence, as in 'abba', would move l backwards. Both pointers only move forward, so the whole scan is O(n) time, with O(alphabet) space for the dict.`,
    avoid: ["Checking every substring (O(n³) or O(n²))", "Letting l move backwards"],
  },
  terms: [["Variable window", "Window whose size changes: grow right, shrink left."], ["Monotonic validity", "If a window is valid, every sub-window is too (or the reverse for 'shortest')."], ["Amortised O(n)", "Each pointer moves at most n times in total."]],
  sources: [S.lcLongest, D.coll],
});
Q({ id: "dsa2-vw-1", d: 1, secs: 45, prompt: "Length of the longest substring without repeating characters in 'pwwkew'?", answer: 3, tol: 0.5, explain: "'wke'.", py: "s = 'pwwkew'; last, l, b = {}, 0, 0\nfor r, ch in enumerate(s):\n    if ch in last and last[ch] >= l: l = last[ch]+1\n    last[ch] = r; b = max(b, r-l+1)\nanswer = b" });
Q({ id: "dsa2-vw-2", d: 2, secs: 60, prompt: "Shortest subarray of [1, 4, 4] with sum ≥ 4? And of [2, 3, 1, 2, 4, 3] with sum ≥ 7? Give the sum of the two lengths.", answer: 3, tol: 0.5, explain: "[4] has length 1; [4, 3] has length 2.", py: "def f(a, t):\n    l, cur, b = 0, 0, float('inf')\n    for r, x in enumerate(a):\n        cur += x\n        while cur >= t:\n            b = min(b, r-l+1); cur -= a[l]; l += 1\n    return 0 if b == float('inf') else b\nanswer = f([1,4,4],4) + f([2,3,1,2,4,3],7)" });
Q({ id: "dsa2-vw-3", d: 2, secs: 60, prompt: "Longest run of 1s in [0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1] if you may flip at most 3 zeros?", answer: 10, tol: 0.5, explain: "Indices 2–11 contain exactly 3 zeros: length 10.", py: "a = [0,0,1,1,0,0,1,1,1,0,1,1,0,0,0,1,1,1,1]; k = 3\nl = z = b = 0\nfor r, x in enumerate(a):\n    z += x == 0\n    while z > k:\n        z -= a[l] == 0; l += 1\n    b = max(b, r-l+1)\nanswer = b" });
Q({ id: "dsa2-vw-4", d: 2, secs: 60, prompt: "Longest substring of 'eceba' with at most 2 distinct characters?", answer: 3, tol: 0.5, explain: "'ece'.", py: "from collections import Counter\ns, k = 'eceba', 2; c = Counter(); l = b = 0\nfor r, ch in enumerate(s):\n    c[ch] += 1\n    while len(c) > k:\n        c[s[l]] -= 1\n        if c[s[l]] == 0: del c[s[l]]\n        l += 1\n    b = max(b, r-l+1)\nanswer = b" });
Q({ id: "dsa2-vw-5", d: 1, secs: 30, prompt: "Which problem can a plain grow/shrink sliding window NOT solve correctly?", options: ["Longest substring with at most k distinct characters", "Shortest subarray with sum ≥ k, values may be negative", "Longest run of 1s with k flips", "Shortest subarray with sum ≥ k, values positive"], answer: 1, explain: "Negative values break monotonic validity: on [1, −1, 5] with target 5 the window reports 3, but [5] alone has length 1.", py: "a = [1,-1,5]; t = 5\nl, cur, b = 0, 0, 99\nfor r, x in enumerate(a):\n    cur += x\n    while cur >= t:\n        b = min(b, r-l+1); cur -= a[l]; l += 1\ntrue = min(j-i for i in range(3) for j in range(i+1, 4) if sum(a[i:j]) >= t)\nanswer = 1 if b != true else 0" });
C("dsa2-vw-c1", "Variable window loop", "for r: add a[r]; while invalid: remove a[l], l += 1; record r − l + 1.");
C("dsa2-vw-c2", "When sliding window applies", "Validity must be monotonic: non-negative values, 'at most k' rules.");

L("dsa2-window-counting", TP, "Counting windows and minimum covering window", "Counting valid subarrays with r − l + 1, 'exactly k' as atMost(k) − atMost(k − 1), and the shortest window that covers a set of characters.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-variable-window"],
  hook: "Count the subarrays with exactly 2 distinct numbers. The window for 'exactly' isn't monotonic. What do you count instead?",
  intuition: `
**The situation.** Some window questions ask "how many subarrays…?" rather than "longest". Others ask for the shortest window that contains every character of a pattern.

**The idea, part 1: count by right edge.** In a valid window \`[l, r]\` where validity is monotonic, every subarray ending at \`r\` and starting at \`l..r\` is valid: that's \`r − l + 1\` new subarrays. Sum over \`r\`.

**Part 2: exactly = at most − at most.** "Exactly k distinct" isn't monotonic (removing an element can make it k − 1), but "at most k" is. So $\\text{exactly}(k) = \\text{atMost}(k) - \\text{atMost}(k-1)$.

**Part 3: minimum covering window.** Grow \`r\` until the window contains everything needed; then shrink \`l\` as far as possible while it still covers, recording the shortest. Track how many characters are still "missing" so the check is $O(1)$.
`,
  maths: `
**In one breath.** Count: \`ans += r − l + 1\` after shrinking; exactly-k: \`atMost(k) − atMost(k − 1)\`; cover: \`missing\` counter, shrink while \`missing == 0\`.

**Template: count subarrays satisfying a monotonic rule.**

\`\`\`python
from collections import Counter
def at_most_k_distinct(a, k):
    cnt, l, total = Counter(), 0, 0
    for r, x in enumerate(a):
        cnt[x] += 1
        while len(cnt) > k:
            cnt[a[l]] -= 1
            if cnt[a[l]] == 0:
                del cnt[a[l]]
            l += 1
        total += r - l + 1           # subarrays ending at r
    return total

def exactly_k_distinct(a, k):
    return at_most_k_distinct(a, k) - at_most_k_distinct(a, k - 1)
exactly_k_distinct([1, 2, 1, 2, 3], 2)   # 7
\`\`\`

**Worked problem 1: subarrays with product < k (positive numbers).**

\`\`\`python
def product_less_than(a, k):
    if k <= 1:
        return 0
    prod, l, total = 1, 0, 0
    for r, x in enumerate(a):
        prod *= x
        while prod >= k:
            prod //= a[l]
            l += 1
        total += r - l + 1
    return total
product_less_than([10, 5, 2, 6], 100)    # 8
\`\`\`

**Worked problem 2: shortest window of s containing all characters of t (with multiplicity).**

\`\`\`python
from collections import Counter
def min_window(s, t):
    need, missing = Counter(t), len(t)
    l, best = 0, (float("inf"), 0, 0)
    for r, ch in enumerate(s):
        if need[ch] > 0:
            missing -= 1             # this character was still needed
        need[ch] -= 1                # may go negative: surplus
        while missing == 0:
            if r - l + 1 < best[0]:
                best = (r - l + 1, l, r + 1)
            need[s[l]] += 1
            if need[s[l]] > 0:
                missing += 1         # removed something we needed
            l += 1
    return "" if best[0] == float("inf") else s[best[1]:best[2]]
min_window("ADOBECODEBANC", "ABC")   # "BANC"
\`\`\`

$O(|s| + |t|)$ time, $O(\\text{alphabet})$ space.

**Edge cases.** k = 0 for "at most" (returns 0); product with k ≤ 1 (no subarray qualifies); t longer than s (empty string); repeated characters in t (count multiplicity).
`,
  practice: `
**Signals:** "number of subarrays/substrings such that…", "exactly k", "contains all of", "smallest window covering".

**Variations.** Binary Subarrays With Sum (exactly S = atMost(S) − atMost(S − 1), or prefix sums), Count Number of Nice Subarrays (odd numbers → 1s), Number of Substrings Containing All Three Characters (count left extensions instead).

**Practise:** Subarray Product Less Than K, Subarrays with K Different Integers, Binary Subarrays With Sum, Count Number of Nice Subarrays, Minimum Window Substring, Number of Substrings Containing All Three Characters.
`,
  traps: [
    { trap: "Run a sliding window directly for 'exactly k distinct'.", why: "Exactly-k isn't monotonic, so you can't tell when to shrink. Count atMost(k) − atMost(k − 1)." },
    { trap: "In Minimum Window Substring, check validity by comparing Counters each step.", why: "That's O(alphabet) per step; a single 'missing' counter updated on the two changing characters keeps it O(1)." },
    { trap: "Count a valid window once.", why: "For counting, every start from l to r gives a valid subarray ending at r: add r − l + 1, not 1." },
  ],
  say: {
    prompt: "Count subarrays with exactly k distinct integers. Explain the trick and the complexity.",
    secs: 50,
    check: ["Exactly-k isn't monotonic; at-most-k is", "exactly(k) = atMost(k) − atMost(k − 1)", "atMost: shrink while distinct > k, add r − l + 1", "Counter with deletion at zero", "O(n) time, O(k) space"],
    followups: [
      { q: "Why add r − l + 1 rather than 1?", a: "Once [l, r] is valid and validity is monotonic, every subarray [i, r] with l ≤ i ≤ r is valid too. Those are the r − l + 1 new subarrays that end at r." },
      { q: "How would you count subarrays with sum exactly S in a 0/1 array?", a: "atMost(S) − atMost(S − 1) with a sum window, or prefix sums with a Counter (count prefixes equal to current − S). Both O(n)." },
      { q: "What is 'missing' in Minimum Window Substring?", a: "The number of characters of t (with multiplicity) not yet covered by the window. It drops when you add a still-needed character and rises when you remove one; the window covers t exactly when missing is 0." },
    ],
    answer: `A direct sliding window doesn't work for 'exactly k', because removing an element can drop the count below k, so validity isn't monotonic. 'At most k distinct' is monotonic, so I count that and subtract: exactly(k) = atMost(k) − atMost(k − 1).

For atMost, I grow r, add the element to a Counter, and while there are more than k distinct keys I remove from the left, deleting keys that reach zero. After shrinking, every subarray ending at r and starting anywhere from l to r is valid, so I add r − l + 1. Each call is O(n) time and O(k) space, so the total is O(n).`,
    avoid: ["Enumerating all subarrays (O(n²))", "Adding 1 per valid window when counting"],
  },
  terms: [["atMost trick", "exactly(k) = atMost(k) − atMost(k − 1)."], ["Count by right edge", "Valid [l, r] contributes r − l + 1 subarrays ending at r."], ["Missing counter", "Characters of the target still uncovered by the window."]],
  sources: [D.coll, D.hash],
});
Q({ id: "dsa2-wc-1", d: 2, secs: 60, prompt: "How many contiguous subarrays of [10, 5, 2, 6] have product < 100?", answer: 8, tol: 0.5, explain: "[10] [5] [2] [6] [10,5] [5,2] [2,6] [5,2,6].", py: "a = [10,5,2,6]; k = 100\np, l, t = 1, 0, 0\nfor r, x in enumerate(a):\n    p *= x\n    while p >= k:\n        p //= a[l]; l += 1\n    t += r-l+1\nanswer = t" });
Q({ id: "dsa2-wc-2", d: 2, secs: 60, prompt: "How many subarrays of [1, 2, 1, 2, 3] have exactly 2 distinct integers?", answer: 7, tol: 0.5, explain: "atMost(2) = 12, atMost(1) = 5: 12 − 5 = 7.", py: "from collections import Counter\ndef am(a, k):\n    c = Counter(); l = t = 0\n    for r, x in enumerate(a):\n        c[x] += 1\n        while len(c) > k:\n            c[a[l]] -= 1\n            if c[a[l]] == 0: del c[a[l]]\n            l += 1\n        t += r-l+1\n    return t\na = [1,2,1,2,3]\nanswer = am(a,2) - am(a,1)" });
Q({ id: "dsa2-wc-3", d: 2, secs: 60, prompt: "Length of the shortest substring of 'ADOBECODEBANC' that contains A, B and C?", answer: 4, tol: 0.5, explain: "'BANC'.", py: "from collections import Counter\ns, t = 'ADOBECODEBANC', 'ABC'\nneed = Counter(t); miss = len(t); l = 0; b = 99\nfor r, ch in enumerate(s):\n    if need[ch] > 0: miss -= 1\n    need[ch] -= 1\n    while miss == 0:\n        b = min(b, r-l+1)\n        need[s[l]] += 1\n        if need[s[l]] > 0: miss += 1\n        l += 1\nanswer = b" });
Q({ id: "dsa2-wc-4", d: 2, secs: 60, prompt: "Binary array [1, 0, 1, 0, 1]. How many subarrays sum to exactly 2?", answer: 4, tol: 0.5, explain: "[1,0,1] twice, [1,0,1,0], [0,1,0,1].", py: "a = [1,0,1,0,1]\nanswer = sum(sum(a[i:j]) == 2 for i in range(len(a)) for j in range(i+1, len(a)+1))" });
C("dsa2-wc-c1", "Exactly k", "exactly(k) = atMost(k) − atMost(k − 1); atMost adds r − l + 1 per r.");
C("dsa2-wc-c2", "Minimum window cover", "need Counter + missing; grow r until missing == 0, then shrink l and record.");

L("dsa2-window-practice", TP, "Two pointers and sliding window practice", "Classic pointer and window problems to talk through: approach, complexity, edge cases.", {
  kind: "interview", mins: 30, prereq: ["dsa2-two-pointers", "dsa2-read-write-pointers", "dsa2-fixed-window", "dsa2-variable-window", "dsa2-window-counting"],
  hook: "For each problem, name the pattern, state the loop invariant and the complexity in about a minute.",
}, [
  iq("Trapping Rain Water: given bar heights, how much water is trapped after rain?", "Water above bar i is min(max left, max right) − h[i]. Two pointers from both ends with running left_max and right_max: move the side with the smaller max, since that side's water level is decided. O(n) time, O(1) space. Alternatives: prefix/suffix max arrays (O(n) space) or a monotonic stack.", ["Water level = min of the two maxima minus height", "Two pointers, move the smaller-max side", "O(n) time, O(1) space", "Mention prefix-max or stack alternatives"]),
  iq("Longest Repeating Character Replacement: longest substring you can make all one letter with at most k replacements.", "Variable window. Track counts and the max frequency in the window; it's valid while (length − maxfreq) ≤ k. Grow r; if invalid, move l once. The max frequency needn't be decreased when shrinking, because only a larger max can produce a longer window. O(n) time, O(26) space.", ["Validity: length − max frequency ≤ k", "Grow/shrink window", "Why the stale max is safe", "O(n)"]),
  iq("Given a sorted array, return the squares in sorted order.", "The largest squares are at the ends (most negative or most positive). Opposite-end pointers compare |a[l]| and |a[r]|, write the larger square into the output from the back. O(n) time, O(n) output.", ["Largest squares at the ends", "Fill output from the back", "O(n) instead of O(n log n) sort"]),
  iq("Permutation in String: does s2 contain a permutation of s1?", "Fixed window of len(s1) over s2 with letter counts; compare to s1's counts (or keep a 'matches' counter of letters whose counts agree). O(|s2|) time, O(26) space. If len(s1) > len(s2), false.", ["Fixed window", "Count comparison or matches counter", "O(n)", "Length edge case"]),
  iq("Count subarrays with exactly k odd numbers.", "Map each number to 1 if odd else 0; it's 'subarrays with sum exactly k'. Either atMost(k) − atMost(k − 1) with a sum window, or prefix sums with a Counter (count prefixes equal to current − k, seeded {0: 1}). O(n) time.", ["Transform to 0/1", "atMost trick or prefix-sum counting", "Seed {0: 1} if prefix sums", "O(n)"]),
  iq("Boats to Save People: each boat holds at most two people and a weight limit; minimise boats.", "Sort weights; pair the heaviest with the lightest if they fit (l += 1), always send the heaviest (r −= 1), count boats. Greedy is safe: if the lightest can't ride with the heaviest, nobody can. O(n log n).", ["Sort", "Pair heaviest with lightest", "Exchange argument for correctness", "O(n log n)"]),
]);

// ───────────────────────── Stacks and queues ─────────────────────────

L("dsa2-stack", SQ, "Stacks: matching, parsing and undo", "Last-in-first-out with a Python list: bracket matching, evaluating expressions, nested decoding and a stack that reports its minimum.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-python-costs"],
  hook: "Check whether '({[]})' is balanced. When you meet a closing bracket, which opening bracket must it match?",
  intuition: `
**The situation.** Brackets, nested structures, undo history, "the most recent unmatched thing": the item you need next is the one you saw last.

**The idea.** A stack: push on the top, pop from the top, both $O(1)$. In Python use a list with \`append\` and \`pop()\`; \`stack[-1]\` peeks.

- **Matching:** push openers; a closer must match the top.
- **Evaluation:** push operands; an operator pops two and pushes the result.
- **Nesting:** on entering a level, push the current state; on leaving, pop it and combine.
- **Augmented stacks:** store extra info with each item (e.g. the minimum so far).
`,
  maths: `
**In one breath.** \`st = []\`; \`st.append(x)\`, \`st.pop()\`, \`st[-1]\`, \`if st:\`; push $O(1)$, pop $O(1)$; check \`st\` is empty before popping.

**Template: bracket matching.**

\`\`\`python
def balanced(s):
    pair = {')': '(', ']': '[', '}': '{'}
    st = []
    for ch in s:
        if ch in pair:                      # closer
            if not st or st.pop() != pair[ch]:
                return False
        else:
            st.append(ch)                   # opener
    return not st                           # leftovers are unmatched
balanced("({[]})")   # True
balanced("([)]")     # False
\`\`\`

**Worked problem 1: evaluate reverse Polish notation.**

\`\`\`python
def eval_rpn(tokens):
    st = []
    for t in tokens:
        if t in "+-*/":
            b, a = st.pop(), st.pop()       # b is the RIGHT operand
            if t == '+': st.append(a + b)
            elif t == '-': st.append(a - b)
            elif t == '*': st.append(a * b)
            else: st.append(int(a / b))     # truncate toward zero
        else:
            st.append(int(t))
    return st[0]
eval_rpn(["2", "1", "+", "3", "*"])         # 9
eval_rpn(["4", "13", "5", "/", "+"])        # 6
\`\`\`

**Worked problem 2: decode \`k[...]\` strings.** \`"3[a2[c]]"\` → \`"accaccacc"\`.

\`\`\`python
def decode(s):
    st, cur, num = [], "", 0
    for ch in s:
        if ch.isdigit():
            num = num * 10 + int(ch)        # multi-digit counts
        elif ch == '[':
            st.append((cur, num)); cur, num = "", 0
        elif ch == ']':
            prev, k = st.pop()
            cur = prev + cur * k
        else:
            cur += ch
    return cur
\`\`\`

**Worked problem 3: min stack.** Push pairs \`(value, min_so_far)\`; \`get_min\` reads \`st[-1][1]\`. All operations $O(1)$.

**Edge cases.** Popping an empty stack (return False / raise); leftover openers at the end; integer division toward zero in RPN (Python's \`//\` floors: \`-7 // 2 == -4\`).
`,
  practice: `
**Signals:** "valid parentheses", "nested", "evaluate expression", "undo/backspace", "simplify path", "most recent".

**Variations.** Backspace String Compare (stack or two pointers from the back), Simplify Path (split by '/', push names, pop on '..'), Basic Calculator (stack of signs), Asteroid Collision, Remove All Adjacent Duplicates.

**Practise:** Valid Parentheses, Min Stack, Evaluate Reverse Polish Notation, Decode String, Simplify Path, Backspace String Compare, Asteroid Collision, Minimum Remove to Make Valid Parentheses.
`,
  traps: [
    { trap: "In RPN, pop a then b and compute b − a.", why: "The first pop is the right operand. For '5 3 −', pop 3 (b) then 5 (a) and compute a − b = 2." },
    { trap: "Use // for division in expression problems.", why: "Python floors: −7 // 2 is −4. Problems usually want truncation toward zero: int(a / b)." },
    { trap: "Return True when the loop finishes without a mismatch.", why: "Unmatched openers remain on the stack ('(('); the string is balanced only if the stack is empty." },
  ],
  say: {
    prompt: "How do you check whether a string of brackets is valid, and what edge cases do you handle?",
    secs: 40,
    check: ["Stack of opening brackets", "A closer must match the popped top", "Empty stack on a closer → invalid", "Non-empty stack at the end → invalid", "O(n) time, O(n) space"],
    followups: [
      { q: "If there's only one bracket type, can you avoid the stack?", a: "Yes: keep a counter, +1 for '(' and −1 for ')'; it must never go negative and must end at 0. O(1) space." },
      { q: "How would you design a stack that returns its minimum in O(1)?", a: "Store (value, min so far) pairs, or keep a second stack of minimums pushed when a value ≤ the current min. Pop both together." },
      { q: "How do you find the minimum number of removals to make a string valid?", a: "Scan with a stack of indices of unmatched '('; on ')' pop if possible, otherwise mark it for removal; leftovers in the stack are also removed." },
    ],
    answer: `I scan the string with a stack. Opening brackets are pushed. For a closing bracket, the stack must be non-empty and the popped top must be the matching opener; otherwise the string is invalid. At the end the stack must be empty, because leftover openers were never closed.

Each character is pushed and popped at most once, so it's O(n) time and O(n) space in the worst case. The edge cases are a closer on an empty stack, leftovers at the end, and an empty string, which is valid. With a single bracket type a counter is enough.`,
    avoid: ["Counting each bracket type separately (fails on '([)]')", "Forgetting the final empty check"],
  },
  terms: [["LIFO", "Last in, first out."], ["Peek", "Read the top without removing it: st[-1]."], ["Augmented stack", "Each entry carries extra info such as the running minimum."]],
  sources: [D.stack, S.lcParens, S.minStack],
});
Q({ id: "dsa2-st-1", d: 1, secs: 45, prompt: "Evaluate the RPN expression ['4', '13', '5', '/', '+'] with division truncating toward zero.", answer: 6, tol: 0.5, explain: "13 / 5 → 2; 4 + 2 = 6.", py: "st = []\nfor t in ['4','13','5','/','+']:\n    if t in '+-*/':\n        b, a = st.pop(), st.pop()\n        st.append({'+': a+b, '-': a-b, '*': a*b, '/': int(a/b) if b else 0}[t])\n    else: st.append(int(t))\nanswer = st[0]" });
Q({ id: "dsa2-st-2", d: 1, secs: 45, prompt: "How many of these are balanced: '()[]{}', '(]', '([)]', '{[]}', '(('?", answer: 2, tol: 0.5, explain: "'()[]{}' and '{[]}'.", py: "def ok(s):\n    p = {')':'(', ']':'[', '}':'{'}; st = []\n    for ch in s:\n        if ch in p:\n            if not st or st.pop() != p[ch]: return False\n        else: st.append(ch)\n    return not st\nanswer = sum(ok(s) for s in ['()[]{}','(]','([)]','{[]}','(('])" });
Q({ id: "dsa2-st-3", d: 2, secs: 60, prompt: "Length of the decoded string for '2[ab3[c]]d'?", answer: 11, tol: 0.5, explain: "'abccc' twice is 10 characters, plus 'd'.", py: "def dec(s):\n    st, cur, num = [], '', 0\n    for ch in s:\n        if ch.isdigit(): num = num*10 + int(ch)\n        elif ch == '[': st.append((cur, num)); cur, num = '', 0\n        elif ch == ']':\n            prev, k = st.pop(); cur = prev + cur*k\n        else: cur += ch\n    return cur\nanswer = len(dec('2[ab3[c]]d'))" });
Q({ id: "dsa2-st-4", d: 1, secs: 30, prompt: "What is -7 // 2 in Python?", options: ["−3", "−4", "−3.5", "3"], answer: 1, explain: "Floor division rounds down. Use int(−7 / 2) = −3 for truncation.", py: "answer = [-3, -4, -3.5, 3].index(-7 // 2)" });
Q({ id: "dsa2-st-5", d: 2, secs: 60, prompt: "Min stack: push 5, push 2, push 7, pop, push 1, pop, pop. What is get_min() now?", answer: 5, tol: 0.5, explain: "Stack holds only 5.", py: "st = []\ndef push(x): st.append((x, min(x, st[-1][1]) if st else x))\npush(5); push(2); push(7); st.pop(); push(1); st.pop(); st.pop()\nanswer = st[-1][1]" });
C("dsa2-st-c1", "Bracket check", "Push openers; closer must match pop; stack empty at the end.");
C("dsa2-st-c2", "Min stack", "Push (value, min so far); get_min = st[−1][1]. All O(1).");

L("dsa2-monotonic-stack", SQ, "Monotonic stack", "Keep a stack whose values only increase (or decrease) to find the next greater or smaller element for every position in O(n).", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-stack"],
  hook: "For each day, how many days until a warmer one? Comparing each day with all later days is O(n²). What can you safely forget as you scan?",
  intuition: `
**The situation.** "Next greater element", "days until warmer", "nearest smaller to the left", "largest rectangle in a histogram", "stock span". Each position needs the nearest position on one side that beats it.

**The idea.** Scan once and keep a stack of indices still **waiting** for their answer. Their values are kept in order (decreasing for next-greater). When a new value arrives that beats the top, the top's answer is the new index: pop it and record. Keep popping while the new value beats the top, then push the new index.

An element that has been beaten can never be the answer for anyone further left, so it's safe to discard. Each index is pushed and popped once: $O(n)$.

- Next **greater** → keep a **decreasing** stack, pop while \`a[i] > a[top]\`.
- Next **smaller** → keep an **increasing** stack, pop while \`a[i] < a[top]\`.
`,
  maths: `
**In one breath.** \`for i, x in enumerate(a): while st and x > a[st[-1]]: ans[st.pop()] = i; st.append(i)\`; $O(n)$ time, $O(n)$ space.

**Template: next greater element to the right.**

\`\`\`python
def next_greater(a):
    ans = [-1] * len(a)
    st = []                          # indices; a[st] decreasing
    for i, x in enumerate(a):
        while st and x > a[st[-1]]:
            ans[st.pop()] = x        # x is the first greater value
        st.append(i)
    return ans
next_greater([2, 1, 2, 4, 3])        # [4, 2, 4, -1, -1]
\`\`\`

**Worked problem 1: days until a warmer day.**

\`\`\`python
def wait_days(t):
    ans, st = [0] * len(t), []
    for i, x in enumerate(t):
        while st and x > t[st[-1]]:
            j = st.pop()
            ans[j] = i - j           # distance, not value
        st.append(i)
    return ans
wait_days([73, 74, 75, 71, 69, 72, 76, 73])   # [1, 1, 4, 2, 1, 1, 0, 0]
\`\`\`

**Worked problem 2: largest rectangle in a histogram.** For each bar, the widest rectangle at its height extends to the nearest smaller bar on each side. An increasing stack finds both at once: when bar \`i\` is lower than the top, the top's right boundary is \`i\` and its left boundary is the new top below it.

\`\`\`python
def largest_rectangle(h):
    st, best = [], 0
    for i, x in enumerate(h + [0]):          # sentinel 0 flushes the stack
        while st and x < h[st[-1]]:
            height = h[st.pop()]
            left = st[-1] if st else -1
            best = max(best, height * (i - left - 1))
        st.append(i)
    return best
largest_rectangle([2, 1, 5, 6, 2, 3])        # 10 (heights 5 and 6, width 2)
\`\`\`

**Circular arrays.** Loop \`i\` over \`range(2n)\` using \`a[i % n]\` and only push in the first pass.

**Edge cases.** Equal values (decide strict vs non-strict comparison: "greater" means pop on \`>\`, so equal values wait); no answer (default −1 or 0); the sentinel trick to empty the stack.
`,
  practice: `
**Signals:** "next greater/smaller", "previous greater/smaller", "how many days until", "span", "largest rectangle", "visible people", "remove k digits to make the smallest number".

**Variations.** Sum of Subarray Minimums (each element's contribution = value × left span × right span), Remove K Digits (increasing stack, pop larger digits while k > 0), Online Stock Span (stack of (price, span)), Trapping Rain Water (stack version).

**Practise:** Next Greater Element I and II, Daily Temperatures, Online Stock Span, Largest Rectangle in Histogram, Maximal Rectangle, Remove K Digits, Sum of Subarray Minimums, Car Fleet.
`,
  traps: [
    { trap: "Store values on the stack.", why: "You usually need positions too (distances, widths). Store indices and look values up." },
    { trap: "The nested while loop makes it O(n²).", why: "Each index is pushed once and popped at most once, so the total work over the scan is O(n)." },
    { trap: "Forget to flush the stack at the end of the histogram problem.", why: "Bars still on the stack never got a right boundary. Append a 0-height sentinel or process the leftovers with right boundary n." },
  ],
  say: {
    prompt: "Solve 'days until a warmer temperature' for every day and explain why it's linear.",
    secs: 45,
    check: ["Stack of indices waiting for a warmer day", "Stack temperatures decreasing from bottom to top", "Pop while today is warmer; answer = i − j", "Each index pushed and popped once: O(n)", "Unanswered days default to 0"],
    followups: [
      { q: "How do you find the previous smaller element instead?", a: "Scan left to right with an increasing stack; pop while the top is ≥ the current value; the remaining top (if any) is the previous smaller element; then push." },
      { q: "How would you handle a circular array?", a: "Iterate i over 0..2n − 1 with a[i % n]; pop and record as usual, but only push indices during the first n steps." },
      { q: "Why does the histogram solution compute the width as i − left − 1?", a: "When a bar is popped, i is the first lower bar on its right and the new stack top is the first lower bar on its left, so the bar's rectangle spans the indices strictly between them." },
    ],
    answer: `I scan the days left to right with a stack of indices of days still waiting for a warmer day. Their temperatures decrease from bottom to top, because a day that's been beaten is popped. For each new day, while it's warmer than the day on top, I pop that index j and set its answer to i − j. Then I push today.

Anything left on the stack at the end never sees a warmer day and keeps 0. Each index is pushed once and popped at most once, so despite the inner loop it's O(n) time and O(n) space, versus O(n²) for checking every later day.`,
    avoid: ["Pushing values instead of indices when distances are needed", "Claiming O(n²) because of the inner loop"],
  },
  terms: [["Monotonic stack", "Stack whose values stay sorted; violators are popped."], ["Next greater element", "First element to the right that's strictly larger."], ["Sentinel", "A dummy value appended to force the stack to empty."]],
  sources: [S.lcTemps, D.stack],
});
Q({ id: "dsa2-ms-1", d: 1, secs: 45, prompt: "Daily temperatures [73, 74, 75, 71, 69, 72, 76, 73]. How many days does day index 2 (75) wait?", answer: 4, tol: 0.5, explain: "Next warmer is 76 at index 6.", py: "t = [73,74,75,71,69,72,76,73]; ans = [0]*len(t); st = []\nfor i, x in enumerate(t):\n    while st and x > t[st[-1]]:\n        j = st.pop(); ans[j] = i-j\n    st.append(i)\nanswer = ans[2]" });
Q({ id: "dsa2-ms-2", d: 2, secs: 60, prompt: "Largest rectangle area in the histogram [2, 1, 5, 6, 2, 3]?", answer: 10, tol: 0.5, explain: "Height 5 across bars 5 and 6.", py: "h = [2,1,5,6,2,3]; st = []; b = 0\nfor i, x in enumerate(h + [0]):\n    while st and x < h[st[-1]]:\n        ht = h[st.pop()]; left = st[-1] if st else -1\n        b = max(b, ht*(i-left-1))\n    st.append(i)\nanswer = b" });
Q({ id: "dsa2-ms-3", d: 2, secs: 60, prompt: "Circular next greater element for [1, 2, 1]. What is the sum of the answers (−1 where none)?", answer: 3, tol: 0.5, explain: "[2, −1, 2].", py: "a = [1,2,1]; n = len(a); ans = [-1]*n; st = []\nfor i in range(2*n):\n    x = a[i % n]\n    while st and x > a[st[-1]]: ans[st.pop()] = x\n    if i < n: st.append(i)\nanswer = sum(ans)" });
Q({ id: "dsa2-ms-4", d: 3, secs: 90, prompt: "Remove 3 digits from '1432219' to make the smallest possible number. What is it?", answer: 1219, tol: 0.5, explain: "Increasing stack: pop 4, 3 and one 2 when smaller digits arrive.", py: "num, k = '1432219', 3; st = []\nfor d in num:\n    while k and st and st[-1] > d:\n        st.pop(); k -= 1\n    st.append(d)\nst = st[:len(st)-k] if k else st\nanswer = int(''.join(st).lstrip('0') or '0')" });
C("dsa2-ms-c1", "Next greater template", "while st and x > a[st[−1]]: ans[st.pop()] = x; st.append(i).");
C("dsa2-ms-c2", "Monotonic direction", "Next greater → decreasing stack; next smaller → increasing stack.");

L("dsa2-queue-deque", SQ, "Queues, deques and the sliding-window maximum", "First-in-first-out with collections.deque, a queue from two stacks, and a monotonic deque that gives the max of every window in O(n).", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-monotonic-stack", "dsa2-fixed-window"],
  hook: "Report the maximum of every window of size k. A sum can be updated by subtracting; a maximum can't. What structure remembers the candidates?",
  intuition: `
**The situation.** Processing in arrival order (task queues, BFS, rate limiters, recent-events counters) and window maximums.

**The idea.** A queue removes from the front and adds at the back. Use \`collections.deque\`: \`append\` and \`popleft\` are $O(1)$, unlike \`list.pop(0)\`.

**Monotonic deque.** For the max of every window, keep a deque of **indices** whose values decrease from front to back:

- Before adding \`i\`, pop from the back every index with a value ≤ \`a[i]\`: they can never be a window max while \`i\` is in the window.
- Pop the front if it has slid out of the window (\`index ≤ i − k\`).
- The front is the current max.

**Queue from two stacks.** Push onto \`inbox\`; to pop, if \`outbox\` is empty, move everything from \`inbox\` to \`outbox\` (reversing it), then pop \`outbox\`. Each element moves once: amortised $O(1)$.
`,
  maths: `
**In one breath.** \`dq.append(x)\`, \`dq.popleft()\`, \`dq[0]\`, \`dq[-1]\`; window max: pop back while smaller, pop front if expired, read \`dq[0]\`; $O(n)$ total.

**Template: sliding-window maximum.**

\`\`\`python
from collections import deque
def window_max(a, k):
    dq, out = deque(), []            # indices, values decreasing
    for i, x in enumerate(a):
        while dq and a[dq[-1]] <= x:
            dq.pop()                 # dominated: older and not bigger
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()             # front slid out of the window
        if i >= k - 1:
            out.append(a[dq[0]])
    return out
window_max([1, 3, -1, -3, 5, 3, 6, 7], 3)   # [3, 3, 5, 5, 6, 7]
\`\`\`

**Worked problem 1: recent-requests counter.** Count requests in the last 3,000 ms at each call.

\`\`\`python
from collections import deque
class RecentCounter:
    def __init__(self):
        self.q = deque()
    def ping(self, t):
        self.q.append(t)
        while self.q[0] < t - 3000:
            self.q.popleft()         # drop expired timestamps
        return len(self.q)
\`\`\`

Pings at 1, 100, 3001, 3002 return 1, 2, 3, 3. Each timestamp is added and removed once.

**Worked problem 2: queue from two stacks.**

\`\`\`python
class TwoStackQueue:
    def __init__(self):
        self.inbox, self.outbox = [], []
    def push(self, x):
        self.inbox.append(x)
    def pop(self):
        if not self.outbox:
            while self.inbox:
                self.outbox.append(self.inbox.pop())
        return self.outbox.pop()
\`\`\`

**Edge cases.** k = 1 (every element is its own max); k = n (one window); popping from an empty deque raises IndexError; equal values (popping on \`<=\` keeps the newest index, which expires last).
`,
  practice: `
**Signals:** "in order of arrival", "process level by level" (BFS), "last N seconds", "maximum/minimum of each window", "shortest subarray with sum ≥ k with negatives" (monotonic deque on prefix sums).

**Variations.** Sliding-window minimum (increasing deque), Shortest Subarray with Sum at Least K (deque over prefix sums), Constrained Subsequence Sum (DP + window max), Design Circular Queue (array with head index and size).

**Practise:** Sliding Window Maximum, Number of Recent Calls, Implement Queue using Stacks, Design Circular Queue, Moving Average from Data Stream, Shortest Subarray with Sum at Least K, Jump Game VI.
`,
  traps: [
    { trap: "Use a heap for the window max and pop when the top expires.", why: "It works (lazy deletion) but is O(n log n). The monotonic deque is O(n) and is the expected answer." },
    { trap: "Store values in the deque.", why: "You need indices to know when the front leaves the window." },
    { trap: "Use list.pop(0) for a queue.", why: "It's O(n) per pop; over n operations O(n²). deque.popleft() is O(1)." },
  ],
  say: {
    prompt: "Give the maximum of every window of size k in O(n). Explain why the deque never needs the elements it throws away.",
    secs: 50,
    check: ["Deque of indices with decreasing values", "Pop the back while its value ≤ the new value (dominated)", "Pop the front when it leaves the window", "Front is the window max", "Each index added and removed once: O(n) time, O(k) space"],
    followups: [
      { q: "Why is it safe to drop an element smaller than the new one?", a: "The new element is larger and will stay in the window at least as long, so the older smaller element can never be the maximum of any future window." },
      { q: "How would you get the window minimum instead?", a: "Keep values increasing from front to back: pop the back while its value ≥ the new value." },
      { q: "What's the amortised cost of a queue built from two stacks?", a: "O(1) per operation: each element is pushed to inbox once, moved to outbox once and popped once, even though one pop may move many elements." },
    ],
    answer: `I keep a deque of indices whose values decrease from front to back. When a new element arrives, I pop indices off the back while their values are less than or equal to it: they're older and not bigger, so they can never be the maximum of any window that includes the new element. Then I push the new index. If the front index has slid out of the window, I pop it from the front. Once the first window is full, the front is the maximum.

Every index is appended once and removed at most once, so the total is O(n) time and O(k) space. A heap would also work with lazy deletion but costs O(n log n).`,
    avoid: ["Recomputing max() of every window (O(n·k))", "Storing values instead of indices"],
  },
  terms: [["FIFO", "First in, first out."], ["Monotonic deque", "Deque kept sorted by value; dominated items are dropped from the back."], ["Amortised O(1)", "Each element is moved a constant number of times overall."]],
  sources: [D.coll, S.minStack],
});
Q({ id: "dsa2-qd-1", d: 2, secs: 60, prompt: "Sliding-window maximums for [1, 3, −1, −3, 5, 3, 6, 7] with k = 3. What is their sum?", answer: 29, tol: 0.5, explain: "[3, 3, 5, 5, 6, 7] sums to 29.", py: "from collections import deque\na, k = [1,3,-1,-3,5,3,6,7], 3\ndq, out = deque(), []\nfor i, x in enumerate(a):\n    while dq and a[dq[-1]] <= x: dq.pop()\n    dq.append(i)\n    if dq[0] <= i-k: dq.popleft()\n    if i >= k-1: out.append(a[dq[0]])\nanswer = sum(out)" });
Q({ id: "dsa2-qd-2", d: 1, secs: 45, prompt: "Recent counter with a 3,000 ms window: pings at 1, 100, 3001, 3002. What does the last ping return?", answer: 3, tol: 0.5, explain: "Window [2, 3002] holds 100, 3001, 3002.", py: "from collections import deque\nq = deque(); r = 0\nfor t in [1,100,3001,3002]:\n    q.append(t)\n    while q[0] < t-3000: q.popleft()\n    r = len(q)\nanswer = r" });
Q({ id: "dsa2-qd-3", d: 2, secs: 60, prompt: "Two-stack queue: push 1, push 2, pop, push 3, pop, pop. How many individual moves from inbox to outbox happen in total?", answer: 3, tol: 0.5, explain: "First pop moves 1 and 2; the third pop moves 3. Each element moves once.", py: "inbox, outbox, moves = [], [], 0\ndef pop():\n    global moves\n    if not outbox:\n        while inbox: outbox.append(inbox.pop()); moves += 1\n    return outbox.pop()\ninbox.append(1); inbox.append(2); pop(); inbox.append(3); pop(); pop()\nanswer = moves" });
Q({ id: "dsa2-qd-4", d: 1, secs: 30, prompt: "Which structure gives the max of every window of size k in O(n) total?", options: ["A min-heap", "A deque of indices with decreasing values", "A sorted list rebuilt per window", "A stack of values"], answer: 1, explain: "The monotonic deque adds and removes each index once.", py: "answer = 1" });
C("dsa2-qd-c1", "Window max deque", "Pop back while a[back] ≤ x; append i; pop front if ≤ i − k; max = a[dq[0]].");
C("dsa2-qd-c2", "Queue in Python", "collections.deque: append + popleft, both O(1). Never list.pop(0).");

L("dsa2-stack-practice", SQ, "Stacks and queues practice", "Stack, monotonic-stack and queue problems to explain out loud.", {
  kind: "interview", mins: 25, prereq: ["dsa2-stack", "dsa2-monotonic-stack", "dsa2-queue-deque"],
  hook: "Name the structure, what it stores, and why each element is touched O(1) times.",
}, [
  iq("Asteroid Collision: positive values move right, negative move left; equal sizes both explode. Return what's left.", "Stack of survivors. For each asteroid, while it moves left and the top moves right, compare sizes: pop the smaller top, or destroy the incoming, or both if equal. Push it if it survives. O(n) time, each asteroid pushed and popped once.", ["Stack of survivors", "Collision only when top > 0 and new < 0", "Three outcomes handled", "O(n)"]),
  iq("Online Stock Span: for each new price, how many consecutive days (including today) had price ≤ today's?", "Monotonic stack of (price, span) with decreasing prices. On a new price, pop while top price ≤ new price, adding their spans; push (price, total span). Amortised O(1) per call.", ["Stack of (price, span)", "Pop while ≤, accumulate spans", "Amortised O(1)"]),
  iq("Simplify a Unix path like '/a/./b/../../c/'.", "Split on '/', skip '' and '.', pop on '..' if the stack is non-empty, otherwise push the name. Join with '/' and prefix '/'. O(n).", ["Split on '/'", "'..' pops, '.' and '' skipped", "Root edge case", "O(n)"]),
  iq("Sum of Subarray Minimums: sum of min(b) over every contiguous subarray b.", "For each a[i], find how far it extends as the minimum: left span to the previous smaller (strict) and right span to the next smaller-or-equal, using monotonic stacks. Contribution = a[i] × left × right. Use strict on one side and non-strict on the other to avoid double counting equal values. O(n).", ["Contribution technique", "Previous/next smaller via monotonic stacks", "Tie-breaking for equal values", "O(n)"]),
  iq("Implement a stack using only queues.", "One queue: on push, append then rotate the previous size elements to the back so the new element is at the front; pop is popleft. Push O(n), pop O(1). Or keep push O(1) and make pop O(n).", ["Rotation trick", "Which operation pays O(n)", "Trade-off depends on workload"]),
  iq("Car Fleet: cars at positions with speeds head to a target; a car catching up joins the fleet ahead. How many fleets arrive?", "Sort cars by position descending; compute arrival time (target − pos) / speed. Scan with a stack (or just the last fleet time): a car whose time is ≤ the fleet ahead joins it; a larger time starts a new fleet. O(n log n).", ["Sort by position, closest first", "Arrival time per car", "Monotonic comparison of times", "O(n log n)"]),
]);
