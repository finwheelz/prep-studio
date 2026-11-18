/**
 * P2 · Batch 1: arithmetic (8 concepts), clocks and calendars (1), number systems (3).
 * Practice items come from src/data/gen/quant.ts; every one carries a Python check that
 * scripts/verify-items.mts runs in Pyodide.
 */
import { QUANT_ITEMS, QUANT_TOPICS as Q } from "@/data/gen/quant";
import type { InterviewQ, Resource } from "@/lib/types";
import { Card_, Item, R, T } from "./build";

const yt = (id: string, title: string) => R(`Video: ${title} (CareerRide)`, `https://www.youtube.com/watch?v=${id}`, "Watch first: the method with solved examples");
const bix = (slug: string, title: string) => R(`IndiaBIX: ${title}`, `https://www.indiabix.com/aptitude/${slug}/`, "Free OA-style practice with solutions");
const iq = (q: string, answer: string, rubric: string[]): InterviewQ => ({ q, answer, rubric });
const topic = (id: string, module: string, title: string, summary: string, notes: string, resources: Resource[], interview: InterviewQ[]) =>
  T(id, "aptitude", module, title, summary, notes, { resources, interview });

// ───────────────────────── Percentages ─────────────────────────
topic(Q.pct, "Arithmetic", "Percentages", "The base of every arithmetic chapter: percentage change, successive change, reverse percentages and base switching.", `
**Percent means per hundred.** x% of y = xy/100. Every percentage is "of" something: the **base**. Most errors come from using the wrong base.

**Percentage change** = (new − old) / old × 100. The base is always the old value.

**Successive changes.** A change of a% followed by b% gives a net change of **a + b + ab/100** (decreases negative). +20% then −20% is −4%, not 0.

**Reverse percentages.** If a value after an x% increase is N, the original is N / (1 + x/100). Never subtract x% of N.

**Switching the base.** If A is x% more than B, then B is **x/(100 + x) × 100 %** less than A. If A is x% less than B, B is x/(100 − x) × 100 % more than A.

**Price, consumption, spend.** Spend = price × quantity. If the price rises x%, quantity must fall x/(100 + x) × 100 % to keep spend the same.

**Fractions to memorise.** 1/2 = 50%, 1/3 = 33.33%, 1/4 = 25%, 1/5 = 20%, 1/6 = 16.67%, 1/7 ≈ 14.29%, 1/8 = 12.5%, 1/9 ≈ 11.11%, 1/11 ≈ 9.09%, 1/12 ≈ 8.33%. Most OA percentages are one of these.

**Worked example 1.** A price rises 20% and then falls 20%. Net = 20 − 20 + (20)(−20)/100 = −4%. Check with 100 → 120 → 96.

**Worked example 2.** A earns 25% more than B. By how much is B below A? 25/125 = 1/5 = 20%.

**Worked example 3.** Petrol goes up 25%. By how much must consumption fall to keep spending the same? 25/125 = 20%.

**Worked example 4.** After a 15% discount a jacket costs ₹1,700. Original = 1,700 / 0.85 = ₹2,000.
`, [yt("RWdNhJWwzSs", "Percentage shortcuts"), bix("percentage", "percentage")], [
  iq("Why is a 20% rise followed by a 20% fall not a net change of zero?", "The second change is applied to a different base. After +20%, 100 becomes 120; 20% of 120 is 24, so it falls to 96: a net −4%. In general the net change is a + b + ab/100, and the ab/100 term is the change on the change.", ["Identifies that the base changes after the first step", "Gives the a + b + ab/100 formula or a numeric check", "Gets −4%"]),
  iq("If A is 25% more than B, by what percentage is B less than A? Explain the general rule.", "20%. The difference is 25 on a base of 125 (A), not 100. In general, x% more becomes x/(100 + x) × 100 % less.", ["Answers 20%", "Explains the base switch from B to A", "States the general x/(100 + x) rule"]),
  iq("How do you get the original price from a price after a percentage change?", "Divide by the multiplier: original = new / (1 ± x/100). Subtracting x% of the new price uses the new price as the base, which is wrong.", ["Divides by the multiplier", "Explains why subtracting x% of the new value fails"]),
]);
Card_("p2-pct-c1", "Net of successive changes a% and b%", "a + b + ab/100 (decreases negative).");
Card_("p2-pct-c2", "A is x% more than B: B is how much less than A?", "x / (100 + x) × 100 %.");
Card_("p2-pct-c3", "Reverse percentage", "Original = new ÷ (1 ± x/100).");

// ───────────────────────── Profit, loss, discount ─────────────────────────
topic(Q.pld, "Arithmetic", "Profit, loss and discount", "Cost price, marked price, selling price: profit is on cost, discount is on the marked price.", `
**Three prices.** Cost price (CP), marked price (MP), selling price (SP).

- Profit % = (SP − CP) / CP × 100. **Profit and loss are always on CP.**
- Discount % = (MP − SP) / MP × 100. **Discount is always on MP.**

**Mark-up and discount together.** Take CP = 100. Mark up x%: MP = 100 + x. Discount y%: SP = (100 + x)(1 − y/100). Profit % = SP − 100.

**Successive discounts** d1 and d2 = a single discount of d1 + d2 − d1d2/100.

**Recovering CP.** SP after a loss of l% → CP = SP × 100/(100 − l). Then any target price follows from CP.

**False weights.** Selling w grams as 1 kg at cost price: gain % = (1000 − w)/w × 100. The base is what is actually given, w.

**Same SP, equal % profit and loss.** Selling two items at the same price, one at x% profit and one at x% loss, always gives an overall **loss of x²/100 %**.

**Worked example 1.** CP ₹800, SP ₹920. Profit = 120/800 = 15%.

**Worked example 2.** Marked 40% above cost, then 25% off: 1.4 × 0.75 = 1.05, a 5% profit.

**Worked example 3.** Sold at ₹450 for a 10% loss. CP = 450 / 0.9 = 500. For a 20% profit sell at 600.

**Worked example 4.** Two phones each sold for ₹1,200, one at 20% profit, one at 20% loss. CPs are 1,000 and 1,500; total CP 2,500, total SP 2,400: a loss of 100, which is 4% = 20²/100.
`, [yt("T2odvmxqi1I", "Profit and loss"), yt("FW97hRrHcSw", "Discount"), bix("profit-and-loss", "profit and loss")], [
  iq("A shop marks goods 30% above cost and offers 20% off. Is it making a profit? Show how you would check quickly.", "Yes, 4%. Take CP = 100: MP = 130, SP = 130 × 0.8 = 104. The discount is on the marked price, so it is smaller in rupees than the mark-up.", ["Uses CP = 100", "Applies the discount to MP", "Gets a 4% profit"]),
  iq("Two items are sold at the same price, one at 25% profit and one at 25% loss. What is the overall result and why?", "A loss of 6.25% (25²/100). The item sold at a loss had the higher cost price, so the loss in rupees is larger than the profit in rupees.", ["States an overall loss", "Gives x²/100 = 6.25%", "Explains that the loss item had a higher CP"]),
  iq("Why is a 20% then 10% discount not the same as 30% off?", "The second discount applies to the reduced price: 0.8 × 0.9 = 0.72, so 28% off. The single equivalent is d1 + d2 − d1d2/100.", ["Applies discounts multiplicatively", "Gets 28%", "States the equivalent-discount formula"]),
]);
Card_("p2-pld-c1", "Profit is on …, discount is on …", "Profit and loss on CP; discount on MP.");
Card_("p2-pld-c2", "Same SP, x% profit on one item and x% loss on the other", "Overall loss of x²/100 %.");
Card_("p2-pld-c3", "False weight w g sold as 1 kg at cost", "Gain % = (1000 − w)/w × 100.");

// ───────────────────────── Interest ─────────────────────────
topic(Q.int, "Arithmetic", "Simple and compound interest", "Interest on the principal only, or interest on interest. The difference grows with time.", `
**Simple interest.** SI = P × R × T / 100. The interest is the same every year.

**Compound interest.** A = P(1 + R/100)^T, CI = A − P. Each year's interest is on the previous year's amount.

**Other compounding periods.** Half-yearly: rate R/2, periods 2T. Quarterly: R/4 and 4T.

**CI − SI.** For 2 years: P(R/100)². For 3 years: P(R/100)²(3 + R/100).

**Doubling at SI.** A sum doubles when SI = P, so in 100/R years. It becomes k times in (k − 1) × 100/R years.

**Doubling at CI.** Rule of 72: about 72/R years.

**The 10% ladder.** 1.1, 1.21, 1.331, 1.4641. Many OA questions use 10% or 20% for this reason.

**Worked example 1.** SI on ₹12,000 at 8% for 3 years = 12,000 × 8 × 3 / 100 = ₹2,880.

**Worked example 2.** CI on ₹10,000 at 10% for 2 years: 10,000 × 1.21 = 12,100, so CI = ₹2,100.

**Worked example 3.** CI − SI on ₹5,000 at 6% for 2 years = 5,000 × 0.06² = ₹18.

**Worked example 4.** ₹8,000 at 10% per annum compounded half-yearly for 1 year: 5% for 2 periods, 8,000 × 1.05² = 8,820, so CI = ₹820.
`, [yt("jvRq87ZWzIk", "Simple interest"), yt("PbUZnzncmR4", "Compound interest"), bix("compound-interest", "compound interest")], [
  iq("Why is the 2-year difference between CI and SI equal to P(R/100)²?", "In year 1 both earn P × R/100. In year 2, CI also earns interest on the first year's interest: (P × R/100) × R/100 = P(R/100)². That interest on interest is the whole difference.", ["Says year-1 interest is identical", "Identifies interest on interest in year 2", "Derives P(R/100)²"]),
  iq("A sum doubles in 8 years at simple interest. When does it become four times itself?", "In 24 years. Doubling means interest equal to P in 8 years; four times needs interest of 3P, which takes 3 × 8 years. At compound interest it would be 16 years.", ["Gets 24 years", "Explains (k − 1) × doubling time", "Contrasts with compounding"]),
  iq("How does half-yearly compounding change the calculation?", "Halve the rate and double the number of periods: A = P(1 + R/200)^(2T). It gives slightly more than annual compounding at the same nominal rate.", ["Halves the rate", "Doubles the periods", "Notes it yields more than annual"]),
]);
Card_("p2-int-c1", "CI − SI for 2 years", "P(R/100)².");
Card_("p2-int-c2", "SI: time to become k times", "(k − 1) × 100/R years.");
Card_("p2-int-c3", "Half-yearly compounding", "Rate R/2, periods 2T.");

// ───────────────────────── Ratio, partnership ─────────────────────────
topic(Q.ratio, "Arithmetic", "Ratio, proportion and partnership", "Parts of a whole, chained ratios, proportions, ages, and profit sharing by capital × time.", `
**Ratio as parts.** In a : b : c, one part = total / (a + b + c).

**Chaining ratios.** A : B = 2 : 3 and B : C = 4 : 5: make B equal (12) → A : B : C = 8 : 12 : 15.

**Proportion.** a : b = c : d means ad = bc. The fourth proportional to a, b, c is bc/a. The mean proportional of a and b is √(ab).

**Ages.** Write present ages as ak and bk. After t years both increase by t, so the ratio changes. Set up (ak + t)/(bk + t) = c/d and solve for k.

**Partnership.** Profit is shared in the ratio of **capital × time**. A partner who joins after j months has money in for 12 − j months.

**Worked example 1.** A : B = 2 : 3, B : C = 4 : 5 → 8 : 12 : 15.

**Worked example 2.** Divide ₹2,100 in the ratio 2 : 3 : 2. One part = 300; shares 600, 900, 600.

**Worked example 3.** A invests ₹30,000 for 12 months, B ₹45,000 for 8 months. 3,60,000 : 3,60,000 = 1 : 1, so they share equally.

**Worked example 4.** Ages 5 : 3 now, 7 : 5 in 6 years. (5k + 6)/(3k + 6) = 7/5 → 25k + 30 = 21k + 42 → k = 3. Ages 15 and 9.
`, [yt("jfoJBivWlnQ", "Ratio and proportion"), yt("hn9TKnr8L_8", "Partnership"), bix("ratio-and-proportion", "ratio and proportion")], [
  iq("How do you combine A : B = 2 : 3 and B : C = 4 : 5 into one ratio?", "Make the common term equal using the LCM of its two values (3 and 4 → 12): A : B = 8 : 12 and B : C = 12 : 15, so A : B : C = 8 : 12 : 15.", ["Equalises B with an LCM", "Scales both ratios correctly", "Gets 8 : 12 : 15"]),
  iq("In a partnership, why does time matter as well as capital?", "Profit is a return on money used over time, so each partner's claim is capital × months. ₹1 lakh for 6 months contributes the same as ₹50,000 for 12 months.", ["States capital × time", "Gives an example of equivalence"]),
  iq("Why can't you add the same number of years to the ratio terms in an age problem?", "The ratio terms are not ages; they are multiples of an unknown k. Adding t to the ages gives (ak + t) : (bk + t), which only equals (a + t) : (b + t) if k = 1.", ["Separates ratio terms from actual ages", "Writes the ages as ak and bk", "Explains when the shortcut fails"]),
]);
Card_("p2-ratio-c1", "Fourth proportional to a, b, c", "bc / a.");
Card_("p2-ratio-c2", "Partnership profit ratio", "Capital × time (months).");
Card_("p2-ratio-c3", "Chaining A:B and B:C", "Make B equal with an LCM, then read A:B:C.");

// ───────────────────────── Mixtures ─────────────────────────
topic(Q.mix, "Arithmetic", "Mixtures and alligation", "Weighted averages in disguise: alligation, adding one component, and repeated replacement.", `
**A mixture is a weighted average.** Mean price = (q1p1 + q2p2)/(q1 + q2).

**Alligation.** To mix a cheaper item (c) with a dearer one (d) for a mean price m:

$$\\text{cheaper} : \\text{dearer} = (d - m) : (m - c)$$

Write c and d on top, m in the middle, and subtract diagonally.

**Adding one component.** When water is added, the milk stays fixed. Solve for the new water using the milk: new water = milk × (new water share / new milk share).

**Repeated replacement.** From V litres of pure liquid, remove x litres and refill with water, n times:

$$\\text{pure left} = V\\left(1 - \\frac{x}{V}\\right)^n$$

**Concentrations.** Add up the pure component across the parts, divide by the total.

**Worked example 1.** Rice at ₹40 and ₹60 mixed to sell at ₹52: (60 − 52) : (52 − 40) = 8 : 12 = 2 : 3.

**Worked example 2.** 60 L of milk and water in the ratio 3 : 1 (45 L milk, 15 L water). For 3 : 2, water must be 30 L: add 15 L.

**Worked example 3.** 40 L of milk; 4 L removed and replaced with water, twice. Milk left = 40 × 0.9² = 32.4 L.

**Worked example 4.** 10 L of 20% acid + 30 L of 40% acid = (2 + 12)/40 = 35%.
`, [yt("OKSJDDAyqP0", "Mixture and alligation"), bix("alligation-or-mixture", "alligation or mixture")], [
  iq("Explain the alligation rule and why it works.", "If c and d are mixed in quantities q1 and q2 to give mean m, then q1(m − c) = q2(d − m): the cheaper part's gain equals the dearer part's loss relative to the mean. So q1 : q2 = (d − m) : (m − c).", ["States the ratio correctly", "Derives it from a balance of deviations", "Notes the cross-over (each quantity pairs with the other's difference)"]),
  iq("Why can't you subtract x litres of milk each time in a replacement problem?", "After the first refill the container is part water, so each later draw removes milk in proportion to its current share. The milk fraction is multiplied by (1 − x/V) each round, giving V(1 − x/V)^n.", ["Recognises later draws are mixed", "Explains the multiplicative factor", "Writes V(1 − x/V)^n"]),
  iq("How would you check an alligation answer quickly?", "Plug the ratio back: (q1 × c + q2 × d)/(q1 + q2) should equal m. For 2 : 3 of ₹40 and ₹60: (80 + 180)/5 = 52.", ["Recomputes the weighted average", "Uses a concrete check"]),
]);
Card_("p2-mix-c1", "Alligation", "Cheaper : dearer = (dearer − mean) : (mean − cheaper).");
Card_("p2-mix-c2", "Repeated replacement", "Pure left = V(1 − x/V)^n.");
Card_("p2-mix-c3", "Adding water to a mixture", "Milk is unchanged; solve for water from the milk.");

// ───────────────────────── Averages ─────────────────────────
topic(Q.avg, "Arithmetic", "Averages", "Think in totals: average × count, and how a total changes when items join or leave.", `
**Work with totals.** Total = average × count. Almost every averages question becomes easy once you convert to totals.

**Change in average.** If one item joins and the average of n + 1 items rises by k over the old average A, the new item = A + k(n + 1).

**Replacement.** If one member of a group of n is replaced and the average rises by k, the newcomer is k × n more than the person who left.

**Consecutive numbers.** The average of consecutive (or evenly spaced) numbers is the middle one, or the mean of the two middle ones.

**Weighted average.** (n1a1 + n2a2)/(n1 + n2). It always lies between a1 and a2, closer to the larger group.

**Assumed mean.** Pick a convenient value, average the deviations, add back. Saves arithmetic with large numbers.

**Worked example 1.** The average of 6 numbers is 40; removing one makes the average 38. Removed = 240 − 190 = 50.

**Worked example 2.** A batter averages 42 after 15 innings and wants 45. Needed = 45 × 16 − 42 × 15 = 720 − 630 = 90 (or 42 + 3 × 16).

**Worked example 3.** In a group of 8, a 60-kg person is replaced and the average rises 1.5 kg. The newcomer weighs 60 + 8 × 1.5 = 72 kg.

**Worked example 4.** 20 students average 70 and 30 average 80. Combined = (1,400 + 2,400)/50 = 76.
`, [yt("rhSxQ4ieAYc", "Averages"), bix("average", "average")], [
  iq("A team's average age is 25. A 30-year-old leaves and a new player joins; the average drops by 0.5 for a team of 11. How old is the new player?", "24.5. The total falls by 0.5 × 11 = 5.5, so the newcomer is 5.5 years younger than the 30-year-old.", ["Converts the change in average to a change in total", "Gets 5.5 years younger", "Answers 24.5"]),
  iq("Why can't you average two class averages to get the overall average?", "Only if the classes are the same size. Otherwise the larger class has more weight: combined = (n1a1 + n2a2)/(n1 + n2).", ["Says it only works for equal sizes", "Gives the weighted formula"]),
  iq("What is the fastest way to find the average of 5 consecutive even numbers whose sum you know?", "Divide by 5 to get the middle number; the others are that ±2 and ±4.", ["Uses the middle-value property", "Steps by 2 for even numbers"]),
]);
Card_("p2-avg-c1", "New item that raises an average of n items by k", "Old average + k(n + 1).");
Card_("p2-avg-c2", "Replacement raises the group average by k", "Newcomer = person who left + k × n.");
Card_("p2-avg-c3", "Average of consecutive numbers", "The middle term.");

// ───────────────────────── Time and work ─────────────────────────
topic(Q.work, "Arithmetic", "Time and work, pipes and cisterns", "Rates add. Convert everything to work per day (or per hour), or to units of a common total.", `
**Rates add, times don't.** If A takes a days, A's rate is 1/a of the job per day. Together A and B do 1/a + 1/b per day, so they take ab/(a + b) days.

**The LCM method.** Let the job be LCM(a, b) units. A does LCM/a units per day, B does LCM/b. Everything stays in whole numbers.

**Efficiency.** If A is twice as efficient as B, A takes half as long.

**Man-days.** M1 × D1 × H1 / W1 = M2 × D2 × H2 / W2 (men, days, hours per day, work).

**Pipes and cisterns.** Inlets add to the rate, outlets (leaks) subtract. A tank filled in a hours with a leak that empties it in b hours fills in ab/(b − a) hours.

**Wages** are split in proportion to the work done, not the days worked.

**Worked example 1.** A takes 12 days, B 18. Total = 36 units; A does 3 per day, B 2; together 5 per day, so 36/5 = 7.2 days.

**Worked example 2.** A and B together take 10 days; A alone takes 15. B's rate = 1/10 − 1/15 = 1/30: B alone takes 30 days.

**Worked example 3.** A pipe fills a tank in 6 hours; a leak empties it in 12. Net 1/6 − 1/12 = 1/12: 12 hours.

**Worked example 4.** 12 men finish a job in 10 days. 8 men take 12 × 10 / 8 = 15 days.
`, [yt("KE7tQf9spPg", "Time and work"), yt("mBtBD1N7ywQ", "Pipes and cisterns"), bix("time-and-work", "time and work")], [
  iq("Why do you add rates rather than times when two people work together?", "Time is not additive: two people do not take a + b days together. Each contributes a fraction of the job per day, and those fractions add: 1/a + 1/b. Inverting the total rate gives the time.", ["Explains that rates add", "Inverts the combined rate", "Gives ab/(a + b)"]),
  iq("Explain the LCM method for time-and-work problems.", "Assume the job has LCM(a, b, …) units, so each person's daily output is a whole number. Then all the arithmetic is in integers, which is faster and less error-prone than fractions.", ["Sets total work = LCM", "Derives per-day units", "States why it is faster"]),
  iq("A tank has an inlet that fills it in 4 hours and an outlet that empties it in 6 hours. If both are open, does it fill, and how long does it take?", "Yes: net rate 1/4 − 1/6 = 1/12 per hour, so 12 hours. If the outlet were faster than the inlet, the tank would never fill.", ["Subtracts the outlet rate", "Gets 12 hours", "Notes the case where it never fills"]),
]);
Card_("p2-work-c1", "A in a days, B in b days: together", "ab / (a + b) days.");
Card_("p2-work-c2", "Fill in a hours, leak empties in b hours", "ab / (b − a) hours (b > a).");
Card_("p2-work-c3", "Man-days rule", "M1D1H1/W1 = M2D2H2/W2.");

// ───────────────────────── Speed, distance, time ─────────────────────────
topic(Q.sdt, "Arithmetic", "Speed, distance and time", "Relative speed, trains, boats and streams, races and circular tracks.", `
**Distance = speed × time.** Convert km/h to m/s by multiplying by 5/18; m/s to km/h by 18/5.

**Average speed** is total distance / total time. For equal distances at u and v: **2uv/(u + v)**, never (u + v)/2.

**Relative speed.** Moving towards each other: add the speeds. Same direction: subtract.

**Trains.** To pass a pole or a person, the train covers its own length. To pass a platform or another train, it covers the sum of the lengths.

**Boats and streams.** Boat speed u in still water, stream s: downstream u + s, upstream u − s. So u = (down + up)/2, s = (down − up)/2.

**Races.** "A beats B by x m in a d-m race" means B has run d − x when A finishes: their speeds are in the ratio d : (d − x).

**Circular tracks.** Track length L, speeds a and b. Opposite directions: first meet after L/(a + b). Same direction: L/|a − b|. Both back at the start together: LCM of the two lap times.

**Worked example 1.** 60 km/h out, 40 km/h back: 2 × 60 × 40 / 100 = 48 km/h.

**Worked example 2.** A 200-m train at 72 km/h (20 m/s) passes a 300-m platform in 500/20 = 25 s.

**Worked example 3.** Downstream 18 km/h, upstream 12: boat 15 km/h, stream 3 km/h.

**Worked example 4.** On a 600-m track, runners at 5 m/s and 7 m/s meet first after 600/12 = 50 s running in opposite directions, or 600/2 = 300 s in the same direction.
`, [yt("jzNxXm5twx4", "Speed, distance and time"), yt("78b4Jn4rw44", "Problems on trains"), yt("-EdJ4kAW-j4", "Boats and streams")], [
  iq("Why is the average speed for a round trip at 60 and 40 km/h not 50 km/h?", "You spend more time at the slower speed, so it gets more weight. For equal distances the average is the harmonic mean, 2uv/(u + v) = 48 km/h.", ["Explains the unequal time spent", "Uses total distance over total time", "Gets 48"]),
  iq("What distance does a train cover when it crosses another train coming the other way?", "The sum of both lengths, at the sum of the speeds. In the same direction it is still the sum of the lengths, but at the difference of the speeds.", ["Sum of the lengths", "Correct relative speed for each direction"]),
  iq("Two runners start together on a circular track in the same direction. When do they first meet?", "When the faster one has gained one full lap: L / (a − b). In opposite directions they meet when they have covered one lap between them: L / (a + b).", ["Same direction: L/(a − b)", "Opposite: L/(a + b)", "Explains as gaining a lap"]),
]);
Card_("p2-sdt-c1", "Average speed, equal distances", "2uv / (u + v).");
Card_("p2-sdt-c2", "km/h to m/s", "× 5/18.");
Card_("p2-sdt-c3", "Stream speed from downstream and upstream", "(down − up) / 2.");

// ───────────────────────── Clocks and calendars ─────────────────────────
topic(Q.clock, "Clocks and calendars", "Clocks and calendars", "Hand angles and meeting times; odd days and the day of the week for any date.", `
**Clock hands.** The minute hand moves 6° per minute; the hour hand 0.5° per minute. The minute hand gains **5.5° per minute**.

**Angle at H:M** = |30H − 5.5M|. If it is more than 180°, subtract it from 360° for the smaller angle.

**Coinciding hands.** They coincide every 720/11 = 65 5/11 minutes, so 11 times in 12 hours and 22 times a day. Between H and H + 1 they meet 60H/11 minutes past H. They are at right angles 44 times a day and opposite 22 times a day.

**Calendars: odd days.** Days left over after whole weeks.

- Ordinary year: 1 odd day. Leap year: 2.
- 100 years: 5 odd days; 200 years: 3; 300 years: 1; 400 years: 0.
- Months: 31 days → 3 odd days, 30 → 2, February 0 (or 1 in a leap year).
- Odd days mod 7, counted from 0 = Sunday: 1 Monday, 2 Tuesday … 6 Saturday.

**Leap years.** Divisible by 4, except century years, which must be divisible by 400. 1900 was not a leap year; 2000 was.

**Worked example 1.** At 3:40: |90 − 220| = 130°.

**Worked example 2.** Between 4 and 5 the hands meet 240/11 = 21 9/11 minutes past 4.

**Worked example 3.** 15 August 1947. 1600 years → 0 odd days. 1601–1900 (300 years) → 1. 1901–1946 has 11 leap years and 35 ordinary: 57 → 1. January to July 1947: 3 + 0 + 3 + 2 + 3 + 2 + 3 = 16 → 2. Plus 15 days → 1. Total 0 + 1 + 1 + 2 + 1 = 5: Friday.

**Worked example 4.** 1 January 2025 was a Wednesday. 2025 is not a leap year (1 odd day), so 1 January 2026 is a Thursday.
`, [R("Video: Clocks (CareerRide)", "https://www.youtube.com/watch?v=edEvlh0tqzk", "Hand angles and meeting times"), R("Video: Calendar (CareerRide)", "https://www.youtube.com/watch?v=oxc4G14nyUY", "Odd days method"), bix("calendar", "calendar")], [
  iq("Derive the formula for the angle between the clock hands at H:M.", "At H:M the hour hand is at 30H + 0.5M degrees from 12 and the minute hand at 6M. The difference is |30H − 5.5M|; take 360° minus that if it exceeds 180°.", ["Hour hand 30H + 0.5M", "Minute hand 6M", "Takes the smaller angle"]),
  iq("How many times do the hands coincide in a day, and why not 24?", "22. The minute hand laps the hour hand every 720/11 minutes, which is 11 times in 12 hours. The meeting near 12 is shared between consecutive 12-hour periods rather than happening twice.", ["Says 22", "Uses 720/11 minutes", "Explains the 11-per-12-hours count"]),
  iq("Why does 1 century contribute 5 odd days?", "100 years have 24 leap years (the century year itself is not leap unless divisible by 400) and 76 ordinary: 24 × 2 + 76 = 124 odd days, and 124 mod 7 = 5.", ["Counts 24 leap years", "Computes 124", "Reduces mod 7 to 5"]),
]);
Card_("p2-clock-c1", "Angle between hands at H:M", "|30H − 5.5M|; use 360 − that if over 180.");
Card_("p2-clock-c2", "Odd days per century", "100 y: 5, 200 y: 3, 300 y: 1, 400 y: 0.");
Card_("p2-clock-c3", "Hands coincide between H and H + 1", "60H/11 minutes past H.");

// ───────────────────────── Divisibility, HCF, LCM ─────────────────────────
topic(Q.div, "Number systems", "Divisibility, factors, HCF and LCM", "Divisibility rules, counting factors, and the HCF and LCM word problems that OAs reuse.", `
**Divisibility rules.**

- 2, 5, 10: last digit. 4: last two digits. 8: last three digits.
- 3 and 9: digit sum divisible by 3 or 9.
- 11: alternating digit sum (from the right) divisible by 11.
- 7: double the last digit and subtract it from the rest; repeat.
- 6 = 2 and 3; 12 = 3 and 4; 15 = 3 and 5.

**Number of factors.** If N = p^a × q^b × r^c, N has (a + 1)(b + 1)(c + 1) factors.

**HCF and LCM.** HCF = product of the common primes at their lowest powers; LCM = all primes at their highest powers. For two numbers, **HCF × LCM = product**.

**Word-problem patterns.**

- "Largest tile / largest measure / largest group size" → HCF.
- "Bells ring together / least number divisible by all" → LCM.
- Same remainder r with every divisor → LCM + r.
- Remainders that are each divisor minus k (e.g. 4, 5, 6 for 5, 6, 7) → LCM − k.
- Greatest number leaving the same remainder → HCF of the differences.

**Worked example 1.** Is 918,273 divisible by 11? From the right: 3 − 7 + 2 − 8 + 1 − 9 = −18, not a multiple of 11. No.

**Worked example 2.** 360 = 2³ × 3² × 5 has 4 × 3 × 2 = 24 factors.

**Worked example 3.** Bells ring every 6, 8 and 12 minutes. They ring together again after LCM = 24 minutes.

**Worked example 4.** Greatest number dividing 1305, 4665 and 6905 with the same remainder: differences 3360, 2240, 5600 have HCF 1120.
`, [yt("xyyejJYeILM", "HCF and LCM"), yt("vsBpWgNYjtQ", "Problems on numbers"), bix("problems-on-hcf-and-lcm", "HCF and LCM")], [
  iq("Why is the number of factors of p^a q^b equal to (a + 1)(b + 1)?", "Every factor is p^i q^j with 0 ≤ i ≤ a and 0 ≤ j ≤ b. There are a + 1 choices for i and b + 1 for j, independently.", ["Describes a factor as a choice of exponents", "Counts a + 1 and b + 1 choices including zero", "Multiplies them"]),
  iq("Why does the greatest number leaving the same remainder equal the HCF of the differences?", "If x and y leave the same remainder on division by d, then d divides x − y. So d divides every pairwise difference, and the greatest such d is their HCF.", ["Same remainder means d divides the difference", "Applies it to all pairs", "Takes the HCF"]),
  iq("How do you recognise whether a word problem needs the HCF or the LCM?", "Splitting things into the largest equal pieces or groups is HCF. Finding when repeating events next coincide, or the smallest number that several numbers divide, is LCM.", ["HCF for largest equal division", "LCM for coinciding cycles / smallest common multiple"]),
]);
Card_("p2-div-c1", "Number of factors of p^a q^b r^c", "(a + 1)(b + 1)(c + 1).");
Card_("p2-div-c2", "Greatest number leaving the same remainder", "HCF of the pairwise differences.");
Card_("p2-div-c3", "Least number leaving remainder r with each divisor", "LCM + r.");

// ───────────────────────── Remainders, cyclicity ─────────────────────────
topic(Q.rem, "Number systems", "Remainders, cyclicity and unit digits", "Work with remainders instead of whole numbers; powers repeat in short cycles.", `
**Remainder arithmetic.** The remainder of a sum or product equals the remainder of the sum or product of the remainders. So reduce first, then multiply.

**Negative remainders** save work: 99 ≡ −1 (mod 100), so 99^odd ≡ −1 ≡ 99.

**Unit digit cycles.**

- 2: 2, 4, 8, 6 · 3: 3, 9, 7, 1 · 7: 7, 9, 3, 1 · 8: 8, 4, 2, 6 (period 4)
- 4: 4, 6 · 9: 9, 1 (period 2)
- 0, 1, 5, 6: always the same

Use the exponent mod 4, with a remainder of 0 meaning the 4th term.

**Powers mod m.**

- Find a small power that is ±1 mod m, then reduce the exponent.
- Fermat: if m is prime and does not divide a, a^(m−1) ≡ 1 (mod m).
- (m + 1)^n ≡ 1 and (m − 1)^n ≡ (−1)^n (mod m).

**Chained divisors.** If d2 divides d1, the remainder by d2 is (the remainder by d1) mod d2.

**Worked example 1.** Unit digit of 7^95: 95 mod 4 = 3, the third term of 7, 9, 3, 1 → 3.

**Worked example 2.** 2^100 mod 7: 2³ = 8 ≡ 1, and 100 = 3 × 33 + 1, so 2^100 ≡ 2.

**Worked example 3.** 1234 × 5678 mod 9: digit sums give remainders 1 and 8 → 8.

**Worked example 4.** A number leaves 29 when divided by 56. Since 8 divides 56, the remainder by 8 is 29 mod 8 = 5.
`, [R("Video: finding remainders (Feel Free to Learn)", "https://www.youtube.com/watch?v=NCjD9MdgPWw", "Remainder methods with worked questions"), R("Video: unit digits (Jobs & Careers)", "https://www.youtube.com/watch?v=81pwuMJ8OIU", "Cyclicity in 6 minutes"), bix("numbers", "numbers")], [
  iq("Why can you replace numbers by their remainders before multiplying?", "Write a = mq1 + r1 and b = mq2 + r2. Then ab = m(…) + r1r2, so ab and r1r2 leave the same remainder mod m.", ["Writes each number as a multiple of m plus a remainder", "Shows the cross terms are multiples of m", "Concludes ab ≡ r1r2"]),
  iq("How do you find the unit digit of 3^2026?", "Unit digits of powers of 3 cycle 3, 9, 7, 1. 2026 mod 4 = 2, so the unit digit is 9.", ["Uses the cycle of 3", "Reduces the exponent mod 4", "Gets 9"]),
  iq("What does Fermat's little theorem say, and how does it help with remainders?", "For a prime p not dividing a, a^(p−1) ≡ 1 (mod p). So you can reduce the exponent mod p − 1: 3^100 mod 7 = 3^(100 mod 6) = 3^4 = 81 ≡ 4.", ["States the theorem with its condition", "Reduces the exponent mod p − 1", "Gives a worked example"]),
]);
Card_("p2-rem-c1", "Unit digit cycle of 7", "7, 9, 3, 1 (period 4).");
Card_("p2-rem-c2", "Fermat's little theorem", "p prime, p ∤ a: a^(p−1) ≡ 1 (mod p).");
Card_("p2-rem-c3", "Remainder of a product", "Product of the remainders, reduced again.");

// ───────────────────────── Factorials ─────────────────────────
topic(Q.fact, "Number systems", "Factorials and powers", "Trailing zeros, the highest power of a prime or composite in n!, and remainders of factorial sums.", `
**Legendre's formula.** The power of a prime p in n! is

$$\\left\\lfloor \\frac{n}{p} \\right\\rfloor + \\left\\lfloor \\frac{n}{p^2} \\right\\rfloor + \\left\\lfloor \\frac{n}{p^3} \\right\\rfloor + \\dots$$

**Trailing zeros** of n! = the power of 5 (there are always more 2s than 5s).

**Composite divisors.** For 12 = 2² × 3: find the power of 2 and of 3 in n!, divide each by its exponent in 12 (2 and 1), and take the smaller result.

**Factorial sums mod m.** Once k! is divisible by m, every later term is too. For m = 12, 4! = 24 is already divisible, so 1! + 2! + … + n! ≡ 1 + 2 + 6 = 9 for any n ≥ 3.

**Wilson's theorem.** For a prime p, (p − 1)! ≡ −1 (mod p).

**Worked example 1.** Trailing zeros of 100!: 20 + 4 = 24.

**Worked example 2.** Power of 2 in 50!: 25 + 12 + 6 + 3 + 1 = 47.

**Worked example 3.** Power of 12 in 50!: the power of 2 is 47, giving 23 copies of 2²; the power of 3 is 16 + 5 + 1 = 22. The smaller, 22, is the answer.

**Worked example 4.** 16! mod 17: by Wilson, −1 ≡ 16.
`, [R("Video: highest power and trailing zeros (Rodha)", "https://www.youtube.com/watch?v=mmj4QW5p8Bc", "Legendre's formula and composites"), R("Video: trailing zeros in a factorial (Neso Academy)", "https://www.youtube.com/watch?v=zpvDctj8mM4", "Short and clear")], [
  iq("Why does counting factors of 5 give the number of trailing zeros of n!?", "Each trailing zero needs a factor of 10 = 2 × 5. n! has far more 2s than 5s, so the number of 5s is the limit. Multiples of 25, 125 … contribute extra 5s, which is why the formula adds ⌊n/25⌋, ⌊n/125⌋ and so on.", ["Links zeros to factors of 10", "Notes 2s are plentiful", "Explains the higher powers of 5"]),
  iq("How do you find the highest power of 18 that divides 60!?", "18 = 2 × 3². Power of 2 in 60! is 56; power of 3 is 20 + 6 + 2 = 28, giving 14 copies of 3². The answer is min(56, 14) = 14.", ["Factorises 18", "Applies Legendre to each prime", "Divides by the exponents and takes the minimum"]),
  iq("What is the remainder when 1! + 2! + … + 50! is divided by 5?", "3. From 5! onwards every term is a multiple of 5, so only 1 + 2 + 6 + 24 = 33 matters, and 33 mod 5 = 3.", ["Notes terms from 5! vanish", "Adds the first four", "Gets 3"]),
]);
Card_("p2-fact-c1", "Trailing zeros of n!", "⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + …");
Card_("p2-fact-c2", "Highest power of a composite in n!", "Each prime's Legendre count ÷ its exponent; take the minimum.");
Card_("p2-fact-c3", "Wilson's theorem", "(p − 1)! ≡ −1 (mod p) for prime p.");

// ───────────────────────── Generated practice (verified) ─────────────────────────
for (const g of QUANT_ITEMS) {
  Item({
    id: g.id,
    topic: g.topic,
    d: g.d,
    secs: g.secs,
    prompt: g.prompt,
    ...(g.options ? { options: g.options } : {}),
    answer: g.answer,
    ...(g.tol !== undefined && !g.options ? { tol: g.tol } : {}),
    explain: g.explain,
    fast: g.fast,
    trap: g.trap,
    src: "Practice: generated from a standard OA pattern, answer recomputed in Python (Nov 2026)",
    check: { py: g.py },
  });
}
