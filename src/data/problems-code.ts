import type { CodeProblem } from "@/lib/types";

const T2 = [
  { id: "sample", name: "Sample data", hidden: false },
  { id: "edge", name: "Hidden: edge cases", hidden: true, seedId: "edge" },
];

export const CODE_PROBLEMS: CodeProblem[] = [
  // ───────────────────────── SQL ─────────────────────────
  {
    id: "sql-order-streak",
    kind: "sql",
    title: "Longest consecutive-day order streak",
    pillar: "data",
    competency: "sql",
    category: "sql/gaps-islands",
    difficulty: "Hard",
    source: { kind: "reported", companyId: "eternal", round: "Product Analyst, interview 2" },
    tracks: ["ecommerce", "apm"],
    tags: ["cte", "row_number", "gaps-and-islands"],
    targetMin: 15,
    datasetId: "qc",
    ordered: false,
    statement: `For every user who has placed at least one order, return the length of their **longest streak of consecutive calendar days** with an order.

A user can order more than once on the same day; that still counts as one day.

Return \`user_id\` and \`longest_streak\`.`,
    constraints: [
      "Several orders on one day count once.",
      "Streaks can cross month and year boundaries.",
      "Users with no orders must not appear.",
    ],
    sample: {
      input: "user 1 ordered on Jan 1, 2, 2, 3, 5, 6 and later dates",
      output: "user_id | longest_streak\n1       | 3\n2       | 1\n3       | 4\n4       | 1",
    },
    starter: `-- Return: user_id, longest_streak
WITH days AS (
  SELECT DISTINCT user_id, order_date
  FROM orders
)
SELECT user_id, 1 AS longest_streak
FROM days
GROUP BY user_id;`,
    solution: `WITH days AS (
  SELECT DISTINCT user_id, order_date
  FROM orders
),
grouped AS (
  SELECT user_id,
         order_date,
         order_date - CAST(ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_date) AS int) AS grp
  FROM days
),
streaks AS (
  SELECT user_id, grp, COUNT(*) AS len
  FROM grouped
  GROUP BY user_id, grp
)
SELECT user_id, MAX(len) AS longest_streak
FROM streaks
GROUP BY user_id;`,
    tests: T2,
    hints: [
      "Collapse to one row per user per day first.",
      "Number each user's days in date order. What stays constant inside a streak if you subtract that number from the date?",
      "Group by (user, date − row_number), count, then take the max per user.",
    ],
    context: {
      why: "This is the standard gaps-and-islands test. The panel is checking whether you know the date-minus-row-number trick and whether you write it as readable CTEs. The student who reported it noted that interviewers prefer CTE style because it is the standard at the office.",
      traps: [
        "Forgetting DISTINCT: two orders on one day break the date − row_number invariant.",
        "Using LAG and counting rows where the gap is 1. That counts adjacent pairs, not streak length, and needs a second pass.",
        "Putting a window function in WHERE or GROUP BY directly instead of wrapping it in a CTE.",
      ],
      followUps: [
        "Return the start and end date of the longest streak too.",
        "Only count streaks that are still active as of the latest order date in the table.",
        "How would this change if the table had 500M rows? (Partition pruning, pre-aggregated daily table.)",
      ],
    },
  },
  {
    id: "sql-top3-per-dept",
    kind: "sql",
    title: "Top 3 salaries per department, ties included",
    pillar: "data",
    competency: "sql",
    category: "sql/window",
    difficulty: "Medium",
    source: { kind: "practice" },
    tracks: ["consulting", "fintech"],
    tags: ["dense_rank", "partition by"],
    targetMin: 8,
    datasetId: "hr",
    ordered: false,
    statement: `Return every employee whose salary is among the **top 3 distinct salaries** in their department. If two people share a salary they share a rank, and both are returned.

Return \`dept\`, \`name\`, \`salary\`, \`rk\` where \`rk\` is the rank within the department (1 = highest).`,
    constraints: ["Ties share a rank and do not skip the next rank.", "A department with fewer than 3 people returns all of them."],
    sample: {
      input: "Analytics: Isha 13L, Jay 13L, Kiran 10L, Lata 8.5L",
      output: "dept      | name  | salary  | rk\nAnalytics | Isha  | 1300000 | 1\nAnalytics | Jay   | 1300000 | 1\nAnalytics | Kiran | 1000000 | 2\nAnalytics | Lata  | 850000  | 3",
    },
    starter: `-- Return: dept, name, salary, rk
SELECT dept, name, salary
FROM employees;`,
    solution: `WITH ranked AS (
  SELECT dept, name, salary,
         DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rk
  FROM employees
)
SELECT dept, name, salary, rk
FROM ranked
WHERE rk <= 3;`,
    tests: T2,
    hints: ["Which ranking function gives 1, 1, 2 on a tie rather than 1, 1, 3 or 1, 2, 3?", "You cannot filter on a window function in WHERE of the same SELECT."],
    context: {
      why: "The cheapest way for an interviewer to check that you know the difference between ROW_NUMBER, RANK and DENSE_RANK without asking for definitions.",
      traps: [
        "ROW_NUMBER silently drops one of two tied employees.",
        "RANK gives 1, 1, 3, so 'top 3' returns fewer distinct salaries than asked.",
        "Filtering with WHERE rk <= 3 in the same SELECT as the window function.",
      ],
      followUps: ["Return only the second-highest salary per department.", "Do it without window functions (correlated subquery counting distinct higher salaries)."],
    },
  },
  {
    id: "sql-mom-growth",
    kind: "sql",
    title: "Month-over-month revenue growth",
    pillar: "data",
    competency: "sql",
    category: "sql/time-series",
    difficulty: "Medium",
    source: { kind: "practice" },
    tracks: ["ecommerce", "fintech", "consulting"],
    tags: ["date_trunc", "lag"],
    targetMin: 8,
    datasetId: "qc",
    ordered: true,
    statement: `Compute total revenue per calendar month and its percentage growth over the previous month.

Return \`mon\` (first day of the month, as a date), \`rev\`, and \`mom_pct\` rounded to 1 decimal. The first month has no previous month, so its \`mom_pct\` is NULL. Order by month.`,
    constraints: ["mom_pct = 100 × (rev − previous rev) / previous rev.", "Round to 1 decimal place."],
    sample: {
      input: "orders for Jan, Feb and Mar 2026",
      output: "mon        | rev     | mom_pct\n2026-01-01 | 2550.00 | NULL\n2026-02-01 | 1275.00 | -50.0\n2026-03-01 | 1715.00 | 34.5",
    },
    starter: `-- Return: mon, rev, mom_pct (ordered by mon)
SELECT DATE_TRUNC('month', order_date)::date AS mon,
       SUM(amount) AS rev
FROM orders
GROUP BY 1
ORDER BY 1;`,
    solution: `WITH monthly AS (
  SELECT DATE_TRUNC('month', order_date)::date AS mon,
         SUM(amount) AS rev
  FROM orders
  GROUP BY 1
)
SELECT mon,
       rev,
       ROUND(100.0 * (rev - LAG(rev) OVER (ORDER BY mon)) / LAG(rev) OVER (ORDER BY mon), 1) AS mom_pct
FROM monthly
ORDER BY mon;`,
    tests: T2,
    hints: ["Aggregate to one row per month first, then look back one row.", "LAG(rev) OVER (ORDER BY mon) is the previous month's revenue."],
    context: {
      why: "Growth over a prior period is the most common analyst query. It tests aggregation before windowing and NULL handling on the first row.",
      traps: [
        "Integer division when amounts are integers: multiply by 100.0, not 100.",
        "Calling LAG before aggregating, which looks back one order instead of one month.",
        "A month with zero orders does not appear at all, so LAG skips over it. Mention this and offer generate_series as the fix.",
      ],
      followUps: ["Year-over-year instead of month-over-month.", "Growth per category within each month.", "What if a month is missing entirely?"],
    },
  },
  {
    id: "sql-never-ordered",
    kind: "sql",
    title: "Users who never ordered",
    pillar: "data",
    competency: "sql",
    category: "sql/joins",
    difficulty: "Easy",
    source: { kind: "practice" },
    tracks: ["ecommerce", "apm"],
    tags: ["anti-join", "left join", "not exists"],
    targetMin: 4,
    datasetId: "qc",
    ordered: false,
    statement: `Return the \`user_id\` and \`city\` of every registered user who has **never placed an order**.`,
    sample: { input: "users 5 and 6 have no rows in orders", output: "user_id | city\n5       | Mumbai\n6       | Pune" },
    starter: `-- Return: user_id, city
SELECT u.user_id, u.city
FROM users u;`,
    solution: `SELECT u.user_id, u.city
FROM users u
LEFT JOIN orders o ON o.user_id = u.user_id
WHERE o.order_id IS NULL;`,
    tests: T2,
    hints: ["Keep every user, attach orders where they exist, then keep the rows where nothing attached."],
    context: {
      why: "Checks that you can explain what a LEFT JOIN keeps and that you know the anti-join pattern. Often preceded by 'explain left vs right join'.",
      traps: [
        "NOT IN (SELECT user_id FROM orders) returns nothing if the subquery contains a NULL.",
        "Putting o.order_id IS NULL in the ON clause instead of WHERE.",
      ],
      followUps: ["Rewrite with NOT EXISTS. Which is safer and why?", "Users who signed up more than 30 days ago and never ordered."],
    },
  },
  {
    id: "sql-d1-retention",
    kind: "sql",
    title: "Day-1 retention by signup cohort",
    pillar: "data",
    competency: "sql",
    category: "sql/cohorts",
    difficulty: "Hard",
    source: { kind: "practice" },
    tracks: ["ecommerce", "apm"],
    tags: ["cohort", "retention", "count distinct"],
    targetMin: 15,
    datasetId: "qc",
    ordered: true,
    statement: `Using \`events\`, define a user's cohort as the date of their **first** event. For each cohort date, compute how many of those users were active again on exactly the next calendar day.

Return \`cohort_date\`, \`new_users\`, \`d1_retained\`, and \`d1_pct\` (percentage, 1 decimal). Order by cohort date.`,
    constraints: ["A user can have several events on a day; count users, not events.", "Cohorts with nobody retained still appear, with 0 and 0.0."],
    sample: {
      input: "users 1 and 2 first seen Jan 1; only user 1 returns on Jan 2",
      output: "cohort_date | new_users | d1_retained | d1_pct\n2026-01-01  | 2         | 1           | 50.0",
    },
    starter: `-- Return: cohort_date, new_users, d1_retained, d1_pct (ordered by cohort_date)
WITH first_seen AS (
  SELECT user_id, MIN(event_date) AS cohort_date
  FROM events
  GROUP BY user_id
)
SELECT cohort_date, COUNT(*) AS new_users
FROM first_seen
GROUP BY cohort_date
ORDER BY cohort_date;`,
    solution: `WITH first_seen AS (
  SELECT user_id, MIN(event_date) AS cohort_date
  FROM events
  GROUP BY user_id
)
SELECT f.cohort_date,
       COUNT(DISTINCT f.user_id) AS new_users,
       COUNT(DISTINCT e.user_id) AS d1_retained,
       ROUND(100.0 * COUNT(DISTINCT e.user_id) / COUNT(DISTINCT f.user_id), 1) AS d1_pct
FROM first_seen f
LEFT JOIN events e
  ON e.user_id = f.user_id
 AND e.event_date = f.cohort_date + 1
GROUP BY f.cohort_date
ORDER BY f.cohort_date;`,
    tests: T2,
    hints: [
      "First get one row per user with their first event date.",
      "LEFT JOIN events back on the same user and date = cohort date + 1.",
      "The join can fan out when a user has several events on day 1. Count distinct users.",
    ],
    context: {
      why: "Retention is the core product-analytics query. It tests cohort definition, a conditional self-join, and whether you notice join fan-out.",
      traps: [
        "INNER JOIN drops cohorts where nobody came back.",
        "COUNT(*) after the join counts events, not users.",
        "Filtering the day-1 condition in WHERE turns the LEFT JOIN into an INNER JOIN.",
      ],
      followUps: ["Generalise to D7 and D30 in one query.", "Rolling retention (active on day 7 or later).", "Split by platform."],
    },
  },
  {
    id: "sql-rolling-7d",
    kind: "sql",
    title: "7-day rolling average revenue, calendar days",
    pillar: "data",
    competency: "sql",
    category: "sql/time-series",
    difficulty: "Hard",
    source: { kind: "practice" },
    tracks: ["ecommerce", "fintech"],
    tags: ["generate_series", "window frame", "rolling average"],
    targetMin: 15,
    datasetId: "qc",
    ordered: true,
    statement: `For each calendar day from **2026-01-01 to 2026-01-14** inclusive, return the day's total revenue and the average daily revenue over that day and the 6 days before it.

Days with no orders count as revenue 0 and must appear. For the first 6 days the window is simply shorter.

Return \`day\`, \`rev\`, \`avg_7d\` (2 decimals), ordered by day.`,
    constraints: ["All 14 days must be present.", "Window = current row and up to 6 preceding rows."],
    starter: `-- Return: day, rev, avg_7d (ordered by day)
SELECT order_date AS day, SUM(amount) AS rev
FROM orders
WHERE order_date BETWEEN DATE '2026-01-01' AND DATE '2026-01-14'
GROUP BY order_date
ORDER BY order_date;`,
    solution: `WITH days AS (
  SELECT generate_series(DATE '2026-01-01', DATE '2026-01-14', INTERVAL '1 day')::date AS day
),
daily AS (
  SELECT d.day, COALESCE(SUM(o.amount), 0) AS rev
  FROM days d
  LEFT JOIN orders o ON o.order_date = d.day
  GROUP BY d.day
)
SELECT day,
       rev,
       ROUND(AVG(rev) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS avg_7d
FROM daily
ORDER BY day;`,
    tests: T2,
    hints: [
      "A ROWS frame counts rows, not days. What happens on days with no orders?",
      "Build the calendar first with generate_series, then LEFT JOIN orders onto it.",
    ],
    context: {
      why: "Rolling averages show up in online assessments. The interesting part is the gap: a row-based frame is only a 7-day window if every day has a row.",
      traps: [
        "Windowing directly over order_date groups: missing days make the '7-day' window span more than 7 days.",
        "COALESCE after AVG instead of before it.",
        "Forgetting that the first six rows average over fewer than 7 values.",
      ],
      followUps: ["Use RANGE BETWEEN INTERVAL '6 days' PRECEDING instead. When is it equivalent?", "Per-city rolling average."],
    },
  },
  {
    id: "sql-earn-more-than-manager",
    kind: "sql",
    title: "Employees earning more than their manager",
    pillar: "data",
    competency: "sql",
    category: "sql/joins",
    difficulty: "Easy",
    source: { kind: "practice" },
    tracks: ["consulting"],
    tags: ["self-join"],
    targetMin: 4,
    datasetId: "hr",
    ordered: false,
    statement: `Return every employee whose salary is strictly greater than their direct manager's salary.

Return \`name\`, \`salary\`, \`manager_salary\`.`,
    sample: { input: "Gita (9.5L) reports to Farhan (9L)", output: "name | salary | manager_salary\nGita | 950000 | 900000" },
    starter: `-- Return: name, salary, manager_salary
SELECT e.name, e.salary
FROM employees e;`,
    solution: `SELECT e.name, e.salary, m.salary AS manager_salary
FROM employees e
JOIN employees m ON m.emp_id = e.manager_id
WHERE e.salary > m.salary;`,
    tests: T2,
    hints: ["Join the table to itself: one alias for the employee, one for the manager."],
    context: {
      why: "The standard self-join warm-up. It is quick, and it shows whether you alias cleanly.",
      traps: ["Joining on e.emp_id = m.manager_id reverses the relationship.", "Department heads have NULL manager_id; an INNER JOIN drops them, which is what you want here."],
      followUps: ["Employees who earn more than the average of their department.", "The full reporting chain for one employee (recursive CTE)."],
    },
  },

  // ───────────────────────── Python ─────────────────────────
  {
    id: "py-two-sum",
    kind: "python",
    title: "Two-sum with a hashmap",
    pillar: "data",
    competency: "python_stats",
    category: "python/dsa-lite",
    difficulty: "Easy",
    source: { kind: "practice" },
    tracks: ["fintech"],
    tags: ["hashmap", "arrays"],
    targetMin: 6,
    statement: `Write \`two_sum(nums, target)\` that returns a tuple \`(i, j)\` with \`i < j\` such that \`nums[i] + nums[j] == target\`.

Exactly one such pair exists. Aim for a single pass.`,
    constraints: ["2 ≤ len(nums) ≤ 10⁵", "Exactly one valid pair.", "O(n) time expected."],
    sample: { input: "two_sum([2, 7, 11, 15], 9)", output: "(0, 1)" },
    starter: `def two_sum(nums, target):
    # return (i, j) with i < j
    pass
`,
    solution: `def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return (seen[target - x], i)
        seen[x] = i
`,
    tests: [
      { id: "t1", name: "Sample", hidden: false, call: "two_sum([2, 7, 11, 15], 9)", expected: "(0, 1)" },
      { id: "t2", name: "Pair at the end", hidden: false, call: "two_sum([3, 2, 4], 6)", expected: "(1, 2)" },
      { id: "t3", name: "Hidden: duplicates", hidden: true, call: "two_sum([3, 3], 6)", expected: "(0, 1)" },
      { id: "t4", name: "Hidden: negatives", hidden: true, call: "two_sum([-4, 10, 1, 6, -1], 5)", expected: "(3, 4)" },
      { id: "t5", name: "Hidden: 50k elements", hidden: true, call: "two_sum(list(range(50000)), 99997)", expected: "(49998, 49999)" },
    ],
    hints: ["For each x you need target − x. What structure answers 'have I seen this value, and where?' in O(1)?"],
    context: {
      why: "Non-core online assessments stay at easy-to-medium, Python-first. Arrays and hashmaps were named explicitly, and panels often ask you to explain the logic of your code afterwards.",
      traps: ["The nested-loop O(n²) version times out on large hidden cases.", "Storing the value before checking makes [3, 3] with target 6 match an element with itself."],
      followUps: ["Return all pairs.", "The array is sorted: do it in O(1) extra space.", "State the time and space complexity."],
    },
  },
  {
    id: "py-longest-unique",
    kind: "python",
    title: "Longest substring without repeating characters",
    pillar: "data",
    competency: "python_stats",
    category: "python/dsa-lite",
    difficulty: "Medium",
    source: { kind: "practice" },
    tracks: ["fintech"],
    tags: ["sliding window", "strings"],
    targetMin: 12,
    statement: `Write \`longest_unique(s)\` that returns the length of the longest contiguous substring of \`s\` with no repeated character.`,
    constraints: ["0 ≤ len(s) ≤ 10⁵", "O(n) time expected."],
    sample: { input: 'longest_unique("abcabcbb")', output: "3" },
    starter: `def longest_unique(s):
    pass
`,
    solution: `def longest_unique(s):
    last, start, best = {}, 0, 0
    for i, c in enumerate(s):
        if c in last and last[c] >= start:
            start = last[c] + 1
        last[c] = i
        best = max(best, i - start + 1)
    return best
`,
    tests: [
      { id: "t1", name: "Sample", hidden: false, call: 'longest_unique("abcabcbb")', expected: "3" },
      { id: "t2", name: "All same", hidden: false, call: 'longest_unique("bbbbb")', expected: "1" },
      { id: "t3", name: "Hidden: empty string", hidden: true, call: 'longest_unique("")', expected: "0" },
      { id: "t4", name: "Hidden: repeat behind the window", hidden: true, call: 'longest_unique("abba")', expected: "2" },
      { id: "t5", name: "Hidden: window at the end", hidden: true, call: 'longest_unique("pwwkewxyz")', expected: "6" },
    ],
    hints: ["Keep a window [start, i] that is always valid.", "Remember the last index of each character; when you see a repeat inside the window, jump start past it."],
    context: {
      why: "Sliding window is the pattern students most often reported for analyst-track coding rounds, and tracing it by hand appears in assessment syllabi.",
      traps: ['"abba": when the second a arrives its last index is behind the window start. Moving start backwards is the classic bug.', "Returning the substring instead of its length."],
      followUps: ["Return the substring itself.", "At most k distinct characters.", "Trace the window on 'abcabcbb' by hand."],
    },
  },
  {
    id: "py-f1-from-scratch",
    kind: "python",
    title: "Precision, recall and F1 from scratch",
    pillar: "data",
    competency: "python_stats",
    category: "python/metrics",
    difficulty: "Easy",
    source: { kind: "practice" },
    tracks: ["fintech"],
    tags: ["confusion matrix", "f1"],
    targetMin: 8,
    statement: `Write \`prf(y_true, y_pred)\` that takes two equal-length lists of 0/1 labels and returns \`(precision, recall, f1)\` rounded to 3 decimals, with 1 as the positive class.

If a denominator is zero, that metric is \`0.0\`. Do not import anything.`,
    constraints: ["Labels are 0 or 1.", "Round each value to 3 decimals.", "Zero denominators give 0.0."],
    sample: { input: "prf([1,1,1,0,0,1], [1,0,1,1,0,1])", output: "(0.75, 0.75, 0.75)" },
    starter: `def prf(y_true, y_pred):
    # return (precision, recall, f1), each rounded to 3 decimals
    pass
`,
    solution: `def prf(y_true, y_pred):
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return (round(precision, 3), round(recall, 3), round(f1, 3))
`,
    tests: [
      { id: "t1", name: "Sample", hidden: false, call: "prf([1,1,1,0,0,1], [1,0,1,1,0,1])", expected: "(0.75, 0.75, 0.75)" },
      { id: "t2", name: "TP=40, FP=10, FN=20", hidden: false, call: "prf([1]*60 + [0]*10, [1]*40 + [0]*20 + [1]*10)", expected: "(0.8, 0.667, 0.727)" },
      { id: "t3", name: "Hidden: no positive predictions", hidden: true, call: "prf([1,0,1], [0,0,0])", expected: "(0.0, 0.0, 0.0)" },
      { id: "t4", name: "Hidden: perfect", hidden: true, call: "prf([1,0,1,0], [1,0,1,0])", expected: "(1.0, 1.0, 1.0)" },
    ],
    hints: ["Count TP, FP and FN in one pass over zip(y_true, y_pred).", "Guard each division."],
    context: {
      why: "One reported assessment replaced DSA with ML coding and asked for an F-score calculation. Writing it without sklearn shows you know what the number means.",
      traps: ["Dividing by zero when the model predicts no positives.", "Mixing up FP and FN: FP is predicted 1 but actually 0."],
      followUps: ["Do the same with sklearn and name the imports.", "Why F1 and not accuracy on a 1% fraud rate?", "Extend to F-beta. When would beta be 2?"],
    },
  },
  {
    id: "py-pandas-top-city",
    kind: "python",
    title: "Top-spending city per month (pandas)",
    pillar: "data",
    competency: "python_stats",
    category: "python/pandas",
    difficulty: "Medium",
    source: { kind: "practice" },
    tracks: ["ecommerce"],
    tags: ["merge", "groupby", "idxmax"],
    targetMin: 12,
    packages: ["pandas"],
    setup: `import pandas as pd
users = pd.DataFrame({"user_id": [1, 2, 3, 4], "city": ["Hyderabad", "Mumbai", "Hyderabad", "Bengaluru"]})
orders = pd.DataFrame({
    "user_id": [1, 1, 2, 3, 2, 4, 3, 4, 2],
    "order_date": pd.to_datetime(["2026-01-01", "2026-01-05", "2026-01-10", "2026-01-30", "2026-02-15", "2026-02-10", "2026-02-02", "2026-03-04", "2026-03-10"]),
    "amount": [250, 150, 700, 500, 350, 275, 310, 125, 600],
})
`,
    statement: `Two DataFrames are already loaded: \`users(user_id, city)\` and \`orders(user_id, order_date, amount)\`.

Write \`top_city(orders, users)\` that returns a list of \`(month, city, total)\` tuples, one per month, for the city with the highest total order amount that month. \`month\` is a string like \`"2026-01"\`. Sort by month.`,
    constraints: ["month formatted as YYYY-MM.", "total as a Python int.", "No ties in the test data."],
    sample: { input: "top_city(orders, users)", output: '[("2026-01", "Hyderabad", 900), ...]' },
    starter: `def top_city(orders, users):
    m = orders.merge(users, on="user_id")
    # ...
    return []
`,
    solution: `def top_city(orders, users):
    m = orders.merge(users, on="user_id")
    m["month"] = m["order_date"].dt.strftime("%Y-%m")
    agg = m.groupby(["month", "city"], as_index=False)["amount"].sum()
    top = agg.loc[agg.groupby("month")["amount"].idxmax()].sort_values("month")
    return [(r.month, r.city, int(r.amount)) for r in top.itertuples()]
`,
    tests: [
      {
        id: "t1",
        name: "Sample frames",
        hidden: false,
        call: "top_city(orders, users)",
        expected: '[("2026-01", "Hyderabad", 900), ("2026-02", "Mumbai", 350), ("2026-03", "Mumbai", 600)]',
      },
      {
        id: "t2",
        name: "Hidden: single month",
        hidden: true,
        call: 'top_city(orders[orders["order_date"] < "2026-02-01"], users)',
        expected: '[("2026-01", "Hyderabad", 900)]',
      },
    ],
    hints: ["Merge, derive the month, then group by month and city.", "groupby('month')['amount'].idxmax() gives the row label of each month's top city."],
    context: {
      why: "Merge → groupby → pick the top row per group is the pandas version of a top-N-per-group SQL query, and data-frame manipulation was tested directly in reported assessments.",
      traps: ["sort_values().head(1) returns one row overall, not one per month.", "Forgetting as_index=False, then indexing by column name fails."],
      followUps: ["Top 2 cities per month.", "Write the same thing in SQL.", "What if two cities tie?"],
    },
  },
];
