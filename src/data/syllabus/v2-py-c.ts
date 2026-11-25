/**
 * v2 Python, part C: Functions, OOP and errors. Fixed ids (py2-*); answers recomputed in Pyodide.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("python");
const M = "Functions, OOP and errors";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  flow: src("Python tutorial: defining functions (defaults, *args, **kwargs, lambda)", "https://docs.python.org/3/tutorial/controlflow.html"),
  classes: src("Python tutorial: classes (scopes, inheritance, iterators)", "https://docs.python.org/3/tutorial/classes.html"),
  functools: src("Python docs: functools (lru_cache, partial, reduce, wraps)", "https://docs.python.org/3/library/functools.html"),
  errors: src("Python tutorial: errors and exceptions", "https://docs.python.org/3/tutorial/errors.html"),
  dc: src("Python docs: dataclasses", "https://docs.python.org/3/library/dataclasses.html"),
  model: src("Python reference: data model (special methods)", "https://docs.python.org/3/reference/datamodel.html"),
};

// ───────────────────────── Arguments ─────────────────────────

L("py2-func-args", M, "Function arguments", "Positional, keyword, defaults, *args, **kwargs, keyword-only and the mutable-default trap.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "`def add(item, bucket=[])` works once and then returns items from earlier calls. Why?",
  intuition: `
**The situation.** Interviewers often hand you a short function and ask what it prints. Argument rules and default values are the usual trick.

**The idea.** Parameters can be filled by position or by name. Defaults make parameters optional, and they're **evaluated once, when the \`def\` runs**, not on each call. A mutable default (list, dict) is therefore shared by every call that doesn't pass its own.

\`*args\` collects extra positional arguments into a tuple; \`**kwargs\` collects extra keyword arguments into a dict. At a call site, \`*\` and \`**\` do the opposite: they unpack a sequence or dict into arguments.
`,
  maths: `
**In one breath.** Order: positional, \`*args\`, keyword-only, \`**kwargs\`; defaults evaluated once; use \`None\` as the sentinel; \`/\` positional-only, bare \`*\` keyword-only.

\`\`\`python
def add(item, bucket=[]):          # BUG: one shared list
    bucket.append(item); return bucket
print(add(1), add(2))              # [1, 2] [1, 2]

def add(item, bucket=None):        # fix
    if bucket is None:
        bucket = []
    bucket.append(item); return bucket

def report(title, *values, sep=", ", **opts):
    print(title, sep.join(map(str, values)), opts)
report("scores", 90, 85, sep=" | ", unit="pts")
# scores 90 | 85 {'unit': 'pts'}

def area(w, h, /, *, unit="m"):    # w, h positional-only; unit keyword-only
    return f"{w * h} {unit}2"
print(area(3, 4, unit="cm"))       # 12 cm2

nums = [3, 4]; cfg = {"unit": "km"}
print(area(*nums, **cfg))          # unpacking at the call: 12 km2

def f(a, b=2, *args, c, **kw):
    return a, b, args, c, kw
print(f(1, 5, 6, 7, c=8, d=9))     # (1, 5, (6, 7), 8, {'d': 9})
\`\`\`

**Return values.** No \`return\` (or bare \`return\`) gives None. Returning several values returns a tuple.

**Type hints.** \`def f(x: int) -> str:\` documents intent; Python doesn't enforce it at runtime.
`,
  practice: `
**Rules.** Never use a mutable default; use \`None\`. Prefer keyword arguments for booleans and options (\`plot(df, log=True)\`) so calls read clearly. Use \`*args/**kwargs\` mainly for wrappers and decorators that pass arguments through.

**Reading code.** When asked "what does this print", track which parameters were bound by position, which by keyword, and whether a default object was mutated earlier.
`,
  traps: [
    { trap: "Default values are recreated on every call.", why: "They're evaluated once at definition time; a mutable default is shared across calls. Use None and create the object inside." },
    { trap: "`*args` is a list.", why: "It's a tuple. `**kwargs` is a dict." },
  ],
  say: {
    prompt: "Explain *args and **kwargs, and why mutable default arguments are a problem.",
    secs: 45,
    check: ["*args collects extra positional args as a tuple", "**kwargs collects extra keyword args as a dict", "Call-site * and ** unpack", "Defaults evaluated once at def time", "None sentinel fix"],
    followups: [
      { q: "What do `/` and a bare `*` in a signature mean?", a: "Parameters before `/` are positional-only; parameters after `*` (or after *args) are keyword-only." },
      { q: "Can a function modify a list passed by the caller?", a: "Yes, mutating it (append, item assignment) is visible to the caller; rebinding the parameter name isn't." },
      { q: "When is a mutable default deliberately useful?", a: "Rarely, as a crude cache; `functools.lru_cache` or an explicit dict is clearer." },
    ],
    answer: `\`*args\` gathers any extra positional arguments into a tuple and \`**kwargs\` gathers extra keyword arguments into a dict, which is useful for wrappers that pass arguments through; at a call site \`*\` and \`**\` unpack a sequence or dict into arguments. Default values are evaluated once, when the function is defined, so a default like \`[]\` is one list shared by every call, and items accumulate. The fix is to default to None and create the list inside the function.`,
    avoid: ["\u201cDefaults are evaluated each call\u201d"],
  },
  terms: [["*args", "Tuple of extra positional arguments."], ["**kwargs", "Dict of extra keyword arguments."], ["Keyword-only parameter", "Must be passed by name (after * in the signature)."]],
  sources: [S.flow],
});
Q({ id: "py2-args-1", d: 1, secs: 45, prompt: "```python\ndef add(x, acc=[]):\n    acc.append(x)\n    return len(acc)\nadd(1); add(2)\nprint(add(3))\n```\nWhat is printed?", answer: 3, tol: 0.5, explain: "The default list is shared: it holds 1, 2, 3.", py: "def add(x, acc=[]):\n    acc.append(x)\n    return len(acc)\nadd(1); add(2)\nanswer = add(3)" });
Q({ id: "py2-args-2", d: 2, secs: 60, prompt: "```python\ndef f(a, b=2, *args, c, **kw):\n    return a + b + sum(args) + c + len(kw)\nprint(f(1, 5, 6, 7, c=8, d=9, e=0))\n```\nWhat is printed?", answer: 29, tol: 0.5, explain: "a=1, b=5, args=(6, 7), c=8, kw has 2 keys: 1 + 5 + 13 + 8 + 2 = 29.", py: "def f(a, b=2, *args, c, **kw):\n    return a + b + sum(args) + c + len(kw)\nanswer = f(1, 5, 6, 7, c=8, d=9, e=0)" });
Q({ id: "py2-args-3", d: 1, secs: 30, prompt: "Inside `def g(*args)`, what is `type(args)`?", options: ["list", "tuple", "dict", "generator"], answer: 1, explain: "*args is a tuple.", py: "def g(*args):\n    return type(args).__name__\nanswer = ['list', 'tuple', 'dict', 'generator'].index(g(1, 2))" });
Q({ id: "py2-args-4", d: 2, secs: 45, prompt: "```python\ndef area(w, h, *, unit='m'):\n    return w * h\ncfg = {'h': 4, 'unit': 'cm'}\nprint(area(3, **cfg))\n```\nWhat is printed?", answer: 12, tol: 0.5, explain: "** unpacks h=4 and unit='cm' as keyword arguments.", py: "def area(w, h, *, unit='m'):\n    return w * h\ncfg = {'h': 4, 'unit': 'cm'}\nanswer = area(3, **cfg)" });
C("py2-args-c1", "Mutable default fix", "def f(x, acc=None): if acc is None: acc = []");
C("py2-args-c2", "Signature order", "positional, *args, keyword-only, **kwargs");

// ───────────────────────── Scope and closures ─────────────────────────

L("py2-scope", M, "Scope, closures and nonlocal", "LEGB lookup, global/nonlocal, closures and the late-binding loop trap.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "`[lambda: i for i in range(3)]` — every function returns 2. What did the lambdas capture?",
  intuition: `
**The situation.** Counters inside nested functions, callbacks built in loops, and "UnboundLocalError" are classic tricky questions.

**The idea.** Python looks names up in four scopes, innermost first: **L**ocal, **E**nclosing functions, **G**lobal (module), **B**uilt-in. Assigning to a name anywhere in a function makes it local to that whole function, unless you declare \`global\` or \`nonlocal\`.

A **closure** is an inner function that remembers variables from the enclosing function, even after the outer function returns. It captures the **variable**, not its value at creation time, which is why lambdas built in a loop all see the loop variable's final value.
`,
  maths: `
**In one breath.** LEGB; assignment makes a name local; \`nonlocal\` rebinds an enclosing variable; closures bind late (fix with a default argument).

\`\`\`python
def make_counter():
    count = 0
    def inc():
        nonlocal count          # rebind the enclosing variable
        count += 1
        return count
    return inc
c = make_counter()
c(); c()
print(c())                       # 3

total = 10
def bad():
    total += 1                   # UnboundLocalError: total is local here
def good():
    global total
    total += 1

fs = [lambda: i for i in range(3)]
print([f() for f in fs])         # [2, 2, 2]   late binding
fs = [lambda i=i: i for i in range(3)]
print([f() for f in fs])         # [0, 1, 2]   value captured as default

def multiplier(n):
    return lambda x: x * n       # closure over n
double = multiplier(2)
print(double(21))                # 42
print(double.__closure__[0].cell_contents)   # 2
\`\`\`

**Mutating vs rebinding.** An inner function can mutate an enclosing list (\`items.append\`) without \`nonlocal\`; it only needs \`nonlocal\` to rebind the name.
`,
  practice: `
**Where closures show up.** Decorators, callbacks, factories (\`make_scorer(threshold)\`), memoisation caches, and in pandas/scikit-learn custom functions that need a parameter.

**Avoid globals** in solutions; pass values in and return results. If you need state across calls, use a closure or a small class.
`,
  traps: [
    { trap: "`x += 1` inside a function updates the global x.", why: "Assignment makes x local to the function, so reading it first raises UnboundLocalError. Declare `global x` (or better, return the new value)." },
    { trap: "Lambdas created in a loop capture each iteration's value.", why: "They capture the variable, looked up when called: all see the last value. Bind it with a default argument (`lambda i=i: i`)." },
  ],
  say: {
    prompt: "What is a closure in Python, and what is the late-binding gotcha?",
    secs: 45,
    check: ["Inner function remembers variables of the enclosing scope after it returns", "LEGB lookup order", "nonlocal to rebind enclosing variables", "Late binding: captures variable, not value", "Fix via default argument or functools.partial"],
    followups: [
      { q: "When do you need `nonlocal` vs `global`?", a: "`nonlocal` rebinds a variable in an enclosing function; `global` rebinds a module-level variable. Neither is needed just to mutate a mutable object." },
      { q: "Why does `x += 1` raise UnboundLocalError?", a: "Because the assignment makes x local throughout the function, so the read on the right-hand side finds an unassigned local." },
      { q: "How are closures used in decorators?", a: "The wrapper function closes over the original function (and any decorator arguments) and calls it." },
    ],
    answer: `A closure is an inner function that keeps access to variables from the function it was defined in, even after that outer function has returned; that's how a counter factory or a decorator keeps state. Python resolves names local first, then enclosing, then global, then built-in, and to reassign an enclosing variable you declare it nonlocal. The gotcha is late binding: the closure captures the variable, not its value, so lambdas made in a loop all see the final loop value unless I bind the current value as a default argument.`,
    avoid: ["\u201cClosures copy the value at creation\u201d"],
  },
  terms: [["LEGB", "Local, Enclosing, Global, Built-in lookup order."], ["Closure", "Function plus the enclosing variables it references."], ["nonlocal", "Declares assignment targets in an enclosing function scope."]],
  sources: [S.classes],
});
Q({ id: "py2-scope-1", d: 1, secs: 30, prompt: "What does `[f() for f in [lambda: i for i in range(4)]]` return? Give the sum.", answer: 12, tol: 0.5, explain: "All four lambdas return 3: sum 12.", py: "answer = sum(f() for f in [lambda: i for i in range(4)])" });
Q({ id: "py2-scope-2", d: 1, secs: 30, prompt: "Same, but `lambda i=i: i`. What is the sum?", answer: 6, tol: 0.5, explain: "Each default captures the current value: 0 + 1 + 2 + 3.", py: "answer = sum(f() for f in [lambda i=i: i for i in range(4)])" });
Q({ id: "py2-scope-3", d: 2, secs: 45, prompt: "```python\ndef make():\n    n = 0\n    def inc(step=1):\n        nonlocal n\n        n += step\n        return n\n    return inc\na, b = make(), make()\na(); a(5); b()\nprint(a() + b())\n```\nWhat is printed?", answer: 9, tol: 0.5, explain: "a: 1, 6, then 7. b: 1, then 2. 7 + 2 = 9. Each make() call has its own n.", py: "def make():\n    n = 0\n    def inc(step=1):\n        nonlocal n\n        n += step\n        return n\n    return inc\na, b = make(), make()\na(); a(5); b()\nanswer = a() + b()" });
Q({ id: "py2-scope-4", d: 2, secs: 45, prompt: "```python\nx = 5\ndef f():\n    print(x)\n    x = 1\n```\nWhat happens when `f()` is called?", options: ["Prints 5", "Prints 1", "UnboundLocalError", "NameError"], answer: 2, explain: "The assignment makes x local to f, so the earlier read fails.", py: "x = 5\ndef f():\n    print(x)\n    x = 1\ntry:\n    f(); answer = 0\nexcept UnboundLocalError:\n    answer = 2" });
C("py2-scope-c1", "Late binding fix", "lambda i=i: i (or functools.partial).");
C("py2-scope-c2", "global vs nonlocal", "global → module variable; nonlocal → enclosing function variable. Only needed to rebind.");

// ───────────────────────── Functional tools ─────────────────────────

L("py2-functional", M, "Lambdas, map, filter, reduce and partial", "Small anonymous functions, higher-order functions and when a comprehension is clearer.", {
  kind: "concept", mins: 15, mathsLabel: "Code",
  hook: "`sorted(people, key=lambda p: p['age'])` — what is the lambda, and when should you write a named function instead?",
  intuition: `
**The situation.** Key functions for sorting, pandas \`apply\`, scikit-learn scorers: Python passes functions around constantly.

**The idea.** Functions are objects: you can pass them as arguments and return them. A **lambda** is a one-expression anonymous function, best for short keys. \`map(f, xs)\` applies f lazily, \`filter(pred, xs)\` keeps matching items, \`functools.reduce\` folds a sequence into one value, \`functools.partial\` fixes some arguments of a function. \`any\` and \`all\` short-circuit over iterables.

In modern Python, comprehensions usually read better than \`map\`/\`filter\` with lambdas.
`,
  maths: `
**In one breath.** \`lambda args: expr\`; map/filter are lazy iterators; reduce for folds; partial to pre-fill arguments; any/all short-circuit.

\`\`\`python
from functools import reduce, partial
import operator
people = [{"name": "ravi", "age": 31}, {"name": "asha", "age": 24}]
print(sorted(people, key=lambda p: p["age"])[0]["name"])   # asha

print(list(map(str.upper, ["a", "b"])))           # ['A', 'B']
print(list(filter(lambda x: x % 2, range(6))))    # [1, 3, 5]
print([x for x in range(6) if x % 2])             # same, clearer
print(reduce(operator.mul, [1, 2, 3, 4], 1))      # 24
print(reduce(lambda a, b: a if a > b else b, [3, 9, 2]))   # 9

to_int_base2 = partial(int, base=2)
print(to_int_base2("1011"))                       # 11

print(any(x > 8 for x in [3, 9, 2]), all(x > 0 for x in []))   # True True
m = map(abs, [-1, -2])
print(list(m), list(m))                           # [1, 2] []  (exhausted)
\`\`\`

**Lambda limits.** One expression, no statements, no annotations. If it needs a name, a docstring or more than one line, use \`def\`.

**\`all([])\` is True** (vacuous truth); \`any([])\` is False.
`,
  practice: `
**Good uses.** \`key=\` functions for sorted/min/max/groupby, small callbacks, \`df["x"].map(lambda v: ...)\` for quick transforms (but prefer vectorised pandas methods), \`partial\` to configure a function before passing it on.

**Prefer comprehensions** over \`list(map(lambda ...))\` and \`list(filter(lambda ...))\` for readability.
`,
  traps: [
    { trap: "`map` returns a list.", why: "It returns a lazy iterator that can be consumed once; wrap in list() if you need to reuse it." },
    { trap: "`all([])` is False because there's nothing true.", why: "all of an empty iterable is True; any of an empty iterable is False." },
  ],
  say: {
    prompt: "When would you use a lambda, map, filter or reduce in Python, and when would you avoid them?",
    secs: 30,
    check: ["Functions are first-class objects", "Lambda: single-expression, good for keys", "map/filter lazy; comprehensions often clearer", "reduce for folds; partial to pre-fill args", "Named def when logic grows"],
    followups: [
      { q: "What does `functools.partial` return?", a: "A new callable with some arguments fixed; calling it supplies the rest." },
      { q: "Why might `any(cond(x) for x in data)` be faster than building a list?", a: "It's a generator and any short-circuits at the first True, so it may stop early and never builds a list." },
      { q: "What's `reduce(f, [], init)`?", a: "Returns init; without an initial value, reduce on an empty sequence raises TypeError." },
    ],
    answer: `Functions are objects in Python, so I pass them around as keys and callbacks. A lambda is handy for a short one-expression key like \`key=lambda r: r["age"]\`. map and filter return lazy iterators, but a comprehension is usually more readable, so I mostly use them with existing named functions like \`map(str.strip, lines)\`. reduce folds a sequence into a value and partial pre-fills arguments. Once the logic needs more than one expression or a name, I write a def.`,
    avoid: ["Long nested lambdas", "list(map(lambda ...)) where a comprehension is clearer"],
  },
  terms: [["Higher-order function", "Takes or returns a function."], ["lambda", "Anonymous single-expression function."], ["partial", "Callable with some arguments pre-filled."]],
  sources: [S.functools, S.flow],
});
Q({ id: "py2-fn-1", d: 1, secs: 30, prompt: "What is `reduce(lambda a, b: a * 10 + b, [1, 2, 3])`?", answer: 123, tol: 0.5, explain: "((1·10 + 2)·10 + 3) = 123.", py: "from functools import reduce\nanswer = reduce(lambda a, b: a * 10 + b, [1, 2, 3])" });
Q({ id: "py2-fn-2", d: 1, secs: 30, prompt: "```python\nm = map(abs, [-1, -2, 3])\nfirst = sum(m)\nprint(first + sum(m))\n```\nWhat is printed?", answer: 6, tol: 0.5, explain: "The map iterator is exhausted after the first sum.", py: "m = map(abs, [-1, -2, 3])\nfirst = sum(m)\nanswer = first + sum(m)" });
Q({ id: "py2-fn-3", d: 1, secs: 20, prompt: "How many of `all([])`, `any([])`, `all([0])`, `any([0, 1])` are True?", answer: 2, tol: 0.5, explain: "all([]) True, any([]) False, all([0]) False, any([0, 1]) True.", py: "answer = sum([all([]), any([]), all([0]), any([0, 1])])" });
Q({ id: "py2-fn-4", d: 1, secs: 30, prompt: "What is `partial(int, base=2)('1011') + partial(int, base=16)('ff')`?", answer: 266, tol: 0.5, explain: "11 + 255.", py: "from functools import partial\nanswer = partial(int, base=2)('1011') + partial(int, base=16)('ff')" });
C("py2-fn-c1", "map/filter", "Lazy iterators; single use. Comprehensions are usually clearer.");
C("py2-fn-c2", "Vacuous truth", "all([]) is True, any([]) is False.");

// ───────────────────────── Decorators and caching ─────────────────────────

L("py2-decorators", M, "Decorators and memoisation", "Wrapping functions, @wraps, decorators with arguments, and lru_cache for recursive DP.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "Naive recursive Fibonacci of 35 takes seconds. Add one line, `@lru_cache`, and it's instant. What does the decorator do?",
  intuition: `
**The situation.** Decorators appear in interviews two ways: "write a timing/logging decorator" and "memoise this recursive solution".

**The idea.** A decorator is a function that takes a function and returns a new function, usually a wrapper that does something before/after calling the original. \`@deco\` above \`def f\` means \`f = deco(f)\`.

\`functools.lru_cache\` (or \`cache\`) is a ready-made decorator that stores results by arguments. A recursive function with overlapping subproblems (Fibonacci, grid paths, edit distance) becomes top-down dynamic programming: each distinct input is computed once.
`,
  maths: `
**In one breath.** \`@d\` = \`f = d(f)\`; wrapper uses \`*args, **kwargs\`; \`@wraps\` keeps the name/docstring; decorator with arguments = three nested functions; \`@lru_cache(maxsize=None)\` memoises (arguments must be hashable).

\`\`\`python
import time
from functools import wraps, lru_cache

def timed(fn):
    @wraps(fn)                       # keep fn.__name__, __doc__
    def wrapper(*args, **kwargs):
        t = time.perf_counter()
        out = fn(*args, **kwargs)
        print(f"{fn.__name__} took {time.perf_counter() - t:.4f}s")
        return out
    return wrapper

def retry(times):                    # decorator factory (takes arguments)
    def deco(fn):
        @wraps(fn)
        def wrapper(*a, **k):
            for attempt in range(times):
                try:
                    return fn(*a, **k)
                except ValueError:
                    if attempt == times - 1:
                        raise
        return wrapper
    return deco

@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)
print(fib(80))                       # 23416728348467685, instantly
print(fib.cache_info().misses)       # 81 distinct calls computed

@lru_cache(maxsize=None)
def paths(r, c):                     # grid paths moving right/down
    if r == 0 or c == 0:
        return 1
    return paths(r - 1, c) + paths(r, c - 1)
print(paths(3, 3))                   # 20
\`\`\`

**Complexity with memoisation.** (number of distinct states) × (work per state): fib is O(n), grid paths O(r·c).

**Recursion limit.** Python's default is about 1,000 frames; deep top-down DP may need \`sys.setrecursionlimit\` or a bottom-up loop.
`,
  practice: `
**Writing decorators in an interview.** Accept \`*args, **kwargs\`, return the wrapped function's result, use \`@wraps\`. Typical asks: timing, logging, retry, simple access checks, counting calls.

**Memoisation.** Mention that arguments must be hashable (convert lists to tuples), that the cache grows with distinct inputs, and that bottom-up DP avoids recursion depth limits.
`,
  traps: [
    { trap: "A decorator's wrapper doesn't need to return anything.", why: "If the wrapper doesn't return the original function's result, the decorated function returns None." },
    { trap: "`@lru_cache` works for any function.", why: "Arguments must be hashable (no lists/dicts), and caching impure functions (random, time, I/O) gives stale results." },
  ],
  say: {
    prompt: "What is a decorator, and how would you use one to speed up a recursive solution?",
    secs: 45,
    check: ["Function that takes a function and returns a wrapper; @d means f = d(f)", "*args/**kwargs pass-through and returning the result", "functools.wraps preserves metadata", "lru_cache memoises by arguments → top-down DP", "Hashable args; recursion limit / bottom-up alternative"],
    followups: [
      { q: "How do you write a decorator that takes arguments, like @retry(3)?", a: "Three levels: retry(3) returns a decorator, which takes fn and returns the wrapper." },
      { q: "Why use @wraps?", a: "Without it the decorated function's __name__ and docstring become the wrapper's, which breaks debugging, docs and some frameworks." },
      { q: "What's the complexity of memoised Fibonacci?", a: "O(n) time and O(n) space: n distinct states, O(1) work each, versus O(φⁿ) without caching." },
    ],
    answer: `A decorator is a function that takes a function and returns a replacement, usually a wrapper that runs code before or after calling the original; writing @timed above a def is the same as f = timed(f). The wrapper should accept *args and **kwargs, return the original's result and use functools.wraps to keep its name and docstring.

For recursion with overlapping subproblems, like Fibonacci or counting grid paths, I add @lru_cache so each distinct argument tuple is computed once. That turns exponential recursion into top-down dynamic programming: O(number of states times work per state). The arguments must be hashable, and for very deep recursion I'd switch to a bottom-up loop.`,
    avoid: ["Forgetting to return the result in the wrapper"],
  },
  terms: [["Decorator", "Callable that transforms a function: f = deco(f)."], ["Memoisation", "Caching a function's results by its arguments."], ["functools.wraps", "Copies metadata from the wrapped function."]],
  sources: [S.functools],
});
Q({ id: "py2-dec-1", d: 1, secs: 45, prompt: "```python\ndef shout(fn):\n    def w(*a):\n        fn(*a)\n    return w\n@shout\ndef add(a, b):\n    return a + b\nprint(add(2, 3))\n```\nWhat is printed?", options: ["5", "None", "An error", "'5'"], answer: 1, explain: "The wrapper calls fn but doesn't return its result.", py: "def shout(fn):\n    def w(*a):\n        fn(*a)\n    return w\n@shout\ndef add(a, b):\n    return a + b\nanswer = 1 if add(2, 3) is None else 0" });
Q({ id: "py2-dec-2", d: 2, secs: 60, prompt: "With `@lru_cache(maxsize=None)` on recursive `paths(r, c)` (1 if r == 0 or c == 0, else paths(r−1, c) + paths(r, c−1)), what is `paths(4, 4)`?", answer: 70, tol: 0.5, explain: "C(8, 4) = 70 lattice paths.", py: "from functools import lru_cache\n@lru_cache(maxsize=None)\ndef paths(r, c):\n    if r == 0 or c == 0:\n        return 1\n    return paths(r - 1, c) + paths(r, c - 1)\nanswer = paths(4, 4)" });
Q({ id: "py2-dec-3", d: 2, secs: 60, prompt: "Memoised `fib(n)` (n if n < 2 else fib(n−1) + fib(n−2)) is called once with n = 30 on an empty cache. How many cache misses?", answer: 31, tol: 0.5, explain: "Each n from 0 to 30 is computed once: 31 misses.", py: "from functools import lru_cache\n@lru_cache(maxsize=None)\ndef fib(n):\n    return n if n < 2 else fib(n - 1) + fib(n - 2)\nfib(30)\nanswer = fib.cache_info().misses" });
Q({ id: "py2-dec-4", d: 2, secs: 45, prompt: "```python\ndef count_calls(fn):\n    def w(*a, **k):\n        w.n += 1\n        return fn(*a, **k)\n    w.n = 0\n    return w\n@count_calls\ndef sq(x):\n    return x * x\nsq(2); sq(3); sq(4)\nprint(sq.n)\n```\nWhat is printed?", answer: 3, tol: 0.5, explain: "The wrapper's attribute counts calls.", py: "def count_calls(fn):\n    def w(*a, **k):\n        w.n += 1\n        return fn(*a, **k)\n    w.n = 0\n    return w\n@count_calls\ndef sq(x):\n    return x * x\nsq(2); sq(3); sq(4)\nanswer = sq.n" });
C("py2-dec-c1", "Decorator skeleton", "def d(fn): @wraps(fn) def w(*a, **k): ...; return fn(*a, **k); return w");
C("py2-dec-c2", "Memoised recursion", "@lru_cache(maxsize=None): O(states × work per state); args must be hashable.");

// ───────────────────────── Classes ─────────────────────────

L("py2-classes", M, "Classes and special methods", "__init__, instance vs class attributes, methods, properties and dunder methods like __repr__, __eq__, __len__.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "You print your object and get `<__main__.Account object at 0x7f…>`. Which method fixes that, and which makes `len(obj)` work?",
  intuition: `
**The situation.** OOP questions in DA/DS rounds are light: "design a class for a bank account / LRU cache / parking lot", or "what does this class print". You need the vocabulary and the common special methods.

**The idea.** A class bundles data (attributes) and behaviour (methods). \`__init__\` sets up each new instance; \`self\` is the instance. Attributes set on \`self\` belong to one object; attributes defined in the class body are shared by all instances.

**Special ("dunder") methods** plug your class into Python syntax: \`__repr__\`/\`__str__\` for printing, \`__eq__\` for ==, \`__lt__\` for sorting, \`__len__\` for len(), \`__iter__\` for loops, \`__getitem__\` for [ ], \`__call__\` to make instances callable.
`,
  maths: `
**In one breath.** \`__init__\` initialises; instance vs class attributes; \`@property\` for computed attributes; \`@classmethod\` alternative constructors; \`@staticmethod\` plain helpers; dunders hook into syntax.

\`\`\`python
class Account:
    bank = "SBI"                      # class attribute (shared)
    def __init__(self, owner, balance=0):
        self.owner = owner            # instance attributes
        self._balance = balance
    def deposit(self, amt):
        if amt <= 0:
            raise ValueError("amount must be positive")
        self._balance += amt
        return self
    @property
    def balance(self):                # read like an attribute
        return self._balance
    @classmethod
    def from_csv(cls, line):          # alternative constructor
        owner, bal = line.split(",")
        return cls(owner, int(bal))
    @staticmethod
    def fee(amount):
        return round(amount * 0.01, 2)
    def __repr__(self):
        return f"Account({self.owner!r}, {self._balance})"
    def __eq__(self, other):
        return isinstance(other, Account) and self.owner == other.owner
    def __lt__(self, other):
        return self._balance < other._balance

a = Account("ravi").deposit(500)
b = Account.from_csv("asha,900")
print(a, a.balance, Account.fee(250))   # Account('ravi', 500) 500 2.5
print(sorted([b, a])[0].owner)          # ravi  (uses __lt__)

class Playlist:
    def __init__(self, songs): self.songs = list(songs)
    def __len__(self): return len(self.songs)
    def __getitem__(self, i): return self.songs[i]
p = Playlist(["a", "b", "c"])
print(len(p), p[-1], [s for s in p])    # 3 c ['a', 'b', 'c']  (__getitem__ enables iteration)
\`\`\`

**Name mangling.** \`self.__x\` becomes \`_ClassName__x\`: a convention for "private", not real protection. A single underscore means "internal, please don't touch".

**Hashing.** Defining \`__eq__\` without \`__hash__\` makes instances unhashable; define both (on immutable fields) if you need them in sets/dict keys.
`,
  practice: `
**Design questions.** Name the classes and their responsibilities, the data each holds and the methods; keep invariants in methods (validate in \`deposit\`); add \`__repr__\` for debugging.

**Pythonic alternatives.** For plain data, use \`@dataclass\` (next lesson) instead of writing \`__init__\`/\`__repr__\`/\`__eq__\` by hand.
`,
  traps: [
    { trap: "A list defined in the class body is per-instance.", why: "Class attributes are shared by all instances; `tricks = []` in the class body is one list for every object. Create per-instance lists in `__init__`." },
    { trap: "Defining `__eq__` keeps objects usable in sets.", why: "A class that defines `__eq__` but not `__hash__` gets `__hash__ = None` and becomes unhashable." },
  ],
  say: {
    prompt: "Explain instance vs class attributes, and give examples of special methods you'd implement on a class.",
    secs: 45,
    check: ["__init__ and self", "Instance attributes per object vs class attributes shared", "Mutable class attribute pitfall", "__repr__/__str__, __eq__ (+__hash__), __lt__, __len__/__getitem__/__iter__", "property / classmethod / staticmethod"],
    followups: [
      { q: "__repr__ vs __str__?", a: "__repr__ is the unambiguous developer representation (used in the REPL and containers); __str__ is the readable one used by print/str. If only __repr__ is defined, it's used for both." },
      { q: "@classmethod vs @staticmethod?", a: "A classmethod receives the class (cls) and is used for alternative constructors; a staticmethod receives nothing implicit and is just a namespaced function." },
      { q: "Why use @property?", a: "To expose a computed or validated value with attribute syntax, so you can add logic later without changing callers." },
    ],
    answer: `Instance attributes are set on self, usually in __init__, and belong to one object; class attributes are defined in the class body and shared by all instances, which is a bug if one is a mutable list meant to be per-object. Special methods hook a class into Python's syntax: __repr__ for a readable representation, __eq__ and __hash__ for equality and use in sets, __lt__ so instances sort, __len__ and __getitem__ or __iter__ so it behaves like a container. I'd use @property for computed values and @classmethod for alternative constructors.`,
    avoid: ["\u201cDouble underscore makes an attribute private\u201d"],
  },
  terms: [["self", "The instance a method is called on."], ["Dunder method", "Special __name__ method hooking into syntax."], ["@property", "Method accessed like an attribute."]],
  sources: [S.classes, S.model],
});
Q({ id: "py2-cls-1", d: 2, secs: 45, prompt: "```python\nclass Dog:\n    tricks = []\n    def __init__(self, name):\n        self.name = name\n    def add(self, t):\n        self.tricks.append(t)\na, b = Dog('a'), Dog('b')\na.add('sit'); b.add('roll')\nprint(len(a.tricks))\n```\nWhat is printed?", answer: 2, tol: 0.5, explain: "tricks is a shared class attribute.", py: "class Dog:\n    tricks = []\n    def __init__(self, name):\n        self.name = name\n    def add(self, t):\n        self.tricks.append(t)\na, b = Dog('a'), Dog('b')\na.add('sit'); b.add('roll')\nanswer = len(a.tricks)" });
Q({ id: "py2-cls-2", d: 2, secs: 45, prompt: "A class defines `__eq__` but not `__hash__`. What happens with `{Obj()}`?", options: ["Works normally", "TypeError: unhashable type", "Uses id() for hashing", "Returns an empty set"], answer: 1, explain: "Defining __eq__ sets __hash__ to None.", py: "class Obj:\n    def __eq__(self, o):\n        return True\ntry:\n    {Obj()}; answer = 0\nexcept TypeError:\n    answer = 1" });
Q({ id: "py2-cls-3", d: 1, secs: 30, prompt: "```python\nclass P:\n    def __init__(self, xs): self.xs = xs\n    def __len__(self): return len(self.xs)\n    def __getitem__(self, i): return self.xs[i]\np = P([5, 6, 7])\nprint(len(p) + sum(p))\n```\nWhat is printed?", answer: 21, tol: 0.5, explain: "len 3; __getitem__ makes it iterable: 5 + 6 + 7 = 18. Total 21.", py: "class P:\n    def __init__(self, xs): self.xs = xs\n    def __len__(self): return len(self.xs)\n    def __getitem__(self, i): return self.xs[i]\np = P([5, 6, 7])\nanswer = len(p) + sum(p)" });
Q({ id: "py2-cls-4", d: 2, secs: 45, prompt: "```python\nclass A:\n    def __init__(self, v): self.v = v\n    def __lt__(self, o): return self.v > o.v\nprint(sorted([A(1), A(3), A(2)])[0].v)\n```\nWhat is printed?", answer: 3, tol: 0.5, explain: "__lt__ is defined as 'greater than', so sorting puts the largest first.", py: "class A:\n    def __init__(self, v): self.v = v\n    def __lt__(self, o): return self.v > o.v\nanswer = sorted([A(1), A(3), A(2)])[0].v" });
C("py2-cls-c1", "Class vs instance attribute", "Class body = shared by all; self.x in __init__ = per object.");
C("py2-cls-c2", "Container protocol", "__len__, __getitem__ (indexing + iteration), __iter__, __contains__.");

// ───────────────────────── Inheritance and dataclasses ─────────────────────────

L("py2-inheritance", M, "Inheritance, super() and dataclasses", "Overriding methods, super(), MRO, composition vs inheritance, and @dataclass for records.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "You need Customer, PremiumCustomer and a Transaction record. Which deserve inheritance, and which should be a dataclass?",
  intuition: `
**The situation.** Low-level design questions and code-reading questions test whether you know how method lookup works and when not to inherit.

**The idea.** A subclass inherits attributes and methods from its base and can **override** them. \`super().method()\` calls the parent's version, typically inside an overridden \`__init__\`. Python looks up methods along the **MRO** (method resolution order): the class, then its bases left to right.

Inheritance means "is a" (a PremiumCustomer is a Customer). If the relationship is "has a" (a Portfolio has Holdings), use **composition**: store the other object as an attribute.

For classes that mainly hold data, \`@dataclass\` writes \`__init__\`, \`__repr__\` and \`__eq__\` for you from type-annotated fields.
`,
  maths: `
**In one breath.** \`class B(A)\`; override and call \`super()\`; \`isinstance\` respects inheritance; MRO = C3 linearisation; \`@dataclass(order=True, frozen=True)\`, \`field(default_factory=list)\`.

\`\`\`python
class Customer:
    def __init__(self, name):
        self.name = name
    def discount(self):
        return 0.0
    def describe(self):
        return f"{self.name}: {self.discount():.0%} off"

class Premium(Customer):
    def __init__(self, name, tier):
        super().__init__(name)        # reuse parent setup
        self.tier = tier
    def discount(self):               # override
        return 0.1 * self.tier

p = Premium("asha", 2)
print(p.describe())                   # asha: 20% off  (parent method calls the override)
print(isinstance(p, Customer))        # True
print([c.__name__ for c in Premium.__mro__])   # ['Premium', 'Customer', 'object']

from dataclasses import dataclass, field, asdict
@dataclass(order=True)
class Txn:
    amount: float
    cust: str = field(compare=False)
    tags: list = field(default_factory=list, compare=False)

t1, t2 = Txn(500, "ravi"), Txn(120, "asha", ["upi"])
print(t1 > t2, t2)        # True Txn(amount=120, cust='asha', tags=['upi'])
print(asdict(t2)["tags"]) # ['upi']

@dataclass(frozen=True)
class Point:
    x: int
    y: int
print({Point(1, 2), Point(1, 2)})   # one element: frozen dataclasses are hashable
\`\`\`

**Abstract base classes.** \`abc.ABC\` with \`@abstractmethod\` forces subclasses to implement a method; useful in design questions ("every PaymentMethod must implement pay").
`,
  practice: `
**Design heuristics.** Prefer composition; inherit only for a genuine is-a relationship with shared behaviour. Keep hierarchies shallow. Use dataclasses for records (configs, rows, events), enums for fixed choices, ABCs for interfaces.

**Code reading.** When a parent method calls \`self.something()\`, the child's override runs: all methods are effectively virtual.
`,
  traps: [
    { trap: "A parent method that calls `self.discount()` always uses the parent's discount.", why: "Lookup starts at the instance's class, so the subclass override runs (dynamic dispatch)." },
    { trap: "`@dataclass` fields can default to `[]`.", why: "Mutable defaults are rejected (ValueError); use `field(default_factory=list)`." },
  ],
  say: {
    prompt: "When would you use inheritance versus composition, and what do dataclasses give you?",
    secs: 45,
    check: ["Inheritance for is-a with shared behaviour; override + super()", "Composition for has-a; prefer composition", "Method lookup via MRO; dynamic dispatch", "Dataclass auto-generates __init__/__repr__/__eq__ (order, frozen options)", "default_factory for mutable defaults"],
    followups: [
      { q: "What does super() do in multiple inheritance?", a: "It calls the next class in the MRO, not necessarily the direct parent, which lets cooperative classes each run their part once." },
      { q: "How do you make a dataclass hashable?", a: "`@dataclass(frozen=True)` (with eq=True) generates __hash__ from the fields and blocks assignment." },
      { q: "What's an abstract base class for?", a: "To define an interface: subclasses must implement the abstract methods or they can't be instantiated." },
    ],
    answer: `I use inheritance when the subclass genuinely is a kind of the parent and shares its behaviour, overriding what differs and calling super() to reuse the parent's setup. Because lookup follows the MRO from the instance's class, a parent method calling self.method() picks up the override. When one object just uses another, like a Portfolio holding Positions, composition is simpler and less brittle.

For classes that are mostly data I use @dataclass: it generates __init__, __repr__ and __eq__ from the annotated fields, order=True adds comparisons, frozen=True makes instances immutable and hashable, and default_factory handles list defaults.`,
    avoid: ["Deep inheritance trees for code reuse"],
  },
  terms: [["MRO", "Method resolution order: where Python looks for attributes."], ["Composition", "Building objects from other objects held as attributes."], ["@dataclass", "Generates boilerplate methods from annotated fields."]],
  sources: [S.classes, S.dc],
});
Q({ id: "py2-inh-1", d: 2, secs: 45, prompt: "```python\nclass A:\n    def f(self): return 1\n    def g(self): return self.f() * 10\nclass B(A):\n    def f(self): return 2\nprint(B().g())\n```\nWhat is printed?", answer: 20, tol: 0.5, explain: "A.g calls self.f(), which resolves to B.f.", py: "class A:\n    def f(self): return 1\n    def g(self): return self.f() * 10\nclass B(A):\n    def f(self): return 2\nanswer = B().g()" });
Q({ id: "py2-inh-2", d: 2, secs: 45, prompt: "```python\nclass A:\n    def __init__(self): self.x = 1\nclass B(A):\n    def __init__(self):\n        super().__init__()\n        self.x += 5\nclass C(A):\n    def __init__(self): self.y = 2\nprint(B().x + hasattr(C(), 'x'))\n```\nWhat is printed?", answer: 6, tol: 0.5, explain: "B calls super().__init__ → x = 6. C overrides __init__ without super(), so it has no x (hasattr False = 0).", py: "class A:\n    def __init__(self): self.x = 1\nclass B(A):\n    def __init__(self):\n        super().__init__()\n        self.x += 5\nclass C(A):\n    def __init__(self): self.y = 2\nanswer = B().x + hasattr(C(), 'x')" });
Q({ id: "py2-inh-3", d: 1, secs: 30, prompt: "`@dataclass(frozen=True) class P: x: int; y: int`. What is `len({P(1, 2), P(1, 2), P(2, 1)})`?", answer: 2, tol: 0.5, explain: "Equal frozen dataclasses hash equal.", py: "from dataclasses import dataclass\n@dataclass(frozen=True)\nclass P:\n    x: int\n    y: int\nanswer = len({P(1, 2), P(1, 2), P(2, 1)})" });
Q({ id: "py2-inh-4", d: 2, secs: 45, prompt: "`@dataclass(order=True)` with fields `amount: float` and `cust: str = field(compare=False)`. Which is the max of `[T(5, 'z'), T(9, 'a'), T(7, 'b')]`? Give its amount.", answer: 9, tol: 0.5, explain: "Comparison uses amount only.", py: "from dataclasses import dataclass, field\n@dataclass(order=True)\nclass T:\n    amount: float\n    cust: str = field(compare=False)\nanswer = max([T(5, 'z'), T(9, 'a'), T(7, 'b')]).amount" });
C("py2-inh-c1", "super()", "Calls the next class in the MRO, usually the parent's __init__.");
C("py2-inh-c2", "Dataclass options", "order=True comparisons, frozen=True immutable + hashable, field(default_factory=list).");

// ───────────────────────── Exceptions ─────────────────────────

L("py2-exceptions", M, "Exceptions and error handling", "try/except/else/finally, catching specific errors, raising, custom exceptions and EAFP.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "`except: pass` makes the crash go away. Why will a reviewer reject it?",
  intuition: `
**The situation.** Data pipelines hit bad rows, missing files and divide-by-zero. Interviewers check that you handle the expected failures and let unexpected ones surface.

**The idea.** Code that may fail goes in \`try\`. \`except SomeError\` handles that error (and its subclasses); order clauses from specific to general. \`else\` runs only if nothing was raised; \`finally\` always runs (cleanup). \`raise\` signals an error; a bare \`raise\` inside \`except\` re-raises the current one; \`raise X from e\` chains them.

Python style favours **EAFP** ("easier to ask forgiveness than permission"): try the operation and handle the exception, rather than checking every precondition first.
`,
  maths: `
**In one breath.** Catch specific exceptions; else = success path; finally = always; custom exceptions subclass Exception; never swallow errors silently.

\`\`\`python
def safe_ratio(a, b):
    try:
        r = a / b
    except ZeroDivisionError:
        return None
    except TypeError as e:
        raise ValueError(f"bad inputs: {a!r}, {b!r}") from e
    else:
        return round(r, 2)
    finally:
        pass                          # cleanup would go here; runs every time

print(safe_ratio(1, 4), safe_ratio(1, 0))   # 0.25 None

rows = ["10", "x", "25", ""]
total, bad = 0, 0
for r in rows:
    try:
        total += int(r)
    except ValueError:
        bad += 1                      # count and continue
print(total, bad)                     # 35 2

class InsufficientFunds(Exception):
    pass

def withdraw(balance, amt):
    if amt > balance:
        raise InsufficientFunds(f"need {amt - balance} more")
    return balance - amt

d = {"a": 1}
try:
    v = d["b"]                        # EAFP
except KeyError:
    v = 0
\`\`\`

**Hierarchy.** \`BaseException\` → \`Exception\` → (\`ValueError\`, \`TypeError\`, \`KeyError\` ⊂ \`LookupError\`, \`ZeroDivisionError\` ⊂ \`ArithmeticError\`, \`OSError\`…). \`KeyboardInterrupt\` and \`SystemExit\` are not \`Exception\`s, so \`except Exception\` doesn't swallow Ctrl-C; a bare \`except:\` does.

**Context managers.** \`with open(...)\` guarantees cleanup like \`finally\`.
`,
  practice: `
**In data code.** Validate inputs at boundaries; catch specific parsing errors per row, log the row and continue; let truly unexpected errors propagate; keep the try block small so you know what failed.

**In interviews.** Mention edge cases explicitly ("empty input returns [], invalid type raises TypeError") rather than wrapping everything in try/except.
`,
  traps: [
    { trap: "`except Exception:` and bare `except:` are the same.", why: "Bare except also catches KeyboardInterrupt and SystemExit. Neither should be used to hide errors; catch specific exceptions." },
    { trap: "`finally` runs only if an exception occurred.", why: "It always runs, success or failure, even after return." },
    { trap: "Put the whole function in try to be safe.", why: "A huge try block hides which line failed and catches errors you didn't anticipate. Keep it tight around the risky call." },
  ],
  say: {
    prompt: "How do you handle errors in Python, and what's wrong with a bare `except: pass`?",
    secs: 45,
    check: ["try / except specific / else / finally roles", "Order specific before general; exception hierarchy", "raise, re-raise, raise from", "Custom exceptions subclass Exception", "Bare except swallows everything incl. KeyboardInterrupt and hides bugs"],
    followups: [
      { q: "What's EAFP vs LBYL?", a: "EAFP tries the operation and handles the exception; LBYL checks preconditions first. EAFP avoids race conditions and duplicate lookups and is idiomatic Python." },
      { q: "What does `raise ... from e` do?", a: "Chains exceptions: the new exception's __cause__ is e, and the traceback shows both, so the root cause isn't lost." },
      { q: "When does the else clause run?", a: "Only when the try block completed without raising; code there isn't protected by the except clauses." },
    ],
    answer: `I wrap only the risky operation in try and catch the specific exceptions I expect, ordered from most to least specific, like ValueError for a bad number in a row, which I log and skip. else holds code that should run only on success, finally holds cleanup that must always run, and when converting errors I use raise ... from e so the original cause stays in the traceback. A bare except: pass catches everything, including KeyboardInterrupt and genuine bugs like typos, and throws away the information, so failures become silent wrong results.`,
    avoid: ["Catching Exception everywhere", "Silently passing"],
  },
  terms: [["EAFP", "Try first, handle exceptions; idiomatic Python."], ["finally", "Block that always runs after try."], ["Exception chaining", "raise New from original keeps the cause."]],
  sources: [S.errors],
});
Q({ id: "py2-exc-1", d: 1, secs: 45, prompt: "```python\nrows = ['10', 'x', '25', '', '3']\ntotal = bad = 0\nfor r in rows:\n    try:\n        total += int(r)\n    except ValueError:\n        bad += 1\nprint(total * 10 + bad)\n```\nWhat is printed?", answer: 382, tol: 0.5, explain: "total = 38, bad = 2 → 382.", py: "rows = ['10', 'x', '25', '', '3']\ntotal = bad = 0\nfor r in rows:\n    try:\n        total += int(r)\n    except ValueError:\n        bad += 1\nanswer = total * 10 + bad" });
Q({ id: "py2-exc-2", d: 2, secs: 45, prompt: "```python\nlog = []\ndef f(x):\n    try:\n        r = 10 / x\n    except ZeroDivisionError:\n        log.append('e'); return -1\n    else:\n        log.append('s'); return r\n    finally:\n        log.append('f')\nf(2); f(0)\nprint(len(log))\n```\nWhat is printed?", answer: 4, tol: 0.5, explain: "f(2): s, f. f(0): e, f. finally runs even after return.", py: "log = []\ndef f(x):\n    try:\n        r = 10 / x\n    except ZeroDivisionError:\n        log.append('e'); return -1\n    else:\n        log.append('s'); return r\n    finally:\n        log.append('f')\nf(2); f(0)\nanswer = len(log)" });
Q({ id: "py2-exc-3", d: 1, secs: 30, prompt: "`KeyError` is a subclass of which built-in exception?", options: ["ValueError", "LookupError", "TypeError", "AttributeError"], answer: 1, explain: "KeyError and IndexError both derive from LookupError.", py: "opts = [ValueError, LookupError, TypeError, AttributeError]\nanswer = [issubclass(KeyError, o) for o in opts].index(True)" });
Q({ id: "py2-exc-4", d: 2, secs: 45, prompt: "```python\ntry:\n    try:\n        {}['k']\n    except KeyError as e:\n        raise ValueError('missing') from e\nexcept ValueError as v:\n    print(type(v.__cause__).__name__)\n```\nWhich name is printed?", options: ["ValueError", "KeyError", "NoneType", "Exception"], answer: 1, explain: "`from e` sets __cause__ to the KeyError.", py: "try:\n    try:\n        {}['k']\n    except KeyError as e:\n        raise ValueError('missing') from e\nexcept ValueError as v:\n    n = type(v.__cause__).__name__\nanswer = ['ValueError', 'KeyError', 'NoneType', 'Exception'].index(n)" });
C("py2-exc-c1", "try clauses", "except: handle · else: success only · finally: always.");
C("py2-exc-c2", "Don't", "Bare except / except: pass — catches Ctrl-C and hides bugs.");

// ───────────────────────── Interview lesson ─────────────────────────

L("py2-func-practice", M, "Functions, OOP and errors practice", "Design and code-reading questions on functions, classes and error handling.", {
  kind: "interview", mins: 30, prereq: ["py2-func-args", "py2-decorators", "py2-classes"],
  hook: "Talk through each design or bug, out loud, before opening the answer.",
}, [
  iq("Design an LRU cache class with get(key) and put(key, value) in O(1).", "Use collections.OrderedDict (or a dict plus a doubly linked list): get moves the key to the end and returns the value (or -1); put inserts/updates and moves to end, and if size exceeds capacity pops the first item (least recently used). Both O(1). functools.lru_cache does this for function results.", ["OrderedDict / dict + linked list", "move_to_end on access", "Evict popitem(last=False)", "O(1) both operations"]),
  iq("Write a decorator that retries a function up to 3 times on ConnectionError with a delay.", "Decorator factory retry(times, delay): wrapper loops attempts, calls fn(*args, **kwargs) and returns its result; on ConnectionError sleeps and retries; after the last attempt re-raises. Use functools.wraps. Optionally exponential backoff.", ["Three-level factory", "*args/**kwargs and return value", "Catch only the specific error; re-raise at the end", "wraps / backoff"]),
  iq("A function parses 1M CSV rows and sometimes crashes on bad data. How do you make it robust?", "Catch specific exceptions (ValueError, KeyError) per row, record the row number and reason, continue, and report counts at the end; validate the schema up front; keep unexpected errors loud. Use the csv module or pandas with error handling (on_bad_lines) rather than manual splits.", ["Per-row specific exception handling", "Logging/collecting bad rows", "Don't swallow unexpected errors", "Use csv/pandas tools"]),
  iq("What's wrong with this class? `class Cart: items = []; def add(self, x): self.items.append(x)`", "items is a class attribute shared by all carts, so every cart sees every item. Initialise self.items = [] in __init__.", ["Class vs instance attribute", "Fix in __init__", "Explains shared mutable state"]),
  iq("Model a parking lot with different vehicle and spot sizes.", "Classes: Vehicle (with size) and subclasses or an enum for type, ParkingSpot (size, occupied), Level (list of spots), ParkingLot (levels, park/leave methods, availability counts). Use composition for lot → levels → spots, an enum for sizes, and keep fitting logic in one method. Mention data structures for finding free spots quickly (dict of free spots by size).", ["Identifies core classes and responsibilities", "Composition vs inheritance choices", "Enum/sizes and fit rule", "Efficient availability lookup"]),
  iq("Explain what `@lru_cache` does to a recursive function and when it can backfire.", "It memoises results by argument tuple, turning overlapping-subproblem recursion into O(states) DP. Backfires with unhashable arguments (TypeError), impure functions (stale results), huge state spaces (memory), and deep recursion (RecursionError).", ["Memoisation by arguments", "Complexity improvement", "Hashable args / purity", "Memory and recursion depth limits"]),
]);
