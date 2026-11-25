/**
 * v2 DSA, part G: Tries and bits. Fixed ids; every answer is recomputed in Pyodide.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";
import { D } from "./v2-dsa-src";

const s = (label: string, url: string) => ({ label, url, checked: CHECKED });
/** Sources for this file; every URL opened and checked on 2026-11-25. */
const S = {
  cpBits: s("CP-algorithms: Bit manipulation", "https://cp-algorithms.com/algebra/bit-manipulation.html"),
};

const { L, Q, C } = lessonWriter("dsa");
const TB = "Tries and bits";

L("dsa2-trie", TB, "Tries (prefix trees)", "A tree of characters for prefix queries: insert and search in O(word length), autocomplete counts, prefix replacement, and when a trie beats a set.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-hashmap", "dsa2-tree-dfs"],
  hook: "A search box must show how many saved queries start with what the user has typed so far, after every keystroke. A set answers 'is this exact word saved?'. What answers 'how many start with this?'",
  intuition: `
**The situation.** Autocomplete, spell-check, "does any word start with…", replacing words by their shortest root, finding many dictionary words in a grid.

**The idea.** A trie stores strings as paths from the root: each edge is a character, and words sharing a prefix share the path. A flag marks nodes where a word ends.

- Insert and search cost $O(L)$ for a word of length $L$, independent of how many words are stored.
- **Prefix queries are just walks:** follow the prefix; the node you land on represents every word with that prefix.
- Store extra data per node (a count of words passing through, a word id) to answer prefix counts in $O(L)$.

**Trie vs set.** A set answers exact membership in $O(L)$ on average too. Use a trie when you need prefixes, ordered traversal, or to share work across many words (Word Search II).
`,
  maths: `
**In one breath.** Node = \`{children: dict, end: bool, count: int}\`; insert/search walk one character at a time; prefix count = \`count\` at the prefix node; $O(L)$ per operation, $O(\\text{total characters})$ space.

**Template.**

\`\`\`python
class TrieNode:
    __slots__ = ("kids", "end", "count")
    def __init__(self):
        self.kids, self.end, self.count = {}, False, 0

class Trie:
    def __init__(self):
        self.root = TrieNode()
    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.kids.setdefault(ch, TrieNode())
            node.count += 1               # words passing through this node
        node.end = True
    def _walk(self, s):
        node = self.root
        for ch in s:
            node = node.kids.get(ch)
            if node is None:
                return None
        return node
    def search(self, word):
        n = self._walk(word)
        return bool(n and n.end)
    def starts_with(self, prefix):
        return self._walk(prefix) is not None
    def count_prefix(self, prefix):
        n = self._walk(prefix)
        return n.count if n else 0

t = Trie()
for w in ["apple", "app", "apply", "ape"]:
    t.insert(w)
t.search("app"), t.search("appl"), t.count_prefix("app")   # (True, False, 3)
\`\`\`

(Insert each word once, or \`count\` double-counts duplicates.)

**Worked problem 1: replace each word by its shortest dictionary root.**

\`\`\`python
def replace_roots(roots, sentence):
    t = Trie()
    for r in roots:
        t.insert(r)
    out = []
    for w in sentence.split():
        node, cut = t.root, None
        for i, ch in enumerate(w):
            node = node.kids.get(ch)
            if node is None:
                break
            if node.end:
                cut = i + 1; break        # shortest root found
        out.append(w[:cut] if cut else w)
    return " ".join(out)
replace_roots(["cat", "bat", "rat"], "the cattle was rattled by the battery")
# 'the cat was rat by the bat'
\`\`\`

**Worked problem 2: longest common prefix of a list.** Walk from the root while the node has exactly one child and isn't a word end. Without a trie: sort the list and compare only the first and last strings. ["flower", "flow", "flight"] → "fl".

**Worked problem 3: dot wildcard search.** On '.', recurse into every child: worst case $O(26^L)$, usually fast because few branches survive.

**Edge cases.** Empty string (the root is its node: mark \`root.end\`); case normalisation; memory (one dict per node; \`__slots__\` helps); duplicate inserts.
`,
  practice: `
**Signals:** "prefix", "starts with", "autocomplete", "dictionary of words", "replace with root", "find all words in a grid", "wildcard search", "maximum XOR" (bitwise trie, next lesson).

**Variations.** Design Add and Search Words (wildcards), Search Suggestions System (top 3 lexicographic suggestions per prefix: store sorted lists or DFS), Word Search II (trie + grid DFS, pruning finished words), Map Sum Pairs (sum of values under a prefix).

**Practise:** Implement Trie (Prefix Tree), Longest Common Prefix, Replace Words, Design Add and Search Words Data Structure, Search Suggestions System, Map Sum Pairs, Word Search II, Longest Word in Dictionary.
`,
  traps: [
    { trap: "search(word) returns True if the walk succeeds.", why: "That's starts_with. 'appl' is a path in a trie holding 'apple' but not a word; check the end flag." },
    { trap: "A trie is always faster than a set.", why: "For exact lookups a set is simpler and usually faster; tries win when you need prefix queries or to share work across many words." },
    { trap: "Count prefix matches by DFS from the prefix node each time.", why: "That's O(size of the subtree). Maintain a pass-through count at each node during insert for O(L) queries." },
  ],
  say: {
    prompt: "Design a structure that inserts words and answers 'how many stored words start with this prefix?' quickly.",
    secs: 45,
    check: ["Trie: node with a dict of children and an end flag", "Insert walks/creates nodes, incrementing a pass-through count", "Query walks the prefix and returns the count (0 if missing)", "O(L) per operation; space O(total characters)", "Compare with a set (no prefix support) or sorted list + bisect"],
    followups: [
      { q: "Could you do it with a sorted list instead?", a: "Yes: keep words sorted; the words with prefix p lie between bisect_left(p) and bisect_left(p + a character larger than any used). Queries O(L log n), but inserts are O(n) for shifting." },
      { q: "How would you support deletion?", a: "Walk the word, decrementing counts; unset the end flag; optionally delete child nodes whose count reaches 0." },
      { q: "How would you return the top 3 suggestions alphabetically?", a: "Store at each node a sorted list of up to 3 words passing through (maintained on insert), or DFS children in sorted order and stop after 3." },
    ],
    answer: `I'd use a trie. Each node has a dictionary from character to child, a flag for whether a word ends there, and a count of how many inserted words pass through it. To insert, I walk the word from the root, creating missing children and incrementing the count on each node I enter, then mark the last node as a word end.

To answer a prefix query, I walk the prefix; if a character is missing the answer is zero, otherwise it's the count stored on the final node. Both operations are O(L) in the length of the word, independent of how many words are stored, and the space is proportional to the total number of characters. A plain set can't answer prefix questions without scanning everything.`,
    avoid: ["Scanning all words with startswith (O(n·L) per query)", "Confusing search with starts_with"],
  },
  terms: [["Trie", "Tree where each edge is a character; shared prefixes share paths."], ["End flag", "Marks that a complete word ends at this node."], ["Pass-through count", "Number of words whose path includes this node."]],
  sources: [D.trie],
});
Q({ id: "dsa2-tr-1", d: 1, secs: 45, prompt: "Insert 'apple', 'app', 'apply' and 'ape' into an empty trie. How many nodes are there, not counting the root?", answer: 7, tol: 0.5, explain: "a-p-p-l-e, plus y under l, plus e under the first p.", py: "root = {}; n = 0\nfor w in ['apple','app','apply','ape']:\n    cur = root\n    for ch in w:\n        if ch not in cur: cur[ch] = {}; n += 1\n        cur = cur[ch]\nanswer = n" });
Q({ id: "dsa2-tr-2", d: 1, secs: 45, prompt: "Same four words. How many start with 'app'?", answer: 3, tol: 0.5, explain: "apple, app, apply.", py: "root = {}\nfor w in ['apple','app','apply','ape']:\n    cur = root\n    for ch in w:\n        cur = cur.setdefault(ch, {'#c': 0}); cur['#c'] += 1\ncur = root\nfor ch in 'app': cur = cur[ch]\nanswer = cur['#c']" });
Q({ id: "dsa2-tr-3", d: 2, secs: 60, prompt: "Roots ['cat', 'bat', 'rat'], sentence 'the cattle was rattled by the battery'. How many words get replaced by a root?", answer: 3, tol: 0.5, explain: "cattle → cat, rattled → rat, battery → bat.", py: "roots = {'cat','bat','rat'}; c = 0\nfor w in 'the cattle was rattled by the battery'.split():\n    if any(w[:i] in roots for i in range(1, len(w)+1)) and w not in roots: c += 1\nanswer = c" });
Q({ id: "dsa2-tr-4", d: 1, secs: 30, prompt: "Length of the longest common prefix of ['interview', 'internet', 'interval', 'internal']?", answer: 5, tol: 0.5, explain: "'inter'.", py: "a = sorted(['interview','internet','interval','internal']); f, l = a[0], a[-1]; i = 0\nwhile i < min(len(f), len(l)) and f[i] == l[i]: i += 1\nanswer = i" });
C("dsa2-tr-c1", "Trie node", "children dict + end flag (+ pass-through count). Insert/search O(L).");
C("dsa2-tr-c2", "search vs starts_with", "search needs node.end; starts_with only needs the path to exist.");

L("dsa2-bit-basics", TB, "Bit manipulation basics", "Binary operators in Python, testing and setting bits, x & (x − 1) and x & −x, counting set bits, powers of two, and Python's unbounded integers.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-big-o"],
  hook: "Is n a power of two? One expression with no loop answers it. What do the bits of 8 and 7 have in common?",
  intuition: `
**The situation.** Bit questions appear in OAs as quick filters: count set bits, check powers of two, flags packed into an integer, subsets as masks.

**The idea.** An integer is a row of bits. Operators act on every bit at once:

- \`a & b\` (both), \`a | b\` (either), \`a ^ b\` (exactly one), \`~a\` (flip; in Python \`~a == -a - 1\`), \`a << k\` (× 2ᵏ), \`a >> k\` (floor ÷ 2ᵏ).
- **Bit i:** test \`(x >> i) & 1\`; set \`x | (1 << i)\`; clear \`x & ~(1 << i)\`; toggle \`x ^ (1 << i)\`.
- \`x & (x − 1)\` **removes the lowest set bit**: \`x − 1\` flips that bit and everything below it.
- \`x & −x\` **isolates the lowest set bit** (two's complement).

A power of two has exactly one set bit, so \`x > 0 and x & (x − 1) == 0\`.
`,
  maths: `
**In one breath.** Test/set/clear/toggle with \`1 << i\`; \`x & (x − 1)\` drops the lowest 1; \`x & −x\` keeps it; popcount \`bin(x).count("1")\` or \`x.bit_count()\` (3.10+); Python ints are unbounded.

**Template.**

\`\`\`python
x = 0b10110          # 22
(x >> 2) & 1         # 1: bit 2 is set
x | (1 << 0)         # 23: set bit 0
x & ~(1 << 4)        # 6: clear bit 4
x ^ (1 << 1)         # 20: toggle bit 1
x & (x - 1)          # 20: lowest set bit (2) removed
x & -x               # 2: lowest set bit isolated
bin(x).count("1")    # 3
\`\`\`

**Worked problem 1: count set bits by clearing them (Kernighan).**

\`\`\`python
def popcount(x):
    c = 0
    while x:
        x &= x - 1     # one iteration per set bit
        c += 1
    return c
popcount(11)          # 3 (1011)
\`\`\`

**Worked problem 2: set-bit counts for every number 0..n in O(n).**

\`\`\`python
def count_bits(n):
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        dp[i] = dp[i >> 1] + (i & 1)   # drop the last bit, add it back
    return dp
count_bits(5)          # [0, 1, 1, 2, 1, 2]
\`\`\`

**Worked problem 3: reverse the bits of a 32-bit unsigned integer.**

\`\`\`python
def reverse32(x):
    r = 0
    for _ in range(32):
        r = (r << 1) | (x & 1)
        x >>= 1
    return r
\`\`\`

**Python specifics.** Integers never overflow, and negatives behave as if they had infinitely many leading 1s: \`-1 >> 1 == -1\`, \`bin(-5) == '-0b101'\`. To emulate 32-bit behaviour, mask with \`& 0xFFFFFFFF\` and convert back with \`x - (1 << 32)\` if bit 31 is set.

**Edge cases.** 0 is not a power of two; negative inputs to popcount loops (infinite in Python unless masked); operator precedence (arithmetic binds tighter than shifts: \`1 << k - 1\` is \`1 << (k - 1)\`; write a mask of k ones as \`(1 << k) - 1\`).
`,
  practice: `
**Signals:** "binary representation", "number of 1 bits", "power of two/four", "flags", "toggle", "without using + or *", "32-bit", "Gray code".

**Variations.** Power of Four (power of two and the bit is at an even position: \`x & 0x55555555\`), Hamming Distance (\`popcount(a ^ b)\`), Sum of Two Integers without + (XOR for sum, AND << 1 for carry, with 32-bit masking in Python), Binary Watch, Minimum Flips to Make a OR b Equal to c.

**Practise:** Number of 1 Bits, Counting Bits, Power of Two, Power of Four, Reverse Bits, Hamming Distance, Sum of Two Integers, Minimum Flips to Make a OR b Equal to c.
`,
  traps: [
    { trap: "Write `1 << k - 1` for a mask of k ones.", why: "Arithmetic binds tighter than shifts, so it means 1 << (k − 1), a single bit. Write (1 << k) − 1. (In Python, & binds tighter than ==, unlike C and Java, but brackets still make intent clear.)" },
    { trap: "Loop `while x: x >>= 1` on a negative number.", why: "In Python −1 >> 1 is still −1, so the loop never ends. Mask to a fixed width first (x & 0xFFFFFFFF)." },
    { trap: "x & (x − 1) == 0 means x is a power of two.", why: "It's also true for 0. Require x > 0." },
  ],
  say: {
    prompt: "How do you check whether a number is a power of two, and count the set bits of a number efficiently?",
    secs: 40,
    check: ["Power of two: exactly one set bit", "x > 0 and x & (x − 1) == 0", "x & (x − 1) clears the lowest set bit", "Popcount: Kernighan loop (one step per set bit) or bin(x).count('1') / bit_count()", "Python's unbounded ints and negatives"],
    followups: [
      { q: "Why does x & (x − 1) clear the lowest set bit?", a: "Subtracting 1 turns the lowest 1 into 0 and every 0 below it into 1; ANDing with x keeps the higher bits and zeroes that block." },
      { q: "How would you check for a power of four?", a: "Power of two, and the single bit must be at an even position: x > 0 and x & (x − 1) == 0 and x & 0x55555555 != 0 (for 32-bit values)." },
      { q: "How do you get the counts for every number up to n?", a: "dp[i] = dp[i >> 1] + (i & 1), or dp[i] = dp[i & (i − 1)] + 1; O(n) total." },
    ],
    answer: `A power of two has exactly one bit set. Subtracting one flips that bit to zero and sets all the bits below it, so x & (x − 1) is zero exactly when there was a single set bit. I also check x > 0, because zero passes the same test.

To count set bits, Kernighan's method repeats x &= x − 1, clearing the lowest set bit each time, so it takes one step per set bit. In Python, bin(x).count('1') or int.bit_count() is simpler. One caution: Python integers are unbounded and negatives act as if they had infinite leading ones, so for 32-bit problems I mask with 0xFFFFFFFF first.`,
    avoid: ["Forgetting the x > 0 check", "Precedence bugs with shifts and arithmetic"],
  },
  terms: [["Set bit", "A bit equal to 1."], ["Popcount", "Number of set bits."], ["Two's complement", "Negative x stored so that −x = ~x + 1; gives x & −x."]],
  sources: [D.bits, S.cpBits],
});
Q({ id: "dsa2-bb-1", d: 1, secs: 30, prompt: "How many set bits in 29?", answer: 4, tol: 0.5, explain: "29 = 11101.", py: "x = 29; c = 0\nwhile x: x &= x-1; c += 1\nanswer = c" });
Q({ id: "dsa2-bb-2", d: 1, secs: 30, prompt: "What is 12 & 11?", answer: 8, tol: 0.5, explain: "1100 & 1011 = 1000. (x & (x − 1) with x = 12 clears the lowest set bit.)", py: "answer = 12 & 11" });
Q({ id: "dsa2-bb-3", d: 1, secs: 30, prompt: "What does 40 & −40 give (the lowest set bit of 40)?", answer: 8, tol: 0.5, explain: "40 = 101000.", py: "answer = 40 & -40" });
Q({ id: "dsa2-bb-4", d: 2, secs: 45, prompt: "Sum of the set-bit counts of all numbers from 0 to 8 inclusive?", answer: 13, tol: 0.5, explain: "0 1 1 2 1 2 2 3 1 → 13.", py: "n = 8; dp = [0]*(n+1)\nfor i in range(1, n+1): dp[i] = dp[i >> 1] + (i & 1)\nanswer = sum(dp)" });
Q({ id: "dsa2-bb-5", d: 2, secs: 45, prompt: "In Python, what is `1 << 3 - 1`?", options: ["7", "4", "2", "8"], answer: 1, explain: "Subtraction binds tighter than <<: 1 << 2 = 4. A mask of three ones is (1 << 3) − 1 = 7.", py: "answer = ['7', '4', '2', '8'].index(str(1 << 3 - 1))" });
C("dsa2-bb-c1", "Bit idioms", "test (x >> i) & 1 · set x | 1 << i · clear x & ~(1 << i) · toggle x ^ 1 << i.");
C("dsa2-bb-c2", "Lowest set bit", "x & (x − 1) removes it; x & −x isolates it; power of two: x > 0 and x & (x − 1) == 0.");

L("dsa2-xor-bitmask", TB, "XOR tricks and bitmasks", "XOR cancelling pairs to find a single or missing number, splitting by a differing bit, subsets as integers, and a bitwise trie for maximum XOR.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-bit-basics", "dsa2-trie"],
  hook: "Every number appears twice except one. Find it in O(n) time and O(1) memory. What happens when you XOR a number with itself?",
  intuition: `
**The situation.** "Every element appears twice except one", "find the missing number", "maximum XOR of two numbers", "try every subset of up to 20 items".

**The idea.**

- **XOR cancels pairs:** \`a ^ a = 0\`, \`a ^ 0 = a\`, and order doesn't matter. XOR everything and the pairs vanish, leaving the odd one out.
- **Missing number in 0..n:** XOR all indices 0..n with all values; every present number cancels.
- **Two unique numbers:** XOR of everything is \`a ^ b\`; any set bit of it is where \`a\` and \`b\` differ; split the numbers by that bit and XOR each group.
- **Subsets as masks:** for n ≤ 20, integer \`m\` from 0 to 2ⁿ − 1 encodes a subset (bit j ↔ item j). Iterate, or use masks as DP states.
- **Maximum XOR:** insert numbers bit by bit (high to low) into a binary trie; for each number, greedily walk towards the opposite bit.
`,
  maths: `
**In one breath.** \`reduce(xor, nums)\` for the single number; \`a ^ b\` then split on \`(a ^ b) & −(a ^ b)\`; masks \`for m in range(1 << n)\`; binary trie for max XOR in $O(n\\cdot B)$.

**Template: single number and missing number.**

\`\`\`python
from functools import reduce
from operator import xor
def single(nums):
    return reduce(xor, nums, 0)
single([4, 1, 2, 1, 2])                  # 4

def missing(nums):                       # n distinct values from 0..n
    x = len(nums)
    for i, v in enumerate(nums):
        x ^= i ^ v
    return x
missing([3, 0, 1])                       # 2
\`\`\`

**Worked problem 1: the two numbers that appear once.**

\`\`\`python
def two_singles(nums):
    both = reduce(xor, nums, 0)          # a ^ b, non-zero
    bit = both & -both                   # a lowest bit where a and b differ
    a = 0
    for x in nums:
        if x & bit:
            a ^= x                       # group with that bit set
    return sorted((a, both ^ a))
two_singles([1, 2, 1, 3, 2, 5])          # [3, 5]
\`\`\`

**Worked problem 2: subsets via bitmasks.**

\`\`\`python
def subset_sums(a):
    n = len(a)
    return [sum(a[j] for j in range(n) if m >> j & 1) for m in range(1 << n)]
len(subset_sums([1, 2, 3]))              # 8
\`\`\`

Bitmask DP uses masks as states: \`dp[mask]\` = best result using exactly the items in \`mask\`, e.g. assigning n ≤ 15 tasks to n people in $O(n\\cdot 2^n)$.

**Worked problem 3: maximum XOR of any two numbers.**

\`\`\`python
def max_xor(nums, B=31):
    root, best = {}, 0
    for x in nums:
        node = root                       # insert x, high bit first
        for i in range(B, -1, -1):
            node = node.setdefault(x >> i & 1, {})
        node, cur = root, 0               # query: prefer the opposite bit
        for i in range(B, -1, -1):
            b = x >> i & 1
            if 1 - b in node:
                cur |= 1 << i; node = node[1 - b]
            else:
                node = node[b]
        best = max(best, cur)
    return best
max_xor([3, 10, 5, 25, 2, 8])             # 28 (5 ^ 25)
\`\`\`

$O(n\\cdot B)$ for $B$-bit numbers.

**Edge cases.** Empty input to reduce (pass an initial 0); 'appears three times' variants (count bits mod 3 per position); negative numbers with masks (fix the width).
`,
  practice: `
**Signals:** "appears twice except one", "missing number", "O(1) extra space" with counting, "maximum XOR", "n ≤ 20 and all subsets", "assign each of n ≤ 15 items", "visit all nodes" (mask of visited).

**Variations.** Single Number II (each appears three times: bit counts mod 3), Find the Duplicate (XOR with 1..n when exactly one duplicate appears once extra), Subsets via masks, Shortest Path Visiting All Nodes (BFS over (node, mask)), Partition to K Equal Sum Subsets (bitmask DP), Maximum XOR With an Element From Array (offline + trie).

**Practise:** Single Number, Single Number II, Single Number III, Missing Number, Subsets (bitmask version), Maximum XOR of Two Numbers in an Array, Shortest Path Visiting All Nodes, Find the Shortest Superstring.
`,
  traps: [
    { trap: "XOR finds the single number when others appear three times.", why: "Three copies XOR to the number itself, not 0. Count bits per position modulo 3 instead." },
    { trap: "Use bitmask enumeration for n = 40.", why: "2⁴⁰ ≈ 10¹² masks is far too many. Bitmasks suit n ≤ ~20; for 40, meet in the middle (two halves of 2²⁰)." },
    { trap: "Compute the max XOR by checking all pairs on large inputs.", why: "O(n²) fails at n = 10⁵. The binary trie gives O(n · 32)." },
  ],
  say: {
    prompt: "Every number appears twice except two. Find those two in O(n) time and O(1) extra space.",
    secs: 50,
    check: ["XOR of all numbers = a ^ b (pairs cancel)", "a ≠ b so a ^ b has a set bit", "Pick it with x & −x", "Split numbers by that bit; XOR each group to get a and b", "O(n) time, O(1) space"],
    followups: [
      { q: "Why does splitting by that bit work?", a: "a and b differ at that bit, so they land in different groups; every duplicated number has both copies in the same group, so they cancel within it." },
      { q: "How do you handle 'every number appears three times except one'?", a: "For each bit position, count how many numbers have it set; the single number has that bit set iff the count mod 3 is 1. O(32n)." },
      { q: "How would you find the maximum XOR pair?", a: "Insert numbers into a binary trie from the highest bit; for each number, walk the trie preferring the opposite bit at every level; the best result over all numbers is the answer. O(n · bits)." },
    ],
    answer: `XOR has two useful properties: a number XOR itself is zero, and order doesn't matter. So XORing all the numbers cancels every pair and leaves a ^ b, the XOR of the two unique numbers. Since they're different, a ^ b has at least one set bit, which marks a position where a and b differ. I take the lowest one with x & −x.

I then split all numbers into two groups by whether that bit is set. a and b fall into different groups, and every duplicated number has both copies in the same group, so XORing each group gives a and b. That's two passes, O(n) time and O(1) extra space.`,
    avoid: ["Using a Counter when O(1) space is required", "Assuming XOR works for triples"],
  },
  terms: [["XOR", "Bitwise exclusive or; a ^ a = 0, a ^ 0 = a."], ["Bitmask", "Integer whose bits encode a subset."], ["Binary trie", "Trie over bits, high to low, for XOR queries."]],
  sources: [D.bits, S.cpBits, D.trie],
});
Q({ id: "dsa2-xb-1", d: 1, secs: 30, prompt: "XOR of all elements of [4, 1, 2, 1, 2]?", answer: 4, tol: 0.5, explain: "Pairs cancel.", py: "from functools import reduce\nfrom operator import xor\nanswer = reduce(xor, [4,1,2,1,2], 0)" });
Q({ id: "dsa2-xb-2", d: 1, secs: 45, prompt: "Missing number from 0..9 in [9, 6, 4, 2, 3, 5, 7, 0, 1]?", answer: 8, tol: 0.5, explain: "XOR of indices and values leaves 8.", py: "a = [9,6,4,2,3,5,7,0,1]; x = len(a)\nfor i, v in enumerate(a): x ^= i ^ v\nanswer = x" });
Q({ id: "dsa2-xb-3", d: 2, secs: 60, prompt: "Two numbers appear once in [1, 2, 1, 3, 2, 5]; the rest appear twice. Their sum?", answer: 8, tol: 0.5, explain: "3 and 5.", py: "from functools import reduce\nfrom operator import xor\nnums = [1,2,1,3,2,5]; both = reduce(xor, nums, 0); bit = both & -both; a = 0\nfor x in nums:\n    if x & bit: a ^= x\nanswer = a + (both ^ a)" });
Q({ id: "dsa2-xb-4", d: 2, secs: 60, prompt: "Maximum XOR of any two numbers in [3, 10, 5, 25, 2, 8]?", answer: 28, tol: 0.5, explain: "5 ^ 25 = 28.", py: "nums = [3,10,5,25,2,8]; root = {}; best = 0\nfor x in nums:\n    nd = root\n    for i in range(31, -1, -1): nd = nd.setdefault(x >> i & 1, {})\n    nd, cur = root, 0\n    for i in range(31, -1, -1):\n        b = x >> i & 1\n        if 1-b in nd: cur |= 1 << i; nd = nd[1-b]\n        else: nd = nd[b]\n    best = max(best, cur)\nanswer = best" });
Q({ id: "dsa2-xb-5", d: 2, secs: 60, prompt: "Using bitmasks over [3, 5, 6, 9], how many non-empty subsets have an even sum?", answer: 7, tol: 0.5, explain: "Enumerate masks 1..15 and count even sums.", py: "a = [3,5,6,9]; n = len(a)\nanswer = sum(sum(a[j] for j in range(n) if m >> j & 1) % 2 == 0 for m in range(1, 1 << n))" });
C("dsa2-xb-c1", "XOR cancels pairs", "a ^ a = 0, a ^ 0 = a: XOR everything to find the odd one out.");
C("dsa2-xb-c2", "Subsets as masks", "for m in range(1 << n): item j included iff m >> j & 1. n ≤ ~20.");

L("dsa2-trie-bits-practice", TB, "Tries and bits practice", "Trie and bit-manipulation problems to explain out loud.", {
  kind: "interview", mins: 25, prereq: ["dsa2-trie", "dsa2-bit-basics", "dsa2-xor-bitmask"],
  hook: "For each: why a trie or bit trick fits, the structure or identity used, and the complexity.",
}, [
  iq("Search Suggestions System: after each typed character, return up to 3 product names with that prefix, in lexicographic order.", "Sort products. For each prefix, bisect_left to the first product ≥ prefix and take up to 3 that start with it: O(n log n + L log n). Trie alternative: store the top 3 sorted words at each node during insertion; each query is a walk.", ["Sort + bisect per prefix", "Or trie with top-3 lists per node", "Check startswith on the 3 candidates", "Complexities of both"]),
  iq("Design Add and Search Words with '.' as a wildcard.", "Trie insert as usual. Search recursively: on a letter follow that child; on '.' try every child; succeed at the end if the node is a word end. Exact searches are O(L); wildcards can branch up to 26 per dot.", ["Trie", "DFS on '.'", "End flag check", "Wildcard cost"]),
  iq("Sum of Two Integers without using + or −.", "XOR gives the sum without carries; (a & b) << 1 gives the carries; repeat until no carry. In Python mask with 0xFFFFFFFF each step and convert back to a signed value at the end, since ints are unbounded.", ["XOR = sum without carry", "AND << 1 = carry", "Loop until carry 0", "32-bit masking in Python"]),
  iq("Single Number II: every element appears three times except one.", "For each of 32 bit positions, count the numbers with that bit set; bits where count % 3 == 1 belong to the answer. Convert from 32-bit signed at the end. O(32n) time, O(1) space. (A two-variable 'ones/twos' state machine also works.)", ["Per-bit counts mod 3", "Signed conversion", "O(n) time, O(1) space", "State-machine alternative"]),
  iq("Shortest Path Visiting All Nodes in a small graph (n ≤ 12).", "BFS over states (node, visited mask), starting from every node with its own bit set. The first state with mask == (1 << n) − 1 gives the answer. O(n · 2ⁿ) states, each expanding neighbours.", ["State = (node, mask)", "Multi-source BFS", "Full-mask target", "O(n² · 2ⁿ) bound"]),
  iq("Count the pairs (i < j) whose binary representations differ in exactly one bit, among n distinct numbers.", "Put the numbers in a set; for each number and each bit position b, check if x ^ (1 << b) is in the set; count each pair once (divide by 2). O(n · B).", ["Hamming distance 1 ⇔ XOR is a power of two", "Set lookups for x ^ (1 << b)", "Avoid double counting", "O(n · B)"]),
]);
