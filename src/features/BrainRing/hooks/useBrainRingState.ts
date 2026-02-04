import { useReducer, useCallback } from 'react';
import { BrainRingGameState, BrainRingPhase } from '../model/types';
import { BrainRingRoundStatus } from '../../../entities/QuizState/model/slice/quizApi';

export type BrainRingEvent =
    | { type: 'ROUND_STARTED', roundNumber: number }
    | { type: 'STATE_UPDATED', status: BrainRingRoundStatus, currentBuzzer: number | null, lockedOutPlayers: number[], answerDeadline: string | null }
    | { type: 'BUZZ_SUCCESS', isFirst: boolean, deadline?: string }
    | { type: 'ANSWER_SUBMITTED', isCorrect: boolean, roundComplete: boolean }
    | { type: 'NEXT_ROUND' }
    | { type: 'GAME_COMPLETED' };

function brainRingReducer(state: BrainRingGameState, event: BrainRingEvent): BrainRingGameState {
    switch (event.type) {
        case 'ROUND_STARTED':
            return {
                ...state,
                phase: 'question_display',
                currentRound: event.roundNumber,
                currentBuzzer: null,
                lockedOutPlayers: [],
                answerDeadline: null,
                canBuzz: true,
                isAnswering: false,
            };

        case 'STATE_UPDATED':
            let phase: BrainRingPhase = state.phase;
            if (event.status === 'WAITING_FOR_BUZZ') {
                phase = 'question_display';
            } else if (event.status === 'PLAYER_ANSWERING') {
                phase = 'player_answering';
            } else if (event.status === 'CORRECT_ANSWER') {
                phase = 'answer_feedback';
            } else if (event.status === 'ALL_LOCKED_OUT') {
                phase = 'round_complete';
            }

            return {
                ...state,
                phase,
                currentBuzzer: event.currentBuzzer,
                lockedOutPlayers: event.lockedOutPlayers,
                answerDeadline: event.answerDeadline,
                canBuzz: event.status === 'WAITING_FOR_BUZZ' && !event.lockedOutPlayers.includes(state.myUserId),
                isAnswering: event.status === 'PLAYER_ANSWERING' && event.currentBuzzer === state.myUserId,
            };

        case 'BUZZ_SUCCESS':
            if (event.isFirst) {
                return {
                    ...state,
                    phase: 'player_answering',
                    currentBuzzer: state.myUserId,
                    answerDeadline: event.deadline || null,
                    canBuzz: false,
                    isAnswering: true,
                };
            }
            return state;

        case 'ANSWER_SUBMITTED':
            return {
                ...state,
                phase: event.isCorrect ? 'answer_feedback' : (event.roundComplete ? 'round_complete' : 'question_display'),
                isAnswering: false,
            };

        case 'NEXT_ROUND':
            return {
                ...state,
                phase: 'waiting',
                currentBuzzer: null,
                lockedOutPlayers: [],
                answerDeadline: null,
                canBuzz: false,
                isAnswering: false,
            };

        case 'GAME_COMPLETED':
            return {
                ...state,
                phase: 'game_complete',
            };

        default:
            return state;
    }
}

export function useBrainRingState(myUserId: number) {
    const initialState: BrainRingGameState = {
        phase: 'waiting',
        currentRound: 1,
        currentBuzzer: null,
        lockedOutPlayers: [],
        answerDeadline: null,
        playerScores: {},
        myUserId,
        canBuzz: false,
        isAnswering: false,
    };

    const [state, dispatch] = useReducer(brainRingReducer, initialState);

    const actions = {
        startRound: useCallback((roundNumber: number) => dispatch({ type: 'ROUND_STARTED', roundNumber }), []),
        updateState: useCallback((status: BrainRingRoundStatus, currentBuzzer: number | null, lockedOutPlayers: number[], answerDeadline: string | null) => 
            dispatch({ type: 'STATE_UPDATED', status, currentBuzzer, lockedOutPlayers, answerDeadline }), []),
        buzzSuccess: useCallback((isFirst: boolean, deadline?: string) => dispatch({ type: 'BUZZ_SUCCESS', isFirst, deadline }), []),
        answerSubmitted: useCallback((isCorrect: boolean, roundComplete: boolean) => dispatch({ type: 'ANSWER_SUBMITTED', isCorrect, roundComplete }), []),
        nextRound: useCallback(() => dispatch({ type: 'NEXT_ROUND' }), []),
        completeGame: useCallback(() => dispatch({ type: 'GAME_COMPLETED' }), []),
    };

    return { state, actions, dispatch };
}
