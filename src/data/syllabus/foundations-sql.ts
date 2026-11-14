import { C, N, Q, R, T } from "./build";

const SQL50 = R("LeetCode SQL 50", "https://leetcode.com/studyplan/top-sql-50/", "Write each query before looking at the answer");
const LEMUR = R("DataLemur SQL questions", "https://datalemur.com/questions?category=SQL", "Company-style analyst questions");
const STRATA = R("StrataScratch", "https://www.stratascratch.com/", "Interview questions on real schemas");
const MODE = R("Mode SQL tutorial", "https://mode.com/sql-tutorial/", "Clear written lessons, basic to advanced");
const PGEX = R("PostgreSQL Exercises", "https://pgexercises.com/", "Graded practice on one schema");

T("sql-basics", "foundations", "SQL", "SELECT, filtering and sorting", "Reading rows: WHERE, NULL logic, ORDER BY, LIMIT, DISTINCT.", `
A query is read by the engine in this logical order, not the order you type it:

1. FROM and JOIN: build the row set
2. WHERE: filter rows
3. GROUP BY: form groups
4. HAVING: filter groups
5. SELECT: compute output columns (aliases are born here)
6. DISTINCT
7. ORDER BY
8. LIMIT / OFFSET

That order explains most beginner errors: an alias defined in SELECT cannot be used in WHERE, and an aggregate cannot appear in WHERE.

**Filtering.** Comparison operators \`= <> < <= > >=\`; \`BETWEEN a AND b\` is inclusive on both ends; \`IN (…)\` tests membership; \`LIKE\` uses \`%\` (any run of characters) and \`_\` (exactly one). In PostgreSQL \`LIKE\` is case-sensitive and \`ILIKE\` is not. \`AND\` binds tighter than \`OR\`, so bracket mixed conditions.

**NULL** means unknown. Any comparison with NULL yields NULL, which WHERE treats as not true. Use \`IS NULL\` / \`IS NOT NULL\`. \`COALESCE(x, y)\` returns the first non-NULL argument; \`NULLIF(a, b)\` returns NULL when a = b (handy to avoid division by zero).

**Sorting.** \`ORDER BY col DESC, other ASC\`. Without ORDER BY the row order is undefined. Add a tie-breaker when the result must be deterministic. \`LIMIT n OFFSET m\` pages through sorted rows.

**DISTINCT** removes duplicate output rows and applies to the whole select list, not one column.

\`\`\`
SELECT name, price
FROM products
WHERE category = 'Electronics' AND price BETWEEN 1000 AND 50000
ORDER BY price DESC, name
LIMIT 5;
\`\`\`
`, { resources: [MODE, SQL50, PGEX], categories: ["sql/basics"] });
Q(1, "Which clause is evaluated first, logically?", ["SELECT", "WHERE", "FROM", "ORDER BY"], 2, "FROM/JOIN builds the rows, then WHERE filters them; SELECT comes after grouping.");
Q(1, "`WHERE city = NULL` returns…", ["rows where city is NULL", "no rows", "all rows", "an error"], 1, "Comparing with NULL gives NULL (unknown), never true. Use IS NULL.");
Q(1, "`price BETWEEN 100 AND 200` includes…", ["neither bound", "only 100", "only 200", "both 100 and 200"], 3, "BETWEEN is inclusive on both ends.");
Q(2, "Why does `SELECT price * 2 AS dbl FROM t WHERE dbl > 10` fail?", ["Aliases cannot contain letters", "WHERE runs before SELECT, so the alias does not exist yet", "Multiplication is not allowed in SELECT", "dbl is a reserved word"], 1, "Logical order: WHERE is evaluated before SELECT. Repeat the expression or wrap it in a subquery/CTE.");
Q(2, "`WHERE a = 1 OR b = 2 AND c = 3` is read as…", ["(a = 1 OR b = 2) AND c = 3", "a = 1 OR (b = 2 AND c = 3)", "an error", "left to right"], 1, "AND has higher precedence than OR.");
Q(2, "Which pattern matches names whose second letter is 'a'?", ["'a%'", "'%a%'", "'_a%'", "'%a'"], 2, "_ matches exactly one character, % any run.");
Q(2, "`SELECT DISTINCT city, segment FROM customers` removes duplicates of…", ["city only", "segment only", "the (city, segment) pair", "nothing"], 2, "DISTINCT applies to the whole select list.");
N(2, "A table has 10 rows; `x` is NULL in 3 of them and equals 5 in 4. How many rows does `WHERE x <> 5` return?", 3, 0, "Rows where x is NULL evaluate to unknown and are dropped. 10 − 4 − 3 = 3.");
Q(3, "`NULLIF(qty, 0)` is most often used to…", ["replace NULL with 0", "avoid division by zero by turning 0 into NULL", "count NULLs", "compare two NULLs"], 1, "x / NULLIF(qty, 0) yields NULL instead of raising an error.");
C("Logical order of query clauses", "FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT");
C("How do you test for NULL?", "IS NULL / IS NOT NULL. `= NULL` is never true.");
C("COALESCE vs NULLIF", "COALESCE(a, b): first non-NULL. NULLIF(a, b): NULL if a = b, else a.");
C("LIKE wildcards", "% any run of characters (including none); _ exactly one character. ILIKE is case-insensitive in PostgreSQL.");

T("sql-aggregation", "foundations", "SQL", "Aggregation, GROUP BY and HAVING", "Collapsing rows into groups and filtering the groups.", `
Aggregates turn many rows into one value: \`COUNT, SUM, AVG, MIN, MAX\`.

- \`COUNT(*)\` counts rows. \`COUNT(col)\` counts non-NULL values. \`COUNT(DISTINCT col)\` counts distinct non-NULL values.
- SUM, AVG, MIN, MAX ignore NULLs. AVG divides by the number of non-NULL values, so \`AVG(x)\` and \`SUM(x) / COUNT(*)\` differ when x has NULLs.
- SUM over zero rows is NULL, not 0. Wrap in COALESCE when a zero is expected.

**GROUP BY** makes one output row per distinct combination of the grouping columns. Every selected column must be either grouped or aggregated.

**WHERE vs HAVING.** WHERE filters rows before grouping and cannot contain aggregates. HAVING filters groups after aggregation. Filter as early as you can: a condition on a raw column belongs in WHERE.

**Conditional aggregation** turns categories into columns in one pass:

\`\`\`
SELECT customer_id,
       COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
FROM orders
GROUP BY customer_id
HAVING COUNT(*) >= 2;
\`\`\`

**Integer division.** In PostgreSQL \`3 / 2\` is 1. Multiply by \`1.0\` or \`100.0\`, or cast, before dividing.

**Grain.** Before aggregating after a join, ask what one row represents. Joining orders to order lines repeats each order once per line, so \`COUNT(*)\` counts lines. Use \`COUNT(DISTINCT order_id)\` or aggregate before joining.
`, { resources: [SQL50, MODE, LEMUR], categories: ["sql/aggregation"] });
Q(1, "`COUNT(col)` differs from `COUNT(*)` because it…", ["counts distinct values", "skips rows where col is NULL", "counts only numbers", "is slower"], 1, "COUNT(col) counts non-NULL values of col.");
Q(1, "Which clause filters on an aggregate such as SUM(amount) > 1000?", ["WHERE", "HAVING", "ON", "GROUP BY"], 1, "HAVING runs after grouping; WHERE cannot reference aggregates.");
N(1, "Values of x: 10, NULL, 20, NULL. What is AVG(x)?", 15, 0.001, "NULLs are ignored: (10 + 20) / 2 = 15.");
N(2, "Same values (10, NULL, 20, NULL). What is SUM(x) / COUNT(*) using decimal division?", 7.5, 0.001, "30 / 4 = 7.5. COUNT(*) counts the NULL rows too.");
Q(2, "`SELECT dept, name, MAX(salary) FROM emp GROUP BY dept` is…", ["valid and returns the top earner's name", "invalid: name is neither grouped nor aggregated", "valid but slow", "valid only with HAVING"], 1, "Standard SQL rejects it. To get the name of the top earner use a window function or a join back.");
Q(2, "SUM(amount) over a group with no matching rows after a LEFT JOIN returns…", ["0", "NULL", "an error", "an empty string"], 1, "SUM of no values is NULL. Use COALESCE(SUM(amount), 0).");
Q(2, "`COUNT(CASE WHEN status = 'x' THEN 1 ELSE 0 END)` counts…", ["rows with status x", "all rows", "rows without status x", "nothing"], 1, "0 is not NULL, so every row is counted. Drop the ELSE or use SUM.");
Q(3, "orders joined to order_items, then `COUNT(*)` grouped by customer. This counts…", ["orders", "order lines", "customers", "products"], 1, "The join grain is one row per line. Use COUNT(DISTINCT order_id) for orders.");
N(2, "In PostgreSQL, what does `SELECT 7 / 2` return?", 3, 0, "Integer division truncates. Use 7 / 2.0 for 3.5.");
C("WHERE vs HAVING", "WHERE filters rows before grouping (no aggregates). HAVING filters groups after aggregation.");
C("COUNT(*) vs COUNT(col) vs COUNT(DISTINCT col)", "All rows / non-NULL values / distinct non-NULL values.");
C("How do aggregates treat NULL?", "They skip it. AVG divides by the non-NULL count. SUM of nothing is NULL.");
C("Conditional aggregation", "COUNT(*) FILTER (WHERE cond) or SUM(CASE WHEN cond THEN 1 ELSE 0 END): pivots categories into columns.");

T("sql-joins", "foundations", "SQL", "Joins", "INNER, LEFT, RIGHT, FULL, CROSS, self-joins and anti-joins.", `
A join pairs rows from two tables where a condition holds.

- **INNER JOIN**: only matching pairs.
- **LEFT JOIN**: every left row; right columns are NULL where nothing matched.
- **RIGHT JOIN**: mirror image of LEFT. Most people rewrite it as a LEFT JOIN.
- **FULL OUTER JOIN**: every row from both sides.
- **CROSS JOIN**: every combination (m × n rows).
- **Self-join**: a table joined to itself with two aliases, for example employee and manager.

**Row counts.** If a key is unique on one side, a join cannot multiply rows of the other side. If it is duplicated on both sides you get a many-to-many fan-out: 3 rows × 2 rows = 6 rows for that key. Always know which side is unique.

**ON vs WHERE in an outer join.** A condition on the right table placed in ON only restricts which rows match; unmatched left rows survive with NULLs. The same condition in WHERE runs after the join and removes those NULL rows, quietly turning the LEFT JOIN into an INNER JOIN.

**Anti-join** (rows with no match):

\`\`\`
SELECT c.*
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;
\`\`\`

\`NOT EXISTS\` does the same and is NULL-safe. \`NOT IN (subquery)\` returns nothing if the subquery yields a NULL.

**Semi-join** (rows with at least one match, each once): \`WHERE EXISTS (…)\`. A plain join would repeat the left row per match.

NULL keys never match each other in a join.
`, { resources: [SQL50, MODE, STRATA], categories: ["sql/joins"] });
Q(1, "Which join keeps every row of the left table?", ["INNER", "LEFT", "CROSS", "None"], 1, "LEFT JOIN keeps all left rows and fills right columns with NULL when there is no match.");
N(1, "Table A has 4 rows, B has 5 rows. Rows in A CROSS JOIN B?", 20, 0, "Every combination: 4 × 5.");
N(2, "A has ids (1, 2, 2, 3); B has ids (2, 2, 4). Rows in A INNER JOIN B ON id?", 4, 0, "Only id 2 matches: 2 rows × 2 rows = 4.");
N(2, "Same tables. Rows in A LEFT JOIN B ON id?", 6, 0, "4 matched rows for id 2, plus ids 1 and 3 with NULLs: 6.");
N(3, "Same tables. Rows in A FULL OUTER JOIN B ON id?", 7, 0, "The 6 from the left join plus B's unmatched id 4.");
Q(2, "LEFT JOIN orders o … WHERE o.status = 'delivered' behaves like…", ["a LEFT JOIN", "an INNER JOIN", "a CROSS JOIN", "a FULL JOIN"], 1, "The WHERE removes rows where o.status is NULL, i.e. the unmatched left rows. Put the condition in ON to keep them.");
Q(2, "The safest way to find customers with no orders is…", ["NOT IN (SELECT customer_id FROM orders)", "NOT EXISTS, or LEFT JOIN … IS NULL", "INNER JOIN", "CROSS JOIN with a filter"], 1, "NOT IN returns no rows if the subquery contains a NULL.");
Q(2, "To list employees with their manager's name from one employees table you need…", ["a self-join", "a cross join", "UNION", "GROUP BY"], 0, "Join employees e to employees m on e.manager_id = m.emp_id.");
Q(3, "Rows with NULL in the join key on both sides…", ["match each other", "never match", "raise an error", "match once"], 1, "NULL = NULL is unknown, so they do not join.");
C("ON vs WHERE in a LEFT JOIN", "Filter on the right table in ON keeps unmatched left rows; in WHERE it removes them (becomes an inner join).");
C("Anti-join pattern", "LEFT JOIN … WHERE right.key IS NULL, or NOT EXISTS. Avoid NOT IN with nullable columns.");
C("Why does a join multiply rows?", "The key is duplicated on both sides (many-to-many). Rows for a key = left count × right count.");
C("EXISTS vs JOIN", "EXISTS returns each outer row once (semi-join); a join repeats it per match.");

T("sql-subqueries", "foundations", "SQL", "Subqueries", "Scalar, IN / EXISTS, correlated and derived tables.", `
A subquery is a query inside another query.

- **Scalar**: returns one value. \`WHERE price > (SELECT AVG(price) FROM products)\`.
- **List**: used with \`IN\`, \`ANY\`, \`ALL\`.
- **Table (derived table)**: in FROM, must be aliased.
- **Correlated**: refers to a column of the outer query, so it is logically re-evaluated per outer row.

\`\`\`
-- products above their own category's average
SELECT p.name
FROM products p
WHERE p.price > (SELECT AVG(p2.price)
                 FROM products p2
                 WHERE p2.category = p.category);
\`\`\`

**EXISTS** checks whether the subquery returns any row and stops at the first. It is the natural way to say "has at least one" and \`NOT EXISTS\` to say "has none".

**IN vs EXISTS.** Equivalent for non-NULL data. \`NOT IN\` is dangerous: if the list contains a NULL the whole predicate is never true.

**Latest row per group** with a correlated subquery:

\`\`\`
SELECT o.*
FROM orders o
WHERE o.order_date = (SELECT MAX(order_date) FROM orders x WHERE x.customer_id = o.customer_id);
\`\`\`

Most correlated subqueries can be rewritten as a join to an aggregated derived table or as a window function; interviewers like hearing both. A scalar subquery that returns more than one row is a runtime error.
`, { resources: [SQL50, MODE], categories: ["sql/subqueries"] });
Q(1, "A subquery that refers to a column of the outer query is called…", ["scalar", "correlated", "derived", "recursive"], 1, "It depends on the outer row.");
Q(2, "`WHERE id NOT IN (SELECT ref FROM t)` returns nothing when…", ["t is empty", "t.ref contains a NULL", "id is an integer", "t has duplicates"], 1, "x NOT IN (…, NULL) is never true. Use NOT EXISTS.");
Q(2, "A subquery in FROM must…", ["be correlated", "have an alias", "return one row", "use DISTINCT"], 1, "Derived tables need an alias in PostgreSQL and MySQL.");
Q(2, "`WHERE salary = (SELECT salary FROM emp WHERE dept = 'X')` fails at run time when…", ["dept X has no rows", "dept X has more than one row", "salary is NULL", "never"], 1, "A scalar subquery must return at most one row.");
Q(2, "Best phrase for 'customers with at least one order', each listed once:", ["JOIN orders", "WHERE EXISTS (SELECT 1 FROM orders …)", "CROSS JOIN orders", "UNION orders"], 1, "EXISTS is a semi-join: no duplicates.");
Q(3, "`SELECT MAX(salary) FROM emp WHERE salary < (SELECT MAX(salary) FROM emp)` returns…", ["the highest salary", "the second-highest distinct salary", "the lowest salary", "an error"], 1, "The largest value strictly below the maximum.");
C("Correlated subquery", "References the outer row; logically runs once per outer row. Often rewritable as a join or window function.");
C("EXISTS vs IN", "Same result on non-NULL data. NOT IN breaks on NULLs; NOT EXISTS does not.");
C("Second-highest salary, three ways", "MAX below MAX; DENSE_RANK() = 2; DISTINCT … ORDER BY DESC LIMIT 1 OFFSET 1.");

T("sql-cte", "foundations", "SQL", "CTEs and recursion", "WITH clauses for readable multi-step queries and hierarchies.", `
A common table expression names a subquery so later steps can use it:

\`\`\`
WITH order_totals AS (
  SELECT order_id, SUM(qty * unit_price) AS total
  FROM order_items
  GROUP BY order_id
),
big AS (
  SELECT * FROM order_totals WHERE total > 10000
)
SELECT COUNT(*) FROM big;
\`\`\`

Why interviewers prefer CTEs: each step has one job and a name, you can explain the query top to bottom, and a window function computed in one CTE can be filtered in the next. One student reported that the panel explicitly asked for CTE style because it is the office standard.

- A CTE exists only for the statement it belongs to. A **temp table** persists for the session and can be indexed. A **view** is a saved query.
- Several CTEs are separated by commas after a single WITH.
- A CTE can be referenced more than once (for example as rows and as a denominator).

**Recursive CTE**: an anchor member, UNION ALL, and a recursive member that joins back to the CTE.

\`\`\`
WITH RECURSIVE chain AS (
  SELECT emp_id, name, 1 AS level FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.emp_id, e.name, c.level + 1
  FROM employees e JOIN chain c ON e.manager_id = c.emp_id
)
SELECT * FROM chain;
\`\`\`

Use it for org charts, category trees and generating sequences. It stops when the recursive member returns no rows; cyclic data needs a depth limit. In PostgreSQL, \`generate_series(start, stop, step)\` builds number or date sequences directly, which is the usual way to create a calendar to LEFT JOIN facts onto.
`, { resources: [MODE, LEMUR], categories: ["sql/cte"] });
Q(1, "A CTE is introduced with the keyword…", ["USING", "WITH", "DECLARE", "TEMP"], 1, "WITH name AS (…).");
Q(2, "How long does a CTE live?", ["Until the session ends", "Only for the statement it is part of", "Until dropped", "Forever"], 1, "It is scoped to one statement, unlike a temp table.");
Q(2, "The two parts of a recursive CTE are joined by…", ["JOIN", "UNION ALL", "INTERSECT", "HAVING"], 1, "Anchor member UNION ALL recursive member.");
Q(2, "A recursive CTE stops when…", ["LIMIT is reached", "the recursive member returns no new rows", "100 iterations pass", "the anchor is empty"], 1, "Iteration ends when a step produces nothing.");
Q(2, "To filter on ROW_NUMBER() = 1 you normally…", ["put it in WHERE of the same SELECT", "compute it in a CTE and filter in the next step", "use HAVING", "use GROUP BY"], 1, "Window functions are evaluated after WHERE, so wrap them.");
Q(3, "Months with zero orders are missing from a GROUP BY month report. The fix is…", ["HAVING COUNT(*) >= 0", "build a calendar (generate_series) and LEFT JOIN orders onto it", "use DISTINCT", "ORDER BY month"], 1, "Groups only exist for rows that exist. Generate the periods, then outer-join the facts.");
C("CTE vs subquery vs temp table", "CTE: named, one statement, readable. Subquery: inline. Temp table: persists for the session, can be indexed.");
C("Recursive CTE shape", "WITH RECURSIVE t AS (anchor UNION ALL recursive member joining t) SELECT … FROM t");
C("How to show periods with zero activity", "Generate the calendar, LEFT JOIN facts, COUNT a right-side column.");

T("sql-window", "foundations", "SQL", "Window functions", "Ranking, LAG/LEAD, running totals and frames without collapsing rows.", `
A window function computes across a set of rows related to the current row and keeps every row.

\`\`\`
function() OVER (PARTITION BY … ORDER BY … ROWS BETWEEN … AND …)
\`\`\`

- **PARTITION BY** splits rows into independent groups (omit it for one global window).
- **ORDER BY** orders rows inside the partition; required for ranking, LAG/LEAD and running calculations.
- **Frame** limits which rows of the partition are used.

**Ranking** on values 100, 100, 90:

- \`ROW_NUMBER()\` → 1, 2, 3 (ties broken arbitrarily unless you add a tie-breaker)
- \`RANK()\` → 1, 1, 3 (gaps)
- \`DENSE_RANK()\` → 1, 1, 2 (no gaps)
- \`NTILE(n)\` splits the partition into n buckets.

**Offset**: \`LAG(x, k, default)\` and \`LEAD(x, k, default)\` read a previous or following row. \`FIRST_VALUE\`, \`LAST_VALUE\`.

**Aggregates as windows**: \`SUM(x) OVER (PARTITION BY g)\` gives the group total on every row; adding ORDER BY makes it a running total.

**Frames.** With ORDER BY and no explicit frame, the default is \`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\`, which treats rows tied on the ORDER BY value as one step. For moving averages state the frame: \`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\`. A ROWS frame counts rows, not days: fill missing dates first.

Window functions run after WHERE, GROUP BY and HAVING, so you cannot filter on them in the same SELECT. Compute in a CTE, filter outside.

Patterns to know cold:

- Top N per group: \`ROW_NUMBER()\` or \`DENSE_RANK()\` then \`WHERE rn <= N\`
- Latest row per key: \`ROW_NUMBER() OVER (PARTITION BY key ORDER BY ts DESC) = 1\`
- Period-over-period: \`x - LAG(x) OVER (ORDER BY period)\`
- Percent of total: \`x / SUM(x) OVER ()\`
- Gaps and islands: \`date - ROW_NUMBER()\` is constant within a run of consecutive dates
`, { resources: [R("techTFQ: window functions", "https://www.youtube.com/watch?v=Ww71knvhQ-s", "25-minute overview"), LEMUR, SQL50], categories: ["sql/window", "sql/gaps-islands"] });
Q(1, "Salaries 100, 100, 90 ranked descending. DENSE_RANK gives…", ["1, 2, 3", "1, 1, 3", "1, 1, 2", "1, 1, 1"], 2, "DENSE_RANK leaves no gap after ties.");
Q(1, "Same salaries. RANK gives…", ["1, 2, 3", "1, 1, 3", "1, 1, 2", "2, 2, 3"], 1, "RANK skips the next rank after a tie.");
Q(1, "Which function reads the previous row's value?", ["LEAD", "LAG", "NTILE", "FIRST_VALUE"], 1, "LAG looks back; LEAD looks ahead.");
Q(2, "`SUM(x) OVER (PARTITION BY g)` with no ORDER BY returns, on each row…", ["a running total", "the total of the row's group", "the grand total", "x itself"], 1, "Without ORDER BY the frame is the whole partition.");
Q(2, "Why can't you write `WHERE ROW_NUMBER() OVER (…) = 1`?", ["ROW_NUMBER needs GROUP BY", "Window functions are evaluated after WHERE", "It is too slow", "ROW_NUMBER returns text"], 1, "Compute it in a CTE or subquery, then filter.");
N(2, "Daily values 10, 20, 30, 40. `AVG(v) OVER (ORDER BY d ROWS BETWEEN 1 PRECEDING AND CURRENT ROW)` on the last row?", 35, 0.001, "Average of 30 and 40.");
N(2, "Values 5, 5, 10 ordered ascending. `SUM(v) OVER (ORDER BY v)` (default frame) on the first row?", 10, 0.001, "The default RANGE frame includes peers tied on the ORDER BY value: 5 + 5.");
Q(3, "For consecutive-day streaks, `date - ROW_NUMBER() OVER (PARTITION BY user ORDER BY date)` is useful because it…", ["counts days", "is constant within a run of consecutive dates", "removes duplicates", "sorts the rows"], 1, "Both increase by 1 each day inside a streak, so the difference is fixed; it changes when a day is skipped.");
Q(2, "To split customers into 4 equal-size spend buckets use…", ["RANK()", "NTILE(4)", "LAG(4)", "COUNT(4)"], 1, "NTILE(n) assigns bucket numbers 1..n.");
Q(3, "A '7-day moving average' written as `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` is wrong when…", ["values are negative", "some days have no row", "there are more than 7 rows", "the table is partitioned"], 1, "ROWS counts rows. Missing dates make the window span more than 7 days.");
C("ROW_NUMBER vs RANK vs DENSE_RANK on 100, 100, 90", "1,2,3 / 1,1,3 / 1,1,2");
C("Default frame when ORDER BY is present", "RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW: ties are included together.");
C("Top N per group", "Rank inside a CTE with PARTITION BY group ORDER BY measure DESC, then WHERE rank <= N.");
C("Gaps-and-islands trick", "date − ROW_NUMBER() is constant within consecutive dates; group by it and count.");
C("Percent of total with a window", "x / SUM(x) OVER () (or OVER (PARTITION BY g) for share within group).");

T("sql-dates", "foundations", "SQL", "Dates, cohorts and retention", "Truncating, differencing, period-over-period and cohort queries.", `
PostgreSQL date tools:

- \`DATE_TRUNC('month', ts)\` snaps to the start of the period ('day', 'week', 'month', 'quarter', 'year'). Cast with \`::date\`.
- \`EXTRACT(YEAR FROM d)\`, \`EXTRACT(MONTH …)\`, \`EXTRACT(ISODOW …)\` (Monday = 1).
- \`date2 - date1\` is an integer number of days. Timestamps subtract to an interval.
- \`d + INTERVAL '7 days'\`, \`d + 1\` (for dates).
- \`TO_CHAR(d, 'YYYY-MM')\` formats; \`CURRENT_DATE\` is today.
- \`generate_series(start, stop, INTERVAL '1 day')\` builds a calendar.

MySQL equivalents you may be asked: \`DATE_FORMAT\`, \`DATEDIFF(a, b)\`, \`DATE_ADD\`, \`NOW()\`.

**Period-over-period**: aggregate to the period first, then \`LAG\`.

\`\`\`
WITH m AS (SELECT DATE_TRUNC('month', order_date)::date AS mon, SUM(amount) AS rev
           FROM orders GROUP BY 1)
SELECT mon, rev,
       ROUND(100.0 * (rev - LAG(rev) OVER (ORDER BY mon)) / LAG(rev) OVER (ORDER BY mon), 1) AS mom_pct
FROM m;
\`\`\`

**Cohort retention**: a user's cohort is the period of their first activity. Join activity back to the cohort and count distinct users at each offset.

\`\`\`
WITH first_seen AS (SELECT user_id, MIN(event_date) AS d0 FROM events GROUP BY user_id)
SELECT f.d0,
       COUNT(DISTINCT f.user_id) AS users,
       COUNT(DISTINCT e.user_id) AS d1
FROM first_seen f
LEFT JOIN events e ON e.user_id = f.user_id AND e.event_date = f.d0 + 1
GROUP BY f.d0;
\`\`\`

**Half-open ranges.** For timestamps filter with \`ts >= '2025-08-01' AND ts < '2025-09-01'\`. \`BETWEEN … AND '2025-08-31'\` drops everything after midnight on the last day.

Related metrics: DAU / MAU (distinct active users per day / month), stickiness = DAU / MAU, rolling 7-day actives, churn = users active last period and not this one.
`, { resources: [LEMUR, STRATA], categories: ["sql/time-series", "sql/cohorts"] });
Q(1, "`DATE_TRUNC('month', DATE '2025-08-19')` returns…", ["2025-08-19", "2025-08-01", "2025-08-31", "8"], 1, "It snaps to the first instant of the month.");
N(1, "In PostgreSQL, `DATE '2025-03-01' - DATE '2025-02-01'` equals…", 28, 0, "February 2025 has 28 days.");
Q(2, "Filtering a timestamp column for all of August: which is correct?", ["BETWEEN '2025-08-01' AND '2025-08-31'", ">= '2025-08-01' AND < '2025-09-01'", "= '2025-08'", "LIKE '2025-08%'"], 1, "The half-open range keeps the whole last day; BETWEEN stops at midnight on the 31st.");
Q(2, "Month-over-month growth should apply LAG…", ["on raw order rows", "after aggregating to one row per month", "before filtering", "inside WHERE"], 1, "LAG on raw rows looks back one order, not one month.");
Q(2, "A user's cohort in a retention query is usually defined by…", ["their latest activity", "their first activity date (or signup)", "their city", "their total spend"], 1, "Cohorts group users by when they started.");
N(2, "Revenue was 200 in June and 250 in July. MoM growth in %?", 25, 0.01, "(250 − 200) / 200 = 25%.");
N(2, "DAU averages 12,000 and MAU is 60,000. Stickiness in %?", 20, 0.01, "DAU / MAU = 0.20.");
Q(3, "In a D1 retention query an INNER JOIN to next-day events causes…", ["duplicate cohorts", "cohorts with zero retained users to disappear", "wrong dates", "a syntax error"], 1, "Use LEFT JOIN so cohorts with nobody returning still show 0.");
C("Half-open date range", "ts >= start AND ts < next_start. Safe for timestamps; BETWEEN is not.");
C("Cohort retention recipe", "first activity per user → LEFT JOIN activity at offset → COUNT(DISTINCT user) per cohort.");
C("Stickiness", "DAU / MAU: share of monthly users active on a typical day.");

T("sql-case-pivot", "foundations", "SQL", "CASE, pivots and funnels", "Conditional logic, turning rows into columns, funnel counts.", `
\`CASE\` is SQL's if/else and can appear anywhere an expression can.

\`\`\`
CASE WHEN price < 1000 THEN 'budget'
     WHEN price < 20000 THEN 'mid'
     ELSE 'premium' END
\`\`\`

Branches are tested in order and the first true one wins. With no ELSE the result is NULL.

**Pivot** (long to wide) with conditional aggregation:

\`\`\`
SELECT region,
       SUM(CASE WHEN quarter = 'Q1' THEN revenue END) AS q1,
       SUM(CASE WHEN quarter = 'Q2' THEN revenue END) AS q2
FROM sales GROUP BY region;
\`\`\`

**Unpivot** (wide to long): \`UNION ALL\` one SELECT per column, or \`CROSS JOIN LATERAL (VALUES …)\`.

**Funnel**: count distinct users reaching each step.

\`\`\`
SELECT COUNT(DISTINCT CASE WHEN event = 'view' THEN user_id END) AS viewed,
       COUNT(DISTINCT CASE WHEN event = 'cart' THEN user_id END) AS carted,
       COUNT(DISTINCT CASE WHEN event = 'buy'  THEN user_id END) AS bought
FROM events;
\`\`\`

Step conversion = users at step n / users at step n − 1; overall conversion = last / first. This is an "ever did" funnel. A strict funnel also requires the steps in order, which needs each user's first timestamp per step and a comparison.

CASE inside ORDER BY gives a custom sort (\`ORDER BY CASE status WHEN 'open' THEN 1 ELSE 2 END\`). CASE inside an aggregate is the portable form of PostgreSQL's \`FILTER (WHERE …)\`.
`, { resources: [MODE, LEMUR], categories: ["sql/case-pivot"] });
Q(1, "A CASE expression with no ELSE and no matching branch returns…", ["0", "an empty string", "NULL", "an error"], 2, "The implicit ELSE is NULL.");
Q(2, "price = 500. `CASE WHEN price < 20000 THEN 'mid' WHEN price < 1000 THEN 'budget' END` returns…", ["budget", "mid", "NULL", "both"], 1, "The first true branch wins, so order branches from most to least specific.");
N(2, "Funnel: 1,000 viewed, 300 added to cart, 120 purchased. Cart-to-purchase conversion in %?", 40, 0.01, "120 / 300.");
N(1, "Same funnel. Overall view-to-purchase conversion in %?", 12, 0.01, "120 / 1,000.");
Q(2, "`COUNT(DISTINCT CASE WHEN event = 'buy' THEN user_id END)` counts…", ["buy events", "distinct users with a buy event", "all users", "NULLs"], 1, "Non-matching rows yield NULL, which COUNT ignores.");
Q(3, "Turning columns q1, q2, q3 into rows (quarter, revenue) is called…", ["pivot", "unpivot", "rollup", "self-join"], 1, "Unpivot: wide to long, typically with UNION ALL.");
C("CASE evaluation rule", "First true WHEN wins; no ELSE → NULL.");
C("Pivot in plain SQL", "One SUM(CASE WHEN category = 'x' THEN value END) per output column, GROUP BY the row key.");
C("Funnel conversion", "Step: users at step n ÷ users at step n−1. Overall: last ÷ first. Count distinct users, not events.");

T("sql-setops-strings", "foundations", "SQL", "Set operations and string functions", "UNION, INTERSECT, EXCEPT and the text functions that show up in OAs.", `
**Set operations** combine the results of two queries with the same number and compatible types of columns.

- \`UNION\`: all rows from both, duplicates removed (needs a sort or hash).
- \`UNION ALL\`: all rows, duplicates kept. Faster; use it unless you need de-duplication.
- \`INTERSECT\`: rows present in both.
- \`EXCEPT\` (\`MINUS\` in Oracle): rows in the first and not in the second.

Column names come from the first query. ORDER BY goes once, at the very end.

"Both A and B" on different rows cannot be written as \`cat = 'A' AND cat = 'B'\`. Use INTERSECT, or \`GROUP BY id HAVING COUNT(DISTINCT cat) = 2\`.

**Strings (PostgreSQL)**

- \`||\` or \`CONCAT(a, b)\`: join text. \`||\` with a NULL gives NULL; CONCAT treats NULL as empty.
- \`LENGTH(s)\`, \`UPPER(s)\`, \`LOWER(s)\`, \`INITCAP(s)\`
- \`LEFT(s, n)\`, \`RIGHT(s, n)\`, \`SUBSTRING(s FROM start FOR len)\` (positions start at 1)
- \`TRIM(s)\`, \`LTRIM\`, \`RTRIM\`, \`REPLACE(s, from, to)\`
- \`POSITION('x' IN s)\`, \`SPLIT_PART(s, '@', 2)\`
- \`STRING_AGG(col, ', ' ORDER BY col)\` aggregates text across rows (MySQL: GROUP_CONCAT)

**Casting**: \`CAST(x AS INT)\` or \`x::int\`. \`ROUND(x, 2)\`, \`CEIL\`, \`FLOOR\`, \`ABS\`, \`MOD(a, b)\`.

MySQL OA items often ask about \`CONCAT\`, \`NOW()\`, \`LIMIT … OFFSET …\` for pagination, and \`IFNULL(x, y)\` (the two-argument COALESCE).
`, { resources: [MODE, PGEX], categories: ["sql/set-strings"] });
Q(1, "Difference between UNION and UNION ALL?", ["UNION ALL removes duplicates", "UNION removes duplicates; UNION ALL keeps them", "No difference", "UNION ALL sorts the output"], 1, "UNION de-duplicates, which costs extra work.");
N(2, "Query A returns (1, 2, 2, 3); B returns (2, 3, 4). Rows in A UNION B?", 4, 0, "Distinct values 1, 2, 3, 4.");
N(2, "Same queries. Rows in A UNION ALL B?", 7, 0, "4 + 3.");
N(2, "Same queries. Rows in A EXCEPT B?", 1, 0, "Only 1 is in A and not in B (EXCEPT de-duplicates).");
Q(2, "`'abc' || NULL` in PostgreSQL returns…", ["'abc'", "NULL", "'abcNULL'", "an error"], 1, "The || operator propagates NULL; CONCAT() does not.");
Q(1, "`SUBSTRING('placement' FROM 1 FOR 5)` returns…", ["'place'", "'lacem'", "'ement'", "'p'"], 0, "Positions start at 1.");
Q(2, "`SPLIT_PART('a.kumar@bits.ac.in', '@', 2)` returns…", ["'a.kumar'", "'bits.ac.in'", "'bits'", "'@'"], 1, "The second piece when splitting on @.");
Q(2, "Pagination: rows 21 to 30 of a sorted result?", ["LIMIT 30 OFFSET 21", "LIMIT 10 OFFSET 20", "LIMIT 20 OFFSET 10", "LIMIT 21, 30"], 1, "Skip 20, take 10.");
C("UNION vs UNION ALL", "UNION removes duplicates (slower). UNION ALL keeps everything.");
C("'Has both A and B' across rows", "INTERSECT, or GROUP BY key HAVING COUNT(DISTINCT cat) = 2.");
C("Aggregate strings across rows", "STRING_AGG(col, ', ') in PostgreSQL; GROUP_CONCAT in MySQL.");

T("sql-dbms", "foundations", "SQL", "DBMS theory: keys, normalisation, indexes, transactions", "The oral-round questions that follow the query writing.", `
**Keys.** Primary key: unique, not NULL, one per table. Candidate key: any minimal column set that could be the primary key. Composite key: more than one column. Foreign key: references a key in another table and enforces referential integrity. Unique constraint: unique but may allow NULL. Surrogate key: an artificial id; natural key: a real-world attribute.

**Normalisation** removes redundancy and update anomalies.

- 1NF: atomic values, no repeating groups.
- 2NF: 1NF and no non-key column depends on only part of a composite key.
- 3NF: 2NF and no non-key column depends on another non-key column (no transitive dependency).
- BCNF: every determinant is a candidate key.

Denormalise deliberately for read-heavy analytics: fewer joins, at the cost of redundancy. A **star schema** has a central fact table (events, numeric measures, foreign keys) and dimension tables (who, what, when, where). A snowflake schema normalises the dimensions further.

**Indexes.** A B-tree index keeps keys sorted, so equality and range lookups take O(log n) instead of a full scan. Costs: extra storage and slower writes. A clustered index defines the physical row order (one per table); non-clustered indexes point to rows. Indexes help WHERE, JOIN and ORDER BY on selective columns; they are not used when the column is wrapped in a function or the pattern starts with %. A composite index (a, b) serves filters on a, or a and b, not b alone.

**Transactions and ACID.** Atomicity: all or nothing. Consistency: constraints hold before and after. Isolation: concurrent transactions do not interfere. Durability: committed data survives a crash. Bank transfer: debit and credit must both commit or both roll back.

Isolation levels and the anomalies they allow: read uncommitted (dirty reads), read committed (non-repeatable reads), repeatable read (phantoms), serializable (none).

**Statements.** DDL: CREATE, ALTER, DROP, TRUNCATE. DML: SELECT, INSERT, UPDATE, DELETE. DELETE removes chosen rows and can be rolled back; TRUNCATE empties the table quickly; DROP removes the table itself.

**OLTP vs OLAP.** OLTP: many small transactions, normalised, row stores. OLAP: large analytical scans, denormalised, column stores (BigQuery, Snowflake, Redshift). **Views** are saved queries; materialised views store the result and need refreshing.
`, { resources: [R("Gate Smashers DBMS playlist", "https://www.youtube.com/playlist?list=PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y", "Normalisation, transactions, indexing"), R("Use The Index, Luke", "https://use-the-index-luke.com/", "How indexes work, for developers")] });
Q(1, "A primary key must be…", ["unique only", "not NULL only", "unique and not NULL", "numeric"], 2, "Both conditions.");
Q(2, "A table violates 2NF when…", ["a column holds a list", "a non-key column depends on part of a composite key", "a non-key column depends on another non-key column", "it has no primary key"], 1, "Partial dependency. Transitive dependency is the 3NF violation.");
Q(2, "Which normal form removes transitive dependencies?", ["1NF", "2NF", "3NF", "None"], 2, "3NF: non-key columns depend only on the key.");
Q(2, "Adding an index usually makes…", ["reads and writes faster", "reads faster and writes slower", "reads slower and writes faster", "no difference"], 1, "Every insert/update must maintain the index.");
Q(2, "Which query can use a B-tree index on `name`?", ["WHERE UPPER(name) = 'A'", "WHERE name LIKE '%son'", "WHERE name LIKE 'Jo%'", "WHERE LENGTH(name) = 3"], 2, "A prefix pattern is a range scan. Functions and leading wildcards defeat the index.");
Q(1, "The 'A' in ACID stands for…", ["Availability", "Atomicity", "Accuracy", "Authorisation"], 1, "All of a transaction's changes happen, or none.");
Q(2, "A dirty read is reading…", ["a deleted row", "another transaction's uncommitted change", "stale cache", "a NULL"], 1, "Allowed only at the read-uncommitted level.");
Q(2, "DELETE vs TRUNCATE:", ["TRUNCATE can take a WHERE clause", "DELETE removes chosen rows and is logged per row; TRUNCATE empties the table fast", "They are identical", "DELETE drops the table"], 1, "TRUNCATE is DDL-like and cannot filter.");
Q(2, "In a star schema, the fact table holds…", ["descriptive attributes", "measures and foreign keys to dimensions", "only dates", "indexes"], 1, "Dimensions hold the descriptive attributes.");
Q(3, "A composite index on (city, signup_date) helps least with…", ["WHERE city = 'Pune'", "WHERE city = 'Pune' AND signup_date > '2025-01-01'", "WHERE signup_date > '2025-01-01'", "ORDER BY city, signup_date"], 2, "The leading column is not constrained, so the index cannot be seeked.");
C("1NF / 2NF / 3NF in one line each", "Atomic values / no partial dependency on a composite key / no transitive dependency.");
C("ACID", "Atomicity, Consistency, Isolation, Durability.");
C("When does an index hurt or get ignored?", "Heavy writes; low-selectivity columns; function on the column; leading % in LIKE; non-leading column of a composite index.");
C("Star schema", "Central fact table (measures + FKs) joined to denormalised dimension tables.");
C("OLTP vs OLAP", "Many small writes, normalised, row store vs large scans, denormalised, column store.");
