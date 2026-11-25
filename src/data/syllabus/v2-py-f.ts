/**
 * v2 Python, part F: pandas (1 of 2) — basics, selection, filtering, columns, sorting,
 * groupby, merging. Fixed ids (py2-*); answers recomputed in Pyodide with pandas.
 */
import { CHECKED, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("python");
const M = "pandas";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  tenmin: src("pandas: 10 minutes to pandas", "https://pandas.pydata.org/docs/user_guide/10min.html"),
  idx: src("pandas user guide: indexing and selecting data", "https://pandas.pydata.org/docs/user_guide/indexing.html"),
  gb: src("pandas user guide: group by (split-apply-combine)", "https://pandas.pydata.org/docs/user_guide/groupby.html"),
  merge: src("pandas user guide: merge, join, concatenate and compare", "https://pandas.pydata.org/docs/user_guide/merging.html"),
};
const PD = ["pandas"];
const DF = `import pandas as pd
df = pd.DataFrame({
    "order_id": [1, 2, 3, 4, 5, 6, 7, 8],
    "cust": ["asha", "ravi", "asha", "zoya", "ravi", "asha", "john", "zoya"],
    "city": ["Pune", "Delhi", "Pune", "Mumbai", "Delhi", "Pune", "Delhi", "Mumbai"],
    "amount": [250, 400, 150, 900, 300, 50, 700, 120],
    "status": ["paid", "paid", "refund", "paid", "paid", "paid", "refund", "paid"],
})
`;
const DATA_NOTE = `
The examples in this module use one small orders table:

\`\`\`python
import pandas as pd
df = pd.DataFrame({
    "order_id": [1, 2, 3, 4, 5, 6, 7, 8],
    "cust":   ["asha", "ravi", "asha", "zoya", "ravi", "asha", "john", "zoya"],
    "city":   ["Pune", "Delhi", "Pune", "Mumbai", "Delhi", "Pune", "Delhi", "Mumbai"],
    "amount": [250, 400, 150, 900, 300, 50, 700, 120],
    "status": ["paid", "paid", "refund", "paid", "paid", "paid", "refund", "paid"],
})
\`\`\`
`;
const QDF = "Using the module's orders table `df` (8 rows: order_id, cust, city, amount, status), ";

// ───────────────────────── Basics ─────────────────────────

L("py2-pd-basics", M, "Series, DataFrames and loading data", "What a DataFrame is, reading CSVs with the right options, and the first five commands of any EDA.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "You're handed a 2 GB CSV in a take-home. What are the first commands you run, and which read_csv options save you an hour?",
  intuition: `
**The situation.** Almost every DA/DS OA and take-home starts with \`pd.read_csv\` and a quick look at the data.

**The idea.** A **Series** is a 1-D array with an **index** (labels). A **DataFrame** is a table of Series sharing one index, each column with its own dtype. Operations align on labels, not positions: adding two Series matches index labels first.

The first look at any dataset answers: how big (\`shape\`), what types (\`dtypes\`/\`info\`), what values (\`head\`, \`describe\`, \`value_counts\`), what's missing (\`isna().sum()\`).
${DATA_NOTE}`,
  maths: `
**In one breath.** \`pd.read_csv(path, usecols=, dtype=, parse_dates=, nrows=)\`; \`shape, dtypes, info(), head(), describe(), isna().sum(), nunique()\`; columns are Series; arithmetic aligns on the index.

\`\`\`python
print(df.shape)                      # (8, 5)
print(df.dtypes["amount"])           # int64
df.info()                            # columns, non-null counts, dtypes, memory
print(df.head(3))
print(df.describe())                 # count/mean/std/min/quartiles/max of numeric cols
print(df["city"].value_counts())     # Pune 3, Delhi 3, Mumbai 2
print(df.isna().sum().sum(), df["cust"].nunique())   # 0 4

s = df["amount"]                     # a Series
print(type(s).__name__, s.mean())    # Series 358.75

a = pd.Series([1, 2], index=["x", "y"])
b = pd.Series([10, 20], index=["y", "z"])
print(a + b)                         # x NaN, y 12.0, z NaN  (aligned by label)

big = pd.read_csv(
    "orders.csv",
    usecols=["order_id", "cust", "amount", "ts"],   # only what you need
    dtype={"cust": "category"},                     # compact types
    parse_dates=["ts"],                             # real datetimes
    nrows=100_000,                                  # peek at a sample first
)
\`\`\`

**Other readers.** \`read_excel\`, \`read_json\`, \`read_parquet\` (fast, typed, columnar), \`read_sql\`. Writers mirror them: \`to_csv(index=False)\`, \`to_parquet\`.

**Index.** \`set_index("order_id")\` makes a column the row labels; \`reset_index()\` turns the index back into a column.
`,
  practice: `
**First 5 minutes of any dataset.** shape → info → head → describe (include="all") → isna().sum() → value_counts on key categoricals → check the grain (\`df["order_id"].is_unique\`).

**Speed and memory.** Read only needed columns, set dtypes (category for low-cardinality strings), parse dates on read, and convert to Parquet for repeated work.
`,
  traps: [
    { trap: "Adding two Series adds them position by position.", why: "pandas aligns on index labels first; labels present in only one Series give NaN. Use .to_numpy() or reset_index if you really want positional." },
    { trap: "`describe()` summarises every column.", why: "By default only numeric columns; use describe(include='all') or describe(include='object')." },
  ],
  say: {
    prompt: "You get a new CSV for a take-home. Walk me through your first look at it in pandas.",
    secs: 45,
    check: ["read_csv with usecols/dtype/parse_dates (sample with nrows if large)", "shape, info/dtypes, head", "describe and value_counts on key columns", "isna().sum() and duplicates / grain check", "Notes index alignment or set_index"],
    followups: [
      { q: "Series vs DataFrame?", a: "A Series is one labelled 1-D column; a DataFrame is a 2-D table of Series sharing the same index." },
      { q: "Why does `s1 + s2` give NaNs?", a: "Because pandas aligns on index labels; labels missing from one side produce NaN." },
      { q: "Why Parquet over CSV for repeated analysis?", a: "Columnar, compressed, stores dtypes, and reads only the needed columns, so it's much faster and smaller." },
    ],
    answer: `I'd read it with read_csv, selecting only the columns I need, setting dtypes like category for low-cardinality strings and parse_dates for timestamps, and if it's huge I'd peek with nrows first. Then shape, info for dtypes and non-null counts, head, describe including non-numeric columns, isna().sum() for missingness, value_counts on the key categorical columns, and a check of the grain, for example whether order_id is unique. That tells me what cleaning is needed before any analysis.`,
    avoid: ["Jumping to modelling before checking dtypes and missing values"],
  },
  terms: [["Series", "Labelled 1-D array."], ["DataFrame", "Table of Series sharing an index."], ["Index alignment", "Operations match rows by label."]],
  sources: [S.tenmin],
});
Q({ id: "py2-pdb-1", d: 1, secs: 30, prompt: QDF + "what is `df['amount'].mean()`?", answer: 358.75, tol: 0.005, explain: "2870 / 8.", py: DF + "answer = float(df['amount'].mean())", packages: PD });
Q({ id: "py2-pdb-2", d: 1, secs: 30, prompt: QDF + "what is `df['city'].value_counts()['Delhi']`?", answer: 3, tol: 0.5, explain: "Orders 2, 5, 7.", py: DF + "answer = int(df['city'].value_counts()['Delhi'])", packages: PD });
Q({ id: "py2-pdb-3", d: 1, secs: 30, prompt: "`a = pd.Series([1, 2], index=['x', 'y'])`, `b = pd.Series([10, 20], index=['y', 'z'])`. How many non-null values does `a + b` have?", answer: 1, tol: 0.5, explain: "Only 'y' exists in both: 12. x and z are NaN.", py: "import pandas as pd\na = pd.Series([1, 2], index=['x', 'y']); b = pd.Series([10, 20], index=['y', 'z'])\nanswer = int((a + b).notna().sum())", packages: PD });
Q({ id: "py2-pdb-4", d: 1, secs: 20, prompt: QDF + "what is `df['cust'].nunique()`?", answer: 4, tol: 0.5, explain: "asha, ravi, zoya, john.", py: DF + "answer = int(df['cust'].nunique())", packages: PD });
C("py2-pdb-c1", "First look", "shape · info() · head() · describe(include='all') · isna().sum() · value_counts()");
C("py2-pdb-c2", "Index alignment", "Series arithmetic matches labels; unmatched → NaN.");

// ───────────────────────── Selection ─────────────────────────

L("py2-pd-select", M, "Selecting rows and columns: [], loc, iloc", "Label vs position selection, inclusive vs exclusive slices, single vs double brackets, and at/iat.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "`df.loc[0:3]` returns 4 rows but `df.iloc[0:3]` returns 3. Why, and which should you use?",
  intuition: `
**The situation.** Selection bugs (wrong rows, a Series where you expected a DataFrame, chained indexing warnings) are the most common pandas mistakes in live coding.

**The idea.** Three selectors:

- **\`df["col"]\` / \`df[["a", "b"]]\`**: columns. Single brackets → Series; a list → DataFrame.
- **\`.loc[rows, cols]\`**: by **label** (index values and column names). Slices **include** the end label. Accepts boolean masks.
- **\`.iloc[rows, cols]\`**: by **integer position**. Slices **exclude** the end, like Python.

Use \`.at[label, col]\` / \`.iat[i, j]\` for single values. For assignment, select and set in **one** \`.loc\` call.
`,
  maths: `
**In one breath.** \`[]\` columns (or row slices), \`.loc\` labels inclusive, \`.iloc\` positions exclusive, \`.loc[mask, "col"] = v\` for conditional assignment.

\`\`\`python
print(df["amount"].shape, df[["amount"]].shape)   # (8,) (8, 1)
print(df.loc[0:3, "cust"].tolist())               # ['asha', 'ravi', 'asha', 'zoya']  (4: inclusive)
print(df.iloc[0:3, 1].tolist())                   # ['asha', 'ravi', 'asha']          (3: exclusive)
print(df.loc[df["amount"] > 500, ["cust", "amount"]])
print(df.iloc[-1]["cust"], df.at[2, "city"])      # zoya Pune

d2 = df.set_index("order_id")
print(d2.loc[5, "amount"])                        # 300 (label 5, not position 5)
print(d2.iloc[5]["amount"])                       # 50  (6th row)

df.loc[df["status"] == "refund", "amount"] = 0    # correct conditional update
# df[df.status == "refund"]["amount"] = 0         # chained: may not modify df (SettingWithCopyWarning)
\`\`\`

| Selector | Uses | Slice end | Returns |
|---|---|---|---|
| \`df["c"]\` | column name | — | Series |
| \`df[["c"]]\` | list of names | — | DataFrame |
| \`.loc\` | labels, masks | inclusive | Series/DataFrame/scalar |
| \`.iloc\` | positions | exclusive | Series/DataFrame/scalar |
| \`.at\` / \`.iat\` | one label / one position | — | scalar |
`,
  practice: `
**Rules.** Filter rows with \`.loc[mask]\`; pick columns with a list; assign with one \`.loc[mask, col] = …\`; after filtering into a new frame you'll modify, call \`.copy()\`. With a non-default index (dates, IDs) be explicit about loc vs iloc.
`,
  traps: [
    { trap: "`df.loc[0:3]` and `df.iloc[0:3]` return the same rows.", why: "loc includes the end label (4 rows with a 0..n index); iloc excludes the end position (3 rows)." },
    { trap: "`df[df.x > 0]['y'] = 1` updates df.", why: "Chained indexing may assign into a temporary copy (SettingWithCopyWarning). Use `df.loc[df.x > 0, 'y'] = 1`." },
  ],
  say: {
    prompt: "What's the difference between loc and iloc in pandas, and how do you safely update values conditionally?",
    secs: 45,
    check: ["loc by label, iloc by integer position", "loc slices inclusive, iloc exclusive", "Single vs double brackets (Series vs DataFrame)", "df.loc[mask, col] = value in one call", "Chained indexing / SettingWithCopyWarning; .copy() on subsets"],
    followups: [
      { q: "With an index of order IDs 101..108, what's df.loc[103] vs df.iloc[3]?", a: "loc[103] is the row labelled 103 (the 3rd row); iloc[3] is the 4th row (label 104)." },
      { q: "How do you select all rows for two columns?", a: "`df[['a', 'b']]` or `df.loc[:, ['a', 'b']]`." },
      { q: "Why does pandas warn about SettingWithCopy?", a: "Because a filtered frame might be a copy, so assigning into it may not affect the original; pandas can't always tell, so it warns. Copy-on-write (default in pandas 3) removes the ambiguity." },
    ],
    answer: `loc selects by label: index values and column names, and a slice includes its end label; it also takes boolean masks. iloc selects by integer position and slices exclude the end, like Python. Single brackets with one column give a Series, a list of columns gives a DataFrame. For conditional updates I do the selection and assignment in one call, df.loc[mask, "col"] = value, because chained indexing like df[mask]["col"] = value may write into a temporary copy, which is what SettingWithCopyWarning is about. If I filter into a new frame I intend to modify, I call .copy().`,
    avoid: ["Chained assignment", "Assuming loc slices exclude the end"],
  },
  terms: [["loc", "Label-based selection; inclusive slices."], ["iloc", "Position-based selection; exclusive slices."], ["Chained indexing", "Two consecutive [] that may act on a copy."]],
  sources: [S.idx],
});
Q({ id: "py2-pds-1", d: 1, secs: 30, prompt: QDF + "how many rows does `df.loc[2:5]` return?", answer: 4, tol: 0.5, explain: "Labels 2, 3, 4, 5 (inclusive).", py: DF + "answer = len(df.loc[2:5])", packages: PD });
Q({ id: "py2-pds-2", d: 1, secs: 30, prompt: QDF + "how many rows does `df.iloc[2:5]` return?", answer: 3, tol: 0.5, explain: "Positions 2, 3, 4 (exclusive end).", py: DF + "answer = len(df.iloc[2:5])", packages: PD });
Q({ id: "py2-pds-3", d: 2, secs: 45, prompt: QDF + "after `d2 = df.set_index('order_id')`, what is `d2.loc[5, 'amount'] - d2.iloc[5]['amount']`?", answer: 250, tol: 0.5, explain: "Label 5 → 300; position 5 (order 6) → 50.", py: DF + "d2 = df.set_index('order_id')\nanswer = int(d2.loc[5, 'amount'] - d2.iloc[5]['amount'])", packages: PD });
Q({ id: "py2-pds-4", d: 2, secs: 45, prompt: QDF + "after `df.loc[df['status'] == 'refund', 'amount'] = 0`, what is `df['amount'].sum()`?", answer: 2020, tol: 0.5, explain: "2870 − 150 − 700 = 2020.", py: DF + "df.loc[df['status'] == 'refund', 'amount'] = 0\nanswer = int(df['amount'].sum())", packages: PD });
C("py2-pds-c1", "loc vs iloc", "loc: labels, end inclusive. iloc: positions, end exclusive.");
C("py2-pds-c2", "Conditional update", "df.loc[mask, 'col'] = value — never df[mask]['col'] = value.");

// ───────────────────────── Filtering ─────────────────────────

L("py2-pd-filter", M, "Filtering rows", "Boolean masks with & | ~, isin, between, str.contains, query, and filtering on missing values.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "Paid orders above ₹200 from Pune or Delhi, excluding customer 'ravi'. Write it in one readable line.",
  intuition: `
**The situation.** "Filter then aggregate" is the core of most SQL-style pandas questions.

**The idea.** A comparison on a column gives a boolean Series; \`df[mask]\` (or \`df.loc[mask]\`) keeps the True rows. Combine conditions with \`&\`, \`|\`, \`~\` and **wrap each condition in parentheses**. Helpers keep masks readable:

- \`isin([...])\` for membership (SQL \`IN\`),
- \`between(a, b)\` (inclusive by default),
- \`.str.contains / startswith\` for text,
- \`isna()/notna()\` for missing values,
- \`query("amount > 200 and city in @cities")\` as a string alternative.
`,
  maths: `
**In one breath.** \`df[(c1) & (c2) | ~(c3)]\`; \`isin\`, \`between\`, \`str.contains(na=False)\`, \`isna\`; \`query\` with \`@var\`.

\`\`\`python
m = (df["status"] == "paid") & (df["amount"] > 200) & df["city"].isin(["Pune", "Delhi"]) & (df["cust"] != "ravi")
print(df.loc[m, "order_id"].tolist())             # [1]

print(len(df[df["amount"].between(100, 300)]))    # 4  (inclusive: 250, 150, 300, 120)
print(df[df["cust"].str.startswith("a")].shape[0])  # 3
print(df[~df["city"].isin(["Pune"])].shape[0])    # 5

cities = ["Pune", "Mumbai"]
print(df.query("amount >= 200 and city in @cities").order_id.tolist())   # [1, 4]

top = df.nlargest(3, "amount")                    # filter by rank
recent = df[df["order_id"] > df["order_id"].max() - 3]
print(df[df["amount"] > df["amount"].mean()].shape[0])   # 3 above-average orders
\`\`\`

**Missing values in masks.** Comparisons with NaN are False; \`str.contains\` returns NaN for missing strings unless \`na=False\`.

**Empty results.** Check \`len(result)\` or \`.empty\` before taking \`.iloc[0]\`.
`,
  practice: `
**Readable filters.** Name masks (\`is_paid = df.status.eq("paid")\`), then combine. Use \`query\` for long conditions in notebooks; use masks in production code. Filtering doesn't change the index: \`reset_index(drop=True)\` if you need 0..n−1.
`,
  traps: [
    { trap: "`df[df.a > 1 and df.b < 5]` works.", why: "`and`/`or` need a single bool: 'truth value of a Series is ambiguous'. Use & | with parentheses." },
    { trap: "`df[df.a > 1 & df.b < 5]` works without parentheses.", why: "& binds tighter than >, so it computes `1 & df.b` first. Parenthesise each comparison." },
  ],
  say: {
    prompt: "How do you filter a DataFrame on multiple conditions in pandas?",
    secs: 30,
    check: ["Boolean masks from comparisons", "& | ~ with parentheses (not and/or)", "isin, between, str methods, isna", "query as an alternative with @variables", "Index preserved; reset_index; .copy() before modifying"],
    followups: [
      { q: "How do you filter rows where a string column contains 'refund', ignoring case and NaN?", a: "`df[df.col.str.contains('refund', case=False, na=False)]`." },
      { q: "How do you keep rows whose value is in another DataFrame's column?", a: "`df[df.id.isin(other.id)]`, or a semi-join with merge on unique keys." },
      { q: "Is between inclusive?", a: "Yes, both ends by default; inclusive='left'/'right'/'neither' changes it." },
    ],
    answer: `Each condition produces a boolean Series, and I combine them with & for and, | for or and ~ for not, wrapping every comparison in parentheses because those operators bind tighter than comparisons; Python's and/or raise an ambiguity error. I use isin for membership, between for ranges, .str methods with na=False for text and isna for missing values. For long conditions query() reads like SQL, with @ for Python variables. The filtered frame keeps the original index, so I reset it if I need positions, and copy before modifying.`,
    avoid: ["and/or on Series"],
  },
  terms: [["Boolean mask", "True/False Series selecting rows."], ["isin", "Element-wise membership test."], ["query", "String expression filter."]],
  sources: [S.idx],
});
Q({ id: "py2-pdf-1", d: 1, secs: 45, prompt: QDF + "how many rows satisfy `(df.status == 'paid') & (df.amount >= 300)`?", answer: 3, tol: 0.5, explain: "Orders 2 (400), 4 (900), 5 (300).", py: DF + "answer = int(((df.status == 'paid') & (df.amount >= 300)).sum())", packages: PD });
Q({ id: "py2-pdf-2", d: 1, secs: 30, prompt: QDF + "what is `df[df['city'].isin(['Pune', 'Mumbai'])]['amount'].sum()`?", answer: 1470, tol: 0.5, explain: "Pune 250 + 150 + 50, Mumbai 900 + 120.", py: DF + "answer = int(df[df['city'].isin(['Pune', 'Mumbai'])]['amount'].sum())", packages: PD });
Q({ id: "py2-pdf-3", d: 2, secs: 45, prompt: QDF + "how many orders are above the mean amount?", answer: 3, tol: 0.5, explain: "Mean 358.75; 400, 900, 700.", py: DF + "answer = int((df.amount > df.amount.mean()).sum())", packages: PD });
Q({ id: "py2-pdf-4", d: 1, secs: 30, prompt: QDF + "what is `len(df.query('city == \"Delhi\" and status != \"refund\"'))`?", answer: 2, tol: 0.5, explain: "Orders 2 and 5.", py: DF + "answer = len(df.query('city == \"Delhi\" and status != \"refund\"'))", packages: PD });
C("py2-pdf-c1", "Multiple conditions", "df[(df.a > 1) & (df.b.isin(xs)) | ~(df.c.isna())]");
C("py2-pdf-c2", "Text filter", "df.col.str.contains('x', case=False, na=False)");

// ───────────────────────── Creating columns ─────────────────────────

L("py2-pd-columns", M, "Creating and transforming columns", "Vectorised arithmetic, np.where/select, map/replace, assign chains, rename, drop and astype.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "Add GST, a 'high value' flag and a tier label to every order, without apply and without a loop.",
  intuition: `
**The situation.** Feature engineering and report prep are mostly "make a new column from existing ones".

**The idea.** Column arithmetic is vectorised: \`df["a"] * 1.18\` computes every row at once. For conditions use \`np.where\` (two outcomes) or \`np.select\`/\`pd.cut\` (several). For value lookups use \`map\` with a dict; for replacing specific values use \`replace\`. \`assign\` adds columns in a chain without mutating, which keeps notebooks readable.
`,
  maths: `
**In one breath.** \`df["new"] = expr\`; \`np.where(cond, a, b)\`; \`np.select\`; \`pd.cut(bins)\`; \`map(dict)\`; \`replace\`; \`assign(**{...})\`; \`rename(columns=)\`; \`drop(columns=)\`; \`astype\`.

\`\`\`python
import numpy as np
df["amount_gst"] = (df["amount"] * 1.18).round(2)
df["is_high"] = np.where(df["amount"] >= 500, 1, 0)
df["tier"] = pd.cut(df["amount"], bins=[0, 200, 500, np.inf], labels=["low", "mid", "high"])
print(df["tier"].value_counts().to_dict())       # {'low': 3, 'mid': 3, 'high': 2}

zone = {"Pune": "West", "Mumbai": "West", "Delhi": "North"}
df["zone"] = df["city"].map(zone)                # unmapped values -> NaN
df["status"] = df["status"].replace({"refund": "refunded"})

out = (df
       .assign(net=lambda d: np.where(d.status == "paid", d.amount, -d.amount))
       .rename(columns={"cust": "customer"})
       .drop(columns=["amount_gst"]))
print(out["net"].sum())                          # 2870 - 2*(150 + 700) = 1170

df["order_id"] = df["order_id"].astype("int32")
df["name_len"] = df["cust"].str.len()
\`\`\`

**map vs replace.** \`map(dict)\` turns values not in the dict into NaN; \`replace(dict)\` leaves them unchanged.

**pd.cut vs pd.qcut.** \`cut\` uses fixed edges (right-inclusive by default); \`qcut\` makes equal-frequency bins (quantiles).
`,
  practice: `
**Prefer vectorised expressions** over \`apply(lambda row: ...)\` (covered later): they're clearer and 10–100× faster. Use \`assign\` chains for pipelines you'll rerun. Keep raw columns unmodified; add derived ones.
`,
  traps: [
    { trap: "`df['city'].map({'Pune': 'West'})` keeps other cities as they were.", why: "map with a dict sends unmatched values to NaN; use replace, or map then fillna with the original." },
    { trap: "`pd.cut(x, [0, 200, 500])` puts 200 in the second bin.", why: "Bins are right-inclusive by default: (0, 200] contains 200." },
  ],
  say: {
    prompt: "How do you create a categorical tier column from a numeric column in pandas, and why avoid apply?",
    secs: 30,
    check: ["Vectorised arithmetic for derived columns", "np.where / np.select / pd.cut (or qcut) for tiers", "map vs replace behaviour", "assign for chaining", "apply is a Python loop: slower"],
    followups: [
      { q: "cut vs qcut?", a: "cut uses explicit edges; qcut uses quantiles so each bin has about the same number of rows." },
      { q: "How do you rename several columns?", a: "`df.rename(columns={'old': 'new', ...})`, or set df.columns to a cleaned list (e.g. str.lower().str.replace(' ', '_'))." },
      { q: "Why is assign useful?", a: "It returns a new frame with the column added and accepts lambdas referencing the intermediate frame, enabling readable method chains." },
    ],
    answer: `I compute derived columns with vectorised expressions on whole columns. For two outcomes I use np.where; for tiers I use pd.cut with explicit edges and labels, remembering bins are right-inclusive, or qcut for equal-sized groups, or np.select for arbitrary conditions. map with a dict handles lookups but sends unmatched values to NaN, while replace leaves them alone. I avoid row-wise apply because it's a Python loop over rows and can be orders of magnitude slower.`,
    avoid: ["apply(lambda row: ...) for simple arithmetic"],
  },
  terms: [["pd.cut", "Bin values by fixed edges."], ["pd.qcut", "Bin values by quantiles."], ["assign", "Return a copy with new columns (chain-friendly)."]],
  sources: [S.tenmin],
});
Q({ id: "py2-pdc-1", d: 1, secs: 30, prompt: QDF + "with `np.where(df.amount >= 500, 1, 0)`, how many orders are flagged?", answer: 2, tol: 0.5, explain: "900 and 700.", py: "import numpy as np\n" + DF + "answer = int(np.where(df.amount >= 500, 1, 0).sum())", packages: ["pandas", "numpy"] });
Q({ id: "py2-pdc-2", d: 2, secs: 45, prompt: QDF + "`pd.cut(df.amount, bins=[0, 200, 500, np.inf], labels=['low', 'mid', 'high'])`. How many 'mid'?", answer: 3, tol: 0.5, explain: "250, 400, 300 fall in (200, 500].", py: "import numpy as np\n" + DF + "t = pd.cut(df.amount, bins=[0, 200, 500, np.inf], labels=['low', 'mid', 'high'])\nanswer = int((t == 'mid').sum())", packages: ["pandas", "numpy"] });
Q({ id: "py2-pdc-3", d: 2, secs: 45, prompt: QDF + "`df.city.map({'Pune': 'West', 'Mumbai': 'West'})`. How many NaN values result?", answer: 3, tol: 0.5, explain: "All three Delhi rows are unmapped.", py: DF + "answer = int(df.city.map({'Pune': 'West', 'Mumbai': 'West'}).isna().sum())", packages: PD });
Q({ id: "py2-pdc-4", d: 2, secs: 45, prompt: QDF + "net = amount for paid and −amount for refunds. What is the total net?", answer: 1170, tol: 0.5, explain: "Paid 2020 − refunds 850 = 1170.", py: "import numpy as np\n" + DF + "answer = int(np.where(df.status == 'paid', df.amount, -df.amount).sum())", packages: ["pandas", "numpy"] });
C("py2-pdc-c1", "map vs replace", "map(dict): unmatched → NaN. replace(dict): unmatched unchanged.");
C("py2-pdc-c2", "Tiers", "pd.cut(edges, labels) right-inclusive · pd.qcut(q) equal-frequency · np.select(conds, vals)");

// ───────────────────────── Sorting, ranking, duplicates ─────────────────────────

L("py2-pd-sort", M, "Sorting, ranking, top-N and duplicates", "sort_values on several keys, nlargest, rank methods, value_counts, duplicated and drop_duplicates.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "Return each customer's latest order and the top 3 customers by spend, with ties handled the way the question specifies.",
  intuition: `
**The situation.** "Top N", "rank", "latest record per key" and "remove duplicates" are classic SQL-to-pandas tasks in DA screens.

**The idea.**

- \`sort_values(["a", "b"], ascending=[True, False])\` sorts by several keys with different directions.
- \`nlargest(n, col)\` / \`nsmallest\` for top-N without a full sort.
- \`rank(method=...)\` assigns ranks; the method decides ties: \`"min"\` (SQL RANK), \`"dense"\` (DENSE_RANK), \`"first"\` (ROW_NUMBER), \`"average"\` (default).
- \`duplicated(subset, keep)\` flags repeats; \`drop_duplicates(subset, keep="last")\` keeps one row per key, which after sorting gives "latest per key".
`,
  maths: `
**In one breath.** Sort then \`drop_duplicates(subset=key, keep="last")\` = latest per key; \`rank(method="dense", ascending=False)\`; \`value_counts(normalize=True)\` for shares.

\`\`\`python
print(df.sort_values(["city", "amount"], ascending=[True, False]).order_id.tolist())
# Delhi: 7, 2, 5 | Mumbai: 4, 8 | Pune: 1, 3, 6  -> [7, 2, 5, 4, 8, 1, 3, 6]

latest = df.sort_values("order_id").drop_duplicates(subset="cust", keep="last")
print(latest[["cust", "order_id"]].values.tolist())
# [['ravi', 5], ['asha', 6], ['john', 7], ['zoya', 8]]

spend = df.groupby("cust")["amount"].sum()
print(spend.nlargest(3).index.tolist())          # ['zoya', 'john', 'ravi']  (1020, 700, 700)

s = pd.Series([100, 90, 90, 80])
print(s.rank(ascending=False, method="min").tolist())    # [1.0, 2.0, 2.0, 4.0]  RANK
print(s.rank(ascending=False, method="dense").tolist())  # [1.0, 2.0, 2.0, 3.0]  DENSE_RANK
print(s.rank(ascending=False, method="first").tolist())  # [1.0, 2.0, 3.0, 4.0]  ROW_NUMBER

print(df["city"].value_counts(normalize=True).round(3).to_dict())   # shares
print(df.duplicated(subset=["cust"]).sum())     # 4 repeat-customer rows
\`\`\`

**Stability.** \`sort_values(kind="stable")\` (mergesort) keeps the original order for ties when sorting by several passes.
`,
  practice: `
**Tie rules matter.** Interview prompts often say "if tied, return all" (use rank method="min" ≤ k) or "break ties by name" (sort by [score desc, name asc]). Ask, then implement exactly.

**Top-N per group** is in the groupby lessons (\`groupby().head(n)\` after sorting, or rank within group).
`,
  traps: [
    { trap: "`drop_duplicates('cust')` keeps the latest order per customer.", why: "It keeps the first occurrence in the current row order. Sort by time first and use keep='last' (or sort descending and keep='first')." },
    { trap: "`rank()` default gives 1, 2, 2, 3 for ties.", why: "Default method='average' gives 1, 2.5, 2.5, 4 (ascending). Choose min/dense/first explicitly." },
  ],
  say: {
    prompt: "How do you get the most recent row per customer, and how do RANK vs DENSE_RANK map to pandas?",
    secs: 45,
    check: ["Sort by time, drop_duplicates(subset=key, keep='last') (or groupby idxmax/tail(1))", "rank(method='min') = RANK, 'dense' = DENSE_RANK, 'first' = ROW_NUMBER", "ascending=False for highest-first", "Tie-breaking via multi-key sort", "nlargest for top-N"],
    followups: [
      { q: "Another way to get the latest row per key?", a: "`df.loc[df.groupby('cust')['ts'].idxmax()]`, or `df.sort_values('ts').groupby('cust').tail(1)`." },
      { q: "How do you get the share of each category?", a: "`value_counts(normalize=True)`." },
      { q: "How do you find customers who placed more than one order?", a: "`df.cust.value_counts().loc[lambda s: s > 1].index`, or `df[df.duplicated('cust', keep=False)]` for their rows." },
    ],
    answer: `For the latest row per customer I sort by the timestamp and call drop_duplicates on the customer column with keep="last"; alternatives are groupby with idxmax on the timestamp, or groupby().tail(1) after sorting. For ranking, Series.rank with ascending=False and method="min" behaves like SQL RANK, giving tied values the same rank and leaving a gap; method="dense" is DENSE_RANK with no gaps; method="first" is ROW_NUMBER. The default is "average", which gives fractional ranks, so I always set the method explicitly.`,
    avoid: ["Relying on default rank", "drop_duplicates without sorting first"],
  },
  terms: [["rank(method)", "Tie handling: average, min, max, dense, first."], ["drop_duplicates", "Remove repeated rows by subset, keep first/last."], ["nlargest", "Top-n rows by a column."]],
  sources: [S.idx, S.tenmin],
});
Q({ id: "py2-pdsr-1", d: 1, secs: 45, prompt: QDF + "after `df.sort_values('order_id').drop_duplicates('cust', keep='last')`, what is the sum of the remaining order_ids?", answer: 26, tol: 0.5, explain: "Latest orders: ravi 5, asha 6, john 7, zoya 8 → 26.", py: DF + "answer = int(df.sort_values('order_id').drop_duplicates('cust', keep='last').order_id.sum())", packages: PD });
Q({ id: "py2-pdsr-2", d: 1, secs: 30, prompt: "`pd.Series([100, 90, 90, 80]).rank(ascending=False, method='dense')`. What rank does 80 get?", answer: 3, tol: 0.05, explain: "Dense ranks: 1, 2, 2, 3.", py: "import pandas as pd\nanswer = float(pd.Series([100, 90, 90, 80]).rank(ascending=False, method='dense').iloc[3])", packages: PD });
Q({ id: "py2-pdsr-3", d: 1, secs: 30, prompt: "Same Series with default `rank()` (ascending, method='average'). What rank does 90 get?", answer: 2.5, tol: 0.05, explain: "Ascending: 80 → 1, the two 90s share (2 + 3)/2 = 2.5, 100 → 4.", py: "import pandas as pd\nanswer = float(pd.Series([100, 90, 90, 80]).rank().iloc[1])", packages: PD });
Q({ id: "py2-pdsr-4", d: 2, secs: 45, prompt: QDF + "what is `df.duplicated(subset=['cust']).sum()`?", answer: 4, tol: 0.5, explain: "asha appears 3 times (2 repeats), ravi 2 (1), zoya 2 (1): 4 repeat rows.", py: DF + "answer = int(df.duplicated(subset=['cust']).sum())", packages: PD });
C("py2-pdsr-c1", "SQL ranks in pandas", "RANK → method='min'; DENSE_RANK → 'dense'; ROW_NUMBER → 'first'.");
C("py2-pdsr-c2", "Latest row per key", "sort_values(time).drop_duplicates(key, keep='last')");

// ───────────────────────── groupby aggregation ─────────────────────────

L("py2-pd-groupby", M, "groupby and aggregation", "Split-apply-combine: single and multiple keys, agg with several functions, named aggregation, size vs count, as_index.", {
  kind: "concept", mins: 30, mathsLabel: "Code",
  hook: "Revenue, order count and average order value per city, sorted, with clean column names — one groupby call.",
  intuition: `
**The situation.** groupby is the single most tested pandas skill: it's SQL GROUP BY.

**The idea.** **Split** rows into groups by key(s), **apply** a function per group, **combine** results. Three kinds of apply:

- **Aggregate** (\`sum\`, \`mean\`, \`count\`, \`agg\`): one row per group.
- **Transform**: same shape as the input (next lesson).
- **Filter**: keep or drop whole groups (next lesson).

Named aggregation, \`agg(new_name=(column, func))\`, gives tidy output columns. Keys become the index unless you pass \`as_index=False\` or call \`reset_index()\`.
`,
  maths: `
**In one breath.** \`df.groupby(keys)[col].agg(...)\`; named agg; \`size()\` counts rows, \`count()\` counts non-null; \`nunique\`; \`as_index=False\`; multiple keys → MultiIndex.

\`\`\`python
g = df.groupby("city")["amount"].sum().sort_values(ascending=False)
print(g.to_dict())                     # {'Delhi': 1400, 'Mumbai': 1020, 'Pune': 450}

summary = (df.groupby("city", as_index=False)
             .agg(revenue=("amount", "sum"),
                  orders=("order_id", "count"),
                  aov=("amount", "mean"),
                  customers=("cust", "nunique"))
             .sort_values("revenue", ascending=False))
print(summary)
#      city  revenue  orders     aov  customers
# 0   Delhi     1400       3  466.67          2
# 1  Mumbai     1020       2  510.00          1
# 2    Pune      450       3  150.00          1

print(df.groupby(["city", "status"])["amount"].sum().loc[("Delhi", "refund")])   # 700
print(df.groupby(["city", "status"]).size().unstack(fill_value=0))   # orders by city x status
print(df.groupby("city")["amount"].agg(["min", "max", "median"]))
paid_share = df.groupby("city")["status"].apply(lambda s: (s == "paid").mean())
paid_share = df.assign(p=df.status.eq("paid")).groupby("city")["p"].mean()       # vectorised version
\`\`\`

**size vs count.** \`size()\` counts all rows in each group; \`count()\` counts non-null values per column.

**HAVING.** Filter the aggregated result: \`summary[summary.orders >= 3]\`.
`,
  practice: `
**SQL mapping.** WHERE → filter before groupby; GROUP BY → groupby; aggregates → agg; HAVING → filter the result; ORDER BY → sort_values; LIMIT → head.

**Clean output.** Use named aggregation, \`as_index=False\` (or \`reset_index\`), round at the end. For conditional aggregates (paid revenue per city), filter first or aggregate a precomputed column (\`np.where(paid, amount, 0)\`).
`,
  traps: [
    { trap: "`count()` and `size()` are the same.", why: "count ignores NaN per column; size counts rows. With missing values they differ." },
    { trap: "`groupby(...).apply(lambda g: ...)` is the normal way to aggregate.", why: "apply calls Python per group and is much slower; use built-in aggregations, agg, or precomputed columns." },
  ],
  say: {
    prompt: "Translate this SQL to pandas: SELECT city, SUM(amount) AS revenue, COUNT(*) AS orders FROM orders WHERE status='paid' GROUP BY city HAVING COUNT(*) >= 2 ORDER BY revenue DESC.",
    secs: 60,
    check: ["Filter status == 'paid' before grouping (WHERE)", "groupby('city').agg(revenue=('amount','sum'), orders=('order_id','size'/'count'))", "Filter the aggregate for HAVING", "sort_values('revenue', ascending=False)", "as_index=False / reset_index for a clean table"],
    followups: [
      { q: "How do you aggregate different columns with different functions?", a: "Named aggregation: agg(total=('amount', 'sum'), n_cust=('cust', 'nunique')), or a dict {'amount': 'sum', 'cust': 'nunique'}." },
      { q: "How do you get a city × status table of counts?", a: "groupby(['city', 'status']).size().unstack(fill_value=0), or pd.crosstab(df.city, df.status)." },
      { q: "What happens to NaN keys in groupby?", a: "They're dropped by default; pass dropna=False to keep a NaN group." },
    ],
    answer: `I'd filter first, paid = df[df.status == "paid"], which is the WHERE. Then paid.groupby("city", as_index=False).agg(revenue=("amount", "sum"), orders=("order_id", "size")) does the GROUP BY with named aggregates. HAVING becomes a filter on the result, out[out.orders >= 2], and ORDER BY is sort_values("revenue", ascending=False). Using size counts rows like COUNT(*); count would skip nulls like COUNT(column).`,
    avoid: ["Filtering after aggregation when it should be WHERE", "apply for simple sums"],
  },
  terms: [["Split-apply-combine", "Group rows, compute per group, combine results."], ["Named aggregation", "agg(new=(col, func))."], ["size vs count", "Rows per group vs non-null values per column."]],
  sources: [S.gb],
});
Q({ id: "py2-pdg-1", d: 1, secs: 45, prompt: QDF + "what is `df.groupby('city')['amount'].sum()['Delhi']`?", answer: 1400, tol: 0.5, explain: "400 + 300 + 700.", py: DF + "answer = int(df.groupby('city')['amount'].sum()['Delhi'])", packages: PD });
Q({ id: "py2-pdg-2", d: 2, secs: 60, prompt: QDF + "paid orders only, grouped by city: which city has the highest average order value? (Delhi=1, Mumbai=2, Pune=3)", answer: 2, tol: 0.5, explain: "Paid AOV: Delhi (400 + 300)/2 = 350, Mumbai (900 + 120)/2 = 510, Pune (250 + 50)/2 = 150.", py: DF + "a = df[df.status == 'paid'].groupby('city')['amount'].mean()\nanswer = ['Delhi', 'Mumbai', 'Pune'].index(a.idxmax()) + 1", packages: PD });
Q({ id: "py2-pdg-3", d: 2, secs: 45, prompt: QDF + "how many customers have total spend of at least 500 (HAVING SUM(amount) >= 500)?", answer: 3, tol: 0.5, explain: "zoya 1020, john 700, ravi 700; asha 450 doesn't qualify.", py: DF + "s = df.groupby('cust')['amount'].sum()\nanswer = int((s >= 500).sum())", packages: PD });
Q({ id: "py2-pdg-4", d: 2, secs: 45, prompt: "`d = pd.DataFrame({'k': ['a', 'a', 'b'], 'v': [1, None, 3]})`. What is `d.groupby('k').size()['a'] - d.groupby('k')['v'].count()['a']`?", answer: 1, tol: 0.5, explain: "size counts 2 rows; count skips the NaN: 1.", py: "import pandas as pd\nd = pd.DataFrame({'k': ['a', 'a', 'b'], 'v': [1, None, 3]})\nanswer = int(d.groupby('k').size()['a'] - d.groupby('k')['v'].count()['a'])", packages: PD });
Q({ id: "py2-pdg-5", d: 2, secs: 45, prompt: QDF + "`df.groupby(['city', 'status']).size().unstack(fill_value=0)` — what is the value for (Pune, refund)?", answer: 1, tol: 0.5, explain: "Order 3 is Pune refund.", py: DF + "t = df.groupby(['city', 'status']).size().unstack(fill_value=0)\nanswer = int(t.loc['Pune', 'refund'])", packages: PD });
C("py2-pdg-c1", "Named aggregation", "df.groupby('k', as_index=False).agg(total=('amt', 'sum'), n=('id', 'size'))");
C("py2-pdg-c2", "SQL → pandas", "WHERE=filter · GROUP BY=groupby · HAVING=filter result · ORDER BY=sort_values");

// ───────────────────────── groupby transform / filter ─────────────────────────

L("py2-pd-transform", M, "groupby transform, filter and within-group ranking", "Adding group statistics back to rows: share of group, z-scores, cumulative counts, top-N per group and filtering whole groups.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "For each order, what share of its city's revenue does it represent, and is it the city's largest? That's SQL window functions — in pandas, transform.",
  intuition: `
**The situation.** Questions phrased "for each row, compared with its group…" (share of total, difference from group average, rank within group, running count) are SQL window-function questions.

**The idea.** \`groupby(...)[col].transform(func)\` computes a per-group value and **broadcasts it back to every row of that group**, returning a result aligned with the original index, so you can assign it as a new column. Related tools:

- \`cumsum\`, \`cumcount\`, \`rank\`, \`shift\` on a groupby: running values within each group.
- \`filter(lambda g: ...)\`: keep only groups meeting a condition (returns original rows).
- \`head(n)\` after sorting: top-N per group.
`,
  maths: `
**In one breath.** \`transform("sum"/"mean"/...)\` = window aggregate over a partition; \`groupby().rank()\` = RANK() OVER (PARTITION BY); \`cumcount\` = ROW_NUMBER() − 1; \`filter\` = keep whole groups.

\`\`\`python
df["city_rev"] = df.groupby("city")["amount"].transform("sum")
df["share"] = (df["amount"] / df["city_rev"]).round(3)
df["vs_avg"] = df["amount"] - df.groupby("city")["amount"].transform("mean")
df["rank_in_city"] = df.groupby("city")["amount"].rank(ascending=False, method="first")
print(df.loc[df.rank_in_city == 1, ["city", "order_id"]].values.tolist())
# [['Pune', 1], ['Mumbai', 4], ['Delhi', 7]]

df["nth_order"] = df.sort_values("order_id").groupby("cust").cumcount() + 1
df["running_spend"] = df.sort_values("order_id").groupby("cust")["amount"].cumsum()

top2 = df.sort_values("amount", ascending=False).groupby("city").head(2)
print(len(top2))                             # 6 (2 per city, Mumbai has exactly 2)

loyal = df.groupby("cust").filter(lambda g: len(g) >= 2)
print(sorted(loyal["cust"].unique()))        # ['asha', 'ravi', 'zoya']

z = df.groupby("city")["amount"].transform(lambda x: (x - x.mean()) / x.std())
df["prev_amount"] = df.sort_values("order_id").groupby("cust")["amount"].shift(1)
\`\`\`

| SQL window | pandas |
|---|---|
| SUM(x) OVER (PARTITION BY g) | \`groupby(g)[x].transform("sum")\` |
| ROW_NUMBER() OVER (PARTITION BY g ORDER BY t) | \`sort_values(t).groupby(g).cumcount() + 1\` |
| RANK() OVER (… ORDER BY x DESC) | \`groupby(g)[x].rank(method="min", ascending=False)\` |
| LAG(x) OVER (… ORDER BY t) | \`sort_values(t).groupby(g)[x].shift(1)\` |
| running total | \`groupby(g)[x].cumsum()\` |
`,
  practice: `
**Pattern recognition.** "Share of", "relative to group average", "first/latest per group", "top N per group", "nth purchase", "days since previous order": transform, rank, cumcount, shift.

**Performance.** String functions in transform (\`"sum"\`, \`"mean"\`) use fast built-ins; lambdas run per group in Python.
`,
  traps: [
    { trap: "`groupby('city')['amount'].sum()` can be assigned as a new column directly.", why: "It has one row per city, not per order; assignment aligns on index and gives NaN. Use transform('sum')." },
    { trap: "cumcount/cumsum within groups follow time order automatically.", why: "They follow the current row order; sort by time first." },
  ],
  say: {
    prompt: "How do you compute each order's share of its city's revenue and the top 2 orders per city in pandas?",
    secs: 45,
    check: ["transform('sum') broadcasts group totals to rows", "share = amount / group total", "Top-N per group: sort then groupby().head(n), or rank within group", "Map to SQL window functions (PARTITION BY)", "Sort before cumcount/shift/cumsum"],
    followups: [
      { q: "How do you keep only groups with at least 5 rows?", a: "`df.groupby('k').filter(lambda g: len(g) >= 5)`, or faster: `df[df.groupby('k')['k'].transform('size') >= 5]`." },
      { q: "How do you compute days since a customer's previous order?", a: "Sort by date, then `df.groupby('cust')['date'].diff().dt.days`." },
      { q: "What's the difference between agg and transform?", a: "agg returns one row per group; transform returns a value for every original row, aligned to the original index." },
    ],
    answer: `I'd add the city total to every row with df.groupby("city")["amount"].transform("sum"), which returns a Series aligned with the original rows, and divide amount by it to get the share; that's SUM() OVER (PARTITION BY city). For the top two orders per city I sort by amount descending and call groupby("city").head(2), or compute groupby("city")["amount"].rank(method="first", ascending=False) and keep ranks up to 2. For running counts or previous values, cumcount, cumsum and shift work the same way after sorting by time.`,
    avoid: ["Merging an aggregated table back when transform does it in one line"],
  },
  terms: [["transform", "Group computation returned at the original row level."], ["cumcount", "Position of each row within its group (0-based)."], ["groupby filter", "Keep or drop entire groups."]],
  sources: [S.gb],
});
Q({ id: "py2-pdt-1", d: 2, secs: 60, prompt: QDF + "what share (3 decimals) of Mumbai's revenue is order 4?", answer: 0.882, tol: 0.002, explain: "900 / (900 + 120) = 0.882.", py: DF + "df['share'] = df.amount / df.groupby('city')['amount'].transform('sum')\nanswer = float(df.loc[df.order_id == 4, 'share'].iloc[0])", packages: PD });
Q({ id: "py2-pdt-2", d: 2, secs: 45, prompt: QDF + "how many rows does `df.sort_values('amount', ascending=False).groupby('city').head(2)` have?", answer: 6, tol: 0.5, explain: "2 per city × 3 cities.", py: DF + "answer = len(df.sort_values('amount', ascending=False).groupby('city').head(2))", packages: PD });
Q({ id: "py2-pdt-3", d: 2, secs: 45, prompt: QDF + "with `df.sort_values('order_id').groupby('cust').cumcount() + 1`, what is asha's order number for order_id 6?", answer: 3, tol: 0.5, explain: "asha's orders are 1, 3, 6: order 6 is her 3rd.", py: DF + "df['n'] = df.sort_values('order_id').groupby('cust').cumcount() + 1\nanswer = int(df.loc[df.order_id == 6, 'n'].iloc[0])", packages: PD });
Q({ id: "py2-pdt-4", d: 2, secs: 45, prompt: QDF + "how many rows remain after `df.groupby('cust').filter(lambda g: len(g) >= 2)`?", answer: 7, tol: 0.5, explain: "john (1 order) is dropped: 8 − 1 = 7.", py: DF + "answer = len(df.groupby('cust').filter(lambda g: len(g) >= 2))", packages: PD });
Q({ id: "py2-pdt-5", d: 2, secs: 60, prompt: QDF + "previous order amount per customer via `shift(1)` after sorting by order_id. What is the previous amount for order 6?", answer: 150, tol: 0.5, explain: "asha's order before 6 is order 3 (150).", py: DF + "d = df.sort_values('order_id')\nd['prev'] = d.groupby('cust')['amount'].shift(1)\nanswer = int(d.loc[d.order_id == 6, 'prev'].iloc[0])", packages: PD });
C("py2-pdt-c1", "Window SUM in pandas", "df.groupby(g)[x].transform('sum')");
C("py2-pdt-c2", "Top-N per group", "df.sort_values(x, ascending=False).groupby(g).head(n)");

// ───────────────────────── merge and concat ─────────────────────────

L("py2-pd-merge", M, "merge, join and concat", "SQL joins in pandas, key validation, row explosions from duplicate keys, anti-joins and stacking frames.", {
  kind: "concept", mins: 30, mathsLabel: "Code",
  hook: "You left-join 10,000 orders to a customer table and get 10,450 rows. What happened, and how would you have caught it?",
  intuition: `
**The situation.** Joining tables is where silent data bugs are born: duplicated keys multiply rows, mismatched dtypes drop matches, and NaNs appear from unmatched keys.

**The idea.** \`pd.merge(left, right, on=key, how=...)\` is SQL JOIN:

- \`inner\`: only keys in both. \`left\`: all left rows, NaN where unmatched. \`right\`, \`outer\` (full), \`cross\` (every pair).
- If a key appears **k times on the left and m times on the right**, the result has k × m rows for that key. A "lookup" table with an accidental duplicate key inflates your fact table.
- \`validate="many_to_one"\` raises if the right side isn't unique; \`indicator=True\` adds a \`_merge\` column telling where each row came from.

\`pd.concat([a, b])\` stacks frames vertically (same columns) or side by side (\`axis=1\`, aligned on index).
`,
  maths: `
**In one breath.** \`merge(on, how, validate, indicator, suffixes)\`; rows per key = k × m; anti-join via indicator; concat to stack; \`left_on/right_on\` for different names.

\`\`\`python
custs = pd.DataFrame({"cust": ["asha", "ravi", "zoya", "meera"],
                      "segment": ["gold", "silver", "gold", "silver"]})
m = df.merge(custs, on="cust", how="left", validate="many_to_one")
print(len(m), m["segment"].isna().sum())          # 8 1   (john has no segment)

print(len(df.merge(custs, on="cust", how="inner")))   # 7
print(len(df.merge(custs, on="cust", how="outer")))   # 9   (meera has no orders)

dup = pd.concat([custs, pd.DataFrame({"cust": ["asha"], "segment": ["vip"]})])
print(len(df.merge(dup, on="cust")))              # 10: asha's 3 orders x 2 rows
# df.merge(dup, on="cust", validate="many_to_one")  -> MergeError

chk = custs.merge(df[["cust"]].drop_duplicates(), on="cust", how="left", indicator=True)
no_orders = chk.loc[chk["_merge"] == "left_only", "cust"].tolist()
print(no_orders)                                   # ['meera']   anti-join
print(custs[~custs["cust"].isin(df["cust"])].cust.tolist())   # same, simpler

jan = df.iloc[:4].assign(month="Jan"); feb = df.iloc[4:].assign(month="Feb")
both = pd.concat([jan, feb], ignore_index=True)    # stack rows
print(both.shape)                                  # (8, 6)
\`\`\`

**Before merging, check:** key uniqueness on the side that should be unique (\`custs.cust.is_unique\`), dtypes match (int vs string IDs never match), whitespace/case in string keys, and row counts after the merge.
`,
  practice: `
**Join checklist.** Decide the expected relationship (one-to-one, many-to-one); pass \`validate\`; compare row counts before/after; check NaNs in joined columns; use \`indicator=True\` while debugging.

**concat in loops.** Collect DataFrames in a list and \`pd.concat\` once; concatenating inside a loop copies everything each time.
`,
  traps: [
    { trap: "A left join never changes the number of left rows.", why: "If the right key has duplicates, matching left rows are repeated (k × m). Validate uniqueness." },
    { trap: "Joining customer_id 101 (int) to '101' (string) works.", why: "Different dtypes don't match (or raise). Align dtypes first." },
    { trap: "`pd.concat` inside a for-loop is fine.", why: "Each concat copies all previous data: quadratic. Append frames to a list and concat once." },
  ],
  say: {
    prompt: "Your left join produced more rows than the left table. Explain why and how you'd prevent it.",
    secs: 45,
    check: ["Duplicate keys on the right side multiply rows (k × m)", "Check uniqueness / validate='many_to_one'", "Compare row counts and inspect with indicator=True", "Fix: dedupe/aggregate the right table first", "Also check key dtypes/whitespace causing NaNs"],
    followups: [
      { q: "How do you find rows in A that have no match in B (anti-join)?", a: "`A[~A.key.isin(B.key)]`, or merge with how='left', indicator=True and keep _merge == 'left_only'." },
      { q: "merge vs join vs concat?", a: "merge joins on columns (SQL-style); join is a shortcut joining on the index; concat stacks frames along an axis without matching on keys (except index alignment for axis=1)." },
      { q: "What does suffixes do?", a: "Renames overlapping non-key columns from each side, default ('_x', '_y')." },
    ],
    answer: `A left join keeps every left row, but if a key appears more than once in the right table, each matching left row is repeated once per match, so row counts multiply: k times m for that key. I'd prevent it by checking that the lookup table's key is unique, passing validate="many_to_one" so pandas raises a MergeError if it isn't, and comparing row counts before and after. If duplicates are legitimate, I'd aggregate or deduplicate the right table first. While debugging I use indicator=True to see unmatched rows, and I check that key dtypes and string formatting match.`,
    avoid: ["“Left joins can't add rows”"],
  },
  terms: [["Join cardinality", "one-to-one, many-to-one, many-to-many."], ["validate", "merge argument that checks key uniqueness."], ["Anti-join", "Rows in A with no match in B."]],
  sources: [S.merge],
});
Q({ id: "py2-pdm-1", d: 1, secs: 45, prompt: QDF + "and `custs` with cust ['asha', 'ravi', 'zoya', 'meera'] (unique). How many rows does an inner merge on cust return?", answer: 7, tol: 0.5, explain: "All orders except john's.", py: DF + "custs = pd.DataFrame({'cust': ['asha', 'ravi', 'zoya', 'meera'], 'seg': list('gsgs')})\nanswer = len(df.merge(custs, on='cust', how='inner'))", packages: PD });
Q({ id: "py2-pdm-2", d: 1, secs: 45, prompt: "Same tables. How many rows does an outer merge return?", answer: 9, tol: 0.5, explain: "8 orders (john unmatched) + meera with no orders.", py: DF + "custs = pd.DataFrame({'cust': ['asha', 'ravi', 'zoya', 'meera'], 'seg': list('gsgs')})\nanswer = len(df.merge(custs, on='cust', how='outer'))", packages: PD });
Q({ id: "py2-pdm-3", d: 2, secs: 60, prompt: "If `custs` accidentally lists 'asha' twice, how many rows does `df.merge(custs, on='cust', how='left')` return?", answer: 11, tol: 0.5, explain: "asha's 3 orders each match 2 rows: 8 + 3 = 11.", py: DF + "custs = pd.DataFrame({'cust': ['asha', 'ravi', 'zoya', 'meera', 'asha'], 'seg': list('gsgsv')})\nanswer = len(df.merge(custs, on='cust', how='left'))", packages: PD });
Q({ id: "py2-pdm-4", d: 2, secs: 45, prompt: "`a = pd.DataFrame({'id': [1, 2, 3]})`, `b = pd.DataFrame({'id': ['1', '2']})`. How many rows match in `a.merge(b, on='id')` if you first convert with `b['id'] = b['id'].astype(int)`?", answer: 2, tol: 0.5, explain: "After aligning dtypes, ids 1 and 2 match.", py: "import pandas as pd\na = pd.DataFrame({'id': [1, 2, 3]}); b = pd.DataFrame({'id': ['1', '2']})\nb['id'] = b['id'].astype(int)\nanswer = len(a.merge(b, on='id'))", packages: PD });
Q({ id: "py2-pdm-5", d: 1, secs: 30, prompt: "`pd.concat([df1, df2], ignore_index=True)` with 5 and 3 rows. What is the last index label?", answer: 7, tol: 0.5, explain: "ignore_index renumbers 0..7.", py: "import pandas as pd\nd = pd.concat([pd.DataFrame({'a': range(5)}), pd.DataFrame({'a': range(3)})], ignore_index=True)\nanswer = int(d.index[-1])", packages: PD });
C("py2-pdm-c1", "Safe lookup join", "df.merge(dim, on='k', how='left', validate='many_to_one'); compare row counts.");
C("py2-pdm-c2", "Anti-join", "A[~A.k.isin(B.k)] or merge(indicator=True) → _merge == 'left_only'.");
