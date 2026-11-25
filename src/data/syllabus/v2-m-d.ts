/**
 * v2 Maths for ML, part D: Probability practice (puzzle-style lessons) and the module interview.
 */
import { iq, lessonWriter } from "./v2-shared";
import { MS } from "./v2-m-src";

const { L, Q, C } = lessonWriter("maths");
const PR = "Probability";
const NP = ["numpy"];
const SP = ["numpy", "scipy"];

L("m-coins-dice", PR, "Practice: coins, dice, cards and urns", "A repeatable method for classic counting puzzles: enumerate, use symmetry, take complements, condition step by step.", {
  kind: "concept", mins: 25, prereq: ["m-prob-axioms", "m-conditional"],
  hook: "A deck is shuffled. What is the chance the 10th card is an ace? If you started conditioning on the first nine cards, there's a faster way.",
  intuition: `
**The situation.** Quant, analyst and data-science screens love small puzzles with coins, dice, cards and urns. They test whether you set up a sample space cleanly under time pressure.

**A four-step method.**

1. **Name the sample space** and check its outcomes are equally likely (ordered dice pairs, ordered or unordered hands, consistently).
2. **Look for symmetry.** Every position in a shuffled deck is equally likely to hold any card, so P(10th card is an ace) = 4/52. Two players rolling: P(A higher) = P(B higher) = (1 − P(tie))/2.
3. **Complement** for "at least one", **multiply** step by step for sequences without replacement.
4. **Sanity-check** with a tiny case, a bound or a quick simulation.
`,
  maths: `
**Worked examples.**

| Puzzle | Set-up | Answer |
|---|---|---|
| Two dice sum to 8 | (2,6), (3,5), (4,4), (5,3), (6,2) of 36 | $5/36 = 0.139$ |
| At least two heads in 5 tosses | $1 - P(0) - P(1) = 1 - 6/32$ | $0.8125$ |
| Urn 5 red, 3 blue, draw 2: one of each | $5\\cdot3/\\binom82$ | $15/28 = 0.536$ |
| Flush (incl. straight flushes) | $4\\binom{13}{5}/\\binom{52}{5}$ | $0.00198$ |
| You roll higher than an opponent | $(1 - 1/6)/2$ | $5/12 = 0.417$ |
| 10th card is an ace | symmetry | $1/13 = 0.077$ |

**Maximum of two dice.** $P(\\max \\le k) = (k/6)^2$, so $P(\\max = k) = (2k - 1)/36$ and $E[\\max] = \\sum k(2k-1)/36 = 161/36 = 4.47$. Using the CDF of a maximum (or $1 -$ CDF for a minimum) is a standard move.

**Urns with replacement vs without.** With replacement, draws are independent (binomial); without, use hypergeometric counts or multiply conditional probabilities: $P(\\text{red, red}) = \\frac58\\cdot\\frac47 = \\frac{5}{14}$.

**Unordered vs ordered.** Either count both numerator and denominator as ordered, or both as unordered. Mixing them is the most common slip.
`,
  practice: `
**Out loud.** State the sample space, say "by symmetry" or "by the complement", compute, then check against intuition (is it below 1? does it move the right way if you add a card?). Interviewers care as much about the set-up as the number.

**Simulation as a check.** Twenty lines of numpy with a fixed seed confirms most puzzle answers to two decimals, which is worth doing when preparing.
`,
  traps: [
    { trap: "Count unordered outcomes in the numerator and ordered ones in the denominator.", why: "Be consistent. For two dice, (3, 5) and (5, 3) are different outcomes among 36 ordered pairs." },
    { trap: "The 10th card depends on what came before, so you must condition on the first nine.", why: "Unconditionally every position is exchangeable: each card is equally likely to be anywhere, so it's 4/52." },
  ],
  say: {
    prompt: "You and a friend each roll a fair die. What's the probability your roll is strictly higher? Explain your method.",
    secs: 40,
    check: ["Sample space of 36 equally likely ordered pairs", "P(tie) = 6/36", "Symmetry: P(you higher) = P(friend higher)", "(1 − 1/6)/2 = 5/12", "Sanity check by counting 15 favourable pairs"],
    followups: [
      { q: "What if you roll two dice and take the max, against their one die?", a: "$P(\\max = k) = (2k-1)/36$; sum over $k$ of $P(\\max = k)\\,(k-1)/6$ gives $\\frac{1}{216}\\sum (2k-1)(k-1) = 125/216 \\approx 0.579$." },
      { q: "Probability the two dice match?", a: "1/6." },
      { q: "Expected value of the higher of the two dice?", a: "161/36 ≈ 4.47." },
    ],
    answer: `There are 36 equally likely ordered pairs. Six are ties, so there's a 30/36 chance someone is strictly higher, and by symmetry it's equally likely to be me or my friend. So my chance is 15/36 = 5/12, about 0.42. As a check, count directly: if they roll 1 I win with 5 values, if 2 with 4, and so on down to 0, giving 15 favourable pairs.`,
    avoid: ["Answering 1/2 by ignoring ties", "Mixing ordered and unordered counts"],
  },
  terms: [["Exchangeability", "Any ordering of the draws is equally likely; positions are symmetric."], ["Complement", "P(at least one) = 1 − P(none)."], ["CDF of a maximum", "P(max ≤ k) = ∏ P(Xᵢ ≤ k)."]],
  sources: [MS.seeing, MS.scipy],
});
Q({ id: "m-cdc-1", d: 1, secs: 30, prompt: "Two fair dice. P(total is 8)? (3 decimals)", answer: 0.139, tol: 0.002, explain: "5/36.", py: "from itertools import product\nanswer = sum(a+b==8 for a,b in product(range(1,7),repeat=2))/36" });
Q({ id: "m-cdc-2", d: 1, secs: 45, prompt: "5 fair coin tosses. P(at least two heads)? (4 decimals)", answer: 0.8125, tol: 0.0002, explain: "1 − (1 + 5)/32 = 26/32.", py: "from itertools import product\nanswer = sum(t.count('H')>=2 for t in product('HT',repeat=5))/32" });
Q({ id: "m-cdc-3", d: 2, secs: 45, prompt: "An urn has 5 red and 3 blue balls. Draw 2 without replacement. P(one of each colour)? (3 decimals)", answer: 0.536, tol: 0.002, explain: "5 × 3/C(8, 2) = 15/28.", py: "from itertools import combinations\nballs='RRRRRBBB'\npairs=list(combinations(range(8),2))\nanswer = sum(balls[i]!=balls[j] for i,j in pairs)/len(pairs)" });
Q({ id: "m-cdc-4", d: 2, secs: 60, prompt: "P(a 5-card hand is a flush, including straight flushes)? (5 decimals)", answer: 0.00198, tol: 0.00002, explain: "4 × C(13, 5)/C(52, 5) = 5,148/2,598,960.", py: "from math import comb\nanswer = 4*comb(13,5)/comb(52,5)" });
Q({ id: "m-cdc-5", d: 2, secs: 45, prompt: "A standard deck is shuffled. P(the 10th card is an ace)? (4 decimals)", answer: 0.0769, tol: 0.0002, explain: "By symmetry 4/52 = 1/13.", py: "from fractions import Fraction as F\nfrom math import comb\np=sum(F(comb(4,j)*comb(48,9-j),comb(52,9))*F(4-j,43) for j in range(5))\nanswer = float(p)" });
Q({ id: "m-cdc-6", d: 2, secs: 60, prompt: "Expected value of the larger of two fair dice? (3 decimals)", answer: 4.472, tol: 0.002, explain: "Σ k(2k − 1)/36 = 161/36.", py: "from itertools import product\nfrom fractions import Fraction as F\nanswer = float(F(sum(max(a,b) for a,b in product(range(1,7),repeat=2)),36))" });
C("m-cdc-c1", "Position in a shuffled deck", "Every position is exchangeable: P(kth card is an ace) = 4/52.");
C("m-cdc-c2", "Max of n dice", "P(max ≤ k) = (k/6)ⁿ.");

L("m-ev-puzzles", PR, "Practice: expected-value puzzles", "Indicator variables, first-step analysis, optimal stopping and the coupon collector.", {
  kind: "concept", mins: 25, prereq: ["m-random-vars"],
  hook: "You roll a die and may re-roll once, keeping the second result. What's your strategy and its expected value?",
  intuition: `
**The situation.** "What's the expected number of …?" questions look hard if you try to find the whole distribution. You almost never need it.

**Four tools.**

1. **Indicators + linearity.** Write the count as a sum of 0/1 variables and add their probabilities. Dependence doesn't matter.
2. **First-step analysis.** Condition on what happens first, write an equation for the expectation in terms of itself, solve.
3. **Backward induction** for games with choices: work out the value of the last decision first, then decide earlier moves by comparing with it.
4. **Break into stages** with geometric waiting times (coupon collector).
`,
  maths: `
**Re-roll game (backward induction).** If you re-roll, you get 3.5 on average. So keep a first roll of 4, 5 or 6, re-roll 1–3:

$$E = \\tfrac16(4 + 5 + 6) + \\tfrac36(3.5) = 2.5 + 1.75 = 4.25$$

With two re-rolls allowed, keep 5 or 6 on the first roll (since the rest is worth 4.25): $E = \\frac16(11) + \\frac46(4.25) = 4.67$.

**Coupon collector.** Collecting all $n$ types, the wait for the $k$-th new type is geometric with success probability $(n - k + 1)/n$:

$$E[T] = n\\left(1 + \\tfrac12 + \\cdots + \\tfrac1n\\right) = nH_n$$

For a die, $6 \\times 2.45 = 14.7$ rolls.

**Indicators.** 10 balls into 10 boxes at random: each box is empty with probability $0.9^{10}$, so the expected number of empty boxes is $10 \\times 0.9^{10} = 3.49$. Among 30 people, the expected number of pairs sharing a birthday is $\\binom{30}{2}/365 = 1.19$.

**First-step analysis.** Expected tosses until the first head: $E = 1 + \\frac12\\cdot0 + \\frac12 E \\Rightarrow E = 2$. Expected heads before the first tail: $E = \\frac12(1 + E) \\Rightarrow E = 1$.

| Tool | Signal in the question |
|---|---|
| Indicators | "expected number of …" with many symmetric parts |
| First-step | "until …", repeated trials, states |
| Backward induction | you choose to stop or continue |
| Stages | "collect all", "see every" |
`,
  practice: `
**In data science.** Coupon-collector logic estimates how many samples you need to see every category or every user; indicator sums give expected collisions or duplicates; optimal stopping appears in bandits and in deciding when to stop an experiment (with the caveats of sequential testing).
`,
  traps: [
    { trap: "To find an expected count you need its distribution.", why: "Linearity over indicators gives the mean directly, without independence." },
    { trap: "In the re-roll game, re-roll anything below the maximum.", why: "Compare with the value of continuing (3.5): keep 4 or more. Re-rolling a 4 or 5 lowers your expectation." },
  ],
  say: {
    prompt: "You roll a die and can re-roll once, keeping the second roll. What's the optimal strategy and expected payoff? What if you get two re-rolls?",
    secs: 60,
    check: ["Value of re-rolling = 3.5", "Keep 4, 5, 6; re-roll 1–3", "EV = (4 + 5 + 6)/6 + (1/2)(3.5) = 4.25", "Two re-rolls: threshold vs 4.25 → keep 5, 6", "EV = 11/6 + (4/6)(4.25) ≈ 4.67"],
    followups: [
      { q: "Expected rolls to see all six faces?", a: "6(1 + 1/2 + … + 1/6) = 14.7." },
      { q: "Expected number of empty boxes when n balls go into n boxes?", a: "$n(1 - 1/n)^n \\approx n/e$." },
      { q: "What principle are you using?", a: "Backward induction: solve the last decision, then compare each earlier option with the value of continuing." },
    ],
    answer: `Work backwards. On the final roll you just take what comes, worth 3.5 on average. So on the first roll I keep anything above 3.5, meaning 4, 5 or 6, and re-roll 1, 2 or 3. That's worth (4 + 5 + 6)/6 plus half of 3.5, which is 2.5 + 1.75 = 4.25.

With two re-rolls, continuing after the first roll is worth 4.25, so I only keep a 5 or 6 on the first roll: 11/6 + (4/6)(4.25) ≈ 4.67.`,
    avoid: ["Re-rolling 4s or 5s on the last decision", "Not stating the threshold rule"],
  },
  terms: [["Indicator variable", "1 if an event happens, else 0."], ["First-step analysis", "Condition on the first move to get a self-referential equation."], ["Coupon collector", "Expected draws to see all n types: nHₙ."]],
  sources: [MS.seeing],
});
Q({ id: "m-evp-1", d: 2, secs: 60, prompt: "Roll a die; you may re-roll once and must keep the second roll. Expected value with optimal play?", answer: 4.25, tol: 0.01, explain: "Keep 4–6, re-roll 1–3: 15/6 + 1.75.", py: "from fractions import Fraction as F\nv=F(7,2)\nanswer = float(sum(max(F(k),v) for k in range(1,7))/6)" });
Q({ id: "m-evp-2", d: 2, secs: 60, prompt: "Expected number of rolls of a fair die to see all six faces? (2 decimals)", answer: 14.7, tol: 0.01, explain: "6H₆ = 6 × 49/20.", py: "from fractions import Fraction as F\nanswer = float(6*sum(F(1,k) for k in range(1,7)))" });
Q({ id: "m-evp-3", d: 2, secs: 45, prompt: "10 balls are placed independently and uniformly into 10 boxes. Expected number of empty boxes? (2 decimals)", answer: 3.49, tol: 0.01, explain: "10 × 0.9¹⁰ = 3.487.", py: "answer = 10*0.9**10" });
Q({ id: "m-evp-4", d: 2, secs: 45, prompt: "30 people, birthdays uniform over 365 days. Expected number of pairs sharing a birthday? (2 decimals)", answer: 1.19, tol: 0.01, explain: "C(30, 2)/365 = 435/365.", py: "from math import comb\nanswer = comb(30,2)/365" });
Q({ id: "m-evp-5", d: 3, secs: 90, prompt: "Same die game but two re-rolls are allowed. Expected value with optimal play? (3 decimals)", answer: 4.667, tol: 0.002, explain: "Keep 5–6 on the first roll: 11/6 + (4/6) × 4.25 = 14/3.", py: "from fractions import Fraction as F\nv=F(7,2)\nfor _ in range(2): v=sum(max(F(k),v) for k in range(1,7))/6\nanswer = float(v)" });
C("m-evp-c1", "Coupon collector", "E = n(1 + 1/2 + … + 1/n) ≈ n ln n.");
C("m-evp-c2", "Optimal stopping", "Stop when the current value beats the value of continuing.");

L("m-waiting", PR, "Practice: geometric and waiting-time problems", "Expected waits for patterns, gambler's ruin and Poisson-process arrivals, solved by states and first-step equations.", {
  kind: "concept", mins: 25, prereq: ["m-discrete", "m-ev-puzzles"],
  hook: "Toss a fair coin until you see HH, or until you see HT. Both patterns have probability 1/4. Do they take the same time on average?",
  intuition: `
**The situation.** "How long until …" questions: patterns in coin tosses, reaching a target, the k-th customer arriving.

**The idea.** Define **states** that capture everything that matters about the past (for HH: "nothing useful yet" and "just saw H"), then write one first-step equation per state.

**Why HH takes longer than HT.** After an H, for HH a T sends you right back to the start. For HT, an H keeps you in the "just saw H" state, so failures don't waste progress. HH needs 6 tosses on average; HT needs 4. Patterns that overlap with themselves take longer.

**Gambler's ruin.** In a fair game, the chance of reaching a target before going broke is proportional to how far you've already come: start with 3 aiming for 10 and you succeed with probability 0.3.
`,
  maths: `
**Waiting for HH.** States: $S_0$ (no progress), $S_1$ (last toss H). $E_0 = 1 + \\frac12E_1 + \\frac12E_0$, $E_1 = 1 + \\frac12\\cdot0 + \\frac12E_0$. Solve: $E_0 = 6$.

**Waiting for HT.** $E_0 = 1 + \\frac12E_1 + \\frac12E_0$, $E_1 = 1 + \\frac12E_1 + \\frac12\\cdot0 \\Rightarrow E_1 = 2$, $E_0 = 4$.

**General pattern.** For a run of $k$ heads with a fair coin: $2^{k+1} - 2$ (2, 6, 14, …). Two sixes in a row on a die: $E = 6 + 36 = 42$.

**Gambler's ruin.** Win each round with probability $p$, $q = 1 - p$, start at $i$, absorb at 0 and $N$:

$$P(\\text{reach } N) = \\begin{cases} i/N & p = \\tfrac12 \\\\ \\dfrac{1 - (q/p)^i}{1 - (q/p)^N} & p \\ne \\tfrac12 \\end{cases}$$

With $p = 0.6$, $i = 2$, $N = 5$: $\\frac{1 - (2/3)^2}{1 - (2/3)^5} = \\frac{135}{211} = 0.640$.

**Poisson-process waits.** Rate $\\lambda$: time to the first event is exponential with mean $1/\\lambda$; to the $k$-th event is gamma with mean $k/\\lambda$. At 2 per hour the third arrival is expected after 1.5 hours.

| Question | Tool | Answer |
|---|---|---|
| Rolls until a 6 | geometric | 6 |
| Tosses until HH / HT | states | 6 / 4 |
| Two sixes in a row | states | 42 |
| Fair ruin, 3 → 10 | martingale | 0.3 |
| $k$-th Poisson arrival | gamma | $k/\\lambda$ |
`,
  practice: `
**Systematise it.** Write the transition matrix $Q$ among non-absorbing states; expected steps to absorption are $(I - Q)^{-1}\\mathbf 1$ (the fundamental matrix). This turns every pattern puzzle into a small linear solve, which is also how you check your answer.

**In practice.** Customer arrivals (Poisson), retries until success (geometric, used to set timeouts and retry budgets), random walks in ranking and PageRank, and the expected time until a monitoring alert fires.
`,
  traps: [
    { trap: "HH and HT both have probability 1/4 per pair, so both take 4 tosses on average.", why: "Overlap matters: failing on HH sends you back to the start, failing on HT doesn't. HH takes 6, HT 4." },
    { trap: "In a fair game you're equally likely to win or go broke.", why: "Only if you start halfway. Fair-game success probability is start/target." },
  ],
  say: {
    prompt: "Expected number of fair coin tosses until two heads in a row. Set it up and solve.",
    secs: 60,
    check: ["Define states: start, one H", "E₀ = 1 + ½E₁ + ½E₀", "E₁ = 1 + ½·0 + ½E₀", "Solve: E₀ = 6", "Contrast with HT = 4 and why overlap matters"],
    followups: [
      { q: "Three heads in a row?", a: "14 (pattern $2^{k+1} - 2$)." },
      { q: "How would you check this numerically?", a: "Fundamental matrix $(I - Q)^{-1}\\mathbf 1$ or a seeded simulation." },
      { q: "Probability of reaching 10 from 3 in a fair ±1 game?", a: "3/10." },
    ],
    answer: `I'd track two states: no useful progress, and the last toss was a head. From the start, I spend a toss and either move to the head state or stay: E₀ = 1 + ½E₁ + ½E₀. From the head state, a head finishes and a tail sends me back: E₁ = 1 + ½E₀. Substituting gives E₀ = 6. For HT it's only 4, because a head while waiting for the tail keeps my progress instead of resetting it.`,
    avoid: ["Answering 4 for HH", "Not defining the states"],
  },
  terms: [["Absorbing state", "A state the chain never leaves."], ["Fundamental matrix", "(I − Q)⁻¹; expected visits before absorption."], ["Gambler's ruin", "Random walk absorbed at 0 or N."]],
  sources: [MS.seeing, MS.mml],
});
Q({ id: "m-wait-1", d: 2, secs: 60, prompt: "Expected fair-coin tosses until HH appears?", answer: 6, tol: 0.01, explain: "States: E₀ = 1 + ½E₁ + ½E₀, E₁ = 1 + ½E₀.", py: "import numpy as np\nQ=np.array([[0.5,0.5],[0.5,0]])\nanswer = float(np.linalg.solve(np.eye(2)-Q,np.ones(2))[0])", packages: NP });
Q({ id: "m-wait-2", d: 2, secs: 60, prompt: "Expected fair-coin tosses until HT appears?", answer: 4, tol: 0.01, explain: "E₁ = 2 (an H keeps you in place), E₀ = 4.", py: "import numpy as np\nQ=np.array([[0.5,0.5],[0,0.5]])\nanswer = float(np.linalg.solve(np.eye(2)-Q,np.ones(2))[0])", packages: NP });
Q({ id: "m-wait-3", d: 2, secs: 60, prompt: "Expected rolls of a fair die until two sixes in a row?", answer: 42, tol: 0.01, explain: "E₀ = 1 + (5/6)E₀ + (1/6)E₁, E₁ = 1 + (5/6)E₀ ⇒ 42.", py: "import numpy as np\nQ=np.array([[5/6,1/6],[5/6,0]])\nanswer = float(np.linalg.solve(np.eye(2)-Q,np.ones(2))[0])", packages: NP });
Q({ id: "m-wait-4", d: 1, secs: 30, prompt: "Fair ±1 bets. Start with 3, stop at 0 or 10. P(reaching 10)?", answer: 0.3, tol: 0.002, explain: "Fair game: i/N.", py: "import numpy as np\nN=10\nA=np.zeros((N+1,N+1));b=np.zeros(N+1)\nA[0,0]=1;A[N,N]=1;b[N]=1\nfor i in range(1,N): A[i,i]=1;A[i,i-1]=-0.5;A[i,i+1]=-0.5\nanswer = float(np.linalg.solve(A,b)[3])", packages: NP });
Q({ id: "m-wait-5", d: 3, secs: 90, prompt: "You win each ±1 round with probability 0.6. Start with 2, stop at 0 or 5. P(reaching 5)? (3 decimals)", answer: 0.64, tol: 0.002, explain: "(1 − (2/3)²)/(1 − (2/3)⁵) = 135/211 = 0.640.", py: "import numpy as np\nN=5;p=0.6\nA=np.zeros((N+1,N+1));b=np.zeros(N+1)\nA[0,0]=1;A[N,N]=1;b[N]=1\nfor i in range(1,N): A[i,i]=1;A[i,i-1]=-(1-p);A[i,i+1]=-p\nanswer = float(np.linalg.solve(A,b)[2])", packages: NP });
Q({ id: "m-wait-6", d: 1, secs: 30, prompt: "Calls arrive as a Poisson process at 2 per hour. Expected time (hours) until the third call?", answer: 1.5, tol: 0.01, explain: "Gamma(3, rate 2): mean 3/2.", py: "from scipy import stats\nanswer = float(stats.gamma(a=3,scale=0.5).mean())", packages: SP });
C("m-wait-c1", "HH vs HT", "6 vs 4 tosses: self-overlapping patterns take longer.");
C("m-wait-c2", "Fair gambler's ruin", "P(reach N from i) = i/N.");

L("m-bayes-puzzles", PR, "Practice: Bayes puzzles", "Monty Hall, the two-headed coin, the taxi-cab witness and friends, all solved with one table.", {
  kind: "concept", mins: 25, prereq: ["m-bayes"],
  hook: "Monty Hall: you pick a door, the host opens a goat door, and offers a switch. Explain in two sentences why switching wins 2/3 of the time.",
  intuition: `
**The situation.** Bayes puzzles are designed so that intuition ignores either the prior or how the evidence was generated.

**One method for all of them.** Make a table: hypotheses as rows, columns for prior, likelihood of the evidence under each hypothesis, and their product. Normalise the products. The key is the likelihood column: *how probable was what I saw, if this hypothesis were true?*

**Monty Hall.** Your first pick is right with probability 1/3. The host, who knows where the car is and always opens a goat door, never changes that: if you were wrong (2/3), the only remaining closed door has the car. With 100 doors and 98 opened, switching wins 99/100.

What matters is the **process**: if the host opened a door at random and it happened to show a goat, switching would win only 1/2.
`,
  maths: `
**Two-headed coin.** A bag has a fair coin and a two-headed coin. Pick one at random, toss, see heads.

| Hypothesis | Prior | P(H \\| hyp) | Product | Posterior |
|---|---|---|---|---|
| Two-headed | 1/2 | 1 | 1/2 | 2/3 |
| Fair | 1/2 | 1/2 | 1/4 | 1/3 |

Three heads in a row: likelihoods 1 and 1/8, posterior $1/(1 + 1/8) = 8/9$.

**Taxi cab.** 85% of cabs are green, 15% blue. A witness who is right 80% of the time says "blue". $P(\\text{blue}\\mid\\text{says blue}) = \\frac{0.15\\times0.8}{0.15\\times0.8 + 0.85\\times0.2} = \\frac{0.12}{0.29} = 0.414$.

**Defective part.** Supplier A provides 70% of chips (1% defective), B 30% (4% defective). Given a defective chip, $P(B) = \\frac{0.012}{0.007 + 0.012} = 0.632$.

**Three cards.** Cards RR, RW, WW; one is drawn and a red face shows. Count faces, not cards: three red faces, two belong to RR, so $P(\\text{other side red}) = 2/3$.

**Monty Hall table** (you pick door 1, host opens door 3):

| Car behind | Prior | P(host opens 3) | Product |
|---|---|---|---|
| 1 | 1/3 | 1/2 | 1/6 |
| 2 | 1/3 | 1 | 1/3 |
| 3 | 1/3 | 0 | 0 |

Posterior for door 2: $\\frac{1/3}{1/6 + 1/3} = 2/3$.
`,
  practice: `
**Why interviewers ask.** These map straight onto model monitoring and fraud: P(alert | fraud) is not P(fraud | alert); repeated independent signals multiply the odds; how a sample was selected (the "host's rule") changes what the data mean, which is selection bias.
`,
  traps: [
    { trap: "After the host opens a door, two doors remain, so it's 50/50.", why: "The host's choice depends on where the car is. Equal numbers of options don't mean equal probabilities; the likelihoods differ." },
    { trap: "In the three-card puzzle, the card is RR or RW, so 1/2.", why: "Seeing red is twice as likely from RR as from RW. Condition on the red face you see, not on the card." },
  ],
  say: {
    prompt: "Explain why switching wins in Monty Hall, and say what would change if the host opened a door at random.",
    secs: 45,
    check: ["First pick right with probability 1/3", "Host knows and always reveals a goat", "Switch wins whenever first pick was wrong: 2/3", "Bayes table: likelihood of the host's action differs", "Random host who happens to show a goat → 1/2"],
    followups: [
      { q: "With 100 doors and 98 opened?", a: "Switching wins 99/100." },
      { q: "Pick a coin from {fair, two-headed}, see three heads. P(two-headed)?", a: "8/9." },
      { q: "Where does this logic show up in ML?", a: "Selection effects: how data were filtered changes the likelihood of what you observe, so conditioning naively misleads." },
    ],
    answer: `My first pick is right a third of the time, and nothing the host does changes that, because he knows where the car is and always opens a goat door. In the two-thirds of cases where I picked wrong, the only other closed door must hide the car, so switching wins 2/3. In Bayes terms, if the car is behind my door the host opens either other door with probability one half, but if it's behind door 2 he must open door 3, so seeing door 3 opened favours door 2 two to one.

If the host opened a door at random and it just happened to show a goat, the likelihoods equalise and switching wins only half the time.`,
    avoid: ["“Two doors, so 50/50”", "Ignoring the host's rule"],
  },
  terms: [["Likelihood", "P(evidence | hypothesis)."], ["Posterior", "Normalised prior × likelihood."], ["Selection effect", "How the evidence was produced changes its likelihood."]],
  sources: [MS.seeing, MS.mml],
});
Q({ id: "m-bp-1", d: 1, secs: 30, prompt: "Monty Hall, standard rules. Probability that switching wins? (3 decimals)", answer: 0.667, tol: 0.002, explain: "Switch wins whenever the first pick was wrong.", py: "from fractions import Fraction as F\nwins=F(0)\nfor car in range(3):\n    pick=0\n    opts=[d for d in range(3) if d!=pick and d!=car]\n    for o in opts:\n        sw=[d for d in range(3) if d not in (pick,o)][0]\n        wins+=F(1,3)*F(1,len(opts))*(sw==car)\nanswer = float(wins)" });
Q({ id: "m-bp-2", d: 2, secs: 60, prompt: "A bag has one fair coin and one two-headed coin. Pick one at random and toss it 3 times: all heads. P(it is the two-headed coin)? (3 decimals)", answer: 0.889, tol: 0.002, explain: "Likelihoods 1 and 1/8; posterior 1/(1 + 1/8) = 8/9.", py: "from fractions import Fraction as F\na=F(1,2)*1;b=F(1,2)*F(1,8)\nanswer = float(a/(a+b))" });
Q({ id: "m-bp-3", d: 2, secs: 60, prompt: "85% of cabs are green, 15% blue. A witness, right 80% of the time, says the cab was blue. P(it was blue)? (3 decimals)", answer: 0.414, tol: 0.002, explain: "0.12/(0.12 + 0.17).", py: "from fractions import Fraction as F\nb=F(15,100)*F(8,10);g=F(85,100)*F(2,10)\nanswer = float(b/(b+g))" });
Q({ id: "m-bp-4", d: 2, secs: 60, prompt: "Supplier A sends 70% of chips (1% defective), B 30% (4% defective). A chip is defective. P(it came from B)? (3 decimals)", answer: 0.632, tol: 0.002, explain: "0.012/(0.007 + 0.012).", py: "from fractions import Fraction as F\na=F(7,10)*F(1,100);b=F(3,10)*F(4,100)\nanswer = float(b/(a+b))" });
Q({ id: "m-bp-5", d: 2, secs: 45, prompt: "Cards RR, RW and WW; one is drawn at random and placed with a random side up. It shows red. P(the other side is red)? (3 decimals)", answer: 0.667, tol: 0.002, explain: "Three red faces, two on RR.", py: "from fractions import Fraction as F\ncards=['RR','RW','WW']\nfaces=[(c,i) for c in cards for i in range(2)]\nred=[(c,i) for c,i in faces if c[i]=='R']\nanswer = float(F(sum(c[1-i]=='R' for c,i in red),len(red)))" });
Q({ id: "m-bp-6", d: 2, secs: 45, prompt: "Monty Hall with 100 doors: you pick one, the host (who knows) opens 98 goat doors. P(switching wins)?", answer: 0.99, tol: 0.002, explain: "Your first pick is right 1/100 of the time.", py: "from fractions import Fraction as F\nanswer = float(1-F(1,100))" });
C("m-bp-c1", "Bayes table", "Rows: hypotheses. Columns: prior, likelihood, product, normalised posterior.");
C("m-bp-c2", "Monty Hall hinge", "Host knows and must show a goat; random host → 1/2.");

L("m-prob-practice", PR, "Probability practice", "Six interview questions across counting, Bayes, distributions and expectation.", {
  kind: "interview", mins: 25, prereq: ["m-bayes", "m-discrete", "m-continuous", "m-lln-clt", "m-ev-puzzles"],
  hook: "Answer each out loud in about a minute, then open it and tick off what the interviewer listens for.",
}, [
  iq("A rare disease affects 1 in 1,000 people. A test has 99% sensitivity and 99% specificity. You test positive. Chance you're ill? What would you do next?", "Per 100,000: 100 ill, 99 test positive; 99,900 healthy, 999 false positives. P = 99/1,098 ≈ 9%. A second independent test multiplies the odds by LR⁺ = 99, giving about 90%. Base rate dominates; precision depends on prevalence.", ["Natural frequencies or Bayes", "≈ 9%", "Second test / odds × LR", "Names the base-rate effect"]),
  iq("How would you generate a fair coin from a biased one with unknown p?", "Von Neumann: toss twice; HT → heads, TH → tails, HH or TT → repeat. P(HT) = P(TH) = p(1 − p). Expected pairs 1/(2p(1 − p)).", ["Pairs of tosses", "Symmetry p(1 − p)", "Discard equal pairs", "Expected cost"]),
  iq("Expected number of tosses of a fair coin to get two heads in a row?", "States: E₀ = 1 + ½E₁ + ½E₀, E₁ = 1 + ½E₀ ⇒ 6. HT takes only 4 because failures don't reset progress.", ["States defined", "Equations", "6", "Contrast with HT"]),
  iq("Break a stick of length 1 at two uniform random points. Probability the three pieces form a triangle?", "Triangle iff every piece < 1/2. With the two points uniform on the unit square, the favourable region is 1/4 of the area. Answer 1/4.", ["Condition: every piece < ½", "Geometric (unit square) argument", "1/4", "Sanity check or simulation"]),
  iq("When would you use a Poisson versus a negative binomial model for counts?", "Poisson: independent events at a constant rate, mean = variance. If variance ≫ mean (overdispersion from heterogeneous users or bursts), use a negative binomial, which is a Poisson whose rate varies (gamma-distributed). Check with dispersion ratio or residuals.", ["Poisson assumptions", "Mean = variance", "Overdispersion → NB", "How to check"]),
  iq("You have a stream of unknown length. How do you sample one item uniformly at random in one pass with O(1) memory?", "Reservoir sampling: keep the i-th item with probability 1/i, replacing the current choice. Induction: an item seen at step k survives with probability (1/k) × ∏_{i>k}(1 − 1/i) = 1/n. Generalises to k items.", ["Keep item i with prob 1/i", "Proof that each item ends with 1/n", "O(1) memory", "Extension to k items"]),
]);
