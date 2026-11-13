import type { OaSet } from "@/lib/types";

/**
 * OA sets mirror the structure students reported, not the questions. Items are practice
 * questions written for this bank.
 */
export const OA_SETS: OaSet[] = [
  {
    id: "oa-analyst",
    title: "Analyst OA: aptitude + probability + SQL + Python",
    mirrors: "Structure reported for a product-analyst OA: aptitude and probability MCQs, then SQL, then one Python question",
    minutes: 30,
    tracks: ["ecommerce", "apm"],
    codingIds: ["sql-never-ordered", "sql-top3-per-dept", "py-two-sum"],
    items: [
      { id: "a1", topic: "Percentages", prompt: "A price rises 20%, then falls 20%. Net change in %?", answer: -4, tol: 0.01, explain: "1.2 × 0.8 = 0.96, so −4%." },
      { id: "a2", topic: "Time & work", prompt: "A finishes a job in 12 days, B in 18. Days to finish together?", answer: 7.2, tol: 0.01, explain: "1/12 + 1/18 = 5/36, so 36/5 = 7.2 days." },
      { id: "a3", topic: "Time-speed-distance", prompt: "A 150 m train passes a pole in 10 s. Seconds to cross a 300 m platform?", answer: 30, tol: 0.01, explain: "Speed 15 m/s; distance 450 m; 30 s." },
      { id: "a4", topic: "P&C", prompt: "Distinct arrangements of the letters of LEVEL?", answer: 30, tol: 0, explain: "5! / (2! · 2!) = 30." },
      { id: "a5", topic: "Probability", prompt: "Two fair dice. P(sum = 8)?", options: ["1/9", "5/36", "1/6", "7/36"], answer: 1, explain: "(2,6),(3,5),(4,4),(5,3),(6,2): 5 of 36." },
      { id: "a6", topic: "Profit & loss", prompt: "Cost ₹800, marked 25% above cost, sold at 10% discount. Profit %?", answer: 12.5, tol: 0.01, explain: "Marked 1000, sold 900, profit 100 on 800." },
      { id: "a7", topic: "Interest", prompt: "₹10,000 at 10% for 2 years. Compound interest minus simple interest (₹)?", answer: 100, tol: 0.01, explain: "CI 2,100; SI 2,000." },
      { id: "a8", topic: "Mixtures", prompt: "40 L of milk:water at 3:1. Litres of water to add to make it 3:2?", answer: 10, tol: 0.01, explain: "Milk 30, water 10 → water must be 20." },
      { id: "a9", topic: "Series", prompt: "2, 6, 12, 20, 30, ?", answer: 42, tol: 0, explain: "n(n+1): 6 × 7." },
      { id: "a10", topic: "Logical reasoning", prompt: "All A are B. Some B are C. Does 'some A are C' follow?", options: ["Yes", "No", "Only if all B are A", "Cannot say without numbers"], answer: 1, explain: "The B that are C need not be A." },
      { id: "a11", topic: "Data interpretation", prompt: "Quarterly revenue: 120, 150, 135, 180. Which quarter had the highest QoQ growth?", options: ["Q2", "Q3", "Q4", "Q2 and Q4 tie"], answer: 2, explain: "Q2 +25%, Q3 −10%, Q4 +33.3%." },
      { id: "a12", topic: "Probability", prompt: "Draw 2 cards without replacement. P(both aces) = 1/x. x?", answer: 221, tol: 0, explain: "(4/52)(3/51) = 1/221." },
      { id: "a13", topic: "Probability", prompt: "Disease prevalence 1%, sensitivity 99%, false-positive rate 5%. P(disease | positive) in %? (1 decimal)", answer: 16.7, tol: 0.1, explain: "0.0099 / (0.0099 + 0.0495) = 16.7%." },
      { id: "a14", topic: "Statistics", prompt: "Mean is greater than median. The distribution is most likely…", options: ["left-skewed", "right-skewed", "symmetric", "bimodal"], answer: 1, explain: "A long right tail pulls the mean above the median, as with incomes." },
    ],
  },
  {
    id: "oa-consulting",
    title: "Consulting aptitude sprint",
    mirrors: "Aptitude, logical reasoning and data interpretation, as in analytics-consulting first rounds",
    minutes: 15,
    tracks: ["consulting"],
    codingIds: [],
    items: [
      { id: "b1", topic: "Averages", prompt: "Drive out at 60 km/h and back at 40 km/h. Average speed (km/h)?", answer: 48, tol: 0.01, explain: "Harmonic mean: 2·60·40 / 100." },
      { id: "b2", topic: "Clocks", prompt: "Angle between the clock hands at 3:15, in degrees?", answer: 7.5, tol: 0.01, explain: "|30·3 − 5.5·15| = 7.5." },
      { id: "b3", topic: "Puzzles", prompt: "25 horses, 5 tracks, no timer. Fewest races to find the top 3?", answer: 7, tol: 0, explain: "5 heats, 1 race of winners, 1 final among the 5 remaining candidates." },
      { id: "b4", topic: "Puzzles", prompt: "A bat and a ball cost ₹110. The bat costs ₹100 more than the ball. Ball price (₹)?", answer: 5, tol: 0, explain: "b + (b + 100) = 110." },
      { id: "b5", topic: "Counting", prompt: "Handshakes among 20 people, each pair once?", answer: 190, tol: 0, explain: "C(20, 2)." },
      { id: "b6", topic: "Counting", prompt: "How many squares of all sizes on a chessboard?", answer: 204, tol: 0, explain: "1² + 2² + … + 8²." },
      { id: "b7", topic: "Unit economics", prompt: "Fixed cost ₹6,00,000 a month. Price ₹250, variable cost ₹130. Break-even units a month?", answer: 5000, tol: 0, explain: "600000 / 120." },
      { id: "b8", topic: "Data interpretation", prompt: "Market of ₹800 Cr grows 25% a year. Size after 2 years (₹ Cr)?", answer: 1250, tol: 0.5, explain: "800 × 1.25²." },
      { id: "b9", topic: "Probability", prompt: "Monty Hall: you switch. P(win)?", options: ["1/3", "1/2", "2/3", "3/4"], answer: 2, explain: "Your first pick is right 1/3 of the time; switching wins otherwise." },
      { id: "b10", topic: "Puzzles", prompt: "8 identical-looking balls, one heavier, a balance scale. Fewest weighings that always find it?", answer: 2, tol: 0, explain: "Split 3-3-2." },
      { id: "b11", topic: "Finance", prompt: "Risk-free 7%, beta 1.2, market return 12%. CAPM expected return (%)?", answer: 13, tol: 0.01, explain: "7 + 1.2 × 5." },
      { id: "b12", topic: "Finance", prompt: "PD 2%, LGD 40%, exposure ₹10,00,000. Expected loss (₹)?", answer: 8000, tol: 0.5, explain: "0.02 × 0.4 × 10,00,000." },
    ],
  },
  {
    id: "oa-ml-maths",
    title: "ML mathematics sprint",
    mirrors: "Calculation-style ML and probability items: tree splits, update steps, similarity, Bayes, smoothing",
    minutes: 20,
    tracks: ["fintech"],
    codingIds: ["py-f1-from-scratch"],
    items: [
      { id: "m1", topic: "Decision trees", prompt: "A node has 6 positives and 2 negatives. Gini impurity? (3 decimals)", answer: 0.375, tol: 0.002, explain: "1 − (0.75² + 0.25²)." },
      { id: "m2", topic: "Decision trees", prompt: "Entropy of a node with 4 positives and 4 negatives, in bits?", answer: 1, tol: 0.001, explain: "−2 × 0.5·log₂0.5 = 1." },
      { id: "m3", topic: "Gradient descent", prompt: "w = 2, gradient = 3, learning rate 0.1. Updated w?", answer: 1.7, tol: 0.001, explain: "2 − 0.1 × 3." },
      { id: "m4", topic: "Confusion matrix", prompt: "TP 30, FP 10, FN 30, TN 930. Recall?", answer: 0.5, tol: 0.001, explain: "30 / (30 + 30)." },
      { id: "m5", topic: "Distances", prompt: "Manhattan distance between (1, 2) and (4, 6)?", answer: 7, tol: 0, explain: "|3| + |4|." },
      { id: "m6", topic: "Distances", prompt: "Euclidean distance between (1, 2) and (4, 6)?", answer: 5, tol: 0.001, explain: "√(9 + 16)." },
      { id: "m7", topic: "Logistic regression", prompt: "Log-odds = 0. Predicted probability?", answer: 0.5, tol: 0.001, explain: "σ(0) = 0.5." },
      { id: "m8", topic: "Logistic regression", prompt: "Probability 0.8. Odds?", answer: 4, tol: 0.001, explain: "0.8 / 0.2." },
      { id: "m9", topic: "Time series", prompt: "Exponential smoothing, α = 0.3. Previous forecast 100, actual 120. Next forecast?", answer: 106, tol: 0.01, explain: "0.3 × 120 + 0.7 × 100." },
      { id: "m10", topic: "Linear algebra", prompt: "Dot product of (1, 2, 3) and (4, −5, 6)?", answer: 12, tol: 0, explain: "4 − 10 + 18." },
      { id: "m11", topic: "Markov chains", prompt: "Two states. P(stay in A) = 0.9, P(B → A) = 0.5. Start in A. P(in A after 2 steps)?", answer: 0.86, tol: 0.001, explain: "0.9 × 0.9 + 0.1 × 0.5." },
      { id: "m12", topic: "Statistics", prompt: "X ~ Binomial(10, 0.3). Variance?", answer: 2.1, tol: 0.001, explain: "np(1 − p)." },
    ],
  },
];

export const oaSetById = (id: string) => OA_SETS.find((s) => s.id === id);
