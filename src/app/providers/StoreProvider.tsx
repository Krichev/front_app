// src/app/providers/StoreProvider.tsx
import React from 'react';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {configureStore} from '@reduxjs/toolkit';
import {setupListeners} from '@reduxjs/toolkit/query';
import {FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CustomLoadingState} from '../../shared/ui';

// Import all API slices
import {authApi} from '../../entities/AuthState/model/slice/authApi';
import {userApi} from '../../entities/UserState/model/slice/userApi';
import {challengeApi} from '../../entities/ChallengeState/model/slice/challengeApi';
import {groupApi} from '../../entities/GroupState/model/slice/groupApi';
import {quizApi} from '../../entities/QuizState/model/slice/quizApi';

// Import reducers
import authReducer from '../../entities/AuthState/model/slice/authSlice';
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

// Persist configuration
const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    whitelist: ['auth', 'gameSession'], // Persist only necessary state
    blacklist: [
        authApi.reducerPath,
        userApi.reducerPath,
        challengeApi.reducerPath,
        groupApi.reducerPath,
        quizApi.reducerPath,
    ], // Don't persist API cache
};

// Root reducer
const rootReducer = {
    // Persistent auth state
    auth: persistReducer(persistConfig, authReducer),

    // Entity reducers
    gameSession: gameSessionSlice.reducer,
    challenge: challengeSlice.reducer,
    speechRecognition: speechRecognitionSlice.reducer,
    file: fileSlice.reducer,
    question: questionSlice.reducer,
    verification: verificationSlice.reducer,

    // Feature reducers
    speechToText: speechToTextSlice.reducer,
    wwwDiscussion: wwwDiscussionSlice.reducer,
    challengeVerification: challengeVerificationSlice.reducer,

    // API slices
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [challengeApi.reducerPath]: challengeApi.reducer,
    [groupApi.reducerPath]: groupApi.reducer,
    [quizApi.reducerPath]: quizApi.reducer,
};

// Configure store
export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    FLUSH,
                    REHYDRATE,
                    PAUSE,
                    PERSIST,
                    PURGE,
                    REGISTER,
                    // Add any other non-serializable actions here
                ],
                ignoredActionsPaths: [
                    'meta.arg',
                    'payload.timestamp',
                ],
                ignoredPaths: [
                    'items.dates',
                ],
            },
        })
            .concat(authApi.middleware)
            .concat(userApi.middleware)
            .concat(challengeApi.middleware)
            .concat(groupApi.middleware)
            .concat(quizApi.middleware),
    devTools: __DEV__,
});

// Setup persistor
export const persistor = persistStore(store);

// Setup listeners for refetch on focus/reconnect
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// StoreProvider Props
interface StoreProviderProps {
    children: React.ReactNode;
}

// Main StoreProvider component
export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
    return (
        <Provider store={store}>
            <PersistGate
                loading={<CustomLoadingState text="Loading app..." />}
                persistor={persistor}
            >
                {children}
            </PersistGate>
        </Provider>
    );
};

// Export store hooks (typed)
export { useAppDispatch, useAppSelector } from './hooks';

// Default export
export default StoreProvider;