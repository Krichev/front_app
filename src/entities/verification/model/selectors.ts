// src/entities/verification/model/selectors.ts
import type {RootState} from '../../../app/store';

export const verificationSelectors = {
    selectIsVerifying: (state: RootState) => state.verification.isVerifying,
    selectCurrentMethod: (state: RootState) => state.verification.currentMethod,
    selectResults: (state: RootState) => state.verification.results,
    selectPermissions: (state: RootState) => state.verification.permissions,
    selectError: (state: RootState) => state.verification.error,
    selectConfig: (state: RootState) => state.verification.config,
    selectProgress: (state: RootState) => state.verification.progress,

    selectHasError: (state: RootState) => state.verification.error !== null,
    selectCanUseCamera: (state: RootState) => state.verification.permissions.camera === 'granted',
    selectCanUseLocation: (state: RootState) => state.verification.permissions.location === 'granted',
    selectCanUseMicrophone: (state: RootState) => state.verification.permissions.microphone === 'granted',

    selectResultsByMethod: (method: string) => (state: RootState) =>
        state.verification.results.filter(result => result.method === method),

    selectLastResult: (state: RootState) => {
        const results = state.verification.results;
        return results.length > 0 ? results[results.length - 1] : null;
    },

    selectSuccessfulResults: (state: RootState) =>
        state.verification.results.filter(result => result.success),

    selectFailedResults: (state: RootState) =>
        state.verification.results.filter(result => !result.success),
};