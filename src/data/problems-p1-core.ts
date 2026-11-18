import type { PythonProblem } from "@/lib/types";

/**
 * P1 · Core Python (batch 2): 3 coding problems per concept. Pure Python, no packages.
 * scripts/verify-py.mts runs every reference solution against every test in Pyodide.
 */
type T = [name: string, call: string, expected: string, hidden?: boolean];
interface Spec {
  id: string;
  cat: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  targetMin: number;
  tags: string[];
  statement: string;
  starter: string;
  solution: string;
  tests: T[];
  setup?: string;
  constraints?: string[];
  hints?: string[];
  why: string;
  traps: string[];
  followUps: string[];
}

/** Shared test helper, shown under Fixtures. */
const RAISES = `def raises(f, exc):
    try:
        f()
    except exc:
        return True
    return False
`;

const P = (s: Spec): PythonProblem => ({
  id: s.id,
  kind: "python",
  title: s.title,
  pillar: "data",
  competency: "python_stats",
  category: s.cat,
  difficulty: s.difficulty,
  source: { kind: "practice" },
  tracks: [],
  tags: s.tags,
  targetMin: s.targetMin,
  statement: s.statement,
  constraints: s.constraints,
  starter: s.starter,
  solution: s.solution,
  setup: s.setup,
  tests: s.tests.map(([name, call, expected, hidden], i) => ({ id: `t${i + 1}`, name, call, expected, hidden: !!hidden })),
  hints: s.hints,
  context: { why: s.why, traps: s.traps, followUps: s.followUps },
});

export const P1_CORE_PROBLEMS: PythonProblem[] = [
  // ───────── Objects, mutability, copying ─────────
  P({
    id: "py-co-grid", cat: "py/objects", title: "Build a grid with independent rows", difficulty: "Easy", targetMin: 5, tags: ["aliasing", "list of lists"],
    statement: "Write `make_grid(rows, cols, fill)` that returns a list of `rows` lists, each with `cols` copies of `fill`.\n\nChanging one cell must not change any other row. `[[fill] * cols] * rows` fails this: every row is the same list object.",
    starter: "def make_grid(rows, cols, fill):\n    pass\n",
    solution: "def make_grid(rows, cols, fill):\n    return [[fill] * cols for _ in range(rows)]\n",
    tests: [
      ["2 × 3 of zeros", "make_grid(2, 3, 0)", "[[0, 0, 0], [0, 0, 0]]"],
      ["Rows are independent", "(g := make_grid(2, 3, 0), g[0].__setitem__(0, 9), g)[2]", "[[9, 0, 0], [0, 0, 0]]"],
      ["Hidden: zero rows", "make_grid(0, 3, 0)", "[]", true],
      ["Hidden: rows are distinct objects", "(g := make_grid(3, 1, 'x'), g[0] is g[1])[1]", "False", true],
    ],
    hints: ["Build each row inside a comprehension so a new list is made every time."],
    why: "The `[[0] * n] * m` bug is the most common Python mutability question, and it breaks real DP tables in OAs.",
    traps: ["Multiplying the outer list: m references to one row.", "Using `[fill] * cols` with a mutable fill such as a list: the cells then share it."],
    followUps: ["Why is `[0] * n` safe for the inner list?", "How would you make a grid of empty lists, one per cell?"],
  }),
  P({
    id: "py-co-default", cat: "py/objects", title: "Fix the shared default list", difficulty: "Easy", targetMin: 5, tags: ["default arguments", "mutability"],
    statement: "Write `add_tag(tag, tags=None)` that returns a **new** list: `tags` (or an empty list if none is given) with `tag` appended.\n\nIt must not change the list passed in, and two calls without `tags` must not share state. A default of `tags=[]` fails, because the default list is created once and reused.",
    starter: "def add_tag(tag, tags=None):\n    pass\n",
    solution: "def add_tag(tag, tags=None):\n    return (list(tags) if tags is not None else []) + [tag]\n",
    tests: [
      ["No list given", "add_tag('a')", "['a']"],
      ["Calls do not share state", "(add_tag('a'), add_tag('b'))[1]", "['b']"],
      ["Appends to a given list", "add_tag('y', ['x'])", "['x', 'y']"],
      ["Hidden: input list unchanged", "(t := ['x'], add_tag('y', t), t)[2]", "['x']", true],
    ],
    why: "Default arguments are evaluated once, when the function is defined. Interviewers ask this to check you know when Python creates objects.",
    traps: ["`def f(x, acc=[])`: the same list grows across calls.", "`tags.append(tag)`: mutates the caller's list."],
    followUps: ["Why is `None` the conventional default?", "Is a default of `()` safe? Why?"],
  }),
  P({
    id: "py-co-deep", cat: "py/objects", title: "Update a nested config without mutating it", difficulty: "Medium", targetMin: 8, tags: ["deepcopy", "nested dict"],
    statement: "Write `with_setting(config, path, value)`. `path` is a list of keys. Return a **new** nested dict equal to `config` but with the value at `path` set to `value`, creating missing levels as needed.\n\nThe original `config`, including its inner dicts, must not change.",
    starter: "import copy\n\ndef with_setting(config, path, value):\n    pass\n",
    solution: "import copy\n\ndef with_setting(config, path, value):\n    out = copy.deepcopy(config)\n    node = out\n    for k in path[:-1]:\n        node = node.setdefault(k, {})\n    node[path[-1]] = value\n    return out\n",
    tests: [
      ["Set an existing value", "with_setting({'a': {'b': 1}}, ['a', 'b'], 2)", "{'a': {'b': 2}}"],
      ["Create missing levels", "with_setting({}, ['x', 'y'], 1)", "{'x': {'y': 1}}"],
      ["Hidden: original inner dict unchanged", "(c := {'a': {'b': 1}}, with_setting(c, ['a', 'b'], 5), c)[2]", "{'a': {'b': 1}}", true],
      ["Hidden: sibling keys kept", "with_setting({'a': {'b': 1, 'c': 2}}, ['a', 'b'], 0)", "{'a': {'b': 0, 'c': 2}}", true],
    ],
    hints: ["`dict(config)` or `config.copy()` is shallow: inner dicts are still shared.", "`copy.deepcopy` copies every level."],
    why: "Shallow versus deep copy is a standard follow-up to mutability, and nested configs are where it bites in real code.",
    traps: ["`config.copy()` then editing an inner dict: the original changes too.", "Forgetting to create missing intermediate dicts."],
    followUps: ["What does deepcopy do with objects that reference each other?", "When is a shallow copy enough?"],
  }),

  // ───────── Numbers, strings, formatting ─────────
  P({
    id: "py-cs-palin", cat: "py/strings", title: "Palindrome, ignoring punctuation and case", difficulty: "Easy", targetMin: 5, tags: ["two pointers", "str methods"],
    statement: "Write `is_pal(s)` that returns `True` if `s` reads the same forwards and backwards after keeping only letters and digits and ignoring case.",
    starter: "def is_pal(s):\n    pass\n",
    solution: "def is_pal(s):\n    t = [c.lower() for c in s if c.isalnum()]\n    return t == t[::-1]\n",
    tests: [
      ["Classic", "is_pal('A man, a plan, a canal: Panama')", "True"],
      ["Not a palindrome", "is_pal('race a car')", "False"],
      ["Hidden: empty string", "is_pal('')", "True", true],
      ["Hidden: digit vs letter", "is_pal('0P')", "False", true],
    ],
    why: "A warm-up that checks str methods, slicing and attention to the spec (digits count, case does not).",
    traps: ["Dropping digits along with punctuation.", "Comparing before lowercasing."],
    followUps: ["Do it in O(1) extra space with two pointers.", "What changes for Unicode text?"],
  }),
  P({
    id: "py-cs-rle", cat: "py/strings", title: "Run-length encode a string", difficulty: "Easy", targetMin: 6, tags: ["strings", "join"],
    statement: "Write `rle(s)` that replaces each run of a repeated character with the character followed by the run length: `\"aaabcc\"` → `\"a3b1c2\"`.",
    starter: "def rle(s):\n    pass\n",
    solution: "def rle(s):\n    out = []\n    i = 0\n    while i < len(s):\n        j = i\n        while j < len(s) and s[j] == s[i]:\n            j += 1\n        out.append(f\"{s[i]}{j - i}\")\n        i = j\n    return \"\".join(out)\n",
    tests: [
      ["Mixed runs", "rle('aaabccdddd')", "'a3b1c2d4'"],
      ["Single character", "rle('z')", "'z1'"],
      ["Hidden: empty", "rle('')", "''", true],
      ["Hidden: same character in two runs", "rle('aabbaa')", "'a2b2a2'", true],
    ],
    hints: ["Collect pieces in a list and join once; repeated `+=` on strings is quadratic in the worst case."],
    why: "Tests loop control and string building. It also comes up as 'compress a string' in OAs.",
    traps: ["Counting all occurrences of a character instead of consecutive runs.", "Dropping the last run when the loop ends."],
    followUps: ["Write the decoder.", "Solve it with itertools.groupby."],
  }),
  P({
    id: "py-cs-caesar", cat: "py/strings", title: "Caesar shift", difficulty: "Medium", targetMin: 8, tags: ["ord/chr", "modulo"],
    statement: "Write `shift(s, k)` that shifts every letter `k` places through the alphabet, wrapping around and keeping its case. Other characters stay as they are. `k` may be negative or larger than 26.",
    starter: "def shift(s, k):\n    pass\n",
    solution: "def shift(s, k):\n    out = []\n    for c in s:\n        if c.isalpha() and c.isascii():\n            base = ord('A') if c.isupper() else ord('a')\n            out.append(chr(base + (ord(c) - base + k) % 26))\n        else:\n            out.append(c)\n    return ''.join(out)\n",
    tests: [
      ["Mixed case and punctuation", "shift('Hello, World!', 3)", "'Khoor, Zruog!'"],
      ["Wraps around", "shift('xyz', 2)", "'zab'"],
      ["Hidden: negative shift", "shift('abc', -1)", "'zab'", true],
      ["Hidden: full rotation", "shift('ABC', 26)", "'ABC'", true],
    ],
    why: "Checks ord/chr arithmetic and Python's modulo, which is always non-negative for a positive divisor.",
    traps: ["Shifting punctuation.", "Using `%` and expecting a negative result for negative k, as in C or Java."],
    followUps: ["What is -1 % 26 in Python?", "Decode a message without knowing k."],
  }),

  // ───────── Lists, tuples, slicing ─────────
  P({
    id: "py-cl-rotate", cat: "py/lists", title: "Rotate a list to the right", difficulty: "Easy", targetMin: 5, tags: ["slicing", "modulo"],
    statement: "Write `rotate(xs, k)` that returns a new list rotated right by `k` places: `rotate([1, 2, 3, 4, 5], 2)` → `[4, 5, 1, 2, 3]`. `k` may be larger than the length. Do not change `xs`.",
    starter: "def rotate(xs, k):\n    pass\n",
    solution: "def rotate(xs, k):\n    if not xs:\n        return []\n    k %= len(xs)\n    return xs[-k:] + xs[:-k] if k else list(xs)\n",
    tests: [
      ["Rotate by 2", "rotate([1, 2, 3, 4, 5], 2)", "[4, 5, 1, 2, 3]"],
      ["k larger than length", "rotate([1, 2, 3, 4, 5], 7)", "[4, 5, 1, 2, 3]"],
      ["Hidden: empty list", "rotate([], 3)", "[]", true],
      ["Hidden: k = 0 and input unchanged", "(xs := [1, 2, 3], rotate(xs, 0), xs)[1:]", "([1, 2, 3], [1, 2, 3])", true],
    ],
    why: "Slicing plus an edge case: `xs[-0:]` is the whole list, which breaks the naive one-liner when k is a multiple of the length.",
    traps: ["`xs[-k:] + xs[:-k]` with k = 0 doubles the list.", "Dividing by zero on an empty list."],
    followUps: ["Rotate in place with O(1) extra space.", "What does collections.deque.rotate do?"],
  }),
  P({
    id: "py-cl-chunk", cat: "py/lists", title: "Split a list into chunks", difficulty: "Easy", targetMin: 4, tags: ["slicing", "range step"],
    statement: "Write `chunks(xs, n)` that splits `xs` into consecutive lists of length `n`; the last may be shorter.",
    starter: "def chunks(xs, n):\n    pass\n",
    solution: "def chunks(xs, n):\n    return [xs[i:i + n] for i in range(0, len(xs), n)]\n",
    tests: [
      ["Uneven split", "chunks([1, 2, 3, 4, 5], 2)", "[[1, 2], [3, 4], [5]]"],
      ["n bigger than the list", "chunks([1, 2, 3], 5)", "[[1, 2, 3]]"],
      ["Hidden: empty", "chunks([], 3)", "[]", true],
      ["Hidden: exact split", "chunks(list(range(6)), 3)", "[[0, 1, 2], [3, 4, 5]]", true],
    ],
    why: "Batching is everywhere (API calls, pagination). It checks that you know slices never raise on out-of-range ends.",
    traps: ["Looping with an index and appending element by element: correct but slow to write.", "Dropping the final short chunk."],
    followUps: ["Write it as a generator that works on any iterable.", "What does itertools.batched (3.12) return?"],
  }),
  P({
    id: "py-cl-merge", cat: "py/lists", title: "Merge two sorted lists", difficulty: "Medium", targetMin: 8, tags: ["two pointers", "merge"],
    statement: "Write `merge(a, b)` that merges two ascending lists into one ascending list in O(len(a) + len(b)) time. Do not call `sorted` or `.sort()`.",
    starter: "def merge(a, b):\n    pass\n",
    solution: "def merge(a, b):\n    i = j = 0\n    out = []\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            out.append(a[i]); i += 1\n        else:\n            out.append(b[j]); j += 1\n    out.extend(a[i:])\n    out.extend(b[j:])\n    return out\n",
    tests: [
      ["Interleaved", "merge([1, 4, 7], [2, 3, 8, 9])", "[1, 2, 3, 4, 7, 8, 9]"],
      ["Duplicates", "merge([1, 2, 2], [2])", "[1, 2, 2, 2]"],
      ["Hidden: one empty", "merge([], [1])", "[1]", true],
      ["Hidden: all of a first", "merge([1, 2], [5, 6, 7])", "[1, 2, 5, 6, 7]", true],
    ],
    why: "The merge step of merge sort, and the basis of many two-pointer OA problems.",
    traps: ["Forgetting to append the leftover tail of one list.", "Using `pop(0)`, which is O(n) each time."],
    followUps: ["Merge k sorted lists (heapq).", "Keep it stable: which list should win ties?"],
  }),

  // ───────── Dicts, sets, hashing ─────────
  P({
    id: "py-cd-anagram", cat: "py/dicts", title: "Group anagrams", difficulty: "Medium", targetMin: 8, tags: ["dict of lists", "hashable keys"],
    statement: "Write `group_anagrams(words)` that groups words that are anagrams of each other. Sort the words inside each group, and sort the groups by their first word.",
    starter: "def group_anagrams(words):\n    pass\n",
    solution: "from collections import defaultdict\n\ndef group_anagrams(words):\n    g = defaultdict(list)\n    for w in words:\n        g[''.join(sorted(w))].append(w)\n    return sorted(sorted(v) for v in g.values())\n",
    tests: [
      ["Classic", "group_anagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat'])", "[['ate', 'eat', 'tea'], ['bat'], ['nat', 'tan']]"],
      ["No anagrams", "group_anagrams(['ab', 'cd'])", "[['ab'], ['cd']]"],
      ["Hidden: empty", "group_anagrams([])", "[]", true],
      ["Hidden: repeated word", "group_anagrams(['a', 'a'])", "[['a', 'a']]", true],
    ],
    hints: ["The sorted letters make a key that all anagrams share. A list is not hashable, so join it into a string or use a tuple."],
    why: "Tests choosing a hashable key and the dict-of-lists pattern.",
    traps: ["Using a list as the dict key: TypeError.", "Using a set of letters: 'aab' and 'ab' collide."],
    followUps: ["Use a 26-count tuple as the key: why is it O(n) per word instead of O(n log n)?"],
  }),
  P({
    id: "py-cd-firstuniq", cat: "py/dicts", title: "First non-repeating character", difficulty: "Easy", targetMin: 5, tags: ["Counter", "two passes"],
    statement: "Write `first_unique(s)` that returns the index of the first character that appears exactly once in `s`, or -1 if there is none.",
    starter: "def first_unique(s):\n    pass\n",
    solution: "from collections import Counter\n\ndef first_unique(s):\n    c = Counter(s)\n    for i, ch in enumerate(s):\n        if c[ch] == 1:\n            return i\n    return -1\n",
    tests: [
      ["At the start", "first_unique('leetcode')", "0"],
      ["In the middle", "first_unique('loveleetcode')", "2"],
      ["Hidden: none", "first_unique('aabb')", "-1", true],
      ["Hidden: empty", "first_unique('')", "-1", true],
    ],
    why: "Count once, scan once: the standard O(n) pattern instead of calling s.count inside a loop (O(n²)).",
    traps: ["`s.count(ch)` inside the loop: quadratic.", "Returning the character instead of its index."],
    followUps: ["Do it in one pass for a stream of characters."],
  }),
  P({
    id: "py-cd-topk", cat: "py/dicts", title: "Top k most frequent values", difficulty: "Medium", targetMin: 8, tags: ["Counter", "sort key"],
    statement: "Write `top_k(nums, k)` that returns the `k` most frequent values, most frequent first. Break ties by the smaller value first.",
    starter: "def top_k(nums, k):\n    pass\n",
    solution: "from collections import Counter\n\ndef top_k(nums, k):\n    c = Counter(nums)\n    return [v for v, _ in sorted(c.items(), key=lambda p: (-p[1], p[0]))[:k]]\n",
    tests: [
      ["Clear winner", "top_k([1, 1, 1, 2, 2, 3], 2)", "[1, 2]"],
      ["Tie broken by value", "top_k([5, 5, 4, 4, 6], 2)", "[4, 5]"],
      ["Hidden: single element", "top_k([7], 1)", "[7]", true],
      ["Hidden: k equals distinct count", "top_k([3, 1, 2, 1], 3)", "[1, 2, 3]", true],
    ],
    why: "Counter plus a compound sort key is the idiomatic answer; tie-breaking shows whether you read the spec.",
    traps: ["`Counter.most_common` breaks ties by first appearance, not by value.", "Sorting by count ascending."],
    followUps: ["Do it in O(n log k) with heapq.nlargest.", "Bucket sort for O(n)."],
  }),

  // ───────── Comprehensions, iterators, generators ─────────
  P({
    id: "py-ci-flatten", cat: "py/iter", title: "Flatten nested lists lazily", difficulty: "Medium", targetMin: 8, tags: ["generators", "recursion", "yield from"],
    statement: "Write a generator function `flatten(x)` that yields every non-list item of an arbitrarily nested list, left to right.",
    starter: "def flatten(x):\n    pass\n",
    solution: "def flatten(x):\n    for item in x:\n        if isinstance(item, list):\n            yield from flatten(item)\n        else:\n            yield item\n",
    tests: [
      ["Deep nesting", "list(flatten([1, [2, [3, [4]], 5]]))", "[1, 2, 3, 4, 5]"],
      ["Is a generator", "type(flatten([])).__name__", "'generator'"],
      ["Hidden: only empty lists", "list(flatten([[], [[]]]))", "[]", true],
      ["Hidden: strings are items", "list(flatten(['ab', ['c']]))", "['ab', 'c']", true],
    ],
    why: "yield from and recursion together; laziness matters when the structure is large.",
    traps: ["Returning a list: works, but is not a generator.", "Recursing into strings, which are iterable."],
    followUps: ["Rewrite it without recursion using an explicit stack."],
  }),
  P({
    id: "py-ci-fib", cat: "py/iter", title: "An infinite Fibonacci generator", difficulty: "Easy", targetMin: 4, tags: ["generators", "itertools.islice"],
    statement: "Write a generator `fib()` that yields 0, 1, 1, 2, 3, 5, … forever. The tests take the first few values with `itertools.islice`.",
    setup: "import itertools\n",
    starter: "def fib():\n    pass\n",
    solution: "def fib():\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b\n",
    tests: [
      ["First 8", "list(itertools.islice(fib(), 8))", "[0, 1, 1, 2, 3, 5, 8, 13]"],
      ["Independent generators", "(g := fib(), next(g), next(g), next(fib()))[3]", "0"],
      ["Hidden: 50th value", "next(itertools.islice(fib(), 50, None))", "12586269025", true],
    ],
    why: "Generators can be infinite because values are produced on demand.",
    traps: ["Building a list first: never finishes.", "Updating a and b on separate lines, which uses the new a."],
    followUps: ["Why does `a, b = b, a + b` work?"],
  }),
  P({
    id: "py-ci-windows", cat: "py/iter", title: "Sliding windows over any iterable", difficulty: "Medium", targetMin: 8, tags: ["deque", "generators"],
    statement: "Write a generator `windows(xs, k)` that yields every run of `k` consecutive items as a tuple. It must work for any iterable, including an iterator that can only be read once.",
    starter: "from collections import deque\n\ndef windows(xs, k):\n    pass\n",
    solution: "from collections import deque\n\ndef windows(xs, k):\n    w = deque(maxlen=k)\n    for x in xs:\n        w.append(x)\n        if len(w) == k:\n            yield tuple(w)\n",
    tests: [
      ["Pairs", "list(windows([1, 2, 3, 4], 2))", "[(1, 2), (2, 3), (3, 4)]"],
      ["Works on an iterator", "list(windows(iter(range(5)), 3))", "[(0, 1, 2), (1, 2, 3), (2, 3, 4)]"],
      ["Hidden: k too large", "list(windows([1, 2], 3))", "[]", true],
    ],
    hints: ["A deque with maxlen drops the oldest item automatically."],
    why: "Rolling computations (moving averages, n-grams) over streams that do not fit in memory.",
    traps: ["Slicing: fails on iterators.", "Yielding the deque itself; every yielded value then changes."],
    followUps: ["What does itertools.pairwise do?"],
  }),

  // ───────── Functions, closures, decorators ─────────
  P({
    id: "py-cf-counter", cat: "py/functions", title: "A counter made with a closure", difficulty: "Easy", targetMin: 5, tags: ["closures", "nonlocal"],
    statement: "Write `make_counter(start=0, step=1)` that returns a function. Its first call returns `start`, the next `start + step`, and so on. Separate counters must not share state.",
    starter: "def make_counter(start=0, step=1):\n    pass\n",
    solution: "def make_counter(start=0, step=1):\n    n = start - step\n    def nxt():\n        nonlocal n\n        n += step\n        return n\n    return nxt\n",
    tests: [
      ["Third call", "(c := make_counter(), c(), c(), c())[3]", "2"],
      ["Custom start and step", "(c := make_counter(10, 5), c(), c())[2]", "15"],
      ["Hidden: independent counters", "(a := make_counter(), b := make_counter(), a(), a(), b())[4]", "0", true],
    ],
    why: "Closures keep state without a class; nonlocal is needed to rebind an enclosing variable.",
    traps: ["`n += 1` without nonlocal: UnboundLocalError.", "A module-level counter shared by every caller."],
    followUps: ["Write the same with a class and __call__.", "What is in nxt.__closure__?"],
  }),
  P({
    id: "py-cf-memo", cat: "py/functions", title: "Write a memoize decorator", difficulty: "Medium", targetMin: 8, tags: ["decorators", "functools.wraps", "caching"],
    statement: "Write a decorator `memoize(f)` that caches results by positional arguments: the second call with the same arguments returns the cached value without calling `f`. Preserve `f`'s name with `functools.wraps`.",
    starter: "import functools\n\ndef memoize(f):\n    pass\n",
    solution: "import functools\n\ndef memoize(f):\n    cache = {}\n    @functools.wraps(f)\n    def wrapper(*args):\n        if args not in cache:\n            cache[args] = f(*args)\n        return cache[args]\n    return wrapper\n",
    tests: [
      ["Calls f once per argument", "(log := [], f := memoize(lambda x: log.append(x) or x * 2), f(3), f(3), f(4), log)[5]", "[3, 4]"],
      ["Returns the value", "memoize(lambda a, b: a + b)(2, 3)", "5"],
      ["Hidden: name preserved", "memoize(len).__name__", "'len'", true],
      ["Hidden: caches falsy results", "(log := [], f := memoize(lambda x: log.append(x) or 0), f(1), f(1), log)[4]", "[1]", true],
    ],
    hints: ["Use `args` (a tuple) as the cache key.", "Check `in cache`, not the truthiness of the cached value."],
    why: "Decorators are a favourite Python interview topic; memoization is the canonical example.",
    traps: ["`if cache.get(args)`: re-computes results that are 0 or None.", "Forgetting wraps, so the decorated function's name and docstring are lost."],
    followUps: ["How does functools.lru_cache differ?", "Support keyword arguments in the key."],
  }),
  P({
    id: "py-cf-sortpeople", cat: "py/functions", title: "Sort records with a compound key", difficulty: "Easy", targetMin: 4, tags: ["sorted", "key functions"],
    statement: "`people` is a list of `(name, age)` tuples. Write `sort_people(people)` that returns them sorted by age, oldest first, and by name A–Z among people of the same age.",
    starter: "def sort_people(people):\n    pass\n",
    solution: "def sort_people(people):\n    return sorted(people, key=lambda p: (-p[1], p[0]))\n",
    tests: [
      ["Mixed", "sort_people([('Ravi', 30), ('Asha', 25), ('Bala', 30)])", "[('Bala', 30), ('Ravi', 30), ('Asha', 25)]"],
      ["Hidden: empty", "sort_people([])", "[]", true],
      ["Hidden: input unchanged", "(p := [('b', 1), ('a', 2)], sort_people(p), p)[2]", "[('b', 1), ('a', 2)]", true],
    ],
    why: "Negating a numeric field inside a tuple key is the standard way to mix descending and ascending orders.",
    traps: ["`reverse=True`: also reverses the name order.", "`list.sort()`, which mutates the input and returns None."],
    followUps: ["How would you sort descending by a string field? (sort twice, relying on stability)"],
  }),

  // ───────── Classes, dataclasses ─────────
  P({
    id: "py-cc-stack", cat: "py/classes", title: "Implement a Stack class", difficulty: "Easy", targetMin: 6, tags: ["classes", "dunder methods"],
    statement: "Write a class `Stack` with `push(x)`, `pop()`, `peek()`, `is_empty()` and `len(stack)`. `pop()` and `peek()` on an empty stack raise `IndexError`.",
    setup: RAISES,
    starter: "class Stack:\n    pass\n",
    solution: "class Stack:\n    def __init__(self):\n        self._items = []\n\n    def push(self, x):\n        self._items.append(x)\n\n    def pop(self):\n        if not self._items:\n            raise IndexError('pop from empty stack')\n        return self._items.pop()\n\n    def peek(self):\n        if not self._items:\n            raise IndexError('peek at empty stack')\n        return self._items[-1]\n\n    def is_empty(self):\n        return not self._items\n\n    def __len__(self):\n        return len(self._items)\n",
    tests: [
      ["Push, push, pop", "(s := Stack(), s.push(1), s.push(2), s.pop(), len(s))[3:]", "(2, 1)"],
      ["Peek does not remove", "(s := Stack(), s.push('a'), s.peek(), len(s))[2:]", "('a', 1)"],
      ["Hidden: empty pop raises", "raises(lambda: Stack().pop(), IndexError)", "True", true],
      ["Hidden: separate stacks", "(a := Stack(), b := Stack(), a.push(1), b.is_empty())[3]", "True", true],
    ],
    why: "Shows you can write a small class with an instance attribute (not a shared class attribute) and a dunder method.",
    traps: ["`items = []` at class level: every stack shares one list.", "Not checking in peek: `self._items[-1]` on an empty list does raise IndexError, but with a message about list indices that hides what went wrong."],
    followUps: ["Add `__repr__`.", "Make it iterable from top to bottom."],
  }),
  P({
    id: "py-cc-point", cat: "py/classes", title: "A frozen, ordered dataclass", difficulty: "Medium", targetMin: 8, tags: ["dataclasses", "frozen", "order"],
    statement: "Write a dataclass `Point` with float fields `x` and `y` that is **frozen** (immutable, hashable) and **ordered** by `(x, y)`. Add a method `dist(other)` returning the Euclidean distance.",
    setup: RAISES,
    starter: "from dataclasses import dataclass\nimport math\n\n\nclass Point:\n    pass\n",
    solution: "from dataclasses import dataclass\nimport math\n\n\n@dataclass(frozen=True, order=True)\nclass Point:\n    x: float\n    y: float\n\n    def dist(self, other):\n        return math.hypot(self.x - other.x, self.y - other.y)\n",
    tests: [
      ["Distance", "Point(0, 0).dist(Point(3, 4))", "5.0"],
      ["Sorted by x then y", "sorted([Point(2, 1), Point(1, 5), Point(1, 2)])", "[Point(1, 2), Point(1, 5), Point(2, 1)]"],
      ["Hidden: immutable", "raises(lambda: setattr(Point(1, 2), 'x', 9), AttributeError)", "True", true],
      ["Hidden: hashable and equal by value", "len({Point(1, 2), Point(1, 2)})", "1", true],
    ],
    why: "Dataclasses remove boilerplate; frozen and order are the two options interviewers ask about.",
    traps: ["Forgetting frozen: then the instances are not hashable (eq=True sets __hash__ to None).", "Writing __lt__ by hand for every comparison."],
    followUps: ["Why does a mutable dataclass with eq=True have no __hash__?", "How do you give a list field a default? (field(default_factory=list))"],
  }),
  P({
    id: "py-cc-account", cat: "py/classes", title: "Bank account with a read-only balance", difficulty: "Medium", targetMin: 8, tags: ["property", "validation"],
    statement: "Write a class `Account(owner, balance=0)` with:\n\n- `deposit(amount)`: raises `ValueError` if `amount <= 0`\n- `withdraw(amount)`: raises `ValueError` if `amount <= 0` or more than the balance\n- `balance`: a read-only property (assigning to it raises `AttributeError`)",
    setup: RAISES,
    starter: "class Account:\n    pass\n",
    solution: "class Account:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self._balance = balance\n\n    @property\n    def balance(self):\n        return self._balance\n\n    def deposit(self, amount):\n        if amount <= 0:\n            raise ValueError('deposit must be positive')\n        self._balance += amount\n\n    def withdraw(self, amount):\n        if amount <= 0 or amount > self._balance:\n            raise ValueError('invalid withdrawal')\n        self._balance -= amount\n",
    tests: [
      ["Deposit then withdraw", "(a := Account('x', 100), a.deposit(50), a.withdraw(30), a.balance)[3]", "120"],
      ["Overdraw raises", "raises(lambda: Account('x', 10).withdraw(20), ValueError)", "True"],
      ["Hidden: balance is read-only", "raises(lambda: setattr(Account('x'), 'balance', 5), AttributeError)", "True", true],
      ["Hidden: negative deposit raises", "raises(lambda: Account('x').deposit(-1), ValueError)", "True", true],
    ],
    why: "Encapsulation with @property and validation by raising the right exception type.",
    traps: ["Storing the value in `self.balance` while also defining a balance property: infinite recursion or a clash.", "Returning False instead of raising."],
    followUps: ["Add a transaction history.", "Should withdraw raise or return a result object?"],
  }),

  // ───────── Exceptions, context managers ─────────
  P({
    id: "py-ce-safediv", cat: "py/exceptions", title: "Safe division", difficulty: "Easy", targetMin: 4, tags: ["try/except", "specific exceptions"],
    statement: "Write `safe_div(a, b)` that returns `a / b`, or `None` when `b` is zero. Any other error (such as dividing a string) must still be raised.",
    setup: RAISES,
    starter: "def safe_div(a, b):\n    pass\n",
    solution: "def safe_div(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return None\n",
    tests: [
      ["Normal division", "safe_div(6, 3)", "2.0"],
      ["Divide by zero", "safe_div(1, 0)", "None"],
      ["Hidden: other errors propagate", "raises(lambda: safe_div('a', 1), TypeError)", "True", true],
    ],
    why: "Catch only what you can handle. A bare except hides real bugs.",
    traps: ["`except:` or `except Exception:` swallows the TypeError.", "Checking `b == 0` misses 0.0 in some designs; here both work, but EAFP is the Python habit."],
    followUps: ["When would you prefer LBYL (checking first) over EAFP?"],
  }),
  P({
    id: "py-ce-parse", cat: "py/exceptions", title: "Parse integers and count the bad ones", difficulty: "Easy", targetMin: 5, tags: ["ValueError", "int()"],
    statement: "Write `parse_ints(items)` that converts each string with `int()` and returns `(ints, bad)`: the list of successfully parsed integers in order, and the number of strings that could not be parsed.",
    starter: "def parse_ints(items):\n    pass\n",
    solution: "def parse_ints(items):\n    out, bad = [], 0\n    for s in items:\n        try:\n            out.append(int(s))\n        except ValueError:\n            bad += 1\n    return out, bad\n",
    tests: [
      ["Mixed input", "parse_ints(['1', ' 2 ', 'x', '3.5', '-4'])", "([1, 2, -4], 2)"],
      ["Hidden: empty", "parse_ints([])", "([], 0)", true],
    ],
    why: "Data cleaning in OAs: bad rows should be counted, not crash the run.",
    traps: ["Expecting int('3.5') to give 3: it raises ValueError.", "Expecting int(' 2 ') to fail: surrounding whitespace is allowed."],
    followUps: ["Also accept '3.0' as 3 but reject '3.5'."],
  }),
  P({
    id: "py-ce-retry", cat: "py/exceptions", title: "Retry a flaky call", difficulty: "Medium", targetMin: 8, tags: ["exceptions", "re-raise"],
    statement: "Write `retry(func, times)` that calls `func()` up to `times` times and returns the first result that does not raise. If every attempt raises, re-raise the last exception.\n\nThe fixture `flaky(n)` returns a function that raises `ConnectionError` its first `n` calls and returns `'ok'` after that.",
    setup: RAISES + "\ndef flaky(n):\n    state = {'left': n}\n    def f():\n        if state['left'] > 0:\n            state['left'] -= 1\n            raise ConnectionError('try again')\n        return 'ok'\n    return f\n",
    starter: "def retry(func, times):\n    pass\n",
    solution: "def retry(func, times):\n    last = None\n    for _ in range(times):\n        try:\n            return func()\n        except Exception as e:\n            last = e\n    raise last\n",
    tests: [
      ["Succeeds on the third try", "retry(flaky(2), 3)", "'ok'"],
      ["Gives up and re-raises", "raises(lambda: retry(flaky(3), 3), ConnectionError)", "True"],
      ["Hidden: first call succeeds", "retry(lambda: 5, 1)", "5", true],
    ],
    why: "Retries are everywhere in data pipelines that call APIs. The detail interviewers check is re-raising the original exception.",
    traps: ["Returning None after the last failure, which hides the error.", "Raising a new generic Exception and losing the original type."],
    followUps: ["Add exponential backoff.", "Turn it into a decorator with a `times` argument."],
  }),

  // ───────── Standard library for OAs ─────────
  P({
    id: "py-cs-ksmall", cat: "py/stdlib", title: "k smallest values with a heap", difficulty: "Easy", targetMin: 5, tags: ["heapq"],
    statement: "Write `k_smallest(nums, k)` that returns the `k` smallest values in ascending order. Use `heapq`.",
    starter: "import heapq\n\ndef k_smallest(nums, k):\n    pass\n",
    solution: "import heapq\n\ndef k_smallest(nums, k):\n    return heapq.nsmallest(k, nums)\n",
    tests: [
      ["Basic", "k_smallest([5, 1, 9, 3, 7], 3)", "[1, 3, 5]"],
      ["Duplicates", "k_smallest([2, 2, 1], 2)", "[1, 2]"],
      ["Hidden: k larger than the list", "k_smallest([4, 3], 5)", "[3, 4]", true],
    ],
    why: "Top-k with a heap is O(n log k); interviewers check you know heapq is a min-heap.",
    traps: ["Sorting everything: fine here, but O(n log n).", "Expecting heapq to be a max-heap."],
    followUps: ["k largest from a stream that never ends.", "How do you simulate a max-heap? (push negatives)"],
  }),
  P({
    id: "py-cs-countless", cat: "py/stdlib", title: "Count values below each query", difficulty: "Medium", targetMin: 8, tags: ["bisect", "sorting"],
    statement: "Write `count_less(nums, queries)` that returns, for each query `q`, how many values in `nums` are strictly less than `q`. `nums` is not sorted. Aim for O((n + q) log n).",
    starter: "from bisect import bisect_left\n\ndef count_less(nums, queries):\n    pass\n",
    solution: "from bisect import bisect_left\n\ndef count_less(nums, queries):\n    s = sorted(nums)\n    return [bisect_left(s, q) for q in queries]\n",
    tests: [
      ["Mixed queries", "count_less([5, 1, 3, 3, 9], [3, 4, 10, 0])", "[1, 3, 5, 0]"],
      ["Hidden: empty nums", "count_less([], [1, 2])", "[0, 0]", true],
    ],
    why: "Sort once, binary-search many times: the pattern behind many OA range and ranking questions.",
    traps: ["bisect_right counts values ≤ q, not < q.", "A loop over nums per query: O(n × q)."],
    followUps: ["Count values in a range [lo, hi).", "What changes if nums keeps growing?"],
  }),
  P({
    id: "py-cs-runs", cat: "py/stdlib", title: "Consecutive runs with itertools.groupby", difficulty: "Easy", targetMin: 4, tags: ["itertools.groupby"],
    statement: "Write `runs(s)` that returns a list of `(char, count)` tuples, one per run of identical consecutive characters. Use `itertools.groupby`.",
    starter: "from itertools import groupby\n\ndef runs(s):\n    pass\n",
    solution: "from itertools import groupby\n\ndef runs(s):\n    return [(k, sum(1 for _ in g)) for k, g in groupby(s)]\n",
    tests: [
      ["Mixed", "runs('aaabccaa')", "[('a', 3), ('b', 1), ('c', 2), ('a', 2)]"],
      ["Hidden: empty", "runs('')", "[]", true],
    ],
    why: "groupby groups consecutive equal items only, which is exactly run detection.",
    traps: ["Expecting groupby to merge all a's: it does not unless the data is sorted.", "Calling len() on the group iterator."],
    followUps: ["Use groupby to group log lines by date after sorting them."],
  }),
];
