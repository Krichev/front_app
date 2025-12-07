// src/app/providers/StoreProvider/store.ts - UPDATED WITH MEDIA API
import {configureStore} from '@reduxjs/toolkit';
import {setupListeners} from '@reduxjs/toolkit/query';

// Import your existing reducers
import authReducer from '../../../entities/AuthState/model/slice/authSlice';
import {authApi} from '../../../entities/AuthState/model/slice/authApi';
import {userApi} from '../../../entities/UserState/model/slice/userApi';
import {groupApi} from '../../../entities/GroupState/model/slice/groupApi';
import {challengeApi} from '../../../entities/ChallengeState/model/slice/challengeApi';
import {quizApi} from '../../../entities/QuizState/model/slice/quizApi';
import {tournamentQuestionApi} from '../../../entities/TournamentState/model/slice/tournamentQuestionApi';
import {mediaApi} from '../../../entities/MediaState/model/slice/mediaApi';
import {topicApi} from '../../../entities/TopicState/model/slice/topicApi';

export const store = configureStore({
    reducer: {
        // Auth slice reducer
        auth: authReducer,

        // RTK Query API reducers
        [authApi.reducerPath]: authApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [groupApi.reducerPath]: groupApi.reducer,
        [challengeApi.reducerPath]: challengeApi.reducer,
        [quizApi.reducerPath]: quizApi.reducer,
        [tournamentQuestionApi.reducerPath]: tournamentQuestionApi.reducer,
        [mediaApi.reducerPath]: mediaApi.reducer,
        [topicApi.reducerPath]: topicApi.reducer,
    },

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            authApi.middleware,
            userApi.middleware,
            groupApi.middleware,
            challengeApi.middleware,
            quizApi.middleware,
            tournamentQuestionApi.middleware,
            mediaApi.middleware,
            topicApi.middleware,
        ),

    devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in development
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;