import { useReducer, useCallback } from 'react';
import { GameState, GameEvent } from '../model/types';

const initialState: GameState = {
  phase: 'waiting',
  currentRound: 0,
  teamAnswer: '',
  discussionNotes: '',
  selectedPlayer: '',
  timer: 0,
  isTimerRunning: false,
  gameStartTime: null,
  roundStartTime: null,
  readingTimeSeconds: 0,
  mediaPlaybackComplete: false,
};

function gameReducer(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'SESSION_STARTED':
      return { 
        ...state, 
        phase: 'waiting', 
        gameStartTime: new Date(),
        timer: event.roundTime || 0,
        isTimerRunning: false,
        roundStartTime: new Date()
      };

    case 'START_READING':
      return {
        ...state,
        phase: 'reading',
        readingTimeSeconds: event.readingTime,
        isTimerRunning: false,
      };

    case 'READING_COMPLETE':
    case 'SKIP_READING':
      return {
        ...state,
        phase: 'discussion',
        isTimerRunning: true,
      };

    case 'START_MEDIA_PLAYBACK':
      return {
        ...state,
        phase: 'media_playback',
        mediaPlaybackComplete: false,
        isTimerRunning: false,
      };

    case 'MEDIA_PLAYBACK_COMPLETE':
      return {
        ...state,
        mediaPlaybackComplete: true,
      };

    case 'SKIP_MEDIA':
      return {
        ...state,
        phase: 'discussion',
        isTimerRunning: true,
        mediaPlaybackComplete: true,
      };

    case 'START_DISCUSSION':
      return {
        ...state,
        phase: 'discussion',
        timer: event.roundTime,
        isTimerRunning: true,
        roundStartTime: new Date(),
      };

    case 'START_AUDIO_CHALLENGE':
      return {
        ...state,
        phase: 'answer',
        timer: event.roundTime || 0,
        isTimerRunning: false,
        roundStartTime: new Date(),
      };

    case 'TIME_UP':
      return { ...state, phase: 'answer', isTimerRunning: false };

    case 'SUBMIT_ANSWER':
      return { ...state, phase: 'answer', isTimerRunning: false };

    case 'ANSWER_SUBMITTED':
      return { ...state, phase: 'feedback' };

    case 'NEXT_ROUND':
      return {
        ...state,
        phase: 'waiting',
        currentRound: state.currentRound + 1,
        teamAnswer: '',
        discussionNotes: '',
        selectedPlayer: '',
        timer: event.roundTime || 0,
        isTimerRunning: false,
        roundStartTime: new Date(),
        mediaPlaybackComplete: false,
      };

    case 'GAME_COMPLETED':
      return { ...state, phase: 'completed' };

    case 'SET_ANSWER':
      return { ...state, teamAnswer: event.answer };

    case 'SET_NOTES':
      return { ...state, discussionNotes: event.notes };

    case 'SET_PLAYER':
      return { ...state, selectedPlayer: event.player };

    case 'SET_ROUND':
      return { ...state, currentRound: event.roundIndex };

    case 'RESET_ROUND':
      return {
        ...state,
        teamAnswer: '',
        discussionNotes: '',
        selectedPlayer: '',
      };

    case 'PAUSE_GAME':
      return {
        ...state,
        previousPhase: state.phase,
        phase: 'paused',
        isTimerRunning: false,
      };

    case 'RESUME_GAME':
      const nextPhase = state.previousPhase || 'discussion';
      return {
        ...state,
        phase: nextPhase,
        previousPhase: undefined,
        isTimerRunning: nextPhase === 'discussion',
      };

    default:
      return state;
  }
}

export function useWWWGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const actions = {
    startSession: (roundTime?: number): GameEvent => ({ type: 'SESSION_STARTED', roundTime }),
    startReading: (readingTime: number): GameEvent => ({ type: 'START_READING', readingTime }),
    readingComplete: (): GameEvent => ({ type: 'READING_COMPLETE' }),
    skipReading: (): GameEvent => ({ type: 'SKIP_READING' }),
    startMediaPlayback: (mediaDuration?: number): GameEvent => ({ type: 'START_MEDIA_PLAYBACK', mediaDuration }),
    mediaPlaybackComplete: (): GameEvent => ({ type: 'MEDIA_PLAYBACK_COMPLETE' }),
    skipMedia: (): GameEvent => ({ type: 'SKIP_MEDIA' }),
    startDiscussion: (roundTime: number): GameEvent => ({ type: 'START_DISCUSSION', roundTime }),
    startAudioChallenge: (roundTime?: number): GameEvent => ({ type: 'START_AUDIO_CHALLENGE', roundTime }),
    timeUp: (): GameEvent => ({ type: 'TIME_UP' }),
    submitAnswer: (): GameEvent => ({ type: 'SUBMIT_ANSWER' }),
    answerSubmitted: (): GameEvent => ({ type: 'ANSWER_SUBMITTED' }),
    nextRound: (roundTime?: number): GameEvent => ({ type: 'NEXT_ROUND', roundTime }),
    completeGame: (): GameEvent => ({ type: 'GAME_COMPLETED' }),
    setAnswer: (answer: string): GameEvent => ({ type: 'SET_ANSWER', answer }),
    setNotes: (notes: string): GameEvent => ({ type: 'SET_NOTES', notes }),
    setPlayer: (player: string): GameEvent => ({ type: 'SET_PLAYER', player }),
    setRound: (roundIndex: number): GameEvent => ({ type: 'SET_ROUND', roundIndex }),
    pauseGame: (): GameEvent => ({ type: 'PAUSE_GAME' }),
    resumeGame: (): GameEvent => ({ type: 'RESUME_GAME' }),
  };

  return { state, actions, dispatch };
}
