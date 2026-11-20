/**
 * P2 · Batch 5: logical reasoning (blood relations, directions, syllogisms, ordering and ranking,
 * data sufficiency, statement and assumption) and data interpretation (tables, bar and line charts,
 * pie charts, mixed charts, caselets). Generated items come from src/data/gen/b5.ts and are verified.
 * Statement-and-assumption items are hand-written judgement questions: no script can check them,
 * so they carry no check and show as [UNVERIFIED] until reviewed.
 */
import { B5_ITEMS, B5_TOPICS as B } from "@/data/gen/b5";
import type { InterviewQ, Resource } from "@/lib/types";
import { Card_, Item, R, T } from "./build";

const iq = (q: string, answer: string, rubric: string[]): InterviewQ => ({ q, answer, rubric });
const yt = (id: string, title: string, who = "CareerRide") => R(`Video: ${title} (${who})`, `https://www.youtube.com/watch?v=${id}`);
const bix = (path: string, title: string) => R(`IndiaBIX: ${title}`, `https://www.indiabix.com/${path}/`, "OA-style practice with solutions");
const lr = (id: string, title: string, summary: string, notes: string, resources: Resource[], interview: InterviewQ[]) =>
  T(id, "aptitude", "Logical reasoning", title, summary, notes, { resources, interview });
const di = (id: string, title: string, summary: string, notes: string, resources: Resource[], interview: InterviewQ[]) =>
  T(id, "aptitude", "Data interpretation", title, summary, notes, { resources, interview });

// ───────────────────────── Blood relations ─────────────────────────
lr(B.blood, "Blood relations", "Turn relation chains into a family tree: generations up and down, couples, siblings.", `
**Draw, don't hold it in your head.** Use + for male and − for female, a vertical line for parent–child, a horizontal line for siblings, and = for a married couple. Put each generation on its own row.

**Collapse two links at a time.**

- Parent's parent = grandparent; child's child = grandchild.
- Parent's sibling = uncle or aunt; sibling's child = nephew or niece; parent's sibling's child = cousin.
- Spouse's parent = parent-in-law; child's spouse = son- or daughter-in-law; sibling's spouse or spouse's sibling = brother- or sister-in-law.
- **Shortcuts that catch people out:** sibling's parent = parent; parent's spouse = parent; child of your spouse = your child; spouse of your parent = your parent (assume full siblings and an ordinary family).

**Gender comes from the word used for the subject**, not the name. "X is the son of Y" tells you X is male; Y's gender is unknown unless stated.

**Coded relations.** Translate every symbol into a sentence first ("P + Q" → "P is the father of Q"), then solve the chain.

**Worked example 1.** A is the father of B; B is the sister of C. A is C's father.

**Worked example 2.** X is the son of Y; Y is the brother of Z. X is Z's nephew.

**Worked example 3.** M is the wife of N; N is the son of O. M is O's daughter-in-law.

**Worked example 4.** P × Q + R (P is the brother of Q; Q is the father of R): P is R's uncle.
`, [yt("LRdLhfDupMU", "Blood relations"), bix("verbal-reasoning/blood-relation-test", "blood relation test")], [
  iq("How do you avoid errors in long blood-relation chains?", "Draw the tree with generation rows, gender marks and couple/sibling links, and add one statement at a time. Then read the relation from X to Y (not Y to X), using the generation difference and whether the link passes through a marriage.", ["Diagram with generations", "One statement at a time", "Direction X → Y", "In-law via marriage"]),
  iq("Why can't you always tell someone's gender in these questions?", "Only the relation word for the subject reveals gender. 'A is the parent of B' says nothing; 'A is the mother of B' does. If the question's answer depends on an unknown gender, the honest answer is that it cannot be determined.", ["Gender from the relation word", "Names are not evidence", "Cannot-be-determined case"]),
  iq("What is a 'sibling's parent' and why is it a trap?", "It is just your own parent (assuming full siblings), but the extra link tempts people to answer uncle or grandparent. Simplify such pairs before reading off the relation.", ["It collapses to parent", "Simplify before answering"]),
]);
Card_("p2-blood-c1", "Parent's sibling's child", "Cousin.", B.blood);
Card_("p2-blood-c2", "Spouse's parent / child's spouse", "Parent-in-law / son- or daughter-in-law.", B.blood);

// ───────────────────────── Directions ─────────────────────────
lr(B.dirs, "Direction sense", "Walks, turns, net displacement and shadows.", `
**Set up axes.** North is up, east is right. Track net east–west and north–south distances separately.

**Turns.** Right = 90° clockwise, left = 90° anticlockwise, about-turn = 180°. A turn changes the facing direction; the next walk goes in the new facing. Write the facing after each turn.

**Distance from the start.** √(net east² + net north²). Look for 3-4-5 and 5-12-13 triples.

**Direction from the start.** Both components non-zero → an intercardinal direction (north-east, south-west …); one zero → a cardinal direction.

**Turning by angles.** Convert everything to degrees clockwise and add modulo 360: facing north, turn 135° anticlockwise → 225° clockwise → south-west.

**Shadows.** Morning: the sun is in the east, so shadows fall to the west. Evening: shadows fall to the east. At noon there is (almost) no shadow. If your shadow is on your left in the morning, west is on your left, so you face south.

**Worked example 1.** 5 km north, 3 km east, 1 km south: net 3 east, 4 north → 5 km from the start.

**Worked example 2.** Facing north, walk 9 m, turn left, walk 7 m, turn right, walk 8 m: 7 m west and 17 m north → north-west of the start.

**Worked example 3.** Facing east, turn 90° clockwise, then 135° anticlockwise: net −45° → north-east.

**Worked example 4.** In the evening, a shadow falls behind a person: the shadow points east, so the person faces west.
`, [yt("x0WkptLF6oE", "Direction sense test"), bix("verbal-reasoning/direction-sense-test", "direction sense test")], [
  iq("How do you work out which way someone faces from their shadow?", "Fix the sun: morning in the east (shadows point west), evening in the west (shadows point east). Then match the shadow's side: if the shadow is to their right in the morning, west is on their right, so they face south.", ["Sun position by time", "Shadow points away from the sun", "Map side to facing"]),
  iq("Why track the facing direction after every turn?", "'Turn right' depends on the current facing. Facing south, a right turn means walking west. Writing the facing after each turn prevents treating right as always east.", ["Turns are relative", "Example", "Record the facing"]),
  iq("How do you find the shortest distance back to the start?", "Sum the east–west and north–south components separately; the straight-line distance is √(x² + y²). The total distance walked is irrelevant.", ["Separate components", "Pythagoras", "Ignore total walked"]),
]);
Card_("p2-dirs-c1", "Morning shadow", "Points west (sun in the east).", B.dirs);
Card_("p2-dirs-c2", "Turn right / left", "90° clockwise / anticlockwise from the current facing.", B.dirs);

// ───────────────────────── Syllogisms ─────────────────────────
lr(B.syl, "Syllogisms", "Decide which conclusions must follow from 'all / no / some' statements using Venn diagrams.", `
**The four statement types.** All A are B · No A are B · Some A are B · Some A are not B. In these questions every category is assumed to be non-empty.

**A conclusion follows only if it is true in every diagram consistent with the statements.** Being possible is not enough.

**Conversions that always hold.**

- All A are B → Some A are B, and Some B are A.
- No A are B → No B are A, and Some A are not B.
- Some A are B → Some B are A.
- Some A are not B → nothing about B.

**Chains (A–B, B–C).**

- All + All → All A are C.
- All + No → No A are C.
- Some + All → Some A are C.
- Some + No → Some A are not C.
- Some + Some, and anything with a 'some … not' first, → no definite conclusion between A and C.

**Either–or.** When neither conclusion follows by itself, but they have the same subject and predicate and form a complementary pair (Some/No, or All/Some-not), exactly one must be true: answer "either I or II".

**Worked example 1.** All cats are dogs; all dogs are birds → all cats are birds; some birds are cats.

**Worked example 2.** Some pens are books; no books are chairs → some pens are not chairs.

**Worked example 3.** Some cups are kites; some kites are rings → nothing definite about cups and rings.

**Worked example 4.** Conclusions "Some lamps are not cups" and "All lamps are cups": neither is forced, but one of them is always true → either I or II follows.
`, [yt("knFLfSr35wU", "Syllogism"), bix("verbal-reasoning/syllogism", "syllogism")], [
  iq("What is the difference between a conclusion that follows and one that is possible?", "A conclusion follows only if every Venn diagram consistent with the statements makes it true. If you can draw even one valid diagram where it is false, it does not follow, even though it is possible.", ["True in all diagrams", "Counter-diagram test", "Possible ≠ follows"]),
  iq("When do you answer 'either I or II follows'?", "When neither conclusion follows on its own, the two have the same subject and predicate, and they are complementary (Some/No, or All/Some-not), so one of them must be true in every case.", ["Neither follows alone", "Same terms", "Complementary pair"]),
  iq("Why does 'Some A are B' and 'Some B are C' give no conclusion about A and C?", "The B's that are A and the B's that are C may be different B's, so A and C can overlap or not. Both diagrams are valid, so nothing definite follows.", ["Different parts of B", "Two valid diagrams"]),
]);
Card_("p2-syl-c1", "All A are B converts to", "Some B are A (sets are non-empty).", B.syl);
Card_("p2-syl-c2", "Some + Some", "No definite conclusion.", B.syl);

// ───────────────────────── Ordering and ranking ─────────────────────────
lr(B.order, "Ordering and ranking", "Positions from both ends, people between, swaps, and comparison chains.", `
**Total in a row** = rank from the left + rank from the right − 1.

**Position from the other end** = total − rank + 1.

**People between A and B.** Convert both to positions from the same end; between = |difference| − 1. If the ranks overlap (A's rank from the left + B's rank from the right > total), recount carefully.

**Swaps.** After A and B swap, A takes B's old rank from each end. If A's new left rank and B's old right rank are both known, total = new left rank + old right rank − 1.

**Comparison chains.** Turn each clue into an inequality (A > B > C) and merge chains. Only answer what the clues force: if two people are never compared, their order is unknown.

**Worked example 1.** 12th from the left and 15th from the right → 26 in the row.

**Worked example 2.** In 40 girls, A is 10th from the left and B is 12th from the right (29th from the left): 18 girls between them.

**Worked example 3.** A is 7th from the left and B 9th from the right; after swapping, A is 12th from the left → 12 + 9 − 1 = 20 people.

**Worked example 4.** A > B, C < B, D > A, E < C → D > A > B > C > E: A is the second tallest.
`, [R("Video: order and ranking trick (imran sir maths)", "https://www.youtube.com/watch?v=7vr5rJUMNSo"), bix("verbal-reasoning/logical-sequence-of-words", "logical sequence")], [
  iq("Why is it rank from left + rank from right − 1?", "Counting from both ends includes the person twice, once in each count, so subtract one.", ["Person counted twice", "Subtract one"]),
  iq("How do you handle 'how many between' when the two ranks are from different ends?", "Convert one rank to the same end with total − rank + 1, then take the absolute difference minus one. Check for overlap if the total is unknown.", ["Convert to the same end", "Difference − 1", "Overlap check"]),
  iq("A puzzle gives five comparison clues. How do you know whether a question is answerable?", "Build the partial order; a person's position is fixed only if every ordering consistent with the clues puts them there. If two possible orderings disagree, the answer cannot be determined.", ["Partial order", "All consistent orderings agree", "Otherwise undetermined"]),
]);
Card_("p2-order-c1", "Total from both-end ranks", "left + right − 1.", B.order);
Card_("p2-order-c2", "Rank from the other end", "total − rank + 1.", B.order);

// ───────────────────────── Data sufficiency ─────────────────────────
lr(B.ds, "Data sufficiency", "Decide whether each statement, alone or together, is enough to answer the question; you rarely need the answer itself.", `
**The five standard answers.**

- A: statement I alone is sufficient, II alone is not
- B: statement II alone is sufficient, I alone is not
- C: both together are sufficient, neither alone is
- D: each alone is sufficient
- E: even both together are not sufficient

**Order of work.** Test I alone. Test II alone (forget I completely). Only if neither works, combine them.

**"Sufficient" means exactly one answer.** For "What is x?", one value. For a yes/no question, a definite yes or a definite no; "always no" is sufficient.

**Look for a counter-example.** To show a statement is not sufficient, find two cases that satisfy it but give different answers.

**Traps.**

- Two equations do not always fix two unknowns (one may be a multiple of the other, or nonlinear with two solutions).
- Respect the stated domain (integers, positive numbers, a range).
- Do not carry information from statement I into your test of statement II.

**Worked example 1.** What is x? I: x + y = 10. II: x − y = 2 → neither alone, together x = 6 → C.

**Worked example 2.** Is x > y? I: x − y = 3 → yes, sufficient. II: x is odd → not → A.

**Worked example 3.** x, y from 1 to 20. What is x? I: xy = 320 → (16, 20) or (20, 16). II: x − y = −4 → many. Together x = 16 → C.

**Worked example 4.** What is x? I: y = 4. II: x is even → even together x is unknown → E.
`, [R("Video: data sufficiency solved questions (Let'sPro Academy)", "https://www.youtube.com/watch?v=uBn4JdCH9SI")], [
  iq("Why must you test each statement completely independently?", "The answer choices distinguish 'I alone' from 'II alone' from 'together'. If you let facts from I leak into your test of II, you may call II sufficient when it is not, turning a correct A or C into a wrong D.", ["Answer choices depend on it", "Leakage example"]),
  iq("For a yes/no question, is a definite 'no' sufficient?", "Yes. Sufficiency means the statement determines the answer. 'Always no' determines it just as well as 'always yes'.", ["Definite no is sufficient"]),
  iq("How do you show a statement is not sufficient?", "Find two cases that satisfy the statement (and the stated domain) but give different answers to the question. One counter-example pair is enough.", ["Two satisfying cases", "Different answers", "Respect the domain"]),
]);
Card_("p2-ds-c1", "Data sufficiency order of work", "I alone → II alone → together.", B.ds);
Card_("p2-ds-c2", "Yes/no question: always 'no'", "Sufficient.", B.ds);

// ───────────────────────── Statement and assumption ─────────────────────────
const SA = "lr2-statement-assumption";
lr(SA, "Statement and assumption", "An assumption is something the speaker takes for granted without saying it.", `
**What counts as implicit.** An assumption is unstated and necessary: without it the statement (advice, notice, ad, decision) would make no sense.

**Tests.**

- **Negation test:** negate the assumption. If the statement then becomes pointless, the assumption is implicit.
- **Extreme words** (only, all, never, always, best, definitely) usually make an assumption not implicit.
- **Purpose:** advice and ads assume the action is possible and will have the desired effect; notices assume people will read and follow them.
- An assumption cannot simply repeat what the statement already says.

**The answer options.** Only I · only II · either I or II (complementary, one must hold) · neither · both.

**Worked example 1.** "Use the stairs, not the lift, in a fire." The lift may be unsafe in a fire (implicit) and people can use the stairs (implicit) → both.

**Worked example 2.** "Read The Daily Post to stay informed." "Only The Daily Post publishes news" and "people read no other paper" are extreme → neither.

**Worked example 3.** "Let's meet online so members in all cities can join." Members in all cities have internet access → implicit. "Online meetings are cheaper" → not needed → only I.

**Worked example 4.** "The government will raise the minimum age for buying cigarettes to 21." It assumes the rule will reduce smoking among young people; "everyone over 21 smokes" is not assumed.

These questions involve judgement, so the practice items below are hand-written and marked [UNVERIFIED]; check them against the video and IndiaBIX.
`, [yt("azRxI1e6Ekk", "Statement and assumptions"), bix("logical-reasoning/statement-and-assumption", "statement and assumption")], [
  iq("What makes an assumption 'implicit'?", "It is not stated but must be true for the statement to make sense. Apply the negation test: if denying it makes the statement pointless, it is implicit.", ["Unstated", "Necessary", "Negation test"]),
  iq("Why are assumptions with words like 'only' or 'always' usually not implicit?", "The speaker rarely needs anything that strong for the statement to make sense. 'Use our soap for soft skin' assumes people want soft skin, not that only this soap works.", ["Statements rarely need extremes", "Example"]),
  iq("When is the answer 'either I or II'?", "When the two assumptions are complementary, so one of them must be true for the statement to work, but neither alone is necessary.", ["Complementary pair", "One must hold"]),
]);
const SA_OPTS = ["Only assumption I is implicit", "Only assumption II is implicit", "Either I or II is implicit", "Neither I nor II is implicit", "Both I and II are implicit"];
const sa = (n: number, statement: string, a1: string, a2: string, answer: number, explain: string) =>
  Item({
    id: `p2-sa-${String(n).padStart(2, "0")}`, topic: SA, d: 2, secs: 45,
    prompt: `**Statement:** ${statement}\n\n1. ${a1}\n2. ${a2}`, options: SA_OPTS, answer, explain,
    fast: "Negate each assumption: if the statement then loses its point, the assumption is implicit.",
    trap: "Accepting extreme assumptions (only, all, never) or ones that just restate the statement.",
    src: "Hand-written practice, judgement-based; not machine-checked (Nov 2026)",
  });
sa(1, "Notice in an office: \"In case of fire, use the stairs. Do not use the lift.\"", "The lift may not be safe to use during a fire.", "People are able to use the stairs during a fire.", 4, "The notice makes sense only if the lift may be unsafe and the stairs are usable: both are implicit.");
sa(2, "Advertisement: \"Use BrightSmile toothpaste for stronger teeth.\"", "People want stronger teeth.", "No other toothpaste exists.", 0, "Ads assume their audience wants the benefit; claiming no other toothpaste exists is extreme and unnecessary.");
sa(3, "The government has decided to raise the minimum age for buying cigarettes to 21.", "Everyone over 21 smokes.", "Raising the age limit will reduce smoking among young people.", 1, "The decision assumes it will have its intended effect (II). I is extreme and unrelated.");
sa(4, "\"If you want a good job, take this certification course.\"", "The certification course helps people get good jobs.", "People want good jobs.", 4, "Advice assumes the goal is wanted and that the action helps reach it: both implicit.");
sa(5, "Train services between two towns are suspended until further notice because of flooding.", "Passengers will never travel between the two towns again.", "Flooding can make train travel unsafe.", 1, "The suspension assumes flooding makes travel unsafe (II); 'never again' is extreme.");
sa(6, "\"Let us hold the meeting online so that members from all cities can join.\"", "Members in all cities have internet access.", "Online meetings are cheaper than in-person meetings.", 0, "The stated purpose depends on internet access (I). Cost is not part of the reasoning.");
sa(7, "\"Read The Daily Post to stay informed.\"", "Only The Daily Post publishes news.", "People do not read any other newspaper.", 3, "Both assumptions are extreme; the advice needs neither.");
sa(8, "A school asks parents to send children in warm clothes during winter.", "Parents are able to provide warm clothes.", "Children dislike wearing warm clothes.", 0, "An instruction assumes it can be followed (I); nothing suggests children dislike warm clothes.");
Card_("p2-sa-c1", "Negation test", "Deny the assumption; if the statement loses its point, it was implicit.", SA);

// ───────────────────────── Data interpretation ─────────────────────────
const DI_HABITS = `**Habits that save time in every DI set.**

- Read the title, units and scale before any question. Note whether values are in thousands, lakh or crore.
- Approximate first, compute only when options are close: 47.8% of 1,203 ≈ 48% of 1,200 ≈ 576.
- Percentage change = (new − old)/old × 100. "A as a % of B" = A/B × 100. "A is what % more than B" = (A − B)/B × 100.
- Know the fraction–percentage pairs (1/8 = 12.5%, 1/6 = 16.67%, 1/7 ≈ 14.29%, 1/9 ≈ 11.11%).
- Ratios and comparisons often don't need the totals: compare the shares directly.`;

di(B.table, "Tables", "Read rows and columns accurately; growth, ratios and averages from tabular data.", `
**Tables are the most precise DI format:** every value is exact, so the work is choosing the right row, column and operation.

${DI_HABITS}

**Typical questions.** Percentage change of one entity over time · ratio of two entities' totals · average of a column · which entity grew fastest (in percentage, not absolute, terms) · share of one entity in a column total.

**Worked example 1.** A company's output rises from 240 to 300: (300 − 240)/240 = 25% growth.

**Worked example 2.** Totals 1,200 and 1,500 over four years: ratio 0.8.

**Worked example 3.** Column 180, 240, 300, 360, 420: average 300.

**Worked example 4.** Company P grows 200 → 300 (+100, 50%); Q grows 500 → 650 (+150, 30%). Q has the larger absolute increase, P the larger percentage growth.
`, [yt("wLTYn8MVIrA", "Line graph and table data"), bix("data-interpretation/table-charts", "table charts")], [
  iq("What's the difference between the largest absolute increase and the largest percentage increase?", "Absolute increase is new − old; percentage increase divides that by the old value. A small base can give a large percentage with a small absolute change, so the two often point to different rows.", ["Defines both", "Base effect", "Can differ"]),
  iq("How do you approximate quickly in DI?", "Round to friendly numbers, use fraction equivalents (12.5% = 1/8), and compute exactly only when the options are close together.", ["Rounding", "Fractions", "Exact only when needed"]),
  iq("A question asks for the average across rows for one year. What's the common slip?", "Averaging along the wrong axis (across years for one company instead of across companies for one year). Read which dimension the question fixes.", ["Wrong axis", "Check which dimension is fixed"]),
]);
Card_("p2-di-c1", "Percentage change", "(new − old) / old × 100.", B.table);

di(B.barline, "Bar and line charts", "Compare heights and trends; compute differences, growth and shares from charts.", `
**Bar charts** compare categories; **line charts** show change over time. Grouped bars and multi-line charts compare series side by side.

${DI_HABITS}

**Reading charts.** Use the printed values when given; otherwise read against the gridlines and round sensibly. For "largest difference" scan visually, then confirm the top two by subtraction.

**Line-chart specifics.** The steepest segment is the largest absolute change between consecutive points, not necessarily the largest percentage change. Crossing lines mark where one series overtakes the other.

**Worked example 1.** A: 200, B: 150 in one year; A as a % of B = 133.33%.

**Worked example 2.** Totals 500 → 640: +28%.

**Worked example 3.** Two stores over six months: count the months where X's point is above Y's.

**Worked example 4.** The largest gap between two bars is the year with the biggest |A − B|, not the year with the tallest bar.
`, [yt("LEM2xQEVYGo", "Bar graph"), yt("wLTYn8MVIrA", "Line graph and table data"), bix("data-interpretation/bar-charts", "bar charts"), bix("data-interpretation/line-charts", "line charts")], [
  iq("Does the steepest line segment show the largest percentage growth?", "Not necessarily. Steepness shows absolute change. The same rise from a lower base is a larger percentage, so compute change ÷ starting value.", ["Steepness = absolute", "Percentage needs the base"]),
  iq("Why are dual-axis charts risky to read?", "Two different scales make series look comparable when they are not; crossings and relative heights depend on how each axis was scaled. Read each series against its own axis, or prefer two separate charts.", ["Different scales", "Misleading crossings"]),
  iq("How do you answer 'in how many years did A exceed B' quickly?", "Scan each category for which bar or point is higher, and only compute when the two are visually close.", ["Visual scan", "Compute only close ones"]),
]);
Card_("p2-di-c2", "A as a percentage of B", "A / B × 100.", B.barline);

di(B.pie, "Pie charts", "Shares of a whole: amounts, central angles and comparisons between sectors.", `
**A pie shows parts of a whole.** Shares add up to 100% (or 360°).

- Amount for a sector = total × share/100.
- Central angle = share × 3.6°; share = angle/3.6.
- Comparing two sectors needs only their shares: A is (a − b)/b × 100 % more than B, whatever the total.

${DI_HABITS}

**Change across years.** If the total and a share both change, compute the new amount fully: new total × new share. Do not add the two percentage changes.

**Worked example 1.** Budget ₹4,800 lakh, salaries 25% → ₹1,200 lakh.

**Worked example 2.** A 15% sector has a central angle of 54°.

**Worked example 3.** Marketing 20% vs transport 16%: marketing is 25% more.

**Worked example 4.** Total grows 20% and a 25% share falls to 22%: new amount = 1.2 × 22 = 26.4% of the old total, up from 25%.
`, [yt("fA8cQW-nmIw", "Pie chart"), bix("data-interpretation/pie-charts", "pie charts")], [
  iq("How do you convert between a pie share and its central angle?", "Angle = share × 3.6°, since 100% corresponds to 360°. Share = angle ÷ 3.6.", ["× 3.6", "Reverse"]),
  iq("Why don't you need the total to compare two pie sectors?", "Both amounts are the same total times their share, so the total cancels in any ratio or percentage difference between them.", ["Total cancels"]),
  iq("When is a pie chart a poor choice?", "With many small slices, when exact comparisons between similar slices matter, or for change over time. A bar chart is easier to compare.", ["Many slices", "Similar sizes", "Over time → bars/lines"]),
]);
Card_("p2-di-c3", "Pie: share to central angle", "× 3.6°.", B.pie);

di(B.mixed, "Mixed charts", "Combine two charts: totals from one, shares from another.", `
**Mixed sets give you pieces from different charts** (for example, total revenue per year in a bar chart and the regional split for one year in a pie).

**Method.**

1. Identify which chart answers which part: totals vs shares, which year the pie belongs to.
2. Multiply total × share for amounts.
3. If shares are said to be the same every year, the change for a region is share × change in total.

${DI_HABITS}

**Worked example 1.** 2023 total ₹480 crore; North's share 30% → ₹144 crore.

**Worked example 2.** Constant 20% share; totals ₹400 crore → ₹500 crore: the region rises by ₹20 crore.

**Worked example 3.** Total growth from 400 to 520 is 30%, whatever the pie shows.

**Worked example 4.** "How many regions earned more than ₹100 crore?" With a ₹400 crore total, that means a share above 25%.
`, [yt("LEM2xQEVYGo", "Bar graph"), yt("fA8cQW-nmIw", "Pie chart")], [
  iq("What's the most common error in mixed-chart DI?", "Applying a share from the pie to the wrong year's total, or assuming the pie applies to every year when it is labelled for one.", ["Wrong year", "Pie's scope"]),
  iq("How can you turn an amount threshold into a share threshold?", "Divide the threshold by the total and multiply by 100, then compare shares directly instead of computing every amount.", ["threshold / total", "Compare shares"]),
  iq("If a region's share is constant, how does its revenue change?", "In proportion to the total: change = share × change in total, and its percentage growth equals the total's.", ["Proportional", "Same growth rate"]),
]);

di(B.case, "Caselets", "Data given as a paragraph: turn sentences into numbers, then compute.", `
**A caselet is DI without a chart.** The numbers are buried in text, so the first job is to write them down as a small table or Venn diagram.

**Method.**

1. List every quantity with its base: "40% of the girls" is a percentage of girls, not of all students.
2. Split into groups before applying group-specific percentages.
3. For "both / either / neither", draw a two-circle Venn diagram: neither = total − (A + B − both).
4. For weighted rates (defects, pass rates), weight each group's rate by its size.

**Worked example 1.** 1,200 students, 40% girls; 25% of girls and 30% of boys play: 120 + 216 = 336.

**Worked example 2.** 800 people: 55% tea, 40% coffee, 15% both → 20% neither → 160.

**Worked example 3.** Shifts make 50%, 30%, 20% of output with 2%, 3%, 5% defects: overall 1 + 0.9 + 1 = 2.9%.

**Worked example 4.** Cost ₹200, marked up 50%, sold at 20% off: selling price ₹240, profit ₹40 per item.
`, [R("Video: caselet DI from a previous CAT paper (Unacademy)", "https://www.youtube.com/watch?v=4N935D7lh4s")], [
  iq("Why is averaging the defect rates of three shifts wrong?", "Shifts produce different amounts, so each rate must be weighted by its output. The overall rate is total defects ÷ total output, a weighted average.", ["Different group sizes", "Weighted average"]),
  iq("How do you count 'neither' from two overlapping groups?", "Neither = total − (A + B − both). Subtracting both once corrects for counting the overlap twice.", ["Inclusion–exclusion", "Subtract the overlap once"]),
  iq("What should you write down first when reading a caselet?", "Each quantity with its base (percentage of whom) in a small table, so later percentages are applied to the right group.", ["Quantities with bases", "Table first"]),
]);
Card_("p2-di-c4", "Neither (two groups)", "total − (A + B − both).", B.case);

for (const g of B5_ITEMS) {
  Item({
    id: g.id, topic: g.topic, d: g.d, secs: g.secs, prompt: g.prompt,
    ...(g.options ? { options: g.options } : {}),
    answer: g.answer,
    ...(g.tol !== undefined && !g.options ? { tol: g.tol } : {}),
    explain: g.explain, fast: g.fast, trap: g.trap,
    src: g.topic.startsWith("di-") ? "Practice: generated data set; answer recomputed from the raw data in Python (Nov 2026)" : "Practice: generated; answer re-derived independently in Python (Nov 2026)",
    check: { py: g.py },
  });
}
