/**
 * v2 DSA, part D: Trees · Heaps. Fixed ids; every answer is recomputed in Pyodide.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";
import { D } from "./v2-dsa-src";

const s = (label: string, url: string) => ({ label, url, checked: CHECKED });
/** Sources for this file; every URL opened and checked on 2026-11-25. */
const S = {
  trav: s("Wikipedia: Tree traversal", "https://en.wikipedia.org/wiki/Tree_traversal"),
  lca: s("Wikipedia: Lowest common ancestor", "https://en.wikipedia.org/wiki/Lowest_common_ancestor"),
  lcLevel: s("LeetCode: Binary Tree Level Order Traversal", "https://leetcode.com/problems/binary-tree-level-order-traversal/"),
  binHeap: s("Wikipedia: Binary heap", "https://en.wikipedia.org/wiki/Binary_heap"),
};

const { L, Q, C } = lessonWriter("dsa");
const TR = "Trees";
const HP = "Heaps";

/** Python helper used by tree checks: build a tree from a level-order list with None gaps. */
const TH = "from collections import deque\nclass T:\n    def __init__(s, v, l=None, r=None): s.val, s.left, s.right = v, l, r\ndef build(vs):\n    if not vs or vs[0] is None: return None\n    it = iter(vs); root = T(next(it)); q = deque([root])\n    while q:\n        n = q.popleft()\n        for side in ('left', 'right'):\n            v = next(it, 'end')\n            if v == 'end': return root\n            if v is not None:\n                c = T(v); setattr(n, side, c); q.append(c)\n    return root\n";

// ───────────────────────── Trees ─────────────────────────

L("dsa2-tree-dfs", TR, "Binary tree traversal with DFS", "TreeNode recursion, pre-, in- and post-order, the iterative stack version, and reading a problem as 'combine answers from the children'.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-stack"],
  hook: "Find the depth of a binary tree in three lines. What does each node need to know from its children?",
  intuition: `
**The situation.** Tree problems in OAs give you a \`TreeNode\` with \`val\`, \`left\`, \`right\`. Almost all are solved by one recursive function that visits every node once.

**The idea.** Trust the recursion: assume the function already works on the left and right subtrees, then combine. Always handle \`None\` first.

- **Pre-order** (node, left, right): do something on the way down, e.g. copy or serialise.
- **In-order** (left, node, right): on a binary search tree, visits values in sorted order.
- **Post-order** (left, right, node): compute from children first, e.g. height, size, deleting a tree.

Each node is visited once: $O(n)$ time; recursion depth equals the height $h$: $O(h)$ space, which is $O(n)$ for a chain.
`,
  maths: `
**In one breath.** \`def f(node): if not node: return base; L = f(node.left); R = f(node.right); return combine(node, L, R)\`; $O(n)$ time, $O(h)$ space.

**Setup.**

\`\`\`python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right
\`\`\`

**Template: three traversals.**

\`\`\`python
def preorder(n, out):
    if n:
        out.append(n.val); preorder(n.left, out); preorder(n.right, out)

def inorder(n, out):
    if n:
        inorder(n.left, out); out.append(n.val); inorder(n.right, out)

def postorder(n, out):
    if n:
        postorder(n.left, out); postorder(n.right, out); out.append(n.val)
# tree [1, 2, 3, 4, 5] (level order): pre 1 2 4 5 3, in 4 2 5 1 3, post 4 5 2 3 1
\`\`\`

**Worked problem 1: maximum depth.**

\`\`\`python
def max_depth(n):
    if not n:
        return 0
    return 1 + max(max_depth(n.left), max_depth(n.right))
# [3, 9, 20, None, None, 15, 7] -> 3
\`\`\`

**Worked problem 2: are two trees identical? Mirror a tree.**

\`\`\`python
def same(a, b):
    if not a or not b:
        return a is b                    # both None -> True
    return a.val == b.val and same(a.left, b.left) and same(a.right, b.right)

def invert(n):
    if n:
        n.left, n.right = invert(n.right), invert(n.left)
    return n
\`\`\`

Symmetric tree is \`same\` applied to \`(a.left, b.right)\` and \`(a.right, b.left)\`.

**Worked problem 3: iterative in-order** (avoids Python's ~1,000-frame recursion limit on deep trees).

\`\`\`python
def inorder_iter(root):
    out, st, cur = [], [], root
    while cur or st:
        while cur:                       # go as far left as possible
            st.append(cur); cur = cur.left
        cur = st.pop()
        out.append(cur.val)
        cur = cur.right
    return out
\`\`\`

**Edge cases.** Empty tree (\`root is None\`); single node; skewed trees (depth $n$); negative values; duplicate values.
`,
  practice: `
**Signals:** \`TreeNode\` in the prompt, "depth", "height", "same", "mirror", "symmetric", "path from root", "subtree".

**Variations.** Subtree of Another Tree (\`same\` at every node: $O(m\\cdot n)$, or serialise and search), Path Sum (subtract on the way down, check at leaves), Flatten to Linked List (reverse post-order).

**Practise:** Maximum Depth of Binary Tree, Same Tree, Invert Binary Tree, Symmetric Tree, Subtree of Another Tree, Path Sum, Binary Tree Inorder Traversal (iterative), Flatten Binary Tree to Linked List.
`,
  traps: [
    { trap: "Check node.left.val without checking node.left.", why: "Children can be None. Handle None at the top of the function and let recursion do the rest." },
    { trap: "Recursion is free in Python.", why: "Default recursion limit is about 1,000. A skewed tree with 10⁵ nodes raises RecursionError: use an explicit stack or BFS." },
    { trap: "Space for DFS is O(1) because no list is created.", why: "The call stack holds one frame per level: O(h), up to O(n)." },
  ],
  say: {
    prompt: "How do you approach a binary tree problem recursively? Use maximum depth as the example.",
    secs: 40,
    check: ["Base case: None returns a neutral value", "Assume the recursive call works on each subtree", "Combine children's answers at the node", "Pick the traversal order the combination needs", "O(n) time, O(h) space; recursion-limit caveat"],
    followups: [
      { q: "Which traversal gives sorted order on a BST, and why?", a: "In-order: every value in the left subtree is smaller and every value in the right is larger, so left–node–right emits values in increasing order." },
      { q: "How would you do pre-order iteratively?", a: "Stack starting with the root; pop a node, record it, push its right child then its left child, so the left is processed first." },
      { q: "What's the space complexity on a balanced vs skewed tree?", a: "O(log n) stack on a balanced tree, O(n) on a skewed one, since depth equals height." },
    ],
    answer: `I define what the function returns for one subtree, handle None first, and assume the recursive calls already give the right answer for the left and right children. Then I combine them at the current node.

For maximum depth, an empty tree has depth 0, and otherwise the depth is one plus the larger of the two children's depths. That's a post-order computation since I need the children first. It visits every node once, so O(n) time, and the recursion stack is as deep as the tree, O(h), which is O(n) for a skewed tree. In Python that can hit the recursion limit, so for very deep trees I'd switch to an explicit stack or BFS.`,
    avoid: ["Forgetting the None base case", "Calling DFS space O(1)"],
  },
  terms: [["Pre-order", "Node, left, right."], ["In-order", "Left, node, right: sorted on a BST."], ["Post-order", "Left, right, node: children before parent."]],
  sources: [S.trav, D.stack],
});
Q({ id: "dsa2-td-1", d: 1, secs: 30, prompt: "Maximum depth of the tree [3, 9, 20, None, None, 15, 7] (level order)?", answer: 3, tol: 0.5, explain: "3 → 20 → 15.", py: TH + "def d(n): return 0 if not n else 1 + max(d(n.left), d(n.right))\nanswer = d(build([3,9,20,None,None,15,7]))" });
Q({ id: "dsa2-td-2", d: 1, secs: 45, prompt: "Tree [1, 2, 3, 4, 5] in level order. Which value is visited third in post-order?", answer: 2, tol: 0.5, explain: "Post-order: 4, 5, 2, 3, 1.", py: TH + "out = []\ndef po(n):\n    if n: po(n.left); po(n.right); out.append(n.val)\npo(build([1,2,3,4,5]))\nanswer = out[2]" });
Q({ id: "dsa2-td-3", d: 2, secs: 45, prompt: "In-order traversal of [1, None, 2, 3]. What value comes second?", answer: 3, tol: 0.5, explain: "1 has right child 2, whose left child is 3: in-order 1, 3, 2.", py: TH + "out = []\ndef io(n):\n    if n: io(n.left); out.append(n.val); io(n.right)\nio(build([1,None,2,3]))\nanswer = out[1]" });
Q({ id: "dsa2-td-4", d: 1, secs: 30, prompt: "Which traversal of a binary search tree lists the values in ascending order?", options: ["Pre-order", "In-order", "Post-order", "Level order"], answer: 1, explain: "Left subtree < node < right subtree.", py: TH + "out = []\ndef io(n):\n    if n: io(n.left); out.append(n.val); io(n.right)\nio(build([4,2,6,1,3,5,7]))\nanswer = 1 if out == sorted(out) else 0" });
Q({ id: "dsa2-td-5", d: 2, secs: 45, prompt: "Is [1, 2, 2, 3, 4, 4, 3] symmetric? Answer 1 for yes, 0 for no.", answer: 1, tol: 0.5, explain: "Left subtree mirrors the right subtree.", py: TH + "def m(a, b):\n    if not a or not b: return a is b\n    return a.val == b.val and m(a.left, b.right) and m(a.right, b.left)\nr = build([1,2,2,3,4,4,3])\nanswer = int(m(r.left, r.right))" });
C("dsa2-td-c1", "Tree recursion shape", "if not node: return base; L = f(left); R = f(right); return combine.");
C("dsa2-td-c2", "Traversal orders", "Pre: N L R · In: L N R (sorted on BST) · Post: L R N.");

L("dsa2-tree-bfs", TR, "Level-order traversal with BFS", "Processing a tree level by level with a deque: level lists, right-side view, minimum depth and per-level aggregates.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-tree-dfs", "dsa2-queue-deque"],
  hook: "Return what you'd see looking at a tree from the right side. Which node of each level is visible, and how do you know where a level ends?",
  intuition: `
**The situation.** "Level by level", "each depth", "right side view", "minimum depth", "largest value per row", "zigzag". These are about depth, not about subtrees.

**The idea.** Breadth-first search with a queue. Start with the root; repeatedly take a node from the front and add its children to the back. To separate levels, read \`len(q)\` at the start of each round: exactly that many nodes belong to the current level.

BFS also finds the **shallowest** thing first, so minimum depth can stop at the first leaf instead of exploring the whole tree.
`,
  maths: `
**In one breath.** \`q = deque([root])\`; \`while q: for _ in range(len(q)): node = q.popleft(); ...; push children\`; $O(n)$ time, $O(w)$ space for the widest level.

**Template: level lists.**

\`\`\`python
from collections import deque
def levels(root):
    if not root:
        return []
    out, q = [], deque([root])
    while q:
        row = []
        for _ in range(len(q)):          # exactly this level's nodes
            n = q.popleft()
            row.append(n.val)
            if n.left: q.append(n.left)
            if n.right: q.append(n.right)
        out.append(row)
    return out
# [3, 9, 20, None, None, 15, 7] -> [[3], [9, 20], [15, 7]]
\`\`\`

**Worked problem 1: right-side view.** The last node of each level: \`[row[-1] for row in levels(root)]\`. For \`[1, 2, 3, None, 5, None, 4]\` → \`[1, 3, 4]\`.

**Worked problem 2: minimum depth (stop at the first leaf).**

\`\`\`python
def min_depth(root):
    if not root:
        return 0
    q, depth = deque([root]), 1
    while q:
        for _ in range(len(q)):
            n = q.popleft()
            if not n.left and not n.right:
                return depth             # first leaf found is the shallowest
            if n.left: q.append(n.left)
            if n.right: q.append(n.right)
        depth += 1
# chain [2, None, 3, None, 4, None, 5, None, 6] -> 5
\`\`\`

**Worked problem 3: zigzag order.** Build each row normally and reverse every other one (\`row[::-1]\` when the level index is odd). $O(n)$ overall.

**Maximum width.** Give each node an index (\`2i\`, \`2i + 1\` for children); width of a level = last index − first index + 1.

**Edge cases.** Empty tree; a chain (one node per level); a full last level (the queue holds about $n/2$ nodes).
`,
  practice: `
**Signals:** "level", "row", "depth-wise", "right/left view", "nearest leaf", "minimum depth", "connect next pointers", "average of levels".

**Variations.** Average of Levels, Find Largest Value in Each Tree Row, Maximum Level Sum, Populating Next Right Pointers, Cousins in Binary Tree (same depth, different parents), Maximum Width of Binary Tree.

**Practise:** Binary Tree Level Order Traversal, Binary Tree Right Side View, Minimum Depth of Binary Tree, Binary Tree Zigzag Level Order Traversal, Average of Levels in Binary Tree, Maximum Level Sum of a Binary Tree, Maximum Width of Binary Tree.
`,
  traps: [
    { trap: "Use list.pop(0) as the queue.", why: "Each pop is O(n), making BFS O(n²) on large trees. Use collections.deque." },
    { trap: "Read len(q) inside the inner loop.", why: "The queue grows as children are added. Fix the level size at the start of each round with range(len(q))." },
    { trap: "Minimum depth = min(depth(left), depth(right)) + 1.", why: "A node with one child isn't a leaf; taking min with the empty side's 0 gives the wrong answer. Only leaves end a path." },
  ],
  say: {
    prompt: "Return the right-side view of a binary tree. Explain your approach and its complexity.",
    secs: 40,
    check: ["BFS with a deque, level by level", "Fix level size with len(q) at the start of each round", "Record the last node of each level", "O(n) time, O(width) space", "Alternative: DFS visiting right first, record the first node seen at each depth"],
    followups: [
      { q: "How would you do it with DFS?", a: "Pre-order visiting right before left, passing depth; when depth equals the length of the result list, append the node: it's the first (rightmost) at that depth." },
      { q: "Why is BFS better for minimum depth?", a: "It reaches the shallowest leaf first and can stop immediately; DFS must explore every path." },
      { q: "What's the worst-case queue size?", a: "The widest level, up to about n/2 nodes in a complete tree's last level, so O(n)." },
    ],
    answer: `I do a breadth-first traversal with a deque. At the start of each round I take the queue length, which is the number of nodes on the current level, and pop exactly that many, adding their children to the back. The last node I pop in each round is the one visible from the right, so I record it.

Every node is enqueued and dequeued once, so it's O(n) time, and the queue holds at most one level, O(width) space. An alternative is DFS that visits the right child first and records the first node it sees at each new depth.`,
    avoid: ["Taking only the rightmost child path (misses left nodes that stick out)", "Using list.pop(0)"],
  },
  terms: [["BFS", "Visit nodes in order of distance from the root using a queue."], ["Level size", "len(q) at the start of a round."], ["Width", "Number of nodes (or index span) on a level."]],
  sources: [S.lcLevel, S.trav, D.coll],
});
Q({ id: "dsa2-tb-1", d: 1, secs: 45, prompt: "Right-side view of [1, 2, 3, None, 5, None, 4]. Sum of the visible values?", answer: 8, tol: 0.5, explain: "[1, 3, 4].", py: TH + "r = build([1,2,3,None,5,None,4]); q = deque([r]); out = []\nwhile q:\n    for i in range(len(q)):\n        n = q.popleft()\n        if n.left: q.append(n.left)\n        if n.right: q.append(n.right)\n    out.append(n.val)\nanswer = sum(out)" });
Q({ id: "dsa2-tb-2", d: 1, secs: 45, prompt: "Minimum depth of [2, None, 3, None, 4, None, 5, None, 6]?", answer: 5, tol: 0.5, explain: "It's a chain; the only leaf is 6 at depth 5.", py: TH + "r = build([2,None,3,None,4,None,5,None,6]); q = deque([(r,1)])\nwhile q:\n    n, d = q.popleft()\n    if not n.left and not n.right: answer = d; break\n    if n.left: q.append((n.left, d+1))\n    if n.right: q.append((n.right, d+1))" });
Q({ id: "dsa2-tb-3", d: 2, secs: 60, prompt: "Tree [1, 7, 0, 7, −8]. Which level (root = 1) has the largest sum?", answer: 2, tol: 0.5, explain: "Level sums 1, 7, −1.", py: TH + "r = build([1,7,0,7,-8]); q = deque([r]); best, lvl, ans = None, 0, 0\nwhile q:\n    lvl += 1; s = 0\n    for _ in range(len(q)):\n        n = q.popleft(); s += n.val\n        if n.left: q.append(n.left)\n        if n.right: q.append(n.right)\n    if best is None or s > best: best, ans = s, lvl\nanswer = ans" });
Q({ id: "dsa2-tb-4", d: 2, secs: 60, prompt: "Zigzag level order of [3, 9, 20, None, None, 15, 7] (left-to-right first). What is the first value of the second row?", answer: 20, tol: 0.5, explain: "[[3], [20, 9], [15, 7]].", py: TH + "r = build([3,9,20,None,None,15,7]); q = deque([r]); out = []\nwhile q:\n    row = []\n    for _ in range(len(q)):\n        n = q.popleft(); row.append(n.val)\n        if n.left: q.append(n.left)\n        if n.right: q.append(n.right)\n    out.append(row[::-1] if len(out) % 2 else row)\nanswer = out[1][0]" });
C("dsa2-tb-c1", "Level-order loop", "while q: for _ in range(len(q)): n = q.popleft(); push children.");
C("dsa2-tb-c2", "BFS for minimum depth", "Return at the first leaf dequeued: it's the shallowest.");

L("dsa2-tree-paths", TR, "Tree DP: returning information up the tree", "Post-order functions that return a summary (height, best path) while updating a global answer: diameter, balance, maximum path sum, path counts.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-tree-dfs"],
  hook: "The longest path between any two nodes may not pass through the root. How can one traversal find it?",
  intuition: `
**The situation.** "Diameter", "maximum path sum", "is it balanced", "longest path with equal values". The answer for the whole tree may sit anywhere, but it's built from information about subtrees.

**The idea.** Separate two things:

- **What the function returns to its parent:** something a parent can extend, usually the best path going **down** from this node through one child.
- **What it records globally:** the best answer that **bends** at this node, using both children.

For diameter: return height; at each node, the path through it has length \`left_height + right_height\`; keep the maximum.

**Top-down state** is the mirror image: pass information down (the max so far on the path, the running sum) as arguments. "Count good nodes" and "path sum from root" work this way.
`,
  maths: `
**In one breath.** \`def h(n): if not n: return 0; L, R = h(n.left), h(n.right); best = max(best, combine(L, R, n)); return extend(L, R, n)\`; $O(n)$ time, $O(h)$ space.

**Template: diameter (edges on the longest path).**

\`\`\`python
def diameter(root):
    best = 0
    def height(n):
        nonlocal best
        if not n:
            return 0
        L, R = height(n.left), height(n.right)
        best = max(best, L + R)          # path bending at n
        return 1 + max(L, R)             # path a parent can extend
    height(root)
    return best
# [1, 2, 3, 4, 5] -> 3  (4-2-1-3 or 5-2-1-3)
\`\`\`

**Worked problem 1: maximum path sum (values may be negative).**

\`\`\`python
def max_path_sum(root):
    best = float("-inf")
    def gain(n):
        nonlocal best
        if not n:
            return 0
        L = max(gain(n.left), 0)         # drop a negative branch
        R = max(gain(n.right), 0)
        best = max(best, n.val + L + R)
        return n.val + max(L, R)         # only one branch can continue upwards
    gain(root)
    return best
# [-10, 9, 20, None, None, 15, 7] -> 42  (15 + 20 + 7)
\`\`\`

**Worked problem 2: height-balanced check in one pass.** Return −1 as a "not balanced" signal so you don't recompute heights.

\`\`\`python
def balanced(root):
    def h(n):
        if not n:
            return 0
        L, R = h(n.left), h(n.right)
        if L < 0 or R < 0 or abs(L - R) > 1:
            return -1
        return 1 + max(L, R)
    return h(root) >= 0
\`\`\`

**Worked problem 3 (top-down): count downward paths summing to k.** Carry a Counter of prefix sums along the current root-to-node path, exactly like subarray sum = k; undo the count on the way back up.

\`\`\`python
from collections import Counter
def path_sum_count(root, k):
    seen = Counter({0: 1})
    def dfs(n, total):
        if not n:
            return 0
        total += n.val
        c = seen[total - k]
        seen[total] += 1
        c += dfs(n.left, total) + dfs(n.right, total)
        seen[total] -= 1                 # backtrack: leave this path
        return c
    return dfs(root, 0)
\`\`\`

**Edge cases.** All-negative trees (max path sum is the largest single value, so initialise \`best\` to −∞); a single node; diameter counted in edges vs nodes.
`,
  practice: `
**Signals:** "any path" (not necessarily through the root), "longest/maximum path", "balanced", "count paths with sum", "good nodes" (top-down max), "house robber on a tree" (return a pair: rob / skip).

**Variations.** Longest Univalue Path (extend only when the child's value matches), Binary Tree Cameras (return a state), House Robber III (return (with, without)), Count Good Nodes (pass the path max down).

**Practise:** Diameter of Binary Tree, Balanced Binary Tree, Binary Tree Maximum Path Sum, Path Sum II, Path Sum III, Count Good Nodes in Binary Tree, Longest Univalue Path, House Robber III.
`,
  traps: [
    { trap: "Return left + right + node.val to the parent in max path sum.", why: "A parent can extend only one branch; a path can't fork. Return node.val + max(L, R) and record the forked value globally." },
    { trap: "Check balance by calling height() at every node.", why: "That's O(n²) on skewed trees. Compute height and balance in the same post-order pass." },
    { trap: "Initialise the best path sum to 0.", why: "If all values are negative the answer is the largest (least negative) value, not 0. Start at −∞." },
  ],
  say: {
    prompt: "Find the maximum path sum in a binary tree where a path can start and end at any node.",
    secs: 50,
    check: ["Post-order: compute children's gains first", "Clamp negative gains to 0", "Global best = node + left gain + right gain", "Return node + max(left, right) to the parent", "O(n) time, O(h) space; best starts at −∞"],
    followups: [
      { q: "Why can the returned value use only one child?", a: "The parent will attach this path to itself; a path through the parent can enter this node from above and leave through only one child, otherwise it would branch." },
      { q: "How does diameter differ?", a: "Same structure with heights instead of gains: record L + R at each node, return 1 + max(L, R). No clamping is needed since heights are non-negative." },
      { q: "How would you also return the path itself?", a: "Return (gain, path) pairs or store parent pointers and the best node; reconstruct by following the chosen child at each step down both sides." },
    ],
    answer: `I use a post-order function that returns the best 'gain' a parent could get by extending a path down into this node. For a node, I compute the gains of the left and right children, clamping each at zero because a negative branch is better left out.

The best path that bends at this node is its value plus both gains, and I compare that with a global best. What I return upwards is the value plus the larger gain, since a path continuing to the parent can use only one branch. Every node is processed once, O(n) time and O(h) stack space. The global best starts at minus infinity so an all-negative tree returns its largest value.`,
    avoid: ["Returning both branches to the parent", "Starting best at 0"],
  },
  terms: [["Bending path", "A path whose highest node uses both children."], ["Gain", "Best downward path sum starting at a node."], ["Top-down state", "Information passed from parent to child as arguments."]],
  sources: [S.trav, D.dp],
});
Q({ id: "dsa2-tp2-1", d: 1, secs: 45, prompt: "Diameter (in edges) of the tree [1, 2, 3, 4, 5]?", answer: 3, tol: 0.5, explain: "4 → 2 → 1 → 3.", py: TH + "best = 0\ndef h(n):\n    global best\n    if not n: return 0\n    L, R = h(n.left), h(n.right)\n    best = max(best, L+R); return 1+max(L, R)\nh(build([1,2,3,4,5]))\nanswer = best" });
Q({ id: "dsa2-tp2-2", d: 2, secs: 60, prompt: "Maximum path sum of [−10, 9, 20, None, None, 15, 7]?", answer: 42, tol: 0.5, explain: "15 + 20 + 7.", py: TH + "best = float('-inf')\ndef g(n):\n    global best\n    if not n: return 0\n    L = max(g(n.left), 0); R = max(g(n.right), 0)\n    best = max(best, n.val+L+R); return n.val+max(L, R)\ng(build([-10,9,20,None,None,15,7]))\nanswer = best" });
Q({ id: "dsa2-tp2-3", d: 2, secs: 60, prompt: "Count 'good' nodes in [3, 1, 4, 3, None, 1, 5]: nodes with no larger value on the path from the root.", answer: 4, tol: 0.5, explain: "3 (root), 3, 4, 5.", py: TH + "def f(n, mx):\n    if not n: return 0\n    g = n.val >= mx; mx = max(mx, n.val)\n    return g + f(n.left, mx) + f(n.right, mx)\nanswer = f(build([3,1,4,3,None,1,5]), float('-inf'))" });
Q({ id: "dsa2-tp2-4", d: 3, secs: 90, prompt: "How many downward paths in [10, 5, −3, 3, 2, None, 11, 3, −2, None, 1] sum to 8?", answer: 3, tol: 0.5, explain: "5 → 3, 5 → 2 → 1, −3 → 11.", py: TH + "from collections import Counter\nseen = Counter({0: 1})\ndef dfs(n, t):\n    if not n: return 0\n    t += n.val; c = seen[t-8]; seen[t] += 1\n    c += dfs(n.left, t) + dfs(n.right, t); seen[t] -= 1\n    return c\nanswer = dfs(build([10,5,-3,3,2,None,11,3,-2,None,1]), 0)" });
Q({ id: "dsa2-tp2-5", d: 2, secs: 45, prompt: "Is [1, 2, 2, 3, 3, None, None, 4, 4] height-balanced? Answer 1 for yes, 0 for no.", answer: 0, tol: 0.5, explain: "Root's left subtree has height 3, right has 1.", py: TH + "def h(n):\n    if not n: return 0\n    L, R = h(n.left), h(n.right)\n    if L < 0 or R < 0 or abs(L-R) > 1: return -1\n    return 1+max(L, R)\nanswer = int(h(build([1,2,2,3,3,None,None,4,4])) >= 0)" });
C("dsa2-tp2-c1", "Return vs record", "Return the extendable one-branch value; record the two-branch value globally.");
C("dsa2-tp2-c2", "Max path sum", "L, R = max(gain, 0); best = max(best, v + L + R); return v + max(L, R).");

L("dsa2-bst", TR, "Binary search trees", "The ordering invariant, search and insert in O(h), validating with bounds, k-th smallest via in-order, and LCA by walking down.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-tree-dfs", "dsa2-binary-search"],
  hook: "Every node's left child is smaller and right child is larger. Is that enough to make a valid BST?",
  intuition: `
**The situation.** A binary search tree keeps values ordered: everything in a node's left subtree is smaller, everything in its right subtree is larger. It's a tree-shaped binary search.

**The idea.** At each node you know which side the target must be on, so search, insert and delete walk one path: $O(h)$. Balanced trees have $h \\approx \\log_2 n$; inserting sorted data into a plain BST makes a chain with $h = n$.

Two consequences used constantly:

- **In-order traversal is sorted.** k-th smallest, validate, convert to a sorted list.
- **The invariant is about whole subtrees, not just children.** Validation must pass down a \`(low, high)\` range.
`,
  maths: `
**In one breath.** Search: go left if \`x < node.val\`, right if larger; validate with \`(lo, hi)\` bounds; in-order = sorted; LCA: first node with \`p ≤ node ≤ q\`; $O(h)$ per operation.

**Template: search and insert.**

\`\`\`python
def search(n, x):
    while n and n.val != x:
        n = n.left if x < n.val else n.right
    return n

def insert(n, x):
    if not n:
        return TreeNode(x)
    if x < n.val:
        n.left = insert(n.left, x)
    else:
        n.right = insert(n.right, x)
    return n
\`\`\`

**Worked problem 1: validate a BST.**

\`\`\`python
def valid(n, lo=float("-inf"), hi=float("inf")):
    if not n:
        return True
    if not (lo < n.val < hi):
        return False
    return valid(n.left, lo, n.val) and valid(n.right, n.val, hi)
# [5, 1, 4, None, None, 3, 6] -> False: 3 is in 5's right subtree
\`\`\`

Equivalent check: the in-order sequence is strictly increasing.

**Worked problem 2: k-th smallest.** Iterative in-order, stop at the k-th pop: $O(h + k)$.

\`\`\`python
def kth_smallest(root, k):
    st, cur = [], root
    while True:
        while cur:
            st.append(cur); cur = cur.left
        cur = st.pop()
        k -= 1
        if k == 0:
            return cur.val
        cur = cur.right
# [5, 3, 6, 2, 4, None, None, 1], k = 3 -> 3
\`\`\`

**Worked problem 3: lowest common ancestor in a BST.** Walk from the root: if both values are smaller go left, if both larger go right, otherwise this node splits them and is the LCA.

\`\`\`python
def lca_bst(n, p, q):
    while n:
        if p < n.val and q < n.val: n = n.left
        elif p > n.val and q > n.val: n = n.right
        else: return n
\`\`\`

**Sorted array → balanced BST:** take the middle as the root, recurse on each half: height $\\lceil\\log_2(n+1)\\rceil$.

**Edge cases.** Duplicates (define a side, or disallow); values at the integer limits (use ±∞ bounds); empty tree; deleting a node with two children (replace with its in-order successor).
`,
  practice: `
**Signals:** "BST" in the prompt, "sorted order", "k-th smallest", "closest value", "range sum", "successor", "validate".

**Variations.** Range Sum of BST (prune branches outside the range), Inorder Successor (track the last node where you went left), Delete Node in a BST, Two Sum IV (in-order + two pointers, or a set), Recover BST (find the two inversions in in-order).

**Practise:** Search in a BST, Insert into a BST, Validate Binary Search Tree, Kth Smallest Element in a BST, Lowest Common Ancestor of a BST, Convert Sorted Array to BST, Delete Node in a BST, Range Sum of BST.
`,
  traps: [
    { trap: "Validate by checking left.val < node.val < right.val at every node.", why: "A grandchild can violate an ancestor: [5, 1, 4, None, None, 3, 6] passes local checks at 4 but 3 < 5 sits in 5's right subtree. Pass bounds down." },
    { trap: "BST operations are O(log n).", why: "Only if the tree is balanced. Inserting sorted values gives a chain and O(n) operations." },
    { trap: "Use the general-tree LCA on a BST.", why: "It works but ignores the ordering. In a BST you walk one path: O(h) time, O(1) space." },
  ],
  say: {
    prompt: "How do you check whether a binary tree is a valid BST?",
    secs: 40,
    check: ["Invariant is about whole subtrees, not just children", "Pass (low, high) bounds down; left gets (low, val), right gets (val, high)", "Or: in-order sequence strictly increasing", "O(n) time, O(h) space", "Duplicates and extreme values handled (±∞ bounds)"],
    followups: [
      { q: "What's wrong with comparing only a node with its children?", a: "A deeper node can violate an ancestor's bound, e.g. a value smaller than the root inside the root's right subtree. Local checks miss it." },
      { q: "How would you find the k-th smallest if the tree is modified often?", a: "Store subtree sizes in each node; at each step compare k with the left subtree size to choose a side: O(h) per query." },
      { q: "How do you delete a node with two children?", a: "Replace its value with the in-order successor (the leftmost node of its right subtree) and delete that successor from the right subtree, which has at most one child." },
    ],
    answer: `The BST rule applies to whole subtrees, so I can't just compare each node with its children. I pass down an allowed range: the root can be anything, a left child must be below its parent's value and above the parent's own lower bound, and a right child must be above its parent's value and below the parent's upper bound. If any node falls outside its range, the tree is invalid.

That visits each node once, O(n) time and O(h) stack. An equivalent approach is an in-order traversal checking that each value is strictly greater than the previous one. I start the bounds at minus and plus infinity so values at the integer limits work, and I treat duplicates according to the problem's definition.`,
    avoid: ["Only comparing parent and children", "Assuming O(log n) without balance"],
  },
  terms: [["BST invariant", "Left subtree < node < right subtree, recursively."], ["In-order successor", "Smallest value larger than the node: leftmost in its right subtree."], ["Balanced", "Height O(log n)."]],
  sources: [D.bst, S.trav],
});
Q({ id: "dsa2-bt-1", d: 2, secs: 45, prompt: "Is [5, 1, 4, None, None, 3, 6] a valid BST? Answer 1 for yes, 0 for no.", answer: 0, tol: 0.5, explain: "4 (and 3) sit in 5's right subtree but are smaller than 5.", py: TH + "def v(n, lo=float('-inf'), hi=float('inf')):\n    if not n: return True\n    if not (lo < n.val < hi): return False\n    return v(n.left, lo, n.val) and v(n.right, n.val, hi)\nanswer = int(v(build([5,1,4,None,None,3,6])))" });
Q({ id: "dsa2-bt-2", d: 1, secs: 45, prompt: "3rd smallest value in the BST [5, 3, 6, 2, 4, None, None, 1]?", answer: 3, tol: 0.5, explain: "In-order: 1, 2, 3, 4, 5, 6.", py: TH + "out = []\ndef io(n):\n    if n: io(n.left); out.append(n.val); io(n.right)\nio(build([5,3,6,2,4,None,None,1]))\nanswer = out[2]" });
Q({ id: "dsa2-bt-3", d: 2, secs: 45, prompt: "BST [6, 2, 8, 0, 4, 7, 9, None, None, 3, 5]. LCA of 3 and 5?", answer: 4, tol: 0.5, explain: "Both are below 6 and 2 on the same side; 4 splits them.", py: TH + "n = build([6,2,8,0,4,7,9,None,None,3,5]); p, q = 3, 5\nwhile n:\n    if p < n.val and q < n.val: n = n.left\n    elif p > n.val and q > n.val: n = n.right\n    else: break\nanswer = n.val" });
Q({ id: "dsa2-bt-4", d: 1, secs: 45, prompt: "Insert 1, 2, 3, 4, 5, 6, 7 in that order into an empty BST. What is its height in nodes?", answer: 7, tol: 0.5, explain: "Each value goes right: a chain. Built from the middle out, height would be 3.", py: "class N:\n    def __init__(s, v): s.val, s.left, s.right = v, None, None\ndef ins(n, x):\n    if not n: return N(x)\n    if x < n.val: n.left = ins(n.left, x)\n    else: n.right = ins(n.right, x)\n    return n\nr = None\nfor x in range(1, 8): r = ins(r, x)\ndef h(n): return 0 if not n else 1 + max(h(n.left), h(n.right))\nanswer = h(r)" });
C("dsa2-bt-c1", "Validate a BST", "Pass (lo, hi) down: left (lo, val), right (val, hi).");
C("dsa2-bt-c2", "LCA in a BST", "Both smaller → left; both larger → right; otherwise current node.");

L("dsa2-tree-build", TR, "LCA, construction and serialisation", "Lowest common ancestor in any binary tree, rebuilding a tree from two traversals, and turning a tree into a string and back.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-tree-dfs", "dsa2-hashmap"],
  hook: "Given pre-order and in-order traversals, rebuild the tree. Which value is the root, and how do you know which values go left?",
  intuition: `
**The situation.** Three interview favourites that look different but share one move: use what a traversal tells you about the root.

- **LCA in a general tree:** ask each subtree "did you find p or q?". The first node where both sides answer yes (or the node itself is one of them) is the LCA.
- **Construction:** pre-order starts with the root; in in-order, everything left of the root is the left subtree. Recurse.
- **Serialisation:** pre-order with a marker for empty children is enough to rebuild a tree uniquely.
`,
  maths: `
**In one breath.** LCA: return the node if it's p or q, else combine children (both non-null → this node); build: root = next pre-order value, split in-order at its index (dict lookup); serialise: pre-order with '#'.

**Template: LCA in a binary tree.**

\`\`\`python
def lca(n, p, q):                        # p, q are nodes in the tree
    if not n or n is p or n is q:
        return n
    L, R = lca(n.left, p, q), lca(n.right, p, q)
    if L and R:
        return n                         # p and q on different sides
    return L or R                        # both on one side (or none)
# [3, 5, 1, 6, 2, 0, 8, None, None, 7, 4]: lca(5, 1) = 3, lca(5, 4) = 5
\`\`\`

$O(n)$ time, $O(h)$ space. Assumes both nodes exist.

**Worked problem 1: build from pre-order and in-order.**

\`\`\`python
def build_tree(pre, ino):
    idx = {v: i for i, v in enumerate(ino)}   # O(1) split point (values unique)
    it = iter(pre)
    def go(lo, hi):                           # in-order slice [lo, hi)
        if lo >= hi:
            return None
        v = next(it)                          # next pre-order value is this root
        node = TreeNode(v)
        node.left = go(lo, idx[v])            # build left first: pre-order order
        node.right = go(idx[v] + 1, hi)
        return node
    return go(0, len(ino))
# pre [3, 9, 20, 15, 7], in [9, 3, 15, 20, 7] -> [3, 9, 20, None, None, 15, 7]
\`\`\`

$O(n)$ with the index dict; $O(n^2)$ if you call \`ino.index(v)\` each time.

**Worked problem 2: serialise and deserialise.**

\`\`\`python
def serialise(n):
    out = []
    def go(n):
        if not n:
            out.append("#"); return
        out.append(str(n.val)); go(n.left); go(n.right)
    go(n)
    return ",".join(out)

def deserialise(s):
    it = iter(s.split(","))
    def go():
        v = next(it)
        if v == "#":
            return None
        n = TreeNode(int(v))
        n.left = go(); n.right = go()
        return n
    return go()
\`\`\`

A tree with $n$ nodes produces $2n + 1$ tokens ($n$ values, $n + 1$ empty markers).

**Edge cases.** LCA when one node is an ancestor of the other (return it); duplicate values break the in-order index (needs unique values); negative numbers and multi-digit values in serialisation (use a separator).
`,
  practice: `
**Signals:** "lowest common ancestor", "construct from traversals", "serialise/deserialise", "encode a tree", "distance between two nodes" (depth(p) + depth(q) − 2·depth(LCA)).

**Variations.** Build from in-order and post-order (take roots from the end, build right first), LCA with parent pointers (like intersecting linked lists), All Nodes Distance K (add parent links, then BFS), Find Duplicate Subtrees (serialise each subtree, count).

**Practise:** Lowest Common Ancestor of a Binary Tree, Construct Binary Tree from Preorder and Inorder Traversal, Construct from Inorder and Postorder, Serialize and Deserialize Binary Tree, All Nodes Distance K in Binary Tree, Find Duplicate Subtrees.
`,
  traps: [
    { trap: "Use ino.index(root) in each recursive call.", why: "Each call scans the list: O(n²). Build a value → index dict once." },
    { trap: "Serialise only the values in pre-order.", why: "Without null markers, different trees give the same sequence. Include '#' for empty children (or use two traversals)." },
    { trap: "In LCA, keep searching after finding p.", why: "If q is under p, p is the LCA; returning p immediately is correct and avoids extra work." },
  ],
  say: {
    prompt: "Find the lowest common ancestor of two nodes in a binary tree (not a BST).",
    secs: 45,
    check: ["Recursive: return the node if it's None, p or q", "Combine: both children non-null → this node is the LCA", "Otherwise pass up whichever side is non-null", "Handles one node being the ancestor of the other", "O(n) time, O(h) space"],
    followups: [
      { q: "What if p or q might not be in the tree?", a: "Track whether each was actually found (counters or flags) during a full traversal, and return None unless both were seen." },
      { q: "How would you answer many LCA queries quickly?", a: "Preprocess depths and parents with binary lifting (O(n log n) preprocessing, O(log n) per query), or an Euler tour with a sparse table for O(1) queries." },
      { q: "How do you get the distance between two nodes?", a: "Find the LCA, then distance = depth(p) + depth(q) − 2·depth(LCA)." },
    ],
    answer: `I use a recursive function that returns a node from each subtree: None if neither p nor q is there, otherwise p, q or an already found LCA. At a node, if it is None, p or q, I return it straight away. Otherwise I recurse left and right. If both sides return something, p and q are on different sides and this node is their lowest common ancestor. If only one side does, I pass that result up.

That covers the case where one node is the ancestor of the other, because the search stops at the ancestor and returns it. Each node is visited once, so O(n) time and O(h) space. It assumes both nodes exist; if not, I'd track whether each was actually found.`,
    avoid: ["Using the BST shortcut on a general tree", "Storing root-to-node paths when a single pass works"],
  },
  terms: [["LCA", "Deepest node that has both p and q as descendants (a node counts as its own descendant)."], ["Null marker", "Placeholder such as '#' for an empty child."], ["Index map", "Value → position in in-order, for O(1) splits."]],
  sources: [S.lca, S.trav],
});
Q({ id: "dsa2-tbd-1", d: 2, secs: 45, prompt: "Tree [3, 5, 1, 6, 2, 0, 8, None, None, 7, 4]. LCA of nodes 6 and 4?", answer: 5, tol: 0.5, explain: "6 is 5's left child; 4 is under 5's right child 2.", py: TH + "r = build([3,5,1,6,2,0,8,None,None,7,4])\ndef find(n, v):\n    if not n: return None\n    if n.val == v: return n\n    return find(n.left, v) or find(n.right, v)\np, q = find(r, 6), find(r, 4)\ndef lca(n):\n    if not n or n is p or n is q: return n\n    L, R = lca(n.left), lca(n.right)\n    return n if L and R else (L or R)\nanswer = lca(r).val" });
Q({ id: "dsa2-tbd-2", d: 2, secs: 60, prompt: "Rebuild from pre-order [3, 9, 20, 15, 7] and in-order [9, 3, 15, 20, 7]. What is the third value of its post-order?", answer: 7, tol: 0.5, explain: "Post-order: 9, 15, 7, 20, 3.", py: "pre, ino = [3,9,20,15,7], [9,3,15,20,7]\nidx = {v: i for i, v in enumerate(ino)}; it = iter(pre); out = []\ndef go(lo, hi):\n    if lo >= hi: return None\n    v = next(it)\n    L = go(lo, idx[v]); R = go(idx[v]+1, hi)\n    return (v, L, R)\ndef post(t):\n    if t: post(t[1]); post(t[2]); out.append(t[0])\npost(go(0, len(ino)))\nanswer = out[2]" });
Q({ id: "dsa2-tbd-3", d: 1, secs: 30, prompt: "Pre-order serialisation with '#' for every empty child: how many tokens for a tree of 6 nodes?", answer: 13, tol: 0.5, explain: "2n + 1: 6 values and 7 null markers.", py: TH + "r = build([1,2,3,4,5,6]); out = []\ndef go(n):\n    if not n: out.append('#'); return\n    out.append(str(n.val)); go(n.left); go(n.right)\ngo(r)\nanswer = len(out)" });
Q({ id: "dsa2-tbd-4", d: 2, secs: 60, prompt: "In [3, 5, 1, 6, 2, 0, 8, None, None, 7, 4], what is the distance in edges between nodes 7 and 8?", answer: 5, tol: 0.5, explain: "LCA is 3: depth(7) = 3, depth(8) = 2, depth(3) = 0 → 3 + 2 − 0.", py: TH + "r = build([3,5,1,6,2,0,8,None,None,7,4])\ndef path(n, v):\n    if not n: return None\n    if n.val == v: return [n.val]\n    p = path(n.left, v) or path(n.right, v)\n    return [n.val] + p if p else None\na, b = path(r, 7), path(r, 8)\nk = 0\nwhile k < min(len(a), len(b)) and a[k] == b[k]: k += 1\nanswer = (len(a)-k) + (len(b)-k)" });
C("dsa2-tbd-c1", "General-tree LCA", "If node is None/p/q return it; L and R both set → node; else L or R.");
C("dsa2-tbd-c2", "Build from pre + in", "Root = next pre-order value; split in-order at its index (dict); build left first.");

L("dsa2-tree-practice", TR, "Trees practice", "Tree problems to explain: recursion shape, traversal choice, complexity.", {
  kind: "interview", mins: 30, prereq: ["dsa2-tree-dfs", "dsa2-tree-bfs", "dsa2-tree-paths", "dsa2-bst", "dsa2-tree-build"],
  hook: "For each: what does the recursive call return, or why BFS? Then time and space.",
}, [
  iq("Subtree of Another Tree: is t a subtree of s?", "At every node of s, check same(node, t). O(m·n) worst case, O(h) space. Faster: serialise both with null markers and delimiters and check substring (O(m + n) with KMP), or compare subtree hashes.", ["same() at every node", "O(m·n) baseline", "Serialisation or hashing for O(m + n)", "Null markers needed to avoid false matches"]),
  iq("All Nodes Distance K from a target node.", "Add parent links with a DFS (dict child → parent), then BFS from the target over left, right and parent edges with a visited set, stopping at depth k. O(n) time and space.", ["Tree as undirected graph", "Parent map", "BFS with visited", "O(n)"]),
  iq("Kth Smallest in a BST, called many times while the tree changes.", "Augment nodes with subtree sizes, updated on insert/delete. At a node, let L = size(left): if k ≤ L go left; if k == L + 1 return the node; else go right with k − L − 1. O(h) per query.", ["In-order O(h + k) baseline", "Subtree sizes", "Walk by comparing k with left size", "O(h) per query"]),
  iq("House Robber III: maximise the sum of values with no two directly linked nodes chosen.", "Post-order returning a pair (rob this node, skip this node): rob = val + left.skip + right.skip; skip = max(left) + max(right). Answer max of the root's pair. O(n) time, O(h) space.", ["Return two states per node", "Recurrence for rob and skip", "Post-order", "O(n)"]),
  iq("Binary Tree Vertical Order Traversal.", "BFS carrying a column index (left −1, right +1); append values to a dict of column → list; output columns from min to max. BFS keeps top-to-bottom order within a column. O(n) time (track min/max column to avoid sorting).", ["Column index per node", "BFS for top-to-bottom order", "Dict of lists", "Avoid sorting by tracking range"]),
  iq("Serialize and deserialize a binary tree. What format and why?", "Pre-order with a null marker and a delimiter: '1,2,#,#,3,4,#,#,5,#,#'. Deserialise with an iterator, recursively reading value, left, right. O(n) both ways. Level-order with nulls also works (LeetCode style); both need markers to be unambiguous.", ["Pre-order with null markers", "Delimiter for multi-digit/negatives", "Iterator-based rebuild", "O(n)"]),
]);

// ───────────────────────── Heaps ─────────────────────────

L("dsa2-heapq", HP, "Heaps with heapq", "Python's min-heap: push and pop in O(log n), heapify in O(n), max-heaps by negation, tuples for priorities, and when a heap beats sorting.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-sorting", "dsa2-python-costs"],
  hook: "You need the smallest item again and again while new items keep arriving. Re-sorting each time is O(n log n). What gives you the minimum in O(log n)?",
  intuition: `
**The situation.** Repeatedly taking the smallest (or largest) of a changing collection: scheduling, simulations, merging, "smash the two heaviest stones".

**The idea.** A binary heap is a complete binary tree stored in a list where each parent is ≤ its children. The minimum is always at index 0. Push and pop fix the order along one root-to-leaf path: $O(\\log n)$.

Python's \`heapq\` works on a plain list and is a **min-heap**:

- \`heappush(h, x)\`, \`heappop(h)\`: $O(\\log n)$; \`h[0]\` peeks in $O(1)$.
- \`heapify(lst)\`: in place, $O(n)$.
- Max-heap: push \`-x\` and negate when popping.
- Priorities: push tuples \`(priority, tiebreak, item)\`; tuples compare element by element.
`,
  maths: `
**In one breath.** \`heapq\` is a min-heap on a list; push/pop $O(\\log n)$, peek \`h[0]\`, heapify $O(n)$; negate for max; tuples for priority; children of index \`i\` are \`2i + 1\`, \`2i + 2\`.

**Template.**

\`\`\`python
import heapq
h = [5, 3, 8, 1, 9, 2]
heapq.heapify(h)            # h[0] == 1
heapq.heappush(h, 0)
smallest = heapq.heappop(h) # 0
peek = h[0]                 # 1, not removed

mx = []                     # max-heap by negation
for x in [3, 1, 4, 1, 5]:
    heapq.heappush(mx, -x)
largest = -heapq.heappop(mx)   # 5
\`\`\`

**Worked problem 1: k-th largest element.** Keep a **min-heap of size k**: it holds the k largest seen so far and its top is the k-th largest.

\`\`\`python
def kth_largest(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)     # drop the smallest of k + 1
    return h[0]
kth_largest([3, 2, 1, 5, 6, 4], 2)   # 5
\`\`\`

$O(n\\log k)$ time, $O(k)$ space. \`heapq.nlargest(k, nums)[-1]\` does the same.

**Worked problem 2: smash stones.** Repeatedly take the two heaviest, put back their difference if non-zero.

\`\`\`python
def last_stone(stones):
    h = [-s for s in stones]
    heapq.heapify(h)
    while len(h) > 1:
        a, b = -heapq.heappop(h), -heapq.heappop(h)
        if a != b:
            heapq.heappush(h, -(a - b))
    return -h[0] if h else 0
last_stone([2, 7, 4, 1, 8, 1])       # 1
\`\`\`

**Worked problem 3: sort a k-sorted array** (each element at most k places from its spot). Slide a heap of size k + 1: $O(n\\log k)$.

**Edge cases.** Popping an empty heap raises IndexError; tuples with equal priorities compare the next field (add a counter if items aren't comparable); \`heapify\` returns None and works in place.
`,
  practice: `
**Signals:** "k-th largest/smallest", "repeatedly take the smallest/largest", "merge sorted", "schedule by earliest/cheapest", "simulate", "stream".

**Heap vs alternatives.** One-off k-th element: quickselect averages $O(n)$. All in order: sort. Need the min and max both: two heaps or a sorted container. Need to delete arbitrary items: lazy deletion (mark and skip when popped).

**Practise:** Kth Largest Element in an Array, Last Stone Weight, Kth Largest Element in a Stream, Sort a K-Sorted Array, Minimum Cost to Connect Sticks, Seat Reservation Manager, Furthest Building You Can Reach.
`,
  traps: [
    { trap: "heapq has a max-heap mode for everyday use.", why: "The standard interface is a min-heap; newer versions add *_max helpers but OA environments may not have them. Negate values, or negate the priority in a tuple." },
    { trap: "The heap list is sorted.", why: "Only h[0] is guaranteed to be the minimum; the rest is partially ordered. Don't read h[1] as the second smallest." },
    { trap: "For the k-th largest, use a max-heap of all n items.", why: "That's O(n + k log n) and O(n) memory. A min-heap of size k is O(n log k) and O(k) memory, and works on streams." },
  ],
  say: {
    prompt: "Find the k-th largest element in an array. Compare a heap approach with sorting and quickselect.",
    secs: 45,
    check: ["Min-heap of size k; pop when it exceeds k; answer h[0]", "O(n log k) time, O(k) space; works on streams", "Sorting: O(n log n)", "Quickselect: O(n) average, O(n²) worst", "Python heapq is a min-heap"],
    followups: [
      { q: "Why a min-heap for the k-th largest?", a: "It keeps the k largest values seen; the smallest of them, at the top, is the k-th largest. Anything smaller than the top can be discarded immediately." },
      { q: "Why is heapify O(n) rather than O(n log n)?", a: "Sifting down from the bottom up: most nodes are near the leaves and move only a little; the total work sums to O(n)." },
      { q: "How do you remove an arbitrary element from a heap?", a: "Lazy deletion: record it in a 'deleted' Counter and discard it when it reaches the top. Or swap with the last element, pop, and sift (needs the index)." },
    ],
    answer: `I keep a min-heap of at most k elements. For each number I push it, and if the heap grows beyond k I pop the smallest. At the end the heap holds the k largest values and its top, h[0], is the k-th largest. That's O(n log k) time and O(k) space, and it works on a stream.

Sorting is simpler but O(n log n). Quickselect partitions around a pivot and recurses into one side, which is O(n) on average but O(n²) in the worst case unless the pivot is randomised. In Python, heapq is a min-heap, so for problems that need a max-heap I push negated values.`,
    avoid: ["Saying heapq is a max-heap", "Reading h[1] as the second smallest"],
  },
  terms: [["Binary heap", "Complete binary tree in a list; parent ≤ children."], ["heapify", "Turn a list into a heap in O(n), in place."], ["Lazy deletion", "Mark items deleted and skip them when they reach the top."]],
  sources: [D.heapq, S.binHeap],
});
Q({ id: "dsa2-hq-1", d: 1, secs: 45, prompt: "heapify([5, 3, 8, 1, 9, 2]), then heappop twice. What is h[0] now?", answer: 3, tol: 0.5, explain: "Pops 1 and 2; the minimum left is 3.", py: "import heapq\nh = [5,3,8,1,9,2]; heapq.heapify(h)\nheapq.heappop(h); heapq.heappop(h)\nanswer = h[0]" });
Q({ id: "dsa2-hq-2", d: 1, secs: 45, prompt: "4th largest element of [3, 2, 3, 1, 2, 4, 5, 5, 6]?", answer: 4, tol: 0.5, explain: "Descending: 6, 5, 5, 4, …", py: "import heapq\nh = []\nfor x in [3,2,3,1,2,4,5,5,6]:\n    heapq.heappush(h, x)\n    if len(h) > 4: heapq.heappop(h)\nanswer = h[0]" });
Q({ id: "dsa2-hq-3", d: 2, secs: 60, prompt: "Smash the two heaviest stones repeatedly in [2, 7, 4, 1, 8, 1]. Weight of the last stone?", answer: 1, tol: 0.5, explain: "8−7=1, 4−2=2, 2−1=1, 1−1=0, leaving 1.", py: "import heapq\nh = [-s for s in [2,7,4,1,8,1]]; heapq.heapify(h)\nwhile len(h) > 1:\n    a, b = -heapq.heappop(h), -heapq.heappop(h)\n    if a != b: heapq.heappush(h, -(a-b))\nanswer = -h[0] if h else 0" });
Q({ id: "dsa2-hq-4", d: 1, secs: 30, prompt: "Time to build a heap from n items with heapify?", options: ["O(log n)", "O(n)", "O(n log n)", "O(n²)"], answer: 1, explain: "Bottom-up sift-down sums to O(n).", py: "import heapq, random\nrandom.seed(1)\nclass C:\n    n = 0\n    def __init__(s, v): s.v = v\n    def __lt__(s, o): C.n += 1; return s.v < o.v\nn = 4096; a = [C(random.random()) for _ in range(n)]\nheapq.heapify(a)\nanswer = 1 if C.n < 3*n else 2" });
Q({ id: "dsa2-hq-5", d: 2, secs: 60, prompt: "Minimum cost to join sticks [2, 4, 3] where joining lengths a and b costs a + b?", answer: 14, tol: 0.5, explain: "Join 2+3 (5), then 5+4 (9): 14. Always join the two shortest.", py: "import heapq\nh = [2,4,3]; heapq.heapify(h); c = 0\nwhile len(h) > 1:\n    a, b = heapq.heappop(h), heapq.heappop(h); c += a+b; heapq.heappush(h, a+b)\nanswer = c" });
C("dsa2-hq-c1", "heapq basics", "Min-heap; push/pop O(log n); h[0] peek; heapify O(n); negate for max.");
C("dsa2-hq-c2", "k-th largest", "Min-heap of size k; pop when > k; answer h[0]. O(n log k).");

L("dsa2-top-k", HP, "Top-k and k-way merge", "Top-k by frequency or distance with a bounded heap, merging k sorted sequences, and choosing between heap, bucket sort and quickselect.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-heapq", "dsa2-hashmap"],
  hook: "Return the 10 closest stores out of a million. Sorting all of them is wasteful. How big does your heap need to be?",
  intuition: `
**The situation.** "Top k frequent words", "k closest points", "k smallest pairs", "merge k sorted files". You need only a few winners, or the next smallest from several sorted sources.

**The idea.**

- **Bounded heap:** keep at most k candidates. For the k **smallest** by some key, keep a **max-heap** of size k (negate the key) and pop the worst when it overflows. For the k **largest**, a min-heap of size k. $O(n\\log k)$.
- **\`heapq.nsmallest(k, it, key=…)\`** and **\`nlargest\`** do this for you.
- **k-way merge:** put the first element of each sorted list in a heap; pop the smallest, then push the next element from the same list. The heap never holds more than k items.
- **Bucket sort** when keys are small integers (frequencies are 1..n): $O(n)$.
`,
  maths: `
**In one breath.** Top-k largest: min-heap of size k; top-k smallest: max-heap of size k (negated key); merge: heap of \`(value, list_id, index)\`; $O(n\\log k)$.

**Template: k closest points to the origin.**

\`\`\`python
import heapq
def k_closest(points, k):
    h = []                                   # max-heap by distance (negated)
    for x, y in points:
        d = x * x + y * y                    # no sqrt needed to compare
        heapq.heappush(h, (-d, x, y))
        if len(h) > k:
            heapq.heappop(h)                 # remove the farthest
    return [(x, y) for _, x, y in h]
k_closest([(3, 3), (5, -1), (-2, 4)], 2)    # (3, 3) and (-2, 4)
\`\`\`

**Worked problem 1: top k frequent elements, two ways.**

\`\`\`python
from collections import Counter
def top_k_heap(nums, k):
    cnt = Counter(nums)
    return heapq.nlargest(k, cnt, key=cnt.get)     # O(n log k)

def top_k_bucket(nums, k):
    cnt = Counter(nums)
    buckets = [[] for _ in range(len(nums) + 1)]   # index = frequency
    for v, f in cnt.items():
        buckets[f].append(v)
    out = []
    for f in range(len(buckets) - 1, 0, -1):
        for v in buckets[f]:
            out.append(v)
            if len(out) == k:
                return out
top_k_bucket([1, 1, 1, 2, 2, 3], 2)        # [1, 2]
\`\`\`

**Worked problem 2: merge k sorted lists of numbers.**

\`\`\`python
def merge_k(lists):
    h = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]
    heapq.heapify(h)
    out = []
    while h:
        v, i, j = heapq.heappop(h)
        out.append(v)
        if j + 1 < len(lists[i]):
            heapq.heappush(h, (lists[i][j + 1], i, j + 1))
    return out
merge_k([[1, 4, 5], [1, 3, 4], [2, 6]])    # [1, 1, 2, 3, 4, 4, 5, 6]
\`\`\`

$O(N\\log k)$ for $N$ total items. \`heapq.merge(*lists)\` does this lazily.

**Worked problem 3: k-th largest in a stream.** Keep a min-heap of size k across calls; each \`add\` pushes and trims, then returns \`h[0]\`: $O(\\log k)$ per add.

**Edge cases.** k ≥ n (return everything); ties in frequency (clarify order, or add a secondary key such as the word itself); empty lists in a k-way merge.
`,
  practice: `
**Signals:** "top k", "k most/least", "k closest", "k-th in a stream", "merge k sorted", "smallest range covering k lists", "k pairs with smallest sums".

**Variations.** Top K Frequent Words (key \`(-freq, word)\` for alphabetical ties), Find K Pairs with Smallest Sums (heap seeded with (a[i] + b[0]) and expand along b), Smallest Range Covering Elements from K Lists (heap + running max), Reorganize String (max-heap of counts, alternate).

**Practise:** Top K Frequent Elements, Top K Frequent Words, K Closest Points to Origin, Kth Largest Element in a Stream, Merge k Sorted Lists, Find K Pairs with Smallest Sums, Smallest Range Covering Elements from K Lists, Reorganize String.
`,
  traps: [
    { trap: "For the k smallest distances, keep a min-heap of size k.", why: "A min-heap's top is the smallest, so trimming would throw away the best. For k smallest, keep a max-heap (negated) and pop the largest." },
    { trap: "Compute sqrt for distance comparisons.", why: "Squared distance preserves the order and avoids floating-point work." },
    { trap: "Push (value, node) when values can tie.", why: "Python then compares the second field, which may not be comparable. Add a unique tie-breaker such as the list index." },
  ],
  say: {
    prompt: "Return the k most frequent elements. Give a heap solution and a linear-time alternative.",
    secs: 45,
    check: ["Counter for frequencies: O(n)", "Heap of size k keyed by frequency: O(n log k)", "Bucket sort by frequency (indices 0..n): O(n)", "Ties and output order clarified", "Space O(n) for counts"],
    followups: [
      { q: "When is the heap better than bucket sort?", a: "When k is small and the data is a stream or too big to bucket; the heap needs O(k) extra beyond the counts and handles arbitrary keys." },
      { q: "How would you handle top-k words with ties broken alphabetically?", a: "Sort or heap by the key (−frequency, word); with nsmallest(k, counts, key=lambda w: (−cnt[w], w))." },
      { q: "Could quickselect work here?", a: "Yes: quickselect on the distinct values by frequency to find the k-th most frequent, average O(n), worst O(n²)." },
    ],
    answer: `First I count frequencies with a Counter, O(n). Then I need the k keys with the largest counts. With a heap I keep a min-heap of size k keyed by count, popping whenever it exceeds k, so it ends with the k most frequent: O(n log k), or one line with heapq.nlargest using the count as the key.

For a linear-time version, I use bucket sort: frequencies range from 1 to n, so I make a list of n + 1 buckets, put each value in the bucket for its count, and read buckets from the highest down until I have k values. That's O(n) time and space. I'd confirm how ties should be ordered.`,
    avoid: ["Sorting all items by count when k is tiny (fine, but say it's O(n log n))", "Ignoring tie-breaking rules"],
  },
  terms: [["Bounded heap", "Heap capped at k items; trim after each push."], ["k-way merge", "Heap of one 'next' element per sorted source."], ["Bucket sort", "Group by small integer keys in O(n)."]],
  sources: [D.heapq, D.coll],
});
Q({ id: "dsa2-tk-1", d: 1, secs: 45, prompt: "Top 2 most frequent in [4, 1, −1, 2, −1, 2, 3]. Sum of the two values?", answer: 1, tol: 0.5, explain: "−1 and 2 each appear twice.", py: "import heapq\nfrom collections import Counter\nc = Counter([4,1,-1,2,-1,2,3])\nanswer = sum(heapq.nlargest(2, c, key=c.get))" });
Q({ id: "dsa2-tk-2", d: 2, secs: 60, prompt: "k = 2 closest points to the origin from (3, 3), (5, −1), (−2, 4). Sum of their squared distances?", answer: 38, tol: 0.5, explain: "(3, 3) → 18, (−2, 4) → 20.", py: "import heapq\npts = [(3,3),(5,-1),(-2,4)]\nanswer = sum(x*x+y*y for x, y in heapq.nsmallest(2, pts, key=lambda p: p[0]**2+p[1]**2))" });
Q({ id: "dsa2-tk-3", d: 2, secs: 60, prompt: "Kth largest in a stream, k = 3, starting with [4, 5, 8, 2]. Add 3, 5, 10, 9, 4 in turn. What does the last add return?", answer: 8, tol: 0.5, explain: "Returns 4, 5, 5, 8, 8.", py: "import heapq\nh = [4,5,8,2]; heapq.heapify(h)\nwhile len(h) > 3: heapq.heappop(h)\nr = None\nfor x in [3,5,10,9,4]:\n    heapq.heappush(h, x)\n    if len(h) > 3: heapq.heappop(h)\n    r = h[0]\nanswer = r" });
Q({ id: "dsa2-tk-4", d: 1, secs: 45, prompt: "Merge [1, 4, 5], [1, 3, 4], [2, 6] with a heap. What is the 5th value (1-based) of the output?", answer: 4, tol: 0.5, explain: "[1, 1, 2, 3, 4, 4, 5, 6].", py: "import heapq\nanswer = list(heapq.merge([1,4,5],[1,3,4],[2,6]))[4]" });
C("dsa2-tk-c1", "k smallest vs largest", "k largest → min-heap size k; k smallest → max-heap size k (negate).");
C("dsa2-tk-c2", "k-way merge", "Heap of (value, list_id, index); pop, push the next from that list. O(N log k).");

L("dsa2-two-heaps", HP, "Two heaps and greedy scheduling", "A max-heap and a min-heap to track a running median, and heap-driven greedy choices: best affordable project, rooms in use.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-heapq"],
  hook: "Numbers arrive one at a time; after each, report the median. Sorting after every insert is O(n log n) each. What two things do you really need to see?",
  intuition: `
**The situation.** Running median of a stream; choosing the best option among those currently available; tracking how many intervals overlap right now.

**The idea, part 1: two heaps for the median.** Split the numbers into a lower half and an upper half. Keep the lower half in a **max-heap** (negated) and the upper half in a **min-heap**. Keep sizes equal or the lower one bigger by one. The median is the top of the lower heap, or the average of both tops.

**Part 2: unlock, then pick the best.** Sort options by when they become available; push newly available ones onto a max-heap by value; pop the best. This is how "maximise capital with k projects" works.

**Part 3: active set by end time.** Sort meetings by start; a min-heap of end times holds the rooms in use; free rooms whose meeting ended before the next start. The heap size peaks at the number of rooms needed.
`,
  maths: `
**In one breath.** Median: \`lo\` max-heap, \`hi\` min-heap, push to \`lo\`, move \`lo\`'s top to \`hi\`, rebalance so \`len(lo) ≥ len(hi)\`; $O(\\log n)$ insert, $O(1)$ median.

**Template: running median.**

\`\`\`python
import heapq
class Median:
    def __init__(self):
        self.lo, self.hi = [], []            # lo: max-heap (negated), hi: min-heap
    def add(self, x):
        heapq.heappush(self.lo, -x)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))   # largest of lo moves up
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))
    def median(self):
        if len(self.lo) > len(self.hi):
            return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2
# add 5, 15, 1, 3 -> medians 5, 10.0, 5, 4.0
\`\`\`

Pushing through \`lo\` into \`hi\` guarantees every element of \`lo\` is ≤ every element of \`hi\`.

**Worked problem 1: maximise capital with at most k projects.** Each project needs \`capital[i]\` to start and adds \`profit[i]\`.

\`\`\`python
def max_capital(k, w, profits, capital):
    projects = sorted(zip(capital, profits))
    avail, i = [], 0
    for _ in range(k):
        while i < len(projects) and projects[i][0] <= w:
            heapq.heappush(avail, -projects[i][1])   # unlocked: max-heap by profit
            i += 1
        if not avail:
            break                                    # nothing affordable
        w -= heapq.heappop(avail)                    # take the best (negated)
    return w
max_capital(2, 0, [1, 2, 3], [0, 1, 1])              # 4
\`\`\`

$O(n\\log n)$.

**Worked problem 2: minimum meeting rooms.**

\`\`\`python
def min_rooms(intervals):
    ends = []
    for s, e in sorted(intervals):
        if ends and ends[0] <= s:
            heapq.heappop(ends)              # a room freed up in time
        heapq.heappush(ends, e)
    return len(ends)
min_rooms([(0, 30), (5, 10), (15, 20)])      # 2
\`\`\`

**Sliding-window median.** Two heaps plus lazy deletion (a Counter of values to discard when they surface), $O(n\\log n)$; or a sorted list with \`bisect.insort\` and removal for small k.

**Edge cases.** Even count (average of two tops: float); duplicates (fine); meetings that end exactly when another starts (\`<=\` reuses the room; check the problem's rule).
`,
  practice: `
**Signals:** "median of a stream", "running median", "balance two halves", "maximise with limited picks as options unlock", "rooms/servers/CPUs in use", "process tasks by availability then priority".

**Variations.** Sliding Window Median, Single-Threaded CPU (sort by enqueue time, heap by (duration, index)), Meeting Rooms III (heap of free rooms and heap of busy rooms), Maximum Performance of a Team (sort by efficiency, min-heap of speeds).

**Practise:** Find Median from Data Stream, Sliding Window Median, IPO, Meeting Rooms II, Single-Threaded CPU, Process Tasks Using Servers, Maximum Performance of a Team.
`,
  traps: [
    { trap: "Push x straight into whichever heap is smaller.", why: "The halves can then overlap in value. Route every new value through one heap into the other so lo's max ≤ hi's min, then rebalance sizes." },
    { trap: "Forget to negate when reading the max-heap.", why: "lo stores −x; the median is −lo[0]. Mixing signs is the most common bug." },
    { trap: "In the projects problem, sort by profit and take the top k.", why: "Some high-profit projects aren't affordable yet. Unlock by capital, then choose the best available each round." },
  ],
  say: {
    prompt: "Design a structure that returns the median of all numbers added so far, with fast inserts.",
    secs: 50,
    check: ["Max-heap for the lower half, min-heap for the upper", "Every element in lo ≤ every element in hi", "Sizes equal or lo larger by one", "Median: top of lo, or mean of both tops", "Insert O(log n), median O(1)"],
    followups: [
      { q: "What if all values are integers in 0..100?", a: "Keep a count array of 101 buckets and walk it to the middle: O(1) insert, O(100) median." },
      { q: "How would you support removal (sliding window)?", a: "Lazy deletion: record values to delete in a Counter, adjust logical sizes, and pop them when they reach the top of either heap during rebalancing." },
      { q: "Why route each insert through lo into hi?", a: "It ensures the value ends in the correct half: after pushing to lo, its maximum moves to hi, so hi receives the largest of the lower candidates and the order between halves holds." },
    ],
    answer: `I keep two heaps: a max-heap holding the smaller half of the numbers, stored negated in Python, and a min-heap holding the larger half. The invariant is that everything in the lower heap is at most everything in the upper heap, and the lower heap has the same size or one more.

To add a number, I push it to the lower heap, then move the lower heap's maximum to the upper heap, and if the upper heap is now bigger, move its minimum back. The median is the top of the lower heap when the sizes differ, otherwise the average of the two tops. Inserts are O(log n) and reading the median is O(1).`,
    avoid: ["Sorting the list after every insert", "Letting the halves overlap in value"],
  },
  terms: [["Two heaps", "Max-heap of the lower half + min-heap of the upper half."], ["Unlock-then-pick", "Push options as they become available; pop the best."], ["Active set", "Heap of end times for intervals currently in progress."]],
  sources: [D.heapq, S.binHeap],
});
Q({ id: "dsa2-th-1", d: 1, secs: 45, prompt: "Running median after adding 5, 15, 1, 3. What is the final median?", answer: 4, tol: 0.5, explain: "Sorted [1, 3, 5, 15]: (3 + 5) / 2.", py: "import heapq\nlo, hi = [], []\nfor x in [5,15,1,3]:\n    heapq.heappush(lo, -x); heapq.heappush(hi, -heapq.heappop(lo))\n    if len(hi) > len(lo): heapq.heappush(lo, -heapq.heappop(hi))\nanswer = -lo[0] if len(lo) > len(hi) else (-lo[0]+hi[0])/2" });
Q({ id: "dsa2-th-2", d: 2, secs: 60, prompt: "k = 3 projects, starting capital 0, profits [1, 2, 3], capital needed [0, 1, 2]. Final capital?", answer: 6, tol: 0.5, explain: "Take 1 (w = 1), then 2 (w = 3), then 3 (w = 6).", py: "import heapq\nk, w = 3, 0\npr = sorted(zip([0,1,2],[1,2,3])); av = []; i = 0\nfor _ in range(k):\n    while i < len(pr) and pr[i][0] <= w: heapq.heappush(av, -pr[i][1]); i += 1\n    if not av: break\n    w -= heapq.heappop(av)\nanswer = w" });
Q({ id: "dsa2-th-3", d: 2, secs: 60, prompt: "Minimum rooms for meetings (1, 5), (2, 6), (8, 9), (3, 7), (5, 8)? A room is free again at its end time.", answer: 3, tol: 0.5, explain: "(1,5), (2,6), (3,7) overlap; (5,8) reuses the room freed at 5.", py: "import heapq\nends = []\nfor s, e in sorted([(1,5),(2,6),(8,9),(3,7),(5,8)]):\n    if ends and ends[0] <= s: heapq.heappop(ends)\n    heapq.heappush(ends, e)\nanswer = len(ends)" });
Q({ id: "dsa2-th-4", d: 3, secs: 90, prompt: "Sliding-window medians of [1, 3, −1, −3, 5, 3, 6, 7] with k = 3. Their sum?", answer: 13, tol: 0.5, explain: "[1, −1, −1, 3, 5, 6].", py: "import bisect\na, k = [1,3,-1,-3,5,3,6,7], 3\nw = sorted(a[:k]); out = [w[k//2]]\nfor i in range(k, len(a)):\n    w.pop(bisect.bisect_left(w, a[i-k])); bisect.insort(w, a[i]); out.append(w[k//2])\nanswer = sum(out)" });
C("dsa2-th-c1", "Running median", "lo max-heap (negated), hi min-heap; push via lo → hi; rebalance so len(lo) ≥ len(hi).");
C("dsa2-th-c2", "Meeting rooms", "Sort by start; min-heap of ends; pop if ends[0] ≤ start; answer = heap size.");

L("dsa2-heap-practice", HP, "Heaps practice", "Heap problems to explain: what's in the heap, its size, its key, the complexity.", {
  kind: "interview", mins: 25, prereq: ["dsa2-heapq", "dsa2-top-k", "dsa2-two-heaps"],
  hook: "For each: what's the heap's key, how big does it get, and why is a heap better than sorting here?",
}, [
  iq("Task Scheduler: tasks with a cooldown n between equal tasks; minimum total time slots.", "Counting formula: let f be the max frequency and m the number of tasks with that frequency; answer = max(len(tasks), (f − 1)·(n + 1) + m). Heap simulation also works: max-heap of counts, pop up to n + 1 tasks per cycle, push back decremented counts. Formula O(n); simulation O(n log 26).", ["Max frequency drives idle slots", "(f − 1)(n + 1) + m formula", "max with len(tasks)", "Heap simulation alternative"]),
  iq("Reorganize String: rearrange so no two adjacent characters are equal, or return ''.", "Impossible if a count exceeds (n + 1) // 2. Otherwise max-heap of (−count, char); pop the top, append it, push back the previously used character (held out one step). O(n log 26).", ["Feasibility check", "Max-heap of counts", "Hold back the previous char", "O(n)"]),
  iq("Find K Pairs with Smallest Sums from two sorted arrays.", "Heap seeded with (a[i] + b[0], i, 0) for i < k. Pop the smallest; push (a[i] + b[j+1], i, j+1). Each pop yields the next pair. O(k log k) time, O(k) space.", ["Seed with first column", "Expand along one array", "O(k log k)", "Avoid generating all m·n pairs"]),
  iq("Furthest Building You Can Reach with b bricks and l ladders.", "Walk forward; for each climb push it to a min-heap; if the heap exceeds l, pop the smallest climb and pay it with bricks; stop when bricks go negative. Ladders end up on the largest climbs. O(n log l).", ["Ladders for largest climbs", "Min-heap of size l", "Bricks for the overflow", "Greedy correctness"]),
  iq("Single-Threaded CPU: tasks with enqueue time and duration; the CPU picks the shortest available (ties by index). Return the order.", "Sort task indices by enqueue time. Simulate time: push all tasks with enqueue ≤ time onto a heap of (duration, index); if the heap is empty, jump time to the next enqueue; pop, record, advance time by the duration. O(n log n).", ["Sort by availability", "Heap by (duration, index)", "Jump time when idle", "O(n log n)"]),
  iq("Kth Smallest Element in a Sorted Matrix using a heap.", "Push the first element of each row (value, r, 0); pop k times, pushing the next element in the same row each time. The k-th pop is the answer. O(k log n). Binary search on value is the alternative at O(n log range).", ["Row heads in a heap", "Pop k times, push successor", "O(k log n)", "Compare with value binary search"]),
]);
