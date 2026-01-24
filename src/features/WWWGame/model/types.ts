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

// Quiz question with strong typing
export interface QuizQuestion {
  id: number;
  question: string;
  answer: string;
  questionType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  audioChallengeType?: string;
  questionMediaId?: number;
  questionMediaType?: string;
}

// Round data from API
export interface RoundData {
  id: number;
  question: QuizQuestion;
  teamAnswer: string | null;
  isCorrect: boolean;
  playerWhoAnswered: string | null;
  discussionNotes: string | null;
}
