/**
 * v2 Python, part B: Strings and collections. Fixed ids (py2-*); answers recomputed in Pyodide.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("python");
const M = "Strings and collections";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  types: src("Python docs: built-in types (str methods, sequences)", "https://docs.python.org/3/library/stdtypes.html"),
  io: src("Python tutorial: input and output (f-strings, format specs)", "https://docs.python.org/3/tutorial/inputoutput.html"),
  re: src("Python docs: re (regular expressions)", "https://docs.python.org/3/library/re.html"),
  coll: src("Python docs: collections (Counter, defaultdict, deque, namedtuple)", "https://docs.python.org/3/library/collections.html"),
  heapq: src("Python docs: heapq (heap queue algorithm)", "https://docs.python.org/3/library/heapq.html"),
  bisect: src("Python docs: bisect (binary search on sorted lists)", "https://docs.python.org/3/library/bisect.html"),
};

// ───────────────────────── String methods ─────────────────────────

L("py2-str-methods", M, "String methods for cleaning text", "split/join, strip, replace, find, case methods and character tests: the toolkit for text OAs.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "A CSV column holds ' Mumbai ', 'mumbai', 'MUMBAI\\n'. How do you make them one value, and what does each step cost?",
  intuition: `
**The situation.** Text questions in OAs ("count words", "reverse words", "is it a valid code", "normalise city names") are mostly string methods glued together.

**The idea.** Strings are **immutable sequences of characters**. Every method returns a **new** string; nothing changes in place. So \`s.strip()\` on its own line does nothing useful; you must assign the result.

Three families cover most tasks:

- **Cleaning:** \`strip\` (both ends), \`lower\`/\`casefold\`, \`replace\`.
- **Splitting and joining:** \`split()\` with no argument splits on any run of whitespace and drops empties; \`sep.join(list_of_strings)\` glues pieces in O(total length).
- **Searching and testing:** \`find\` (returns -1), \`index\` (raises), \`startswith\`, \`count\`, \`isdigit\`, \`isalpha\`, \`isalnum\`.
`,
  maths: `
**In one breath.** Methods return new strings; \`split()\` vs \`split(" ")\` differ; build with a list + \`join\`; \`find\` → -1, \`index\` → error.

\`\`\`python
raw = "  Mumbai \\n"
city = raw.strip().casefold()          # 'mumbai'
print("a  b   c".split())              # ['a', 'b', 'c']
print("a  b".split(" "))               # ['a', '', 'b']  (empty pieces!)
print("2024-11-25".split("-", 1))      # ['2024', '11-25']
print(" ".join(reversed("the sky is blue".split())))   # 'blue is sky the'
print("banana".count("an"), "banana".find("x"))         # 2 -1
print("data_science".replace("_", " ").title())         # 'Data Science'
print("abc123".isalnum(), "123".isdigit(), "ab c".isalpha())  # True True False
print("Hello"[::-1], "Hello".upper().startswith("HE"))  # olleH True

parts = []
for i in range(3):
    parts.append(str(i))
print(",".join(parts))                 # '0,1,2'

print(ord("a"), chr(98))               # 97 b
print("".join(c for c in "a1b2" if c.isdigit()))   # '12'
\`\`\`

**Costs.** Most methods are O(n). \`s1 + s2\` builds a new string, so \`+=\` in a loop can be O(n²); \`join\` is O(total). Slicing copies.

**Character counts.** \`collections.Counter(s)\`. **Alphabet index.** \`ord(c) - ord("a")\`.
`,
  practice: `
**Normalise before comparing.** strip → casefold → collapse inner spaces (\`" ".join(s.split())\`) → replace punctuation.

**Palindrome / anagram checks.** Clean with a comprehension of \`c.isalnum()\`, lower-case, then compare to the reverse or compare Counters/sorted strings.

**Parsing.** \`line.split(",")\` for simple CSV, but use the \`csv\` module when fields may contain commas inside quotes.
`,
  traps: [
    { trap: "`s.strip()` cleans `s`.", why: "Strings are immutable; strip returns a new string. Write `s = s.strip()`." },
    { trap: "`text.split(' ')` splits into words.", why: "With an explicit separator, consecutive spaces produce empty strings. `text.split()` splits on any whitespace run and drops empties." },
    { trap: "`s += ch` in a loop is always fine.", why: "It may copy the string each time (O(n²)); collect pieces in a list and `''.join` once." },
  ],
  say: {
    prompt: "How would you normalise and count the words in a messy paragraph in Python?",
    secs: 45,
    check: ["Strings immutable: methods return new strings", "lower/casefold, strip punctuation (replace/regex/isalnum)", "split() without arguments for whitespace", "Counter for counts / most_common", "join instead of += for building strings"],
    followups: [
      { q: "What's the difference between `lower()` and `casefold()`?", a: "casefold is more aggressive and meant for caseless matching across languages (e.g. German ß → ss); lower is fine for ASCII." },
      { q: "`find` vs `index`?", a: "Both return the first position of a substring; `find` returns -1 if it's missing, `index` raises ValueError." },
      { q: "How do you reverse the words of a sentence but not the letters?", a: "`' '.join(s.split()[::-1])` (or reversed)." },
    ],
    answer: `I'd lower-case with casefold, strip punctuation either with a regex like \`re.sub(r"[^\\w\\s]", " ", text)\` or a comprehension keeping alphanumerics and spaces, then split with no argument so any run of whitespace separates words and empty strings disappear. Then \`Counter(words).most_common(k)\` gives the counts. Because strings are immutable every method returns a new string, so I assign the results, and when building output I collect pieces in a list and join once.`,
    avoid: ["`split(' ')` for words", "Expecting methods to modify the string in place"],
  },
  terms: [["Immutable", "Can't be changed after creation; methods return new objects."], ["casefold", "Aggressive lower-casing for comparisons."], ["join", "sep.join(iterable of str): efficient concatenation."]],
  sources: [S.types],
});
Q({ id: "py2-strm-1", d: 1, secs: 30, prompt: "What is `len('a  b   c'.split(' '))`?", answer: 6, tol: 0.5, explain: "Explicit separator keeps empty strings: ['a', '', 'b', '', '', 'c'].", py: "answer = len('a  b   c'.split(' '))" });
Q({ id: "py2-strm-2", d: 1, secs: 30, prompt: "What is `'banana'.count('ana')`?", answer: 1, tol: 0.5, explain: "count finds non-overlapping occurrences: 'ana' at 1, then the next search starts at 4.", trap: "Answering 2 (overlapping).", py: "answer = 'banana'.count('ana')" });
Q({ id: "py2-strm-3", d: 1, secs: 30, prompt: "```python\ns = '  Hi There '\ns.strip()\nprint(len(s))\n```\nWhat is printed?", answer: 11, tol: 0.5, explain: "strip() returned a new string that was discarded; s is unchanged.", py: "s = '  Hi There '\ns.strip()\nanswer = len(s)" });
Q({ id: "py2-strm-4", d: 1, secs: 30, prompt: "What is `'abcdef'.find('z') + 'abcdef'.find('d')`?", answer: 2, tol: 0.5, explain: "-1 + 3 = 2.", py: "answer = 'abcdef'.find('z') + 'abcdef'.find('d')" });
Q({ id: "py2-strm-5", d: 2, secs: 45, prompt: "```python\ns = 'A man, a plan, a canal: Panama'\nt = ''.join(c.lower() for c in s if c.isalnum())\nprint(t == t[::-1], len(t))\n```\nWhat is `len(t)`?", answer: 21, tol: 0.5, explain: "'amanaplanacanalpanama' has 21 characters, and it is a palindrome.", py: "s = 'A man, a plan, a canal: Panama'\nt = ''.join(c.lower() for c in s if c.isalnum())\nanswer = len(t)" });
C("py2-strm-c1", "split() vs split(' ')", "split(): any whitespace, no empties. split(' '): exact single spaces, keeps empties.");
C("py2-strm-c2", "Build strings efficiently", "Collect parts in a list, then ''.join(parts).");

// ───────────────────────── Slicing ─────────────────────────

L("py2-slicing", M, "Indexing and slicing", "Negative indices, start:stop:step, reversing, and the off-by-one rules.", {
  kind: "concept", mins: 15, mathsLabel: "Code",
  hook: "What do `s[-3:]`, `s[::-1]` and `s[1::2]` return, and why does `s[10]` fail while `s[10:]` doesn't?",
  intuition: `
**The situation.** "Last three characters", "every other element", "reverse a string", "rotate by k": all one slice.

**The idea.** A slice \`seq[start:stop:step]\` takes items from **start up to but not including stop**, moving by step. Missing values default to "from the beginning", "to the end" and 1. Negative indices count from the end (\`-1\` is the last item). A negative step walks backwards, so the defaults flip.

Indexing a single position that doesn't exist raises IndexError; slicing clamps out-of-range bounds and just returns what exists.
`,
  maths: `
**In one breath.** \`[start:stop)\`, length \`stop - start\` for step 1; negatives count from the end; \`[::-1]\` reverses; slices never raise, indexes can.

\`\`\`python
s = "python"
print(s[0], s[-1])        # p n
print(s[1:4])             # yth   (indices 1, 2, 3)
print(s[:2], s[2:])       # py thon  (a split point: s[:k] + s[k:] == s)
print(s[-3:])             # hon
print(s[::2], s[1::2])    # pto yhn
print(s[::-1])            # nohtyp
print(s[4:1:-1])          # oht
print(s[10:], s[-100:2])  # '' py   (no error)
# s[10] -> IndexError

a = [1, 2, 3, 4, 5]
k = 2
print(a[-k:] + a[:-k])    # rotate right by 2: [4, 5, 1, 2, 3]
a[1:3] = [9]              # slice assignment can change length
print(a)                  # [1, 9, 4, 5]
\`\`\`

**Rules of thumb.** \`len(s[i:j]) == j - i\` when 0 ≤ i ≤ j ≤ len(s). \`s[:k] + s[k:] == s\` for any k. Rotations need \`k %= n\` first.
`,
  practice: `
**OA uses.** Palindromes (\`s == s[::-1]\`), last-n log lines (\`lines[-n:]\`), chunking (\`[a[i:i + k] for i in range(0, len(a), k)]\`), pairs of neighbours (\`zip(a, a[1:])\`).

**Cost.** Every slice copies: O(length of slice). Inside a tight loop, prefer index arithmetic over repeated slicing.
`,
  traps: [
    { trap: "`s[1:4]` includes index 4.", why: "Stop is exclusive: indices 1, 2, 3. That's why `s[:k] + s[k:]` reassembles the original." },
    { trap: "Rotating by k works for any k with `a[-k:] + a[:-k]`.", why: "For k = 0, `a[-0:]` is the whole list and `a[:-0]` is empty, which happens to work; but for k > len(a) the result is wrong. Use `k %= len(a)` first." },
  ],
  say: {
    prompt: "Explain Python slicing, including negative indices and steps.",
    secs: 30,
    check: ["start inclusive, stop exclusive", "Defaults for omitted parts", "Negative indices count from the end", "Negative step reverses (s[::-1])", "Slices clamp out-of-range bounds and copy"],
    followups: [
      { q: "How do you split a list into chunks of size k?", a: "`[a[i:i + k] for i in range(0, len(a), k)]` (or itertools.batched in 3.12+)." },
      { q: "Does slicing a list create a copy?", a: "Yes, a shallow copy; NumPy array slices are views instead." },
      { q: "What does `s[::-2]` return for 'abcdef'?", a: "'fdb': start from the end and take every second character." },
    ],
    answer: `A slice \`seq[start:stop:step]\` takes items from start up to but not including stop, stepping by step, with defaults of the beginning, the end and 1. Negative indices count from the end, so \`s[-3:]\` is the last three items, and a negative step walks backwards, so \`s[::-1]\` reverses. Slices never raise for out-of-range bounds, they just clamp, while a single out-of-range index raises IndexError. For lists a slice is a shallow copy, so it costs O(k).`,
    avoid: ["\u201cstop is inclusive\u201d"],
  },
  terms: [["Slice", "seq[start:stop:step], stop exclusive."], ["Negative index", "Counts from the end; -1 is the last item."]],
  sources: [S.types],
});
Q({ id: "py2-slice-1", d: 1, secs: 20, prompt: "What is `'python'[1:4]`? Give its length.", answer: 3, tol: 0.5, explain: "'yth': indices 1, 2, 3.", py: "answer = len('python'[1:4])" });
Q({ id: "py2-slice-2", d: 1, secs: 30, prompt: "Which does `'abcdef'[::-2]` return?", options: ["'fdb'", "'eca'", "'ace'", "'bdf'"], answer: 0, explain: "Start at the last character and step back by 2.", py: "answer = ['fdb', 'eca', 'ace', 'bdf'].index('abcdef'[::-2])" });
Q({ id: "py2-slice-3", d: 2, secs: 45, prompt: "Rotate `a = [1, 2, 3, 4, 5]` right by k = 7 using `k %= len(a); a[-k:] + a[:-k]`. What is the first element?", answer: 4, tol: 0.5, explain: "7 % 5 = 2 → [4, 5, 1, 2, 3].", py: "a = [1, 2, 3, 4, 5]\nk = 7 % len(a)\nanswer = (a[-k:] + a[:-k])[0]" });
Q({ id: "py2-slice-4", d: 1, secs: 30, prompt: "```python\na = [1, 2, 3, 4, 5]\na[1:3] = [9]\nprint(len(a))\n```\nWhat is printed?", answer: 4, tol: 0.5, explain: "Two elements replaced by one: [1, 9, 4, 5].", py: "a = [1, 2, 3, 4, 5]\na[1:3] = [9]\nanswer = len(a)" });
C("py2-slice-c1", "Slice bounds", "s[i:j] → indices i … j−1; s[:k] + s[k:] == s.");
C("py2-slice-c2", "Reverse", "s[::-1] (copies); list.reverse() in place.");

// ───────────────────────── Formatting ─────────────────────────

L("py2-formatting", M, "f-strings and number formatting", "Format specs for decimals, percentages, thousands separators, padding and alignment.", {
  kind: "concept", mins: 15, mathsLabel: "Code",
  hook: "The OA's expected output is `Average: 3.50`, yours prints `Average: 3.5`. One format spec fixes it.",
  intuition: `
**The situation.** Many HackerRank-style OAs check stdout exactly. Wrong decimals, missing padding or a stray space fails the test case.

**The idea.** An f-string evaluates expressions inside braces: \`f"{name} scored {score}"\`. After a colon comes a **format spec**: \`f"{x:.2f}"\` (two decimals), \`f"{x:,}"\` (thousands separator), \`f"{p:.1%}"\` (percentage), \`f"{s:>10}"\` (right-align in 10 characters). \`f"{x=}"\` prints the expression and its value, handy for debugging.
`,
  maths: `
**In one breath.** \`{value:[fill][align][width][,][.precision][type]}\`; types f, %, d, e; align < > ^.

\`\`\`python
avg = 3.5
print(f"Average: {avg:.2f}")          # Average: 3.50
print(f"{1234567.891:,.2f}")          # 1,234,567.89
print(f"{0.4567:.1%}")                # 45.7%
print(f"{42:05d}")                    # 00042
print(f"[{'ab':>5}] [{'ab':<5}] [{'ab':^6}]")  # [   ab] [ab   ] [  ab  ]
print(f"{'x':*^7}")                   # ***x***
print(f"{12345.678:.2e}")             # 1.23e+04
n = 7
print(f"{n=}, {n * 2=}")              # n=7, n * 2=14
print("{} has {:.1f}".format("ravi", 9.25))   # ravi has 9.2 (half-even on the stored value)
print(str(0.1), repr("hi"))           # 0.1 'hi'
\`\`\`

**print details.** \`print(a, b, sep=",", end="")\` controls separators and the trailing newline. \`print(*items)\` prints a list space-separated, a common OA output format.

**Rounding for display vs value.** Format only when printing; keep full precision in calculations.
`,
  practice: `
**OA output checklist.** Match decimals exactly (\`:.2f\`), no trailing spaces, print lists as the expected format (\`print(*a)\` vs \`print(a)\`), one answer per line.

**Reports.** \`f"{amount:,.0f}"\` for money; Indian lakh/crore grouping isn't built in; write a helper if needed.
`,
  traps: [
    { trap: "`round(x, 2)` always prints two decimals.", why: "round(3.5, 2) is 3.5, which prints as 3.5. Use f'{x:.2f}' for fixed decimals in output." },
    { trap: "`print(a)` and `print(*a)` print the same thing for a list.", why: "`print(a)` prints `[1, 2, 3]`; `print(*a)` prints `1 2 3`. OAs usually expect the second." },
  ],
  say: {
    prompt: "How do you control number formatting in Python output, for example two decimals or percentages?",
    secs: 30,
    check: ["f-strings with format spec after colon", ":.2f fixed decimals, :, separators, :.1% percentages", "Width/alignment/fill", "round() vs formatting for display", "print sep/end or *list"],
    followups: [
      { q: "What does `f'{x=}'` do?", a: "Prints the expression text, an equals sign and its value, e.g. `x=7`: quick debugging." },
      { q: "How do you zero-pad an integer to width 5?", a: "`f'{n:05d}'` or `str(n).zfill(5)`." },
      { q: "How do you print a list of numbers on one line separated by commas?", a: "`print(*nums, sep=',')` or `print(','.join(map(str, nums)))`." },
    ],
    answer: `I use f-strings with a format spec after a colon: \`:.2f\` for exactly two decimals, \`:,\` for thousands separators, \`:.1%\` to multiply by 100 and add a percent sign, and width and alignment like \`:>10\`. That's different from round(), which changes the value but doesn't force trailing zeros. For OA output I also watch print's sep and end, and use \`print(*items)\` when the expected output is space-separated.`,
    avoid: ["Using round() to fix displayed decimals"],
  },
  terms: [["Format spec", "Mini-language after ':' inside an f-string."], ["f-string", "String literal prefixed with f that evaluates {expressions}."]],
  sources: [S.io],
});
Q({ id: "py2-fmt-1", d: 1, secs: 30, prompt: "What does `f'{0.4567:.1%}'` produce?", options: ["'45.7%'", "'0.5%'", "'45.6%'", "'0.46%'"], answer: 0, explain: "Multiplied by 100, one decimal.", py: "answer = ['45.7%', '0.5%', '45.6%', '0.46%'].index(f'{0.4567:.1%}')" });
Q({ id: "py2-fmt-2", d: 1, secs: 20, prompt: "What is `len(f'{42:05d}')`?", answer: 5, tol: 0.5, explain: "'00042'.", py: "answer = len(f'{42:05d}')" });
Q({ id: "py2-fmt-3", d: 1, secs: 30, prompt: "What is `len(f'{1234567.891:,.2f}')`?", answer: 12, tol: 0.5, explain: "'1,234,567.89' has 12 characters.", py: "answer = len(f'{1234567.891:,.2f}')" });
Q({ id: "py2-fmt-4", d: 2, secs: 30, prompt: "What does `str(round(3.5, 2))` give? Its length?", answer: 3, tol: 0.5, explain: "'3.5': round doesn't add trailing zeros; use :.2f for '3.50'.", py: "answer = len(str(round(3.5, 2)))" });
C("py2-fmt-c1", "Common format specs", ":.2f decimals · :, thousands · :.1% percent · :05d zero-pad · :>10 right-align");
C("py2-fmt-c2", "Print list space-separated", "print(*items)");

// ───────────────────────── Regex ─────────────────────────

L("py2-regex", M, "Regular expressions", "search vs match vs findall, groups, character classes and quantifiers for extraction and validation.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "Extract every 10-digit mobile number from 50,000 SMS lines. Which `re` function, and what pattern?",
  intuition: `
**The situation.** Validation ("is this a valid PAN/email/phone?") and extraction ("pull all amounts from these messages") are standard DA/DS screening tasks, both in Python and in pandas' \`.str\` methods.

**The idea.** A regular expression is a tiny pattern language. The building blocks:

- **Character classes:** \`\\d\` digit, \`\\w\` word character, \`\\s\` whitespace, \`[A-Z]\` a range, \`[^...]\` not these.
- **Quantifiers:** \`*\` 0+, \`+\` 1+, \`?\` 0 or 1, \`{n}\`, \`{m,n}\`. Greedy by default; add \`?\` to make them lazy.
- **Anchors:** \`^\` start, \`$\` end, \`\\b\` word boundary.
- **Groups:** \`( )\` capture parts; \`(?P<name>...)\` names them.

Always write patterns as raw strings (\`r"\\d+"\`) so backslashes reach the regex engine untouched.
`,
  maths: `
**In one breath.** \`search\` anywhere, \`match\` at start, \`fullmatch\` whole string; \`findall\` returns strings (or tuples of groups); \`sub\` replaces; compile patterns you reuse.

\`\`\`python
import re
msg = "Call 9876543210 or 9123456789; ref ABCDE1234F"
print(re.findall(r"\\b\\d{10}\\b", msg))     # ['9876543210', '9123456789']
print(bool(re.fullmatch(r"[A-Z]{5}\\d{4}[A-Z]", "ABCDE1234F")))  # True  (PAN shape)
print(re.search(r"\\d+", "order 42 of 7").group())   # '42'
print(re.match(r"\\d+", "order 42"))                 # None (not at start)

m = re.search(r"(?P<user>\\w+)@(?P<domain>[\\w.]+)", "mail asha@bits.ac.in now")
print(m["user"], m["domain"])                       # asha bits.ac.in

print(re.findall(r"(\\w+)=(\\d+)", "a=1, b=22"))     # [('a', '1'), ('b', '22')]
print(re.sub(r"\\s+", " ", "too   many    spaces"))   # 'too many spaces'
print(re.findall(r"<.+>", "<a><b>"), re.findall(r"<.+?>", "<a><b>"))
# ['<a><b>'] ['<a>', '<b>']   greedy vs lazy
pat = re.compile(r"₹\\s?([\\d,]+)")
print(pat.findall("Paid ₹1,200 and ₹ 450"))         # ['1,200', '450']
\`\`\`

| Function | Returns |
|---|---|
| \`re.search\` | first match anywhere, or None |
| \`re.match\` | match only at position 0, or None |
| \`re.fullmatch\` | match covering the whole string, or None |
| \`re.findall\` | list of strings, or tuples if there are groups |
| \`re.finditer\` | iterator of Match objects (positions) |
| \`re.sub\` | new string with replacements |
| \`re.split\` | list split on the pattern |
`,
  practice: `
**Validation:** use \`fullmatch\` (or anchor with ^…$) so extra characters fail. **Extraction:** \`findall\`/\`finditer\`, or in pandas \`df.col.str.extract(r"(\\d+)")\`. **Cleaning:** \`re.sub\`.

**Keep it readable.** Compile once outside loops; use named groups; use \`re.VERBOSE\` for long patterns. Don't parse HTML or nested structures with regex.
`,
  traps: [
    { trap: "`re.match` finds the pattern anywhere in the string.", why: "It only matches at the start. Use `re.search` to look anywhere, `re.fullmatch` to require the whole string." },
    { trap: "`.*` between two delimiters captures the shortest piece.", why: "Quantifiers are greedy: `<.+>` on '<a><b>' grabs everything. Use the lazy `.+?` or a negated class like `<[^>]+>`." },
    { trap: "`findall` with a group returns the whole match.", why: "With one group it returns only the group's text; with several, tuples of groups. Use `(?:...)` for grouping without capturing." },
  ],
  say: {
    prompt: "How would you validate and extract phone numbers from text with Python's re module?",
    secs: 45,
    check: ["Raw string patterns", "Character classes and quantifiers (\\d{10}) with word boundaries/anchors", "fullmatch for validation vs findall/finditer for extraction", "Groups / named groups for parts", "compile for reuse; pandas .str.extract equivalent"],
    followups: [
      { q: "Greedy vs lazy quantifiers?", a: "Greedy (`*`, `+`) match as much as possible then backtrack; lazy (`*?`, `+?`) match as little as possible. Lazy or negated classes stop at the first closing delimiter." },
      { q: "search vs match vs fullmatch?", a: "search scans the whole string; match requires the match to start at position 0; fullmatch requires the entire string to match." },
      { q: "What does `(?:...)` do?", a: "Groups without capturing, so it doesn't change what findall returns or group numbering." },
    ],
    answer: `For validation I'd use \`re.fullmatch\` with a raw-string pattern like \`r"[6-9]\\d{9}"\`, so the whole string must be a ten-digit mobile number and nothing else. For extraction I'd use \`re.findall\` with word boundaries, \`r"\\b[6-9]\\d{9}\\b"\`, or finditer if I need positions, and compile the pattern once if I'm looping over many lines. Groups, ideally named, pull out parts like a country code. In pandas the same pattern works with \`.str.extract\` or \`.str.contains\`.`,
    avoid: ["Using re.match to search", "Patterns without raw strings"],
  },
  terms: [["Character class", "Set of allowed characters, e.g. [A-Z] or \\d."], ["Quantifier", "How many times: *, +, ?, {m,n}."], ["Capturing group", "( ) part of a pattern returned separately."]],
  sources: [S.re],
});
Q({ id: "py2-re-1", d: 1, secs: 30, prompt: "What is `len(re.findall(r'\\d+', 'a1b22c333'))`?", answer: 3, tol: 0.5, explain: "['1', '22', '333'].", py: "import re\nanswer = len(re.findall(r'\\d+', 'a1b22c333'))" });
Q({ id: "py2-re-2", d: 1, secs: 30, prompt: "Which call returns a match for the string `'order 42'` with pattern `r'\\d+'`?", options: ["re.match", "re.fullmatch", "re.search", "none of them"], answer: 2, explain: "Only search scans past position 0.", py: "import re\nr = [re.match(r'\\d+', 'order 42'), re.fullmatch(r'\\d+', 'order 42'), re.search(r'\\d+', 'order 42')]\nanswer = [x is not None for x in r].index(True)" });
Q({ id: "py2-re-3", d: 2, secs: 45, prompt: "How many items does `re.findall(r'<.+?>', '<a><bb><c>')` return?", answer: 3, tol: 0.5, explain: "Lazy quantifier stops at each '>': ['<a>', '<bb>', '<c>']. Greedy `<.+>` would return 1.", py: "import re\nanswer = len(re.findall(r'<.+?>', '<a><bb><c>'))" });
Q({ id: "py2-re-4", d: 2, secs: 60, prompt: "```python\nimport re\npairs = re.findall(r'(\\w+)=(\\d+)', 'a=1, b=22, c=x')\nprint(sum(int(v) for _, v in pairs))\n```\nWhat is printed?", answer: 23, tol: 0.5, explain: "c=x doesn't match \\d+; 1 + 22 = 23. findall returns tuples of groups.", py: "import re\npairs = re.findall(r'(\\w+)=(\\d+)', 'a=1, b=22, c=x')\nanswer = sum(int(v) for _, v in pairs)" });
C("py2-re-c1", "search / match / fullmatch", "Anywhere / at start / whole string.");
C("py2-re-c2", "Greedy vs lazy", ".+ grabs as much as possible; .+? as little as possible.");

// ───────────────────────── Counter ─────────────────────────

L("py2-counter", M, "Counter: counting made easy", "Frequency tables, most_common, anagram checks and Counter arithmetic.", {
  kind: "concept", mins: 15, mathsLabel: "Code",
  hook: "Check whether two strings are anagrams, then find the top 3 words in a log. Both are one-liners with Counter.",
  intuition: `
**The situation.** Frequency counting is the most common sub-task in coding rounds: anagrams, majority element, top-k frequent, first unique.

**The idea.** \`collections.Counter\` is a dict subclass mapping items to counts. Missing keys return 0 instead of raising. It adds \`most_common(k)\`, arithmetic (\`+\`, \`-\`, \`&\`, \`|\`) and \`update\`/\`subtract\`. Building one from an iterable is O(n).
`,
  maths: `
**In one breath.** \`Counter(iterable)\`; \`c[x]\` is 0 if missing; \`most_common(k)\`; \`==\` compares counts; \`-\` drops non-positive counts.

\`\`\`python
from collections import Counter
c = Counter("mississippi")
print(c["s"], c["z"])            # 4 0
print(c.most_common(2))          # [('i', 4), ('s', 4)]
print(Counter("listen") == Counter("silent"))    # True: anagram
words = "to be or not to be".split()
print(Counter(words).most_common(1))             # [('to', 2)]

a, b = Counter("aab"), Counter("abc")
print(a + b)       # Counter({'a': 3, 'b': 2, 'c': 1})
print(a - b)       # Counter({'a': 1})  (drops zero/negative)
print(a & b)       # min counts: Counter({'a': 1, 'b': 1})
print(sum(c.values()), len(c))   # 11 4

inv = Counter(apples=3)
inv.update(apples=2, pears=1)    # add counts
print(inv)                       # Counter({'apples': 5, 'pears': 1})
\`\`\`

**Ransom note pattern.** Can note be built from magazine letters? \`not (Counter(note) - Counter(mag))\`.

**Ties in most_common.** Equal counts are ordered by first appearance; sort explicitly (\`sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))\`) if the question specifies a tie-break.
`,
  practice: `
**Reach for Counter when** the question says "frequency", "most/least common", "anagram", "can be formed from", "duplicates". Use \`sorted(s) == sorted(t)\` (O(n log n)) as an alternative anagram check, but Counter is O(n).

**pandas equivalent.** \`series.value_counts()\`.
`,
  traps: [
    { trap: "`most_common` breaks ties alphabetically.", why: "Ties keep insertion (first-seen) order. If the problem wants alphabetical tie-breaks, sort explicitly." },
    { trap: "`a - b` can leave negative counts.", why: "The `-` operator drops zero and negative results; `a.subtract(b)` keeps them." },
  ],
  say: {
    prompt: "How would you find the k most frequent elements in a list, and what's the complexity?",
    secs: 30,
    check: ["Counter to count in O(n)", "most_common(k) (uses a heap for small k)", "Alternative: heapq.nlargest or bucket sort O(n)", "Tie-breaking rule made explicit", "pandas value_counts equivalent"],
    followups: [
      { q: "How can you do top-k frequent in O(n)?", a: "Bucket sort: an array of lists indexed by frequency (max n), then walk from the highest bucket down." },
      { q: "How do you check if two strings are anagrams?", a: "`Counter(s) == Counter(t)` in O(n), or compare sorted strings in O(n log n)." },
      { q: "What does `Counter('aab') & Counter('ab')` give?", a: "Minimum counts: Counter({'a': 1, 'b': 1})." },
    ],
    answer: `I'd count with \`Counter(items)\`, which is O(n), and call \`most_common(k)\`, which uses a heap, so about O(n log k) overall. If the problem specifies tie-breaking, like alphabetical, I'd sort the items by negative count and then key instead. For a strictly linear solution there's bucket sort by frequency, since a count can't exceed n. In pandas the same thing is value_counts().head(k).`,
    avoid: ["Nested loops to count"],
  },
  terms: [["Counter", "dict subclass of item → count."], ["most_common(k)", "k items with the highest counts."]],
  sources: [S.coll],
});
Q({ id: "py2-cnt-1", d: 1, secs: 20, prompt: "What is `Counter('mississippi')['s'] + Counter('mississippi')['z']`?", answer: 4, tol: 0.5, explain: "4 + 0: missing keys count as 0.", py: "from collections import Counter\nc = Counter('mississippi')\nanswer = c['s'] + c['z']" });
Q({ id: "py2-cnt-2", d: 1, secs: 30, prompt: "What is `sum((Counter('aab') - Counter('abbc')).values())`?", answer: 1, tol: 0.5, explain: "a: 2 − 1 = 1; b: 1 − 2 dropped; c dropped. Total 1.", py: "from collections import Counter\nanswer = sum((Counter('aab') - Counter('abbc')).values())" });
Q({ id: "py2-cnt-3", d: 2, secs: 45, prompt: "Can 'aabbc' be built from the letters of 'abcabd' (each letter used once)? Using `not (Counter(note) - Counter(mag))`: 1 = yes, 0 = no.", answer: 1, tol: 0.5, explain: "mag has a:2, b:2, c:1: enough for a:2, b:2, c:1.", py: "from collections import Counter\nanswer = int(not (Counter('aabbc') - Counter('abcabd')))" });
Q({ id: "py2-cnt-4", d: 2, secs: 45, prompt: "`Counter('bbaacd').most_common(1)[0][0]`: which letter? (a=1, b=2)", answer: 2, tol: 0.5, explain: "a and b both have 2; the tie goes to first-seen, 'b'.", py: "from collections import Counter\nanswer = 'ab'.index(Counter('bbaacd').most_common(1)[0][0]) + 1" });
C("py2-cnt-c1", "Anagram check", "Counter(s) == Counter(t), O(n).");
C("py2-cnt-c2", "Counter arithmetic", "+ adds, - subtracts (drops ≤ 0), & min, | max.");

// ───────────────────────── defaultdict and grouping ─────────────────────────

L("py2-defaultdict", M, "defaultdict, grouping and nested data", "Group items by key, adjacency lists, nested dicts and namedtuple records.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "Group words that are anagrams of each other. Which container makes this five lines?",
  intuition: `
**The situation.** "Group by" in plain Python: anagram groups, transactions per customer, graph adjacency lists.

**The idea.** \`defaultdict(factory)\` is a dict that, on a missing key, calls the factory to create a default value and stores it. With \`list\`, \`d[k].append(x)\` just works; with \`int\`, \`d[k] += 1\` counts; with \`set\`, \`d[k].add(x)\` collects uniques.

The trap is that merely **reading** a missing key creates it. Use \`k in d\` or \`d.get(k)\` when you only want to check.
`,
  maths: `
**In one breath.** \`defaultdict(list|int|set|lambda: ...)\`; access creates the key; convert with \`dict(d)\` for output.

\`\`\`python
from collections import defaultdict, namedtuple
words = ["eat", "tea", "tan", "ate", "nat", "bat"]
groups = defaultdict(list)
for w in words:
    groups["".join(sorted(w))].append(w)
print(list(groups.values()))   # [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]

edges = [("a", "b"), ("a", "c"), ("b", "c")]
adj = defaultdict(list)
for u, v in edges:
    adj[u].append(v); adj[v].append(u)   # undirected graph
print(dict(adj))

spend = defaultdict(int)
for cust, amt in [("ravi", 100), ("asha", 50), ("ravi", 25)]:
    spend[cust] += amt
print(dict(spend))              # {'ravi': 125, 'asha': 50}

d = defaultdict(list)
_ = d["ghost"]                  # reading creates the key!
print(len(d))                   # 1

tree = lambda: defaultdict(tree)   # arbitrarily nested dicts
t = tree(); t["a"]["b"]["c"] = 1

Txn = namedtuple("Txn", "cust amount")
t1 = Txn("ravi", 100)
print(t1.amount, t1._asdict())  # 100 {'cust': 'ravi', 'amount': 100}
\`\`\`

**Plain-dict alternative.** \`d.setdefault(k, []).append(x)\` does the same without importing, but builds a new empty list on every call.
`,
  practice: `
**Patterns.** Anagram groups (key = sorted letters or a 26-count tuple), inverted index (word → set of doc ids), adjacency lists for BFS/DFS, per-key aggregates before you reach for pandas.

**Output.** Convert to a normal dict (\`dict(d)\`) before returning/printing if the expected output shouldn't show \`defaultdict(...)\`.
`,
  traps: [
    { trap: "`if d[k]:` safely checks a defaultdict.", why: "Reading a missing key inserts it with a default value, silently growing the dict. Use `k in d`." },
    { trap: "`defaultdict([])` creates list defaults.", why: "The argument must be a callable (factory): `defaultdict(list)`, not an instance." },
  ],
  say: {
    prompt: "How would you group a list of words into anagram groups in Python?",
    secs: 30,
    check: ["Key = canonical form (sorted letters or count tuple)", "defaultdict(list) and append", "Complexity: O(n · k log k) with sorting, O(n · k) with counts", "Return list of groups / dict(d)", "Notes that reading creates keys"],
    followups: [
      { q: "How do you avoid sorting each word?", a: "Use a tuple of 26 letter counts as the key: O(k) per word instead of O(k log k)." },
      { q: "What's the difference between defaultdict and dict.setdefault?", a: "Same effect; defaultdict builds the default only when missing and keeps call sites short; setdefault creates the default object on every call." },
      { q: "When is namedtuple better than a dict for records?", a: "When fields are fixed: attribute access, immutability, less memory, tuple behaviour for sorting/unpacking." },
    ],
    answer: `Anagrams share the same letters, so I compute a canonical key for each word, either the sorted letters joined into a string or a tuple of 26 letter counts, and append the word to \`groups[key]\` in a \`defaultdict(list)\`. Then I return \`list(groups.values())\`. With sorting it's O(n · k log k) for n words of length k; with count tuples it's O(n · k). One thing to watch with defaultdict is that just reading a missing key creates it.`,
    avoid: ["Comparing every pair of words (O(n²))"],
  },
  terms: [["defaultdict", "dict that creates missing values with a factory."], ["Adjacency list", "Map from node to its neighbours."], ["namedtuple", "Tuple with named fields."]],
  sources: [S.coll],
});
Q({ id: "py2-dd-1", d: 1, secs: 30, prompt: "```python\nfrom collections import defaultdict\ng = defaultdict(list)\nfor w in ['eat', 'tea', 'tan', 'ate', 'nat', 'bat']:\n    g[''.join(sorted(w))].append(w)\nprint(len(g))\n```\nWhat is printed?", answer: 3, tol: 0.5, explain: "Groups: aet, ant, abt.", py: "from collections import defaultdict\ng = defaultdict(list)\nfor w in ['eat', 'tea', 'tan', 'ate', 'nat', 'bat']:\n    g[''.join(sorted(w))].append(w)\nanswer = len(g)" });
Q({ id: "py2-dd-2", d: 2, secs: 45, prompt: "```python\nfrom collections import defaultdict\nd = defaultdict(int)\nfor k in 'abc':\n    if d[k] > 0:\n        pass\nd['a'] += 2\nprint(len(d))\n```\nWhat is printed?", answer: 3, tol: 0.5, explain: "Reading d[k] inserted a, b and c with 0.", py: "from collections import defaultdict\nd = defaultdict(int)\nfor k in 'abc':\n    if d[k] > 0:\n        pass\nd['a'] += 2\nanswer = len(d)" });
Q({ id: "py2-dd-3", d: 1, secs: 30, prompt: "Edges (a,b), (a,c), (b,c) added to an undirected adjacency list. How many neighbours does 'a' have?", answer: 2, tol: 0.5, explain: "b and c.", py: "from collections import defaultdict\nadj = defaultdict(list)\nfor u, v in [('a', 'b'), ('a', 'c'), ('b', 'c')]:\n    adj[u].append(v); adj[v].append(u)\nanswer = len(adj['a'])" });
Q({ id: "py2-dd-4", d: 1, secs: 30, prompt: "Which creates a dict whose missing values are empty sets?", options: ["defaultdict({})", "defaultdict(set)", "defaultdict(set())", "dict(default=set)"], answer: 1, explain: "The factory must be a callable: set.", py: "answer = 1" });
C("py2-dd-c1", "Grouping in plain Python", "g = defaultdict(list); g[key(x)].append(x)");
C("py2-dd-c2", "defaultdict gotcha", "Reading a missing key creates it; test with `k in d`.");

// ───────────────────────── deque ─────────────────────────

L("py2-deque", M, "deque: queues, BFS and sliding windows", "O(1) appends and pops at both ends; BFS queues, bounded history and monotonic deques.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "BFS with `queue.pop(0)` passes small tests and times out on large ones. One import fixes it.",
  intuition: `
**The situation.** Breadth-first search, "last N events", sliding-window maximum: all need fast operations at both ends of a sequence.

**The idea.** \`collections.deque\` (double-ended queue) is built from linked blocks, so \`append\`, \`appendleft\`, \`pop\` and \`popleft\` are all O(1). A list is O(n) at the front. Indexing the middle of a deque is O(n), so use it as a queue, not as an array.

\`deque(maxlen=k)\` keeps only the last k items: appending to a full deque drops from the other end automatically.
`,
  maths: `
**In one breath.** Queue = \`append\` + \`popleft\`; stack = \`append\` + \`pop\`; \`maxlen\` for bounded history; monotonic deque for window max in O(n).

\`\`\`python
from collections import deque

def bfs(start, adj):
    dist = {start: 0}
    q = deque([start])
    while q:
        u = q.popleft()                  # O(1)
        for v in adj[u]:
            if v not in dist:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist
adj = {1: [2, 3], 2: [4], 3: [4], 4: []}
print(bfs(1, adj))                       # {1: 0, 2: 1, 3: 1, 4: 2}

last3 = deque(maxlen=3)
for x in [1, 2, 3, 4, 5]:
    last3.append(x)
print(list(last3))                       # [3, 4, 5]

def window_max(a, k):
    dq, out = deque(), []                # holds indices, values decreasing
    for i, x in enumerate(a):
        while dq and a[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            out.append(a[dq[0]])
    return out
print(window_max([1, 3, -1, -3, 5, 3, 6, 7], 3))   # [3, 3, 5, 5, 6, 7]

d = deque([1, 2, 3]); d.rotate(1); print(d)        # deque([3, 1, 2])
\`\`\`

| Operation | list | deque |
|---|---|---|
| append / pop at right | O(1) | O(1) |
| insert / pop at left | O(n) | O(1) |
| index in the middle | O(1) | O(n) |
`,
  practice: `
**Use deque for** BFS (shortest path in unweighted graphs, level-order traversal, grid flood fill), task queues, recent-history buffers, sliding-window max/min (monotonic deque).

**Monotonic deque idea.** Keep indices whose values are decreasing; anything smaller than the new element can never be a future maximum, so pop it. Each index enters and leaves once: O(n).
`,
  traps: [
    { trap: "A list is fine as a queue.", why: "`list.pop(0)` shifts every element: O(n) per pop, O(n²) for BFS. Use deque.popleft()." },
    { trap: "deque supports fast random access like a list.", why: "Indexing near the middle is O(n). It's a queue, not an array." },
  ],
  say: {
    prompt: "Why use a deque for BFS, and how does a monotonic deque give the sliding-window maximum in O(n)?",
    secs: 60,
    check: ["deque O(1) at both ends vs list O(n) pop(0)", "BFS: append neighbours, popleft, visited set/dict", "Monotonic deque stores indices with decreasing values", "Pop smaller values from the back, expired index from the front", "Each index pushed/popped once → O(n)"],
    followups: [
      { q: "Why does BFS find shortest paths in unweighted graphs?", a: "It explores nodes in order of distance: all nodes at distance d are dequeued before any at distance d + 1." },
      { q: "What does `deque(maxlen=3)` do when full?", a: "Appending on one end discards an item from the opposite end." },
      { q: "When would you use heapq instead of deque?", a: "When items must come out by priority (Dijkstra, top-k), not by arrival order." },
    ],
    answer: `BFS needs a FIFO queue. With a list, pop(0) shifts every element, so it's O(n) per pop; deque's popleft is O(1), which keeps BFS at O(V + E).

For the sliding-window maximum I keep a deque of indices whose values are decreasing from front to back. For each new element I pop indices from the back while their values are smaller, because they can never be the maximum again, then append the new index; if the front index has left the window I pop it from the front. The front is always the current maximum. Every index goes in and out at most once, so the whole pass is O(n).`,
    avoid: ["Using a list as a queue", "Recomputing max per window (O(nk))"],
  },
  terms: [["deque", "Double-ended queue with O(1) operations at both ends."], ["BFS", "Breadth-first search using a FIFO queue."], ["Monotonic deque", "Deque kept sorted by value to answer window max/min."]],
  sources: [S.coll],
});
Q({ id: "py2-dq-1", d: 1, secs: 30, prompt: "```python\nfrom collections import deque\nd = deque(maxlen=3)\nfor x in range(1, 8):\n    d.append(x)\nprint(sum(d))\n```\nWhat is printed?", answer: 18, tol: 0.5, explain: "Only the last three remain: 5 + 6 + 7.", py: "from collections import deque\nd = deque(maxlen=3)\nfor x in range(1, 8):\n    d.append(x)\nanswer = sum(d)" });
Q({ id: "py2-dq-2", d: 2, secs: 60, prompt: "BFS from node 1 on `adj = {1: [2, 3], 2: [4], 3: [4], 4: [5], 5: []}`. Distance to node 5?", answer: 3, tol: 0.5, explain: "1 → 2 → 4 → 5.", py: "from collections import deque\nadj = {1: [2, 3], 2: [4], 3: [4], 4: [5], 5: []}\ndist = {1: 0}; q = deque([1])\nwhile q:\n    u = q.popleft()\n    for v in adj[u]:\n        if v not in dist:\n            dist[v] = dist[u] + 1; q.append(v)\nanswer = dist[5]" });
Q({ id: "py2-dq-3", d: 2, secs: 60, prompt: "Sliding-window maximum of `[4, 2, 12, 3, 8, 1]` with k = 3. What is the sum of the window maxima?", answer: 44, tol: 0.5, explain: "Windows [4,2,12], [2,12,3], [12,3,8], [3,8,1] have maxima 12, 12, 12, 8: sum 44.", py: "a = [4, 2, 12, 3, 8, 1]\nanswer = sum(max(a[i:i + 3]) for i in range(len(a) - 2))" });
Q({ id: "py2-dq-4", d: 1, secs: 30, prompt: "```python\nfrom collections import deque\nd = deque([1, 2, 3, 4])\nd.rotate(1)\nprint(d[0])\n```\nWhat is printed?", answer: 4, tol: 0.5, explain: "rotate(1) moves the last element to the front.", py: "from collections import deque\nd = deque([1, 2, 3, 4])\nd.rotate(1)\nanswer = d[0]" });
C("py2-dq-c1", "Queue in Python", "deque: append + popleft (O(1)). Never list.pop(0) in a loop.");
C("py2-dq-c2", "Sliding-window max", "Monotonic deque of indices, values decreasing; O(n).");

// ───────────────────────── heapq and bisect ─────────────────────────

L("py2-heapq-bisect", M, "heapq and bisect", "Priority queues, top-k, merging sorted streams, and binary search on sorted lists.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "Keep the 10 largest values from a stream of a million without sorting it. And find where 73 fits in a sorted score list in O(log n).",
  intuition: `
**The situation.** Top-k, "k closest", scheduling by priority, merging sorted files, Dijkstra; and range lookups like "which grade band does this score fall into".

**heapq.** A binary **min-heap** stored in a plain list: \`heap[0]\` is always the smallest. Push and pop are O(log n); \`heapify\` turns a list into a heap in O(n). For a max-heap, push negated values. To keep the k largest of a stream, keep a min-heap of size k and pop whenever it grows past k: the smallest of the top k sits at the root, ready to be evicted.

**bisect.** Binary search on an already-sorted list: \`bisect_left(a, x)\` gives the first index where x could be inserted keeping order (O(log n)). Inserting with \`insort\` is still O(n) because of the shift.
`,
  maths: `
**In one breath.** heappush/heappop O(log n), heapify O(n), \`heap[0]\` is the min; negate for max; size-k heap for top-k in O(n log k). \`bisect_left\` / \`bisect_right\` O(log n).

\`\`\`python
import heapq
h = [5, 1, 8, 3]
heapq.heapify(h)                  # O(n)
heapq.heappush(h, 0)
print(heapq.heappop(h), h[0])     # 0 1

def top_k(stream, k):
    h = []
    for x in stream:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)      # evict the smallest
    return sorted(h, reverse=True)
print(top_k([5, 1, 9, 3, 7, 6], 3))     # [9, 7, 6]

tasks = []
heapq.heappush(tasks, (2, "write tests"))
heapq.heappush(tasks, (1, "fix bug"))
print(heapq.heappop(tasks))       # (1, 'fix bug')   tuples compare by priority first

maxh = [-x for x in [5, 1, 8]]; heapq.heapify(maxh)
print(-maxh[0])                   # 8
print(list(heapq.merge([1, 4, 7], [2, 3, 9])))   # [1, 2, 3, 4, 7, 9]

from bisect import bisect_left, bisect_right, insort
a = [10, 20, 20, 30]
print(bisect_left(a, 20), bisect_right(a, 20))   # 1 3
print(bisect_right(a, 20) - bisect_left(a, 20))  # count of 20s: 2
def grade(score, cuts=[60, 70, 80, 90], letters="FDCBA"):
    return letters[bisect_right(cuts, score)]
print(grade(73), grade(90))       # C A
insort(a, 25); print(a)           # [10, 20, 20, 25, 30]
\`\`\`

| Task | Tool | Cost |
|---|---|---|
| min / max once | min(), max() | O(n) |
| top-k, small k | size-k heap / nlargest | O(n log k) |
| repeatedly take the smallest | heap | O(log n) each |
| position in sorted list | bisect | O(log n) |
`,
  practice: `
**Heaps** for: k largest/smallest, k closest points (heap of (-dist, point)), merge k sorted lists, running median (two heaps), Dijkstra, meeting rooms (heap of end times).

**Bisect** for: banding/bucketing values against cut-offs, counting values in a range (\`bisect_right(a, hi) - bisect_left(a, lo)\`), binary-search-the-answer problems on a sorted array.

**Ties in heaps.** If priorities can tie and payloads aren't comparable, add a counter: \`(priority, next(counter), item)\`.
`,
  traps: [
    { trap: "`heapq` gives a max-heap with `reverse=True`.", why: "heapq is min-heap only (before 3.14's _max functions). Push negated keys for max-heap behaviour." },
    { trap: "A heap list is sorted.", why: "Only `heap[0]` is guaranteed to be the smallest; the rest is partially ordered. Pop repeatedly or sort to get order." },
    { trap: "`insort` is O(log n).", why: "Finding the position is O(log n) but inserting shifts elements: O(n)." },
  ],
  say: {
    prompt: "How would you find the k largest elements of a very large stream, and what's the complexity?",
    secs: 45,
    check: ["Min-heap of size k", "Push each item, pop when size > k (root = smallest of top k)", "O(n log k) time, O(k) memory", "Compare: sort O(n log n), nlargest, quickselect O(n) average", "Negation for max-heap / tuples for priorities"],
    followups: [
      { q: "Why a min-heap for the largest elements?", a: "The root is the smallest of the current top k, which is exactly the element to discard when a bigger one arrives." },
      { q: "bisect_left vs bisect_right?", a: "For a value already present, bisect_left returns the index before existing equal elements, bisect_right the index after them. Their difference counts occurrences." },
      { q: "How do you maintain a running median?", a: "Two heaps: a max-heap (negated) for the lower half and a min-heap for the upper half, rebalanced so sizes differ by at most one; the median is at the roots. O(log n) per insert." },
    ],
    answer: `I'd keep a min-heap of at most k items. For every incoming value I push it, and if the heap grows past k I pop the root, which is the smallest of the current candidates. At the end the heap holds the k largest. That's O(n log k) time and O(k) memory, which beats sorting everything at O(n log n) when k is small, and it works on a stream that doesn't fit in memory. heapq.nlargest does the same thing in one call; quickselect is O(n) on average if the data fits in memory.`,
    avoid: ["Sorting the whole stream", "Using a max-heap of all n items when k is small"],
  },
  terms: [["Min-heap", "Tree in a list where every parent ≤ its children; root is the minimum."], ["heapify", "Turn a list into a heap in O(n)."], ["bisect_left", "Leftmost insertion point that keeps a list sorted."]],
  sources: [S.heapq, S.bisect],
});
Q({ id: "py2-hb-1", d: 1, secs: 30, prompt: "```python\nimport heapq\nh = [5, 1, 8, 3]\nheapq.heapify(h)\nheapq.heappush(h, 2)\nheapq.heappop(h)\nprint(h[0])\n```\nWhat is printed?", answer: 2, tol: 0.5, explain: "Pop removes 1; the new minimum is 2.", py: "import heapq\nh = [5, 1, 8, 3]\nheapq.heapify(h)\nheapq.heappush(h, 2)\nheapq.heappop(h)\nanswer = h[0]" });
Q({ id: "py2-hb-2", d: 1, secs: 30, prompt: "`a = [10, 20, 20, 20, 30]`. What is `bisect_right(a, 20) - bisect_left(a, 20)`?", answer: 3, tol: 0.5, explain: "4 − 1 = 3 occurrences of 20.", py: "from bisect import bisect_left, bisect_right\na = [10, 20, 20, 20, 30]\nanswer = bisect_right(a, 20) - bisect_left(a, 20)" });
Q({ id: "py2-hb-3", d: 2, secs: 60, prompt: "Keep a min-heap of size 3 over the stream 5, 1, 9, 3, 7, 6 (push, then pop if size > 3). What is the heap's root at the end?", answer: 6, tol: 0.5, explain: "The heap holds the top 3 {6, 7, 9}; the root is the smallest, 6.", py: "import heapq\nh = []\nfor x in [5, 1, 9, 3, 7, 6]:\n    heapq.heappush(h, x)\n    if len(h) > 3:\n        heapq.heappop(h)\nanswer = h[0]" });
Q({ id: "py2-hb-4", d: 2, secs: 45, prompt: "Grade cut-offs `[60, 70, 80, 90]` with letters 'FDCBA' and `letters[bisect_right(cuts, score)]`. Which letter is score 80? (F=1, D=2, C=3, B=4, A=5)", answer: 4, tol: 0.5, explain: "bisect_right([60,70,80,90], 80) = 3 → 'B'. A score exactly on a cut-off moves up.", py: "from bisect import bisect_right\nl = 'FDCBA'[bisect_right([60, 70, 80, 90], 80)]\nanswer = 'FDCBA'.index(l) + 1" });
C("py2-hb-c1", "Top-k largest", "Min-heap of size k; pop when it exceeds k. O(n log k).");
C("py2-hb-c2", "Count x in sorted a", "bisect_right(a, x) − bisect_left(a, x)");

// ───────────────────────── Interview lesson ─────────────────────────

L("py2-strcoll-practice", M, "Strings and collections practice", "Typical OA string and counting problems, talked through out loud.", {
  kind: "interview", mins: 30, prereq: ["py2-str-methods", "py2-counter", "py2-deque"],
  hook: "Answer each out loud, name the data structure and the complexity, then check the points.",
}, [
  iq("Find the length of the longest substring without repeating characters.", "Sliding window with a dict of last-seen positions: move the right pointer; if the character was seen inside the current window, jump the left pointer to last_seen + 1; track the max window length. O(n) time, O(k) space for the alphabet.", ["Sliding window", "Last-seen index dict", "Left jumps past the duplicate", "O(n) time"]),
  iq("Given a list of log lines 'user,action,timestamp', return the top 3 users by number of actions.", "Split each line once, count users with Counter, and return most_common(3), specifying the tie-break (e.g. alphabetical) if needed. Handle blank or malformed lines. O(n log k) or O(n) with counting plus a small sort.", ["Parse with split (or csv module)", "Counter / dict counts", "most_common or heap for top 3", "Edge cases: malformed lines, ties"]),
  iq("Check whether a string of brackets '()[]{}' is balanced.", "Use a list as a stack: push opening brackets; on a closing bracket, check the stack is non-empty and its top matches (via a dict mapping closers to openers), then pop. At the end the stack must be empty. O(n).", ["Stack push/pop", "Closing-to-opening map", "Empty-stack and leftover checks", "O(n)"]),
  iq("Compress a string like 'aaabccdddd' to 'a3b1c2d4'; return the original if the result isn't shorter.", "Walk the string counting runs (or itertools.groupby), append char + count to a list, join once, compare lengths. O(n). Avoid repeated string concatenation.", ["Run-length counting (groupby or manual)", "List + join", "Length comparison rule", "O(n)"]),
  iq("Return the k closest points to the origin.", "Compute squared distances (no sqrt needed) and use heapq.nsmallest(k, points, key=...) or a max-heap of size k with negated distances. O(n log k). Sorting is O(n log n); quickselect is O(n) average.", ["Squared distance", "Heap of size k / nsmallest", "Complexity comparison", "Ties handled"]),
  iq("Given a sorted list of timestamps, count how many fall in [start, end].", "bisect_right(ts, end) − bisect_left(ts, start): two binary searches, O(log n) per query instead of a linear scan.", ["Uses sortedness", "bisect_left/right bounds", "Inclusive vs exclusive ends", "O(log n)"]),
]);
