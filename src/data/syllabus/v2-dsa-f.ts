/**
 * v2 DSA, part F: Backtracking · Dynamic programming. Fixed ids; every answer is recomputed in Pyodide.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";
import { D } from "./v2-dsa-src";

const s = (label: string, url: string) => ({ label, url, checked: CHECKED });
/** Sources for this file; every URL opened and checked on 2026-11-25. */
const S = {
  queens: s("Wikipedia: Eight queens puzzle", "https://en.wikipedia.org/wiki/Eight_queens_puzzle"),
  lcQueens: s("LeetCode: N-Queens", "https://leetcode.com/problems/n-queens/"),
  knap: s("Wikipedia: Knapsack problem", "https://en.wikipedia.org/wiki/Knapsack_problem"),
  lcs: s("Wikipedia: Longest common subsequence", "https://en.wikipedia.org/wiki/Longest_common_subsequence"),
  lev: s("Wikipedia: Levenshtein distance", "https://en.wikipedia.org/wiki/Levenshtein_distance"),
  kadane: s("Wikipedia: Maximum subarray problem (Kadane's algorithm)", "https://en.wikipedia.org/wiki/Maximum_subarray_problem"),
  lis: s("Wikipedia: Longest increasing subsequence", "https://en.wikipedia.org/wiki/Longest_increasing_subsequence"),
};

const { L, Q, C } = lessonWriter("dsa");
const BT = "Backtracking";
const DP = "Dynamic programming";

// ───────────────────────── Backtracking ─────────────────────────

L("dsa2-subsets", BT, "Subsets and combinations", "The choose, explore, unchoose template; generating subsets and k-combinations; reusing elements; skipping duplicates after sorting.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-tree-dfs"],
  hook: "List every subset of [1, 2, 3]. There are 8. What decision do you make at each element, and how do you undo it?",
  intuition: `
**The situation.** "Generate all", "list every combination", "find all ways": the output itself is exponential, so the goal is to generate each answer once, with no duplicates and no wasted branches.

**The idea.** Build a candidate step by step on a shared list \`path\`. At each step: **choose** (append), **explore** (recurse), **unchoose** (pop). The recursion tree's leaves (or nodes) are the answers.

- **Subsets:** every node of the tree is an answer; the loop starts at \`start\` so each element is used once and order doesn't repeat.
- **Combinations of size k:** record only when \`len(path) == k\`; prune when not enough elements remain.
- **Reuse allowed** (combination sum): recurse with \`i\` instead of \`i + 1\`.
- **Duplicates in the input:** sort, and skip \`a[i] == a[i − 1]\` when \`i > start\` (same value at the same depth gives the same subtree).
`,
  maths: `
**In one breath.** \`def bt(start): record(path[:]); for i in range(start, n): path.append(a[i]); bt(i + 1); path.pop()\`; $O(n\\cdot 2^n)$ for subsets (copying each answer).

**Template: all subsets.**

\`\`\`python
def subsets(a):
    out, path = [], []
    def bt(start):
        out.append(path[:])              # copy: path keeps changing
        for i in range(start, len(a)):
            path.append(a[i])            # choose
            bt(i + 1)                    # explore (each element once)
            path.pop()                   # unchoose
    bt(0)
    return out
len(subsets([1, 2, 3]))                  # 8
\`\`\`

**Worked problem 1: combinations summing to a target, reuse allowed.**

\`\`\`python
def combo_sum(cands, target):
    cands = sorted(cands)
    out, path = [], []
    def bt(start, remain):
        if remain == 0:
            out.append(path[:]); return
        for i in range(start, len(cands)):
            if cands[i] > remain:
                break                    # sorted: later ones are bigger too
            path.append(cands[i])
            bt(i, remain - cands[i])     # i, not i + 1: reuse allowed
            path.pop()
    bt(0, target)
    return out
combo_sum([2, 3, 6, 7], 7)               # [[2, 2, 3], [7]]
\`\`\`

**Worked problem 2: subsets with duplicate values.**

\`\`\`python
def subsets_dedup(a):
    a = sorted(a)
    out, path = [], []
    def bt(start):
        out.append(path[:])
        for i in range(start, len(a)):
            if i > start and a[i] == a[i - 1]:
                continue                 # same value at this depth: same branch
            path.append(a[i]); bt(i + 1); path.pop()
    bt(0)
    return out
len(subsets_dedup([1, 2, 2]))            # 6
\`\`\`

**Worked problem 3: k-combinations of 1..n with pruning.** Loop \`i\` only up to \`n − (k − len(path)) + 1\`: if too few numbers remain to fill the path, stop. There are $\\binom{n}{k}$ results.

**Bitmask alternative.** For $n \\le 20$, subsets are the integers \`0 .. 2ⁿ − 1\`; bit \`j\` set means \`a[j]\` is included.

**Edge cases.** Empty input (one subset: []); target 0 (one empty combination); appending \`path\` instead of \`path[:]\` (every stored answer ends up as the same empty list).
`,
  practice: `
**Signals:** "all subsets", "all combinations", "every way to choose", "combination sum", n ≤ 20, output size is exponential.

**Variations.** Combination Sum II (each candidate once, with duplicates: sort + skip + \`i + 1\`), Combination Sum III (k numbers from 1–9), Partition to K Equal Sum Subsets (bucket filling with pruning), Target Sum (backtracking or DP).

**Practise:** Subsets, Subsets II, Combinations, Combination Sum, Combination Sum II, Combination Sum III, Letter Case Permutation, Partition to K Equal Sum Subsets.
`,
  traps: [
    { trap: "out.append(path)", why: "All entries alias the same list, which is empty at the end. Append a copy: path[:] or list(path)." },
    { trap: "Skip duplicates with 'if a[i] == a[i − 1]' alone.", why: "That also skips valid picks deeper in the tree ([2, 2]). Skip only when i > start, i.e. a sibling at the same depth." },
    { trap: "Backtracking is O(2ⁿ) so it's always too slow.", why: "When you must list all answers, the output is that big anyway. Check n: up to about 20 is fine." },
  ],
  say: {
    prompt: "Generate all subsets of a list that may contain duplicates, without repeating any subset.",
    secs: 45,
    check: ["Choose / explore / unchoose on a shared path", "Record a copy of path at every node", "Sort first; skip a[i] == a[i − 1] when i > start", "Recurse with i + 1 so elements aren't reused", "O(n · 2ⁿ) time; recursion depth O(n)"],
    followups: [
      { q: "Why does the skip need i > start?", a: "At a given depth, choosing the second of two equal values produces the same subtree as choosing the first, so it's skipped. But going deeper (i == start) the second copy is a new element in the subset, like [2, 2], and must be allowed." },
      { q: "How would you generate subsets iteratively?", a: "Start with [[]]; for each element, extend the list with each existing subset plus that element. With duplicates, extend only the subsets added in the previous round when the element repeats." },
      { q: "What's the time complexity and why?", a: "There are up to 2ⁿ subsets and copying each costs up to O(n), so O(n · 2ⁿ) time; the extra space beyond the output is O(n) for the path and stack." },
    ],
    answer: `I sort the list so equal values are next to each other, then backtrack with a shared path. The recursive function takes a start index; it first records a copy of the current path, since every node of the recursion tree is a subset. Then for each index from start onwards it appends that element, recurses with the next index, and pops it.

To avoid duplicate subsets, I skip an element if it equals the previous one and it isn't the first choice at this depth, that is, when i > start. That prevents building the same branch twice while still allowing subsets like [2, 2]. The total work is O(n · 2ⁿ), dominated by copying the answers.`,
    avoid: ["Generating everything and deduplicating with a set of tuples", "Appending path without copying"],
  },
  terms: [["Choose / explore / unchoose", "Append, recurse, pop."], ["Start index", "Prevents reusing earlier elements and repeating orders."], ["Pruning", "Cutting branches that can't lead to a valid answer."]],
  sources: [D.backtrack],
});
Q({ id: "dsa2-sb-1", d: 1, secs: 30, prompt: "How many subsets does [4, 5, 6, 7] have, including the empty one?", answer: 16, tol: 0.5, explain: "2⁴.", py: "out = []; p = []; a = [4,5,6,7]\ndef bt(s):\n    out.append(p[:])\n    for i in range(s, len(a)): p.append(a[i]); bt(i+1); p.pop()\nbt(0)\nanswer = len(out)" });
Q({ id: "dsa2-sb-2", d: 2, secs: 60, prompt: "How many distinct combinations of [2, 3, 5] (reuse allowed) sum to 8?", answer: 3, tol: 0.5, explain: "[2, 2, 2, 2], [2, 3, 3], [3, 5].", py: "c = [2,3,5]; out = []; p = []\ndef bt(s, r):\n    if r == 0: out.append(p[:]); return\n    for i in range(s, len(c)):\n        if c[i] > r: break\n        p.append(c[i]); bt(i, r-c[i]); p.pop()\nbt(0, 8)\nanswer = len(out)" });
Q({ id: "dsa2-sb-3", d: 2, secs: 60, prompt: "Number of distinct subsets of [1, 2, 2, 2]?", answer: 8, tol: 0.5, explain: "Choose 0–3 twos (4 ways) × include 1 or not (2 ways).", py: "a = sorted([1,2,2,2]); out = []; p = []\ndef bt(s):\n    out.append(p[:])\n    for i in range(s, len(a)):\n        if i > s and a[i] == a[i-1]: continue\n        p.append(a[i]); bt(i+1); p.pop()\nbt(0)\nanswer = len(out)" });
Q({ id: "dsa2-sb-4", d: 1, secs: 30, prompt: "How many size-3 combinations of the numbers 1..6?", answer: 20, tol: 0.5, explain: "C(6, 3) = 20.", py: "out = []; p = []\ndef bt(s):\n    if len(p) == 3: out.append(p[:]); return\n    for i in range(s, 7): p.append(i); bt(i+1); p.pop()\nbt(1)\nanswer = len(out)" });
C("dsa2-sb-c1", "Backtracking template", "record(path[:]); for i in range(start, n): append, bt(i + 1), pop.");
C("dsa2-sb-c2", "Duplicates in input", "Sort; skip a[i] == a[i − 1] when i > start.");

L("dsa2-permutations", BT, "Permutations and constructive generation", "Ordering every element with a used array, permutations of multisets, phone-keypad letter combinations, and generating valid bracket strings with counters.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-subsets"],
  hook: "Generate every valid arrangement of 3 pairs of brackets. You could generate all 2⁶ strings and filter. How do you avoid building the invalid ones at all?",
  intuition: `
**The situation.** Orderings matter now: permutations, arrangements, strings built character by character under rules.

**The idea.** Same choose/explore/unchoose, but at every position you may pick **any unused** element, not just later ones. Track usage with a boolean list. Depth = positions filled; a full path is one answer.

- **Duplicates:** sort and skip a value if an equal value before it is **unused** at this depth (that branch was already explored).
- **Constructive constraints:** only make choices that keep the partial answer valid. For brackets: add '(' if opens < n; add ')' if closes < opens. Every leaf is then valid, so no filtering.
- **Product of options** (phone digits): one level per digit, branch over its letters.
`,
  maths: `
**In one breath.** \`used = [False] * n\`; \`for i: if used[i]: continue; used[i] = True; path.append(a[i]); bt(); path.pop(); used[i] = False\`; $O(n\\cdot n!)$.

**Template: permutations.**

\`\`\`python
def permutations(a):
    out, path, used = [], [], [False] * len(a)
    def bt():
        if len(path) == len(a):
            out.append(path[:]); return
        for i in range(len(a)):
            if used[i]:
                continue
            used[i] = True; path.append(a[i])
            bt()
            path.pop(); used[i] = False
    bt()
    return out
len(permutations([1, 2, 3]))             # 6
\`\`\`

**Worked problem 1: unique permutations of a multiset.**

\`\`\`python
def unique_perms(a):
    a = sorted(a)
    out, path, used = [], [], [False] * len(a)
    def bt():
        if len(path) == len(a):
            out.append(path[:]); return
        for i in range(len(a)):
            if used[i] or (i and a[i] == a[i - 1] and not used[i - 1]):
                continue                 # equal value, earlier copy unused: duplicate branch
            used[i] = True; path.append(a[i]); bt(); path.pop(); used[i] = False
    bt()
    return out
len(unique_perms([1, 1, 2]))             # 3
\`\`\`

Count check: $\\frac{n!}{\\prod c_i!}$ = 3!/2! = 3.

**Worked problem 2: valid bracket strings.**

\`\`\`python
def brackets(n):
    out = []
    def bt(s, opens, closes):
        if len(s) == 2 * n:
            out.append(s); return
        if opens < n:
            bt(s + "(", opens + 1, closes)
        if closes < opens:               # never close more than opened
            bt(s + ")", opens, closes + 1)
    bt("", 0, 0)
    return out
len(brackets(3))                         # 5: the Catalan numbers 1, 2, 5, 14, 42
\`\`\`

**Worked problem 3: phone keypad letters.** Map digits to letters; one level per digit. "23" gives 3 × 3 = 9 strings. Handle the empty input (return []).

**\`itertools\`.** \`permutations\`, \`combinations\` and \`product\` are fine in OAs when allowed, but interviewers usually want the hand-written version.

**Edge cases.** Empty input; duplicates; very large n (n! explodes: n = 10 is already 3.6 million).
`,
  practice: `
**Signals:** "all orderings/arrangements", "permutations", "generate all valid strings", "letter combinations", "next arrangement".

**Variations.** Next Permutation (not backtracking: find the rightmost ascent, swap with the next larger value to its right, reverse the suffix: $O(n)$), Permutation Sequence (factorial number system), Letter Tile Possibilities, Beautiful Arrangement (prune by divisibility at each position).

**Practise:** Permutations, Permutations II, Letter Combinations of a Phone Number, Generate Parentheses, Next Permutation, Letter Case Permutation, Beautiful Arrangement, Permutation Sequence.
`,
  traps: [
    { trap: "Use a start index for permutations.", why: "A start index produces combinations (each set once). Permutations need every unused element at every position: use a used array." },
    { trap: "Deduplicate permutations by putting tuples in a set.", why: "It works but still explores all n! branches. Sorting and skipping equal unused siblings prunes the duplicates at the source." },
    { trap: "Generate all bracket strings and validate.", why: "2²ⁿ candidates versus the Catalan number of valid ones; constrain choices with open/close counts instead." },
  ],
  say: {
    prompt: "Generate all valid strings of n pairs of brackets. Explain the constraints and the complexity.",
    secs: 45,
    check: ["Build character by character with counts of opens and closes", "Add '(' if opens < n", "Add ')' if closes < opens", "Record when length is 2n: every leaf is valid", "Number of results is the n-th Catalan number, about 4ⁿ / n^1.5"],
    followups: [
      { q: "How many results are there for n = 4?", a: "14, the fourth Catalan number (1, 2, 5, 14, 42, …)." },
      { q: "How would you handle duplicates in permutations?", a: "Sort; at each position skip a[i] if it equals a[i − 1] and a[i − 1] is not currently used, which means that value was already tried at this position." },
      { q: "How do you find the next permutation in lexicographic order?", a: "From the right, find the first i with a[i] < a[i + 1]; swap a[i] with the rightmost element larger than it; reverse the suffix after i. If no such i exists, reverse the whole array." },
    ],
    answer: `I build the string one character at a time, keeping counts of opening and closing brackets used. I can add an opening bracket while fewer than n have been used, and a closing bracket only while there are more opens than closes, so the prefix never becomes invalid. When the string reaches length 2n, it's a valid answer and I record it.

Because the constraints are checked as I build, I never generate an invalid string, unlike generating all 2²ⁿ strings and filtering. The number of results is the n-th Catalan number, which grows roughly like 4ⁿ divided by n to the power 1.5, and each takes O(n) to build, so that's the overall cost.`,
    avoid: ["Generate-and-filter", "Forgetting closes < opens"],
  },
  terms: [["Used array", "Booleans marking elements already in the current path."], ["Multiset permutations", "n! / ∏ cᵢ! distinct orders."], ["Catalan numbers", "1, 2, 5, 14, 42: counts of valid bracket strings."]],
  sources: [D.backtrack],
});
Q({ id: "dsa2-pm-1", d: 1, secs: 30, prompt: "How many permutations of [1, 2, 3, 4]?", answer: 24, tol: 0.5, explain: "4!.", py: "a = [1,2,3,4]; out = []; p = []; u = [False]*4\ndef bt():\n    if len(p) == 4: out.append(p[:]); return\n    for i in range(4):\n        if u[i]: continue\n        u[i] = True; p.append(a[i]); bt(); p.pop(); u[i] = False\nbt()\nanswer = len(out)" });
Q({ id: "dsa2-pm-2", d: 2, secs: 60, prompt: "How many distinct permutations of [1, 1, 2, 2]?", answer: 6, tol: 0.5, explain: "4! / (2! · 2!) = 6.", py: "a = sorted([1,1,2,2]); out = []; p = []; u = [False]*4\ndef bt():\n    if len(p) == 4: out.append(p[:]); return\n    for i in range(4):\n        if u[i] or (i and a[i] == a[i-1] and not u[i-1]): continue\n        u[i] = True; p.append(a[i]); bt(); p.pop(); u[i] = False\nbt()\nanswer = len(out)" });
Q({ id: "dsa2-pm-3", d: 1, secs: 45, prompt: "How many valid bracket strings with 4 pairs?", answer: 14, tol: 0.5, explain: "The 4th Catalan number.", py: "out = []\ndef bt(s, o, c):\n    if len(s) == 8: out.append(s); return\n    if o < 4: bt(s+'(', o+1, c)\n    if c < o: bt(s+')', o, c+1)\nbt('', 0, 0)\nanswer = len(out)" });
Q({ id: "dsa2-pm-4", d: 1, secs: 45, prompt: "Phone keypad (7 → pqrs, 9 → wxyz, others 3 letters). How many letter strings for the digits '279'?", answer: 48, tol: 0.5, explain: "3 × 4 × 4.", py: "m = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'}\nout = []\ndef bt(i, s):\n    if i == 3: out.append(s); return\n    for ch in m['279'[i]]: bt(i+1, s+ch)\nbt(0, '')\nanswer = len(out)" });
C("dsa2-pm-c1", "Permutation template", "used[] array; any unused element at each position; record at full length.");
C("dsa2-pm-c2", "Bracket generation", "Add '(' if opens < n; add ')' if closes < opens.");

L("dsa2-constraint-search", BT, "Constraint search and pruning", "Placing items under constraints with O(1) validity checks: N-Queens with column and diagonal sets, word search on a grid, and palindrome partitioning.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-permutations", "dsa2-grid-graphs"],
  hook: "Place 8 queens so none attack each other. There are 4.4 billion ways to put 8 queens on 64 squares. How do you search only a few thousand?",
  intuition: `
**The situation.** Puzzles and searches with rules: queens, sudoku, finding a word in a letter grid, splitting a string into valid pieces. Brute force is astronomically large.

**The idea.** Fill one decision at a time and **reject a partial answer the moment it breaks a rule**. One rejection removes an entire subtree. Two ingredients make it fast:

- **Structure the choice.** One queen per row means you only choose a column per row.
- **Check validity in O(1).** Keep sets of used columns and diagonals. On a diagonal, \`r − c\` is constant; on an anti-diagonal, \`r + c\` is constant.

**On grids** (word search): mark the cell as visited before recursing and unmark after; that's the unchoose step.
`,
  maths: `
**In one breath.** Decide row by row; \`if c in cols or r − c in d1 or r + c in d2: continue\`; add, recurse, remove; stop a branch as soon as it's invalid.

**Template: N-Queens count.**

\`\`\`python
def n_queens(n):
    cols, d1, d2 = set(), set(), set()
    count = 0
    def bt(r):
        nonlocal count
        if r == n:
            count += 1; return
        for c in range(n):
            if c in cols or r - c in d1 or r + c in d2:
                continue                 # attacked: prune
            cols.add(c); d1.add(r - c); d2.add(r + c)
            bt(r + 1)
            cols.remove(c); d1.remove(r - c); d2.remove(r + c)
    bt(0)
    return count
n_queens(4), n_queens(8)                 # (2, 92)
\`\`\`

**Worked problem 1: does a word appear as a path of adjacent cells (no reuse)?**

\`\`\`python
def exists(board, word):
    R, C = len(board), len(board[0])
    def dfs(r, c, i):
        if i == len(word):
            return True
        if not (0 <= r < R and 0 <= c < C) or board[r][c] != word[i]:
            return False
        tmp, board[r][c] = board[r][c], "#"       # mark visited
        found = any(dfs(r + dr, c + dc, i + 1) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        board[r][c] = tmp                          # unmark
        return found
    return any(dfs(r, c, 0) for r in range(R) for c in range(C))
board = [list("ABCE"), list("SFCS"), list("ADEE")]
exists(board, "ABCCED"), exists(board, "ABCB")    # (True, False)
\`\`\`

$O(R\\cdot C\\cdot 4\\cdot 3^{L-1})$ worst case for word length $L$.

**Worked problem 2: split a string into palindromes, all ways.**

\`\`\`python
def palindrome_splits(s):
    out, path = [], []
    def bt(start):
        if start == len(s):
            out.append(path[:]); return
        for end in range(start + 1, len(s) + 1):
            piece = s[start:end]
            if piece == piece[::-1]:              # only recurse on valid pieces
                path.append(piece); bt(end); path.pop()
    bt(0)
    return out
palindrome_splits("aab")                          # [['a', 'a', 'b'], ['aa', 'b']]
\`\`\`

**Pruning ideas.** Sort candidates and break early (sums); check the most constrained cell first (sudoku); precompute validity tables (palindromes via DP); stop at the first solution if only existence is asked.

**Edge cases.** Restoring state on every return path (including early \`return True\`); grids passed as strings (copy to lists before marking); n = 2 or 3 queens (no solutions).
`,
  practice: `
**Signals:** "place … so that no two …", "fill the grid", "find the word in the grid", "split into valid parts", "all solutions" or "does any solution exist", small inputs (n ≤ 9, grids ≤ 6 × 6, words ≤ 15).

**Variations.** N-Queens II (count only), Sudoku Solver (row/column/box sets), Word Search II (trie of words + one DFS: see Tries), Restore IP Addresses (4 parts, each 0–255, no leading zeros), Matchsticks to Square.

**Practise:** N-Queens, N-Queens II, Word Search, Palindrome Partitioning, Sudoku Solver, Restore IP Addresses, Matchsticks to Square, Word Search II.
`,
  traps: [
    { trap: "Check every earlier queen when placing a new one.", why: "That's O(n) per check. Sets of columns, r − c and r + c make each check O(1)." },
    { trap: "Forget to unmark a cell when the DFS returns early.", why: "The grid stays corrupted for later searches. Restore before every return (compute 'found', restore, then return)." },
    { trap: "Mark visited cells in a global set and never remove them.", why: "A cell used by one failed path may be needed by another. Visited marks must be per path: remove on backtrack." },
  ],
  say: {
    prompt: "How would you count the solutions to N-Queens, and what makes the search fast enough?",
    secs: 45,
    check: ["One queen per row: choose a column per row", "Sets for columns, r − c diagonals, r + c anti-diagonals", "Skip attacked columns: prune the subtree", "Add, recurse, remove (unchoose)", "Far fewer than n! nodes explored; n = 8 has 92 solutions"],
    followups: [
      { q: "Why is r − c constant on a diagonal?", a: "Moving down-right adds 1 to both r and c, so their difference stays the same; moving down-left adds 1 to r and subtracts 1 from c, so r + c stays the same." },
      { q: "How would you speed it up further?", a: "Use bitmasks for columns and diagonals and get available positions with bit operations; exploit symmetry by only placing the first queen in the left half and doubling." },
      { q: "How do you return the boards, not just the count?", a: "Keep queens[r] = c in a list during the search; at a leaf, build strings with 'Q' at column queens[r] and '.' elsewhere." },
    ],
    answer: `Since no two queens can share a row, I place exactly one queen per row and only choose its column. I keep three sets: used columns, used diagonals identified by r − c, and used anti-diagonals identified by r + c. For each column in the current row, if any of those is taken, the square is attacked and I skip it, which prunes the whole subtree. Otherwise I add it to the sets, recurse to the next row, and remove it afterwards.

When I reach row n, I've placed all queens and count a solution. The O(1) checks and early pruning mean the search explores a tiny fraction of the n! placements; n = 8 has 92 solutions and runs instantly.`,
    avoid: ["Scanning the whole board to check attacks", "Not undoing set changes on return"],
  },
  terms: [["Pruning", "Abandoning a partial solution once it breaks a rule."], ["Diagonal keys", "r − c (diagonal) and r + c (anti-diagonal)."], ["Mark / unmark", "Temporarily block a grid cell during one path."]],
  sources: [S.queens, S.lcQueens, D.backtrack],
});
Q({ id: "dsa2-cs-1", d: 1, secs: 45, prompt: "How many solutions does the 6-queens puzzle have?", answer: 4, tol: 0.5, explain: "4 solutions on a 6 × 6 board.", py: "def nq(n):\n    cols, d1, d2 = set(), set(), set(); c = 0\n    def bt(r):\n        nonlocal c\n        if r == n: c += 1; return\n        for x in range(n):\n            if x in cols or r-x in d1 or r+x in d2: continue\n            cols.add(x); d1.add(r-x); d2.add(r+x); bt(r+1)\n            cols.remove(x); d1.remove(r-x); d2.remove(r+x)\n    bt(0); return c\nanswer = nq(6)" });
Q({ id: "dsa2-cs-2", d: 2, secs: 60, prompt: "Board ['ABCE', 'SFCS', 'ADEE']. How many of the words 'ABCCED', 'SEE', 'ABCB' can be found?", answer: 2, tol: 0.5, explain: "'ABCB' would reuse a cell.", py: "def ex(bd, w):\n    b = [list(r) for r in bd]; R, C = len(b), len(b[0])\n    def dfs(r, c, i):\n        if i == len(w): return True\n        if not (0 <= r < R and 0 <= c < C) or b[r][c] != w[i]: return False\n        t, b[r][c] = b[r][c], '#'\n        f = any(dfs(r+dr, c+dc, i+1) for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)))\n        b[r][c] = t; return f\n    return any(dfs(r, c, 0) for r in range(R) for c in range(C))\nB = ['ABCE','SFCS','ADEE']\nanswer = sum(ex(B, w) for w in ['ABCCED','SEE','ABCB'])" });
Q({ id: "dsa2-cs-3", d: 2, secs: 60, prompt: "How many ways can 'aabb' be split into palindromic pieces?", answer: 4, tol: 0.5, explain: "a|a|b|b, aa|b|b, a|a|bb, aa|bb.", py: "s = 'aabb'; out = []; p = []\ndef bt(st):\n    if st == len(s): out.append(p[:]); return\n    for e in range(st+1, len(s)+1):\n        x = s[st:e]\n        if x == x[::-1]: p.append(x); bt(e); p.pop()\nbt(0)\nanswer = len(out)" });
Q({ id: "dsa2-cs-4", d: 2, secs: 45, prompt: "Queens at (row 0, col 1) and (row 2, col 3). Do they attack each other? Answer 1 for yes, 0 for no.", answer: 1, tol: 0.5, explain: "r − c is −1 for both: same diagonal.", py: "a, b = (0,1), (2,3)\nanswer = int(a[1] == b[1] or a[0]-a[1] == b[0]-b[1] or a[0]+a[1] == b[0]+b[1])" });
C("dsa2-cs-c1", "N-Queens checks", "Sets: cols, r − c, r + c. O(1) attack test.");
C("dsa2-cs-c2", "Grid backtracking", "Mark cell, explore 4 directions, unmark before returning.");

L("dsa2-backtrack-practice", BT, "Backtracking practice", "Generation and search problems to explain: decision per level, pruning, complexity.", {
  kind: "interview", mins: 25, prereq: ["dsa2-subsets", "dsa2-permutations", "dsa2-constraint-search"],
  hook: "For each: what's decided at each level, what's pruned, and how big is the search?",
}, [
  iq("Restore IP Addresses: insert dots into a digit string to form all valid IPv4 addresses.", "Backtrack over 4 parts; each part takes 1–3 digits, must be ≤ 255, and can't have a leading zero unless it is '0'. Prune if the remaining digits can't fill the remaining parts (between 1 and 3 each). At most 3⁴ = 81 branches.", ["4 levels, 1–3 digits each", "Validity: ≤ 255, no leading zeros", "Length pruning", "Constant-bounded search"]),
  iq("Sudoku Solver.", "Sets per row, column and 3×3 box (box index (r//3)*3 + c//3). Find an empty cell (ideally the one with fewest candidates), try each allowed digit, recurse, undo on failure. Return True at the first full board.", ["Row/col/box sets", "Box index formula", "Most-constrained cell heuristic", "Undo on failure"]),
  iq("Partition to K Equal Sum Subsets.", "If the sum isn't divisible by k, false. Sort descending; fill k buckets of target sum by placing each number in a bucket with room; skip buckets with the same current sum as one already tried (symmetry); fail fast if the largest number exceeds the target. Exponential but fast with pruning; bitmask DP O(n·2ⁿ) alternative.", ["Divisibility check", "Sort descending", "Symmetry pruning on equal buckets", "Bitmask DP alternative"]),
  iq("Word Search II: find all words from a list in a grid.", "Build a trie of the words; DFS from each cell following trie children; record a word when reaching its end node (and remove it to avoid duplicates); prune trie nodes with no remaining words. Much faster than one search per word.", ["Trie of words", "One DFS per cell guided by the trie", "Mark/unmark cells", "Prune finished branches"]),
  iq("Combination Sum II: each candidate used at most once, input has duplicates.", "Sort; backtrack with start index; recurse with i + 1; skip a[i] == a[i − 1] when i > start; break when a[i] > remaining. Output-sensitive exponential time.", ["Sort", "i + 1 (no reuse)", "Sibling duplicate skip", "Break on overshoot"]),
  iq("When should you switch from backtracking to DP?", "When you only need a count or an optimum (not every solution) and subproblems repeat: the same (index, remaining) state is reached by different paths. Memoise on that state. Example: count combinations summing to target → coin-change ways DP; word break existence → DP over prefixes.", ["Count/optimum vs list all", "Overlapping states", "Memoise on (index, remaining)", "Concrete examples"]),
]);

// ───────────────────────── Dynamic programming ─────────────────────────

L("dsa2-dp-intro", DP, "Dynamic programming: states and 1-D recurrences", "Defining a state, writing the transition, and computing it top-down with memoisation or bottom-up with a table: stairs, house robber, decoding.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-big-o"],
  hook: "Rob houses along a street but never two neighbours. Trying every subset is 2ⁿ. What one number per house would let you decide quickly?",
  intuition: `
**The situation.** "How many ways…", "minimum cost…", "maximum value…", where the brute force recursion keeps solving the same subproblem.

**The idea.** Dynamic programming = recursion + reuse. Four steps:

1. **State:** what does \`dp[i]\` mean? Say it in words: "the most money from the first \`i\` houses".
2. **Transition:** how does \`dp[i]\` follow from smaller states? Look at the last decision: rob house \`i\` or not.
3. **Base cases:** the smallest states, e.g. \`dp[0] = 0\`.
4. **Order:** compute states so the ones you need are ready (increasing \`i\`).

**Top-down** (memoised recursion with \`functools.cache\`) is quick to write from the recurrence. **Bottom-up** (a loop filling a table) avoids recursion limits and often shrinks to $O(1)$ space when only the last few states are needed.

**Recognise it:** optimal or counting question; choices at each step; overlapping subproblems (the naive recursion tree repeats calls).
`,
  maths: `
**In one breath.** State in words → recurrence on the last choice → base cases → order; time = states × work per state.

**Template: top-down and bottom-up.**

\`\`\`python
from functools import cache

def rob(nums):                       # top-down
    @cache
    def best(i):                     # most money from houses i..end
        if i >= len(nums):
            return 0
        return max(nums[i] + best(i + 2), best(i + 1))   # rob i, or skip it
    return best(0)

def rob_iter(nums):                  # bottom-up, O(1) space
    take = skip = 0                  # best ending with / without robbing the previous house
    for x in nums:
        take, skip = skip + x, max(take, skip)
    return max(take, skip)
rob_iter([2, 7, 9, 3, 1])            # 12  (2 + 9 + 1)
\`\`\`

**Worked problem 1: ways to climb n stairs with steps of 1 or 2.** $dp[i] = dp[i-1] + dp[i-2]$, $dp[0] = dp[1] = 1$. Fibonacci-shaped: n = 10 gives 89.

\`\`\`python
def climb(n):
    a, b = 1, 1                      # dp[0], dp[1]
    for _ in range(n - 1):
        a, b = b, a + b
    return b
\`\`\`

**Worked problem 2: cheapest way to the top.** \`cost[i]\` is paid when you step on stair \`i\`; you may start on stair 0 or 1. $dp[i] = cost[i] + \\min(dp[i-1], dp[i-2])$; answer $\\min(dp[n-1], dp[n-2])$. \`[10, 15, 20]\` → 15.

**Worked problem 3: decode a digit string (1 → A … 26 → Z).**

\`\`\`python
def decode_ways(s):
    prev2, prev1 = 1, 1 if s and s[0] != "0" else 0   # dp[i-2], dp[i-1]
    for i in range(1, len(s)):
        cur = 0
        if s[i] != "0":
            cur += prev1                              # single digit
        if 10 <= int(s[i - 1:i + 1]) <= 26:
            cur += prev2                              # two digits
        prev2, prev1 = prev1, cur
    return prev1
decode_ways("226")                                    # 3: BZ, VF, BBF
\`\`\`

**Edge cases.** Empty input; leading '0' (no decodings); n = 1; recursion limit for top-down on n ≈ 10⁴+ (use bottom-up).
`,
  practice: `
**Signals:** "number of ways", "minimum/maximum", "can you reach", "no two adjacent", choices per position, n up to 10⁴–10⁵ with an obvious exponential recursion.

**Variations.** House Robber II (circular: run twice, excluding the first or the last house), Delete and Earn (bucket values, then house robber), Tribonacci, Paint House (dp per colour).

**Practise:** Climbing Stairs, Min Cost Climbing Stairs, House Robber, House Robber II, Decode Ways, Delete and Earn, Paint House, Perfect Squares.
`,
  traps: [
    { trap: "Start coding before defining dp[i] in words.", why: "Off-by-one and wrong transitions come from a vague state. Write 'dp[i] = … of the first i items' first." },
    { trap: "Top-down is always fine in Python.", why: "Recursion deeper than ~1,000 frames raises RecursionError; for large n, write it bottom-up." },
    { trap: "DP always needs an O(n) table.", why: "If dp[i] depends only on the last one or two values, keep just those: O(1) space." },
  ],
  say: {
    prompt: "Solve House Robber and walk through how you'd derive the recurrence.",
    secs: 45,
    check: ["State in words: best total from the first i houses (or from i onwards)", "Last decision: rob house i (add dp[i − 2]) or skip it (dp[i − 1])", "Base cases dp[0] = 0, dp[1] = nums[0]", "O(n) time; O(1) space with two variables", "Mention top-down memo vs bottom-up"],
    followups: [
      { q: "How do you handle houses in a circle?", a: "The first and last houses can't both be robbed, so take the max of the linear answer on nums[1:] and on nums[:-1]." },
      { q: "How would you recover which houses were robbed?", a: "Keep the full dp table, then walk backwards: if dp[i] == dp[i − 1], house i was skipped; otherwise it was robbed and you jump to i − 2." },
      { q: "When would you choose top-down over bottom-up?", a: "When only some states are reachable or the order is awkward to express; bottom-up when n is large (recursion limits) or you want to optimise space." },
    ],
    answer: `I define dp[i] as the most money I can take from the first i houses. Looking at the last house, I either skip it, which leaves dp[i − 1], or rob it, which means I can't rob the one before, giving nums[i − 1] + dp[i − 2]. So dp[i] is the larger of those, with dp[0] = 0 and dp[1] = nums[0].

Computing i from small to large is O(n) time. Because each state only uses the previous two, I keep two variables instead of a table, so space is O(1). The same recurrence can be written top-down with functools.cache, but bottom-up avoids Python's recursion limit for long streets.`,
    avoid: ["Greedy picking of the largest houses", "Skipping the 'state in words' step"],
  },
  terms: [["State", "What dp[i] stands for, in words."], ["Transition", "Formula for a state from smaller states."], ["Memoisation", "Cache results of a recursive function (functools.cache)."]],
  sources: [D.dp, D.functools],
});
Q({ id: "dsa2-di-1", d: 1, secs: 30, prompt: "Ways to climb 10 stairs taking 1 or 2 steps at a time?", answer: 89, tol: 0.5, explain: "Fibonacci-shaped: 1, 1, 2, 3, 5, …, 89.", py: "a, b = 1, 1\nfor _ in range(9): a, b = b, a+b\nanswer = b" });
Q({ id: "dsa2-di-2", d: 1, secs: 45, prompt: "House Robber on [2, 7, 9, 3, 1]. Maximum amount?", answer: 12, tol: 0.5, explain: "2 + 9 + 1.", py: "t = s = 0\nfor x in [2,7,9,3,1]: t, s = s+x, max(t, s)\nanswer = max(t, s)" });
Q({ id: "dsa2-di-3", d: 2, secs: 60, prompt: "Min Cost Climbing Stairs on [1, 100, 1, 1, 1, 100, 1, 1, 100, 1]?", answer: 6, tol: 0.5, explain: "Step on the 1s, skipping each 100.", py: "c = [1,100,1,1,1,100,1,1,100,1]; dp = c[:2]\nfor i in range(2, len(c)): dp.append(c[i] + min(dp[-1], dp[-2]))\nanswer = min(dp[-1], dp[-2])" });
Q({ id: "dsa2-di-4", d: 2, secs: 60, prompt: "How many ways can '11106' be decoded (1 → A … 26 → Z)?", answer: 2, tol: 0.5, explain: "1-1-10-6 and 11-10-6.", py: "s = '11106'\np2, p1 = 1, (1 if s[0] != '0' else 0)\nfor i in range(1, len(s)):\n    c = 0\n    if s[i] != '0': c += p1\n    if 10 <= int(s[i-1:i+1]) <= 26: c += p2\n    p2, p1 = p1, c\nanswer = p1" });
Q({ id: "dsa2-di-5", d: 2, secs: 60, prompt: "Circular House Robber on [2, 3, 2]. Maximum amount?", answer: 3, tol: 0.5, explain: "First and last are neighbours: best is the middle 3.", py: "def r(a):\n    t = s = 0\n    for x in a: t, s = s+x, max(t, s)\n    return max(t, s)\na = [2,3,2]\nanswer = max(r(a[1:]), r(a[:-1]))" });
C("dsa2-di-c1", "DP recipe", "State in words → transition on the last choice → base cases → order.");
C("dsa2-di-c2", "House Robber", "dp[i] = max(dp[i − 1], nums[i − 1] + dp[i − 2]); two variables.");

L("dsa2-dp-grid", DP, "Grid DP", "Paths and costs on a grid where each cell depends on its top and left neighbours: unique paths, obstacles, minimum path sum, largest square.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-dp-intro"],
  hook: "A robot moves only right or down on a 3 × 7 grid. How many routes reach the bottom-right? Where can the robot have come from on its last move?",
  intuition: `
**The situation.** Grids where movement is restricted to right/down (or similar), and you count paths, minimise cost, or find the largest shape.

**The idea.** If you can only arrive at \`(r, c)\` from \`(r − 1, c)\` or \`(r, c − 1)\`, then the answer for a cell combines the answers for those two. Fill row by row, left to right, so both are ready.

- **Count paths:** \`dp[r][c] = dp[r-1][c] + dp[r][c-1]\`.
- **Minimum cost:** \`dp[r][c] = grid[r][c] + min(top, left)\`.
- **Blocked cells:** \`dp = 0\` (counting) or \`inf\` (cost).
- **Largest square of 1s ending at a cell:** \`1 + min(top, left, top-left)\`.

Because each row depends only on the previous row, one 1-D array of length \`C\` is enough.
`,
  maths: `
**In one breath.** \`dp[r][c] = f(dp[r-1][c], dp[r][c-1])\`; first row/column are base cases; one rolling row gives $O(C)$ space; $O(RC)$ time.

**Template: count paths with obstacles (rolling row).**

\`\`\`python
def paths_with_obstacles(g):               # 1 = blocked
    C = len(g[0])
    dp = [0] * C
    dp[0] = 1 if g[0][0] == 0 else 0
    for row in g:
        for c in range(C):
            if row[c] == 1:
                dp[c] = 0                  # nothing passes a wall
            elif c > 0:
                dp[c] += dp[c - 1]         # dp[c] is still 'top'; dp[c-1] is 'left'
    return dp[-1]
paths_with_obstacles([[0, 0, 0], [0, 1, 0], [0, 0, 0]])   # 2
\`\`\`

Without obstacles on an $m \\times n$ grid the answer is $\\binom{m+n-2}{m-1}$: 3 × 7 gives 28.

**Worked problem 1: minimum path sum.**

\`\`\`python
def min_path_sum(g):
    R, C = len(g), len(g[0])
    dp = [float("inf")] * C
    dp[0] = 0
    for r in range(R):
        for c in range(C):
            left = dp[c - 1] if c else float("inf")
            dp[c] = g[r][c] + min(dp[c], left)
    return dp[-1]
min_path_sum([[1, 3, 1], [1, 5, 1], [4, 2, 1]])   # 7 (1-3-1-1-1)
\`\`\`

**Worked problem 2: largest square of 1s.**

\`\`\`python
def largest_square(m):
    R, C = len(m), len(m[0])
    dp = [[0] * (C + 1) for _ in range(R + 1)]     # padded: no bounds checks
    best = 0
    for r in range(1, R + 1):
        for c in range(1, C + 1):
            if m[r - 1][c - 1] == "1":
                dp[r][c] = 1 + min(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1])
                best = max(best, dp[r][c])
    return best * best                              # area
\`\`\`

**Worked problem 3: falling path with minimum sum** (move down to the same or an adjacent column): each row's dp uses three cells of the previous row; answer is the min of the last row.

**Edge cases.** Start or end blocked (0 paths); a single row or column; padding with an extra row/column to avoid bounds checks.
`,
  practice: `
**Signals:** a grid with right/down moves, "number of unique paths", "minimum path sum", "largest square/rectangle of 1s", "triangle", "falling path".

**Variations.** Triangle (bottom-up from the last row), Dungeon Game (fill from the bottom-right: minimum health needed), Cherry Pickup (two walkers: state (step, r1, r2)), Maximal Rectangle (histogram per row + monotonic stack).

**Practise:** Unique Paths, Unique Paths II, Minimum Path Sum, Triangle, Maximal Square, Minimum Falling Path Sum, Dungeon Game, Count Square Submatrices with All Ones.
`,
  traps: [
    { trap: "Initialise the whole first row and column to 1 even with obstacles.", why: "Cells after a blocked cell in the first row or column are unreachable. Let the rolling recurrence propagate zeros." },
    { trap: "Use BFS/DFS to count paths.", why: "Path counts grow combinatorially; enumerating them is exponential. DP counts in O(R·C)." },
    { trap: "Largest square: dp = 1 + min(top, left).", why: "Ignoring the diagonal overcounts (an L-shape of 1s isn't a square). Use the min of top, left and top-left." },
  ],
  say: {
    prompt: "Count the unique paths from the top-left to the bottom-right of a grid with obstacles, moving right or down.",
    secs: 45,
    check: ["dp[r][c] = paths to (r, c)", "From top and left: dp[r−1][c] + dp[r][c−1]", "Blocked cells = 0; start blocked → 0", "Row-by-row order; rolling 1-D array", "O(R·C) time, O(C) space"],
    followups: [
      { q: "Without obstacles, is there a closed form?", a: "Yes: choose which of the (m − 1) + (n − 1) moves are downs: C(m + n − 2, m − 1)." },
      { q: "How do you reconstruct a minimum-cost path?", a: "Keep the full table; from the end, step to whichever of top or left has the smaller dp value, until the start; reverse." },
      { q: "What if moves in all four directions were allowed?", a: "Then cells can depend on each other in cycles and simple DP order fails; for counting simple paths it becomes exponential, for minimum cost use Dijkstra." },
    ],
    answer: `I let dp[r][c] be the number of ways to reach cell (r, c). Since the robot only moves right or down, it arrives from the cell above or the cell to the left, so dp[r][c] is the sum of those two, and zero if the cell is blocked. The start is one if it's open.

I fill the grid row by row, left to right, so both neighbours are ready. Each row only needs the previous one, so I keep a single array: dp[c] still holds the value from the row above, and I add dp[c − 1] from the current row. That's O(R·C) time and O(C) space. Obstacles in the first row or column automatically zero out everything after them.`,
    avoid: ["Enumerating paths with DFS", "Hard-coding the first row/column to 1 with obstacles"],
  },
  terms: [["Rolling array", "Keep only the previous row of a 2-D table."], ["Padding", "Extra zero row/column to skip bounds checks."], ["Closed form", "C(m + n − 2, m − 1) paths without obstacles."]],
  sources: [D.dp],
});
Q({ id: "dsa2-dg-1", d: 1, secs: 30, prompt: "Unique right/down paths on a 3 × 7 grid?", answer: 28, tol: 0.5, explain: "C(8, 2) = 28.", py: "R, C = 3, 7; dp = [1]*C\nfor _ in range(R-1):\n    for c in range(1, C): dp[c] += dp[c-1]\nanswer = dp[-1]" });
Q({ id: "dsa2-dg-2", d: 1, secs: 45, prompt: "Minimum path sum (right/down) for [[1, 3, 1], [1, 5, 1], [4, 2, 1]]?", answer: 7, tol: 0.5, explain: "1 → 3 → 1 → 1 → 1.", py: "g = [[1,3,1],[1,5,1],[4,2,1]]; C = 3; dp = [float('inf')]*C; dp[0] = 0\nfor r in range(3):\n    for c in range(C):\n        left = dp[c-1] if c else float('inf')\n        dp[c] = g[r][c] + min(dp[c], left)\nanswer = dp[-1]" });
Q({ id: "dsa2-dg-3", d: 2, secs: 60, prompt: "Paths through [[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0]] (1 = blocked)?", answer: 3, tol: 0.5, explain: "Rolling DP row by row: [1, 1, 1, 1], [1, 0, 1, 2], [1, 1, 2, 0], [0, 1, 3, 3].", py: "g = [[0,0,0,0],[0,1,0,0],[0,0,0,1],[1,0,0,0]]; C = 4; dp = [0]*C; dp[0] = 1\nfor row in g:\n    for c in range(C):\n        if row[c]: dp[c] = 0\n        elif c: dp[c] += dp[c-1]\nanswer = dp[-1]" });
Q({ id: "dsa2-dg-4", d: 2, secs: 60, prompt: "Area of the largest all-1 square in ['10100', '10111', '11111', '10010']?", answer: 4, tol: 0.5, explain: "A 2 × 2 square.", py: "m = ['10100','10111','11111','10010']; R, C = 4, 5\ndp = [[0]*(C+1) for _ in range(R+1)]; b = 0\nfor r in range(1, R+1):\n    for c in range(1, C+1):\n        if m[r-1][c-1] == '1':\n            dp[r][c] = 1 + min(dp[r-1][c], dp[r][c-1], dp[r-1][c-1]); b = max(b, dp[r][c])\nanswer = b*b" });
C("dsa2-dg-c1", "Grid path count", "dp[c] += dp[c − 1] row by row; blocked → 0.");
C("dsa2-dg-c2", "Largest square", "dp = 1 + min(top, left, top-left); area = best².");

L("dsa2-knapsack", DP, "Knapsack and coin change", "Choosing items under a capacity: 0/1 knapsack, subset sum and equal partition, minimum coins and number of ways, and why the loop direction matters.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-dp-intro"],
  hook: "Can [1, 5, 11, 5] be split into two groups with equal sums? It's a yes/no question about subsets. What table answers it in O(n × sum)?",
  intuition: `
**The situation.** Pick items (each once, or unlimited times) to hit or stay under a capacity, maximising value, minimising count, or counting ways.

**The idea.** State = capacity (or target) left. \`dp[c]\` = best answer using the items processed so far with capacity \`c\`. For each item, update every capacity.

- **0/1 (each item once):** loop capacity **downwards**, so \`dp[c - w]\` still refers to the previous item set.
- **Unbounded (reuse allowed):** loop capacity **upwards**, so \`dp[c - w]\` may already include this item.
- **Count combinations** (order doesn't matter): items in the outer loop, amounts inner. **Count sequences** (order matters): amounts outer, items inner.

Cost $O(n\\cdot W)$: pseudo-polynomial. Fine for $W$ up to about 10⁴–10⁵.
`,
  maths: `
**In one breath.** 0/1: \`for w, v in items: for c in range(W, w − 1, −1): dp[c] = max(dp[c], dp[c − w] + v)\`; unbounded: same with \`range(w, W + 1)\`; $O(nW)$ time, $O(W)$ space.

**Template: 0/1 knapsack.**

\`\`\`python
def knapsack(weights, values, W):
    dp = [0] * (W + 1)                     # dp[c] = best value with capacity c
    for w, v in zip(weights, values):
        for c in range(W, w - 1, -1):      # downwards: each item at most once
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[W]
knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7)    # 9 (weights 3 + 4)
\`\`\`

**Worked problem 1: equal-sum partition (subset sum).**

\`\`\`python
def can_partition(nums):
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    can = [True] + [False] * target        # can[s]: some subset sums to s
    for x in nums:
        for s in range(target, x - 1, -1):
            can[s] = can[s] or can[s - x]
    return can[target]
can_partition([1, 5, 11, 5])               # True: {11} and {1, 5, 5}
\`\`\`

**Worked problem 2: fewest coins for an amount (unbounded).**

\`\`\`python
def min_coins(coins, amount):
    INF = amount + 1
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] < INF else -1
min_coins([1, 2, 5], 11)                   # 3 (5 + 5 + 1)
min_coins([2], 3)                          # -1
\`\`\`

**Worked problem 3: number of ways to make an amount (combinations).**

\`\`\`python
def coin_ways(coins, amount):
    ways = [1] + [0] * amount
    for c in coins:                        # coins outer: each multiset once
        for a in range(c, amount + 1):     # upwards: reuse allowed
            ways[a] += ways[a - c]
    return ways[amount]
coin_ways([1, 2, 5], 5)                    # 4
\`\`\`

Swap the loops (amount outer) and you count ordered sequences instead: 9 for the same input.

**Edge cases.** Amount 0 (0 coins, 1 way); unreachable amounts; odd total for partition; negative numbers (shift or use a dict of reachable sums).
`,
  practice: `
**Signals:** "capacity", "budget", "target sum", "partition into two equal", "fewest coins", "number of ways to make", "each item at most once" vs "unlimited".

**Variations.** Target Sum (count subsets with sum (total + target)/2), Last Stone Weight II (closest subset sum to total/2), Ones and Zeroes (two capacities), Combination Sum IV (ordered: amount outer), Perfect Squares (unbounded min count).

**Practise:** Partition Equal Subset Sum, Coin Change, Coin Change II, Target Sum, Last Stone Weight II, Ones and Zeroes, Combination Sum IV, Perfect Squares.
`,
  traps: [
    { trap: "Loop capacity upwards in 0/1 knapsack with a 1-D array.", why: "dp[c − w] would already include the current item, letting it be used twice. Loop downwards for 0/1." },
    { trap: "Put amounts in the outer loop when counting coin combinations.", why: "That counts 1+2 and 2+1 separately (sequences). Coins outer counts each multiset once." },
    { trap: "Greedy for coin change.", why: "Fails on non-canonical coins ([1, 3, 4] for 6). DP is correct for any coins." },
  ],
  say: {
    prompt: "Find the fewest coins to make an amount, then explain how you'd count the number of ways instead.",
    secs: 50,
    check: ["dp[a] = fewest coins for amount a; dp[0] = 0", "dp[a] = min over coins of dp[a − c] + 1", "Unreachable → −1 (use a sentinel like amount + 1)", "Counting: ways[a] += ways[a − c], coins in the outer loop", "O(amount × coins) time, O(amount) space"],
    followups: [
      { q: "Why does loop order change the count?", a: "With coins outer, each coin's contributions are added in a fixed order, so every multiset is built in one canonical order. With amounts outer, every coin can be the last one at every step, so different orderings count separately." },
      { q: "Why is knapsack DP called pseudo-polynomial?", a: "It's O(n·W), polynomial in the numeric value W but exponential in the number of bits needed to write W." },
      { q: "How do you solve 0/1 knapsack when W is huge but values are small?", a: "Swap roles: dp[v] = minimum weight to achieve value v, over total value; answer is the largest v with dp[v] ≤ W." },
    ],
    answer: `I let dp[a] be the fewest coins that make amount a, with dp[0] = 0 and everything else initialised to a large sentinel. For each amount from 1 up, I try every coin not larger than it and take dp[a − c] + 1 if that's better. If dp[amount] is still the sentinel at the end, it's impossible and I return −1. That's O(amount × coins) time and O(amount) space, and it works for any coin set, unlike greedy.

To count the ways, I use ways[0] = 1 and add ways[a − c] into ways[a]. The loop order matters: with coins in the outer loop and amounts inner, each combination is counted once regardless of order. Swapping the loops counts ordered sequences instead.`,
    avoid: ["Greedy largest-coin-first", "Confusing combination and sequence counts"],
  },
  terms: [["0/1 knapsack", "Each item used at most once; loop capacity downwards."], ["Unbounded knapsack", "Items reusable; loop capacity upwards."], ["Pseudo-polynomial", "Polynomial in the numeric capacity, not its bit length."]],
  sources: [S.knap, D.dp],
});
Q({ id: "dsa2-ks-1", d: 1, secs: 45, prompt: "0/1 knapsack: weights [1, 3, 4, 5], values [1, 4, 5, 7], capacity 7. Best value?", answer: 9, tol: 0.5, explain: "Weights 3 + 4 → values 4 + 5.", py: "W = 7; dp = [0]*(W+1)\nfor w, v in zip([1,3,4,5],[1,4,5,7]):\n    for c in range(W, w-1, -1): dp[c] = max(dp[c], dp[c-w]+v)\nanswer = dp[W]" });
Q({ id: "dsa2-ks-2", d: 1, secs: 45, prompt: "Can [1, 2, 3, 5] be split into two equal-sum groups? Answer 1 for yes, 0 for no.", answer: 0, tol: 0.5, explain: "Total 11 is odd.", py: "a = [1,2,3,5]; t = sum(a)\nif t % 2: answer = 0\nelse:\n    tg = t//2; can = [True]+[False]*tg\n    for x in a:\n        for s in range(tg, x-1, -1): can[s] = can[s] or can[s-x]\n    answer = int(can[tg])" });
Q({ id: "dsa2-ks-3", d: 1, secs: 45, prompt: "Fewest coins from [1, 2, 5] to make 11?", answer: 3, tol: 0.5, explain: "5 + 5 + 1.", py: "co, A = [1,2,5], 11; dp = [0]+[A+1]*A\nfor a in range(1, A+1):\n    for c in co:\n        if c <= a: dp[a] = min(dp[a], dp[a-c]+1)\nanswer = dp[A] if dp[A] <= A else -1" });
Q({ id: "dsa2-ks-4", d: 2, secs: 60, prompt: "Number of coin combinations (order ignored) from [1, 2, 5] that make 5?", answer: 4, tol: 0.5, explain: "5; 2+2+1; 2+1+1+1; 1×5.", py: "w = [1]+[0]*5\nfor c in [1,2,5]:\n    for a in range(c, 6): w[a] += w[a-c]\nanswer = w[5]" });
Q({ id: "dsa2-ks-5", d: 2, secs: 60, prompt: "Same coins [1, 2, 5] and amount 5, but with the amount loop OUTSIDE the coin loop. What count results?", answer: 9, tol: 0.5, explain: "That counts ordered sequences (e.g. 1+2+2, 2+1+2, 2+2+1 separately).", py: "w = [1]+[0]*5\nfor a in range(1, 6):\n    for c in [1,2,5]:\n        if c <= a: w[a] += w[a-c]\nanswer = w[5]" });
C("dsa2-ks-c1", "Knapsack loop direction", "0/1 → capacity downwards; unbounded → upwards.");
C("dsa2-ks-c2", "Coin change II order", "Coins outer = combinations; amount outer = ordered sequences.");

L("dsa2-string-dp", DP, "DP on two strings", "Tables indexed by prefixes of two strings: longest common subsequence, edit distance, word break, and palindromic substrings.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-dp-grid"],
  hook: "How many single-character edits turn 'horse' into 'ros'? Looking at the last characters, what are the only three things the final edit could be?",
  intuition: `
**The situation.** Comparing or transforming strings: similarity, diffs, spell-check distance, splitting a string into dictionary words. Common in data roles (fuzzy matching of names or addresses).

**The idea.** Let \`dp[i][j]\` describe the first \`i\` characters of \`a\` and the first \`j\` of \`b\`. Look at the **last characters** \`a[i−1]\` and \`b[j−1]\`:

- **LCS:** if they match, \`1 + dp[i−1][j−1]\`; otherwise drop one: \`max(dp[i−1][j], dp[i][j−1])\`.
- **Edit distance:** if they match, \`dp[i−1][j−1]\`; otherwise 1 + the min of delete (\`dp[i−1][j]\`), insert (\`dp[i][j−1]\`), replace (\`dp[i−1][j−1]\`).
- Row 0 and column 0 are the empty-prefix base cases.

**Single-string variants.** Word break: \`dp[i]\` = can the first \`i\` characters be split? Palindromic substrings: expand around each of the $2n - 1$ centres.
`,
  maths: `
**In one breath.** \`(m+1) × (n+1)\` table over prefixes; compare last characters; match → diagonal; else combine neighbours; $O(mn)$ time, $O(\\min(m, n))$ space with rolling rows.

**Template: longest common subsequence.**

\`\`\`python
def lcs(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]
lcs("abcde", "ace")                       # 3
\`\`\`

**Worked problem 1: edit distance.**

\`\`\`python
def edit_distance(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i   # delete everything
    for j in range(n + 1): dp[0][j] = j   # insert everything
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j],      # delete a[i-1]
                                   dp[i][j - 1],      # insert b[j-1]
                                   dp[i - 1][j - 1])  # replace
    return dp[m][n]
edit_distance("horse", "ros")             # 3
\`\`\`

**Worked problem 2: can a string be split into dictionary words?**

\`\`\`python
def word_break(s, words):
    ws, maxlen = set(words), max(map(len, words), default=0)
    ok = [True] + [False] * len(s)        # ok[i]: s[:i] can be split
    for i in range(1, len(s) + 1):
        for j in range(max(0, i - maxlen), i):
            if ok[j] and s[j:i] in ws:
                ok[i] = True
                break
    return ok[len(s)]
word_break("applepenapple", ["apple", "pen"])   # True
\`\`\`

**Worked problem 3: longest palindromic substring by expanding centres.** For each centre (a character or a gap), expand while both ends match; $O(n^2)$ time, $O(1)$ space. "babad" → length 3 ("bab" or "aba").

**Edge cases.** Empty strings (distance = other length); identical strings (distance 0); case sensitivity; word break with a very long dictionary (limit \`j\` to the longest word).
`,
  practice: `
**Signals:** two strings and "longest common", "minimum edits/operations", "transform", "interleave", "is subsequence count"; one string and "split into words", "palindromic substring/subsequence".

**Variations.** Longest Palindromic Subsequence (LCS of s and reversed s), Delete Operation for Two Strings (m + n − 2·LCS), Distinct Subsequences (count ways), Interleaving String, Regular Expression Matching.

**Practise:** Longest Common Subsequence, Edit Distance, Word Break, Longest Palindromic Substring, Palindromic Substrings, Longest Palindromic Subsequence, Delete Operation for Two Strings, Distinct Subsequences, Interleaving String.
`,
  traps: [
    { trap: "Index dp[i][j] with a[i] and b[j].", why: "With a padded table, dp[i][j] covers prefixes of length i and j, so the last characters are a[i − 1] and b[j − 1]." },
    { trap: "Confuse subsequence with substring.", why: "LCS allows gaps; longest common substring needs consecutive matches: dp[i][j] = dp[i − 1][j − 1] + 1 on a match, else 0, tracking the max." },
    { trap: "Forget the base row and column in edit distance.", why: "Turning a prefix into an empty string takes i deletions; leaving them 0 undercounts." },
  ],
  say: {
    prompt: "Compute the edit distance between two strings and explain the recurrence.",
    secs: 50,
    check: ["dp[i][j] = edits to turn a[:i] into b[:j]", "Base cases: dp[i][0] = i, dp[0][j] = j", "Match: dp[i−1][j−1]", "Else 1 + min(delete, insert, replace)", "O(mn) time; O(min(m, n)) space with two rows"],
    followups: [
      { q: "How do you recover the actual edits?", a: "Keep the full table and walk back from (m, n): a diagonal step with equal characters is a match, a diagonal step otherwise is a replace, up is a delete, left is an insert." },
      { q: "How would you speed up fuzzy matching against a large list of names?", a: "Block candidates first (same first letter, length within k, shared n-grams), then compute edit distance only on candidates; cap the DP at a band of width k (O(k·n))." },
      { q: "How does LCS relate to edit distance?", a: "With only insertions and deletions allowed, the distance is m + n − 2·LCS(a, b)." },
    ],
    answer: `I let dp[i][j] be the minimum edits to turn the first i characters of a into the first j characters of b. Turning a prefix into the empty string needs i deletions and building b's prefix from nothing needs j insertions, which gives the first column and row.

For other cells I look at the last characters. If they're equal, no edit is needed and dp[i][j] = dp[i − 1][j − 1]. Otherwise the last edit was a delete, an insert or a replace, so it's one plus the minimum of the cell above, the cell to the left and the diagonal. Filling the table row by row is O(m·n) time, and since each row only needs the previous one, space can be cut to O(min(m, n)).`,
    avoid: ["Off-by-one between table and string indices", "Missing the base cases"],
  },
  terms: [["Prefix DP", "dp[i][j] over the first i and j characters."], ["Edit distance (Levenshtein)", "Minimum insertions, deletions and substitutions."], ["Subsequence", "Characters in order, gaps allowed."]],
  sources: [S.lcs, S.lev, D.dp],
});
Q({ id: "dsa2-sd-1", d: 1, secs: 45, prompt: "Length of the longest common subsequence of 'abcba' and 'bdcaba'?", answer: 4, tol: 0.5, explain: "'bcba'.", py: "a, b = 'abcba', 'bdcaba'; m, n = len(a), len(b)\ndp = [[0]*(n+1) for _ in range(m+1)]\nfor i in range(1, m+1):\n    for j in range(1, n+1):\n        dp[i][j] = dp[i-1][j-1]+1 if a[i-1] == b[j-1] else max(dp[i-1][j], dp[i][j-1])\nanswer = dp[m][n]" });
Q({ id: "dsa2-sd-2", d: 2, secs: 60, prompt: "Edit distance between 'intention' and 'execution'?", answer: 5, tol: 0.5, explain: "Classic example: 5 operations.", py: "a, b = 'intention', 'execution'; m, n = len(a), len(b)\ndp = [[0]*(n+1) for _ in range(m+1)]\nfor i in range(m+1): dp[i][0] = i\nfor j in range(n+1): dp[0][j] = j\nfor i in range(1, m+1):\n    for j in range(1, n+1):\n        dp[i][j] = dp[i-1][j-1] if a[i-1] == b[j-1] else 1+min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])\nanswer = dp[m][n]" });
Q({ id: "dsa2-sd-3", d: 2, secs: 60, prompt: "Can 'catsandog' be split into words from ['cats', 'dog', 'sand', 'and', 'cat']? Answer 1 for yes, 0 for no.", answer: 0, tol: 0.5, explain: "'cats and og' / 'cat sand og': 'og' isn't a word.", py: "s = 'catsandog'; ws = {'cats','dog','sand','and','cat'}\nok = [True]+[False]*len(s)\nfor i in range(1, len(s)+1):\n    ok[i] = any(ok[j] and s[j:i] in ws for j in range(i))\nanswer = int(ok[-1])" });
Q({ id: "dsa2-sd-4", d: 2, secs: 60, prompt: "How many palindromic substrings (counted by position) does 'aaa' have?", answer: 6, tol: 0.5, explain: "Three 'a', two 'aa', one 'aaa'.", py: "s = 'aaa'; c = 0\nfor ctr in range(2*len(s)-1):\n    l, r = ctr//2, ctr//2 + ctr%2\n    while l >= 0 and r < len(s) and s[l] == s[r]: c += 1; l -= 1; r += 1\nanswer = c" });
C("dsa2-sd-c1", "LCS recurrence", "Match → diag + 1; else max(top, left).");
C("dsa2-sd-c2", "Edit distance", "Match → diag; else 1 + min(top = delete, left = insert, diag = replace).");

L("dsa2-dp-sequences", DP, "Sequence DP: Kadane, LIS and state machines", "Best subarray ending here (Kadane), longest increasing subsequence in O(n log n) with bisect, and small state machines for stock-trading rules.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-dp-intro", "dsa2-binary-search"],
  hook: "Find the subarray with the largest sum in one pass. At each position, when is it better to start afresh than to keep the run going?",
  intuition: `
**The situation.** Single-sequence optimisation: best contiguous run, longest increasing subsequence, maximum profit with trading rules.

**The ideas.**

- **"Ending here" states.** \`best_here\` = best subarray that ends at \`i\`. Either extend the previous run or start new: \`max(x, best_here + x)\`. The global answer is the max over all \`i\`. This is Kadane's algorithm.
- **Patience sorting for LIS.** Keep \`tails[k]\` = the smallest possible tail of an increasing subsequence of length \`k + 1\`. For each \`x\`, replace the first tail ≥ \`x\` (bisect_left), or append if none. \`len(tails)\` is the LIS length: $O(n\\log n)$.
- **State machines.** When rules depend on what you hold or did yesterday (holding stock, cooldown, fee), keep one variable per state and update them together each day.
`,
  maths: `
**In one breath.** Kadane: \`cur = max(x, cur + x); best = max(best, cur)\`; LIS: \`tails[bisect_left(tails, x)] = x\` or append; state machine: one variable per state, update simultaneously.

**Template: Kadane.**

\`\`\`python
def max_subarray(a):
    cur = best = a[0]
    for x in a[1:]:
        cur = max(x, cur + x)            # extend or restart
        best = max(best, cur)
    return best
max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4])   # 6  ([4, -1, 2, 1])
\`\`\`

Starting from \`a[0]\` (not 0) handles all-negative arrays.

**Worked problem 1: longest strictly increasing subsequence.**

\`\`\`python
from bisect import bisect_left
def lis_length(a):
    tails = []
    for x in a:
        i = bisect_left(tails, x)        # first tail >= x
        if i == len(tails):
            tails.append(x)              # extends the longest run
        else:
            tails[i] = x                 # better (smaller) tail for length i + 1
    return len(tails)
lis_length([10, 9, 2, 5, 3, 7, 101, 18])  # 4 (2, 3, 7, 18)
\`\`\`

\`tails\` is not itself a subsequence; it's a summary. The $O(n^2)$ DP \`dp[i] = 1 + max(dp[j] for j < i if a[j] < a[i])\` is fine for n ≤ 2,500. For non-decreasing, use \`bisect_right\`.

**Worked problem 2: maximum product subarray.** Track both the max and the min ending here, because a negative number swaps them.

\`\`\`python
def max_product(a):
    hi = lo = best = a[0]
    for x in a[1:]:
        hi, lo = max(x, hi * x, lo * x), min(x, hi * x, lo * x)
        best = max(best, hi)
    return best
max_product([2, 3, -2, 4])               # 6
\`\`\`

**Worked problem 3: stock trading with a one-day cooldown after selling.**

\`\`\`python
def max_profit_cooldown(prices):
    hold, sold, rest = float("-inf"), 0, 0     # holding / just sold / free
    for p in prices:
        hold, sold, rest = max(hold, rest - p), hold + p, max(rest, sold)
    return max(sold, rest)
max_profit_cooldown([1, 2, 3, 0, 2])     # 3: buy 1, sell 3, cool, buy 0, sell 2
\`\`\`

The tuple assignment uses yesterday's values on the right-hand side.

**Edge cases.** All-negative arrays (Kadane returns the largest element); zeros in the product problem; a single price (profit 0); strict vs non-strict LIS.
`,
  practice: `
**Signals:** "maximum subarray", "contiguous", "longest increasing subsequence", "envelopes/boxes that nest", "buy and sell with a rule", "at most k transactions", "fee".

**Variations.** Maximum Sum Circular Subarray (max of Kadane and total − min subarray), Russian Doll Envelopes (sort by width asc, height desc, then LIS on heights), Number of LIS (count alongside length), Best Time to Buy and Sell Stock III/IV (states per transaction), with Transaction Fee.

**Practise:** Maximum Subarray, Maximum Product Subarray, Maximum Sum Circular Subarray, Longest Increasing Subsequence, Russian Doll Envelopes, Best Time to Buy and Sell Stock with Cooldown, with Transaction Fee, Best Time to Buy and Sell Stock III.
`,
  traps: [
    { trap: "Initialise Kadane's best to 0.", why: "For an all-negative array the answer is the largest single element, not 0 (unless empty subarrays are allowed). Start from a[0]." },
    { trap: "Read tails as the actual LIS.", why: "tails holds the best tail per length and can mix elements from different subsequences. Track predecessors if you need the sequence." },
    { trap: "Update state variables one at a time.", why: "Later lines would see today's new values instead of yesterday's. Use tuple assignment or temporaries." },
  ],
  say: {
    prompt: "Find the length of the longest increasing subsequence. Give the O(n²) idea and the O(n log n) method.",
    secs: 50,
    check: ["O(n²): dp[i] = 1 + max dp[j] for j < i with a[j] < a[i]", "O(n log n): tails[k] = smallest tail of an increasing subsequence of length k + 1", "bisect_left to replace or append", "tails stays sorted; its length is the answer", "bisect_right for non-decreasing; tails isn't the sequence itself"],
    followups: [
      { q: "Why does keeping the smallest tail help?", a: "A smaller tail can be extended by more future values, so for each length it dominates any larger tail. Replacing never shortens any achievable length." },
      { q: "How do you reconstruct the subsequence?", a: "Store, for each element, the index of its predecessor (the element at tails position i − 1 when it was placed) and the index at each tails position; follow predecessors back from the last tail." },
      { q: "How does Russian Doll Envelopes reduce to LIS?", a: "Sort by width ascending and, for equal widths, height descending (so equal widths can't nest), then take the LIS of the heights." },
    ],
    answer: `The simple DP sets dp[i] as the length of the longest increasing subsequence ending at i: one plus the best dp[j] over earlier j with a smaller value. That's O(n²), fine up to a few thousand elements.

For O(n log n), I keep a list called tails, where tails[k] is the smallest possible last value of an increasing subsequence of length k + 1. The list stays sorted. For each new value I binary search with bisect_left for the first tail that's at least as large; if there isn't one I append, extending the longest length, otherwise I replace it with the smaller value. The length of tails at the end is the answer. tails isn't the subsequence itself; to recover it I'd store predecessor indices.`,
    avoid: ["Claiming tails is the subsequence", "Using bisect_right for strictly increasing"],
  },
  terms: [["Kadane's algorithm", "Best subarray ending here: extend or restart."], ["Patience sorting", "tails array giving LIS length in O(n log n)."], ["State machine DP", "One variable per state (hold, sold, rest), updated together."]],
  sources: [S.kadane, S.lis, D.bisect],
});
Q({ id: "dsa2-sq-1", d: 1, secs: 45, prompt: "Maximum subarray sum of [−2, 1, −3, 4, −1, 2, 1, −5, 4]?", answer: 6, tol: 0.5, explain: "[4, −1, 2, 1].", py: "a = [-2,1,-3,4,-1,2,1,-5,4]; cur = b = a[0]\nfor x in a[1:]: cur = max(x, cur+x); b = max(b, cur)\nanswer = b" });
Q({ id: "dsa2-sq-2", d: 2, secs: 60, prompt: "Length of the longest strictly increasing subsequence of [0, 1, 0, 3, 2, 3]?", answer: 4, tol: 0.5, explain: "0, 1, 2, 3.", py: "from bisect import bisect_left\nt = []\nfor x in [0,1,0,3,2,3]:\n    i = bisect_left(t, x)\n    if i == len(t): t.append(x)\n    else: t[i] = x\nanswer = len(t)" });
Q({ id: "dsa2-sq-3", d: 2, secs: 60, prompt: "Maximum product subarray of [−2, 3, −4]?", answer: 24, tol: 0.5, explain: "The whole array: −2 × 3 × −4.", py: "a = [-2,3,-4]; hi = lo = b = a[0]\nfor x in a[1:]:\n    hi, lo = max(x, hi*x, lo*x), min(x, hi*x, lo*x); b = max(b, hi)\nanswer = b" });
Q({ id: "dsa2-sq-4", d: 2, secs: 60, prompt: "Maximum profit with a one-day cooldown after each sale, prices [1, 2, 3, 0, 2]?", answer: 3, tol: 0.5, explain: "Buy 1, sell 3, cool down, buy 0, sell 2.", py: "h, s, r = float('-inf'), 0, 0\nfor p in [1,2,3,0,2]: h, s, r = max(h, r-p), h+p, max(r, s)\nanswer = max(s, r)" });
Q({ id: "dsa2-sq-5", d: 1, secs: 30, prompt: "Kadane's algorithm on [−3, −1, −2] (non-empty subarray). Result?", answer: -1, tol: 0.5, explain: "The largest single element; starting best at 0 would wrongly give 0.", py: "a = [-3,-1,-2]; cur = b = a[0]\nfor x in a[1:]: cur = max(x, cur+x); b = max(b, cur)\nanswer = b" });
C("dsa2-sq-c1", "Kadane", "cur = max(x, cur + x); best = max(best, cur); start from a[0].");
C("dsa2-sq-c2", "LIS in O(n log n)", "i = bisect_left(tails, x); append if i == len else tails[i] = x.");

L("dsa2-dp-practice", DP, "Dynamic programming practice", "DP problems to explain: state, transition, base case, order, complexity.", {
  kind: "interview", mins: 30, prereq: ["dsa2-dp-intro", "dsa2-dp-grid", "dsa2-knapsack", "dsa2-string-dp", "dsa2-dp-sequences"],
  hook: "For each: say the state in words first, then the transition, then the cost.",
}, [
  iq("Target Sum: assign + or − to each number to reach a target. Count the ways.", "Let P be the plus-set: P − (total − P) = target, so P = (total + target)/2. If that's not a non-negative integer, 0 ways. Otherwise count subsets summing to P with 0/1 knapsack counting (capacity loop downwards). O(n·P).", ["Algebraic reduction to subset sum", "Parity/feasibility check", "0/1 counting DP, downward loop", "O(n·sum)"]),
  iq("Longest Palindromic Subsequence.", "dp[i][j] = LPS length within s[i..j]: if s[i] == s[j], dp[i+1][j−1] + 2; else max(dp[i+1][j], dp[i][j−1]). Fill by increasing length (or i from the end). O(n²) time; or LCS(s, reversed s).", ["Interval state i..j", "Match adds 2", "Fill order by length", "LCS equivalence"]),
  iq("Burst Balloons: maximise coins where bursting i gives nums[left]·nums[i]·nums[right].", "Pad with 1s. Think of the LAST balloon k to burst in (i, j): dp[i][j] = max over k of dp[i][k] + dp[k][j] + nums[i]·nums[k]·nums[j]. Fill by interval length. O(n³).", ["Pad with 1s", "Choose the last balloon", "Interval DP", "O(n³)"]),
  iq("Word Break II: return all sentences.", "Memoise on start index: for each dictionary word matching at start, prepend it to every sentence for the rest. Output can be exponential; memoisation avoids recomputing suffixes. Check word-break feasibility first to prune.", ["Memo on suffix index", "Combine word + suffix sentences", "Output-sensitive", "Feasibility pre-check"]),
  iq("Minimum cost to cut a stick at given positions (each cut costs the current stick length).", "Sort cuts and add the ends 0 and n. dp[i][j] = min over k between i and j of dp[i][k] + dp[k][j] + (cut[j] − cut[i]). Interval DP, O(m³) for m cuts.", ["Add endpoints", "Interval state", "Cost = segment length", "O(m³)"]),
  iq("How do you tell DP from greedy and from backtracking in an OA?", "Backtracking when you must list all solutions. DP when you need a count or optimum and the brute-force recursion repeats states (identify the state tuple and count states × transitions). Greedy only if an exchange argument holds; test a small counterexample. Check constraints: n·W ≤ ~10⁷ for table DP.", ["List all → backtracking", "Count/optimum with repeated states → DP", "Greedy needs proof", "Constraint-based feasibility"]),
]);
