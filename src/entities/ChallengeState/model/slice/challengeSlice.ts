// src/entities/ChallengeState/model/slice/challengeSlice.ts

import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export interface StateChallenge {
    id: string;
    title: string;
    description: string;
    creatorId: string;
    participants: string[];
    rewards: number;
    status: 'active' | 'completed' | 'failed';
    type?: 'QUEST' | 'QUIZ' | 'ACTIVITY_PARTNER' | 'FITNESS_TRACKING' | 'HABIT_BUILDING';
    visibility?: string;
    created_at?: string;
    updated_at?: string;
    creator_id?: string;
    verificationMethod?: string;
    quizConfig?: string; // Added to store JSON string of quiz configuration
}

interface ChallengeState {
    challenges: StateChallenge[];
    currentChallenge: StateChallenge | null;
}

const initialChallengeState: ChallengeState = {
    challenges: [],
    currentChallenge: null,
};

export const challengeSlice = createSlice({
    name: 'challenge',
    initialState: initialChallengeState,
    reducers: {
        addChallenge: (state, action: PayloadAction<StateChallenge>) => {
            state.challenges.push(action.payload);
        },
        updateChallengeStatus: (state, action: PayloadAction<{
            challengeId: string;
            status: StateChallenge['status'];
        }>) => {
            const challenge = state.challenges.find(
                ch => ch.id === action.payload.challengeId
            );
            if (challenge) {
                challenge.status = action.payload.status;
            }
        },
    },
});