// src/app/store/index.ts
import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {setupListeners} from '@reduxjs/toolkit/query';
import {FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE,} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth feature (assuming you have the new auth structure)
import {authReducer} from '../../features/auth/model';

// Entity APIs
import {authApi} from '../../entities/AuthState/model/slice/authApi';
import {userApi} from '../../entities/UserState/model/slice/userApi';
import {challengeApi} from '../../entities/ChallengeState/model/slice/challengeApi';
import {groupApi} from '../../entities/GroupState/model/slice/groupApi';
import {quizApi} from '../../entities/QuizState/model/slice/quizApi';

// Entity slices
import {gameSessionSlice} from '../../entities/game-session';
import {challengeSlice} from '../../entities/challenge';
import {speechRecognitionSlice} from '../../entities/speech-recognition';
import {fileSlice} from '../../entities/file';
import {questionSlice} from '../../entities/question';
import {verificationSlice} from '../../entities/verification';

// Feature slices
import {speechToTextSlice} from '../../features/speech-to-text/model/slice';
import {wwwDiscussionSlice} from '../../features/www-game-discussion/model/slice';
import {challengeVerificationSlice} from '../../features/challenge-verification/model/slice';

// Persist configuration
const persistConfig = {
    key: 'root',
    version: 1,
    storage: AsyncStorage,
    whitelist: ['auth'], // Only persist auth state
    blacklist: [
        // Don't persist API cache states
        authApi.reducerPath,
        userApi.reducerPath,
        challengeApi.reducerPath,
        groupApi.reducerPath,
        quizApi.reducerPath,
    ],
};

// Auth persist configuration (separate config for auth)
const authPersistConfig = {
    key: 'auth',
    storage: AsyncStorage,
    whitelist: ['accessToken', 'refreshToken', 'user', 'isAuthenticated'],
};

// Root reducer
const rootReducer = combineReducers({
    // Persisted auth state
    auth: persistReducer(authPersistConfig, authReducer),

    // Entity APIs (RTK Query)
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [challengeApi.reducerPath]: challengeApi.reducer,
    [groupApi.reducerPath]: groupApi.reducer,
    [quizApi.reducerPath]: quizApi.reducer,

    // Entity slices
    gameSession: gameSessionSlice.reducer,
    challenge: challengeSlice.reducer,
    speechRecognition: speechRecognitionSlice.reducer,
    file: fileSlice.reducer,
    question: questionSlice.reducer,
    verification: verificationSlice.reducer,

    // Feature slices
    speechToText: speechToTextSlice.reducer,
    wwwDiscussion: wwwDiscussionSlice.reducer,
    challengeVerification: challengeVerificationSlice.reducer,
});

// Persisted root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
                // Ignore these field paths in all actions
                ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
                // Ignore these paths in the state
                ignoredPaths: ['items.dates'],
            },
            immutableCheck: {
                // Ignore these paths in the state for immutability checks
                ignoredPaths: ['auth.someNonSerializableField'],
            },
        })
            // RTK Query middleware
            .concat(authApi.middleware)
            .concat(userApi.middleware)
            .concat(challengeApi.middleware)
            .concat(groupApi.middleware)
            .concat(quizApi.middleware),

    // Enable Redux DevTools in development
    devTools: __DEV__,

    // Preloaded state (if needed)
    preloadedState: undefined,
});

// Create persistor
export const persistor = persistStore(store, null, () => {
    console.log('Store rehydration complete');
});

// Setup listeners for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Infer types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Store actions for debugging
if (__DEV__) {
    // Log store actions in development
    store.subscribe(() => {
        // You can add debugging logic here
        // console.log('Store updated:', store.getState());
    });
}

// Note: React Native uses Fast Refresh instead of webpack HMR
// No hot reloading setup needed - Fast Refresh handles component updates automatically