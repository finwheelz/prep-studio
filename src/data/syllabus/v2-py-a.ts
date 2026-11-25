/**
 * v2 Python, part A: Core Python. Fixed ids (py2-*); every answer is recomputed in Pyodide.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("python");
const M = "Core Python";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  types: src("Python docs: built-in types (numbers, truth values, sequences)", "https://docs.python.org/3/library/stdtypes.html"),
  ds: src("Python tutorial: data structures (lists, tuples, sets, dicts, comprehensions)", "https://docs.python.org/3/tutorial/datastructures.html"),
  model: src("Python reference: data model (identity, mutability)", "https://docs.python.org/3/reference/datamodel.html"),
  copy: src("Python docs: copy (shallow and deep copies)", "https://docs.python.org/3/library/copy.html"),
  flow: src("Python tutorial: more control flow tools", "https://docs.python.org/3/tutorial/controlflow.html"),
  sort: src("Python HOWTO: sorting techniques", "https://docs.python.org/3/howto/sorting.html"),
};

// ───────────────────────── Numbers and operators ─────────────────────────

L("py2-numbers", M, "Numbers, operators and precision", "int, float, floor division, modulo with negatives, rounding and float error.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "`-7 // 2` is -4, not -3, and `0.1 + 0.2 == 0.3` is False. Why, and how do you avoid the bug in an OA?",
  intuition: `
**The situation.** OA questions love arithmetic edge cases: averages that come out as floats, percentages that don't sum to 100, negative remainders in "rotate the array" problems.

**The idea.** Python has three numeric types you meet daily:

- **int** has unlimited precision: \`2**100\` is exact. No overflow.
- **float** is a 64-bit binary float: about 15–16 significant digits, and many decimals (0.1, 0.2) can't be stored exactly.
- **bool** is a subclass of int: \`True + True == 2\`, which is why \`sum(mask)\` counts \`True\` values.

Division comes in two flavours: \`/\` always returns a float; \`//\` floors (rounds towards minus infinity), and \`%\` is defined so that \`a == (a // b) * b + a % b\` always holds. With a positive divisor the remainder is never negative, which is exactly what circular indexing needs.
`,
  maths: `
**In one breath.** \`/\` → float, \`//\` → floor, \`%\` → sign of the divisor, \`round\` → banker's rounding, compare floats with a tolerance.

\`\`\`python
print(7 / 2, 7 // 2, 7 % 2)     # 3.5 3 1
print(-7 // 2, -7 % 2)          # -4 1   (floor, not truncate)
print(int(-3.5))                # -3     (int() truncates towards 0)
print(divmod(17, 5))            # (3, 2)
print(2 ** 10, 2 ** -1)         # 1024 0.5
print(round(2.5), round(3.5))   # 2 4    (round half to even)
print(round(3.14159, 2))        # 3.14
print(0.1 + 0.2 == 0.3)         # False
import math
print(math.isclose(0.1 + 0.2, 0.3))  # True
print(True + True, sum([True, False, True]))  # 2 2
\`\`\`

**Circular index.** \`(i + k) % n\` stays in \`[0, n)\` even when \`i + k\` is negative: \`(-1) % 5 == 4\`.

**Precision tools.** \`math.isclose(a, b, rel_tol=1e-9)\` for comparisons; \`decimal.Decimal("0.1")\` for money; \`fractions.Fraction(1, 3)\` for exact rationals; \`math.fsum\` for accurate float sums.

**Integer tricks.** \`a // b\` with ints stays exact for huge numbers; \`int(a / b)\` goes through a float and can lose digits past 2⁵³. Ceiling division without floats: \`-(-a // b)\`.

| Operator | 7, 2 | -7, 2 | 7, -2 |
|---|---|---|---|
| \`/\` | 3.5 | -3.5 | -3.5 |
| \`//\` | 3 | -4 | -4 |
| \`%\` | 1 | 1 | -1 |
`,
  practice: `
**In OAs.** Use \`//\` for "how many full groups", \`%\` for "what's left / wrap around", \`-(-a // b)\` for "how many boxes needed". Print averages with \`round(x, 2)\` or an f-string \`f"{x:.2f}"\` only at the end, never round intermediate values.

**Money.** Store paise as integers or use \`Decimal\`. Never compare floats with \`==\`.

**Where to go next.** References and mutability: why \`b = a\` doesn't copy a list.
`,
  traps: [
    { trap: "`-7 // 2` is -3, like in C or Java.", why: "Python floors towards minus infinity, so it's -4, and `-7 % 2` is 1. `int(-7 / 2)` truncates to -3 if that's what you want." },
    { trap: "`round(2.5)` is 3.", why: "Python rounds halves to the even neighbour: `round(2.5) == 2`, `round(3.5) == 4`. Use `Decimal.quantize(..., ROUND_HALF_UP)` if a spec demands school rounding." },
    { trap: "Floats are fine for equality checks if the numbers look simple.", why: "0.1, 0.2 and 0.3 are all approximations in binary. Use `math.isclose` or compare rounded values." },
  ],
  say: {
    prompt: "Explain the difference between `/`, `//` and `%` in Python, including negative numbers, and how you'd compare two floats.",
    secs: 45,
    check: ["`/` always returns a float", "`//` floors towards minus infinity (so -7 // 2 is -4)", "`%` has the sign of the divisor; a == (a // b) * b + a % b", "Floats are binary approximations; compare with math.isclose or a tolerance", "Mentioned Decimal / integers for money"],
    followups: [
      { q: "How do you do ceiling division with integers only?", a: "`-(-a // b)`, or `(a + b - 1) // b` for positive numbers. Both avoid float rounding for large values." },
      { q: "Why is `True + True` equal to 2?", a: "`bool` is a subclass of `int`, with `True == 1` and `False == 0`. That's why `sum(flags)` counts the true values." },
      { q: "What does `round(2.675, 2)` return and why?", a: "2.67, because 2.675 is stored as 2.67499999… in binary, so it's below the halfway point." },
    ],
    answer: `\`/\` is true division and always returns a float. \`//\` is floor division: it rounds towards minus infinity, so \`-7 // 2\` is -4, not -3. \`%\` is the matching remainder, defined so that \`a == (a // b) * b + a % b\`; with a positive divisor it's never negative, which makes it handy for wrap-around indexing.

Floats are binary approximations, so \`0.1 + 0.2 == 0.3\` is False. I compare with \`math.isclose\` or a tolerance, and for money I keep integer paise or use \`Decimal\`.`,
    avoid: ["\u201c// truncates towards zero\u201d", "Comparing floats with =="],
  },
  terms: [["Floor division", "a // b: largest integer ≤ a / b."], ["Banker's rounding", "round() sends exact halves to the even neighbour."], ["math.isclose", "Tolerance-based float comparison."]],
  sources: [S.types],
});
Q({ id: "py2-num-1", d: 1, secs: 30, prompt: "What does `-7 // 2` evaluate to?", answer: -4, tol: 0.5, explain: "Floor division rounds towards minus infinity: -3.5 → -4.", trap: "Answering -3 (truncation, as in C/Java).", py: "answer = -7 // 2" });
Q({ id: "py2-num-2", d: 1, secs: 30, prompt: "What does `-7 % 3` evaluate to?", answer: 2, tol: 0.5, explain: "-7 // 3 = -3, and -7 − (−3 × 3) = 2. The remainder takes the sign of the divisor.", py: "answer = -7 % 3" });
Q({ id: "py2-num-3", d: 1, secs: 30, prompt: "What does `round(2.5) + round(3.5)` evaluate to?", answer: 6, tol: 0.5, explain: "round(2.5) = 2 and round(3.5) = 4 (round half to even).", py: "answer = round(2.5) + round(3.5)" });
Q({ id: "py2-num-4", d: 2, secs: 45, prompt: "You need boxes of 12 for 100 items. Which expression gives 9 using only integer arithmetic?", options: ["`100 // 12`", "`-(-100 // 12)`", "`100 % 12`", "`int(100 / 12)`"], answer: 1, explain: "-(-100 // 12) = -(-9) = 9: ceiling division. `100 // 12` is 8.", py: "opts = [100 // 12, -(-100 // 12), 100 % 12, int(100 / 12)]\nanswer = opts.index(9)" });
Q({ id: "py2-num-5", d: 1, secs: 20, prompt: "What does `sum([True, True, False, True])` return?", answer: 3, tol: 0.5, explain: "bool is a subclass of int; True counts as 1.", py: "answer = sum([True, True, False, True])" });
C("py2-num-c1", "// and % with negatives", "-7 // 2 = -4, -7 % 2 = 1. Floor division; remainder has the divisor's sign.");
C("py2-num-c2", "Ceiling division without floats", "-(-a // b)");

// ───────────────────────── References, mutability, copying ─────────────────────────

L("py2-references", M, "Names, references, mutability and copying", "Assignment binds names to objects; shallow vs deep copies; is vs ==.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "You copy a list of lists, change the copy, and the original changes too. What exactly got copied?",
  intuition: `
**The situation.** A grid in a matrix problem is built with \`[[0] * 3] * 3\`. Setting one cell changes a whole column. This is the most common silent bug in Python coding rounds.

**The idea.** A Python variable is a **name tag** attached to an object, not a box holding a value. \`b = a\` attaches a second tag to the same object; nothing is copied.

- **Immutable** objects (int, float, str, tuple, frozenset) can't change, so sharing them is harmless: "changing" them makes a new object.
- **Mutable** objects (list, dict, set, most class instances) can change in place, so every name pointing at them sees the change.

Copies come in two depths. A **shallow copy** makes a new outer container but reuses the same inner objects. A **deep copy** recursively copies everything.
`,
  maths: `
**In one breath.** \`=\` never copies; \`list(a)\`, \`a[:]\`, \`a.copy()\` and \`copy.copy\` are shallow; \`copy.deepcopy\` is deep; \`is\` compares identity, \`==\` compares value.

\`\`\`python
a = [1, 2, 3]
b = a            # same object
b.append(4)
print(a)         # [1, 2, 3, 4]
print(a is b)    # True

grid = [[0] * 3] * 3      # three references to ONE row
grid[0][0] = 1
print(grid)               # [[1, 0, 0], [1, 0, 0], [1, 0, 0]]
grid = [[0] * 3 for _ in range(3)]   # three separate rows

import copy
x = [[1, 2], [3, 4]]
s = x[:]                  # shallow
d = copy.deepcopy(x)      # deep
x[0].append(99)
print(s[0], d[0])         # [1, 2, 99] [1, 2]

print([1, 2] == [1, 2], [1, 2] is [1, 2])  # True False
\`\`\`

**Function arguments** are passed by object reference: a function can mutate a list you pass in, but rebinding the parameter (\`lst = []\`) doesn't affect the caller.

**Augmented assignment.** \`a += [5]\` mutates a list in place (same object); \`a = a + [5]\` builds a new list. For tuples and ints, \`+=\` always rebinds.

| Operation | New outer object? | Inner objects shared? |
|---|---|---|
| \`b = a\` | no | yes |
| \`a[:]\`, \`list(a)\`, \`a.copy()\` | yes | yes |
| \`copy.deepcopy(a)\` | yes | no |
`,
  practice: `
**Rules for interviews.**

- Build 2-D grids with a comprehension: \`[[0] * cols for _ in range(rows)]\`.
- When a function must not modify its input, copy at the top (\`arr = arr[:]\`) or return a new object.
- Use \`is\` only for singletons: \`x is None\`. Use \`==\` for values (\`is\` on small ints and short strings can appear to work by accident because of caching).
- In backtracking, append a copy of the current path (\`res.append(path[:])\`), not \`path\` itself.

**pandas link.** The same idea explains views vs copies in NumPy/pandas (\`SettingWithCopyWarning\`), covered in those modules.
`,
  traps: [
    { trap: "`[[0] * 3] * 3` creates a 3×3 grid of independent zeros.", why: "The outer `* 3` repeats a reference to one inner list. Changing `grid[0][0]` changes every row. Use a comprehension." },
    { trap: "`a[:]` gives a fully independent copy.", why: "It's shallow: nested lists or dicts are still shared. Use `copy.deepcopy` for nested mutable data." },
    { trap: "In backtracking, `res.append(path)` stores the current path.", why: "It stores a reference to the one list you keep mutating; at the end every entry is the same (often empty) list. Append `path[:]`." },
  ],
  say: {
    prompt: "What happens in memory when you write `b = a` for a list, and how do shallow and deep copies differ?",
    secs: 45,
    check: ["Assignment binds another name to the same object; no copy", "Mutable vs immutable objects", "Shallow copy: new container, same inner objects", "Deep copy recursively copies nested objects", "`is` = identity, `==` = equality; `is` only for None/singletons"],
    followups: [
      { q: "Why does `def f(x=[])` accumulate values across calls?", a: "Default values are evaluated once, when the function is defined, so every call shares the same list. Use `x=None` and create the list inside." },
      { q: "Is Python pass-by-value or pass-by-reference?", a: "Neither exactly: it passes object references by value. A function can mutate a mutable argument, but rebinding the parameter name doesn't affect the caller." },
      { q: "What's the difference between `a += [1]` and `a = a + [1]` for lists?", a: "`+=` calls `extend` and mutates the same list (other names see it); `a + [1]` creates a new list and rebinds `a`." },
    ],
    answer: `\`b = a\` doesn't copy anything; it attaches a second name to the same list object, so a change through \`b\` is visible through \`a\`. That only matters for mutable objects like lists, dicts and sets; ints, strings and tuples can't change in place.

A shallow copy (\`a[:]\`, \`list(a)\`, \`copy.copy\`) creates a new outer list but reuses the same elements, so nested lists are still shared. \`copy.deepcopy\` recursively copies everything. I use \`is\` only for identity checks like \`x is None\` and \`==\` for comparing values.`,
    avoid: ["\u201cPython copies lists on assignment\u201d", "Using `is` to compare strings or numbers"],
  },
  terms: [["Identity", "Which object a name refers to; compared with `is`."], ["Shallow copy", "New container, same element objects."], ["Deep copy", "Recursive copy of all nested objects."]],
  sources: [S.model, S.copy],
});
Q({ id: "py2-ref-1", d: 1, secs: 45, prompt: "```python\ngrid = [[0] * 3] * 3\ngrid[0][0] = 1\nprint(sum(map(sum, grid)))\n```\nWhat is printed?", answer: 3, tol: 0.5, explain: "All three rows are the same list, so each 'row' has a 1: total 3.", py: "grid = [[0] * 3] * 3\ngrid[0][0] = 1\nanswer = sum(map(sum, grid))" });
Q({ id: "py2-ref-2", d: 2, secs: 60, prompt: "```python\nimport copy\nx = [[1, 2], [3]]\ns = x[:]\nd = copy.deepcopy(x)\nx[0].append(9)\nx.append([4])\nprint(len(s[0]) + len(s) + len(d[0]) + len(d))\n```\nWhat is printed?", answer: 9, tol: 0.5, explain: "s shares inner lists: s[0] has 3 items, but s itself still has 2 rows. d is independent: d[0] has 2, d has 2. 3 + 2 + 2 + 2 = 9.", py: "import copy\nx = [[1, 2], [3]]\ns = x[:]\nd = copy.deepcopy(x)\nx[0].append(9)\nx.append([4])\nanswer = len(s[0]) + len(s) + len(d[0]) + len(d)" });
Q({ id: "py2-ref-3", d: 2, secs: 45, prompt: "```python\ndef f(lst):\n    lst.append(1)\n    lst = [0]\n    lst.append(2)\na = []\nf(a); f(a)\nprint(len(a))\n```\nWhat is printed?", answer: 2, tol: 0.5, explain: "The first append mutates the caller's list; after rebinding, appends go to a new local list. Two calls → 2.", py: "def f(lst):\n    lst.append(1)\n    lst = [0]\n    lst.append(2)\na = []\nf(a); f(a)\nanswer = len(a)" });
Q({ id: "py2-ref-4", d: 1, secs: 30, prompt: "```python\na = [1, 2]\nb = a\na += [3]\nc = a\na = a + [4]\nprint(len(b), len(c), len(a))\n```\nWhat is `len(b)`?", answer: 3, tol: 0.5, explain: "`+=` mutated the shared list (b sees 3 items); `a = a + [4]` created a new list only `a` points to.", py: "a = [1, 2]\nb = a\na += [3]\nc = a\na = a + [4]\nanswer = len(b)" });
C("py2-ref-c1", "2-D grid safely", "[[0] * cols for _ in range(rows)], never [[0] * cols] * rows.");
C("py2-ref-c2", "Shallow vs deep copy", "a[:] / list(a) / copy.copy: new outer only. copy.deepcopy: everything.");

// ───────────────────────── Truthiness and control flow ─────────────────────────

L("py2-control-flow", M, "Truthiness, conditions and loops", "Falsy values, short-circuiting, for/else, enumerate/zip, range and the walrus operator.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "`if items:` and `if len(items) > 0:` do the same thing. When does `if x:` give a different answer from `if x is not None:`?",
  intuition: `
**The situation.** Interviewers read your loops before they read your algorithm. Idiomatic control flow (enumerate, zip, early returns, \`for ... else\`) makes code shorter and bugs rarer.

**The idea.** Every object has a truth value. **Falsy:** \`None\`, \`False\`, zero of any numeric type, and empty containers (\`""\`, \`[]\`, \`{}\`, \`set()\`, \`range(0)\`). Everything else is truthy.

\`and\` / \`or\` **short-circuit** and return one of their operands, not necessarily a bool: \`x or default\` returns \`x\` if it's truthy, else \`default\`. That's handy, but wrong when 0 or "" are valid values.

Loops iterate over items, not indices. Use \`enumerate\` when you need the index, \`zip\` to walk sequences together, and \`for ... else\` for "searched and didn't find".
`,
  maths: `
**In one breath.** Falsy = None, False, 0, empty; \`and\`/\`or\` return an operand; loop \`else\` runs only when no \`break\` happened.

\`\`\`python
print(bool([]), bool([0]), bool(""), bool(" "))   # False True False True
name = "" or "anonymous"                           # 'anonymous'
count = 0 or 10                                    # 10  (bug if 0 was valid!)

for i, ch in enumerate("abc", start=1):
    print(i, ch)                                   # 1 a / 2 b / 3 c

for a, b in zip([1, 2, 3], "xy"):                  # stops at the shorter
    print(a, b)                                    # 1 x / 2 y

for n in [9, 15, 21]:
    if n % 2 == 0:
        print("found even"); break
else:
    print("no even number")                        # runs: no break

print(list(range(10, 0, -3)))                      # [10, 7, 4, 1]

import re
if (m := re.search(r"\\d+", "order 42")):          # walrus: assign + test
    print(m.group())                               # 42

x = 5
print(1 < x < 10)                                  # True (chained)
\`\`\`

**Conditional expression.** \`label = "even" if n % 2 == 0 else "odd"\`.

**match (3.10+).** Structural pattern matching on values and shapes; useful for parsing commands, rarely needed in OAs.
`,
  practice: `
**Idioms that read well.**

- \`if not items: return []\` as an early exit.
- \`any(x < 0 for x in nums)\`, \`all(...)\` instead of flag variables.
- \`for i in range(len(a) - 1)\` when comparing neighbours, or \`for x, y in zip(a, a[1:])\`.
- Never modify a list while iterating over it; iterate over a copy or build a new list.

**When truthiness bites.** \`if value:\` treats 0, 0.0 and "" as missing. For optional numbers write \`if value is not None:\`.
`,
  traps: [
    { trap: "`timeout = user_timeout or 30` keeps the user's value.", why: "If the user sets 0, `0 or 30` gives 30. Use `30 if user_timeout is None else user_timeout`." },
    { trap: "The `else` after a `for` runs when the loop body has an if that fails.", why: "Loop `else` runs when the loop finishes without `break`, regardless of ifs inside." },
    { trap: "`zip` raises an error on sequences of different lengths.", why: "It silently stops at the shortest. Use `zip(a, b, strict=True)` (3.10+) or `itertools.zip_longest`." },
  ],
  say: {
    prompt: "What values are falsy in Python, and what does `x or y` actually return?",
    secs: 30,
    check: ["None, False, numeric zero, empty containers/strings", "`or` returns the first truthy operand, else the last; `and` returns the first falsy, else the last", "Short-circuit evaluation", "Pitfall: 0 or '' as valid values; use `is None`", "Mentioned enumerate/zip/for-else idioms or any/all"],
    followups: [
      { q: "When does a `for` loop's `else` block run?", a: "When the loop completes without hitting `break`, including when the iterable is empty." },
      { q: "How do you iterate over two lists and know which is longer was truncated?", a: "`zip(a, b, strict=True)` raises ValueError on unequal lengths; `itertools.zip_longest(a, b, fillvalue=None)` pads the shorter." },
      { q: "What does `[] and 1/0` do?", a: "Returns `[]` without evaluating `1/0`, because `and` short-circuits on the falsy left operand." },
    ],
    answer: `Falsy values are None, False, zero of any numeric type and empty containers or strings; everything else is truthy. \`and\` and \`or\` short-circuit and return one of their operands: \`x or y\` gives \`x\` if it's truthy, otherwise \`y\`, which is why \`name or "anonymous"\` works as a default. The catch is that 0 and "" are falsy too, so for optional numbers I test \`is None\` explicitly.`,
    avoid: ["\u201c`or` always returns True or False\u201d", "Using `if x:` when 0 is a legitimate value"],
  },
  terms: [["Falsy", "Evaluates to False in a boolean context."], ["Short-circuit", "Stop evaluating once the result is known."], ["Walrus `:=`", "Assignment expression: assign and use in one expression."]],
  sources: [S.types, S.flow],
});
Q({ id: "py2-cf-1", d: 1, secs: 30, prompt: "How many of these are truthy: `0`, `\"0\"`, `[]`, `[[]]`, `0.0`, `None`, `\" \"`?", answer: 3, tol: 0.5, explain: "\"0\", [[]] and \" \" are non-empty, so truthy.", py: "answer = sum(bool(v) for v in [0, '0', [], [[]], 0.0, None, ' '])" });
Q({ id: "py2-cf-2", d: 2, secs: 45, prompt: "```python\ndef first_neg(nums):\n    for i, x in enumerate(nums):\n        if x < 0:\n            break\n    else:\n        return -1\n    return i\nprint(first_neg([3, 5, -2, 7]) + first_neg([1, 2]))\n```\nWhat is printed?", answer: 1, tol: 0.5, explain: "First call breaks at index 2; second runs the else and returns -1. 2 + (−1) = 1.", py: "def first_neg(nums):\n    for i, x in enumerate(nums):\n        if x < 0:\n            break\n    else:\n        return -1\n    return i\nanswer = first_neg([3, 5, -2, 7]) + first_neg([1, 2])" });
Q({ id: "py2-cf-3", d: 1, secs: 30, prompt: "What does `len(list(zip(range(5), 'abc', [1, 2, 3, 4])))` return?", answer: 3, tol: 0.5, explain: "zip stops at the shortest input ('abc').", py: "answer = len(list(zip(range(5), 'abc', [1, 2, 3, 4])))" });
Q({ id: "py2-cf-4", d: 1, secs: 30, prompt: "What does `0 or [] or 5 or 7` evaluate to?", answer: 5, tol: 0.5, explain: "`or` returns the first truthy operand.", py: "answer = 0 or [] or 5 or 7" });
Q({ id: "py2-cf-5", d: 1, secs: 30, prompt: "How many numbers does `range(10, 0, -3)` produce?", answer: 4, tol: 0.5, explain: "10, 7, 4, 1.", py: "answer = len(range(10, 0, -3))" });
C("py2-cf-c1", "Falsy values", "None, False, 0, 0.0, '', [], {}, set(), range(0).");
C("py2-cf-c2", "for … else", "else runs only if the loop wasn't broken out of.");

// ───────────────────────── Lists ─────────────────────────

L("py2-lists", M, "Lists: operations and their costs", "Indexing, slicing, append vs insert, and the Big-O of every common list method.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "Your solution calls `lst.pop(0)` inside a loop over 10⁵ items and times out. What's the complexity, and what's the fix?",
  intuition: `
**The situation.** Lists are the default container in coding rounds. Knowing which operations are O(1) and which are O(n) is the difference between passing and timing out.

**The idea.** A Python list is a **dynamic array** of references: elements sit in one contiguous block.

- Reading or writing \`lst[i]\` is O(1): jump straight to slot i.
- \`append\` and \`pop()\` at the end are O(1) amortised: occasionally the array is resized, but on average it's constant.
- Anything at the front or middle (\`insert(0, x)\`, \`pop(0)\`, \`remove(x)\`, \`del lst[i]\`) shifts every later element: O(n).
- \`x in lst\` scans: O(n). If you need membership tests, use a set.
`,
  maths: `
**In one breath.** Index/append/pop-end O(1); insert/pop-front/remove/in O(n); sort O(n log n); slicing copies O(k).

\`\`\`python
a = [5, 3, 8, 1]
a.append(7)          # [5, 3, 8, 1, 7]
a.extend([2, 2])     # add many
a.insert(0, 9)       # O(n) shift
last = a.pop()       # 2, O(1)
first = a.pop(0)     # 9, O(n)
a.remove(2)          # removes first 2, O(n)
print(a.index(8), a.count(2))   # 2 0
print(a[-1], a[1:3], a[::-1])   # 7 [3, 8] [7, 1, 8, 3, 5]
nums = [4, 1, 3]
print(sorted(nums), nums)       # [1, 3, 4] [4, 1, 3]
print(nums.sort())              # None! sort() is in place
\`\`\`

| Operation | Cost |
|---|---|
| \`a[i]\`, \`a[i] = x\`, \`len(a)\` | O(1) |
| \`append\`, \`pop()\` | O(1) amortised |
| \`insert(i, x)\`, \`pop(i)\`, \`del a[i]\`, \`remove(x)\` | O(n) |
| \`x in a\`, \`a.index(x)\`, \`a.count(x)\`, \`min\`, \`max\`, \`sum\` | O(n) |
| \`a[i:j]\` | O(j − i) (makes a copy) |
| \`a.sort()\`, \`sorted(a)\` | O(n log n) |
| \`a + b\` | O(len(a) + len(b)) |

**Queues.** Use \`collections.deque\` for O(1) \`popleft\`/\`appendleft\`. **Stacks.** A list with append/pop is ideal.

**Building strings or lists in loops.** Append to a list and \`"".join(parts)\` at the end; repeated \`s += piece\` on strings can be quadratic.
`,
  practice: `
**Patterns.**

- Two-pointer and sliding-window problems index into lists: O(1) access makes them O(n).
- Prefix sums: \`pre = [0]; for x in a: pre.append(pre[-1] + x)\`, then any range sum is \`pre[j] - pre[i]\`.
- Remove items by filtering: \`a = [x for x in a if keep(x)]\` (O(n)) rather than repeated \`remove\` (O(n²)).

**Methods returning None.** \`sort\`, \`reverse\`, \`append\`, \`extend\`, \`insert\`, \`remove\` all modify in place and return None; \`x = a.sort()\` is a classic bug.
`,
  traps: [
    { trap: "`lst.pop(0)` is O(1) like `pop()`.", why: "Removing from the front shifts every remaining element: O(n). In a loop that's O(n²). Use `collections.deque.popleft()`." },
    { trap: "`a = a.sort()` sorts a.", why: "`sort()` sorts in place and returns None, so `a` becomes None. Use `a.sort()` alone or `a = sorted(a)`." },
    { trap: "Removing items while looping over the same list works.", why: "The iterator's index skips the element that slides into the removed slot. Build a new list or iterate over a copy." },
  ],
  say: {
    prompt: "What's the time complexity of common list operations, and when would you not use a list?",
    secs: 45,
    check: ["Dynamic array: index O(1), append/pop-end amortised O(1)", "Insert/pop at front or middle, remove, `in` are O(n)", "sort O(n log n); slicing copies", "deque for queues, set/dict for membership", "In-place methods return None"],
    followups: [
      { q: "Why is append amortised O(1) and not always O(1)?", a: "When capacity runs out, the list allocates a bigger block (over-allocating by a growth factor) and copies; spread over many appends, the copy cost averages to a constant per append." },
      { q: "How do you remove duplicates while keeping order?", a: "`list(dict.fromkeys(a))`: dicts keep insertion order and keys are unique. O(n)." },
      { q: "What does `a[::-1]` cost?", a: "O(n) time and memory: slicing creates a new list. `a.reverse()` reverses in place with O(1) extra memory." },
    ],
    answer: `A list is a dynamic array, so indexing and assignment are O(1), and append and pop from the end are amortised O(1) because resizing is occasional. Anything that shifts elements, like insert or pop at the front, del or remove, is O(n), and so is a membership test with \`in\`. Sorting is O(n log n) and slicing copies.

So I avoid lists for queues, using a deque, and for repeated membership checks, using a set or dict. I also remember that sort, append and reverse return None.`,
    avoid: ["\u201cpop(0) is constant time\u201d", "`x in list` inside a loop on large data"],
  },
  terms: [["Dynamic array", "Contiguous array that resizes by over-allocating."], ["Amortised O(1)", "Constant on average over many operations."], ["Prefix sum", "pre[i] = sum of the first i elements."]],
  sources: [S.ds, S.types],
});
Q({ id: "py2-list-1", d: 1, secs: 30, prompt: "```python\na = [4, 1, 3]\nb = a.sort()\n```\nWhat is `b`?", options: ["[1, 3, 4]", "[4, 1, 3]", "None", "An error is raised"], answer: 2, explain: "list.sort() sorts in place and returns None.", py: "a = [4, 1, 3]\nb = a.sort()\nanswer = 2 if b is None else 0" });
Q({ id: "py2-list-2", d: 1, secs: 30, prompt: "Which operation is O(1) amortised on a Python list?", options: ["`a.insert(0, x)`", "`a.pop(0)`", "`a.append(x)`", "`x in a`"], answer: 2, explain: "append at the end is amortised constant; the others shift or scan.", py: "answer = 2" });
Q({ id: "py2-list-3", d: 2, secs: 60, prompt: "```python\na = [1, 2, 2, 3, 2]\nfor x in a:\n    if x == 2:\n        a.remove(x)\nprint(a.count(2))\n```\nWhat is printed?", answer: 1, tol: 0.5, explain: "Removing during iteration skips elements; one 2 survives.", trap: "Expecting 0.", py: "a = [1, 2, 2, 3, 2]\nfor x in a:\n    if x == 2:\n        a.remove(x)\nanswer = a.count(2)" });
Q({ id: "py2-list-4", d: 2, secs: 45, prompt: "With prefix sums `pre = [0, 3, 4, 8, 9, 14]` for `a = [3, 1, 4, 1, 5]`, what is `pre[4] - pre[1]` (the sum of a[1:4])?", answer: 6, tol: 0.5, explain: "a[1] + a[2] + a[3] = 1 + 4 + 1 = 6.", py: "a = [3, 1, 4, 1, 5]\npre = [0]\nfor x in a:\n    pre.append(pre[-1] + x)\nanswer = pre[4] - pre[1]" });
Q({ id: "py2-list-5", d: 1, secs: 30, prompt: "What does `list(dict.fromkeys([3, 1, 3, 2, 1]))` return? Give its length.", answer: 3, tol: 0.5, explain: "[3, 1, 2]: duplicates removed, first-seen order kept.", py: "answer = len(list(dict.fromkeys([3, 1, 3, 2, 1])))" });
C("py2-list-c1", "List costs", "Index/append/pop() O(1). insert/pop(0)/remove/in O(n). sort O(n log n).");
C("py2-list-c2", "Ordered dedupe", "list(dict.fromkeys(a))");

// ───────────────────────── Tuples and unpacking ─────────────────────────

L("py2-tuples-unpacking", M, "Tuples, unpacking and swapping", "Immutable records, star-unpacking, multiple return values and tuples as dict keys.", {
  kind: "concept", mins: 15, mathsLabel: "Code",
  hook: "How does `a, b = b, a` swap two variables without a temporary, and why can a tuple be a dict key but a list can't?",
  intuition: `
**The situation.** You return (min, max) from a function, key a dict by (row, col), or sort records by several fields. Tuples do all of these.

**The idea.** A tuple is an **immutable sequence**. Because it can't change, it can be hashed (if its items are hashable), so it works as a dict key or set member. Lists can't, because their hash would change when they're modified.

**Unpacking** assigns a sequence's items to several names at once. The right-hand side is evaluated first into a tuple, then unpacked, which is why \`a, b = b, a\` swaps cleanly.
`,
  maths: `
**In one breath.** \`(x,)\` is a one-tuple; \`a, *rest = seq\` collects the remainder; tuples compare element by element; hashable if all items are hashable.

\`\`\`python
t = (3, "x", 2.5)
single = (5,)              # trailing comma makes it a tuple
not_tuple = (5)            # just the int 5
a, b = 1, 2
a, b = b, a                # swap: (2, 1)
first, *middle, last = [1, 2, 3, 4, 5]
print(first, middle, last) # 1 [2, 3, 4] 5

def min_max(xs):
    return min(xs), max(xs)    # returns a tuple
lo, hi = min_max([4, 9, 1])

seen = {(0, 0), (1, 2)}        # tuples as set members / dict keys
print((1, 2) in seen)          # True
print((1, 2, 3) < (1, 3))      # True: compares element by element

from collections import namedtuple
P = namedtuple("P", "x y")
p = P(3, 4)
print(p.x + p.y)               # 7
\`\`\`

**Immutable, but.** A tuple holding a list can't be rebound, but the inner list can still be mutated, and such a tuple is unhashable.

**Performance.** Tuples are slightly smaller and faster to create than lists; the main reason to use them is meaning (a fixed record) and hashability.
`,
  practice: `
**Interview uses.**

- Grid/BFS visited sets: \`visited.add((r, c))\`.
- Memoisation keys: \`cache[(i, j)]\`.
- Sorting by several keys: \`sorted(rows, key=lambda r: (-r.score, r.name))\`.
- Returning multiple values and unpacking them at the call site.
- \`for k, v in d.items()\`, \`for i, (a, b) in enumerate(pairs)\`.
`,
  traps: [
    { trap: "`(5)` is a one-element tuple.", why: "Parentheses alone don't make a tuple; the comma does. Write `(5,)`." },
    { trap: "Tuples are fully immutable, so `([1], 2)` can be a dict key.", why: "It contains a list, so hashing it raises TypeError. Only tuples of hashable items are hashable." },
  ],
  say: {
    prompt: "When would you use a tuple instead of a list in Python?",
    secs: 30,
    check: ["Immutable fixed-size records", "Hashable (if items are) → dict keys / set members", "Multiple return values and unpacking", "Element-wise comparison for multi-key sorting", "Mentioned namedtuple or one-element tuple comma"],
    followups: [
      { q: "How does `a, b = b, a` work?", a: "The right side builds the tuple (b, a) first, then it's unpacked into a and b, so no temporary variable is needed." },
      { q: "What does `first, *rest = 'abc'` give?", a: "first = 'a', rest = ['b', 'c'] (star-unpacking always produces a list)." },
      { q: "Why can't lists be dictionary keys?", a: "Dict keys must be hashable with a hash that never changes; a list can be mutated, which would change its hash and lose the entry." },
    ],
    answer: `I use a tuple for a fixed record whose fields shouldn't change, like coordinates, a (score, name) pair or several return values. Because tuples are immutable, a tuple of hashable items is itself hashable, so it can be a dict key or set member, which I use for visited cells or memo keys. Tuples also compare element by element, so they're handy sort keys. Lists are for collections that grow and change.`,
    avoid: ["\u201cTuples are just faster lists\u201d"],
  },
  terms: [["Unpacking", "Assigning items of a sequence to several names."], ["Hashable", "Has a stable hash; usable as a dict key."], ["namedtuple", "Tuple subclass with named fields."]],
  sources: [S.ds],
});
Q({ id: "py2-tup-1", d: 1, secs: 30, prompt: "```python\nfirst, *mid, last = range(10)\nprint(len(mid))\n```\nWhat is printed?", answer: 8, tol: 0.5, explain: "mid collects everything except the first and last: 8 items.", py: "first, *mid, last = range(10)\nanswer = len(mid)" });
Q({ id: "py2-tup-2", d: 1, secs: 30, prompt: "What is `type((5))` vs `type((5,))`? How many of the two are tuples?", answer: 1, tol: 0.5, explain: "(5) is an int; (5,) is a tuple.", py: "answer = sum(isinstance(v, tuple) for v in [(5), (5,)])" });
Q({ id: "py2-tup-3", d: 2, secs: 45, prompt: "Which of these can be a dictionary key?", options: ["[1, 2]", "(1, [2])", "(1, (2, 3))", "{1, 2}"], answer: 2, explain: "Only a tuple whose items are all hashable.", py: "opts = [[1, 2], (1, [2]), (1, (2, 3)), {1, 2}]\nok = []\nfor o in opts:\n    try:\n        hash(o); ok.append(True)\n    except TypeError:\n        ok.append(False)\nanswer = ok.index(True)" });
Q({ id: "py2-tup-4", d: 2, secs: 45, prompt: "```python\nrows = [('b', 2), ('a', 2), ('c', 5)]\nrows.sort(key=lambda r: (-r[1], r[0]))\nprint(rows[1][0])\n```\nWhat letter is printed? (a=1, b=2, c=3)", answer: 1, tol: 0.5, explain: "Sort by score descending, then name ascending: c, a, b. rows[1] is 'a'.", py: "rows = [('b', 2), ('a', 2), ('c', 5)]\nrows.sort(key=lambda r: (-r[1], r[0]))\nanswer = 'abc'.index(rows[1][0]) + 1" });
C("py2-tup-c1", "One-element tuple", "(5,) — the comma makes the tuple.");
C("py2-tup-c2", "Star-unpacking", "first, *rest = seq → rest is always a list.");

// ───────────────────────── Dictionaries ─────────────────────────

L("py2-dicts", M, "Dictionaries", "Hash maps: O(1) lookups, get/setdefault, iteration order, counting and grouping patterns.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "Two-sum in O(n) is one dictionary. What makes dict lookups O(1), and when do they stop being O(1)?",
  intuition: `
**The situation.** Half of all easy/medium coding questions (two-sum, anagrams, first unique character, frequency counts) reduce to "store what you've seen in a dict".

**The idea.** A dict is a **hash table**: the key's hash picks a slot, so lookup, insert and delete are O(1) on average, independent of size. Keys must be hashable (immutable): str, int, float, tuple of hashables. Since Python 3.7, dicts remember **insertion order**.

Missing keys raise \`KeyError\` with \`d[k]\`; \`d.get(k, default)\` returns a default instead. For counting and grouping, \`collections.Counter\` and \`defaultdict\` remove the boilerplate (next module).
`,
  maths: `
**In one breath.** \`d[k]\` O(1) average; \`get\`, \`setdefault\`, \`pop\`, \`items()\`; order = insertion order; \`|\` merges (3.9+).

\`\`\`python
d = {"a": 1, "b": 2}
d["c"] = 3
print(d.get("z"), d.get("z", 0))     # None 0
print("a" in d, 1 in d)              # True False  (checks keys)
d.setdefault("lst", []).append(5)    # insert default if missing
val = d.pop("b")                     # 2
for k, v in d.items():
    print(k, v)                      # insertion order
inv = {v: k for k, v in {"x": 1, "y": 2}.items()}   # invert
merged = {"a": 1} | {"a": 9, "b": 2}                # {'a': 9, 'b': 2}

def two_sum(nums, target):
    seen = {}                        # value -> index
    for i, x in enumerate(nums):
        if target - x in seen:
            return seen[target - x], i
        seen[x] = i
print(two_sum([2, 7, 11, 15], 9))    # (0, 1)

counts = {}
for ch in "banana":
    counts[ch] = counts.get(ch, 0) + 1
print(counts)                        # {'b': 1, 'a': 3, 'n': 2}
print(max(counts, key=counts.get))   # 'a'
\`\`\`

**Costs.** Average O(1) for get/set/delete/\`in\`; worst case O(n) with many hash collisions (rare with built-in types). Iterating is O(n).

**Views.** \`d.keys()\`, \`d.values()\`, \`d.items()\` are live views; changing the dict's size while iterating over them raises RuntimeError: iterate over \`list(d)\` if you must delete.

**Equal keys.** \`1\`, \`1.0\` and \`True\` hash equal and are the same key.
`,
  practice: `
**Patterns to recognise.**

- "Have I seen X?" / complement lookup → dict or set.
- Frequency of items → \`Counter\` or \`get(k, 0) + 1\`.
- Group items by a key (anagrams by sorted letters) → \`defaultdict(list)\`.
- Memoisation → dict keyed by arguments.
- Arg-max over a dict → \`max(d, key=d.get)\`; sorted by value → \`sorted(d.items(), key=lambda kv: kv[1], reverse=True)\`.
`,
  traps: [
    { trap: "`x in d` checks values.", why: "It checks keys. For values use `x in d.values()` (O(n))." },
    { trap: "You can delete keys while looping over `d`.", why: "Changing a dict's size during iteration raises RuntimeError. Loop over `list(d)` or build a new dict with a comprehension." },
    { trap: "Dict lookups are O(1) always.", why: "Average O(1); worst case O(n) if many keys collide. Fine in practice for built-in key types, but say 'average'." },
  ],
  say: {
    prompt: "How does a Python dictionary work, and how would you use one to solve two-sum in O(n)?",
    secs: 45,
    check: ["Hash table: hash → slot; average O(1) get/set/delete", "Keys must be hashable/immutable", "Insertion order preserved (3.7+)", "Two-sum: store value → index, check complement before inserting", "get with default / Counter / defaultdict for counting"],
    followups: [
      { q: "What's the worst-case lookup time and why?", a: "O(n), when many keys collide into the same probe sequence; Python's hash randomisation for strings makes adversarial collisions unlikely." },
      { q: "Why check the complement before inserting the current element in two-sum?", a: "So an element can't pair with itself (e.g. target 8 with a single 4), while still finding a pair of two equal values at different indices." },
      { q: "How do you sort a dict by value, descending?", a: "`sorted(d.items(), key=lambda kv: kv[1], reverse=True)`; or `Counter(d).most_common()` for counts." },
    ],
    answer: `A dict is a hash table: Python hashes the key to find a slot, so lookups, inserts and deletes take O(1) on average, and keys must be hashable. It keeps insertion order.

For two-sum I walk the array once, and for each number check whether target minus that number is already in a dict that maps value to index. If it is, I return both indices; otherwise I store the current number. Checking before inserting stops an element pairing with itself. That's O(n) time and O(n) space instead of the O(n²) double loop.`,
    avoid: ["\u201cDicts are unordered\u201d (outdated since 3.7)", "Claiming worst-case O(1)"],
  },
  terms: [["Hash table", "Array of slots indexed by a hash of the key."], ["Hashable", "Immutable with a stable __hash__."], ["View object", "Live keys()/values()/items() of a dict."]],
  sources: [S.ds, S.types],
});
Q({ id: "py2-dict-1", d: 1, secs: 30, prompt: "```python\nd = {}\nfor w in 'the cat the hat the'.split():\n    d[w] = d.get(w, 0) + 1\nprint(d['the'] * len(d))\n```\nWhat is printed?", answer: 9, tol: 0.5, explain: "'the' appears 3 times; there are 3 distinct words. 3 × 3 = 9.", py: "d = {}\nfor w in 'the cat the hat the'.split():\n    d[w] = d.get(w, 0) + 1\nanswer = d['the'] * len(d)" });
Q({ id: "py2-dict-2", d: 1, secs: 30, prompt: "What is `len({1: 'a', 1.0: 'b', True: 'c', 2: 'd'})`?", answer: 2, tol: 0.5, explain: "1, 1.0 and True are equal and hash the same, so they are one key.", py: "answer = len({1: 'a', 1.0: 'b', True: 'c', 2: 'd'})" });
Q({ id: "py2-dict-3", d: 2, secs: 60, prompt: "Two-sum with a dict on `[3, 2, 4]`, target 6, checking the complement before inserting. Which index pair is returned? Give the sum of the two indices.", answer: 3, tol: 0.5, explain: "At index 2 (value 4), complement 2 is in the dict at index 1 → (1, 2). Index 0 (3) can't pair with itself.", py: "def two_sum(nums, t):\n    seen = {}\n    for i, x in enumerate(nums):\n        if t - x in seen:\n            return seen[t - x], i\n        seen[x] = i\nanswer = sum(two_sum([3, 2, 4], 6))" });
Q({ id: "py2-dict-4", d: 1, secs: 30, prompt: "`d = {'a': 3, 'b': 7, 'c': 5}`. What does `max(d, key=d.get)` return?", options: ["'a'", "'b'", "'c'", "7"], answer: 1, explain: "Iterates keys, compares by value: 'b' has 7.", py: "d = {'a': 3, 'b': 7, 'c': 5}\nanswer = ['a', 'b', 'c', 7].index(max(d, key=d.get))" });
Q({ id: "py2-dict-5", d: 2, secs: 45, prompt: "```python\nd = {'a': 1, 'b': 2}\nd.setdefault('a', 10)\nd.setdefault('c', 10)\nprint(sum(d.values()))\n```\nWhat is printed?", answer: 13, tol: 0.5, explain: "setdefault leaves existing 'a' = 1 and adds 'c' = 10: 1 + 2 + 10.", py: "d = {'a': 1, 'b': 2}\nd.setdefault('a', 10)\nd.setdefault('c', 10)\nanswer = sum(d.values())" });
C("py2-dict-c1", "Arg-max of a dict", "max(d, key=d.get)");
C("py2-dict-c2", "Two-sum pattern", "seen = {}; check target − x in seen before seen[x] = i.");

// ───────────────────────── Sets ─────────────────────────

L("py2-sets", M, "Sets", "O(1) membership, deduplication and set algebra for comparison questions.", {
  kind: "concept", mins: 15, mathsLabel: "Code",
  hook: "Find customers who bought in January but not February. One line with sets; how many lines without?",
  intuition: `
**The situation.** "Common elements", "missing number", "unique visitors", "users in A but not B". These are set questions.

**The idea.** A set is a hash table with keys and no values: unordered, no duplicates, O(1) average membership. It supports the maths operations directly: union \`|\`, intersection \`&\`, difference \`-\`, symmetric difference \`^\`.

Turning a list into a set is O(n) and removes duplicates; then each \`in\` test is O(1) instead of O(n).
`,
  maths: `
**In one breath.** \`set(iterable)\` dedups; \`in\` O(1); \`| & - ^\`; elements must be hashable; \`frozenset\` is the immutable, hashable version.

\`\`\`python
jan = {"asha", "ravi", "meera", "john"}
feb = {"ravi", "john", "zoya"}
print(jan & feb)        # {'ravi', 'john'}   bought both months
print(jan - feb)        # {'asha', 'meera'}  January only
print(jan | feb)        # all 5 customers
print(jan ^ feb)        # in exactly one month
print({1, 2} <= {1, 2, 3})   # subset: True

nums = [3, 0, 1]
missing = set(range(len(nums) + 1)) - set(nums)
print(missing)          # {2}

s = set()               # NOT {} (that's an empty dict)
s.add(4); s.discard(9)  # discard: no error if absent
print(len(set("mississippi")))   # 4
\`\`\`

| Operation | Cost |
|---|---|
| \`x in s\`, \`add\`, \`discard\` | O(1) average |
| \`s & t\` | O(min(len s, len t)) |
| \`s | t\` | O(len s + len t) |
| \`set(list)\` | O(n) |

**Order.** Sets don't preserve order; for ordered de-dup use \`dict.fromkeys\`.
`,
  practice: `
**When to reach for a set.**

- Repeated membership tests inside a loop.
- De-duplication when order doesn't matter.
- Comparing two collections (overlap, difference) in one expression.
- Visited nodes in BFS/DFS.

**Gotchas.** \`{}\` is a dict; sets of lists fail (unhashable); \`remove\` raises KeyError if missing, \`discard\` doesn't.
`,
  traps: [
    { trap: "`s = {}` creates an empty set.", why: "`{}` is an empty dict. Use `set()`." },
    { trap: "`list(set(a))` keeps the original order.", why: "Set iteration order is arbitrary. Use `list(dict.fromkeys(a))` for ordered de-dup." },
  ],
  say: {
    prompt: "When do you use a set, and what operations does it give you?",
    secs: 30,
    check: ["Unordered, unique, hashable elements", "O(1) average membership vs O(n) for lists", "Union, intersection, difference, symmetric difference", "Dedup (unordered) / visited sets", "set() vs {}; frozenset"],
    followups: [
      { q: "How would you find the elements in list a that are not in list b efficiently?", a: "`set(a) - set(b)` (unordered), or `bs = set(b); [x for x in a if x not in bs]` to keep order and duplicates. O(len a + len b)." },
      { q: "What's a frozenset for?", a: "An immutable, hashable set, usable as a dict key or inside another set." },
      { q: "Can a set contain a list?", a: "No; elements must be hashable. Convert to a tuple first." },
    ],
    answer: `I use a set when I need fast membership tests or uniqueness: it's a hash table without values, so \`x in s\` is O(1) on average versus O(n) for a list. It also gives set algebra directly, so "customers in January but not February" is \`jan - feb\`, and overlap is \`jan & feb\`. Elements must be hashable, \`set()\` makes an empty set because \`{}\` is a dict, and sets don't keep order.`,
    avoid: ["\u201cSets are ordered\u201d", "Using {} for an empty set"],
  },
  terms: [["Set", "Unordered collection of unique hashable items."], ["Symmetric difference", "Items in exactly one of two sets (^)."], ["frozenset", "Immutable, hashable set."]],
  sources: [S.ds],
});
Q({ id: "py2-set-1", d: 1, secs: 20, prompt: "What is `len(set('mississippi'))`?", answer: 4, tol: 0.5, explain: "m, i, s, p.", py: "answer = len(set('mississippi'))" });
Q({ id: "py2-set-2", d: 1, secs: 30, prompt: "`a = {1, 2, 3, 4}`, `b = {3, 4, 5}`. What is `len(a ^ b)`?", answer: 3, tol: 0.5, explain: "Symmetric difference {1, 2, 5}.", py: "answer = len({1, 2, 3, 4} ^ {3, 4, 5})" });
Q({ id: "py2-set-3", d: 1, secs: 20, prompt: "What is `type({})`?", options: ["set", "dict", "frozenset", "tuple"], answer: 1, explain: "Empty braces make a dict.", py: "answer = ['set', 'dict', 'frozenset', 'tuple'].index(type({}).__name__)" });
Q({ id: "py2-set-4", d: 2, secs: 45, prompt: "`nums = [0, 1, 3, 4, 5]` should contain every number 0..5 once. Using sets, what's the missing number?", answer: 2, tol: 0.5, explain: "set(range(6)) − set(nums) = {2}.", py: "nums = [0, 1, 3, 4, 5]\nanswer = (set(range(6)) - set(nums)).pop()" });
C("py2-set-c1", "Set operators", "| union, & intersection, - difference, ^ symmetric difference, <= subset.");
C("py2-set-c2", "Empty set", "set() — {} is an empty dict.");

// ───────────────────────── Comprehensions ─────────────────────────

L("py2-comprehensions", M, "Comprehensions and generator expressions", "List, dict and set comprehensions, conditions, nesting, and when a generator is better.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "`[x * 2 for x in a if x > 0]` replaces four lines. When does a comprehension hurt readability or memory?",
  intuition: `
**The situation.** Interviewers expect idiomatic Python: transforming and filtering collections in one readable line.

**The idea.** A comprehension builds a new collection from an iterable: \`[expression for item in iterable if condition]\`. The same shape makes dicts (\`{k: v for ...}\`) and sets (\`{x for ...}\`).

With round brackets it becomes a **generator expression**: values are produced lazily, one at a time, without building a list. Perfect when you feed straight into \`sum\`, \`max\`, \`any\`, or \`"".join\`.

Note where the conditions go: a trailing \`if\` **filters**; an \`a if cond else b\` in the expression **maps** every item.
`,
  maths: `
**In one breath.** \`[f(x) for x in xs if p(x)]\`; \`{k: v ...}\`; \`{x ...}\`; \`(… )\` is lazy; nested loops read left to right.

\`\`\`python
a = [3, -1, 4, -5, 9]
print([x * 2 for x in a if x > 0])           # [6, 8, 18]   filter
print([x if x > 0 else 0 for x in a])        # [3, 0, 4, 0, 9] map
print({w: len(w) for w in ["hi", "data"]})   # {'hi': 2, 'data': 4}
print({x % 3 for x in a})                    # {0, 1, 2}

pairs = [(i, j) for i in range(3) for j in range(i)]   # outer loop first
print(pairs)                                 # [(1, 0), (2, 0), (2, 1)]

matrix = [[1, 2, 3], [4, 5, 6]]
flat = [v for row in matrix for v in row]    # [1, 2, 3, 4, 5, 6]
transposed = [list(col) for col in zip(*matrix)]   # [[1, 4], [2, 5], [3, 6]]

print(sum(x * x for x in range(1_000_000)))  # no million-element list
\`\`\`

**Scope.** The loop variable in a comprehension doesn't leak into the surrounding scope (unlike a \`for\` loop).

**Memory.** A list comprehension materialises all n items; a generator expression holds one at a time. A generator can be consumed only once.
`,
  practice: `
**Use comprehensions** for a single map/filter step. **Use a loop** when there are side effects, several statements, or more than two nested levels; readability beats cleverness.

**OA staples.** Flatten (\`[v for row in m for v in row]\`), transpose (\`zip(*m)\`), invert a dict, count with \`sum(1 for x in a if cond)\`, build a lookup \`{x: i for i, x in enumerate(a)}\`.
`,
  traps: [
    { trap: "`[x for x in a if x > 0 else 0]` maps negatives to 0.", why: "Syntax error: an `if ... else` must go before the `for` (it's part of the expression). A trailing `if` can only filter." },
    { trap: "A generator expression can be reused like a list.", why: "It's exhausted after one pass; a second `sum(g)` returns 0. Rebuild it or use a list if you need two passes." },
  ],
  say: {
    prompt: "Explain list comprehensions versus generator expressions, and when you'd use each.",
    secs: 45,
    check: ["Syntax: expression, for, optional filter if", "Conditional expression (map) vs trailing if (filter)", "Generator expression is lazy, O(1) memory, single pass", "Use generators when feeding sum/any/max/join", "Readability limit: nested/side effects → plain loop"],
    followups: [
      { q: "How do you flatten a list of lists with a comprehension?", a: "`[v for row in rows for v in row]`: loops read in the same order as nested for statements." },
      { q: "How do you transpose a matrix in one line?", a: "`[list(col) for col in zip(*matrix)]`." },
      { q: "Is a comprehension faster than a loop with append?", a: "Usually somewhat, because it avoids repeated attribute lookups for append; but the main reason to use it is clarity." },
    ],
    answer: `A list comprehension builds a list in one expression: the output expression, a for clause, and an optional trailing if that filters. If I want to transform every item conditionally, the if-else goes in the expression part instead. Dict and set comprehensions work the same way.

A generator expression uses round brackets and yields values lazily, so it uses constant memory but can only be consumed once. I use it when the result goes straight into sum, any, max or join, and a list comprehension when I need the list itself. If the logic needs several statements or deep nesting, a normal loop is clearer.`,
    avoid: ["Putting if/else after the for", "Reusing an exhausted generator"],
  },
  terms: [["Comprehension", "Expression that builds a collection from an iterable."], ["Generator expression", "Lazy comprehension in parentheses."], ["zip(*m)", "Transposes rows into columns."]],
  sources: [S.ds],
});
Q({ id: "py2-comp-1", d: 1, secs: 30, prompt: "What is `len([(i, j) for i in range(4) for j in range(i)])`?", answer: 6, tol: 0.5, explain: "0 + 1 + 2 + 3 = 6 pairs.", py: "answer = len([(i, j) for i in range(4) for j in range(i)])" });
Q({ id: "py2-comp-2", d: 1, secs: 30, prompt: "```python\na = [3, -1, 4, -5]\nprint(sum([x if x > 0 else 0 for x in a]))\n```\nWhat is printed?", answer: 7, tol: 0.5, explain: "Negatives mapped to 0: 3 + 0 + 4 + 0.", py: "a = [3, -1, 4, -5]\nanswer = sum([x if x > 0 else 0 for x in a])" });
Q({ id: "py2-comp-3", d: 2, secs: 45, prompt: "```python\ng = (x * x for x in range(4))\nfirst = sum(g)\nsecond = sum(g)\nprint(first + second)\n```\nWhat is printed?", answer: 14, tol: 0.5, explain: "First sum: 0 + 1 + 4 + 9 = 14. The generator is then exhausted, so the second sum is 0.", py: "g = (x * x for x in range(4))\nfirst = sum(g)\nsecond = sum(g)\nanswer = first + second" });
Q({ id: "py2-comp-4", d: 1, secs: 30, prompt: "`m = [[1, 2, 3], [4, 5, 6]]`. What is `[list(c) for c in zip(*m)][2][1]`?", answer: 6, tol: 0.5, explain: "Transposed: [[1, 4], [2, 5], [3, 6]]; row 2, column 1 is 6.", py: "m = [[1, 2, 3], [4, 5, 6]]\nanswer = [list(c) for c in zip(*m)][2][1]" });
C("py2-comp-c1", "Filter vs map in a comprehension", "Filter: [x for x in a if c]. Map: [x if c else y for x in a].");
C("py2-comp-c2", "Generator expression", "(f(x) for x in xs): lazy, single pass, O(1) memory.");

// ───────────────────────── Sorting ─────────────────────────

L("py2-sorting", M, "Sorting with keys", "sorted vs sort, key functions, multi-key and descending sorts, stability and top-k.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "Sort employees by department ascending and salary descending. One `sorted` call or two?",
  intuition: `
**The situation.** Ranking, leaderboards, "sort by frequency then alphabetically": sorting with custom order shows up constantly in OAs.

**The idea.** Python's sort (Timsort) is O(n log n) and **stable**: items with equal keys keep their original relative order. You don't write comparison functions; you pass a **key** function that maps each item to the value to sort by. Tuples as keys give multi-level sorting, and negating a number flips its direction.

\`sorted(x)\` returns a new list from any iterable; \`list.sort()\` sorts in place and returns None.
`,
  maths: `
**In one breath.** \`sorted(it, key=f, reverse=False)\`; tuple keys for ties; \`-x\` for descending numbers; stability enables multi-pass sorts; \`heapq.nlargest\` for top-k.

\`\`\`python
emps = [("ops", "ravi", 50), ("eng", "asha", 90), ("eng", "john", 70), ("ops", "zoya", 60)]
by_dept_salary = sorted(emps, key=lambda e: (e[0], -e[2]))
# [('eng','asha',90), ('eng','john',70), ('ops','zoya',60), ('ops','ravi',50)]

words = ["pear", "fig", "apple", "kiwi"]
print(sorted(words, key=len))             # ['fig', 'pear', 'kiwi', 'apple'] (stable)
print(sorted(words, key=lambda w: (-len(w), w)))   # ['apple', 'kiwi', 'pear', 'fig']

from collections import Counter
s = "tree"
freq = Counter(s)
print("".join(sorted(s, key=lambda c: (-freq[c], c))))   # 'eert'

from operator import itemgetter
print(sorted(emps, key=itemgetter(2))[0])   # lowest salary

import heapq
print(heapq.nlargest(2, [5, 1, 9, 3]))     # [9, 5]  O(n log k)
\`\`\`

**Descending strings with an ascending tie-break.** You can't negate a string. Either sort twice using stability (sort by the secondary key first, then by the primary with \`reverse=True\`), or use \`functools.cmp_to_key\`.

**Costs.** \`sorted\`: O(n log n) time, O(n) extra space. \`min\`/\`max\`: O(n). Top-k with a heap: O(n log k).
`,
  practice: `
**Checklist.** Write the key as a tuple in priority order; negate numeric fields to reverse them; rely on stability for multi-pass sorts; use \`nlargest\`/\`nsmallest\` or a heap when you only need the top few.

**Custom objects.** Pass a key (\`key=lambda p: p.age\`, \`attrgetter("age")\`) rather than defining \`__lt__\`, unless the class has a natural order.
`,
  traps: [
    { trap: "`sorted(words, key=lambda w: -w)` sorts strings descending.", why: "You can't negate a string (TypeError). Use `reverse=True`, or two stable passes for mixed directions." },
    { trap: "Sorting is unstable, so ties come out in random order.", why: "Python's sort is guaranteed stable: equal keys keep their input order. That's what makes multi-pass sorting work." },
  ],
  say: {
    prompt: "How would you sort a list of records by one field ascending and another descending in Python?",
    secs: 45,
    check: ["sorted/sort with a key function", "Tuple key in priority order", "Negate numeric fields for descending", "Stable sort: multi-pass trick for non-numeric descending", "Complexity O(n log n); heap for top-k"],
    followups: [
      { q: "What sorting algorithm does Python use?", a: "Timsort: a hybrid of merge sort and insertion sort that exploits existing runs; O(n log n) worst case, O(n) on already-sorted data, stable." },
      { q: "How do you get the 3 most frequent words?", a: "`Counter(words).most_common(3)`, or `heapq.nlargest(3, counts.items(), key=lambda kv: kv[1])`." },
      { q: "How do you sort names descending but ages ascending for ties?", a: "Two stable passes: sort by age ascending, then by name with reverse=True." },
    ],
    answer: `I pass a key function to sorted and make it return a tuple in priority order, negating any numeric field I want descending. So department ascending, salary descending is \`sorted(rows, key=lambda r: (r.dept, -r.salary))\`. If the descending field is a string I can't negate it, so I use the fact that Python's sort is stable: sort by the secondary key first, then by the primary key with reverse=True. It's O(n log n); if I only need the top few, heapq.nlargest is O(n log k).`,
    avoid: ["Writing a comparison function first", "\u201cPython's sort isn't stable\u201d"],
  },
  terms: [["Key function", "Maps each item to the value it's sorted by."], ["Stable sort", "Equal keys keep their original order."], ["Timsort", "Python's adaptive merge/insertion sort."]],
  sources: [S.sort],
});
Q({ id: "py2-sort-1", d: 1, secs: 30, prompt: "```python\nw = ['pear', 'fig', 'apple', 'kiwi']\nprint(sorted(w, key=len)[1])\n```\nWhich word is printed?", options: ["fig", "pear", "kiwi", "apple"], answer: 1, explain: "Length 4 ties keep input order: pear before kiwi.", py: "w = ['pear', 'fig', 'apple', 'kiwi']\nanswer = ['fig', 'pear', 'kiwi', 'apple'].index(sorted(w, key=len)[1])" });
Q({ id: "py2-sort-2", d: 2, secs: 45, prompt: "```python\nfrom collections import Counter\ns = 'banana'\nf = Counter(s)\nr = ''.join(sorted(s, key=lambda c: (-f[c], c)))\nprint(r.index('n'))\n```\nWhat is printed?", answer: 3, tol: 0.5, explain: "Sorted: 'aaannb'; first 'n' at index 3.", py: "from collections import Counter\ns = 'banana'\nf = Counter(s)\nr = ''.join(sorted(s, key=lambda c: (-f[c], c)))\nanswer = r.index('n')" });
Q({ id: "py2-sort-3", d: 2, secs: 60, prompt: "Records `[('ravi', 30), ('asha', 25), ('zoya', 30), ('john', 25)]`. Sort by age ascending, then name descending. What's the position (0-based) of 'zoya'?", answer: 2, tol: 0.5, explain: "Order: (john 25), (asha 25), (zoya 30), (ravi 30).", py: "r = [('ravi', 30), ('asha', 25), ('zoya', 30), ('john', 25)]\nr = sorted(r, key=lambda x: x[0], reverse=True)\nr = sorted(r, key=lambda x: x[1])\nanswer = [n for n, _ in r].index('zoya')" });
Q({ id: "py2-sort-4", d: 1, secs: 30, prompt: "What does `heapq.nlargest(2, [5, 1, 9, 3])[1]` return?", answer: 5, tol: 0.5, explain: "Top two are [9, 5].", py: "import heapq\nanswer = heapq.nlargest(2, [5, 1, 9, 3])[1]" });
C("py2-sort-c1", "Multi-key sort", "key=lambda r: (r.a, -r.b) → a ascending, b descending.");
C("py2-sort-c2", "Stability", "Equal keys keep input order, so you can sort in several passes (least significant key first).");

// ───────────────────────── Interview lesson ─────────────────────────

L("py2-core-practice", M, "Core Python practice", "Live-coding style questions on Python basics, complexity and common bugs.", {
  kind: "interview", mins: 30, prereq: ["py2-lists", "py2-dicts", "py2-references"],
  hook: "Answer each out loud in about a minute, then open it and tick off what the interviewer listens for.",
}, [
  iq("Write a function that returns the first non-repeating character in a string, or None. What's the complexity?", "Count characters with `Counter(s)` (O(n)), then scan the string again and return the first character with count 1. O(n) time, O(k) space for k distinct characters. Two passes are fine; a single pass with an ordered dict also works.", ["Count first (Counter/dict)", "Second pass in original order", "O(n) time, O(k) space", "Handles empty string / no answer"]),
  iq("Given a list of numbers, return all pairs that sum to a target without duplicates.", "Use a set of seen numbers and a set of found pairs stored as sorted tuples: for each x, if target − x is in seen, add (min, max). O(n) time. Sorting plus two pointers is an O(n log n) alternative that also handles duplicates cleanly.", ["Hash-set approach O(n)", "Dedupe via sorted tuple in a set", "Two-pointer alternative after sorting", "Edge cases: same value twice"]),
  iq("This code builds a 3×3 board with `[[None] * 3] * 3`, and a move appears in three rows. Explain and fix.", "The outer multiplication repeats a reference to one inner list, so all rows are the same object. Fix with `[[None] * 3 for _ in range(3)]`, which creates three separate lists.", ["Shared reference explanation", "Comprehension fix", "Mentions identity/aliasing"]),
  iq("Your solution uses `if x in big_list` inside a loop over 10⁵ items and times out. What do you change?", "Membership in a list is O(n), making the loop O(n²). Convert the list to a set once (O(n)) so each check is O(1) average, giving O(n) overall.", ["Identify O(n) membership", "Convert to set/dict once", "New complexity O(n)", "Mentions hashability requirement"]),
  iq("Merge two dictionaries of item counts, adding values for common keys.", "`Counter(a) + Counter(b)` (drops non-positive results), or a loop: `out = dict(a); for k, v in b.items(): out[k] = out.get(k, 0) + v`. O(len a + len b). Note `a | b` would overwrite, not add.", ["Counter addition or get-based loop", "Explains | overwrites", "Complexity", "Doesn't mutate inputs"]),
  iq("Explain what's wrong: `def add(item, bucket=[]): bucket.append(item); return bucket`.", "The default list is created once at definition time, so every call without a bucket shares it and values accumulate. Use `bucket=None` and create a new list inside when it's None.", ["Defaults evaluated once", "Shared mutable state across calls", "None sentinel fix"]),
]);
