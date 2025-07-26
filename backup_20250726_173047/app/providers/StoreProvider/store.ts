// src/app/providers/StoreProvider/store.ts
import {configureStore} from '@reduxjs/toolkit';
import {setupListeners} from '@reduxjs/toolkit/query';
import {authApi} from '../../../entities/AuthState/model/slice/authApi';
import {userApi} from '../../../entities/UserState/model/slice/userApi';
import {challengeApi} from '../../../entities/ChallengeState/model/slice/challengeApi';
import {groupApi} from '../../../entities/GroupState/model/slice/groupApi';
import {quizApi} from '../../../entities/QuizState/model/slice/quizApi'; // Add this import
import authReducer from '../../../entities/AuthState/model/slice/authSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        [authApi.reducerPath]: authApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [challengeApi.reducerPath]: challengeApi.reducer,
        [groupApi.reducerPath]: groupApi.reducer,
        [quizApi.reducerPath]: quizApi.reducer, // Add the quiz API reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(authApi.middleware)
            .concat(userApi.middleware)
            .concat(challengeApi.middleware)
            .concat(groupApi.middleware)
            .concat(quizApi.middleware), // Add the quiz API middleware
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;