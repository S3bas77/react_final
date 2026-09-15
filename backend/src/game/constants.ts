export const GRID_COLS  = 15;
export const GRID_ROWS  = 11;

export const P1_SPAWN = { x: 1,  y: 1  } as const;
export const P2_SPAWN = { x: 13, y: 9  } as const;

export const INITIAL_HP     = 3;
export const MAX_HP         = 3;
export const INITIAL_ENERGY = 5;
export const MAX_ENERGY     = 10;

export const GAME_DURATION_S = 120;
export const VICTORY_SCORE   = 25;

export const BOMB_TIMER_S = 3;
export const BOMB_RADIUS  = 2;

export const SHIELD_DURATION_MS = 4_000;

export const SCORE_CAPTURE_CORE    = 5;
export const SCORE_KILL            = 10;
export const SCORE_PICKUP_RESOURCE = 1;
export const SCORE_SPECIAL_HIT     = 2;

export const ENERGY_CAPTURE_CORE     = 2;
export const ENERGY_SPECIAL_COST     = 3;
export const ENERGY_SPECIAL_HIT_DRAIN = 2;

export const ENERGY_PACK_REGEN = 2;
export const REPAIR_KIT_REGEN  = 1;

export const CORE_RESPAWN_MS        = 8_000;
export const INITIAL_CORE_COUNT     = 3;
export const MAX_CORE_COUNT         = 3;
export const INITIAL_RESOURCE_COUNT = 4;

export const DESTRUCTIBLE_MIN = 15;
export const DESTRUCTIBLE_MAX = 25;

export const REACTOR_PULSE_MIN_S     = 45;
export const REACTOR_PULSE_MAX_S     = 75;
export const REACTOR_PULSE_WARNING_S = 5;

export const RESOURCE_SPAWN_CHANCE    = 0.5;
export const CHAIN_REACTION_MAX_DEPTH = 5;
export const POLLING_INTERVAL_MS      = 500;
