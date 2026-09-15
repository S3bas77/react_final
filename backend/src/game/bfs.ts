import { CellType } from './state';
import { GRID_COLS, GRID_ROWS } from './constants';

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
}

export function bfsReachable(
  grid: CellType[][],
  from: { x: number; y: number },
  to:   { x: number; y: number }
): boolean {
  if (from.x === to.x && from.y === to.y) return true;
  const visited = new Set<string>([`${from.x},${from.y}`]);
  const queue: Array<{ x: number; y: number }> = [{ x: from.x, y: from.y }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const [dx, dy] of DIRS) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (!inBounds(nx, ny)) continue;
      if (grid[ny][nx] !== 'empty') continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (nx === to.x && ny === to.y) return true;
      visited.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return false;
}

export function getReachableCells(
  grid: CellType[][],
  from: { x: number; y: number }
): Set<string> {
  const visited = new Set<string>();
  if (!inBounds(from.x, from.y)) return visited;
  if (grid[from.y][from.x] !== 'empty') return visited;

  visited.add(`${from.x},${from.y}`);
  const queue: Array<{ x: number; y: number }> = [{ x: from.x, y: from.y }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const [dx, dy] of DIRS) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (!inBounds(nx, ny)) continue;
      if (grid[ny][nx] !== 'empty') continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return visited;
}
