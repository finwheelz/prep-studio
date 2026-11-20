/**
 * Batch 6: DILR logic sets (grids, scheduling, tournaments, Venn counting) and P3 probability
 * (8 concepts). Items come from src/data/gen/b6.ts; every one carries an independent Python check.
 */
import { B6_ITEMS, B6_TOPICS as B } from "@/data/gen/b6";
import type { InterviewQ, Resource } from "@/lib/types";
import { Card_, Item, R, T } from "./build";

const iq = (q: string, answer: string, rubric: string[]): InterviewQ => ({ q, answer, rubric });
const yt = (id: string, title: string, who: string) => R(`Video: ${title} (${who})`, `https://www.youtube.com/watch?v=${id}`);
const di = (id: string, title: string, summary: string, notes: string, resources: Resource[], interview: InterviewQ[]) =>
  T(id, "aptitude", "Data interpretation", title, summary, notes, { resources, interview });
const pr = (id: string, title: string, summary: string, notes: string, resources: Resource[], interview: InterviewQ[]) =>
  T(id, "analyst", "Probability", title, summary, notes, { resources, interview });
const STAT110 = yt("KbB0FjPg0mw", "Stat 110 lecture 1: probability and counting", "Harvard");

// ───────────────────────── Logic sets ─────────────────────────
di(B.grid, "Logic sets: multi-attribute grids", "People × attributes puzzles: a grid of ticks and crosses does the work.", `
**The setup.** Each person has exactly one value of each attribute (city, job, pet …) and no two share a value.

**Method.**

1. Draw a grid: people down the side, every attribute value across the top (one block per attribute).
2. Direct clues ("Dev is the lawyer") → ✓, and cross out the rest of that row and column within the block.
3. Linking clues ("the person from Goa is the lawyer") → whoever gets one gets the other; carry ✗s across blocks.
4. Negative clues ("the doctor does not own the cat") → ✗ the pair.
5. When a row or column within a block has one empty cell left, it must be ✓.

**Speed habit.** Start with the clue that names a person directly, then follow chains of linking clues from it.

**Worked example.** Ravi lives in Delhi; Priya lives in Pune; the person from Goa is the lawyer; Dev is the lawyer → Dev lives in Goa; the fourth person (Asha) lives in Agra. The parrot owner lives in Pune → Priya owns the parrot; the parrot owner is the chef → Priya is the chef.
`, [yt("c4zTuus5nN0", "Solve logic grid puzzles: the basics", "Reckon Math"), yt("4tI-h-GKWVk", "Arrangement basics", "Rodha")], [
  iq("How do you avoid getting stuck in a grid puzzle?", "Fill every direct clue first, then propagate: each ✓ crosses out its row and column inside the block, and linking clues transfer ✓ and ✗ between blocks. When stuck, pick the attribute with the fewest possibilities and try each case; one usually contradicts a clue quickly.", ["Direct clues first", "Propagate ✓/✗", "Branch on the smallest case"]),
  iq("Why can a negative clue be as useful as a positive one?", "With four options, each ✗ removes a possibility; three ✗s in a row force the remaining ✓. Late in the puzzle a single 'not' clue often decides everything.", ["Elimination", "Forces the last cell"]),
  iq("How would you check your final answer?", "Re-read every clue against the completed grid; each must hold exactly. If a clue was never used, double-check, since well-built puzzles usually need every clue.", ["Verify every clue", "Unused clue is a warning"]),
]);
Card_("p2-grid-c1", "Grid rule", "A ✓ crosses out the rest of its row and column within that attribute block.", B.grid);

di(B.sched, "Logic sets: scheduling and sequencing", "Assign people or events to ordered slots with before/after, adjacency and gap clues.", `
**Slots first.** Write the days (or positions) left to right. Every person takes exactly one slot.

**Clue types.**

- Fixed: "Asha is scheduled on Wednesday."
- Block: "B is the day immediately after A" → AB stay together.
- Gap: "Exactly two days lie between X and Y" → their slots differ by 3, in either order (two cases).
- Order: "X is earlier than Y" → X left of Y, distance unknown.
- Linking: "The Maths talk is on Monday", "Neel gives the History talk".

**Order of work.** Fixed slots → blocks → gap clues (write both cases) → order clues to kill cases → linking clues to fill the second attribute.

**Worked example.** Five people, Mon–Fri. Asha is on Wednesday. Ravi is the day after Asha → Thursday. Exactly one day lies between Ravi and Meera → Tuesday (Saturday doesn't exist). Kabir is earlier than Tara, and only Monday and Friday are left → Kabir Monday, Tara Friday.

**Check every case.** Before calling a schedule unique, try each placement a gap or 'earlier than' clue allows; puzzles often need the last clue to rule out a second arrangement.
`, [yt("4tI-h-GKWVk", "Linear and circular arrangement basics", "Rodha")], [
  iq("Why do gap clues create two cases?", "\"Exactly k days between X and Y\" doesn't say which comes first, so X can be left or right of Y; at the edges one case may be impossible. Write both and let other clues eliminate one.", ["Order unspecified", "Two cases", "Edges remove one"]),
  iq("What does 'earlier than' tell you, and what doesn't it?", "Only that X is left of Y; the distance is unknown. It's mostly useful to eliminate cases created by block and gap clues.", ["Direction only", "Eliminates cases"]),
  iq("How do you handle a second attribute (subjects) on top of days?", "Solve the day order first using clues that mention people or talks, then use linking clues ('Neel gives History', 'the Maths talk is on Monday') to fill the second row.", ["Days first", "Then link attributes"]),
]);
Card_("p2-sched-c1", "Exactly k days between X and Y", "Slots differ by k + 1, in either order.", B.sched);

di(B.tour, "Logic sets: tournaments and scoring", "Round robins, points systems and working backwards from a points table.", `
**Round robin.** n teams, each pair meets once: n(n − 1)/2 matches; each team plays n − 1. Four teams → 6 matches, 3 per team.

**Points systems.**

- Win 3, draw 1, loss 0: each decisive match hands out 3 points, each draw 2. Total points = 3 × matches − draws, so the total fixes the number of draws.
- Win 2, draw 1, loss 0: every match hands out exactly 2 points, so the total is always 2 × matches and says nothing about draws.

**Working back from points.** With 3/1/0, a team's points = 3W + D with W + D + L = n − 1; list the (W, D, L) combinations. A team with points not divisible by 3 must have drawn. With 2/1/0, a team with odd points has an odd number of draws.

**Every draw is shared** by two teams: total draws counted per team = 2 × number of drawn matches.

**Knockouts.** n teams → n − 1 matches to find a winner (every match eliminates one team).

**Worked example.** 3/1/0, four teams with 7, 5, 3, 1 points (total 16): draws = 18 − 16 = 2. 7 = 2W + 1D; 5 = 1W + 2D; 3 = 1W or 3D; 1 = 1D. Draws counted per team must total 4, which forces the 3-point team to have one win and no draws.
`, [yt("Oy9ERJEboWY", "Games and tournaments", "Rodha")], [
  iq("Why does the points total reveal the number of draws in a 3/1/0 system but not in 2/1/0?", "Under 3/1/0 a decisive match adds 3 points and a draw only 2, so every draw lowers the total by one: total = 3M − D. Under 2/1/0 both kinds of result add exactly 2, so the total is fixed regardless of draws.", ["3M − D", "2/1/0 always 2 per match"]),
  iq("How many matches are needed in a knockout of 16 teams, and why?", "15. Each match eliminates exactly one team and 15 must be eliminated to leave a winner, regardless of bracket shape.", ["n − 1", "One elimination per match"]),
  iq("How do you decompose a team's points into wins and draws?", "Solve points = w·W + D with W + D + L = matches played; enumerate the few possibilities, then use cross-constraints (draws come in pairs, a win for one team is a loss for another) to pick the right one.", ["Enumerate (W, D, L)", "Pair constraints"]),
]);
Card_("p2-tour-c1", "Round robin, n teams", "n(n − 1)/2 matches. With 3/1/0 points: total = 3M − draws.", B.tour);

di(B.venn, "Logic sets: Venn counting", "Three overlapping groups: only, exactly two, at least one, none.", `
**Inclusion–exclusion.** |A ∪ B ∪ C| = A + B + C − (A∩B) − (B∩C) − (C∩A) + (A∩B∩C).

**Region formulas** (with pairwise totals including the triple overlap):

- Only A = A − (A∩B) − (A∩C) + (A∩B∩C)
- Exactly two = (A∩B + B∩C + C∩A) − 3 × (A∩B∩C)
- At least two = (A∩B + B∩C + C∩A) − 2 × (A∩B∩C)
- None = total − |A ∪ B ∪ C|

**Method.** Draw three circles and fill from the centre outwards: triple overlap first, then the pairwise-only regions, then the only-one regions.

**Watch the wording.** "Both A and B" usually includes people in all three; "only A and B" excludes them.

**Worked example.** 100 people: A 50, B 40, C 30, A∩B 15, B∩C 10, C∩A 12, all three 5. At least one = 50 + 40 + 30 − 15 − 10 − 12 + 5 = 88, so none = 12. Only A = 50 − 15 − 12 + 5 = 28. Exactly two = 37 − 15 = 22. At least two = 37 − 10 = 27.
`, [yt("zoSpsLhO0qg", "Venn diagram word problems with 3 categories", "The Organic Chemistry Tutor")], [
  iq("Why is the triple overlap added back in inclusion–exclusion?", "Adding A, B and C counts the centre three times; subtracting the three pairwise overlaps removes it three times, leaving it uncounted. Adding it once restores it.", ["Counted 3 times, removed 3 times", "Add back once"]),
  iq("What's the difference between 'both A and B' and 'only A and B'?", "'Both A and B' is the whole A∩B, including people also in C. 'Only A and B' excludes C: A∩B minus the triple overlap.", ["Includes vs excludes the centre"]),
  iq("How do you fill a three-circle Venn diagram efficiently?", "Centre first, then each pairwise-only region (pairwise total minus centre), then each single-only region (set total minus its three inner regions), then 'none' from the overall total.", ["Centre outwards", "Subtract inner regions"]),
]);
Card_("p2-venn-c1", "Exactly two of three", "Σ pairwise − 3 × all three.", B.venn);

// ───────────────────────── Probability ─────────────────────────
pr(B.basics, "Sample spaces, axioms and counting", "Equally likely outcomes, complements and the addition rule.", `
**Sample space** S: all possible outcomes. An **event** is a subset. With equally likely outcomes, P(A) = |A| / |S|.

**Axioms.** P(A) ≥ 0; P(S) = 1; for disjoint events P(A ∪ B) = P(A) + P(B). Everything else follows:

- Complement: P(not A) = 1 − P(A). Use it for "at least one".
- Addition rule: P(A ∪ B) = P(A) + P(B) − P(A ∩ B).
- If A ⊆ B, P(A) ≤ P(B).

**Counting.** Order matters → permutations; it doesn't → combinations. Two dice: 36 ordered outcomes; n coins: 2ⁿ; a 5-card hand: C(52, 5).

**Worked example 1.** Two dice sum to 7: (1,6), (2,5), … (6,1) = 6 of 36 = 1/6.

**Worked example 2.** Three coins, at least two heads: HHT, HTH, THH, HHH = 4/8 = 0.5.

**Worked example 3.** A heart or a king: 13 + 4 − 1 = 16 of 52 ≈ 0.3077.

**Worked example 4.** At least one six in four rolls: 1 − (5/6)⁴ = 1 − 625/1296 ≈ 0.5177.
`, [STAT110, yt("FJd_1H3rZGg", "Stat 110 lecture 2: axioms of probability", "Harvard")], [
  iq("The birthday problem: how many people do you need for a better-than-even chance that two share a birthday?", "23. Use the complement: P(all different) = 365/365 × 364/365 × … × 343/365 ≈ 0.493, so P(some shared) ≈ 0.507. The number of pairs grows quadratically (23 people → 253 pairs), which is why it's so small.", ["Complement", "Product of (365 − k)/365", "23", "Pairs explain the intuition"]),
  iq("Why is 'at least one' usually solved with the complement?", "'At least one' covers many overlapping cases; its complement 'none' is a single, usually independent, product. P(at least one six in n rolls) = 1 − (5/6)ⁿ.", ["Many cases vs one", "Example"]),
  iq("Why is (2, 5) different from (5, 2) when rolling two dice?", "The 36 ordered pairs are equally likely; the 21 unordered pairs are not ({2, 5} can happen two ways, {3, 3} only one). Counting unordered pairs as equally likely gives wrong probabilities.", ["Ordered outcomes are equally likely", "Unordered are not"]),
]);
Card_("pr-basics-c1", "Addition rule", "P(A ∪ B) = P(A) + P(B) − P(A ∩ B).", B.basics);
Card_("pr-basics-c2", "At least one", "1 − P(none).", B.basics);

pr(B.cond, "Conditional probability and independence", "Updating on information; when events don't affect each other.", `
**Conditional probability.** P(A | B) = P(A ∩ B) / P(B): restrict the sample space to B.

**Multiplication rule.** P(A ∩ B) = P(B) P(A | B). Drawing without replacement: P(two aces) = 4/52 × 3/51.

**Independence.** A and B are independent if P(A ∩ B) = P(A) P(B), equivalently P(A | B) = P(A).

- **Independent ≠ disjoint.** Disjoint events with positive probability are strongly dependent: if one happens, the other can't.
- Independence must be checked with numbers, not intuition.

**P(A | B) ≠ P(B | A).** P(positive test | disease) is not P(disease | positive test).

**Worked example 1.** Two dice sum to 8: (2,6), (3,5), (4,4), (5,3), (6,2). The first die is even in 3 of these 5: 0.6.

**Worked example 2.** Two cards without replacement, both aces: 4/52 × 3/51 = 1/221 ≈ 0.0045.

**Worked example 3.** Two children, at least one a boy: BB, BG, GB remain, so P(both boys) = 1/3. If instead the older is a boy: BB, BG remain, 1/2.

**Worked example 4.** "First die even" and "sum is 7" are independent: 3/36 = 1/2 × 1/6.
`, [yt("_IgyaD7vOOA", "Conditional probabilities, clearly explained", "StatQuest"), STAT110], [
  iq("Explain the Monty Hall problem and why switching wins 2/3 of the time.", "You pick one of three doors; the host, who knows where the car is, always opens a goat door you didn't pick and offers a switch. Your first pick is right with probability 1/3, and the host's action doesn't change that. In the other 2/3 of cases the car is behind the one remaining door, so switching wins 2/3.", ["Initial pick 1/3", "Host's knowledge matters", "Switch wins 2/3"]),
  iq("Are mutually exclusive events independent?", "No (unless one has probability 0). If A and B can't both happen, P(A ∩ B) = 0, but P(A)P(B) > 0, so knowing A happened tells you B didn't.", ["No", "0 vs P(A)P(B)"]),
  iq("Why is P(two aces) without replacement 4/52 × 3/51 and not (4/52)²?", "After the first ace is drawn, only 3 aces remain among 51 cards, so the second draw is conditional on the first. (4/52)² assumes replacement and independence.", ["Conditioning on the first draw", "Replacement assumption"]),
]);
Card_("pr-cond-c1", "Conditional probability", "P(A | B) = P(A ∩ B) / P(B).", B.cond);
Card_("pr-cond-c2", "Independent vs disjoint", "Independent: P(A ∩ B) = P(A)P(B). Disjoint: P(A ∩ B) = 0, so dependent.", B.cond);

pr(B.bayes, "Total probability and Bayes' theorem", "Combine causes, then reverse the conditioning; base rates matter.", `
**Law of total probability.** If B₁ … Bₙ partition the possibilities, P(A) = Σ P(Bᵢ) P(A | Bᵢ).

**Bayes' theorem.**

$$P(B_i \\mid A) = \\frac{P(B_i)\\,P(A \\mid B_i)}{\\sum_j P(B_j)\\,P(A \\mid B_j)}$$

Posterior ∝ prior × likelihood.

**Natural frequencies.** Imagine 1,000,000 people (or units): count each group, then divide. This makes base rates visible and avoids formula slips.

**Base-rate neglect.** A 99%-sensitive test for a 1% disease still gives mostly false positives if the false-positive rate is 5%: there are far more healthy people to misclassify.

**Worked example 1.** Machines make 50%, 30%, 20% of output with 1%, 2%, 3% defects: P(defective) = 0.005 + 0.006 + 0.006 = 0.017.

**Worked example 2.** Given defective, P(machine C) = 0.006/0.017 ≈ 0.3529.

**Worked example 3.** Prevalence 1%, sensitivity 99%, specificity 95%: TP 0.0099, FP 0.0495 → P(disease | +) = 0.0099/0.0594 ≈ 0.1667.

**Worked example 4.** Urn 1 has 3 red, 1 blue; urn 2 has 1 red, 3 blue. Pick an urn at random; the ball is red: P(urn 1) = (½·¾)/(½·¾ + ½·¼) = 0.75.
`, [yt("HZGCoVF3YvM", "Bayes theorem, the geometry of changing beliefs", "3Blue1Brown"), yt("lG4VkPoG3ko", "The medical test paradox", "3Blue1Brown"), yt("9wCnvr7Xw4E", "Bayes' theorem, clearly explained", "StatQuest")], [
  iq("A test is 99% accurate for a disease with 1% prevalence. You test positive. Are you 99% likely to have it?", "No. Out of 10,000 people, 100 are sick and 99 test positive; of the 9,900 healthy, 1% (99) also test positive. So only 99 of 198 positives are sick: 50%. The low base rate means false positives are as common as true ones.", ["Natural frequencies", "Counts TP and FP", "~50%", "Base rate"]),
  iq("State Bayes' theorem in words and give a data-science use.", "Posterior = prior × likelihood ÷ evidence: update the probability of a hypothesis by how well it explains the data. Uses: naive Bayes spam filters, A/B testing with priors, diagnostic tests, and updating fraud scores.", ["Prior, likelihood, posterior", "Concrete use"]),
  iq("Why does the denominator of Bayes' theorem use total probability?", "P(evidence) can occur under every hypothesis, so it is the weighted sum over all of them: Σ P(Hᵢ)P(E | Hᵢ). That also guarantees the posteriors sum to 1.", ["Evidence under all hypotheses", "Normalisation"]),
]);
Card_("pr-bayes-c1", "Bayes' theorem", "P(B | A) = P(B)P(A | B) / P(A).", B.bayes);
Card_("pr-bayes-c2", "Positive test, rare disease", "Use counts: TP / (TP + FP). Base rate dominates.", B.bayes);

pr(B.drv, "Discrete random variables", "PMFs, CDFs and expected value of countable outcomes.", `
**A random variable** maps outcomes to numbers. A **discrete** one has a probability mass function p(x) = P(X = x) with p(x) ≥ 0 and Σ p(x) = 1.

**CDF.** F(a) = P(X ≤ a): a step function rising to 1. P(X > a) = 1 − F(a).

**Expected value.** E[X] = Σ x p(x): the long-run average. E[g(X)] = Σ g(x) p(x). In general E[g(X)] ≠ g(E[X]).

**Games and decisions.** Expected gain = Σ payoff × probability, net of the cost to play. A fair game has expected gain 0.

**Worked example 1.** P(X = 0, 1, 2, 3) = k, 2k, 3k, 4k → 10k = 1 → k = 0.1.

**Worked example 2.** For that X, E[X] = 0(0.1) + 1(0.2) + 2(0.3) + 3(0.4) = 2.0.

**Worked example 3.** F(1) = P(X ≤ 1) = 0.1 + 0.2 = 0.3.

**Worked example 4.** Roll a die: win ₹2 × face if even, pay ₹3 if odd. E = (2(2 + 4 + 6) − 3 × 3)/6 = (24 − 9)/6 = ₹2.50.
`, [yt("oI3hZJqXJuc", "The main ideas behind probability distributions", "StatQuest"), yt("KLs_7b7SKi4", "Expected values, main ideas", "StatQuest")], [
  iq("Is E[X²] equal to (E[X])²?", "No. E[X²] − (E[X])² is the variance, which is ≥ 0, so E[X²] ≥ (E[X])², with equality only when X is constant. For a fair die, E[X²] = 91/6 ≈ 15.17 but (E[X])² = 12.25.", ["No", "Difference is the variance", "Example"]),
  iq("How would you price a fair game?", "Set the entry fee equal to the expected payout, so the expected net gain is zero. A casino charges more than the expected payout; the difference is the house edge.", ["Fee = expected payout", "House edge"]),
  iq("What's the difference between a PMF and a CDF?", "The PMF gives P(X = x) for each value; the CDF gives P(X ≤ x), the running total of the PMF. The CDF is non-decreasing from 0 to 1.", ["Point vs cumulative", "CDF properties"]),
]);
Card_("pr-drv-c1", "Expected value", "E[X] = Σ x · P(X = x).", B.drv);

pr(B.crv, "Continuous random variables", "Densities, areas under curves, uniform and exponential distributions.", `
**Density.** A continuous X has a density f(x) ≥ 0 with ∫ f(x) dx = 1. Probabilities are areas: P(a < X < b) = ∫ₐᵇ f(x) dx. P(X = a) = 0 for any single point, so < and ≤ give the same answer.

**CDF.** F(x) = P(X ≤ x) = ∫ f; f = F′.

**Uniform(a, b).** f = 1/(b − a); P(c < X < d) = (d − c)/(b − a); mean (a + b)/2; variance (b − a)²/12.

**Exponential(λ).** f(x) = λe^(−λx) for x ≥ 0; P(X > t) = e^(−λt); mean 1/λ. **Memoryless:** P(X > s + t | X > s) = P(X > t).

**Normal (preview).** Bell-shaped; about 68% within 1 SD of the mean, 95% within 2, 99.7% within 3.

**Worked example 1.** f(x) = c·x on [0, 2]: c × 2²/2 = 1 → c = 0.5.

**Worked example 2.** For that density, P(X < 1) = ∫₀¹ 0.5x dx = 0.25.

**Worked example 3.** X ~ Uniform(0, 10): P(2 < X < 5) = 3/10.

**Worked example 4.** Waiting time with mean 5 minutes (exponential): P(wait > 5) = e^(−1) ≈ 0.3679.
`, [yt("QxqxdQ_g2uw", "Continuous probability distributions", "The Organic Chemistry Tutor"), yt("9KVR1hJ8SxI", "Probability density functions", "MrNichollTV")], [
  iq("Can a probability density be greater than 1?", "Yes. A density is probability per unit length; only its integral must be 1. Uniform(0, 0.5) has density 2 everywhere on its range.", ["Yes", "Area, not height", "Example"]),
  iq("What does 'memoryless' mean for the exponential distribution?", "Having already waited s minutes doesn't change the distribution of the remaining wait: P(X > s + t | X > s) = P(X > t). It fits arrivals at a constant rate, not things that wear out.", ["Definition", "Constant hazard", "Not for ageing"]),
  iq("Why is P(X = 3) zero for a continuous variable?", "A single point has zero width, so the area under the density over it is zero. Only intervals carry probability.", ["Zero-width interval", "Intervals carry probability"]),
]);
Card_("pr-crv-c1", "Exponential tail", "P(X > t) = e^(−λt); mean 1/λ; memoryless.", B.crv);

pr(B.exp, "Expectation, linearity and indicators", "E[X + Y] = E[X] + E[Y] always, which turns hard counting into easy sums.", `
**Linearity.** E[aX + bY] = aE[X] + bE[Y], **even when X and Y are dependent.**

**Indicator trick.** To find the expected count of something, write count = Σ Iᵢ where Iᵢ = 1 if event i happens. Then E[count] = Σ P(event i). No need for the distribution of the count.

**Classic results.**

- Expected fixed points of a random permutation: n × (1/n) = 1.
- Expected distinct faces in n die rolls: 6(1 − (5/6)ⁿ).
- Expected runs in n coin tosses: 1 + (n − 1)/2.
- Expected trials to the first success: 1/p (geometric).
- Coupon collector: n(1 + 1/2 + … + 1/n) draws to see all n types.

**Worked example 1.** Sum of three dice: 3 × 3.5 = 10.5.

**Worked example 2.** n letters in random envelopes: expected correctly placed = 1, for any n.

**Worked example 3.** Distinct faces in 3 rolls: 6(1 − 125/216) = 6 × 91/216 ≈ 2.5278.

**Worked example 4.** Rolls until the first six: 1/(1/6) = 6.
`, [yt("KLs_7b7SKi4", "Expected values, main ideas", "StatQuest"), STAT110], [
  iq("What is the expected number of coin flips to get two heads in a row?", "6. Let E be the expected flips from scratch and E₁ after one head. E = 1 + ½E₁ + ½E, E₁ = 1 + ½·0 + ½E. Solving gives E₁ = 4 and E = 6.", ["Sets up states", "Solves the equations", "6"]),
  iq("Why does linearity of expectation not need independence?", "E[X + Y] = Σ (x + y) p(x, y) splits into Σ x p(x, y) + Σ y p(x, y), which are E[X] and E[Y] by summing out the other variable. No factorisation of p(x, y) is used.", ["Sum splits", "No independence used"]),
  iq("Expected number of people who get their own hat back when n hats are returned at random?", "1, for every n. Each person gets their own hat with probability 1/n; summing n indicators gives n × 1/n.", ["Indicators", "1"]),
]);
Card_("pr-exp-c1", "Indicator trick", "E[count] = Σ P(each event happens).", B.exp);
Card_("pr-exp-c2", "Expected trials to first success", "1/p.", B.exp);

pr(B.var, "Variance, covariance and correlation", "How spread out a variable is, and how two variables move together.", `
**Variance.** Var(X) = E[(X − μ)²] = E[X²] − (E[X])². Standard deviation σ = √Var.

**Rules.**

- Var(aX + b) = a² Var(X): shifting does nothing, scaling squares.
- Var(X ± Y) = Var(X) + Var(Y) ± 2 Cov(X, Y). For independent X, Y: Var(X ± Y) = Var(X) + Var(Y) (always plus).

**Covariance.** Cov(X, Y) = E[XY] − E[X]E[Y]. Its units are units(X) × units(Y), so its size is hard to interpret.

**Correlation.** ρ = Cov(X, Y) / (σₓ σᵧ), between −1 and 1, unit-free, measures **linear** association only.

- Independent ⇒ zero correlation, but zero correlation does **not** imply independence (Y = X² with X symmetric about 0).
- Correlation is not causation.

**Worked example 1.** A fair die: E[X²] = 91/6, (E[X])² = 12.25 → Var = 35/12 ≈ 2.9167.

**Worked example 2.** Var(2X + 3) = 4 Var(X).

**Worked example 3.** Sum (or difference) of two dice: 35/12 + 35/12 ≈ 5.8333.

**Worked example 4.** x = 1…5, y = 2, 4, 5, 4, 5: Σ(x − x̄)(y − ȳ) = 6, Σ(x − x̄)² = 10, Σ(y − ȳ)² = 6 → r = 6/√60 ≈ 0.7746.
`, [yt("qtaqvPAeEJY", "Covariance, clearly explained", "StatQuest"), yt("xZ_z8KWkhXE", "Pearson's correlation, clearly explained", "StatQuest")], [
  iq("Does zero correlation mean two variables are independent?", "No. Correlation only measures linear association. If X is uniform on [−1, 1] and Y = X², Y is completely determined by X, yet Cov(X, Y) = E[X³] − E[X]E[X²] = 0.", ["No", "Linear only", "Y = X² example"]),
  iq("Why is Var(X − Y) = Var(X) + Var(Y) for independent X and Y, not a difference?", "Var(−Y) = (−1)² Var(Y) = Var(Y). Subtracting an independent variable adds its uncertainty, just like adding it.", ["Var(aX) = a²Var(X)", "Uncertainty adds"]),
  iq("Why prefer correlation over covariance for comparing relationships?", "Covariance depends on the units and scales of both variables; correlation divides by both standard deviations, giving a unit-free number in [−1, 1] that can be compared across pairs.", ["Units", "Normalised to [−1, 1]"]),
]);
Card_("pr-var-c1", "Var(aX + b)", "a² Var(X).", B.var);
Card_("pr-var-c2", "Zero correlation", "No linear association; not necessarily independent.", B.var);

pr(B.dist, "Common discrete distributions", "Bernoulli, binomial, geometric, Poisson and hypergeometric: which story fits which.", `
**Bernoulli(p):** one trial, success with probability p. Mean p, variance p(1 − p).

**Binomial(n, p):** number of successes in n independent trials. P(X = k) = C(n, k) pᵏ (1 − p)ⁿ⁻ᵏ. Mean np, variance np(1 − p).

**Geometric(p):** trials until the first success. P(X = k) = (1 − p)ᵏ⁻¹ p. Mean 1/p. Memoryless.

**Poisson(λ):** counts of rare events in a fixed window at a constant rate. P(X = k) = e^(−λ) λᵏ / k!. Mean = variance = λ. Approximates Binomial(n, p) with λ = np when n is large and p small.

**Hypergeometric:** successes when drawing n items **without replacement** from N containing K successes. P(X = x) = C(K, x) C(N − K, n − x) / C(N, n).

**Choosing.** Fixed number of independent trials → binomial. Waiting for the first success → geometric. Counts per time or space with no fixed n → Poisson. Sampling without replacement from a small population → hypergeometric.

**Worked example 1.** 10 fair coin flips, exactly 5 heads: 252/1024 ≈ 0.2461.

**Worked example 2.** 2 calls per minute on average: P(no calls in a minute) = e^(−2) ≈ 0.1353.

**Worked example 3.** First six on the third roll: (5/6)² × 1/6 = 25/216 ≈ 0.1157.

**Worked example 4.** 10 bulbs with 3 faulty, take 2: P(exactly 1 faulty) = 3 × 7 / 45 ≈ 0.4667.
`, [yt("J8jNoF-K8E8", "The binomial distribution, clearly explained", "StatQuest"), yt("oI3hZJqXJuc", "The main ideas behind probability distributions", "StatQuest")], [
  iq("When does the Poisson distribution approximate the binomial?", "When n is large and p is small with np moderate: Binomial(n, p) ≈ Poisson(np). Example: 10,000 transactions each fraudulent with probability 0.0003 → fraud count ≈ Poisson(3).", ["Large n, small p", "λ = np", "Example"]),
  iq("Binomial vs hypergeometric: what's the difference?", "Binomial assumes independent trials with constant p (sampling with replacement or from a huge population). Hypergeometric is sampling without replacement from a finite population, so p changes after each draw. With small samples from large populations they agree closely.", ["Replacement / independence", "Finite population", "When they agree"]),
  iq("Why is the Poisson's variance equal to its mean, and why does that matter?", "It follows from the model of independent rare events at a constant rate. In real count data the variance is often larger (overdispersion), which signals that a Poisson model is too simple, e.g. use negative binomial.", ["Mean = variance = λ", "Overdispersion check"]),
]);
Card_("pr-dist-c1", "Binomial mean and variance", "np and np(1 − p).", B.dist);
Card_("pr-dist-c2", "Poisson", "e^(−λ)λᵏ/k!; mean = variance = λ.", B.dist);

for (const g of B6_ITEMS) {
  Item({
    id: g.id, topic: g.topic, d: g.d, secs: g.secs, prompt: g.prompt,
    ...(g.options ? { options: g.options } : {}),
    answer: g.answer,
    ...(g.tol !== undefined && !g.options ? { tol: g.tol } : {}),
    explain: g.explain, fast: g.fast, trap: g.trap,
    src: g.topic.startsWith("pr-") ? "Practice: generated; answer re-derived by enumerating outcomes or numerical integration in Python (Nov 2026)" : "Practice: generated puzzle; unique solution proven by brute force in Python (Nov 2026)",
    check: { py: g.py },
  });
}
