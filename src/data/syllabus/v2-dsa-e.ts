/**
 * v2 DSA, part E: Graphs · Greedy and intervals. Fixed ids; every answer is recomputed in Pyodide.
 */
import { CHECKED, iq, lessonWriter } from "./v2-shared";
import { D } from "./v2-dsa-src";

const s = (label: string, url: string) => ({ label, url, checked: CHECKED });
/** Sources for this file; every URL opened and checked on 2026-11-25. */
const S = {
  dfs: s("CP-algorithms: Depth-first search", "https://cp-algorithms.com/graph/depth-first-search.html"),
  kruskal: s("CP-algorithms: Minimum spanning tree, Kruskal's algorithm", "https://cp-algorithms.com/graph/mst_kruskal.html"),
  islands: s("LeetCode: Number of Islands", "https://leetcode.com/problems/number-of-islands/"),
  intSched: s("Wikipedia: Interval scheduling", "https://en.wikipedia.org/wiki/Interval_scheduling"),
  lcMerge: s("LeetCode: Merge Intervals", "https://leetcode.com/problems/merge-intervals/"),
};

const { L, Q, C } = lessonWriter("dsa");
const GR = "Graphs";
const GI = "Greedy and intervals";

// ───────────────────────── Graphs ─────────────────────────

L("dsa2-graph-traversal", GR, "Graph representation, BFS and DFS", "Adjacency lists from edge lists, visited sets, connected components, unweighted shortest paths with BFS, and cycle and bipartite checks.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-tree-bfs", "dsa2-tree-dfs"],
  hook: "You're given 10⁵ friendships as pairs. How many separate friend groups are there, and what's the fewest hops from person A to person B?",
  intuition: `
**The situation.** Many OA problems are graphs in disguise: people and friendships, cities and roads, accounts sharing an email, words one letter apart. Nodes are things; edges are relationships.

**The idea.** Build an **adjacency list** (node → neighbours) from the edge list, then traverse with a **visited set** so each node is processed once. Trees didn't need one; graphs can have cycles.

- **DFS** (stack or recursion): explore as deep as possible. Use for components, cycle detection, reachability, path existence.
- **BFS** (queue): explore in rings of increasing distance. In an **unweighted** graph, the first time BFS reaches a node is along a shortest path.

Both are $O(V + E)$ time and $O(V)$ extra space.
`,
  maths: `
**In one breath.** \`adj = defaultdict(list)\`; add both directions for undirected edges; DFS/BFS with \`seen\`; mark when you **push**, not when you pop; $O(V + E)$.

**Template: build and BFS.**

\`\`\`python
from collections import defaultdict, deque
def bfs_dist(n, edges, src):
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v); adj[v].append(u)     # undirected
    dist = [-1] * n
    dist[src] = 0
    q = deque([src])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if dist[v] == -1:                  # doubles as 'visited'
                dist[v] = dist[u] + 1
                q.append(v)
    return dist
edges = [(0, 1), (0, 2), (1, 3), (2, 3), (3, 4), (4, 5), (2, 5)]
bfs_dist(6, edges, 0)[5]                      # 2  (0-2-5)
\`\`\`

**Worked problem 1: count connected components (iterative DFS).**

\`\`\`python
def components(n, edges):
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v); adj[v].append(u)
    seen, count = set(), 0
    for s in range(n):                         # isolated nodes count too
        if s in seen:
            continue
        count += 1
        st = [s]; seen.add(s)
        while st:
            u = st.pop()
            for v in adj[u]:
                if v not in seen:
                    seen.add(v); st.append(v)
    return count
components(5, [(0, 1), (1, 2), (3, 4)])        # 2
\`\`\`

**Worked problem 2: is the graph bipartite (two-colourable)?** BFS colouring: give each uncoloured neighbour the opposite colour; a neighbour with the same colour means an odd cycle.

\`\`\`python
def bipartite(adj):                            # adj: list of neighbour lists
    colour = [-1] * len(adj)
    for s in range(len(adj)):
        if colour[s] != -1:
            continue
        colour[s] = 0; q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if colour[v] == -1:
                    colour[v] = 1 - colour[u]; q.append(v)
                elif colour[v] == colour[u]:
                    return False
    return True
bipartite([[1, 3], [0, 2], [1, 3], [0, 2]])    # True (a 4-cycle)
\`\`\`

**Cycle in an undirected graph:** during DFS, reaching a visited node that isn't the parent means a cycle (or use union-find).

**Edge cases.** Disconnected graphs (loop over all start nodes); nodes with no edges (won't appear in \`adj\`, so iterate \`range(n)\`); self-loops and duplicate edges; recursion depth on large graphs (prefer an explicit stack).
`,
  practice: `
**Signals:** "connections", "friends", "network", "reachable", "groups", "fewest steps/hops/moves", "transform word A into word B one change at a time", "can be split into two teams".

**Variations.** Clone Graph (dict old → new while traversing), Word Ladder (BFS where neighbours are one-letter changes; bucket by wildcard patterns), Keys and Rooms (reachability), Find if Path Exists.

**Practise:** Find if Path Exists in Graph, Number of Connected Components in an Undirected Graph, Clone Graph, Is Graph Bipartite?, Keys and Rooms, Word Ladder, Graph Valid Tree, Shortest Path in Binary Matrix.
`,
  traps: [
    { trap: "Mark nodes visited when you pop them from the BFS queue.", why: "The same node can be queued many times by different neighbours, blowing up time and memory. Mark when you push." },
    { trap: "Use BFS for shortest paths in a weighted graph.", why: "BFS counts edges, not weights. With weights use Dijkstra (non-negative) or 0-1 BFS (weights 0/1)." },
    { trap: "Iterate over adj.keys() to find components.", why: "Isolated nodes have no edges and never appear as keys. Loop over all n nodes." },
  ],
  say: {
    prompt: "Given n people and a list of friendships, count the friend groups and find the fewest hops between two people.",
    secs: 50,
    check: ["Adjacency list from the edge list (both directions)", "Components: start a DFS/BFS from each unvisited node", "Shortest hops: BFS from the source; first visit = shortest", "Mark visited on push", "O(V + E) time and space; isolated nodes counted"],
    followups: [
      { q: "Could you count groups without building the adjacency list?", a: "Yes, with union-find: union each friendship's endpoints and count distinct roots; nearly O(E α(V))." },
      { q: "Why does BFS give shortest paths only in unweighted graphs?", a: "It processes nodes in order of edge count from the source, so the first arrival uses the fewest edges. With weights, fewer edges can cost more." },
      { q: "How would you speed up a BFS between two specific nodes?", a: "Bidirectional BFS: expand from both ends and stop when the frontiers meet, which explores roughly 2·b^(d/2) nodes instead of b^d." },
    ],
    answer: `I'd build an adjacency list, adding each friendship in both directions. To count groups I loop over all n people; whenever I find someone not yet visited, I start a DFS or BFS from them, marking everyone I reach, and add one to the count. Looping over all people, not just those with edges, counts people with no friends.

For the fewest hops I run BFS from the first person, recording distances as I push nodes onto the queue. Because BFS explores in rings of increasing distance, the first time I reach the second person is along a shortest path. Each node and edge is handled once, so both parts are O(V + E) time and O(V) extra space.`,
    avoid: ["Marking visited on pop", "Using DFS for shortest paths"],
  },
  terms: [["Adjacency list", "Map from each node to its neighbours."], ["Connected component", "Maximal set of nodes reachable from one another."], ["Bipartite", "Two-colourable: no odd cycle."]],
  sources: [D.bfs, S.dfs, D.coll],
});
Q({ id: "dsa2-gt-1", d: 1, secs: 45, prompt: "5 nodes, edges (0, 1), (1, 2), (3, 4). How many connected components?", answer: 2, tol: 0.5, explain: "{0, 1, 2} and {3, 4}.", py: "from collections import defaultdict\nadj = defaultdict(list)\nfor u, v in [(0,1),(1,2),(3,4)]: adj[u].append(v); adj[v].append(u)\nseen = set(); c = 0\nfor s in range(5):\n    if s in seen: continue\n    c += 1; st = [s]; seen.add(s)\n    while st:\n        u = st.pop()\n        for v in adj[u]:\n            if v not in seen: seen.add(v); st.append(v)\nanswer = c" });
Q({ id: "dsa2-gt-2", d: 1, secs: 45, prompt: "Edges (0,1), (0,2), (1,3), (2,3), (3,4), (4,5), (2,5), undirected. Fewest edges from 0 to 4?", answer: 3, tol: 0.5, explain: "0–1–3–4, 0–2–3–4 or 0–2–5–4.", py: "from collections import defaultdict, deque\nadj = defaultdict(list)\nfor u, v in [(0,1),(0,2),(1,3),(2,3),(3,4),(4,5),(2,5)]: adj[u].append(v); adj[v].append(u)\nd = {0: 0}; q = deque([0])\nwhile q:\n    u = q.popleft()\n    for v in adj[u]:\n        if v not in d: d[v] = d[u]+1; q.append(v)\nanswer = d[4]" });
Q({ id: "dsa2-gt-3", d: 2, secs: 60, prompt: "Is the graph with adjacency [[1, 2, 3], [0, 2], [0, 1, 3], [0, 2]] bipartite? Answer 1 for yes, 0 for no.", answer: 0, tol: 0.5, explain: "0–1–2 is a triangle: an odd cycle.", py: "from collections import deque\nadj = [[1,2,3],[0,2],[0,1,3],[0,2]]\ncol = [-1]*4; ok = True\nfor s in range(4):\n    if col[s] != -1: continue\n    col[s] = 0; q = deque([s])\n    while q:\n        u = q.popleft()\n        for v in adj[u]:\n            if col[v] == -1: col[v] = 1-col[u]; q.append(v)\n            elif col[v] == col[u]: ok = False\nanswer = int(ok)" });
Q({ id: "dsa2-gt-4", d: 1, secs: 30, prompt: "An undirected graph has 7 edges. How many entries are there across all adjacency lists?", answer: 14, tol: 0.5, explain: "Each edge appears in both endpoints' lists.", py: "from collections import defaultdict\nadj = defaultdict(list)\nfor u, v in [(0,1),(0,2),(1,3),(2,3),(3,4),(4,5),(2,5)]: adj[u].append(v); adj[v].append(u)\nanswer = sum(len(x) for x in adj.values())" });
C("dsa2-gt-c1", "Graph BFS", "adj lists; deque; mark visited on push; first visit = fewest edges. O(V + E).");
C("dsa2-gt-c2", "Components", "Loop over every node; start a traversal from each unvisited one; count starts.");

L("dsa2-grid-graphs", GR, "Grids as graphs: flood fill and multi-source BFS", "Treating cells as nodes with 4 or 8 neighbours: counting islands, spreading from many sources at once, and shortest paths through a maze.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-graph-traversal"],
  hook: "Rotten oranges infect their neighbours every minute. How many minutes until every orange is rotten? Starting a BFS from each rotten orange separately gets it wrong. Why?",
  intuition: `
**The situation.** Grids show up constantly: maps of land and water, mazes, pixels, seats. Each cell is a node; its neighbours are the cells up, down, left and right (sometimes diagonals too).

**The idea.** Don't build an adjacency list; generate neighbours on the fly with a direction list and a bounds check.

- **Flood fill (DFS or BFS):** from an unvisited land cell, mark everything connected. Count how many times you start: that's the number of islands.
- **Multi-source BFS:** put **all** sources in the queue at time 0. The BFS then expands from all of them at once, and each cell's distance is to its **nearest** source. One BFS, not one per source.
- **Shortest path in a maze:** plain BFS from the start; the first time you reach the target is the answer.

Cost: $O(R\\cdot C)$ time; each cell is visited once.
`,
  maths: `
**In one breath.** \`DIRS = [(1,0),(-1,0),(0,1),(0,-1)]\`; \`0 <= r < R and 0 <= c < C\`; mark visited when pushing (or overwrite the cell); multi-source: enqueue every source first; $O(RC)$.

**Template: count islands with BFS.**

\`\`\`python
from collections import deque
def count_islands(grid):
    R, C = len(grid), len(grid[0])
    seen, count = set(), 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == "1" and (r, c) not in seen:
                count += 1
                seen.add((r, c)); q = deque([(r, c)])
                while q:
                    x, y = q.popleft()
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < R and 0 <= ny < C and grid[nx][ny] == "1" and (nx, ny) not in seen:
                            seen.add((nx, ny)); q.append((nx, ny))
    return count
count_islands(["11000", "11000", "00100", "00011"])   # 3
\`\`\`

**Worked problem 1: minutes until all oranges rot (multi-source BFS).** 0 empty, 1 fresh, 2 rotten.

\`\`\`python
def minutes_to_rot(g):
    R, C = len(g), len(g[0])
    g = [row[:] for row in g]
    q = deque((r, c) for r in range(R) for c in range(C) if g[r][c] == 2)
    fresh = sum(row.count(1) for row in g)
    minutes = 0
    while q and fresh:
        for _ in range(len(q)):                # one minute = one BFS layer
            x, y = q.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < R and 0 <= ny < C and g[nx][ny] == 1:
                    g[nx][ny] = 2; fresh -= 1; q.append((nx, ny))
        minutes += 1
    return minutes if fresh == 0 else -1
minutes_to_rot([[2, 1, 1], [1, 1, 0], [0, 1, 1]])     # 4
\`\`\`

**Worked problem 2: shortest clear path with 8 directions.** BFS from (0, 0) over cells equal to 0, counting cells on the path; return −1 if the start or end is blocked. \`[[0, 0, 0], [1, 1, 0], [1, 1, 0]]\` → 4.

**Worked problem 3: regions touching the border.** For "capture surrounded regions" or "cells that can reach both oceans", start the flood fill **from the border** instead of from every cell.

**Edge cases.** Empty grid; all water or all land; no rotten oranges but fresh ones exist (−1) or no fresh at all (0); grids given as strings (immutable: use a seen set).
`,
  practice: `
**Signals:** a 2-D grid of characters or numbers, "island", "region", "connected", "spread/infect each minute", "nearest", "distance to the closest", "maze", "escape".

**Variations.** Max Area of Island (return the size of each fill), 01 Matrix (multi-source BFS from all zeros), Walls and Gates, Pacific Atlantic Water Flow (two border fills, intersect), Surrounded Regions (fill from border Os), Shortest Path with Obstacle Elimination (state = (r, c, k)).

**Practise:** Number of Islands, Max Area of Island, Flood Fill, Rotting Oranges, 01 Matrix, Shortest Path in Binary Matrix, Pacific Atlantic Water Flow, Surrounded Regions, Nearest Exit from Entrance in Maze.
`,
  traps: [
    { trap: "Run a separate BFS from each rotten orange and take the maximum.", why: "Each cell's time is set by its nearest source; separate runs overcount and cost O(k · RC). Enqueue all sources at time 0 in one BFS." },
    { trap: "Recursive flood fill on a 1000 × 1000 grid.", why: "A snake-shaped island can recurse 10⁶ deep and crash Python. Use BFS or an explicit stack." },
    { trap: "Check bounds after indexing.", why: "grid[-1] silently wraps to the last row in Python. Check 0 ≤ r < R before reading grid[r][c]." },
  ],
  say: {
    prompt: "Every minute, rotten oranges infect fresh neighbours. Find the minutes until none are fresh, or −1. Explain your approach.",
    secs: 50,
    check: ["Multi-source BFS: all rotten cells start in the queue", "Process the queue layer by layer; one layer = one minute", "Mark fresh → rotten when pushing; count remaining fresh", "Return −1 if fresh remain, 0 if none at the start", "O(R·C) time and space"],
    followups: [
      { q: "Why not run BFS from each rotten orange separately?", a: "A cell rots at the time of its nearest rotten orange. One BFS seeded with all sources computes exactly that minimum in O(R·C); separate runs repeat work and need extra merging." },
      { q: "How would you find the distance from each cell to the nearest 0?", a: "Multi-source BFS from all zeros at distance 0; each popped cell sets unvisited neighbours to its distance + 1." },
      { q: "How would you handle being allowed to remove up to k obstacles?", a: "Make the state (r, c, remaining k) and BFS over states, with visited tracking per state; O(R·C·k)." },
    ],
    answer: `I treat each cell as a node and run one breadth-first search that starts from every rotten orange at once. I put all rotten cells in the queue and count the fresh ones. Then I process the queue one layer at a time; each layer is one minute. For each cell popped I look at its four neighbours, and any fresh orange becomes rotten, is pushed, and decrements the fresh count.

When the queue empties or no fresh oranges remain, the number of layers processed is the answer, or −1 if some fresh orange was never reached. Starting from all sources together gives each cell its distance to the nearest rotten orange. Each cell is processed once, so it's O(R·C) time and space.`,
    avoid: ["One BFS per source", "Forgetting the 'no fresh oranges' case returns 0"],
  },
  terms: [["Flood fill", "Mark every cell connected to a start cell."], ["Multi-source BFS", "BFS seeded with all sources at distance 0."], ["Direction list", "Offsets used to generate neighbours on the fly."]],
  sources: [S.islands, D.bfs],
});
Q({ id: "dsa2-gg-1", d: 1, secs: 45, prompt: "Number of islands (4-directional) in ['11000', '11000', '00100', '00011']?", answer: 3, tol: 0.5, explain: "Top-left block, the centre cell, bottom-right pair.", py: "from collections import deque\ng = ['11000','11000','00100','00011']; R, C = 4, 5; seen = set(); n = 0\nfor r in range(R):\n    for c in range(C):\n        if g[r][c] == '1' and (r,c) not in seen:\n            n += 1; seen.add((r,c)); q = deque([(r,c)])\n            while q:\n                x, y = q.popleft()\n                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):\n                    a, b = x+dx, y+dy\n                    if 0 <= a < R and 0 <= b < C and g[a][b] == '1' and (a,b) not in seen:\n                        seen.add((a,b)); q.append((a,b))\nanswer = n" });
Q({ id: "dsa2-gg-2", d: 2, secs: 60, prompt: "Rotting oranges on [[2, 1, 1], [1, 1, 0], [0, 1, 1]]. Minutes until none are fresh?", answer: 4, tol: 0.5, explain: "The bottom-right orange is 4 steps from the rotten corner.", py: "from collections import deque\ng = [[2,1,1],[1,1,0],[0,1,1]]; R, C = 3, 3\nq = deque((r,c) for r in range(R) for c in range(C) if g[r][c] == 2)\nfresh = sum(row.count(1) for row in g); m = 0\nwhile q and fresh:\n    for _ in range(len(q)):\n        x, y = q.popleft()\n        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):\n            a, b = x+dx, y+dy\n            if 0 <= a < R and 0 <= b < C and g[a][b] == 1:\n                g[a][b] = 2; fresh -= 1; q.append((a,b))\n    m += 1\nanswer = m if fresh == 0 else -1" });
Q({ id: "dsa2-gg-3", d: 2, secs: 60, prompt: "Shortest clear path (8 directions, counting cells) from top-left to bottom-right of [[0, 0, 0], [1, 1, 0], [1, 1, 0]]?", answer: 4, tol: 0.5, explain: "(0,0) → (0,1) → (1,2) → (2,2).", py: "from collections import deque\ng = [[0,0,0],[1,1,0],[1,1,0]]; n = 3\nd = {(0,0): 1}; q = deque([(0,0)])\nwhile q:\n    x, y = q.popleft()\n    for dx in (-1,0,1):\n        for dy in (-1,0,1):\n            a, b = x+dx, y+dy\n            if 0 <= a < n and 0 <= b < n and g[a][b] == 0 and (a,b) not in d:\n                d[(a,b)] = d[(x,y)]+1; q.append((a,b))\nanswer = d.get((n-1,n-1), -1)" });
Q({ id: "dsa2-gg-4", d: 2, secs: 60, prompt: "Largest island area (4-directional) in [[1,1,0,0,0],[1,1,0,0,0],[0,0,0,1,1],[0,0,0,1,1],[0,1,0,1,0]]?", answer: 5, tol: 0.5, explain: "The right-hand island has 5 cells.", py: "g = [[1,1,0,0,0],[1,1,0,0,0],[0,0,0,1,1],[0,0,0,1,1],[0,1,0,1,0]]; R, C = 5, 5; seen = set(); b = 0\nfor r in range(R):\n    for c in range(C):\n        if g[r][c] and (r,c) not in seen:\n            st = [(r,c)]; seen.add((r,c)); a = 0\n            while st:\n                x, y = st.pop(); a += 1\n                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):\n                    u, v = x+dx, y+dy\n                    if 0 <= u < R and 0 <= v < C and g[u][v] and (u,v) not in seen:\n                        seen.add((u,v)); st.append((u,v))\n            b = max(b, a)\nanswer = b" });
C("dsa2-gg-c1", "Grid neighbours", "for dx, dy in DIRS: check 0 ≤ r < R and 0 ≤ c < C before indexing.");
C("dsa2-gg-c2", "Multi-source BFS", "Enqueue every source at distance 0; one BFS gives the nearest-source distance.");

L("dsa2-topo-sort", GR, "Directed graphs and topological sort", "Ordering tasks with dependencies using Kahn's in-degree algorithm, detecting cycles with DFS colours, and longest paths in a DAG.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-graph-traversal"],
  hook: "Course B needs course A first. Given 2,000 such rules, can a student finish every course, and in what order?",
  intuition: `
**The situation.** Dependencies: courses and prerequisites, build steps, spreadsheet formulas, data pipeline stages. Edges are directed: \`a → b\` means "a before b".

**The idea.** A **topological order** lists nodes so every edge points forward. It exists exactly when the graph has **no directed cycle** (it's a DAG).

**Kahn's algorithm (BFS on in-degrees).** Count incoming edges per node. Nodes with in-degree 0 have no unmet dependencies: put them in a queue. Pop one, append it to the order, and decrement its neighbours' in-degrees; any that reach 0 join the queue. If the order ends up shorter than $n$, the leftovers are stuck in a cycle.

**DFS version.** Three colours: unvisited, in progress, done. Meeting an in-progress node means a back edge: a cycle. Appending nodes when they finish and reversing gives a topological order.
`,
  maths: `
**In one breath.** indeg + queue of zeros; pop, append, decrement, push new zeros; \`len(order) < n\` ⇒ cycle; $O(V + E)$.

**Template: Kahn's algorithm.**

\`\`\`python
from collections import defaultdict, deque
def topo_order(n, edges):                 # edge (a, b): a before b
    adj, indeg = defaultdict(list), [0] * n
    for a, b in edges:
        adj[a].append(b); indeg[b] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []   # [] means a cycle
topo_order(4, [(0, 1), (0, 2), (1, 3), (2, 3)])   # [0, 1, 2, 3]
\`\`\`

Watch the direction: in "course schedule" input \`[course, prereq]\`, the edge is **prereq → course**.

**Worked problem 1: can all courses be finished?** \`len(topo_order(...)) == n\`. Two courses each requiring the other: \`[(0, 1), (1, 0)]\` → no.

**Worked problem 2: cycle detection with DFS colours.**

\`\`\`python
def has_cycle(n, edges):
    adj = defaultdict(list)
    for a, b in edges:
        adj[a].append(b)
    state = [0] * n                        # 0 new, 1 on the current path, 2 done
    def dfs(u):
        state[u] = 1
        for v in adj[u]:
            if state[v] == 1:
                return True                # back edge
            if state[v] == 0 and dfs(v):
                return True
        state[u] = 2
        return False
    return any(state[i] == 0 and dfs(i) for i in range(n))
\`\`\`

**Worked problem 3: minimum semesters (longest path in a DAG).** Run Kahn's layer by layer, like level-order BFS: the number of layers is the minimum number of semesters when any number of courses can be taken at once. Courses 1, 2 → 3 gives 2 semesters.

**Edge cases.** Nodes with no edges (in-degree 0, appear in the order); duplicate edges (count in-degree per edge, consistently); several valid orders (if a specific one is required, e.g. lexicographically smallest, use a heap instead of a deque).
`,
  practice: `
**Signals:** "prerequisites", "dependencies", "must come before", "build order", "is it possible to finish", "detect a cycle in a directed graph", "order of letters in an alien language".

**Variations.** Course Schedule II (return the order), Alien Dictionary (edges from the first differing letter of adjacent words; invalid if a word is followed by its own prefix), Parallel Courses (layers), Find Eventual Safe States (reverse graph + Kahn), Sequence Reconstruction (unique order iff the queue never holds two nodes).

**Practise:** Course Schedule, Course Schedule II, Parallel Courses, Find Eventual Safe States, Alien Dictionary, Minimum Height Trees, Sort Items by Groups Respecting Dependencies.
`,
  traps: [
    { trap: "Add the edge course → prerequisite.", why: "The prerequisite must come first: edge prereq → course, and in-degree counts on the course. Reversed edges give a reversed (or wrong) order." },
    { trap: "Detect directed cycles with a single visited set.", why: "Reaching an already finished node through another path is fine in a DAG (a diamond). Only a node still on the current DFS path signals a cycle: use three states." },
    { trap: "Assume the topological order is unique.", why: "Any queue order works unless the problem says otherwise. If it must be unique or smallest, check queue size or use a heap." },
  ],
  say: {
    prompt: "Given n courses and prerequisite pairs, return an order to take them all, or report that it's impossible.",
    secs: 50,
    check: ["Edge prereq → course; count in-degrees", "Queue all in-degree-0 courses", "Pop, append, decrement neighbours, push new zeros", "Order shorter than n ⇒ cycle ⇒ impossible", "O(V + E) time and space"],
    followups: [
      { q: "How would you do it with DFS instead?", a: "DFS with three states; on finishing a node append it to a list; a back edge to an in-progress node means a cycle; the reversed finish list is a valid order." },
      { q: "How would you find the minimum number of semesters?", a: "Run Kahn's layer by layer (process the whole queue each round) and count rounds; it's the longest path length in nodes." },
      { q: "How do you produce the lexicographically smallest order?", a: "Replace the queue with a min-heap so the smallest available course is always taken next: O((V + E) log V)." },
    ],
    answer: `I model it as a directed graph with an edge from each prerequisite to the course that needs it, and count each course's in-degree. Courses with in-degree zero can be taken immediately, so they go in a queue. I repeatedly pop a course, add it to the order, and decrement the in-degree of every course that depends on it; any that reach zero join the queue.

If the final order contains all n courses, it's valid. If it's shorter, the remaining courses are in a dependency cycle and it's impossible. Every node and edge is processed once, O(V + E) time and space. The DFS version with three colours detects the cycle as an edge back to a node still on the current path.`,
    avoid: ["Reversing the edge direction", "Using a two-state visited set for directed cycles"],
  },
  terms: [["DAG", "Directed acyclic graph."], ["In-degree", "Number of incoming edges."], ["Back edge", "Edge to a node still on the current DFS path: a cycle."]],
  sources: [D.topo, S.dfs],
});
Q({ id: "dsa2-to-1", d: 1, secs: 45, prompt: "4 courses, prerequisite pairs [course, prereq]: [1, 0], [2, 0], [3, 1], [3, 2]. How many valid orders are there?", answer: 2, tol: 0.5, explain: "0, 1, 2, 3 and 0, 2, 1, 3.", py: "from itertools import permutations\nE = [(0,1),(0,2),(1,3),(2,3)]\nanswer = sum(all(p.index(a) < p.index(b) for a, b in E) for p in permutations(range(4)))" });
Q({ id: "dsa2-to-2", d: 1, secs: 45, prompt: "Pairs [course, prereq]: [1, 0], [0, 1] for 2 courses. Can both be finished? Answer 1 for yes, 0 for no.", answer: 0, tol: 0.5, explain: "Each requires the other: a cycle.", py: "from collections import defaultdict, deque\nn = 2; adj = defaultdict(list); ind = [0]*n\nfor c, p in [(1,0),(0,1)]: adj[p].append(c); ind[c] += 1\nq = deque(i for i in range(n) if ind[i] == 0); k = 0\nwhile q:\n    u = q.popleft(); k += 1\n    for v in adj[u]:\n        ind[v] -= 1\n        if ind[v] == 0: q.append(v)\nanswer = int(k == n)" });
Q({ id: "dsa2-to-3", d: 2, secs: 60, prompt: "Courses 1..6 with edges (before → after): 1→2, 1→3, 2→4, 3→4, 4→5, 2→6. Any number per semester. Minimum semesters?", answer: 4, tol: 0.5, explain: "Layers {1}, {2, 3}, {4, 6}, {5}.", py: "from collections import defaultdict, deque\nadj = defaultdict(list); ind = {i: 0 for i in range(1,7)}\nfor a, b in [(1,2),(1,3),(2,4),(3,4),(4,5),(2,6)]: adj[a].append(b); ind[b] += 1\nq = deque(i for i in ind if ind[i] == 0); sem = 0\nwhile q:\n    sem += 1\n    for _ in range(len(q)):\n        u = q.popleft()\n        for v in adj[u]:\n            ind[v] -= 1\n            if ind[v] == 0: q.append(v)\nanswer = sem" });
Q({ id: "dsa2-to-4", d: 2, secs: 45, prompt: "Directed edges 0→1, 0→2, 1→3, 2→3 (a diamond). A DFS with a single 'visited' set reports a cycle when it meets a visited node. What does it report? Answer 1 for 'cycle', 0 for 'no cycle'.", answer: 1, tol: 0.5, explain: "It wrongly reports a cycle at node 3, reached twice. There's no cycle: use three states.", py: "from collections import defaultdict\nadj = defaultdict(list)\nfor a, b in [(0,1),(0,2),(1,3),(2,3)]: adj[a].append(b)\nseen = set(); bad = False\ndef dfs(u):\n    global bad\n    seen.add(u)\n    for v in adj[u]:\n        if v in seen: bad = True\n        else: dfs(v)\ndfs(0)\nanswer = int(bad)" });
C("dsa2-to-c1", "Kahn's algorithm", "Queue in-degree 0; pop → order; decrement neighbours; len(order) < n ⇒ cycle.");
C("dsa2-to-c2", "Directed cycle via DFS", "States new / on path / done; edge to 'on path' = cycle.");

L("dsa2-union-find", GR, "Union-find (disjoint set union)", "Merging groups and asking 'same group?' in nearly O(1) with path compression and union by size: components, redundant edges, Kruskal's MST.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-graph-traversal"],
  hook: "Edges arrive one at a time. After each, are nodes u and v connected? Rerunning BFS each time is O(V + E) per query. What's cheaper?",
  intuition: `
**The situation.** Dynamic connectivity: edges are added and you repeatedly ask whether two items are in the same group, how many groups there are, or whether an edge closes a cycle.

**The idea.** Each group is a tree stored in a \`parent\` array; the root names the group.

- \`find(x)\`: follow parents to the root. **Path compression** points every node on the way directly at the root, so later finds are nearly instant.
- \`union(a, b)\`: find both roots; if different, attach the smaller tree under the larger (**union by size**).

With both tricks, each operation costs $O(\\alpha(n))$, the inverse Ackermann function: at most 4 or 5 for any realistic $n$.

**Cycle check:** if \`find(u) == find(v)\` before adding edge (u, v), the edge closes a cycle.
`,
  maths: `
**In one breath.** \`parent = list(range(n))\`; \`find\` with compression; \`union\` by size returns False if already joined; components = n − successful unions; near-$O(1)$ per op.

**Template.**

\`\`\`python
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.groups = n
    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path halving
            x = self.parent[x]
        return x
    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False                   # already connected
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra               # smaller under larger
        self.size[ra] += self.size[rb]
        self.groups -= 1
        return True
\`\`\`

Iterative \`find\` avoids recursion-depth problems.

**Worked problem 1: number of provinces from an adjacency matrix.**

\`\`\`python
def provinces(M):
    d = DSU(len(M))
    for i in range(len(M)):
        for j in range(i + 1, len(M)):
            if M[i][j]:
                d.union(i, j)
    return d.groups
provinces([[1, 1, 0], [1, 1, 0], [0, 0, 1]])   # 2
\`\`\`

**Worked problem 2: the edge that turns a tree into a cycle.** Union edges in order; the first union that returns False is redundant. \`[(1, 2), (1, 3), (2, 3)]\` → \`(2, 3)\` (size the DSU \`n + 1\` for 1-indexed labels).

**Worked problem 3: Kruskal's minimum spanning tree.** Sort edges by weight; add each edge whose endpoints are in different groups; stop after $n - 1$ edges.

\`\`\`python
def mst_weight(n, edges):                  # edges: (w, u, v)
    d, total = DSU(n), 0
    for w, u, v in sorted(edges):
        if d.union(u, v):
            total += w
    return total
mst_weight(4, [(1, 0, 1), (2, 1, 2), (3, 0, 2), (4, 2, 3), (5, 1, 3)])   # 7
\`\`\`

$O(E\\log E)$ for the sort.

**Edge cases.** 1-indexed labels; self-loops (union returns False: a cycle by definition); mapping non-integer items (emails, names) to ids with a dict.
`,
  practice: `
**Signals:** "groups", "merge", "connected after each step", "redundant connection", "accounts sharing an email", "equations a == b / a != b", "minimum cost to connect all", "number of islands after each addition".

**Variations.** Accounts Merge (union accounts sharing an email), Satisfiability of Equality Equations (union all ==, then check !=), Number of Islands II (add land cells online), Most Stones Removed (answer = stones − groups), weighted DSU for ratios (Evaluate Division).

**Practise:** Number of Provinces, Redundant Connection, Graph Valid Tree, Accounts Merge, Satisfiability of Equality Equations, Min Cost to Connect All Points, Most Stones Removed with Same Row or Column, Number of Operations to Make Network Connected.
`,
  traps: [
    { trap: "Union a and b by setting parent[a] = b.", why: "You must link the roots: parent[find(a)] = find(b). Linking non-roots breaks other members' paths." },
    { trap: "Skip union by size; compression alone is enough.", why: "Compression alone gives good amortised bounds, but trees can get tall before compressing; both together give the near-constant guarantee." },
    { trap: "Compare parent[a] == parent[b] to test connectivity.", why: "Parents may not be roots. Compare find(a) == find(b)." },
  ],
  say: {
    prompt: "Explain union-find and how you'd use it to find the edge that creates a cycle in an undirected graph.",
    secs: 45,
    check: ["parent array; root identifies the group", "find with path compression", "union links roots, smaller under larger", "Edge whose endpoints already share a root closes a cycle", "Near-O(1) per operation (inverse Ackermann)"],
    followups: [
      { q: "When is union-find better than BFS/DFS?", a: "When edges arrive over time and you need connectivity answers between additions; rerunning a traversal each time would be O(V + E) per query." },
      { q: "Can union-find handle edge deletions?", a: "Not directly. Process offline in reverse (deletions become additions) or use more complex structures." },
      { q: "How do you count components?", a: "Start at n and decrement on every successful union, or count indices i with find(i) == i at the end." },
    ],
    answer: `Union-find keeps each group as a tree in a parent array, where the root identifies the group. find follows parents up to the root, and with path compression it repoints the nodes it passes directly at the root. union finds both roots and, if they differ, hangs the smaller tree under the larger. Together these make each operation effectively constant time.

To find the redundant edge, I process edges in order. For each edge, if both endpoints already have the same root, they're already connected, so this edge closes a cycle and I return it. Otherwise I union them. That's O(E · α(V)) time and O(V) space.`,
    avoid: ["Linking non-root nodes", "Comparing parents instead of roots"],
  },
  terms: [["Path compression", "Point nodes on a find path directly at the root."], ["Union by size", "Attach the smaller tree under the larger."], ["Inverse Ackermann α(n)", "Grows so slowly it's ≤ 4 for practical n."]],
  sources: [D.dsu, S.kruskal],
});
Q({ id: "dsa2-uf-1", d: 1, secs: 45, prompt: "Number of provinces for the adjacency matrix [[1, 0, 0, 1], [0, 1, 1, 0], [0, 1, 1, 1], [1, 0, 1, 1]]?", answer: 1, tol: 0.5, explain: "0–3, 3–2, 2–1 link everyone.", py: "M = [[1,0,0,1],[0,1,1,0],[0,1,1,1],[1,0,1,1]]; p = list(range(4))\ndef f(x):\n    while p[x] != x: p[x] = p[p[x]]; x = p[x]\n    return x\nfor i in range(4):\n    for j in range(i+1, 4):\n        if M[i][j]: p[f(i)] = f(j)\nanswer = len({f(i) for i in range(4)})" });
Q({ id: "dsa2-uf-2", d: 2, secs: 60, prompt: "Edges in order: (1, 2), (2, 3), (3, 4), (1, 4), (1, 5). Which edge is redundant? Give the sum of its endpoints.", answer: 5, tol: 0.5, explain: "(1, 4): 1 and 4 are already connected via 2 and 3.", py: "p = list(range(6))\ndef f(x):\n    while p[x] != x: p[x] = p[p[x]]; x = p[x]\n    return x\nans = 0\nfor u, v in [(1,2),(2,3),(3,4),(1,4),(1,5)]:\n    a, b = f(u), f(v)\n    if a == b: ans = u+v; break\n    p[a] = b\nanswer = ans" });
Q({ id: "dsa2-uf-3", d: 1, secs: 45, prompt: "10 items; unions (0, 1), (2, 3), (1, 3), (5, 6), (7, 7). How many groups remain?", answer: 6, tol: 0.5, explain: "Four successful unions: 10 − 4. (7, 7) changes nothing.", py: "p = list(range(10)); g = 10\ndef f(x):\n    while p[x] != x: p[x] = p[p[x]]; x = p[x]\n    return x\nfor a, b in [(0,1),(2,3),(1,3),(5,6),(7,7)]:\n    ra, rb = f(a), f(b)\n    if ra != rb: p[ra] = rb; g -= 1\nanswer = g" });
Q({ id: "dsa2-uf-4", d: 2, secs: 60, prompt: "Kruskal's MST weight for 4 nodes with edges (w, u, v): (1, 0, 1), (2, 1, 2), (3, 0, 2), (4, 2, 3), (5, 1, 3)?", answer: 7, tol: 0.5, explain: "Take 1, 2, 4; skip 3 (cycle) and 5.", py: "p = list(range(4))\ndef f(x):\n    while p[x] != x: p[x] = p[p[x]]; x = p[x]\n    return x\nt = 0\nfor w, u, v in sorted([(1,0,1),(2,1,2),(3,0,2),(4,2,3),(5,1,3)]):\n    a, b = f(u), f(v)\n    if a != b: p[a] = b; t += w\nanswer = t" });
C("dsa2-uf-c1", "Union-find ops", "find: follow parents + compress. union: link roots, smaller under larger.");
C("dsa2-uf-c2", "Cycle via DSU", "Edge (u, v) with find(u) == find(v) closes a cycle.");

L("dsa2-shortest-paths", GR, "Weighted shortest paths: Dijkstra and friends", "Dijkstra with heapq for non-negative weights, 0-1 BFS, and a bounded Bellman-Ford for 'at most k edges' and negative weights.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-graph-traversal", "dsa2-heapq"],
  hook: "A signal starts at one server and travels along links with different delays. When has every server heard it? Why does plain BFS give the wrong answer?",
  intuition: `
**The situation.** Roads with lengths, links with delays, flights with prices. Fewest edges is no longer the goal; least total weight is.

**The idea: Dijkstra.** Always settle the unsettled node with the smallest known distance. With non-negative weights, no later path can make it shorter. A min-heap of \`(distance, node)\` picks that node in $O(\\log V)$.

- Pop \`(d, u)\`; if \`d\` is stale (larger than \`dist[u]\`), skip it ("lazy deletion").
- **Relax** each edge \`u → v\` of weight \`w\`: if \`d + w < dist[v]\`, update and push.

Cost $O((V + E)\\log V)$.

**When Dijkstra doesn't fit.**

- Weights only 0 or 1: **0-1 BFS** with a deque (push 0-edges to the front): $O(V + E)$.
- Negative weights, or a limit on the number of edges ("at most k stops"): **Bellman-Ford**, relaxing all edges in rounds; $k$ rounds allow paths of up to $k$ edges.
`,
  maths: `
**In one breath.** \`dist = {src: 0}\`; heap \`[(0, src)]\`; pop, skip stale, relax neighbours, push improvements; $O((V + E)\\log V)$; non-negative weights only.

**Template: Dijkstra.**

\`\`\`python
import heapq
from collections import defaultdict
def dijkstra(n, edges, src):              # edges: (u, v, w), directed
    adj = defaultdict(list)
    for u, v, w in edges:
        adj[u].append((v, w))
    dist = [float("inf")] * n
    dist[src] = 0
    h = [(0, src)]
    while h:
        d, u = heapq.heappop(h)
        if d > dist[u]:
            continue                       # stale entry
        for v, w in adj[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(h, (dist[v], v))
    return dist
\`\`\`

**Worked problem 1: time for a signal to reach every node.** Nodes 1..4, edges \`(2, 1, 1), (2, 3, 1), (3, 4, 1)\`, start 2. Distances 1, 0, 1, 2 → answer \`max = 2\`; if any distance is infinite, return −1. Remember to shift 1-indexed labels.

**Worked problem 2: cheapest price with at most k stops (Bellman-Ford rounds).**

\`\`\`python
def cheapest_within_k(n, flights, src, dst, k):
    cost = [float("inf")] * n
    cost[src] = 0
    for _ in range(k + 1):                 # k stops = k + 1 edges
        nxt = cost[:]                      # read old values only
        for u, v, w in flights:
            if cost[u] + w < nxt[v]:
                nxt[v] = cost[u] + w
        cost = nxt
    return -1 if cost[dst] == float("inf") else cost[dst]
flights = [(0, 1, 100), (1, 2, 100), (2, 0, 100), (1, 3, 600), (2, 3, 200)]
cheapest_within_k(4, flights, 0, 3, 1)     # 700 (0 -> 1 -> 3); 0 -> 1 -> 2 -> 3 needs 2 stops
\`\`\`

Copying \`cost\` each round stops one round from chaining several edges. $O(k\\cdot E)$.

**Worked problem 3: path with minimum effort on a grid.** Edge weight = height difference; path cost = **maximum** edge on it. Dijkstra still works with \`max(d, w)\` in place of \`d + w\`, because the cost never decreases along a path.

**Edge cases.** Unreachable nodes (stay at infinity); negative edges (Dijkstra can be wrong); multiple edges between the same nodes (fine); stopping early when the target is popped.
`,
  practice: `
**Signals:** "weighted", "cost", "time/delay", "cheapest", "minimum effort", "probability" (maximise a product: use −log or a max-heap), "at most k stops/edges", "negative weights".

**Variations.** Path With Maximum Probability (max-heap), Swim in Rising Water (minimise the maximum), Minimum Cost to Make at Least One Valid Path (0-1 BFS), Network Delay Time, Find the City With the Smallest Number of Neighbours (Floyd–Warshall for small n: $O(n^3)$).

**Practise:** Network Delay Time, Cheapest Flights Within K Stops, Path With Minimum Effort, Path with Maximum Probability, Swim in Rising Water, Minimum Cost to Make at Least One Valid Path in a Grid, Find the City With the Smallest Number of Neighbors at a Threshold Distance.
`,
  traps: [
    { trap: "Use Dijkstra with negative edge weights.", why: "A settled node can later be reached more cheaply through a negative edge, so results can be wrong. Use Bellman-Ford (or SPFA) instead." },
    { trap: "Mark a node visited when it's pushed onto the heap.", why: "A better distance may be found later. Settle on pop, and skip stale heap entries whose distance is larger than dist[u]." },
    { trap: "Run Dijkstra on (cost) only for 'at most k stops'.", why: "The cheapest path might use too many stops and block a slightly dearer valid path. Track stops in the state or use k + 1 Bellman-Ford rounds." },
  ],
  say: {
    prompt: "Find the time for a signal from node k to reach all n nodes over weighted directed links, or −1 if some can't be reached.",
    secs: 50,
    check: ["Single-source shortest paths with non-negative weights → Dijkstra", "Min-heap of (distance, node); skip stale entries", "Relax each edge: d + w < dist[v]", "Answer = max distance; −1 if any infinite", "O((V + E) log V)"],
    followups: [
      { q: "Why does Dijkstra fail with negative weights?", a: "It assumes the popped node's distance is final; a negative edge found later could reduce it, but the node has already been used to relax others." },
      { q: "What if all weights are equal?", a: "Then it's an unweighted problem: plain BFS gives the same answer in O(V + E)." },
      { q: "How would you get the actual path?", a: "Store a parent for each node when its distance improves, then walk parents back from the target and reverse." },
    ],
    answer: `This is single-source shortest paths with non-negative delays, so I'd use Dijkstra. I build an adjacency list, set every distance to infinity except the source at zero, and push (0, source) onto a min-heap. I repeatedly pop the closest node; if its popped distance is larger than the recorded one it's a stale entry and I skip it. Otherwise I relax each outgoing edge, and whenever I find a shorter distance I record it and push it.

When the heap is empty, the time for everyone to hear the signal is the largest distance, or −1 if any node is still at infinity. It runs in O((V + E) log V). If weights could be negative, or the number of edges were limited, I'd switch to Bellman-Ford.`,
    avoid: ["Plain BFS on weighted edges", "Dijkstra with negative weights"],
  },
  terms: [["Relaxation", "Improving dist[v] via an edge u → v."], ["Stale entry", "A heap item whose distance is no longer the best known."], ["Bellman-Ford", "Relax every edge in V − 1 (or k) rounds; handles negatives."]],
  sources: [D.dijkstra, D.heapq, D.bfs],
});
Q({ id: "dsa2-sp-1", d: 1, secs: 45, prompt: "Nodes 1..4, directed edges (2, 1, 1), (2, 3, 1), (3, 4, 1), signal from node 2. Time for all to receive it?", answer: 2, tol: 0.5, explain: "Node 4 at distance 2.", py: "import heapq\nfrom collections import defaultdict\nadj = defaultdict(list)\nfor u, v, w in [(2,1,1),(2,3,1),(3,4,1)]: adj[u].append((v, w))\ndist = {2: 0}; h = [(0, 2)]\nwhile h:\n    d, u = heapq.heappop(h)\n    if d > dist[u]: continue\n    for v, w in adj[u]:\n        if d+w < dist.get(v, 1e18): dist[v] = d+w; heapq.heappush(h, (d+w, v))\nanswer = max(dist.values()) if len(dist) == 4 else -1" });
Q({ id: "dsa2-sp-2", d: 2, secs: 60, prompt: "Cheapest price from 0 to 3 with at most 1 stop: flights (0,1,100), (1,2,100), (2,0,100), (1,3,600), (2,3,200)?", answer: 700, tol: 0.5, explain: "0 → 1 → 3. The cheaper 0 → 1 → 2 → 3 (400) uses 2 stops.", py: "F = [(0,1,100),(1,2,100),(2,0,100),(1,3,600),(2,3,200)]\nc = [float('inf')]*4; c[0] = 0\nfor _ in range(2):\n    nx = c[:]\n    for u, v, w in F:\n        if c[u]+w < nx[v]: nx[v] = c[u]+w\n    c = nx\nanswer = c[3]" });
Q({ id: "dsa2-sp-3", d: 2, secs: 60, prompt: "Undirected weighted graph: (0,1,4), (0,2,1), (2,1,2), (1,3,1), (2,3,5). Shortest distance from 0 to 3?", answer: 4, tol: 0.5, explain: "0 → 2 → 1 → 3: 1 + 2 + 1.", py: "import heapq\nfrom collections import defaultdict\nadj = defaultdict(list)\nfor u, v, w in [(0,1,4),(0,2,1),(2,1,2),(1,3,1),(2,3,5)]: adj[u].append((v,w)); adj[v].append((u,w))\nd = {0: 0}; h = [(0,0)]\nwhile h:\n    x, u = heapq.heappop(h)\n    if x > d[u]: continue\n    for v, w in adj[u]:\n        if x+w < d.get(v, 1e18): d[v] = x+w; heapq.heappush(h, (x+w, v))\nanswer = d[3]" });
Q({ id: "dsa2-sp-4", d: 1, secs: 30, prompt: "Which algorithm suits single-source shortest paths when some edge weights are negative (no negative cycles)?", options: ["Plain BFS", "Dijkstra", "Bellman-Ford", "Kahn's algorithm"], answer: 2, explain: "Bellman-Ford relaxes all edges repeatedly and handles negative weights.", py: "E = [(0,1,4),(0,2,5),(2,1,-3)]\nd = [0, float('inf'), float('inf')]\nfor _ in range(2):\n    for u, v, w in E:\n        if d[u]+w < d[v]: d[v] = d[u]+w\nanswer = 2 if d[1] == 2 else 0" });
C("dsa2-sp-c1", "Dijkstra loop", "pop (d, u); skip if d > dist[u]; relax d + w < dist[v] → push.");
C("dsa2-sp-c2", "Which shortest-path tool", "Unweighted: BFS · 0/1: 0-1 BFS · non-negative: Dijkstra · negative or ≤ k edges: Bellman-Ford.");

L("dsa2-graph-practice", GR, "Graphs practice", "Graph problems to explain: model, traversal, complexity.", {
  kind: "interview", mins: 30, prereq: ["dsa2-graph-traversal", "dsa2-grid-graphs", "dsa2-topo-sort", "dsa2-union-find", "dsa2-shortest-paths"],
  hook: "For each: what are the nodes and edges, which algorithm, and why that one?",
}, [
  iq("Word Ladder: fewest one-letter changes from beginWord to endWord using a word list.", "Nodes are words; edges join words differing by one letter. BFS from beginWord gives the fewest steps. Generate neighbours by wildcard patterns (h*t) in a dict, or by trying 26 letters per position against a set. O(N·L²) or O(N·L·26). Bidirectional BFS speeds it up.", ["Implicit graph", "BFS for fewest steps", "Wildcard buckets or 26-letter swaps", "Visited set, bidirectional option"]),
  iq("Accounts Merge: accounts with a name and emails; merge accounts sharing any email.", "Union-find over emails (or accounts): union all emails in an account with its first email; group emails by root, sort, and attach the name. O(N·α) plus sorting. DFS over an email graph works too.", ["Union-find or graph of emails", "Group by root", "Sort output emails", "Map emails to ids"]),
  iq("Pacific Atlantic Water Flow: cells from which water can reach both oceans.", "Reverse the flow: BFS/DFS from each ocean's border cells moving to neighbours with height ≥ current. Intersect the two reachable sets. O(R·C) instead of a search from every cell.", ["Reverse search from borders", "Two reachability sets", "Intersect", "O(R·C)"]),
  iq("Alien Dictionary: given words sorted in an unknown alphabet, return a valid letter order.", "For each adjacent pair, the first differing letter gives an edge a → b. If a word is followed by its own proper prefix, it's invalid. Topological sort (Kahn's) on letters; if not all letters are output, there's a cycle → invalid. O(total characters).", ["Edges from first difference", "Prefix edge case", "Topological sort", "Cycle → invalid"]),
  iq("Min Cost to Connect All Points with Manhattan distance.", "Minimum spanning tree on a complete graph. Prim's with a simple O(n²) array (no heap) is best for dense graphs; Kruskal would sort O(n²) edges, O(n² log n). Sum the chosen edge weights.", ["Recognise MST", "Dense graph → O(n²) Prim", "Kruskal alternative and its cost", "Union-find in Kruskal"]),
  iq("Swim in Rising Water: grid of heights; at time t you can enter cells with height ≤ t. Earliest time to reach the bottom-right?", "Minimise the maximum height on a path. Dijkstra with cost = max(current, height) using a min-heap: O(n² log n). Alternatives: binary search on t with BFS, or union-find adding cells in height order until start and end connect.", ["Minimax path", "Dijkstra with max", "Binary search + BFS alternative", "Union-find in height order"]),
]);

// ───────────────────────── Greedy and intervals ─────────────────────────

L("dsa2-greedy", GI, "Greedy choices and how to trust them", "Making the locally best choice, the exchange argument that proves it safe, reach-based scans like Jump Game and Gas Station, and spotting when greedy fails.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-sorting"],
  hook: "With coins 1, 3 and 4, making 6 by always taking the biggest coin gives 4 + 1 + 1. The best is 3 + 3. When can you trust the greedy choice?",
  intuition: `
**The situation.** Optimisation with a natural "obvious best next step": take the furthest jump, give the smallest cookie that satisfies a child, start the tank where the deficit ends.

**The idea.** A greedy algorithm commits to the locally best choice and never revisits it. It's correct when the problem has the **greedy-choice property**: some optimal solution starts with the greedy choice, and what remains is a smaller instance of the same problem.

**How to convince yourself (and the interviewer).** The **exchange argument:** take any optimal solution that doesn't make the greedy choice; swap in the greedy choice; show the result is no worse. If you can't, try a small counterexample. If one exists, use DP.

**Recognise it.** Sorting reveals an order where decisions don't interfere; or a single running quantity (furthest reach, fuel balance) summarises everything you need.
`,
  maths: `
**In one breath.** Choose the best next step, prove by exchange, test with a tiny counterexample; usually sort + one pass: $O(n\\log n)$ or $O(n)$.

**Template: furthest reach scan (can you reach the end?).**

\`\`\`python
def can_reach_end(nums):            # nums[i] = max jump from i
    reach = 0
    for i, x in enumerate(nums):
        if i > reach:
            return False            # stuck before i
        reach = max(reach, i + x)
    return True
can_reach_end([2, 3, 1, 1, 4])      # True
can_reach_end([3, 2, 1, 0, 4])      # False: everyone lands on the 0
\`\`\`

**Worked problem 1: fewest jumps to the end** (BFS by layers, done greedily).

\`\`\`python
def min_jumps(nums):
    jumps, end, far = 0, 0, 0
    for i in range(len(nums) - 1):
        far = max(far, i + nums[i])
        if i == end:                # finished the current layer
            jumps += 1
            end = far
    return jumps
min_jumps([2, 3, 1, 1, 4])          # 2
\`\`\`

**Worked problem 2: gas station circuit.** \`gas[i]\` fuel at station \`i\`, \`cost[i]\` to reach the next.

\`\`\`python
def start_station(gas, cost):
    if sum(gas) < sum(cost):
        return -1                   # impossible overall
    start = tank = 0
    for i in range(len(gas)):
        tank += gas[i] - cost[i]
        if tank < 0:                # can't start anywhere in start..i
            start, tank = i + 1, 0
    return start
start_station([1, 2, 3, 4, 5], [3, 4, 5, 1, 2])   # 3
\`\`\`

Why skipping is safe: if you run dry at \`i\` starting from \`start\`, every station between them arrived with tank ≥ 0, so starting there is no better.

**Worked problem 3: satisfy children with cookies.** Sort greed factors and cookie sizes; two pointers give each child the smallest cookie that works. The exchange argument: giving a bigger cookie never helps a later child more.

**When greedy fails.** Coins [1, 3, 4], amount 6 (greedy 3 coins, optimal 2); 0/1 knapsack by value density; longest path. Use DP.
`,
  practice: `
**Signals:** "minimum number of …", "maximum number of …", "can you reach", "assign", choices that look independent after sorting, constraints up to 10⁵ (DP over pairs would be too slow).

**Checklist.** Find the order (sort by end, by ratio, by deadline). State the invariant. Try a 3–4 element counterexample. If greedy fails, it's probably DP.

**Practise:** Jump Game, Jump Game II, Gas Station, Assign Cookies, Best Time to Buy and Sell Stock II, Lemonade Change, Maximum Subarray (Kadane is greedy/DP), Minimum Number of Refuelling Stops (greedy with a heap).
`,
  traps: [
    { trap: "Greedy works for coin change with any coins.", why: "Only for 'canonical' systems like 1, 2, 5, 10. Coins [1, 3, 4] for 6 break it. Use DP when coins are arbitrary." },
    { trap: "In Gas Station, try every start and simulate.", why: "That's O(n²). If the total gas ≥ total cost, a single pass that resets the start after each deficit finds the answer in O(n)." },
    { trap: "A greedy that passes the examples is correct.", why: "Examples are chosen to be friendly. Argue by exchange or find a small counterexample before committing." },
  ],
  say: {
    prompt: "How do you decide whether a greedy algorithm is correct? Use Jump Game or Gas Station as the example.",
    secs: 50,
    check: ["State the greedy choice clearly", "Exchange argument: swapping in the greedy choice doesn't make an optimal solution worse", "Or an invariant (furthest reach, tank balance)", "Try a small counterexample", "Fall back to DP if greedy fails"],
    followups: [
      { q: "Why is resetting the start correct in Gas Station?", a: "If the tank goes negative at i starting from s, every station between s and i was reached with a non-negative tank, so starting at any of them means arriving at i with even less fuel. None can work, so the next candidate is i + 1." },
      { q: "Is Jump Game II greedy or BFS?", a: "Both: positions reachable with j jumps form BFS layers; the greedy scan tracks the current layer's end and the furthest reach of the next layer, giving O(n)." },
      { q: "Give a problem where greedy by value density fails.", a: "0/1 knapsack: capacity 10, items (weight 6, value 6.5) and two of (weight 5, value 5). Density picks the 6-weight item (6.5); two 5-weight items give 10." },
    ],
    answer: `I first state the greedy choice precisely, then try to justify it with an exchange argument: take any optimal solution that doesn't make that choice and show I can swap the greedy choice in without making it worse. If that works at every step, greedy is optimal. Otherwise I look for a small counterexample, and if I find one I switch to DP.

In Jump Game the invariant is the furthest index reachable so far. Scanning left to right, if I ever reach an index beyond it, I'm stuck; otherwise I extend it with i + nums[i]. Any path to a position can only extend reach up to that maximum, so tracking it loses nothing. That's O(n) time and O(1) space.`,
    avoid: ["Claiming greedy works because the examples pass", "Greedy coin change with arbitrary denominations"],
  },
  terms: [["Greedy-choice property", "Some optimal solution begins with the greedy choice."], ["Exchange argument", "Swap a step of an optimal solution for the greedy one without loss."], ["Invariant", "A quantity that summarises what matters so far (reach, balance)."]],
  sources: [D.greedy],
});
Q({ id: "dsa2-gr-1", d: 1, secs: 45, prompt: "Fewest jumps to reach the last index of [2, 3, 0, 1, 4]?", answer: 2, tol: 0.5, explain: "0 → 1 → 4.", py: "a = [2,3,0,1,4]; j = e = f = 0\nfor i in range(len(a)-1):\n    f = max(f, i+a[i])\n    if i == e: j += 1; e = f\nanswer = j" });
Q({ id: "dsa2-gr-2", d: 2, secs: 60, prompt: "Gas Station with gas [1, 2, 3, 4, 5] and cost [3, 4, 5, 1, 2]. Starting index?", answer: 3, tol: 0.5, explain: "Deficits reset the start at 1, 2, then 3; total gas 15 ≥ total cost 15.", py: "g, c = [1,2,3,4,5], [3,4,5,1,2]\ns = t = 0\nfor i in range(5):\n    t += g[i]-c[i]\n    if t < 0: s, t = i+1, 0\nanswer = s if sum(g) >= sum(c) else -1" });
Q({ id: "dsa2-gr-3", d: 1, secs: 45, prompt: "Children's greed [1, 2, 3], cookie sizes [1, 1]. Maximum children satisfied?", answer: 1, tol: 0.5, explain: "Only the child with greed 1 can be satisfied.", py: "g, s = sorted([1,2,3]), sorted([1,1]); i = 0\nfor x in s:\n    if i < len(g) and x >= g[i]: i += 1\nanswer = i" });
Q({ id: "dsa2-gr-4", d: 2, secs: 60, prompt: "Coins [1, 3, 4], amount 6. How many more coins does 'largest coin first' use than the optimum?", answer: 1, tol: 0.5, explain: "Greedy 4 + 1 + 1 = 3 coins; optimal 3 + 3 = 2.", py: "coins, amt = [1,3,4], 6\nr, g = amt, 0\nfor c in sorted(coins, reverse=True):\n    g += r // c; r %= c\ndp = [0] + [99]*amt\nfor a in range(1, amt+1):\n    dp[a] = min(dp[a-c]+1 for c in coins if c <= a)\nanswer = g - dp[amt]" });
C("dsa2-gr-c1", "Trusting greedy", "Exchange argument or invariant; try a tiny counterexample; else DP.");
C("dsa2-gr-c2", "Jump Game", "reach = max(reach, i + nums[i]); fail if i > reach.");

L("dsa2-intervals", GI, "Interval problems", "Sort by start to merge and insert; sort by end to keep the most non-overlapping intervals or shoot the fewest arrows; two pointers for intersections.", {
  kind: "concept", mins: 30, mathsLabel: "Code", prereq: ["dsa2-greedy", "dsa2-sorting"],
  hook: "Remove the fewest meetings so none overlap. Do you keep the one that starts first, the shortest one, or the one that ends first?",
  intuition: `
**The situation.** Calendars, bookings, ranges of IDs, time windows. Interval problems are among the most common OA questions.

**The idea.** Sort first, then sweep once. Which key to sort by depends on the question:

- **Merging or inserting** (combine overlaps): sort by **start**. Each interval either extends the last merged one or starts a new block.
- **Choosing the most non-overlapping** (or the fewest to remove, or arrows to burst): sort by **end**. Picking the interval that finishes earliest leaves the most room for the rest. This is the classic interval-scheduling greedy, proved by exchange.
- **Intersecting two sorted lists:** two pointers; the overlap of \`[a, b]\` and \`[c, d]\` is \`[max(a, c), min(b, d)]\` when non-empty; advance whichever ends first.

Two intervals \`[a, b]\` and \`[c, d]\` overlap when \`a <= d and c <= b\` (closed intervals). Check whether touching endpoints count.
`,
  maths: `
**In one breath.** Merge: sort by start, extend \`last[1] = max(last[1], e)\` when \`s <= last[1]\`; max non-overlapping: sort by end, keep if \`s >= last_end\`; removals = n − kept; $O(n\\log n)$.

**Template: merge overlapping intervals.**

\`\`\`python
def merge(intervals):
    out = []
    for s, e in sorted(intervals):
        if out and s <= out[-1][1]:            # overlaps the last block
            out[-1][1] = max(out[-1][1], e)    # max: the new one may be inside
        else:
            out.append([s, e])
    return out
merge([[1, 3], [2, 6], [8, 10], [15, 18]])     # [[1, 6], [8, 10], [15, 18]]
\`\`\`

**Worked problem 1: insert into a sorted, non-overlapping list.**

\`\`\`python
def insert(intervals, new):
    out, i, n = [], 0, len(intervals)
    s, e = new
    while i < n and intervals[i][1] < s:       # entirely before
        out.append(intervals[i]); i += 1
    while i < n and intervals[i][0] <= e:      # overlapping: absorb
        s, e = min(s, intervals[i][0]), max(e, intervals[i][1]); i += 1
    out.append([s, e])
    out.extend(intervals[i:])                  # entirely after
    return out
insert([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8])   # [[1, 2], [3, 10], [12, 16]]
\`\`\`

$O(n)$: no sort needed.

**Worked problem 2: fewest removals so the rest don't overlap** (touching ends allowed).

\`\`\`python
def min_removals(intervals):
    kept, last_end = 0, float("-inf")
    for s, e in sorted(intervals, key=lambda x: x[1]):   # by END
        if s >= last_end:
            kept += 1
            last_end = e
    return len(intervals) - kept
min_removals([[1, 2], [2, 3], [3, 4], [1, 3]])           # 1
\`\`\`

**Fewest arrows to burst balloons** is the same scan with \`s > last_end\` (touching balloons share an arrow): \`[[10, 16], [2, 8], [1, 6], [7, 12]]\` → 2.

**Worked problem 3: intersections of two sorted lists.**

\`\`\`python
def intersect(A, B):
    i = j = 0; out = []
    while i < len(A) and j < len(B):
        lo, hi = max(A[i][0], B[j][0]), min(A[i][1], B[j][1])
        if lo <= hi:
            out.append([lo, hi])
        if A[i][1] < B[j][1]: i += 1           # drop the one that ends first
        else: j += 1
    return out
\`\`\`

**Edge cases.** Empty input; touching intervals (\`<\` vs \`<=\`); one interval inside another (use \`max\` when merging); unsorted input for insert (sort first or merge).
`,
  practice: `
**Signals:** pairs \`[start, end]\`, "overlap", "merge", "free time", "conflicts", "minimum removals", "minimum arrows/rooms", "can attend all meetings".

**Variations.** Meeting Rooms (sort by start, check neighbours), Meeting Rooms II (heap or sweep: see the Heaps module), Employee Free Time (merge all, gaps between blocks), Remove Covered Intervals (sort by start asc, end desc), Data Stream as Disjoint Intervals.

**Practise:** Merge Intervals, Insert Interval, Non-overlapping Intervals, Minimum Number of Arrows to Burst Balloons, Interval List Intersections, Meeting Rooms, Remove Covered Intervals, Employee Free Time.
`,
  traps: [
    { trap: "Sort by start to maximise non-overlapping intervals.", why: "An early-starting long interval can block many short ones. Sort by end: the earliest finisher leaves the most room." },
    { trap: "When merging, set the end to the new interval's end.", why: "The new interval may sit inside the current block ([1, 10] then [2, 3]). Use max of the two ends." },
    { trap: "Treat touching intervals the same in every problem.", why: "[1, 2] and [2, 3] overlap for balloons (one arrow bursts both) but not for meetings. Read the definition and pick < or <=." },
  ],
  say: {
    prompt: "Find the minimum number of intervals to remove so the rest don't overlap. Justify the sort order.",
    secs: 45,
    check: ["Equivalent to keeping the maximum number of non-overlapping intervals", "Sort by end time", "Keep an interval if it starts at or after the last kept end", "Exchange argument for earliest end", "O(n log n); removals = n − kept"],
    followups: [
      { q: "Why does earliest end time work?", a: "Among intervals compatible with what's kept so far, the one ending first leaves the most room. Any optimal solution's first choice can be replaced by it without conflicts, so the greedy is optimal." },
      { q: "How is Minimum Arrows different?", a: "Same greedy by end, but touching intervals share an arrow, so you start a new arrow only when start > last end." },
      { q: "How would you merge if intervals arrive as a stream?", a: "Keep a sorted structure of disjoint blocks; for each new interval, find neighbours by binary search and merge with any that overlap: O(log n) plus merges." },
    ],
    answer: `Removing the fewest intervals is the same as keeping the most that don't overlap. I sort by end time and scan, keeping an interval whenever its start is at or after the end of the last one I kept; the answer is the total minus the number kept.

Sorting by end is the key choice. Among the intervals that fit, the one that finishes first leaves the most room for the rest, and an exchange argument shows that replacing an optimal solution's first interval with the earliest-ending one never creates a conflict. Sorting by start fails because one long early interval can block several short ones. It's O(n log n) for the sort and O(1) extra space.`,
    avoid: ["Sorting by start or by length", "Ignoring how touching endpoints are defined"],
  },
  terms: [["Interval scheduling", "Choose the most non-overlapping intervals: earliest end first."], ["Overlap test", "[a, b] and [c, d] overlap iff a ≤ d and c ≤ b."], ["Sweep", "Process sorted intervals once, keeping a running state."]],
  sources: [S.intSched, S.lcMerge, D.greedy],
});
Q({ id: "dsa2-iv-1", d: 1, secs: 45, prompt: "Merge [[1, 4], [4, 5], [6, 8], [7, 9], [10, 12]] (touching intervals merge). How many intervals remain?", answer: 3, tol: 0.5, explain: "[1, 5], [6, 9], [10, 12].", py: "out = []\nfor s, e in sorted([[1,4],[4,5],[6,8],[7,9],[10,12]]):\n    if out and s <= out[-1][1]: out[-1][1] = max(out[-1][1], e)\n    else: out.append([s, e])\nanswer = len(out)" });
Q({ id: "dsa2-iv-2", d: 2, secs: 60, prompt: "Insert [4, 8] into [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]]. What is the end of the merged interval that contains 4?", answer: 10, tol: 0.5, explain: "[3, 5], [6, 7], [8, 10] absorb into [3, 10].", py: "I = [[1,2],[3,5],[6,7],[8,10],[12,16]]; s, e = 4, 8; out = []; i = 0\nwhile i < len(I) and I[i][1] < s: out.append(I[i]); i += 1\nwhile i < len(I) and I[i][0] <= e: s, e = min(s, I[i][0]), max(e, I[i][1]); i += 1\nanswer = e" });
Q({ id: "dsa2-iv-3", d: 2, secs: 60, prompt: "Fewest removals so [[1, 2], [2, 3], [3, 4], [1, 3]] has no overlaps (touching is fine)?", answer: 1, tol: 0.5, explain: "Remove [1, 3].", py: "k, le = 0, float('-inf')\nI = [[1,2],[2,3],[3,4],[1,3]]\nfor s, e in sorted(I, key=lambda x: x[1]):\n    if s >= le: k += 1; le = e\nanswer = len(I) - k" });
Q({ id: "dsa2-iv-4", d: 2, secs: 60, prompt: "Fewest arrows for balloons [[10, 16], [2, 8], [1, 6], [7, 12]] (an arrow at x bursts every balloon with start ≤ x ≤ end)?", answer: 2, tol: 0.5, explain: "x = 6 bursts [1, 6] and [2, 8]; x = 12 bursts the others.", py: "n, le = 0, float('-inf')\nfor s, e in sorted([[10,16],[2,8],[1,6],[7,12]], key=lambda x: x[1]):\n    if s > le: n += 1; le = e\nanswer = n" });
Q({ id: "dsa2-iv-5", d: 2, secs: 60, prompt: "How many intersection intervals between A = [[0, 2], [5, 10], [13, 23], [24, 25]] and B = [[1, 5], [8, 12], [15, 24], [25, 26]]?", answer: 6, tol: 0.5, explain: "[1,2], [5,5], [8,10], [15,23], [24,24], [25,25].", py: "A = [[0,2],[5,10],[13,23],[24,25]]; B = [[1,5],[8,12],[15,24],[25,26]]\ni = j = 0; out = []\nwhile i < len(A) and j < len(B):\n    lo, hi = max(A[i][0], B[j][0]), min(A[i][1], B[j][1])\n    if lo <= hi: out.append([lo, hi])\n    if A[i][1] < B[j][1]: i += 1\n    else: j += 1\nanswer = len(out)" });
C("dsa2-iv-c1", "Which sort key", "Merge/insert → by start. Max non-overlapping / arrows → by end.");
C("dsa2-iv-c2", "Merge step", "if s ≤ last.end: last.end = max(last.end, e) else append.");

L("dsa2-greedy-scans", GI, "Greedy with sorting keys, two passes and sweeps", "Sorting by a derived key (cost difference), two-pass scans for neighbour constraints, last-occurrence partitioning, and +1/−1 event sweeps for peak overlap.", {
  kind: "concept", mins: 25, mathsLabel: "Code", prereq: ["dsa2-greedy", "dsa2-intervals"],
  hook: "Children in a row must get more sweets than any neighbour with a higher rating. Each child depends on both sides. How can two simple passes satisfy both?",
  intuition: `
**The situation.** Greedy problems where the right order isn't obvious, or where a constraint looks two-sided.

**The ideas.**

- **Sort by a derived key.** Send n people to city A and n to city B at least total cost: sort by \`costA − costB\`; the n with the most negative differences go to A.
- **Two passes for two-sided constraints.** Left-to-right satisfies "more than the left neighbour"; right-to-left satisfies "more than the right neighbour"; take the max of both.
- **Last occurrence.** To cut a string into the most pieces with each letter in one piece, extend the current piece to the furthest last occurrence of any letter seen so far.
- **Event sweep.** Turn each interval into \`(start, +1)\` and \`(end, −1)\` events, sort, and keep a running total: its maximum is the peak overlap (rooms, concurrent users).
`,
  maths: `
**In one breath.** Derived-key sort; two passes with \`max\`; \`end = max(end, last[ch])\` and cut when \`i == end\`; events \`(+1 at start, −1 at end)\` sorted with ends before starts at equal times.

**Template: event sweep for peak overlap.**

\`\`\`python
def peak_overlap(intervals):                  # half-open [s, e): end frees before a start at the same time
    events = []
    for s, e in intervals:
        events.append((s, 1)); events.append((e, -1))
    events.sort()                             # (t, -1) sorts before (t, +1)
    cur = best = 0
    for _, d in events:
        cur += d
        best = max(best, cur)
    return best
peak_overlap([(1, 4), (2, 5), (7, 9), (3, 6)])   # 3
\`\`\`

**Worked problem 1: minimum sweets with the neighbour rule.**

\`\`\`python
def sweets(r):
    n = len(r)
    give = [1] * n
    for i in range(1, n):                     # left neighbour rule
        if r[i] > r[i - 1]:
            give[i] = give[i - 1] + 1
    for i in range(n - 2, -1, -1):            # right neighbour rule
        if r[i] > r[i + 1]:
            give[i] = max(give[i], give[i + 1] + 1)
    return sum(give)
sweets([1, 0, 2])     # 5  -> [2, 1, 2]
sweets([1, 2, 2])     # 4  -> [1, 2, 1]
\`\`\`

**Worked problem 2: split a string so each letter appears in one part.**

\`\`\`python
def partition_sizes(s):
    last = {ch: i for i, ch in enumerate(s)}
    out, start, end = [], 0, 0
    for i, ch in enumerate(s):
        end = max(end, last[ch])
        if i == end:                          # everything seen so far closes here
            out.append(end - start + 1)
            start = i + 1
    return out
partition_sizes("ababcbacadefegdehijhklij")   # [9, 7, 8]
\`\`\`

**Worked problem 3: send half to each city.** \`[[10, 20], [30, 200], [400, 50], [30, 20]]\`: differences −10, −170, 350, 10; the two smallest go to A: 10 + 30 + 50 + 20 = 110.

\`\`\`python
def two_city(costs):
    costs = sorted(costs, key=lambda c: c[0] - c[1])
    n = len(costs) // 2
    return sum(a for a, _ in costs[:n]) + sum(b for _, b in costs[n:])
\`\`\`

**Edge cases.** Equal ratings (no constraint between equals in the sweets problem); events at the same time (decide whether an end frees a slot before a start); single-character strings.
`,
  practice: `
**Signals:** "minimum total" with a choice per item, "each neighbour", "both sides", "each letter appears in at most one part", "maximum concurrent", "peak", "car pooling capacity".

**Variations.** Car Pooling (events with passenger counts, or a difference array over time), Queue Reconstruction by Height (sort by height desc, insert at index k), Boats to Save People (sort + two pointers), Minimum Deletions to Make Character Frequencies Unique.

**Practise:** Candy, Two City Scheduling, Partition Labels, Car Pooling, Queue Reconstruction by Height, Hand of Straights, Minimum Deletions to Make Character Frequencies Unique, Maximum Units on a Truck.
`,
  traps: [
    { trap: "In the sweets problem, do one pass and patch locally.", why: "Fixing the right side can break the left. Two full passes, combined with max, satisfy both rules." },
    { trap: "Sort events by time only.", why: "At equal times, whether an end comes before a start changes the peak. Encode the rule in the sort key (e.g. −1 before +1 for half-open intervals)." },
    { trap: "Two City: send each person to their cheaper city.", why: "That ignores the 'exactly n each' constraint. Sort by the cost difference so the people who save most by going to A go there." },
  ],
  say: {
    prompt: "Give each child at least one sweet, and more than any neighbour with a higher rating, using the fewest sweets.",
    secs: 45,
    check: ["Start everyone at 1", "Left-to-right pass for the left neighbour rule", "Right-to-left pass for the right rule, taking max", "Sum the result", "O(n) time, O(n) space (O(1) with slope counting)"],
    followups: [
      { q: "Why take the max in the second pass?", a: "The value must satisfy both rules; the first pass's value is the minimum for the left rule and the second pass's for the right rule, so the max is the smallest value satisfying both." },
      { q: "How do you find the peak number of overlapping intervals?", a: "Make +1 events at starts and −1 at ends, sort (with the tie rule), and track the running sum's maximum: O(n log n)." },
      { q: "When does sorting by a difference solve an assignment problem?", a: "When each item chooses between two options and a count constraint applies; the difference measures how much each item gains from option A, so the largest gains get A." },
    ],
    answer: `Each child's count depends on both neighbours, so I handle the two directions separately. I start everyone at one sweet. Going left to right, if a child's rating is higher than the left neighbour's, they get one more than that neighbour. Then going right to left, if a child's rating is higher than the right neighbour's, they get the larger of their current count and one more than the right neighbour.

After both passes each child satisfies both rules with the smallest possible count, and I sum the array. It's two linear passes, O(n) time and O(n) space. Equal neighbours impose no constraint, so they can get fewer.`,
    avoid: ["A single pass with local fixes", "Giving equal ratings equal sweets as a rule"],
  },
  terms: [["Derived sort key", "Sort by a computed value such as a cost difference."], ["Two-pass scan", "One pass per direction for two-sided constraints."], ["Event sweep", "+1/−1 events sorted by time; running sum = current overlap."]],
  sources: [D.greedy, S.intSched],
});
Q({ id: "dsa2-gs-1", d: 1, secs: 45, prompt: "Minimum sweets for ratings [1, 3, 4, 5, 2]?", answer: 11, tol: 0.5, explain: "[1, 2, 3, 4, 1].", py: "r = [1,3,4,5,2]; n = len(r); g = [1]*n\nfor i in range(1, n):\n    if r[i] > r[i-1]: g[i] = g[i-1]+1\nfor i in range(n-2, -1, -1):\n    if r[i] > r[i+1]: g[i] = max(g[i], g[i+1]+1)\nanswer = sum(g)" });
Q({ id: "dsa2-gs-2", d: 2, secs: 60, prompt: "Partition 'ababcbacadefegdehijhklij' so each letter is in one part, maximising parts. How many parts?", answer: 3, tol: 0.5, explain: "Sizes 9, 7, 8.", py: "s = 'ababcbacadefegdehijhklij'\nlast = {c: i for i, c in enumerate(s)}; e = st = 0; out = []\nfor i, c in enumerate(s):\n    e = max(e, last[c])\n    if i == e: out.append(e-st+1); st = i+1\nanswer = len(out)" });
Q({ id: "dsa2-gs-3", d: 2, secs: 60, prompt: "Two-city costs [[10, 20], [30, 200], [400, 50], [30, 20]], two people per city. Minimum total cost?", answer: 110, tol: 0.5, explain: "People 0 and 1 to A (10 + 30), 2 and 3 to B (50 + 20).", py: "c = sorted([[10,20],[30,200],[400,50],[30,20]], key=lambda x: x[0]-x[1]); n = 2\nanswer = sum(a for a, _ in c[:n]) + sum(b for _, b in c[n:])" });
Q({ id: "dsa2-gs-4", d: 2, secs: 60, prompt: "Peak number of simultaneous bookings for half-open intervals [1, 4), [2, 5), [7, 9), [3, 6), [4, 7)?", answer: 3, tol: 0.5, explain: "At time 3: [1,4), [2,5), [3,6). At 4 one ends as another starts.", py: "ev = []\nfor s, e in [(1,4),(2,5),(7,9),(3,6),(4,7)]: ev += [(s,1),(e,-1)]\nev.sort(); c = b = 0\nfor _, d in ev: c += d; b = max(b, c)\nanswer = b" });
C("dsa2-gs-c1", "Two-pass greedy", "Left pass for the left rule, right pass with max for the right rule.");
C("dsa2-gs-c2", "Peak overlap sweep", "Events (s, +1), (e, −1); sort with the tie rule; max running sum.");

L("dsa2-greedy-practice", GI, "Greedy and intervals practice", "Greedy and interval problems to explain with a correctness argument.", {
  kind: "interview", mins: 25, prereq: ["dsa2-greedy", "dsa2-intervals", "dsa2-greedy-scans"],
  hook: "For each: the greedy choice, why it's safe (or why greedy fails), and the complexity.",
}, [
  iq("Meeting Rooms: can one person attend all meetings?", "Sort by start; if any meeting starts before the previous one ends, return False. O(n log n). Touching (end == start) is usually allowed.", ["Sort by start", "Compare neighbours", "Touching rule", "O(n log n)"]),
  iq("Hand of Straights: can the cards be split into groups of k consecutive values?", "Counter of cards; repeatedly take the smallest remaining value x and remove one each of x..x+k−1, failing if any is missing. Sorting the distinct keys makes it O(n log n). Greedy is safe: the smallest card must start a group.", ["Smallest card must start a group", "Counter + sorted keys", "Fail on a missing value", "O(n log n)"]),
  iq("Employee Free Time: given each employee's sorted busy intervals, find common free intervals.", "Merge all intervals (sort by start, or heap-merge the sorted lists); the gaps between consecutive merged blocks are the free times. O(N log N) or O(N log k) with a heap.", ["Flatten and merge", "Gaps between blocks", "Heap merge of k sorted lists", "Exclude unbounded ends"]),
  iq("Car Pooling: trips (passengers, from, to) and a capacity; can all trips be served?", "Events: +p at from, −p at to; sort (drop-offs before pick-ups at the same point) and check the running sum never exceeds capacity. Or a difference array over positions when the range is small: O(n + range).", ["Event sweep", "Tie rule at equal positions", "Difference array alternative", "O(n log n)"]),
  iq("Best Time to Buy and Sell Stock II (unlimited transactions): maximum profit.", "Add every positive day-to-day increase. Any multi-day gain equals the sum of its daily gains, so capturing each rise is optimal. O(n), O(1).", ["Sum positive differences", "Why it's optimal", "O(n)"]),
  iq("When would you reject a greedy solution in favour of DP? Give an example.", "When a small counterexample breaks it or choices interact: coin change with arbitrary coins, 0/1 knapsack, longest increasing subsequence, weighted interval scheduling (sort by end + DP with binary search). Signal: the best choice now depends on future options.", ["Counterexample test", "Coin change / knapsack", "Weighted intervals need DP", "Choices that interact"]),
]);
