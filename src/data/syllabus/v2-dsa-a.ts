/**
 * v2 DSA, part A: Complexity · Arrays and hashing. Fixed ids; every answer is recomputed in Pyodide.
 */
import { iq, lessonWriter } from "./v2-shared";
import { D } from "./v2-dsa-src";

const { L, Q, C } = lessonWriter("dsa");
const CX = "Complexity";
const AH = "Arrays and hashing";

// ───────────────────────── Complexity ─────────────────────────

L("dsa2-big-o", CX, "Big-O and complexity analysis", "Counting how work grows with input size, and the input limits that tell you which complexity you need.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "The OA says n ≤ 10⁵ and the time limit is 1 second. Your nested loop passes the samples. Will it pass the hidden tests?",
  intuition: `
**The situation.** Online assessments hide large test cases. A solution that works on 10 rows can time out on 100,000. Before writing code, estimate how the work grows.

**The idea.** Big-O describes how running time (or memory) grows as the input size $n$ grows, ignoring constant factors and small terms. Count the dominant operation: loops over the input, nested loops, recursive calls.

- One pass over the data: $O(n)$.
- A loop inside a loop over the same data: $O(n^2)$.
- Halving the search space each step: $O(\\log n)$.
- Sorting: $O(n\\log n)$.

**Use the constraints.** Python does roughly 10⁷ simple operations per second. So $n \\le 10^5$ rules out $O(n^2)$ (10¹⁰ operations) and asks for $O(n\\log n)$ or $O(n)$. $n \\le 20$ invites exponential search ($2^{20} \\approx 10^6$).
`,
  maths: `
**In one breath.** Keep the fastest-growing term, drop constants: $3n^2 + 50n + 7 = O(n^2)$; sequential steps add, nested steps multiply.

**Common classes, slowest-growing first.**

| Class | Example | n that fits in ~1 s of Python |
|---|---|---|
| $O(1)$ | dict lookup | any |
| $O(\\log n)$ | binary search | any |
| $O(n)$ | one pass, counting | ~10⁶–10⁷ |
| $O(n\\log n)$ | sort, heap of n items | ~10⁵–10⁶ |
| $O(n^2)$ | all pairs | ~3×10³ |
| $O(2^n)$ | all subsets | ~20 |
| $O(n!)$ | all orderings | ~9 |

**Reading code.**

\`\`\`python
def pairs_with_sum(a, k):          # O(n^2): every pair once
    count = 0
    for i in range(len(a)):
        for j in range(i + 1, len(a)):
            count += a[i] + a[j] == k
    return count

def pairs_with_sum_fast(a, k):     # O(n): one pass with a dict
    seen, count = {}, 0
    for x in a:
        count += seen.get(k - x, 0)
        seen[x] = seen.get(x, 0) + 1
    return count
\`\`\`

The inner loop of the first version runs $\\frac{n(n-1)}{2}$ times: 4,950 for $n = 100$.

**Recursion.** Cost = (number of calls) × (work per call). Naive Fibonacci makes about $1.6^n$ calls; with memoisation it makes $n$.

**Space.** Count extra memory: a dict of all items is $O(n)$; recursion depth $d$ uses $O(d)$ stack (Python's default limit is about 1,000 frames).

**Amortised cost.** \`list.append\` is $O(1)$ amortised: occasional resizes copy everything, but they're rare enough that the average stays constant.
`,
  practice: `
**Signals in the problem statement.** $n \\le 10^5$–$10^6$: aim for $O(n)$ or $O(n\\log n)$. $n \\le 5{,}000$: $O(n^2)$ is fine. $n \\le 20$: bitmasks or backtracking. Values up to 10⁹ with small $n$: sort or binary search on the answer, not an array indexed by value.

**In interviews.** State the brute force and its complexity first, then improve. Always give time and space.

**Practise:** Two Sum, Contains Duplicate, Valid Anagram (state brute force and optimal complexity for each).
`,
  traps: [
    { trap: "Two separate loops over n make it O(n²).", why: "Sequential loops add: O(n) + O(n) = O(n). Only nested loops multiply." },
    { trap: "`x in my_list` is O(1) because it's one line.", why: "Membership in a list scans it: O(n). Inside a loop that's O(n²). Use a set for O(1) average lookups." },
    { trap: "Big-O tells you the exact running time.", why: "It describes growth. An O(n) loop with heavy work per step can be slower than an O(n log n) built-in sort on small inputs." },
  ],
  say: {
    prompt: "How do you decide what time complexity a coding problem needs, and how do you analyse your own solution?",
    secs: 45,
    check: ["Read the input constraints and map them to a target complexity", "Count dominant operations: sequential adds, nested multiplies", "Name the brute force and its cost before optimising", "State space complexity as well as time", "Mention hidden costs (list membership, slicing, string concatenation)"],
    followups: [
      { q: "What does amortised O(1) mean for list.append?", a: "Most appends are constant time; occasionally the list resizes and copies everything, but capacity grows geometrically, so the total cost of n appends is O(n), i.e. O(1) on average per append." },
      { q: "Why is naive recursive Fibonacci exponential?", a: "Each call makes two more calls and the same subproblems are recomputed many times; the call tree has about φⁿ ≈ 1.6ⁿ nodes. Memoisation reduces it to n distinct calls." },
      { q: "When would you accept O(n²)?", a: "When n is small (a few thousand), when the constant factor of the clever version is large, or as a first correct version in an interview before optimising." },
    ],
    answer: `I start from the constraints: with n up to 10⁵ I need roughly O(n log n) or better, since O(n²) would be 10¹⁰ operations; with n around 20 an exponential search is fine. Then I write down the brute force and its complexity, and look for a structure that removes the inner loop: a hash map, sorting plus two pointers, a heap, or binary search.

To analyse my code I count the dominant operation: sequential loops add, nested loops multiply, recursion is number of calls times work per call. I also watch for hidden costs in Python, like membership tests on lists, slicing, or repeated string concatenation, and I state the extra space used.`,
    avoid: ["Giving only time complexity and forgetting space", "Calling list membership O(1)"],
  },
  terms: [["Big-O", "Upper bound on growth rate, ignoring constants."], ["Amortised", "Average cost per operation over a sequence of operations."], ["Dominant term", "The fastest-growing term, which decides the class."]],
  sources: [D.bigO],
});
Q({ id: "dsa2-bo-1", d: 1, secs: 30, prompt: "How many times does the inner statement run in `for i in range(n): for j in range(i+1, n): ...` with n = 100?", answer: 4950, tol: 0.5, explain: "n(n − 1)/2 = 4,950.", py: "n = 100\nc = 0\nfor i in range(n):\n    for j in range(i+1, n):\n        c += 1\nanswer = c" });
Q({ id: "dsa2-bo-2", d: 1, secs: 30, prompt: "Simplify 3n² + 50n log n + 7 to Big-O.", options: ["O(n log n)", "O(n²)", "O(n³)", "O(3n²)"], answer: 1, explain: "n² grows fastest; constants are dropped.", py: "import math\nn = 10**6\nterms = [3*n*n, 50*n*math.log2(n), 7]\nanswer = 1 if terms.index(max(terms)) == 0 else 0" });
Q({ id: "dsa2-bo-3", d: 2, secs: 45, prompt: "How many calls does naive recursive fib(n) (fib(0)=0, fib(1)=1, fib(n)=fib(n−1)+fib(n−2)) make in total for n = 20?", answer: 21891, tol: 0.5, explain: "Calls C(n) = C(n−1) + C(n−2) + 1 with C(0) = C(1) = 1 gives 21,891: exponential growth. Memoised, it's 21 distinct calls.", py: "calls = 0\ndef fib(n):\n    global calls\n    calls += 1\n    return n if n < 2 else fib(n-1) + fib(n-2)\nfib(20)\nanswer = calls" });
Q({ id: "dsa2-bo-4", d: 1, secs: 30, prompt: "n ≤ 2 × 10⁵ and a 1-second limit in Python. Which complexity should you aim for?", options: ["O(n²)", "O(n log n) or better", "O(2ⁿ)", "O(n³)"], answer: 1, explain: "O(n²) is 4 × 10¹⁰ operations; O(n log n) is about 3.5 × 10⁶.", py: "import math\nn = 2*10**5\nanswer = 1 if n*math.log2(n) < 1e7 < n*n else 0" });
C("dsa2-bo-c1", "Constraint → target complexity", "n ≤ 20: 2ⁿ · n ≤ 3,000: n² · n ≤ 10⁵–10⁶: n log n or n.");
C("dsa2-bo-c2", "Adding vs multiplying", "Sequential loops add; nested loops multiply; recursion = calls × work per call.");

L("dsa2-python-costs", CX, "Cost of Python built-ins", "The hidden complexity of list, dict, set, string and deque operations, and the swaps that fix slow code.", {
  kind: "concept", mins: 20, mathsLabel: "Code", prereq: ["dsa2-big-o"],
  hook: "Your solution is O(n) on paper but times out. The culprit is one innocent-looking line. Which line?",
  intuition: `
**The situation.** Python hides loops inside built-ins. \`x in lst\`, \`lst.pop(0)\`, \`s += ch\` and slicing all look like one step but touch many elements.

**The idea.** Know the cost of each container operation and choose the container that makes your hot operation cheap:

- Lookups by value → \`set\` / \`dict\` (hash tables, $O(1)$ average).
- Add/remove at both ends → \`collections.deque\` ($O(1)$), not a list.
- Smallest/largest repeatedly → \`heapq\` ($O(\\log n)$ per push/pop).
- Build strings → collect pieces in a list and \`''.join\` once.
`,
  maths: `
**In one breath.** list: index/append $O(1)$, insert/pop(0)/\`in\` $O(n)$; dict/set: get/add/\`in\` $O(1)$ average; deque: both ends $O(1)$; sort $O(n\\log n)$; slice of length k $O(k)$.

| Operation | list | deque | set / dict |
|---|---|---|---|
| index \`a[i]\` | $O(1)$ | $O(n)$ in the middle | n/a / key lookup $O(1)$ |
| append / pop at end | $O(1)$ | $O(1)$ | add $O(1)$ |
| insert / pop at front | $O(n)$ | $O(1)$ | n/a |
| \`x in c\` | $O(n)$ | $O(n)$ | $O(1)$ average |
| copy / slice of k | $O(k)$ | $O(n)$ | $O(n)$ |

**Fix 1: membership.**

\`\`\`python
# O(n*m): list membership inside a loop
common = [x for x in a if x in b]
# O(n + m): build a set once
bs = set(b)
common = [x for x in a if x in bs]
\`\`\`

**Fix 2: queue.**

\`\`\`python
from collections import deque
q = deque([start])
while q:
    node = q.popleft()      # O(1); list.pop(0) would be O(n)
\`\`\`

**Fix 3: strings are immutable.** \`s += ch\` in a loop can copy the whole string each time ($O(n^2)$ worst case). Use \`parts.append(ch)\` then \`''.join(parts)\`.

**Worked example.** Removing from the front of a 10⁵-element list one item at a time shifts about $\\frac{n^2}{2} = 5 \\times 10^9$ element moves; a deque does 10⁵ constant-time pops.
`,
  practice: `
**Checklist before submitting.** Any \`in\` on a list inside a loop? Any \`pop(0)\` or \`insert(0, x)\`? Any slicing inside a loop (\`a[i:]\`)? Any \`sorted()\` inside a loop? Any string built with \`+=\`?

**Handy tools.** \`collections.Counter\` (counting), \`defaultdict(list)\` (grouping), \`deque\` (queues, sliding windows), \`heapq\` (top-k), \`bisect\` (sorted inserts and searches), \`functools.cache\` (memoisation).

**Practise:** Intersection of Two Arrays, Design Hit Counter-style queue problems, Reverse Words in a String.
`,
  traps: [
    { trap: "Sets and dicts are always O(1).", why: "O(1) on average. Many hash collisions make them O(n) worst case; in practice with built-in types this is rare, but say 'average'." },
    { trap: "list.pop() and list.pop(0) cost the same.", why: "pop() from the end is O(1); pop(0) shifts every remaining element, O(n). Use deque.popleft()." },
    { trap: "Slicing is free.", why: "a[i:] copies n − i elements. Recursing on slices makes an O(n) algorithm O(n²); pass indices instead." },
  ],
  say: {
    prompt: "Your O(n) solution in Python is timing out. How do you find and fix the problem?",
    secs: 45,
    check: ["Look for hidden O(n) operations: list membership, pop(0)/insert(0), slicing, string +=", "Swap containers: set/dict for lookups, deque for queues, heapq for min/max", "Build strings with join", "Avoid re-sorting or re-copying inside loops", "Mention average vs worst case for hash tables"],
    followups: [
      { q: "Why is `''.join(parts)` faster than `s += ch` in a loop?", a: "Strings are immutable, so += may create a new string and copy everything so far each time (O(n²) total); join computes the total length once and copies each piece once (O(n))." },
      { q: "When is a list better than a deque?", a: "When you need fast random access by index or slicing; deque indexing in the middle is O(n). Lists are also more memory-compact." },
      { q: "What is the worst case of a dict lookup and when can it happen?", a: "O(n) if many keys collide into the same bucket, e.g. adversarially crafted keys; Python randomises string hashing to make this unlikely." },
    ],
    answer: `I'd look for operations that hide a loop. The usual suspects are a membership test on a list inside a loop, pop(0) or insert(0) on a list, slicing inside a loop or recursion, sorting inside a loop, and building a string with +=.

The fixes are to change the container: a set or dict for lookups, which is O(1) on average; a deque for queue operations at both ends; heapq when I repeatedly need the smallest item; passing indices instead of slices; and collecting string pieces in a list and joining once. Each swap turns an O(n) step into O(1) or O(log n), which usually takes the whole solution from O(n²) to O(n) or O(n log n).`,
    avoid: ["\u201cPython is just slow\u201d without finding the hot spot", "Calling set lookups O(1) worst case"],
  },
  terms: [["deque", "Double-ended queue with O(1) appends and pops at both ends."], ["Amortised O(1)", "Constant on average over many operations, e.g. list.append."], ["Immutable string", "Every modification creates a new string object."]],
  sources: [D.coll, D.hash],
});
Q({ id: "dsa2-pc-1", d: 1, secs: 30, prompt: "Which operation is O(n) on a Python list of length n?", options: ["a[-1]", "a.append(x)", "a.pop(0)", "a.pop()"], answer: 2, explain: "pop(0) shifts every remaining element left.", py: "answer = 2" });
Q({ id: "dsa2-pc-2", d: 2, secs: 45, prompt: "Popping every element from the front of a list of n = 10,000 items with pop(0): roughly how many element shifts happen in total? (exact value)", answer: 49995000, tol: 0.5, explain: "Each pop(0) shifts the remaining n − 1, n − 2, … elements: n(n − 1)/2 = 49,995,000.", py: "n = 10000\nanswer = sum(n-1-i for i in range(n))" });
Q({ id: "dsa2-pc-3", d: 1, secs: 30, prompt: "What does this print? `from collections import deque; d = deque([1,2,3], maxlen=3); d.append(4); print(d[0])`", answer: 2, tol: 0.5, explain: "A bounded deque drops from the opposite end: [2, 3, 4].", py: "from collections import deque\nd = deque([1,2,3], maxlen=3); d.append(4)\nanswer = d[0]" });
Q({ id: "dsa2-pc-4", d: 2, secs: 45, prompt: "a has 1,000 items and b has 1,000 items. `[x for x in a if x in b]` with b a list does at most how many comparisons in the worst case?", answer: 1000000, tol: 0.5, explain: "Each of the 1,000 membership tests can scan all 1,000 items of b: 10⁶. Converting b to a set makes it about 1,000 hash lookups.", py: "answer = 1000*1000" });
C("dsa2-pc-c1", "Container costs", "list: end O(1), front O(n), `in` O(n). deque: both ends O(1). set/dict: `in` O(1) avg.");
C("dsa2-pc-c2", "Building strings", "Append pieces to a list, then ''.join(parts) once.");

L("dsa2-complexity-practice", CX, "Complexity practice", "Analyse and improve the complexity of short solutions out loud.", {
  kind: "interview", mins: 20, prereq: ["dsa2-big-o", "dsa2-python-costs"],
  hook: "Say the complexity of each solution, then how you'd improve it. Open each one to tick off what the interviewer listens for.",
}, [
  iq("What's the time complexity of checking whether a list of n numbers has duplicates by comparing every pair? How would you improve it?", "Comparing every pair is O(n²) time, O(1) extra space. Sorting and comparing neighbours is O(n log n) time. A set gives O(n) average time and O(n) space: add each item and stop if it's already present.", ["O(n²) brute force", "Sort: O(n log n)", "Set: O(n) time, O(n) space", "Trade-off between time and memory"]),
  iq("A function recursively computes the number of ways to climb n stairs taking 1 or 2 steps. It's slow at n = 40. Why, and what's the fix?", "The recursion branches twice per call and recomputes the same subproblems: about 1.6ⁿ calls. Memoise with functools.cache or iterate bottom-up keeping the last two values: O(n) time, O(1) space for the iterative version.", ["Exponential due to overlapping subproblems", "Memoisation", "Bottom-up O(n) time, O(1) space"]),
  iq("You process a queue of 10⁵ tasks using list.pop(0). It times out. Explain and fix.", "pop(0) shifts all remaining elements, so n pops cost O(n²) ≈ 5 × 10⁹ moves. Use collections.deque and popleft(), O(1) each, total O(n).", ["pop(0) is O(n)", "Total O(n²)", "deque.popleft O(1)"]),
  iq("Your solution sorts the array inside a loop that runs n times. What's the complexity and how do you restructure it?", "n sorts of n items is O(n² log n). Sort once before the loop, or maintain order incrementally with bisect.insort (O(n) per insert) or a heap (O(log n) per push/pop) depending on what you need.", ["O(n² log n)", "Sort once outside", "Heap or bisect for incremental order"]),
  iq("What's the space complexity of a recursive depth-first search on a tree with n nodes that's a long chain? What can go wrong in Python?", "The recursion depth equals the tree height, n for a chain, so O(n) stack space. Python's default recursion limit is about 1,000, so a deep chain raises RecursionError; use an explicit stack or raise the limit carefully.", ["O(height) stack", "Chain → O(n)", "Recursion limit ~1,000", "Iterative DFS with explicit stack"]),
]);

// ───────────────────────── Arrays and hashing ─────────────────────────

L("dsa2-hashmap", AH, "Hash maps and counting", "Turning 'have I seen…' and 'how many…' questions into O(1) lookups: complements, frequencies, grouping.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-python-costs"],
  hook: "Find two numbers that add up to a target in one pass. What do you need to remember about the numbers you've already seen?",
  intuition: `
**The situation.** Many OA problems are a disguised question: "for this item, does a partner exist among the ones I've seen?" or "how often does each thing occur?". The brute force compares every pair.

**The idea.** Remember the past in a dict or set as you scan. For each new item, ask the dict a constant-time question.

- **Complement lookup:** for target sum $k$, at $x$ look up $k - x$.
- **Frequency counting:** \`Counter\` for anagrams, majority element, first unique character.
- **Grouping:** a dict from a canonical key to a list (e.g. sorted letters → anagram group).
- **Index memory:** first or last position where something happened.

**Recognise it** when the brute force is "for each i, search all j" and the search is for an exact value or key.
`,
  maths: `
**In one breath.** Scan once; store what later items will need; each lookup is $O(1)$ average; total $O(n)$ time, $O(n)$ space.

**Template.**

\`\`\`python
def two_sum(nums, target):
    pos = {}                          # value -> index seen so far
    for i, x in enumerate(nums):
        if target - x in pos:         # complement seen earlier
            return [pos[target - x], i]
        pos[x] = i                    # store AFTER checking: no self-pairing
    return []
\`\`\`

**Worked problem 1: group anagrams.** Words that are anagrams share their sorted letters.

\`\`\`python
from collections import defaultdict
def group_anagrams(words):
    groups = defaultdict(list)
    for w in words:
        groups[''.join(sorted(w))].append(w)   # or a 26-count tuple key: O(L)
    return list(groups.values())
# ["eat","tea","tan","ate","nat","bat"] -> 3 groups
\`\`\`

Time $O(n\\cdot L\\log L)$ with sorting keys, $O(n\\cdot L)$ with count keys.

**Worked problem 2: longest consecutive run.** \`[100, 4, 200, 1, 3, 2]\` → 4 (1, 2, 3, 4).

\`\`\`python
def longest_consecutive(nums):
    s, best = set(nums), 0
    for x in s:
        if x - 1 not in s:            # only start at the beginning of a run
            y = x
            while y + 1 in s:
                y += 1
            best = max(best, y - x + 1)
    return best
\`\`\`

Each number is visited by the inner loop at most once overall, so $O(n)$.

**Edge cases.** Duplicates (store counts, not just presence), the same element used twice (check before inserting), empty input, negative numbers (fine for hashing).
`,
  practice: `
**Signals:** "pair/triple with sum", "anagram", "duplicate", "first unique", "most frequent", "group by", "seen before", "isomorphic".

**Variations.** Counting pairs (add \`count[k − x]\` instead of returning), pairs with difference $k$, majority element (Boyer–Moore for $O(1)$ space), top-k frequent (Counter + heap or bucket sort).

**Practise:** Two Sum, Valid Anagram, Group Anagrams, Top K Frequent Elements, Longest Consecutive Sequence, Contains Duplicate II, Isomorphic Strings, First Unique Character.
`,
  traps: [
    { trap: "Insert x into the dict, then check for target − x.", why: "If target = 2x, the element matches itself. Check first, then insert." },
    { trap: "A set is enough for counting pairs.", why: "With duplicates you need multiplicities: [3, 3, 3] has three pairs summing to 6. Store counts in a dict." },
    { trap: "Sorting first is always as good.", why: "Sorting costs O(n log n) and loses original indices; the dict pass is O(n). Sorting wins only when you need O(1) extra space or ordered output." },
  ],
  say: {
    prompt: "Solve Two Sum and explain its complexity. How would you handle counting all pairs instead?",
    secs: 45,
    check: ["Brute force O(n²) stated first", "One pass with a dict of value → index; look up target − x before inserting", "O(n) time, O(n) space (average)", "Counting variant: add count[target − x], then increment count[x]", "Edge cases: duplicates, self-pairing, no answer"],
    followups: [
      { q: "How would you do it with O(1) extra space?", a: "Sort (keeping original indices if needed) and use two pointers from both ends: O(n log n) time, O(1) extra space apart from the sort." },
      { q: "What key would you use to group anagrams in O(L) per word?", a: "A tuple of 26 letter counts; it's hashable and avoids sorting each word." },
      { q: "Why does longest-consecutive-sequence run in O(n) despite a nested loop?", a: "The inner while loop only starts at run beginnings (x − 1 not in the set), so each number is stepped over at most once in total." },
    ],
    answer: `The brute force checks every pair, O(n²). Instead I scan once and keep a dict from each value to its index. For each x I first look up target minus x; if it's there I return both indices, otherwise I store x. Checking before inserting prevents pairing an element with itself. That's O(n) time and O(n) space on average.

To count all pairs, I keep a dict of counts instead of indices: for each x I add count[target − x] to the answer, then increment count[x]. That handles duplicates correctly, for example three 3s with target 6 give three pairs.`,
    avoid: ["Inserting before checking", "Using a set when duplicates matter"],
  },
  terms: [["Complement", "The value that would complete the pair: target − x."], ["Counter", "dict subclass counting hashable items."], ["Canonical key", "A normalised form shared by equivalent items (sorted letters for anagrams)."]],
  sources: [D.twoSum, D.coll, D.hash],
});
Q({ id: "dsa2-hm-1", d: 1, secs: 45, prompt: "Two Sum on nums = [3, 2, 4], target 6 with the one-pass dict method. What is the sum of the two returned indices?", answer: 3, tol: 0.5, explain: "Returns [1, 2] (2 + 4). Index 0 isn't paired with itself because we check before inserting.", py: "def two_sum(nums, t):\n    pos = {}\n    for i, x in enumerate(nums):\n        if t-x in pos:\n            return [pos[t-x], i]\n        pos[x] = i\nanswer = sum(two_sum([3,2,4], 6))" });
Q({ id: "dsa2-hm-2", d: 2, secs: 60, prompt: "How many index pairs (i < j) in [1, 5, 7, -1, 5] sum to 6?", answer: 3, tol: 0.5, explain: "(1, 5), (1, 5) with the second 5, and (7, −1): 3.", py: "from collections import Counter\ncnt, ans = Counter(), 0\nfor x in [1,5,7,-1,5]:\n    ans += cnt[6-x]; cnt[x] += 1\nanswer = ans" });
Q({ id: "dsa2-hm-3", d: 1, secs: 45, prompt: "How many anagram groups are in ['eat','tea','tan','ate','nat','bat']?", answer: 3, tol: 0.5, explain: "{eat, tea, ate}, {tan, nat}, {bat}.", py: "from collections import defaultdict\ng = defaultdict(list)\nfor w in ['eat','tea','tan','ate','nat','bat']:\n    g[''.join(sorted(w))].append(w)\nanswer = len(g)" });
Q({ id: "dsa2-hm-4", d: 2, secs: 60, prompt: "Length of the longest run of consecutive integers in [0, 3, 7, 2, 5, 8, 4, 6, 0, 1]?", answer: 9, tol: 0.5, explain: "0 through 8.", py: "nums = [0,3,7,2,5,8,4,6,0,1]\ns, best = set(nums), 0\nfor x in s:\n    if x-1 not in s:\n        y = x\n        while y+1 in s: y += 1\n        best = max(best, y-x+1)\nanswer = best" });
C("dsa2-hm-c1", "Two Sum pattern", "Scan; look up target − x in a dict BEFORE inserting x. O(n) time and space.");
C("dsa2-hm-c2", "Counting pairs with duplicates", "ans += count[k − x]; count[x] += 1.");

L("dsa2-prefix-sums", AH, "Prefix sums and difference arrays", "Precomputing running totals for O(1) range sums, subarray-sum counting with a hash map, and batched range updates.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-hashmap"],
  hook: "Count the subarrays that sum to exactly k, with negative numbers allowed. Why does sliding window fail here, and what replaces it?",
  intuition: `
**The situation.** "Sum of a range", "number of subarrays with sum k", "apply many range increments" all repeat the same additions over and over.

**The idea.** Precompute $P[i]$ = sum of the first $i$ elements. Then any range sum is one subtraction: $\\text{sum}(l..r) = P[r+1] - P[l]$.

A subarray ending at $r$ sums to $k$ exactly when some earlier prefix equals $P[r+1] - k$. So keep a dict counting the prefixes seen so far, seeded with prefix 0 (the empty prefix), and count matches as you go. This works with negative numbers, where sliding window doesn't (the window sum isn't monotonic).

**The reverse trick:** a **difference array** turns "add $v$ to every element in $[l, r]$" into two point updates, applied with one prefix sum at the end.
`,
  maths: `
**In one breath.** $P[0] = 0$, $P[i+1] = P[i] + a[i]$; range sum $P[r+1] - P[l]$; subarrays summing to $k$ = number of pairs $j < i$ with $P[i] - P[j] = k$.

**Template: range sums.**

\`\`\`python
from itertools import accumulate
a = [2, -1, 3, 4, -2]
P = [0] + list(accumulate(a))     # [0, 2, 1, 4, 8, 6]
def range_sum(l, r):              # inclusive l..r
    return P[r + 1] - P[l]
range_sum(1, 3)                   # -1 + 3 + 4 = 6
\`\`\`

**Worked problem 1: subarrays with sum k.**

\`\`\`python
from collections import defaultdict
def subarray_sum(nums, k):
    seen = defaultdict(int)
    seen[0] = 1                   # the empty prefix
    total = count = 0
    for x in nums:
        total += x
        count += seen[total - k]  # earlier prefixes that complete a k-sum
        seen[total] += 1
    return count
subarray_sum([1, 1, 1], 2)        # 2
subarray_sum([3, 4, 7, 2, -3, 1, 4, 2], 7)   # 4
\`\`\`

$O(n)$ time, $O(n)$ space.

**Worked problem 2: difference array.** Length 5, updates (1, 3, +2) and (2, 4, +3):

\`\`\`python
n = 5
diff = [0] * (n + 1)
for l, r, v in [(1, 3, 2), (2, 4, 3)]:
    diff[l] += v
    diff[r + 1] -= v              # r + 1, not r
result = list(accumulate(diff[:n]))   # [0, 2, 5, 5, 3]
\`\`\`

$q$ updates cost $O(q + n)$ instead of $O(q\\cdot n)$.

**2-D prefix sums.** $S[i][j]$ = sum of the top-left $i \\times j$ block; rectangle sum by inclusion–exclusion of four corners.

**Edge cases.** Forgetting the seed \`{0: 1}\` misses subarrays that start at index 0; off-by-one between $P[r]$ and $P[r+1]$.
`,
  practice: `
**Signals:** many range-sum queries; "number of subarrays with sum / average / divisible by k"; "equal number of 0s and 1s" (map 0 → −1, find zero-sum subarrays); many range increments.

**Variations.** Divisible by k: store prefix mod k. Longest subarray with sum k: store the **first** index of each prefix. Product of array except self: prefix and suffix products.

**Practise:** Range Sum Query – Immutable, Subarray Sum Equals K, Continuous Subarray Sum, Contiguous Array, Product of Array Except Self, Range Addition, Corporate Flight Bookings.
`,
  traps: [
    { trap: "Use a sliding window for 'subarrays summing to k'.", why: "Sliding window needs the sum to grow when you extend and shrink when you contract, which fails with negative numbers. Prefix sums + a hash map work for any integers." },
    { trap: "Start the prefix dict empty.", why: "Subarrays starting at index 0 need the empty prefix. Seed with {0: 1}; for 'longest', seed {0: -1}." },
    { trap: "Difference array: subtract at r.", why: "The update covers r inclusive, so the cancel goes at r + 1 (allocate n + 1 slots)." },
  ],
  say: {
    prompt: "How do you count subarrays that sum to k when the array has negative numbers?",
    secs: 45,
    check: ["Prefix sums: subarray (j, i] sums to P[i] − P[j]", "Count earlier prefixes equal to current prefix − k with a dict", "Seed the dict with {0: 1}", "O(n) time, O(n) space", "Explain why sliding window fails with negatives"],
    followups: [
      { q: "How would you find the longest such subarray instead of counting?", a: "Store the first index at which each prefix sum appears (seed {0: -1}); at each i, if prefix − k was seen at index j, the length is i − j. Don't overwrite earlier indices." },
      { q: "How do you handle 'sum divisible by k'?", a: "Two prefixes with the same remainder mod k bound a subarray divisible by k, so count prefix remainders (normalise negatives with Python's %, which is already non-negative)." },
      { q: "When is a difference array the right tool?", a: "Many range updates followed by reads at the end: each update is two point changes, and one prefix sum materialises the result in O(n + q)." },
    ],
    answer: `I use prefix sums. If P is the running total, the subarray between positions j and i sums to P[i] minus P[j], so a subarray ending here sums to k exactly when some earlier prefix equals the current prefix minus k. I scan once, keep a dict counting the prefixes seen, add the count for current minus k at each step, then record the current prefix.

The dict starts with prefix 0 seen once, so subarrays starting at the beginning are counted. It's O(n) time and O(n) space. Sliding window doesn't work here because with negative numbers extending the window can decrease the sum, so you can't decide when to shrink.`,
    avoid: ["Proposing sliding window with negatives", "Forgetting the {0: 1} seed"],
  },
  terms: [["Prefix sum", "P[i] = sum of the first i elements."], ["Difference array", "Store changes so a prefix sum reconstructs values after range updates."], ["Inclusion–exclusion", "2-D rectangle sum from four prefix corners."]],
  sources: [D.dp, D.hash],
});
Q({ id: "dsa2-ps-1", d: 1, secs: 30, prompt: "a = [2, −1, 3, 4, −2]. Using prefix sums, what is the sum of a[1..3] inclusive?", answer: 6, tol: 0.5, explain: "P = [0, 2, 1, 4, 8, 6]; P[4] − P[1] = 8 − 2 = 6.", py: "from itertools import accumulate\na = [2,-1,3,4,-2]\nP = [0] + list(accumulate(a))\nanswer = P[4] - P[1]" });
Q({ id: "dsa2-ps-2", d: 2, secs: 60, prompt: "How many subarrays of [3, 4, 7, 2, −3, 1, 4, 2] sum to 7?", answer: 4, tol: 0.5, explain: "[3, 4], [7], [7, 2, −3, 1], [1, 4, 2].", py: "from collections import defaultdict\nseen = defaultdict(int); seen[0] = 1\nt = c = 0\nfor x in [3,4,7,2,-3,1,4,2]:\n    t += x; c += seen[t-7]; seen[t] += 1\nanswer = c" });
Q({ id: "dsa2-ps-3", d: 2, secs: 60, prompt: "Array of 5 zeros; add 2 to indices 1–3 and 3 to indices 2–4 (inclusive) with a difference array. What is the final value at index 2?", answer: 5, tol: 0.5, explain: "Result [0, 2, 5, 5, 3].", py: "from itertools import accumulate\nn = 5; d = [0]*(n+1)\nfor l, r, v in [(1,3,2),(2,4,3)]:\n    d[l] += v; d[r+1] -= v\nanswer = list(accumulate(d[:n]))[2]" });
Q({ id: "dsa2-ps-4", d: 2, secs: 60, prompt: "Subarray Sum Equals K on [1, 1, 1], k = 2, but the prefix dict is NOT seeded with {0: 1}. What count does the buggy code return?", answer: 1, tol: 0.5, explain: "It misses the subarray starting at index 0; the correct answer is 2.", py: "from collections import defaultdict\nseen = defaultdict(int)\nt = c = 0\nfor x in [1,1,1]:\n    t += x; c += seen[t-2]; seen[t] += 1\nanswer = c" });
C("dsa2-ps-c1", "Subarray sum = k", "count += seen[prefix − k]; seen[prefix] += 1; seed seen = {0: 1}.");
C("dsa2-ps-c2", "Difference array update", "diff[l] += v; diff[r + 1] −= v; prefix-sum once at the end.");

L("dsa2-sorting", AH, "Sorting and custom keys", "Python's sort, key functions, sorting by multiple criteria, and when sorting first unlocks a simpler algorithm.", {
  kind: "concept", mins: 20, mathsLabel: "Code", prereq: ["dsa2-big-o"],
  hook: "Sort students by marks descending, then by name ascending, in one line. And why does sorting first turn so many O(n²) problems into O(n log n)?",
  intuition: `
**The situation.** Ranking, leaderboards, merging intervals, finding closest pairs, "meeting rooms": a large share of OA problems become easy once the data is in order.

**The idea.** Sorting costs $O(n\\log n)$ once and gives you structure: equal items are adjacent, the closest values are neighbours, and two pointers or a single sweep can replace an all-pairs comparison.

Python's \`sorted\` / \`list.sort\` use Timsort: $O(n\\log n)$ worst case, fast on partly sorted data, and **stable** (equal keys keep their original order). Stability lets you sort by several keys in passes, or use a tuple key in one pass.
`,
  maths: `
**In one breath.** \`sorted(items, key=f, reverse=False)\`; tuple keys sort lexicographically; negate numeric fields for mixed directions; stable, $O(n\\log n)$.

**Template: multi-key sort.**

\`\`\`python
students = [("asha", 82), ("ravi", 91), ("bina", 82), ("dev", 91)]
# marks descending, then name ascending
ranked = sorted(students, key=lambda s: (-s[1], s[0]))
# [('dev', 91), ('ravi', 91), ('asha', 82), ('bina', 82)]
\`\`\`

For non-numeric descending fields, sort twice using stability: first by the secondary key, then by the primary with \`reverse=True\`.

**Worked problem 1: sort, then scan neighbours.** Minimum absolute difference between any two numbers:

\`\`\`python
def min_gap(a):
    a = sorted(a)
    return min(b - x for x, b in zip(a, a[1:]))
min_gap([4, 2, 1, 3])   # 1
\`\`\`

The closest pair in sorted order is always adjacent: $O(n\\log n)$ instead of $O(n^2)$.

**Worked problem 2: largest number from digits-as-strings.** Order by which concatenation is bigger, via a comparator:

\`\`\`python
from functools import cmp_to_key
def largest_number(nums):
    s = list(map(str, nums))
    s.sort(key=cmp_to_key(lambda a, b: (b + a > a + b) - (b + a < a + b)))
    return ''.join(s).lstrip('0') or '0'
largest_number([3, 30, 34, 5, 9])   # '9534330'
\`\`\`

**Counting sort.** If values lie in a small range (marks 0–100), count them: $O(n + k)$.

**Edge cases.** Sorting mutates with \`.sort()\` (returns None); \`sorted()\` returns a new list. Sorting strings is case-sensitive ('Z' < 'a'); use \`key=str.lower\`.
`,
  practice: `
**Signals:** "closest", "kth smallest/largest", "merge intervals", "minimum number of rooms/arrows", "pair with difference", "group equal items", "ranking".

**Alternatives.** Need only the top k? A heap is $O(n\\log k)$. Need the median or kth element once? Quickselect averages $O(n)$. Values in a small range? Counting sort.

**Practise:** Sort Colors, Merge Intervals, Largest Number, Minimum Absolute Difference, Sort Characters by Frequency, H-Index, Meeting Rooms.
`,
  traps: [
    { trap: "`a = a.sort()` sorts a.", why: "list.sort() sorts in place and returns None, so a becomes None. Use a.sort() alone or a = sorted(a)." },
    { trap: "Sorting by two keys needs two separate sorts in the order you'd think.", why: "With stable sorts you sort by the LEAST important key first, then the most important. Easier: one sort with a tuple key." },
    { trap: "Sort when you only need the max.", why: "max() is O(n). Sorting just to read the largest element wastes a log n factor." },
  ],
  say: {
    prompt: "Why is sorting such a common first step, and how do you sort by multiple criteria in Python?",
    secs: 45,
    check: ["Sorting costs O(n log n) and creates structure (neighbours, adjacency of equal items)", "Enables two pointers / single sweep instead of all pairs", "Tuple key, negate numbers for descending", "Stability and multi-pass sorting", "Alternatives: heap for top-k, counting sort for small ranges"],
    followups: [
      { q: "What does 'stable' mean and why does it matter?", a: "Items with equal keys keep their original relative order. It lets you sort by a secondary key first and then by the primary key, and it keeps results deterministic." },
      { q: "When would you use a heap instead of sorting?", a: "When you need only the k smallest or largest items, or items arrive as a stream: O(n log k) time and O(k) memory." },
      { q: "How do you sort strings descending and numbers ascending in one pass?", a: "You can't negate a string, so either sort twice using stability (numbers ascending first, then strings with reverse=True) or use cmp_to_key with a custom comparator." },
    ],
    answer: `Sorting costs O(n log n) once and gives structure that removes the need to compare every pair: equal items become adjacent, the closest values become neighbours, and intervals can be processed in a single sweep. Many O(n²) problems become a sort plus an O(n) scan or two pointers.

In Python I sort with a key function; for several criteria I return a tuple, and I negate numeric fields I want descending, like key=lambda s: (-marks, name). Python's sort is stable, so I can also sort in passes from the least to the most important key. If I only need the top k, a heap is cheaper, and for small integer ranges counting sort is linear.`,
    avoid: ["Writing `a = a.sort()`", "Sorting to get a single maximum"],
  },
  terms: [["Stable sort", "Equal keys keep their original order."], ["Key function", "Maps each item to the value it's sorted by."], ["Timsort", "Python's hybrid merge/insertion sort: O(n log n), fast on runs."]],
  sources: [D.functools, D.bigO],
});
Q({ id: "dsa2-so-1", d: 1, secs: 45, prompt: "students = [('asha', 82), ('ravi', 91), ('bina', 82), ('dev', 91)] sorted by key=lambda s: (-s[1], s[0]). Position (0-based) of 'bina'?", answer: 3, tol: 0.5, explain: "[dev, ravi, asha, bina].", py: "s = sorted([('asha',82),('ravi',91),('bina',82),('dev',91)], key=lambda s: (-s[1], s[0]))\nanswer = [x[0] for x in s].index('bina')" });
Q({ id: "dsa2-so-2", d: 1, secs: 30, prompt: "After `a = [3, 1, 2]; a = a.sort()`, what is a?", options: ["[1, 2, 3]", "[3, 1, 2]", "None", "An error is raised"], answer: 2, explain: "list.sort() returns None.", py: "a = [3,1,2]\na = a.sort()\nanswer = 2 if a is None else 0" });
Q({ id: "dsa2-so-3", d: 2, secs: 60, prompt: "Minimum absolute difference between any two elements of [40, 11, 27, 5, 31, 19]?", answer: 4, tol: 0.5, explain: "Sorted: 5, 11, 19, 27, 31, 40; adjacent gaps 6, 8, 8, 4, 9 → 4.", py: "a = sorted([40,11,27,5,31,19])\nanswer = min(b-x for x, b in zip(a, a[1:]))" });
Q({ id: "dsa2-so-4", d: 3, secs: 90, prompt: "Largest number formed by concatenating [3, 30, 34, 5, 9]. Give it as an integer.", answer: 9534330, tol: 0.5, explain: "Order by comparing a+b vs b+a: 9, 5, 34, 3, 30.", py: "from functools import cmp_to_key\ns = list(map(str, [3,30,34,5,9]))\ns.sort(key=cmp_to_key(lambda a, b: (b+a > a+b) - (b+a < a+b)))\nanswer = int(''.join(s))" });
C("dsa2-so-c1", "Multi-key sort", "key=lambda x: (−x.score, x.name): tuple keys, negate for descending.");
C("dsa2-so-c2", "Closest pair", "After sorting, the closest pair is adjacent: O(n log n).");

L("dsa2-arrays-practice", AH, "Arrays and hashing practice", "Classic hashing and prefix-sum problems to talk through out loud.", {
  kind: "interview", mins: 30, prereq: ["dsa2-hashmap", "dsa2-prefix-sums", "dsa2-sorting"],
  hook: "For each problem: approach, complexity, edge cases, in about a minute. Then check against the rubric.",
}, [
  iq("Given an array, return the k most frequent elements.", "Count with Counter (O(n)), then either a heap of size k (O(n log k)) or bucket sort by frequency (O(n), buckets indexed 0..n). Counter.most_common(k) uses a heap internally. Ties: clarify whether any order is fine.", ["Counter for frequencies", "Heap O(n log k) or bucket sort O(n)", "Clarify ties"]),
  iq("Find the length of the longest subarray with equal numbers of 0s and 1s.", "Map 0 → −1, so the task becomes the longest zero-sum subarray. Keep the first index where each prefix sum appears, seeded {0: −1}; when a prefix repeats at i, length = i − first[prefix]. O(n) time and space.", ["0 → −1 transform", "First index of each prefix", "Seed {0: −1}", "O(n)"]),
  iq("Return an array where each element is the product of all others, without division.", "Prefix products from the left and suffix products from the right; answer[i] = prefix[i] × suffix[i]. O(n) time; O(1) extra space if you store the prefix pass in the output and multiply in a running suffix on the way back. Zeros are handled naturally.", ["Prefix and suffix products", "No division", "O(n) time, O(1) extra space", "Zeros handled"]),
  iq("Check whether a string is a permutation of another, then whether any permutation of a string is a palindrome.", "Permutation: equal Counters (O(n)). Palindrome permutation: at most one character has an odd count. Both O(n) time, O(alphabet) space.", ["Counter equality", "At most one odd count", "O(n)"]),
  iq("Given a stream of numbers, answer 'does any pair sum to k?' after each insert.", "Keep a Counter of values. On insert of x, the answer becomes yes if k − x is present (with count ≥ 2 if k − x == x... i.e. check before adding x). O(1) average per insert, O(n) memory. If queries are much more frequent than inserts, precompute pair sums instead.", ["Counter of seen values", "Check complement before inserting", "Self-pair edge case", "Read- vs write-heavy trade-off"]),
]);
