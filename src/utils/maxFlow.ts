import { CrewMember, CruiseDayRecipe } from "@/types";

/**
 * Checks if all member are fed
 *
 * It achieves it by building a flow network, performing Dinic's max-flow algorithm on it and estabilishing if there is residual flow between source and any crew member node.
 *
 * Justification for using complex algorithm for a simple problem of answering a question "Is everyone fed?" is following: this problem is only seemingly simple.
 *
 * In general case, where we have not only vegetarian/vegan/omni diet, but also gluten-free, allergies or strange versions of other categories (real case: vegetarian, but will not eat eggs), cross-category
 * allocation becomes important, which will be covered in a wrong way by algorithms operating on category-by-category basis.
 * This is explained as I had the idea to use such algorithm initially and it was suggested to me in code review.
 *
 * For example, let's imagine a crew of two: omnivore (OM) and gluten-free vegetarian (GFV). We have to dishes: gluten-free pork and regular pasta.
 * -> gluten-free assignment: GFV gets gluten-free pork (!!!), OM gets pasta (algorithm: OK)
 * -> vegetarian diet: GFV gets pasta, OM gets gluten-free pork (algorithm: OK)
 * While even for non-inquisitive reader the problem is obvious, simpler algorithm would miss it.
 *
 * As it turns out this problem can be generalized to resource allocation with constraints, to which flow networks and a max flow algorithm (Dinic, Edmonds-Karp, etc.) are classical solutions.
 *
 * For this solution Dinic's was chosen (something simpler could also work liked Edmonds-Karp, but I figured it after this was built and tested ... so ╰(*°▽°*)╯)
 */
export class CrewRecipeAllocationChecker {
  // Node layout:
  //   0                          = source
  //   1..crewMembers             = member nodes (M = crewMembers)
  //   crewMembers+1..M+recipies  = recipe nodes (R = recipies)
  //   crewMembers+recipies+1     = sink
  private adjacencyList: FlowEdge[][];

  private readonly source = 0;
  private readonly sink;

  constructor(private people: CrewMember[], private resources: CruiseDayRecipe[], compatibilityPredicate: (arg1: CrewMember, arg2: CruiseDayRecipe) => boolean) {
    const domainNodes = people.length + resources.length;
    const sinkAndSource = 2;

    this.adjacencyList = Array.from({ length: domainNodes + sinkAndSource }, () => []);
    this.sink = this.adjacencyList.length - 1;

    // Source → each member (cap 1)
    for (let i = 0; i < people.length; i++) {
      addEdge(this.adjacencyList, this.source, i + 1, 1);
    }

    this.addCompatibleEdges(compatibilityPredicate);

    // Recipe → sink (cap = crewCount)
    for (let j = 0; j < resources.length; j++) {
      const resource = resources[j];
      addEdge(this.adjacencyList, people.length + 1 + j, this.sink, resource.crewCount);
    }
  }

  addCompatibleEdges(predicate: (arg1: CrewMember, arg2: CruiseDayRecipe) => boolean) {
    for (let i = 0; i < this.people.length; i++) {
      const member = this.people[i];
      for (let j = 0; j < this.resources.length; j++) {
        const recipe = this.resources[j];
        if (predicate(member, recipe)) {
          addEdge(this.adjacencyList, i + 1, this.people.length + 1 + j, 1);
        }
      }
    }
  }

  getUnfedCrewMembers(): CrewMember[] {
    maxFlow(this.adjacencyList, this.source, this.sink)

    // Identify unfed members: source→member_i edge (g[source][i]) still has cap=1 if no flow went through it.
    const unallocated: CrewMember[] = [];
    for (let i = 0; i < this.people.length; i++) {
      if (this.adjacencyList[this.source][i].cap > 0) {
        unallocated.push(this.people[i]);
      }
    }
    return unallocated;
  }
}

/*
Below is graphical illustration of constructed graph:
S   - source
Mi  - crew member node
Ri  - recipe node
T   - sink
[X] - edge capacity

      ┌[1]─ M1 ─┬─[1]─► R1 ─[N]┐
      │                       ─┤
S ───┤                         ├──► T
      │                   R2  ─┤
      └[1]─ M2            R3  ─┘

S→Mi  :  cap = 1  (each member eats once)
Mi→Rj :  cap = 1  (only compatible pairs)
Rj→T  :  cap = N  (recipe serves N people, where N [1, count(crewMembers)])

Algoritms splits two phases of thinking:
1. is this member compatible with this recipe?
2. is everyone fed?

In the illustration above it is shown via following:
1. M2 has no compatible recipes (e.g they are vegetarian and all recipes contain meat)
2. max flow through the graph = crew members count and specifically, if any edge between source and member node after max-flow algorithm has residual flow (capcity > 0), it means somebody is not fed.

For illustration here is graph after max-flow, where in <X> braces residual (remaining flow/capacity) is written. No flow can be pushed through S->M1 edge, thus we know M1 is unfed.

     ┌<0>─ M1 ─┬─<0>─► R1 ─<N-1>┐
     │                         ─┤
S ───┤                          ├──► T
     │                     R2  ─┤
     └<1>─ M2              R3  ─┘

Conceptually - very simple, although implementation is a bit scary. It scales to even very complex scenarios without a change in the algorithm itself.
*/

interface FlowEdge {
  to: number;
  cap: number;
  rev: number;
}

function addEdge(g: FlowEdge[][], u: number, v: number, cap: number): void {
  g[u].push({ to: v, cap, rev: g[v].length });
  g[v].push({ to: u, cap: 0, rev: g[u].length - 1 });
}

function maxFlow(g: FlowEdge[][], s: number, t: number): number {
  let total = 0;
  for (;;) {
    const level = bfsLevels(g, s, t);

    if (!level) return total;

    const iter = new Array<number>(g.length).fill(0);
    for (
      let f = dfsPush(g, s, t, Infinity, level, iter);
      f > 0;
      f = dfsPush(g, s, t, Infinity, level, iter)
    ) {
      total += f;
    }
  }
}

function bfsLevels(g: FlowEdge[][], s: number, t: number): number[] | null {
  const level = new Array<number>(g.length).fill(-1);
  level[s] = 0;
  const queue: number[] = [s];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    for (const e of g[u]) {
      if (e.cap > 0 && level[e.to] === -1) {
        level[e.to] = level[u] + 1;
        queue.push(e.to);
      }
    }
  }
  return level[t] !== -1 ? level : null;
}

function dfsPush(
  g: FlowEdge[][],
  u: number,
  t: number,
  pushed: number,
  level: number[],
  iter: number[]
): number {
  if (u === t) return pushed;
  for (; iter[u] < g[u].length; iter[u]++) {
    const e = g[u][iter[u]];
    if (e.cap > 0 && level[e.to] === level[u] + 1) {
      const d = dfsPush(g, e.to, t, Math.min(pushed, e.cap), level, iter);
      if (d > 0) {
        e.cap -= d;
        g[e.to][e.rev].cap += d;
        return d;
      }
    }
  }
  return 0;
}
