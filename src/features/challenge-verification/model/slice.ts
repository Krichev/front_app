// src/features/challenge-verification/model/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {VerificationFlow, VerificationStep} from './types';

interface ChallengeVerificationState {
    currentFlow: VerificationFlow | null;
    steps: VerificationStep[];
    isModalVisible: boolean;
    isProcessing: boolean;
    error: string | null;
}

const initialState: ChallengeVerificationState = {
    currentFlow: null,
    steps: [],
    isModalVisible: false,
    isProcessing: false,
    error: null,
};

export const challengeVerificationSlice = createSlice({
    name: 'challengeVerification',
    initialState,
    reducers: {
        startVerificationFlow: (state, action: PayloadAction<{
            challengeId: string;
            requiredMethods: string[];
        }>) => {
            const { challengeId, requiredMethods } = action.payload;

            state.currentFlow = {
                challengeId,
                requiredMethods,
                currentStep: 0,
                totalSteps: requiredMethods.length,
                isComplete: false,
                data: {},
            };

            state.steps = requiredMethods.map((method, index) => ({
                id: `step_${index}`,
                method,
                title: getMethodTitle(method),
                description: getMethodDescription(method),
                isRequired: true,
                isCompleted: false,
            }));

            state.isModalVisible = true;
            state.error = null;
        },

        showVerificationModal: (state) => {
            state.isModalVisible = true;
        },

        hideVerificationModal: (state) => {
            state.isModalVisible = false;
        },

        setProcessing: (state, action: PayloadAction<boolean>) => {
            state.isProcessing = action.payload;
        },

        completeStep: (state, action: PayloadAction<{
            stepId: string;
            data: any;
        }>) => {
            const { stepId, data } = action.payload;
            const step = state.steps.find(s => s.id === stepId);

            if (step) {
                step.isCompleted = true;
                step.data = data;

                if (state.currentFlow) {
                    state.currentFlow.data[step.method] = data;
                    state.currentFlow.currentStep += 1;

                    // Check if all required steps are completed
                    const allCompleted = state.steps.every(s => !s.isRequired || s.isCompleted);
                    if (allCompleted) {
                        state.currentFlow.isComplete = true;
                    }
                }
            }
        },

        setStepError: (state, action: PayloadAction<{
            stepId: string;
            error: string;
        }>) => {
            const { stepId, error } = action.payload;
            const step = state.steps.find(s => s.id === stepId);

            if (step) {
                step.error = error;
                step.isCompleted = false;
            }
        },

        retryStep: (state, action: PayloadAction<string>) => {
            const stepId = action.payload;
            const step = state.steps.find(s => s.id === stepId);

            if (step) {
                step.error = undefined;
                step.isCompleted = false;
                step.data = undefined;
            }
        },

        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isProcessing = false;
        },

        clearError: (state) => {
            state.error = null;
        },

        reset: () => initialState,
    },
});

// Helper functions
const getMethodTitle = (method: string): string => {
    const titles: Record<string, string> = {
        photo: 'Take Photo',
        location: 'Share Location',
        audio: 'Record Audio',
        video: 'Record Video',
        manual: 'Manual Verification',
        qr_code: 'Scan QR Code',
        biometric: 'Biometric Verification',
    };
    return titles[method] || method;
};

const getMethodDescription = (method: string): string => {
    const descriptions: Record<string, string> = {
        photo: 'Take a photo to verify your participation',
        location: 'Share your current location to verify your presence',
        audio: 'Record an audio note for verification',
        video: 'Record a short video for verification',
        manual: 'Provide manual verification details',
        qr_code: 'Scan the QR code at the location',
        biometric: 'Use biometric authentication',
    };
    return descriptions[method] || `Complete ${method} verification`;
};

export const challengeVerificationActions = challengeVerificationSlice.actions;
