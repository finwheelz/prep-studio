import { C, N, Q, R, T } from "./build";

const HPM = R("HelloPM free resources", "https://hellopm.co/free/", "Product sense, analytics and interview sessions");
const LENNY = R("Lenny's guide to product sense", "https://www.lennysnewsletter.com/p/the-definitive-guide-to-mastering", "Long-form guide");
const EXP = R("Exponent PM mocks", "https://www.youtube.com/playlist?list=PLrtCHHeadkHrIkSw0waA_S8p2G_lYxU_j", "Watch a few; pause and answer first");
const CIC = R("Case Interviews Cracked", "https://www.youtube.com/@CaseInterviewsCracked", "Profitability, market entry, guesstimates");
const IIMA = R("IIM Ahmedabad Consult Prep Book", "https://lnkd.in/eTv_cQ2j", "Cases and guesstimates with solutions");

T("pm-sense", "product", "Product", "Product sense and design", "Users, problems, prioritised solutions and success metrics.", `
Product-sense questions ("design X for Y", "improve Z", "your favourite product") test whether you start from users and problems, not features.

**Answer structure.**

1. **Clarify** the goal and constraints. What is the product, who is it for, what does success mean (growth, engagement, revenue), which platform, any limits?
2. **Users.** List segments by need or behaviour, not demographics alone. Pick one and say why (size, intensity of need, strategic fit).
3. **Needs and pain points.** Walk the user's journey and list problems. Jobs to be done: "when I…, I want to…, so that…".
4. **Prioritise** one or two problems: frequency × severity × how poorly served today.
5. **Solutions.** Offer three, including one ambitious idea. Describe how each works for the user.
6. **Evaluate** by impact, effort, risk; choose one and define the first version (MVP): the smallest thing that tests the riskiest assumption.
7. **Metrics.** One success metric, a few supporting ones, and guardrails.
8. **Risks and next steps.**

CIRCLES is a mnemonic for the same flow: Comprehend, Identify users, Report needs, Cut through prioritisation, List solutions, Evaluate trade-offs, Summarise.

**Improve a product.** State its mission, choose a segment and goal, find friction in the journey, propose and prioritise, name the metric.

**Favourite product.** What problem it solves, for whom, why it is better than alternatives, one thing you would change and how you would measure it.

**Prioritisation frameworks.**
- RICE = Reach × Impact × Confidence / Effort.
- Impact vs effort 2×2.
- MoSCoW: must, should, could, won't.
- Kano: basic expectations, performance features, delighters.

**User research.** Interviews (ask about past behaviour, not hypotheticals; avoid leading questions), surveys, usage data, usability tests (five users find most problems).

**Go-to-market.** Target segment, value proposition, positioning, pricing, channels, launch plan and launch metrics.

**Delivery vocabulary.** PRD: problem, goals and non-goals, users, requirements (P0/P1), flows, metrics, risks. User story: "As a [user], I want [action], so that [benefit]", with acceptance criteria. Sprint, backlog, roadmap. Basic tech literacy: client–server, APIs, databases, what makes a feature expensive.

**AI features.** Ask what the model can and cannot do reliably, how it will be evaluated, what happens when it is wrong, and the cost and latency per request.

**Common mistakes.** Jumping to solutions; designing for "everyone"; listing features with no prioritisation; no metric; ignoring constraints the interviewer gave.
`, { resources: [HPM, LENNY, EXP, R("Growth.Design case studies", "https://growth.design/case-studies", "Illustrated product teardowns")], categories: ["product/metrics"] });
Q(1, "The first step in a product-design question is to…", ["list features", "clarify the goal, user and constraints", "draw wireframes", "estimate the market"], 1, "Everything else depends on what success means.");
Q(2, "User segments are most useful when defined by…", ["age alone", "needs and behaviour", "the alphabet", "device colour"], 1, "Segments should differ in what they need.");
N(2, "Reach 2,000 users a quarter, impact 2, confidence 50%, effort 4 person-months. RICE score?", 500, 0.001, "2000 × 2 × 0.5 / 4.");
Q(2, "An MVP is…", ["the cheapest product possible", "the smallest version that tests the riskiest assumption with real users", "a prototype nobody uses", "the final product"], 1, "Its purpose is learning.");
Q(2, "In the Kano model, a feature users do not expect but love is a…", ["basic need", "performance feature", "delighter", "must-have"], 2, "Its absence does not disappoint; its presence delights.");
Q(2, "Which is a leading question in a user interview?", ["Tell me about the last time you ordered groceries.", "Wouldn't a faster checkout make you order more?", "What did you do next?", "What was hard about that?"], 1, "It suggests the answer.");
Q(2, "A good user story has the form…", ["The system shall…", "As a [user], I want [action], so that [benefit]", "Feature: …", "Bug: …"], 1, "It keeps the user and the reason in view.");
Q(2, "When choosing which user problem to solve first, weigh…", ["how easy it is to code only", "frequency, severity and how poorly it is served today", "the interviewer's mood", "alphabetical order"], 1, "Impact first, then effort.");
Q(3, "You are asked to 'improve Google Maps'. The weakest opening is…", ["asking which user group and goal to focus on", "immediately proposing five new features", "stating the product's mission", "listing who uses it and for what"], 1, "Solutions before problems is the classic failure.");
Q(2, "Non-goals in a PRD exist to…", ["pad the document", "make explicit what the release will not do, preventing scope creep", "list bugs", "name competitors"], 1, "They align the team on scope.");
C("Product design flow", "Clarify → users → needs → prioritise → solutions → evaluate → MVP → metrics → risks.");
C("RICE", "Reach × Impact × Confidence ÷ Effort");
C("Jobs to be done", "When I [situation], I want to [motivation], so that [outcome].");
C("Kano categories", "Basic needs, performance features, delighters.");

T("pm-metrics", "product", "Product", "Product metrics", "North Star, input metrics, guardrails, funnels and retention.", `
**Metric hierarchy.**
- **North Star metric**: the one number that captures the value users get and predicts long-term revenue. Examples: nights booked (stays marketplace), orders delivered on time (food delivery), weekly active teams sending messages (work chat).
- **Input metrics**: the levers that drive it and that teams can own (acquisition, activation, frequency, supply).
- **Guardrail metrics**: things that must not get worse (cancellations, complaints, latency, refund rate, cost).

**Test of a good metric.** Reflects real user value; the team can move it; measurable and timely; hard to game; understandable. Pair every success metric with a guardrail.

**Frameworks as checklists.**
- AARRR: Acquisition, Activation, Retention, Referral, Revenue.
- HEART: Happiness, Engagement, Adoption, Retention, Task success.

**Common metrics.**
- Acquisition: sign-ups, cost per acquisition, channel mix.
- Activation: share of new users reaching the "aha" action (first order, first project).
- Engagement: DAU, WAU, MAU, stickiness = DAU / MAU, sessions per user, time spent, actions per session.
- Retention: D1, D7, D30 retention; cohort curves (a curve that flattens means a retained core); churn = customers lost / customers at start.
- Monetisation: conversion rate, AOV, ARPU, ARPPU, GMV, take rate (platform revenue / GMV), LTV, CAC.
- Quality: crash rate, latency, NPS, CSAT, support contacts per order.

**Funnels.** Ordered steps with conversion between them; the biggest drop is the first place to look. Segment the funnel by platform, channel and new vs returning.

**Decomposition.** Break a metric into a product or sum of drivers:
- Revenue = users × orders per user × AOV.
- Orders = sessions × conversion.
- GMV = buyers × frequency × basket size.
This is the start of both metric definition and root-cause analysis.

**Measuring a feature.** Goal of the feature → the user action that shows it worked → primary metric → secondary metrics → guardrails → time frame and target → how you will measure (experiment).

**Counter-metrics.** For every metric ask how it could be gamed. Time spent can rise because the app got harder to use; sign-ups can rise with low-quality users.

**Vanity metrics.** Totals that only go up (cumulative downloads, registered users) say little about health.

**Marketplace metrics.** Both sides matter: supply (active sellers or riders, utilisation), demand (active buyers), and liquidity (search-to-fill rate, time to match).

**Reported questions to practise.** North Star for a dining-out product; top five metrics for a section of an app; metrics and data to target ads to users.
`, { resources: [HPM, R("IGotAnOffer: metric questions", "https://igotanoffer.com/blogs/product-manager/product-metric-interview-questions", "Practise defining a North Star plus inputs"), R("Amplitude: North Star playbook", "https://amplitude.com/books/north-star", "Definitions and examples")], categories: ["product/metrics"] });
Q(1, "A North Star metric should primarily reflect…", ["team size", "the value users get from the product", "the marketing budget", "the number of features"], 1, "And it should predict long-term business results.");
Q(2, "Which is a guardrail metric for a feature that pushes more notifications?", ["Notification opens", "Notification opt-outs and uninstalls", "Sessions", "Sign-ups"], 1, "It catches the harm the feature could do.");
N(2, "DAU 30,000 and MAU 120,000. Stickiness in %?", 25, 0.01, "DAU / MAU.");
N(2, "10,000 visitors, 2,000 add to cart, 500 purchase. Overall conversion in %?", 5, 0.01, "500 / 10,000.");
N(2, "A platform's GMV is ₹50 crore and its revenue is ₹7.5 crore. Take rate in %?", 15, 0.01, "7.5 / 50.");
Q(2, "'Total registered users' is a weak success metric because…", ["it is hard to measure", "it only goes up and says nothing about current use or value", "it is too small", "it is private"], 1, "A vanity metric.");
Q(2, "A retention curve that flattens at 20% after week 8 suggests…", ["the product has no retained users", "a core of users finds lasting value", "tracking is broken", "everyone churns"], 1, "Flattening above zero indicates product–market fit for a segment.");
Q(2, "Revenue for a delivery app decomposes most usefully into…", ["users × orders per user × average order value", "clicks + taps", "cost − profit", "DAU ÷ MAU"], 0, "Each factor can be owned and investigated.");
Q(3, "Average session length rises 20% after a redesign. Before celebrating you should check…", ["nothing", "whether tasks now take longer because the flow got harder", "the logo", "the colour scheme"], 1, "A counter-metric such as task completion tells you which it is.");
N(2, "500 customers at the start of the month, 40 leave. Monthly churn in %?", 8, 0.01, "40 / 500.");
Q(2, "For a two-sided marketplace, which metric captures liquidity?", ["Number of app installs", "Share of searches that end in a successful match or order", "Marketing spend", "Number of employees"], 1, "It reflects whether supply meets demand.");
Q(2, "Activation is best measured by…", ["the share of new users who complete the first value-delivering action", "total downloads", "ad impressions", "page loads"], 0, "The 'aha' moment.");
N(3, "ARPU ₹300 a month, gross margin 40%, monthly churn 5%, CAC ₹1,200. LTV / CAC ratio?", 2, 0.01, "LTV = 300 × 0.4 × 20 = 2,400.");
C("North Star / inputs / guardrails", "The value metric / levers teams own / things that must not get worse.");
C("AARRR", "Acquisition, Activation, Retention, Referral, Revenue.");
C("Good-metric test", "Reflects user value, movable by the team, measurable, hard to game, understandable.");
C("Feature success template", "Goal → proving action → primary metric → secondary → guardrails → time frame → experiment.");

T("pm-ab", "product", "Product", "A/B testing and experimentation", "Design, sample size, pitfalls and launch decisions.", `
An A/B test randomly assigns users to control (A) and treatment (B) so that the only systematic difference is the change. Randomisation is what lets you claim causation.

**Design steps.**
1. Hypothesis: "Changing X will raise metric Y by at least Z because…".
2. Primary metric (one), secondary metrics, guardrails.
3. Unit of randomisation: usually the user, so one person has a consistent experience. Session- or page-level randomisation breaks independence.
4. Minimum detectable effect (MDE): the smallest change worth shipping.
5. Significance level α (usually 0.05) and power (usually 80%).
6. Sample size and duration.
7. Run, without peeking, for whole weeks.
8. Check sanity (sample-ratio mismatch, A/A behaviour), then analyse and decide.

**Sample size for proportions.** Per arm:

n ≈ (z₁₋α/₂ + z₁₋β)² × [p₁(1 − p₁) + p₂(1 − p₂)] / δ²

With α = 0.05 and 80% power this is about 16 × p(1 − p) / δ², where δ is the absolute difference. Halving the MDE quadruples the sample. Smaller baseline rates and noisier metrics need more data.

**Duration.** Total sample / daily traffic, rounded up to full weeks to cover weekday and weekend behaviour.

**Analysis.** Difference in proportions with a z-test (or a t-test for means), reported with a confidence interval. Significant and above the MDE with clean guardrails: ship.

**Pitfalls.**
- **Peeking**: checking repeatedly and stopping at the first p < 0.05 inflates false positives. Fix the sample in advance or use sequential methods.
- **Sample-ratio mismatch (SRM)**: the observed split differs from the planned one (chi-square test). It signals a bug in assignment or logging; do not trust the result.
- **Novelty and primacy effects**: early behaviour differs from long-run behaviour. Run longer; compare new vs existing users.
- **Multiple comparisons**: many metrics or variants raise the chance of a false positive; correct for it.
- **Network effects / interference**: users affect each other (marketplaces, social). Randomise by cluster, city or time (switchback tests).
- **Simpson's paradox**: check segments.
- **Underpowered tests**: "not significant" is not "no effect".
- **Seasonality and overlapping experiments.**

**When you cannot A/B test.** Too little traffic, legal or ethical limits, changes that cannot be hidden (pricing, brand), long-term effects. Alternatives: pre/post with a control group (difference-in-differences), geo experiments, holdout groups, synthetic control, regression discontinuity.

**Decision framing.** Primary up and guardrails flat: ship. Primary up, a guardrail down: weigh the trade-off with a combined metric such as revenue per user. Flat: keep the simpler option. Always state the business impact, not only the p-value.
`, { resources: [R("Udacity: A/B Testing (Google)", "https://www.udacity.com/course/ab-testing--ud257", "Metrics, design, analysing results"), R("Evan Miller: sample size calculator", "https://www.evanmiller.org/ab-testing/sample-size.html", "Sanity-check your numbers"), HPM], categories: ["exp/ab"] });
Q(1, "Random assignment in an A/B test is important because it…", ["speeds up the test", "makes the groups comparable so differences can be attributed to the change", "reduces cost", "removes the need for metrics"], 1, "It balances known and unknown factors.");
N(2, "Baseline conversion 10%, absolute MDE 1 percentage point. Using n ≈ 16·p(1 − p)/δ², users per arm?", 14400, 150, "16 × 0.09 / 0.0001.");
N(3, "Baseline 10%, relative lift to detect 5% (10.0% → 10.5%). Users per arm with the same rule?", 57600, 600, "δ = 0.005; 16 × 0.09 / 0.000025.");
Q(2, "Halving the minimum detectable effect makes the required sample…", ["half", "double", "four times", "unchanged"], 2, "Sample size scales with 1/δ².");
Q(2, "Stopping a test the first time p < 0.05 appears is a problem because…", ["it wastes traffic", "repeated looks inflate the false-positive rate", "it reduces power", "p-values cannot be below 0.05"], 1, "Peeking.");
Q(2, "Planned 50/50 split; observed 50,900 vs 49,100. You should…", ["ignore it", "suspect sample-ratio mismatch and investigate before reading results", "declare control the winner", "stop randomising"], 1, "A gap this large on 100,000 users is far beyond chance.");
N(3, "For that split, the chi-square statistic against 50,000 / 50,000?", 32.4, 0.1, "2 × 900² / 50,000.");
Q(2, "The usual unit of randomisation for a product change is the…", ["page view", "user", "click", "server"], 1, "So each person sees one consistent version.");
Q(2, "A new design shows a big lift in week 1 that fades by week 3. This is likely…", ["sample-ratio mismatch", "a novelty effect", "Simpson's paradox", "a bug"], 1, "Curiosity wears off.");
Q(3, "On a ride-hailing marketplace, user-level randomisation can be biased because…", ["users are identical", "treated and control users compete for the same drivers (interference)", "there is too much data", "prices are fixed"], 1, "Use city-level or switchback designs.");
Q(2, "Result: conversion +4% (significant), average order value −3%. The best next step is to…", ["ship immediately", "look at revenue per user, which combines both, and check segments", "discard the test", "rerun with less traffic"], 1, "The two effects may cancel.");
Q(2, "Statistical power is…", ["the probability of a false positive", "the probability of detecting a true effect of the chosen size", "the sample size", "the p-value"], 1, "1 − β.");
Q(2, "40,000 users a day and 115,200 needed in total. Minimum sensible duration?", ["3 days", "7 days", "1 day", "30 days"], 1, "Three days cover the sample, but run a full week to include weekend behaviour.");
Q(3, "You cannot randomise a price change by user for fairness reasons. A reasonable alternative is…", ["no measurement", "a geo experiment with difference-in-differences", "asking users", "a smaller font"], 1, "Compare treated and control regions before and after.");
C("A/B design checklist", "Hypothesis, primary metric, guardrails, unit, MDE, α and power, sample size, duration, no peeking.");
C("Sample size rule of thumb", "n per arm ≈ 16 · p(1 − p) / δ² (α = 0.05, power 80%).");
C("SRM", "Observed split differs from planned: an assignment or logging bug. Do not trust the result.");
C("When A/B testing fails", "Low traffic, interference, unhideable changes, long-term effects → diff-in-diff, geo tests, holdouts.");

T("pm-rca", "product", "Product", "Root-cause analysis of metric changes", "A repeatable way to diagnose 'metric X dropped'.", `
"Orders fell 10%. Why?" is the most reported product and analyst case. Interviewers grade the order in which you rule things out and whether each hypothesis comes with a test.

**Framework.**

1. **Clarify the metric.** Exact definition, time window, comparison (week on week, year on year), size of the change, where it was observed.
2. **Is it real?** Tracking or logging bug, changed definition, delayed data, a dashboard filter. Reconcile with a second source.
3. **Shape in time.** Sudden step (release, outage, policy change) or gradual drift (competition, seasonality, saturation)? One-off or recurring?
4. **Segment.** Geography, platform (Android, iOS, web), app version, new vs returning users, acquisition channel, category, customer segment. A change confined to one segment points to the cause.
5. **Decompose** the metric into drivers and find which one moved: Orders = users × conversion × frequency; Revenue = orders × AOV.
6. **Funnel.** Which step lost the most?
7. **Internal causes.** Releases and bugs, pricing and fees, promotions ending, supply (stock-outs, fewer sellers or riders, longer delivery times), operations, marketing spend, policy.
8. **External causes.** Competitor actions, seasonality and holidays, weather, regulation, macro conditions, platform changes (app-store policy, payment outages).
9. **Hypothesise and test.** For each hypothesis name the data cut that would confirm or kill it.
10. **Conclude.** State the root cause, size it, and give immediate and longer-term actions, plus the alert that would catch it next time.

**MECE.** Mutually exclusive, collectively exhaustive: internal vs external; demand vs supply; users × frequency × value. A MECE first split makes the tree easy to follow.

**Tools.** 5 Whys (keep asking why until you reach something fixable); issue tree; fishbone diagram (people, process, technology, environment).

**Reasoning shortcuts.**
- Change on one platform or version right after a release: a bug.
- All platforms, one city: local supply, competition or an event.
- Numerator vs denominator: for a rate, check which one moved.
- Mix shift: the overall average can fall because the mix moved toward a lower-converting segment even if no segment got worse.
- A metric that rises can also need diagnosing: a spike in sign-ups may be bots.

**Reported prompts.** Quarter-on-quarter fall in food-delivery sales; decline in a theatre's footfall; a KPI tracker showing time rising and performance falling; a lender's collection efficiency dropping.

**Communicating.** Lay out the structure first, say which branch you will examine and why, think aloud, and summarise before moving on.
`, { resources: [HPM, R("PM Mapped: metric-drop RCA drill", "https://pmmapped.com/metric-drop-rca.html", "Practise building the tree"), EXP], categories: ["product/rca"] });
Q(1, "The first thing to check when a metric drops is…", ["competitor pricing", "whether the change is real (definition, tracking, data delay)", "the marketing budget", "the weather"], 1, "Rule out measurement before explaining it.");
Q(2, "A sudden step change on Android only, starting the day of a release, most likely points to…", ["seasonality", "a bug in the Android release", "a competitor", "macro conditions"], 1, "Timing and segment both implicate the release.");
Q(2, "MECE stands for…", ["Most Efficient Cost Estimate", "Mutually Exclusive, Collectively Exhaustive", "Measure, Evaluate, Compare, Execute", "Metric, Event, Cohort, Experiment"], 1, "No overlaps, no gaps.");
Q(2, "Orders are flat in every city but overall conversion fell. A likely explanation is…", ["a tracking bug in orders", "a mix shift toward traffic from lower-converting sources", "a price cut", "nothing changed"], 1, "More low-intent visits raise the denominator.");
Q(2, "For a rate metric such as cart abandonment, an early question is…", ["what colour is the button", "did the numerator or the denominator move", "who is the CEO", "what is the NPS"], 1, "It halves the search space.");
Q(2, "Which is an external factor?", ["A new app release", "A competitor's free-delivery campaign", "A change in commission", "A stock-out"], 1, "It originates outside the company.");
N(2, "Orders = sessions × conversion. Sessions rose 10% and conversion fell 20%. Change in orders, in %?", -12, 0.01, "1.1 × 0.8 = 0.88.");
Q(3, "300 restaurants (4% of listings) left a platform but they made up 11% of last quarter's orders. The lesson is to measure supply churn by…", ["count of restaurants", "share of orders affected", "alphabetical order", "city population"], 1, "Weight by importance, not by count.");
Q(2, "A good hypothesis in an RCA comes with…", ["a confident tone", "the data cut that would confirm or reject it", "a long explanation", "a solution"], 1, "Otherwise it is only a guess.");
Q(2, "A gradual decline over six months is less likely to be caused by…", ["growing competition", "a single bug introduced yesterday", "market saturation", "slow loss of supply"], 1, "A bug produces a step change.");
Q(3, "Sign-ups jump 40% overnight with no campaign. A sensible first hypothesis is…", ["viral growth", "bot or fraudulent registrations, or a tracking duplicate", "a competitor shut down", "a price cut"], 1, "Unexplained spikes deserve the same scrutiny as drops.");
Q(2, "The final answer to an RCA should include…", ["only the cause", "the cause, its size, immediate and longer-term fixes, and how to detect it earlier", "an apology", "a new logo"], 1, "The question usually asks for cause and solution.");
C("RCA order", "Clarify → real? → time shape → segment → decompose → funnel → internal → external → test → conclude.");
C("MECE first splits", "Internal vs external; demand vs supply; users × frequency × value.");
C("Step change vs drift", "Step: release, outage, policy. Drift: competition, seasonality, saturation.");
C("Mix shift", "The aggregate moves because the segment mix changed, even if no segment's own rate changed.");

T("pm-guess", "product", "Product", "Guesstimates and market sizing", "Structured estimation with stated assumptions and a sanity check.", `
Guesstimates appeared at more companies than any other interview item. The number matters less than the structure; reported advice is that approach is scored over the answer.

**Method.**
1. **Clarify scope.** Geography, time unit (per day or year), units (pairs or pieces, volume or value), what is included and excluded.
2. **Choose an approach.**
   - Demand side (top-down): population → relevant segment → users → frequency → quantity.
   - Supply side: number of outlets or assets → capacity → utilisation.
   - Bottom-up from one unit: one store, one bus, one hour, then scale.
3. **Segment MECE.** By age, income, urban vs rural, user type, time of day.
4. **State assumptions** with round numbers and a reason.
5. **Compute aloud**, keeping units visible.
6. **Sanity-check** against a second approach or a known anchor; give a range.
7. **Name the assumption that matters most.**

**Market sizing.** TAM (everyone who could buy), SAM (the part you can serve), SOM (the share you can realistically win). Market value = buyers × purchases per year × price.

**Anchors for India (approximate; say so and verify before relying on them).** Population about 1.4–1.45 billion; about 4–5 people per household; roughly a third urban; large metros on the order of 1–2 crore people. A year has about 300 working days; a day about 16 waking hours.

**Arithmetic habits.** Use powers of ten: 1 lakh = 10⁵, 1 crore = 10⁷. Round aggressively (365 ≈ 360). Carry one significant figure more than you report.

**Worked skeletons.**
- *Pens sold per day in a city*: students (school, college) and office workers × pens per person per year ÷ 365, plus others.
- *Movie tickets per day in a city*: screens × shows per day × seats × average occupancy; cross-check with population × share who go × visits per year ÷ 365.
- *Staff for a dark store with 2,000 orders a day*: peak-hour orders × minutes per order ÷ 60 ÷ utilisation gives pickers; add inbound, supervision and quality; multiply for shifts and leave.
- *Burgers at one outlet per day*: operating hours split into peak and off-peak × customers per hour × burgers per customer; cap by counter capacity.
- *Gloves in a hospital per day*: beds × occupancy × gloved contacts per patient, plus outpatients, surgeries, lab and support staff; pairs → gloves.

**Common errors.** Not clarifying scope; a single unsegmented multiplication; mixing units; silent assumptions; no sanity check; false precision.

**Demand and supply.** One interviewer asked two demand-side and one supply-side guesstimate in the same round: practise both, and practise switching.
`, { resources: [CIC, IIMA, R("Guesstimate practice (GeeksforGeeks)", "https://www.geeksforgeeks.org/blogs/guesstimates/", "Solved examples")], categories: ["product/guesstimate"] });
Q(1, "The first step in a guesstimate is to…", ["multiply big numbers", "clarify the scope, units and time frame", "state the final answer", "apologise for not knowing"], 1, "The answer depends on what is being counted.");
Q(2, "Estimating movie tickets from screens × shows × seats × occupancy is a…", ["demand-side approach", "supply-side approach", "random approach", "regression"], 1, "It starts from capacity.");
N(2, "A city has 250 screens, 5 shows a day, 200 seats and 40% average occupancy. Tickets sold per day?", 100000, 0, "250 × 5 × 200 × 0.4.");
N(2, "A dark store gets 200 orders in its peak hour; each takes 3 minutes to pick and pack; pickers are productive 80% of the time. Pickers needed at peak? (1 decimal)", 12.5, 0.05, "600 minutes ÷ 60 ÷ 0.8.");
N(2, "A city of 1 crore people; 30% are students or office workers using 12 pens a year each. Pens per day from this group (nearest thousand)?", 99000, 1000, "30 lakh × 12 / 365 ≈ 98,630.");
Q(2, "TAM, SAM, SOM in order mean…", ["total, serviceable and obtainable market", "target, sales and operations market", "top, side and small market", "time, amount, size"], 0, "Each is a subset of the previous one.");
N(2, "Convert 3.6 crore to millions.", 36, 0.001, "1 crore = 10 million.");
Q(2, "After reaching a number you should…", ["stop", "sanity-check it with another approach or a known anchor and give a range", "add decimals", "change the question"], 1, "It shows judgement.");
N(3, "A 300-bed hospital at 80% occupancy with 6 gloved contacts per patient per day. Pairs of gloves for ward patients per day?", 1440, 0, "240 × 6.");
N(3, "A burger outlet is open 12 hours: 4 peak hours with 60 customers an hour and 8 off-peak hours with 20; each customer buys 1.5 burgers. Burgers per day?", 600, 0, "(240 + 160) × 1.5.");
Q(2, "Which assumption usually deserves the most scrutiny?", ["The one with the largest effect on the answer", "The first one", "The smallest number", "The last one"], 0, "Sensitivity matters more than order.");
N(3, "India: 30 crore households, 60% own a two-wheeler, replaced every 10 years. Annual replacement demand, in crore units?", 1.8, 0.01, "30 × 0.6 / 10.");
C("Guesstimate method", "Clarify → approach (demand / supply / unit) → segment → assumptions → compute → sanity-check → key sensitivity.");
C("TAM / SAM / SOM", "Total addressable, serviceable addressable, serviceable obtainable market.");
C("Lakh and crore", "1 lakh = 10⁵; 1 crore = 10⁷ = 10 million.");
C("Supply-side skeleton", "Outlets × capacity × utilisation × time.");

T("pm-cases", "product", "Business", "Case interviews: profitability, growth, market entry", "The standard case types and how to structure each.", `
Cases were reported at consulting, business-analyst and product companies alike. Interviewers grade structure and communication over the final number, and candidates warned that reciting a rigid framework hurts.

**Every case.**
1. Restate the problem and the objective (metric and time frame).
2. Clarify: business model, customers, geography, competitors, what changed, constraints.
3. Ask for a moment, then present a MECE structure before any arithmetic.
4. Pick the most promising branch, state a hypothesis, ask for data, calculate aloud.
5. Synthesise: answer first, two or three reasons, risks, next steps.

**Profitability.** Profit = Revenue − Cost.
- Revenue = price × volume. Volume = market size × share. Cut by product, channel, region, customer.
- Cost = fixed + variable. Walk the value chain: raw materials → production → logistics → marketing and sales → service → overheads.
- First ask: is the decline industry-wide or company-specific? Revenue side or cost side?

**Growth.** Existing customers (more frequency, bigger basket, cross-sell), new customers (segments, regions, channels), new products, pricing. Ansoff matrix: market penetration, market development, product development, diversification. Under constraints ("no discounts, no new outlets") the levers are visibility, conversion, repeat and basket size.

**Market entry.** Market attractiveness (size, growth, margins, competition, regulation) → company fit (capabilities, synergies, brand) → entry mode (build, buy, partner) → economics (investment, break-even, payback) → risks → recommendation.

**Pricing.** Cost-plus, competitor-based, value-based. Consider elasticity, segments, bundling and tiers.

**Mergers and acquisitions.** Strategic rationale → stand-alone value of the target → synergies (revenue and cost) → price and valuation → integration risks → alternatives.

**Choosing between options.** Define criteria from the client's goals (return, risk, strategic fit, capability, time), score each option, recommend.

**Operations.** Map the process, find the bottleneck, check capacity, utilisation and quality.

**Useful concepts.** Porter's five forces (rivalry, new entrants, substitutes, buyer power, supplier power); 3C (company, customers, competitors); 4P (product, price, place, promotion); SWOT; BCG matrix (stars, cash cows, question marks, dogs); value chain; economies of scale; network effects; switching costs.

**Case maths.** Break-even volume = fixed cost / (price − variable cost). Margin = profit / revenue. Payback = investment / annual cash flow. Growth rate, market share, percentage change. Round and check units.

**Data-interpretation cases.** Read the exhibit's title and axes, find the one number that matters, ignore the rest, compute the metric, state the implication.

**Group discussions** are judged on how you engage: frame the topic, build on others by name, add a fact or example, summarise.

**Sources repeatedly cited by selected students.** Casebooks from the IIMs, FMS and XLRI and the campus consulting group; Case Interviews Cracked; Case in Point; mock interviews with peers.
`, { resources: [CIC, IIMA, R("IIT Guwahati casebook", "https://www.caciitg.com/ktc/Final%20Casebook.pdf", "Profitability cases with solutions"), R("Victor Cheng: case interview frameworks", "https://www.caseinterview.com/", "Classic issue-tree explanations")], categories: ["product/rca", "product/unit-economics"] });
Q(1, "Profit equals…", ["price × volume", "revenue − cost", "fixed cost + variable cost", "revenue ÷ cost"], 1, "The top of the profitability tree.");
Q(2, "A client's profit fell while industry profits were stable. The first split to examine is…", ["logo vs slogan", "revenue vs cost", "CEO vs CFO", "north vs south"], 1, "Then drill into the side that moved.");
N(2, "Fixed costs ₹6,00,000 a month, price ₹250, variable cost ₹130. Break-even units a month?", 5000, 0, "600,000 / 120.");
Q(2, "Selling existing products to new regions is, in the Ansoff matrix…", ["market penetration", "market development", "product development", "diversification"], 1, "Existing product, new market.");
Q(2, "Which is NOT one of Porter's five forces?", ["Threat of new entrants", "Bargaining power of suppliers", "Company culture", "Threat of substitutes"], 2, "The others are rivalry and buyer power.");
Q(2, "In a market-entry case, after sizing the market the next question is usually…", ["what colour should the product be", "can the company win: capabilities, competition and entry mode", "who is the interviewer", "what is the stock price"], 1, "Attractiveness, then ability to win.");
N(2, "An investment of ₹40 lakh returns ₹10 lakh a year. Payback period in years?", 4, 0.001, "40/10.");
N(2, "Revenue ₹80 crore, costs ₹68 crore. Profit margin in %?", 15, 0.01, "12/80.");
Q(2, "A restaurant must grow sales with no discounts and no new outlets. Which lever remains?", ["Open a second outlet", "Raise visibility, conversion, repeat visits and basket size", "Cut prices", "Close on weekends"], 1, "Work the remaining terms of the revenue equation.");
Q(2, "The final recommendation in a case should start with…", ["background", "the answer", "a list of frameworks", "an apology"], 1, "Answer first, then reasons, risks and next steps.");
Q(3, "A company with excess cash is considering lending to other businesses. A key risk to raise is…", ["font choice", "credit risk and lack of underwriting capability outside its core business", "office location", "logo design"], 1, "Plus regulation and funding mismatch.");
N(3, "Market of ₹800 crore growing 25% a year. Size after 2 years (₹ crore)?", 1250, 0.5, "800 × 1.25².");
Q(2, "In the BCG matrix, a high-share business in a low-growth market is a…", ["star", "cash cow", "question mark", "dog"], 1, "It generates cash to fund others.");
C("Profitability tree", "Profit = Revenue (price × volume) − Cost (fixed + variable). Company-specific or industry-wide?");
C("Market-entry structure", "Market attractiveness → company fit → entry mode → economics → risks.");
C("Case flow", "Restate → clarify → structure (MECE) → analyse → synthesise (answer first).");
C("Porter's five forces", "Rivalry, new entrants, substitutes, buyer power, supplier power.");
C("Ansoff matrix", "Penetration, market development, product development, diversification.");

T("pm-finance", "product", "Business", "Unit economics and finance basics", "Contribution margin, LTV and CAC, statements, valuation, risk.", `
**Unit economics** ask whether one unit (an order, a customer) makes money.

- Contribution margin per unit = price − variable costs. For an order: AOV × gross margin + fees − delivery − packaging − payment charges.
- Break-even volume = fixed costs / contribution per unit.
- CAC = acquisition spend / new customers.
- LTV = contribution per period × expected lifetime; lifetime in periods = 1 / churn.
- LTV / CAC above about 3 is healthy; payback period = CAC / contribution per period.
- Operating leverage: with high fixed costs, profit rises quickly once volume passes break-even.

**Pricing.** Elasticity = % change in quantity / % change in price. Elastic demand (|e| > 1): a price cut raises revenue. Inelastic: a price rise raises revenue.

**Financial statements.**
- Income statement: revenue − cost of goods sold = gross profit; − operating expenses = EBITDA; − depreciation and amortisation = EBIT; − interest = profit before tax; − tax = net profit.
- Balance sheet: assets = liabilities + equity.
- Cash-flow statement: operating, investing, financing. Profit is not cash: revenue booked on credit raises receivables, not cash.
- Working capital = current assets − current liabilities. Growth that ties up inventory and receivables can drain cash even when profitable.

**Ratios.** Gross, EBITDA and net margins; ROE = net profit / equity; ROCE; current ratio; debt-to-equity; interest coverage; P/E; EV / EBITDA.

**Time value of money.** PV = FV / (1 + r)ⁿ. NPV = Σ cash flowₜ / (1 + r)ᵗ − investment; accept if positive. IRR is the rate at which NPV is zero.

**Valuation.** Discounted cash flow: project free cash flows, discount at WACC, add a terminal value. Comparables: multiples of similar companies. CAPM: expected return = risk-free rate + β × (market return − risk-free rate).

**Returns.** Time-weighted return measures the manager, ignoring cash-flow timing; money-weighted (IRR) measures the investor's experience.

**Risk.**
- Credit: expected loss = PD × LGD × EAD (probability of default, loss given default, exposure at default).
- Market: volatility, value at risk.
- Portfolio: diversification reduces risk when assets are not perfectly correlated. Sharpe ratio = (return − risk-free) / volatility.
- Bonds: price and yield move inversely; price change ≈ −duration × change in yield.
- Basel norms set bank capital requirements against risk-weighted assets.

**Lending economics.** Net interest margin = yield on loans − cost of funds; subtract credit cost and operating cost to reach return on assets. Collection efficiency = collected / due.

**Current awareness.** Know the policy rate direction, recent large deals and the news of the company you are interviewing with.
`, { resources: [R("Zerodha Varsity", "https://zerodha.com/varsity/", "Fundamental analysis and risk modules"), R("Corporate Finance Institute resources", "https://corporatefinanceinstitute.com/resources/", "Short articles on every ratio"), CIC], categories: ["product/unit-economics"] });
N(1, "AOV ₹450, gross margin 20%, delivery fee charged ₹15, rider cost ₹45, packaging ₹15. Contribution per order (₹)?", 45, 0.5, "90 + 15 − 45 − 15.");
N(2, "Fixed costs ₹9,00,000 a month and contribution ₹45 per order. Orders per month to break even?", 20000, 0, "900,000 / 45.");
N(2, "Contribution ₹45 per order, 4 orders a month, monthly churn 10%. LTV (₹)?", 1800, 0.5, "45 × 4 × 10.");
N(2, "CAC ₹600, contribution ₹180 a month. Payback in months? (1 decimal)", 3.3, 0.05, "600/180.");
Q(2, "Price rises 10% and quantity falls 5%. Demand is…", ["elastic", "inelastic", "unit elastic", "perfectly elastic"], 1, "|−5/10| = 0.5 < 1, so revenue rises.");
N(2, "Risk-free rate 7%, beta 1.2, market return 12%. CAPM expected return in %?", 13, 0.01, "7 + 1.2 × 5.");
N(2, "PD 2%, LGD 40%, exposure ₹10,00,000. Expected loss (₹)?", 8000, 0.5, "0.02 × 0.4 × 10,00,000.");
N(2, "₹1,210 received in 2 years, discounted at 10%. Present value (₹)?", 1000, 0.5, "1210 / 1.21.");
Q(2, "Revenue grew 20% but operating cash flow fell. A likely reason is…", ["lower taxes", "receivables or inventory built up", "more equity", "depreciation rose"], 1, "Working capital absorbed the cash.");
Q(2, "The accounting identity is…", ["assets = liabilities − equity", "assets = liabilities + equity", "revenue = profit + assets", "cash = profit"], 1, "The balance sheet balances.");
N(3, "A bond has modified duration 5. Yields rise by 1 percentage point. Approximate price change in %?", -5, 0.1, "−duration × Δyield.");
N(2, "Yield on loans 22%, cost of funds 10%. Net interest margin in percentage points?", 12, 0.01, "22 − 10.");
Q(2, "A project should be accepted on financial grounds if its…", ["NPV is positive", "payback is longest", "IRR is below the cost of capital", "revenue is high"], 0, "Positive NPV adds value.");
N(3, "Portfolio return 14%, risk-free 6%, volatility 16%. Sharpe ratio?", 0.5, 0.001, "(14 − 6)/16.");
Q(2, "LTV / CAC of 1.0 means…", ["a healthy business", "each customer returns only what it cost to acquire them", "CAC is zero", "churn is zero"], 1, "No margin to cover fixed costs.");
N(2, "₹97 lakh collected against ₹100 lakh due. Collection efficiency in %?", 97, 0.01, "97/100.");
C("Contribution margin and break-even", "Price − variable cost; break-even units = fixed cost ÷ contribution.");
C("LTV and payback", "LTV = contribution per period ÷ churn. Payback = CAC ÷ contribution per period.");
C("Expected credit loss", "PD × LGD × EAD");
C("CAPM", "Expected return = risk-free + β (market − risk-free)");
C("Profit vs cash", "Profit includes credit sales and non-cash items; cash depends on working capital and capex.");

T("hr", "product", "Interview", "Behavioural, résumé and HR rounds", "Stories, motivation answers and what interviewers look for.", `
Résumé questioning happens in every round. Many selected students gave the same advice: know every line, because a minor mention can become a ten-minute discussion; remove anything you cannot defend.

**Project walkthrough.** Problem → your approach → why this method → result with a number → limitations → what you would do next. Be ready for: where the data came from, the tech stack and why, your exact contribution, the hardest decision and the alternative you rejected, what failed, how it would scale.

**STAR(R) for behavioural questions.** Situation (one line), Task (your responsibility), Action (what you did, most of the answer), Result (quantified), Reflection (what you learned). Ninety seconds to two minutes.

**Story bank.** Prepare six stories that between them cover most questions:
1. A failure and what you learned
2. A conflict or disagreement
3. Leadership or influence without authority
4. A tight deadline
5. Ambiguity or learning something fast
6. An impact you drove, with numbers

**Motivation questions.**
- "Tell me about yourself": present (what you do now), past (two or three relevant experiences), future (why this role). About a minute.
- "Why this role / field": what built the interest, the proof (project or internship), and why now.
- "Why this company": its business, something specific and recent, and the fit with your skills.
- "Why should we hire you": two or three strengths with evidence, matched to the job description.
- "Where do you see yourself in five or ten years": direction, not a title.
- "What if you receive another offer": answer honestly and positively.

**Reported questions.** Why consulting, and why this firm; why shift to a managerial track; where do you see yourself in ten years; a failure that taught you something; how you handle deadlines, a new project and team conflict; leadership style; how you stay updated on AI and how you use AI tools in your work; family background and hobbies; expectations from the company. One company probed "why do you want this job" in every round.

**Strengths and weaknesses.** A real weakness that is not fatal for the role, plus what you are doing about it.

**Questions to ask them.** What does success in the first six months look like; how is the team structured; what are the hardest problems the team is working on.

**Group discussion.** Assessed on engagement more than airtime: open with a frame, add one or two substantive points, build on others, bring in someone quiet, summarise. Reported topics: whether quick-commerce firms should prioritise profitability or market share; whether India's sports culture is driven by aspiration and social media; whether AI is disrupting pharmaceuticals; hypothetical "what if" prompts.

**In the room.** Think aloud; take a moment to structure; take hints; do not bluff, reason from fundamentals instead; be concise; show you want this specific job.
`, { resources: [R("Jake's Resume template", "https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs", "One-page LaTeX résumé"), R("GeeksforGeeks interview experiences", "https://www.geeksforgeeks.org/interview-experiences/", "Company-wise write-ups"), EXP] });
Q(1, "STAR stands for…", ["Strategy, Tactics, Action, Review", "Situation, Task, Action, Result", "Start, Think, Act, Report", "Skill, Talent, Attitude, Result"], 1, "Add Reflection for what you learned.");
Q(2, "In a STAR answer, most of the time should go to…", ["Situation", "Task", "Action", "the company's history"], 2, "What you personally did.");
Q(2, "The best way to state a result is…", ["'it went well'", "with a number and a comparison", "by naming your manager", "by listing tools"], 1, "For example: cut processing time from 3 days to 4 hours.");
Q(2, "'Tell me about yourself' is best answered as…", ["your life story from school", "present, relevant past, and why this role, in about a minute", "a reading of your résumé", "your hobbies only"], 1, "It sets up the rest of the interview.");
Q(2, "A good 'weakness' answer…", ["claims you work too hard", "names a real but non-critical weakness and what you are doing about it", "says you have none", "blames a teammate"], 1, "Self-awareness plus action.");
Q(2, "If you do not know the answer to a technical question you should…", ["bluff confidently", "say so, then reason from what you do know", "stay silent", "change the topic"], 1, "Several selected students warned against bluffing.");
Q(2, "In a group discussion you are mostly judged on…", ["speaking the longest", "how you engage with and build on others' points", "interrupting", "agreeing with everyone"], 1, "Quality and collaboration over airtime.");
Q(2, "A line on your résumé that you cannot explain in depth should be…", ["kept for length", "removed or studied until you can defend it", "made bold", "moved to the top"], 1, "Anything written is fair game.");
Q(2, "'Why this company' should include…", ["only the salary", "what the company does, something specific and recent, and your fit", "a list of competitors", "nothing specific"], 1, "It shows you did the work.");
Q(3, "Asked about a project decision, the strongest answer adds…", ["the alternative you considered and why you rejected it", "more jargon", "the names of all libraries", "an apology"], 0, "It shows judgement, not just execution.");
C("STAR(R)", "Situation, Task, Action, Result, Reflection.");
C("Six stories to prepare", "Failure, conflict, leadership, deadline, ambiguity, impact.");
C("Project walkthrough", "Problem → approach → why this method → result → limitations → next steps.");
C("Tell me about yourself", "Present → relevant past → why this role. About one minute.");
