import { QuizQuestion, QuizRound } from '../../../../entities/QuizState/model/slice/quizApi';

// Re-export entity types
export { QuizQuestion, QuizRound };

// Define explicit game phases and transitions
export type GamePhase = 'waiting' | 'question' | 'discussion' | 'answer' | 'feedback' | 'completed';

// Game events that trigger state transitions
export type GameEvent =
  | { type: 'SESSION_STARTED' }
  | { type: 'START_DISCUSSION'; roundTime: number }
  | { type: 'TIME_UP' }
  | { type: 'SUBMIT_ANSWER' }
  | { type: 'ANSWER_SUBMITTED' }
  | { type: 'NEXT_ROUND' }
  | { type: 'GAME_COMPLETED' }
  | { type: 'RESET_ROUND' }
  | { type: 'SET_ANSWER'; answer: string }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'SET_PLAYER'; player: string };

// Immutable game state
export interface GameState {
  phase: GamePhase;
  currentRound: number;
  teamAnswer: string;
  discussionNotes: string;
  selectedPlayer: string;
  timer: number;
  isTimerRunning: boolean;
  gameStartTime: Date | null;
  roundStartTime: Date | null;
}

// Presentation alias for QuizRound to match existing game service usage if needed,
// but prefer using QuizRound directly where possible.
export type RoundData = QuizRound;