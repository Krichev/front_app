// src/app/store/index.ts
import {configureStore} from '@reduxjs/toolkit';
import {setupListeners} from '@reduxjs/toolkit/query';

// Entity reducers
import {gameSessionSlice} from '../../entities/game-session';
import {challengeSlice} from '../../entities/challenge';
import {speechRecognitionSlice} from '../../entities/speech-recognition';
import {fileSlice} from '../../entities/file';
import {questionSlice} from '../../entities/question';
import {verificationSlice} from '../../entities/verification';

// Feature reducers
import {speechToTextSlice} from '../../features/speech-to-text/model/slice';
import {wwwDiscussionSlice} from '../../features/www-game-discussion/model/slice';
import {challengeVerificationSlice} from '../../features/challenge-verification/model/slice';

// API slices (if using RTK Query)
// src/app/store/hooks.ts
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import type {AppDispatch, RootState} from './index';

export const store = configureStore({
    reducer: {
        // Entities
        gameSession: gameSessionSlice.reducer,
        challenge: challengeSlice.reducer,
        speechRecognition: speechRecognitionSlice.reducer,
        file: fileSlice.reducer,
        question: questionSlice.reducer,
        verification: verificationSlice.reducer,

        // Features
        speechToText: speechToTextSlice.reducer,
        wwwDiscussion: wwwDiscussionSlice.reducer,
        challengeVerification: challengeVerificationSlice.reducer,

        // Add other slices here (auth, user, etc.)
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    // Add any actions that include non-serializable data
                ],
            },
        }),
    devTools: __DEV__,
});

// Enable listener behavior for the store
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks
export { useAppDispatch, useAppSelector } from './hooks';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;