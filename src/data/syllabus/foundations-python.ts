import { C, N, Q, R, T } from "./build";

const CS50P = R("Harvard CS50P", "https://cs50.harvard.edu/python/", "Lectures 0–4, 6 and 8 cover what interviews assume");
const HR = R("HackerRank Python", "https://www.hackerrank.com/domains/python", "Short graded drills by topic");
const KP = R("Kaggle: Pandas", "https://www.kaggle.com/learn/pandas", "Six short interactive lessons");
const LC30 = R("LeetCode: 30 Days of Pandas", "https://leetcode.com/studyplan/30-days-of-pandas/", "Pandas versions of SQL-style questions");
const NEET = R("NeetCode roadmap", "https://neetcode.io/roadmap", "Arrays, hashing, two pointers, sliding window first");

T("py-core", "foundations", "Python", "Core Python: types, control flow, comprehensions", "The language features every OA and interview assumes.", `
**Built-in types.** \`int\`, \`float\`, \`bool\`, \`str\`, \`None\`; containers \`list\` (ordered, mutable), \`tuple\` (ordered, immutable), \`dict\` (key → value, insertion-ordered), \`set\` (unique, unordered).

**Mutability.** Lists, dicts and sets can change in place; strings and tuples cannot. Assignment copies the reference, not the object: \`b = a\` makes both names point at the same list. Copy with \`a[:]\` or \`a.copy()\` (shallow) or \`copy.deepcopy(a)\` (nested).

**Truthiness.** \`0\`, \`0.0\`, \`''\`, \`[]\`, \`{}\`, \`set()\`, \`None\` are falsy; everything else is truthy.

**\`==\` vs \`is\`.** \`==\` compares values; \`is\` compares identity. Use \`is None\`.

**Division.** \`7 / 2 = 3.5\`, \`7 // 2 = 3\` (floor), \`7 % 2 = 1\`, \`2 ** 10 = 1024\`. Floor division rounds toward negative infinity: \`-7 // 2 = -4\`.

**Slicing.** \`s[start:stop:step]\`, stop excluded. \`s[::-1]\` reverses; \`s[-1]\` is the last element.

**Comprehensions.**

\`\`\`
squares = [x * x for x in range(10) if x % 2 == 0]
lookup  = {name: len(name) for name in names}
unique  = {x % 3 for x in nums}
total   = sum(x for x in nums)        # generator: lazy, no list built
\`\`\`

**Loops.** \`for i, x in enumerate(xs)\`, \`for a, b in zip(xs, ys)\`, \`range(start, stop, step)\`. \`break\`, \`continue\`, and a loop \`else\` that runs when no break happened.

**Sorting.** \`sorted(xs)\` returns a new list; \`xs.sort()\` sorts in place and returns None. Both take \`key=\` and \`reverse=\`. Multi-key: \`sorted(rows, key=lambda r: (-r[1], r[0]))\`. Python's sort is stable.

**Complexity to remember.** List index and append O(1); \`x in list\` O(n); insert/delete at the front O(n). Dict and set lookup, insert and delete O(1) on average. Sorting O(n log n).
`, { resources: [CS50P, HR], categories: ["python/basics"] });
Q(1, "`7 // 2` and `7 % 2` evaluate to…", ["3.5 and 1", "3 and 1", "4 and 1", "3 and 0.5"], 1, "Floor division and remainder.");
Q(1, "`a = [1, 2]; b = a; b.append(3)`. What is `a`?", ["[1, 2]", "[1, 2, 3]", "[3]", "Error"], 1, "b is another name for the same list.");
Q(2, "`[x * 2 for x in range(5) if x % 2]` is…", ["[0, 4, 8]", "[2, 6]", "[1, 3]", "[0, 2, 4, 6, 8]"], 1, "x % 2 is truthy for 1 and 3, doubled to 2 and 6.");
Q(1, "`'placement'[::-1][:3]` is…", ["'pla'", "'tne'", "'ent'", "'alp'"], 1, "Reversed is 'tnemecalp'; the first three characters are 'tne'.");
Q(2, "`xs = [3, 1, 2]; y = xs.sort()`. What is `y`?", ["[1, 2, 3]", "None", "[3, 1, 2]", "Error"], 1, "list.sort() sorts in place and returns None. Use sorted(xs) for a new list.");
N(2, "`-7 // 2` in Python equals…", -4, 0, "Floor division rounds toward negative infinity.");
Q(2, "Average time for `x in s` where s is a set of n items?", ["O(n)", "O(log n)", "O(1)", "O(n log n)"], 2, "Hash lookup. For a list it is O(n).");
Q(2, "Which is falsy?", ["[0]", "'0'", "{}", "' '"], 2, "An empty dict is falsy. [0], '0' and ' ' are non-empty.");
Q(3, "`def f(x, acc=[]): acc.append(x); return acc`. After `f(1)` then `f(2)` the second call returns…", ["[2]", "[1, 2]", "[1]", "Error"], 1, "The default list is created once and shared between calls. Use acc=None and create inside.");
Q(2, "`sorted(['bb', 'a', 'ccc'], key=len, reverse=True)` gives…", ["['a', 'bb', 'ccc']", "['ccc', 'bb', 'a']", "['bb', 'a', 'ccc']", "['ccc', 'a', 'bb']"], 1, "Sorted by length, longest first.");
C("== vs is", "== compares values; is compares identity. Use `is None`.");
C("Shallow vs deep copy", "a.copy() / a[:] copy the outer container only; copy.deepcopy copies nested objects too.");
C("Mutable default argument trap", "def f(x, acc=[]) shares one list across calls. Use acc=None, then acc = [] inside.");
C("sorted() vs list.sort()", "sorted returns a new list; .sort() works in place and returns None. Both stable, both accept key= and reverse=.");

T("py-collections", "foundations", "Python", "Strings, dicts, sets and the collections module", "Counting, grouping and text handling.", `
**Strings** are immutable sequences.

- \`s.lower()\`, \`s.upper()\`, \`s.strip()\`, \`s.split()\` (no argument: any whitespace, no empty pieces), \`sep.join(parts)\`
- \`s.replace(a, b)\`, \`s.startswith(x)\`, \`s.find(x)\` (−1 if absent), \`s.count(x)\`, \`x in s\`
- \`s.isdigit()\`, \`s.isalpha()\`, \`s.isalnum()\`
- f-strings: \`f"{name}: {value:.2f}"\`, \`f"{n:,}"\`

Building a string in a loop with \`+=\` is O(n²); collect pieces in a list and \`''.join\` them.

**Dicts.**

\`\`\`
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1

for key, value in counts.items(): ...
d.setdefault(key, []).append(x)      # grouping
\`\`\`

Keys must be hashable (str, int, tuple), not lists. \`d[key]\` raises KeyError if missing; \`d.get(key)\` returns None.

**Sets.** \`a | b\` union, \`a & b\` intersection, \`a - b\` difference, \`a ^ b\` symmetric difference. Use a set for "have I seen this?" and for removing duplicates (order is lost).

**collections.**

- \`Counter(xs)\`: counts; \`.most_common(k)\`
- \`defaultdict(list)\`: missing keys start as an empty list
- \`deque\`: O(1) append and pop at both ends (queues, sliding windows)

**heapq**: \`heappush\`, \`heappop\`, \`nlargest(k, xs)\` for top-k in O(n log k).

Anagram check: \`sorted(a) == sorted(b)\` or \`Counter(a) == Counter(b)\`. Group anagrams by using the sorted letters as a dict key.
`, { resources: [HR, CS50P], categories: ["python/strings"] });
Q(1, "`'a,b,,c'.split(',')` returns…", ["['a', 'b', 'c']", "['a', 'b', '', 'c']", "['a,b,,c']", "Error"], 1, "An explicit separator keeps empty pieces. split() with no argument would not.");
Q(1, "`'-'.join(['x', 'y', 'z'])` is…", ["'xyz'", "'x-y-z'", "'-xyz'", "['x-y-z']"], 1, "join places the separator between items.");
Q(2, "`d = {'a': 1}; d.get('b', 0) + 1` is…", ["KeyError", "1", "0", "None"], 1, "get returns the default 0 when the key is missing.");
Q(2, "Which cannot be a dict key?", ["(1, 2)", "'ab'", "[1, 2]", "3.5"], 2, "Lists are mutable and unhashable.");
Q(2, "`{1, 2, 3} & {2, 3, 4}` is…", ["{1, 2, 3, 4}", "{2, 3}", "{1}", "{1, 4}"], 1, "& is intersection.");
Q(2, "`Counter('banana').most_common(1)` returns…", ["[('a', 3)]", "[('b', 1)]", "('a', 3)", "{'a': 3}"], 0, "A list of (element, count) pairs.");
Q(2, "Best structure for a queue with O(1) removal from the front?", ["list", "tuple", "collections.deque", "set"], 2, "list.pop(0) is O(n); deque.popleft() is O(1).");
Q(3, "Building a long string with `s += piece` inside a loop is slow because…", ["strings are immutable, so each += copies", "+= is not allowed on strings", "the loop is interpreted", "pieces are sorted"], 0, "Collect pieces in a list and join once.");
C("Count items in one pass", "counts[x] = counts.get(x, 0) + 1, or collections.Counter(xs).");
C("Group items by a key", "d.setdefault(key, []).append(x), or defaultdict(list).");
C("Set operators", "| union, & intersection, - difference, ^ symmetric difference.");

T("py-functions", "foundations", "Python", "Functions, OOP, errors and files", "Arguments, lambdas, classes, exceptions, JSON and calling APIs.", `
**Functions.** Positional and keyword arguments, defaults, \`*args\` (extra positionals as a tuple), \`**kwargs\` (extra keywords as a dict). Variables assigned inside a function are local. Functions are objects: pass them as arguments (\`key=len\`).

\`lambda x: x * 2\` is a one-expression anonymous function. \`map(f, xs)\`, \`filter(pred, xs)\` return lazy iterators; comprehensions are usually clearer.

**Generators.** A function with \`yield\` produces values one at a time and keeps its state; good for large files and streams.

**Decorators** wrap a function to add behaviour (timing, caching): \`@functools.lru_cache\` memoises.

**Classes.**

\`\`\`
class Account:
    rate = 0.04                     # class attribute, shared
    def __init__(self, owner, balance=0):
        self.owner = owner          # instance attributes
        self.balance = balance
    def deposit(self, amt):
        self.balance += amt
    def __repr__(self):
        return f"Account({self.owner!r}, {self.balance})"

class Savings(Account):             # inheritance
    def interest(self):
        return self.balance * self.rate
\`\`\`

Four ideas interviewers ask for: **encapsulation** (data and methods together, internals hidden), **abstraction** (expose what, hide how), **inheritance** (a subclass reuses and extends a parent; \`super().__init__()\`), **polymorphism** (same method name, different behaviour by type).

**Exceptions.**

\`\`\`
try:
    value = int(text)
except ValueError as e:
    value = None
else:
    ...          # ran only if no exception
finally:
    ...          # always runs
\`\`\`

Catch specific exceptions. \`raise ValueError("msg")\` signals an error.

**Files and JSON.** \`with open(path) as f:\` closes the file for you. \`json.loads(text)\` → Python objects, \`json.dumps(obj)\` → text. CSV: the \`csv\` module or pandas.

**Calling an API.** \`requests.get(url, params=…, headers=…, timeout=10)\`, check \`r.status_code\` (200 OK, 201 created, 400 bad request, 401 unauthenticated, 403 forbidden, 404 not found, 429 rate limited, 500 server error), then \`r.json()\`. GET reads, POST creates, PUT replaces, PATCH updates part, DELETE removes. Handle timeouts and retries with backoff on 429/5xx.
`, { resources: [CS50P, R("Real Python: OOP in Python", "https://realpython.com/python3-object-oriented-programming/", "Classes and inheritance with examples")] });
Q(1, "`def f(*args)`: inside f, args is a…", ["list", "tuple", "dict", "set"], 1, "Extra positional arguments arrive as a tuple; **kwargs is a dict.");
Q(1, "Which block always runs, error or not?", ["else", "except", "finally", "try"], 2, "finally is for clean-up.");
Q(2, "Polymorphism means…", ["hiding data", "one interface, different behaviour depending on the object's type", "a class with no methods", "multiple return values"], 1, "For example, different classes each implementing area().");
Q(2, "`super().__init__(name)` in a subclass…", ["creates a new parent object", "runs the parent's initialiser on this object", "deletes the parent", "is required in every method"], 1, "It lets the subclass reuse the parent's set-up.");
Q(2, "A function containing `yield` returns…", ["a list", "a generator that produces values lazily", "None", "a tuple"], 1, "Values are produced on demand and state is kept between them.");
Q(2, "HTTP status 429 means…", ["not found", "server error", "too many requests (rate limited)", "created"], 2, "Back off and retry later.");
Q(2, "Which HTTP method should create a new resource?", ["GET", "POST", "DELETE", "HEAD"], 1, "POST creates; PUT replaces; PATCH partially updates.");
Q(2, "`json.loads('{\"a\": [1, 2]}')['a'][1]` is…", ["1", "2", "'2'", "Error"], 1, "loads parses text into a dict; the list's second element is 2.");
Q(3, "A class attribute differs from an instance attribute because it…", ["is private", "is shared by all instances unless overridden", "cannot be read", "must be a number"], 1, "Defined on the class body, not on self.");
C("Four pillars of OOP", "Encapsulation, abstraction, inheritance, polymorphism.");
C("*args and **kwargs", "Extra positional arguments as a tuple; extra keyword arguments as a dict.");
C("try / except / else / finally", "else runs if no exception; finally always runs.");
C("HTTP status families", "2xx success, 3xx redirect, 4xx client error (401 unauthenticated, 403 forbidden, 404 not found, 429 rate limit), 5xx server error.");

T("py-numpy", "foundations", "Python", "NumPy", "Arrays, vectorisation, broadcasting and axes.", `
A NumPy array is a fixed-type, n-dimensional block of numbers. Operations run in compiled code, so replacing a Python loop with an array expression (vectorisation) is typically tens of times faster.

\`\`\`
import numpy as np
a = np.array([[1, 2, 3], [4, 5, 6]])     # shape (2, 3)
a.shape, a.dtype, a.ndim
np.zeros((2, 3)), np.ones(4), np.arange(0, 10, 2), np.linspace(0, 1, 5)
\`\`\`

**Element-wise maths.** \`a + b\`, \`a * b\`, \`a ** 2\`, \`np.sqrt(a)\`. \`a * b\` is element-wise; matrix product is \`a @ b\` or \`np.dot\`.

**Axes.** \`axis=0\` runs down the rows and gives one result per column; \`axis=1\` runs across columns and gives one result per row. \`a.sum(axis=0)\` → \`[5, 7, 9]\`; \`a.sum(axis=1)\` → \`[6, 15]\`.

**Indexing.** \`a[0, 1]\`, slices \`a[:, 1]\`, boolean masks \`a[a > 3]\`, fancy indexing \`a[[0, 1], [2, 0]]\`. Slices are views: changing them changes the original. \`np.where(cond, x, y)\` is a vectorised if/else.

**Broadcasting.** Shapes are compared from the right; dimensions are compatible if equal or one of them is 1. A (3, 1) array plus a (1, 4) array gives (3, 4). Subtracting a row of column means from a matrix standardises every column in one line.

**Reshaping.** \`a.reshape(3, 2)\`, \`a.T\`, \`a.flatten()\`, \`np.concatenate\`, \`np.vstack\`, \`np.hstack\`.

**Statistics.** \`mean, median, std, var, min, max, argmax, percentile, cumsum\`. \`np.std\` defaults to the population formula (ddof=0); pandas defaults to the sample formula (ddof=1).

**Missing and masked values.** \`np.nan\` is a float; \`np.nanmean\` skips it; \`np.isnan\` tests it. \`np.ma.masked_array(data, mask)\` hides chosen entries from computations.

**Random.** \`rng = np.random.default_rng(42)\`; \`rng.normal(0, 1, size=100)\`, \`rng.integers\`, \`rng.choice\`. Seed for reproducibility.

**Linear algebra.** \`np.linalg.inv\`, \`np.linalg.norm\`, \`np.linalg.solve\`. Cosine similarity = \`a @ b / (norm(a) * norm(b))\`.
`, { resources: [R("NumPy: absolute basics", "https://numpy.org/doc/stable/user/absolute_beginners.html", "Official beginner guide"), HR] });
Q(1, "`np.array([[1, 2, 3], [4, 5, 6]]).shape` is…", ["(3, 2)", "(2, 3)", "(6,)", "(2,)"], 1, "2 rows, 3 columns.");
Q(2, "For that array, `a.sum(axis=0)` is…", ["[6, 15]", "[5, 7, 9]", "21", "[1, 4]"], 1, "axis=0 collapses rows: column sums.");
Q(2, "`a * b` on two 2-D arrays of the same shape computes…", ["the matrix product", "the element-wise product", "the dot product", "an error"], 1, "Use @ for matrix multiplication.");
Q(2, "Shapes (3, 1) and (1, 4) broadcast to…", ["(3, 4)", "(4, 3)", "(3, 1)", "an error"], 0, "Each size-1 dimension stretches.");
Q(2, "Shapes (3, 2) and (3,) are…", ["broadcast to (3, 2)", "broadcast to (3, 3)", "incompatible", "broadcast to (2, 3)"], 2, "Aligned from the right: 2 vs 3 mismatch and neither is 1.");
N(2, "Dot product of [1, 2, 3] and [4, -5, 6]?", 12, 0, "4 − 10 + 18.");
Q(2, "`np.std([2, 4, 4, 4, 5, 5, 7, 9])` (default ddof) returns…", ["2.0", "2.14", "4.0", "4.57"], 0, "Mean 5, squared deviations sum to 32, variance 32/8 = 4, SD 2. The sample SD (ddof=1) would be 2.14.");
Q(3, "`b = a[0]; b[0] = 99` on a 2-D array `a` changes `a` because…", ["b is a copy", "basic slicing returns a view of the same memory", "arrays are immutable", "of broadcasting"], 1, "Use a[0].copy() for an independent array.");
N(3, "Cosine similarity of [3, 4] and [4, 3]? (2 decimals)", 0.96, 0.005, "Dot = 24; norms 5 and 5; 24/25.");
C("axis=0 vs axis=1", "axis=0 aggregates down rows (one value per column); axis=1 across columns (one value per row).");
C("Broadcasting rule", "Align shapes from the right; each pair of dimensions must be equal or one of them 1.");
C("np.std vs pandas .std()", "NumPy default is population (ddof=0); pandas default is sample (ddof=1).");

T("py-pandas", "foundations", "Python", "Pandas", "Loading, cleaning, grouping, merging and reshaping tables.", `
A **DataFrame** is a table of named columns (each a **Series**) sharing a row index.

**Look first.** \`df.head()\`, \`df.shape\`, \`df.info()\` (dtypes, non-null counts), \`df.describe()\`, \`df['col'].value_counts(dropna=False)\`, \`df.isna().sum()\`, \`df.duplicated().sum()\`.

**Select.** \`df['a']\` (Series), \`df[['a', 'b']]\` (DataFrame). \`df.loc[rows, cols]\` is label-based and end-inclusive; \`df.iloc[rows, cols]\` is position-based and end-exclusive.

**Filter.** \`df[(df.age > 30) & (df.city == 'Pune')]\`: use \`&\`, \`|\`, \`~\` with brackets, not \`and\` / \`or\`. \`df[df.city.isin(['Pune', 'Delhi'])]\`, \`df.query("age > 30 and city == 'Pune'")\`.

**Create and change columns.** \`df['total'] = df.qty * df.price\`. Vectorised first; \`np.where(cond, a, b)\` for if/else; \`.map(dict)\` for lookups; \`.apply(func, axis=1)\` only when nothing vectorised fits (it is a Python loop).

**Missing data.** \`dropna(subset=[…])\`, \`fillna(value)\`, \`fillna(df.col.median())\`, group-wise \`df.groupby('g').col.transform(lambda s: s.fillna(s.median()))\`. Use the median for skewed columns.

**Types.** \`astype(int)\`, \`pd.to_numeric(errors='coerce')\`, \`pd.to_datetime\`, then \`.dt.year\`, \`.dt.month\`, \`.dt.to_period('M')\`. Strings via \`.str.lower()\`, \`.str.contains()\`, \`.str.split()\`.

**Group and aggregate** (SQL GROUP BY):

\`\`\`
out = (df.groupby(['city', 'month'], as_index=False)
         .agg(revenue=('amount', 'sum'), orders=('order_id', 'nunique')))
\`\`\`

\`transform\` returns a value per original row (group mean next to each row); \`agg\` returns one row per group.

**Join.** \`a.merge(b, on='key', how='left')\` (\`how\`: inner, left, right, outer). \`indicator=True\` adds \`_merge\` so you can do anti-joins. \`pd.concat([a, b])\` stacks rows (UNION ALL).

**Reshape.** \`pivot_table(index, columns, values, aggfunc)\` long → wide; \`melt\` wide → long.

**Window equivalents.** \`groupby('g').col.rank(method='dense', ascending=False)\`, \`.shift(1)\` (LAG), \`.cumsum()\`, \`.rolling(7).mean()\`, \`sort_values(...).groupby('g').head(3)\` (top 3 per group), \`drop_duplicates(subset, keep='last')\` (latest row per key).

**Chained-assignment trap.** \`df[df.a > 0]['b'] = 1\` may write to a temporary copy. Use \`df.loc[df.a > 0, 'b'] = 1\`.
`, { resources: [KP, LC30, R("pandas: 10 minutes to pandas", "https://pandas.pydata.org/docs/user_guide/10min.html", "Official quick tour")], categories: ["python/pandas", "python/data"] });
Q(1, "`df.loc[0:2]` on a default integer index returns…", ["2 rows", "3 rows", "1 row", "an error"], 1, "loc is label-based and includes the end label. iloc[0:2] returns 2 rows.");
Q(1, "Which shows the count of missing values per column?", ["df.count()", "df.isna().sum()", "df.describe()", "df.shape"], 1, "isna gives booleans; sum counts the Trues per column.");
Q(2, "Correct filter for age > 30 and city Pune:", ["df[df.age > 30 and df.city == 'Pune']", "df[(df.age > 30) & (df.city == 'Pune')]", "df[df.age > 30 & df.city == 'Pune']", "df.filter(age > 30)"], 1, "Element-wise & with brackets around each condition.");
Q(2, "SQL `LEFT JOIN` in pandas:", ["a.concat(b)", "a.merge(b, on='k', how='left')", "a.join_left(b)", "a.append(b)"], 1, "merge with how='left'.");
Q(2, "`groupby('g')['x'].transform('mean')` returns…", ["one row per group", "a Series aligned to the original rows", "a scalar", "a dict"], 1, "transform broadcasts the group result back to each row.");
Q(2, "A right-skewed income column has missing values. A sensible simple fill is the…", ["mean", "median", "maximum", "zero"], 1, "The median is not pulled by the long tail.");
Q(2, "Top 3 rows per group by score:", ["df.head(3)", "df.sort_values('score', ascending=False).groupby('g').head(3)", "df.groupby('g').max()", "df.nlargest(3, 'score')"], 1, "Sort, then take the head of each group.");
Q(2, "`pivot_table` is used to…", ["go from long to wide with aggregation", "drop duplicates", "sort rows", "change dtypes"], 0, "melt does the reverse.");
Q(3, "`df[df.a > 0]['b'] = 1` is risky because…", ["it is slow", "it may assign to a temporary copy, leaving df unchanged", "b must be a string", "it sorts df"], 1, "Use df.loc[df.a > 0, 'b'] = 1.");
Q(2, "The pandas equivalent of SQL LAG(x) within each user is…", ["df.x.cumsum()", "df.groupby('user').x.shift(1)", "df.x.rank()", "df.x.diff(0)"], 1, "shift(1) moves values down one row inside each group.");
Q(2, "`df.merge(other, how='left', indicator=True)` adds a column that lets you…", ["time the merge", "find rows with no match (left_only)", "sort the result", "rename keys"], 1, "Filter _merge == 'left_only' for an anti-join.");
C("loc vs iloc", "loc: labels, end-inclusive. iloc: integer positions, end-exclusive.");
C("agg vs transform", "agg: one row per group. transform: same length as the input, group value on each row.");
C("SQL → pandas", "WHERE → boolean mask; GROUP BY → groupby().agg(); JOIN → merge; UNION ALL → concat; LAG → shift; RANK → rank; pivot → pivot_table.");
C("Safe conditional assignment", "df.loc[mask, 'col'] = value");

T("py-dsa", "foundations", "Python", "DSA-lite patterns", "The handful of patterns non-core coding rounds actually use.", `
Non-core coding rounds are easy to medium. Reported asks: arrays, hashmaps and sliding window; two short problems on paper; explain the logic of your code. Learn patterns, not volume.

**Big-O.** Count how the work grows with input size n. One loop O(n); nested loops O(n²); halving each step O(log n); sorting O(n log n). Space counts extra memory. State both before coding.

**Hashmap / set.** Trade memory for O(1) lookups. Two-sum: for each x check whether \`target − x\` was seen. Frequency counts, first non-repeating character, duplicates, grouping.

**Two pointers.** On a sorted array or from both ends: pair with a given sum, reverse in place, remove duplicates, merge two sorted lists, palindrome check.

**Sliding window.** A contiguous window \`[left, right]\` that grows on the right and shrinks on the left while a condition is violated. Longest substring without repeats, maximum sum of k consecutive elements, smallest subarray with sum ≥ s. Fixed-size window: add the entering element, subtract the leaving one.

**Prefix sums.** \`pre[i]\` = sum of the first i elements, so any range sum is \`pre[j] − pre[i]\` in O(1).

**Binary search.** On sorted data, or on the answer when feasibility is monotonic. Keep \`lo <= hi\`, move \`lo = mid + 1\` or \`hi = mid − 1\`.

**Stack.** Last in, first out: balanced brackets, next greater element, undo. **Queue** (deque): first in, first out: BFS, scheduling.

**Sort then sweep.** Merge intervals, meeting rooms, deduplicate.

**Greedy / running best.** Track the minimum so far (best time to buy and sell), Kadane's maximum subarray: \`cur = max(x, cur + x)\`.

**Recursion.** Base case plus a smaller subproblem. Memoise overlapping subproblems (Fibonacci, climbing stairs) to turn exponential into linear: that is dynamic programming.

In the interview: restate the problem, ask about edge cases (empty input, duplicates, negatives), give the brute force and its complexity, improve it, code, then trace one example aloud.
`, { resources: [NEET, R("LeetCode 75", "https://leetcode.com/studyplan/leetcode-75/", "Stick to the easy and medium array, hashing and window items")], categories: ["python/dsa-lite", "python/metrics"] });
Q(1, "Looking up a key in a hashmap takes, on average…", ["O(1)", "O(log n)", "O(n)", "O(n²)"], 0, "Constant time on average.");
Q(1, "Binary search on a sorted array of n items is…", ["O(n)", "O(log n)", "O(n log n)", "O(1)"], 1, "The range halves each step.");
Q(2, "Two nested loops over the same list of n items run in…", ["O(n)", "O(2n)", "O(n²)", "O(log n)"], 2, "n × n iterations.");
N(2, "Sliding window of size 3 over [2, 1, 5, 1, 3, 2]: the maximum window sum?", 9, 0, "Windows: 8, 7, 9, 6. Max is 9 (5 + 1 + 3).");
N(2, "Kadane's algorithm on [-2, 1, -3, 4, -1, 2, 1, -5, 4] returns…", 6, 0, "The subarray [4, -1, 2, 1].");
Q(2, "Which structure checks balanced brackets?", ["queue", "stack", "heap", "set"], 1, "The most recent opener must be closed first.");
Q(2, "Two-sum in O(n) uses…", ["sorting", "a hashmap of values seen so far", "nested loops", "recursion"], 1, "Check target − x in the map as you go.");
N(3, "How many times does the inner statement run? `for i in range(n): for j in range(i): op()` with n = 5", 10, 0, "0 + 1 + 2 + 3 + 4 = 10, i.e. n(n − 1)/2.");
Q(2, "Prefix sums let you answer a range-sum query in…", ["O(n)", "O(1) after O(n) preprocessing", "O(log n)", "O(n²)"], 1, "sum(i..j) = pre[j + 1] − pre[i].");
Q(2, "Memoisation helps when a recursion…", ["has no base case", "recomputes the same subproblems", "uses a loop", "sorts its input"], 1, "Cache results of overlapping subproblems.");
N(3, "Longest substring without repeating characters in 'abcabcbb' has length…", 3, 0, "'abc'.");
C("Sliding window in one line", "Extend right; while the window is invalid, shrink left; update the best.");
C("Kadane's algorithm", "cur = max(x, cur + x); best = max(best, cur). O(n).");
C("When to reach for a hashmap", "Whenever you need 'have I seen X?' or 'how many X?' in O(1).");
C("Interview flow for a coding question", "Clarify → edge cases → brute force + complexity → optimise → code → trace an example.");

const XL = R("Excel Practice Online", "https://excel-practice-online.com/", "Drills for lookups, pivots and the IFS family");

T("excel-formulas", "foundations", "Excel & BI", "Excel formulas", "Lookups, conditional aggregation, text and date functions.", `
**References.** \`A1\` relative (changes when copied), \`$A$1\` absolute, \`A$1\` / \`$A1\` mixed. F4 cycles through them.

**Lookups.**

- \`VLOOKUP(key, table, col_index, FALSE)\`: searches the leftmost column, returns from a column to its right. FALSE = exact match. Breaks when columns are inserted and cannot look left.
- \`INDEX(return_range, MATCH(key, lookup_range, 0))\`: looks in any direction; two MATCHes give a two-way lookup.
- \`XLOOKUP(key, lookup_range, return_range, "not found")\`: exact match by default, any direction, built-in fallback.

**Conditional aggregation.** \`SUMIFS(sum_range, crit_range1, crit1, …)\` (sum range first), \`COUNTIFS\`, \`AVERAGEIFS\`, \`MAXIFS\`. Criteria can be \`">500"\`, \`"<>"&A1\`, wildcards \`"Mum*"\`. \`SUMPRODUCT\` multiplies arrays and sums: weighted averages and multi-condition sums.

**Logic.** \`IF(test, a, b)\`, \`IFS\`, \`AND\`, \`OR\`, \`NOT\`, \`IFERROR(value, fallback)\`.

**Text.** \`LEFT\`, \`RIGHT\`, \`MID\`, \`LEN\`, \`TRIM\`, \`UPPER\`, \`PROPER\`, \`SUBSTITUTE\`, \`TEXT(value, "mmm-yy")\`, \`&\` or \`CONCAT\`, \`TEXTJOIN\`, \`TEXTSPLIT\`, \`FIND\`.

**Dates.** Dates are serial numbers. \`TODAY()\`, \`EOMONTH(d, 0)\`, \`EDATE\`, \`DATEDIF(a, b, "m")\`, \`NETWORKDAYS\`, \`YEAR\`, \`MONTH\`, \`WEEKDAY\`.

**Dynamic arrays.** \`UNIQUE\`, \`FILTER\`, \`SORT\`, \`SEQUENCE\` spill results into neighbouring cells.

**Finance.** \`NPV(rate, flows)\` (assumes the first flow is one period away, so add the time-0 flow outside), \`IRR\`, \`PMT(rate, nper, pv)\`, \`FV\`, \`XNPV\` / \`XIRR\` for dated flows.

**Errors.** \`#N/A\` lookup not found, \`#DIV/0!\`, \`#REF!\` deleted reference, \`#VALUE!\` wrong type, \`#NAME?\` unknown function.

**Shortcuts.** Ctrl+Shift+arrows select to the edge, Ctrl+T makes a table, Ctrl+Shift+L toggles filters, Alt+= AutoSum, F4 repeats or locks, Ctrl+; today's date.
`, { resources: [XL, R("Kevin Stratvert: XLOOKUP", "https://www.youtube.com/watch?v=y5H6Yi3V4cw", "Recreate the two-sheet example")] });
Q(1, "In `VLOOKUP(key, table, 3, FALSE)`, FALSE means…", ["approximate match", "exact match", "case-sensitive", "search right to left"], 1, "FALSE (or 0) forces an exact match.");
Q(2, "A limitation of VLOOKUP that INDEX-MATCH and XLOOKUP avoid:", ["it cannot return text", "it cannot return a column to the left of the key", "it is slower", "it ignores numbers"], 1, "VLOOKUP only searches the leftmost column of the table.");
Q(1, "Which reference stays fixed when copied anywhere?", ["A1", "$A$1", "A$1", "$A1"], 1, "Both the column and the row are locked.");
Q(2, "Total sales where region is North and month is Jan:", ["SUMIF(region, \"North\", sales)", "SUMIFS(sales, region, \"North\", month, \"Jan\")", "SUM(IF(North, Jan))", "COUNTIFS(sales, region, month)"], 1, "SUMIFS takes the sum range first, then pairs of criteria range and criterion.");
Q(2, "`=IFERROR(A1/B1, 0)` returns 0 when…", ["A1 is 0", "B1 is 0 or the division errors", "A1 > B1", "always"], 1, "It replaces any error, here #DIV/0!.");
Q(2, "Copying `=B2*$E$1` from C2 down to C3 gives…", ["=B2*$E$1", "=B3*$E$1", "=B3*$E$2", "=B2*$E$2"], 1, "B2 is relative and moves; $E$1 is locked.");
N(2, "A1:A4 = 10, 20, 30, 40 and B1:B4 = 1, 2, 3, 4. `=SUMPRODUCT(A1:A4, B1:B4)` returns…", 300, 0, "10 + 40 + 90 + 160.");
Q(2, "`#REF!` means…", ["lookup value not found", "a referenced cell or range was deleted", "division by zero", "unknown function name"], 1, "The reference no longer exists.");
Q(3, "`=NPV(10%, B2:B5) + B1` adds B1 separately because…", ["B1 is text", "NPV treats its first value as arriving one period from now", "NPV cannot take five cells", "it avoids rounding"], 1, "The time-0 investment must not be discounted.");
C("VLOOKUP vs INDEX-MATCH vs XLOOKUP", "VLOOKUP: leftmost key only, breaks on column insert. INDEX-MATCH: any direction. XLOOKUP: any direction, exact by default, built-in not-found value.");
C("SUMIFS argument order", "SUMIFS(sum_range, criteria_range1, criterion1, …): sum range first.");
C("Absolute vs relative references", "$A$1 fixed; A1 moves; A$1 row fixed; $A1 column fixed. F4 toggles.");

T("excel-pivots", "foundations", "Excel & BI", "Pivot tables, cleaning and Power Query", "Summarising and preparing data without formulas.", `
**Pivot tables** summarise a flat table by dragging fields into four areas: Rows, Columns, Values, Filters.

- Value field settings: Sum, Count, Average, Distinct Count (needs the data model); "Show values as" % of grand total, % of column, running total, difference from previous.
- Group dates into months, quarters and years; group numbers into bins.
- Slicers and timelines are clickable filters; one slicer can drive several pivots.
- Calculated fields add a formula on summed fields (for example margin = profit / revenue).
- A pivot does not update automatically: Refresh after the source changes. Build pivots on an Excel Table (Ctrl+T) so new rows are included.
- Pivot charts are linked to the pivot.

**Good source data**: one header row, one row per record, one type per column, no blank rows, no merged cells, no totals mixed in.

**Cleaning tools.** Remove Duplicates; Text to Columns; Flash Fill (Ctrl+E); TRIM and CLEAN for stray spaces; Find and Replace; Data Validation (drop-down lists, allowed ranges) to stop bad input; Conditional Formatting to flag duplicates, outliers, top 10%.

**Power Query** (Get & Transform) is repeatable ETL: connect to files or databases, then record steps such as remove columns, change types, split, filter, unpivot, group by, **merge** (join two queries) and **append** (stack them). Refresh replays the steps on new data. Use it instead of repeating manual cleaning each month.

**What-if tools.** Goal Seek finds the input that produces a target output; Data Tables show an output across one or two varying inputs; Scenario Manager stores named input sets; Solver optimises with constraints.

**Chart choice.** Category comparison: bar. Trend over time: line. Distribution: histogram or box plot. Relationship: scatter. Part of whole: stacked bar (pie only for a few slices). Avoid dual axes and 3-D.
`, { resources: [R("Kevin Stratvert: Pivot Tables", "https://www.youtube.com/watch?v=dvbLrwD2SpA", "Build one on your own dataset"), XL] });
Q(1, "The four areas of a pivot table are Rows, Columns, Values and…", ["Charts", "Filters", "Formulas", "Sheets"], 1, "Filters restrict the whole pivot.");
Q(1, "After the source data changes, a pivot table…", ["updates instantly", "must be refreshed", "must be rebuilt", "shows an error"], 1, "Right-click → Refresh, or Refresh All.");
Q(2, "To show each region's sales as a share of all sales in a pivot use…", ["a calculated field", "Show Values As → % of Grand Total", "a slicer", "Group"], 1, "A display option on the value field.");
Q(2, "In Power Query, stacking January and February tables with the same columns is…", ["Merge", "Append", "Pivot", "Group By"], 1, "Append = UNION ALL; Merge = JOIN.");
Q(2, "Which tool finds the price needed to reach a target profit?", ["Data Validation", "Goal Seek", "Flash Fill", "Conditional Formatting"], 1, "Goal Seek varies one input to hit a target.");
Q(2, "Which makes data unsuitable as a pivot source?", ["One header row", "Merged cells and subtotal rows inside the data", "A date column", "Text categories"], 1, "Pivots need a clean flat table.");
Q(2, "Best chart for monthly revenue over two years?", ["Pie", "Line", "Scatter", "Histogram"], 1, "Trends over time read best as lines.");
Q(2, "Data Validation is used to…", ["speed up formulas", "restrict what can be typed into a cell", "refresh pivots", "merge tables"], 1, "For example a drop-down list or a number range.");
C("Pivot areas", "Rows, Columns, Values, Filters.");
C("Power Query: merge vs append", "Merge joins two queries on a key; append stacks rows.");
C("Chart by purpose", "Compare → bar; trend → line; distribution → histogram/box; relationship → scatter; share → stacked bar.");

T("bi-dax", "foundations", "Excel & BI", "BI: data modelling, DAX and dashboards", "Power BI concepts that transfer to Tableau and Looker.", `
A BI tool has three layers: **get and shape data** (Power Query), **model** it (tables, relationships, measures), **visualise** it (reports and dashboards).

**Data model.** Prefer a star schema: one fact table (transactions) and dimension tables (date, product, customer) joined one-to-many from dimension to fact. Filters flow from the one side to the many side. Avoid many-to-many and bidirectional filters unless you must. A dedicated, continuous **date table** is required for time intelligence.

**Storage modes.** Import (data copied into memory: fast, needs refresh), DirectQuery (queries the source live: always current, slower), Live connection (to an existing model).

**Calculated column vs measure.**

- Calculated column: computed row by row at refresh, stored, usable in slicers. Row context.
- Measure: computed at query time for whatever filters the visual applies. Filter context. Use measures for anything aggregated.

**DAX essentials.**

\`\`\`
Total Sales   = SUM(Sales[Amount])
Sales LY      = CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date]))
% of Total    = DIVIDE([Total Sales], CALCULATE([Total Sales], ALL(Product)))
Margin        = SUMX(Sales, Sales[Qty] * (Sales[Price] - Sales[Cost]))
\`\`\`

- \`CALCULATE(expr, filters…)\` evaluates an expression under a modified filter context. It is the most important DAX function.
- \`ALL(table)\` removes filters (denominator for percent of total); \`ALLEXCEPT\`, \`FILTER\`.
- Iterators \`SUMX\`, \`AVERAGEX\` evaluate an expression per row, then aggregate.
- \`RELATED\` pulls a value across a relationship; \`DIVIDE\` handles division by zero.
- Time intelligence: \`TOTALYTD\`, \`DATEADD\`, \`SAMEPERIODLASTYEAR\`.

**Row-level security (RLS)**: roles with DAX filters so each user sees only their rows (for example their region).

**Dashboard design.** Start from the decision the reader has to make. Key numbers at the top left, trend next, breakdown below, detail last. Limit colours; label directly; one message per chart; slicers for the two or three cuts people really use. Tableau's equivalents: calculated fields, LOD expressions (\`FIXED\`), filters and parameters, dashboards and stories.

**Refresh and sharing.** Publish to the service, schedule refresh (a gateway is needed for on-premises sources), share via workspaces and apps.
`, { resources: [R("Microsoft Learn: Power BI", "https://learn.microsoft.com/en-us/training/powerplatform/power-bi/", "Use the modelling and DAX modules"), R("Maven Data Playground", "https://mavenanalytics.io/data-playground", "Datasets for a portfolio dashboard"), R("Codebasics: Power BI project", "https://www.youtube.com/@codebasics", "Sales-insights project playlist")] });
Q(1, "In a star schema, dimension-to-fact relationships are usually…", ["many-to-many", "one-to-many", "one-to-one", "none"], 1, "One product row relates to many sales rows.");
Q(2, "A DAX measure is evaluated…", ["once at refresh, per row", "at query time, in the visual's filter context", "only in Power Query", "only in calculated columns"], 1, "That is why the same measure shows different numbers in different cells.");
Q(2, "Which DAX function changes the filter context of an expression?", ["SUMX", "CALCULATE", "RELATED", "DIVIDE"], 1, "CALCULATE applies, replaces or removes filters.");
Q(2, "`DIVIDE([Sales], CALCULATE([Sales], ALL(Product)))` computes…", ["sales growth", "each product's share of total sales", "average price", "sales last year"], 1, "ALL removes the product filter from the denominator.");
Q(2, "Use `SUMX(Sales, Sales[Qty] * Sales[Price])` rather than `SUM` because…", ["SUM is slower", "the multiplication must happen per row before summing", "SUMX ignores filters", "SUM cannot read numbers"], 1, "Iterators evaluate a row-level expression.");
Q(2, "Row-level security restricts…", ["which visuals load", "which rows of data each user can see", "refresh frequency", "file size"], 1, "Roles apply DAX filters per user.");
Q(2, "Import mode compared with DirectQuery is…", ["always current but slower", "faster to query but needs refreshing", "unable to use DAX", "limited to Excel"], 1, "Data is cached in memory.");
Q(3, "Time-intelligence functions such as TOTALYTD need…", ["a text month column", "a continuous date table related to the fact table", "DirectQuery", "no relationships"], 1, "Mark a proper date table.");
C("Calculated column vs measure", "Column: row context, stored at refresh. Measure: filter context, computed at query time. Aggregations belong in measures.");
C("CALCULATE", "Evaluates an expression under a modified filter context.");
C("Import vs DirectQuery", "Import: in-memory, fast, scheduled refresh. DirectQuery: live queries, current, slower.");
C("Star schema filter direction", "Filters flow from dimension (one side) to fact (many side).");
