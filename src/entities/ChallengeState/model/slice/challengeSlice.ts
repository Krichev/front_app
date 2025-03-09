import {createSlice, PayloadAction} from "@reduxjs/toolkit";

interface Challenge {
    id: string;
    title: string;
    description: string;
    creatorId: string;
    participants: string[];
    rewards: number;
    status: 'active' | 'completed' | 'failed';
}

interface ChallengeState {
    challenges: Challenge[];
    currentChallenge: Challenge | null;
}

const initialChallengeState: ChallengeState = {
    challenges: [],
    currentChallenge: null,
};

export const challengeSlice = createSlice({
    name: 'challenge',
    initialState: initialChallengeState,
    reducers: {
        addChallenge: (state, action: PayloadAction<Challenge>) => {
            state.challenges.push(action.payload);
        },
        updateChallengeStatus: (state, action: PayloadAction<{
            challengeId: string;
            status: Challenge['status'];
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
