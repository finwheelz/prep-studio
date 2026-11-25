/**
 * v2 Classical ML, part C: Time series. Fixed ids; answers recomputed in Pyodide.
 */
import { CHECKED, SOURCES as S, iq, lessonWriter } from "./v2-shared";

const { L, Q, C } = lessonWriter("cml");
const TS = "Time series";
const FPP = { label: "Hyndman and Athanasopoulos: Forecasting: Principles and Practice (3rd ed., free online)", url: "https://otexts.com/fpp3/", checked: CHECKED };
const TSS = { label: "scikit-learn API: TimeSeriesSplit (including the gap parameter)", url: "https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html", checked: CHECKED };
const NP = ["numpy"];

L("cml-ts-basics", TS, "Time series basics: trend, seasonality, stationarity", "Decomposing a series, autocorrelation, and why differencing makes models work.", {
  kind: "concept", mins: 25,
  hook: "Daily loan disbursals rise every month-end and grow 20% a year. What does a model need to know about that before you forecast next month?",
  intuition: `
**The situation.** You forecast daily disbursals for a branch network. The series climbs over the year, spikes at month-end and dips on Sundays. Rows are not independent: today looks a lot like yesterday.

**The idea.** Think of a series as layers:

- **Trend:** the slow long-run direction (growth of the book).
- **Seasonality:** a pattern that repeats with a fixed period (day of week, month-end, festival season).
- **Cycle:** rises and falls without a fixed period (credit cycles).
- **Remainder:** what's left, ideally noise.

Most classical models assume **stationarity**: the mean, variance and correlation structure don't change over time. A trending series isn't stationary, but its day-to-day *changes* often are. That's why the first move is usually to transform (log for growth that scales), then **difference** (subtract yesterday, or the same day last week).

**Autocorrelation** measures how strongly the series correlates with itself $k$ steps back. It's the fingerprint of the series: slow decay means trend, spikes at lag 7 mean weekly seasonality.
`,
  maths: `
**In one breath.** Additive $y_t = T_t + S_t + R_t$ (multiplicative: $T_t \\times S_t \\times R_t$, which becomes additive after a log); lag-$k$ autocorrelation $r_k = \\frac{\\sum_{t=k+1}^{n}(y_t - \\bar y)(y_{t-k} - \\bar y)}{\\sum_t (y_t - \\bar y)^2}$; first difference $\\nabla y_t = y_t - y_{t-1}$, seasonal difference $y_t - y_{t-m}$.

**Worked example (differencing a trend).** $y = (10, 12, 14, 16, 18)$ has a clear trend; $\\nabla y = (2, 2, 2, 2)$ is constant: the trend is gone.

**Worked example (autocorrelation).** For $y = (1, 2, 3, 4, 5)$: $\\bar y = 3$, deviations $(-2, -1, 0, 1, 2)$, denominator 10. Lag-1 numerator: $(-1)(-2) + 0 + 1 \\cdot 0 + 2 \\cdot 1 = 4$, so $r_1 = 0.4$.

**Multiplicative seasonality.** If December is always 30% above trend, the seasonal effect grows with the level: use a log or a multiplicative model. If December is always ₹5 Cr above trend, additive.

**Stationarity tests.** Augmented Dickey–Fuller (null: unit root, i.e. non-stationary) and KPSS (null: stationary). Use them with a plot, not instead of one.

| Pattern in the ACF | Suggests |
|---|---|
| slow, linear decay | trend: difference |
| spikes at lags $m, 2m, \\dots$ | seasonality with period $m$: seasonal difference or seasonal terms |
| cuts off after lag $q$ | MA($q$) structure |
| decays geometrically | AR structure |
| nothing significant | white noise: nothing left to model |
`,
  practice: `
**First steps on any series.** Plot it; plot it by season (day of week, month); compute the ACF; check for structural breaks (policy changes, COVID, a new product); log-transform if variance grows with the level.

**Calendar effects.** Month-end, salary days, holidays and festivals (Diwali shifts every year) need explicit calendar features; a fixed period doesn't capture moving holidays.

**Where it shows up.** Demand and cash forecasting, collections volumes, call-centre staffing, server load, anomaly detection (a large residual after removing trend and season).
`,
  traps: [
    { trap: "Shuffle the rows and use k-fold CV like any other dataset.", why: "Observations are ordered and correlated. Shuffling trains on the future and tests on the past, so scores are wildly optimistic. Always split by time." },
    { trap: "A high correlation between two trending series means they're related.", why: "Any two series that both grow (internet users and loan defaults) correlate strongly. Difference both first; spurious regression is the classic trap." },
    { trap: "Always difference to be safe.", why: "Over-differencing a stationary series adds noise and a negative lag-1 autocorrelation. Difference only when the series (or a test) says you need to." },
  ],
  say: {
    prompt: "What does stationarity mean and why do forecasting models care about it?",
    secs: 45,
    check: ["Mean, variance and autocorrelation don't change over time", "Trend and seasonality break stationarity", "Fix: log for growing variance, differencing (regular / seasonal)", "Diagnose with plots and ACF, tests like ADF/KPSS", "Why it matters: model parameters estimated from the past must still apply in the future"],
    followups: [
      { q: "How do you tell additive from multiplicative seasonality?", a: "If the seasonal swings grow with the level of the series, it's multiplicative (use a log or a multiplicative model); if they stay a constant size, additive." },
      { q: "What does a slowly decaying ACF tell you?", a: "Strong persistence, usually a trend or unit root: the series needs differencing before ARMA-style modelling." },
      { q: "What is a spurious regression?", a: "A high R² between unrelated trending series, caused by shared trends rather than a real relationship. Differencing or cointegration analysis avoids it." },
    ],
    answer: `A series is stationary when its statistical properties, mean, variance and autocorrelation, don't depend on time. Classical models like ARIMA estimate parameters from history and assume they still hold in the future, which only makes sense if the process is stable.

Trend and seasonality break that. I'd plot the series and its autocorrelation, use a log if the swings grow with the level, then difference: a first difference removes trend, a seasonal difference removes a repeating pattern. ADF or KPSS tests can confirm, but I'd lean on the plots. And I'd never shuffle time-series data for validation.`,
    avoid: ["\u201cStationary means the series is flat\u201d", "Validating with shuffled k-fold"],
  },
  terms: [["Stationarity", "Statistical properties constant over time."], ["Autocorrelation (ACF)", "Correlation of a series with its own lags."], ["Differencing", "y_t − y_{t−1} (or y_t − y_{t−m} for seasonal)."], ["Seasonal period m", "Length of the repeating pattern (7 for daily data with a weekly cycle)."]],
  sources: [FPP],
});
Q({ id: "cml-ts1-1", d: 1, secs: 30, prompt: "First-difference y = (10, 12, 14, 16, 18). What is the variance of the differenced series?", answer: 0, tol: 0.005, explain: "Differences are (2, 2, 2, 2): constant, so variance 0. The linear trend is gone.", py: "import numpy as np\nanswer = float(np.var(np.diff([10,12,14,16,18])))", packages: NP });
Q({ id: "cml-ts1-2", d: 2, secs: 90, prompt: "Lag-1 sample autocorrelation of y = (1, 2, 3, 4, 5), using the standard formula (overall mean, full-series denominator)?", answer: 0.4, tol: 0.005, explain: "Deviations (−2, −1, 0, 1, 2); lag-1 products sum to 4; denominator 10; r₁ = 0.4.", py: "import numpy as np\ny = np.array([1,2,3,4,5.]); d = y - y.mean()\nanswer = float((d[1:]*d[:-1]).sum()/(d*d).sum())", packages: NP });
Q({ id: "cml-ts1-3", d: 2, secs: 60, prompt: "Daily data with a weekly pattern. Which lag do you use for the seasonal difference?", answer: 7, tol: 0.5, explain: "Seasonal period m = 7: y_t − y_{t−7}.", py: "answer = 7" });
Q({ id: "cml-ts1-4", d: 3, secs: 120, prompt: "White noise ε_t (variance 1) is differenced once: z_t = ε_t − ε_{t−1}. What is the lag-1 autocorrelation of z?", answer: -0.5, tol: 0.005, explain: "Var(z) = 2, Cov(z_t, z_{t−1}) = −Var(ε) = −1, so ρ₁ = −0.5: the signature of over-differencing.", py: "answer = -1/2" });
C("cml-ts1-c1", "Fixing non-stationarity", "Log for growing variance → difference for trend → seasonal difference for repeating patterns.");
C("cml-ts1-c2", "ACF signatures", "Slow decay: trend. Spikes at m, 2m: seasonality. Cut-off after q: MA(q). Geometric decay: AR.");

L("cml-ts-baselines", TS, "Forecasting baselines and exponential smoothing", "Naive, seasonal naive, moving averages, and simple/Holt/Holt-Winters smoothing.", {
  kind: "concept", mins: 25, prereq: ["cml-ts-basics"],
  hook: "Your gradient-boosted forecast has 12% error. 'Same as last week' has 11%. What went wrong, and why should you have checked that first?",
  intuition: `
**The situation.** Sophisticated forecasts regularly lose to dumb ones. A baseline tells you whether the model adds anything.

**Baselines, simplest first.**

- **Naive:** tomorrow = today. Hard to beat for random-walk-like series (prices, balances).
- **Seasonal naive:** next Monday = last Monday. Hard to beat for strongly seasonal series.
- **Mean / moving average:** average of all or of the last $k$ points.
- **Drift:** extend the line from the first to the last point.

**Exponential smoothing** is a weighted average where recent points count more, with weights shrinking geometrically. One parameter $\\alpha$ sets how fast it forgets: high $\\alpha$ reacts quickly (noisy), low $\\alpha$ is smooth (slow). Holt adds a trend term; Holt-Winters adds seasonality. These models are fast, robust and often the production default.
`,
  maths: `
**In one breath.** Simple exponential smoothing: $\\ell_t = \\alpha y_t + (1 - \\alpha)\\ell_{t-1}$, forecast $\\hat y_{t+h} = \\ell_t$; equivalently $\\ell_t = \\sum_{j \\ge 0}\\alpha(1 - \\alpha)^j y_{t-j}$; Holt adds $b_t = \\beta(\\ell_t - \\ell_{t-1}) + (1 - \\beta)b_{t-1}$ and forecasts $\\ell_t + h b_t$.

**Worked example (SES).** $\\alpha = 0.5$, start $\\ell_0 = 10$, observations 12, 14, 13: $\\ell_1 = 11$, $\\ell_2 = 12.5$, $\\ell_3 = 12.75$. Forecast for every future step: 12.75.

**Weights.** With $\\alpha = 0.3$ the most recent point gets 0.3, the one before 0.21, then 0.147. Half the weight lies in roughly the last $\\ln 0.5/\\ln(1 - \\alpha) \\approx 1.9$ points.

**Moving average vs SES.** A $k$-point moving average weights the last $k$ points equally and ignores the rest; SES never fully forgets but fades.

| Method | Captures | Forecast shape |
|---|---|---|
| Naive | level | flat at last value |
| Seasonal naive | season | repeats last season |
| SES | level | flat |
| Holt | level + trend | straight line |
| Holt-Winters | level + trend + season | line plus repeating pattern |
| Damped Holt | trend that fades | flattening curve (often most accurate long-range) |
`,
  practice: `
**Always report a baseline**, usually seasonal naive, and express model error relative to it (MASE does this automatically; see the evaluation lesson).

**Parameter fitting.** $\\alpha, \\beta, \\gamma$ are chosen by minimising one-step-ahead squared error on the training period (statsmodels' ExponentialSmoothing / ETS models do it for you).

**When smoothing wins.** Short histories, many series (thousands of SKUs or branches), the need for speed and stability. Gradient boosting with lag features wins when there are strong external drivers (price, campaigns, macro data) and lots of history.
`,
  traps: [
    { trap: "Skip the baseline; the ML model is obviously better.", why: "Seasonal naive often beats complex models on short or noisy series. Without it you can't tell whether the model learned anything." },
    { trap: "Higher α is better because the forecast reacts faster.", why: "It also chases noise. α is a bias–variance knob; fit it on one-step-ahead errors." },
    { trap: "Holt's linear trend is safe for long horizons.", why: "Straight-line trends overshoot badly far out. Damped trend usually forecasts better beyond a few periods." },
  ],
  say: {
    prompt: "Which baselines would you build before any ML forecasting model, and why?",
    secs: 45,
    check: ["Naive and seasonal naive", "Moving average / mean / drift", "Exponential smoothing (SES, Holt, Holt-Winters) with α controlling memory", "Compare models against the baseline (relative error, MASE)", "Baselines are hard to beat on short, noisy or strongly seasonal series"],
    followups: [
      { q: "How does exponential smoothing weight past observations?", a: "Geometrically: the point j steps back gets weight α(1 − α)^j, so recent data dominates and old data fades without being cut off." },
      { q: "When would you use a damped trend?", a: "For horizons beyond a few periods, or when growth is expected to level off; undamped linear trends overshoot." },
      { q: "Why is seasonal naive often hard to beat?", a: "Strong seasonality explains most of the variance, and seasonal naive captures it with zero parameters to overfit." },
    ],
    answer: `Before any ML model I'd build naive (last value), seasonal naive (same day last week or last year), a moving average and drift, plus exponential smoothing: simple for level, Holt for trend, Holt-Winters for seasonality, with α, β, γ fitted on one-step-ahead errors.

They take minutes, they're robust, and on short or very seasonal series they're often what wins. I report every model's error relative to seasonal naive, for example with MASE, so it's obvious whether the ML model is earning its complexity.`,
    avoid: ["Reporting a model's MAPE without any baseline", "\u201cα should be high so the forecast is responsive\u201d"],
  },
  terms: [["Seasonal naive", "Forecast = value one season ago."], ["Simple exponential smoothing", "ℓ_t = αy_t + (1 − α)ℓ_{t−1}."], ["Holt-Winters", "Exponential smoothing with level, trend and seasonal components."]],
  sources: [FPP],
});
Q({ id: "cml-ts2-1", d: 2, secs: 60, prompt: "Simple exponential smoothing with α = 0.5, ℓ₀ = 10, observations 12, 14, 13. Forecast for the next period?", answer: 12.75, tol: 0.005, explain: "ℓ₁ = 11, ℓ₂ = 12.5, ℓ₃ = 0.5·13 + 0.5·12.5 = 12.75.", py: "l = 10.0\nfor y in [12, 14, 13]:\n    l = 0.5*y + 0.5*l\nanswer = l" });
Q({ id: "cml-ts2-2", d: 1, secs: 30, prompt: "SES with α = 0.3. What weight does the observation two steps back (y_{t−2}) get? (3 decimals)", answer: 0.147, tol: 0.001, explain: "α(1 − α)² = 0.3 × 0.49 = 0.147.", py: "answer = 0.3*(1-0.3)**2" });
Q({ id: "cml-ts2-3", d: 1, secs: 30, prompt: "Daily data, weekly seasonality. The last four values are Mon 120, Tue 95, Wed 100, Thu 110 (and last Friday was 130). Seasonal naive forecast for this Friday?", answer: 130, tol: 0.5, explain: "Seasonal naive repeats the value from one season (one week) ago.", py: "answer = 130" });
Q({ id: "cml-ts2-4", d: 2, secs: 60, prompt: "Holt's method: current level 200, current trend 5. Forecast three steps ahead?", answer: 215, tol: 0.5, explain: "ℓ + h·b = 200 + 3 × 5 = 215.", py: "answer = 200 + 3*5" });
C("cml-ts2-c1", "SES weights", "Point j back gets α(1 − α)^j.");
C("cml-ts2-c2", "Baseline first", "Seasonal naive is the bar every forecasting model must clear.");

L("cml-ts-arima", TS, "AR, MA and ARIMA models", "Autoregression, moving-average errors, differencing, and reading ACF/PACF to choose orders.", {
  kind: "concept", mins: 30, prereq: ["cml-ts-basics"],
  hook: "The PACF of your differenced series cuts off after lag 2 and the ACF tails off. Which model do you fit?",
  intuition: `
**The situation.** After removing trend and season, the series still has memory: high days tend to follow high days. ARIMA models that memory explicitly.

**Three pieces.**

- **AR(p), autoregression:** today is a weighted sum of the last $p$ values plus noise. Momentum.
- **MA(q), moving-average errors:** today depends on the last $q$ *shocks* (forecast errors). A one-off surprise echoes for $q$ periods, then vanishes.
- **I(d), integration:** difference $d$ times first to make the series stationary.

ARIMA(p, d, q) combines them; SARIMA adds seasonal versions of each. Orders are picked from ACF/PACF patterns or, more often today, by minimising AIC over a small grid (auto-ARIMA).
`,
  maths: `
**In one breath.** AR(1): $y_t = c + \\phi y_{t-1} + \\varepsilon_t$, stationary iff $|\\phi| < 1$, mean $c/(1 - \\phi)$, $\\rho_k = \\phi^k$; MA(1): $y_t = \\mu + \\varepsilon_t + \\theta\\varepsilon_{t-1}$, $\\rho_1 = \\theta/(1 + \\theta^2)$, $\\rho_k = 0$ for $k > 1$.

**Worked example (AR(1) forecast).** $c = 2$, $\\phi = 0.8$, last value 15. One step: $2 + 0.8 \\times 15 = 14$. Two steps: $2 + 0.8 \\times 14 = 13.2$. Forecasts decay geometrically to the mean $2/0.2 = 10$.

**Identification.**

| Model | ACF | PACF |
|---|---|---|
| AR(p) | tails off | cuts off after lag p |
| MA(q) | cuts off after lag q | tails off |
| ARMA(p, q) | tails off | tails off |

**AIC** $= 2k - 2\\ln \\hat L$ trades fit against the number of parameters $k$; compare models fitted on the same differenced data.

**Residual check.** A good model leaves white-noise residuals: no significant ACF spikes (Ljung–Box test).
`,
  practice: `
**When ARIMA fits.** One series at a time, medium history, mostly driven by its own past. Add external regressors (ARIMAX / dynamic regression) for price, holidays, campaigns.

**When it doesn't.** Thousands of related series (use global ML models or hierarchical methods), long horizons dominated by external drivers, very irregular or intermittent demand (Croston-type methods).

**Tools.** statsmodels SARIMAX, pmdarima's auto_arima, statsforecast for speed.
`,
  traps: [
    { trap: "ARIMA forecasts capture the series' wiggles far into the future.", why: "Multi-step ARIMA forecasts converge to the mean (or to the trend after differencing); the uncertainty band widens. Long-range detail comes from seasonality and regressors, not AR terms." },
    { trap: "Choose orders by maximising in-sample fit.", why: "More terms always fit better. Use AIC/BIC or out-of-time validation, and check residuals are white noise." },
    { trap: "An MA model is a moving average of past values.", why: "In ARIMA, MA terms are past forecast errors (shocks), not a smoothing average of y." },
  ],
  say: {
    prompt: "Explain ARIMA and how you'd choose its orders.",
    secs: 60,
    check: ["AR: regression on own lags; MA: dependence on past shocks; I: differencing", "Make stationary first (d, seasonal differencing / SARIMA)", "ACF/PACF patterns: AR cuts off in PACF, MA cuts off in ACF", "AIC/BIC or auto-ARIMA; validate out-of-time", "Residual diagnostics (white noise, Ljung–Box)"],
    followups: [
      { q: "Why must |φ| < 1 in an AR(1)?", a: "Otherwise shocks never die out: φ = 1 is a random walk (non-stationary) and |φ| > 1 explodes." },
      { q: "What does SARIMA add?", a: "Seasonal AR, differencing and MA terms at multiples of the seasonal period m, written SARIMA(p, d, q)(P, D, Q)_m." },
      { q: "How do you include holidays or price in ARIMA?", a: "As exogenous regressors (ARIMAX / regression with ARIMA errors); the ARIMA part models the residual autocorrelation." },
    ],
    answer: `ARIMA has three parts. The I is differencing d times to make the series stationary. The AR part regresses the series on its own last p values, which captures momentum. The MA part makes it depend on the last q forecast errors, so shocks echo for a while. SARIMA adds the same at the seasonal lag.

To choose orders I'd difference until the series looks stationary, then read the ACF and PACF: a PACF that cuts off after p suggests AR(p), an ACF that cuts off after q suggests MA(q). In practice I'd search a small grid by AIC, check the residuals are white noise with a Ljung–Box test, and compare out-of-time against seasonal naive.`,
    avoid: ["\u201cMA means a rolling average of y\u201d", "Choosing orders by in-sample R²"],
  },
  terms: [["AR(p)", "Regression on the last p values."], ["MA(q)", "Dependence on the last q shocks."], ["PACF", "Partial autocorrelation: lag-k correlation after removing shorter lags."], ["AIC", "2k − 2 ln L̂; lower is better."]],
  sources: [FPP],
});
Q({ id: "cml-ts3-1", d: 2, secs: 60, prompt: "AR(1): y_t = 2 + 0.8 y_{t−1} + ε_t. Last value 15. Two-step-ahead forecast?", answer: 13.2, tol: 0.005, explain: "14 after one step, then 2 + 0.8 × 14 = 13.2.", py: "y = 15\nfor _ in range(2):\n    y = 2 + 0.8*y\nanswer = y" });
Q({ id: "cml-ts3-2", d: 1, secs: 30, prompt: "Same AR(1) (c = 2, φ = 0.8). Long-run mean of the series?", answer: 10, tol: 0.005, explain: "c/(1 − φ) = 2/0.2 = 10.", py: "answer = 2/(1-0.8)" });
Q({ id: "cml-ts3-3", d: 2, secs: 60, prompt: "MA(1) with θ = 0.5. Lag-1 autocorrelation?", answer: 0.4, tol: 0.005, explain: "θ/(1 + θ²) = 0.5/1.25 = 0.4; all higher lags are 0.", py: "t = 0.5\nanswer = t/(1+t*t)" });
Q({ id: "cml-ts3-4", d: 1, secs: 30, prompt: "PACF cuts off after lag 2; ACF decays gradually. Most likely model?", options: ["MA(2)", "AR(2)", "ARMA(2, 2)", "White noise"], answer: 1, explain: "PACF cut-off at p with a tailing ACF is the AR(p) signature.", py: "answer = 1" });
Q({ id: "cml-ts3-5", d: 2, secs: 60, prompt: "AR(1) with φ = 0.6. Autocorrelation at lag 3? (3 decimals)", answer: 0.216, tol: 0.001, explain: "ρ_k = φ^k = 0.6³ = 0.216.", py: "answer = 0.6**3" });
C("cml-ts3-c1", "ACF/PACF identification", "AR(p): PACF cuts off at p. MA(q): ACF cuts off at q. ARMA: both tail off.");
C("cml-ts3-c2", "AR(1) facts", "Stationary iff |φ| < 1; mean c/(1 − φ); ρ_k = φ^k.");

L("cml-ts-ml", TS, "Forecasting with machine learning", "Lag and window features, multi-step strategies, global models and time-correct features.", {
  kind: "concept", mins: 30, prereq: ["cml-ts-baselines", "cml-boosting"],
  hook: "You need next 30 days of collections for 400 branches. Fit 400 ARIMAs, or one gradient-boosted model? And how does it predict day 30 without knowing days 1–29?",
  intuition: `
**The situation.** Many related series, external drivers (salary days, festivals, campaigns, rate changes) and a horizon of weeks. Classical per-series models struggle; tree ensembles on engineered features usually win (most recent forecasting competitions were won this way).

**The idea.** Turn forecasting into supervised learning: each row is (series, date), the target is the value at a future date, and features describe what was known **at the time the forecast is made**:

- **Lags:** value 1, 7, 14, 28 days before.
- **Rolling windows:** mean, std, min/max over the last 7/28/90 days (shifted so they end before the target).
- **Calendar:** day of week, day of month, month-end flag, holiday/festival flags.
- **Static:** branch region, size; **known future:** planned campaigns, price changes.

One **global** model across all series learns shared patterns (month-end spikes) from everyone, so small branches borrow strength from large ones.

**Multi-step.** For day $h$ ahead, either predict one step and feed predictions back in (**recursive**), or train a separate model (or a horizon feature) per $h$ (**direct**), using only lags at least $h$ old.
`,
  maths: `
**In one breath.** Features for target $y_{t+h}$ may use only data up to $t$; lags must be $\\ge h$ for the direct strategy; rolling stats are computed on the shifted series.

**Feature construction in pandas.**

\`\`\`
df["lag_7"]  = df.groupby("branch")["y"].shift(7)
df["roll_28"] = df.groupby("branch")["y"].transform(lambda s: s.shift(1).rolling(28).mean())
df["dow"] = df["date"].dt.dayofweek
\`\`\`

The \`shift(1)\` before \`rolling\` is the difference between an honest feature and a leaked one.

**Strategies compared.**

| Strategy | Models | Pros | Cons |
|---|---|---|---|
| Recursive | 1 one-step model | simple, uses latest lags | errors compound over the horizon |
| Direct | one per horizon $h$ | no error compounding | more models; can't use lags $< h$ |
| Multi-output / horizon as feature | 1 | shares data across $h$ | lags still limited by $h$ |

**Counting rows.** 400 branches × 730 days of history give 292,000 rows per horizon (minus the warm-up rows lost to the longest lag/window).

**Targets.** Model $\\log(1 + y)$ or the ratio to a rolling mean when series differ in scale by orders of magnitude; use Tweedie/Poisson loss for counts with many zeros.
`,
  practice: `
**Workflow.** Seasonal naive baseline → global LightGBM with lags/windows/calendar → backtest over several origins (next lesson) → add known-future regressors → reconcile if forecasts must add up (branch → region → total).

**Leakage checklist.** Every rolling feature shifted; no target-derived features from after the forecast origin; holiday flags only for holidays known in advance; validation split by time with a gap equal to the horizon.

**Deep learning.** N-BEATS, TFT and foundation models (TimeGPT-style) exist; they need more data and tuning, and gradient boosting remains a strong default for tabular forecasting.
`,
  traps: [
    { trap: "Compute rolling means on the full column, then split by date.", why: "Without shift(1) the window includes the target itself (and with centred windows, the future). Shift first, then roll, within each series." },
    { trap: "Use lag-1 features to forecast 30 days ahead.", why: "At forecast time you don't know days 1–29. For a direct model at horizon h, only lags ≥ h are available; otherwise you're using information you won't have." },
    { trap: "Train one model per series for best accuracy.", why: "With hundreds of short, related series a single global model usually wins: it learns shared seasonality and handles new or sparse series." },
  ],
  say: {
    prompt: "How would you build an ML model to forecast daily volumes for 400 branches, 30 days ahead?",
    secs: 60,
    check: ["Frame as supervised: features known at forecast time, target at t + h", "Lags, shifted rolling windows, calendar/holiday, static and known-future features", "Global model across branches (e.g. LightGBM), log/scale handling", "Multi-step: recursive vs direct, lags ≥ h", "Seasonal-naive baseline and time-based backtesting with a gap"],
    followups: [
      { q: "Recursive or direct?", a: "Recursive uses one model and feeds predictions back, so errors compound; direct trains per horizon (or with a horizon feature) and avoids compounding but can only use lags at least h old. For 30 days with strong weekly patterns, direct or horizon-as-feature is usually safer." },
      { q: "How do you handle a brand-new branch?", a: "A global model can predict it from static features (region, size) and calendar; lags are missing so use defaults or similar-branch averages, and update as history accrues." },
      { q: "Why model log(1 + y)?", a: "Branches differ in scale; logs make errors relative so large branches don't dominate the loss, and stabilise variance." },
    ],
    answer: `I'd turn it into supervised learning: one row per branch and date, target the volume h days ahead, and features known at the forecast origin. Those are lags of at least h days, rolling means and volatility over 7, 28 and 90 days computed on the shifted series, calendar features like day of week, month-end and festival flags, static branch attributes, and any known-future plans such as campaigns.

I'd train one global LightGBM across all 400 branches on log volumes, using a direct or horizon-as-feature setup so errors don't compound over 30 days. I'd backtest over several time-based cut-offs with a gap equal to the horizon and compare against seasonal naive before trusting it.`,
    avoid: ["Random train/test split", "Rolling features without shifting"],
  },
  terms: [["Lag feature", "The target's value k periods before."], ["Global model", "One model trained across many series."], ["Recursive vs direct", "Feed predictions back vs one model per horizon."], ["Known-future regressor", "A driver known in advance (calendar, planned price)."]],
  sources: [FPP, TSS],
});
Q({ id: "cml-ts4-1", d: 2, secs: 60, prompt: "y = (5, 7, 6, 8, 10). Feature = mean of the previous 3 values (shift(1) then rolling(3)). Feature value at the last position?", answer: 7, tol: 0.005, explain: "Previous three values are 7, 6, 8 → mean 7. Without the shift you'd get (6 + 8 + 10)/3 = 8, which includes the target.", py: "import pandas as pd\ns = pd.Series([5,7,6,8,10.])\nanswer = float(s.shift(1).rolling(3).mean().iloc[-1])", packages: ["pandas"] });
Q({ id: "cml-ts4-2", d: 2, secs: 45, prompt: "A direct model for horizon h = 14 days. What is the smallest lag you may use as a feature?", answer: 14, tol: 0.5, explain: "At the forecast origin the most recent known value is 14 days before the target.", py: "answer = 14" });
Q({ id: "cml-ts4-3", d: 2, secs: 60, prompt: "400 branches × 730 days of history; your longest feature needs 90 days of warm-up. How many usable training rows for one horizon?", answer: 256000, tol: 0.5, explain: "400 × (730 − 90) = 256,000.", py: "answer = 400*(730-90)" });
Q({ id: "cml-ts4-4", d: 1, secs: 30, prompt: "Which feature leaks the target?", options: ["Day-of-week of the target date", "Mean of the 7 days ending the day before the forecast origin", "Mean of a centred 7-day window around the target date", "Branch region"], answer: 2, explain: "A centred window includes the target and future days.", py: "answer = 2" });
C("cml-ts4-c1", "Honest rolling feature", "groupby(series).shift(1).rolling(k): shift before rolling.");
C("cml-ts4-c2", "Direct strategy constraint", "For horizon h, only lags ≥ h are available.");

L("cml-ts-eval", TS, "Backtesting and forecast metrics", "Rolling-origin evaluation, TimeSeriesSplit with a gap, MAE/RMSE/MAPE/MASE and prediction intervals.", {
  kind: "concept", mins: 25, prereq: ["cml-ts-baselines", "cml-cv-leakage"],
  hook: "Your forecast has a MAPE of 45%. Is that terrible? It depends on two things this lesson is about.",
  intuition: `
**The situation.** A single train/test split on one date tells you how the model did in one month that may have been unusual. Forecast metrics also behave strangely: MAPE explodes near zero, RMSE is dominated by a few big misses.

**Backtesting (rolling-origin evaluation).** Pick several cut-off dates. For each: train on everything before, forecast the next $h$ periods, record errors. Average over cut-offs. It mimics production, where you re-forecast every week. scikit-learn's TimeSeriesSplit does the expanding-window version, and its \`gap\` parameter drops samples between train and test so features using recent lags don't leak.

**Pick the metric for the decision.**

- **MAE**: average absolute miss, in units (cases, ₹). Robust, predicts the median.
- **RMSE**: punishes big misses more; predicts the mean.
- **MAPE**: percentage miss; intuitive but undefined at zero and asymmetric.
- **MASE**: MAE divided by the in-sample MAE of seasonal naive. Below 1 means you beat the baseline; comparable across series.
`,
  maths: `
**In one breath.** MAE $= \\frac1h\\sum|e_t|$; RMSE $= \\sqrt{\\frac1h\\sum e_t^2}$; MAPE $= \\frac{100}{h}\\sum|e_t/y_t|$; MASE $= \\text{MAE} / \\big(\\frac{1}{n - m}\\sum_{t=m+1}^{n}|y_t - y_{t-m}|\\big)$.

**Worked example.** Actuals $(100, 120, 80)$, forecasts $(110, 110, 100)$: errors $(-10, 10, -20)$. MAE $= 13.33$, RMSE $= 14.14$, MAPE $= (10 + 8.33 + 25)/3 = 14.4\\%$.

**Why MAPE misleads.** Actual 2, forecast 4: 100% error on a trivial miss. And over-forecasts can exceed 100% while under-forecasts are capped at 100%, so minimising MAPE biases forecasts low.

**MASE example.** Model MAE 8; seasonal naive in-sample MAE 10: MASE 0.8 (20% better than the baseline).

**TimeSeriesSplit with a gap.** With 12 samples, 3 splits, test size 2 and a 2-sample gap, the folds train on indices 0–3, 0–5, 0–7 and test on 6–7, 8–9, 10–11.

**Prediction intervals.** A point forecast without an interval is half an answer. Classical models give analytic intervals; for ML use quantile loss (predict the 10th and 90th percentiles) or conformal methods on backtest residuals. Check coverage: an 80% interval should contain about 80% of actuals.
`,
  practice: `
**Recipe.** Choose the horizon and re-forecast cadence as in production → 5–10 rolling origins covering different seasons → same feature pipeline refitted per origin → report MAE/RMSE (units), MASE (vs baseline), bias (mean error) and interval coverage, per segment.

**Aggregates.** Forecast errors shrink when you aggregate (branch → region → total). Report at the level decisions are made.

**Business translation.** Convert errors into cost: staffing shortfall, idle cash, missed collections.
`,
  traps: [
    { trap: "One train/test split at a single date is enough.", why: "Performance varies a lot by season and regime. Average over several origins and look at the spread." },
    { trap: "Report MAPE for everything.", why: "Undefined at zero, exploding near zero and biased towards under-forecasting. Use MAE/MASE, or a weighted MAPE (sum of |errors| / sum of actuals)." },
    { trap: "A low error on the test window means the intervals are fine.", why: "Point accuracy says nothing about calibration. Check empirical coverage of your intervals in backtests." },
  ],
  say: {
    prompt: "How do you evaluate a forecasting model?",
    secs: 45,
    check: ["Rolling-origin backtests over several cut-offs, matching production horizon and cadence", "No shuffling; gap between train and test for lag features", "Metric choice: MAE/RMSE in units, MASE vs seasonal naive, problems with MAPE", "Bias and prediction-interval coverage", "Report at the decision level and translate into business cost"],
    followups: [
      { q: "What is MASE and why use it?", a: "MAE scaled by the in-sample MAE of a (seasonal) naive forecast. Below 1 beats the baseline, it's defined when actuals are zero, and it's comparable across series of different scales." },
      { q: "Why is minimising MAPE biased?", a: "Under-forecasts can cost at most 100% while over-forecasts are unbounded, so the optimiser prefers forecasting low." },
      { q: "Why use the gap parameter in TimeSeriesSplit?", a: "Features built from recent values (lags, rolling windows) can overlap the test period's information; dropping samples between train and test mirrors the real delay and prevents leakage." },
    ],
    answer: `I'd backtest the way the model will be used: pick several forecast origins across different seasons, train on everything before each, forecast the production horizon, and average the errors. Never shuffle, and leave a gap between training and test if features use recent lags.

For metrics I'd use MAE or RMSE in real units, MASE to show the improvement over seasonal naive, mean error to catch bias, and the empirical coverage of the prediction intervals. I'd avoid plain MAPE because it blows up near zero and rewards under-forecasting. Finally I'd report at the level decisions are made and translate the errors into cost.`,
    avoid: ["\u201cOur MAPE is 8%, so it's good\u201d with no baseline", "Evaluating on a single month"],
  },
  terms: [["Rolling-origin evaluation", "Repeated train-up-to-t, forecast-ahead evaluation over several t."], ["MASE", "MAE / in-sample MAE of seasonal naive."], ["Interval coverage", "Share of actuals inside the prediction interval."]],
  sources: [FPP, TSS],
});
Q({ id: "cml-ts5-1", d: 1, secs: 45, prompt: "Actuals (100, 120, 80), forecasts (110, 110, 100). MAE? (2 decimals)", answer: 13.33, tol: 0.01, explain: "|errors| 10, 10, 20 → 40/3.", py: "import numpy as np\na = np.array([100,120,80.]); f = np.array([110,110,100.])\nanswer = float(np.mean(abs(a-f)))", packages: NP });
Q({ id: "cml-ts5-2", d: 2, secs: 60, prompt: "Same data. MAPE in percent? (1 decimal)", answer: 14.4, tol: 0.1, explain: "(10/100 + 10/120 + 20/80)/3 = 14.4%.", py: "import numpy as np\na = np.array([100,120,80.]); f = np.array([110,110,100.])\nanswer = float(100*np.mean(abs((a-f)/a)))", packages: NP });
Q({ id: "cml-ts5-3", d: 1, secs: 30, prompt: "Model MAE 8; in-sample MAE of seasonal naive 10. MASE?", answer: 0.8, tol: 0.005, explain: "8/10 = 0.8: 20% better than the baseline.", py: "answer = 8/10" });
Q({ id: "cml-ts5-4", d: 2, secs: 60, prompt: "TimeSeriesSplit(n_splits=3, test_size=2, gap=2) on 12 samples. How many training samples in the first fold?", answer: 4, tol: 0.5, explain: "Train indices 0–3, test 6–7: samples 4 and 5 are the gap.", py: "import numpy as np\nfrom sklearn.model_selection import TimeSeriesSplit\ntr, te = next(TimeSeriesSplit(n_splits=3, test_size=2, gap=2).split(np.arange(12)))\nanswer = len(tr)", packages: ["scikit-learn"] });
Q({ id: "cml-ts5-5", d: 2, secs: 60, prompt: "Across backtests, 64 of 100 actuals fell inside your 80% prediction intervals. The intervals are…", options: ["well calibrated", "too wide", "too narrow"], answer: 2, explain: "64% coverage < 80% nominal: the intervals understate uncertainty.", py: "answer = 2 if 64/100 < 0.8 else 1" });
C("cml-ts5-c1", "MASE", "MAE / in-sample seasonal-naive MAE; < 1 beats the baseline.");
C("cml-ts5-c2", "MAPE problems", "Undefined at 0, explodes near 0, biased towards under-forecasting.");

L("cml-ts-practice", TS, "Time series practice", "Six interview scenarios on forecasting design, leakage and evaluation.", {
  kind: "interview", mins: 30,
  prereq: ["cml-ts-basics", "cml-ts-baselines", "cml-ts-arima", "cml-ts-ml", "cml-ts-eval"],
  hook: "Answer each scenario out loud in about a minute, then open it and tick off what the interviewer is listening for.",
}, [
  iq("Your demand model scores 4% MAPE in validation and 18% in production. What happened?",
    "Most likely the validation was not time-correct: shuffled splits, rolling features without a shift, centred windows, or features (like 'promotions run') only known after the fact. Also check that the validation period was representative (no festival season), training/serving feature skew, and a regime change after deployment. Re-run a rolling-origin backtest with point-in-time features and a gap.",
    ["Shuffled/leaky validation", "Unshifted or centred rolling features", "Features not known at forecast time", "Unrepresentative period / regime change", "Rolling-origin backtest fix"]),
  iq("Forecast weekly cash requirement for 2,000 ATMs. Approach?",
    "Global gradient-boosted model on log withdrawals with lags ≥ horizon, rolling stats, calendar (salary days, month-end, festivals), location/static features; seasonal-naive and Holt-Winters baselines; quantile forecasts because cost is asymmetric (cash-out vs idle cash); backtest over several origins; monitor bias per ATM cluster.",
    ["Global model + features", "Baselines", "Asymmetric cost → quantiles", "Backtesting", "Monitoring by segment"]),
  iq("Why can't you use ordinary k-fold cross-validation on time series?",
    "Rows are ordered and autocorrelated; random folds put future data in training and neighbouring near-duplicates on both sides, so scores are optimistic. Use expanding or sliding windows that train on the past and test on the future, with a gap if features use recent lags.",
    ["Autocorrelation / ordering", "Future leaks into training", "Expanding/sliding windows", "Gap for lag features"]),
  iq("The ACF of your differenced series shows a big spike at lag 7 and nothing else. What do you do?",
    "Weekly seasonality remains: add a seasonal difference at lag 7 or seasonal MA term (SARIMA with m = 7), or day-of-week features in an ML model. Then recheck residual ACF for white noise.",
    ["Identify weekly seasonality", "Seasonal difference / seasonal term", "Day-of-week features alternative", "Residual check"]),
  iq("Business wants a single number: 'how accurate is the forecast?' What do you give them?",
    "An error in business units at the decision level (e.g. average daily miss of ₹X lakh per region), compared with the current method or seasonal naive (MASE or % improvement), the bias (do we over- or under-forecast), and an interval statement (80% of days fall within ±Y). Avoid a bare MAPE.",
    ["Units at decision level", "Comparison to baseline", "Bias", "Interval/coverage", "Why not bare MAPE"]),
  iq("How do you forecast a new product line with three weeks of history?",
    "Use analogues: a global model trained on similar products with static features (category, price band, channel), or the average launch curve of comparable products scaled by early sales; Bayesian or hierarchical shrinkage toward the category; wide intervals; update quickly as data arrives. Classical per-series models can't be fitted on three weeks.",
    ["Analogues / similar products", "Global model with static features", "Hierarchical shrinkage", "Wide intervals, frequent updates"]),
]);
