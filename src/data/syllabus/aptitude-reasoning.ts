import { C, N, Q, R, T } from "./build";

const IBR = R("IndiaBIX logical reasoning", "https://www.indiabix.com/logical-reasoning/questions-and-answers/", "Timed topic sets");
const CAT = R("2IIM: CAT LRDI sets", "https://iim-cat-questions-answers.2iim.com/", "Harder arrangement and DI sets");
const GFP = R("GeeksforGeeks: top 100 puzzles", "https://www.geeksforgeeks.org/aptitude/top-100-puzzles-asked-in-interviews/", "The bank most interview puzzles come from");

T("lr-series", "aptitude", "Logical reasoning", "Series, analogies, coding-decoding", "Number and letter patterns, odd one out, coded messages.", `
**Number series.** Check, in this order:

1. Differences between terms (constant → AP; differences that themselves form a pattern → second-level series).
2. Ratios (constant → GP; ×2 + 1, ×3 − 1 mixed patterns).
3. Squares, cubes and their neighbours: n², n² ± 1, n³, n(n + 1).
4. Alternating series: odd and even positions follow separate rules.
5. Primes, Fibonacci-style sums (each term = sum of the previous two), factorials.

Examples: 2, 6, 12, 20, 30 → n(n + 1) → 42. 1, 4, 9, 16 → squares. 3, 5, 9, 17, 33 → ×2 − 1 → 65. 2, 3, 5, 7, 11 → primes → 13.

**Letter series.** Convert letters to positions (A = 1 … Z = 26). Handy anchors: E = 5, J = 10, O = 15, T = 20, Y = 25. Opposite letters sum to 27 (A–Z, B–Y, M–N).

**Analogies.** State the relationship in a sentence ("a doctor works in a hospital") and apply the same sentence to the options. Common relations: part–whole, tool–user, cause–effect, synonym, degree, category–member.

**Odd one out.** Find the property shared by all but one: prime vs composite, square vs non-square, vowels, category.

**Coding-decoding.**

- Letter shift: each letter moved by a fixed or changing number of places (Caesar).
- Reversal or position swap.
- Opposite letters (A ↔ Z).
- Number codes: sum or product of letter positions.
- Substitution by sentence comparison: find the word common to two coded sentences.

Write the alphabet with positions on scratch paper once; it pays for itself.
`, { resources: [IBR] });
N(1, "Next term: 2, 6, 12, 20, 30, ?", 42, 0, "n(n + 1): 6 × 7.");
N(2, "Next term: 3, 5, 9, 17, 33, ?", 65, 0, "Each term ×2 − 1 (or differences double: 2, 4, 8, 16, 32).");
N(2, "Next term: 1, 1, 2, 3, 5, 8, 13, ?", 21, 0, "Fibonacci: sum of the previous two.");
N(2, "Next term: 4, 9, 25, 49, 121, ?", 169, 0, "Squares of primes: 2, 3, 5, 7, 11, 13.");
N(2, "Find the missing term: 5, 11, 23, 47, ?, 191", 95, 0, "×2 + 1.");
N(3, "Next term: 2, 5, 10, 17, 26, ?", 37, 0, "n² + 1.");
N(3, "Next term: 1, 2, 6, 24, 120, ?", 720, 0, "Factorials.");
Q(2, "If CAT is coded as DBU, how is DOG coded?", ["EPH", "CNF", "EPG", "FQI"], 0, "Each letter shifts forward by one.");
N(2, "If each letter stands for its position (A = 1), what is the value of DOG (sum)?", 26, 0, "4 + 15 + 7.");
Q(2, "Odd one out: 16, 25, 36, 48, 64", ["16", "25", "48", "64"], 2, "The others are perfect squares.");
Q(2, "Book is to Author as Painting is to…", ["Canvas", "Artist", "Museum", "Colour"], 1, "Creator relationship.");
Q(3, "In a code, 'sky is blue' is 'pa ta na' and 'blue is calm' is 'na ta ro'. The code for 'sky' is…", ["pa", "ta", "na", "ro"], 0, "'is' and 'blue' are common (ta, na); the remaining word is pa.");
Q(2, "Which letter is opposite to F in the alphabet (A ↔ Z pairing)?", ["T", "U", "V", "W"], 1, "Positions sum to 27: 27 − 6 = 21 = U.");
C("Series checklist", "Differences → ratios → squares/cubes → alternating → primes/Fibonacci/factorials.");
C("Letter position anchors", "E5 J10 O15 T20 Y25; opposite letters sum to 27.");

T("lr-arrangement", "aptitude", "Logical reasoning", "Arrangements, rankings and scheduling puzzles", "Linear and circular seating, ranks, constraint puzzles.", `
**Method for any arrangement set.**

1. Draw the frame first: numbered seats in a row, a circle, a table of people × attributes.
2. Place the definite clues ("A is at the left end", "B sits third from the right").
3. Use relative clues to build blocks ("C is immediately left of D" → the block CD).
4. Where a clue allows two positions, draw both cases and continue; one usually dies quickly.
5. Use negative clues ("E is not next to F") to eliminate cases.
6. Only then read the questions.

**Linear.** Fix a direction. If people face north, their left is the reader's left; facing south it is reversed.

**Circular.** Facing the centre: a person's right is anticlockwise and left is clockwise. Facing outward it is the opposite. Position is relative, so fix one person to start.

**Ranking.**

- Total = rank from top + rank from bottom − 1.
- People between two persons = total − (rank of one from the left + rank of the other from the right), when positions do not overlap.
- If A is 7th from the left and B is 9th from the right, and they swap so that A becomes 12th from the left, the total = 12 + 9 − 1 = 20.

**Comparison chains.** Turn statements into inequalities: A > B, B > C. Only comparisons along a chain are certain.

**Scheduling / distribution puzzles** (who does what on which day): a grid with ticks and crosses. Every tick in a row or column crosses out the rest of that row and column.

**Floors and boxes.** Number from the bottom unless told otherwise. "Immediately above" means adjacent; "above" does not.

**Time discipline.** A set of 4–5 questions on one arrangement is worth doing only if the frame is clear within a couple of minutes. Otherwise skip and return.
`, { resources: [IBR, CAT] });
N(1, "Ravi is 12th from the top and 19th from the bottom of a class. How many students are in the class?", 30, 0, "12 + 19 − 1.");
N(2, "In a row of 40, A is 14th from the left. What is A's position from the right?", 27, 0, "40 − 14 + 1.");
N(3, "A is 10th from the left and B is 12th from the right. They swap; A is now 18th from the left. How many people are in the row?", 29, 0, "A now stands in B's old place: 18 + 12 − 1.");
Q(2, "Five people sit in a row. B is to the immediate right of A, C is at the left end, D is between B and E. Who is in the middle?", ["A", "B", "D", "E"], 1, "Order: C, A, B, D, E. Middle seat is B.");
Q(2, "A is taller than B, C is shorter than B, D is taller than A. Who is the shortest?", ["A", "B", "C", "D"], 2, "D > A > B > C.");
Q(2, "Six people sit round a table facing the centre. Who is to the immediate right of a person is found by moving…", ["clockwise", "anticlockwise", "across", "it cannot be known"], 1, "Facing the centre, your right is anticlockwise.");
Q(3, "P, Q, R, S sit round a table facing the centre. Q is to the immediate right of P; S is opposite Q. Who is to the immediate left of P?", ["Q", "R", "S", "Cannot be determined"], 2, "Opposite Q is the seat two away, which is P's left: S.");
N(2, "In a row, there are 8 people between A and B. A is 15th from the left, B is 20th from the right, and A is left of B. Total people?", 43, 0, "B is 24th from the left; 24 + 20 − 1.");
Q(2, "P scored more than Q but less than R. S scored less than Q. Who is second highest?", ["P", "Q", "R", "S"], 0, "R > P > Q > S.");
C("Rank formula", "Total = rank from top + rank from bottom − 1");
C("Circular seating, facing centre", "Right = anticlockwise, left = clockwise.");
C("Arrangement method", "Frame → definite clues → blocks → cases → eliminate → answer.");

T("lr-deduction", "aptitude", "Logical reasoning", "Syllogisms, blood relations, directions, data sufficiency", "Deductive logic and the standard verbal-reasoning question types.", `
**Syllogisms.** Draw Venn diagrams and check whether the conclusion holds in every possible diagram.

- "All A are B": A inside B. Does not mean all B are A.
- "Some A are B": the circles overlap. Also means some B are A.
- "No A is B": separate circles.
- "Some A are not B": part of A lies outside B.

Rules of thumb: All + All → All. All A are B, No B is C → No A is C. Some + anything rarely gives a definite "all". Two "some" statements give no definite conclusion. "All A are B; some B are C" does not give "some A are C".

**Either–or.** When two conclusions cannot both be false (for example "some A are C" and "no A is C") and neither follows alone, "either I or II follows".

**Blood relations.** Draw a family tree: generations on separate lines, a symbol for gender, a double line for marriage. Translate from the end of the sentence backwards: "the son of my father's only sister" → father's sister → her son → cousin. Paternal = father's side; maternal = mother's side. Do not assume gender from a name.

**Directions.** Draw the compass (N up, E right). Right turns are clockwise. Track the net east–west and north–south displacement; the straight-line distance is √(x² + y²). At sunrise the sun is in the east, so a shadow falls to the west; at sunset the reverse.

**Data sufficiency.** You are asked whether the statements are enough, not to solve. Test statement I alone, II alone, then together. Options usually: I alone, II alone, both together, either alone, neither. A "yes/no" question is answered by a definite yes or a definite no.

**Statement–assumption / conclusion.** An assumption is something unstated that must be true for the statement to make sense. A conclusion must follow from the statement alone, without outside knowledge. Strengthen/weaken: find the gap between evidence and claim.

**Coded inequalities.** Combine statements into one chain; a conclusion holds only if the signs along the path all point the same way (≥ and > mix to give >; > and < break the chain).
`, { resources: [IBR] });
Q(1, "All roses are flowers. All flowers are plants. Conclusion: All roses are plants.", ["Follows", "Does not follow", "Cannot say", "Only sometimes"], 0, "All + All → All.");
Q(2, "All A are B. Some B are C. Conclusion: Some A are C.", ["Follows", "Does not follow", "Follows only if all B are A", "Either follows"], 1, "The B that are C may lie outside A.");
Q(2, "No cat is a dog. All dogs are animals. Conclusion: No cat is an animal.", ["Follows", "Does not follow", "Cannot say", "Follows partly"], 1, "Cats may still be animals; the statements only separate cats from dogs.");
Q(2, "Pointing to a photograph, a man says, 'She is the daughter of my grandfather's only son.' How is the girl related to him?", ["Mother", "Sister", "Aunt", "Cousin"], 1, "Grandfather's only son is his father; the father's daughter is his sister.");
Q(2, "A is B's sister. C is B's mother. D is C's father. How is A related to D?", ["Daughter", "Granddaughter", "Niece", "Grandmother"], 1, "A is C's daughter; D is C's father.");
N(2, "A man walks 3 km north, then 4 km east. How far is he from the start (km)?", 5, 0.001, "3-4-5 triangle.");
Q(2, "A man facing north turns right, then right again, then left. He now faces…", ["North", "East", "South", "West"], 1, "North → east → south → east.");
N(3, "A person walks 10 m south, turns left and walks 6 m, turns left and walks 10 m, then turns right and walks 4 m. Distance from the start (m)?", 10, 0.001, "South 10, east 6, north 10 (back level), east 4: 10 m east.");
Q(3, "Is x > y? (I) x² > y². (II) x and y are both positive.", ["I alone is sufficient", "II alone is sufficient", "Both together are sufficient", "Not sufficient even together"], 2, "I alone fails for negatives; II alone says nothing; together x > y.");
Q(2, "Statement: 'Use brand X for whiter teeth.' Which is an assumption?", ["Brand X is the cheapest", "People want whiter teeth", "All toothpastes are the same", "Brand X is new"], 1, "The advertisement only makes sense if whiter teeth are desired.");
Q(3, "At sunrise a man stands facing a pole and his shadow falls to his right. Which direction is he facing?", ["North", "South", "East", "West"], 1, "At sunrise shadows fall west. If west is on his right, he faces south.");
C("'All A are B; some B are C'", "No definite conclusion about A and C.");
C("Data sufficiency routine", "I alone → II alone → together. You judge sufficiency, not the answer.");
C("Shadow rule", "Morning: shadows fall west. Evening: shadows fall east.");
C("Blood relation method", "Draw the tree; read the sentence from the end backwards.");

T("di-basics", "aptitude", "Data interpretation", "Tables, charts and caselets", "Growth rates, shares, ratios and fast approximation.", `
Data interpretation rewards speed with arithmetic, not difficult mathematics.

**Before calculating.** Read the title, units (₹ lakh vs ₹ crore, thousands), the axes and any footnotes. Check whether the chart shows absolute values or percentages.

**Core calculations.**

- Percentage change = (new − old) / old × 100.
- Share = part / total × 100.
- Percentage-point difference between two shares is a subtraction, not a ratio.
- Average annual growth (simple) = total % change / years. CAGR = (end / start)^(1/n) − 1.
- Ratio comparison: cross-multiply instead of dividing. Is 37/52 > 41/58? Compare 37 × 58 = 2146 with 41 × 52 = 2132, so yes.

**Chart types.**

- Table: exact values; most calculation-heavy.
- Bar / column: compare heights; stacked bars show components.
- Line: trend and slope; the steepest segment is the largest absolute change, not necessarily the largest % change.
- Pie: shares of one total. A sector's value = (angle / 360) × total, or share % × total. 1% = 3.6°.
- Combination: two series, sometimes on two axes. Read each axis carefully.

**Approximation.** Round to two significant figures when options are far apart. Use fraction equivalents (12.5% = 1/8, 16.67% = 1/6, 37.5% = 3/8). For "which is highest" questions eliminate obvious losers before computing.

**Caselets** (data in a paragraph): convert to a table first. Two-way tables (gender × department) and Venn diagrams (people who like A, B, both) appear often. For two sets: |A ∪ B| = |A| + |B| − |A ∩ B|. For three sets add back the triple overlap.

**Typical traps.** Largest increase vs largest percentage increase. Percent of a different base. Missing years on an axis. Cumulative vs per-period figures.
`, { resources: [R("IndiaBIX data interpretation", "https://www.indiabix.com/data-interpretation/questions-and-answers/", "Table, bar, pie and line sets"), CAT] });
N(1, "Sales were 120 in 2023 and 150 in 2024. Percentage growth?", 25, 0.01, "30 / 120.");
Q(2, "Quarterly revenue: Q1 120, Q2 150, Q3 135, Q4 180. Which quarter had the highest quarter-on-quarter growth?", ["Q2", "Q3", "Q4", "Q2 and Q4 equal"], 2, "Q2 +25%, Q3 −10%, Q4 +33.3%.");
N(2, "A pie chart of a ₹720 crore budget shows Education at 90°. Education budget (₹ crore)?", 180, 0, "90/360 × 720.");
N(2, "A sector occupies 15% of a pie chart. Its central angle (degrees)?", 54, 0, "15 × 3.6.");
N(2, "Company revenue grew from ₹200 crore to ₹288 crore in 2 years. CAGR in %?", 20, 0.01, "√(288/200) = 1.2.");
N(2, "Of 200 students, 120 like cricket, 90 like football and 40 like both. How many like neither?", 30, 0, "200 − (120 + 90 − 40).");
Q(2, "Product A rose from 50 to 80; product B rose from 200 to 260. Which statement is true?", ["A had the larger absolute and percentage increase", "B had the larger absolute increase; A the larger percentage increase", "B had the larger percentage increase", "Both grew by the same percentage"], 1, "A: +30 (60%). B: +60 (30%).");
N(3, "Department headcounts: Sales 240, Tech 360, Ops 200. Women are 25% of Sales, 40% of Tech and 30% of Ops. Percentage of women overall? (1 decimal)", 33, 0.1, "60 + 144 + 60 = 264 of 800.");
N(2, "A market share rises from 12% to 15%. Increase in percentage points?", 3, 0, "15 − 12. As a percentage it is 25%.");
N(3, "Exports were 80, 100, 90, 120, 150 over five years. In how many years did exports grow by more than 20% over the previous year?", 3, 0, "100/80 = +25% yes; 90 no; 120/90 = +33% yes; 150/120 = +25% yes.");
Q(2, "Which fraction is larger: 37/52 or 41/58?", ["37/52", "41/58", "They are equal", "Cannot say"], 0, "37 × 58 = 2146 > 41 × 52 = 2132.");
C("CAGR", "(end / start)^(1/n) − 1");
C("Pie chart conversion", "1% = 3.6°; value = angle/360 × total.");
C("Compare a/b and c/d quickly", "Cross-multiply: compare a·d with c·b.");
C("Two-set formula", "|A ∪ B| = |A| + |B| − |A ∩ B|");

T("verbal", "aptitude", "Verbal", "Verbal ability: grammar, reading and vocabulary", "Error spotting, sentence correction, reading comprehension, para jumbles.", `
**Subject–verb agreement.** The verb agrees with the true subject, not the nearest noun: "The list of items *is* long." "Each", "every", "either", "neither", "one of" take a singular verb. "A number of" is plural; "the number of" is singular. With "either … or" and "neither … nor" the verb agrees with the nearer subject.

**Tenses.** Keep tense consistent. Present perfect ("has worked") connects past to now; simple past needs a finished time ("worked in 2022"). Past perfect ("had left") is for the earlier of two past events. "Since" takes a point in time, "for" a duration.

**Pronouns.** A pronoun must have one clear antecedent and match it in number. "Between you and *me*" (object after a preposition). "Who" for subjects, "whom" for objects.

**Modifiers.** Place a modifier next to what it describes. "Walking down the road, the tree fell" is a dangling modifier.

**Parallelism.** Items in a list or comparison take the same form: "to read, to write and to speak", not "to read, writing and speak".

**Prepositions and idioms.** Different *from*, comply *with*, capable *of*, prefer X *to* Y, between two / among many, fewer (countable) / less (uncountable), "not only … but also".

**Articles.** "A" before consonant sounds, "an" before vowel sounds (an hour, a university). "The" for something specific or already mentioned.

**Commonly confused.** affect (verb) / effect (noun); its / it's; their / there / they're; principal / principle; complement / compliment; lose / loose; then / than.

**Reading comprehension.** Read the questions first, then the passage for structure: the main claim, the support, the tone. Answer from the passage only. Eliminate options that are too extreme ("always", "never"), out of scope, or true but not asked. For inference questions the right answer is the smallest step beyond the text.

**Para jumbles.** Find the opening sentence (introduces the topic, no pronoun without an antecedent), then mandatory pairs (pronoun–noun, cause–effect, "however" contrasts, chronological markers), then the closing sentence.

**Vocabulary in context.** Use the sentence's logic: contrast words (but, although) signal an opposite; continuation words (and, moreover) signal a similar meaning.

Some companies also score listening and speaking: answer in complete, short sentences.
`, { resources: [R("IndiaBIX verbal ability", "https://www.indiabix.com/verbal-ability/questions-and-answers/", "Error spotting, sentence correction, RC"), R("Purdue OWL grammar", "https://owl.purdue.edu/owl/general_writing/grammar/index.html", "Short reference pages")] });
Q(1, "Choose the correct sentence.", ["The list of items are long.", "The list of items is long.", "The list of item are long.", "The lists of items is long."], 1, "The subject is 'list' (singular).");
Q(1, "Each of the students ___ submitted the form.", ["have", "has", "are", "were"], 1, "'Each' takes a singular verb.");
Q(2, "Neither the manager nor the employees ___ aware of the change.", ["was", "were", "is", "has been"], 1, "With neither … nor the verb agrees with the nearer subject, 'employees'.");
Q(2, "She has been working here ___ 2021.", ["for", "since", "from", "by"], 1, "'Since' with a point in time; 'for' with a duration.");
Q(2, "Find the error: 'He is one of the best player in the team.'", ["He is", "one of", "the best player", "in the team"], 2, "'One of' is followed by a plural noun: players.");
Q(2, "Choose the correct option: 'The new policy will ___ all employees.'", ["effect", "affect", "effects", "affection"], 1, "Affect is the verb; effect is usually the noun.");
Q(2, "Which sentence is parallel?", ["She likes reading, to swim and cycling.", "She likes reading, swimming and cycling.", "She likes to read, swimming and to cycle.", "She likes read, swim and cycling."], 1, "All three items are gerunds.");
Q(2, "Between you and ___, this plan will not work.", ["I", "me", "myself", "mine"], 1, "Object of the preposition 'between'.");
Q(2, "'A number of students ___ absent today.'", ["is", "are", "was", "has"], 1, "'A number of' is plural; 'the number of' is singular.");
Q(3, "In a reading-comprehension inference question, the best answer is usually the one that…", ["uses the strongest language", "is the smallest logical step from what the passage states", "adds outside knowledge", "repeats the first sentence"], 1, "Avoid extreme or out-of-scope options.");
Q(2, "Choose the correct sentence.", ["There are less people today.", "There are fewer people today.", "There is fewer people today.", "There is less peoples today."], 1, "'Fewer' with countable nouns.");
Q(2, "In a para jumble, the opening sentence usually…", ["begins with 'however'", "introduces the topic without depending on an earlier sentence", "contains 'they' or 'this'", "is the longest"], 1, "Sentences with unexplained pronouns or connectors cannot open.");
C("Singular triggers", "each, every, either, neither, one of, the number of → singular verb.");
C("since vs for", "since + point in time; for + duration.");
C("fewer vs less", "fewer: countable; less: uncountable.");
C("RC elimination", "Drop options that are extreme, out of scope, or true but not asked.");

T("puzzles", "aptitude", "Puzzles", "Classic interview puzzles", "The puzzle bank interviewers draw from, with the reasoning.", `
Puzzles test calm, structured reasoning. Narrate: restate, try a small case, look for the invariant.

**Weighing.**
- 8 identical balls, one heavier, a balance scale: 2 weighings. Split 3-3-2; weigh 3 against 3.
- 9 balls, one heavier: 2 weighings (3-3-3).
- 12 coins, one odd (heavier or lighter unknown): 3 weighings.
- In general n weighings distinguish 3ⁿ possibilities.

**Measuring.**
- 3 L and 5 L jugs, measure 4 L: fill 5, pour into 3 (2 left), empty 3, pour the 2 in, fill 5, top up the 3 (uses 1), leaving 4.
- Two ropes that each burn in 60 minutes unevenly, measure 45: light rope A at both ends and rope B at one end; when A is gone (30 min) light B's other end (15 more).
- Hourglasses of 4 and 7 minutes, measure 9: start both; at 4 flip the 4; at 7 flip the 7; at 8 flip the 7 again (it has run 1 minute), it empties at 9.

**Crossing.** Four people take 1, 2, 5, 10 minutes to cross a bridge, two at a time with one torch: 17 minutes. 1 and 2 cross (2), 1 returns (1), 5 and 10 cross (10), 2 returns (2), 1 and 2 cross (2).

**Search and worst case.**
- 25 horses, 5 tracks, no timer, find the top 3: 7 races.
- 2 eggs, 100 floors: 14 drops (drop at 14, 27, 39, …).
- 1,000 bottles, one poisoned, result in 24 h: 10 testers (binary labels).

**Probability and logic.**
- Monty Hall: switch, win 2/3.
- Birthday problem: 23 people give about a 50.7% chance of a shared birthday.
- Three switches outside, three bulbs inside, one entry: turn switch 1 on for a few minutes, switch it off, turn 2 on, enter. Lit = 2, warm = 1, cold = 3.
- 100 doors toggled on passes 1 to 100: the 10 perfect-square doors stay open.
- Bat and ball cost ₹110, the bat costs ₹100 more: the ball is ₹5.

**Counting and geometry.**
- Squares on a chessboard: 1² + 2² + … + 8² = 204. Rectangles: ⁹C₂ × ⁹C₂ = 1,296.
- Cut a cake into 8 equal pieces with 3 cuts: two vertical cuts at right angles and one horizontal.
- Ant on a unit cube, shortest surface path between opposite corners: √5.
- Handshakes among n people: n(n − 1)/2.

**Expected value.** Expected tosses of a fair coin to get the first head: 2. To get two heads in a row: 6. To see all six faces of a die: 14.7.

**Averages.** Drive out at 60 and back at 40: average speed 48, not 50.
`, { resources: [GFP, R("Brainstellar", "https://brainstellar.com/", "Puzzles graded by difficulty, popular for quant and analyst interviews")] });
N(1, "8 identical-looking balls, one heavier. Minimum weighings on a balance to always find it?", 2, 0, "Split 3-3-2.");
N(2, "25 horses, 5 tracks, no stopwatch. Minimum races to find the fastest 3?", 7, 0, "5 heats, a race of winners, then one more among the 5 remaining candidates.");
N(2, "Four people need 1, 2, 5 and 10 minutes to cross a bridge, two at a time with one torch. Minimum total time (minutes)?", 17, 0, "Send the two slowest together.");
N(2, "2 eggs and 100 floors. Fewest drops that always finds the critical floor?", 14, 0, "14 + 13 + … + 1 = 105 ≥ 100.");
N(2, "1,000 bottles, one poisoned; the poison shows after 24 hours. Fewest testers to identify it in 24 hours?", 10, 0, "2¹⁰ = 1,024 binary labels.");
N(2, "100 doors, 100 passes; pass k toggles every k-th door. How many doors are open at the end?", 10, 0, "Perfect squares have an odd number of divisors.");
N(1, "A bat and ball cost ₹110. The bat costs ₹100 more than the ball. Price of the ball (₹)?", 5, 0, "b + b + 100 = 110.");
N(2, "How many squares of all sizes are on a chessboard?", 204, 0, "Σ k² for k = 1..8.");
N(3, "Expected number of fair-coin tosses to get two heads in a row?", 6, 0.001, "E = 6.");
N(2, "Two ropes each burn in 60 minutes but unevenly. Which duration (minutes) can be measured by lighting one rope at both ends and the other at one end, then the other end when the first finishes?", 45, 0, "30 + 15.");
N(3, "12 coins, one counterfeit that is either heavier or lighter. Minimum weighings to find it and tell which?", 3, 0, "24 possibilities ≤ 3³ = 27.");
N(2, "How many rectangles (including squares) are on a chessboard?", 1296, 0, "Choose 2 of 9 horizontal and 2 of 9 vertical lines: 36 × 36.");
N(3, "Minimum number of people needed for a better-than-even chance that two share a birthday?", 23, 0, "About 50.7%.");
C("Bridge and torch (1, 2, 5, 10)", "17 minutes: 1+2 over, 1 back, 5+10 over, 2 back, 1+2 over.");
C("n weighings on a balance", "Distinguish up to 3ⁿ cases.");
C("2 eggs, 100 floors", "14 drops: first drops at 14, 27, 39, 50, …");
C("100 doors", "Perfect squares stay open: 10 doors.");
