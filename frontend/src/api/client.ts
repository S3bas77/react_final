import { GameState, ActionRequest, ActionResponse, CreateGameResponse, TestScenario } from '../types';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

export async function postGame(scenario?: TestScenario): Promise<CreateGameResponse> {
  const res = await fetch(`${BASE}/game`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(scenario ? { scenario } : {})
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<CreateGameResponse>;
}

export async function getGame(gameId: string): Promise<GameState> {
  const res = await fetch(`${BASE}/game/${gameId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<GameState>;
}

export async function postAction(gameId: string, req: ActionRequest): Promise<ActionResponse> {
  const res = await fetch(`${BASE}/game/${gameId}/action`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(req)
  });
  return res.json() as Promise<ActionResponse>;
}
