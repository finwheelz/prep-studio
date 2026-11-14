import { C, N, Q, R, T } from "./build";

const IBX = R("IndiaBIX aptitude", "https://www.indiabix.com/aptitude/questions-and-answers/", "Topic-wise sets; time yourself");
const CAT = R("Previous CAT papers (LRDI, QA)", "https://iim-cat-questions-answers.2iim.com/", "For harder DI and reasoning sets");
const GFGQ = R("GeeksforGeeks aptitude", "https://www.geeksforgeeks.org/aptitude/aptitude-questions-and-answers/", "Formula sheets and solved examples");

T("q-numbers", "aptitude", "Quantitative", "Number system", "Divisibility, HCF and LCM, remainders, unit digits, factors.", `
**Divisibility.** 2: last digit even. 3: digit sum divisible by 3. 4: last two digits. 5: ends in 0 or 5. 6: by 2 and 3. 8: last three digits. 9: digit sum divisible by 9. 11: difference between the sums of alternate digits is 0 or a multiple of 11.

**HCF and LCM.** For two numbers, HCF × LCM = product of the numbers. HCF of fractions = HCF of numerators / LCM of denominators; LCM of fractions = LCM of numerators / HCF of denominators.

- "Largest number that divides a, b, c leaving the same remainder": HCF of the differences.
- "Smallest number that leaves remainder r when divided by a, b, c": LCM(a, b, c) + r.
- Bells or lights that repeat every a, b, c units coincide every LCM.

**Factors.** If N = pᵃ qᵇ rᶜ then the number of factors is (a + 1)(b + 1)(c + 1). Sum of factors = product of (p^(a+1) − 1)/(p − 1). A perfect square has an odd number of factors.

**Unit digit cycles** (period 4 for most): 2 → 2, 4, 8, 6; 3 → 3, 9, 7, 1; 7 → 7, 9, 3, 1; 8 → 8, 4, 2, 6. 4 alternates 4, 6; 9 alternates 9, 1; 0, 1, 5, 6 never change. Reduce the exponent modulo the cycle length.

**Remainders.** Work with remainders of the parts: (a × b) mod n = ((a mod n)(b mod n)) mod n. Example: 2¹⁰ mod 7: 2³ = 8 ≡ 1, so 2¹⁰ = (2³)³ × 2 ≡ 2.

**Trailing zeros of n!** = ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + …

**Useful sums.** 1 + 2 + … + n = n(n + 1)/2. Sum of squares = n(n + 1)(2n + 1)/6. Sum of cubes = [n(n + 1)/2]². Sum of the first n odd numbers = n².

**Primes** under 50: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47. To test N for primality, try primes up to √N.
`, { resources: [IBX, GFGQ] });
N(1, "HCF of 36 and 60?", 12, 0, "36 = 2²·3², 60 = 2²·3·5. Common: 2²·3.");
N(1, "LCM of 12, 15 and 20?", 60, 0, "2²·3·5.");
N(2, "Two numbers have HCF 6 and LCM 180. One is 30. The other?", 36, 0, "6 × 180 / 30.");
N(2, "Unit digit of 7^53?", 7, 0, "Cycle 7, 9, 3, 1 has length 4; 53 mod 4 = 1, so the first: 7.");
N(2, "Number of factors of 360?", 24, 0, "360 = 2³·3²·5 → (3+1)(2+1)(1+1).");
N(2, "Trailing zeros in 100!?", 24, 0, "⌊100/5⌋ + ⌊100/25⌋ = 20 + 4.");
N(2, "Remainder when 2^10 is divided by 7?", 2, 0, "2³ ≡ 1 (mod 7), so 2^10 = (2³)³·2 ≡ 2.");
N(3, "Three bells ring every 12, 18 and 30 minutes. They ring together at 9:00. After how many minutes will they next ring together?", 180, 0, "LCM(12, 18, 30) = 180.");
N(3, "Largest number that divides 43, 91 and 183 leaving the same remainder?", 4, 0, "Differences 48, 92, 140; HCF = 4.");
Q(2, "Which is divisible by 11?", ["4,531", "5,082", "7,345", "9,123"], 1, "5082: (5 + 8) − (0 + 2) = 11, a multiple of 11. The alternating differences for the others are 1, 3 and 7.");
N(1, "Sum of the first 20 natural numbers?", 210, 0, "20 × 21 / 2.");
C("HCF × LCM", "For two numbers, HCF × LCM = product of the numbers.");
C("Number of factors of N = pᵃqᵇrᶜ", "(a + 1)(b + 1)(c + 1)");
C("Unit-digit cycles", "2: 2,4,8,6 · 3: 3,9,7,1 · 7: 7,9,3,1 · 8: 8,4,2,6 · 4: 4,6 · 9: 9,1");
C("Trailing zeros of n!", "⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + …");

T("q-percent", "aptitude", "Quantitative", "Percentages", "Percentage change, successive change, fraction equivalents.", `
Percent means per hundred. x% of y = y% of x.

**Change.** % change = (new − old) / old × 100. An increase of p% multiplies by (1 + p/100); a decrease multiplies by (1 − p/100).

**Successive changes** multiply: +a% then +b% gives a + b + ab/100 overall. +20% then −20% = −4%, not 0. Order does not matter.

**Reverse change.** If A is p% more than B, B is p/(100 + p) × 100% less than A. If a price rises by p%, consumption must fall by p/(100 + p) × 100% to keep spending unchanged. (25% up → 20% down; 20% up → 16.67% down.)

**Fractions to memorise.** 1/2 = 50, 1/3 = 33.33, 1/4 = 25, 1/5 = 20, 1/6 = 16.67, 1/7 = 14.29, 1/8 = 12.5, 1/9 = 11.11, 1/10 = 10, 1/11 = 9.09, 1/12 = 8.33, 1/15 = 6.67, 1/16 = 6.25, 1/20 = 5, 1/25 = 4.

Using them: 37.5% = 3/8, 62.5% = 5/8, 87.5% = 7/8, 16.67% up means × 7/6.

**Percentage points vs percent.** A rate going from 10% to 12% rose 2 percentage points, which is a 20% increase.

**Population / depreciation.** After n periods: P(1 ± r/100)ⁿ.

**Base matters.** "A's income is 25% more than B's" has base B. "What percent of A is B" has base A. Most errors come from using the wrong base.

**Mixture of percentages.** Overall percentage is the weighted average of the group percentages, weighted by group size.
`, { resources: [IBX, GFGQ] });
N(1, "A price rises 20% and then falls 20%. Net change in %?", -4, 0.01, "1.2 × 0.8 = 0.96.");
N(1, "What is 37.5% of 640?", 240, 0, "3/8 of 640.");
N(2, "A's salary is 25% more than B's. By what % is B's less than A's?", 20, 0.01, "25/125.");
N(2, "The price of sugar rises 25%. By what % must consumption fall to keep expenditure the same?", 20, 0.01, "p/(100 + p) = 25/125.");
N(2, "A town of 50,000 grows 10% a year. Population after 2 years?", 60500, 0, "50,000 × 1.1².");
N(2, "Successive discounts of 20% and 10% equal a single discount of what %?", 28, 0.01, "0.8 × 0.9 = 0.72.");
N(2, "In an election between two candidates the winner gets 60% of valid votes and wins by 1,200 votes. Total valid votes?", 6000, 0, "60% − 40% = 20% = 1,200.");
N(3, "A number is increased by 20% and then decreased by 25%. The result is 540. The original number?", 600, 0, "x × 1.2 × 0.75 = 0.9x = 540.");
Q(2, "Conversion rate goes from 4% to 5%. This is…", ["a 1% increase", "a 1 percentage-point and 25% increase", "a 20% increase", "a 5% increase"], 1, "Difference 1 point; relative change 1/4.");
N(3, "A student scores 30% and fails by 12 marks; another scores 40% and gets 8 more than the pass mark. Maximum marks?", 200, 0, "10% of max = 20 marks.");
N(2, "Express 5/8 as a percentage.", 62.5, 0.01, "5 × 12.5.");
C("Successive % change a then b", "a + b + ab/100");
C("A is p% more than B. B is how much less than A?", "p/(100 + p) × 100 %");
C("Percentage point vs percent", "10% → 12% is +2 percentage points, +20 percent.");
C("Fractions: 1/6, 1/7, 1/8, 1/9, 1/11, 1/12", "16.67, 14.29, 12.5, 11.11, 9.09, 8.33 %");

T("q-profit", "aptitude", "Quantitative", "Profit, loss, discount and interest", "Cost and selling price, marked price, simple and compound interest.", `
**Profit and loss** are measured on cost price (CP) unless stated otherwise.

- Profit = SP − CP; profit % = profit / CP × 100. SP = CP × (1 + p/100).
- Loss % = (CP − SP) / CP × 100.
- Selling two items at the same price, one at p% profit and one at p% loss, always gives a net loss of p²/100 %.
- Dishonest dealer using a false weight: gain % = error / (true value − error) × 100.

**Discount** is on the marked price (MP). SP = MP × (1 − d/100). Marking up m% and giving d% discount: net % = m − d − md/100.

**Margin vs markup.** Markup is profit / cost; margin is profit / selling price. A 25% markup is a 20% margin.

**Simple interest.** SI = P × R × T / 100. Amount = P + SI. Interest is the same every year.

**Compound interest.** A = P(1 + r/100)ⁿ. Compounded half-yearly: rate r/2, periods 2n. Quarterly: r/4 and 4n.

- CI − SI for 2 years = P(r/100)².
- CI − SI for 3 years = P(r/100)²(3 + r/100).
- Rule of 72: money doubles in about 72 / r years.
- Effective annual rate for compounding m times a year: (1 + r/m)ᵐ − 1.

**Present value.** PV = FV / (1 + r)ⁿ. Instalments and EMIs equate the present value of payments to the loan.

**Break-even.** Units = fixed cost / (price − variable cost per unit).
`, { resources: [IBX, GFGQ] });
N(1, "An article bought for ₹800 is sold for ₹1,000. Profit %?", 25, 0.01, "200 / 800.");
N(2, "Cost ₹800, marked 25% above cost, sold at a 10% discount. Profit %?", 12.5, 0.01, "MP 1,000, SP 900.");
N(2, "By selling an article for ₹720 a trader loses 10%. At what price should he sell to gain 5%?", 840, 0, "CP = 800; 800 × 1.05.");
N(2, "Two articles are sold at ₹990 each, one at 10% profit and one at 10% loss. Overall loss %?", 1, 0.01, "p²/100 = 1%.");
N(1, "Simple interest on ₹5,000 at 8% for 3 years?", 1200, 0, "5000 × 8 × 3 / 100.");
N(2, "Compound interest on ₹10,000 at 10% for 2 years?", 2100, 0, "10,000 × 1.21 − 10,000.");
N(2, "Difference between CI and SI on ₹8,000 at 5% for 2 years?", 20, 0.01, "P(r/100)² = 8000 × 0.0025.");
N(2, "A sum doubles in 8 years at simple interest. Rate % per year?", 12.5, 0.01, "Interest = P in 8 years: 100/8.");
N(3, "₹10,000 at 8% a year compounded half-yearly for 1 year. Amount?", 10816, 0.5, "10,000 × 1.04².");
N(2, "A shopkeeper marks goods 40% above cost and allows 25% discount. Profit %?", 5, 0.01, "1.4 × 0.75 = 1.05.");
Q(2, "A 25% markup on cost equals what margin on selling price?", ["25%", "20%", "33.3%", "15%"], 1, "Profit 25 on SP 125.");
N(3, "A dealer sells at cost price but uses a 900 g weight for 1 kg. Gain %? (2 decimals)", 11.11, 0.02, "100/900.");
C("CI − SI for 2 years", "P (r/100)²");
C("Same SP, p% profit and p% loss", "Net loss of p²/100 %");
C("Markup m%, discount d%", "Net % = m − d − md/100");
C("Rule of 72", "Doubling time ≈ 72 / rate %");

T("q-ratio", "aptitude", "Quantitative", "Ratio, proportion, mixtures and partnership", "Dividing quantities, alligation, replacement.", `
**Ratio** a : b compares two quantities of the same kind. Multiply or divide both terms by the same number without changing it. If a : b = 2 : 3 and b : c = 4 : 5, make b equal: a : b : c = 8 : 12 : 15.

**Proportion.** a : b = c : d ⇒ ad = bc. Direct proportion: both rise together (x/y constant). Inverse: one rises as the other falls (xy constant).

**Dividing a sum** S in the ratio a : b : c gives S·a/(a + b + c), and so on.

**Partnership.** Profit is shared in the ratio of capital × time.

**Ages.** Set up equations with a single unknown; "n years ago" and "n years hence" change every age by the same amount, so differences stay constant.

**Alligation** finds the ratio in which two ingredients at prices (or concentrations) c (cheaper) and d (dearer) mix to give mean m:

cheaper : dearer = (d − m) : (m − c)

It is the weighted-average formula rearranged, and works for prices, percentages, speeds and averages.

**Mixtures.** Track the amount of one component. Adding pure water changes only the water. To change milk : water from 3 : 1 to 3 : 2 in 40 L: milk stays 30 L, so water must be 20 L, add 10 L.

**Replacement.** A container holds V litres; each time x litres are removed and replaced with water. After n operations the original liquid left is V(1 − x/V)ⁿ.

**Variation.** If y ∝ x then y = kx. Joint variation combines them: work ∝ men × days.
`, { resources: [IBX, GFGQ] });
N(1, "Divide ₹1,200 in the ratio 3 : 5. The larger share?", 750, 0, "1200 × 5/8.");
N(2, "a : b = 2 : 3 and b : c = 4 : 5. If a + b + c = 70, find c.", 30, 0, "a : b : c = 8 : 12 : 15; sum 35 parts = 70; c = 15 × 2.");
N(2, "40 L of milk and water in ratio 3 : 1. How many litres of water must be added to make it 3 : 2?", 10, 0, "Milk 30, water 10 → 20.");
N(2, "In what ratio must rice at ₹40/kg be mixed with rice at ₹60/kg to get a mixture worth ₹48/kg? Give cheaper ÷ dearer as a decimal.", 1.5, 0.01, "(60 − 48) : (48 − 40) = 12 : 8 = 3 : 2.");
N(2, "A invests ₹20,000 for 12 months, B invests ₹30,000 for 8 months. Profit is ₹9,600. A's share?", 4800, 0, "240,000 : 240,000 = 1 : 1.");
N(3, "A 50 L container of milk: 10 L is removed and replaced with water, twice. Milk left (litres)?", 32, 0.01, "50 × (4/5)².");
N(2, "The ages of A and B are in the ratio 4 : 5. Six years hence they will be 5 : 6. A's present age?", 24, 0, "(4x + 6)/(5x + 6) = 5/6 → x = 6.");
N(2, "12 men finish a job in 15 days. How many days for 20 men?", 9, 0, "Men × days constant: 180 / 20.");
N(3, "A 30 L solution is 20% alcohol. How many litres of pure alcohol must be added to make it 40% alcohol?", 10, 0.01, "(6 + x)/(30 + x) = 0.4 → x = 10.");
N(1, "If 5 pens cost ₹60, what do 8 pens cost?", 96, 0, "₹12 each.");
C("Alligation rule", "cheaper : dearer = (d − m) : (m − c)");
C("Replacement formula", "Original liquid left after n operations = V (1 − x/V)ⁿ");
C("Partnership profit share", "In the ratio of capital × time.");

T("q-average", "aptitude", "Quantitative", "Averages and weighted means", "Means, the effect of adding or replacing members, average speed.", `
Average = sum / count, so **sum = average × count**. Most questions are solved by tracking the sum.

- A new member joins and the average of n people rises by d: new value = old average + d × (n + 1).
- One member is replaced and the average rises by d: new − old member = n × d.
- If every value changes by k, the average changes by k; if every value is multiplied by k, so is the average.

**Weighted average** = Σ(wᵢ xᵢ) / Σ wᵢ. Combined average of two groups lies between the group averages, closer to the larger group.

**Consecutive numbers.** The average of an arithmetic sequence is the middle term, or the mean of the first and last.

**Average speed** = total distance / total time, not the mean of the speeds.

- Equal distances at speeds x and y: 2xy / (x + y) (harmonic mean).
- Equal times at speeds x and y: (x + y) / 2.

**Deviation method.** Assume a convenient base and average the deviations: for 48, 52, 55, 45 take base 50, deviations −2, +2, +5, −5 sum to 0, average 50.

**Median and mode.** Median: the middle value after sorting (mean of the two middle values for an even count). Mode: the most frequent value. With outliers the median is the better "typical" figure.

**Mean of grouped data.** Use class midpoints weighted by frequency.
`, { resources: [IBX] });
N(1, "The average of five numbers is 18. Their sum?", 90, 0, "18 × 5.");
N(2, "The average age of 10 students is 15. A teacher joins and the average becomes 16. The teacher's age?", 26, 0, "16 × 11 − 15 × 10.");
N(2, "The average weight of 8 people rises by 2.5 kg when a 65 kg person is replaced. Weight of the new person?", 85, 0, "65 + 8 × 2.5.");
N(2, "Class A: 30 students, average 70. Class B: 20 students, average 80. Combined average?", 74, 0.01, "(2100 + 1600) / 50.");
N(2, "A car travels 120 km at 60 km/h and returns at 40 km/h. Average speed (km/h)?", 48, 0.01, "2 × 60 × 40 / 100.");
N(2, "Average of the first 10 odd numbers?", 10, 0, "Their sum is 10² = 100.");
N(3, "The average of 11 results is 50. The first six average 49 and the last six average 52. The sixth result?", 56, 0, "6 × 49 + 6 × 52 − 11 × 50 = 606 − 550.");
N(2, "A batsman averages 40 over 10 innings. How many runs must he score in the 11th to raise his average to 42?", 62, 0, "42 × 11 − 400.");
N(1, "Median of 7, 3, 9, 5, 11?", 7, 0, "Sorted: 3, 5, 7, 9, 11.");
N(2, "A man walks for 2 hours at 4 km/h and 2 hours at 6 km/h. Average speed (km/h)?", 5, 0.01, "Equal times: arithmetic mean.");
C("Average speed over equal distances", "2xy / (x + y)");
C("New member changes the average of n by d", "New value = old average + d (n + 1)");
C("Replacement changes the average of n by d", "New − old = n × d");

T("q-tsd", "aptitude", "Quantitative", "Time, speed and distance", "Relative speed, trains, boats, races, circular tracks.", `
Distance = speed × time. Convert units first: km/h × 5/18 = m/s; m/s × 18/5 = km/h.

**Proportionality.** For a fixed distance, time is inversely proportional to speed: speeds in ratio a : b mean times in ratio b : a. If speed becomes 4/5 of usual, time becomes 5/4 of usual, i.e. 1/4 more.

**Relative speed.** Opposite directions: add. Same direction: subtract. Time to meet = distance apart / relative speed.

**Trains.** A train crossing a pole or a person covers its own length. Crossing a platform, bridge or another train covers the sum of the lengths, at the relative speed.

**Boats and streams.** Downstream = b + s, upstream = b − s, where b is the speed in still water and s the stream speed. b = (down + up) / 2; s = (down − up) / 2.

**Average speed.** Total distance / total time. Equal distances at x and y: 2xy / (x + y).

**Races.** "A beats B by 20 m in a 100 m race" means when A runs 100, B runs 80: speeds 5 : 4. A head start or a lead in time converts the same way.

**Circular tracks.** Length L. Two runners meet for the first time after L / (relative speed). They are together at the start again after LCM of their individual lap times.

**Late / early.** Travelling at speed a you are t₁ late, at speed b you are t₂ early: distance = ab(t₁ + t₂) / (b − a).

**Clocks.** The minute hand gains 5.5° per minute on the hour hand. Angle at H:M = |30H − 5.5M|. Hands coincide every 65 5/11 minutes; 22 times in 24 hours; they are at right angles 44 times in 24 hours.
`, { resources: [IBX, GFGQ] });
N(1, "Convert 72 km/h to m/s.", 20, 0, "72 × 5/18.");
N(2, "A 150 m train passes a pole in 10 s. How many seconds to cross a 300 m platform?", 30, 0, "Speed 15 m/s; distance 450 m.");
N(2, "Two trains 120 m and 180 m long run in opposite directions at 54 km/h and 36 km/h. Time to cross each other (s)?", 12, 0.01, "Relative speed 90 km/h = 25 m/s; 300/25.");
N(2, "A boat goes 24 km downstream in 2 h and returns in 3 h. Speed of the stream (km/h)?", 2, 0.01, "Down 12, up 8; (12 − 8)/2.");
N(2, "Walking at 4/5 of his usual speed, a man is 10 minutes late. His usual time (minutes)?", 40, 0, "Time becomes 5/4; the extra quarter is 10 min.");
N(2, "A and B start 300 km apart and drive towards each other at 60 and 40 km/h. Hours until they meet?", 3, 0.01, "300 / 100.");
N(3, "In a 100 m race A beats B by 20 m and B beats C by 10 m. By how many metres does A beat C?", 28, 0.01, "When A runs 100, B runs 80, C runs 80 × 0.9 = 72.");
N(2, "Angle between the hands of a clock at 3:15 (degrees)?", 7.5, 0.01, "|90 − 82.5|.");
N(3, "A and B run round a 400 m track in the same direction at 6 m/s and 4 m/s. After how many seconds do they first meet?", 200, 0, "400 / (6 − 4).");
N(3, "At 40 km/h a man reaches 10 minutes late; at 60 km/h he is 10 minutes early. Distance (km)?", 40, 0.01, "d/40 − d/60 = 1/3 h → d = 40.");
N(2, "A man rows 6 km/h in still water; the stream is 2 km/h. Hours to go 16 km upstream?", 4, 0.01, "Upstream speed 4 km/h.");
C("km/h ↔ m/s", "× 5/18 to get m/s; × 18/5 to get km/h.");
C("Boat in still water and stream speed", "b = (down + up)/2; s = (down − up)/2");
C("Clock angle at H:M", "|30H − 5.5M| degrees");
C("Train crossing a platform", "Distance = train length + platform length.");

T("q-work", "aptitude", "Quantitative", "Time and work, pipes and cisterns", "Rates of work, efficiency, wages, filling and emptying.", `
Work in **rates**. If A finishes a job in a days, A's rate is 1/a of the job per day. Rates add.

- A and B together: 1/a + 1/b per day, so time = ab / (a + b).
- A, B and C together: 1 / (1/a + 1/b + 1/c).

**LCM method.** Let the total work be the LCM of the given days, so each rate is a whole number of units. A in 12 days, B in 18: total 36 units, A does 3/day, B does 2/day, together 5/day, 7.2 days.

**Efficiency.** If A is twice as efficient as B, A takes half the time. Ratio of efficiencies is the inverse of the ratio of times.

**Men-days.** M₁ D₁ H₁ / W₁ = M₂ D₂ H₂ / W₂ (men, days, hours per day, work).

**Wages** are shared in the ratio of work done (which equals the ratio of rates when they work the same time).

**Leaving and joining.** Compute the work done in each phase and add to 1.

**Alternate days.** Work out the output of one cycle (two days), find the whole cycles, then handle the remainder day by day.

**Pipes.** Inlets have positive rates, outlets and leaks negative. A tank filled in a hours by one pipe and emptied in b hours by a leak fills in ab / (b − a) hours when both are open.

**Work and negative work** combine the same way: net rate = sum of signed rates.
`, { resources: [IBX] });
N(1, "A does a job in 12 days and B in 18 days. Days working together?", 7.2, 0.01, "1/12 + 1/18 = 5/36.");
N(2, "A and B together finish in 12 days; A alone takes 20 days. Days for B alone?", 30, 0, "1/12 − 1/20 = 1/30.");
N(2, "A is twice as efficient as B and together they finish in 14 days. Days for A alone?", 21, 0, "Rates 2 and 1 units; total 42 units; A needs 21 days.");
N(2, "Pipe A fills a tank in 6 hours; a leak empties it in 12 hours. Hours to fill with both?", 12, 0.01, "1/6 − 1/12 = 1/12.");
N(2, "15 men can do a job in 20 days. How many men are needed to finish it in 12 days?", 25, 0, "300 man-days / 12.");
N(3, "A and B can do a job in 10 and 15 days. They work together for 2 days, then A leaves. How many more days does B need?", 10, 0.01, "Done 2 × 1/6 = 1/3; remaining 2/3 at 1/15 per day.");
N(3, "A and B work on alternate days starting with A. A takes 10 days alone, B takes 15. On which day is the work finished?", 12, 0, "Two-day cycle does 1/6; six cycles = 12 days.");
N(2, "A, B and C can do a job in 10, 12 and 15 days. Days working together?", 4, 0.01, "6 + 5 + 4 = 15 of 60 units a day.");
N(2, "A and B earn ₹900 for a job. A alone takes 10 days, B alone 15. A's share?", 540, 0, "Rates 3 : 2.");
N(3, "Two pipes fill a tank in 20 and 30 minutes. Both are opened, and the first is closed after 5 minutes. Total minutes to fill the tank?", 22.5, 0.01, "In 5 min: 5/12 filled. Remaining 7/12 at 1/30 per min = 17.5 min more.");
C("A and B together", "ab / (a + b) days");
C("LCM method", "Take total work = LCM of the times; rates become whole units per day.");
C("Inlet a hours, leak b hours", "Fills in ab / (b − a) hours.");

T("q-pnc", "aptitude", "Quantitative", "Permutations and combinations", "Counting arrangements and selections.", `
**Fundamental principle.** If one task can be done in m ways and another in n ways: both, m × n ("and"); either, m + n ("or", when exclusive).

**Factorial.** n! = n × (n − 1) × … × 1; 0! = 1.

**Permutations** (order matters): ⁿPᵣ = n! / (n − r)!. Arranging all n distinct objects: n!.

**Combinations** (order does not matter): ⁿCᵣ = n! / (r!(n − r)!). ⁿCᵣ = ⁿCₙ₋ᵣ. ⁿC₀ = ⁿCₙ = 1. Total subsets = 2ⁿ.

**Repeated objects.** Arrangements of n objects with p alike of one kind, q of another: n! / (p! q!). LEVEL: 5! / (2! 2!) = 30.

**Circular arrangements.** n distinct people round a table: (n − 1)!. A necklace or garland (flips count as the same): (n − 1)! / 2.

**Together / not together.** Tie the items that must be together into one block, arrange the blocks, then arrange inside the block. "Not together" = total − together. "No two together": arrange the others first, then place into the gaps.

**With repetition.** r positions each filled from n choices: nʳ.

**Distribution** of n identical items into r distinct boxes: empty boxes allowed, ⁿ⁺ʳ⁻¹Cᵣ₋₁; each box at least one, ⁿ⁻¹Cᵣ₋₁.

**Geometry counts.** Lines from n points (no three collinear): ⁿC₂. Triangles: ⁿC₃. Diagonals of an n-gon: n(n − 3)/2. Handshakes among n people: ⁿC₂.

**Committees.** Choose from each group and multiply: 2 men from 5 and 2 women from 4: ⁵C₂ × ⁴C₂ = 60. "At least one woman" = total − none.
`, { resources: [IBX, GFGQ] });
N(1, "How many ways can 5 different books be arranged on a shelf?", 120, 0, "5!.");
N(1, "Number of ways to choose 3 people from 8?", 56, 0, "8C3.");
N(2, "Distinct arrangements of the letters of LEVEL?", 30, 0, "5!/(2!·2!).");
N(2, "Distinct arrangements of the letters of BANANA?", 60, 0, "6!/(3!·2!).");
N(2, "In how many ways can 6 people sit round a circular table?", 120, 0, "(6 − 1)!.");
N(2, "A committee of 2 men and 2 women is chosen from 5 men and 4 women. Number of ways?", 60, 0, "10 × 6.");
N(3, "In how many ways can 5 people be seated in a row if two particular people must sit together?", 48, 0, "4! × 2!.");
N(3, "In how many ways can 5 people be seated in a row if two particular people must not sit together?", 72, 0, "120 − 48.");
N(2, "Handshakes among 20 people, each pair shaking once?", 190, 0, "20C2.");
N(2, "How many 3-digit numbers can be formed from 1, 2, 3, 4, 5 without repetition?", 60, 0, "5 × 4 × 3.");
N(3, "A committee of 3 is chosen from 4 men and 3 women. In how many ways does it include at least one woman?", 31, 0, "7C3 − 4C3 = 35 − 4.");
N(3, "Number of ways to distribute 5 identical sweets among 3 children, each getting at least one?", 6, 0, "4C2.");
N(2, "Diagonals of a decagon?", 35, 0, "10 × 7 / 2.");
C("nPr and nCr", "nPr = n!/(n − r)!   nCr = n!/(r!(n − r)!)");
C("Circular arrangement of n", "(n − 1)!; necklace (n − 1)!/2");
C("Arrangements with repeats", "n! / (p! q! …)");
C("'At least one' counting", "Total − none.");

T("q-probability", "aptitude", "Quantitative", "Probability", "Classical probability, dice, cards, conditional probability, expectation.", `
P(event) = favourable outcomes / total equally likely outcomes. 0 ≤ P ≤ 1. P(not A) = 1 − P(A).

**Addition.** P(A or B) = P(A) + P(B) − P(A and B). Mutually exclusive: P(A and B) = 0.

**Multiplication.** P(A and B) = P(A) × P(B | A). Independent events: P(A and B) = P(A) P(B).

**Conditional probability.** P(A | B) = P(A and B) / P(B).

**At least one.** 1 − P(none). Three coins, at least one head: 1 − 1/8 = 7/8.

**Coins.** n tosses have 2ⁿ outcomes; exactly r heads: ⁿCᵣ / 2ⁿ.

**Two dice** (36 outcomes). Ways to get each sum: 2 → 1, 3 → 2, 4 → 3, 5 → 4, 6 → 5, 7 → 6, 8 → 5, 9 → 4, 10 → 3, 11 → 2, 12 → 1.

**Cards.** 52 cards, 4 suits of 13. 26 red, 26 black. 12 face cards (J, Q, K), 4 aces. Drawing without replacement changes the denominator each time: two aces = (4/52)(3/51) = 1/221.

**Balls from a bag.** Use combinations: 2 red from a bag of 5 red and 3 blue = ⁵C₂ / ⁸C₂ = 10/28.

**Bayes' theorem.** P(A | B) = P(B | A) P(A) / P(B), with P(B) summed over all the ways B can happen. Disease 1%, test sensitivity 99%, false-positive rate 5%: P(disease | positive) = 0.0099 / (0.0099 + 0.0495) ≈ 16.7%.

**Expected value.** E[X] = Σ x · P(x). A fair die has E = 3.5. Expected number of trials until the first success with probability p is 1/p.

**Odds.** Odds in favour a : b means P = a / (a + b).

**Binomial.** P(exactly r successes in n independent trials) = ⁿCᵣ pʳ (1 − p)ⁿ⁻ʳ.
`, { resources: [IBX, R("Khan Academy: probability", "https://www.khanacademy.org/math/statistics-probability/probability-library", "Exercises with hints")] });
Q(1, "Two fair dice are rolled. P(sum = 8)?", ["1/9", "5/36", "1/6", "7/36"], 1, "(2,6), (3,5), (4,4), (5,3), (6,2).");
Q(1, "Three fair coins. P(at least one head)?", ["1/2", "3/4", "7/8", "1/8"], 2, "1 − P(no heads) = 1 − 1/8.");
N(2, "Two cards are drawn without replacement. P(both aces) = 1/x. Find x.", 221, 0, "(4/52)(3/51).");
N(2, "A bag has 5 red and 3 blue balls. Two are drawn. P(both red)? (3 decimals)", 0.357, 0.002, "10/28.");
N(2, "P(A) = 0.5, P(B) = 0.4, P(A and B) = 0.2. P(A or B)?", 0.7, 0.001, "0.5 + 0.4 − 0.2.");
N(2, "P(A) = 0.5, P(A and B) = 0.2. P(B | A)?", 0.4, 0.001, "0.2 / 0.5.");
N(3, "Disease prevalence 1%, test sensitivity 99%, false-positive rate 5%. P(disease | positive), in %? (1 decimal)", 16.7, 0.1, "0.0099 / (0.0099 + 0.0495).");
N(2, "Expected value of one roll of a fair die?", 3.5, 0.001, "(1 + … + 6) / 6.");
N(2, "A fair coin is tossed 4 times. P(exactly 2 heads)?", 0.375, 0.001, "4C2 / 16 = 6/16.");
N(3, "A and B independently solve a problem with probabilities 1/2 and 1/3. P(the problem is solved)? (3 decimals)", 0.667, 0.002, "1 − (1/2)(2/3).");
Q(2, "A card is drawn from a pack. P(king or heart)?", ["17/52", "4/13", "1/4", "15/52"], 1, "4 + 13 − 1 = 16 of 52 = 4/13.");
N(3, "Expected number of rolls of a fair die until the first six?", 6, 0.001, "1/p.");
Q(3, "Monty Hall: you pick a door, the host opens another showing a goat. Switching wins with probability…", ["1/3", "1/2", "2/3", "3/4"], 2, "Your first pick is right 1/3 of the time; switching wins otherwise.");
N(3, "A family has two children and at least one is a boy. P(both are boys)? (3 decimals)", 0.333, 0.002, "Of BB, BG, GB only one is BB.");
C("P(A or B)", "P(A) + P(B) − P(A and B)");
C("Bayes' theorem", "P(A | B) = P(B | A) P(A) / P(B)");
C("Ways to roll a sum with two dice", "7 has 6 ways; counts fall by one each step away from 7 (6 and 8: 5, 5 and 9: 4, …).");
C("Expected trials to first success", "1/p");

T("q-algebra", "aptitude", "Quantitative", "Algebra, progressions and mensuration", "Equations, AP and GP, logs, areas and volumes.", `
**Linear equations.** Two unknowns need two equations; eliminate or substitute. Word problems: define the unknown, translate each sentence.

**Quadratics.** ax² + bx + c = 0 has roots (−b ± √(b² − 4ac)) / 2a. Sum of roots = −b/a, product = c/a. Discriminant > 0: two real roots; = 0: equal roots; < 0: none.

**Identities.** (a + b)² = a² + 2ab + b². (a − b)² = a² − 2ab + b². a² − b² = (a + b)(a − b). (a + b)³ = a³ + b³ + 3ab(a + b).

**Indices and logs.** aᵐ aⁿ = aᵐ⁺ⁿ; (aᵐ)ⁿ = aᵐⁿ; a⁰ = 1; a⁻ⁿ = 1/aⁿ. log(xy) = log x + log y; log(x/y) = log x − log y; log(xⁿ) = n log x; log_b(b) = 1; change of base log_b(x) = log x / log b.

**Arithmetic progression.** nth term a + (n − 1)d. Sum of n terms n/2 × [2a + (n − 1)d] = n/2 × (first + last).

**Geometric progression.** nth term arⁿ⁻¹. Sum of n terms a(rⁿ − 1)/(r − 1). Infinite sum a/(1 − r) for |r| < 1.

**Inequalities.** Multiplying or dividing by a negative number flips the sign.

**Mensuration, 2-D.** Rectangle: area lb, perimeter 2(l + b). Triangle: ½ × base × height; Heron: √(s(s − a)(s − b)(s − c)); equilateral: (√3/4)a². Circle: area πr², circumference 2πr. Trapezium: ½ (a + b) h.

**3-D.** Cuboid: volume lbh, surface 2(lb + bh + lh). Cube: a³, 6a². Cylinder: πr²h, curved surface 2πrh. Cone: ⅓πr²h, slant √(r² + h²), curved surface πrl. Sphere: (4/3)πr³, surface 4πr².

**Scaling.** If every length is multiplied by k, areas multiply by k² and volumes by k³.

**Pythagorean triples.** 3-4-5, 5-12-13, 8-15-17, 7-24-25 and their multiples.
`, { resources: [IBX, GFGQ] });
N(1, "Solve 3x − 7 = 11.", 6, 0, "3x = 18.");
N(2, "The sum of two numbers is 25 and their difference is 7. The larger number?", 16, 0, "(25 + 7)/2.");
N(2, "10th term of the AP 3, 7, 11, …?", 39, 0, "3 + 9 × 4.");
N(2, "Sum of the first 20 terms of the AP 5, 8, 11, …?", 670, 0, "20/2 × (10 + 57).");
N(2, "Sum to infinity of 8 + 4 + 2 + 1 + …?", 16, 0.001, "a/(1 − r) = 8/0.5.");
N(2, "Product of the roots of x² − 7x + 12 = 0?", 12, 0, "c/a.");
N(2, "If log₁₀ 2 = 0.3010, find log₁₀ 8. (3 decimals)", 0.903, 0.001, "3 × 0.3010.");
N(2, "Area of a triangle with sides 3, 4 and 5?", 6, 0.001, "Right-angled: ½ × 3 × 4.");
N(2, "The radius of a circle is doubled. By what factor does its area grow?", 4, 0, "Area scales with r².");
N(3, "A cube's edge is increased by 50%. Percentage increase in volume?", 237.5, 0.01, "1.5³ = 3.375.");
N(2, "Volume of a cylinder with radius 7 and height 10 (use π = 22/7)?", 1540, 0.5, "22/7 × 49 × 10.");
N(3, "5th term of the GP 2, 6, 18, …?", 162, 0, "2 × 3⁴.");
C("AP: nth term and sum", "a + (n − 1)d;  n/2 [2a + (n − 1)d]");
C("GP: nth term, sum, infinite sum", "arⁿ⁻¹;  a(rⁿ − 1)/(r − 1);  a/(1 − r)");
C("Roots of ax² + bx + c", "Sum −b/a, product c/a");
C("Scaling lengths by k", "Areas × k², volumes × k³");
