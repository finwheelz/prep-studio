/** Sources for the v2 DSA track; every URL opened and checked on 2026-11-25. */
const c = "2026-11-25";
const s = (label: string, url: string) => ({ label, url, checked: c });

export const D = {
  bigO: s("Wikipedia: Big O notation", "https://en.wikipedia.org/wiki/Big_O_notation"),
  hash: s("Wikipedia: Hash table", "https://en.wikipedia.org/wiki/Hash_table"),
  coll: s("Python docs: collections (Counter, deque, defaultdict)", "https://docs.python.org/3/library/collections.html"),
  heapq: s("Python docs: heapq", "https://docs.python.org/3/library/heapq.html"),
  bisect: s("Python docs: bisect", "https://docs.python.org/3/library/bisect.html"),
  functools: s("Python docs: functools (cache, lru_cache)", "https://docs.python.org/3/library/functools.html"),
  twoSum: s("LeetCode: Two Sum", "https://leetcode.com/problems/two-sum/"),
  bsearch: s("Wikipedia: Binary search", "https://en.wikipedia.org/wiki/Binary_search"),
  linked: s("Wikipedia: Linked list", "https://en.wikipedia.org/wiki/Linked_list"),
  stack: s("Wikipedia: Stack (abstract data type)", "https://en.wikipedia.org/wiki/Stack_(abstract_data_type)"),
  bst: s("Wikipedia: Binary search tree", "https://en.wikipedia.org/wiki/Binary_search_tree"),
  bfs: s("CP-algorithms: Breadth-first search", "https://cp-algorithms.com/graph/breadth-first-search.html"),
  topo: s("CP-algorithms: Topological sorting", "https://cp-algorithms.com/graph/topological-sort.html"),
  dsu: s("CP-algorithms: Disjoint set union", "https://cp-algorithms.com/data_structures/disjoint_set_union.html"),
  dijkstra: s("CP-algorithms: Dijkstra's algorithm", "https://cp-algorithms.com/graph/dijkstra.html"),
  greedy: s("Wikipedia: Greedy algorithm", "https://en.wikipedia.org/wiki/Greedy_algorithm"),
  backtrack: s("Wikipedia: Backtracking", "https://en.wikipedia.org/wiki/Backtracking"),
  dp: s("Wikipedia: Dynamic programming", "https://en.wikipedia.org/wiki/Dynamic_programming"),
  trie: s("Wikipedia: Trie", "https://en.wikipedia.org/wiki/Trie"),
  bits: s("Wikipedia: Bitwise operation", "https://en.wikipedia.org/wiki/Bitwise_operation"),
};
