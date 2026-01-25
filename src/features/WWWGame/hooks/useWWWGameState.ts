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
};

function gameReducer(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'SESSION_STARTED':
      return { 
        ...state, 
        phase: 'discussion', 
        gameStartTime: new Date(),
        timer: event.roundTime || 0,
        isTimerRunning: true,
        roundStartTime: new Date()
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
        phase: 'discussion',
        currentRound: state.currentRound + 1,
        teamAnswer: '',
        discussionNotes: '',
        selectedPlayer: '',
        timer: event.roundTime || 0,
        isTimerRunning: true,
        roundStartTime: new Date(),
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

    default:
      return state;
  }
}

export function useWWWGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const actions = {
    startSession: useCallback((roundTime?: number) => dispatch({ type: 'SESSION_STARTED', roundTime }), []),
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
  };

  return { state, actions, dispatch };
}
