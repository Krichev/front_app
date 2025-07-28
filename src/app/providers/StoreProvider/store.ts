// src/app/providers/StoreProvider/store.ts
import {configureStore} from '@reduxjs/toolkit';
import {setupListeners} from '@reduxjs/toolkit/query';

// API imports (RTK Query)
import {authApi} from '../../../entities/AuthState/model/slice/authApi';
import {userApi} from '../../../entities/UserState/model/slice/userApi';
import {challengeApi} from '../../../entities/ChallengeState/model/slice/challengeApi';
import {groupApi} from '../../../entities/GroupState/model/slice/groupApi';
import {quizApi} from '../../../entities/QuizState/model/slice/quizApi';

// Reducer imports
import authReducer from '../../../entities/AuthState/model/slice/authSlice';

// Import the challenge slice (REQUIRED FIX)
import {challengeSlice} from '../../../entities/challenge/model/slice';

// Optional imports - comment out if they don't exist yet
// Uncomment these imports one by one as you create the entities:
/*
import { questionSlice } from '../../../entities/question/model/slice';
import { gameSessionSlice } from '../../../entities/game-session/model/slice';
// OR if they're under features:
// import { gameSessionSlice } from '../../../features/game-session/model/slice';
*/

export const store = configureStore({
    reducer: {
        // Regular entity reducers
        auth: authReducer,
        challenge: challengeSlice.reducer, // ✅ REQUIRED - This fixes your error

        // Add these as you create the entities:
        // question: questionSlice.reducer,
        // gameSession: gameSessionSlice.reducer,

        // RTK Query API reducers
        [authApi.reducerPath]: authApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [challengeApi.reducerPath]: challengeApi.reducer,
        [groupApi.reducerPath]: groupApi.reducer,
        [quizApi.reducerPath]: quizApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(authApi.middleware)
            .concat(userApi.middleware)
            .concat(challengeApi.middleware)
            .concat(groupApi.middleware)
            .concat(quizApi.middleware),
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;