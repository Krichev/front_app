// features/game barrel exports
export { gameSlice, gameActions } from './model/slice';
export type { GameSettings, GamePhase, GameState } from './model/types';
export { useGameSession } from './lib/hooks/useGameSession';