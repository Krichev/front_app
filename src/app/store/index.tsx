// src/app/store/index.ts
import {configureStore} from '@reduxjs/toolkit';
import {setupListeners} from '@reduxjs/toolkit/query';
import {FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE,} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Entity APIs and slices
import {userApi, userSlice} from '../../entities/user';
import {challengeApi, challengeSlice} from '../../entities/challenge';
import {questionApi, questionSlice} from '../../entities/question';
import {groupApi} from '../../entities/group';

// Feature slices
import {authSlice} from '../../features/auth';
import {challengeVerificationSlice} from '../../features/challenge-verification';
import {gameSessionSlice} from '../../features/game-session';

// ============================================================================
// Persist configurations
const authPersistConfig = {
    key: 'auth',
    storage: AsyncStorage,
    whitelist: ['isAuthenticated', 'user', 'token'], // Only persist essential auth data
};

const userPersistConfig = {
    key: 'user',
    storage: AsyncStorage,
    whitelist: ['preferences'], // Only persist user preferences
};

// ============================================================================
// Root reducer configuration
const rootReducer = {
    // === FEATURES ===
    // Authentication feature
    auth: persistReducer(authPersistConfig, authSlice.reducer),

    // Challenge verification feature
    challengeVerification: challengeVerificationSlice.reducer,

    // Game session feature
    gameSession: gameSessionSlice.reducer,

    // === ENTITIES ===
    // User entity
    user: persistReducer(userPersistConfig, userSlice.reducer),

    // Challenge entity
    challenge: challengeSlice.reducer,

    // Question entity
    question: questionSlice.reducer,

    // === ENTITY APIs ===
    [userApi.reducerPath]: userApi.reducer,
    [challengeApi.reducerPath]: challengeApi.reducer,
    [questionApi.reducerPath]: questionApi.reducer,
    [groupApi.reducerPath]: groupApi.reducer,
};

// ============================================================================
// Store configuration
export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
                // Additional ignored paths for better performance
                ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
                ignoredPaths: ['items.dates'],
            },
        })
            // Entity API middlewares
            .concat(userApi.middleware)
            .concat(challengeApi.middleware)
            .concat(questionApi.middleware)
            .concat(groupApi.middleware),

    // Enable Redux DevTools in development
    devTools: __DEV__,
});

// ============================================================================
// Persistor setup
export const persistor = persistStore(store);

// Setup listeners for refetch on focus/reconnect
setupListeners(store.dispatch);

// ============================================================================
// Type definitions
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ============================================================================
// Store utilities
export const clearPersistedState = async () => {
    try {
        await AsyncStorage.multiRemove(['persist:auth', 'persist:user']);
        console.log('Persisted state cleared successfully');
    } catch (error) {
        console.error('Error clearing persisted state:', error);
    }
};

export const getStoreSnapshot = () => {
    return {
        auth: store.getState().auth,
        user: store.getState().user,
        challenge: store.getState().challenge,
        question: store.getState().question,
        gameSession: store.getState().gameSession,
    };
};