/**
 * P1 · DSA patterns in Python (batch 3, 12 concepts). Coding problems live in problems-p1-dsa.ts.
 * Quiz items are "trace the code" questions: the check runs the snippet in Pyodide and compares
 * the printed number with the stored answer.
 */
import type { InterviewQ, Resource } from "@/lib/types";
import { Card_, Item, R, T } from "./build";

const SRC = "Practice: trace the algorithm; output checked by running it in Pyodide (Nov 2026)";
const iq = (q: string, answer: string, rubric: string[]): InterviewQ => ({ q, answer, rubric });
const nc = (id: string, title: string, who = "NeetCode") => R(`Video: ${title} (${who})`, `https://www.youtube.com/watch?v=${id}`);
const ROADMAP = R("NeetCode roadmap: problems grouped by pattern", "https://neetcode.io/roadmap", "More practice after this page");
const topic = (id: string, title: string, summary: string, notes: string, resources: Resource[], category: string, interview: InterviewQ[]) =>
  T(id, "foundations", "DSA patterns in Python", title, summary, notes, { resources: [...resources, ROADMAP], categories: [category], interview });

/** "What does this print?" with a numeric answer; the check runs the code and parses the printed number. */
function trace(id: string, d: 1 | 2 | 3, secs: number, code: string, answer: number, explain: string, fast: string, trap: string) {
  Item({
    id, d, secs, prompt: `What does this code print?\n\n\`\`\`\n${code}\n\`\`\``, answer, tol: 0, explain, fast, trap, src: SRC,
    check: { py: `import io, contextlib\n_buf = io.StringIO()\nwith contextlib.redirect_stdout(_buf):\n    exec(${JSON.stringify(code)}, {"__name__": "__main__"})\nanswer = float(_buf.getvalue().strip())` },
  });
}

// ───────────────────────── Prefix sums ─────────────────────────
topic("dsa-prefix", "Arrays and prefix sums", "Precompute running totals so any range sum is one subtraction; combine with a hash map for 'subarray sums to k'.", `
**Recognise it.** Many range-sum queries; "number of subarrays whose sum is k"; "equal sums on both sides"; adding a value to many ranges.

**Template.**

\`\`\`
pre = [0]
for x in nums:
    pre.append(pre[-1] + x)
# sum of nums[l..r] inclusive
total = pre[r + 1] - pre[l]
\`\`\`

**Prefix sum + hash map.** A subarray ending at i sums to k exactly when an earlier prefix equals \`prefix_i − k\`. Count earlier prefixes in a dict seeded with \`{0: 1}\`. Works with negative numbers, unlike a sliding window.

**Difference array** (the reverse): to add v to every index in [l, r] many times, do \`diff[l] += v; diff[r + 1] -= v\`, then take a prefix sum once at the end.

**Costs.** O(n) to build, O(1) per query, O(n) extra memory.

**Worked example 1.** Range sums: 20,000 queries on 100,000 numbers are instant with prefix sums and billions of operations without.

**Worked example 2.** Subarrays of [1, 2, 1, 2, 1] summing to 3: prefixes 1, 3, 4, 6, 7; each of 3, 4, 6, 7 has an earlier prefix 3 lower (0, 1, 3, 4), so 4 subarrays.

**Worked example 3.** Pivot index: right sum = total − left − nums[i], so one pass with a running left sum.

**Worked example 4.** Equal 0s and 1s: map 0 → −1, then two equal running totals bracket a balanced subarray (same idea as example 2).
`, [nc("fFVZt-6sgyo", "Subarray sum equals K")], "dsa/prefix", [
  iq("How do you count subarrays that sum to k when the array has negative numbers?", "Keep a running prefix sum and a dict counting how often each prefix value has occurred, seeded with {0: 1}. At each position add count[prefix − k] to the answer, then record the current prefix. O(n). A sliding window does not work because with negatives shrinking the window does not reliably reduce the sum.", ["Prefix sum + hash map", "Seed {0: 1}", "Explains why sliding window fails with negatives", "O(n)"]),
  iq("What is a difference array and when would you use it?", "The inverse of a prefix sum: to add v to a whole range [l, r], add v at l and subtract it at r + 1; after all updates, one prefix sum gives the final array. Many range updates then cost O(1) each plus one O(n) pass.", ["Mark l and r + 1", "Prefix sum at the end", "Many range updates"]),
  iq("What are the off-by-one rules for prefix sums?", "Make pre one longer than the array with pre[0] = 0, so pre[i] is the sum of the first i elements; then the inclusive range l..r is pre[r + 1] − pre[l]. That avoids special cases for l = 0.", ["n + 1 entries with pre[0] = 0", "pre[r + 1] − pre[l]", "No special case at l = 0"]),
]);
trace("dsa-pre-t1", 1, 45, "nums = [3, 1, 4, 1, 5]\np = [0]\nfor x in nums:\n    p.append(p[-1] + x)\nprint(p[4] - p[1])", 6,
  "p = [0, 3, 4, 8, 9, 14]; p[4] − p[1] = 9 − 3 = 6, the sum of nums[1..3].", "p[j] − p[i] = sum of nums[i..j − 1].", "Including nums[0] or nums[4] in the range.");
trace("dsa-pre-t2", 2, 75, "from collections import defaultdict\nnums, k = [1, 2, 1, 2, 1], 3\nseen = defaultdict(int)\nseen[0] = 1\ntotal = count = 0\nfor x in nums:\n    total += x\n    count += seen[total - k]\n    seen[total] += 1\nprint(count)", 4,
  "Prefixes 1, 3, 4, 6, 7. Earlier prefixes 0, 1, 3, 4 match 3, 4, 6, 7 minus 3: four subarrays.", "Count earlier prefixes equal to current − k.", "Forgetting the seeded prefix 0.");
trace("dsa-pre-t3", 2, 60, "diff = [0] * 6\nfor l, r, v in [(1, 3, 5), (2, 4, 2)]:\n    diff[l] += v\n    diff[r + 1] -= v\narr, run = [], 0\nfor d in diff[:5]:\n    run += d\n    arr.append(run)\nprint(arr[3])", 7,
  "After the prefix sum, arr = [0, 5, 7, 7, 2]; index 3 is inside both ranges: 5 + 2.", "A difference array turns range updates into point updates.", "Subtracting at r instead of r + 1.");
Card_("dsa-pre-c1", "Sum of nums[l..r] with prefix array pre (pre[0] = 0)", "pre[r + 1] − pre[l].");
Card_("dsa-pre-c2", "Count subarrays with sum k (negatives allowed)", "Prefix sum + dict of earlier prefix counts, seeded {0: 1}.");
Card_("dsa-pre-c3", "Many range additions", "Difference array: diff[l] += v, diff[r + 1] −= v, prefix-sum once.");

// ───────────────────────── Strings ─────────────────────────
topic("dsa-strings", "String manipulation patterns", "Common-prefix, subsequence matching, and expand-around-centre palindromes.", `
**Recognise it.** Prefixes, subsequences, palindromes, anagrams, reversing words, character counts.

**Useful facts.**

- Strings are immutable: build with a list and \`"".join\`.
- \`sorted(s)\` or a 26-count tuple gives an anagram key.
- \`s.split()\` collapses whitespace; \`" ".join(reversed(s.split()))\` reverses words.

**Subsequence check.** One pointer into s, advance it when the current character of t matches: O(len t).

**Palindromes: expand around centre.** Every palindrome has a centre: one character (odd length) or the gap between two (even length). There are 2n − 1 centres; expand while the ends match. O(n²) time, O(1) space, and simpler than DP.

**Common prefix trick.** The common prefix of a list equals the common prefix of its alphabetically smallest and largest strings.

**Worked example 1.** "babad": the centre at index 1 expands to "bab" (length 3); nothing longer exists.

**Worked example 2.** "cbbd": the odd centres only give length 1; the even centre between the two b's gives "bb".

**Worked example 3.** Is "axe" a subsequence of "abcde"? The pointer passes 'a', then waits for 'x' forever: no. Only 1 character matched.

**Worked example 4.** Count palindromic substrings of "aaa" by expanding from every centre: 3 single letters, 2 "aa", 1 "aaa" = 6.
`, [nc("XYQecbcd6_c", "Longest palindromic substring")], "dsa/strings", [
  iq("How do you find the longest palindromic substring, and what is its complexity?", "Expand around each of the 2n − 1 centres (each character and each gap) while the characters on both sides match, keeping the longest. O(n²) time and O(1) space. DP is also O(n²) but uses O(n²) memory; Manacher's algorithm is O(n) but rarely expected.", ["Expand around centre", "Odd and even centres", "O(n²) time, O(1) space", "Mentions DP or Manacher as alternatives"]),
  iq("Why build strings with a list and join instead of +=?", "Strings are immutable, so each += can copy the whole string so far, giving O(n²) in the worst case. Appending to a list is amortised O(1) and one join at the end is O(n).", ["Immutability causes copying", "List append + join is linear"]),
  iq("How would you check whether two strings are anagrams?", "Compare character counts: Counter(a) == Counter(b), O(n). Sorting both and comparing is O(n log n). For lowercase letters a 26-element count array is fastest and also works as a hashable key (as a tuple) for grouping.", ["Counter comparison", "Sorting alternative and its cost", "Count tuple as a key"]),
]);
trace("dsa-str-t1", 2, 60, "s = \"aaa\"\ncount = 0\nfor c in range(len(s)):\n    for lo, hi in ((c, c), (c, c + 1)):\n        while lo >= 0 and hi < len(s) and s[lo] == s[hi]:\n            count += 1\n            lo -= 1\n            hi += 1\nprint(count)", 6,
  "Each expansion step finds one palindrome: 'a' ×3, 'aa' ×2, 'aaa' ×1.", "Odd and even centres, count every successful expansion.", "Forgetting even-length centres (answer 4).");
trace("dsa-str-t2", 1, 45, "s, t = \"axe\", \"abcde\"\ni = 0\nfor c in t:\n    if i < len(s) and s[i] == c:\n        i += 1\nprint(i)", 1,
  "After matching 'a', the pointer waits for 'x', which never appears, so 'e' is never reached.", "Order matters: a missing character blocks the rest.", "Counting every character of s that appears in t (2).");
trace("dsa-str-t3", 1, 20, "print(len(\" a  good   example \".split()))", 3,
  "split() with no argument splits on runs of whitespace and drops empty strings.", "No-argument split collapses whitespace.", "Counting empty strings, as split(' ') would.");
Card_("dsa-str-c1", "Longest palindromic substring", "Expand around 2n − 1 centres: O(n²) time, O(1) space.");
Card_("dsa-str-c2", "Common prefix of many strings", "Common prefix of min(words) and max(words).");
Card_("dsa-str-c3", "Subsequence check", "One pointer into s, advance on matches while scanning t.");

// ───────────────────────── Hashing ─────────────────────────
topic("dsa-hashing", "Hashing and counting", "Trade memory for time: sets and dicts turn 'have I seen…' and 'how many…' into O(1) questions.", `
**Recognise it.** "Find a pair / duplicate", "first unique", "longest run", "group by", anything where a nested loop asks "is there an earlier element with property X?".

**Patterns.**

- **Seen set:** duplicates, membership. \`if x in seen\` is O(1) on average.
- **Value → index dict:** two-sum (look up \`target − x\` before inserting x), nearest duplicate (store the last index).
- **Counting:** \`Counter\`, or \`defaultdict(int)\`.
- **First occurrence of a running value:** longest balanced subarray, longest subarray with sum k.
- **Run starts:** for longest consecutive sequence, only start counting at x when x − 1 is not in the set, so each number is visited at most twice.

**Costs.** O(n) time and O(n) memory, versus O(n²) for the nested loop.

**Worked example 1.** Two-sum on [3, 2, 4] with target 6: check for 3 (missing), store 3; check for 4 (missing), store 2; check for 2 (found at index 1): answer (1, 2).

**Worked example 2.** Longest consecutive in [100, 4, 200, 1, 3, 2]: only 1, 100 and 200 start runs; 1 → 2 → 3 → 4 gives 4.

**Worked example 3.** Nearby duplicate within k: store the last index of each value; a repeat within k positions answers True.

**Worked example 4.** Longest balanced 0/1 subarray: treat 0 as −1; equal running totals at i and j mean bits[i + 1..j] is balanced.
`, [nc("P6RZZMu_maU", "Longest consecutive sequence")], "dsa/hashing", [
  iq("Walk through the one-pass hash-map solution to two-sum.", "Iterate with index i and value x. If target − x is already in the dict, return (dict[target − x], i). Otherwise store dict[x] = i. Checking before inserting stops an element pairing with itself. O(n) time, O(n) space.", ["Look up complement before inserting", "Avoids using the same element twice", "O(n) time and space"]),
  iq("How do you find the longest consecutive sequence in O(n)?", "Put all numbers in a set. For each x that has no x − 1 in the set (a run start), count upwards while x + 1, x + 2 … are present. Each number is part of exactly one run and is visited at most twice, so the total is O(n).", ["Set for membership", "Only start at run beginnings", "Argues O(n)"]),
  iq("When is a hash map not the right tool?", "When you need ordering (use sorting or a sorted container), when memory is tight and the data is already sorted (two pointers need O(1) extra space), or when keys are unhashable or adversarial inputs could cause many collisions.", ["Ordering needs", "Sorted input + two pointers", "Memory or collision concerns"]),
]);
trace("dsa-hash-t1", 1, 45, "nums, target = [3, 2, 4], 6\nseen = {}\nfor i, x in enumerate(nums):\n    if target - x in seen:\n        print(seen[target - x] + i)\n        break\n    seen[x] = i", 3,
  "The pair is indices 1 and 2 (2 + 4); 3 is not paired with itself because it is looked up before being stored.", "Look up the complement before inserting.", "Pairing 3 with itself (indices 0 + 0).");
trace("dsa-hash-t2", 2, 60, "nums = [9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6]\ns = set(nums)\nbest = 0\nfor x in s:\n    if x - 1 not in s:\n        y = x\n        while y + 1 in s:\n            y += 1\n        best = max(best, y - x + 1)\nprint(best)", 7,
  "Runs: −1, 0, 1 (length 3) and 3 … 9 (length 7).", "Only start counting at run beginnings.", "Counting the duplicate −1 twice.");
trace("dsa-hash-t3", 1, 30, "from collections import Counter\nprint(Counter(\"abracadabra\").most_common(1)[0][1])", 5,
  "'a' appears 5 times; most_common(1)[0] is ('a', 5).", "most_common returns (item, count) pairs.", "Printing the item instead of its count.");
Card_("dsa-hash-c1", "Two-sum in one pass", "Check target − x in the dict before storing x.");
Card_("dsa-hash-c2", "Longest consecutive run in O(n)", "Set; start counting only where x − 1 is absent.");
Card_("dsa-hash-c3", "Nearest duplicate within k", "Dict of the last index of each value.");

// ───────────────────────── Two pointers ─────────────────────────
topic("dsa-twoptr", "Two pointers", "Two indices moving towards each other (or in the same direction) over sorted or sequential data: O(n) and O(1) space.", `
**Recognise it.** Sorted array + "pair / triplet with sum"; in-place deduplication or partitioning; "container", "palindrome", "merge".

**Opposite ends (sorted input).**

\`\`\`
i, j = 0, len(a) - 1
while i < j:
    s = a[i] + a[j]
    if s == target: ...
    elif s < target: i += 1   # need bigger
    else: j -= 1              # need smaller
\`\`\`

Each step rules out every pair involving the pointer that moves, so it is O(n).

**Same direction (slow/fast).** A write pointer and a read pointer: remove duplicates in place, move zeros to the end, partition.

**k-sum.** Sort, fix one element, run two pointers on the rest: 3Sum in O(n²). Skip equal neighbours to avoid duplicate triplets.

**Greedy proof (container with most water).** The area is limited by the shorter line; moving the taller line inward can only shrink the width without raising the limit, so always move the shorter one.

**Worked example 1.** [1, 2, 3, 4, 6], target 6: 1 + 6 too big → move j; 1 + 4 too small → move i; 2 + 4 = 6 in 3 steps.

**Worked example 2.** 3Sum of [−1, 0, 1, 2, −1, −4] → sorted [−4, −1, −1, 0, 1, 2]: fixing −1 finds [−1, −1, 2] and [−1, 0, 1]; the second −1 is skipped.

**Worked example 3.** Remove duplicates from [0, 0, 1, 1, 1, 2, 2, 3, 3, 4] in place: the write pointer ends at 5.

**Worked example 4.** Water between heights [4, 3, 2, 1, 4]: the outer pair gives 4 × 4 = 16, the maximum.
`, [nc("jzZsG8n2R9A", "3Sum")], "dsa/twoptr", [
  iq("Why does the two-pointer method on a sorted array never miss the answer?", "If a[i] + a[j] < target, then a[i] plus any element at or left of j is also too small, so a[i] cannot be in any remaining solution and i can advance. Symmetrically for j when the sum is too big. Each move discards a whole row or column of candidate pairs.", ["Explains the discarded pairs for each move", "Uses sortedness", "Concludes O(n)"]),
  iq("How do you avoid duplicate triplets in 3Sum?", "Sort first. Skip the fixed element when it equals the previous one, and after recording a triplet move the left pointer past equal values (and the right pointer too). Deduplicating with a set at the end also works but costs memory and hides the technique.", ["Sort", "Skip equal fixed elements", "Skip equal values after a match"]),
  iq("When would you choose two pointers over a hash map?", "When the data is sorted (or sorting is acceptable) and you want O(1) extra space, or when the problem is about order or positions (in-place removal, partitioning, palindromes). A hash map suits unsorted data where you can afford O(n) memory.", ["Sorted data", "O(1) space", "In-place / positional problems"]),
]);
trace("dsa-tp-t1", 1, 45, "nums, target = [1, 2, 3, 4, 6], 6\ni, j, steps = 0, len(nums) - 1, 0\nwhile i < j:\n    steps += 1\n    s = nums[i] + nums[j]\n    if s == target:\n        break\n    if s < target:\n        i += 1\n    else:\n        j -= 1\nprint(steps)", 3,
  "7 (too big, j moves), 5 (too small, i moves), 6 (found).", "Each step moves exactly one pointer.", "Moving both pointers per step.");
trace("dsa-tp-t2", 2, 45, "nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]\nk = 1\nfor i in range(1, len(nums)):\n    if nums[i] != nums[k - 1]:\n        nums[k] = nums[i]\n        k += 1\nprint(k)", 5,
  "k counts the distinct values written to the front: 0, 1, 2, 3, 4.", "Slow pointer = write position, fast pointer = read position.", "Counting the duplicates instead of the distinct values.");
trace("dsa-tp-t3", 1, 45, "h = [4, 3, 2, 1, 4]\ni, j, best = 0, len(h) - 1, 0\nwhile i < j:\n    best = max(best, (j - i) * min(h[i], h[j]))\n    if h[i] < h[j]:\n        i += 1\n    else:\n        j -= 1\nprint(best)", 16,
  "The first pair (width 4, height 4) is already the best.", "Area = width × the shorter height.", "Multiplying by the taller height.");
Card_("dsa-tp-c1", "Sorted pair sum", "i at start, j at end; too small → i += 1, too big → j −= 1.");
Card_("dsa-tp-c2", "3Sum", "Sort, fix one, two pointers on the rest; skip equal neighbours.");
Card_("dsa-tp-c3", "Container with most water", "Always move the shorter line.");

// ───────────────────────── Sliding window ─────────────────────────
topic("dsa-window", "Sliding window", "A contiguous range that grows on the right and shrinks on the left, so each element enters and leaves once.", `
**Recognise it.** "Longest / shortest **contiguous** subarray or substring such that …", "maximum sum of k consecutive", "at most k distinct", "without repeating".

**Fixed size k.** Add the new element, subtract the one that falls out: O(n).

**Variable size.**

\`\`\`
left = 0
for right, x in enumerate(a):
    add x to the window state
    while window is invalid:
        remove a[left]; left += 1
    record answer using right - left + 1
\`\`\`

**When it works.** Shrinking must move the window towards validity (monotonic). Sums of **positive** numbers, counts of distinct characters and products of positives qualify. With negative numbers, use prefix sums instead.

**State.** A running sum, a Counter of characters, or a dict of last positions.

**Worked example 1.** Max sum of 2 consecutive in [4, 2, 12, 3]: windows 6, 14, 15 → 15.

**Worked example 2.** "pwwkew" without repeats: the window jumps past the earlier 'w' when it repeats; best is "wke", length 3.

**Worked example 3.** Subarrays of [10, 5, 2, 6] with product < 100: each right end adds right − left + 1 valid subarrays: 1 + 2 + 2 + 3 = 8.

**Worked example 4.** Shortest subarray of [2, 3, 1, 2, 4, 3] with sum ≥ 7: [4, 3], length 2.
`, [nc("aYqYMIqZx5s", "Minimum size subarray sum")], "dsa/window", [
  iq("When can you use a sliding window, and when can't you?", "When the validity condition is monotonic in the window: adding elements only makes it 'more' (sum grows, more distinct characters) and removing from the left only makes it 'less'. That holds for sums of positive numbers or counts. With negative numbers a larger window can have a smaller sum, so shrinking does not reliably restore validity; use prefix sums and a hash map or a monotonic deque instead.", ["Monotonic condition", "Positive numbers / counts work", "Negatives break it", "Names the alternative"]),
  iq("Why is a variable sliding window O(n) despite the nested while loop?", "Each element is added once when right passes it and removed at most once when left passes it. left never moves backwards, so the inner loop runs at most n times in total across the whole scan.", ["Each element added and removed once", "left only moves forward", "Amortised O(n)"]),
  iq("How do you count subarrays (not just find the longest) with a sliding window?", "For each right end, once the window [left, right] is the largest valid one ending at right, every subarray starting between left and right is also valid, so add right − left + 1. For 'exactly k' conditions, count 'at most k' minus 'at most k − 1'.", ["Add right − left + 1 per right end", "Exactly k = atMost(k) − atMost(k − 1)"]),
]);
trace("dsa-win-t1", 1, 45, "nums, k = [4, 2, 12, 3], 2\ncur = best = sum(nums[:k])\nfor i in range(k, len(nums)):\n    cur += nums[i] - nums[i - k]\n    best = max(best, cur)\nprint(best)", 15,
  "Windows: 6, 14, 15.", "Add the incoming element, subtract the outgoing one.", "Forgetting to subtract the element leaving the window.");
trace("dsa-win-t2", 2, 60, "s = \"pwwkew\"\nlast, left, best = {}, 0, 0\nfor i, c in enumerate(s):\n    if c in last and last[c] >= left:\n        left = last[c] + 1\n    last[c] = i\n    best = max(best, i - left + 1)\nprint(best)", 3,
  "Longest repeat-free windows are 'wke' and 'kew'.", "Jump left past the previous occurrence of the repeated character.", "Counting 'pwke', which is not contiguous.");
trace("dsa-win-t3", 3, 90, "nums, k = [10, 5, 2, 6], 100\nprod, left, count = 1, 0, 0\nfor right, x in enumerate(nums):\n    prod *= x\n    while prod >= k:\n        prod //= nums[left]\n        left += 1\n    count += right - left + 1\nprint(count)", 8,
  "Per right end: 1 ([10]), 2 ([5], [10,5]), 2 ([2], [5,2]), 3 ([6], [2,6], [5,2,6]).", "Each right end adds right − left + 1 subarrays.", "Counting only the longest window.");
Card_("dsa-win-c1", "Sliding window requirement", "Validity must be monotonic (positive sums, counts). Negatives → prefix sums.");
Card_("dsa-win-c2", "Count subarrays with a window", "Add right − left + 1 for each right end.");
Card_("dsa-win-c3", "Fixed window of size k", "cur += a[i] − a[i − k].");

// ───────────────────────── Intervals ─────────────────────────
topic("dsa-intervals", "Sorting and intervals", "Sort by start (or end), then a single pass handles merging, conflicts and room counts.", `
**Recognise it.** Meetings, bookings, ranges, "merge", "overlap", "minimum rooms", "remove the fewest intervals".

**Overlap test.** [a, b] and [c, d] overlap when a ≤ d and c ≤ b. Decide early whether touching endpoints count (closed intervals) or not (half-open [start, end), as for meetings).

**Merge.** Sort by start; extend the last merged interval while the next start ≤ its end.

**Insert into a sorted list.** Three phases: copy intervals ending before the new one, merge the overlapping ones, copy the rest.

**Minimum rooms.** Sort by start, keep a min-heap of end times; reuse the room that frees earliest if it is free by the start time. Or sweep: +1 at each start, −1 at each end, track the maximum.

**Fewest removals so nothing overlaps.** Sort by **end** and greedily keep each interval that starts after the last kept end.

**Worked example 1.** Merge [[1, 3], [2, 6], [8, 10], [15, 18]] → [[1, 6], [8, 10], [15, 18]].

**Worked example 2.** Rooms for [[0, 30], [5, 10], [15, 20]]: [5, 10] needs a second room; [15, 20] reuses it → 2.

**Worked example 3.** Remove the fewest from [[1, 2], [2, 3], [3, 4], [1, 3]]: keep [1, 2], [2, 3], [3, 4] → remove 1.

**Worked example 4.** Sweep [[1, 4], [2, 5], [3, 6], [7, 8]]: at time 3 three meetings run → 3 rooms.
`, [nc("FdzJmTCVyJU", "Meeting rooms II"), nc("PaJxqZVPhbg", "Meeting rooms")], "dsa/intervals", [
  iq("How do you compute the minimum number of meeting rooms?", "Sort meetings by start. Keep a min-heap of end times for rooms in use. For each meeting, if the smallest end time is ≤ its start, that room is free: replace its end time; otherwise push a new end time. The heap size at the end is the answer. O(n log n). A sweep over sorted starts and ends gives the same.", ["Sort by start", "Min-heap of end times", "Reuse when earliest end ≤ start", "O(n log n)"]),
  iq("To remove the fewest intervals so the rest don't overlap, why sort by end rather than start?", "Keeping the interval that ends earliest leaves the most room for the rest (a greedy exchange argument): any optimal solution can swap its first interval for the earliest-ending one without losing anything. Sorting by start can keep a long interval that blocks many short ones.", ["Earliest end leaves most room", "Exchange argument", "Counterexample for sorting by start"]),
  iq("What edge cases do interval problems hide?", "Whether touching intervals overlap ([1, 3] and [3, 5]); empty input; a single interval; one interval containing others; unsorted input; and whether ends are inclusive. State the convention before coding.", ["Touching endpoints", "Containment", "Empty / single", "Inclusive vs exclusive ends"]),
]);
trace("dsa-iv-t1", 1, 45, "iv = sorted([[1, 3], [2, 6], [8, 10], [15, 18]])\nout = [iv[0]]\nfor s, e in iv[1:]:\n    if s <= out[-1][1]:\n        out[-1] = [out[-1][0], max(out[-1][1], e)]\n    else:\n        out.append([s, e])\nprint(len(out))", 3,
  "[1, 3] and [2, 6] merge into [1, 6]; the other two stay separate.", "Extend the last merged interval while the next start ≤ its end.", "Not taking the max of the two ends.");
trace("dsa-iv-t2", 2, 75, "iv = sorted([[1, 2], [2, 3], [3, 4], [1, 3]], key=lambda x: x[1])\nend, keep = float(\"-inf\"), 0\nfor s, e in iv:\n    if s >= end:\n        keep += 1\n        end = e\nprint(len(iv) - keep)", 1,
  "By end: [1,2], [2,3], [1,3], [3,4]. Keep [1,2], [2,3], [3,4]; only [1,3] is removed.", "Greedy by earliest end.", "Sorting by start and removing more than needed.");
trace("dsa-iv-t3", 2, 60, "events = []\nfor s, e in [[1, 4], [2, 5], [3, 6], [7, 8]]:\n    events += [(s, 1), (e, -1)]\ncur = best = 0\nfor _, d in sorted(events):\n    cur += d\n    best = max(best, cur)\nprint(best)", 3,
  "Starts at 1, 2, 3 before any end at 4: three meetings at once.", "Sweep: +1 at starts, −1 at ends, track the maximum.", "Counting all overlapping pairs instead of the maximum at one time.");
Card_("dsa-iv-c1", "Merge intervals", "Sort by start; extend the last while next start ≤ its end.");
Card_("dsa-iv-c2", "Minimum rooms", "Min-heap of end times (or sweep +1/−1).");
Card_("dsa-iv-c3", "Fewest removals for no overlap", "Sort by end; keep greedily.");

// ───────────────────────── Stack ─────────────────────────
topic("dsa-stack", "Stack and monotonic stack", "Last-in-first-out for nesting and expressions; a monotonic stack finds the next greater or smaller element for every position in O(n).", `
**Recognise it.** Brackets and nesting, expression evaluation, undo, "next greater / smaller element", "days until warmer", "span", histogram rectangles.

**Plain stack.** Python list: \`append\` to push, \`pop()\` to pop, \`st[-1]\` to peek. Check emptiness before popping.

**Monotonic stack.**

\`\`\`
st = []                      # indices, values decreasing
for i, x in enumerate(a):
    while st and a[st[-1]] < x:
        j = st.pop()         # x is j's next greater element
        ...
    st.append(i)
\`\`\`

Every index is pushed and popped once: O(n). Store **indices**, so you can fill answers and compute distances.

**Expression evaluation (RPN).** Push numbers; on an operator pop b then a and push a ∘ b. Mind the operand order for − and /.

**Worked example 1.** Next greater for [2, 1, 2, 4, 3]: [4, 2, 4, −1, −1].

**Worked example 2.** Temperatures [73, 74, 75, 71, 69, 72, 76, 73] → waits [1, 1, 4, 2, 1, 1, 0, 0].

**Worked example 3.** RPN ["2", "1", "+", "3", "*"] → (2 + 1) × 3 = 9.

**Worked example 4.** Asteroids [5, 10, −5]: −5 meets 10, which is larger, so −5 is destroyed: 2 remain.
`, [nc("cTBiBSnjO3c", "Daily temperatures (monotonic stack)")], "dsa/stack", [
  iq("Explain how a monotonic stack finds the next greater element for every index in O(n).", "Scan left to right keeping a stack of indices whose next greater element is not yet known; their values are decreasing from bottom to top. When the current value is larger than the top's value, it is the top's answer: pop and record, repeat. Then push the current index. Each index is pushed and popped once, so O(n).", ["Stack of unresolved indices", "Decreasing values", "Pop while current is larger", "Each index pushed/popped once"]),
  iq("Why store indices instead of values on the stack?", "Indices let you write the answer into the right slot of the output and compute distances (days to wait, span widths). Values alone lose the position.", ["Fill output slots", "Distances / widths"]),
  iq("What goes wrong if you use // for division in an RPN evaluator?", "Python's // floors towards negative infinity, so 7 // −2 is −4, while most specifications (and C/Java) truncate towards zero, giving −3. Use int(a / b) or handle the sign explicitly.", ["Floor vs truncation", "Example with a negative", "int(a / b) fix"]),
]);
trace("dsa-st-t1", 1, 30, "depth = best = 0\nfor ch in \"(()(()))\":\n    depth += 1 if ch == \"(\" else -1\n    best = max(best, depth)\nprint(best)", 3,
  "Depth goes 1, 2, 1, 2, 3, 2, 1, 0.", "A counter is a stack of identical items.", "Counting total pairs (4) instead of depth.");
trace("dsa-st-t2", 2, 60, "nums = [1, 3, 2, 4]\nout = [-1] * len(nums)\nst = []\nfor i, x in enumerate(nums):\n    while st and nums[st[-1]] < x:\n        out[st.pop()] = x\n    st.append(i)\nprint(sum(out))", 10,
  "Next greater: [3, 4, 4, −1]; 3 + 4 + 4 − 1 = 10.", "Pop while the current value is larger.", "Using the next element instead of the next greater one.");
trace("dsa-st-t3", 2, 60, "st = []\nfor a in [5, 10, -5]:\n    alive = True\n    while alive and a < 0 and st and st[-1] > 0:\n        if st[-1] < -a:\n            st.pop()\n        elif st[-1] == -a:\n            st.pop()\n            alive = False\n        else:\n            alive = False\n    if alive:\n        st.append(a)\nprint(len(st))", 2,
  "−5 meets 10 first (the top of the stack); 10 is bigger, so −5 explodes and 5 is never reached.", "Only the top of the stack collides.", "Letting −5 destroy 5 as well.");
Card_("dsa-st-c1", "Next greater element in O(n)", "Monotonic stack of indices; pop while current > top.");
Card_("dsa-st-c2", "RPN division", "Truncate toward zero: int(a / b), not a // b.");
Card_("dsa-st-c3", "Stack contents for monotonic problems", "Indices, not values.");

// ───────────────────────── BFS ─────────────────────────
topic("dsa-bfs", "Queues, deque and grid BFS", "Breadth-first search with collections.deque: shortest paths in unweighted graphs and grids, flood fill, multi-source spreading.", `
**Recognise it.** "Shortest / minimum steps" with equal-cost moves, grids, "spreads each minute", levels of a tree, word ladders.

**Template.**

\`\`\`
from collections import deque
dist = {start: 0}
q = deque([start])
while q:
    u = q.popleft()
    for v in neighbours(u):
        if v not in dist:          # mark when enqueuing
            dist[v] = dist[u] + 1
            q.append(v)
\`\`\`

**Why BFS gives shortest paths.** It visits nodes in order of distance, so the first visit is via a shortest path (when every edge costs the same).

**Grids.** Neighbours are (r ± 1, c) and (r, c ± 1) within bounds and not walls. Count islands by starting a BFS from every unvisited land cell.

**Multi-source BFS.** Put every source in the queue at distance 0 (rotting oranges, distance to the nearest exit). Process level by level with \`for _ in range(len(q))\` when you need minutes or rounds.

**deque, not list.** \`list.pop(0)\` is O(n); \`deque.popleft()\` is O(1).

**Worked example 1.** Graph 0 → {1, 2}, 1 → 3, 2 → 3, 3 → 4: dist(4) = 3.

**Worked example 2.** Grid [[0, 0, 0], [1, 1, 0], [0, 0, 0]]: around the wall, 4 steps.

**Worked example 3.** Checkerboard ["101", "010", "101"]: diagonals do not connect, so 5 islands.

**Worked example 4.** Rotting oranges [[2, 1, 1], [1, 1, 0], [0, 1, 1]]: four minutes, one ring per minute.
`, [nc("y704fEOx0s0", "Rotting oranges (multi-source BFS)"), nc("pV2kpPD66nE", "Number of islands")], "dsa/bfs", [
  iq("Why does BFS find shortest paths in an unweighted graph, and why doesn't DFS?", "BFS expands nodes in non-decreasing order of distance: all nodes at distance d are processed before any at d + 1, so the first time a node is reached is via a shortest path. DFS follows one branch deeply and may reach a node first by a long route.", ["Level-by-level order", "First visit is shortest", "DFS can find long paths first"]),
  iq("Why mark a cell visited when you enqueue it rather than when you dequeue it?", "If you mark on dequeue, the same cell can be enqueued by several neighbours before it is processed, multiplying the work and memory. Marking on enqueue guarantees each cell enters the queue once.", ["Prevents duplicate enqueues", "Each node enqueued once"]),
  iq("How do you solve a problem where several sources spread at once (e.g. rotting oranges)?", "Multi-source BFS: start with all sources in the queue at distance 0, then process level by level; each level is one time step. One BFS covers everything in O(cells), instead of one BFS per source.", ["All sources at distance 0", "Level = time step", "O(cells) total"]),
]);
trace("dsa-bfs-t1", 1, 45, "from collections import deque\ng = {0: [1, 2], 1: [3], 2: [3], 3: [4], 4: []}\ndist = {0: 0}\nq = deque([0])\nwhile q:\n    u = q.popleft()\n    for v in g[u]:\n        if v not in dist:\n            dist[v] = dist[u] + 1\n            q.append(v)\nprint(dist[4])", 3,
  "0 → 1 → 3 → 4 (or via 2): three edges.", "BFS distance = number of edges on the shortest path.", "Counting nodes instead of edges (4).");
trace("dsa-bfs-t2", 2, 60, "from collections import deque\ngrid = [\"101\", \"010\", \"101\"]\nseen, count = set(), 0\nfor r in range(3):\n    for c in range(3):\n        if grid[r][c] == \"1\" and (r, c) not in seen:\n            count += 1\n            seen.add((r, c))\n            q = deque([(r, c)])\n            while q:\n                a, b = q.popleft()\n                for x, y in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):\n                    if 0 <= x < 3 and 0 <= y < 3 and grid[x][y] == \"1\" and (x, y) not in seen:\n                        seen.add((x, y))\n                        q.append((x, y))\nprint(count)", 5,
  "No two land cells share a side, so each is its own island.", "Only up/down/left/right neighbours connect.", "Treating diagonal cells as connected (1 island).");
trace("dsa-bfs-t3", 1, 30, "from collections import deque\nd = deque()\nd.append(1)\nd.append(2)\nd.appendleft(0)\nprint(d.pop() * 10 + d.popleft())", 20,
  "d is [0, 1, 2]; pop() takes 2 from the right, popleft() takes 0 from the left.", "pop = right end, popleft = left end.", "Thinking pop() removes from the left.");
Card_("dsa-bfs-c1", "Shortest path, equal edge costs", "BFS with deque; first visit = shortest.");
Card_("dsa-bfs-c2", "When to mark visited", "On enqueue.");
Card_("dsa-bfs-c3", "Several starting points", "Multi-source BFS: all in the queue at distance 0.");

// ───────────────────────── Binary search ─────────────────────────
topic("dsa-bsearch", "Binary search, including on the answer", "Halve a sorted range, or halve the range of possible answers when a yes/no check is monotone.", `
**Recognise it.** Sorted input; "first / last position"; "minimum capacity / speed / time such that …"; "maximise the minimum"; any monotone yes/no question over a numeric range.

**One template (lower bound, half-open).**

\`\`\`
lo, hi = 0, len(a)
while lo < hi:
    mid = (lo + hi) // 2
    if a[mid] < target:
        lo = mid + 1
    else:
        hi = mid
# lo = first index with a[lo] >= target (len(a) if none)
\`\`\`

Upper bound: change \`<\` to \`<=\`. bisect_left and bisect_right are these two.

**Binary search on the answer.** If "capacity c works" implies "every larger c works", binary search the smallest working c between a lower bound (max weight) and an upper bound (sum of weights). Each check is a greedy O(n) pass: O(n log range) total.

**Avoiding infinite loops.** With \`lo = mid\` you must round mid **up**: \`mid = (lo + hi + 1) // 2\`.

**Worked example 1.** 37 in 1..100: midpoints 50, 25, 37 → found in 3 steps.

**Worked example 2.** In [1, 2, 4, 4, 4, 7], lower bound of 4 is 2 and upper bound is 5: three 4s.

**Worked example 3.** Integer square root of 50: the largest m with m² ≤ 50 is 7.

**Worked example 4.** Weights 1..10 in 5 days: capacity 15 works (1–5, 6–7, 8, 9, 10), 14 does not.
`, [nc("ER_oLmdc-nw", "Capacity to ship packages (binary search on the answer)", "NeetCodeIO")], "dsa/bsearch", [
  iq("What is 'binary search on the answer'? Give an example.", "When the answer is a number and feasibility is monotone (if x works, anything larger works), binary search over the range of possible answers, using a fast check at each midpoint. Example: the minimum ship capacity to deliver packages in D days: check a capacity greedily in O(n); search between max(weights) and sum(weights). Total O(n log(sum)).", ["Monotone feasibility", "Search the answer range", "Greedy check", "Concrete example and complexity"]),
  iq("How do you avoid off-by-one errors and infinite loops in binary search?", "Commit to one invariant and template, e.g. half-open [lo, hi) with lo = mid + 1 / hi = mid, which always shrinks the range. If you write lo = mid, round mid up. Test with arrays of length 0, 1 and 2 and targets below, above and between elements.", ["One consistent template", "Shrinks every iteration", "Round up with lo = mid", "Small edge-case tests"]),
  iq("How do you find the first and last occurrence of a value in O(log n)?", "Two binary searches: lower bound (first index with a[i] ≥ x) and upper bound (first index with a[i] > x). If the lower bound is out of range or not x, it is absent; otherwise the range is [lower, upper − 1].", ["Lower bound", "Upper bound", "Absence check"]),
]);
trace("dsa-bs-t1", 2, 60, "a = list(range(1, 101))\nlo, hi, steps = 0, len(a) - 1, 0\nwhile lo <= hi:\n    steps += 1\n    mid = (lo + hi) // 2\n    if a[mid] == 37:\n        break\n    if a[mid] < 37:\n        lo = mid + 1\n    else:\n        hi = mid - 1\nprint(steps)", 3,
  "mid values: index 49 (50), index 24 (25), index 36 (37).", "Each step halves the range; about log2(100) ≈ 7 steps at most.", "Assuming it always takes the maximum number of steps.");
trace("dsa-bs-t2", 1, 30, "from bisect import bisect_left, bisect_right\na = [1, 2, 4, 4, 4, 7]\nprint(bisect_right(a, 4) - bisect_left(a, 4))", 3,
  "bisect_left = 2, bisect_right = 5: the count of 4s.", "Count = upper bound − lower bound.", "Subtracting the wrong way round.");
trace("dsa-bs-t3", 2, 60, "n = 50\nlo, hi = 0, n\nwhile lo < hi:\n    mid = (lo + hi + 1) // 2\n    if mid * mid <= n:\n        lo = mid\n    else:\n        hi = mid - 1\nprint(lo)", 7,
  "The largest m with m² ≤ 50 is 7 (49).", "With lo = mid, round mid up to avoid an infinite loop.", "Rounding down, which loops forever when hi = lo + 1.");
Card_("dsa-bs-c1", "Lower bound template", "[lo, hi) with lo = mid + 1 if a[mid] < x else hi = mid.");
Card_("dsa-bs-c2", "Binary search on the answer", "Monotone check + search the numeric range of answers.");
Card_("dsa-bs-c3", "Using lo = mid", "Round mid up: (lo + hi + 1) // 2.");

// ───────────────────────── Backtracking ─────────────────────────
topic("dsa-backtrack", "Recursion and backtracking", "Build candidates one choice at a time, undo each choice after exploring it, and prune branches that cannot succeed.", `
**Recognise it.** "All subsets / permutations / combinations", "every way to …", N-queens, sudoku, word search: the output itself is exponential.

**Template.**

\`\`\`
def go(state):
    if complete(state):
        out.append(copy of state)
        return
    for choice in choices(state):
        if not valid(choice): continue      # prune
        make(choice)
        go(state)
        undo(choice)                       # backtrack
\`\`\`

**Three shapes.**

- Subsets: include or exclude each element: 2ⁿ results.
- Permutations: pick any unused element at each level: n! results.
- Combinations: pick from index \`start\` onwards to avoid reordering; pass \`i\` (reuse allowed) or \`i + 1\` (each once).

**Copy when recording.** \`out.append(cur[:])\`; appending \`cur\` itself stores a reference that later changes.

**Pruning.** Sort candidates and break as soon as one exceeds the remaining target; track used columns and diagonals in sets for N-queens.

**Recursion limit.** Python's default depth is about 1000; deep recursion needs \`sys.setrecursionlimit\` or an explicit stack.

**Worked example 1.** Subsets of 4 elements: 2⁴ = 16.

**Worked example 2.** Combinations of 3 from 5 with a start index: C(5, 3) = 10, no duplicates.

**Worked example 3.** Combination sum [2, 3, 6, 7], target 7 → [2, 2, 3] and [7].

**Worked example 4.** N-queens on 6 × 6 has 4 solutions.
`, [nc("GBKI9VSKdGg", "Combination sum (backtracking)")], "dsa/backtrack", [
  iq("What is backtracking, and how does it differ from plain recursion?", "Backtracking is depth-first search over partial solutions: make a choice, recurse, then undo the choice so the next option starts from a clean state. The undo step and pruning of branches that cannot succeed are what distinguish it from recursion that only computes a value.", ["Choose → explore → undo", "Prune invalid branches", "DFS over partial solutions"]),
  iq("How do you avoid duplicate combinations such as [2, 3] and [3, 2]?", "Only choose candidates at or after the current start index, so each combination is generated in one canonical (sorted) order. If the input has duplicate values, sort and skip a candidate equal to the previous one at the same depth.", ["Start index", "Canonical order", "Skip equal neighbours for duplicate inputs"]),
  iq("What is the time complexity of generating all subsets or permutations?", "Subsets: O(n × 2ⁿ), since there are 2ⁿ subsets and copying each costs up to n. Permutations: O(n × n!). Backtracking cannot beat the output size; pruning only helps when many branches fail early.", ["Subsets n·2ⁿ", "Permutations n·n!", "Bounded by output size"]),
]);
trace("dsa-bt-t1", 1, 45, "out = []\ndef go(i, cur):\n    if i == 4:\n        out.append(cur[:])\n        return\n    go(i + 1, cur + [i])\n    go(i + 1, cur)\ngo(0, [])\nprint(len(out))", 16,
  "Each of 4 elements is in or out: 2⁴.", "Include/exclude → 2ⁿ leaves.", "Counting only non-empty subsets (15).");
trace("dsa-bt-t2", 1, 45, "res = []\ndef go(start, cur):\n    if len(cur) == 3:\n        res.append(cur[:])\n        return\n    for i in range(start, 5):\n        cur.append(i)\n        go(i + 1, cur)\n        cur.pop()\ngo(0, [])\nprint(len(res))", 10,
  "C(5, 3) = 10; the start index stops reorderings.", "start index → combinations, not permutations.", "Counting ordered selections (60).");
trace("dsa-bt-t3", 3, 90, "def solve(n):\n    cols, d1, d2 = set(), set(), set()\n    def go(r):\n        if r == n:\n            return 1\n        total = 0\n        for c in range(n):\n            if c in cols or r - c in d1 or r + c in d2:\n                continue\n            cols.add(c); d1.add(r - c); d2.add(r + c)\n            total += go(r + 1)\n            cols.remove(c); d1.remove(r - c); d2.remove(r + c)\n        return total\n    return go(0)\nprint(solve(6))", 4,
  "The 6-queens problem has exactly 4 solutions.", "Track columns and both diagonals (r − c, r + c) in sets.", "Guessing from the 8-queens count (92).");
Card_("dsa-bt-c1", "Backtracking skeleton", "Choose → recurse → undo; prune invalid choices.");
Card_("dsa-bt-c2", "Record a result", "out.append(cur[:]) — copy, not reference.");
Card_("dsa-bt-c3", "Combinations vs permutations", "Combinations: start index. Permutations: used[] flags.");

// ───────────────────────── Heaps ─────────────────────────
topic("dsa-heaps", "Heaps and top-k", "A min-heap gives the smallest item in O(1) and updates in O(log n): top-k, k-way merge, scheduling.", `
**Recognise it.** "k largest / smallest", "k-th largest", "merge k sorted", "most frequent k", "always process the cheapest / earliest next" (Dijkstra, scheduling).

**heapq is a min-heap.** \`heappush\`, \`heappop\`, \`heapify\` (O(n)), \`heapreplace\`, \`nlargest\`, \`nsmallest\`. For a max-heap push negated keys.

**Top-k with a size-k heap.** Keep a min-heap of the k largest seen so far; push each item and pop when the size exceeds k. The root is the k-th largest. O(n log k).

**Tuples.** Heaps compare tuples element by element: push \`(priority, tiebreak, item)\` so items themselves are never compared.

**k-way merge.** Seed the heap with the first element of each list as \`(value, list_index, position)\`; pop the smallest, push the next from the same list.

**Worked example 1.** heapify([5, 3, 8, 1, 9, 2]) puts 1 at index 0.

**Worked example 2.** 3rd largest of [4, 5, 8, 2, 3, 9] with a size-3 heap: the heap ends as {5, 8, 9}; root 5.

**Worked example 3.** Merge [[1, 4, 5], [1, 3, 4], [2, 6]] → [1, 1, 2, 3, 4, 4, 5, 6].

**Worked example 4.** Top 2 words of ["i", "love", "leetcode", "i", "love", "coding"] → ["i", "love"]: push (−count, word) to get count descending, then alphabetical.
`, [nc("XEmy13g1Qxc", "Kth largest element in an array"), R("Python docs: heapq", "https://docs.python.org/3/library/heapq.html")], "dsa/heaps", [
  iq("How do you find the k largest elements of a stream efficiently?", "Maintain a min-heap of size k: push each element, and if the heap grows past k pop the smallest. The heap always holds the k largest so far, and its root is the k-th largest. O(n log k) time, O(k) memory, and it works on streams that never end.", ["Size-k min-heap", "Pop when over k", "Root = k-th largest", "O(n log k), O(k)"]),
  iq("Why push (value, index, item) tuples instead of (value, item)?", "When two values tie, Python compares the next tuple element. If that is an object without an ordering (a list, a custom class) it raises TypeError, and even when it works it does unnecessary comparisons. A unique index as a tie-breaker avoids both.", ["Ties compare the next element", "Unorderable items raise", "Unique index fixes it"]),
  iq("Heap vs sorting for top-k: when does each win?", "Sorting is O(n log n) and fine for small n or when you need everything sorted. A heap is O(n log k), which wins when k is much smaller than n or when data arrives as a stream. Quickselect gives O(n) average for a single k-th element.", ["Sort O(n log n)", "Heap O(n log k)", "Stream / small k", "Quickselect option"]),
]);
trace("dsa-hp-t1", 1, 30, "import heapq\nh = [5, 3, 8, 1, 9, 2]\nheapq.heapify(h)\nprint(h[0])", 1,
  "heapify makes a min-heap in place; the smallest item is at index 0.", "h[0] is always the minimum.", "Thinking heapify sorts the whole list or gives the maximum.");
trace("dsa-hp-t2", 2, 45, "import heapq\nh = []\nfor x in [4, 5, 8, 2, 3, 9]:\n    heapq.heappush(h, x)\n    if len(h) > 3:\n        heapq.heappop(h)\nprint(h[0])", 5,
  "The heap keeps the 3 largest: {5, 8, 9}; its root is the 3rd largest.", "Size-k min-heap root = k-th largest.", "Answering the largest (9).");
trace("dsa-hp-t3", 1, 30, "import heapq\nprint(sum(heapq.nsmallest(3, [7, 1, 5, 3, 9])))", 9,
  "The three smallest are 1, 3 and 5.", "nsmallest returns the k smallest in order.", "Taking the first three items (7 + 1 + 5).");
Card_("dsa-hp-c1", "k-th largest of a stream", "Min-heap of size k; root is the answer.");
Card_("dsa-hp-c2", "Max-heap with heapq", "Push negated keys.");
Card_("dsa-hp-c3", "Heap entries that might tie", "(priority, unique index, item).");

// ───────────────────────── 1-D DP ─────────────────────────
topic("dsa-dp", "1-D dynamic programming", "Define the answer for a prefix, write the recurrence from smaller prefixes, and fill it bottom-up (often with two variables).", `
**Recognise it.** "Number of ways", "minimum cost / coins / steps", "maximum without taking adjacent", "longest increasing …", where the choice at step i depends only on earlier answers.

**Recipe.**

1. **State:** what does dp[i] mean? ("best total using the first i houses").
2. **Recurrence:** how dp[i] follows from smaller states.
3. **Base cases:** dp[0], dp[1].
4. **Order:** fill from small to large (bottom-up), or use recursion + \`@lru_cache\` (top-down).
5. **Space:** if dp[i] only needs the last one or two values, keep two variables.

**Classics.**

- Stairs (1 or 2 steps): ways(n) = ways(n − 1) + ways(n − 2), Fibonacci.
- House robber: best(i) = max(best(i − 1), best(i − 2) + a[i]).
- Coin change: dp[a] = 1 + min(dp[a − c]) over coins c; greedy fails for coins like [1, 3, 4].
- Longest increasing subsequence: dp[i] = 1 + max(dp[j]) for j < i with a[j] < a[i]: O(n²), or O(n log n) with patience sorting.

**Worked example 1.** Stairs: 1, 2, 3, 5, 8, 13 for n = 1 … 6.

**Worked example 2.** Min-cost stairs [10, 15, 20]: start on step 1 and jump to the top: 15.

**Worked example 3.** Coins [1, 3, 4], amount 6: greedy takes 4 + 1 + 1 (3 coins); DP finds 3 + 3 (2 coins).

**Worked example 4.** LIS of [10, 9, 2, 5, 3, 7, 101, 18] is 4 (e.g. 2, 3, 7, 18).
`, [nc("73r3KWiEvyk", "House robber"), nc("H9bfqozjoqs", "Coin change")], "dsa/dp", [
  iq("How do you approach a new DP problem?", "Define the state precisely (what dp[i] means), write the recurrence in terms of smaller states, set base cases, choose a fill order, then reduce space if only recent states are needed. Check it on a tiny example by hand before coding.", ["State definition", "Recurrence", "Base cases", "Order / memoisation", "Space reduction"]),
  iq("Why does greedy fail for coin change, and what does DP do instead?", "Taking the largest coin first is only optimal for special coin systems. With [1, 3, 4] and 6, greedy uses 4 + 1 + 1 = 3 coins, but 3 + 3 uses 2. DP computes the best answer for every smaller amount and takes the minimum over the last coin used, so it never commits to a bad first choice.", ["Counterexample", "Greedy commits early", "DP over all amounts / last coin"]),
  iq("Top-down memoisation vs bottom-up tabulation: trade-offs?", "Top-down (@lru_cache) is quick to write from the recurrence and only computes reachable states, but uses recursion depth and has call overhead. Bottom-up avoids recursion limits, is usually faster, and makes space optimisation (two variables) easy, but you must pick the fill order.", ["Top-down: easy, reachable states, recursion depth", "Bottom-up: no recursion, faster, space reduction"]),
]);
trace("dsa-dp-t1", 1, 30, "a, b = 1, 1\nfor _ in range(6):\n    a, b = b, a + b\nprint(a)", 13,
  "Ways for n = 1 … 6: 1, 2, 3, 5, 8, 13.", "Stairs = Fibonacci shifted by one.", "Off by one: printing b (21) or stopping at n = 5.");
trace("dsa-dp-t2", 2, 60, "cost = [10, 15, 20]\na = b = 0\nfor c in cost:\n    a, b = b, min(a, b) + c\nprint(min(a, b))", 15,
  "Costs to stand on each step: 10, 15, 30. You can finish from either of the last two steps: min(15, 30) = 15.", "dp[i] = cost[i] + min(dp[i − 1], dp[i − 2]).", "Adding the cost of the top, which has no cost.");
trace("dsa-dp-t3", 2, 60, "a = [10, 9, 2, 5, 3, 7, 101, 18]\ndp = [1] * len(a)\nfor i in range(len(a)):\n    for j in range(i):\n        if a[j] < a[i]:\n            dp[i] = max(dp[i], dp[j] + 1)\nprint(max(dp))", 4,
  "For example 2, 5, 7, 101 or 2, 3, 7, 18.", "dp[i] = longest increasing subsequence ending at i.", "Requiring the elements to be adjacent.");
Card_("dsa-dp-c1", "DP recipe", "State → recurrence → base cases → order → space.");
Card_("dsa-dp-c2", "House robber recurrence", "best(i) = max(best(i − 1), best(i − 2) + a[i]).");
Card_("dsa-dp-c3", "Coin change", "dp[a] = 1 + min(dp[a − c]); greedy can fail.");
