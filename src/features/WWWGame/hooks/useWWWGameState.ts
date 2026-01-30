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
        phase: 'waiting', // Wait for orchestration to decide reading vs media
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
        isTimerRunning: false, // We'll use a different timer or handle it in UI
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

    case 'TIME_UP':
      return { ...state, phase: 'answer', isTimerRunning: false };

    case 'SUBMIT_ANSWER':
      return { ...state, phase: 'answer', isTimerRunning: false };

    case 'ANSWER_SUBMITTED':
      return { ...state, phase: 'feedback' };

    case 'NEXT_ROUND':
      return {
        ...state,
        phase: 'waiting', // Wait for orchestration to decide next phase
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
    startSession: useCallback((roundTime?: number) => dispatch({ type: 'SESSION_STARTED', roundTime }), []),
    startReading: useCallback((readingTime: number) => dispatch({ type: 'START_READING', readingTime }), []),
    readingComplete: useCallback(() => dispatch({ type: 'READING_COMPLETE' }), []),
    skipReading: useCallback(() => dispatch({ type: 'SKIP_READING' }), []),
    startMediaPlayback: useCallback((mediaDuration?: number) => dispatch({ type: 'START_MEDIA_PLAYBACK', mediaDuration }), []),
    mediaPlaybackComplete: useCallback(() => dispatch({ type: 'MEDIA_PLAYBACK_COMPLETE' }), []),
    skipMedia: useCallback(() => dispatch({ type: 'SKIP_MEDIA' }), []),
    startDiscussion: useCallback((roundTime: number) => 
      dispatch({ type: 'START_DISCUSSION', roundTime }), []),
    timeUp: useCallback(() => dispatch({ type: 'TIME_UP' }), []),
    submitAnswer: useCallback(() => dispatch({ type: 'SUBMIT_ANSWER' }), []),
    answerSubmitted: useCallback(() => dispatch({ type: 'ANSWER_SUBMITTED' }), []),
    nextRound: useCallback((roundTime?: number) => dispatch({ type: 'NEXT_ROUND', roundTime }), []),
    completeGame: useCallback(() => dispatch({ type: 'GAME_COMPLETED' }), []),
    setAnswer: useCallback((answer: string) => dispatch({ type: 'SET_ANSWER', answer }), []),
    setNotes: useCallback((notes: string) => dispatch({ type: 'SET_NOTES', notes }), []),
    setPlayer: useCallback((player: string) => dispatch({ type: 'SET_PLAYER', player }), []),
    setRound: useCallback((roundIndex: number) => dispatch({ type: 'SET_ROUND', roundIndex }), []),
    pauseGame: useCallback(() => dispatch({ type: 'PAUSE_GAME' }), []),
    resumeGame: useCallback(() => dispatch({ type: 'RESUME_GAME' }), []),
  };

  return { state, actions, dispatch };
}
