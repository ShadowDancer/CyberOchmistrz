export interface FlowEdge {
  to: number;
  cap: number;
  rev: number;
}

export function addEdge(g: FlowEdge[][], u: number, v: number, cap: number): void {
  g[u].push({ to: v, cap, rev: g[v].length });
  g[v].push({ to: u, cap: 0, rev: g[u].length - 1 });
}

export function maxFlow(g: FlowEdge[][], s: number, t: number): number {
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

