import {QuizQuestion, QuizRound} from '../../../entities/QuizState/model/slice/quizApi';

// Re-export entity types
export type { QuizQuestion, QuizRound };

// Define explicit game phases and transitions
export type GamePhase = 'waiting' | 'reading' | 'media_playback' | 'discussion' | 'answer' | 'feedback' | 'completed';

// Game events that trigger state transitions
export type GameEvent =
  | { type: 'SESSION_STARTED'; roundTime?: number }
  | { type: 'START_READING'; readingTime: number }
  | { type: 'READING_COMPLETE' }
  | { type: 'START_MEDIA_PLAYBACK'; mediaDuration?: number }
  | { type: 'MEDIA_PLAYBACK_COMPLETE' }
  | { type: 'SKIP_READING' }
  | { type: 'SKIP_MEDIA' }
  | { type: 'START_DISCUSSION'; roundTime: number }
  | { type: 'TIME_UP' }
  | { type: 'SUBMIT_ANSWER' }
  | { type: 'ANSWER_SUBMITTED' }
  | { type: 'NEXT_ROUND'; roundTime?: number }
  | { type: 'GAME_COMPLETED' }
  | { type: 'RESET_ROUND' }
  | { type: 'SET_ANSWER'; answer: string }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'SET_PLAYER'; player: string }
  | { type: 'SET_ROUND'; roundIndex: number };

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
  readingTimeSeconds: number;
  mediaPlaybackComplete: boolean;
}

// Presentation alias for QuizRound to match existing game service usage if needed,
// but prefer using QuizRound directly where possible.
export type RoundData = QuizRound;