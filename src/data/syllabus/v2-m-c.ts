/**
 * v2 Maths for ML, part C: Probability (core concepts). Fixed ids; answers recomputed in Pyodide.
 */
import { lessonWriter } from "./v2-shared";
import { MS } from "./v2-m-src";

const { L, Q, C } = lessonWriter("maths");
const PR = "Probability";
const NP = ["numpy"];
const SP = ["numpy", "scipy"];

L("m-prob-axioms", PR, "Probability axioms, events and counting", "Sample spaces, the three axioms and their consequences, and the counting rules behind most interview puzzles.", {
  kind: "concept", mins: 20,
  hook: "23 people in a room: is a shared birthday more likely than not? Most people say no. Count it.",
  intuition: `
**The situation.** Probability questions in interviews are mostly counting questions in disguise: list what can happen, count the outcomes you care about, divide.

**The idea.** A **sample space** $\\Omega$ lists every possible outcome; an **event** is a subset of it. A probability assigns each event a number obeying three axioms: it is non-negative, $P(\\Omega) = 1$, and probabilities of disjoint events add. Everything else follows:

- **Complement**: $P(A^c) = 1 - P(A)$. "At least one" is almost always easier as 1 − P(none).
- **Inclusion–exclusion**: $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$, because the overlap was counted twice.
- **Equally likely outcomes**: $P(A) = |A|/|\\Omega|$, so you need to count.

**Counting.** Order matters → permutations; order doesn't → combinations. Repeated identical items → divide by the ways to shuffle them.
`,
  maths: `
**In one breath.** $P(A) \\ge 0$, $P(\\Omega) = 1$, additivity over disjoint events; $P(A^c) = 1 - P(A)$; $P(A\\cup B) = P(A) + P(B) - P(A\\cap B)$; $n!$, $\\frac{n!}{(n-k)!}$, $\\binom nk = \\frac{n!}{k!(n-k)!}$, $\\binom{n+k-1}{k}$.

| Question | Count |
|---|---|
| Arrange $n$ distinct items | $n!$ |
| Ordered pick of $k$ from $n$ | $n!/(n-k)!$ |
| Unordered pick of $k$ from $n$ | $\\binom nk$ |
| Arrangements with repeats ($n_1, n_2, \\dots$ identical) | $n!/(n_1!\\,n_2!\\cdots)$ |
| $k$ identical items into $n$ bins | $\\binom{n+k-1}{k}$ (stars and bars) |

**Worked example: the birthday problem.** $P(\\text{all distinct}) = \\frac{365}{365}\\cdot\\frac{364}{365}\\cdots\\frac{343}{365} = 0.4927$, so $P(\\text{shared}) = 0.507$ with 23 people. There are $\\binom{23}{2} = 253$ pairs, which is why it happens so soon.

**Worked example: at least one six in four rolls.** $1 - (5/6)^4 = 0.518$.

**Worked example: poker.** $\\binom{52}{5} = 2{,}598{,}960$ hands. Arrangements of LEVEL: $5!/(2!\\,2!) = 30$.

**Inclusion–exclusion for three.** $P(A\\cup B\\cup C) = \\sum P(\\cdot) - \\sum P(\\text{pairs}) + P(A\\cap B\\cap C)$.
`,
  practice: `
**Strategy.** Define the sample space explicitly and check outcomes are equally likely (two dice give 36 equally likely ordered pairs, not 21 unordered ones). Reach for the complement when you see "at least one". Sanity-check with a small case or a quick simulation.

**In ML.** Hash collisions, duplicate IDs and random seeds colliding are birthday problems: with $k$ items and $N$ buckets, collisions become likely around $k \\approx \\sqrt N$.
`,
  traps: [
    { trap: "Two dice: totals 2 to 12 are 11 outcomes, so P(7) = 1/11.", why: "The 11 totals are not equally likely. Count the 36 ordered pairs: six give 7, so P(7) = 1/6." },
    { trap: "P(at least one six in 4 rolls) = 4 × 1/6.", why: "Adding double-counts rolls with several sixes (and would exceed 1 with 7 rolls). Use the complement: $1 - (5/6)^4$." },
  ],
  say: {
    prompt: "Explain the birthday problem and why the answer surprises people.",
    secs: 45,
    check: ["Use the complement: all birthdays distinct", "Product 365/365 × 364/365 × …", "≈ 0.507 shared at 23 people", "Reason: 253 pairs, not 23 people, can collide", "ML link: hash/ID collisions at ≈ √N"],
    followups: [
      { q: "How many people for a 99% chance of a shared birthday?", a: "57." },
      { q: "When do collisions become likely among k random IDs from N values?", a: "Around $k \\approx 1.18\\sqrt N$ for 50%; the expected number of colliding pairs is $\\binom k2/N$." },
      { q: "State inclusion–exclusion for two events.", a: "$P(A\\cup B) = P(A) + P(B) - P(A \\cap B)$." },
    ],
    answer: `It's easiest through the complement: the chance that everyone's birthday is different is 365/365 × 364/365 × … down to 343/365 for 23 people, which is about 0.493, so a shared birthday has probability about 0.507. People anchor on comparing themselves with 22 others, but what matters is the number of pairs, 23 choose 2 = 253, and each pair has a 1/365 chance. The same reasoning says random IDs or hashes start colliding once you have around the square root of the number of possible values.`,
    avoid: ["Comparing one person with everyone else", "Adding probabilities of overlapping events"],
  },
  terms: [["Sample space", "Set of all possible outcomes."], ["Inclusion–exclusion", "Add singles, subtract pairs, add triples…"], ["Combination", "Unordered selection: n choose k."]],
  sources: [MS.seeing, MS.mml],
});
Q({ id: "m-ax-1", d: 1, secs: 30, prompt: "Probability of at least one six in four rolls of a fair die? (3 decimals)", answer: 0.518, tol: 0.002, explain: "1 − (5/6)⁴ = 0.518.", py: "from itertools import product\nr=list(product(range(1,7),repeat=4))\nanswer = sum(6 in t for t in r)/len(r)" });
Q({ id: "m-ax-2", d: 2, secs: 60, prompt: "23 people, birthdays uniform over 365 days. Probability at least two share one? (3 decimals)", answer: 0.507, tol: 0.002, explain: "1 − ∏(365 − i)/365 for i = 0…22.", py: "from fractions import Fraction\np=Fraction(1)\nfor i in range(23): p*=Fraction(365-i,365)\nanswer = float(1-p)" });
Q({ id: "m-ax-3", d: 1, secs: 30, prompt: "How many distinct 5-card hands from a 52-card deck?", answer: 2598960, tol: 0.5, explain: "52 choose 5.", py: "from math import comb\nanswer = comb(52,5)" });
Q({ id: "m-ax-4", d: 1, secs: 30, prompt: "P(A) = 0.5, P(B) = 0.4, P(A ∩ B) = 0.2. What is P(A ∪ B)?", answer: 0.7, tol: 0.002, explain: "0.5 + 0.4 − 0.2.", py: "from fractions import Fraction as F\nanswer = float(F(1,2)+F(2,5)-F(1,5))" });
Q({ id: "m-ax-5", d: 2, secs: 45, prompt: "How many distinct arrangements of the letters of LEVEL?", answer: 30, tol: 0.5, explain: "5!/(2! 2!) = 30 (two Ls, two Es).", py: "from itertools import permutations\nanswer = len(set(permutations('LEVEL')))" });
C("m-ax-c1", "“At least one”", "Use 1 − P(none).");
C("m-ax-c2", "Birthday rule of thumb", "Collisions likely once k ≈ √N items; 23 people for 365 days.");

L("m-conditional", PR, "Conditional probability, independence and total probability", "Updating on information, what independence really means, and splitting a problem into cases.", {
  kind: "concept", mins: 20, prereq: ["m-prob-axioms"],
  hook: "A family has two children and at least one is a boy. Probability both are boys? (It isn't 1/2.)",
  intuition: `
**The situation.** New information shrinks the sample space. "Given B" means: throw away every outcome where B didn't happen and renormalise what's left.

**The idea.** $P(A\\mid B) = P(A\\cap B)/P(B)$. Rearranged, $P(A\\cap B) = P(A\\mid B)P(B)$: the **multiplication rule**, which chains for sequences ("first card is an ace, then the second is an ace given the first was").

- **Independence**: $P(A\\mid B) = P(A)$, i.e. $P(A\\cap B) = P(A)P(B)$. Knowing B tells you nothing about A.
- **Mutually exclusive** is a different idea: $A\\cap B = \\emptyset$. Two exclusive events with positive probability are *dependent*: if one happens the other can't.
- **Law of total probability**: split into cases $B_1, \\dots, B_k$ that cover everything without overlap: $P(A) = \\sum_i P(A\\mid B_i)P(B_i)$.
- **Conditional independence**: A and B can be dependent overall but independent given C (or the reverse). Naive Bayes assumes features are independent given the class.
`,
  maths: `
**In one breath.** $P(A\\mid B) = \\frac{P(A\\cap B)}{P(B)}$; independent iff $P(A\\cap B) = P(A)P(B)$; $P(A) = \\sum_i P(A\\mid B_i)P(B_i)$; chain rule $P(A_1\\cap\\dots\\cap A_n) = \\prod_i P(A_i \\mid A_1, \\dots, A_{i-1})$.

**Worked example: two children.** Equally likely: BB, BG, GB, GG. "At least one boy" leaves BB, BG, GB, so $P(BB\\mid\\ge 1\\,B) = 1/3$. "The elder is a boy" leaves BB, BG: $1/2$. The wording decides the conditioning event.

**Worked example: two aces.** $P = \\frac{4}{52}\\cdot\\frac{3}{51} = \\frac{1}{221} = 0.0045$.

**Worked example: total probability.** Machine A makes 60% of parts with 2% defective; machine B 40% with 5% defective. $P(\\text{defect}) = 0.6(0.02) + 0.4(0.05) = 0.032$.

| Relationship | Definition | Example |
|---|---|---|
| Independent | $P(A\\cap B) = P(A)P(B)$ | two separate coin tosses |
| Mutually exclusive | $P(A\\cap B) = 0$ | one die shows 1 and shows 6 |
| Conditionally independent | $P(A\\cap B\\mid C) = P(A\\mid C)P(B\\mid C)$ | two symptoms given the disease |

**Pairwise is not mutual.** Toss two coins; A = first is H, B = second is H, C = both match. Each pair is independent, but A and B together fix C.
`,
  practice: `
**In ML.** Naive Bayes multiplies $P(x_j\\mid y)$ assuming conditional independence. Train/test leakage is a failure of independence. Simpson's paradox (a trend reversing when you condition on a group) is the law of total probability with unequal group weights.

**Interview habit.** Write the conditioning event explicitly before computing. Many "paradoxes" are ambiguity about what was conditioned on.
`,
  traps: [
    { trap: "Mutually exclusive events are independent.", why: "If $P(A), P(B) > 0$ and they can't co-occur, then $P(A\\cap B) = 0 \\ne P(A)P(B)$: maximally dependent." },
    { trap: "P(A | B) = P(B | A).", why: "Confusing the two is the prosecutor's fallacy. They are linked by Bayes' theorem through $P(A)/P(B)$." },
  ],
  say: {
    prompt: "What's the difference between independent and mutually exclusive events? Give an example of each.",
    secs: 40,
    check: ["Independent: P(A ∩ B) = P(A)P(B), info about B doesn't change A", "Exclusive: can't happen together, P(A ∩ B) = 0", "Exclusive with positive probabilities ⇒ dependent", "Examples: two coin tosses vs one die showing 1 and 6", "Mention conditional independence (naive Bayes)"],
    followups: [
      { q: "Can events be pairwise independent but not mutually independent?", a: "Yes: two fair coins, A = first heads, B = second heads, C = coins match. Any two are independent; all three are not." },
      { q: "What does naive Bayes assume?", a: "Features are independent given the class: $P(x\\mid y) = \\prod_j P(x_j\\mid y)$." },
      { q: "State the law of total probability.", a: "$P(A) = \\sum_i P(A\\mid B_i)P(B_i)$ for a partition $\\{B_i\\}$." },
    ],
    answer: `Independent means knowing one event happened doesn't change the probability of the other: P(A ∩ B) = P(A)P(B), like two separate coin tosses. Mutually exclusive means they can't both happen, so P(A ∩ B) = 0, like a single die showing both 1 and 6. If both events have positive probability, exclusive events are actually strongly dependent: learning one happened tells you the other didn't. A related idea that matters in ML is conditional independence, which naive Bayes assumes for features given the class.`,
    avoid: ["Treating exclusive and independent as the same", "Swapping P(A | B) and P(B | A)"],
  },
  terms: [["Conditional probability", "P(A ∩ B)/P(B)."], ["Independence", "P(A ∩ B) = P(A)P(B)."], ["Law of total probability", "P(A) = Σ P(A | Bᵢ)P(Bᵢ)."]],
  sources: [MS.seeing, MS.mml],
});
Q({ id: "m-cnd-1", d: 2, secs: 45, prompt: "Two children, each equally likely boy or girl. At least one is a boy. Probability both are boys? (3 decimals)", answer: 0.333, tol: 0.002, explain: "BB out of {BB, BG, GB}.", py: "from itertools import product\nfrom fractions import Fraction\nS=[s for s in product('BG',repeat=2) if 'B' in s]\nanswer = float(Fraction(sum(s==('B','B') for s in S),len(S)))" });
Q({ id: "m-cnd-2", d: 1, secs: 45, prompt: "Draw two cards without replacement. Probability both are aces? (4 decimals)", answer: 0.0045, tol: 0.0001, explain: "4/52 × 3/51 = 1/221.", py: "from itertools import combinations\nfrom math import comb\ndeck=['A']*4+['x']*48\nanswer = sum(a=='A' and b=='A' for a,b in combinations(deck,2))/comb(52,2)" });
Q({ id: "m-cnd-3", d: 1, secs: 30, prompt: "A and B are independent with P(A) = 0.3, P(B) = 0.5. What is P(A ∪ B)?", answer: 0.65, tol: 0.002, explain: "0.3 + 0.5 − 0.15.", py: "pa,pb=0.3,0.5\nanswer = pa+pb-pa*pb" });
Q({ id: "m-cnd-4", d: 2, secs: 45, prompt: "Machine A makes 60% of parts (2% defective), machine B 40% (5% defective). Overall defect rate?", answer: 0.032, tol: 0.0005, explain: "0.6 × 0.02 + 0.4 × 0.05.", py: "from fractions import Fraction as F\nanswer = float(F(6,10)*F(2,100)+F(4,10)*F(5,100))" });
Q({ id: "m-cnd-5", d: 2, secs: 45, prompt: "Events A and B each have positive probability and are mutually exclusive. Then they are:", options: ["Independent", "Dependent", "Independent only if P(A) = P(B)", "Impossible to say"], answer: 1, explain: "P(A ∩ B) = 0 ≠ P(A)P(B) > 0.", py: "pa,pb,pab=0.2,0.3,0.0\nanswer = 0 if pab==pa*pb else 1" });
C("m-cnd-c1", "Exclusive vs independent", "Exclusive (positive probs) ⇒ dependent.");
C("m-cnd-c2", "Total probability", "P(A) = Σᵢ P(A | Bᵢ)P(Bᵢ) over a partition.");

L("m-bayes", PR, "Bayes' theorem and base rates", "Turning P(evidence | cause) into P(cause | evidence), the odds form, and why rare conditions produce mostly false positives.", {
  kind: "concept", mins: 20, prereq: ["m-conditional"],
  hook: "A test is 99% sensitive with a 5% false-positive rate. You test positive for a 1-in-100 condition. Chance you have it?",
  intuition: `
**The situation.** Tests, classifiers and fraud rules tell you $P(\\text{alert}\\mid\\text{fraud})$. You want $P(\\text{fraud}\\mid\\text{alert})$. They are not the same, and the gap is the **base rate**.

**The idea.** Bayes' theorem reverses a conditional:

$$P(H\\mid E) = \\frac{P(E\\mid H)\\,P(H)}{P(E)}$$

Think in counts: of 10,000 people, 100 have the condition and 99 test positive; of the 9,900 without it, 495 test positive. So $99/(99 + 495) = 16.7\\%$ of positives are real. The test is good; the condition is rare.

**Odds form.** Posterior odds = prior odds × likelihood ratio. Evidence multiplies odds; independent pieces of evidence multiply in turn. This is what naive Bayes and log-odds in logistic regression add up.
`,
  maths: `
**In one breath.** $P(H\\mid E) = \\frac{P(E\\mid H)P(H)}{P(E\\mid H)P(H) + P(E\\mid H^c)P(H^c)}$; $\\frac{P(H\\mid E)}{P(H^c\\mid E)} = \\frac{P(H)}{P(H^c)}\\cdot\\frac{P(E\\mid H)}{P(E\\mid H^c)}$; LR⁺ = sensitivity / (1 − specificity).

**Worked example.** Prevalence 1%, sensitivity 0.99, false-positive rate 0.05:

$$P(D\\mid +) = \\frac{0.99 \\times 0.01}{0.99\\times0.01 + 0.05\\times0.99} = \\frac{0.0099}{0.0594} = 0.167$$

**Odds form, same example.** Prior odds $1/99$; LR⁺ $= 0.99/0.05 = 19.8$; posterior odds $= 0.2$; probability $0.2/1.2 = 0.167$. A second independent positive: odds $0.2 \\times 19.8 = 3.96$, probability $0.798$.

**Spam filter.** $P(\\text{spam}) = 0.4$; the word "winner" appears in 30% of spam and 5% of ham. $P(\\text{spam}\\mid\\text{winner}) = \\frac{0.12}{0.12 + 0.03} = 0.8$.

| Quantity | Medical name | ML name |
|---|---|---|
| $P(+\\mid D)$ | sensitivity | recall / TPR |
| $P(-\\mid D^c)$ | specificity | TNR = 1 − FPR |
| $P(D\\mid +)$ | positive predictive value | precision |
| $P(D)$ | prevalence | base rate / class prior |

Precision depends on the base rate; recall and FPR don't. That is why a fraud model's precision falls when fraud gets rarer, with the model unchanged.
`,
  practice: `
**In ML.** Class priors and precision: a model validated on balanced data shows inflated precision when deployed on 1% positives. Recalibrate with the true prior. Naive Bayes is Bayes' theorem plus conditional independence. Bayesian inference generally: posterior ∝ likelihood × prior.

**Habit.** Convert to natural frequencies (out of 10,000) in interviews; it is fast and hard to get wrong.
`,
  traps: [
    { trap: "A 99%-accurate test that says positive means a 99% chance of disease.", why: "That confuses $P(+\\mid D)$ with $P(D\\mid +)$. With a 1% base rate and 5% FPR, most positives are false." },
    { trap: "Precision measured on a balanced validation set carries over to production.", why: "Precision depends on prevalence. Recompute with the production base rate using Bayes." },
  ],
  say: {
    prompt: "A fraud model has 90% recall and a 1% false-positive rate. Fraud is 0.1% of transactions. What fraction of alerts are fraud?",
    secs: 60,
    check: ["Set up Bayes with base rate 0.001", "TP ∝ 0.9 × 0.001, FP ∝ 0.01 × 0.999", "Precision ≈ 0.0009/(0.0009 + 0.00999) ≈ 8%", "Explain: rare base rate swamps a small FPR", "Implication: thresholds, second-stage review, report precision at deployment prevalence"],
    followups: [
      { q: "How would you raise precision?", a: "Raise the threshold (cuts FPR, costs recall), add features, or add a second-stage model or manual review on alerts." },
      { q: "What is the likelihood ratio for this model?", a: "LR⁺ = 0.9/0.01 = 90; prior odds 1/999, posterior odds ≈ 0.09." },
      { q: "Why doesn't recall depend on the base rate?", a: "It conditions on the true class: $P(+\\mid \\text{fraud})$ is a property of the model on fraud cases only." },
    ],
    answer: `Per million transactions, 1,000 are fraud and the model flags 900 of them. Of the 999,000 legitimate ones, 1% are flagged: 9,990. So precision is 900 / 10,890, about 8%. The model is good, but fraud is so rare that a 1% false-positive rate on the huge legitimate pool outnumbers the true hits. In practice I'd report precision at the real prevalence, pick the threshold from the cost of a missed fraud versus a reviewed false alarm, and consider a second-stage check on alerts.`,
    avoid: ["Answering 90%", "Ignoring the base rate"],
  },
  terms: [["Bayes' theorem", "P(H | E) = P(E | H)P(H)/P(E)."], ["Base rate", "Prior probability of the condition."], ["Likelihood ratio", "P(E | H)/P(E | not H); multiplies the odds."]],
  sources: [MS.seeing, MS.mml, MS.islr],
});
Q({ id: "m-bay-1", d: 2, secs: 60, prompt: "Prevalence 1%, sensitivity 99%, false-positive rate 5%. P(disease | positive)? (3 decimals)", answer: 0.167, tol: 0.002, explain: "0.0099/(0.0099 + 0.0495).", py: "from fractions import Fraction as F\np=F(1,100);s=F(99,100);f=F(5,100)\nanswer = float(s*p/(s*p+f*(1-p)))" });
Q({ id: "m-bay-2", d: 3, secs: 90, prompt: "Same test, two independent positive results. P(disease | both positive)? (3 decimals)", answer: 0.798, tol: 0.002, explain: "Odds (1/99) × 19.8² = 3.96; 3.96/4.96.", py: "from fractions import Fraction as F\np=F(1,100);s=F(99,100);f=F(5,100)\nanswer = float(s*s*p/(s*s*p+f*f*(1-p)))" });
Q({ id: "m-bay-3", d: 1, secs: 45, prompt: "40% of email is spam. 'winner' appears in 30% of spam and 5% of ham. P(spam | 'winner')?", answer: 0.8, tol: 0.002, explain: "0.12/(0.12 + 0.03).", py: "from fractions import Fraction as F\nanswer = float(F(4,10)*F(3,10)/(F(4,10)*F(3,10)+F(6,10)*F(5,100)))" });
Q({ id: "m-bay-4", d: 2, secs: 60, prompt: "Fraud is 0.1% of transactions. A model has recall 0.9 and false-positive rate 0.01. Precision of its alerts? (3 decimals)", answer: 0.083, tol: 0.002, explain: "0.0009/(0.0009 + 0.00999) = 0.0826.", py: "p=0.001\nanswer = 0.9*p/(0.9*p+0.01*(1-p))" });
Q({ id: "m-bay-5", d: 1, secs: 30, prompt: "Sensitivity 0.99, specificity 0.95. Positive likelihood ratio?", answer: 19.8, tol: 0.02, explain: "0.99/(1 − 0.95).", py: "from fractions import Fraction as F\nanswer = float(F(99,100)/(1-F(95,100)))" });
C("m-bay-c1", "Odds form of Bayes", "Posterior odds = prior odds × likelihood ratio.");
C("m-bay-c2", "Precision and base rate", "Recall and FPR are prevalence-free; precision is not.");

L("m-random-vars", PR, "Random variables, expectation and variance", "Linearity of expectation, variance rules, and covariance in sums.", {
  kind: "concept", mins: 20, prereq: ["m-prob-axioms"],
  hook: "Linearity of expectation works even for dependent variables. Variance additivity doesn't. Why?",
  intuition: `
**The situation.** Most quantities you report (revenue per user, loss per batch, number of clicks) are random variables, and you summarise them by their mean and spread.

**The idea.** A **random variable** maps outcomes to numbers. Its **expectation** $E[X]$ is the probability-weighted average; its **variance** $\\text{Var}(X) = E[(X - E X)^2]$ is the average squared distance from the mean.

- **Linearity** $E[aX + bY] = aE[X] + bE[Y]$ holds *always*, dependent or not. It is the most useful fact in puzzle interviews: break a count into indicator variables and add their probabilities.
- Variance scales by the square: $\\text{Var}(aX + b) = a^2\\text{Var}(X)$. Shifting doesn't change spread.
- For sums, **covariance** enters: $\\text{Var}(X + Y) = \\text{Var} X + \\text{Var} Y + 2\\text{Cov}(X, Y)$. Only uncorrelated variables add variances.
`,
  maths: `
**In one breath.** $E[X] = \\sum x\\,p(x)$ or $\\int x f(x)\\,dx$; $E[g(X)] = \\sum g(x)p(x)$ (LOTUS); $\\text{Var}(X) = E[X^2] - (E X)^2$; $\\text{Var}(aX+b) = a^2\\text{Var}X$; $\\text{Var}(\\sum X_i) = \\sum\\text{Var}X_i + 2\\sum_{i<j}\\text{Cov}(X_i, X_j)$.

**Worked example: a fair die.** $E[X] = 3.5$; $E[X^2] = 91/6 = 15.17$; $\\text{Var}(X) = 91/6 - 12.25 = 35/12 = 2.917$. Sum of two dice: mean 7, variance $35/6 = 5.83$ (independent, so variances add).

**Indicator trick.** Expected number of fixed points of a random permutation of $n$ items: $X = \\sum_i I_i$ with $P(I_i = 1) = 1/n$, so $E[X] = 1$ for every $n$, despite the $I_i$ being dependent.

**Products.** $E[XY] = E[X]E[Y] + \\text{Cov}(X, Y)$; equal to $E[X]E[Y]$ when uncorrelated (independence is sufficient, not necessary).

| Operation | Mean | Variance |
|---|---|---|
| $aX + b$ | $aE X + b$ | $a^2\\text{Var} X$ |
| $X + Y$ | $E X + E Y$ | $\\text{Var} X + \\text{Var} Y + 2\\text{Cov}$ |
| $X - Y$ | $E X - E Y$ | $\\text{Var} X + \\text{Var} Y - 2\\text{Cov}$ |
| mean of $n$ iid | $\\mu$ | $\\sigma^2/n$ |

**Jensen.** For convex $g$, $E[g(X)] \\ge g(E[X])$: e.g. $E[X^2] \\ge (E X)^2$, which is why variance is non-negative.
`,
  practice: `
**In ML and analytics.** Ensembles: averaging $k$ models with variance $\\sigma^2$ and pairwise correlation $\\rho$ gives variance $\\rho\\sigma^2 + (1-\\rho)\\sigma^2/k$, so decorrelating trees (random forests) matters more than adding them. A/B tests: the variance of a difference of independent means adds.

**Heavy tails.** Some variables (revenue with whales) have huge variance; the mean exists but is noisy. Report medians alongside or cap values.
`,
  traps: [
    { trap: "Var(X − Y) = Var X − Var Y.", why: "Variances add for independent variables, whether you add or subtract: $\\text{Var}(X - Y) = \\text{Var}X + \\text{Var}Y - 2\\text{Cov}$." },
    { trap: "Linearity of expectation needs independence.", why: "It never does. Independence is needed for $E[XY] = E X\\,E Y$ and for variances to add." },
  ],
  say: {
    prompt: "State the rules for the mean and variance of a sum of random variables, and when each one needs independence.",
    secs: 45,
    check: ["E[X + Y] = E X + E Y always", "Var(X + Y) = Var X + Var Y + 2Cov", "Variances add only if uncorrelated", "Var(aX + b) = a²Var X", "Example: indicator trick or ensemble variance"],
    followups: [
      { q: "What is Var(X − Y) for independent X, Y?", a: "Var X + Var Y." },
      { q: "Expected number of fixed points in a random shuffle of 52 cards?", a: "1, by linearity over indicators each with probability 1/52." },
      { q: "Why does averaging correlated models help less?", a: "Variance of the average is $\\rho\\sigma^2 + (1-\\rho)\\sigma^2/k$; the $\\rho\\sigma^2$ part never averages away." },
    ],
    answer: `Expectation is linear in every case: E[aX + bY] = aE[X] + bE[Y], even when X and Y are dependent, which is what makes the indicator-variable trick work. Variance isn't linear: scaling by a multiplies it by a², shifting does nothing, and for a sum Var(X + Y) = Var X + Var Y + 2Cov(X, Y). So variances add only when the variables are uncorrelated, and they add for differences too. That's why the variance of an average of n independent draws is σ²/n, and why correlated ensemble members reduce variance less.`,
    avoid: ["Subtracting variances for a difference", "Claiming linearity needs independence"],
  },
  terms: [["Expectation", "Probability-weighted average."], ["Variance", "E[X²] − (E X)²."], ["Indicator variable", "1 if an event happens, else 0; E = probability."]],
  sources: [MS.seeing, MS.mml, MS.dlb],
});
Q({ id: "m-rv-1", d: 1, secs: 45, prompt: "Variance of one roll of a fair die? (3 decimals)", answer: 2.917, tol: 0.002, explain: "91/6 − 3.5² = 35/12.", py: "from fractions import Fraction as F\nm=F(sum(range(1,7)),6);m2=F(sum(x*x for x in range(1,7)),6)\nanswer = float(m2-m*m)" });
Q({ id: "m-rv-2", d: 1, secs: 30, prompt: "Var(X) = 4. What is Var(2X + 3)?", answer: 16, tol: 0.01, explain: "a²Var X = 4 × 4; the +3 doesn't matter.", py: "import numpy as np\nrng=np.random.default_rng(0)\nx=rng.normal(0,2,2_000_000)\nanswer = round(float(np.var(2*x+3)))", packages: NP });
Q({ id: "m-rv-3", d: 2, secs: 45, prompt: "Variance of the total of two fair dice? (2 decimals)", answer: 5.83, tol: 0.01, explain: "Independent, so 35/12 + 35/12 = 35/6.", py: "from itertools import product\nfrom fractions import Fraction as F\nt=[a+b for a,b in product(range(1,7),repeat=2)]\nm=F(sum(t),36);m2=F(sum(x*x for x in t),36)\nanswer = float(m2-m*m)" });
Q({ id: "m-rv-4", d: 2, secs: 60, prompt: "Expected number of fixed points in a uniformly random permutation of 6 items?", answer: 1, tol: 0.01, explain: "Six indicators, each with probability 1/6.", py: "from itertools import permutations\nfrom fractions import Fraction as F\nps=list(permutations(range(6)))\nanswer = float(F(sum(sum(p[i]==i for i in range(6)) for p in ps),len(ps)))" });
Q({ id: "m-rv-5", d: 2, secs: 45, prompt: "Var X = 3, Var Y = 5, Cov(X, Y) = 1. What is Var(X − Y)?", answer: 6, tol: 0.01, explain: "3 + 5 − 2 × 1.", py: "import numpy as np\nS=np.array([[3,1],[1,5.]]);a=np.array([1,-1.])\nanswer = float(a@S@a)", packages: NP });
C("m-rv-c1", "Linearity of expectation", "Always holds; no independence needed.");
C("m-rv-c2", "Variance of a sum", "Var X + Var Y + 2Cov(X, Y); minus 2Cov for a difference.");

L("m-discrete", PR, "Discrete distributions: Bernoulli, binomial, geometric, Poisson, hypergeometric", "The handful of count distributions that cover most interview and analytics questions.", {
  kind: "concept", mins: 25, prereq: ["m-random-vars"],
  hook: "A support desk gets 3 tickets an hour on average. Chance of a quiet hour with none? Which distribution, and why?",
  intuition: `
**The situation.** Counts are everywhere: conversions out of visitors, defects per batch, emails per hour, attempts until success.

**Which one?**

- **Bernoulli($p$)**: a single yes/no.
- **Binomial($n, p$)**: number of successes in $n$ independent trials with the same $p$.
- **Geometric($p$)**: number of trials until the first success.
- **Poisson($\\lambda$)**: count of events in a fixed window when events are rare, independent and happen at a steady rate. It is the limit of binomial with large $n$, small $p$, $np = \\lambda$.
- **Hypergeometric**: successes when drawing **without replacement** from a finite pool (cards, audits).
- **Negative binomial**: trials until the $r$-th success; also a Poisson with extra variance (overdispersion).
`,
  maths: `
**In one breath.**

| Distribution | PMF | Mean | Variance |
|---|---|---|---|
| Bernoulli$(p)$ | $p^x(1-p)^{1-x}$ | $p$ | $p(1-p)$ |
| Binomial$(n,p)$ | $\\binom nk p^k(1-p)^{n-k}$ | $np$ | $np(1-p)$ |
| Geometric$(p)$, trials | $(1-p)^{k-1}p$ | $1/p$ | $(1-p)/p^2$ |
| Poisson$(\\lambda)$ | $e^{-\\lambda}\\lambda^k/k!$ | $\\lambda$ | $\\lambda$ |
| Hypergeometric$(N, K, n)$ | $\\binom Kk\\binom{N-K}{n-k}/\\binom Nn$ | $nK/N$ | $n\\frac KN\\frac{N-K}{N}\\frac{N-n}{N-1}$ |

**Worked examples.**

- Binomial: 10 visitors, conversion 0.3, exactly 3 convert: $\\binom{10}{3}0.3^3 0.7^7 = 0.267$.
- Poisson: rate 3 per hour, $P(0) = e^{-3} = 0.050$; $P(X \\le 2) = e^{-3}(1 + 3 + 4.5) = 0.423$.
- Geometric: success probability 0.2, expected trials 5.
- Hypergeometric: exactly 2 aces in a 5-card hand: $\\binom42\\binom{48}{3}/\\binom{52}{5} = 0.040$.

**Poisson facts.** Sums of independent Poissons are Poisson with added rates. Mean equals variance, so counts with variance much larger than the mean are **overdispersed**: use a negative binomial.
`,
  practice: `
**Code.** \`scipy.stats.binom.pmf(k, n, p)\`, \`.cdf\`, \`.sf\` (= 1 − cdf, more accurate in the tail), \`poisson\`, \`geom\` (counts trials, support starts at 1), \`hypergeom(M, n, N)\` (watch the argument order: population size, successes in population, draws).

**Modelling.** Poisson regression for counts (log link); check overdispersion before trusting its standard errors.
`,
  traps: [
    { trap: "Use the binomial for cards drawn without replacement.", why: "Draws aren't independent; use the hypergeometric. The binomial is a fine approximation only when the sample is a small fraction of the pool." },
    { trap: "Geometric mean number of failures before success is 1/p.", why: "1/p counts *trials* including the success; failures before it average $(1-p)/p$. Check which convention a library uses." },
  ],
  say: {
    prompt: "When would you model a count with a Poisson rather than a binomial, and what would make you abandon the Poisson?",
    secs: 45,
    check: ["Binomial: fixed n trials, constant p, count successes", "Poisson: events in a window, rare and independent, constant rate", "Poisson as binomial limit (n large, p small, np = λ)", "Poisson mean = variance", "Overdispersion → negative binomial; also time-varying rate"],
    followups: [
      { q: "P(no tickets) when the rate is 3 per hour?", a: "$e^{-3} \\approx 0.050$." },
      { q: "What is the variance of a binomial(100, 0.5)?", a: "25." },
      { q: "What is the sum of two independent Poisson(2) variables?", a: "Poisson(4)." },
    ],
    answer: `A binomial fits when there's a known number of independent trials, each with the same success probability, like conversions among a fixed set of visitors. A Poisson fits when you count events in a window of time or space and they happen independently at a steady average rate with no natural cap, like support tickets per hour; it's the limit of a binomial with many trials and tiny probability. Its signature is mean equal to variance, so if the counts' variance is much bigger than their mean, or the rate clearly changes through the day, I'd move to a negative binomial or model the rate.`,
    avoid: ["Applying binomial to draws without replacement", "Ignoring overdispersion"],
  },
  terms: [["Binomial", "Successes in n iid Bernoulli trials."], ["Poisson", "Count at a constant rate; mean = variance = λ."], ["Overdispersion", "Variance larger than a Poisson's mean."]],
  sources: [MS.scipy, MS.seeing],
});
Q({ id: "m-dsc-1", d: 1, secs: 45, prompt: "10 visitors, each converts with probability 0.3 independently. P(exactly 3 convert)? (3 decimals)", answer: 0.267, tol: 0.002, explain: "C(10, 3)(0.3)³(0.7)⁷.", py: "from scipy import stats\nanswer = float(stats.binom.pmf(3,10,0.3))", packages: SP });
Q({ id: "m-dsc-2", d: 1, secs: 30, prompt: "Tickets arrive as Poisson with rate 3 per hour. P(an hour with none)? (3 decimals)", answer: 0.05, tol: 0.002, explain: "e⁻³ = 0.0498.", py: "from scipy import stats\nanswer = float(stats.poisson.pmf(0,3))", packages: SP });
Q({ id: "m-dsc-3", d: 2, secs: 45, prompt: "Same Poisson(3). P(at most 2 tickets in an hour)? (3 decimals)", answer: 0.423, tol: 0.002, explain: "e⁻³(1 + 3 + 9/2).", py: "from scipy import stats\nanswer = float(stats.poisson.cdf(2,3))", packages: SP });
Q({ id: "m-dsc-4", d: 2, secs: 60, prompt: "5-card hand from a standard deck. P(exactly 2 aces)? (3 decimals)", answer: 0.04, tol: 0.002, explain: "C(4, 2)C(48, 3)/C(52, 5) = 0.0399.", py: "from scipy import stats\nanswer = float(stats.hypergeom.pmf(2,52,4,5))", packages: SP });
Q({ id: "m-dsc-5", d: 1, secs: 30, prompt: "Each call closes a sale with probability 0.2 independently. Expected number of calls up to and including the first sale?", answer: 5, tol: 0.01, explain: "Geometric (trials): 1/p.", py: "from scipy import stats\nanswer = float(stats.geom.mean(0.2))", packages: SP });
C("m-dsc-c1", "Poisson signature", "Mean = variance = λ; sums of Poissons are Poisson.");
C("m-dsc-c2", "Without replacement", "Hypergeometric, not binomial.");

L("m-continuous", PR, "Continuous distributions: uniform, normal, exponential, beta", "Densities versus probabilities, the normal and its z-scores, the memoryless exponential, and the beta for proportions.", {
  kind: "concept", mins: 25, prereq: ["m-random-vars"],
  hook: "A density can be bigger than 1. How can a probability-like thing exceed 1, and what does it actually measure?",
  intuition: `
**The situation.** Waiting times, heights, model scores and returns are measured on a continuum. The chance of any exact value is zero, so we talk about ranges.

**The idea.** A **density** $f(x)$ is probability per unit length: $P(a \\le X \\le b) = \\int_a^b f(x)\\,dx$. It must integrate to 1, but its height can exceed 1 when the spread is small (Uniform(0, 0.5) has density 2). The **CDF** $F(x) = P(X \\le x)$ is always between 0 and 1.

- **Uniform($a, b$)**: every value equally likely; random number generators, priors with no preference.
- **Normal($\\mu, \\sigma^2$)**: the bell curve; sums of many small effects (CLT). Standardise with $z = (x - \\mu)/\\sigma$.
- **Exponential($\\lambda$)**: time between Poisson events; **memoryless**, so having waited already tells you nothing about the remaining wait.
- **Beta($\\alpha, \\beta$)**: values in [0, 1]; the natural prior for a conversion rate.
- **Gamma, log-normal, Student t**: positive skewed waiting times, multiplicative effects, heavy-tailed means.
`,
  maths: `
**In one breath.**

| Distribution | Density | Mean | Variance |
|---|---|---|---|
| Uniform$(a,b)$ | $1/(b-a)$ | $(a+b)/2$ | $(b-a)^2/12$ |
| Normal$(\\mu,\\sigma^2)$ | $\\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-(x-\\mu)^2/2\\sigma^2}$ | $\\mu$ | $\\sigma^2$ |
| Exponential$(\\lambda)$ | $\\lambda e^{-\\lambda x}$ | $1/\\lambda$ | $1/\\lambda^2$ |
| Beta$(\\alpha,\\beta)$ | $\\propto x^{\\alpha-1}(1-x)^{\\beta-1}$ | $\\frac{\\alpha}{\\alpha+\\beta}$ | $\\frac{\\alpha\\beta}{(\\alpha+\\beta)^2(\\alpha+\\beta+1)}$ |

**Normal rules.** 68–95–99.7 within 1, 2, 3 SDs; $P(|Z| < 1.96) = 0.95$. IQ-style example: $N(100, 15^2)$, $P(X > 130) = P(Z > 2) = 0.0228$.

**Exponential.** $P(T > t) = e^{-\\lambda t}$. Rate 0.5 per minute: $P(T > 4) = e^{-2} = 0.135$. Memoryless: $P(T > s + t\\mid T > s) = e^{-\\lambda t}$, whatever $s$.

**Sums and transforms.** If $X\\sim N(\\mu_1, \\sigma_1^2)$, $Y\\sim N(\\mu_2, \\sigma_2^2)$ independent, $X + Y \\sim N(\\mu_1 + \\mu_2, \\sigma_1^2 + \\sigma_2^2)$. If $\\ln X$ is normal, $X$ is log-normal (incomes, session lengths). Probability integral transform: $F(X) \\sim$ Uniform(0, 1), which is how samplers turn uniforms into anything.
`,
  practice: `
**Code.** \`scipy.stats.norm(loc, scale)\` (scale is the SD, not the variance), \`expon(scale=1/λ)\` (scale is the mean), \`beta(a, b)\`; \`.cdf\`, \`.sf\`, \`.ppf\` (inverse CDF, for critical values), \`.pdf\`.

**Choosing.** Positive and right-skewed: log-normal or gamma. Bounded in [0, 1]: beta. Heavy tails: Student t. Check with a Q–Q plot rather than trusting a histogram.
`,
  traps: [
    { trap: "A density value is a probability, so it can't exceed 1.", why: "Density is probability per unit; only its integral over a range is a probability. N(0, 0.1²) has peak density about 4." },
    { trap: "scipy's norm(0, 4) has variance 4.", why: "The second argument is the scale, the standard deviation; variance 16. Similarly expon(scale=…) takes the mean 1/λ, not the rate." },
  ],
  say: {
    prompt: "What does it mean that the exponential distribution is memoryless, and where would you use it?",
    secs: 40,
    check: ["P(T > s + t | T > s) = P(T > t)", "Derivation from survival e^(−λt)", "Time between events of a Poisson process", "Constant hazard rate", "Limits: real waiting times often have changing hazard (Weibull, gamma)"],
    followups: [
      { q: "What is the only memoryless discrete distribution?", a: "The geometric." },
      { q: "What fraction of a normal lies beyond 2 SDs on one side?", a: "About 2.3%." },
      { q: "Why is the beta a natural prior for a conversion rate?", a: "It lives on [0, 1] and is conjugate to the binomial: Beta(α, β) prior plus k successes in n gives Beta(α + k, β + n − k)." },
    ],
    answer: `Memoryless means that if you've already waited s minutes, the distribution of the remaining wait is the same as at the start: P(T > s + t | T > s) = P(T > t). For the exponential it follows directly from the survival function e^(−λt), since the ratio e^(−λ(s+t))/e^(−λs) is e^(−λt). Equivalently its hazard rate is constant. It's the time between events in a Poisson process, so it's a first model for arrivals or failures of things that don't wear out. Real waiting times often have increasing or decreasing hazards, where a Weibull or gamma fits better.`,
    avoid: ["Confusing density with probability", "Passing the variance as scipy's scale"],
  },
  terms: [["Density", "Probability per unit; integrates to 1."], ["CDF", "F(x) = P(X ≤ x)."], ["Memoryless", "P(T > s + t | T > s) = P(T > t)."]],
  sources: [MS.scipy, MS.seeing, MS.mml],
});
Q({ id: "m-cts-1", d: 1, secs: 30, prompt: "Z ~ N(0, 1). P(|Z| < 1.96)? (3 decimals)", answer: 0.95, tol: 0.002, explain: "The two-sided 95% range.", py: "from scipy import stats\nanswer = float(stats.norm.cdf(1.96)-stats.norm.cdf(-1.96))", packages: SP });
Q({ id: "m-cts-2", d: 1, secs: 45, prompt: "Scores ~ N(100, 15²). P(score > 130)? (4 decimals)", answer: 0.0228, tol: 0.0002, explain: "z = 2; upper tail 0.0228.", py: "from scipy import stats\nanswer = float(stats.norm.sf(130,100,15))", packages: SP });
Q({ id: "m-cts-3", d: 2, secs: 45, prompt: "Gaps between arrivals are exponential with rate 0.5 per minute. P(gap > 4 minutes)? (3 decimals)", answer: 0.135, tol: 0.002, explain: "e^(−0.5 × 4) = e⁻².", py: "from scipy import stats\nanswer = float(stats.expon.sf(4,scale=2))", packages: SP });
Q({ id: "m-cts-4", d: 2, secs: 45, prompt: "Exponential lifetime with mean 3 years. Given it has lasted 2 years, P(it lasts more than 5 in total)? (3 decimals)", answer: 0.368, tol: 0.002, explain: "Memoryless: P(T > 3) = e⁻¹.", py: "from scipy import stats\nd=stats.expon(scale=3)\nanswer = float(d.sf(5)/d.sf(2))", packages: SP });
Q({ id: "m-cts-5", d: 1, secs: 30, prompt: "Variance of Uniform(0, 1)? (4 decimals)", answer: 0.0833, tol: 0.0002, explain: "(b − a)²/12 = 1/12.", py: "from scipy import stats\nanswer = float(stats.uniform.var())", packages: SP });
C("m-cts-c1", "Normal tail landmarks", "68/95/99.7 at 1/2/3 SD; one-sided beyond 2 SD ≈ 2.3%.");
C("m-cts-c2", "scipy parameters", "norm(loc=μ, scale=σ); expon(scale=1/λ).");

L("m-joint", PR, "Joint and marginal distributions, covariance and correlation", "Reading a joint table, conditioning on one variable, and what covariance does and doesn't capture.", {
  kind: "concept", mins: 20, prereq: ["m-random-vars", "m-conditional"],
  hook: "Y = X² with X symmetric around zero. Y is completely determined by X, yet their correlation is 0. How?",
  intuition: `
**The situation.** Features come in pairs and groups. To reason about two at once you need their joint behaviour, not just each one alone.

**The idea.** The **joint distribution** $P(X = x, Y = y)$ assigns probability to every combination. Summing over one variable gives the other's **marginal**. Dividing a slice by its marginal gives a **conditional**: $P(Y\\mid X = x)$.

**Covariance** $\\text{Cov}(X, Y) = E[(X - \\mu_X)(Y - \\mu_Y)]$ is positive when the two tend to be above their means together. **Correlation** divides by both SDs to land in $[-1, 1]$, unit-free.

Correlation measures only *linear* association. $Y = X^2$ with symmetric $X$ has zero correlation but total dependence. Independence implies zero covariance; zero covariance does not imply independence (except for jointly normal variables).
`,
  maths: `
**In one breath.** $P(x) = \\sum_y P(x, y)$; $P(y\\mid x) = P(x, y)/P(x)$; $\\text{Cov}(X,Y) = E[XY] - E[X]E[Y]$; $\\rho = \\text{Cov}/(\\sigma_X\\sigma_Y)$; covariance matrix $\\Sigma = E[(x - \\mu)(x - \\mu)^\\top]$, PSD; $\\text{Var}(a^\\top x) = a^\\top\\Sigma a$.

**Worked example.** Joint table:

| | $Y = 0$ | $Y = 1$ | marginal of $X$ |
|---|---|---|---|
| $X = 0$ | 0.4 | 0.1 | 0.5 |
| $X = 1$ | 0.2 | 0.3 | 0.5 |
| marginal of $Y$ | 0.6 | 0.4 | 1 |

$E[X] = 0.5$, $E[Y] = 0.4$, $E[XY] = P(1,1) = 0.3$, so $\\text{Cov} = 0.3 - 0.2 = 0.1$. $\\sigma_X = 0.5$, $\\sigma_Y = \\sqrt{0.24} = 0.490$, $\\rho = 0.408$. Conditional: $P(Y = 1\\mid X = 1) = 0.3/0.5 = 0.6$ versus $0.1/0.5 = 0.2$ when $X = 0$.

**Zero correlation, full dependence.** $X$ uniform on $\\{-1, 0, 1\\}$, $Y = X^2$: $E[XY] = E[X^3] = 0 = E[X]E[Y]$.

**Portfolio / feature combination.** $\\text{Var}(X - Y)$ with $\\text{Var}X = 4$, $\\text{Var}Y = 9$, $\\text{Cov} = 2$: $4 + 9 - 4 = 9$.

**Bivariate normal.** $E[Y\\mid X = x] = \\mu_Y + \\rho\\frac{\\sigma_Y}{\\sigma_X}(x - \\mu_X)$: the regression line, and the origin of "regression to the mean" ($|\\rho| < 1$ pulls predictions towards the mean).
`,
  practice: `
**In ML.** Correlation matrices for feature screening (only catch linear redundancy; use mutual information or tree importances for non-linear). Covariance matrices drive PCA, Mahalanobis distance and Gaussian models. Spearman (rank) correlation for monotone but non-linear relationships and outliers.

**Code.** \`np.cov(X, rowvar=False)\` (divides by $n - 1$), \`np.corrcoef\`, \`scipy.stats.pearsonr\` / \`spearmanr\`.
`,
  traps: [
    { trap: "Zero correlation means independent.", why: "It means no linear relationship. $Y = X^2$ is a counterexample. Only for jointly Gaussian variables are the two equivalent." },
    { trap: "A larger covariance means a stronger relationship.", why: "Covariance has units and scales with each variable. Compare correlations instead." },
  ],
  say: {
    prompt: "What's the difference between covariance, correlation and independence?",
    secs: 45,
    check: ["Covariance = E[XY] − E X E Y, has units", "Correlation = scaled covariance in [−1, 1]", "Both linear only", "Independence ⇒ zero covariance, not conversely (Y = X²)", "Gaussian exception; alternatives: Spearman, mutual information"],
    followups: [
      { q: "When does zero correlation imply independence?", a: "When the variables are jointly normal." },
      { q: "Correlation of X and 3X + 2?", a: "1: positive linear transformations keep correlation at 1." },
      { q: "How would you detect a non-linear dependence?", a: "Scatter plot, Spearman for monotone relations, mutual information or a flexible model's predictive gain." },
    ],
    answer: `Covariance measures whether two variables move above and below their means together; it's E[XY] − E[X]E[Y] and carries the units of both, so its size is hard to read. Correlation divides by both standard deviations, giving a unit-free number between −1 and 1. Both only capture linear association. Independence is much stronger: the joint distribution factorises. Independence implies zero covariance, but not the reverse: if X is symmetric around zero and Y = X², the correlation is zero although Y is a function of X. The exception is jointly Gaussian variables, where zero correlation does mean independence.`,
    avoid: ["Equating zero correlation with independence", "Comparing raw covariances across scales"],
  },
  terms: [["Marginal", "Sum or integrate the joint over the other variable."], ["Covariance", "E[(X − μX)(Y − μY)]."], ["Correlation", "Covariance / (σX σY)."]],
  sources: [MS.seeing, MS.mml, MS.dlb],
});
const JT = "import numpy as np\nP=np.array([[0.4,0.1],[0.2,0.3]])\nx=np.array([0,1.]);y=np.array([0,1.])\npx=P.sum(1);py_=P.sum(0)\nEx=px@x;Ey=py_@y;Exy=x@P@y\n";
Q({ id: "m-jnt-1", d: 1, secs: 30, prompt: "Joint table P(X=0,Y=0) = 0.4, P(0,1) = 0.1, P(1,0) = 0.2, P(1,1) = 0.3. What is P(Y = 1)?", answer: 0.4, tol: 0.002, explain: "0.1 + 0.3.", py: JT + "answer = float(py_[1])", packages: NP });
Q({ id: "m-jnt-2", d: 2, secs: 45, prompt: "Same table. Cov(X, Y)?", answer: 0.1, tol: 0.002, explain: "E[XY] − E[X]E[Y] = 0.3 − 0.5 × 0.4.", py: JT + "answer = float(Exy-Ex*Ey)", packages: NP });
Q({ id: "m-jnt-3", d: 2, secs: 60, prompt: "Same table. Correlation of X and Y? (3 decimals)", answer: 0.408, tol: 0.002, explain: "0.1/(0.5 × √0.24).", py: JT + "vx=px@x**2-Ex**2;vy=py_@y**2-Ey**2\nanswer = float((Exy-Ex*Ey)/np.sqrt(vx*vy))", packages: NP });
Q({ id: "m-jnt-4", d: 1, secs: 30, prompt: "Same table. P(Y = 1 | X = 1)?", answer: 0.6, tol: 0.002, explain: "0.3/0.5.", py: JT + "answer = float(P[1,1]/px[1])", packages: NP });
Q({ id: "m-jnt-5", d: 2, secs: 45, prompt: "X is uniform on {−1, 0, 1} and Y = X². Their correlation is:", options: ["1", "−1", "0", "Undefined"], answer: 2, explain: "Cov = E[X³] − E[X]E[X²] = 0, although Y depends on X completely.", py: "from fractions import Fraction as F\nxs=[-1,0,1]\nE=lambda f:F(sum(f(x) for x in xs),3)\ncov=E(lambda x:x*x*x)-E(lambda x:x)*E(lambda x:x*x)\nanswer = 2 if cov==0 else 0" });
Q({ id: "m-jnt-6", d: 2, secs: 45, prompt: "Var X = 4, Var Y = 9, Cov(X, Y) = 2. What is Var(X − Y)?", answer: 9, tol: 0.01, explain: "4 + 9 − 2 × 2.", py: "import numpy as np\nS=np.array([[4,2],[2,9.]]);a=np.array([1,-1.])\nanswer = float(a@S@a)", packages: NP });
C("m-jnt-c1", "Zero correlation ≠ independence", "Y = X² with symmetric X; equivalent only for jointly normal.");
C("m-jnt-c2", "Variance of a combination", "Var(aᵀx) = aᵀΣa.");

L("m-lln-clt", PR, "Law of large numbers and the central limit theorem", "Why averages settle down, why they look normal, and how fast: the σ/√n rule behind every confidence interval.", {
  kind: "concept", mins: 25, prereq: ["m-random-vars", "m-continuous"],
  hook: "Revenue per user is wildly skewed, yet the A/B test's z-test on mean revenue works. Why is that allowed?",
  intuition: `
**The situation.** Almost every inference you run (confidence intervals, A/B tests, error bars on a metric) rests on the behaviour of averages.

**The ideas.**

- **Law of large numbers (LLN)**: the sample mean of iid draws converges to the true mean as $n$ grows. Averages stabilise.
- **Central limit theorem (CLT)**: the *error* of the sample mean, scaled by $\\sqrt n$, becomes normal, whatever the original distribution (as long as its variance is finite). So $\\bar X \\approx N(\\mu, \\sigma^2/n)$.

The spread of the mean, the **standard error** $\\sigma/\\sqrt n$, shrinks slowly: to halve it you need four times the data.

Skewed data needs larger $n$ before the normal approximation is good (heavy revenue tails might need thousands), and if the variance is infinite (Cauchy, some power laws) the CLT fails completely.
`,
  maths: `
**In one breath.** $\\bar X_n \\to \\mu$ (LLN); $\\sqrt n(\\bar X_n - \\mu)/\\sigma \\to N(0, 1)$ (CLT); $\\text{SE}(\\bar X) = \\sigma/\\sqrt n$; proportion SE $= \\sqrt{p(1-p)/n}$; Chebyshev $P(|X - \\mu| \\ge k\\sigma) \\le 1/k^2$ for any distribution.

**Worked example: 100 die rolls.** Mean of one roll 3.5, SD $\\sqrt{35/12} = 1.708$. The average of 100 rolls has SE $0.171$. The *sum* has mean 350 and SD $17.08$; $P(\\text{sum} > 370) \\approx P(Z > (370.5 - 350)/17.08) = P(Z > 1.20) = 0.115$ (exact: 0.115).

**Worked example: coin.** 400 fair tosses: mean 200 heads, SD 10. $P(\\ge 220\\text{ heads}) \\approx P(Z > 1.95) = 0.026$ (exact binomial 0.0255).

**Sample size for a precision.** To estimate a proportion near 0.5 with SE 0.01: $n = 0.25/0.01^2 = 2{,}500$. For a 95% margin of error of ±1 point: $n = 1.96^2 \\times 0.25/0.01^2 = 9{,}604$.

| $n$ multiplied by | SE multiplied by |
|---|---|
| 4 | 1/2 |
| 100 | 1/10 |
| 2 | 0.707 |

**Continuity correction.** Approximating a discrete count by a normal, move half a unit: $P(X \\ge 220) \\approx P(Y > 219.5)$.
`,
  practice: `
**Where it shows up.** Every z/t-test, every confidence interval, every A/B test readout, bootstrap justifications, SGD (mini-batch gradients are averages, noise $\\propto 1/\\sqrt B$), Monte Carlo error $\\propto 1/\\sqrt{\\text{samples}}$.

**When to worry.** Few observations with heavy tails, strong dependence between observations (clustered users, time series), and statistics that aren't means (medians, quantiles, ratios) where you need the delta method or bootstrap.
`,
  traps: [
    { trap: "The CLT says the data become normal with enough samples.", why: "The data keep whatever shape they have. The distribution of the *sample mean* approaches normal." },
    { trap: "n = 30 is always enough for the CLT.", why: "It's a rule of thumb for mildly skewed data. Revenue or latency with heavy tails can need thousands; infinite-variance data never converge." },
  ],
  say: {
    prompt: "State the central limit theorem and explain why it matters for A/B testing.",
    secs: 45,
    check: ["Sample mean of iid, finite-variance draws ≈ N(μ, σ²/n)", "Regardless of original shape", "SE = σ/√n: 4× data halves the error", "Justifies z/t tests and intervals on metric means", "Caveats: skew needs larger n, dependence, infinite variance, non-mean statistics"],
    followups: [
      { q: "What is the difference between the LLN and the CLT?", a: "LLN: the sample mean converges to μ. CLT: describes the distribution of its error, normal with SD σ/√n." },
      { q: "How many samples for a ±1-point 95% margin on a proportion near 50%?", a: "About 9,604." },
      { q: "What breaks the CLT?", a: "Infinite variance (Cauchy), strong dependence between observations, or too few samples for heavy-tailed data." },
    ],
    answer: `The CLT says that if you average n independent draws from a distribution with finite variance, the sample mean is approximately normal with mean μ and standard deviation σ/√n, whatever the original distribution looks like. That's what lets an A/B test compare mean revenue or conversion with a z- or t-test even though individual revenue is very skewed: the test is about the means, and those are close to normal at typical sample sizes. It also tells you precision grows slowly, since halving the error needs four times the users. The caveats are heavy tails, which need much larger samples or capping, dependence between observations such as several sessions per user, and infinite-variance data, where it doesn't apply.`,
    avoid: ["Saying the data become normal", "Treating n = 30 as universal"],
  },
  terms: [["LLN", "Sample mean → true mean."], ["CLT", "Sample mean ≈ N(μ, σ²/n) for large n."], ["Standard error", "SD of an estimator; σ/√n for a mean."]],
  sources: [MS.seeing, MS.islr, MS.scipy],
});
Q({ id: "m-clt-1", d: 1, secs: 45, prompt: "Standard error of the average of 100 fair-die rolls? (3 decimals)", answer: 0.171, tol: 0.002, explain: "√(35/12)/10.", py: "from scipy import stats\nanswer = float(stats.randint(1,7).std()/10)", packages: SP });
Q({ id: "m-clt-2", d: 2, secs: 60, prompt: "Sum of 100 fair-die rolls. P(sum > 370)? (3 decimals)", answer: 0.115, tol: 0.002, explain: "Mean 350, SD 17.08; with continuity correction z = 20.5/17.08 = 1.20. The exact value is also 0.115.", py: "import numpy as np\nd=np.ones(6)/6;s=np.array([1.])\nfor _ in range(100): s=np.convolve(s,d)\nanswer = float(s[371-100:].sum())", packages: NP });
Q({ id: "m-clt-3", d: 2, secs: 45, prompt: "400 fair coin tosses. P(at least 220 heads)? (3 decimals)", answer: 0.026, tol: 0.002, explain: "Mean 200, SD 10; z = 19.5/10 = 1.95 → 0.0256 (exact 0.0255).", py: "from scipy import stats\nanswer = float(stats.binom.sf(219,400,0.5))", packages: SP });
Q({ id: "m-clt-4", d: 2, secs: 45, prompt: "Smallest n so that a proportion near 0.5 has standard error at most 0.01?", answer: 2500, tol: 0.5, explain: "√(0.25/n) ≤ 0.01 ⇒ n ≥ 2,500.", py: "import math\nanswer = math.ceil(0.25/0.01**2)" });
Q({ id: "m-clt-5", d: 1, secs: 30, prompt: "You quadruple the sample size. The standard error of the mean is multiplied by:", answer: 0.5, tol: 0.01, explain: "1/√4.", py: "answer = 1/4**0.5" });
Q({ id: "m-clt-6", d: 2, secs: 45, prompt: "For which distribution does the CLT not apply to sample means?", options: ["Exponential", "Bernoulli", "Cauchy", "Log-normal"], answer: 2, explain: "The Cauchy has no finite mean or variance; its sample mean is Cauchy for every n.", py: "from scipy import stats\nimport math\nv=[stats.expon.var(),stats.bernoulli(0.3).var(),stats.cauchy.var(),stats.lognorm(1).var()]\nanswer = [i for i,x in enumerate(v) if not math.isfinite(x)][0]", packages: SP });
C("m-clt-c1", "SE rule", "σ/√n: 4× data halves the error.");
C("m-clt-c2", "What the CLT is about", "The sample mean's distribution, not the data's.");
