/**
 * P2 · Batch 4: algebra (5), geometry and mensuration (4), logical reasoning: series,
 * coding–decoding, analogy and odd one out (3). Items come from src/data/gen/b4.ts.
 */
import { B4_ITEMS, B4_TOPICS as B } from "@/data/gen/b4";
import type { InterviewQ, Resource } from "@/lib/types";
import { Card_, Item, R, T } from "./build";

const iq = (q: string, answer: string, rubric: string[]): InterviewQ => ({ q, answer, rubric });
const yt = (id: string, title: string, who = "CareerRide") => R(`Video: ${title} (${who})`, `https://www.youtube.com/watch?v=${id}`);
const bix = (path: string, title: string) => R(`IndiaBIX: ${title}`, `https://www.indiabix.com/${path}/`, "OA-style practice with solutions");
const topic = (id: string, module: string, title: string, summary: string, notes: string, resources: Resource[], interview: InterviewQ[]) =>
  T(id, "aptitude", module, title, summary, notes, { resources, interview });

// ───────────────────────── Algebra ─────────────────────────
topic(B.lin, "Algebra", "Linear equations and word problems", "Turn sentences into equations, then solve by substitution or elimination.", `
**Translate first.** Name the unknowns, write one equation per fact, check you have as many independent equations as unknowns.

**One variable.** Collect the x terms on one side: 3x + 7 = 2x + 15 → x = 8.

**Two variables.**

- Substitution: solve one equation for a variable and substitute.
- Elimination: scale the equations so one variable has matching coefficients, then add or subtract.
- Two equations have **no solution** if they are parallel (same ratio of coefficients, different constant) and **infinitely many** if they are the same line.

**Standard set-ups.**

- Two-digit number with tens digit t and units digit u: value 10t + u; reversing changes it by 9(u − t).
- Ages: every person ages by the same number of years.
- Coins or tickets: count equation plus value equation.

**Worked example 1.** 3x + 7 = 2x + 15 → x = 8.

**Worked example 2.** Digits add to 9 and reversing increases the number by 27: u − t = 3 and u + t = 9 → 36.

**Worked example 3.** 2 pens + 3 notebooks = ₹130 and 3 pens + 2 notebooks = ₹120. Adding: 5(p + n) = 250, so p + n = 50; subtracting: n − p = 10. Pen ₹20, notebook ₹30.

**Worked example 4.** A father is 3 times his son's age; in 12 years he will be twice. 3S + 12 = 2(S + 12) → S = 12, father 36.
`, [yt("TV9rQm15sWo", "Algebra"), bix("aptitude/problems-on-numbers", "problems on numbers")], [
  iq("How do you choose between substitution and elimination?", "Substitution when one equation already isolates a variable (y = 2x + 1). Elimination when coefficients line up or can be matched by small multipliers, which avoids fractions. Both give the same answer; pick the one with less arithmetic.", ["Substitution when a variable is isolated", "Elimination when coefficients match easily", "Choose by arithmetic effort"]),
  iq("When does a pair of linear equations have no solution or infinitely many?", "Write them as a₁x + b₁y = c₁ and a₂x + b₂y = c₂. If a₁/a₂ = b₁/b₂ ≠ c₁/c₂ the lines are parallel: no solution. If all three ratios are equal they are the same line: infinitely many. Otherwise exactly one.", ["Parallel → none", "Same line → infinitely many", "Coefficient-ratio test"]),
  iq("Why does reversing a two-digit number change it by a multiple of 9?", "10u + t − (10t + u) = 9(u − t). So the change is always 9 times the difference of the digits, which gives a quick equation in OA questions.", ["Writes 10t + u", "Derives 9(u − t)"]),
]);
Card_("p2-lin-c1", "Reversing a two-digit number", "Changes it by 9(u − t).", B.lin);
Card_("p2-lin-c2", "No solution vs infinitely many", "Parallel (a, b ratios equal, c differs) vs same line (all ratios equal).", B.lin);

topic(B.quad, "Algebra", "Quadratic equations", "Roots from factoring or the formula, the discriminant, and sum and product of roots.", `
**Standard form** ax² + bx + c = 0.

**Roots:** x = (−b ± √(b² − 4ac)) / 2a. Try factoring first: find two numbers with product ac and sum b.

**Discriminant D = b² − 4ac.** D > 0: two distinct real roots; D = 0: one repeated root; D < 0: no real roots. If D is a perfect square (and coefficients are integers), the roots are rational.

**Sum and product.** α + β = −b/a, αβ = c/a. From these:

- α² + β² = (α + β)² − 2αβ
- 1/α + 1/β = (α + β)/(αβ)
- (α − β)² = (α + β)² − 4αβ
- Equation with roots p and q: x² − (p + q)x + pq = 0.

**Signs of roots.** Product c/a < 0 → roots of opposite sign. Both positive needs sum > 0 and product > 0.

**Worked example 1.** x² − 5x + 6 = 0 → (x − 2)(x − 3) → 2 and 3.

**Worked example 2.** α + β = 7, αβ = 10 → α² + β² = 49 − 20 = 29.

**Worked example 3.** Roots 3 and −4 → x² + x − 12 = 0.

**Worked example 4.** 2x² − 4x + 5 = 0: D = 16 − 40 = −24 < 0, no real roots.
`, [yt("zlhOmaIxD6s", "Quadratic equations"), bix("aptitude/problems-on-numbers", "problems on numbers")], [
  iq("How do you find α² + β² without solving the quadratic?", "Use α + β = −b/a and αβ = c/a: α² + β² = (α + β)² − 2αβ. For x² − 7x + 10: 49 − 20 = 29.", ["Sum and product formulas", "(α + β)² − 2αβ", "Worked number"]),
  iq("What does the discriminant tell you?", "b² − 4ac decides the nature of the roots: positive gives two distinct real roots, zero a repeated root, negative none (complex pair). A perfect-square discriminant with integer coefficients means rational roots, so the quadratic factorises nicely.", ["Three cases", "Perfect square → rational roots"]),
  iq("How do you write a quadratic whose roots are 2 and −5?", "x² − (sum)x + (product) = x² − (−3)x + (−10) = x² + 3x − 10 = 0.", ["Uses sum and product", "Correct signs"]),
]);
Card_("p2-quad-c1", "Sum and product of roots", "−b/a and c/a.", B.quad);
Card_("p2-quad-c2", "α² + β²", "(α + β)² − 2αβ.", B.quad);

topic(B.ineq, "Algebra", "Inequalities and modulus", "Sign rules, solving |x − a| conditions, quadratic inequalities, and minimum values.", `
**Rules.** Adding or subtracting keeps the direction. Multiplying or dividing by a **negative** number flips it. Never multiply by an expression whose sign is unknown.

**Modulus** |x| is the distance from 0. |x − a| is the distance from a.

- |x − a| < b ⟺ a − b < x < a + b (inside the interval)
- |x − a| > b ⟺ x < a − b or x > a + b (outside)
- |kx − m| = n has two cases: kx − m = n and kx − m = −n.

**Quadratic inequalities.** Factor to (x − p)(x − q) with p < q. Then (x − p)(x − q) < 0 between the roots and > 0 outside them.

**Minimum of a sum of distances.** |x − a| + |x − b| is smallest (= |a − b|) for any x between a and b. With three points, the minimum is at the middle point (the median).

**AM–GM.** For x > 0, x + k/x ≥ 2√k, equality at x = √k.

**Worked example 1.** −3x + 5 > 11 → −3x > 6 → x < −2 (flip).

**Worked example 2.** |x − 4| ≤ 3 → 1 ≤ x ≤ 7: 7 integers.

**Worked example 3.** x² − 7x + 10 < 0 → (x − 2)(x − 5) < 0 → 2 < x < 5: integers 3 and 4.

**Worked example 4.** Minimum of x + 9/x for x > 0: 2√9 = 6 at x = 3.
`, [R("Video: master modulus in 30 minutes (EZPG)", "https://www.youtube.com/watch?v=Sz-IdGBH2mc")], [
  iq("Why must you flip an inequality when multiplying by a negative number?", "Multiplying by −1 reflects numbers about 0, reversing their order: 2 < 5 but −2 > −5. So any negative multiplier reverses the inequality sign. If the sign of the multiplier is unknown (like x), split into cases instead.", ["Order reverses", "Numeric example", "Case-split when the sign is unknown"]),
  iq("How do you solve |2x − 3| < 7?", "−7 < 2x − 3 < 7 → −4 < 2x < 10 → −2 < x < 5.", ["Converts to a double inequality", "Solves both sides", "Correct interval"]),
  iq("Where is |x − 1| + |x − 4| + |x − 10| smallest, and why?", "At the median, x = 4: moving left of 4 increases the distance to two points while reducing it to one; moving right does the reverse. The minimum value is 3 + 0 + 6 = 9.", ["Median argument", "Value 9"]),
]);
Card_("p2-ineq-c1", "|x − a| < b", "a − b < x < a + b.", B.ineq);
Card_("p2-ineq-c2", "(x − p)(x − q) < 0, p < q", "p < x < q.", B.ineq);

topic(B.prog, "Algebra", "Arithmetic and geometric progressions", "nth terms and sums of APs and GPs, means, and standard sums.", `
**Arithmetic progression** (common difference d).

- nth term aₙ = a + (n − 1)d
- Sum Sₙ = n/2 × (2a + (n − 1)d) = n/2 × (first + last)
- Arithmetic mean of p and q: (p + q)/2

**Geometric progression** (common ratio r).

- nth term aₙ = a rⁿ⁻¹
- Sum Sₙ = a(rⁿ − 1)/(r − 1) for r ≠ 1
- Infinite sum a/(1 − r) when |r| < 1
- Geometric mean of p and q: √(pq)

**Standard sums.** 1 + 2 + … + n = n(n + 1)/2. Squares: n(n + 1)(2n + 1)/6. Cubes: (n(n + 1)/2)². First n odd numbers: n².

**"How many terms for sum S?"** Set Sₙ = S, which is a quadratic in n; keep the positive integer root.

**Worked example 1.** 15th term of 3, 7, 11, …: 3 + 14 × 4 = 59.

**Worked example 2.** 1 + 2 + … + 100 = 5050.

**Worked example 3.** 2 + 6 + 18 + … (6 terms) = 2(3⁶ − 1)/2 = 728.

**Worked example 4.** 1 + ½ + ¼ + … = 1/(1 − ½) = 2.
`, [yt("G-gqX4Oo9PA", "Arithmetic progression"), yt("rdC4Blp8qmk", "Geometric progression")], [
  iq("Derive the sum of an arithmetic progression.", "Write the sum forwards and backwards and add: each pair (first + last), (second + second-last), … equals a + l, and there are n pairs, so 2S = n(a + l), S = n(a + l)/2.", ["Forward + backward pairing", "n pairs of a + l", "Final formula"]),
  iq("When does an infinite geometric series converge?", "When |r| < 1: the terms shrink geometrically and the sum approaches a/(1 − r). For |r| ≥ 1 the terms do not shrink to 0, so the sum diverges.", ["|r| < 1", "a/(1 − r)", "Diverges otherwise"]),
  iq("What is the sum of the first n odd numbers, and why?", "n². Adding odd numbers builds squares: 1, 1 + 3 = 4, 4 + 5 = 9 … Each odd number 2k + 1 adds an L-shaped border to a k × k square.", ["n²", "Explanation by pattern or formula"]),
]);
Card_("p2-prog-c1", "AP sum", "n/2 × (first + last).", B.prog);
Card_("p2-prog-c2", "GP sum (r ≠ 1) and infinite sum", "a(rⁿ − 1)/(r − 1); a/(1 − r) for |r| < 1.", B.prog);

topic(B.logs, "Algebra", "Logarithms, indices and surds", "Exponent laws, log rules and change of base, and rationalising surds.", `
**Indices.** aᵐ × aⁿ = aᵐ⁺ⁿ · aᵐ ÷ aⁿ = aᵐ⁻ⁿ · (aᵐ)ⁿ = aᵐⁿ · a⁰ = 1 · a⁻ⁿ = 1/aⁿ · a^(m/n) = ⁿ√(aᵐ).

**Equations with powers.** Rewrite both sides with the same base and equate exponents: 2^(x + 1) = 32 = 2⁵ → x = 4.

**Logarithms.** log_b(x) = y means bʸ = x.

- log(ab) = log a + log b · log(a/b) = log a − log b · log(aⁿ) = n log a
- log_b b = 1, log_b 1 = 0
- Change of base: log_b a = log a / log b

**Useful values.** log₁₀ 2 ≈ 0.3010, log₁₀ 3 ≈ 0.4771, so log₁₀ 5 = 1 − 0.3010 = 0.6990.

**Surds.** √a × √b = √(ab). (√a + √b)(√a − √b) = a − b. Rationalise 1/(√a − √b) by multiplying by (√a + √b)/(√a + √b).

**Worked example 1.** 2⁵ × 2³ ÷ 2⁴ = 2⁴ = 16.

**Worked example 2.** log₂ 32 + log₃ 27 = 5 + 3 = 8.

**Worked example 3.** 1/(√5 − √3) = (√5 + √3)/2.

**Worked example 4.** 8^(2/3) = (∛8)² = 4.
`, [yt("jAbpPTpz2bQ", "Surds and indices"), yt("w-7mbazOx6o", "Logarithms"), bix("aptitude/logarithm", "logarithm"), bix("aptitude/surds-and-indices", "surds and indices")], [
  iq("Explain the change-of-base rule and when you'd use it.", "log_b a = log_c a / log_c b for any base c. Use it to evaluate logs in an awkward base using base 10 or e (e.g. on a calculator), or to compare logs in different bases.", ["States the rule", "Gives a use"]),
  iq("How do you rationalise 3/(√7 − 2)?", "Multiply top and bottom by the conjugate (√7 + 2): the denominator becomes 7 − 4 = 3, so the result is √7 + 2.", ["Uses the conjugate", "Difference of squares in the denominator", "Correct result"]),
  iq("Given log 2 = 0.3010, find log 25.", "log 25 = 2 log 5 = 2(1 − log 2) = 2 × 0.6990 = 1.398.", ["log 5 = 1 − log 2", "Power rule", "1.398"]),
]);
Card_("p2-logs-c1", "log(aⁿ), log(ab)", "n log a; log a + log b.", B.logs);
Card_("p2-logs-c2", "Rationalise 1/(√a − √b)", "Multiply by (√a + √b): result (√a + √b)/(a − b).", B.logs);

// ───────────────────────── Geometry and mensuration ─────────────────────────
topic(B.tri, "Geometry and mensuration", "Triangles", "Angle facts, Pythagoras and triples, area formulas, and similarity.", `
**Angles.** The interior angles sum to 180°. An exterior angle equals the sum of the two opposite interior angles.

**Triangle inequality.** Each side is less than the sum of the other two: 3, 4 and 8 cannot form a triangle.

**Right triangles.** a² + b² = c². Common triples: 3-4-5, 5-12-13, 8-15-17, 7-24-25, 20-21-29 and their multiples.

**Area.**

- ½ × base × height
- ½ ab sin C
- Heron: s = (a + b + c)/2, area = √(s(s − a)(s − b)(s − c))
- Equilateral: (√3/4)a²

**Similarity (AA).** Equal angles give similar triangles; corresponding sides are in a constant ratio k, areas in the ratio k². A line parallel to one side cuts the other two proportionally (basic proportionality theorem): DE/BC = AD/AB.

**Centroid** divides each median in the ratio 2 : 1 from the vertex.

**Worked example 1.** Legs 5 and 12 → hypotenuse 13.

**Worked example 2.** Sides 13, 14, 15: s = 21, area = √(21 × 8 × 7 × 6) = √7056 = 84.

**Worked example 3.** DE ∥ BC with AD : DB = 2 : 3 and BC = 15 → DE = 15 × 2/5 = 6.

**Worked example 4.** Similar triangles with sides in ratio 2 : 3 have areas in ratio 4 : 9.
`, [R("Video: similarity rules and ratios (Rodha)", "https://www.youtube.com/watch?v=GAWnMfYzQKQ"), R("Video: properties of triangles (iQuanta)", "https://www.youtube.com/watch?v=a2qp-mnRx2U"), bix("aptitude/area", "area")], [
  iq("Two similar triangles have corresponding sides 4 cm and 6 cm. What is the ratio of their areas?", "Area scales with the square of the side ratio: (4/6)² = 4/9, so 4 : 9.", ["Squares the ratio", "4 : 9"]),
  iq("How do you find a triangle's area from its three sides?", "Heron's formula: s = (a + b + c)/2 and area = √(s(s − a)(s − b)(s − c)). For 13, 14, 15 that is √(21 × 8 × 7 × 6) = 84.", ["Semi-perimeter", "Heron's formula", "Worked value"]),
  iq("What is the exterior angle theorem?", "An exterior angle of a triangle equals the sum of the two interior angles not adjacent to it, because both it and those two angles complete the third angle to 180°.", ["States the theorem", "Explains why"]),
]);
Card_("p2-tri-c1", "Pythagorean triples", "3-4-5, 5-12-13, 8-15-17, 7-24-25, 20-21-29.", B.tri);
Card_("p2-tri-c2", "Similar triangles, side ratio k", "Area ratio k².", B.tri);

topic(B.circ, "Geometry and mensuration", "Circles and polygons", "Polygon angles and diagonals; arcs, sectors, tangents and circle theorems.", `
**Polygons (n sides).**

- Sum of interior angles (n − 2) × 180°
- Each exterior angle of a regular polygon 360°/n; interior = 180° − exterior
- Number of sides from an interior angle: n = 360/(180 − interior)
- Diagonals n(n − 3)/2

**Circles (radius r).** Circumference 2πr, area πr². For a central angle θ: arc length (θ/360) × 2πr, sector area (θ/360) × πr².

**Tangents.** A tangent is perpendicular to the radius at the point of contact, so tangent length from a point at distance d from the centre is √(d² − r²). Two tangents from the same point are equal.

**Circle theorems.**

- The angle in a semicircle is 90°.
- The angle at the centre is twice the angle at the circumference on the same arc.
- Angles in the same segment are equal.
- Opposite angles of a cyclic quadrilateral sum to 180°.

**Worked example 1.** A regular hexagon's interior angle: 180 − 60 = 120°.

**Worked example 2.** Interior angle 150° → exterior 30° → 12 sides.

**Worked example 3.** Sector of radius 6 cm, angle 60°: (60/360) × 36π = 6π cm².

**Worked example 4.** Tangent from a point 13 cm from the centre of a 5 cm circle: √(169 − 25) = 12 cm.
`, [yt("xwqUyOT-cmU", "Area and perimeter"), bix("aptitude/area", "area")], [
  iq("How do you find the number of sides of a regular polygon from one interior angle?", "Exterior angle = 180° − interior, and exterior angles of a regular polygon sum to 360°, so n = 360/(180 − interior). For 140°: 360/40 = 9 sides.", ["Exterior = 180 − interior", "n = 360/exterior", "Example"]),
  iq("Why is a tangent perpendicular to the radius?", "The point of contact is the closest point of the tangent line to the centre; the shortest distance from a point to a line is the perpendicular. Hence the radius to that point is perpendicular to the tangent.", ["Closest point argument", "Perpendicular is the shortest distance"]),
  iq("What is the difference between arc length and sector area for the same angle?", "Arc length is a fraction θ/360 of the circumference 2πr; sector area is the same fraction of the area πr². Sector area = ½ × r × arc length.", ["Both use θ/360", "Circumference vs area", "½ r × arc"]),
]);
Card_("p2-circ-c1", "Sides from interior angle", "n = 360 / (180 − interior).", B.circ);
Card_("p2-circ-c2", "Tangent length", "√(d² − r²).", B.circ);

topic(B.coord, "Geometry and mensuration", "Coordinate geometry", "Distance, section formula, slopes and lines, intersections and triangle area.", `
**Distance** between (x₁, y₁) and (x₂, y₂): √((x₂ − x₁)² + (y₂ − y₁)²). **Midpoint**: ((x₁ + x₂)/2, (y₁ + y₂)/2).

**Section formula.** The point dividing AB internally in the ratio m : n (AP : PB) is ((m x₂ + n x₁)/(m + n), (m y₂ + n y₁)/(m + n)).

**Slope** m = (y₂ − y₁)/(x₂ − x₁). Parallel lines have equal slopes; perpendicular lines have m₁m₂ = −1.

**Lines.** y = mx + c (c is the y-intercept); through a point: y − y₁ = m(x − x₁). Intersection: set the equations equal.

**Triangle area** from vertices (shoelace): ½ |x₁(y₂ − y₃) + x₂(y₃ − y₁) + x₃(y₁ − y₂)|. Area 0 means the points are collinear.

**Worked example 1.** Distance from (1, 2) to (4, 6): √(9 + 16) = 5.

**Worked example 2.** Midpoint of (2, −3) and (6, 5): (4, 1).

**Worked example 3.** Through (1, 2) and (3, 8): slope 3, line y = 3x − 1.

**Worked example 4.** Triangle (0, 0), (4, 0), (0, 3): area ½ × 4 × 3 = 6.
`, [R("Video: coordinate geometry (BYJU'S Exam Prep)", "https://www.youtube.com/watch?v=NIGFIj3dSvo"), R("Video: geometry for campus placements (Code Step By Step)", "https://www.youtube.com/watch?v=YIFswAXE0BE")], [
  iq("How do you check whether three points are collinear?", "Compute the triangle area with the shoelace formula: zero means collinear. Equivalently, the slopes AB and BC are equal.", ["Area zero", "Or equal slopes"]),
  iq("What is the slope of a line perpendicular to y = 2x + 5?", "Perpendicular slopes multiply to −1, so −1/2.", ["m₁m₂ = −1", "−1/2"]),
  iq("Explain the section formula intuitively.", "A point dividing AB in the ratio m : n sits m/(m + n) of the way from A to B, so P = A + (m/(m + n))(B − A), which rearranges to (mB + nA)/(m + n). The weight on each endpoint is the opposite part of the ratio.", ["Fraction of the way along", "Weights swap", "Formula"]),
]);
Card_("p2-coord-c1", "Perpendicular slopes", "m₁ × m₂ = −1.", B.coord);
Card_("p2-coord-c2", "Section formula (m : n)", "(m x₂ + n x₁)/(m + n), same for y.", B.coord);

topic(B.mens, "Geometry and mensuration", "Mensuration: areas and volumes", "2-D areas and 3-D volumes and surface areas, and how they scale.", `
**2-D.** Rectangle lb · square a² · triangle ½bh · circle πr² · parallelogram bh · trapezium ½(a + b)h · rhombus ½d₁d₂.

**3-D.**

- Cuboid: volume lbh; surface 2(lb + bh + hl); space diagonal √(l² + b² + h²)
- Cube: a³; 6a²; diagonal a√3
- Cylinder: πr²h; curved 2πrh; total 2πr(r + h)
- Cone: ⅓πr²h; slant l = √(r² + h²); curved πrl
- Sphere: 4/3 πr³; surface 4πr². Hemisphere: 2/3 πr³; curved 2πr², total 3πr²

**Scaling.** Multiply every length by k: areas × k², volumes × k³. A 10% larger radius gives 1.1³ = 1.331, a 33.1% larger volume.

**Melting and recasting.** The volume is conserved: set the two volume formulas equal.

**Worked example 1.** Cylinder r = 7, h = 10: 490π cm³.

**Worked example 2.** Cone r = 3, h = 4: l = 5, curved surface 15π cm².

**Worked example 3.** A 2 × 3 × 6 box: diagonal √(4 + 9 + 36) = 7.

**Worked example 4.** A sphere of radius 6 recast into a cylinder of radius 4: (4/3)π × 216 = 288π = 16πh, so h = 18.
`, [yt("xwqUyOT-cmU", "Area and perimeter"), yt("2rp_-h6PnFo", "Volume and surface area"), bix("aptitude/volume-and-surface-area", "volume and surface area")], [
  iq("If every dimension of a solid doubles, what happens to its surface area and volume?", "Surface area scales with length², so it becomes 4 times; volume with length³, so 8 times.", ["Area × 4", "Volume × 8", "Square/cube reasoning"]),
  iq("How is a cone's volume related to a cylinder's with the same base and height?", "Exactly one third: ⅓πr²h versus πr²h.", ["One third"]),
  iq("How do you solve 'melt one solid and recast it as another' questions?", "Volume is conserved: write volume(original) = volume(new) (times the number of pieces if several are made) and solve for the unknown dimension. Surface area is not conserved.", ["Volume conserved", "Multiply by number of pieces", "Surface area changes"]),
]);
Card_("p2-mens-c1", "Cone: slant height and curved area", "l = √(r² + h²); πrl.", B.mens);
Card_("p2-mens-c2", "Scale lengths by k", "Area × k², volume × k³.", B.mens);

// ───────────────────────── Logical reasoning ─────────────────────────
topic(B.series, "Logical reasoning", "Number and letter series", "Find the rule from differences, ratios, alternating positions and recurrences.", `
**Checklist, in order.**

1. **Differences.** Constant → arithmetic. If not, take differences of the differences: constant second differences → a quadratic rule (n², n(n + 1), …).
2. **Ratios.** Constant → geometric. Nearly constant → "× p then + q" (3, 7, 15, 31: × 2 + 1).
3. **Alternating positions.** If the series zig-zags, split into odd and even positions; each may be its own simple series.
4. **Differences that multiply.** 1, 2, 4, 8 … as differences → extend the differences.
5. **Known sequences.** Squares, cubes, primes, Fibonacci (each term = sum of the previous two), n² ± 1, n³ ± n.

**Letter series.** Convert letters to positions (A = 1 … Z = 26; remember E 5, J 10, O 15, T 20, Y 25) and apply the same checklist.

**Wrong-number questions.** Find the rule that most terms obey; the one that breaks it is the answer.

**Worked example 1.** 2, 6, 12, 20, 30, ? → differences 4, 6, 8, 10 → 12: 42 (n(n + 1)).

**Worked example 2.** 3, 7, 15, 31, 63, ? → × 2 + 1 → 127.

**Worked example 3.** 2, 20, 4, 17, 6, 14, ? → odd positions 2, 4, 6 (+2), even 20, 17, 14 (−3). The 7th term is in the first series: 8.

**Worked example 4.** A, C, F, J, O, ? → gaps 2, 3, 4, 5 → next gap 6: U.
`, [yt("gXBuL_FyahE", "Series"), R("Video: number series tricks (The Organic Chemistry Tutor)", "https://www.youtube.com/watch?v=r614AD021n0"), bix("logical-reasoning/number-series", "number series"), bix("logical-reasoning/letter-and-symbol-series", "letter series")], [
  iq("Walk me through how you attack an unfamiliar number series.", "Take differences first (and second differences if needed), then ratios, then check alternating positions, then known sequences like squares, cubes, primes and Fibonacci. Confirm the rule on every given term, not just the first few, before predicting.", ["Ordered checklist", "Second differences", "Alternating positions", "Verify on all terms"]),
  iq("Why can a series have more than one valid answer, and how do exams avoid it?", "Any finite list can be extended by many rules (a high-degree polynomial fits anything). Exams rely on the simplest natural rule and give enough terms that common families agree on one answer. When in doubt, prefer the rule with the fewest parameters.", ["Finite data underdetermines rules", "Simplest rule", "Enough terms"]),
  iq("How do you handle a letter series?", "Convert letters to alphabet positions, find the numeric rule (often growing gaps or alternating steps), and convert back, wrapping past Z if needed.", ["Letters → numbers", "Same methods", "Wrap-around"]),
]);
Card_("p2-series-c1", "Series checklist", "Differences → second differences → ratios → alternate positions → known sequences.", B.series);
Card_("p2-series-c2", "Letter positions to memorise", "E 5, J 10, O 15, T 20, Y 25.", B.series);

topic(B.code, "Logical reasoning", "Coding and decoding", "Letter shifts, reversals, opposite letters and number codes.", `
**Write the positions.** A = 1 … Z = 26. Opposite letters add to 27: A↔Z, B↔Y, C↔X, … M↔N.

**Common rules.**

- **Shift:** every letter moves k places (CAT → DBU is +1). Check the direction on two letters.
- **Reverse:** the word is written backwards, sometimes also shifted.
- **Opposite letters (mirror):** each letter is replaced by its partner adding to 27 (GOOD → TLLW).
- **Alternating shifts:** odd positions +1, even positions −1, and similar.
- **Number codes:** sum of positions (CAT = 3 + 1 + 20 = 24), reversed positions (27 − p), or position-wise numbers.
- **Substitution:** "if sky is called water and water is called blue…": follow the renaming exactly.

**Method.** Compare the word and its code letter by letter. Form a hypothesis from the first letter, confirm it on at least two more, then apply it.

**Worked example 1.** CAT → DBU (+1), so DOG → EPH.

**Worked example 2.** If MANGO is written OGNAM (reversed), FRUIT is TIURF.

**Worked example 3.** Opposite letters: GOOD → T L L W (G 7 ↔ T 20, O 15 ↔ L 12, D 4 ↔ W 23).

**Worked example 4.** If CAT = 24 (sum of positions), DOG = 4 + 15 + 7 = 26.
`, [yt("wwN3mJ-b4FY", "Coding and decoding")], [
  iq("How do you crack a letter code quickly?", "Write letter positions for the word and its code, compute the change for each position, and look for a constant shift, a reversal, opposite-letter pairs (sum 27) or alternating shifts. Confirm on several letters before applying the rule to the new word.", ["Positions", "List of rule types", "Confirm before applying"]),
  iq("What are 'opposite letters' and how do you find them fast?", "Pairs whose positions add to 27: A–Z, B–Y, … M–N. Subtract the position from 27, or remember a few anchors such as 'GT' (7 and 20) and 'MN'.", ["Sum 27", "Anchor pairs"]),
  iq("Why check a code rule on more than one letter?", "Several rules can produce the same first letter (a +1 shift and a reversal can coincide on one letter). Only checking all letters rules out the alternatives.", ["Multiple rules can match one letter", "Check every letter"]),
]);
Card_("p2-code-c1", "Opposite letters", "Positions add to 27: A↔Z, B↔Y, … M↔N.", B.code);
Card_("p2-code-c2", "Decoding method", "Positions → per-letter change → hypothesis → confirm on 2+ letters.", B.code);

topic(B.odd, "Logical reasoning", "Analogy and odd one out", "Spot the relation in one pair and apply it; find the one item that breaks a shared property.", `
**Analogies (A : B :: C : ?).** Find the relation between A and B, check it on any second given pair, then apply it to C.

- Numbers: square, cube, n² ± 1, n(n + 1), 2n + 3 …
- Letters: shift each letter by the same amount, reverse, opposite letters
- Words: worker–tool, part–whole, product–raw material, synonym/antonym, degree (warm : hot)

**Odd one out.** Find a property shared by all but one item.

- Numbers: prime, perfect square or cube, multiple of 7 or 11, digit sum, even/odd
- Letter groups: equal gaps between letters, vowel count, alphabetical order
- Words: category (four fruits and a vegetable)

Test several properties; a good answer is singled out by one clear property and not contradicted by an equally simple one.

**Worked example 1.** 3 : 10 :: 5 : 26 :: 7 : ? → n² + 1 → 50.

**Worked example 2.** ACE : BDF :: GIK : ? → +1 each → HJL.

**Worked example 3.** 17, 23, 29, 33, 41 → 33 is not prime.

**Worked example 4.** BDF, HJL, NPR, TVX, WXZ → WXZ (gaps 1 and 2; the others are 2 and 2).
`, [R("Video: odd man out and series (S Chand Academy)", "https://www.youtube.com/watch?v=buUABQmiC-Y"), bix("verbal-reasoning/analogy", "analogy"), bix("verbal-reasoning/classification", "classification (odd one out)")], [
  iq("How do you avoid picking the wrong rule in an analogy?", "Use every example pair given, not just the first, and prefer the simplest rule that fits all of them. For 2 : 5 the rule could be n² + 1 or 2n + 1; a second pair like 3 : 10 rules out 2n + 1.", ["Use all pairs", "Simplest rule", "Disambiguation example"]),
  iq("What properties do you check first in a number odd-one-out?", "Prime vs composite, perfect squares and cubes, multiples of a common number, digit sums, then parity. Choose the property that splits the set 4 : 1.", ["Ordered properties", "4 : 1 split"]),
  iq("How do you approach a letter-group odd one out?", "Convert to positions and compare the gaps inside each group (e.g. +2, +2); the group with different gaps is the answer. Also check vowels and reversals if the gaps all match.", ["Positions and gaps", "Fallback properties"]),
]);
Card_("p2-odd-c1", "Analogy method", "Find the relation, check it on every given pair, apply it.", B.odd);
Card_("p2-odd-c2", "Number odd one out", "Prime, square, cube, multiple, digit sum, parity: find the 4 : 1 split.", B.odd);

for (const g of B4_ITEMS) {
  Item({
    id: g.id, topic: g.topic, d: g.d, secs: g.secs, prompt: g.prompt,
    ...(g.options ? { options: g.options } : {}),
    answer: g.answer,
    ...(g.tol !== undefined && !g.options ? { tol: g.tol } : {}),
    explain: g.explain, fast: g.fast, trap: g.trap,
    src: g.topic.startsWith("lr2") ? "Practice: generated; answer proven unique within a rule family in Python (Nov 2026)" : "Practice: generated from a standard OA pattern, answer recomputed in Python (Nov 2026)",
    check: { py: g.py },
  });
}
