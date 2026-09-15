import type { CellType, Direction } from '../../frontend/src/types';

interface Point { x: number; y: number; }

const MOVES: Array<{ dir: Direction; dx: number; dy: number }> = [
  { dir: 'up',    dx: 0,  dy: -1 },
  { dir: 'down',  dx: 0,  dy: 1  },
  { dir: 'left',  dx: -1, dy: 0  },
  { dir: 'right', dx: 1,  dy: 0  },
];

export function findPath(
  grid: CellType[][],
  from: { x: number; y: number },
  to:   { x: number; y: number }
): Direction[] | null {
  const key = (x: number, y: number) => `${x},${y}`;
  const inBounds = (x: number, y: number) =>
    y >= 0 && y < grid.length && x >= 0 && x < grid[0].length;

  if (from.x === to.x && from.y === to.y) return [];

  const visited = new Set<string>([key(from.x, from.y)]);
  const parent = new Map<string, { prev: string; dir: Direction }>();
  const queue: Point[] = [{ x: from.x, y: from.y }];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const move of MOVES) {
      const nx = current.x + move.dx;
      const ny = current.y + move.dy;
      if (!inBounds(nx, ny)) continue;
      if (grid[ny][nx] !== 'empty') continue;

      const k = key(nx, ny);
      if (visited.has(k)) continue;

      visited.add(k);
      parent.set(k, { prev: key(current.x, current.y), dir: move.dir });

      if (nx === to.x && ny === to.y) {
        const path: Direction[] = [];
        let cursor = k;
        while (cursor !== key(from.x, from.y)) {
          const entry = parent.get(cursor)!;
          path.unshift(entry.dir);
          cursor = entry.prev;
        }
        return path;
      }

      queue.push({ x: nx, y: ny });
    }
  }

  return null;
}
