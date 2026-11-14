import type { Difficulty, SqlProblem } from "@/lib/types";

/**
 * Topic-wise SQL bank. Original problems written for this site; they cover the same patterns as
 * the public practice sets (LeetCode SQL 50, DataLemur, StrataScratch) without copying them.
 * Expected output always comes from running `solution` on the same seed.
 */
interface Spec {
  id: string;
  title: string;
  cat: string;
  d: Difficulty;
  ds: "shop" | "hr" | "qc";
  ordered?: boolean;
  q: string;
  sol: string;
  starter?: string;
  hint: string;
  why: string;
  traps: string[];
  follow?: string[];
  tags: string[];
}

const TESTS = [
  { id: "sample", name: "Sample data", hidden: false },
  { id: "edge", name: "Hidden: edge cases", hidden: true, seedId: "edge" },
];
const MIN: Record<Difficulty, number> = { Easy: 4, Medium: 8, Hard: 14 };

const mk = (s: Spec): SqlProblem => ({
  id: s.id,
  kind: "sql",
  title: s.title,
  pillar: "data",
  competency: "sql",
  category: s.cat,
  difficulty: s.d,
  source: { kind: "practice" },
  tracks: [],
  tags: s.tags,
  targetMin: MIN[s.d],
  datasetId: s.ds,
  ordered: !!s.ordered,
  statement: s.q,
  starter: s.starter ?? "-- Write your query\nSELECT 1;",
  solution: s.sol,
  tests: TESTS,
  hints: [s.hint],
  context: { why: s.why, traps: s.traps, followUps: s.follow ?? [] },
});

const REV = "SUM(oi.qty * oi.unit_price)";

export const SQL_MORE: SqlProblem[] = [
  // ───────── Filtering & sorting ─────────
  { id: "sb-electronics", title: "Expensive electronics", cat: "sql/basics", d: "Easy", ds: "shop", tags: ["where", "and"],
    q: "Return `name` and `price` of products in the `Electronics` category priced above 10,000.",
    sol: "SELECT name, price FROM products WHERE category = 'Electronics' AND price > 10000;",
    hint: "Two conditions joined with AND.", why: "Warm-up: column selection and a compound WHERE.", traps: ["String literals use single quotes; double quotes mean identifiers."] },
  { id: "sb-null-city", title: "Customers with no city on file", cat: "sql/basics", d: "Easy", ds: "shop", tags: ["is null"],
    q: "Return `customer_id` and `name` of customers whose `city` is missing.",
    sol: "SELECT customer_id, name FROM customers WHERE city IS NULL;",
    hint: "NULL is not equal to anything, including NULL.", why: "Checks that you know `= NULL` never matches.", traps: ["`WHERE city = NULL` returns no rows.", "`city = ''` is a different thing from NULL."] },
  { id: "sb-top3-price", title: "Three most expensive products", cat: "sql/basics", d: "Easy", ds: "shop", ordered: true, tags: ["order by", "limit"],
    q: "Return `name` and `price` of the 3 most expensive products, highest first. Break price ties by lower `product_id`.",
    sol: "SELECT name, price FROM products ORDER BY price DESC, product_id LIMIT 3;",
    hint: "Sort on two keys, then cut.", why: "ORDER BY with a deterministic tie-break, then LIMIT.", traps: ["Without a tie-break the result is not deterministic.", "LIMIT is applied after ORDER BY."], follow: ["Rows 4 to 6 (OFFSET).", "Top 3 distinct prices instead of 3 rows."] },
  { id: "sb-in-between", title: "Orders in a date window with chosen statuses", cat: "sql/basics", d: "Easy", ds: "shop", tags: ["between", "in"],
    q: "Return `order_id`, `order_date`, `status` for orders placed from 2025-08-01 to 2025-09-30 inclusive whose status is `delivered` or `returned`.",
    sol: "SELECT order_id, order_date, status FROM orders WHERE order_date BETWEEN DATE '2025-08-01' AND DATE '2025-09-30' AND status IN ('delivered', 'returned');",
    hint: "BETWEEN is inclusive on both ends.", why: "BETWEEN and IN are the two most common filter shorthands.", traps: ["`status = 'delivered' OR status = 'returned' AND …` binds AND first; use IN or brackets.", "BETWEEN on timestamps silently drops most of the last day."] },
  { id: "sb-ilike", title: "Product names containing a letter", cat: "sql/basics", d: "Easy", ds: "shop", tags: ["like", "ilike"],
    q: "Return the `name` of every product whose name contains the letter `o`, in any case.",
    sol: "SELECT name FROM products WHERE name ILIKE '%o%';",
    hint: "% matches any run of characters; ILIKE ignores case in PostgreSQL.", why: "Pattern matching basics.", traps: ["LIKE is case-sensitive in PostgreSQL.", "A leading % prevents index use on large tables."] },
  { id: "sb-distinct-cities", title: "List of cities", cat: "sql/basics", d: "Easy", ds: "shop", ordered: true, tags: ["distinct"],
    q: "Return each distinct non-missing `city` once, in alphabetical order.",
    sol: "SELECT DISTINCT city FROM customers WHERE city IS NOT NULL ORDER BY city;",
    hint: "DISTINCT applies to the whole select list.", why: "DISTINCT plus NULL handling.", traps: ["DISTINCT keeps one NULL row unless you filter it."] },

  // ───────── Aggregation ─────────
  { id: "sa-status-count", title: "Orders per status", cat: "sql/aggregation", d: "Easy", ds: "shop", tags: ["group by", "count"],
    q: "Return `status` and the number of orders `n` in each status.",
    sol: "SELECT status, COUNT(*) AS n FROM orders GROUP BY status;",
    hint: "One output row per group.", why: "The basic GROUP BY shape.", traps: ["Every non-aggregated column in SELECT must be in GROUP BY."] },
  { id: "sa-order-revenue", title: "Revenue of each order", cat: "sql/aggregation", d: "Easy", ds: "shop", tags: ["sum", "expression"],
    q: "Return `order_id` and `revenue`, the sum of `qty × unit_price` over the order's lines, for every order that has lines.",
    sol: "SELECT order_id, SUM(qty * unit_price) AS revenue FROM order_items GROUP BY order_id;",
    hint: "Aggregate an expression, not a column.", why: "Line-level to order-level roll-up is the most common analyst aggregation.", traps: ["Using products.price instead of the price actually charged."] },
  { id: "sa-category-stats", title: "Catalogue statistics by category", cat: "sql/aggregation", d: "Easy", ds: "shop", tags: ["avg", "max", "round"],
    q: "For each product `category` return `n_products`, `avg_price` rounded to 2 decimals, and `max_price`.",
    sol: "SELECT category, COUNT(*) AS n_products, ROUND(AVG(price), 2) AS avg_price, MAX(price) AS max_price FROM products GROUP BY category;",
    hint: "Several aggregates can share one GROUP BY.", why: "Multiple aggregates and rounding.", traps: ["AVG of an integer column returns numeric in PostgreSQL but truncates in some other engines."] },
  { id: "sa-having-3", title: "Customers with at least three delivered orders", cat: "sql/aggregation", d: "Medium", ds: "shop", tags: ["having"],
    q: "Return `customer_id` and `n_orders` for customers with 3 or more orders in status `delivered`.",
    sol: "SELECT customer_id, COUNT(*) AS n_orders FROM orders WHERE status = 'delivered' GROUP BY customer_id HAVING COUNT(*) >= 3;",
    hint: "Filter rows with WHERE, filter groups with HAVING.", why: "WHERE vs HAVING is asked in almost every SQL oral round.", traps: ["Putting the status filter in HAVING.", "Using the alias `n_orders` in HAVING: not portable."] },
  { id: "sa-count-null", title: "COUNT(*) versus COUNT(column)", cat: "sql/aggregation", d: "Easy", ds: "shop", tags: ["count", "null"],
    q: "From `customers` return one row: `total` (all customers), `with_city` (city present), `without_city` (city missing).",
    sol: "SELECT COUNT(*) AS total, COUNT(city) AS with_city, COUNT(*) - COUNT(city) AS without_city FROM customers;",
    hint: "COUNT(col) skips NULLs.", why: "A one-line test of NULL behaviour in aggregates.", traps: ["SUM, AVG, MIN and MAX also skip NULLs; AVG's denominator shrinks with them."] },
  { id: "sa-monthly-revenue", title: "Delivered revenue by month", cat: "sql/aggregation", d: "Medium", ds: "shop", ordered: true, tags: ["join", "date_trunc"],
    q: "Return `month` (first day of the month, as a date) and `revenue` from delivered orders only, ordered by month.",
    sol: `SELECT DATE_TRUNC('month', o.order_date)::date AS month, ${REV} AS revenue
FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status = 'delivered'
GROUP BY 1 ORDER BY 1;`,
    hint: "Join orders to lines, filter, then group by the truncated date.", why: "Time-bucketed revenue is the staple reporting query.", traps: ["Counting cancelled or returned orders as revenue.", "Grouping by order_date instead of the month."] },
  { id: "sa-conditional", title: "Order outcomes per customer", cat: "sql/aggregation", d: "Medium", ds: "shop", tags: ["filter", "case"],
    q: "For each customer with at least one order return `customer_id`, `delivered`, `cancelled`, `returned`: the count of their orders in each status.",
    sol: `SELECT customer_id,
       COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
       COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
       COUNT(*) FILTER (WHERE status = 'returned') AS returned
FROM orders GROUP BY customer_id;`,
    hint: "COUNT(*) FILTER (WHERE …), or SUM(CASE WHEN … THEN 1 ELSE 0 END).", why: "Conditional aggregation turns rows into columns in one pass.", traps: ["COUNT(CASE WHEN … THEN 1 ELSE 0 END) counts every row: 0 is not NULL."] },

  // ───────── Joins ─────────
  { id: "sj-order-lines", title: "Readable order lines", cat: "sql/joins", d: "Easy", ds: "shop", tags: ["inner join", "three tables"],
    q: "For delivered orders return `order_id`, `customer` (customer name), `product` (product name) and `qty`, one row per order line.",
    sol: `SELECT o.order_id, c.name AS customer, p.name AS product, oi.qty
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p ON p.product_id = oi.product_id
WHERE o.status = 'delivered';`,
    hint: "Chain joins along the foreign keys.", why: "Multi-table inner joins with aliases.", traps: ["Two tables have a `name` column: alias them."] },
  { id: "sj-revenue-all", title: "Delivered revenue for every customer, including zero", cat: "sql/joins", d: "Medium", ds: "shop", tags: ["left join", "coalesce"],
    q: "Return `name` and `revenue` for **every** customer: total `qty × unit_price` across their delivered orders, or 0 if they have none.",
    sol: `SELECT c.name, COALESCE(${REV}, 0) AS revenue
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'delivered'
LEFT JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY c.customer_id, c.name;`,
    hint: "Where does the status filter go so that customers with no delivered orders survive?", why: "The ON-versus-WHERE distinction on an outer join.", traps: ["`WHERE o.status = 'delivered'` removes customers with no delivered orders.", "SUM over no rows is NULL, not 0."] },
  { id: "sj-never-ordered-product", title: "Products never ordered", cat: "sql/joins", d: "Easy", ds: "shop", tags: ["anti-join"],
    q: "Return the `name` of products that appear in no order line.",
    sol: "SELECT p.name FROM products p LEFT JOIN order_items oi ON oi.product_id = p.product_id WHERE oi.product_id IS NULL;",
    hint: "LEFT JOIN, keep the rows where nothing matched.", why: "The anti-join pattern.", traps: ["NOT IN breaks if the subquery returns a NULL."] },
  { id: "sj-city-pairs", title: "Pairs of customers in the same city", cat: "sql/joins", d: "Medium", ds: "shop", tags: ["self-join"],
    q: "Return `a` and `b`, the names of every pair of different customers who share a city. Each pair once, with the lower `customer_id` in `a`.",
    sol: "SELECT a.name AS a, b.name AS b FROM customers a JOIN customers b ON a.city = b.city AND a.customer_id < b.customer_id;",
    hint: "Join the table to itself; an inequality removes mirrored pairs.", why: "Self-join with de-duplication.", traps: ["`<>` returns each pair twice.", "NULL cities never match, which is what you want."] },
  { id: "sj-two-categories", title: "Customers buying across categories", cat: "sql/joins", d: "Medium", ds: "shop", tags: ["count distinct"],
    q: "Return `name` and `n_categories` for customers whose delivered orders span 2 or more distinct product categories.",
    sol: `SELECT c.name, COUNT(DISTINCT p.category) AS n_categories
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'delivered'
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p ON p.product_id = oi.product_id
GROUP BY c.customer_id, c.name
HAVING COUNT(DISTINCT p.category) >= 2;`,
    hint: "Join out to category, then count distinct per customer.", why: "Join fan-out makes plain COUNT wrong; DISTINCT fixes the grain.", traps: ["COUNT(*) counts lines, not categories."] },
  { id: "sj-none-delivered", title: "Customers with orders but nothing delivered", cat: "sql/joins", d: "Medium", ds: "shop", tags: ["conditional having"],
    q: "Return the `name` of customers who have placed at least one order and have **no** delivered order.",
    sol: `SELECT c.name
FROM customers c JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.name
HAVING COUNT(*) FILTER (WHERE o.status = 'delivered') = 0;`,
    hint: "Inner join keeps only customers with orders; then test the group.", why: "'Has X but never Y' questions are a favourite.", traps: ["`WHERE status <> 'delivered'` returns customers who merely have one non-delivered order."] , follow: ["Rewrite with NOT EXISTS."] },

  // ───────── Subqueries ─────────
  { id: "sq-above-avg", title: "Products priced above average", cat: "sql/subqueries", d: "Easy", ds: "shop", tags: ["scalar subquery"],
    q: "Return `name` and `price` of products priced above the average price of all products.",
    sol: "SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products);",
    hint: "An aggregate cannot sit in WHERE directly; wrap it.", why: "Scalar subquery in a filter.", traps: ["`WHERE price > AVG(price)` is an error."] },
  { id: "sq-above-cat-avg", title: "Products above their category average", cat: "sql/subqueries", d: "Medium", ds: "shop", tags: ["correlated subquery"],
    q: "Return `name`, `category`, `price` of products priced strictly above the average price of their own category.",
    sol: "SELECT p.name, p.category, p.price FROM products p WHERE p.price > (SELECT AVG(p2.price) FROM products p2 WHERE p2.category = p.category);",
    hint: "The inner query refers to the outer row.", why: "Correlated subquery; also solvable with a window function, and you should be able to say both.", traps: ["Forgetting the correlation compares against the global average."], follow: ["Rewrite with AVG() OVER (PARTITION BY category)."] },
  { id: "sq-second-salary", title: "Second-highest salary", cat: "sql/subqueries", d: "Easy", ds: "hr", tags: ["max", "nested"],
    q: "Return one row with `second_highest`: the second-highest distinct salary in `employees`.",
    sol: "SELECT MAX(salary) AS second_highest FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);",
    hint: "The highest salary below the highest.", why: "A classic that has a subquery answer, a LIMIT/OFFSET answer and a DENSE_RANK answer.", traps: ["ORDER BY … LIMIT 1 OFFSET 1 is wrong when the top salary is tied."], follow: ["Nth highest for any N."] },
  { id: "sq-exists", title: "Customers who ordered electronics", cat: "sql/subqueries", d: "Medium", ds: "shop", tags: ["exists"],
    q: "Return the `name` of customers with at least one order (any status) containing an `Electronics` product.",
    sol: `SELECT c.name FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  JOIN products p ON p.product_id = oi.product_id
  WHERE o.customer_id = c.customer_id AND p.category = 'Electronics');`,
    hint: "EXISTS returns each customer once however many matches there are.", why: "Semi-join: avoids the duplicates a plain join would create.", traps: ["A join without DISTINCT repeats customers."] },
  { id: "sq-never-cancelled", title: "Customers who never cancelled", cat: "sql/subqueries", d: "Medium", ds: "shop", tags: ["not exists"],
    q: "Return the `name` of customers who have at least one order and no order with status `cancelled`.",
    sol: `SELECT c.name FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id AND o.status = 'cancelled');`,
    hint: "Two conditions on the same child table: one must exist, one must not.", why: "NOT EXISTS is the NULL-safe way to say 'none'.", traps: ["Dropping the first EXISTS returns customers with no orders at all."] },
  { id: "sq-latest-order", title: "Most recent order of each customer", cat: "sql/subqueries", d: "Medium", ds: "shop", tags: ["correlated max"],
    q: "Return `customer_id`, `order_id`, `order_date` for each customer's most recent order. If two orders share the latest date, return both.",
    sol: "SELECT o.customer_id, o.order_id, o.order_date FROM orders o WHERE o.order_date = (SELECT MAX(o2.order_date) FROM orders o2 WHERE o2.customer_id = o.customer_id);",
    hint: "Compare each order's date with that customer's maximum.", why: "'Latest row per group' appears constantly; know the subquery and the ROW_NUMBER versions.", traps: ["GROUP BY customer_id with MAX(order_date) cannot also return order_id."] },
  { id: "sq-dept-above-company", title: "Departments paying above the company average", cat: "sql/subqueries", d: "Medium", ds: "hr", tags: ["having", "subquery"],
    q: "Return `dept` and `avg_salary` (rounded to 0 decimals) for departments whose average salary exceeds the company-wide average salary.",
    sol: "SELECT dept, ROUND(AVG(salary)) AS avg_salary FROM employees GROUP BY dept HAVING AVG(salary) > (SELECT AVG(salary) FROM employees);",
    hint: "A subquery is allowed inside HAVING.", why: "Group-level filter against a global scalar.", traps: ["The average of department averages is not the company average."] },

  // ───────── CTEs ─────────
  { id: "sc-biggest-order", title: "Largest order of each customer", cat: "sql/cte", d: "Medium", ds: "shop", tags: ["cte", "join back"],
    q: "Using order totals (`qty × unit_price` summed per order, any status), return `customer_id`, `order_id`, `total` for each customer's largest order. Return ties.",
    sol: `WITH totals AS (
  SELECT o.customer_id, o.order_id, ${REV} AS total
  FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
  GROUP BY o.customer_id, o.order_id
),
best AS (SELECT customer_id, MAX(total) AS total FROM totals GROUP BY customer_id)
SELECT t.customer_id, t.order_id, t.total FROM totals t JOIN best b ON b.customer_id = t.customer_id AND b.total = t.total;`,
    hint: "First CTE: one row per order. Second: the max per customer. Join them.", why: "Chained CTEs: each step has a name and one job. Panels prefer this to nested subqueries.", traps: ["Nesting everything in one SELECT is harder to read and to debug aloud."] },
  { id: "sc-category-share", title: "Category share of delivered revenue", cat: "sql/cte", d: "Medium", ds: "shop", tags: ["cte", "percent of total"],
    q: "Return `category`, `revenue` and `pct` (share of total delivered revenue, 1 decimal) for each category with delivered sales.",
    sol: `WITH cat AS (
  SELECT p.category, ${REV} AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  JOIN products p ON p.product_id = oi.product_id
  WHERE o.status = 'delivered'
  GROUP BY p.category
)
SELECT category, revenue, ROUND(100.0 * revenue / (SELECT SUM(revenue) FROM cat), 1) AS pct FROM cat;`,
    hint: "Compute the per-category numbers once, then divide by their sum.", why: "Percent-of-total: reuse a CTE as both rows and the denominator.", traps: ["Integer division: multiply by 100.0."], follow: ["Do it with SUM(revenue) OVER ()."] },
  { id: "sc-recursive-levels", title: "Reporting level of every employee", cat: "sql/cte", d: "Hard", ds: "hr", tags: ["recursive cte", "hierarchy"],
    q: "Return `name` and `level` for every employee, where department heads (no manager) are level 1, their direct reports level 2, and so on.",
    sol: `WITH RECURSIVE chain AS (
  SELECT emp_id, name, 1 AS level FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.emp_id, e.name, c.level + 1 FROM employees e JOIN chain c ON e.manager_id = c.emp_id
)
SELECT name, level FROM chain;`,
    hint: "Anchor: the heads. Recursive step: join employees to the rows found so far.", why: "Hierarchies (org charts, categories, bills of material) need recursion.", traps: ["UNION instead of UNION ALL hides bugs and costs a sort.", "A cycle in the data loops forever without a depth guard."] },
  { id: "sc-calendar", title: "Delivered orders per month, including empty months", cat: "sql/cte", d: "Hard", ds: "shop", ordered: true, tags: ["generate_series", "left join"],
    q: "For every month from July 2025 to October 2025 return `month` (first day) and `n_orders`, the number of delivered orders. Months with none must show 0. Order by month.",
    sol: `WITH months AS (
  SELECT generate_series(DATE '2025-07-01', DATE '2025-10-01', INTERVAL '1 month')::date AS month
)
SELECT m.month, COUNT(o.order_id) AS n_orders
FROM months m
LEFT JOIN orders o ON DATE_TRUNC('month', o.order_date)::date = m.month AND o.status = 'delivered'
GROUP BY m.month ORDER BY m.month;`,
    hint: "Build the calendar first; LEFT JOIN facts onto it; count a column from the right side.", why: "Missing periods vanish from GROUP BY output. Reports need them as zeros.", traps: ["COUNT(*) gives 1 for an empty month.", "Filtering status in WHERE removes the empty months again."] },

  // ───────── Window functions ─────────
  { id: "sw-running-total", title: "Running spend per customer", cat: "sql/window", d: "Medium", ds: "shop", tags: ["sum over", "partition"],
    q: "For delivered orders return `customer_id`, `order_date`, `total` (order revenue) and `running_total`: that customer's cumulative delivered revenue up to and including the order, by date.",
    sol: `WITH t AS (
  SELECT o.customer_id, o.order_id, o.order_date, ${REV} AS total
  FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
  WHERE o.status = 'delivered'
  GROUP BY o.customer_id, o.order_id, o.order_date
)
SELECT customer_id, order_date, total,
       SUM(total) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS running_total
FROM t;`,
    hint: "Aggregate to order level first, then SUM() OVER with ORDER BY.", why: "Running totals are the entry point to window frames.", traps: ["With ORDER BY and no frame, the default frame is RANGE, which lumps tied dates together."] },
  { id: "sw-rank-price", title: "Price rank within category", cat: "sql/window", d: "Easy", ds: "shop", tags: ["rank"],
    q: "Return `name`, `category`, `price` and `rnk`: the product's price rank within its category, most expensive = 1, ties sharing a rank and leaving gaps.",
    sol: "SELECT name, category, price, RANK() OVER (PARTITION BY category ORDER BY price DESC) AS rnk FROM products;",
    hint: "Gaps after ties means RANK, not DENSE_RANK.", why: "ROW_NUMBER vs RANK vs DENSE_RANK.", traps: ["DENSE_RANK leaves no gaps; ROW_NUMBER breaks ties arbitrarily."] },
  { id: "sw-first-order", title: "First order of each customer", cat: "sql/window", d: "Medium", ds: "shop", tags: ["row_number"],
    q: "Return `customer_id`, `order_id`, `order_date` of each customer's first order. If two orders share the first date, take the lower `order_id`.",
    sol: `WITH r AS (
  SELECT customer_id, order_id, order_date,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS rn
  FROM orders
)
SELECT customer_id, order_id, order_date FROM r WHERE rn = 1;`,
    hint: "Number the rows inside each customer, keep number 1.", why: "The standard 'first/latest row per group' solution.", traps: ["You cannot filter on rn in the same SELECT that defines it."] },
  { id: "sw-days-since-prev", title: "Days since the customer's previous order", cat: "sql/window", d: "Medium", ds: "shop", tags: ["lag"],
    q: "For every order return `customer_id`, `order_id`, `order_date` and `days_since_prev`: days since that customer's previous order (by date, then order_id), NULL for their first.",
    sol: `SELECT customer_id, order_id, order_date,
       order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS days_since_prev
FROM orders;`,
    hint: "LAG looks one row back inside the partition.", why: "Inter-purchase time feeds churn and frequency analysis.", traps: ["Without PARTITION BY, LAG reaches into another customer's rows."] },
  { id: "sw-pct-of-dept", title: "Salary as a share of department payroll", cat: "sql/window", d: "Medium", ds: "hr", tags: ["sum over", "percent"],
    q: "Return `name`, `dept`, `salary` and `pct_of_dept`: the salary as a percentage of the department's total salary, 1 decimal.",
    sol: "SELECT name, dept, salary, ROUND(100.0 * salary / SUM(salary) OVER (PARTITION BY dept), 1) AS pct_of_dept FROM employees;",
    hint: "A window aggregate keeps every row.", why: "Detail and group total side by side without a join.", traps: ["GROUP BY would collapse the rows."] },
  { id: "sw-diff-dept-avg", title: "Gap to the department average", cat: "sql/window", d: "Easy", ds: "hr", tags: ["avg over"],
    q: "Return `name` and `diff`: salary minus the department's average salary, with the average rounded to a whole number first.",
    sol: "SELECT name, salary - ROUND(AVG(salary) OVER (PARTITION BY dept)) AS diff FROM employees;",
    hint: "AVG() OVER (PARTITION BY dept).", why: "Comparing a row with its group.", traps: [] },
  { id: "sw-moving-avg", title: "Three-order moving average", cat: "sql/window", d: "Hard", ds: "shop", ordered: true, tags: ["rows between", "frame"],
    q: "Over delivered orders sorted by `order_date` then `order_id`, return `order_id`, `total` and `ma3`: the average of this order's total and the two before it (fewer at the start), 2 decimals. Keep that order.",
    sol: `WITH t AS (
  SELECT o.order_id, o.order_date, ${REV} AS total
  FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
  WHERE o.status = 'delivered'
  GROUP BY o.order_id, o.order_date
)
SELECT order_id, total,
       ROUND(AVG(total) OVER (ORDER BY order_date, order_id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS ma3
FROM t ORDER BY order_date, order_id;`,
    hint: "ROWS BETWEEN 2 PRECEDING AND CURRENT ROW.", why: "Explicit frames.", traps: ["Leaving out the frame gives a running average, not a moving one."] },
  { id: "sw-top-product", title: "Best-selling product in each category", cat: "sql/window", d: "Hard", ds: "shop", tags: ["row_number", "aggregate then rank"],
    q: "By units sold in delivered orders, return `category`, `name`, `qty` for the top product of each category. Break ties by lower `product_id`.",
    sol: `WITH s AS (
  SELECT p.category, p.product_id, p.name, SUM(oi.qty) AS qty
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  JOIN products p ON p.product_id = oi.product_id
  WHERE o.status = 'delivered'
  GROUP BY p.category, p.product_id, p.name
),
r AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY qty DESC, product_id) AS rn FROM s)
SELECT category, name, qty FROM r WHERE rn = 1;`,
    hint: "Aggregate, rank inside the category, keep rank 1.", why: "Top-N per group on an aggregated measure: three steps, three CTEs.", traps: ["Ranking before aggregating ranks lines, not products."] },
  { id: "sw-pareto", title: "Cumulative revenue share by product", cat: "sql/window", d: "Hard", ds: "shop", ordered: true, tags: ["cumulative percent", "pareto"],
    q: "For products with delivered sales return `name`, `revenue` and `cum_pct`: cumulative share of delivered revenue (1 decimal) when products are sorted by revenue descending, then name. Keep that order.",
    sol: `WITH r AS (
  SELECT p.name, ${REV} AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  JOIN products p ON p.product_id = oi.product_id
  WHERE o.status = 'delivered'
  GROUP BY p.name
)
SELECT name, revenue,
       ROUND(100.0 * SUM(revenue) OVER (ORDER BY revenue DESC, name ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) / SUM(revenue) OVER (), 1) AS cum_pct
FROM r ORDER BY revenue DESC, name;`,
    hint: "Running sum divided by the grand total, both as window functions.", why: "The 80/20 analysis in one query.", traps: ["An empty OVER () is the grand total; forgetting ROWS makes ties jump together."] },

  // ───────── Dates ─────────
  { id: "sd-weekday", title: "Orders by day of week", cat: "sql/time-series", d: "Easy", ds: "shop", tags: ["extract"],
    q: "Return `dow` (ISO day of week, Monday = 1 … Sunday = 7) and `n`, the number of orders placed on that weekday. Only weekdays that occur.",
    sol: "SELECT EXTRACT(ISODOW FROM order_date)::int AS dow, COUNT(*) AS n FROM orders GROUP BY 1;",
    hint: "EXTRACT(ISODOW FROM date).", why: "Date-part extraction.", traps: ["EXTRACT(DOW …) numbers Sunday as 0."] },
  { id: "sd-signup-to-first", title: "Days from signup to first order", cat: "sql/time-series", d: "Medium", ds: "shop", tags: ["date difference", "min"],
    q: "For customers with at least one order return `name` and `days`: days between `signup_date` and their first order date.",
    sol: "SELECT c.name, MIN(o.order_date) - c.signup_date AS days FROM customers c JOIN orders o ON o.customer_id = c.customer_id GROUP BY c.customer_id, c.name, c.signup_date;",
    hint: "Subtracting two dates gives a number of days in PostgreSQL.", why: "Time-to-first-action is a standard activation metric.", traps: ["Subtracting timestamps gives an interval, not an integer."] },
  { id: "sd-last-30", title: "Orders in the last 30 days of the data", cat: "sql/time-series", d: "Medium", ds: "shop", tags: ["relative window"],
    q: "Let D be the latest `order_date` in the table. Return `order_id` and `order_date` for orders placed after D − 30 days (so D itself is included).",
    sol: "SELECT order_id, order_date FROM orders WHERE order_date > (SELECT MAX(order_date) FROM orders) - 30;",
    hint: "Anchor on MAX(order_date), not on today's date.", why: "Test data is static, so 'last 30 days' must be relative to the data.", traps: ["CURRENT_DATE makes the query return nothing on old data."] },
  { id: "sd-quarter", title: "Delivered revenue by quarter", cat: "sql/time-series", d: "Easy", ds: "shop", ordered: true, tags: ["date_trunc quarter"],
    q: "Return `qtr` (first day of the quarter, as a date) and `revenue` from delivered orders, ordered by quarter.",
    sol: `SELECT DATE_TRUNC('quarter', o.order_date)::date AS qtr, ${REV} AS revenue
FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status = 'delivered' GROUP BY 1 ORDER BY 1;`,
    hint: "DATE_TRUNC accepts 'quarter'.", why: "Changing the time grain.", traps: [] },

  // ───────── CASE & pivots ─────────
  { id: "sp-price-band", title: "Price bands", cat: "sql/case-pivot", d: "Easy", ds: "shop", tags: ["case when"],
    q: "Return `name` and `band`: `budget` if price is below 1,000, `mid` if below 20,000, otherwise `premium`.",
    sol: "SELECT name, CASE WHEN price < 1000 THEN 'budget' WHEN price < 20000 THEN 'mid' ELSE 'premium' END AS band FROM products;",
    hint: "CASE stops at the first true branch.", why: "Bucketing a continuous column.", traps: ["Branch order matters.", "No ELSE means NULL."] },
  { id: "sp-status-pivot", title: "Order statuses by month, as columns", cat: "sql/case-pivot", d: "Medium", ds: "shop", ordered: true, tags: ["pivot", "conditional count"],
    q: "Return `month` (first day) and three columns `delivered`, `cancelled`, `returned` with the number of orders in each status, ordered by month.",
    sol: `SELECT DATE_TRUNC('month', order_date)::date AS month,
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
       SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returned
FROM orders GROUP BY 1 ORDER BY 1;`,
    hint: "One conditional aggregate per output column.", why: "Manual pivot: works in every SQL dialect.", traps: [] },
  { id: "sp-funnel", title: "Three-step funnel", cat: "sql/case-pivot", d: "Medium", ds: "qc", tags: ["funnel", "count distinct case"],
    q: "From `events` return one row with `opened`, `searched`, `carted`: the number of distinct users who ever fired `app_open`, `search` and `add_to_cart` respectively.",
    sol: `SELECT COUNT(DISTINCT CASE WHEN event = 'app_open' THEN user_id END) AS opened,
       COUNT(DISTINCT CASE WHEN event = 'search' THEN user_id END) AS searched,
       COUNT(DISTINCT CASE WHEN event = 'add_to_cart' THEN user_id END) AS carted
FROM events;`,
    hint: "CASE with no ELSE yields NULL, which COUNT ignores.", why: "Funnel counts are the first thing a product analyst is asked to write.", traps: ["Counting events instead of users.", "This is an 'ever did' funnel; a strict funnel also checks the order of steps."], follow: ["Make it strict: searched only counts if it happened after an app_open."] },

  // ───────── Set operations & strings ─────────
  { id: "ss-except", title: "Bought electronics but never furniture", cat: "sql/set-strings", d: "Medium", ds: "shop", tags: ["except"],
    q: "Return `customer_id` of customers who have an order (any status) with an Electronics product, except those who have an order with a Furniture product.",
    sol: `SELECT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id WHERE p.category = 'Electronics'
EXCEPT
SELECT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id WHERE p.category = 'Furniture';`,
    hint: "EXCEPT removes rows of the second query from the first, and de-duplicates.", why: "Set difference reads exactly like the question.", traps: ["Both sides need the same number and types of columns."] },
  { id: "ss-intersect", title: "Bought both electronics and stationery", cat: "sql/set-strings", d: "Medium", ds: "shop", tags: ["intersect"],
    q: "Return `customer_id` of customers who have ordered (any status) both an Electronics product and a Stationery product.",
    sol: `SELECT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id WHERE p.category = 'Electronics'
INTERSECT
SELECT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id WHERE p.category = 'Stationery';`,
    hint: "INTERSECT, or GROUP BY with COUNT(DISTINCT category) = 2.", why: "'Both A and B' cannot be written as `category = 'A' AND category = 'B'` on one row.", traps: ["`WHERE category = 'Electronics' AND category = 'Stationery'` is always false."] },
  { id: "st-email", title: "Build an email and measure a name", cat: "sql/set-strings", d: "Easy", ds: "shop", tags: ["concat", "lower", "length"],
    q: "Return `email` (the lower-cased name followed by `@shop.in`) and `len` (number of characters in the name) for every customer.",
    sol: "SELECT LOWER(name) || '@shop.in' AS email, LENGTH(name) AS len FROM customers;",
    hint: "|| concatenates in PostgreSQL.", why: "Basic string functions show up in OA multiple-choice sections.", traps: ["Concatenating with a NULL yields NULL; CONCAT() treats NULL as empty."] },
  { id: "st-coalesce", title: "Fill missing cities and abbreviate the segment", cat: "sql/set-strings", d: "Easy", ds: "shop", tags: ["coalesce", "left", "upper"],
    q: "Return `name`, `city` with missing values shown as `Unknown`, and `seg`: the first letter of `segment` in upper case.",
    sol: "SELECT name, COALESCE(city, 'Unknown') AS city, UPPER(LEFT(segment, 1)) AS seg FROM customers;",
    hint: "COALESCE returns its first non-NULL argument.", why: "NULL replacement.", traps: [] },
].map((s) => mk(s as unknown as Spec));
