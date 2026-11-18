/**
 * P1 · Core Python (batch 2, 9 concepts) and P2 · Permutations and combinations (3 concepts).
 * Python quiz items are "what does this print?": the check runs the snippet in Pyodide and
 * confirms the printed line is the option marked correct. P&C items come from gen/pnc.ts.
 */
import { PNC_ITEMS, PNC_TOPICS as PC } from "@/data/gen/pnc";
import type { InterviewQ, Resource } from "@/lib/types";
import { Card_, Item, R, T } from "./build";

const SRC = "Practice: Python predict-the-output, run and checked in Pyodide 0.26 / Python 3.12 (Nov 2026)";
const iq = (q: string, answer: string, rubric: string[]): InterviewQ => ({ q, answer, rubric });
const yt = (id: string, title: string, who = "Corey Schafer") => R(`Video: ${title} (${who})`, `https://www.youtube.com/watch?v=${id}`);
const doc = (path: string, title: string) => R(`Python docs: ${title}`, `https://docs.python.org/3/${path}`);
const topic = (id: string, title: string, summary: string, notes: string, resources: Resource[], category: string, interview: InterviewQ[]) =>
  T(id, "foundations", "Core Python", title, summary, notes, { resources, categories: [category], interview });

/** A predict-the-output item. `correct` must be one of `options`; the check proves the code prints it. */
function out(id: string, d: 1 | 2 | 3, secs: number, code: string, options: string[], correct: string, explain: string, fast: string, trap: string) {
  const answer = options.indexOf(correct);
  if (answer < 0) throw new Error(`${id}: correct output not among the options`);
  Item({
    id, d, secs,
    prompt: `What does this code print?\n\n\`\`\`\n${code}\n\`\`\``,
    options: options.map((o) => `\`${o}\``),
    answer, explain, fast, trap, src: SRC,
    check: {
      py: `import io, contextlib\n_buf = io.StringIO()\nwith contextlib.redirect_stdout(_buf):\n    exec(${JSON.stringify(code)}, {"__name__": "__main__"})\n_out = _buf.getvalue().rstrip("\\n")\nopts = ${JSON.stringify(options)}\nanswer = opts.index(_out) if _out in opts else -1`,
    },
  });
}

// ───────────────────────── Objects, mutability, copying ─────────────────────────
topic("cp-objects", "Objects, mutability and copying", "Names are labels on objects. Know which objects can change, when two names share one, and how to copy.", `
**Names point at objects.** \`b = a\` does not copy anything: both names now refer to the same object. Changing the object through one name is visible through the other.

**Mutable vs immutable.**

- Immutable: int, float, str, tuple, frozenset, bytes. "Changing" them makes a new object.
- Mutable: list, dict, set, most class instances. They change in place.
- A tuple is immutable, but a list inside it can still change.

**\`==\` vs \`is\`.** \`==\` compares values; \`is\` compares identity (the same object). Use \`is\` only for \`None\` and other singletons.

**Copying.**

- Shallow copy (\`list(a)\`, \`a[:]\`, \`a.copy()\`, \`copy.copy\`): a new outer container whose items are the same objects.
- Deep copy (\`copy.deepcopy\`): copies every level.

**Two classic traps.**

1. \`[[0] * 3] * 2\` makes two references to **one** inner list. Use \`[[0] * 3 for _ in range(2)]\`.
2. A mutable default argument (\`def f(x, acc=[])\`) is created once, when the function is defined, and shared by every call. Use \`None\` and create the list inside.

**Worked example 1.** \`a = [1, 2]; b = a; b.append(3)\` → \`a\` is \`[1, 2, 3]\`.

**Worked example 2.** \`g = [[0] * 3] * 2; g[0][0] = 1\` → \`[[1, 0, 0], [1, 0, 0]]\`.

**Worked example 3.** \`b = copy.copy([[1], [2]]); b[0].append(9)\` changes the original's first inner list, but \`b.append([3])\` does not change the original.

**Worked example 4.** \`t = ([1], 2); t[0].append(3)\` works and gives \`([1, 3], 2)\`; \`t[0] = [5]\` raises TypeError.
`, [yt("5qQQ3yzbKp8", "Mutable vs immutable"), yt("mO_dS3rXDIs", "== vs is"), yt("SgUwPDT9tEs", "Shallow vs deep copy", "Krish Naik"), doc("library/copy.html", "copy module")], "py/objects", [
  iq("What is the difference between == and is in Python?", "== calls __eq__ and compares values; is checks that both names refer to the same object. Two separate lists [1, 2] are == but not is. Use is for None, True/False and sentinels; never for numbers or strings, where small-value caching makes is look like it works.", ["Value vs identity", "Example of equal but not identical", "Use is only for singletons like None", "Warns that int/str caching makes is unreliable"]),
  iq("Why is a mutable default argument a bug, and how do you fix it?", "Defaults are evaluated once, when def runs, so every call that omits the argument shares the same list or dict. Use None as the default and create a new object inside the function.", ["Defaults evaluated once at definition", "Shared across calls", "Fix with None and create inside"]),
  iq("Explain shallow vs deep copy with an example where the difference matters.", "A shallow copy makes a new container holding the same element objects; a deep copy recursively copies the elements. For a list of lists, after b = a.copy(), b[0].append(1) also changes a[0]; after copy.deepcopy it does not.", ["Defines both", "Gives a nested example", "Says when shallow is enough (immutable elements)"]),
]);
out("cp-obj-01", 1, 30, "a = [1, 2]\nb = a\nb.append(3)\nprint(a)", ["[1, 2]", "[1, 2, 3]", "[3]", "[1, 2, [3]]"], "[1, 2, 3]",
  "b = a binds a second name to the same list; appending through b changes the one list.", "Assignment never copies.", "Thinking b = a makes an independent copy.");
out("cp-obj-02", 2, 45, "grid = [[0] * 3] * 2\ngrid[0][0] = 1\nprint(grid)", ["[[1, 0, 0], [0, 0, 0]]", "[[1, 0, 0], [1, 0, 0]]", "[[1, 1, 1], [0, 0, 0]]", "[[1, 1, 1], [1, 1, 1]]"], "[[1, 0, 0], [1, 0, 0]]",
  "The outer * 2 repeats a reference to one inner list, so both rows are the same object.", "Outer multiplication copies references, not lists.", "Expecting two independent rows.");
out("cp-obj-03", 2, 60, "import copy\na = [[1], [2]]\nb = copy.copy(a)\nb[0].append(9)\nb.append([3])\nprint(a)", ["[[1], [2]]", "[[1, 9], [2]]", "[[1, 9], [2], [3]]", "[[1], [2], [3]]"], "[[1, 9], [2]]",
  "The shallow copy shares the inner lists (so the 9 shows up in a) but has its own outer list (so [3] does not).", "Shallow copy: new outer container, same inner objects.", "Assuming copy.copy copies every level, or no level.");
out("cp-obj-04", 2, 45, "def add(x, bucket=[]):\n    bucket.append(x)\n    return bucket\nadd(1)\nprint(add(2))", ["[2]", "[1, 2]", "[1]", "None"], "[1, 2]",
  "The default list is created once when def runs; the first call's 1 is still in it.", "Defaults are evaluated once.", "Expecting a fresh empty list each call.");
out("cp-obj-05", 1, 30, "t = ([1], 2)\nt[0].append(3)\nprint(t)", ["([1], 2)", "([1, 3], 2)", "TypeError", "([1, 3], 2, 3)"], "([1, 3], 2)",
  "The tuple cannot be reassigned, but the list it holds is mutable and can change in place.", "Immutable container, mutable contents.", "Thinking the whole tuple is frozen.");
out("cp-obj-06", 1, 20, "a = [1, 2]\nb = [1, 2]\nprint(a == b, a is b)", ["True True", "True False", "False False", "False True"], "True False",
  "Equal values, two different objects.", "== is value, is is identity.", "Using is to compare values.");
Card_("cp-obj-c1", "[[0] * 3] * 2: what goes wrong?", "Both rows are the same list. Use [[0] * 3 for _ in range(2)].");
Card_("cp-obj-c2", "Mutable default argument", "Created once at def time and shared. Default to None, create inside.");
Card_("cp-obj-c3", "Shallow vs deep copy", "Shallow: new outer, shared inner objects. deepcopy: copies all levels.");

// ───────────────────────── Numbers, strings, formatting ─────────────────────────
topic("cp-strings", "Numbers, strings and formatting", "Integer and float behaviour that surprises people, string methods, slicing and f-string formatting.", `
**Division.** \`/\` always gives a float. \`//\` is floor division: it rounds **down**, so \`-7 // 2\` is \`-4\`. \`%\` has the sign of the divisor: \`-7 % 3\` is \`2\`. Always \`a == (a // b) * b + a % b\`.

**round** uses banker's rounding (to even): \`round(2.5)\` is 2 and \`round(3.5)\` is 4.

**Floats are binary.** \`0.1 + 0.2 == 0.3\` is False. Compare with a tolerance (\`math.isclose\`) or use \`decimal.Decimal\` for money.

**Ints never overflow.** Python integers are arbitrary precision.

**Strings are immutable.** Methods return new strings: \`s.upper()\` does not change \`s\`.

**Common methods.** \`split\` / \`join\`, \`strip\`, \`replace\`, \`find\` (-1 if missing) vs \`index\` (raises), \`startswith\`, \`isdigit\` / \`isalnum\`, \`lower\`. \`s.split(",")\` keeps empty fields; \`s.split()\` with no argument splits on runs of whitespace and drops empties.

**Slicing.** \`s[start:stop:step]\`; \`s[::-1]\` reverses.

**f-strings.** \`f"{x:.2f}"\` 2 decimals · \`{n:05d}\` zero-padded · \`{n:,}\` thousands separator · \`{p:.1%}\` percentage · \`{s:>10}\` right-align · \`{x=}\` prints the expression and value (debugging).

**Worked example 1.** \`-7 // 2\` → -4 and \`-7 % 3\` → 2.

**Worked example 2.** \`round(0.1 + 0.2, 10) == 0.3\` → True, though the unrounded comparison is False.

**Worked example 3.** \`"a,b,,c".split(",")\` → \`['a', 'b', '', 'c']\`; \`"a  b".split()\` → \`['a', 'b']\`.

**Worked example 4.** \`f"{0.456:.1%}"\` → \`45.6%\`.
`, [yt("k9TUPpGqYTo", "Strings"), yt("nghuHvKLhJA", "f-strings"), doc("library/string.html#format-specification-mini-language", "format specification")], "py/strings", [
  iq("Why does 0.1 + 0.2 == 0.3 evaluate to False, and how do you compare floats safely?", "Floats are stored in binary, and 0.1, 0.2 and 0.3 have no exact binary representation, so the sum is 0.30000000000000004. Compare with math.isclose (relative and absolute tolerance), or use Decimal or integer cents when exactness matters, such as money.", ["Binary representation", "Shows the actual sum or says it is slightly off", "math.isclose or a tolerance", "Decimal / integer cents for money"]),
  iq("What do -7 // 2 and -7 % 3 return in Python, and why?", "-4 and 2. Python's // floors towards negative infinity, and % takes the sign of the divisor, so that a == (a // b) * b + a % b always holds. C and Java truncate towards zero instead.", ["-4 and 2", "Floor, not truncation", "States the invariant", "Contrasts with C/Java"]),
  iq("Why is building a long string with += in a loop discouraged?", "Strings are immutable, so each += may create a new string and copy everything so far, which is O(n²) in the worst case. Collect pieces in a list and call ''.join(pieces) once.", ["Strings are immutable", "Repeated copying, quadratic", "Use a list and join"]),
]);
out("cp-str-01", 1, 30, "print(-7 // 2, -7 % 3)", ["-3 -1", "-4 2", "-3 2", "-4 -1"], "-4 2",
  "// floors towards negative infinity; % takes the divisor's sign.", "Floor, not truncate.", "Assuming C-style truncation.");
out("cp-str-02", 2, 30, "print(round(2.5), round(3.5))", ["3 4", "2 4", "2 3", "3 3"], "2 4",
  "round uses banker's rounding: halves go to the even neighbour.", "Ties go to even.", "Expecting school rounding (always up at .5).");
out("cp-str-03", 1, 30, "print(0.1 + 0.2 == 0.3, round(0.1 + 0.2, 10) == 0.3)", ["True True", "False True", "False False", "True False"], "False True",
  "0.1 + 0.2 is 0.30000000000000004; rounding removes the tiny error.", "Never compare floats with ==.", "Assuming decimal arithmetic.");
out("cp-str-04", 1, 30, "print(\"a,b,,c\".split(\",\"))", ["['a', 'b', 'c']", "['a', 'b', '', 'c']", "['a,b,,c']", "['a', 'b', ',', 'c']"], "['a', 'b', '', 'c']",
  "Splitting on an explicit separator keeps empty fields between consecutive separators.", "split(',') keeps empties; split() drops them.", "Expecting empties to be removed.");
out("cp-str-05", 2, 45, "print(f\"{3.14159:.2f}|{42:05d}|{1234567:,}\")", ["3.14|42|1234567", "3.14|00042|1,234,567", "3.1|42000|1,234,567", "3.14|00042|1234567"], "3.14|00042|1,234,567",
  ".2f rounds to 2 decimals, 05d zero-pads to width 5, and , adds thousands separators.", "Read each format spec left to right.", "Confusing width (5) with decimal places.");
out("cp-str-06", 1, 30, "s = \"Hello\"\ns.upper()\nprint(s, s[::-1])", ["HELLO olleH", "Hello olleH", "HELLO OLLEH", "Hello Hello"], "Hello olleH",
  "upper() returns a new string, which is discarded; s is unchanged. [::-1] reverses.", "String methods never modify in place.", "Thinking s.upper() changes s.");
Card_("cp-str-c1", "-7 // 2 and -7 % 3", "-4 and 2: floor division, remainder takes the divisor's sign.");
Card_("cp-str-c2", "round(2.5)", "2: banker's rounding to even.");
Card_("cp-str-c3", "Build a long string", "Append pieces to a list, then ''.join(pieces).");

// ───────────────────────── Lists, tuples, slicing ─────────────────────────
topic("cp-lists", "Lists, tuples and slicing", "Slicing rules, unpacking, sorting, and the cost of common list operations.", `
**Slicing** \`xs[start:stop:step]\`: start is included, stop is excluded, negative indices count from the end. Slices **never raise** for out-of-range bounds; they just return fewer items. \`xs[:]\` is a shallow copy.

**Slice assignment** replaces a range with any number of items: \`a[1:2] = [7, 8, 9]\` grows the list.

**Unpacking.** \`a, b = b, a\` swaps. \`first, *rest = xs\` puts the remainder in a list. \`for i, x in enumerate(xs)\` and \`for a, b in zip(xs, ys)\` (zip stops at the shorter).

**Sorting.** \`xs.sort()\` sorts in place and returns **None**; \`sorted(xs)\` returns a new list. Both are **stable** (equal keys keep their order) and take \`key=\` and \`reverse=\`.

**Costs (CPython).**

- O(1): \`append\`, \`pop()\` from the end, index access, \`len\`.
- O(n): \`insert(0, x)\`, \`pop(0)\`, \`x in list\`, \`remove\`, slicing a copy.
- O(n log n): sorting.
- Use \`collections.deque\` when you need fast appends and pops at both ends.

**Tuples** are immutable and hashable (if their items are), so they can be dict keys and set members.

**Worked example 1.** \`xs = [10, 20, 30, 40, 50]\`: \`xs[1:4:2]\` → \`[20, 40]\`, \`xs[-2:]\` → \`[40, 50]\`.

**Worked example 2.** \`[1, 2, 3][5:]\` → \`[]\`, no error.

**Worked example 3.** \`ys = xs.sort()\` leaves \`ys\` as None, a common bug.

**Worked example 4.** Sorting \`[("b", 2), ("a", 1), ("c", 2), ("d", 1)]\` by the number keeps a before d and b before c (stability).
`, [yt("W8KRzm-HUcc", "Lists, tuples and sets"), yt("ajrtAuDg3yw", "Slicing lists and strings"), yt("D3JvDWO-BY4", "Sorting lists, tuples and objects"), R("Python wiki: time complexity of built-in operations", "https://wiki.python.org/moin/TimeComplexity")], "py/lists", [
  iq("What is the difference between list.sort() and sorted()?", "list.sort() sorts the list in place and returns None; sorted() takes any iterable and returns a new list. Both are stable and accept key and reverse. A frequent bug is xs = xs.sort().", ["In place vs new list", "sort returns None", "Both stable, key/reverse", "Mentions the xs = xs.sort() bug"]),
  iq("Why is pop(0) on a list slow, and what do you use instead?", "Lists are dynamic arrays; removing the first element shifts every other element left, O(n). collections.deque supports popleft and appendleft in O(1), which is what a BFS queue needs.", ["Array shifting makes it O(n)", "deque.popleft is O(1)", "Mentions a use such as BFS"]),
  iq("What does it mean that Python's sort is stable, and why is that useful?", "Elements with equal keys keep their original relative order. That lets you sort by several keys in passes: sort by the secondary key first, then by the primary key.", ["Defines stability", "Multi-pass sort example"]),
]);
out("cp-lst-01", 1, 30, "xs = [10, 20, 30, 40, 50]\nprint(xs[1:4:2], xs[-2:])", ["[20, 40] [40, 50]", "[20, 30, 40] [50]", "[20, 40] [50]", "[10, 30] [40, 50]"], "[20, 40] [40, 50]",
  "1:4:2 takes indices 1 and 3; -2: takes the last two.", "Stop is excluded; step skips.", "Including the stop index.");
out("cp-lst-02", 1, 30, "xs = [1, 2, 3]\nprint(xs[5:], xs[-10:2])", ["IndexError", "[] [1, 2]", "[] []", "None [1, 2]"], "[] [1, 2]",
  "Slice bounds are clamped to the list; no error is raised.", "Slices never raise IndexError.", "Expecting an IndexError as with xs[5].");
out("cp-lst-03", 1, 30, "first, *rest = [1, 2, 3, 4]\nprint(first, rest)", ["1 (2, 3, 4)", "1 [2, 3, 4]", "[1] [2, 3, 4]", "1 2"], "1 [2, 3, 4]",
  "Starred unpacking always collects into a list.", "*name gets a list.", "Expecting a tuple.");
out("cp-lst-04", 1, 30, "xs = [3, 1, 2]\nys = xs.sort()\nprint(xs, ys)", ["[3, 1, 2] [1, 2, 3]", "[1, 2, 3] [1, 2, 3]", "[1, 2, 3] None", "None [1, 2, 3]"], "[1, 2, 3] None",
  "sort() works in place and returns None.", "sort mutates, sorted returns.", "Assigning the result of sort().");
out("cp-lst-05", 2, 45, "pairs = [(\"b\", 2), (\"a\", 1), (\"c\", 2), (\"d\", 1)]\nprint([k for k, v in sorted(pairs, key=lambda p: p[1])])", ["['a', 'd', 'b', 'c']", "['d', 'a', 'c', 'b']", "['a', 'b', 'c', 'd']", "['b', 'c', 'a', 'd']"], "['a', 'd', 'b', 'c']",
  "Sorted by the number; ties keep their original order (a before d, b before c).", "Python's sort is stable.", "Assuming ties are broken alphabetically.");
out("cp-lst-06", 2, 30, "a = [1, 2, 3]\na[1:2] = [7, 8, 9]\nprint(a)", ["[1, [7, 8, 9], 3]", "[1, 7, 8, 9, 3]", "[1, 7, 3]", "[7, 8, 9, 2, 3]"], "[1, 7, 8, 9, 3]",
  "Slice assignment replaces the slice (one item) with all three items.", "a[i:j] = seq splices.", "Confusing it with a[1] = [7, 8, 9], which nests.");
Card_("cp-lst-c1", "xs.sort() vs sorted(xs)", "In place, returns None vs new list. Both stable.");
Card_("cp-lst-c2", "Slicing past the end", "No error: bounds are clamped.");
Card_("cp-lst-c3", "Fast pops from the front", "collections.deque.popleft(), O(1).");

// ───────────────────────── Dicts, sets, hashing ─────────────────────────
topic("cp-dicts", "Dicts, sets and hashing", "O(1) lookup through hashing: what can be a key, how equality and hashing interact, and the collections helpers.", `
**Hash tables.** dict and set look up keys by hash, so membership and lookup are O(1) on average.

**Keys must be hashable**: immutable built-ins (int, str, tuple of hashables, frozenset). Lists, dicts and sets cannot be keys.

**Equal objects must have equal hashes.** \`1 == 1.0 == True\`, so they are the same key: \`{1, True, 1.0}\` has one element.

**dict behaviour.**

- Insertion order is preserved (guaranteed since 3.7). Re-assigning an existing key keeps its position.
- \`d[k]\` raises KeyError; \`d.get(k, default)\` does not.
- \`d.setdefault(k, [])\` returns the existing value or inserts the default.
- Do not add or remove keys while iterating over a dict.

**collections.**

- \`defaultdict(list)\`: missing keys start as an empty list.
- \`Counter\`: counts hashables; \`most_common(k)\`; supports + and − (− drops non-positive counts).

**Sets.** \`&\` intersection, \`|\` union, \`-\` difference, \`^\` symmetric difference. Use a set for "seen" checks instead of a list.

**Custom classes.** Defining \`__eq__\` without \`__hash__\` makes instances unhashable.

**Worked example 1.** \`len({1, True, 1.0, "1"})\` → 2.

**Worked example 2.** \`{[1, 2]: "x"}\` → TypeError: unhashable type: 'list'. Use the tuple \`(1, 2)\`.

**Worked example 3.** Grouping: \`g = defaultdict(list); g[key].append(item)\`.

**Worked example 4.** \`Counter("mississippi").most_common(2)\` → \`[('i', 4), ('s', 4)]\`: ties keep first-appearance order.
`, [yt("daefaLgNkw0", "Dictionaries"), doc("library/collections.html", "collections"), doc("tutorial/datastructures.html#dictionaries", "dictionaries tutorial")], "py/dicts", [
  iq("Why can't a list be a dictionary key?", "Dict keys are found by hash, and the hash must never change while the key is in the dict. A list is mutable, so its contents (and therefore any content-based hash) could change, breaking lookups; Python makes lists unhashable. Use a tuple of the same values.", ["Keys are located by hash", "Mutability would change the hash", "Use a tuple"]),
  iq("What is the average and worst-case time for a dict lookup?", "O(1) on average; O(n) in the worst case if many keys collide. Python's hashing and probing keep collisions rare in practice.", ["O(1) average", "O(n) worst case from collisions"]),
  iq("When would you use defaultdict or Counter instead of a plain dict?", "defaultdict when every missing key should start with the same default (a list for grouping, an int for counting) to avoid if-not-in checks. Counter specifically for counting, with most_common and arithmetic between counts.", ["defaultdict for grouping/defaults", "Counter for counting", "Mentions most_common or arithmetic"]),
]);
out("cp-dct-01", 2, 45, "print(len({1, True, 1.0, \"1\"}))", ["4", "3", "2", "1"], "2",
  "1, True and 1.0 are equal and hash the same, so they are one element; the string '1' is different.", "Equal values are the same key.", "Counting True and 1.0 as distinct.");
out("cp-dct-02", 1, 30, "try:\n    d = {[1, 2]: \"x\"}\nexcept TypeError:\n    print(\"TypeError\")", ["TypeError", "KeyError", "{[1, 2]: 'x'}", "ValueError"], "TypeError",
  "Lists are unhashable, so they cannot be keys.", "Keys must be hashable.", "Expecting it to work like a tuple.");
out("cp-dct-03", 1, 30, "d = {\"a\": 1}\nprint(d.get(\"b\"), d.get(\"b\", 0), \"b\" in d)", ["None 0 False", "KeyError", "0 0 False", "None None False"], "None 0 False",
  "get returns None (or the default) for a missing key and never adds it.", "get never raises.", "Thinking get inserts the key.");
out("cp-dct-04", 2, 45, "from collections import Counter\nc = Counter(\"mississippi\")\nprint(c.most_common(2))", ["[('s', 4), ('i', 4)]", "[('i', 4), ('s', 4)]", "[('i', 4), ('p', 2)]", "[('m', 1), ('i', 4)]"], "[('i', 4), ('s', 4)]",
  "i and s both appear 4 times; ties keep the order in which they were first seen (i before s).", "most_common breaks ties by first appearance.", "Assuming alphabetical tie-breaking.");
out("cp-dct-05", 1, 30, "a = {1, 2, 3}\nb = {2, 3, 4}\nprint(sorted(a & b), sorted(a ^ b))", ["[2, 3] [1, 4]", "[1, 2, 3, 4] [1, 4]", "[2, 3] [1, 2, 3, 4]", "[1, 4] [2, 3]"], "[2, 3] [1, 4]",
  "& is intersection; ^ is the items in exactly one set.", "^ = union minus intersection.", "Confusing ^ with |.");
out("cp-dct-06", 1, 30, "d = {\"x\": 1, \"y\": 2}\nd[\"x\"] = 3\nd[\"z\"] = 4\nprint(list(d))", ["['y', 'x', 'z']", "['x', 'y', 'z']", "['x', 'z', 'y']", "['z', 'y', 'x']"], "['x', 'y', 'z']",
  "Dicts keep insertion order; updating an existing key does not move it.", "Re-assigning keeps position.", "Thinking an update moves the key to the end.");
Card_("cp-dct-c1", "What can be a dict key?", "Any hashable: int, str, tuple of hashables, frozenset. Not list, dict, set.");
Card_("cp-dct-c2", "{1, True, 1.0}", "One element: equal values hash the same.");
Card_("cp-dct-c3", "Counter.most_common ties", "Broken by first appearance.");

// ───────────────────────── Comprehensions, iterators, generators ─────────────────────────
topic("cp-iter", "Comprehensions, iterators and generators", "Build collections in one expression; produce values lazily with generators; know when an iterator is used up.", `
**Comprehensions.** \`[f(x) for x in xs if cond(x)]\`, plus dict (\`{k: v for …}\`) and set (\`{x for …}\`) versions. Nested \`for\` clauses read left to right, like nested loops.

**Iterables vs iterators.** An iterable (list, str, dict, range) can produce a fresh iterator with \`iter()\`. An iterator yields each item once; after it is exhausted it stays empty.

**Generators.**

- A generator expression \`(x * x for x in xs)\` is lazy: nothing runs until you iterate.
- A function with \`yield\` returns a generator; its body runs only when \`next()\` is called, pausing at each yield.
- \`yield from other\` delegates to another iterable.
- Generators use O(1) memory, can be infinite, and can be consumed **once**.

**Laziness in built-ins.** \`range\`, \`zip\`, \`map\`, \`filter\`, \`enumerate\` and \`dict.items()\` are lazy. \`any\` and \`all\` stop at the first decisive item.

**Worked example 1.** \`g = (x * x for x in range(3)); list(g); list(g)\` → \`[0, 1, 4]\` then \`[]\`.

**Worked example 2.** \`[(i, j) for i in range(3) for j in range(i)]\` → \`[(1, 0), (2, 0), (2, 1)]\`.

**Worked example 3.** \`sum(x * x for x in range(10**7))\` uses constant memory; the list version builds 10 million items first.

**Worked example 4.** \`any(check(x) for x in [0, 2, 5])\` calls check on 0 and 2 only, stopping at the first True.
`, [yt("3dt4OGnU5sM", "Comprehensions"), yt("bD05uGo_sVI", "Generators"), doc("howto/functional.html#generators", "generators how-to")], "py/iter", [
  iq("What is the difference between a list comprehension and a generator expression?", "A list comprehension builds the whole list in memory immediately; a generator expression produces items lazily, one at a time, using constant memory, and can be iterated only once. Use a generator when you only need to loop once or feed sum/any/max.", ["Eager vs lazy", "Memory difference", "Single pass", "When to prefer each"]),
  iq("How does a generator function differ from a normal function?", "Calling it does not run the body; it returns a generator object. Each next() runs the body until the next yield, returns that value and pauses, keeping local state. When the body ends, StopIteration ends the iteration.", ["Call returns a generator object", "Runs to each yield and pauses", "Keeps local state", "Ends with StopIteration"]),
  iq("Why might iterating over the same data twice give an empty result the second time?", "If the data is an iterator or generator (a file object, map, zip, a generator expression), the first loop exhausts it. Lists and other iterables create a fresh iterator each time. Convert to a list if you need several passes.", ["Iterators are single-use", "Examples of iterators", "Convert to list for multiple passes"]),
]);
out("cp-itr-01", 1, 30, "g = (x * x for x in range(3))\nprint(list(g), list(g))", ["[0, 1, 4] [0, 1, 4]", "[0, 1, 4] []", "[] []", "[1, 4, 9] []"], "[0, 1, 4] []",
  "The first list() exhausts the generator; the second gets nothing.", "Generators are single-use.", "Expecting a generator to restart.");
out("cp-itr-02", 2, 45, "print([(i, j) for i in range(3) for j in range(i)])", ["[(0, 0), (1, 0), (1, 1)]", "[(1, 0), (2, 0), (2, 1)]", "[(0, 1), (0, 2), (1, 2)]", "[]"], "[(1, 0), (2, 0), (2, 1)]",
  "The outer loop is first; for i = 0, range(0) is empty.", "Read the for clauses as nested loops, left to right.", "Reading the clauses in reverse order.");
out("cp-itr-03", 1, 30, "print({x % 3 for x in range(10)})", ["{0, 1, 2}", "[0, 1, 2, 0, 1, 2, 0, 1, 2, 0]", "{0, 1, 2, 3}", "{1, 2, 0}"], "{0, 1, 2}",
  "A set comprehension keeps unique values; small ints display in this order.", "Braces without a colon make a set.", "Thinking braces make a dict.");
out("cp-itr-04", 2, 45, "log = []\ndef gen():\n    log.append(\"start\")\n    yield 1\ng = gen()\nlog.append(\"made\")\nnext(g)\nprint(log)", ["['start', 'made']", "['made', 'start']", "['made']", "['start']"], "['made', 'start']",
  "Calling gen() runs none of its body; the body starts at the first next().", "Generator bodies are lazy.", "Assuming the body runs when the generator is created.");
out("cp-itr-05", 1, 30, "it = iter([1, 2, 3])\nprint(next(it), list(it))", ["1 [1, 2, 3]", "1 [2, 3]", "[1] [2, 3]", "1 []"], "1 [2, 3]",
  "next consumes the first item; list takes what is left.", "Iterators remember their position.", "Expecting list(it) to start over.");
out("cp-itr-06", 2, 45, "calls = []\ndef check(x):\n    calls.append(x)\n    return x > 1\nprint(any(check(x) for x in [0, 2, 5]), calls)", ["True [0, 2, 5]", "True [0, 2]", "True [2]", "False [0, 2, 5]"], "True [0, 2]",
  "any stops at the first True (x = 2), and the generator never evaluates 5.", "any/all short-circuit.", "Using a list comprehension, which would evaluate every element first.");
Card_("cp-itr-c1", "Generator expression vs list comprehension", "Lazy, O(1) memory, single pass vs eager list.");
Card_("cp-itr-c2", "When does a generator function's body run?", "Only when next() is called, up to each yield.");
Card_("cp-itr-c3", "Nested comprehension order", "for clauses read left to right like nested loops.");

// ───────────────────────── Functions ─────────────────────────
topic("cp-functions", "Functions: arguments, scope, closures and decorators", "Argument kinds, the LEGB scope rule, closures and late binding, decorators, and key functions.", `
**Argument kinds.** \`def f(a, b=2, *args, c, **kwargs)\`: positional \`a\`, default \`b\`, extra positionals in the tuple \`args\`, keyword-only \`c\` (after \`*\`), extra keywords in the dict \`kwargs\`. Call-side \`f(*xs, **d)\` unpacks.

**Scope (LEGB).** Names are looked up Local → Enclosing → Global → Built-in. **Assigning** to a name anywhere in a function makes it local for the whole function, so reading it before the assignment raises UnboundLocalError. \`global\` and \`nonlocal\` declare otherwise.

**Closures.** An inner function remembers variables from the enclosing function. Variables are looked up when the inner function **runs**, not when it is created (late binding): \`[lambda: i for i in range(3)]\` all return 2. Fix with a default argument: \`lambda i=i: i\`.

**Decorators.** \`@dec\` above \`def f\` means \`f = dec(f)\`. Stacked decorators apply bottom-up. Use \`functools.wraps\` in the wrapper to keep the name and docstring.

**Key functions.** \`sorted(xs, key=…)\`, \`max(xs, key=…)\`. Mix directions by negating numbers in a tuple key: \`key=lambda p: (-p.age, p.name)\`.

**Worked example 1.** \`f(1, 3, 4, 5, c=6, d=7)\` for the signature above gives \`a=1, b=3, args=(4, 5), c=6, kwargs={'d': 7}\`.

**Worked example 2.** \`x = 10\` at module level; inside \`f\`, \`print(x); x = 5\` raises UnboundLocalError.

**Worked example 3.** A counter: \`def make(): n = 0; def inc(): nonlocal n; n += 1; return n; return inc\`.

**Worked example 4.** \`@bold @italic def hi()\` returns \`<b><i>hi</i></b>\`: italic wraps first.
`, [yt("4jBJhCaNrWU", "*args and **kwargs", "b001"), yt("swU3c34d2NQ", "Closures"), yt("FsAPt_9Bf3U", "Decorators")], "py/functions", [
  iq("What is a closure, and what is the late-binding gotcha?", "A closure is an inner function that keeps access to variables of the enclosing scope after that scope has returned. The variables are looked up when the inner function is called, so lambdas created in a loop all see the loop variable's final value. Bind the current value with a default argument (lambda i=i: i) or functools.partial.", ["Defines a closure", "Lookup at call time", "Loop-lambda example", "Default-argument fix"]),
  iq("What does a decorator do, and why use functools.wraps?", "@dec on f is f = dec(f): dec takes a function and returns a replacement, usually a wrapper that adds behaviour (logging, caching, timing) around the original call. functools.wraps copies the original's __name__, __doc__ and other metadata onto the wrapper so introspection and debugging still work.", ["f = dec(f)", "Wrapper adds behaviour", "wraps preserves metadata"]),
  iq("When do you get UnboundLocalError?", "When a function assigns to a name, Python treats that name as local throughout the function. Reading it before the assignment then fails, even if a global of the same name exists. Use global/nonlocal, or pass the value in as an argument.", ["Assignment makes the name local everywhere in the function", "Read before assignment fails", "global/nonlocal or pass it in"]),
]);
out("cp-fn-01", 2, 45, "fs = [lambda: i for i in range(3)]\nprint([f() for f in fs])", ["[0, 1, 2]", "[2, 2, 2]", "[0, 0, 0]", "[3, 3, 3]"], "[2, 2, 2]",
  "Each lambda looks up i when called, after the loop has finished at 2.", "Closures bind late.", "Expecting each lambda to capture its own i.");
out("cp-fn-02", 2, 45, "x = 10\ndef f():\n    try:\n        print(x)\n        x = 5\n    except UnboundLocalError:\n        print(\"UnboundLocalError\")\nf()", ["10", "5", "UnboundLocalError", "NameError"], "UnboundLocalError",
  "The assignment x = 5 makes x local to f, so the earlier print reads an unassigned local.", "Any assignment makes a name local for the whole function.", "Expecting it to print the global 10.");
out("cp-fn-03", 2, 60, "def f(a, b=2, *args, c, **kw):\n    return (a, b, args, c, kw)\nprint(f(1, 3, 4, 5, c=6, d=7))", ["(1, 3, (4, 5), 6, {'d': 7})", "(1, 2, (3, 4, 5), 6, {'d': 7})", "(1, 3, [4, 5], 6, {'d': 7})", "TypeError"], "(1, 3, (4, 5), 6, {'d': 7})",
  "Positionals fill a, then b, then the rest go to args (a tuple); c must be a keyword; d lands in kw.", "Positional slots first, then *args, keyword-only, **kwargs.", "Thinking b keeps its default when a second positional is given.");
out("cp-fn-04", 1, 45, "def make_counter():\n    n = 0\n    def inc():\n        nonlocal n\n        n += 1\n        return n\n    return inc\na, b = make_counter(), make_counter()\na(); a()\nprint(a(), b())", ["3 3", "3 1", "1 1", "2 1"], "3 1",
  "Each call to make_counter creates a new n; a has been called three times, b once.", "Each closure has its own enclosing variables.", "Assuming counters share state.");
out("cp-fn-05", 2, 45, "def bold(f):\n    return lambda: \"<b>\" + f() + \"</b>\"\ndef italic(f):\n    return lambda: \"<i>\" + f() + \"</i>\"\n@bold\n@italic\ndef hi():\n    return \"hi\"\nprint(hi())", ["<b><i>hi</i></b>", "<i><b>hi</b></i>", "<b>hi</b>", "<i>hi</i>"], "<b><i>hi</i></b>",
  "hi = bold(italic(hi)): the decorator nearest the function is applied first, so bold is outermost.", "Decorators apply bottom-up.", "Applying them top-down.");
out("cp-fn-06", 1, 30, "words = [\"bb\", \"a\", \"ccc\", \"dd\"]\nprint(sorted(words, key=lambda w: (-len(w), w)))", ["['a', 'bb', 'dd', 'ccc']", "['ccc', 'bb', 'dd', 'a']", "['ccc', 'dd', 'bb', 'a']", "['a', 'bb', 'ccc', 'dd']"], "['ccc', 'bb', 'dd', 'a']",
  "Longest first (negated length), then alphabetical among equal lengths.", "Negate a number inside a tuple key to reverse just that part.", "Using reverse=True, which also reverses the alphabetical part.");
Card_("cp-fn-c1", "Late binding in closures", "Variables are looked up at call time; bind with a default (lambda i=i: i).");
Card_("cp-fn-c2", "Stacked decorators", "Applied bottom-up: @a @b def f → f = a(b(f)).");
Card_("cp-fn-c3", "UnboundLocalError", "Assigning to a name makes it local for the whole function.");

// ───────────────────────── Classes ─────────────────────────
topic("cp-classes", "Classes and dataclasses", "Instance vs class attributes, methods and properties, inheritance and super(), dunder methods, dataclasses.", `
**Instance vs class attributes.** Attributes set on \`self\` in \`__init__\` belong to one instance. Attributes in the class body are shared by all instances. A mutable class attribute (a list) is shared, a classic bug. Assigning \`obj.attr = …\` creates an instance attribute that hides the class one.

**Methods.** Regular methods get \`self\`; \`@classmethod\` gets the class (alternative constructors); \`@staticmethod\` gets neither.

**@property** turns a method into a computed attribute; add \`@x.setter\` to allow controlled assignment. Without a setter, assignment raises AttributeError.

**Inheritance.** A subclass overrides methods; \`super().method()\` calls the next class in the MRO (method resolution order).

**Dunder methods.** \`__repr__\` (debug display), \`__eq__\` (==), \`__lt__\` (sorting), \`__len__\`, \`__iter__\`, \`__hash__\`. Defining \`__eq__\` without \`__hash__\` makes instances unhashable.

**dataclasses.** \`@dataclass\` generates \`__init__\`, \`__repr__\` and \`__eq__\` from type-annotated fields. \`frozen=True\` makes instances immutable and hashable; \`order=True\` adds comparisons by field order. Use \`field(default_factory=list)\` for mutable defaults.

**Worked example 1.** \`class Team: members = []\`; \`a.add("x")\` then \`b.members\` → \`['x']\`.

**Worked example 2.** \`a.n = 5\` on an instance leaves \`C.n\` and \`b.n\` at 1.

**Worked example 3.** \`@dataclass class P: x: int; y: int = 0\` → \`P(1) == P(1, 0)\` is True, and \`repr(P(2))\` is \`P(x=2, y=0)\`.

**Worked example 4.** \`class C(B)\` where B overrides \`hi\` and calls \`super().hi()\` from A: \`C().hi()\` → \`"BA"\`.
`, [yt("ZDa-Z5JzLYM", "OOP 1: classes and instances"), yt("BJ-VvGyQxho", "OOP 2: class variables"), yt("jCzT9XFZ5bw", "OOP 6: property decorators"), doc("library/dataclasses.html", "dataclasses")], "py/classes", [
  iq("What is the difference between a class attribute and an instance attribute?", "A class attribute is defined in the class body and shared by every instance; an instance attribute is set on self and belongs to one object. Reading obj.x checks the instance first, then the class. A mutable class attribute such as a list is shared, so appending through one instance changes it for all.", ["Defines both", "Lookup order instance then class", "Mutable class attribute bug"]),
  iq("What does @dataclass generate, and when would you use frozen=True?", "It generates __init__, __repr__ and __eq__ from annotated fields (and comparisons with order=True). frozen=True blocks assignment after creation, which makes instances hashable and safe as dict keys or set members and avoids accidental mutation.", ["Lists generated methods", "frozen = immutable", "Hashable / usable as keys"]),
  iq("When should you use @property?", "To expose a computed or validated value with attribute syntax: obj.area instead of obj.get_area(), or a balance that cannot be set directly. It lets you start with a plain attribute and add logic later without changing callers.", ["Computed or validated attribute", "Attribute syntax", "Can be added later without changing callers"]),
]);
out("cp-cls-01", 2, 45, "class Team:\n    members = []\n    def add(self, name):\n        self.members.append(name)\na, b = Team(), Team()\na.add(\"x\")\nprint(b.members)", ["[]", "['x']", "AttributeError", "None"], "['x']",
  "members is a class attribute: one list shared by every Team.", "Mutable class attributes are shared.", "Expecting each instance to have its own list.");
out("cp-cls-02", 1, 30, "class C:\n    n = 1\na, b = C(), C()\na.n = 5\nprint(a.n, b.n, C.n)", ["5 5 5", "5 1 1", "5 1 5", "1 1 1"], "5 1 1",
  "Assigning a.n creates an instance attribute on a only; the class attribute is untouched.", "Assignment through an instance shadows, it doesn't modify the class.", "Thinking a.n = 5 changes C.n.");
out("cp-cls-03", 1, 45, "from dataclasses import dataclass\n@dataclass\nclass P:\n    x: int\n    y: int = 0\nprint(P(1) == P(1, 0), P(2))", ["False P(x=2, y=0)", "True P(x=2, y=0)", "True <__main__.P object>", "True P(2, 0)"], "True P(x=2, y=0)",
  "dataclass generates __eq__ (field by field) and a readable __repr__.", "dataclass = free __init__, __repr__, __eq__.", "Expecting identity comparison and the default object repr.");
out("cp-cls-04", 2, 45, "class A:\n    def hi(self): return \"A\"\nclass B(A):\n    def hi(self): return \"B\" + super().hi()\nclass C(B):\n    pass\nprint(C().hi())", ["A", "B", "BA", "AB"], "BA",
  "C inherits B.hi, which prepends B to A's result.", "Follow the MRO: C → B → A.", "Thinking super() inside B refers to C's parent differently.");
out("cp-cls-05", 1, 30, "class Temp:\n    def __init__(self):\n        self._c = 0\n    @property\n    def f(self):\n        return self._c * 9 / 5 + 32\nt = Temp()\nt._c = 100\nprint(t.f)", ["212", "212.0", "100", "AttributeError"], "212.0",
  "The property is recomputed on access; / gives a float.", "Properties are computed on every access.", "Forgetting / always returns a float.");
out("cp-cls-06", 3, 45, "class K:\n    def __init__(self, v): self.v = v\n    def __eq__(self, o): return self.v == o.v\ntry:\n    print({K(1)})\nexcept TypeError:\n    print(\"TypeError\")", ["{K(1)}", "TypeError", "set()", "AttributeError"], "TypeError",
  "Defining __eq__ without __hash__ sets __hash__ to None, so instances cannot go in a set.", "Override __eq__ → also define __hash__ (or freeze a dataclass).", "Expecting the default identity hash to remain.");
Card_("cp-cls-c1", "Mutable class attribute", "Shared by all instances. Initialise per-instance lists in __init__.");
Card_("cp-cls-c2", "Defining __eq__ only", "Makes instances unhashable (__hash__ = None).");
Card_("cp-cls-c3", "@dataclass(frozen=True, order=True)", "Immutable, hashable, comparable by field order.");

// ───────────────────────── Exceptions ─────────────────────────
topic("cp-exceptions", "Exceptions and context managers", "try / except / else / finally, catching the right exception, raising and chaining, and with-statements.", `
**The full form.**

- \`try\`: code that may fail.
- \`except SomeError as e\`: handle it. Catch the most specific type you can handle. Order matters: the first matching clause wins, so put subclasses first.
- \`else\`: runs only if the try block raised nothing.
- \`finally\`: always runs, even after return or an unhandled exception. A return inside finally overrides any earlier return (avoid it).

**Hierarchy.** Most errors subclass \`Exception\`: \`ValueError\` (right type, bad value: \`int("x")\`), \`TypeError\` (wrong type), \`KeyError\` / \`IndexError\` (both \`LookupError\`), \`ZeroDivisionError\`, \`AttributeError\`, \`FileNotFoundError\` (an \`OSError\`). Never use a bare \`except:\`; it also catches KeyboardInterrupt.

**Raising.** \`raise ValueError("msg")\`. Re-raise the current exception with plain \`raise\`. Chain with \`raise NewError(...) from e\`, which keeps the original as \`__cause__\`.

**Custom exceptions.** \`class AppError(Exception): pass\`.

**EAFP vs LBYL.** Python style is "easier to ask forgiveness than permission": try the operation and catch the error, rather than checking first.

**Context managers.** \`with open(path) as f:\` guarantees cleanup. A class implements \`__enter__\` and \`__exit__\`; if \`__exit__\` returns True the exception is suppressed. \`contextlib.contextmanager\` builds one from a generator.

**Worked example 1.** try returns "try", finally prints first: output \`finally try\`.

**Worked example 2.** No exception: the order is try, else, finally.

**Worked example 3.** \`except Exception\` before \`except ValueError\`: the ValueError clause can never run.

**Worked example 4.** \`raise AppError("missing") from e\` inside \`except KeyError as e\` → \`e.__cause__\` is the KeyError.
`, [yt("NIWwJbo-9_8", "Try/except blocks"), yt("-aKFBoZpiqA", "Context managers"), doc("tutorial/errors.html", "errors and exceptions")], "py/exceptions", [
  iq("When does the else block of a try statement run, and why use it?", "Only when the try block completes without raising. It keeps the try block small (only the line that can fail) while code that depends on its success, and should not be protected by the except, goes in else.", ["Runs only without an exception", "Keeps try minimal", "Code in else isn't caught by the except"]),
  iq("Why is a bare except: (or except Exception: pass) dangerous?", "It hides every error, including bugs you did not anticipate (a typo raising NameError) and, for bare except, KeyboardInterrupt and SystemExit. Catch the specific exceptions you can handle, and log or re-raise the rest.", ["Hides unexpected bugs", "Bare except catches KeyboardInterrupt/SystemExit", "Catch specific types"]),
  iq("What does a context manager guarantee, and how would you write one?", "That cleanup runs when the with block exits, whether normally or by an exception (closing files, releasing locks, committing or rolling back). Write a class with __enter__ and __exit__, or a generator decorated with contextlib.contextmanager that yields once, with cleanup in a finally.", ["Cleanup on every exit path", "Examples of resources", "__enter__/__exit__ or contextmanager"]),
]);
out("cp-exc-01", 2, 45, "def f():\n    try:\n        return \"try\"\n    finally:\n        print(\"finally\", end=\" \")\nprint(f())", ["try", "finally try", "try finally", "finally"], "finally try",
  "finally runs before the function actually returns, so its print comes first.", "finally runs on the way out, before the caller gets the value.", "Expecting return to skip finally.");
out("cp-exc-02", 1, 30, "out = []\ntry:\n    out.append(\"a\")\nexcept ValueError:\n    out.append(\"b\")\nelse:\n    out.append(\"c\")\nfinally:\n    out.append(\"d\")\nprint(out)", ["['a', 'd']", "['a', 'c', 'd']", "['a', 'b', 'c', 'd']", "['a', 'b', 'd']"], "['a', 'c', 'd']",
  "No exception: try, then else, then finally.", "else = 'no exception happened'.", "Forgetting that else runs.");
out("cp-exc-03", 1, 30, "try:\n    int(\"x\")\nexcept Exception:\n    print(\"Exception\")\nexcept ValueError:\n    print(\"ValueError\")", ["ValueError", "Exception", "Both lines", "Nothing"], "Exception",
  "The first matching clause wins, and ValueError is an Exception.", "Put specific exceptions before general ones.", "Expecting the most specific clause to be chosen.");
out("cp-exc-04", 3, 30, "def f():\n    try:\n        return 1\n    finally:\n        return 2\nprint(f())", ["1", "2", "None", "SyntaxError"], "2",
  "A return in finally replaces the pending return value (and would also swallow an exception).", "finally's return wins; never return from finally.", "Expecting the try's return to be kept.");
out("cp-exc-05", 2, 45, "class Quiet:\n    def __enter__(self): return self\n    def __exit__(self, typ, val, tb):\n        return typ is ZeroDivisionError\nwith Quiet():\n    1 / 0\nprint(\"after\")", ["after", "ZeroDivisionError", "None", "Nothing is printed"], "after",
  "__exit__ returns True for ZeroDivisionError, which suppresses it; execution continues after the with block.", "A truthy return from __exit__ swallows the exception.", "Assuming context managers always re-raise.");
out("cp-exc-06", 2, 45, "class AppError(Exception):\n    pass\ntry:\n    try:\n        {}[\"k\"]\n    except KeyError as e:\n        raise AppError(\"missing\") from e\nexcept AppError as e:\n    print(type(e.__cause__).__name__, e)", ["KeyError missing", "AppError missing", "KeyError 'k'", "missing"], "KeyError missing",
  "raise … from e stores the KeyError as __cause__; str(e) of the AppError is its message.", "from e chains the original error.", "Thinking from replaces the message.");
Card_("cp-exc-c1", "try / except / else / finally order", "else only if no exception; finally always.");
Card_("cp-exc-c2", "except clause order", "First match wins: put subclasses before Exception.");
Card_("cp-exc-c3", "raise X from e", "Chains: the original is kept as X.__cause__.");

// ───────────────────────── Standard library ─────────────────────────
topic("cp-stdlib", "Standard library for OAs and the cost of built-ins", "collections, heapq, bisect, itertools and functools: the modules that turn OA problems into a few lines.", `
**collections.** \`deque\` (O(1) at both ends, \`rotate\`, \`maxlen\` for sliding windows), \`Counter\`, \`defaultdict\`, \`namedtuple\`.

**heapq** (a min-heap on a plain list). \`heappush\`, \`heappop\` (smallest), \`heapify\` (O(n)), \`nsmallest\` / \`nlargest\`. Push tuples \`(priority, item)\`; for a max-heap push negatives.

**bisect** on a sorted list. \`bisect_left(a, x)\` = number of items < x; \`bisect_right(a, x)\` = number ≤ x; \`insort\` inserts keeping order.

**itertools.** \`permutations\`, \`combinations\`, \`product\`, \`accumulate\` (prefix sums), \`groupby\` (groups **consecutive** equal items, so sort first), \`chain\`, \`islice\`, \`pairwise\`.

**functools.** \`lru_cache\` / \`cache\` (memoised recursion for DP), \`reduce\`, \`partial\`, \`cmp_to_key\`.

**math.** \`gcd\`, \`lcm\`, \`comb\`, \`perm\`, \`isqrt\`, \`inf\`.

**Costs to know.**

- \`x in list\`: O(n). \`x in set\` or a dict lookup: O(1) on average.
- \`list.append\` and \`pop()\`: O(1). \`list.insert(0, x)\` and \`pop(0)\`: O(n).
- \`deque.appendleft\` and \`popleft\`: O(1).
- \`heappush\` and \`heappop\`: O(log n). \`heapify\`: O(n).
- \`sorted\`: O(n log n).

**OA habits.** For big inputs read with \`sys.stdin.readline\`; raise \`sys.setrecursionlimit\` for deep recursion, or convert to an explicit stack.

**Worked example 1.** Dijkstra-style: \`heappush(h, (dist, node))\`; \`heappop\` returns the smallest distance first.

**Worked example 2.** \`bisect_left([1, 2, 2, 2, 5], 2)\` → 1 and \`bisect_right\` → 4, so the value 2 appears 3 times.

**Worked example 3.** \`[k for k, _ in groupby("aabbaa")]\` → \`['a', 'b', 'a']\`.

**Worked example 4.** \`@lru_cache(maxsize=None)\` on a recursive Fibonacci computes each value once: 21 calls for fib(20), not 21,891.
`, [yt("p8FUoSIyIVY", "itertools", "Tech With Tim"), yt("E2v9hBgG6gE", "Heaps and heapq", "Greg Hogg"), doc("library/heapq.html", "heapq"), doc("library/bisect.html", "bisect")], "py/stdlib", [
  iq("How do you get a max-heap from Python's heapq?", "heapq only provides a min-heap. Push negated keys (heappush(h, -x)) and negate on the way out, or push tuples (-priority, item). For the k largest of a list, heapq.nlargest(k, xs) does it directly.", ["heapq is min-heap only", "Negate keys", "Mentions nlargest"]),
  iq("What does itertools.groupby do that surprises people?", "It groups only consecutive equal items, so 'aabbaa' gives three groups a, b, a. To group all equal items, sort by the same key first. Each group is an iterator that is invalidated when you advance to the next group.", ["Consecutive only", "Sort first to group all", "Groups are single-use iterators"]),
  iq("Why is lru_cache useful in OA dynamic-programming problems?", "It memoises a recursive function on its arguments, turning exponential top-down recursion into one computation per state. You write the natural recurrence and get DP-level complexity. Arguments must be hashable, and deep recursion may need sys.setrecursionlimit.", ["Memoises by arguments", "Exponential to per-state cost", "Hashable arguments / recursion limit"]),
]);
out("cp-std-01", 1, 30, "import heapq\nh = []\nfor item in [(3, \"c\"), (1, \"a\"), (2, \"b\")]:\n    heapq.heappush(h, item)\nprint(heapq.heappop(h), len(h))", ["(3, 'c') 2", "(1, 'a') 2", "(1, 'a') 3", "(2, 'b') 2"], "(1, 'a') 2",
  "heapq is a min-heap ordered by the tuple's first element; pop removes it.", "Smallest first; tuples compare element by element.", "Expecting a max-heap or FIFO order.");
out("cp-std-02", 2, 30, "from bisect import bisect_left, bisect_right\nxs = [1, 2, 2, 2, 5]\nprint(bisect_left(xs, 2), bisect_right(xs, 2))", ["1 3", "1 4", "2 4", "1 2"], "1 4",
  "bisect_left is the first position of 2 (index 1); bisect_right is just after the last 2 (index 4).", "left = count of smaller, right = count of ≤.", "Thinking bisect_right returns the last index of the value.");
out("cp-std-03", 1, 30, "from itertools import groupby\nprint([k for k, _ in groupby(\"aabbaa\")])", ["['a', 'b']", "['a', 'b', 'a']", "['a', 'a', 'b', 'b', 'a', 'a']", "['aa', 'bb', 'aa']"], "['a', 'b', 'a']",
  "groupby starts a new group whenever the value changes.", "Consecutive runs only.", "Expecting all a's to merge.");
out("cp-std-04", 2, 45, "from collections import deque\nd = deque([1, 2, 3, 4])\nd.rotate(1)\nd.appendleft(0)\nprint(list(d))", ["[0, 4, 1, 2, 3]", "[0, 2, 3, 4, 1]", "[4, 1, 2, 3, 0]", "[0, 1, 2, 3, 4]"], "[0, 4, 1, 2, 3]",
  "rotate(1) moves the last item to the front: [4, 1, 2, 3]; then 0 is added at the left.", "Positive rotate shifts right.", "Rotating left instead.");
out("cp-std-05", 2, 30, "from collections import Counter\nprint(Counter(a=3, b=1) - Counter(a=1, b=2))", ["Counter({'a': 2, 'b': -1})", "Counter({'a': 2})", "Counter({'a': 2, 'b': 0})", "{'a': 2}"], "Counter({'a': 2})",
  "Counter subtraction drops zero and negative counts.", "− keeps only positive results.", "Expecting negative counts (that is what .subtract() does).");
out("cp-std-06", 2, 45, "from functools import lru_cache\ncalls = 0\n@lru_cache(maxsize=None)\ndef fib(n):\n    global calls\n    calls += 1\n    return n if n < 2 else fib(n - 1) + fib(n - 2)\nfib(20)\nprint(calls)", ["21", "20", "10946", "6765"], "21",
  "Each n from 0 to 20 is computed once; every repeat is a cache hit.", "Memoised recursion = one call per distinct state.", "Counting the calls of the uncached recursion.");
Card_("cp-std-c1", "bisect_left vs bisect_right", "Count of items < x vs ≤ x in a sorted list.");
Card_("cp-std-c2", "Max-heap in Python", "Push negated keys into heapq.");
Card_("cp-std-c3", "itertools.groupby", "Groups consecutive equal items; sort first to group all.");

// ───────────────────────── P2 · Permutations and combinations ─────────────────────────
const pnc = (id: string, title: string, summary: string, notes: string, interview: InterviewQ[]) =>
  T(id, "aptitude", "Permutations and combinations", title, summary, notes, {
    resources: [
      R("Video: permutation and combination shortcuts (CareerRide)", "https://www.youtube.com/watch?v=ETiRE7N7pEI", "Watch first"),
      R("Video: permutations and combinations tutorial (The Organic Chemistry Tutor)", "https://www.youtube.com/watch?v=XJnIdRXUi7A", "When order matters and when it does not"),
      R("IndiaBIX: permutation and combination", "https://www.indiabix.com/aptitude/permutation-and-combination/", "OA-style practice"),
    ],
    interview,
  });

pnc(PC.arrange, "Arrangements with restrictions", "Order matters: repeated letters, blocks for 'together', the complement for 'never together', and digit problems.", `
**Counting principle.** If one choice can be made in m ways and the next in n ways, together they can be made in m × n ways.

**Permutations.** Arranging all n distinct items: n!. Arranging r of n: nPr = n!/(n − r)!.

**Repeated items.** n items where one kind repeats a times and another b times: n!/(a! b!).

**Must be together.** Glue them into one block: arrange the blocks, then multiply by the arrangements inside the block.

**Never together.** Use the complement: total − together. For two people in a row of n: n! − 2(n − 1)!.

**Fixed positions.** Fill the restricted positions first, then the rest.

**Numbers from digits.** The first digit cannot be 0. For even numbers, split into "last digit 0" and "last digit another even digit"; in the second case the first digit has one fewer option.

**Worked example 1.** BANANA: 6!/(3! × 2!) = 720/12 = 60.

**Worked example 2.** 5 people in a row with A and B together: 4! × 2 = 48. Never together: 120 − 48 = 72.

**Worked example 3.** Arrange LEADER so the vowels (E, A, E) are together: block + L, D, R = 4 items with no repeats → 4! = 24; inside the block 3!/2! = 3. Total 72.

**Worked example 4.** 3-digit numbers from 0, 1, 2, 3, 4 without repetition: first digit 4 ways, then 4 × 3 → 48. Even ones: ending in 0 → 4 × 3 = 12; ending in 2 or 4 → 2 × 3 × 3 = 18. Total 30.
`, [
  iq("How do you count arrangements where two particular people must not sit together?", "Count all arrangements and subtract those where they are together. For a row of n, total n!, together 2 × (n − 1)! (treat the pair as one block, times 2 for their order), so n! − 2(n − 1)!. Counting 'apart' directly is error-prone.", ["Uses the complement", "Block method for together", "Includes the ×2 inside the block"]),
  iq("Why do you divide by factorials for repeated letters?", "Swapping two identical letters gives the same word, so n! counts each distinct word once for every way of permuting the identical letters among themselves: a! for a letter repeated a times. Dividing removes those duplicates.", ["Identical swaps produce the same arrangement", "Each word counted a! times", "Divide to remove duplicates"]),
  iq("How do you count 4-digit even numbers with distinct digits from 0–9?", "Split by last digit. Last digit 0: the other three places get 9 × 8 × 7 = 504. Last digit 2, 4, 6 or 8 (4 ways): the first digit cannot be 0 or the last digit, so 8 ways, then 8 × 7 for the middle: 4 × 8 × 8 × 7 = 1792. Total 2296.", ["Splits on whether the last digit is 0", "Handles the leading-zero restriction", "Gets 2296"]),
]);
pnc(PC.select, "Selections and distributions", "Order does not matter: combinations, at-least conditions, identical items into boxes, and geometric counts.", `
**Combinations.** Choosing r of n when order does not matter: nCr = n!/(r!(n − r)!). nCr = nC(n − r).

**At least / at most.** Split into exact cases and add, or take the complement: "at least one woman" = all committees − all-men committees.

**Do not overcount.** Choosing "one woman first, then any others" counts the same committee several times.

**Any number of items.** From n distinct items, the number of non-empty selections is 2ⁿ − 1. From identical items (a of one kind, b of another …), it is (a + 1)(b + 1)… − 1.

**Distributing identical items (stars and bars).** n identical items into k distinct boxes: C(n + k − 1, k − 1). If every box gets at least one: C(n − 1, k − 1).

**Distinct items into boxes.** Each of n distinct items can go to any of k boxes: kⁿ.

**Geometry.** Lines through n points (no three collinear): nC2. Triangles: nC3. Diagonals of an n-gon: nC2 − n = n(n − 3)/2. Handshakes among n people: nC2.

**Worked example 1.** Committee of 4 from 6 men and 4 women with at least 2 women: C(4,2)C(6,2) + C(4,3)C(6,1) + C(4,4) = 90 + 24 + 1 = 115.

**Worked example 2.** 10 identical sweets among 3 children, each at least one: C(9, 2) = 36.

**Worked example 3.** A decagon has 10 × 7 / 2 = 35 diagonals.

**Worked example 4.** 3 identical red balls and 2 identical blue balls, take at least one: 4 × 3 − 1 = 11.
`, [
  iq("How do you decide between a permutation and a combination?", "Ask whether swapping two chosen items gives a different outcome. Picking a captain and vice-captain: yes, a permutation. Picking a 2-person team: no, a combination. nPr = nCr × r! makes the link explicit.", ["Does order matter?", "Concrete contrasting example", "nPr = nCr × r!"]),
  iq("Explain stars and bars.", "To split n identical items into k boxes, line up the n items and place k − 1 dividers among them; every arrangement of items and dividers is one distribution. That is choosing positions for k − 1 dividers among n + k − 1 slots: C(n + k − 1, k − 1). If every box must be non-empty, give each box one item first, leaving n − k, giving C(n − 1, k − 1).", ["Items and dividers picture", "C(n + k − 1, k − 1)", "Non-empty variant C(n − 1, k − 1)"]),
  iq("Why is 'pick one woman, then any 3 others' wrong for 'committee of 4 with at least one woman'?", "A committee with two women is counted twice, once for each woman picked 'first'. Use exact cases (exactly 1, 2, 3, 4 women) or the complement: C(total, 4) − C(men, 4).", ["Identifies double counting", "Exact cases or complement"]),
]);
pnc(PC.circle, "Circular arrangements, necklaces and derangements", "Rotations, reflections and 'nothing in its own place'.", `
**Round table.** Rotations of the same seating are identical, so fix one person: (n − 1)!.

**Clockwise = anticlockwise?** For a necklace or garland, which can be turned over, divide by 2: (n − 1)!/2 for n ≥ 3.

**Together / apart at a table.** Together: treat the pair as a block → (n − 2)! × 2. Apart: (n − 1)! − 2(n − 2)!.

**Derangements** (no item in its original place): D(n) = n! (1 − 1/1! + 1/2! − 1/3! + … ± 1/n!). Also D(n) = (n − 1)(D(n − 1) + D(n − 2)). Values: D(1) = 0, D(2) = 1, D(3) = 2, D(4) = 9, D(5) = 44, D(6) = 265, D(7) = 1854. D(n) ≈ n!/e.

**Exactly k in the right place.** Choose the k fixed items, derange the rest: C(n, k) × D(n − k).

**Worked example 1.** 6 people at a round table: 5! = 120.

**Worked example 2.** 8 people at a round table, two of them never together: 7! − 2 × 6! = 5040 − 1440 = 3600.

**Worked example 3.** 7 distinct beads on a necklace: 6!/2 = 360.

**Worked example 4.** 5 letters, exactly 2 in the correct envelope: C(5, 2) × D(3) = 10 × 2 = 20.
`, [
  iq("Why are there (n − 1)! ways to seat n people at a round table rather than n!?", "Rotating everyone one seat gives the same seating, and each seating has n rotations. n!/n = (n − 1)!. Equivalently, fix one person's seat as the reference and arrange the other n − 1.", ["Rotations are equivalent", "n!/n", "Fix one person"]),
  iq("What is a derangement, and how do you count D(4)?", "A permutation where no item stays in its original position. By inclusion–exclusion, D(n) = n! Σ (−1)^k / k!; D(4) = 24 − 24 + 12 − 4 + 1 = 9. The recurrence D(n) = (n − 1)(D(n − 1) + D(n − 2)) gives 3 × (2 + 1) = 9 too.", ["Defines it", "Inclusion–exclusion or recurrence", "Gets 9"]),
  iq("Why does a necklace have half as many arrangements as a round table?", "A necklace can be flipped over, so each arrangement equals its mirror image (clockwise and anticlockwise orders are the same). That pairs up the (n − 1)! table arrangements, giving (n − 1)!/2 for n ≥ 3.", ["Flipping identifies mirror images", "(n − 1)!/2", "n ≥ 3 condition"]),
]);
Card_("p2-pnc-c1", "Never together (row of n)", "n! − 2(n − 1)!.", PC.arrange);
Card_("p2-pnc-c2", "n identical items into k boxes, each ≥ 1", "C(n − 1, k − 1).", PC.select);
Card_("p2-pnc-c3", "Derangements D(3), D(4), D(5)", "2, 9, 44.", PC.circle);
Card_("p2-pnc-c4", "Round table vs necklace", "(n − 1)! vs (n − 1)!/2.", PC.circle);

for (const g of PNC_ITEMS) {
  Item({
    id: g.id, topic: g.topic, d: g.d, secs: g.secs, prompt: g.prompt, answer: g.answer,
    ...(g.tol !== undefined ? { tol: g.tol } : {}),
    explain: g.explain, fast: g.fast, trap: g.trap,
    src: "Practice: generated from a standard OA pattern, answer recounted by brute force in Python (Nov 2026)",
    check: { py: g.py },
  });
}
