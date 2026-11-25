/**
 * v2 Python, part G: pandas (2 of 2) — reshaping, window functions, dates, strings, missing data,
 * apply vs vectorisation, categoricals and memory, OA patterns, interview. Fixed ids (py2-*);
 * answers recomputed in Pyodide with pandas.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("python");
const M = "pandas";
const src = (label: string, url: string) => ({ label, url, checked: CHECKED });
const S = {
  reshape: src("pandas user guide: reshaping and pivot tables", "https://pandas.pydata.org/docs/user_guide/reshaping.html"),
  window: src("pandas user guide: windowing operations", "https://pandas.pydata.org/docs/user_guide/window.html"),
  ts: src("pandas user guide: time series / date functionality", "https://pandas.pydata.org/docs/user_guide/timeseries.html"),
  text: src("pandas user guide: working with text data", "https://pandas.pydata.org/docs/user_guide/text.html"),
  na: src("pandas user guide: working with missing data", "https://pandas.pydata.org/docs/user_guide/missing_data.html"),
  basics: src("pandas user guide: essential basic functionality (function application)", "https://pandas.pydata.org/docs/user_guide/basics.html"),
  perf: src("pandas user guide: enhancing performance", "https://pandas.pydata.org/docs/user_guide/enhancingperf.html"),
  cat: src("pandas user guide: categorical data", "https://pandas.pydata.org/docs/user_guide/categorical.html"),
  scale: src("pandas user guide: scaling to large datasets", "https://pandas.pydata.org/docs/user_guide/scale.html"),
  gb: src("pandas user guide: group by (split-apply-combine)", "https://pandas.pydata.org/docs/user_guide/groupby.html"),
};
const PD = ["pandas"];
const PDN = ["pandas", "numpy"];
const DF = `import pandas as pd
df = pd.DataFrame({
    "order_id": [1, 2, 3, 4, 5, 6, 7, 8],
    "cust": ["asha", "ravi", "asha", "zoya", "ravi", "asha", "john", "zoya"],
    "city": ["Pune", "Delhi", "Pune", "Mumbai", "Delhi", "Pune", "Delhi", "Mumbai"],
    "amount": [250, 400, 150, 900, 300, 50, 700, 120],
    "status": ["paid", "paid", "refund", "paid", "paid", "paid", "refund", "paid"],
    "date": pd.to_datetime(["2025-01-03", "2025-01-05", "2025-01-20", "2025-02-02",
                            "2025-02-14", "2025-02-28", "2025-03-01", "2025-03-15"]),
})
`;
const DATA_NOTE = `
The examples use the module's orders table with a date column added:

\`\`\`python
import pandas as pd
df = pd.DataFrame({
    "order_id": [1, 2, 3, 4, 5, 6, 7, 8],
    "cust":   ["asha", "ravi", "asha", "zoya", "ravi", "asha", "john", "zoya"],
    "city":   ["Pune", "Delhi", "Pune", "Mumbai", "Delhi", "Pune", "Delhi", "Mumbai"],
    "amount": [250, 400, 150, 900, 300, 50, 700, 120],
    "status": ["paid", "paid", "refund", "paid", "paid", "paid", "refund", "paid"],
    "date":   pd.to_datetime(["2025-01-03", "2025-01-05", "2025-01-20", "2025-02-02",
                              "2025-02-14", "2025-02-28", "2025-03-01", "2025-03-15"]),
})
\`\`\`
`;
const QDF = "Using the module's dated orders table `df` (8 orders Jan–Mar 2025: order_id, cust, city, amount, status, date), ";
const DAILY = "import pandas as pd\ns = pd.Series([10, 12, 9, 15, 20, 18, 25], index=pd.date_range('2025-01-01', periods=7, freq='D'))\n";
const QDAILY = "`s = pd.Series([10, 12, 9, 15, 20, 18, 25])` indexed by 7 consecutive days. ";

// ───────────────────────── Reshaping ─────────────────────────

L("py2-pd-reshape", M, "Reshaping: pivot, pivot_table, melt, stack and crosstab", "Long vs wide data, pivoting with and without aggregation, melting back, MultiIndex stack/unstack and frequency tables.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "The interviewer wants a city × month revenue grid, then asks you to turn it back into one row per city-month for a chart library. Two calls — which ones?",
  intuition: `
**The situation.** Reports want **wide** tables (one row per city, one column per month); plotting libraries, SQL tables and models want **long** tables (one row per observation). OA questions often hide a reshape inside "build a table showing…".

**The idea.**

- **Long → wide:** \`pivot\` (no aggregation, keys must be unique) or \`pivot_table\` (aggregates duplicates with \`aggfunc\`, can fill gaps and add totals).
- **Wide → long:** \`melt(id_vars=..., var_name=..., value_name=...)\`.
- **MultiIndex ↔ columns:** \`unstack()\` moves the innermost row level into columns; \`stack()\` does the reverse. \`groupby([a, b]).agg().unstack()\` is the same grid as a pivot_table.
- **Counts of two categoricals:** \`pd.crosstab(a, b)\`, optionally \`normalize="index"\` for row shares.
${DATA_NOTE}`,
  maths: `
**In one breath.** \`pivot_table(index, columns, values, aggfunc, fill_value, margins)\`; \`melt(id_vars, var_name, value_name)\`; \`unstack(fill_value=0)\` / \`stack()\`; \`crosstab(a, b, normalize=)\`.

\`\`\`python
df["month"] = df["date"].dt.to_period("M")
wide = df.pivot_table(index="city", columns="month", values="amount",
                      aggfunc="sum", fill_value=0)
print(wide)
# month   2025-01  2025-02  2025-03
# city
# Delhi       400      300      700
# Mumbai        0      900      120
# Pune        400       50        0

df.pivot(index="city", columns="month", values="amount")
# ValueError: Index contains duplicate entries, cannot reshape   (Pune has 2 Jan orders)

long = wide.reset_index().melt(id_vars="city", var_name="month", value_name="rev")
print(long.shape)                     # (9, 3): 3 cities x 3 months

print(pd.crosstab(df["city"], df["status"]))
# status  paid  refund
# Delhi      2       1
# Mumbai     2       0
# Pune       2       1
print(pd.crosstab(df["city"], df["status"], normalize="index").round(2))   # row shares

s = df.groupby(["city", "status"])["amount"].sum()     # MultiIndex Series, 5 rows
grid = s.unstack(fill_value=0)                          # cities x statuses
print(grid.loc["Mumbai", "refund"])                     # 0 (filled)
print(grid.stack().shape)                               # (6,): back to long, all 6 cells
\`\`\`

**margins=True** adds an "All" row and column (grand total 2870 here).

**Cost.** All are O(n) passes plus a hash on the keys; the output grid has (#index values × #column values) cells, so a pivot on a high-cardinality column can explode memory.

**Gotchas.** Month names as strings sort alphabetically (Feb, Jan, Mar); use \`to_period("M")\` or an ordered categorical. After \`pivot_table\` the columns may be a MultiIndex if you pass several \`values\`; flatten with \`wide.columns = ["_".join(map(str, c)) for c in wide.columns]\`.
`,
  practice: `
**Pick the tool by the question.** "Grid of totals" → pivot_table. "Reverse a wide export" → melt. "Counts of A by B" → crosstab. You've already grouped by two keys → unstack.

**OA habit.** After any pivot, check \`shape\` and whether NaNs mean "no data" (fill with 0 for sums) or "unknown" (leave as NaN for averages).
`,
  traps: [
    { trap: "`pivot` and `pivot_table` are interchangeable.", why: "pivot does no aggregation and raises on duplicate index/column pairs; pivot_table aggregates (mean by default)." },
    { trap: "pivot_table sums by default.", why: "The default aggfunc is 'mean'. Pass aggfunc='sum' for revenue grids." },
    { trap: "Missing cells in a revenue pivot should stay NaN.", why: "For sums, no orders means 0 revenue; use fill_value=0. For averages, NaN is correct because there is nothing to average." },
  ],
  say: {
    prompt: "You have one row per order. Build a city by month revenue table, then explain how you'd get it back to long format.",
    secs: 45,
    check: ["Derive a month key (to_period or dt.month) so months sort correctly", "pivot_table with aggfunc='sum' and fill_value=0", "Why not pivot: duplicate city-month pairs", "melt with id_vars to go back to long", "groupby + unstack as the equivalent route"],
    followups: [
      { q: "What does margins=True add?", a: "An 'All' row and column with totals computed with the same aggfunc." },
      { q: "How do you get each city's share of each status?", a: "pd.crosstab(df.city, df.status, normalize='index'), or divide the grid by its row sums." },
      { q: "What does stack do to NaN cells?", a: "In older pandas it drops them by default; newer versions keep them. Use dropna() after stack or fill before, to be explicit." },
    ],
    answer: `I'd create a month key with df.date.dt.to_period("M") so months sort in time order, then call pivot_table with index="city", columns="month", values="amount", aggfunc="sum" and fill_value=0, because the default aggfunc is the mean and empty cells mean zero revenue. Plain pivot would fail here because Pune has two January orders and pivot can't aggregate. The same grid comes from groupby(["city", "month"]).amount.sum().unstack(fill_value=0). To go back to long format I'd reset_index and melt with id_vars="city", var_name="month", value_name="revenue", which gives one row per city-month.`,
    avoid: ["Using pivot on non-unique keys", "Forgetting that the pivot_table default is mean"],
  },
  terms: [["Long format", "One row per observation (key, variable, value)."], ["Wide format", "One row per entity, one column per variable."], ["unstack", "Move an index level into columns."], ["crosstab", "Frequency table of two (or more) factors."]],
  sources: [S.reshape],
});
Q({ id: "py2-pdr-1", d: 1, secs: 45, prompt: QDF + "`df.pivot_table(index='city', columns=df.date.dt.month, values='amount', aggfunc='sum', fill_value=0)`. What is the value for Pune in month 1?", answer: 400, tol: 0.5, explain: "Pune's January orders: 250 + 150.", py: DF + "w = df.pivot_table(index='city', columns=df.date.dt.month, values='amount', aggfunc='sum', fill_value=0)\nanswer = int(w.loc['Pune', 1])", packages: PD });
Q({ id: "py2-pdr-2", d: 1, secs: 30, prompt: QDF + "same call but with the default aggfunc. What is the value for Pune in month 1?", answer: 200, tol: 0.5, explain: "The default aggfunc is mean: (250 + 150) / 2.", py: DF + "w = df.pivot_table(index='city', columns=df.date.dt.month, values='amount')\nanswer = float(w.loc['Pune', 1])", packages: PD });
Q({ id: "py2-pdr-3", d: 2, secs: 45, prompt: "A wide table has 4 rows (one per store) and columns `store, Jan, Feb, Mar`. How many rows does `wide.melt(id_vars='store')` return?", answer: 12, tol: 0.5, explain: "4 stores × 3 month columns.", py: "import pandas as pd\nw = pd.DataFrame({'store': list('abcd'), 'Jan': [1, 2, 3, 4], 'Feb': [1, 2, 3, 4], 'Mar': [1, 2, 3, 4]})\nanswer = len(w.melt(id_vars='store'))", packages: PD });
Q({ id: "py2-pdr-4", d: 2, secs: 45, prompt: QDF + "`pd.crosstab(df.city, df.status, normalize='index')`. What is Delhi's refund share? (2 decimals)", answer: 0.33, tol: 0.01, explain: "Delhi has 3 orders, 1 refund.", py: DF + "t = pd.crosstab(df.city, df.status, normalize='index')\nanswer = round(float(t.loc['Delhi', 'refund']), 2)", packages: PD });
Q({ id: "py2-pdr-5", d: 2, secs: 45, prompt: QDF + "what happens with `df.pivot(index='city', columns=df.date.dt.month, values='amount')`?", options: ["Returns a 3×3 grid of sums", "Returns a 3×3 grid of means", "Raises ValueError because of duplicate city-month pairs", "Returns a long table"], answer: 2, explain: "Pune has two January orders and pivot cannot aggregate.", py: DF + "df['m'] = df.date.dt.month\ntry:\n    df.pivot(index='city', columns='m', values='amount')\n    answer = 0\nexcept ValueError:\n    answer = 2", packages: PD });
C("py2-pdr-c1", "Long ↔ wide", "Long → wide: pivot_table(index, columns, values, aggfunc='sum', fill_value=0). Wide → long: melt(id_vars).");
C("py2-pdr-c2", "pivot vs pivot_table", "pivot: no aggregation, unique keys only. pivot_table: aggregates (default mean).");

// ───────────────────────── Window functions ─────────────────────────

L("py2-pd-window", M, "Window functions: rolling, expanding, shift, diff, pct_change", "Moving averages, running totals and maxima, period-over-period change, time-based windows and doing all of it per group.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "Plot a 7-day moving average of daily revenue and flag days that grew more than 20% on the day before. Which three methods do you need?",
  intuition: `
**The situation.** Product and finance OAs ask for moving averages, week-over-week growth, running totals and "days since previous". These are SQL window frames (ROWS BETWEEN …, LAG) in pandas form.

**The idea.** Three families, all returning a Series aligned with the input:

- **Shift-based:** \`shift(k)\` moves values down k rows (LAG); \`diff(k)\` = x − x.shift(k); \`pct_change(k)\` = x / x.shift(k) − 1.
- **Rolling:** a fixed-size window that slides: \`rolling(3).mean()\` averages the current row and the 2 before. On a DatetimeIndex, \`rolling("7D")\` uses a time window instead of a row count.
- **Expanding / cumulative:** everything from the start up to the current row: \`cumsum\`, \`cummax\`, \`expanding().mean()\`.

\`ewm(span=…)\` gives an exponentially weighted average (recent rows weigh more).

Inside groups, put the window after a groupby: \`groupby("cust")["amount"].shift(1)\`, \`.cumsum()\`, or \`.transform(lambda x: x.rolling(2).mean())\`. **Sort by time first**: windows follow row order.
`,
  maths: `
**In one breath.** \`shift\`, \`diff\`, \`pct_change\` = LAG maths; \`rolling(n | "7D", min_periods)\` = sliding frame; \`cumsum/cummax/expanding\` = from-start frame; group them with groupby.

\`\`\`python
s = pd.Series([10, 12, 9, 15, 20, 18, 25],
              index=pd.date_range("2025-01-01", periods=7, freq="D"))
print(s.rolling(3).mean().round(2).tolist())
# [nan, nan, 10.33, 12.0, 14.67, 17.67, 21.0]     first full window at row 3
print(s.rolling(3, min_periods=1).mean().round(2).tolist())
# [10.0, 11.0, 10.33, 12.0, 14.67, 17.67, 21.0]
print(s.shift(1).tolist())        # [nan, 10.0, 12.0, 9.0, 15.0, 20.0, 18.0]
print(s.diff().tolist())          # [nan, 2.0, -3.0, 6.0, 5.0, -2.0, 7.0]
print(s.pct_change().round(3).tolist())
# [nan, 0.2, -0.25, 0.667, 0.333, -0.1, 0.389]
print(s.cumsum().tolist())        # [10, 22, 31, 46, 66, 84, 109]
print(s.expanding().max().tolist())   # [10.0, 12.0, 12.0, 15.0, 20.0, 20.0, 25.0]
print(s.rolling("3D").sum().tolist()) # [10.0, 22.0, 31.0, 36.0, 44.0, 53.0, 63.0]  time window
growth_days = s.index[s.pct_change() > 0.2]   # 4, 5 and 7 Jan (2 Jan is exactly 20%, not above)

# Per customer, in time order
d = df.sort_values("date")
d["gap_days"] = d.groupby("cust")["date"].diff().dt.days      # asha: NaN, 17, 39
d["prev_amt"] = d.groupby("cust")["amount"].shift(1)
d["run_spend"] = d.groupby("cust")["amount"].cumsum()
d["roll2"] = d.groupby("cust")["amount"].transform(lambda x: x.rolling(2, min_periods=1).mean())
\`\`\`

**Cost.** rolling sum/mean/count are O(n) (running updates); rolling median/quantile cost O(n log w); \`rolling().apply(f)\` calls Python per window, so avoid it for large n.

**Gotchas.** Row windows on gappy dates: \`rolling(7)\` means "7 rows", not "7 days"; with missing days use \`rolling("7D")\` or reindex to a full date range first. \`center=True\` uses future rows (leaks in forecasting). \`pct_change\` on zero gives inf.
`,
  practice: `
**Recipes.** 7-day moving average: \`s.rolling("7D").mean()\` on a daily DatetimeIndex. Week-over-week: resample to weekly, then \`pct_change()\`. Year-over-year on monthly data: \`pct_change(12)\`. Running max drawdown: \`s / s.cummax() - 1\`.

**Features for models.** Lagged and rolling features must only use the past: shift before rolling (\`x.shift(1).rolling(7).mean()\`) so the current row's target isn't inside its own feature.
`,
  traps: [
    { trap: "`rolling(7)` on daily data always means the last 7 days.", why: "It means the last 7 rows. If days are missing, the window spans more than 7 days; use rolling('7D') or fill the date range." },
    { trap: "`groupby('cust')['amount'].shift(1)` gives the previous order in time.", why: "It gives the previous row within the group in the current order. Sort by date first." },
    { trap: "A rolling mean of the target is a safe model feature.", why: "rolling includes the current row, so the feature contains the label. Shift by one first." },
  ],
  say: {
    prompt: "How would you compute a 7-day moving average and day-over-day growth of revenue in pandas, per store?",
    secs: 45,
    check: ["Aggregate to one row per store per day first (resample or groupby date)", "Sort by date; rolling('7D') or full date range so gaps don't distort", "pct_change (or diff / shift) for growth", "groupby(store) with transform/rolling so windows stay within a store", "min_periods and the NaN at the start; leakage if used as features"],
    followups: [
      { q: "What's the difference between rolling and expanding?", a: "rolling uses a fixed-size window that slides; expanding uses all rows from the start up to the current one." },
      { q: "How do you compute days since a customer's previous order?", a: "Sort by date, then groupby('cust')['date'].diff().dt.days." },
      { q: "Why do the first rows of rolling(3).mean() show NaN?", a: "min_periods defaults to the window size, so there aren't enough rows yet; set min_periods=1 to average what's available." },
    ],
    answer: `First I'd get one row per store per day by grouping on store and date and summing, then sort by date. For the moving average I'd use a time-based window, groupby("store")["rev"].transform(lambda x: x.rolling("7D").mean()) on a date index, or reindex each store to a full date range and use rolling(7), so missing days don't stretch the window. Growth is groupby("store")["rev"].pct_change(), which is revenue over the previous row minus one; diff gives the absolute change. The first rows are NaN because there's no previous value or full window; I'd set min_periods if partial windows are acceptable. If these become model features I'd shift by one first so they only use the past.`,
    avoid: ["Rolling across store boundaries", "Assuming row windows equal day windows"],
  },
  terms: [["shift", "Move values by k rows (LAG/LEAD)."], ["rolling", "Sliding window of n rows or a time span."], ["expanding", "Window from the first row to the current row."], ["min_periods", "Minimum observations needed to produce a value."]],
  sources: [S.window],
});
Q({ id: "py2-pdw-1", d: 1, secs: 45, prompt: QDAILY + "What is the last value of `s.rolling(3).mean()`? (2 decimals)", answer: 21, tol: 0.01, explain: "(20 + 18 + 25) / 3 = 21.", py: DAILY + "answer = round(float(s.rolling(3).mean().iloc[-1]), 2)", packages: PD });
Q({ id: "py2-pdw-2", d: 1, secs: 30, prompt: QDAILY + "How many NaN values are in `s.rolling(3).mean()`?", answer: 2, tol: 0.5, explain: "The first two rows don't have 3 observations (min_periods defaults to 3).", py: DAILY + "answer = int(s.rolling(3).mean().isna().sum())", packages: PD });
Q({ id: "py2-pdw-3", d: 2, secs: 45, prompt: QDAILY + "On how many days is `s.pct_change() > 0.2`?", answer: 3, tol: 0.5, explain: "Changes: 0.2, −0.25, 0.667, 0.333, −0.1, 0.389. 0.2 is not strictly greater, so 3 days.", py: DAILY + "answer = int((s.pct_change() > 0.2).sum())", packages: PD });
Q({ id: "py2-pdw-4", d: 2, secs: 60, prompt: QDF + "after sorting by date, `df.groupby('cust')['date'].diff().dt.days`. What is the gap for order 6 (asha's third order)?", answer: 39, tol: 0.5, explain: "asha ordered on 20 Jan and 28 Feb: 39 days.", py: DF + "d = df.sort_values('date')\nd['gap'] = d.groupby('cust')['date'].diff().dt.days\nanswer = int(d.loc[d.order_id == 6, 'gap'].iloc[0])", packages: PD });
Q({ id: "py2-pdw-5", d: 2, secs: 45, prompt: "`s = pd.Series([5, 3, 8], index=pd.to_datetime(['2025-01-01', '2025-01-02', '2025-01-05']))`. What is the last value of `s.rolling('3D').sum()`?", answer: 8, tol: 0.5, explain: "The 3-day window ending 5 Jan covers 3–5 Jan; only the 8 falls in it. rolling(3) would have summed 16.", py: "import pandas as pd\ns = pd.Series([5, 3, 8], index=pd.to_datetime(['2025-01-01', '2025-01-02', '2025-01-05']))\nanswer = float(s.rolling('3D').sum().iloc[-1])", packages: PD });
C("py2-pdw-c1", "LAG maths", "shift(k) = LAG; diff(k) = x − x.shift(k); pct_change(k) = x / x.shift(k) − 1.");
C("py2-pdw-c2", "Row vs time window", "rolling(7) = 7 rows; rolling('7D') = 7 days on a DatetimeIndex. Sort and groupby first.");

// ───────────────────────── Dates and time series ─────────────────────────

L("py2-pd-dates", M, "Dates and time series: to_datetime, .dt, resample, time zones", "Parsing messy dates, extracting parts, date filtering, resampling to weeks and months, offsets and time zones.", {
  kind: "concept", mins: 25, mathsLabel: "Code",
  hook: "'03/02/2025' — is that 3 February or 2 March? Your monthly revenue chart depends on the answer.",
  intuition: `
**The situation.** Real date columns arrive as strings in mixed formats, with junk values and time zones. Almost every DA question groups by week or month.

**The idea.**

- **Parse once, early:** \`pd.to_datetime(col, format=..., errors="coerce")\` turns strings into \`datetime64\`; bad values become \`NaT\` (missing time) instead of raising. Give an explicit \`format\` (or \`dayfirst=True\`) for ambiguous day/month strings.
- **The \`.dt\` accessor** pulls parts out of a datetime column: \`.dt.year\`, \`.dt.month\`, \`.dt.day_name()\`, \`.dt.to_period("M")\`, \`.dt.floor("h")\`, \`.dt.date\`.
- **Differences** of datetimes are **Timedeltas**: \`(end - start).dt.days\`, \`.dt.total_seconds()\`.
- **resample** is groupby for time: on a DatetimeIndex, \`resample("W")\`, \`"MS"\` (month start), \`"ME"\` (month end), \`"h"\`, then aggregate. Unlike groupby on the month number, it creates empty periods too.
- **Time zones:** \`tz_localize\` attaches a zone to naive times; \`tz_convert\` changes the zone of aware times.
${DATA_NOTE}`,
  maths: `
**In one breath.** \`to_datetime(format, errors="coerce", dayfirst)\`; \`.dt.<part>\`; Timedelta \`.dt.days\`; \`set_index(date).resample(rule).agg()\`; partial-string indexing \`.loc["2025-02"]\`; \`tz_localize\` then \`tz_convert\`.

\`\`\`python
raw = pd.Series(["2025-01-03", "not a date"])
print(pd.to_datetime(raw, errors="coerce").tolist())   # [Timestamp('2025-01-03'), NaT]
print(pd.to_datetime(pd.Series(["03/02/2025"]), format="%d/%m/%Y").iloc[0])   # 2025-02-03
print(pd.to_datetime(pd.Series(["03/02/2025"]), format="%m/%d/%Y").iloc[0])   # 2025-03-02

print(df["date"].dt.day_name().head(3).tolist())   # ['Friday', 'Sunday', 'Monday']
print(df.groupby(df["date"].dt.to_period("M"))["amount"].sum().tolist())   # [800, 1250, 820]

m = df.set_index("date")["amount"].resample("MS").sum()
print(m.tolist())                                  # [800, 1250, 820]  (1 Jan, 1 Feb, 1 Mar)
w = df.set_index("date")["amount"].resample("W").sum()   # weeks ending Sunday
print(len(w), w.head(3).tolist())                  # 11 [650, 0, 0]  empty weeks appear as 0

print((df["date"].max() - df["date"].min()).days)  # 71
print(df.set_index("date").loc["2025-02", "order_id"].tolist())   # [4, 5, 6]
print(df.loc[df["date"].between("2025-02-01", "2025-02-28"), "order_id"].tolist())   # [4, 5, 6]

utc = pd.Series(pd.to_datetime(["2025-03-30 01:30"])).dt.tz_localize("UTC")
print(utc.dt.tz_convert("Asia/Kolkata").iloc[0])   # 2025-03-30 07:00:00+05:30

print(pd.Timestamp("2025-01-31") + pd.DateOffset(months=1))   # 2025-02-28 (calendar-aware)
print(pd.Timestamp("2025-01-31") + pd.Timedelta(days=30))     # 2025-03-02 (fixed length)
print(pd.date_range("2025-01-01", "2025-01-31", freq="B").size)   # 23 business days
\`\`\`

**Cost.** Parsing with an explicit \`format\` is much faster than letting pandas infer each value. Datetime columns are 8 bytes per value; object strings of dates are far larger and can't be compared correctly.

**Gotchas.** \`between("2025-02-01", "2025-02-28")\` on timestamps with times excludes 28 Feb after midnight; use \`< "2025-03-01"\` for half-open ranges. \`dt.month\` loses the year (Jan 2024 and Jan 2025 merge); use \`to_period("M")\`. Comparing tz-aware with naive timestamps raises.
`,
  practice: `
**Order of operations.** Parse on read (\`parse_dates=\`) or right after; check \`isna()\` for NaT from coercion; store UTC, convert to local time only for reporting (IST for Indian business days).

**Weekly and monthly reports.** \`resample\` for a single series with a date index; \`groupby([pd.Grouper(key="date", freq="W"), "city"])\` when you also need other keys.
`,
  traps: [
    { trap: "`pd.to_datetime('03/02/2025')` returns 3 February.", why: "Without format or dayfirst=True pandas assumes month first: 2 March. Always pass the format for ambiguous data." },
    { trap: "Grouping by `dt.month` gives monthly revenue.", why: "It merges the same month across years. Use dt.to_period('M') or resample('MS')." },
    { trap: "Adding `Timedelta(days=30)` gives 'one month later'.", why: "Months vary in length; use DateOffset(months=1), which is calendar-aware (31 Jan + 1 month = 28 Feb)." },
  ],
  say: {
    prompt: "A date column has mixed formats and some junk. Walk me through cleaning it and producing weekly revenue in IST.",
    secs: 45,
    check: ["to_datetime with an explicit format (or dayfirst), errors='coerce'", "Count and inspect NaT rows rather than silently dropping", "tz_localize to the source zone, tz_convert to Asia/Kolkata", "set_index + resample('W') (or pd.Grouper) then sum", "Empty weeks show as 0; check week anchor (Sunday vs Monday)"],
    followups: [
      { q: "resample vs groupby(dt.to_period('W'))?", a: "Both bucket by week; resample needs a DatetimeIndex and fills missing periods, groupby only returns weeks that have data." },
      { q: "How do you make weeks start on Monday?", a: "The default 'W' (same as 'W-SUN') already buckets Monday–Sunday but labels each week by its Sunday; to label by Monday use dt.to_period('W').dt.start_time." },
      { q: "tz_localize vs tz_convert?", a: "tz_localize states which zone naive times are in; tz_convert re-expresses already-aware times in another zone." },
    ],
    answer: `I'd parse with pd.to_datetime using an explicit format, and if there are genuinely two formats, parse each subset with its own format and combine, passing errors="coerce" so junk becomes NaT. Then I'd count the NaTs and look at examples before deciding to drop them. If the times are UTC, I'd tz_localize("UTC") and tz_convert("Asia/Kolkata") so days and weeks break at Indian midnight. For weekly revenue I set the datetime as the index and call resample("W").sum(), or use groupby with pd.Grouper(key="date", freq="W") if I also need city; resample includes empty weeks as zero, which is what a chart wants.`,
    avoid: ["Leaving dates as strings", "Grouping by dt.month across years"],
  },
  terms: [["NaT", "Not-a-Time: missing datetime value."], ["resample", "Group by fixed time buckets on a DatetimeIndex."], ["Period", "A time span such as a month (2025-01)."], ["DateOffset", "Calendar-aware shift (months, business days)."]],
  sources: [S.ts],
});
Q({ id: "py2-pdd-1", d: 1, secs: 30, prompt: "`pd.to_datetime(pd.Series(['03/02/2025']), format='%d/%m/%Y').dt.month.iloc[0]`?", answer: 2, tol: 0.5, explain: "Day first: 3 February.", py: "import pandas as pd\nanswer = int(pd.to_datetime(pd.Series(['03/02/2025']), format='%d/%m/%Y').dt.month.iloc[0])", packages: PD });
Q({ id: "py2-pdd-2", d: 1, secs: 45, prompt: QDF + "what is February's revenue from `df.set_index('date')['amount'].resample('MS').sum()`?", answer: 1250, tol: 0.5, explain: "Orders 4, 5, 6: 900 + 300 + 50.", py: DF + "m = df.set_index('date')['amount'].resample('MS').sum()\nanswer = int(m.loc['2025-02-01'])", packages: PD });
Q({ id: "py2-pdd-3", d: 2, secs: 45, prompt: QDF + "how many rows does `df.set_index('date')['amount'].resample('W').sum()` have (weeks ending Sunday)?", answer: 11, tol: 0.5, explain: "From the week ending 5 Jan to the week ending 16 Mar: 11 weekly buckets, including empty weeks.", py: DF + "answer = len(df.set_index('date')['amount'].resample('W').sum())", packages: PD });
Q({ id: "py2-pdd-4", d: 1, secs: 30, prompt: "`(pd.Timestamp('2025-01-31') + pd.DateOffset(months=1)).day`?", answer: 28, tol: 0.5, explain: "Calendar-aware: clipped to the last day of February 2025.", py: "import pandas as pd\nanswer = (pd.Timestamp('2025-01-31') + pd.DateOffset(months=1)).day", packages: PD });
Q({ id: "py2-pdd-5", d: 2, secs: 45, prompt: "A naive timestamp `2025-03-30 20:00` is localised to UTC and converted to `Asia/Kolkata`. What hour is it in IST?", answer: 1, tol: 0.5, explain: "UTC + 5:30 = 01:30 on 31 March.", py: "import pandas as pd\nt = pd.Series(pd.to_datetime(['2025-03-30 20:00'])).dt.tz_localize('UTC').dt.tz_convert('Asia/Kolkata')\nanswer = int(t.dt.hour.iloc[0])", packages: PD });
C("py2-pdd-c1", "Parse dates safely", "pd.to_datetime(col, format='%d/%m/%Y', errors='coerce'); then check isna().");
C("py2-pdd-c2", "Monthly buckets", "df.set_index('date').resample('MS').sum() or groupby(dt.to_period('M')); never dt.month across years.");

// ───────────────────────── String methods ─────────────────────────

L("py2-pd-strings", M, "String methods with .str", "Cleaning text columns: strip, case, replace with regex, split and expand, extract with groups, contains, and multi-value cells.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "Customer names arrive as '  Asha Rao ', 'ravi KUMAR' and 'Zoya  Khan'. Normalise them and pull out first names in two lines, without a loop.",
  intuition: `
**The situation.** OA datasets are full of messy text: inconsistent case, stray spaces, currency symbols in numbers, IDs inside sentences, comma-separated tags.

**The idea.** \`Series.str\` exposes vectorised versions of Python string methods plus regex tools. Each call returns a new Series aligned with the original, and **missing values stay missing** instead of raising.

- Clean: \`strip\`, \`lower/upper/title\`, \`replace(pattern, repl, regex=True)\`.
- Test: \`contains\`, \`startswith\`, \`endswith\`, \`match\`, \`fullmatch\` (use \`na=False\` in filters).
- Split: \`split(sep)\` then \`.str[i]\` for one part, or \`expand=True\` for columns.
- Extract: \`extract(r"(group)")\` returns the first match of each capture group as columns; \`extractall\` returns every match.
- Multi-value cells: \`str.split(",").explode()\` for one row per value, or \`str.get_dummies(sep=",")\` for indicator columns.
`,
  maths: `
**In one breath.** Chain \`.str\` calls; regex for patterns; \`na=False\` in masks; \`extract\` with named groups for columns; \`explode\` for lists.

\`\`\`python
s = pd.Series(["  Asha Rao ", "ravi KUMAR", None, "Zoya  Khan"])
clean = s.str.strip().str.lower().str.replace(r"\\s+", " ", regex=True)
print(clean.tolist())                   # ['asha rao', 'ravi kumar', None/NaN, 'zoya khan']
print(clean.str.split(" ").str[0].tolist())       # ['asha', 'ravi', NaN, 'zoya']
print(clean.str.split(" ", expand=True).shape)    # (4, 2)
print(clean.str.contains("kh", na=False).tolist())   # [False, False, False, True]
print(clean.str.len().tolist())         # [8.0, 10.0, nan, 9.0]

e = pd.Series(["order #123 paid", "order #45 refund", "no id"])
print(e.str.extract(r"#(\\d+)")[0].tolist())       # ['123', '45', nan]
print(e.str.extract(r"#(?P<id>\\d+) (?P<status>\\w+)").columns.tolist())   # ['id', 'status']

tags = pd.Series(["a,b", "b", "a,c"])
print(tags.str.split(",").explode().value_counts().to_dict())   # {'a': 2, 'b': 2, 'c': 1}
print(tags.str.get_dummies(sep=",").sum().to_dict())             # {'a': 2, 'b': 2, 'c': 1}

money = pd.Series(["1,200", "₹350", "40"])
print(money.str.replace(r"[^\\d.]", "", regex=True).astype(float).sum())   # 1590.0
\`\`\`

**Cost.** \`.str\` methods are a loop in C or Python per element, so they are slower than numeric ops but far cleaner than \`apply\`; with the Arrow-backed string dtype (default in pandas 3) many are much faster. For repeated patterns on low-cardinality columns, clean the unique values and \`map\` back.

**Gotchas.** \`replace\` treats the pattern as a regex only with \`regex=True\`; "." and "$" then mean regex symbols. \`contains\` is also regex by default: pass \`regex=False\` for literal text like "c++". Extracted digits are strings; convert with \`astype(int)\` or \`pd.to_numeric(errors="coerce")\`.
`,
  practice: `
**Clean keys before joins.** \`strip().lower()\` on both sides of a string join key removes most "why didn't these match" bugs.

**Parse, then validate.** After extracting numbers or IDs, count NaNs: they show which rows didn't fit the pattern.
`,
  traps: [
    { trap: "`df[df.name.str.contains('kh')]` works when the column has missing values.", why: "contains returns NaN for missing values and a mask with NaN raises; pass na=False." },
    { trap: "`s.str.replace('.', '')` removes full stops.", why: "With regex=True '.' matches any character and wipes the string. Use regex=False for literal replacements." },
    { trap: "`str.extract` returns numbers.", why: "It returns strings (object/str dtype). Convert explicitly." },
  ],
  say: {
    prompt: "A 'tags' column holds comma-separated values like 'a,b'. How do you count how often each tag appears, and how do you clean a messy name column?",
    secs: 45,
    check: ["str.split(',') then explode then value_counts", "Alternative: str.get_dummies(sep=',').sum()", "strip / lower / replace(r'\\s+', ' ', regex=True)", "na=False in contains filters", "Missing values propagate; convert extracted strings to numbers"],
    followups: [
      { q: "How do you split 'first last' into two columns?", a: "df[['first', 'last']] = df.name.str.split(' ', n=1, expand=True)." },
      { q: "How do you pull a 6-digit pincode from an address?", a: "df.addr.str.extract(r'(\\d{6})')[0], then check NaNs for addresses without one." },
      { q: "extract vs extractall?", a: "extract returns the first match per row; extractall returns every match with an extra index level." },
    ],
    answer: `For tags I'd split on commas, which gives a list per row, explode it so each tag gets its own row, strip spaces, and call value_counts; str.get_dummies(sep=",") gives indicator columns if I need per-row flags. For names I'd chain str.strip(), str.lower() and str.replace(r"\\s+", " ", regex=True) to collapse repeated spaces. All .str methods keep missing values as missing, so in filters I pass na=False to contains, and anything I extract with a regex comes back as strings, which I convert with pd.to_numeric.`,
    avoid: ["Looping over rows with Python string methods", "Forgetting regex semantics in replace/contains"],
  },
  terms: [[".str accessor", "Vectorised string methods on a Series."], ["extract", "Regex capture groups into columns."], ["explode", "One row per element of list-like cells."]],
  sources: [S.text],
});
Q({ id: "py2-pdstr-1", d: 1, secs: 30, prompt: "`pd.Series(['a,b', 'b', 'a,c']).str.split(',').explode()` — how many rows?", answer: 5, tol: 0.5, explain: "2 + 1 + 2 values.", py: "import pandas as pd\nanswer = len(pd.Series(['a,b', 'b', 'a,c']).str.split(',').explode())", packages: PD });
Q({ id: "py2-pdstr-2", d: 1, secs: 45, prompt: "`pd.Series(['order #123 paid', 'order #45 refund', 'no id']).str.extract(r'#(\\d+)')[0].astype(float).sum()`?", answer: 168, tol: 0.5, explain: "123 + 45; the NaN is skipped by sum.", py: "import pandas as pd\nanswer = float(pd.Series(['order #123 paid', 'order #45 refund', 'no id']).str.extract(r'#(\\d+)')[0].astype(float).sum())", packages: PD });
Q({ id: "py2-pdstr-3", d: 2, secs: 45, prompt: "`pd.Series(['1,200', '₹350', '40']).str.replace(r'[^\\d.]', '', regex=True).astype(float).sum()`?", answer: 1590, tol: 0.5, explain: "Strip everything except digits and dots: 1200 + 350 + 40.", py: "import pandas as pd\nanswer = float(pd.Series(['1,200', '₹350', '40']).str.replace(r'[^\\d.]', '', regex=True).astype(float).sum())", packages: PD });
Q({ id: "py2-pdstr-4", d: 2, secs: 45, prompt: "`pd.Series(['a.b', 'cd']).str.replace('.', '', regex=True).str.len().sum()`?", answer: 0, tol: 0.5, explain: "As a regex '.' matches every character, so both strings become empty.", py: "import pandas as pd\nanswer = int(pd.Series(['a.b', 'cd']).str.replace('.', '', regex=True).str.len().sum())", packages: PD });
Q({ id: "py2-pdstr-5", d: 1, secs: 30, prompt: "`pd.Series(['  Asha ', 'asha', 'ASHA']).str.strip().str.lower().nunique()`?", answer: 1, tol: 0.5, explain: "All three normalise to 'asha'.", py: "import pandas as pd\nanswer = int(pd.Series(['  Asha ', 'asha', 'ASHA']).str.strip().str.lower().nunique())", packages: PD });
C("py2-pdstr-c1", "Count multi-value tags", "s.str.split(',').explode().str.strip().value_counts()");
C("py2-pdstr-c2", ".str safety", "contains(..., na=False); regex=False for literal text; extract returns strings.");

// ───────────────────────── Missing data ─────────────────────────

L("py2-pd-missing", M, "Missing data: detect, drop, fill", "NaN, None, NaT and pd.NA; how aggregations skip them; dropna options; fillna, ffill, interpolate and group-wise imputation; nullable dtypes.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "An income column is 30% missing. Do you drop the rows, fill with the mean, or something else — and what does `df.income.mean()` already do with the gaps?",
  intuition: `
**The situation.** Every take-home has missing values, and the interviewer wants to hear that you measured them, understood why they're missing, and chose a treatment on purpose.

**The idea.**

- **Markers.** \`NaN\` (float missing), \`None\` (object), \`NaT\` (datetime), \`pd.NA\` (nullable dtypes like \`Int64\`, \`boolean\`). \`isna()\` detects all of them; \`x == np.nan\` never does, because NaN is not equal to anything.
- **Aggregations skip missing values** by default (\`skipna=True\`): \`mean\` divides by the non-missing count; \`count\` counts non-missing; \`sum\` of all-missing is 0.
- **Drop:** \`dropna()\` (any missing in the row), \`how="all"\`, \`subset=[...]\`, \`thresh=k\` (keep rows with at least k non-missing).
- **Fill:** a constant, a statistic (\`median\`), forward/back fill for time series (\`ffill\`, \`bfill\`), \`interpolate\`, or a **group-wise** statistic via \`groupby().transform\`.
- **Nullable dtypes.** A plain int column with one NaN becomes float64; \`Int64\` keeps integers and uses \`<NA>\`.
`,
  maths: `
**In one breath.** \`isna().sum()\` / \`.mean()\` for counts and shares; aggregations skip NaN; \`dropna(how, subset, thresh)\`; \`fillna(value)\`, \`ffill()\`, \`interpolate()\`; \`groupby(k)[c].transform(lambda s: s.fillna(s.median()))\`; \`Int64\`.

\`\`\`python
import numpy as np
x = pd.DataFrame({"a": [1, np.nan, 3, np.nan],
                  "b": ["x", None, "y", "z"],
                  "c": [np.nan, np.nan, np.nan, 4]})
print(x.isna().sum().to_dict())            # {'a': 2, 'b': 1, 'c': 3}
print(x.isna().mean().round(2).to_dict())  # missing share per column
print(len(x.dropna()), len(x.dropna(how="all")), len(x.dropna(subset=["a"])), len(x.dropna(thresh=2)))
# 0 3 2 3
print(x["a"].mean(), x["a"].sum(), x["a"].count())   # 2.0 4.0 2   (NaN skipped)
print((x["a"] == np.nan).sum(), x["a"].isna().sum())  # 0 2   never compare with ==
print(x["a"].fillna(x["a"].median()).tolist())       # [1.0, 2.0, 3.0, 2.0]
print(x["a"].ffill().tolist())                        # [1.0, 1.0, 3.0, 3.0]
print(x["a"].interpolate().tolist())                  # [1.0, 2.0, 3.0, 3.0]

g = pd.DataFrame({"k": ["a", "a", "b", "b"], "v": [1, np.nan, 5, np.nan]})
g["v_f"] = g.groupby("k")["v"].transform(lambda s: s.fillna(s.mean()))
print(g["v_f"].tolist())                              # [1.0, 1.0, 5.0, 5.0]

print(pd.Series([1, None, 3]).dtype, pd.Series([1, None, 3], dtype="Int64").dtype)   # float64 Int64
print(pd.Series([np.nan, np.nan]).sum(), pd.Series([np.nan, np.nan]).mean())          # 0.0 nan
print(pd.Series(["a", None, "a"]).value_counts(dropna=False).to_dict())               # {'a': 2, nan: 1}
\`\`\`

**Cost.** Detection and filling are O(n). Group-wise fills with a lambda run Python per group; for big data compute \`transform("median")\` once and \`fillna\` with that Series.

**Gotchas.** \`value_counts\` and \`groupby\` drop NaN keys by default (\`dropna=False\` keeps them). \`fillna(0)\` on a column where missing means "unknown" biases means. Forward fill across groups leaks one entity's values into another: \`groupby(k).ffill()\`.
`,
  practice: `
**Say the reasoning.** (1) Measure: missing share per column and by segment. (2) Ask why: not collected, not applicable, or broken pipeline (missing not at random?). (3) Treat: drop if few and random; fill with median/group median for numeric; "Unknown" category for categoricals; ffill for slowly changing time series; add a \`was_missing\` indicator for models. (4) Fit imputers on training data only (scikit-learn \`SimpleImputer\` in a pipeline).
`,
  traps: [
    { trap: "`df[df.x == np.nan]` finds missing rows.", why: "NaN != NaN, so the mask is all False. Use isna()." },
    { trap: "`mean()` on a column with NaNs returns NaN.", why: "pandas skips NaN by default (skipna=True); it divides by the non-missing count. NumPy's np.mean on the raw array would return nan." },
    { trap: "Filling every gap with the global mean is a safe default.", why: "It shrinks variance, ignores group differences and hides informative missingness; consider median, group-wise fills and a missing indicator." },
  ],
  say: {
    prompt: "A column you need is 30% missing. How do you decide what to do?",
    secs: 45,
    check: ["Quantify: isna().mean(), by segment and over time", "Ask why it's missing (MCAR/MAR/MNAR, structural zeros)", "Options: drop, median/group fill, ffill for time series, 'Unknown' category", "Add a missing indicator for models", "Fit imputation on train only; note aggregations already skip NaN"],
    followups: [
      { q: "How does `count()` differ from `len()`?", a: "count skips missing values; len counts rows." },
      { q: "Why did my int column become float?", a: "NaN is a float, so NumPy-backed int columns are upcast; use the nullable Int64 dtype to keep integers." },
      { q: "How do you fill missing prices with each product's last known price?", a: "Sort by date, then df.groupby('product')['price'].ffill()." },
    ],
    answer: `First I'd measure it: the missing share overall, by segment and over time, because a sudden jump points to a pipeline problem rather than real gaps. Then I'd ask why it's missing; if missingness depends on the value itself, say high earners skipping income, any simple fill is biased. With 30% missing I wouldn't drop rows, since that loses data and can bias the sample. For a numeric feature I'd fill with the median, or the group median via groupby transform, and add a was_missing flag so a model can learn from the pattern; for a categorical I'd use an "Unknown" level. Any imputation statistics come from the training split only. I'd also remember that pandas aggregations already skip NaN, so a mean is over the observed values.`,
    avoid: ["Dropping 30% of rows without checking bias", "Comparing with == np.nan"],
  },
  terms: [["NaN / NaT / pd.NA", "Missing markers for floats, datetimes and nullable dtypes."], ["skipna", "Aggregations ignore missing values by default."], ["ffill", "Carry the last valid value forward."], ["Missing indicator", "Binary flag recording that a value was imputed."]],
  sources: [S.na],
});
Q({ id: "py2-pdna-1", d: 1, secs: 30, prompt: "`pd.Series([1, np.nan, 3, np.nan]).mean()`?", answer: 2, tol: 0.01, explain: "NaN is skipped: (1 + 3) / 2.", py: "import pandas as pd, numpy as np\nanswer = float(pd.Series([1, np.nan, 3, np.nan]).mean())", packages: PDN });
Q({ id: "py2-pdna-2", d: 1, secs: 30, prompt: "`s = pd.Series([1, np.nan, 3])`. What is `(s == np.nan).sum()`?", answer: 0, tol: 0.5, explain: "NaN never equals anything, including NaN.", py: "import pandas as pd, numpy as np\ns = pd.Series([1, np.nan, 3])\nanswer = int((s == np.nan).sum())", packages: PDN });
Q({ id: "py2-pdna-3", d: 2, secs: 45, prompt: "`x = pd.DataFrame({'a': [1, None, 3, None], 'b': ['x', None, 'y', 'z'], 'c': [None, None, None, 4]})`. How many rows does `x.dropna(thresh=2)` keep?", answer: 3, tol: 0.5, explain: "Rows 0 (a, b), 2 (a, b) and 3 (b, c) have at least 2 non-missing values; row 1 has none.", py: "import pandas as pd\nx = pd.DataFrame({'a': [1, None, 3, None], 'b': ['x', None, 'y', 'z'], 'c': [None, None, None, 4]})\nanswer = len(x.dropna(thresh=2))", packages: PD });
Q({ id: "py2-pdna-4", d: 2, secs: 45, prompt: "`pd.Series([1, np.nan, np.nan, 7]).interpolate()` — what is the value at position 2?", answer: 5, tol: 0.01, explain: "Linear between 1 and 7 over 3 steps: 1, 3, 5, 7.", py: "import pandas as pd, numpy as np\nanswer = float(pd.Series([1, np.nan, np.nan, 7]).interpolate().iloc[2])", packages: PDN });
Q({ id: "py2-pdna-5", d: 2, secs: 45, prompt: "`g = pd.DataFrame({'k': ['a', 'a', 'b', 'b'], 'v': [2, None, 6, None]})`. After filling v with each group's mean, what is the sum of v?", answer: 16, tol: 0.5, explain: "Group a fills with 2, group b with 6: 2 + 2 + 6 + 6.", py: "import pandas as pd\ng = pd.DataFrame({'k': ['a', 'a', 'b', 'b'], 'v': [2, None, 6, None]})\nanswer = float(g.groupby('k')['v'].transform(lambda s: s.fillna(s.mean())).sum())", packages: PD });
C("py2-pdna-c1", "Missing-data checklist", "Measure (isna().mean()) → why missing → drop / median / group fill / ffill / 'Unknown' → missing flag → fit on train only.");
C("py2-pdna-c2", "NaN semantics", "NaN != NaN; use isna(). Aggregations skip NaN; sum of all-NaN = 0, mean = NaN.");

// ───────────────────────── apply vs vectorisation ─────────────────────────

L("py2-pd-apply", M, "apply, map and vectorisation: performance", "What apply really does, when map is right, how to rewrite row-wise logic with np.where/np.select and groupby built-ins, and how to measure.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "Your `df.apply(f, axis=1)` takes 40 seconds on 2 million rows. The interviewer says 'make it under a second'. Where do you start?",
  intuition: `
**The situation.** Live-coding interviewers watch for \`apply(axis=1)\` because it reveals whether you know how pandas actually runs.

**The idea.** pandas is fast when the work happens inside NumPy's compiled loops over whole columns. \`apply(f, axis=1)\` instead builds a Series **for every row** and calls your Python function on it: interpreter overhead per row, plus object creation. Rough ladder from slowest to fastest:

1. \`iterrows\` / \`apply(axis=1)\`: Python per row, with a Series built each time.
2. A list comprehension over \`zip(df.a, df.b)\`: Python per row, no Series overhead (often 10–50× faster than apply).
3. Vectorised column expressions, \`np.where\`, \`np.select\`, \`.str\`, \`.dt\`, \`map(dict)\`, groupby built-ins: compiled loops, typically 100–1000× faster than apply.

**Where each tool fits.**

- \`Series.map(dict or Series)\`: value lookup, fast.
- \`Series.map(func)\`: element-wise Python function; fine for small data or genuinely complex logic.
- \`DataFrame.apply(func)\` (axis=0): per column; fine (few columns).
- \`groupby().agg("sum")\` vs \`agg(lambda s: ...)\`: string names use fast built-ins; lambdas call Python per group.
- \`pipe(f)\`: puts your own function into a method chain; not a speed tool.
`,
  maths: `
**In one breath.** Replace row-wise if/else with \`np.where\`/\`np.select\`; lookups with \`map(dict)\` or merge; group lambdas with built-in names or arithmetic on several built-ins; measure with \`%timeit\` or \`time.perf_counter\`.

\`\`\`python
import numpy as np, time
# Row-wise apply vs vectorised: same answer
slow = df.apply(lambda r: r["amount"] * 1.18 if r["status"] == "paid" else 0, axis=1)
fast = np.where(df["status"] == "paid", df["amount"] * 1.18, 0)
print(np.allclose(slow, fast), round(fast.sum(), 2))   # True 2383.6

tier = np.select([df.amount >= 500, df.amount >= 200], ["high", "mid"], default="low")
print(tier.tolist())   # ['mid', 'mid', 'low', 'high', 'mid', 'low', 'high', 'low']

# Group lambda vs built-ins
rng1 = df.groupby("city")["amount"].agg(lambda s: s.max() - s.min())
g = df.groupby("city")["amount"]
rng2 = g.max() - g.min()                      # two fast passes
print(rng2.to_dict())                         # {'Delhi': 400, 'Mumbai': 780, 'Pune': 200}

# Timing on 200,000 rows (one laptop run; ratios matter, not the exact numbers)
big = pd.DataFrame({"x": np.arange(200_000), "y": np.arange(200_000) % 7})
t = time.perf_counter(); big.apply(lambda r: r.x * 2 + r.y, axis=1); t_apply = time.perf_counter() - t
t = time.perf_counter(); [x * 2 + y for x, y in zip(big.x, big.y)]; t_list = time.perf_counter() - t
t = time.perf_counter(); big.x * 2 + big.y; t_vec = time.perf_counter() - t
# t_apply ≈ 2 s, t_list ≈ 0.03 s, t_vec ≈ 0.002 s  (vectorised ~1000x faster than apply)
\`\`\`

**Complexity.** All three are O(n); the difference is the constant: tens of nanoseconds per element in C versus microseconds per row in Python.

**When apply is fine.** Small frames, one-off exploration, or logic that genuinely can't be expressed with column operations (calling an external parser per row). Even then, \`map\` on a single column or a list comprehension beats \`apply(axis=1)\`.
`,
  practice: `
**Rewrite recipe.** (1) Write the row logic as conditions on whole columns. (2) Two outcomes → \`np.where\`; several → \`np.select\` or \`pd.cut\`. (3) Lookups → \`map(dict)\` or \`merge\`. (4) Per-group logic → \`transform("…")\` with built-ins. (5) Check equality with the slow version on a sample (\`np.allclose\` / \`equals\`). (6) If still slow: fewer columns, better dtypes (category, int32), or \`eval/query\` for big arithmetic expressions.
`,
  traps: [
    { trap: "`apply` is vectorised because it's a pandas method.", why: "apply calls your Python function once per row (axis=1) or group; it's a loop with extra overhead." },
    { trap: "`iterrows` is fine for updating values.", why: "It's the slowest option, returns copies (writes don't stick), and converts dtypes per row. Use vectorised assignment with .loc." },
    { trap: "`groupby().agg(lambda s: s.sum())` is as fast as `agg('sum')`.", why: "The string name dispatches to an optimised implementation; the lambda runs Python per group." },
  ],
  say: {
    prompt: "Why is df.apply(axis=1) slow, and how would you speed up row-wise business logic?",
    secs: 45,
    check: ["apply(axis=1) builds a Series per row and calls Python each time", "Vectorise: column arithmetic, np.where, np.select, pd.cut", "map(dict)/merge for lookups; built-in groupby aggregations", "Verify against the slow version on a sample", "Measure with timeit; mention dtypes/eval as further steps"],
    followups: [
      { q: "map vs apply on a Series?", a: "map takes a dict/Series (fast lookup) or a function applied element-wise; Series.apply also applies a function element-wise. For lookups, map with a dict is the idiom." },
      { q: "When would you still use apply?", a: "Small data, exploratory work, or per-row logic that calls something non-vectorisable; even then a list comprehension over zipped columns is usually faster." },
      { q: "What does pipe do?", a: "Calls a function with the DataFrame as its first argument, so custom steps fit in a method chain; it doesn't speed anything up." },
    ],
    answer: `apply with axis=1 isn't vectorised: for every row pandas builds a Series and calls my Python function, so the cost is interpreter overhead per row, microseconds each, which adds up to tens of seconds on millions of rows. I'd rewrite the logic as operations on whole columns: arithmetic directly, np.where for a two-way condition, np.select or pd.cut for several branches, map with a dict or a merge for lookups, and groupby built-ins like transform("sum") instead of lambdas. That runs in compiled loops and is typically a hundred to a thousand times faster. I'd check the new version matches the old one on a sample with np.allclose and time both.`,
    avoid: ["iterrows for updates", "Calling apply 'vectorised'"],
  },
  terms: [["Vectorisation", "Operating on whole arrays in compiled code instead of Python loops."], ["apply(axis=1)", "Python function called once per row."], ["np.select", "Multi-branch vectorised condition."], ["pipe", "Insert a function into a method chain."]],
  sources: [S.basics, S.perf],
});
Q({ id: "py2-pdap-1", d: 1, secs: 45, prompt: QDF + "total of `np.where(df.status == 'paid', df.amount * 1.18, 0)`? (2 decimals)", answer: 2383.6, tol: 0.01, explain: "Paid total 2020 × 1.18.", py: "import numpy as np\n" + DF + "answer = round(float(np.where(df.status == 'paid', df.amount * 1.18, 0).sum()), 2)", packages: PDN });
Q({ id: "py2-pdap-2", d: 2, secs: 45, prompt: QDF + "`np.select([df.amount >= 500, df.amount >= 200], ['high', 'mid'], default='low')`. How many 'mid'?", answer: 3, tol: 0.5, explain: "250, 400 and 300; 900 and 700 hit the first condition first.", py: "import numpy as np\n" + DF + "t = np.select([df.amount >= 500, df.amount >= 200], ['high', 'mid'], default='low')\nanswer = int((t == 'mid').sum())", packages: PDN });
Q({ id: "py2-pdap-3", d: 2, secs: 45, prompt: QDF + "`g = df.groupby('city')['amount']`; what is `(g.max() - g.min())['Mumbai']`?", answer: 780, tol: 0.5, explain: "900 − 120.", py: DF + "g = df.groupby('city')['amount']\nanswer = int((g.max() - g.min())['Mumbai'])", packages: PD });
Q({ id: "py2-pdap-4", d: 2, secs: 60, prompt: "On a 20,000-row DataFrame, `df.apply(lambda r: r.x * 2 + r.y, axis=1)` calls the Python lambda how many times? (Column arithmetic `df.x * 2 + df.y` calls no Python function per row.)", answer: 20000, tol: 0.5, explain: "apply(axis=1) builds a Series for every row and calls the lambda once per row; vectorised column arithmetic runs one compiled loop instead, which is why it is typically 10–100× faster.", py: "import pandas as pd, numpy as np\nbig = pd.DataFrame({'x': np.arange(20000), 'y': np.arange(20000) % 7})\nn = 0\ndef f(r):\n    global n\n    n += 1\n    return r.x * 2 + r.y\nbig.apply(f, axis=1)\nanswer = n", packages: PDN });
Q({ id: "py2-pdap-5", d: 1, secs: 30, prompt: "Which is the fastest way to turn a city column into zones using a dict `{'Pune': 'W', ...}`?", options: ["df.apply(lambda r: zones[r.city], axis=1)", "df.city.map(zones)", "for i, r in df.iterrows(): ...", "df.city.apply(lambda c: zones.get(c)) inside a loop"], answer: 1, explain: "map with a dict is a vectorised lookup.", py: DF + "zones = {'Pune': 'W', 'Mumbai': 'W', 'Delhi': 'N'}\nanswer = 1 if df.city.map(zones).tolist() == ['W', 'N', 'W', 'W', 'N', 'W', 'N', 'W'] else 0", packages: PD });
C("py2-pdap-c1", "Speed ladder", "iterrows / apply(axis=1) ≪ list comprehension over zip ≪ vectorised columns / np.where / map(dict) / groupby built-ins.");
C("py2-pdap-c2", "Rewrite row logic", "2 branches → np.where; many → np.select or pd.cut; lookups → map/merge; groups → transform('sum').");

// ───────────────────────── Categoricals and memory ─────────────────────────

L("py2-pd-category", M, "Categoricals, dtypes and memory", "How the category dtype stores codes, ordered categories, observed groups, downcasting numbers, and loading data that doesn't fit in RAM.", {
  kind: "concept", mins: 20, mathsLabel: "Code",
  hook: "A 1-million-row city column with three distinct values takes about 55 MB. One method call takes it to about 1 MB. Which one, and what can go wrong afterwards?",
  intuition: `
**The situation.** Take-homes with multi-GB CSVs crash notebooks. Interviewers ask "how would you reduce memory?" and expect dtypes, not "buy a bigger machine".

**The idea.**

- **category dtype** stores each distinct value once (the categories) and an integer **code** per row (int8 for up to 127 categories). Low-cardinality strings shrink by 10–50× and groupby/sort on them get faster.
- **Ordered categoricals** (\`CategoricalDtype([...], ordered=True)\`) sort and compare in your order: S < M < L.
- **Unused categories persist.** groupby on a categorical with \`observed=False\` returns rows for categories with no data; \`observed=True\` returns only present ones.
- **Numeric downcasting.** int64 → int32/int16/int8 and float64 → float32 when ranges allow: \`pd.to_numeric(s, downcast="integer")\`.
- **Out-of-core.** Read only needed columns (\`usecols\`), set \`dtype=\` on read, process in \`chunksize\` pieces, or switch to Parquet / a columnar engine.
`,
  maths: `
**In one breath.** \`astype("category")\`, \`.cat.categories\`, \`.cat.codes\`; ordered dtype; \`observed=True\`; \`memory_usage(deep=True)\`; \`downcast\`; \`read_csv(usecols, dtype, chunksize)\`.

\`\`\`python
import numpy as np
s = pd.Series(np.random.default_rng(0).choice(["Pune", "Delhi", "Mumbai"], 1_000_000))
print(s.memory_usage(deep=True) // 1e6)                     # about 55-60 (MB) as strings
c = s.astype("category")
print(c.memory_usage(deep=True) // 1e6)                     # 1.0 (MB)
print(c.cat.categories.tolist(), c.cat.codes.dtype)         # ['Delhi', 'Mumbai', 'Pune'] int8

size = pd.Series(["M", "S", "L", "M"],
                 dtype=pd.CategoricalDtype(["S", "M", "L"], ordered=True))
print(size.sort_values().tolist(), (size > "S").sum(), size.max())   # ['S', 'M', 'M', 'L'] 3 L

ci = df.assign(city=df.city.astype(pd.CategoricalDtype(["Pune", "Delhi", "Mumbai", "Chennai"])))
print(ci.groupby("city", observed=False).size().to_dict())  # {..., 'Chennai': 0}
print(ci.groupby("city", observed=True).size().to_dict())   # Chennai absent

cc = pd.Series(["a", "b"], dtype="category")
# cc.iloc[0] = "z"    -> TypeError: new value isn't a known category (add_categories first)

print(pd.Series([1, 2, 3]).memory_usage(index=False),
      pd.Series([1, 2, 3], dtype="int8").memory_usage(index=False))   # 24 3 (bytes)
print(pd.to_numeric(pd.Series([1, 200, 3]), downcast="integer").dtype)   # int16 (200 > int8 max 127)

total = 0
for chunk in pd.read_csv("orders.csv", usecols=["city", "amount"],
                         dtype={"city": "category"}, chunksize=500_000):
    total += chunk["amount"].sum()      # aggregate per chunk, combine at the end
\`\`\`

**Rule of thumb.** Convert string columns where \`nunique() / len()\` is small (well under 50%). For near-unique strings (IDs, free text) category is bigger, not smaller.

**Gotchas.** Concatenating or merging categoricals with different category sets falls back to object. Assigning an unknown value raises. \`cat.codes\` is \`-1\` for missing.
`,
  practice: `
**Memory routine.** \`df.info(memory_usage="deep")\` → convert low-cardinality strings to category → downcast numbers → parse dates → drop unused columns → save as Parquet. Mention chunking or columnar tools (Parquet, DuckDB, Polars) when data is bigger than RAM.

**Models.** Ordered categoricals give a sensible ordinal encoding; pass \`categories\` explicitly so train and test get the same codes.
`,
  traps: [
    { trap: "Converting every string column to category saves memory.", why: "For high-cardinality columns (IDs) the category table is as large as the data plus codes. Convert only low-cardinality columns." },
    { trap: "groupby on a categorical returns only groups that exist.", why: "With observed=False (the default in older pandas) all categories appear, including empty ones; set observed=True explicitly." },
    { trap: "`df.memory_usage()` shows the real size of string columns.", why: "Without deep=True it counts only the 8-byte pointers for object columns. Use deep=True." },
  ],
  say: {
    prompt: "Your DataFrame uses 12 GB and your laptop has 16. How do you cut memory?",
    secs: 45,
    check: ["Measure with memory_usage(deep=True) / info(memory_usage='deep')", "category for low-cardinality strings (codes + lookup)", "Downcast ints/floats; parse dates as datetime64", "usecols and dtype at read time; chunksize for streaming aggregates", "Parquet / columnar engines for repeated work"],
    followups: [
      { q: "How does category save memory?", a: "It stores each distinct value once and a small integer code (int8 for ≤127 categories) per row instead of a Python string object per row." },
      { q: "When does category make things worse?", a: "High-cardinality columns, or when you keep adding new values (each needs add_categories) and when concatenating mismatched categories turns it back into object." },
      { q: "How do you compute a mean over a CSV bigger than RAM?", a: "Read with chunksize, accumulate sum and count per chunk, divide at the end." },
    ],
    answer: `First I'd measure with df.info(memory_usage="deep") to see which columns dominate; usually it's object string columns. Low-cardinality strings like city or status go to category, which stores each value once plus an int8 code per row, often a 20 to 50 times saving. Integers and floats get downcast to the smallest type that holds their range, dates become datetime64, and I drop columns I don't need. Next time I read the file I'd pass usecols and dtype so it never loads at full size, and for aggregates over data bigger than memory I'd stream it with chunksize, combining partial sums and counts. For repeated work I'd convert to Parquet.`,
    avoid: ["Category on ID columns", "Measuring memory without deep=True"],
  },
  terms: [["category dtype", "Integer codes plus a table of distinct values."], ["Ordered categorical", "Categories with a defined order for sorting and comparisons."], ["observed", "groupby option to drop empty categories."], ["Downcasting", "Using a smaller numeric type that fits the data."]],
  sources: [S.cat, S.scale],
});
Q({ id: "py2-pdcat-1", d: 1, secs: 30, prompt: "A category column has 3 distinct values. What dtype are its `.cat.codes`?", options: ["int64", "int32", "int8", "object"], answer: 2, explain: "pandas uses the smallest integer type that fits the number of categories.", py: "import pandas as pd\nc = pd.Series(['Pune', 'Delhi', 'Mumbai', 'Pune']).astype('category')\nanswer = ['int64', 'int32', 'int8', 'object'].index(str(c.cat.codes.dtype))", packages: PD });
Q({ id: "py2-pdcat-2", d: 2, secs: 45, prompt: "`size = pd.Series(['M', 'S', 'L', 'M'], dtype=pd.CategoricalDtype(['S', 'M', 'L'], ordered=True))`. How many values satisfy `size > 'S'`?", answer: 3, tol: 0.5, explain: "M, L, M are above S in the declared order.", py: "import pandas as pd\nsize = pd.Series(['M', 'S', 'L', 'M'], dtype=pd.CategoricalDtype(['S', 'M', 'L'], ordered=True))\nanswer = int((size > 'S').sum())", packages: PD });
Q({ id: "py2-pdcat-3", d: 2, secs: 45, prompt: QDF + "with city cast to categories ['Pune', 'Delhi', 'Mumbai', 'Chennai'], how many rows does `groupby('city', observed=False).size()` return?", answer: 4, tol: 0.5, explain: "Chennai appears with size 0 when observed=False.", py: DF + "ci = df.assign(city=df.city.astype(pd.CategoricalDtype(['Pune', 'Delhi', 'Mumbai', 'Chennai'])))\nanswer = len(ci.groupby('city', observed=False).size())", packages: PD });
Q({ id: "py2-pdcat-4", d: 1, secs: 30, prompt: "`pd.to_numeric(pd.Series([1, 200, 3]), downcast='integer').dtype` — how many bytes per value?", answer: 2, tol: 0.5, explain: "200 exceeds int8's max of 127, so int16 (2 bytes).", py: "import pandas as pd\nanswer = pd.to_numeric(pd.Series([1, 200, 3]), downcast='integer').dtype.itemsize", packages: PD });
Q({ id: "py2-pdcat-5", d: 2, secs: 60, prompt: "A 100,000-row column of 3 city names: is `memory_usage(deep=True)` at least 10× smaller after `astype('category')`? (1 = yes, 0 = no)", answer: 1, tol: 0.5, explain: "Strings per row versus one int8 code per row plus three stored values.", py: "import pandas as pd, numpy as np\ns = pd.Series(np.random.default_rng(0).choice(['Pune', 'Delhi', 'Mumbai'], 100000))\nanswer = 1 if s.memory_usage(deep=True) >= 10 * s.astype('category').memory_usage(deep=True) else 0", packages: PDN });
C("py2-pdcat-c1", "category dtype", "Distinct values stored once + small int codes per row. Use for low-cardinality strings; observed=True in groupby.");
C("py2-pdcat-c2", "Cut memory", "info(memory_usage='deep') → category → downcast → datetime → usecols/dtype on read → chunksize → Parquet.");

// ───────────────────────── Method chaining and OA patterns ─────────────────────────

L("py2-pd-patterns", M, "Method chaining and common OA patterns", "Readable chains with assign/query/pipe, then the patterns that keep appearing: top-N per group, cohort retention, sessionisation and consecutive streaks.", {
  kind: "concept", mins: 30, mathsLabel: "Code",
  hook: "'Monthly retention by signup cohort' and 'split clicks into sessions with a 30-minute timeout' come up again and again in DA/DS OAs. Both are about five lines of pandas once you know the trick.",
  intuition: `
**The situation.** Timed OAs reuse a small set of patterns. Recognising the pattern is most of the work; the code is short.

**The idea.**

- **Method chaining.** Wrap a pipeline in parentheses and write one step per line: \`query\` (filter), \`assign\` (new columns, lambdas see the intermediate frame), \`groupby/agg\`, \`sort_values\`, \`pipe\` (your own function). No throwaway variables and no SettingWithCopy surprises.
- **Top-N per group.** Sort, then \`groupby().head(n)\`; or rank within group when ties matter.
- **Cohort retention.** Cohort = each user's first active month (\`transform("min")\`); age = months since cohort; count distinct users per (cohort, age); divide by the age-0 count.
- **Sessionisation.** Sort by user and time; a new session starts where the gap to the previous event exceeds the timeout (or it's the user's first event); \`cumsum\` of that boolean numbers the sessions.
- **Consecutive streaks (gaps and islands).** A new island starts where the day difference isn't 1; \`cumsum\` labels islands; group by the label.

The cumsum-of-a-boolean trick is the key idea: it turns "where does a new block start" into a block ID.
${DATA_NOTE}`,
  maths: `
**In one breath.** \`(df.query().assign().groupby().agg().sort_values())\`; cohort = transform("min") + month difference + nunique + divide by column 0; session id = groupby(user).cumsum(first event or gap > timeout); island id = cumsum(diff != 1).

\`\`\`python
# 1. Chain: top paid city per month
top_city = (df
    .query("status == 'paid'")
    .assign(month=lambda d: d["date"].dt.to_period("M"))
    .groupby(["month", "city"], as_index=False)["amount"].sum()
    .sort_values(["month", "amount"], ascending=[True, False])
    .groupby("month").head(1))
print(top_city[["city", "amount"]].values.tolist())
# [['Delhi', 400], ['Mumbai', 900], ['Mumbai', 120]]

# 2. Cohort retention
d = df.assign(month=df["date"].dt.to_period("M"))
d["cohort"] = d.groupby("cust")["month"].transform("min")
d["age"] = ((d["month"].dt.year - d["cohort"].dt.year) * 12
            + (d["month"].dt.month - d["cohort"].dt.month))
users = d.groupby(["cohort", "age"])["cust"].nunique().unstack(fill_value=0)
retention = users.div(users[0], axis=0)
print(users)
# age      0  1
# cohort
# 2025-01  2  2     asha and ravi both came back in Feb
# 2025-02  1  1     zoya came back in Mar
# 2025-03  1  0     john: no later month observed yet (censored, not churned)

# 3. Sessionisation with a 30-minute timeout
ev = pd.DataFrame({"user": ["u1"] * 5 + ["u2"] * 3,
                   "ts": pd.to_datetime(["2025-01-01 10:00", "2025-01-01 10:10", "2025-01-01 10:50",
                                         "2025-01-01 10:55", "2025-01-01 12:00",
                                         "2025-01-01 09:00", "2025-01-01 09:20", "2025-01-01 09:45"])})
ev = ev.sort_values(["user", "ts"])
gap = ev.groupby("user")["ts"].diff()
ev["session"] = (gap.isna() | (gap > pd.Timedelta(minutes=30))).groupby(ev["user"]).cumsum()
print(ev["session"].tolist())          # [1, 1, 2, 2, 3, 1, 1, 1]
sess = ev.groupby(["user", "session"])["ts"].agg(start="min", end="max", events="size")
print(((sess.end - sess.start).dt.total_seconds() / 60).tolist())   # [10.0, 5.0, 0.0, 45.0]

# 4. Longest streak of consecutive active days
days = pd.Series(pd.to_datetime(["2025-01-01", "2025-01-02", "2025-01-03", "2025-01-05", "2025-01-06"]))
island = (days.diff().dt.days != 1).cumsum()          # [1, 1, 1, 2, 2]
print(days.groupby(island).size().max())              # 3
\`\`\`

**Complexity.** Each pattern is a sort (O(n log n)) plus linear passes; no Python loops over rows.

**Gotchas.** Sort before diff/cumsum. In cohorts, the latest cohorts have short histories: their missing later ages are censored, not zero retention. Session gaps must be computed **within** user (groupby before diff), or the first event of one user is compared with the last event of another.
`,
  practice: `
**In the OA.** Write the chain step by step, printing \`head()\` after each step while developing, then collapse it. State definitions before coding: what counts as active, the cohort grain (week or month), the session timeout, whether the first event counts.

**Readability.** One operation per line; meaningful names in \`assign\`; \`pipe\` for any custom function so the chain stays linear.
`,
  traps: [
    { trap: "A cohort's retention at month 2 is 0 if nobody appears in month 2.", why: "If the data ends before month 2 for that cohort, it's unobserved (censored). Only report ages every cohort has reached, or mask them." },
    { trap: "`df['ts'].diff()` gives each user's gap between events.", why: "Without groupby the first event of a user is compared with another user's last event. Use groupby('user')['ts'].diff() after sorting." },
    { trap: "Long chains are hard to debug, so avoid them.", why: "Build them a step at a time; you can inspect any stage with .pipe(lambda d: print(d.shape) or d). Chains avoid stale intermediate variables." },
  ],
  say: {
    prompt: "Given an events table (user_id, timestamp), compute sessions with a 30-minute inactivity timeout and the average session length.",
    secs: 60,
    check: ["Sort by user and timestamp", "groupby(user).diff() for gaps; first event has NaT", "new_session = gap is NaT or gap > 30 min; session id = groupby(user).cumsum()", "Aggregate per (user, session): min, max, count; length = max − min", "Edge cases: single-event sessions have length 0, timezone/duplicates"],
    followups: [
      { q: "How do you build monthly cohort retention?", a: "Cohort = first active month per user via transform('min'); age = months between activity and cohort; nunique users per (cohort, age), unstack, divide by age 0." },
      { q: "How do you find each user's longest streak of consecutive days?", a: "Deduplicate to one row per user-day, sort, mark new islands where diff in days != 1, cumsum within user for island ids, then the max group size per user." },
      { q: "Why chain methods?", a: "Each step is explicit, there are no stale intermediate frames, and the pipeline is easy to rerun; assign and query keep it readable." },
    ],
    answer: `I'd sort by user and timestamp, then take the gap to the previous event within each user with groupby("user")["ts"].diff(). A new session starts where that gap is missing, which is the user's first event, or greater than 30 minutes. Taking a cumulative sum of that boolean within each user gives a session number, because it goes up by one at every new start. Then I group by user and session and take the min and max timestamp and the event count; session length is max minus min, so single-event sessions are zero, which I'd call out as a definition choice. The average session length is the mean of those durations. It's a sort plus linear passes, with no Python loop.`,
    avoid: ["Looping over rows to assign session ids", "Computing gaps without grouping by user"],
  },
  terms: [["Method chaining", "One expression of successive DataFrame methods."], ["Cohort", "Users grouped by when they started."], ["Sessionisation", "Splitting events into sessions by an inactivity timeout."], ["Gaps and islands", "Labelling runs of consecutive values via cumsum of breaks."]],
  sources: [S.gb, S.ts],
});
Q({ id: "py2-pdpat-1", d: 2, secs: 60, prompt: "Events for one user at 10:00, 10:10, 10:50, 10:55 and 12:00. With a 30-minute timeout, how many sessions?", answer: 3, tol: 0.5, explain: "Gaps 10, 40, 5, 65 minutes: new sessions after the 40- and 65-minute gaps.", py: "import pandas as pd\nts = pd.Series(pd.to_datetime(['2025-01-01 10:00', '2025-01-01 10:10', '2025-01-01 10:50', '2025-01-01 10:55', '2025-01-01 12:00']))\ng = ts.diff()\nanswer = int((g.isna() | (g > pd.Timedelta(minutes=30))).sum())", packages: PD });
Q({ id: "py2-pdpat-2", d: 2, secs: 60, prompt: QDF + "cohort = each customer's first order month. How many customers are in the January 2025 cohort?", answer: 2, tol: 0.5, explain: "asha and ravi first ordered in January.", py: DF + "d = df.assign(m=df.date.dt.to_period('M'))\nfirst = d.groupby('cust')['m'].min()\nanswer = int((first == pd.Period('2025-01', 'M')).sum())", packages: PD });
Q({ id: "py2-pdpat-3", d: 2, secs: 60, prompt: QDF + "what share of the January cohort placed an order in February (month 1)?", answer: 1, tol: 0.01, explain: "Both asha (order 6) and ravi (order 5) ordered in February.", py: DF + "d = df.assign(m=df.date.dt.to_period('M'))\nd['c'] = d.groupby('cust')['m'].transform('min')\nd['age'] = (d.m.dt.year - d.c.dt.year) * 12 + (d.m.dt.month - d.c.dt.month)\nu = d.groupby(['c', 'age'])['cust'].nunique().unstack(fill_value=0)\nanswer = float(u.loc[pd.Period('2025-01', 'M'), 1] / u.loc[pd.Period('2025-01', 'M'), 0])", packages: PD });
Q({ id: "py2-pdpat-4", d: 2, secs: 45, prompt: "Active days: 1, 2, 3, 5, 6, 7, 8 and 10 January. Longest run of consecutive days?", answer: 4, tol: 0.5, explain: "Islands: 1–3 (3), 5–8 (4), 10 (1).", py: "import pandas as pd\nd = pd.Series(pd.to_datetime(['2025-01-0' + str(i) for i in [1, 2, 3, 5, 6, 7, 8]] + ['2025-01-10']))\nisl = (d.diff().dt.days != 1).cumsum()\nanswer = int(d.groupby(isl).size().max())", packages: PD });
Q({ id: "py2-pdpat-5", d: 2, secs: 60, prompt: QDF + "chain: paid orders → month → revenue per (month, city) → top city per month. What is the sum of the three winning revenues?", answer: 1420, tol: 0.5, explain: "Jan Delhi 400, Feb Mumbai 900, Mar Mumbai 120.", py: DF + "t = (df.query(\"status == 'paid'\").assign(m=lambda d: d.date.dt.to_period('M')).groupby(['m', 'city'], as_index=False)['amount'].sum().sort_values(['m', 'amount'], ascending=[True, False]).groupby('m').head(1))\nanswer = int(t.amount.sum())", packages: PD });
C("py2-pdpat-c1", "Block id trick", "new_block = (first row) | (break condition); block_id = new_block.cumsum() (within group). Sessions, streaks, islands.");
C("py2-pdpat-c2", "Cohort retention", "cohort = groupby(user).month.transform('min'); age = month − cohort; nunique per (cohort, age); unstack; divide by age 0.");

// ───────────────────────── Interview lesson ─────────────────────────

L("py2-pd-practice", M, "pandas practice", "Timed pandas tasks in the style of DA/DS OAs and live coding rounds.", {
  kind: "interview", mins: 35, prereq: ["py2-pd-groupby", "py2-pd-transform", "py2-pd-merge", "py2-pd-window", "py2-pd-patterns"],
  hook: "State the grain of every intermediate table out loud; most pandas bugs are a grain you didn't expect.",
}, [
  iq("Orders (order_id, user_id, ts, amount) and users (user_id, signup_ts, city). For each city, find the share of users who ordered within 7 days of signing up.", "Get each user's first order: orders.groupby('user_id').ts.min(). Left-merge onto users (validate='one_to_one') so users with no orders stay, then flag first_ts − signup_ts ≤ 7 days (NaT compares False). Group by city and take the mean of the flag. Mention: denominators include non-ordering users, orders before signup (data errors), and time zones.", ["First order per user via groupby min", "Left join from users keeps the right denominator", "Timedelta comparison with NaT handled", "groupby(city).flag.mean()", "Edge cases: pre-signup orders, tz"]),
  iq("Return the top 3 products by revenue in each category; if there's a tie for third, include all tied products.", "Aggregate to product level first (groupby category, product → revenue sum), then rank within category with groupby('category').revenue.rank(method='min', ascending=False) and keep rank ≤ 3. head(3) after sorting would cut ties arbitrarily; method='dense' would allow more than three distinct revenue levels.", ["Aggregate before ranking", "rank(method='min') for 'include ties'", "Explains why head(3) or dense is wrong", "Correct grouping key"]),
  iq("Compute 7-day rolling active users per day from an events table.", "Deduplicate to (user, day). For each day you need distinct users in the trailing 7 days, which a rolling sum of daily counts doesn't give (users are double-counted). Options: expand each (user, day) to the 7 days it covers (cross join with offsets 0–6), then nunique per day; or for small data loop over days with a boolean window and nunique. Reindex to a full date range. Note the cost: 7× rows for the expansion.", ["Spots that rolling sum double-counts users", "Dedup to user-day first", "Expansion / window approach for distinct counts", "Full date range and complexity"]),
  iq("Your merge of transactions to an FX-rate table produced NaNs for 5% of rows and slightly more rows than before. Debug it.", "More rows → duplicate keys in the rates table (e.g. two rates for a date-currency); check rates.duplicated(['date', 'ccy']).sum() and use validate='many_to_one'. NaNs → unmatched keys: dtype mismatch (datetime vs string, date vs timestamp with time), currency code case/whitespace, or missing dates (weekends) — use indicator=True to list them; for missing dates use merge_asof on sorted dates to take the latest earlier rate.", ["Duplicate keys explain extra rows", "validate and indicator for diagnosis", "Key normalisation (dtype, time component, case)", "merge_asof for as-of rates"]),
  iq("Rewrite this so it runs on 10 million rows: `df['fee'] = df.apply(lambda r: r.amt * 0.02 if r.type == 'card' else (r.amt * 0.01 if r.type == 'upi' else 0), axis=1)`.", "np.select([df.type.eq('card'), df.type.eq('upi')], [df.amt * 0.02, df.amt * 0.01], default=0), or map a rate dict: df.amt * df.type.map({'card': 0.02, 'upi': 0.01}).fillna(0). Explain that apply(axis=1) is a Python call per row; the vectorised version runs in compiled loops, roughly 100–1000× faster. Store type as category to cut memory. Verify equality on a sample.", ["Vectorised np.select or rate map", "Explains apply overhead", "Default/unmatched handling", "Checks equality, mentions dtypes"]),
  iq("Build a monthly cohort retention table from a logins table and explain how you'd present it.", "Deduplicate to (user, month); cohort = groupby(user).month.transform('min'); age = month difference in months; nunique users per (cohort, age) → unstack → divide by age-0 column. Mask cells beyond each cohort's observable age (censored) rather than showing 0. Present as a triangle heatmap; mention cohort sizes and whether 'active' means login or purchase.", ["Cohort via transform min", "Age as month difference", "Normalise by cohort size", "Censoring handled", "Definitions stated"]),
]);
