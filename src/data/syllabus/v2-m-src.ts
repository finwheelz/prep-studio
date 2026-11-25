/** Sources for the v2 Maths for ML track; every URL opened with WebFetch on 2026-11-25. */
import { CHECKED, SOURCES } from "./v2-shared";

const src = (label: string, url: string) => ({ label, url, checked: CHECKED });

export const MS = {
  mml: src("Deisenroth, Faisal, Ong: Mathematics for Machine Learning (free PDF)", "https://mml-book.github.io/"),
  dlb: src("Goodfellow, Bengio, Courville: Deep Learning, ch. 2–4 (linear algebra, probability and information theory, numerical computation)", "https://www.deeplearningbook.org/"),
  boyd: src("Boyd and Vandenberghe: Convex Optimization (free PDF)", "https://web.stanford.edu/~boyd/cvxbook/"),
  seeing: src("Seeing Theory: a visual introduction to probability and statistics (Brown University)", "https://seeing-theory.brown.edu/"),
  scipy: src("SciPy reference: scipy.stats (distributions, tests, bootstrap, permutation tests, FDR control)", "https://docs.scipy.org/doc/scipy/reference/stats.html"),
  islr: SOURCES.islr,
  mixtape: src("Scott Cunningham: Causal Inference (online book)", "https://mixtape.scunning.com/"),
  kohavi: src("Kohavi, Tang, Xu: Trustworthy Online Controlled Experiments (book site)", "https://experimentguide.com/"),
  cuped: src("Deng, Xu, Kohavi, Walker (2013): Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data (CUPED)", "https://www.exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf"),
  millerPeek: src("Evan Miller: How Not To Run an A/B Test", "https://www.evanmiller.org/how-not-to-run-an-ab-test.html"),
  millerSize: src("Evan Miller: A/B test sample size calculator", "https://www.evanmiller.org/ab-testing/sample-size.html"),
};
