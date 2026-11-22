import type { PythonProblem } from "@/lib/types";

/**
 * P1 · plotting (batch 10): matplotlib and seaborn problems, run in Pyodide (matplotlib 3.5, seaborn 0.13).
 * Tests inspect the returned Figure / Axes (lines, patches, texts, scales, legend), so no image comparison
 * is needed. Fixtures and small helpers live in the setup and show in the Fixtures tab.
 */
type T = [name: string, call: string, expected: string, hidden?: boolean];
interface Spec {
  id: string; cat: string; title: string; difficulty: "Easy" | "Medium" | "Hard"; targetMin: number; tags: string[];
  statement: string; starter: string; solution: string; tests: T[]; fixtures?: string; sns?: boolean; constraints?: string[]; hints?: string[];
  why: string; traps: string[]; followUps: string[];
}
const BASE = "import numpy as np\nimport pandas as pd\nimport matplotlib.pyplot as plt\nimport matplotlib.colors as mcolors\n\ndef _new_ax():\n    return plt.subplots()[1]\n";
const P = (s: Spec): PythonProblem => ({
  id: s.id, kind: "python", title: s.title, pillar: "data", competency: "python_stats", category: s.cat, difficulty: s.difficulty,
  source: { kind: "practice" }, tracks: [], tags: [s.sns ? "seaborn" : "matplotlib", ...s.tags], targetMin: s.targetMin, statement: s.statement,
  constraints: s.constraints, starter: s.starter, solution: s.solution,
  setup: (s.sns ? BASE.replace("import matplotlib.colors", "import seaborn as sns\nimport matplotlib.colors") : BASE) + (s.fixtures ? "\n" + s.fixtures : ""),
  packages: s.sns ? ["seaborn"] : ["pandas", "matplotlib"],
  tests: s.tests.map(([name, call, expected, hidden], i) => ({ id: `t${i + 1}`, name, call, expected, hidden: !!hidden })),
  hints: s.hints, context: { why: s.why, traps: s.traps, followUps: s.followUps },
});
const MPL = "import numpy as np\nimport matplotlib.pyplot as plt\n";
const SNS = "import pandas as pd\nimport seaborn as sns\nimport matplotlib.pyplot as plt\n";
const OO = "Use the object-oriented API: draw on the Axes you are given (or create), not on plt's current axes.";

export const P1_PLOT_PROBLEMS: PythonProblem[] = [
  // ───────── matplotlib: figures, axes, the OO API ─────────
  P({
    id: "viz-trend-lines", cat: "viz/mpl", title: "One labelled line per series", difficulty: "Easy", targetMin: 6, tags: ["subplots", "legend"],
    statement: "Write `plot_trends(series)` where `series` is a dict `{name: list of y-values}` (x = 1, 2, …). Create a **new** figure, draw one line per series labelled with its name, set the title `'Trend'` and the x-label `'week'`, show a legend, and return `(fig, ax)`.",
    constraints: [OO],
    starter: MPL + "\ndef plot_trends(series):\n    pass\n",
    solution: MPL + "\ndef plot_trends(series):\n    fig, ax = plt.subplots(figsize=(6, 4))\n    for name, ys in series.items():\n        ax.plot(range(1, len(ys) + 1), ys, label=name)\n    ax.set(title=\"Trend\", xlabel=\"week\")\n    ax.legend()\n    return fig, ax\n",
    tests: [
      ["One line per series", 'len(plot_trends({"a": [1, 2, 3], "b": [3, 2, 1]})[1].lines)', "2"],
      ["Legend labels", '[t.get_text() for t in plot_trends({"a": [1, 2], "b": [2, 1]})[1].get_legend().get_texts()]', '["a", "b"]'],
      ["Title and x-label", '(lambda ax: (ax.get_title(), ax.get_xlabel()))(plot_trends({"a": [1]})[1])', '("Trend", "week")'],
      ["Hidden: x starts at 1", 'list(plot_trends({"a": [5, 6, 7]})[1].lines[0].get_xdata())', "[1, 2, 3]", true],
      ["Hidden: a new figure each call", 'plot_trends({"a": [1]})[0] is not plot_trends({"a": [1]})[0]', "True", true],
      ["Hidden: ax belongs to fig", '(lambda f, a: a in f.axes)(*plot_trends({"a": [1]}))', "True", true],
    ],
    hints: ["fig, ax = plt.subplots() creates both; ax.plot(..., label=name) and ax.legend() do the rest."],
    why: "Functions that create and return their own Figure and Axes are reusable and testable; pyplot's hidden current-axes state is not.",
    traps: ["plt.plot on the current axes: the second call draws onto the first call's chart.", "Passing label= but never calling legend()."],
    followUps: ["Accept an optional ax argument and draw there instead.", "Label each line at its right end instead of using a legend."],
  }),
  P({
    id: "viz-small-multiples", cat: "viz/mpl", title: "Small multiples grid", difficulty: "Medium", targetMin: 10, tags: ["subplots", "sharex", "axes.flat"],
    statement: "Write `small_multiples(groups, ncols, bins=10)` where `groups` is a dict `{name: array of values}`. Draw one histogram per group (with `bins` bins) in a grid with `ncols` columns and as many rows as needed, all panels sharing the x and y axes, each titled with its group's name in dict order. Hide any unused panels and return the figure. `G5` (fixture) has 5 groups; `_visible(fig)` lists the visible axes.",
    fixtures: 'G5 = {k: np.random.default_rng(i).normal(i, 1, 50) for i, k in enumerate("abcde")}\n\ndef _visible(fig):\n    return [ax for ax in fig.axes if ax.get_visible()]\n',
    starter: MPL + "\ndef small_multiples(groups, ncols, bins=10):\n    pass\n",
    solution: MPL + "\ndef small_multiples(groups, ncols, bins=10):\n    n = len(groups)\n    nrows = -(-n // ncols)\n    fig, axes = plt.subplots(nrows, ncols, sharex=True, sharey=True, squeeze=False,\n                             figsize=(3 * ncols, 2.5 * nrows))\n    for ax, (name, values) in zip(axes.flat, groups.items()):\n        ax.hist(values, bins=bins)\n        ax.set_title(name)\n    for ax in axes.flat[n:]:\n        ax.set_visible(False)\n    fig.tight_layout()\n    return fig\n",
    tests: [
      ["Visible panels", "len(_visible(small_multiples(G5, 3)))", "5"],
      ["Titles in order", "[ax.get_title() for ax in _visible(small_multiples(G5, 3))]", '["a", "b", "c", "d", "e"]'],
      ["Grid shape", "small_multiples(G5, 3).axes[0].get_subplotspec().get_gridspec().get_geometry()", "(2, 3)"],
      ["Hidden: bins", "len(small_multiples(G5, 2, bins=7).axes[0].patches)", "7", true],
      ["Hidden: shared x", "(lambda f: f.axes[0].get_shared_x_axes().joined(f.axes[0], f.axes[4]))(small_multiples(G5, 3))", "True", true],
      ["Hidden: a single group", 'len(_visible(small_multiples({"x": [1, 2, 3]}, 1)))', "1", true],
    ],
    hints: ["Rows = ceil(n / ncols) = -(-n // ncols).", "plt.subplots(..., squeeze=False) always returns a 2-D array, even for 1 × 1; loop with axes.flat.", "ax.set_visible(False) (or fig.delaxes(ax)) for the leftover panels."],
    why: "Small multiples with shared axes are the clearest way to compare many groups; the grid bookkeeping is a common interview exercise.",
    traps: ["Indexing axes[i] on a 2-D array, or calling .flat on the single Axes that subplots(1, 1) returns.", "Leaving empty panels visible.", "Unshared axes, which make the panels impossible to compare."],
    followUps: ["Do the same with seaborn's displot(col=..., col_wrap=...).", "Add a common x-label with fig.supxlabel."],
  }),
  P({
    id: "viz-bar-labels", cat: "viz/mpl", title: "Labelled bars with a highlight", difficulty: "Medium", targetMin: 8, tags: ["bar", "bar_label", "colour"],
    statement: "Write `labelled_bars(ax, labels, values)` that draws vertical bars **on the given `ax`**, writes each value above its bar (matplotlib's default `bar_label` format, so 3 → `'3'`, 2.5 → `'2.5'`), colours the largest bar `'tab:red'` and every other bar `'tab:gray'` (if several bars tie for the maximum, highlight only the first), and returns `ax`. `_new_ax()` (fixture) makes a fresh Axes.",
    constraints: [OO],
    starter: MPL + "\ndef labelled_bars(ax, labels, values):\n    pass\n",
    solution: MPL + "\ndef labelled_bars(ax, labels, values):\n    top = int(np.argmax(values))\n    colors = [\"tab:red\" if i == top else \"tab:gray\" for i in range(len(values))]\n    bars = ax.bar(labels, values, color=colors)\n    ax.bar_label(bars)\n    return ax\n",
    fixtures: "def _hex(ax):\n    return [mcolors.to_hex(p.get_facecolor()) for p in ax.patches]\n",
    tests: [
      ["Bars", 'len(labelled_bars(_new_ax(), ["a", "b", "c"], [3, 5, 2]).patches)', "3"],
      ["Value labels", '[t.get_text() for t in labelled_bars(_new_ax(), ["a", "b", "c"], [3, 5, 2.5]).texts]', '["3", "5", "2.5"]'],
      ["Colours", '_hex(labelled_bars(_new_ax(), ["a", "b", "c"], [3, 5, 2]))', '[mcolors.to_hex("tab:gray"), mcolors.to_hex("tab:red"), mcolors.to_hex("tab:gray")]'],
      ["Hidden: draws on the given axes", '(lambda a, b: (labelled_bars(a, ["x"], [1]), len(a.patches), len(b.patches))[1:])(_new_ax(), _new_ax())', "(1, 0)", true],
      ["Hidden: tie highlights the first", '_hex(labelled_bars(_new_ax(), ["a", "b", "c"], [5, 1, 5]))', '[mcolors.to_hex("tab:red"), mcolors.to_hex("tab:gray"), mcolors.to_hex("tab:gray")]', true],
    ],
    hints: ["ax.bar(...) returns a BarContainer; ax.bar_label(container) writes the values.", "bar takes a list of colours, one per bar; np.argmax returns the first maximum."],
    why: "Direct labels and one highlight colour make a bar chart readable at a glance; drawing on a passed-in Axes lets the function work inside any layout.",
    traps: ["plt.bar, which draws on the most recently created axes instead of ax.", "Formatting labels as '3.0' with f-strings on floats."],
    followUps: ["Put the labels inside the bars in white.", "Sort the bars before drawing."],
  }),

  // ───────── Choosing a chart ─────────
  P({
    id: "viz-ranked-bars", cat: "viz/choose", title: "Ranked horizontal bars", difficulty: "Easy", targetMin: 7, tags: ["barh", "sorting", "zero baseline"],
    statement: "Write `ranked_barh(ax, labels, values)` that draws a horizontal bar chart on `ax` with the bars sorted so the **largest is at the top**, each bar keeping its own label, and the value axis starting at 0. Return `ax`. Fixture helpers: `_top_down(ax)` lists the y tick labels from top to bottom; `_widths_top_down(ax)` lists the bar lengths from top to bottom.",
    constraints: [OO],
    fixtures: "def _top_down(ax):\n    ax.figure.canvas.draw()\n    pairs = zip(ax.get_yticks(), [t.get_text() for t in ax.get_yticklabels()])\n    return [label for _, label in sorted(pairs, reverse=True)]\n\ndef _widths_top_down(ax):\n    return [p.get_width() for p in sorted(ax.patches, key=lambda p: -p.get_y())]\n",
    starter: MPL + "\ndef ranked_barh(ax, labels, values):\n    pass\n",
    solution: MPL + "\ndef ranked_barh(ax, labels, values):\n    order = np.argsort(values, kind=\"stable\")  # smallest first = bottom\n    ax.barh([labels[i] for i in order], [values[i] for i in order])\n    ax.set_xlim(left=0)\n    return ax\n",
    tests: [
      ["Labels top to bottom", '_top_down(ranked_barh(_new_ax(), ["a", "b", "c", "d"], [3, 9, 1, 5]))', '["b", "d", "a", "c"]'],
      ["Lengths top to bottom", '_widths_top_down(ranked_barh(_new_ax(), ["a", "b", "c", "d"], [3, 9, 1, 5]))', "[9, 5, 3, 1]"],
      ["Hidden: axis starts at zero", 'ranked_barh(_new_ax(), ["a", "b"], [1000, 1010]).get_xlim()[0]', "0.0", true],
      ["Hidden: labels stay with their bars", '_top_down(ranked_barh(_new_ax(), ["x", "y", "z"], [2, 3, 1]))', '["y", "x", "z"]', true],
    ],
    hints: ["barh puts the first category at the bottom, so draw in ascending order.", "Sort labels and values together (argsort the values)."],
    why: "Sorted horizontal bars are the default for comparing categories: long labels fit, and the ranking is read top to bottom.",
    traps: ["Sorting descending, which puts the largest bar at the bottom.", "Sorting the values but not the labels.", "Zooming the value axis (set_xlim(990, ...)), which exaggerates small differences."],
    followUps: ["Highlight one category in a different colour.", "Show only the top 10 and group the rest as 'Other'."],
  }),
  P({
    id: "viz-percent-stacked", cat: "viz/choose", title: "100% stacked bars", difficulty: "Medium", targetMin: 10, tags: ["stacked bar", "composition"],
    statement: "Write `percent_stacked(ax, df)`: each **row** of `df` is one bar (x labels from the index) and each **column** a part. Draw vertical stacked bars where each part is its **percentage** of the row total (so every bar reaches 100), parts stacked bottom to top in column order, with a legend of the column names and y-limits 0 to 100. Return `ax`. Fixture: `MIX`; `_totals(ax)` sums the bar heights at each x position; `_bottom(ax)` gives the bottom segment's height for each bar.",
    constraints: [OO],
    fixtures: 'MIX = pd.DataFrame({"web": [30, 10], "store": [70, 30]}, index=["2023", "2024"])\n\ndef _by_x(ax):\n    out = {}\n    for p in ax.patches:\n        out.setdefault(round(p.get_x() + p.get_width() / 2, 6), []).append(p)\n    return [out[k] for k in sorted(out)]\n\ndef _totals(ax):\n    return [round(sum(p.get_height() for p in ps), 6) for ps in _by_x(ax)]\n\ndef _bottom(ax):\n    return [round(min(ps, key=lambda p: p.get_y()).get_height(), 6) for ps in _by_x(ax)]\n',
    starter: "import numpy as np\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\ndef percent_stacked(ax, df):\n    pass\n",
    solution: "import numpy as np\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\ndef percent_stacked(ax, df):\n    pct = df.div(df.sum(axis=1), axis=0) * 100\n    x = [str(i) for i in pct.index]\n    bottom = np.zeros(len(pct))\n    for col in pct.columns:\n        ax.bar(x, pct[col].to_numpy(), bottom=bottom, label=str(col))\n        bottom += pct[col].to_numpy()\n    ax.set_ylim(0, 100)\n    ax.set_ylabel(\"% of total\")\n    ax.legend()\n    return ax\n",
    tests: [
      ["Segments", "len(percent_stacked(_new_ax(), MIX).patches)", "4"],
      ["Every bar reaches 100", "_totals(percent_stacked(_new_ax(), MIX))", "[100.0, 100.0]"],
      ["Bottom segment is the first column's share", "_bottom(percent_stacked(_new_ax(), MIX))", "[30.0, 25.0]"],
      ["Hidden: legend", "[t.get_text() for t in percent_stacked(_new_ax(), MIX).get_legend().get_texts()]", '["web", "store"]', true],
      ["Hidden: y from 0 to 100", "percent_stacked(_new_ax(), MIX).get_ylim()", "(0.0, 100.0)", true],
    ],
    hints: ["df.div(df.sum(axis=1), axis=0) * 100 turns each row into percentages.", "Stack by passing bottom= the running total of the parts drawn so far."],
    why: "When the question is 'how does the mix change', 100% stacked bars compare shares across groups; raw stacked bars mix up size and share.",
    traps: ["Stacking the raw values, so the bars have different heights.", "Dividing by column totals (axis mix-up)."],
    followUps: ["Label each segment with its percentage.", "Use horizontal bars when there are many groups."],
  }),
  P({
    id: "viz-log-hist", cat: "viz/choose", title: "Histogram on a log scale", difficulty: "Medium", targetMin: 8, tags: ["hist", "log scale", "geomspace"],
    statement: "Write `log_histogram(ax, values, bins)` for positive, heavily skewed data: draw a histogram on `ax` with `bins` **log-spaced** bins from the minimum to the maximum value, set the x-axis to a log scale, and return the array of bin edges. Fixture: `VALS` (500 log-normal values).",
    constraints: [OO],
    fixtures: "VALS = np.random.default_rng(0).lognormal(3, 1.5, 500)\n",
    starter: MPL + "\ndef log_histogram(ax, values, bins):\n    pass\n",
    solution: MPL + "\ndef log_histogram(ax, values, bins):\n    v = np.asarray(values, dtype=float)\n    edges = np.geomspace(v.min(), v.max(), bins + 1)\n    ax.hist(v, bins=edges)\n    ax.set_xscale(\"log\")\n    return edges\n",
    tests: [
      ["Edges", "log_histogram(_new_ax(), [1, 10, 100, 1000], 3)", "np.array([1.0, 10.0, 100.0, 1000.0])"],
      ["Log x-axis", "(lambda ax: (log_histogram(ax, VALS, 20), ax.get_xscale())[1])(_new_ax())", '"log"'],
      ["Hidden: every value counted", "(lambda ax: (log_histogram(ax, VALS, 20), round(sum(p.get_height() for p in ax.patches)))[1])(_new_ax())", "500", true],
      ["Hidden: number of bars", "(lambda ax: (log_histogram(ax, VALS, 20), len(ax.patches))[1])(_new_ax())", "20", true],
    ],
    hints: ["np.geomspace(lo, hi, bins + 1) gives equally spaced edges on a log scale.", "ax.set_xscale('log') after drawing."],
    why: "Incomes, prices and latencies span orders of magnitude; linear bins cram everything into the first bar.",
    traps: ["Equal-width bins on a log axis: the bars get narrower and narrower and the left ones are empty or huge.", "bins + 1 edges, not bins."],
    followUps: ["Overlay the median as a vertical line.", "Compare with a histogram of np.log10(values)."],
  }),

  // ───────── seaborn ─────────
  P({
    id: "viz-sns-heatmap", cat: "viz/seaborn", title: "Correlation heatmap", difficulty: "Medium", targetMin: 8, tags: ["heatmap", "corr"], sns: true,
    statement: "Write `corr_heatmap(ax, df)` that computes the Pearson correlations between the **numeric** columns of `df`, rounded to 2 decimals, draws them on `ax` as a seaborn heatmap annotated with 2 decimals (e.g. `'1.00'`), with colour limits −1 to 1 centred at 0, and returns the rounded correlation DataFrame. Fixture: `NUM` (three numeric columns and a text column).",
    fixtures: 'rng = np.random.default_rng(1)\n_x = rng.normal(size=60)\nNUM = pd.DataFrame({"x": _x, "y": 2 * _x + rng.normal(size=60), "z": -_x + rng.normal(size=60), "name": ["r%d" % i for i in range(60)]})\n',
    starter: SNS + "\ndef corr_heatmap(ax, df):\n    pass\n",
    solution: SNS + "\ndef corr_heatmap(ax, df):\n    corr = df.corr(numeric_only=True).round(2)\n    sns.heatmap(corr, annot=True, fmt=\".2f\", vmin=-1, vmax=1, center=0, cmap=\"vlag\", ax=ax)\n    return corr\n",
    tests: [
      ["Correlations", "corr_heatmap(_new_ax(), NUM)", "NUM.corr(numeric_only=True).round(2)"],
      ["One annotation per cell", "(lambda ax: (corr_heatmap(ax, NUM), len(ax.texts))[1])(_new_ax())", "9"],
      ["Two decimals", "(lambda ax: (corr_heatmap(ax, NUM), ax.texts[0].get_text())[1])(_new_ax())", '"1.00"'],
      ["Hidden: colour limits", "(lambda ax: (corr_heatmap(ax, NUM), ax.collections[0].get_clim())[1])(_new_ax())", "(-1.0, 1.0)", true],
      ["Hidden: text column ignored", "list(corr_heatmap(_new_ax(), NUM).columns)", '["x", "y", "z"]', true],
    ],
    hints: ["df.corr(numeric_only=True) skips text columns (pandas 2 raises without it).", "sns.heatmap(..., annot=True, fmt='.2f', vmin=-1, vmax=1, center=0, ax=ax)."],
    why: "A correlation heatmap is the standard first look at numeric features; fixed limits keep colours comparable across charts.",
    traps: ["Letting the colour scale stretch to the data's range, so 0.3 looks as strong as 1.", "The default annotation format '.2g', which prints 1 instead of 1.00."],
    followUps: ["Mask the upper triangle.", "Use Spearman correlation for skewed data."],
  }),
  P({
    id: "viz-sns-long", cat: "viz/seaborn", title: "Wide to long, then hue", difficulty: "Medium", targetMin: 8, tags: ["melt", "lineplot", "hue"], sns: true,
    statement: "`WIDE` (fixture) has a `month` index and one column per series. Write `plot_long(ax, wide)` that reshapes it to a long DataFrame with columns `month`, `series` and `value` (rows ordered series by series, in column order, then by month), draws a seaborn line plot on `ax` with one line per series (`hue='series'`), and returns the long DataFrame.",
    fixtures: 'WIDE = pd.DataFrame({"north": [1, 3, 2], "south": [2, 2, 4]}, index=pd.Index([1, 2, 3], name="month"))\n',
    starter: SNS + "\ndef plot_long(ax, wide):\n    pass\n",
    solution: SNS + "\ndef plot_long(ax, wide):\n    long = wide.reset_index().melt(id_vars=\"month\", var_name=\"series\", value_name=\"value\")\n    sns.lineplot(data=long, x=\"month\", y=\"value\", hue=\"series\", ax=ax)\n    return long\n",
    tests: [
      ["Long frame", "plot_long(_new_ax(), WIDE)", 'pd.DataFrame({"month": [1, 2, 3, 1, 2, 3], "series": ["north"] * 3 + ["south"] * 3, "value": [1, 3, 2, 2, 2, 4]})'],
      ["Legend", "(lambda ax: (plot_long(ax, WIDE), [t.get_text() for t in ax.get_legend().get_texts()])[1])(_new_ax())", '["north", "south"]'],
      ["Hidden: first line's values", "(lambda ax: (plot_long(ax, WIDE), list(ax.lines[0].get_ydata()))[1])(_new_ax())", "[1, 3, 2]", true],
      ["Hidden: axis labels", "(lambda ax: (plot_long(ax, WIDE), ax.get_xlabel(), ax.get_ylabel())[1:])(_new_ax())", '("month", "value")', true],
    ],
    hints: ["reset_index() turns month into a column; melt(id_vars='month', var_name='series', value_name='value').", "sns.lineplot(data=long, x=..., y=..., hue='series', ax=ax)."],
    why: "seaborn's hue, col and row all expect long data; reshaping first is what makes one call produce a labelled multi-series chart.",
    traps: ["Passing the wide frame straight to lineplot: no series column to map hue to.", "Losing the month when melting (forgot reset_index)."],
    followUps: ["Facet by series instead of colouring (relplot with col=).", "Add markers and a dashed style per series."],
  }),
  P({
    id: "viz-sns-mean-bars", cat: "viz/seaborn", title: "Ordered mean bars with ±1 SD", difficulty: "Easy", targetMin: 7, tags: ["barplot", "errorbar", "order"], sns: true,
    statement: "Write `mean_bars(ax, df, x, y)` that draws a seaborn bar plot on `ax` of the **mean** of `y` per category of `x`, with the categories ordered by mean, largest first, and error bars of ±1 standard deviation. Return the list of categories in plotted order. Fixture: `TIPS`.",
    fixtures: 'TIPS = pd.DataFrame({"day": ["thu", "thu", "fri", "fri", "sat", "sat", "sat"], "bill": [10, 14, 20, 30, 5, 7, 9]})\n',
    starter: SNS + "\ndef mean_bars(ax, df, x, y):\n    pass\n",
    solution: SNS + "\ndef mean_bars(ax, df, x, y):\n    order = df.groupby(x)[y].mean().sort_values(ascending=False).index.tolist()\n    sns.barplot(data=df, x=x, y=y, order=order, errorbar=\"sd\", ax=ax)\n    return order\n",
    tests: [
      ["Order", 'mean_bars(_new_ax(), TIPS, "day", "bill")', '["fri", "thu", "sat"]'],
      ["Bar heights are means", '(lambda ax: (mean_bars(ax, TIPS, "day", "bill"), [round(p.get_height(), 6) for p in ax.patches])[1])(_new_ax())', "[25.0, 12.0, 7.0]"],
      ["Hidden: error bars span ±1 SD", '(lambda ax: (mean_bars(ax, TIPS, "day", "bill"), [round(float(l.get_ydata()[1] - l.get_ydata()[0]), 4) for l in ax.lines])[1])(_new_ax())', "[round(2 * 50 ** 0.5, 4), round(2 * 8 ** 0.5, 4), 4.0]", true],
      ["Hidden: x-label", '(lambda ax: (mean_bars(ax, TIPS, "day", "bill"), ax.get_xlabel())[1])(_new_ax())', '"day"', true],
    ],
    hints: ["Compute the order with groupby(x)[y].mean().sort_values(ascending=False).", "barplot takes order=[...] and errorbar='sd'."],
    why: "A bar plot of means hides the spread; choosing the error bar deliberately (SD for spread, CI for uncertainty of the mean) is the point.",
    traps: ["Leaving the default 95% bootstrap CI when the task asks for SD.", "Alphabetical order, which makes the ranking hard to read."],
    followUps: ["Overlay the raw points with stripplot.", "Replace the bars with a box plot and compare what each shows."],
  }),
];
