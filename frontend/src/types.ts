export type CellType     = 'empty' | 'wall' | 'destructible';
export type GameStatus   = 'playing' | 'finished';
export type GameResult   = 'player1_wins' | 'player2_wins' | 'draw' | null;
export type PlayerId     = 'player1' | 'player2';
export type ActionType   = 'move' | 'place_bomb' | 'capture_core' | 'special_action';
export type Direction    = 'up' | 'down' | 'left' | 'right';
export type ResourceType = 'energy_pack' | 'repair_kit';

export interface PlayerState {
  id:            PlayerId;
  x:             number;
  y:             number;
  hp:            number;
  energy:        number;
  resources:     number;
  score:         number;
  bombAvailable: boolean;
  shieldActive:  boolean;
  alive:         boolean;
}

export interface BombState {
  id:             string;
  playerId:       PlayerId;
  x:              number;
  y:              number;
  timerRemaining: number;
}

export interface CoreState {
  id: string;
  x:  number;
  y:  number;
}

export interface ResourceState {
  id:   string;
  x:    number;
  y:    number;
  type: ResourceType;
}

export interface GameState {
  gameId:              string;
  status:              GameStatus;
  timeRemaining:       number;
  result:              GameResult;
  players: {
    player1: PlayerState;
    player2: PlayerState;
  };
  bombs:               BombState[];
  cores:               CoreState[];
  resources:           ResourceState[];
  grid:                CellType[][];
  arenaEventActive:    boolean;
  arenaEventCountdown: number | null;
}

export interface ActionRequest {
  playerId: PlayerId;
  type:     ActionType;
  payload?: { direction?: Direction };
}

export interface TestScenario {
  destructibles: Array<{ x: number; y: number }>;
  cores:         Array<{ x: number; y: number }>;
  resources:     Array<{ x: number; y: number; type: ResourceType }>;
}

export type ActionResponse =
  | { success: true;  state: GameState }
  | { success: false; error: string; message: string };

export interface CreateGameResponse {
  gameId: string;
  state:  GameState;
}
