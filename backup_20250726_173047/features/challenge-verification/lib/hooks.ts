// src/features/challenge-verification/lib/hooks.ts
import {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {challengeVerificationActions} from '../model/slice';
import type {VerificationMethod} from '../../../entities/verification';
import {capturePhoto, getCurrentLocation, verificationActions, verifyChallenge} from '../../../entities/verification';
import type {RootState} from '../../../app/store';

export const useChallengeVerification = () => {
    const dispatch = useDispatch();

    // Selectors
    const currentFlow = useSelector((state: RootState) => state.challengeVerification.currentFlow);
    const steps = useSelector((state: RootState) => state.challengeVerification.steps);
    const isModalVisible = useSelector((state: RootState) => state.challengeVerification.isModalVisible);
    const isProcessing = useSelector((state: RootState) => state.challengeVerification.isProcessing);
    const error = useSelector((state: RootState) => state.challengeVerification.error);

    // Verification entity state
    const verificationState = useSelector((state: RootState) => state.verification);

    // Start verification flow
    const startVerification = useCallback((challengeId: string, requiredMethods: string[]) => {
        dispatch(challengeVerificationActions.startVerificationFlow({
            challengeId,
            requiredMethods,
        }));
    }, [dispatch]);

    // Execute verification step
    const executeStep = useCallback(async (stepId: string, method: VerificationMethod) => {
        if (!currentFlow) return;

        try {
            dispatch(challengeVerificationActions.setProcessing(true));
            dispatch(verificationActions.startVerification({ method, config: { methods: [method], requiresLocation: false, requiresPhoto: false, allowManualVerification: true } }));

            let result;

            switch (method) {
                case 'photo':
                    result = await capturePhoto();
                    if (result) {
                        dispatch(challengeVerificationActions.completeStep({
                            stepId,
                            data: { photo: result }
                        }));
                    } else {
                        throw new Error('Photo capture cancelled');
                    }
                    break;

                case 'location':
                    result = await getCurrentLocation();
                    dispatch(challengeVerificationActions.completeStep({
                        stepId,
                        data: { location: result }
                    }));
                    break;

                case 'manual':
                    // For manual verification, we'll just mark it as completed
                    // In a real app, this might open a form
                    dispatch(challengeVerificationActions.completeStep({
                        stepId,
                        data: { manual: true, timestamp: Date.now() }
                    }));
                    break;

                default:
                    throw new Error(`Verification method ${method} not implemented`);
            }

            dispatch(verificationActions.completeVerification());
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Verification failed';
            dispatch(challengeVerificationActions.setStepError({
                stepId,
                error: errorMessage
            }));
            dispatch(verificationActions.setError(errorMessage));
        } finally {
            dispatch(challengeVerificationActions.setProcessing(false));
        }
    }, [currentFlow, dispatch]);

    // Complete verification flow
    const completeVerification = useCallback(async () => {
        if (!currentFlow || !currentFlow.isComplete) return;

        try {
            dispatch(challengeVerificationActions.setProcessing(true));

            // Submit verification to backend
            const verificationResult = await verifyChallenge(
                currentFlow.challengeId,
                'manual', // This would be determined by the completed methods
                currentFlow.data
            );

            if (verificationResult.success) {
                dispatch(challengeVerificationActions.hideVerificationModal());
                dispatch(challengeVerificationActions.reset());
                return true;
            } else {
                throw new Error(verificationResult.error || 'Verification submission failed');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to complete verification';
            dispatch(challengeVerificationActions.setError(errorMessage));
            return false;
        } finally {
            dispatch(challengeVerificationActions.setProcessing(false));
        }
    }, [currentFlow, dispatch]);

    // UI actions
    const showModal = useCallback(() => {
        dispatch(challengeVerificationActions.showVerificationModal());
    }, [dispatch]);

    const hideModal = useCallback(() => {
        dispatch(challengeVerificationActions.hideVerificationModal());
    }, [dispatch]);

    const retryStep = useCallback((stepId: string) => {
        dispatch(challengeVerificationActions.retryStep(stepId));
    }, [dispatch]);

    const clearError = useCallback(() => {
        dispatch(challengeVerificationActions.clearError());
    }, [dispatch]);

    return {
        // State
        currentFlow,
        steps,
        isModalVisible,
        isProcessing,
        error,
        verificationState,

        // Computed
        currentStep: steps.find(step => !step.isCompleted),
        completedSteps: steps.filter(step => step.isCompleted),
        remainingSteps: steps.filter(step => !step.isCompleted),
        canComplete: currentFlow?.isComplete || false,
        progress: steps.length > 0 ? (steps.filter(s => s.isCompleted).length / steps.length) * 100 : 0,

        // Actions
        startVerification,
        executeStep,
        completeVerification,
        showModal,
        hideModal,
        retryStep,
        clearError,
    };
};