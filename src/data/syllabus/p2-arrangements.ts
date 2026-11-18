/**
 * P2 · Logical reasoning · Linear and circular arrangements (pilot concept).
 * Items come from src/data/gen/arrangements.ts; scripts/verify-items.mts re-solves every set by brute force.
 */
import { ARR_SETS, type Ask } from "@/data/gen/arrangements";
import { questionPrompt } from "@/data/gen/arrangements";
import { Card_, Item, R, T } from "./build";

T(
  "lr-arr-linear-circular",
  "aptitude",
  "Logical reasoning",
  "Linear and circular arrangements",
  "Seating sets: fix a frame, place blocks, branch on the rest. The most common logical-reasoning set in OAs.",
  `
**The method, for every set.**

1. **Draw the frame** before reading the clues closely: six numbered seats in a row, or six seats around a circle.
2. **Fix what is certain.** Absolute clues ("third from the left", "at an end") go in first. In a circle nothing is absolute, so seat any one person and place everyone relative to them.
3. **Build blocks** from "immediately" clues: "P sits immediately to the right of S" is the block **S P**, which moves as one piece.
4. **Branch** when a clue allows two placements. Draw both cases side by side; one usually breaks within two clues.
5. **Kill cases with negative and count clues** ("does not sit next to", "exactly two people between").
6. **Then answer.** Read every question off the one surviving arrangement. If two arrangements survive, re-read the clues: you have missed one.

**Direction rules.** These cause most wrong answers.

- **Row facing north** (towards you is south): their right is your right.
- **Row facing south**: their right is your left. Flip before placing anything.
- **Circle facing the centre**: a person's right is **anticlockwise**, left is clockwise.
- **Circle facing outward**: reversed: right is clockwise.

**Counting rules.**

- "Exactly k people between X and Y" means the seats differ by k + 1. It says nothing about who is on which side, so it creates two cases.
- In a row of n, the person r-th from the left is (n − r + 1)-th from the right.
- In a circle of 6, "opposite" means 2 people between on both sides.
- "Second to the right of Y" in a circle: move two seats in Y's right direction.

**Worked example 1 (row).** Six people P–U sit facing north. (a) R sits next to S. (b) P sits immediately right of S. (c) Exactly 2 people sit between P and Q. (d) Exactly 1 person sits between Q and T. (e) U sits somewhere left of R.

From (a) and (b): the block is R S P. (e) needs U to the left of R, so R is in seat 2, 3 or 4. R in 2 puts P in 4 and Q in 1, the only seat for U: clash. R in 3 puts P in 5, Q in 2, and then T must be in 4: taken. R in 4 puts P in 6 and Q in 3, so T is in 1 and U in 2. **Answer: T U Q R S P.**

**Worked example 2 (circle).** P, Q, R, S, T, U around a table facing the centre. (a) T is second to the right of S. (b) S is immediately right of U. (c) R sits opposite S. (d) Q sits next to T.

Seat U at position 0. Right is anticlockwise, so take positions 1, 2, … going anticlockwise. (b) puts S at 1, (a) puts T at 3, (c) puts R at 4. (d): Q is next to T (seats 2 and 4), and 4 is taken, so Q is at 2 and P at 5. Going anticlockwise from U: **U S Q T R P.**

**Worked example 3 (catching a two-case clue).** "Exactly 1 person sits between A and B" with A fixed at seat 2 gives B at seat 4, or seat 0, which does not exist in a row of six numbered 1–6. One case dies at once. At seat 5, both seat 3 and seat 7 must be tested, and 7 fails. Always test both sides.

**Worked example 4 (reading questions off the answer).** In U S Q T R P (circle, anticlockwise = right): opposite of Q is P (three seats away). Second to the right of T: two seats anticlockwise from T, which is P. Immediately left of U (clockwise): P. Neighbours: any adjacent pair, including P and U, which wrap around.

**Speed habits.** Spend the first 60–90 seconds on the arrangement, not the questions. Once the arrangement is fixed, each question takes 10 seconds. Writing the frame down is faster than holding it in your head.
`,
  {
    resources: [
      R("Video: linear, circular and double-row seating tricks (LetsPro Academy)", "https://www.youtube.com/watch?v=gWV5rdNDDQU", "Watch first: the solving method on worked sets"),
      R("GeeksforGeeks: seating arrangement questions and answers", "https://www.geeksforgeeks.org/aptitude/seating-arrangement-aptitude/", "More linear and circular sets with solutions"),
      R("IndiaBIX: logical reasoning question bank", "https://www.indiabix.com/logical-reasoning/questions-and-answers/", "Free OA-style reasoning practice"),
    ],
    interview: [
      {
        q: "Walk me through how you solve a seating-arrangement set under time pressure.",
        answer:
          "Draw the frame first. Place absolute clues; in a circle, seat any one person to fix the reference. Turn 'immediately' clues into blocks that move together. When a clue allows two placements, draw both cases and let negative or count clues eliminate one. Only when one arrangement survives do I read the questions, which then take seconds each. If two arrangements survive I re-read the clues rather than guess.",
        rubric: [
          "Frame first, then absolute clues",
          "Fixes a reference person in a circle",
          "Builds blocks from adjacency clues",
          "Branches into explicit cases and eliminates",
          "Solves the arrangement fully before answering questions",
        ],
      },
      {
        q: "In a circular arrangement where everyone faces the centre, which way is a person's right? How do you avoid getting it wrong?",
        answer:
          "Anticlockwise. Picture yourself at the bottom of the circle facing up towards the centre: your right hand points to the right side of the page, which is the anticlockwise direction from the bottom. To avoid errors, decide the direction once, mark an arrow on the diagram, and place every 'right' clue along that arrow.",
        rubric: ["States anticlockwise for facing the centre", "Gives a way to derive it, not just memorise it", "Marks the direction on the diagram before placing clues"],
      },
      {
        q: "A clue says 'exactly two people sit between A and B'. Why is that clue dangerous, and how do you use it?",
        answer:
          "It does not say which side B is on, so it creates two cases (seat difference of 3 either way), and in a row one case may run off the end. Use it after the definite clues, write both cases, and check each against the remaining clues. In a circle of 6, 'two between' on one side means one between on the other, so it is not the same as opposite.",
        rubric: ["Notes it creates two cases", "Converts it to a seat difference of k + 1", "Checks the boundary in a row", "Handles the circle case correctly"],
      },
    ],
  },
);

const FAST: Record<Ask["t"], string> = {
  atPos: "Solve the arrangement once; then count seats from the stated end.",
  rightOf: "Facing north, the right neighbour is the next seat to your right.",
  leftOfImm: "Facing the centre, left is clockwise: step one seat clockwise.",
  countBetween: "Seats apart minus one.",
  ends: "Read seats 1 and 6 off the solved row.",
  oppositeOf: "In a circle of 6, opposite is three seats away either way.",
  secondRightOf: "Facing the centre, right is anticlockwise: step two seats anticlockwise.",
  neighbours: "Check each pair; remember the first and last seats of a circle are neighbours.",
};
const TRAP: Record<Ask["t"], string> = {
  atPos: "Counting from the wrong end, or counting the end seat as zero.",
  rightOf: "Swapping right and left; that only happens when people face south.",
  leftOfImm: "Taking left as anticlockwise. For people facing the centre, anticlockwise is their right.",
  countBetween: "Reporting the seat difference instead of the number of people strictly between.",
  ends: "Choosing a pair that is adjacent at one end instead of one person at each end.",
  oppositeOf: "Stepping two seats instead of three.",
  secondRightOf: "Stepping clockwise, or stepping one seat.",
  neighbours: "Forgetting that the circle wraps around.",
};

for (const set of ARR_SETS) {
  for (const q of set.questions) {
    Item({
      id: `p2-arr-${q.id}`,
      d: set.kind === "circle" ? 2 : q.ask.t === "countBetween" ? 1 : 2,
      secs: 90,
      prompt: questionPrompt(set, q),
      options: q.options,
      answer: q.answer,
      explain: `Solve the set first; it has exactly one arrangement. The answer is ${q.options[q.answer]}.`,
      fast: FAST[q.ask.t],
      trap: TRAP[q.ask.t],
      src: "Practice: generated seating set, solver-checked for a unique solution (Nov 2026)",
      check: { gen: "arrangements" },
    });
  }
}

Card_("p2-arr-c1", "Facing the centre: which way is right?", "Anticlockwise. Facing outward, it is clockwise.");
Card_("p2-arr-c2", "'Exactly k people between X and Y'", "Seats differ by k + 1, in either direction: two cases. Check the row ends.");
Card_("p2-arr-c3", "Rank from the other end", "In a row of n, r-th from the left = (n − r + 1)-th from the right.");
Card_("p2-arr-c4", "Order of work", "Frame → absolute clues → blocks from 'immediately' → branch → eliminate → answer.");
