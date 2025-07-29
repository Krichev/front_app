// src/app/providers/StoreProvider/store.ts
import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {setupListeners} from '@reduxjs/toolkit/query';
import {FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Redux-persist configuration
const persistConfig = {
    key: 'root',
    version: 1,
    storage: AsyncStorage,
    // Blacklist RTK Query reducers (they shouldn't be persisted)
    blacklist: [
        authApi.reducerPath,
        userApi.reducerPath,
        challengeApi.reducerPath,
        groupApi.reducerPath,
        quizApi.reducerPath,
    ],
    // You can also whitelist specific reducers if you prefer
    // whitelist: ['auth', 'challenge'],
};

// Auth-specific persist config (if you want different settings for auth)
const authPersistConfig = {
    key: 'auth',
    storage: AsyncStorage,
    // You can exclude certain fields from being persisted
    // blacklist: ['isLoading', 'error'],
};

// Combine all reducers
const rootReducer = combineReducers({
    // Regular entity reducers with persistence
    auth: persistReducer(authPersistConfig, authReducer),
    challenge: challengeSlice.reducer, // This will be persisted via root config

    // Add these as you create the entities:
    // question: questionSlice.reducer,
    // gameSession: gameSessionSlice.reducer,

    // RTK Query API reducers (not persisted)
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [challengeApi.reducerPath]: challengeApi.reducer,
    [groupApi.reducerPath]: groupApi.reducer,
    [quizApi.reducerPath]: quizApi.reducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with persisted reducer
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore redux-persist actions
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        })
            .concat(authApi.middleware)
            .concat(userApi.middleware)
            .concat(challengeApi.middleware)
            .concat(groupApi.middleware)
            .concat(quizApi.middleware),
});

// Create persistor - THIS IS WHAT WAS MISSING!
export const persistor = persistStore(store);

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store and persistor
export default store;