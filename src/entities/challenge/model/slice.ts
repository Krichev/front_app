// src/entities/challenge/model/Slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {Challenge, ChallengeParticipant, ChallengeState} from './types';

const initialState: ChallengeState = {
    challenges: [],
    currentChallenge: null,
    myParticipations: [],
    isLoading: false,
    error: null,
};

export const challengeSlice = createSlice({
    name: 'challenge',
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
            if (action.payload) {
                state.error = null;
            }
        },

        setChallenges: (state, action: PayloadAction<Challenge[]>) => {
            state.challenges = action.payload;
            state.isLoading = false;
            state.error = null;
        },

        addChallenge: (state, action: PayloadAction<Challenge>) => {
            state.challenges.push(action.payload);
        },

        updateChallenge: (state, action: PayloadAction<Challenge>) => {
            const index = state.challenges.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.challenges[index] = action.payload;
            }
            if (state.currentChallenge?.id === action.payload.id) {
                state.currentChallenge = action.payload;
            }
        },

        removeChallenge: (state, action: PayloadAction<string>) => {
            state.challenges = state.challenges.filter(c => c.id !== action.payload);
            if (state.currentChallenge?.id === action.payload) {
                state.currentChallenge = null;
            }
        },

        setCurrentChallenge: (state, action: PayloadAction<Challenge | null>) => {
            state.currentChallenge = action.payload;
        },

        updateChallengeStatus: (state, action: PayloadAction<{
            challengeId: string;
            status: Challenge['status'];
        }>) => {
            const { challengeId, status } = action.payload;
            const challenge = state.challenges.find(c => c.id === challengeId);
            if (challenge) {
                challenge.status = status;
                challenge.updatedAt = new Date().toISOString();
            }
            if (state.currentChallenge?.id === challengeId) {
                state.currentChallenge = { ...state.currentChallenge, status };
            }
        },

        joinChallenge: (state, action: PayloadAction<{
            challengeId: string;
            userId: string;
        }>) => {
            const { challengeId, userId } = action.payload;
            const challenge = state.challenges.find(c => c.id === challengeId);
            if (challenge && !challenge.participants.includes(userId)) {
                challenge.participants.push(userId);
                challenge.updatedAt = new Date().toISOString();
            }
        },

        leaveChallenge: (state, action: PayloadAction<{
            challengeId: string;
            userId: string;
        }>) => {
            const { challengeId, userId } = action.payload;
            const challenge = state.challenges.find(c => c.id === challengeId);
            if (challenge) {
                challenge.participants = challenge.participants.filter(id => id !== userId);
                challenge.updatedAt = new Date().toISOString();
            }
        },

        setMyParticipations: (state, action: PayloadAction<ChallengeParticipant[]>) => {
            state.myParticipations = action.payload;
        },

        updateParticipation: (state, action: PayloadAction<ChallengeParticipant>) => {
            const index = state.myParticipations.findIndex(
                p => p.challengeId === action.payload.challengeId && p.userId === action.payload.userId
            );
            if (index !== -1) {
                state.myParticipations[index] = action.payload;
            } else {
                state.myParticipations.push(action.payload);
            }
        },

        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
        },

        clearError: (state) => {
            state.error = null;
        },

        reset: () => initialState,
    },
});

export const challengeActions = challengeSlice.actions;