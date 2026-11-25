/**
 * v2 Python, part D: Iterators, generators and files · Plotting. Fixed ids (py2-*); answers
 * recomputed in Pyodide.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("python");
const IT = "Iterators, generators and files";
const PL = "Plotting";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  classes: src("Python tutorial: classes (iterators and generators)", "https://docs.python.org/3/tutorial/classes.html"),
  types: src("Python docs: built-in types (iterator types, generators)", "https://docs.python.org/3/library/stdtypes.html"),
  itertools: src("Python docs: itertools", "https://docs.python.org/3/library/itertools.html"),
  io: src("Python tutorial: reading and writing files, json", "https://docs.python.org/3/tutorial/inputoutput.html"),
  csv: src("Python docs: csv", "https://docs.python.org/3/library/csv.html"),
  mpl: src("Matplotlib: quick start guide (Figure, Axes, OO vs pyplot style)", "https://matplotlib.org/stable/users/explain/quick_start.html"),
  sns: src("seaborn: an introduction", "https://seaborn.pydata.org/tutorial/introduction.html"),
  pdviz: src("pandas user guide: chart visualization", "https://pandas.pydata.org/docs/user_guide/visualization.html"),
};
const MPL = "import matplotlib\nmatplotlib.use('Agg')\nimport matplotlib.pyplot as plt\n";

// ───────────────────────── Iterators ─────────────────────────

L("py2-iterators", IT, "Iterables and iterators", "The iteration protocol behind every for loop: iter(), next(), StopIteration and one-pass objects.", {
  kind: "concept", mins: 15, mathsLabel: "Code",
  hook: "Why can you loop over a list twice but a file object, a zip or a map only once?",
  intuition: `
**The situation.** Bugs like "my second loop prints nothing" come from not knowing the difference between an iterable and an iterator.

**The idea.** An **iterable** is anything you can loop over: it can produce a fresh iterator with \`iter(x)\` (lists, strings, dicts, ranges, sets). An **iterator** is the cursor itself: \`next(it)\` returns the next item and raises \`StopIteration\` at the end. A \`for\` loop is just: get an iterator, call \`next\` until StopIteration.

Containers hand out a new iterator each time, so you can loop again. Objects like \`zip\`, \`map\`, \`filter\`, \`enumerate\`, generators and open files **are** iterators: once consumed, they're empty.
`,
  maths: `
**In one breath.** iterable → \`iter()\` → iterator → \`next()\` until StopIteration; iterators are single-pass; implement \`__iter__\` and \`__next__\` (or just write a generator).

\`\`\`python
nums = [10, 20, 30]
it = iter(nums)
print(next(it), next(it))     # 10 20
print(list(it))               # [30]  (remaining items)
print(next(it, "done"))       # done  (default instead of StopIteration)

z = zip("ab", [1, 2])
print(list(z), list(z))       # [('a', 1), ('b', 2)] []

class Countdown:
    def __init__(self, n): self.n = n
    def __iter__(self): return self
    def __next__(self):
        if self.n <= 0:
            raise StopIteration
        self.n -= 1
        return self.n + 1
print(list(Countdown(3)))     # [3, 2, 1]

# what a for loop does
it = iter("hi")
while True:
    try:
        ch = next(it)
    except StopIteration:
        break
    print(ch)
\`\`\`

**Laziness.** Iterators produce values on demand, so \`range(10**9)\`, \`map\` and generators use constant memory.
`,
  practice: `
**Rules of thumb.** If you need to traverse twice, materialise with \`list(...)\` or recreate the iterator. Use \`next(iter(d))\` to peek at the first key of a dict. Use \`next(gen, default)\` to avoid StopIteration when searching: \`next((x for x in a if x > 5), None)\`.
`,
  traps: [
    { trap: "A zip/map object can be reused like a list.", why: "They're iterators; after one pass they're exhausted and yield nothing." },
    { trap: "`range` is an iterator.", why: "range is a lazy iterable (sequence): you can loop over it many times, index it and use len()." },
  ],
  say: {
    prompt: "What's the difference between an iterable and an iterator in Python?",
    secs: 30,
    check: ["Iterable: can produce an iterator via iter()/__iter__", "Iterator: __next__ returns items, raises StopIteration; __iter__ returns itself", "for loop calls iter then next", "Iterators are single-pass (zip, map, files, generators)", "Laziness saves memory"],
    followups: [
      { q: "How do you get the first item matching a condition, or None?", a: "`next((x for x in items if cond(x)), None)`." },
      { q: "Is a list an iterator?", a: "No; it's an iterable. `iter(lst)` returns a list_iterator; `next(lst)` raises TypeError." },
      { q: "Why is a file object an iterator?", a: "It yields lines lazily from the current position, so iterating twice without seek(0) gives nothing the second time." },
    ],
    answer: `An iterable is anything I can loop over because it can hand out an iterator, like a list, string or dict. An iterator is the cursor: next() returns the next item and raises StopIteration when it's done, and its __iter__ returns itself. A for loop just calls iter() once and next() repeatedly. Containers give a fresh iterator each time, so they can be looped many times, while zip, map, generators and file objects are themselves iterators and are exhausted after one pass.`,
    avoid: ["\u201cLists are iterators\u201d"],
  },
  terms: [["Iterable", "Object with __iter__ returning an iterator."], ["Iterator", "Object with __next__; single pass."], ["StopIteration", "Signals the iterator is exhausted."]],
  sources: [S.classes, S.types],
});
Q({ id: "py2-iter-1", d: 1, secs: 30, prompt: "```python\nit = iter([1, 2, 3, 4])\nnext(it)\nprint(sum(it))\n```\nWhat is printed?", answer: 9, tol: 0.5, explain: "The first item was consumed: 2 + 3 + 4.", py: "it = iter([1, 2, 3, 4])\nnext(it)\nanswer = sum(it)" });
Q({ id: "py2-iter-2", d: 1, secs: 30, prompt: "```python\nz = zip('abc', range(3))\na = len(list(z))\nb = len(list(z))\nprint(a * 10 + b)\n```\nWhat is printed?", answer: 30, tol: 0.5, explain: "First pass 3 items, second pass 0.", py: "z = zip('abc', range(3))\na = len(list(z))\nb = len(list(z))\nanswer = a * 10 + b" });
Q({ id: "py2-iter-3", d: 1, secs: 30, prompt: "What is `next((x for x in [3, 8, 2, 9] if x > 5), -1)`?", answer: 8, tol: 0.5, explain: "First value greater than 5.", py: "answer = next((x for x in [3, 8, 2, 9] if x > 5), -1)" });
Q({ id: "py2-iter-4", d: 2, secs: 30, prompt: "```python\nr = range(5)\nprint(sum(r) + sum(r))\n```\nWhat is printed?", answer: 20, tol: 0.5, explain: "range is a re-iterable sequence, not an iterator: 10 + 10.", py: "r = range(5)\nanswer = sum(r) + sum(r)" });
C("py2-iter-c1", "Iterable vs iterator", "Iterable gives iter(); iterator gives next() and is single-pass.");
C("py2-iter-c2", "First match or default", "next((x for x in xs if cond(x)), None)");

// ───────────────────────── Generators ─────────────────────────

L("py2-generators", IT, "Generators and lazy pipelines", "yield, generator functions, yield from, and processing big data in constant memory.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "A 20 GB log file and 8 GB of RAM. How do you count error lines per hour without loading the file?",
  intuition: `
**The situation.** Data too big for memory, or infinite streams (sensor feeds, paginated APIs), need lazy processing.

**The idea.** A function containing \`yield\` is a **generator function**. Calling it doesn't run the body; it returns a generator (an iterator). Each \`next()\` runs until the next \`yield\`, hands out a value and **pauses**, keeping its local variables. When the function returns, iteration stops.

Chain generators into a **pipeline**: read lines → filter → parse → aggregate. Only one item flows through at a time, so memory stays constant however big the input.
`,
  maths: `
**In one breath.** \`yield\` pauses and resumes; generators are lazy single-pass iterators; \`yield from\` delegates; pipelines of generators use O(1) memory.

\`\`\`python
def read_lines(path):
    with open(path) as f:
        for line in f:                 # files are lazy too
            yield line.rstrip("\\n")

def errors(lines):
    for ln in lines:
        if " ERROR " in ln:
            yield ln

def hours(lines):
    for ln in lines:
        yield ln[11:13]                # 'YYYY-MM-DD HH:...'

# from collections import Counter
# per_hour = Counter(hours(errors(read_lines("app.log"))))

def countdown(n):
    while n > 0:
        yield n
        n -= 1
g = countdown(3)
print(next(g), list(g))                # 3 [2, 1]

def fib():
    a, b = 0, 1
    while True:                        # infinite, but lazy
        yield a
        a, b = b, a + b
from itertools import islice
print(list(islice(fib(), 8)))          # [0, 1, 1, 2, 3, 5, 8, 13]

def flatten(nested):
    for x in nested:
        if isinstance(x, list):
            yield from flatten(x)      # delegate to a sub-generator
        else:
            yield x
print(list(flatten([1, [2, [3, 4]], 5])))   # [1, 2, 3, 4, 5]

def chunks(it, k):
    batch = []
    for x in it:
        batch.append(x)
        if len(batch) == k:
            yield batch; batch = []
    if batch:
        yield batch
print(list(chunks(range(7), 3)))       # [[0, 1, 2], [3, 4, 5], [6]]
\`\`\`

**Generator vs list.** A list holds all n items (O(n) memory) and can be reused; a generator holds its state (O(1)) and is single-use.
`,
  practice: `
**Use generators for** big files (line by line), batching rows for a database or API, infinite sequences, and composing transformations. pandas has the same idea with \`pd.read_csv(path, chunksize=100_000)\`, which yields DataFrames.

**Debugging tip.** Nothing runs until you iterate: a generator pipeline with a bug appears to "do nothing" until consumed.
`,
  traps: [
    { trap: "Calling a generator function runs it.", why: "It only creates the generator object; the body runs as you iterate." },
    { trap: "`return value` inside a generator yields the value.", why: "return ends iteration (the value goes into StopIteration.value); only yield produces items." },
  ],
  say: {
    prompt: "What are generators and why would you use them in data processing?",
    secs: 45,
    check: ["Function with yield returns a lazy iterator", "Pauses and resumes keeping local state", "Constant memory; works for huge/infinite streams", "Pipelines of generators (read → filter → transform)", "Single-pass; yield from; pandas chunksize analogue"],
    followups: [
      { q: "Generator expression vs generator function?", a: "Same laziness; the expression is a one-liner `(f(x) for x in xs)`, the function handles multi-step logic, state and several yields." },
      { q: "What does `yield from sub()` do?", a: "Yields every item of the sub-iterator (and passes through send/throw), replacing a for-loop of yields." },
      { q: "How would you read a 20 GB CSV in pandas?", a: "`pd.read_csv(path, chunksize=n)` to process chunks and combine partial aggregates; or select columns/dtypes to shrink memory; or a tool like DuckDB/Polars." },
    ],
    answer: `A generator is a function that uses yield. Calling it returns an iterator; each next() runs the body until the next yield, hands out the value and pauses with its local state intact. Because values are produced one at a time, memory stays constant, which is exactly what I need for a file bigger than RAM or an endless stream. I'd chain small generators into a pipeline, reading lines, filtering error lines, extracting the hour, and feed the result into a Counter. The catch is they're single-pass and lazy, so nothing happens until something consumes them.`,
    avoid: ["\u201cGenerators are faster lists\u201d"],
  },
  terms: [["Generator function", "Function with yield; returns a generator."], ["yield from", "Delegate iteration to a sub-iterator."], ["Lazy evaluation", "Compute values only when requested."]],
  sources: [S.classes, S.types],
});
Q({ id: "py2-gen-1", d: 1, secs: 30, prompt: "```python\ndef g():\n    yield 1\n    yield 2\n    return 3\nprint(sum(g()))\n```\nWhat is printed?", answer: 3, tol: 0.5, explain: "Only yielded values are produced: 1 + 2. The return value ends iteration.", py: "def g():\n    yield 1\n    yield 2\n    return 3\nanswer = sum(g())" });
Q({ id: "py2-gen-2", d: 2, secs: 45, prompt: "```python\nlog = []\ndef gen():\n    log.append('start')\n    yield 1\nx = gen()\nprint(len(log))\n```\nWhat is printed?", answer: 0, tol: 0.5, explain: "Creating the generator doesn't run its body.", py: "log = []\ndef gen():\n    log.append('start')\n    yield 1\nx = gen()\nanswer = len(log)" });
Q({ id: "py2-gen-3", d: 1, secs: 30, prompt: "Using the infinite `fib()` generator (0, 1, 1, 2, …), what is `sum(islice(fib(), 10))`?", answer: 88, tol: 0.5, explain: "0+1+1+2+3+5+8+13+21+34 = 88.", py: "from itertools import islice\ndef fib():\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b\nanswer = sum(islice(fib(), 10))" });
Q({ id: "py2-gen-4", d: 2, secs: 45, prompt: "How many batches does `chunks(range(10), 4)` yield (batches of 4, remainder as a final batch)?", answer: 3, tol: 0.5, explain: "[0-3], [4-7], [8, 9].", py: "def chunks(it, k):\n    b = []\n    for x in it:\n        b.append(x)\n        if len(b) == k:\n            yield b; b = []\n    if b:\n        yield b\nanswer = len(list(chunks(range(10), 4)))" });
C("py2-gen-c1", "Generator", "def with yield → lazy, pausable, single-pass iterator.");
C("py2-gen-c2", "Big data in pandas", "pd.read_csv(path, chunksize=n) yields DataFrames.");

// ───────────────────────── itertools ─────────────────────────

L("py2-itertools", IT, "itertools for combinatorics and grouping", "product, permutations, combinations, accumulate, chain, groupby and islice.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "List every pair of products to test as a bundle, or every 3-person team from 8 candidates, without nested loops.",
  intuition: `
**The situation.** Brute-force search over pairs/teams/orderings, running totals, run-length grouping: \`itertools\` has a tested, fast building block for each.

**The idea.** Each function returns a lazy iterator:

- **Combinatorics:** \`product\` (Cartesian product, nested loops), \`permutations\` (ordered), \`combinations\` (unordered, no repeats), \`combinations_with_replacement\`.
- **Accumulating and chaining:** \`accumulate\` (running totals or running max), \`chain\` (concatenate iterables), \`islice\` (slice any iterator), \`pairwise\` (neighbours, 3.10+).
- **Grouping:** \`groupby\` groups **consecutive** equal keys: sort first if you want all equal keys together.
`,
  maths: `
**In one breath.** Counts: product nᵏ, permutations n!/(n−k)!, combinations n!/(k!(n−k)!); groupby needs sorted input; everything is lazy.

\`\`\`python
from itertools import product, permutations, combinations, accumulate, chain, groupby, islice, pairwise
import math, operator
print(list(product("AB", repeat=2)))      # [('A','A'), ('A','B'), ('B','A'), ('B','B')]
print(len(list(permutations(range(4), 2))))   # 12
print(len(list(combinations(range(8), 3))))   # 56 == math.comb(8, 3)
print(list(accumulate([3, 1, 4, 1, 5])))       # [3, 4, 8, 9, 14]
print(list(accumulate([3, 1, 4, 1, 5], max)))  # [3, 3, 4, 4, 5]
print(list(chain([1, 2], (3,), "ab")))         # [1, 2, 3, 'a', 'b']
print([(k, len(list(g))) for k, g in groupby("aaabccdddd")])
# [('a', 3), ('b', 1), ('c', 2), ('d', 4)]  run-length encoding
words = ["apple", "bat", "avocado", "bus"]
for k, g in groupby(sorted(words), key=lambda w: w[0]):
    print(k, list(g))                          # a [...], b [...]
print(list(pairwise([1, 4, 9])))               # [(1, 4), (4, 9)]
print(list(islice(range(100), 5, 20, 5)))      # [5, 10, 15]
print(math.comb(10, 2), math.perm(5, 2))       # 45 20
\`\`\`

**Brute force with care.** combinations(n, k) explodes fast: C(50, 5) ≈ 2.1 million. State the count before you enumerate.
`,
  practice: `
**Uses.** Subset/pair brute force for small n, generating test grids (\`product\` of parameter lists, like a grid search), running totals/maxima, run-length encoding, flattening one level (\`chain.from_iterable\`).

**pandas link.** groupby in itertools is about consecutive runs; pandas \`groupby\` groups all equal keys regardless of order.
`,
  traps: [
    { trap: "`itertools.groupby` groups all equal keys like SQL GROUP BY.", why: "It only groups consecutive equal keys; unsorted input gives repeated groups. Sort by the same key first." },
    { trap: "permutations and combinations give the same count.", why: "Permutations count order (n!/(n−k)!), combinations don't (n!/(k!(n−k)!)): P(4,2) = 12 vs C(4,2) = 6." },
  ],
  say: {
    prompt: "Which itertools functions do you use most, and what's the gotcha with groupby?",
    secs: 30,
    check: ["product / permutations / combinations with counts", "accumulate for running totals/max", "chain / islice / pairwise", "groupby groups consecutive runs only; sort first", "Lazy iterators; watch combinatorial explosion"],
    followups: [
      { q: "How many 3-person teams from 8 candidates?", a: "C(8, 3) = 56." },
      { q: "How do you flatten a list of lists with itertools?", a: "`list(chain.from_iterable(lists))`." },
      { q: "How would you get all subsets of a set?", a: "chain.from_iterable(combinations(s, r) for r in range(len(s) + 1)): 2ⁿ subsets." },
    ],
    answer: `For brute-force search I use product for every combination of choices, permutations when order matters and combinations when it doesn't, and I state the count first because they grow fast. accumulate gives running totals or running max, chain concatenates iterables, islice slices any iterator and pairwise gives neighbouring pairs. The gotcha with groupby is that it only groups consecutive equal keys, which makes it perfect for run-length encoding but means I must sort by the key first if I want SQL-style grouping.`,
    avoid: ["Using groupby on unsorted data for totals"],
  },
  terms: [["Cartesian product", "All tuples choosing one item from each input."], ["Combination", "Unordered selection without repetition."], ["Run-length encoding", "Replace runs with (value, count)."]],
  sources: [S.itertools],
});
Q({ id: "py2-itt-1", d: 1, secs: 30, prompt: "What is `len(list(combinations(range(8), 3)))`?", answer: 56, tol: 0.5, explain: "C(8, 3) = 56.", py: "from itertools import combinations\nanswer = len(list(combinations(range(8), 3)))" });
Q({ id: "py2-itt-2", d: 1, secs: 30, prompt: "What is `len(list(product('abc', repeat=2)))`?", answer: 9, tol: 0.5, explain: "3² = 9.", py: "from itertools import product\nanswer = len(list(product('abc', repeat=2)))" });
Q({ id: "py2-itt-3", d: 2, secs: 45, prompt: "How many groups does `groupby('aabbaac')` produce (no sorting)?", answer: 4, tol: 0.5, explain: "Runs: aa, bb, aa, c. Groups are consecutive runs.", py: "from itertools import groupby\nanswer = len([k for k, _ in groupby('aabbaac')])" });
Q({ id: "py2-itt-4", d: 1, secs: 30, prompt: "What is the last element of `list(accumulate([3, 1, 4, 1, 5], max))`?", answer: 5, tol: 0.5, explain: "Running max: 3, 3, 4, 4, 5.", py: "from itertools import accumulate\nanswer = list(accumulate([3, 1, 4, 1, 5], max))[-1]" });
Q({ id: "py2-itt-5", d: 2, secs: 45, prompt: "How many ordered 2-element arrangements does `permutations(range(5), 2)` produce?", answer: 20, tol: 0.5, explain: "5 × 4 = 20.", py: "from itertools import permutations\nanswer = len(list(permutations(range(5), 2)))" });
C("py2-itt-c1", "Counting", "product nᵏ · permutations n!/(n−k)! · combinations n!/(k!(n−k)!)");
C("py2-itt-c2", "itertools.groupby", "Groups consecutive equal keys only; sort first.");

// ───────────────────────── Files, CSV, JSON ─────────────────────────

L("py2-files", IT, "Files, CSV and JSON", "with open, reading line by line, the csv module, json load/dump and pathlib.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "An OA gives input on stdin or in a file. How do you read it fast and safely, and parse a CSV whose fields contain commas?",
  intuition: `
**The situation.** Reading inputs, exporting results and quick ETL scripts all need file handling; take-home assignments often start with a CSV or JSON file.

**The idea.** \`open(path, mode)\` returns a file object; \`with\` closes it automatically, even on errors. Text mode (default) decodes to \`str\` (use \`encoding="utf-8"\`); binary mode (\`"rb"\`) gives \`bytes\`. Files are iterators over lines, so \`for line in f\` streams a file of any size.

For structured formats use the libraries: \`csv\` handles quoting ("Mumbai, MH" in one field), \`json\` maps JSON objects/arrays to dicts/lists. pandas (\`read_csv\`, \`read_json\`) is the choice when the data is tabular and fits in memory.
`,
  maths: `
**In one breath.** \`with open(p, "r", encoding="utf-8") as f\`; iterate lines; modes r/w/a/rb; csv.reader/DictReader with \`newline=""\`; json.load/dump; pathlib for paths.

\`\`\`python
import csv, json, io
from pathlib import Path

with open("out.txt", "w", encoding="utf-8") as f:
    f.write("line one\\nline two\\n")
with open("out.txt", encoding="utf-8") as f:
    lines = [ln.rstrip("\\n") for ln in f]      # streamed line by line
print(lines)                                     # ['line one', 'line two']

data = 'city,amount\\n"Mumbai, MH",1200\\nPune,450\\n'
rows = list(csv.DictReader(io.StringIO(data)))
print(rows[0]["city"], sum(int(r["amount"]) for r in rows))   # Mumbai, MH 1650
print("Mumbai, MH,1200".split(","))              # ['Mumbai', ' MH', '1200']  wrong!

with open("rows.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["id", "name"]); w.writerows([[1, "asha"], [2, "ravi"]])

cfg = {"model": "xgb", "params": {"depth": 4}, "features": ["a", "b"]}
s = json.dumps(cfg, indent=2)                    # dict -> JSON text
back = json.loads(s)                             # JSON text -> dict
print(back["params"]["depth"])                   # 4

p = Path("data") / "raw" / "file.csv"            # OS-independent paths
print(p.suffix, p.stem, p.parent)                # .csv file data/raw
\`\`\`

**Fast stdin in OAs.** \`import sys; data = sys.stdin.read().split()\` then convert tokens; much faster than many \`input()\` calls for large inputs.

**Modes.** \`"w"\` truncates, \`"a"\` appends, \`"x"\` fails if the file exists, \`"r+"\` read/write.
`,
  practice: `
**Checklist.** Always \`with\`; specify encoding; stream large files; use csv/json/pandas instead of manual \`split(",")\`; write JSON with \`indent=2\` for readability; never \`eval\` file contents; don't unpickle untrusted data.

**When to switch to pandas.** Tabular data you'll filter/group/join → \`pd.read_csv(..., usecols=..., dtype=...)\`.
`,
  traps: [
    { trap: "`line.split(',')` parses CSV correctly.", why: "Quoted fields can contain commas and newlines. Use the csv module or pandas." },
    { trap: "Opening in 'w' mode adds to the file.", why: "'w' truncates existing content; use 'a' to append." },
    { trap: "`f.readlines()` is the way to read a big file.", why: "It loads every line into memory. Iterate over the file object instead." },
  ],
  say: {
    prompt: "How do you read and write files safely in Python, including CSV and JSON?",
    secs: 45,
    check: ["with open(...) context manager closes files", "Encoding and text vs binary modes; w vs a", "Iterate line by line for big files", "csv module for quoting / DictReader; json.load/dump", "pandas for tabular data; pathlib for paths"],
    followups: [
      { q: "Why pass `newline=''` when opening CSV files?", a: "So the csv module controls line endings itself; otherwise quoted newlines may be misread and extra blank lines appear on Windows." },
      { q: "json.load vs json.loads?", a: "load reads from a file object; loads parses a string. Same for dump/dumps." },
      { q: "How do you read large input quickly in an OA?", a: "sys.stdin.read().split() (or sys.stdin.buffer) once, then parse tokens, instead of calling input() per line." },
    ],
    answer: `I always open files with a with block so they're closed even if something fails, pass encoding="utf-8", and remember that "w" truncates while "a" appends. For big files I iterate over the file object line by line instead of read() or readlines(), so memory stays flat. For CSV I use the csv module, usually DictReader, because quoted fields can contain commas, and I open with newline="". JSON goes through json.load and json.dump, which map to dicts and lists. If the data is tabular and I'm going to analyse it, I go straight to pandas.read_csv.`,
    avoid: ["Manual split(',') for CSV", "Forgetting to close files"],
  },
  terms: [["Context manager", "Object used with `with` that guarantees cleanup."], ["DictReader", "csv reader that yields dicts keyed by header."], ["Serialisation", "Turning objects into text/bytes (json.dumps)."]],
  sources: [S.io, S.csv],
});
Q({ id: "py2-file-1", d: 1, secs: 45, prompt: "```python\nimport csv, io\ndata = 'city,amt\\n\"Mumbai, MH\",1200\\nPune,450\\n'\nrows = list(csv.reader(io.StringIO(data)))\nprint(len(rows[1]))\n```\nWhat is printed?", answer: 2, tol: 0.5, explain: "The quoted field stays one value: ['Mumbai, MH', '1200'].", py: "import csv, io\ndata = 'city,amt\\n\"Mumbai, MH\",1200\\nPune,450\\n'\nrows = list(csv.reader(io.StringIO(data)))\nanswer = len(rows[1])" });
Q({ id: "py2-file-2", d: 1, secs: 30, prompt: "What is `len('\"Mumbai, MH\",1200'.split(','))`?", answer: 3, tol: 0.5, explain: "Naive split breaks the quoted field: 3 pieces.", py: "answer = len('\"Mumbai, MH\",1200'.split(','))" });
Q({ id: "py2-file-3", d: 2, secs: 45, prompt: "```python\nimport json\ns = json.dumps({'a': [1, 2, {'b': 3}], 'c': None})\nd = json.loads(s)\nprint(d['a'][2]['b'] + (d['c'] is None))\n```\nWhat is printed?", answer: 4, tol: 0.5, explain: "3 + True (JSON null round-trips to None).", py: "import json\ns = json.dumps({'a': [1, 2, {'b': 3}], 'c': None})\nd = json.loads(s)\nanswer = d['a'][2]['b'] + (d['c'] is None)" });
Q({ id: "py2-file-4", d: 2, secs: 45, prompt: "```python\nwith open('t.txt', 'w') as f:\n    f.write('a\\nb\\n')\nwith open('t.txt', 'a') as f:\n    f.write('c\\n')\nwith open('t.txt', 'w') as f:\n    f.write('d\\n')\nwith open('t.txt') as f:\n    print(sum(1 for _ in f))\n```\nWhat is printed?", answer: 1, tol: 0.5, explain: "The last 'w' truncated the file to one line.", py: "with open('t.txt', 'w') as f:\n    f.write('a\\nb\\n')\nwith open('t.txt', 'a') as f:\n    f.write('c\\n')\nwith open('t.txt', 'w') as f:\n    f.write('d\\n')\nwith open('t.txt') as f:\n    answer = sum(1 for _ in f)" });
C("py2-file-c1", "Safe file reading", "with open(p, encoding='utf-8') as f: for line in f: ...");
C("py2-file-c2", "CSV parsing", "csv.reader / DictReader (newline=''), not split(',').");

L("py2-iter-practice", IT, "Iterators, generators and files practice", "Interview questions on lazy processing and file handling.", {
  kind: "interview", mins: 25, prereq: ["py2-generators", "py2-files"],
  hook: "Explain each approach out loud, including memory use.",
}, [
  iq("Find the 10 most common IP addresses in a 50 GB access log.", "Stream the file line by line (generator), extract the IP with split or a compiled regex, count with a Counter (memory proportional to distinct IPs), then most_common(10). If distinct IPs don't fit in memory, hash-partition into files and count each, or use a database/DuckDB.", ["Stream, don't load", "Counter on distinct keys", "most_common", "Fallback when keys don't fit"]),
  iq("Write a generator that yields sliding windows of size k over any iterable.", "Use a deque(maxlen=k): append each item and yield tuple(window) once its length is k. Works on iterators, O(k) memory. itertools has pairwise for k = 2; Python recipes have sliding_window.", ["deque(maxlen=k)", "Yield only when full", "Works on iterators", "Memory O(k)"]),
  iq("Why does iterating over a file twice produce nothing the second time, and how do you fix it?", "The file object is an iterator positioned at the end after the first pass. Call f.seek(0), reopen the file, or read lines into a list if they fit.", ["File is an iterator", "seek(0) / reopen", "Materialise only if small"]),
  iq("Generate all subsets of a list of 4 items. How many are there, and how do you produce them?", "2⁴ = 16. chain.from_iterable(combinations(items, r) for r in range(5)), or iterate a bitmask from 0 to 2ⁿ − 1 picking items whose bit is set, or recursion/backtracking.", ["2ⁿ count", "combinations over all r", "Bitmask alternative", "Complexity O(n·2ⁿ)"]),
  iq("Load a 5 GB CSV for aggregation on a laptop with 8 GB RAM.", "Read only needed columns (usecols) with compact dtypes (category, int32, float32), process in chunks with chunksize and combine partial aggregates (sums/counts), or use DuckDB/Polars which stream from disk. Convert to Parquet for repeated use.", ["usecols + dtypes", "chunksize with combinable aggregates", "Streaming engines (DuckDB/Polars)", "Parquet for reuse"]),
]);

// ───────────────────────── Plotting: matplotlib basics ─────────────────────────

L("py2-mpl", PL, "Matplotlib: figures, axes and the OO API", "fig, ax = plt.subplots(), labels, legends, multiple panels and saving figures.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "Your notebook has four charts drawn on top of each other. What's the difference between `plt.plot` and `ax.plot`, and how do you lay out a 2×2 grid?",
  intuition: `
**The situation.** Take-home assignments and case rounds are judged partly on clean charts: labelled axes, sensible scales, no clutter.

**The idea.** A **Figure** is the canvas; it contains one or more **Axes** (individual plots, each with an x and y axis). There are two styles:

- **pyplot style** (\`plt.plot\`, \`plt.title\`) acts on an implicit "current" axes. Quick, but confusing with several panels.
- **Object-oriented style**: \`fig, ax = plt.subplots()\` then call methods on \`ax\` (\`ax.plot\`, \`ax.set_title\`). Explicit and the recommended default.

\`plt.subplots(nrows, ncols)\` returns a figure and a NumPy array of Axes, so \`axes[0, 1]\` is the top-right panel.
`,
  maths: `
**In one breath.** \`fig, ax = plt.subplots(figsize=(w, h))\`; \`ax.plot/scatter/bar/hist\`; \`ax.set(title=..., xlabel=..., ylabel=...)\`; \`ax.legend()\`; \`fig.tight_layout()\`; \`fig.savefig("x.png", dpi=150)\`.

\`\`\`python
import matplotlib.pyplot as plt
import numpy as np
x = np.linspace(0, 10, 100)

fig, ax = plt.subplots(figsize=(6, 3.5))
ax.plot(x, np.sin(x), label="sin")
ax.plot(x, np.cos(x), label="cos", linestyle="--")
ax.set(title="Two waves", xlabel="x", ylabel="value")
ax.legend()
fig.savefig("waves.png", dpi=150, bbox_inches="tight")

fig, axes = plt.subplots(2, 2, figsize=(8, 6))
print(axes.shape)                     # (2, 2)
axes[0, 0].hist(np.random.default_rng(0).normal(size=500), bins=30)
axes[0, 1].scatter(x, x ** 2, s=5)
axes[1, 0].bar(["A", "B", "C"], [5, 3, 7])
axes[1, 1].plot(x, np.log1p(x))
axes[1, 1].set_yscale("log")
fig.suptitle("Dashboard")
fig.tight_layout()                    # stop labels overlapping
plt.close(fig)                        # free memory in loops/scripts

fig, (a1, a2) = plt.subplots(1, 2, sharey=True)   # unpack a row of axes
\`\`\`

**Anatomy.** Figure → Axes → Axis (ticks, labels) → Artists (lines, patches, text). Everything you see is an Artist you can style.
`,
  practice: `
**Chart hygiene checklist.** Title that states the finding; labelled axes with units; legend only if several series; consistent colours; start bar charts at zero; rotate long tick labels (\`ax.tick_params(axis="x", rotation=45)\`); \`tight_layout\`; save at a readable dpi.

**In notebooks.** Use the OO style even for single plots, so code scales to multi-panel figures without rewrites.
`,
  traps: [
    { trap: "`plt.title()` titles the subplot I just created with `fig, axes = plt.subplots(2, 2)`.", why: "pyplot acts on the 'current' Axes (usually the last one). Use `axes[i, j].set_title(...)`." },
    { trap: "`plt.subplots(1, 3)` returns a 2-D array of axes.", why: "With one row or column it returns a 1-D array (squeeze=True); index `axes[2]`, not `axes[0, 2]`." },
  ],
  say: {
    prompt: "Explain matplotlib's Figure and Axes, and why you'd use the object-oriented style.",
    secs: 30,
    check: ["Figure = canvas, Axes = individual plot", "plt.subplots returns fig and axes array", "OO methods on ax vs implicit current axes in pyplot", "Labels, legend, tight_layout, savefig", "Shape of axes array (1-D for a single row)"],
    followups: [
      { q: "How do you share the y-axis across subplots?", a: "`plt.subplots(1, 2, sharey=True)`." },
      { q: "How do you add a second y-axis?", a: "`ax2 = ax.twinx()` and plot the second series on ax2 (use sparingly; dual axes mislead easily)." },
      { q: "Why call plt.close(fig) in a loop that makes many charts?", a: "Figures stay in memory until closed; hundreds of open figures waste memory and trigger warnings." },
    ],
    answer: `A Figure is the whole canvas and an Axes is one plot inside it with its own x and y axis. I create them explicitly with \`fig, ax = plt.subplots()\` or a grid with \`plt.subplots(2, 2)\`, which returns an array of Axes, and then call methods on the specific Axes: plot, set_title, set_xlabel, legend. That object-oriented style avoids pyplot's hidden "current axes", which gets confusing as soon as there are several panels. I finish with tight_layout and savefig.`,
    avoid: ["Mixing plt.* calls with multiple subplots"],
  },
  terms: [["Figure", "Top-level container (canvas)."], ["Axes", "One plotting area with x/y axes."], ["Artist", "Any drawn element (line, text, patch)."]],
  sources: [S.mpl],
});
Q({ id: "py2-mpl-1", d: 1, secs: 30, prompt: "What is `len(plt.subplots(2, 3)[1].flatten())`?", answer: 6, tol: 0.5, explain: "A 2×3 grid of Axes.", py: MPL + "fig, axes = plt.subplots(2, 3)\nanswer = len(axes.flatten())", packages: ["matplotlib"] });
Q({ id: "py2-mpl-2", d: 2, secs: 45, prompt: "`fig, axes = plt.subplots(1, 3)`. What is `axes.ndim`?", answer: 1, tol: 0.5, explain: "A single row is squeezed to a 1-D array: index axes[2].", py: MPL + "fig, axes = plt.subplots(1, 3)\nanswer = axes.ndim", packages: ["matplotlib"] });
Q({ id: "py2-mpl-3", d: 1, secs: 30, prompt: "```python\nfig, ax = plt.subplots()\nax.plot([1, 2, 3], label='a')\nax.plot([3, 2, 1], label='b')\nprint(len(ax.lines))\n```\nWhat is printed?", answer: 2, tol: 0.5, explain: "Each plot call adds one Line2D to the Axes.", py: MPL + "fig, ax = plt.subplots()\nax.plot([1, 2, 3], label='a')\nax.plot([3, 2, 1], label='b')\nanswer = len(ax.lines)", packages: ["matplotlib"] });
Q({ id: "py2-mpl-4", d: 1, secs: 30, prompt: "`fig, ax = plt.subplots(figsize=(6, 4))` saved with `dpi=100`. How many pixels wide is the image (without bbox cropping)?", answer: 600, tol: 0.5, explain: "Width inches × dpi = 6 × 100.", py: MPL + "fig, ax = plt.subplots(figsize=(6, 4))\nfig.set_dpi(100)\nanswer = int(fig.get_size_inches()[0] * fig.dpi)", packages: ["matplotlib"] });
C("py2-mpl-c1", "OO matplotlib", "fig, ax = plt.subplots(); ax.plot(...); ax.set(title=, xlabel=, ylabel=); fig.savefig(...)");
C("py2-mpl-c2", "Subplot grid", "plt.subplots(r, c) → axes array; 1 row/col → 1-D array.");

// ───────────────────────── Choosing a chart ─────────────────────────

L("py2-chart-choice", PL, "Choosing the right chart", "Match the question to the chart: trends, comparisons, distributions, relationships and composition.", {
  kind: "concept", mins: 15, mathsLabel: "Code",
  hook: "Monthly revenue by region for two years. Line chart, grouped bar, stacked area, or pie? It depends on the one question the chart must answer.",
  intuition: `
**The situation.** In case rounds and take-homes you're judged on whether the chart answers the business question at a glance.

**The idea.** Pick by the **question**, not by the data:

- **Change over time** → line chart (time on x).
- **Compare categories** → bar chart (sorted; horizontal if labels are long), starting at zero.
- **Distribution of one variable** → histogram, box plot (compare groups), KDE.
- **Relationship between two numbers** → scatter (add a trend line; hexbin or alpha for many points).
- **Part of a whole** → stacked bar (few parts); pie only for 2–3 slices.
- **Two categorical dimensions** → heatmap.

Then remove everything that doesn't help: gridline clutter, 3-D effects, rainbow colours, legends that could be direct labels.
`,
  maths: `
**In one breath.** Time → line; categories → sorted bar from zero; distribution → hist/box; relationship → scatter; composition → stacked bar; matrix → heatmap.

| Question | Chart | Pitfall |
|---|---|---|
| How did X change over time? | line | too many lines: highlight one, grey the rest |
| Which category is largest? | sorted bar | truncated axis exaggerates gaps |
| How is X distributed? | histogram / box | bin width changes the story |
| Are X and Y related? | scatter | overplotting: use alpha or hexbin |
| What share does each part have? | stacked bar / 100% bar | pies with many slices |
| How does X vary across two categories? | heatmap | unlabelled colour scale |

\`\`\`python
import matplotlib.pyplot as plt
import pandas as pd
sales = pd.Series({"North": 120, "South": 340, "East": 90, "West": 210})
fig, ax = plt.subplots()
sales.sort_values().plot.barh(ax=ax, color="grey")
ax.set(title="South leads sales (₹ lakh, FY25)", xlabel="₹ lakh")
ax.bar_label(ax.containers[0])          # direct labels instead of gridlines
\`\`\`

**Log scale** for values spanning orders of magnitude (revenue by company size). **Small multiples** (one panel per group, shared axes) beat one cluttered chart.
`,
  practice: `
**State the takeaway in the title** ("Churn doubled after the price change"), not "Churn by month". Highlight the one series that matters. Annotate the event that explains a change. Use one colour per meaning consistently across slides.
`,
  traps: [
    { trap: "A pie chart is the best way to show market share.", why: "People compare angles badly; with more than 3 slices a sorted bar chart is clearer." },
    { trap: "Bar chart axes can start wherever makes the differences visible.", why: "Bar length encodes the value, so a non-zero baseline exaggerates differences. Lines can start elsewhere; bars shouldn't." },
  ],
  say: {
    prompt: "How do you decide which chart to use for a business question?",
    secs: 30,
    check: ["Start from the question the chart answers", "Time → line, categories → sorted bar, distribution → hist/box, relationship → scatter", "Composition: stacked bar; avoid pies beyond 2–3 slices", "Bars start at zero; avoid clutter/3-D", "Title states the takeaway; highlight what matters"],
    followups: [
      { q: "How do you show 50,000 points in a scatter?", a: "Transparency (alpha), smaller markers, hexbin or 2-D histogram, or sample the data." },
      { q: "When is a log scale appropriate?", a: "When values span orders of magnitude or you care about relative (percentage) changes." },
      { q: "Box plot or histogram?", a: "Histogram to see one distribution's shape; box plots to compare medians and spreads across several groups compactly." },
    ],
    answer: `I start from the one question the chart has to answer. Change over time is a line chart; comparing categories is a sorted bar chart that starts at zero; a single variable's distribution is a histogram, or box plots to compare groups; the relationship between two numbers is a scatter; composition is a stacked bar, and a pie only for two or three parts. Then I strip clutter, label directly where possible, highlight the series that matters and write the takeaway as the title.`,
    avoid: ["\u201cI'd use a pie chart\u201d for many categories", "3-D charts"],
  },
  terms: [["Small multiples", "Grid of similar charts, one per group, with shared axes."], ["Overplotting", "Too many points hiding the pattern."]],
  sources: [S.mpl, S.pdviz],
});
Q({ id: "py2-cc-1", d: 1, secs: 20, prompt: "Best default chart to show monthly active users over 24 months?", options: ["Pie", "Line", "Histogram", "Scatter"], answer: 1, explain: "Change over time → line.", py: "answer = 1" });
Q({ id: "py2-cc-2", d: 1, secs: 20, prompt: "Best default chart to compare the spread of delivery times across 6 cities?", options: ["6 pies", "Box plots side by side", "Stacked area", "Line chart"], answer: 1, explain: "Box plots compare medians and spreads across groups compactly.", py: "answer = 1" });
Q({ id: "py2-cc-3", d: 2, secs: 45, prompt: "`pd.Series({'N': 120, 'S': 340, 'E': 90, 'W': 210}).sort_values()` drawn as a horizontal bar chart: which region is the top bar (last position)? (N=1, S=2, E=3, W=4)", answer: 2, tol: 0.5, explain: "Ascending sort puts the largest last, which barh draws at the top: S.", py: "import pandas as pd\ns = pd.Series({'N': 120, 'S': 340, 'E': 90, 'W': 210}).sort_values()\nanswer = 'NSEW'.index(s.index[-1]) + 1", packages: ["pandas"] });
Q({ id: "py2-cc-4", d: 2, secs: 45, prompt: "A bar chart of 98 vs 100 uses a y-axis starting at 97. By what factor do the bars' visible heights differ?", answer: 3, tol: 0.05, explain: "Visible heights 1 and 3: a 2% difference looks like 3×, which is why bars start at zero.", py: "answer = (100 - 97) / (98 - 97)" });
C("py2-cc-c1", "Chart by question", "time→line · compare→sorted bar · distribution→hist/box · relationship→scatter · share→stacked bar");
C("py2-cc-c2", "Bars start at zero", "Bar length encodes value; truncated axes exaggerate.");

// ───────────────────────── seaborn ─────────────────────────

L("py2-seaborn", PL, "seaborn for statistical plots", "Declarative plots from DataFrames: hue, facets, distributions, categorical estimates and heatmaps.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "Plot average order value by city, split by new vs returning customers, with confidence intervals, in one line. That's what seaborn is for.",
  intuition: `
**The situation.** EDA on a tidy DataFrame: you want group comparisons, distributions and correlations quickly, with sensible defaults.

**The idea.** seaborn sits on top of matplotlib and works with **long-format DataFrames**: you name columns for \`x\`, \`y\`, \`hue\` (colour), and optionally \`col\`/\`row\` (facets), and it does the grouping, aggregation and legend for you.

Two layers of functions:

- **Axes-level** (\`scatterplot\`, \`lineplot\`, \`histplot\`, \`boxplot\`, \`barplot\`, \`heatmap\`) draw on one matplotlib Axes; pass \`ax=\` to place them.
- **Figure-level** (\`relplot\`, \`displot\`, \`catplot\`) create their own figure and support \`col=\`/\`row=\` facets.

Important default: \`barplot\` and \`lineplot\` show the **mean** per group with a confidence interval, not the sum.
`,
  maths: `
**In one breath.** \`sns.func(data=df, x=, y=, hue=, ax=)\`; figure-level \`*plot(kind=..., col=)\`; barplot = mean + CI by default; heatmap of \`df.corr()\`.

\`\`\`python
import seaborn as sns
import matplotlib.pyplot as plt
tips = sns.load_dataset("tips")              # needs internet; any long-format df works

fig, axes = plt.subplots(1, 3, figsize=(12, 3.5))
sns.histplot(data=tips, x="total_bill", hue="time", kde=True, ax=axes[0])
sns.boxplot(data=tips, x="day", y="tip", ax=axes[1])
sns.barplot(data=tips, x="day", y="tip", hue="sex", estimator="mean", errorbar=("ci", 95), ax=axes[2])

sns.relplot(data=tips, x="total_bill", y="tip", hue="smoker", col="time", kind="scatter")
sns.catplot(data=tips, x="day", y="total_bill", kind="violin", col="sex")

corr = tips.select_dtypes("number").corr()
sns.heatmap(corr, annot=True, fmt=".2f", cmap="vlag", vmin=-1, vmax=1)

wide = tips.pivot_table(index="day", columns="time", values="tip", aggfunc="mean")
long = wide.reset_index().melt(id_vars="day", value_name="avg_tip")  # back to long format
\`\`\`

**Sum instead of mean.** \`estimator="sum"\` (or pre-aggregate with pandas and plot the result). **No error bars.** \`errorbar=None\`.

**Long vs wide.** seaborn wants one row per observation; reshape wide tables with \`melt\`.
`,
  practice: `
**EDA routine.** histplot/displot for each key numeric column, boxplot by segment, scatter/relplot for pairs with hue, heatmap of correlations (annotated, diverging palette centred at 0), pairplot on a sample for many variables.

**Presentation.** seaborn returns matplotlib objects; finish with \`ax.set(...)\`, titles and \`savefig\` as usual.
`,
  traps: [
    { trap: "`sns.barplot(x='city', y='revenue')` shows total revenue per city.", why: "The default estimator is the mean, with a confidence interval. Use estimator='sum' or aggregate first." },
    { trap: "A correlation heatmap with the default sequential palette is fine.", why: "Correlations are signed; use a diverging palette centred at 0 with vmin=-1, vmax=1 so negative and positive read correctly." },
  ],
  say: {
    prompt: "When do you use seaborn instead of plain matplotlib, and what should you watch out for?",
    secs: 30,
    check: ["Built on matplotlib; works with long-format DataFrames", "hue / col / row mappings, automatic legends and facets", "Axes-level vs figure-level functions", "barplot/lineplot default to mean + CI", "Heatmaps for correlation with diverging palette"],
    followups: [
      { q: "What's the difference between sns.boxplot and sns.catplot?", a: "boxplot is axes-level and draws on one Axes; catplot is figure-level (kind='box', 'violin', 'bar', …) and can facet with col/row." },
      { q: "How do you turn a wide table into the long format seaborn expects?", a: "`df.melt(id_vars=[...], var_name=..., value_name=...)`." },
      { q: "What does the error bar on a seaborn barplot represent by default?", a: "A 95% confidence interval for the mean, computed by bootstrapping (errorbar=('ci', 95))." },
    ],
    answer: `I use seaborn for statistical EDA on tidy DataFrames: I name the columns for x, y and hue, and it handles grouping, aggregation, colour legends and faceting with col and row, so comparisons by segment take one line. It's built on matplotlib, so I still customise and save through the Axes. The thing to watch is that barplot and lineplot show the mean with a bootstrapped confidence interval by default, not the sum, so I set the estimator or aggregate first, and for correlation heatmaps I use a diverging palette centred at zero.`,
    avoid: ["Assuming barplot shows totals"],
  },
  terms: [["Long format", "One row per observation, one column per variable."], ["hue", "Column mapped to colour."], ["Facet", "Separate panel per value of a column (col/row)."]],
  sources: [S.sns, S.mpl],
});
Q({ id: "py2-sns-1", d: 2, secs: 45, prompt: "A seaborn barplot with default settings on rows city=A with revenue 10, 20, 30 shows which bar height for A?", answer: 20, tol: 0.5, explain: "The default estimator is the mean: 20 (not the sum, 60).", py: "import pandas as pd\ndf = pd.DataFrame({'city': ['A'] * 3, 'rev': [10, 20, 30]})\nanswer = df.groupby('city')['rev'].mean()['A']", packages: ["pandas"] });
Q({ id: "py2-sns-2", d: 2, secs: 60, prompt: "`wide` has index day (2 rows) and columns lunch, dinner. After `wide.reset_index().melt(id_vars='day')`, how many rows are there?", answer: 4, tol: 0.5, explain: "2 days × 2 value columns = 4 long rows.", py: "import pandas as pd\nwide = pd.DataFrame({'lunch': [1, 2], 'dinner': [3, 4]}, index=pd.Index(['Sat', 'Sun'], name='day'))\nanswer = len(wide.reset_index().melt(id_vars='day'))", packages: ["pandas"] });
Q({ id: "py2-sns-3", d: 1, secs: 30, prompt: "Which seaborn function can facet by `col='region'`?", options: ["sns.boxplot", "sns.histplot", "sns.catplot", "sns.heatmap"], answer: 2, explain: "Figure-level functions (relplot, displot, catplot) support col/row facets.", py: "answer = 2" });
Q({ id: "py2-sns-4", d: 2, secs: 45, prompt: "x = [1, 2, 3, 4], y = [2, 4, 6, 8], z = [4, 3, 2, 1]. In a correlation heatmap, what is corr(y, z)?", answer: -1, tol: 0.01, explain: "Perfect negative linear relationship.", py: "import pandas as pd\ndf = pd.DataFrame({'x': [1, 2, 3, 4], 'y': [2, 4, 6, 8], 'z': [4, 3, 2, 1]})\nanswer = float(df.corr().loc['y', 'z'])", packages: ["pandas"] });
C("py2-sns-c1", "seaborn barplot default", "estimator=mean with 95% bootstrap CI.");
C("py2-sns-c2", "Axes- vs figure-level", "boxplot/histplot/scatterplot take ax=; catplot/displot/relplot make their own figure and facet.");

// ───────────────────────── pandas plotting ─────────────────────────

L("py2-pandas-plot", PL, "Plotting straight from pandas", "df.plot kinds, plotting after groupby/resample, and handing the Axes to matplotlib.", {
  kind: "concept", mins: 15, mathsLabel: "Code",
  hook: "You've just computed `df.groupby('month')['revenue'].sum()`. One more method call charts it. Which, and how do you style it?",
  intuition: `
**The situation.** In EDA you aggregate with pandas and want an instant chart of the result.

**The idea.** \`Series.plot\` and \`DataFrame.plot\` wrap matplotlib. The **index becomes the x-axis** and each column becomes a series. \`kind=\` (or \`.plot.bar()\`, \`.plot.hist()\` …) picks the chart. The call returns a matplotlib Axes, so you can keep styling, or pass \`ax=\` to draw into a subplot you already made.

The trick is shaping the data first: \`groupby\` / \`pivot_table\` / \`resample\` / \`unstack\` to get the index and columns you want on the chart.
`,
  maths: `
**In one breath.** Index → x, columns → series; \`kind\` in line/bar/barh/hist/box/kde/area/scatter/pie; returns an Axes; shape data with groupby/pivot first.

\`\`\`python
import pandas as pd, numpy as np
rng = np.random.default_rng(0)
df = pd.DataFrame({
    "date": pd.date_range("2025-01-01", periods=180, freq="D"),
    "city": rng.choice(["Pune", "Delhi"], 180),
    "revenue": rng.gamma(2, 500, 180).round(),
})
monthly = df.set_index("date").resample("MS")["revenue"].sum()
ax = monthly.plot(marker="o", title="Revenue by month")
ax.set_ylabel("₹")

by_city = df.pivot_table(index=df.date.dt.month, columns="city", values="revenue", aggfunc="sum")
by_city.plot(kind="bar", stacked=True)        # one bar per month, stacked by city

df["revenue"].plot.hist(bins=30)
df.boxplot(column="revenue", by="city")
df.plot.scatter(x="date", y="revenue", alpha=0.4)

import matplotlib.pyplot as plt
fig, axes = plt.subplots(1, 2, figsize=(10, 3))
monthly.plot(ax=axes[0]); by_city.plot.area(ax=axes[1])
\`\`\`

**Missing values.** Lines leave gaps at NaN; bars/areas treat NaN as 0: fill or drop deliberately.
`,
  practice: `
**Pattern.** Aggregate → (optionally sort) → \`.plot(kind=...)\` → style the returned Axes → save. For per-group lines, pivot so each group is a column; for top-N bars, \`value_counts().head(10).plot.barh()\`.
`,
  traps: [
    { trap: "`df.plot(x='city', y='revenue', kind='bar')` sums revenue per city.", why: "pandas plots the rows as given, one bar per row. Aggregate with groupby first." },
    { trap: "Plotting a DataFrame with many columns gives one readable chart.", why: "Every column becomes a line; select columns or use subplots=True." },
  ],
  say: {
    prompt: "How do you go from a raw DataFrame to a monthly revenue chart by city in pandas?",
    secs: 30,
    check: ["Aggregate first: resample/groupby/pivot_table", "Index becomes x, columns become series", "df.plot(kind=...) returns a matplotlib Axes", "ax= to place into subplots; style via Axes", "NaN handling and sorting/top-N"],
    followups: [
      { q: "How do you plot one line per city?", a: "Pivot so cities are columns (pivot_table or groupby().sum().unstack()), then .plot()." },
      { q: "How do you plot a monthly total from daily data?", a: "Set the date as index and resample('MS').sum() (or groupby on a month key), then plot." },
      { q: "How do you put two pandas plots side by side?", a: "Create fig, axes = plt.subplots(1, 2) and pass ax=axes[0], ax=axes[1]." },
    ],
    answer: `I shape the data first and plot second: set the date as the index and resample by month, or pivot_table with month as the index, city as the columns and revenue summed. Then \`.plot()\` draws one line per column with the index on the x-axis, and kind='bar' with stacked=True gives a stacked bar instead. The call returns a matplotlib Axes, so I set labels and titles on it, or pass ax= to place it in a subplot grid.`,
    avoid: ["Plotting unaggregated rows as bars"],
  },
  terms: [["df.plot", "pandas wrapper around matplotlib; returns an Axes."], ["resample", "Time-based groupby on a DatetimeIndex."]],
  sources: [S.pdviz],
});
Q({ id: "py2-pdp-1", d: 2, secs: 45, prompt: "Daily data from 2025-01-01 for 90 days, `resample('MS').sum()`. How many points does the monthly line have?", answer: 3, tol: 0.5, explain: "Jan, Feb and Mar (90 days ends 31 March).", py: "import pandas as pd\ns = pd.Series(1, index=pd.date_range('2025-01-01', periods=90, freq='D'))\nanswer = len(s.resample('MS').sum())", packages: ["pandas"] });
Q({ id: "py2-pdp-2", d: 2, secs: 45, prompt: "A pivot_table with index = 4 months and columns = 3 cities is plotted with `.plot()`. How many lines?", answer: 3, tol: 0.5, explain: "One line per column.", py: MPL + "import pandas as pd\ndf = pd.DataFrame({'m': [1, 2, 3, 4] * 3, 'c': list('aaaabbbbcccc'), 'v': range(12)})\np = df.pivot_table(index='m', columns='c', values='v', aggfunc='sum')\nax = p.plot()\nanswer = len(ax.lines)", packages: ["matplotlib", "pandas"] });
Q({ id: "py2-pdp-3", d: 1, secs: 30, prompt: "What type does `pd.Series([1, 2, 3]).plot()` return?", options: ["Figure", "Axes", "None", "Line2D"], answer: 1, explain: "pandas plotting returns the matplotlib Axes.", py: MPL + "import pandas as pd\nax = pd.Series([1, 2, 3]).plot()\nimport matplotlib.axes\nanswer = 1 if isinstance(ax, matplotlib.axes.Axes) else 0", packages: ["matplotlib", "pandas"] });
Q({ id: "py2-pdp-4", d: 1, secs: 30, prompt: "`s.value_counts().head(5).plot.barh()` on a column with 12 distinct values draws how many bars?", answer: 5, tol: 0.5, explain: "head(5) keeps the 5 most frequent values.", py: MPL + "import pandas as pd\ns = pd.Series([f'v{i % 12}' for i in range(100)])\nax = s.value_counts().head(5).plot.barh()\nanswer = len(ax.patches)", packages: ["matplotlib", "pandas"] });
C("py2-pdp-c1", "pandas plot mapping", "Index → x-axis; each column → a series.");
C("py2-pdp-c2", "Aggregate, then plot", "groupby/pivot_table/resample first; df.plot plots rows as given.");

L("py2-plot-practice", PL, "Plotting practice", "Chart-choice and critique questions for case and take-home rounds.", {
  kind: "interview", mins: 20, prereq: ["py2-chart-choice", "py2-mpl"],
  hook: "Describe the chart you'd build and why, then compare with the checklist.",
}, [
  iq("You have daily orders for 3 years and want to show seasonality and trend to a manager. What do you plot?", "A line of a 7-day or 28-day rolling average over raw daily (grey) to show trend; a second panel of average orders by month-of-year or day-of-week (bar or line) to show seasonality; annotate key events. Title states the takeaway.", ["Rolling average for trend", "Separate seasonality view", "Annotations / takeaway title", "Avoid noisy raw-only chart"]),
  iq("Critique a 3-D pie chart with 9 slices showing market share.", "3-D distorts angles and areas; 9 slices are unreadable. Replace with a sorted horizontal bar chart with direct labels, possibly grouping small players into 'Other'.", ["Pie/3-D distortion", "Sorted bar alternative", "Group small categories", "Direct labels"]),
  iq("How would you visualise the relationship between price and conversion across 200k sessions?", "Bin price and plot conversion rate per bin (line with CI), or hexbin/2-D histogram; a raw scatter of a binary outcome is useless. Consider log price and segment by hue.", ["Binary outcome → binned rate", "Overplotting solutions", "Confidence intervals", "Segmentation"]),
  iq("Your multi-panel matplotlib figure has overlapping labels and the title lands on the wrong subplot. Fix it.", "Use the OO API: set titles on axes[i, j] not plt.title; call fig.tight_layout() or layout='constrained'; rotate tick labels; use fig.suptitle for an overall title.", ["Per-Axes methods", "tight_layout/constrained layout", "suptitle", "Tick label rotation"]),
  iq("Show correlation among 15 numeric features before modelling.", "An annotated heatmap of df.corr() with a diverging palette centred at 0 (vmin -1, vmax 1), ordered by clustering; Spearman for monotonic non-linear; follow up with scatter for the strongest pairs.", ["Heatmap of corr matrix", "Diverging palette at 0", "Spearman option", "Follow-up scatter"]),
]);
