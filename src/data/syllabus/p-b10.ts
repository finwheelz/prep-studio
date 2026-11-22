/**
 * Batch 10: P1 pandas (8 concepts) and plotting (3 concepts: matplotlib OO API, choosing a chart, seaborn).
 * Each page has notes with worked examples, 3 resources (videos first), 3 interview questions,
 * 2 cards and 3 checked items. "Trace" items run the snippet in Pyodide (pandas 2.2, matplotlib 3.5,
 * seaborn 0.13) and compare the printed number; the two word problems on the chart page recompute
 * their answer in Python. Coding problems are in problems-p1-pandas.ts and problems-p1-plot.ts.
 */
import type { InterviewQ, Resource } from "@/lib/types";
import { Card_, Item, R, T } from "./build";

const iq = (q: string, answer: string, rubric: string[]): InterviewQ => ({ q, answer, rubric });
const yt = (id: string, title: string, who: string) => R(`Video: ${title} (${who})`, `https://www.youtube.com/watch?v=${id}`);
const PD_DOC = (path: string, label: string) => R(`pandas docs: ${label}`, `https://pandas.pydata.org/docs/user_guide/${path}`);
const PDSH = (path: string, label: string) => R(`Python Data Science Handbook: ${label}`, `https://jakevdp.github.io/PythonDataScienceHandbook/${path}`);

type Kind = "pd" | "mpl" | "np" | "sns";
const HEAD: Record<Kind, string> = {
  pd: "import numpy as np\nimport pandas as pd\n",
  mpl: "import matplotlib.pyplot as plt\n",
  np: "import numpy as np\n",
  sns: "import pandas as pd\nimport seaborn as sns\nimport matplotlib.pyplot as plt\n",
};
const PKG: Record<Kind, string[]> = { pd: ["pandas"], mpl: ["matplotlib"], np: ["numpy"], sns: ["seaborn"] };
const SRC: Record<Kind, string> = {
  pd: "Practice: trace the code; output checked by running it with pandas 2.2 in Pyodide (Nov 2026)",
  mpl: "Practice: trace the code; output checked by running it with matplotlib 3.5 in Pyodide (Nov 2026)",
  np: "Practice: trace the code; output checked by running it with numpy in Pyodide (Nov 2026)",
  sns: "Practice: trace the code; output checked by running it with seaborn 0.13 in Pyodide (Nov 2026)",
};
function trace(id: string, topic: string, kind: Kind, d: 1 | 2 | 3, secs: number, code: string, answer: number, explain: string, fast: string, trap: string) {
  const full = HEAD[kind] + code;
  Item({
    id, topic, d, secs, prompt: `What does this code print?\n\n\`\`\`\n${full}\n\`\`\``, answer, tol: 0, explain, fast, trap, src: SRC[kind],
    check: {
      py: `import os, io, contextlib, warnings\nos.environ["MPLBACKEND"] = "AGG"\n_buf = io.StringIO()\nwith warnings.catch_warnings():\n    warnings.simplefilter("ignore")\n    with contextlib.redirect_stdout(_buf):\n        exec(${JSON.stringify(full)}, {"__name__": "__main__"})\nanswer = float(_buf.getvalue().strip())`,
      packages: PKG[kind],
    },
  });
}
const pdTopic = (id: string, title: string, summary: string, notes: string, resources: Resource[], category: string, interview: InterviewQ[]) =>
  T(id, "foundations", "pandas", title, summary, notes, { resources, categories: [category], interview });
const vizTopic = (id: string, title: string, summary: string, notes: string, resources: Resource[], category: string, interview: InterviewQ[]) =>
  T(id, "foundations", "Plotting", title, summary, notes, { resources, categories: [category], interview });

// ───────────────────────── pandas ─────────────────────────
pdTopic("pd-basics", "Series, DataFrames, the index and dtypes", "What pandas objects are, how to load and inspect a table, and why arithmetic aligns on labels.", `
**Series and DataFrame.** A Series is a 1-D array of values plus an **index** of labels. A DataFrame is a set of Series (the columns) that share one row index. Each column has a single dtype.

**Building one.**
- From a dict of columns: \`pd.DataFrame({"a": [1, 2], "b": ["x", "y"]})\`.
- From a list of records: \`pd.DataFrame(list_of_dicts)\`; missing keys become NaN.
- From a file: \`pd.read_csv(path, usecols=[...], dtype={...}, parse_dates=["date"], na_values=["-", "missing"], index_col="id")\`. Getting these arguments right at load time saves most cleaning later.

**First look.** \`df.shape\`, \`df.head()\`, \`df.info()\` (dtypes, non-null counts, memory), \`df.describe()\` (numeric summary; \`include="all"\` for the rest), \`df["col"].value_counts(normalize=True, dropna=False)\`, \`df.nunique()\`, \`df.isna().sum()\`.

**dtypes.** int64, float64, bool, object (Python strings or mixed values), datetime64[ns], category.
- An integer column with one missing value becomes **float64**, because NaN is a float. The nullable \`"Int64"\` dtype keeps integers and shows \`<NA>\`.
- Strings are stored as object in pandas 2.x (the site runs 2.2); pandas 3.0 switches to a dedicated string dtype.
- A numeric column that loads as object almost always means a stray marker ("-", "N/A", "1,200") in the file.

**Index alignment.** Arithmetic between two Series matches **labels, not positions**. A label present on only one side gives NaN. Use \`s.add(t, fill_value=0)\` to treat missing as 0. Reductions skip NaN by default (\`skipna=True\`), so the sum of an all-NaN Series is 0.

**Sorting and the index.** \`sort_values("col", ascending=False)\`, \`sort_index()\`, \`nlargest(n, "col")\`. \`set_index("id")\` moves a column into the index; \`reset_index()\` moves it back (\`drop=True\` discards it instead).

**Worked example 1.** s = (a: 1, b: 2, c: 3), t = (b: 10, c: 20, d: 30). s + t = (a: NaN, b: 12, c: 23, d: NaN), and its sum is 35 (NaN skipped). \`s.add(t, fill_value=0)\` = (1, 12, 23, 30).

**Worked example 2.** \`pd.Series([1, None, 3])\` is float64: mean 2.0, count 2, len 3.

**Worked example 3.** ["x", "y", "x", "x"].value_counts(normalize=True) → x 0.75, y 0.25.

**Worked example 4.** \`pd.DataFrame([{"a": 1}, {"a": 2, "b": 5}])\` has shape (2, 2); column b is (NaN, 5.0), a float because of the NaN.
`, [yt("zmdjNSmRXF4", "Python Pandas Tutorial (Part 2): DataFrame and Series basics", "Corey Schafer"), yt("2uvysYbKdjM", "Complete Python Pandas Data Science Tutorial (2025 edition)", "Keith Galli"), PD_DOC("10min.html", "10 minutes to pandas"), PDSH("03.01-introducing-pandas-objects.html", "Introducing pandas objects")], "pd/basics", [
  iq("What is the index in pandas, and why does it matter for arithmetic?", "The index holds the row labels. Operations between Series or DataFrames align on those labels, not on position, so the result covers the union of labels and is NaN wherever one side is missing. That's convenient for joining data by key, but it surprises people who expect positional arithmetic. Use fill_value, reindex, or .to_numpy() for positional work, and set_index for label-based lookups.", ["Row labels", "Alignment on labels → union, NaN", "fill_value / to_numpy / reset_index"]),
  iq("An integer ID column comes out as float64 after read_csv. Why, and what do you do?", "At least one value is missing, and NaN is a float, so the whole column is upcast. Options: read it with dtype={'id': 'Int64'} (nullable integer), or as a string if it's an identifier, or find and handle the missing rows first. Watch for IDs like 1.0 being written back out.", ["NaN forces float", "Nullable Int64 or string dtype", "Investigate the missing rows"]),
  iq("You get a new dataset. What are your first five lines of pandas?", "df.shape and df.head() to see what a row is; df.info() for dtypes and non-null counts; df.describe(include='all') for ranges and suspicious values; df.isna().mean() for missingness; df.nunique() and value_counts on key columns to find IDs, categories and duplicates (df.duplicated().sum()). Then check that numeric and date columns parsed as such.", ["Shape/head", "info: dtypes, nulls", "describe / value_counts / duplicates", "Check types parsed"]),
]);
trace("pd-bas-t1", "pd-basics", "pd", 1, 45, 's = pd.Series([1, 2, 3], index=["a", "b", "c"])\nt = pd.Series([10, 20, 30], index=["b", "c", "d"])\nprint((s + t).sum())', 35,
  "Alignment on labels: b → 12, c → 23, and a and d are NaN. sum skips NaN: 35.", "Match labels; one-sided labels are NaN and drop out of the sum.", "Adding by position (11 + 22 + 33 = 66).");
trace("pd-bas-t2", "pd-basics", "pd", 1, 30, "s = pd.Series([1, None, 3])\nprint(s.mean() + s.count())", 4,
  "The None becomes NaN (float64). mean skips it: 2.0. count counts non-missing values: 2. Total 4.", "count excludes NaN; len doesn't.", "Treating the missing value as 0 (mean 1.33) or counting 3.");
trace("pd-bas-t3", "pd-basics", "pd", 1, 45, 's = pd.Series(["a", "b", "a", "c", "a", None])\nprint(s.value_counts().iloc[0] + s.nunique())', 6,
  "value_counts sorts by count, so the first is a: 3. nunique ignores the missing value: a, b, c = 3. Total 6.", "value_counts and nunique both drop NaN by default.", "Counting None as a fourth distinct value (7).");
Card_("pd-bas-c1", "Series + Series", "Aligns on index labels; labels on one side only → NaN. s.add(t, fill_value=0) treats them as 0.", "pd-basics");
Card_("pd-bas-c2", "Integer column with a missing value", "Becomes float64; use dtype 'Int64' to keep integers.", "pd-basics");

pdTopic("pd-select", "Selecting with loc, iloc and boolean masks", "Picking rows and columns by label, by position and by condition, and assigning without chained-assignment bugs.", `
**Columns.** \`df["a"]\` returns a Series; \`df[["a", "b"]]\` returns a DataFrame. Attribute access (\`df.a\`) only works for simple names and can't create columns.

**loc vs iloc.**
- \`df.loc[rows, cols]\` uses **labels**, and label slices include **both ends** (\`df.loc["b":"d"]\`).
- \`df.iloc[rows, cols]\` uses **positions**, and slices exclude the end, as in Python.
- With a default RangeIndex, labels and positions agree only until you filter or sort. After that, \`loc[0]\` is not "the first row" and may not exist at all.
- \`at\` / \`iat\` fetch a single cell quickly.

**Boolean filtering.**
- \`df[df["age"] > 30]\`. Combine conditions with \`&\`, \`|\` and \`~\`, and put parentheses around each one; \`and\` / \`or\` raise an error.
- \`isin([...])\`, and \`between(lo, hi)\`, which is inclusive at both ends by default.
- \`str.contains("x", na=False)\`.
- \`df.query("age > 30 and city == 'Pune'")\`.

**Assigning.** Use a single loc call: \`df.loc[df["age"] > 30, "flag"] = 1\`. Add a column with \`df["x"] = ...\`, or \`df.assign(x=...)\` to return a new frame.

**Chained assignment.** \`df[df["a"] > 2]["b"] = 0\` first builds a filtered **copy** and then sets values on the copy. df is unchanged, and pandas 2.x warns with \`SettingWithCopyWarning\`. Under Copy-on-Write (the default from pandas 3.0) it never modifies df. If you filtered into a new variable and want to edit it, take an explicit \`.copy()\`.

**Worked example 1.** For a Series with index [3, 2, 1, 0] and values 10–40, \`s.loc[2:0]\` = 20, 30, 40 (labels, inclusive) and \`s.iloc[2:]\` = 30, 40 (positions).

**Worked example 2.** \`df.loc[df["a"].between(3, 8), "b"]\` picks b where 3 ≤ a ≤ 8, including 3 and 8.

**Worked example 3.** After \`df = df[df.x > 0]\`, \`df.loc[0]\` raises KeyError if row 0 was filtered out, while \`df.iloc[0]\` is the first remaining row.

**Worked example 4.** \`df.loc[df.city.isin(["Pune", "Delhi"]) & (df.age >= 18), ["name", "age"]]\` filters rows and selects columns in one step.
`, [yt("xvpNA7bC8cs", "How do I select multiple rows and columns from a pandas DataFrame?", "Data School"), yt("4R4WsDJ-KVc", "How do I avoid a SettingWithCopyWarning in pandas?", "Data School"), yt("Lw2rlcxScZY", "Python Pandas Tutorial (Part 4): Filtering", "Corey Schafer"), PD_DOC("indexing.html", "Indexing and selecting data"), PD_DOC("copy_on_write.html", "Copy-on-Write")], "pd/select", [
  iq("What is the difference between loc and iloc?", "loc selects by label and its slices include the end label; iloc selects by integer position and its slices exclude the end, like Python lists. They agree on a fresh RangeIndex but diverge after filtering, sorting or set_index, which is when loc[0] bugs appear. loc also accepts boolean masks and does assignment; iloc takes positions only.", ["Labels vs positions", "Inclusive vs exclusive slices", "Diverge after filter/sort"]),
  iq("What is SettingWithCopyWarning and how do you fix it?", "It warns that you may be assigning to a temporary copy, typically with chained indexing like df[mask]['col'] = v, so the original isn't changed. Fix it by assigning in one step with df.loc[mask, 'col'] = v, or, if you meant to work on a subset, by taking sub = df[mask].copy() explicitly. With Copy-on-Write (default in pandas 3.0) chained assignment never writes through.", ["Chained indexing → copy", "Single loc assignment", "Explicit .copy() / CoW"]),
  iq("How do you filter rows on several conditions in pandas?", "Build boolean Series and combine them with &, | and ~, wrapping each comparison in parentheses because & binds tighter than >. Use isin for membership, between for ranges (inclusive by default), str.contains(..., na=False) for text, or df.query for readability. Python's and/or raise 'truth value is ambiguous'.", ["& | ~ with parentheses", "isin / between / str.contains", "query; and/or fail"]),
]);
trace("pd-sel-t1", "pd-select", "pd", 2, 60, "s = pd.Series([10, 20, 30, 40], index=[3, 2, 1, 0])\nprint(s.loc[2:0].sum() + s.iloc[2:].sum())", 160,
  "loc[2:0] goes by label from 2 to 0 inclusive: 20 + 30 + 40 = 90. iloc[2:] goes by position: 30 + 40 = 70. Total 160.", "loc = labels, both ends included; iloc = positions, end excluded.", "Reading loc[2:0] as positions (an empty slice).");
trace("pd-sel-t2", "pd-select", "pd", 1, 45, 'df = pd.DataFrame({"a": [1, 5, 3, 8], "b": [2, 2, 9, 1]})\nprint(df.loc[df["a"].between(3, 8), "b"].sum())', 12,
  "between is inclusive: a = 5, 3 and 8 qualify, so b = 2 + 9 + 1 = 12.", "between(lo, hi) includes both ends.", "Treating between as exclusive (only a = 5 → 2).");
trace("pd-sel-t3", "pd-select", "pd", 2, 45, 'df = pd.DataFrame({"a": [1, 5, 3, 8], "b": [2, 2, 9, 1]})\ndf[df["a"] > 2]["b"] = 0\nprint(df["b"].sum())', 14,
  "Chained assignment: df[mask] is a copy, and setting ['b'] on it doesn't touch df (pandas warns). df.b is still 2 + 2 + 9 + 1 = 14.", "df[mask][col] = v writes to a temporary copy.", "Thinking it zeroed three values (answer 2); that needs df.loc[mask, 'b'] = 0.");
Card_("pd-sel-c1", "loc slices", "Inclusive of both end labels; iloc slices exclude the end position.", "pd-select");
Card_("pd-sel-c2", "df[mask]['col'] = v", "Sets on a copy; df is unchanged. Write df.loc[mask, 'col'] = v.", "pd-select");

pdTopic("pd-clean", "Missing values, duplicates, types and strings", "Finding and handling NaN, fixing dtypes, removing duplicates and cleaning text columns.", `
**Finding missing values.** \`df.isna().sum()\` counts them per column; \`df.isna().mean()\` gives the share. NaN ≠ NaN, so \`x == np.nan\` is always False; always use \`isna\`. None in an object column also counts as missing.

**Dropping.** \`dropna()\` drops rows with any NaN. Options: \`subset=[...]\`, \`how="all"\`, and \`thresh=k\` (keep rows with at least k non-missing values).

**Filling.**
- \`fillna(0)\`, or a dict per column: \`fillna({"city": "unknown", "age": df["age"].median()})\`.
- \`ffill()\` / \`bfill()\` carry the last known value forward or back, which suits time-ordered data.
- \`interpolate()\` fills linearly between neighbours.
- When modelling, compute fill statistics on the **training** set only.

**Types.**
- \`astype("int64")\` fails on NaN.
- \`pd.to_numeric(s, errors="coerce")\` turns unparseable values into NaN; then look at what became NaN.
- \`pd.to_datetime(..., errors="coerce")\` does the same for dates.
- \`astype("category")\` for repeated labels uses less memory and fixes the set of allowed values.

**Duplicates.** \`duplicated(subset, keep="first" | "last" | False)\` marks rows; \`drop_duplicates(subset, keep)\` removes them. To keep the latest record per key, sort by time and then \`drop_duplicates("key", keep="last")\`.

**Strings.** The \`.str\` accessor vectorises string methods:
- \`str.strip().str.lower()\`
- \`str.replace(r"[$,]", "", regex=True)\`; the default is a literal match, not a regex.
- \`str.contains("x", na=False)\`
- \`str.split("-", expand=True)\`
- \`str.extract(r"(\\d+)")\`

**Worked example 1.** ["1", "2", "x", None] → \`to_numeric(errors="coerce")\` → 1, 2, NaN, NaN; the sum is 3.

**Worked example 2.** [1, NaN, NaN, 4]: \`ffill\` → 1, 1, 1, 4; \`interpolate\` → 1, 2, 3, 4.

**Worked example 3.** " $1,200.50 " → strip, then remove $ and the comma → "1200.50" → 1200.5.

**Worked example 4.** k = [1, 1, 2, 2, 2] with v = [1, 1, 1, 2, 2]: \`drop_duplicates()\` keeps 3 rows (full-row duplicates removed); \`duplicated(subset="k", keep=False)\` marks all 5 rows, because every k repeats.
`, [yt("fCMrO_VzeL8", "How do I handle missing values in pandas?", "Data School"), yt("KdmPHEnPJPs", "Python Pandas Tutorial (Part 9): Cleaning data", "Corey Schafer"), yt("bofaC0IckHo", "How do I use string methods in pandas?", "Data School"), PD_DOC("missing_data.html", "Working with missing data"), PD_DOC("text.html", "Working with text data")], "pd/clean", [
  iq("How do you decide between dropping and imputing missing values?", "Look at how much is missing and why. Dropping is fine for a small number of rows missing completely at random. If missingness depends on other variables or on the value itself, dropping biases the sample, so impute (median or mode, group-wise, or model-based) and often add a was_missing indicator, since the fact of missingness can be predictive. For time series use ffill or interpolation. Fit imputation on the training data only.", ["Amount and mechanism (MCAR/MAR/MNAR)", "Impute + indicator", "Train-only statistics"]),
  iq("Why does df[df['x'] == np.nan] return no rows?", "NaN is not equal to anything, including itself, so the comparison is False everywhere. Use df[df['x'].isna()] (or notna()).", ["NaN != NaN", "Use isna / notna"]),
  iq("A numeric column was loaded as text with currency symbols, commas and some junk. How do you clean it?", "Strip whitespace, remove the symbols and thousands separators with str.replace(regex=True), convert with pd.to_numeric(errors='coerce'), then inspect the raw values that became NaN (value_counts) to decide whether they are truly missing or need another rule (e.g. '1.2k', parentheses for negatives). Fix it at load time if possible (na_values, thousands=',').", ["str.strip / replace(regex=True)", "to_numeric coerce", "Inspect what failed"]),
]);
trace("pd-cln-t1", "pd-clean", "pd", 1, 30, 's = pd.Series(["1", "2", "x", None])\nprint(pd.to_numeric(s, errors="coerce").sum())', 3,
  "'x' and None become NaN; 1 + 2 = 3.", "errors='coerce' turns failures into NaN, which sum skips.", "Expecting an error, or concatenating the strings.");
trace("pd-cln-t2", "pd-clean", "pd", 2, 60, 'df = pd.DataFrame({"k": [1, 1, 2, 2, 2], "v": [1, 1, 1, 2, 2]})\nprint(len(df.drop_duplicates()) * 10 + df.duplicated(subset="k", keep=False).sum())', 35,
  "Full-row duplicates: (1, 1) twice and (2, 2) twice, so 3 distinct rows remain → 30. With subset k and keep=False, every row whose k repeats is marked: all 5 → 35.", "keep=False marks every member of a duplicate group.", "Reading keep=False as marking only the extra copies (3 → 33).");
trace("pd-cln-t3", "pd-clean", "pd", 1, 45, "s = pd.Series([1.0, None, None, 4.0])\nprint(s.ffill().sum() + s.interpolate().sum())", 17,
  "ffill: 1, 1, 1, 4 → 7. interpolate (linear): 1, 2, 3, 4 → 10. Total 17.", "ffill repeats the last value; interpolate draws a straight line.", "Treating the gaps as 0 (sum 5 each).");
Card_("pd-cln-c1", "Text column → numbers", "pd.to_numeric(s, errors='coerce'), then check which raw values became NaN.", "pd-clean");
Card_("pd-cln-c2", "Keep the latest row per key", "sort_values(time).drop_duplicates(key, keep='last').", "pd-clean");

pdTopic("pd-groupby", "groupby: aggregate, transform, filter", "Split-apply-combine: summaries per group, group statistics on every row, and keeping or dropping whole groups.", `
**Split-apply-combine.** \`df.groupby("key")\` splits the rows into groups. You then:
- **aggregate**: one row per group;
- **transform**: one value per original row;
- **filter**: keep or drop whole groups.

**Aggregate.**
- \`df.groupby("dept")["salary"].mean()\`.
- Several at once with **named aggregation**: \`df.groupby("dept").agg(n=("id", "size"), avg=("salary", "mean"), top=("salary", "max"))\`.
- \`size\` counts rows; \`count\` counts non-missing values.
- The group keys become the index; \`as_index=False\` or \`.reset_index()\` keeps them as a column. Several keys give a MultiIndex.

**Transform.** \`df.groupby("g")["v"].transform("mean")\` returns a Series aligned with df. That makes it easy to:
- compute shares: \`df["share"] = df["v"] / df.groupby("g")["v"].transform("sum")\`;
- demean within a group;
- rank within a group with \`groupby(...).rank()\`;
- use per-group \`cumsum()\`, \`cumcount()\` and \`shift()\`.

**Filter.** \`df.groupby("g").filter(lambda d: len(d) >= 3)\` keeps whole groups. Often simpler and faster: \`df[df.groupby("g")["v"].transform("size") >= 3]\`.

**apply** runs arbitrary Python on each group. It's flexible but slow, so prefer built-in aggregations.

**Gotchas.**
- Rows with a missing key are **dropped** by default; \`dropna=False\` keeps them as their own group.
- Results are sorted by key; \`sort=False\` keeps the order of first appearance.
- Top n per group: sort, then \`groupby(...).head(n)\`.

**Worked example 1.** g = a, a, b, b, b and v = 1, NaN, 3, 4, 5. size → a 2, b 3; count → a 1, b 3; mean → a 1.0, b 4.0.

**Worked example 2.** v minus its group mean: a = (2, 4), mean 3 → −1, 1; b = (1, 2, 6), mean 3 → −2, −1, 3.

**Worked example 3.** Region totals: n = 30 + 70 = 100, so the row with 30 has share 0.3.

**Worked example 4.** Top 2 per group: \`df.sort_values(["g", "score"], ascending=[True, False]).groupby("g").head(2)\`.
`, [yt("txMdrV1Ut64", "Python Pandas Tutorial (Part 8): Grouping and aggregating", "Corey Schafer"), yt("qy0fDqoMJx8", "When should I use a \"groupby\" in pandas?", "Data School"), PD_DOC("groupby.html", "Group by: split-apply-combine"), PDSH("03.08-aggregation-and-grouping.html", "Aggregation and grouping")], "pd/groupby", [
  iq("What's the difference between agg, transform, filter and apply on a groupby?", "agg reduces each group to one row (sum, mean, named aggregations). transform returns an object the same length as the input, aligned with the original rows, so you can broadcast group statistics back (share of group, deviation from the group mean). filter returns the original rows of the groups that pass a condition. apply runs an arbitrary function per group and stitches the results together: most flexible, slowest.", ["agg: one row per group", "transform: same length as input", "filter: whole groups kept/dropped", "apply: flexible, slow"]),
  iq("What's the difference between size and count in a groupby, and what happens to rows whose key is NaN?", "size counts rows per group, count counts non-missing values in each column, so they differ when a column has NaN. Rows with a NaN key are excluded by default (dropna=True); pass dropna=False to keep them as their own group.", ["size: rows", "count: non-null values", "NaN keys dropped unless dropna=False"]),
  iq("How would you get the top 3 products by revenue within each category?", "Aggregate revenue per (category, product), sort by category and revenue descending, then groupby('category').head(3). For ties, decide explicitly: rank(method='dense' or 'min') <= 3 keeps ties, head keeps the first rows. Avoid apply(nlargest) on big data; it's slower and returns a MultiIndex.", ["Aggregate then sort", "groupby().head(n)", "Tie handling with rank"]),
]);
trace("pd-grp-t1", "pd-groupby", "pd", 2, 45, 'df = pd.DataFrame({"g": ["a", "a", "b", "b", "b"], "v": [1, None, 3, 4, 5]})\nr = df.groupby("g")["v"]\nprint(r.size().sum() * 10 + r.count().sum())', 54,
  "size counts rows: 2 + 3 = 5 → 50. count skips the NaN: 1 + 3 = 4. Total 54.", "size = rows; count = non-missing values.", "Treating size and count as the same (55).");
trace("pd-grp-t2", "pd-groupby", "pd", 2, 60, 'df = pd.DataFrame({"g": list("aabbb"), "v": [2, 4, 1, 2, 6]})\ndf["d"] = df["v"] - df.groupby("g")["v"].transform("mean")\nprint(df["d"].abs().max())', 3,
  "Group means: a = 3, b = 3. Deviations: −1, 1, −2, −1, 3. The largest absolute deviation is 3.", "transform broadcasts the group mean to every row.", "Subtracting groupby().mean() directly: it has one row per group, so it doesn't line up with df's rows and gives NaN.");
trace("pd-grp-t3", "pd-groupby", "pd", 2, 60, 'df = pd.DataFrame({"g": ["a", None, "a", None], "v": [1, 2, 3, 4]})\nprint(df.groupby("g")["v"].sum().sum() + df.groupby("g", dropna=False)["v"].sum().size)', 6,
  "By default the rows with a missing key are dropped: only a, 1 + 3 = 4. With dropna=False there are 2 groups (a and NaN). 4 + 2 = 6.", "groupby drops NaN keys unless dropna=False.", "Assuming the default keeps the NaN group (10 + 2 = 12).");
Card_("pd-grp-c1", "transform", "Same length as the input: broadcasts group statistics back onto rows.", "pd-groupby");
Card_("pd-grp-c2", "groupby and NaN keys", "Dropped by default (dropna=True); pass dropna=False to keep them.", "pd-groupby");

pdTopic("pd-merge", "Merging, joining and concatenating", "SQL-style joins in pandas, why row counts change, and stacking frames.", `
**merge** joins on key columns like SQL: \`pd.merge(left, right, on="id", how="inner")\`.
- \`how\` is one of inner, left, right, outer or cross.
- Keys with different names: \`left_on\` / \`right_on\`.
- Joining on the index: \`left_index=True\`, or \`df.join(other)\`.

**Row counts.** Each left row matches every right row with the same key. If a key appears m times on the left and n times on the right, it contributes m·n rows (the many-to-many explosion). A left join keeps every left row, but it can still **add** rows when the right side has duplicate keys.

**Guards.**
- \`validate="many_to_one"\` (or "one_to_one") raises a \`MergeError\` if the right keys aren't unique.
- \`indicator=True\` adds a \`_merge\` column (both / left_only / right_only). That's the basis of an anti-join: \`m[m["_merge"] == "left_only"]\`.
- Compare \`len\` before and after every join.

**Pitfalls.**
- Key dtypes must match: the int 1 never matches the string "1".
- Overlapping column names get the suffixes \`_x\` and \`_y\`; set your own with \`suffixes=("_l", "_r")\`.
- Unlike SQL, pandas matches NaN keys with each other.

**concat** stacks frames.
- \`pd.concat([a, b])\` stacks rows. Columns are unioned (missing → NaN), and each frame keeps its index, so labels repeat unless you pass \`ignore_index=True\`.
- \`axis=1\` places frames side by side, aligned on the index.
- \`keys=[...]\` (or passing a dict) records which piece each row came from.

**Worked example 1.** Left keys [1, 1, 2, 3], right keys [1, 1, 1, 2, 4]. Inner join: 2·3 + 1·1 = 7 rows. Left join: 7 plus 1 for key 3 = 8. Outer join: 9.

**Worked example 2.** Customers with no orders: either \`customers[~customers.id.isin(orders.customer_id)]\`, or a left merge with \`indicator=True\` keeping \`left_only\`.

**Worked example 3.** Concatenating x: [1, 2] with (x: [3], y: [4]) gives 3 rows; y is NaN in the first two, and the index is 0, 1, 0.

**Worked example 4.** 1,000 orders left-merged with a customer table in which one id appears twice give more than 1,000 rows. \`validate="many_to_one"\` would have raised instead.
`, [yt("iYWKfUOtGaw", "How do I merge DataFrames in pandas?", "Data School"), PD_DOC("merging.html", "Merge, join, concatenate and compare"), PDSH("03.07-merge-and-join.html", "Combining datasets: merge and join")], "pd/merge", [
  iq("A left join returned more rows than the left table. Why, and how do you fix it?", "The right table has duplicate keys, so each matching left row is repeated once per match. Check right[key].duplicated().sum(); decide whether to deduplicate (latest record, aggregate first) or whether the grain is genuinely many-to-many. Add validate='many_to_one' so it fails loudly next time, and compare row counts before and after joins.", ["Duplicate right keys", "Deduplicate or aggregate first", "validate= and row-count checks"]),
  iq("How do you find rows in A that have no match in B in pandas?", "An anti-join: A[~A['key'].isin(B['key'])] for a single key, or A.merge(B[keys].drop_duplicates(), how='left', indicator=True) and keep _merge == 'left_only' for composite keys, then drop the helper column.", ["isin with ~", "merge indicator=True, left_only", "Drop helper columns"]),
  iq("When do you use merge, join and concat?", "merge for SQL-style joins on columns (any how, different key names, validation). join is a convenience for joining on the index (or a column to the other frame's index). concat stacks frames along rows (same columns, e.g. monthly files) or columns (aligned on the index); it doesn't match keys.", ["merge: key columns", "join: index", "concat: stacking"]),
]);
trace("pd-mrg-t1", "pd-merge", "pd", 2, 60, 'a = pd.DataFrame({"k": [1, 1, 2, 3]})\nb = pd.DataFrame({"k": [1, 1, 1, 2, 4], "v": range(5)})\nprint(len(a.merge(b, on="k", how="left")))', 8,
  "Key 1: 2 left × 3 right = 6 rows. Key 2: 1 × 1 = 1. Key 3 has no match but a left join keeps it: 1. Total 8.", "m left × n right rows per key; unmatched left rows add 1.", "Assuming a left join always returns len(left) = 4 rows.");
trace("pd-mrg-t2", "pd-merge", "pd", 2, 45, 'a = pd.DataFrame({"x": [1, 2]})\nb = pd.DataFrame({"x": [3], "y": [4]})\nc = pd.concat([a, b])\nprint(c.isna().sum().sum() + c.index.max())', 3,
  "Column y is missing for a's two rows: 2 NaN. The indexes are kept, 0, 1, 0, so the maximum is 1. Total 3.", "concat unions columns and keeps each frame's index.", "Expecting a fresh index 0, 1, 2 (answer 4).");
trace("pd-mrg-t3", "pd-merge", "pd", 2, 60, 'left = pd.DataFrame({"id": [1, 2, 3, 4]})\nright = pd.DataFrame({"id": [2, 4, 4]})\nm = left.merge(right, on="id", how="left", indicator=True)\nprint((m["_merge"] == "left_only").sum() * 10 + len(m))', 25,
  "ids 1 and 3 are left_only (2 → 20). Rows: 1, 2, 3, then 4 twice because right has two 4s → 5. Total 25.", "Duplicate right keys add rows even in a left join.", "Counting 4 rows (24).");
Card_("pd-mrg-c1", "Key appears m times left, n times right", "Contributes m·n rows to the merge.", "pd-merge");
Card_("pd-mrg-c2", "Anti-join in pandas", "A[~A.key.isin(B.key)], or merge(how='left', indicator=True) → _merge == 'left_only'.", "pd-merge");

pdTopic("pd-reshape", "Reshaping: pivot, melt, stack and crosstab", "Moving between long and wide formats and building summary tables.", `
**Long vs wide.** Long (tidy) data has one row per observation, e.g. (id, quarter, sales). Wide data has one row per id and a column per quarter. groupby and plotting libraries want long data; reports and matrices want wide.

**Wide → long.**
- \`df.melt(id_vars=["id"], value_vars=[...], var_name="quarter", value_name="sales")\`. The result has (number of ids) × (number of melted columns) rows.
- \`pd.wide_to_long\` handles stub names like sales_2023.
- \`stack()\` moves columns into the index.

**Long → wide.**
- \`df.pivot(index="id", columns="quarter", values="sales")\` needs unique (index, column) pairs; duplicates raise ValueError.
- \`pivot_table\` aggregates duplicates instead. Its \`aggfunc\` defaults to the **mean**, so pass \`aggfunc="sum"\` for totals; \`fill_value=0\` and \`margins=True\` add zeros and totals.
- \`unstack()\` moves an index level into the columns.

**Counts.** \`pd.crosstab(df.a, df.b)\` counts combinations. \`normalize="index"\` gives row shares (each row sums to 1); \`"columns"\` and \`"all"\` normalise by column or by the grand total.

**MultiIndex.** A groupby on two keys gives a two-level index. \`unstack()\` turns it into a table, \`reset_index()\` flattens it into columns, and you select with \`.loc[("a", "x")]\` or \`xs\`.

**Worked example 1.** Rows (a, x, 1), (a, x, 3), (a, y, 5), (b, x, 7) through \`pivot_table\` give a: x 2, y 5; b: x 7, y NaN. Mean, not sum.

**Worked example 2.** 3 ids × columns q1–q3, melted, give 9 rows and 3 columns (id, quarter, sales).

**Worked example 3.** Crosstab with \`normalize="index"\`: group a has y = 1, 1, 1, 0, so its row is 0.25 / 0.75.

**Worked example 4.** \`df.groupby(["region", "month"])["amt"].sum().unstack(fill_value=0)\` is the same table as \`pivot_table(index="region", columns="month", values="amt", aggfunc="sum", fill_value=0)\`.
`, [yt("tcRGa2soc-c", "How do I use the MultiIndex in pandas?", "Data School"), PD_DOC("reshaping.html", "Reshaping and pivot tables"), PDSH("03.09-pivot-tables.html", "Pivot tables")], "pd/reshape", [
  iq("What's the difference between pivot and pivot_table?", "pivot only reshapes: each (index, column) pair must be unique or it raises. pivot_table groups and aggregates duplicates (aggfunc defaults to mean), and supports fill_value, margins and several aggregations. Use pivot for already-unique long data; pivot_table for summaries.", ["pivot: reshape, unique pairs", "pivot_table: aggregates (mean default)", "fill_value / margins"]),
  iq("What is tidy (long) data and when would you melt a DataFrame?", "Tidy data has one variable per column and one observation per row. Melt when values of a variable are spread across column names (sales_2023, sales_2024, or one column per city), so that you can groupby, filter, plot with hue/facets or model with that variable as a column.", ["One observation per row", "Variable hidden in column names", "Enables groupby / seaborn hue"]),
  iq("How would you build a monthly retention (cohort) table in pandas?", "Compute each user's cohort (month of first activity) with groupby('user')['month'].transform('min'), and the period index = months since cohort. Count unique users per (cohort, period) with groupby(...)['user'].nunique(), unstack period into columns, then divide every row by its period-0 count. Check that periods are complete months and that the latest cohorts have fewer observable periods.", ["Cohort = first month (transform min)", "nunique per cohort × period, unstack", "Divide by period 0"]),
]);
trace("pd-rsh-t1", "pd-reshape", "pd", 2, 60, 'df = pd.DataFrame({"r": ["a", "a", "a", "b"], "c": ["x", "x", "y", "x"], "v": [1, 3, 5, 7]})\nt = df.pivot_table(index="r", columns="c", values="v")\nprint(t.sum().sum())', 14,
  "pivot_table averages duplicates: (a, x) = mean(1, 3) = 2, (a, y) = 5, (b, x) = 7, (b, y) = NaN. Sum = 14.", "pivot_table's default aggfunc is mean.", "Assuming it sums (1 + 3 + 5 + 7 = 16).");
trace("pd-rsh-t2", "pd-reshape", "pd", 1, 45, 'w = pd.DataFrame({"id": [1, 2, 3], "q1": [5, 6, 7], "q2": [1, 2, 3], "q3": [0, 0, 1]})\nm = w.melt(id_vars="id", var_name="quarter", value_name="sales")\nprint(m.shape[0] * 10 + m.shape[1])', 93,
  "3 ids × 3 melted columns = 9 rows; columns id, quarter, sales = 3. 90 + 3 = 93.", "melt rows = rows × value columns.", "Counting the q-columns as staying (shape (3, 4)).");
trace("pd-rsh-t3", "pd-reshape", "pd", 2, 60, 'df = pd.DataFrame({"g": list("aaaabb"), "y": [1, 1, 1, 0, 0, 1]})\nct = pd.crosstab(df["g"], df["y"], normalize="index")\nprint(ct.loc["a", 1] + ct.loc["b", 0])', 1.25,
  "Row shares: a has three 1s out of 4 → 0.75; b has one 0 out of 2 → 0.5. Total 1.25.", "normalize='index' divides each row by its own total.", "Normalising by the grand total instead: 3/6 + 1/6 ≈ 0.67.");
Card_("pd-rsh-c1", "pivot_table default aggfunc", "mean: pass aggfunc='sum' for totals.", "pd-reshape");
Card_("pd-rsh-c2", "melt row count", "Rows × number of value columns.", "pd-reshape");

pdTopic("pd-time", "Dates, time series and windows", "Parsing dates, the .dt accessor, resampling, rolling windows and per-entity lags.", `
**Parsing.** \`pd.to_datetime(s, format="%Y-%m-%d", errors="coerce")\`. Giving \`format\` is faster and removes ambiguity; use \`dayfirst=True\` when 03/04 means 3 April. In \`read_csv\`, use \`parse_dates\`.

**The .dt accessor.**
- Parts: \`.dt.year\`, \`.month\`, \`.day\`, \`.dayofweek\` (Monday = 0), \`.day_name()\`, \`.hour\`.
- Truncation: \`.dt.normalize()\` (midnight) and \`.dt.to_period("M")\` (month buckets).
- Differences are Timedeltas: \`(b - a).dt.days\`. Add \`pd.Timedelta(days=7)\`, or \`pd.DateOffset(months=1)\` for calendar months.

**A DatetimeIndex** (\`df.set_index("ts").sort_index()\`) allows partial-string selection such as \`df.loc["2024-03"]\`, and resampling.

**resample** is a groupby on time buckets.
- \`s.resample("D").sum()\`: every day in the range appears, and empty days get a sum of 0 (a mean gives NaN).
- \`"W"\`: weeks ending on Sunday, labelled by that Sunday.
- \`"MS"\` / \`"ME"\`: months labelled by their start / end.
- \`asfreq("D")\` reindexes to daily without aggregating.

**Lags and windows.**
- \`shift(1)\` (the previous value), \`diff()\`, \`pct_change()\`.
- \`rolling(3).mean()\`: the first 2 values are NaN unless you pass \`min_periods=1\`.
- \`rolling("7D")\` uses a time window on a DatetimeIndex; \`expanding().mean()\` is the running mean.
- Per entity, use \`df.groupby("user")["ts"].diff()\`; without the groupby, lags leak across users.
- Always sort by time first.

**Worked example 1.** 2024-02-28 to 2024-03-01 is 2 days (2024 is a leap year). 28 Feb 2024 was a Wednesday, so dayofweek is 2.

**Worked example 2.** \`rolling(3).mean()\` of 1–5 is NaN, NaN, 2, 3, 4.

**Worked example 3.** Daily values 1–10 starting Monday 1 Jan 2024, \`resample("W").sum()\` → 28 (labelled 7 Jan) and 27 (labelled 14 Jan).

**Worked example 4.** Week-over-week growth: \`weekly.pct_change()\` = (this week − last week) / last week.
`, [yt("UFuo7EHI8zc", "Python Pandas Tutorial (Part 10): Working with dates and time series data", "Corey Schafer"), yt("yCgJGsg0Xa4", "How do I work with dates and times in pandas?", "Data School"), PD_DOC("timeseries.html", "Time series / date functionality"), PD_DOC("window.html", "Windowing operations")], "pd/time", [
  iq("How do you compute a 7-day rolling average of daily sales when some days have no rows?", "First make the series complete: set a DatetimeIndex and resample('D').sum() (missing days become 0; decide whether 0 or NaN is right for the business). Then rolling(7).mean(), with min_periods if the first days should count. Alternatively rolling('7D') on the DatetimeIndex uses a time-based window, which handles gaps without resampling, but then 'average per day' and 'average per row' differ.", ["Fill the calendar (resample)", "rolling(7) / min_periods", "rolling('7D') and 0 vs NaN"]),
  iq("For each user, how do you compute the time since their previous event?", "Sort by user and timestamp (or just timestamp), then df.groupby('user')['ts'].diff(), which gives a Timedelta per row, NaT for each user's first event. Convert with .dt.total_seconds() or .dt.days. Without the groupby, diff measures from another user's event; without sorting, gaps can be negative.", ["Sort by time", "groupby(user).diff()", "NaT for first event"]),
  iq("What's the difference between resample and rolling?", "resample changes the frequency: it buckets timestamps into periods (days, weeks, months) and aggregates, giving one row per period. rolling keeps the original rows and computes a statistic over a moving window ending at each row (fixed number of rows or a time span).", ["resample: buckets, new frequency", "rolling: moving window per row"]),
]);
trace("pd-tim-t1", "pd-time", "pd", 2, 60, 'd = pd.to_datetime(pd.Series(["2024-02-28", "2024-03-01"]))\nprint((d.iloc[1] - d.iloc[0]).days + d.dt.dayofweek.iloc[0])', 4,
  "2024 is a leap year, so 28 Feb → 1 Mar is 2 days. 28 Feb 2024 was a Wednesday: dayofweek 2 (Monday = 0). Total 4.", "Leap years; dayofweek counts from Monday = 0.", "Forgetting 29 Feb (1 day), or counting Monday as 1.");
trace("pd-tim-t2", "pd-time", "pd", 1, 30, "s = pd.Series([1, 2, 3, 4, 5])\nprint(s.rolling(3).mean().sum())", 9,
  "The first two windows are incomplete → NaN. Then 2, 3, 4 → 9.", "rolling(n) gives NaN until n values exist (default min_periods = n).", "Averaging partial windows (1, 1.5, 2, 3, 4 = 11.5).");
trace("pd-tim-t3", "pd-time", "pd", 3, 75, 's = pd.Series(range(1, 11), index=pd.date_range("2024-01-01", periods=10, freq="D"))\nr = s.resample("W").sum()\nprint(len(r) * 100 + r.iloc[0])', 228,
  "'W' means weeks ending on Sunday. 1 Jan 2024 is a Monday, so the first week is 1–7 Jan (values 1–7, sum 28) and the second is 8–14 Jan (8 + 9 + 10 = 27). 2 rows → 200 + 28 = 228.", "'W' = W-SUN: weeks end on Sunday and are labelled by it.", "Assuming 7-day blocks start at the first date regardless of weekday, or that weeks start on Sunday.");
Card_("pd-tim-c1", "resample vs rolling", "resample: new buckets, one row per period. rolling: same rows, window ending at each row.", "pd-time");
Card_("pd-tim-c2", "Per-user lag", "Sort by time, then groupby(user)[col].shift() / diff().", "pd-time");

pdTopic("pd-apply", "apply, vectorisation, binning and method chaining", "Writing fast conditional columns, binning continuous values, and readable multi-step transformations.", `
**The speed ladder, fastest first.**
1. Vectorised column arithmetic and built-ins: \`df.a * df.b\`, \`.sum()\`, \`.str\`, \`.dt\`.
2. \`Series.map(dict)\`.
3. \`Series.apply(func)\`.
4. \`df.apply(func, axis=1)\`.
5. \`iterrows\`.

\`apply(axis=1)\` calls Python once per row: fine for 10k rows, painful for 10M.

**Conditional columns.**
- Two cases: \`np.where(cond, a, b)\`.
- Several: \`np.select([c1, c2], [v1, v2], default=v3)\`. The first true condition wins, so order thresholds from the top, and put the missing-value check first.
- \`Series.clip(lo, hi)\` for capping.

**map vs replace.** \`s.map({"a": 1, "b": 2})\` turns values that aren't in the dict into NaN; \`s.replace({...})\` leaves them unchanged. \`map\` also accepts a Series or a function.

**Binning.**
- \`pd.cut(x, bins=[0, 18, 35, 60, np.inf], labels=[...])\` uses right-closed intervals (a, b] by default, so the leftmost edge itself is excluded. Use \`right=False\` for [a, b), or \`include_lowest=True\`.
- \`pd.qcut(x, 4)\` makes bins with equal counts (quartiles); \`labels=False\` returns the bin numbers 0 to q − 1.
- \`value_counts(sort=False)\` on the result keeps the bins in order, including empty ones.

**Method chaining.** For example: \`(df.dropna(subset=["amount"]).assign(net=lambda d: d.amount * (1 - d.discount)).groupby("cat")["net"].sum().sort_values(ascending=False))\`. \`assign\` with a lambda sees the intermediate frame; \`pipe(f)\` inserts your own function.

**Memory.**
- \`df.memory_usage(deep=True)\` shows what each column costs.
- Low-cardinality strings → \`category\`.
- Downcast with \`pd.to_numeric(s, downcast="integer")\`.
- Read only the columns you need (\`usecols\`).

**Worked example 1.** \`np.select([s.isna(), s >= 1000, s >= 200], ["unknown", "high", "mid"], default="low")\`: 1000 → high, 999.9 → mid, NaN → unknown.

**Worked example 2.** \`pd.cut([0, 5, 10, 15], bins=[0, 5, 10, 15])\`: 0 is NaN (it's not in (0, 5]), 5 → (0, 5], 10 → (5, 10], 15 → (10, 15].

**Worked example 3.** \`pd.qcut(range(1, 9), 4, labels=False)\` → 0, 0, 1, 1, 2, 2, 3, 3.

**Worked example 4.** \`pd.Series(["a", "b", "c"]).map({"a": 1, "b": 2})\` → 1, 2, NaN; with \`.replace\` → 1, 2, "c".
`, [yt("P_q0tkYqvSk", "How do I apply a function to a pandas Series or DataFrame?", "Data School"), yt("V0AWyzVMf54", "How do I change the data type of a pandas Series?", "Data School"), PD_DOC("enhancingperf.html", "Enhancing performance"), R("pandas docs: pandas.cut", "https://pandas.pydata.org/docs/reference/api/pandas.cut.html")], "pd/apply", [
  iq("Why is df.apply(f, axis=1) slow, and what do you use instead?", "It calls a Python function once per row and builds a Series for each, so it runs at interpreter speed. Replace it with column-wise vectorised expressions (arithmetic on whole columns, np.where / np.select for conditions, .str and .dt methods, map for lookups, merge for table lookups, groupby + transform for group logic). Keep apply for genuinely row-specific logic on small data.", ["Python call per row", "Vectorised columns, np.select, map, merge", "When apply is acceptable"]),
  iq("What's the difference between pd.cut and pd.qcut?", "cut uses fixed bin edges (given or equal-width), so bins can hold very different counts; intervals are right-closed by default. qcut uses quantiles, so each bin holds about the same number of rows, with data-dependent edges (and duplicate edges if many ties: duplicates='drop').", ["cut: fixed edges", "qcut: equal counts by quantile", "Right-closed default / ties"]),
  iq("How would you reduce the memory of a large DataFrame?", "Measure with memory_usage(deep=True). Convert repeated strings to category, downcast numeric columns (int64 → int32/int8, float64 → float32 where precision allows), parse dates as datetime64, drop unneeded columns or read only usecols, and process in chunks (read_csv(chunksize=...)) or with a columnar format such as Parquet.", ["Measure first", "category / downcasting", "usecols / chunks / Parquet"]),
]);
trace("pd-app-t1", "pd-apply", "pd", 1, 45, 's = pd.Series(["a", "b", "c"])\nprint(s.map({"a": 1, "b": 2}).isna().sum() + s.replace({"a": 1, "b": 2}).tolist().count("c"))', 2,
  "map turns the unmatched 'c' into NaN (1 missing). replace leaves 'c' as it is (it appears once). Total 2.", "map: unmatched → NaN; replace: unmatched unchanged.", "Thinking map leaves unmatched values alone (0 + 1 = 1).");
trace("pd-app-t2", "pd-apply", "pd", 2, 60, "x = pd.Series([0, 5, 10, 15])\nb = pd.cut(x, bins=[0, 5, 10, 15])\nprint(b.isna().sum() * 10 + b.value_counts(sort=False).iloc[0])", 11,
  "Intervals are (0, 5], (5, 10], (10, 15]: 0 falls outside → NaN (10). The first bin holds just 5 → 1. Total 11.", "cut is right-closed: the lowest edge is excluded.", "Putting 0 in the first bin (answer 2).");
trace("pd-app-t3", "pd-apply", "pd", 1, 45, "q = pd.qcut(pd.Series(range(1, 9)), 4, labels=False)\nprint(q.sum() + q.iloc[-1])", 15,
  "Quartile bins of 1–8 hold two values each: 0, 0, 1, 1, 2, 2, 3, 3. Sum 12, plus the last bin number 3 = 15.", "qcut gives equal-count bins numbered from 0.", "Numbering bins from 1 (sum 20).");
Card_("pd-app-c1", "pd.cut default intervals", "(a, b]: right-closed, so the lowest edge is excluded unless include_lowest=True or right=False.", "pd-apply");
Card_("pd-app-c2", "map vs replace", "map: unmatched values → NaN. replace: unmatched values stay.", "pd-apply");

// ───────────────────────── Plotting ─────────────────────────
vizTopic("viz-mpl", "matplotlib: figures, axes and the OO API", "How matplotlib is organised, and writing plotting code with explicit Figure and Axes objects.", `
**Two objects.** A **Figure** is the whole image; an **Axes** is one plot inside it, with its own x and y axis. \`fig, ax = plt.subplots()\` creates both. \`fig, axes = plt.subplots(2, 3, figsize=(12, 6), sharex=True)\` gives a 2 × 3 NumPy array of Axes; loop over \`axes.flat\`. \`squeeze=False\` keeps it 2-D even for 1 × 1.

**OO API vs pyplot.**
- \`plt.plot\` and \`plt.title\` act on "the current axes". That's fine in a quick notebook cell, but fragile inside functions and with several subplots.
- The object-oriented style calls methods on an explicit Axes: \`ax.plot\`, \`ax.set_title\`, \`ax.set(xlabel=..., ylabel=..., xlim=...)\`.
- Write plotting functions that take an \`ax\` argument (or create one) and return it, so they compose into grids.

**Plot types.** \`ax.plot\` (lines, x in order), \`ax.scatter\`, \`ax.bar\` / \`ax.barh\`, \`ax.hist(x, bins=...)\`, \`ax.boxplot\`, \`ax.imshow\`, \`ax.fill_between\`, \`ax.axhline\` / \`ax.axvline\`.

**What's on an Axes.** Everything drawn is an Artist, and you can inspect it:
- \`ax.lines\`: the Line2D objects from \`plot\`;
- \`ax.collections\`: \`scatter\` and \`fill_between\`;
- \`ax.patches\`: bars and histogram rectangles;
- \`ax.texts\`: text, annotations and bar labels;
- \`ax.containers\`: the BarContainer from each \`bar\` call.

**Labels and annotations.**
- Pass \`label=\` and call \`ax.legend()\`.
- \`ax.bar_label(container)\` writes the values on bars.
- \`ax.annotate("peak", xy=(x, y), xytext=...)\`.
- \`ax.twinx()\` adds a second y-axis that shares x; use it sparingly.

**Finishing.**
- \`fig.tight_layout()\` (or \`constrained_layout=True\` when creating the figure) stops labels from overlapping.
- \`fig.savefig("out.png", dpi=200, bbox_inches="tight")\`.
- Call \`plt.close(fig)\` in loops so figures don't pile up in memory.

**Worked example 1.** \`plt.subplots(2, 3)\` → \`axes.shape\` = (2, 3) and \`len(fig.axes)\` = 6.

**Worked example 2.** Two \`ax.plot\` calls and one \`ax.scatter\` → 2 lines and 1 collection.

**Worked example 3.** \`ax.bar\` with 3 categories → 3 patches; then \`ax.twinx()\` → \`fig.axes\` has 2 Axes.

**Worked example 4.** Hide unused panels in a grid: \`for ax in axes.flat[n:]: ax.set_visible(False)\` (or \`fig.delaxes(ax)\`).
`, [yt("UO98lJQ3QGI", "Matplotlib Tutorial (Part 1): Creating and customizing our first plots", "Corey Schafer"), yt("XFZRVnP-MTU", "Matplotlib Tutorial (Part 10): Subplots", "Corey Schafer"), yt("3Xc3CA655Y4", "Matplotlib crash course", "freeCodeCamp"), R("matplotlib docs: Quick start guide", "https://matplotlib.org/stable/users/explain/quick_start.html"), R("matplotlib docs: Arranging multiple Axes in a Figure", "https://matplotlib.org/stable/users/explain/axes/arranging_axes.html")], "viz/mpl", [
  iq("What's the difference between a Figure and an Axes, and why prefer the object-oriented API?", "The Figure is the canvas (size, dpi, saving); an Axes is one plotting area with its own axes, data and labels; a figure can hold many. pyplot functions act on an implicit 'current' axes, which breaks down with several subplots or inside functions. Calling methods on explicit ax objects makes code reusable (functions take and return ax), testable and unambiguous.", ["Figure = canvas, Axes = plot", "pyplot uses hidden current axes", "Explicit ax: reusable, composable"]),
  iq("How would you plot one chart per category so they're easy to compare?", "Small multiples: plt.subplots(nrows, ncols, sharex=True, sharey=True), loop over zip(axes.flat, groups), one panel per group with its title, hide unused panels, tight_layout. Shared axes are the point: without them, each panel autoscales and visual comparison is misleading. seaborn's FacetGrid / relplot(col=...) does the same in one call.", ["subplots grid", "sharex / sharey", "Hide extras; FacetGrid alternative"]),
  iq("Two series with very different scales need to go on one chart. What are your options?", "Separate panels sharing the x-axis (usually best); index both to 100 at a base date to compare growth; a log scale if the question is about relative change; or a secondary axis (twinx) as a last resort, labelled clearly, because the alignment of the two scales is arbitrary and can suggest false crossings or correlations.", ["Stacked panels with shared x", "Index to 100 / log scale", "twinx risks"]),
]);
trace("viz-mpl-t1", "viz-mpl", "mpl", 1, 30, "fig, axes = plt.subplots(2, 3)\nprint(axes.shape[0] * 10 + len(fig.axes))", 26,
  "axes is a 2 × 3 array (shape[0] = 2 → 20) and the figure holds 6 Axes: 26.", "subplots(r, c) returns an r × c array of Axes.", "Thinking axes is a flat list of 6 (shape[0] = 6).");
trace("viz-mpl-t2", "viz-mpl", "mpl", 1, 45, 'fig, ax = plt.subplots()\nax.plot([1, 2], [3, 4])\nax.plot([1, 2], [4, 3], label="b")\nax.scatter([1], [1])\nprint(len(ax.lines) * 10 + len(ax.collections))', 21,
  "Each plot call adds one Line2D (2 lines → 20); scatter adds one PathCollection (1). Total 21.", "plot → ax.lines; scatter → ax.collections.", "Counting the scatter as a line (30).");
trace("viz-mpl-t3", "viz-mpl", "mpl", 1, 45, 'fig, ax = plt.subplots()\nax.bar(["a", "b", "c"], [3, 5, 2])\nax2 = ax.twinx()\nprint(len(ax.patches) + len(fig.axes))', 5,
  "Three bars are three Rectangle patches; twinx adds a second Axes to the figure. 3 + 2 = 5.", "Bars live in ax.patches; twinx creates a new Axes.", "Thinking twinx doesn't add an Axes (4).");
Card_("viz-mpl-c1", "fig, axes = plt.subplots(2, 3)", "axes is a 2 × 3 array of Axes; loop with axes.flat.", "viz-mpl");
Card_("viz-mpl-c2", "Where artists live", "ax.lines (plot), ax.collections (scatter), ax.patches (bars, hist), ax.texts (text, bar labels).", "viz-mpl");

vizTopic("viz-choose", "Choosing the right chart", "Matching the chart to the question, and the rules that keep charts honest.", `
**Start from the question.**
- **Compare categories** → a bar chart (sorted; horizontal if the labels are long) or a dot plot.
- **Change over time** → a line chart, with time on x in order.
- **Distribution of one variable** → a histogram, box plot, violin or ECDF. For several groups, box or violin plots side by side.
- **Relationship between two numeric variables** → a scatter plot; use transparency or hexbin when points overlap, and add a trend line if it helps.
- **Part of a whole** → stacked or 100% stacked bars. Use a pie only for 2–3 parts.
- **Many groups over time** → small multiples (one panel per group, shared axes) or a heatmap.

**Encoding rules.**
- People judge position most accurately, then length, then angle and area, then colour intensity. That's why bars and dots beat pies and bubbles.
- Bars encode value by **length**, so a bar chart's value axis must start at zero. Line charts encode change by slope and can zoom in.
- Avoid 3-D effects and dual y-axes: the apparent crossing point of two scales is arbitrary.

**Lie factor** (Tufte) = (size of the effect shown in the graphic) ÷ (size of the effect in the data), where an effect is a relative change. Take bars of 50 and 60 on an axis starting at 40. The visible lengths are 10 and 20, a 100% visual increase for a 20% real one, so the lie factor is 5. An honest chart has a lie factor close to 1.

**Scales and colour.**
- Use a log scale when values span orders of magnitude or change multiplicatively.
- Palettes: sequential for ordered values, diverging (centred on a meaningful midpoint such as 0) for signed values, qualitative for categories.
- Avoid contrasts that rely on red and green alone.
- Label lines directly instead of relying on a legend.

**Histogram bins.** Too few bins hide the shape; too many show noise.
- Sturges: k = ⌈log₂ n⌉ + 1. Fine for small, roughly normal data.
- Freedman–Diaconis: bin width h = 2 · IQR · n^(−1/3). Robust to outliers.
- Try a couple of settings before trusting the shape.

**Worked example 1.** The lie-factor example above: (20 − 10)/10 = 100% shown vs (60 − 50)/50 = 20% real → 5.

**Worked example 2.** Freedman–Diaconis with IQR 20 and n = 1000: h = 40 / 10 = 4. Over a range of 0–100 that's 25 bins.

**Worked example 3.** Sturges for 100 points: ⌈log₂ 100⌉ + 1 = 7 + 1 = 8 bins.

**Worked example 4.** Revenue of 5 products in two years: grouped bars or a slope chart to compare levels, or 100% stacked bars to compare the mix.
`, [yt("8EMW7io4rSI", "Storytelling with Data", "Cole Nussbaumer Knaflic, Talks at Google"), yt("XDv6T4a0RNc", "Matplotlib Tutorial (Part 6): Histograms", "Corey Schafer"), R("Claus Wilke: Fundamentals of Data Visualization (free online book)", "https://clauswilke.com/dataviz/"), R("From Data to Viz: chart decision tree", "https://www.data-to-viz.com/")], "viz/choose", [
  iq("How would you show how a metric's distribution differs across 6 customer segments?", "Box plots or violins side by side (sorted by median), or an ECDF per segment on one chart, or small-multiple histograms with a shared x-axis. Not a bar chart of means, which hides spread, skew and outliers. Show the sample size per segment, and use a log scale if the metric is heavily skewed (spend, latency).", ["Box/violin/ECDF/small multiples", "Not bars of means", "n per group; log scale if skewed"]),
  iq("What makes a chart misleading? Give examples.", "Truncated value axes on bar charts (lie factor > 1), dual y-axes with arbitrary scaling, 3-D or area/bubble encodings where people misjudge size, cherry-picked time windows, uneven time intervals on an evenly spaced axis, pies with many similar slices, inconsistent scales across panels, and missing context (no baseline, no n, no uncertainty).", ["Truncated bars / lie factor", "Dual axes, 3-D, area", "Cherry-picked windows, uneven scales"]),
  iq("When would you use a log scale?", "When values span several orders of magnitude (so small values aren't crushed), when the process is multiplicative (growth rates: equal ratios become equal distances, exponential growth becomes a straight line), or for heavily right-skewed distributions. Label it clearly; it can't show zero or negative values.", ["Wide range", "Multiplicative / growth", "Skewed data; no zero/negatives"]),
]);
Item({
  id: "viz-cho-i1", topic: "viz-choose", d: 2, secs: 75,
  prompt: "A bar chart shows sales of 50 (region A) and 60 (region B), but its y-axis starts at 40. Using Tufte's lie factor (relative change shown in the graphic ÷ relative change in the data), what is the lie factor of the A-to-B comparison?",
  answer: 5, tol: 0.01,
  explain: "Visible bar lengths: 50 − 40 = 10 and 60 − 40 = 20, a 100% increase on screen. The data increase is (60 − 50) / 50 = 20%. Lie factor = 1.00 / 0.20 = 5.",
  fast: "Measure the bars from the axis start, not from zero.", trap: "Dividing the two height ratios (2 / 1.2 ≈ 1.67) instead of the two relative changes.",
  src: "Practice: computed; answer recomputed in Python (Nov 2026)",
  check: { py: "shown = ((60 - 40) - (50 - 40)) / (50 - 40)\nreal = (60 - 50) / 50\nanswer = shown / real" },
});
Item({
  id: "viz-cho-i2", topic: "viz-choose", d: 2, secs: 75,
  prompt: "A variable observed n = 1000 times has an interquartile range of 20 and values from 0 to 100. Using the Freedman–Diaconis rule (bin width = 2 · IQR · n^(−1/3)), how many bins cover the range?",
  answer: 25, tol: 0,
  explain: "Width = 2 × 20 / 1000^(1/3) = 40 / 10 = 4. Bins = 100 / 4 = 25.",
  fast: "n^(1/3) = 10, so the width is 2 · IQR / 10.", trap: "Using n^(−1/2) or forgetting the factor 2 (giving 50 bins).",
  src: "Practice: computed; answer recomputed in Python (Nov 2026)",
  check: { py: "import math\nimport numpy as np\nh = 2 * 20 / float(np.cbrt(1000))\nanswer = float(math.ceil(round(100 / h, 9)))", packages: ["numpy"] },
});
trace("viz-cho-t3", "viz-choose", "np", 2, 60, 'print(len(np.histogram_bin_edges(np.arange(100), bins="sturges")) - 1)', 8,
  "Sturges: ⌈log₂ 100⌉ + 1 = ⌈6.64⌉ + 1 = 8 bins; there is one more edge than bins, hence the − 1.", "Sturges ≈ log₂ n + 1, rounded up.", "Using log₁₀ (3 bins), or forgetting that edges = bins + 1 (answer 9).");
Card_("viz-cho-c1", "Bar chart value axis", "Must start at zero (length encodes value); line charts may zoom in.", "viz-choose");
Card_("viz-cho-c2", "Lie factor", "Relative change shown ÷ relative change in the data; 1 is honest.", "viz-choose");

vizTopic("viz-seaborn", "seaborn: statistical plots from DataFrames", "Plotting straight from long DataFrames, axes-level vs figure-level functions, and what seaborn computes for you.", `
**What it adds.** seaborn is built on matplotlib. You pass a DataFrame plus column names (\`data=df, x="day", y="total", hue="sex"\`); it does the grouping and statistics and labels the axes and legend. It works best with **long** (tidy) data, so melt wide frames first.

**Axes-level vs figure-level.**
- **Axes-level** functions draw on one matplotlib Axes and accept \`ax=\`: \`scatterplot\`, \`lineplot\`, \`histplot\`, \`kdeplot\`, \`ecdfplot\`, \`boxplot\`, \`violinplot\`, \`barplot\`, \`countplot\`, \`heatmap\`, \`regplot\`. They return the Axes, so you can finish with \`ax.set(...)\`.
- **Figure-level** functions create their own figure: \`relplot\` (scatter/line), \`displot\` (hist/kde/ecdf), \`catplot\` (box, bar, strip, …), \`lmplot\`, \`pairplot\`, \`jointplot\`. They return a FacetGrid; \`col=\`, \`row=\` and \`col_wrap=\` give small multiples, sized with \`height\` and \`aspect\` rather than figsize.
- Without \`ax=\`, an axes-level call draws on the **current** axes, so create one explicitly.

**Statistics it computes.**
- \`barplot\` shows the **mean** per category with an error bar: by default a 95% bootstrap confidence interval. Change it with \`errorbar=None\`, \`"sd"\` or \`("ci", 95)\` (seaborn 0.13).
- \`countplot\` counts rows.
- \`lineplot\` with repeated x values draws the mean plus a CI band.
- \`histplot(stat="density" | "percent" | "probability", common_norm=False)\` when group sizes differ.
- \`boxplot\` whiskers reach the furthest point within 1.5 · IQR of the box.

**Order and colour.**
- Fix category order with \`order=[...]\` and \`hue_order=[...]\`.
- \`palette="viridis"\` (sequential), \`"vlag"\` (diverging), \`"colorblind"\` (qualitative).
- \`heatmap(corr, annot=True, fmt=".2f", vmin=-1, vmax=1, center=0, cmap="vlag")\` for correlation matrices.
- \`sns.set_theme()\` sets the style globally.

**Worked example 1.** \`countplot\` of a, a, b, b, b, c → 3 bars of heights 2, 3, 1.

**Worked example 2.** \`barplot\` of v by g with a: (1, 3) and b: (10, 20) → heights 2 and 15: means, not sums.

**Worked example 3.** \`relplot(col="c", row="r")\` with 3 values of c and 2 of r → \`g.axes\` is a 2 × 3 grid.

**Worked example 4.** For a wide frame of monthly series: \`long = wide.reset_index().melt(id_vars="month", var_name="series", value_name="value")\`, then \`sns.lineplot(data=long, x="month", y="value", hue="series")\`.
`, [yt("ooqXQ37XHMM", "Seaborn is the easier matplotlib", "NeuralNine"), yt("6GUZXDef2U0", "Seaborn tutorial: full course", "Derek Banas"), R("seaborn docs: Overview of seaborn plotting functions", "https://seaborn.pydata.org/tutorial/function_overview.html"), R("seaborn docs: Statistical estimation and error bars", "https://seaborn.pydata.org/tutorial/error_bars.html"), R("seaborn docs: Data structures accepted by seaborn", "https://seaborn.pydata.org/tutorial/data_structure.html")], "viz/seaborn", [
  iq("What's the difference between seaborn's axes-level and figure-level functions?", "Axes-level functions (scatterplot, histplot, boxplot, barplot, heatmap…) draw onto a single matplotlib Axes, accept ax= and return it, so they fit into your own subplot layouts. Figure-level functions (relplot, displot, catplot, pairplot, lmplot) create and manage a whole figure through a FacetGrid, support col/row faceting, and are sized with height/aspect; you customise them through the grid object.", ["Axes-level: ax=, returns Axes", "Figure-level: FacetGrid, col/row", "Sizing and customisation differ"]),
  iq("What do the bar and the error bar in a seaborn barplot show by default?", "The bar's height is the mean of y in each category (estimator=mean) and the error bar is a 95% bootstrap confidence interval for that mean. It isn't the spread of the data: with lots of data the CI is tiny even if values vary widely. Use errorbar='sd' for spread, or show the distribution directly (box, violin, strip) when spread matters.", ["Mean per category", "95% bootstrap CI of the mean", "CI ≠ spread; alternatives"]),
  iq("Why does seaborn prefer long-format data, and how do you get it?", "Each seaborn semantic (x, y, hue, size, style, col, row) maps a column to a visual property, so the variable you want to colour or facet by has to be a column, not spread across column names. Melt wide data: df.reset_index().melt(id_vars=[...], var_name='series', value_name='value'), then hue='series'.", ["Semantics map columns", "Wide hides the variable in names", "melt then hue/col"]),
]);
trace("viz-sns-t1", "viz-seaborn", "sns", 1, 45, 'df = pd.DataFrame({"g": list("aabbbc")})\nfig, ax = plt.subplots()\nsns.countplot(data=df, x="g", ax=ax)\nprint(sum(p.get_height() for p in ax.patches) + len(ax.patches))', 9,
  "countplot draws one bar per category (3 bars) whose heights are the counts 2, 3, 1 (sum 6). 6 + 3 = 9.", "countplot: one bar per category, height = rows.", "Expecting one bar per row (6 + 6 = 12).");
trace("viz-sns-t2", "viz-seaborn", "sns", 1, 45, 'df = pd.DataFrame({"g": list("aabb"), "v": [1, 3, 10, 20]})\nfig, ax = plt.subplots()\nsns.barplot(data=df, x="g", y="v", errorbar=None, ax=ax)\nprint(max(p.get_height() for p in ax.patches))', 15,
  "barplot's default estimator is the mean: a = 2, b = 15. The tallest bar is 15.", "barplot height = mean of y per category.", "Expecting the sum (30).");
trace("viz-sns-t3", "viz-seaborn", "sns", 2, 60, 'df = pd.DataFrame({"x": range(6), "y": range(6), "c": list("abcabc"), "r": list("uuuvvv")})\ng = sns.relplot(data=df, x="x", y="y", col="c", row="r")\nprint(g.axes.shape[0] * 10 + g.axes.size)', 26,
  "Faceting by row (2 values) and col (3 values) gives a 2 × 3 grid of Axes: 2 × 10 + 6 = 26.", "Figure-level functions return a FacetGrid; g.axes is rows × cols.", "Swapping rows and columns (3 × 10 + 6 = 36).");
Card_("viz-sns-c1", "sns.barplot bar height", "The mean per category, with a 95% bootstrap CI as the error bar by default.", "viz-seaborn");
Card_("viz-sns-c2", "relplot / displot / catplot", "Figure-level: own figure, a FacetGrid, col/row facets, sized with height/aspect.", "viz-seaborn");
