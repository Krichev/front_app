// src/features/CompetitiveMatch/hooks/useCompetitiveMatchState.ts
import { useReducer, useCallback } from 'react';
import { CompetitiveMatchDetail, CompetitiveMatchRound } from '../../../entities/CompetitiveMatch/model/types';

export type MatchPhase = 
  | 'waiting' | 'ready' | 'countdown' 
  | 'performing' | 'waiting_opponent' | 'scoring'
  | 'round_result' | 'match_result';

export interface CompetitiveMatchState {
  phase: MatchPhase;
  match?: CompetitiveMatchDetail;
  currentRound?: CompetitiveMatchRound;
  myScore?: number;
  opponentScore?: number;
  isMyTurn: boolean;
  timeLeft: number;
}

type Action = 
  | { type: 'SET_MATCH'; match: CompetitiveMatchDetail }
  | { type: 'START_ROUND'; round: CompetitiveMatchRound }
  | { type: 'START_PERFORMANCE' }
  | { type: 'SUBMIT_PERFORMANCE' }
  | { type: 'OPPONENT_SUBMITTED' }
  | { type: 'ROUND_COMPLETE'; round: CompetitiveMatchRound }
  | { type: 'MATCH_COMPLETE'; match: CompetitiveMatchDetail }
  | { type: 'TICK' };

const initialState: CompetitiveMatchState = {
  phase: 'waiting',
  isMyTurn: false,
  timeLeft: 0,
};

function reducer(state: CompetitiveMatchState, action: Action): CompetitiveMatchState {
  switch (action.type) {
    case 'SET_MATCH':
      // Determine phase from match status
      let phase: MatchPhase = 'waiting';
      if (action.match.status === 'READY') phase = 'ready';
      if (action.match.status === 'IN_PROGRESS') phase = 'ready'; // Or performing?
      
      return {
        ...state,
        match: action.match,
        phase,
      };
    case 'START_ROUND':
        return {
            ...state,
            currentRound: action.round,
            phase: 'performing', // Or countdown
            isMyTurn: true, // Assuming simultaneous
        };
    case 'START_PERFORMANCE':
        return { ...state, phase: 'performing' };
    case 'SUBMIT_PERFORMANCE':
        return { ...state, phase: 'waiting_opponent' };
    case 'OPPONENT_SUBMITTED':
        // If I am waiting, maybe move to scoring?
        return { ...state }; 
    case 'ROUND_COMPLETE':
        return { ...state, phase: 'round_result', currentRound: action.round };
    case 'MATCH_COMPLETE':
        return { ...state, phase: 'match_result', match: action.match };
    default:
      return state;
  }
}

export const useCompetitiveMatchState = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = {
    setMatch: useCallback((match: CompetitiveMatchDetail) => dispatch({ type: 'SET_MATCH', match }), []),
    startRound: useCallback((round: CompetitiveMatchRound) => dispatch({ type: 'START_ROUND', round }), []),
    submitPerformance: useCallback(() => dispatch({ type: 'SUBMIT_PERFORMANCE' }), []),
    roundComplete: useCallback((round: CompetitiveMatchRound) => dispatch({ type: 'ROUND_COMPLETE', round }), []),
    matchComplete: useCallback((match: CompetitiveMatchDetail) => dispatch({ type: 'MATCH_COMPLETE', match }), []),
  };

  return { state, actions };
};
