// src/app/providers/StoreProvider/store.ts - UPDATED with Tournament Question API
import {configureStore} from '@reduxjs/toolkit';
import {setupListeners} from '@reduxjs/toolkit/query';

// Import your existing reducers
import authReducer from '../../../entities/AuthState/model/slice/authSlice';
import {userApi} from '../../../entities/UserState/model/slice/userApi';
import {groupApi} from '../../../entities/GroupState/model/slice/groupApi';
import {challengeApi} from '../../../entities/ChallengeState/model/slice/challengeApi';
import {quizApi} from '../../../entities/QuizState/model/slice/quizApi';

// Import the new Tournament Question API
import {tournamentQuestionApi} from '../../../entities/TournamentState/model/slice/tournamentQuestionApi';

export const store = configureStore({
    reducer: {
        // Auth
        auth: authReducer,

        // RTK Query APIs
        [userApi.reducerPath]: userApi.reducer,
        [groupApi.reducerPath]: groupApi.reducer,
        [challengeApi.reducerPath]: challengeApi.reducer,
        [quizApi.reducerPath]: quizApi.reducer,

        // NEW: Tournament Question API
        [tournamentQuestionApi.reducerPath]: tournamentQuestionApi.reducer,

        // Add other reducers as needed
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }).concat(
            userApi.middleware,
            groupApi.middleware,
            challengeApi.middleware,
            quizApi.middleware,
            tournamentQuestionApi.middleware, // NEW: Add middleware
        ),
    devTools: __DEV__, // Enable Redux DevTools in development
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;