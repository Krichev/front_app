// src/app/store/index.ts
import {configureStore} from '@reduxjs/toolkit';
import {setupListeners} from '@reduxjs/toolkit/query';
import {FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE,} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Entity APIs
import {userApi} from '../../entities/user';
import {challengeApi} from '../../entities/challenge';
import {questionApi} from '../../entities/question';
import {groupApi} from '../../entities/group';

// Feature slices
import {authSlice} from '../../features/auth';
import {gameSessionSlice} from '../../entities/game-session';

// Persist configuration
const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    whitelist: ['auth'], // Only persist auth state
};

// Root reducer
const rootReducer = {
    // Auth feature
    auth: persistReducer(persistConfig, authSlice.reducer),

    // Entity APIs
    [userApi.reducerPath]: userApi.reducer,
    [challengeApi.reducerPath]: challengeApi.reducer,
    [questionApi.reducerPath]: questionApi.reducer,
    [groupApi.reducerPath]: groupApi.reducer,

    // Game session
    gameSession: gameSessionSlice.reducer,
};

// Configure store
export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        })
            .concat(userApi.middleware)
            .concat(challengeApi.middleware)
            .concat(questionApi.middleware)
            .concat(groupApi.middleware),
});

// Setup persistor
export const persistor = persistStore(store);

// Setup listeners for refetch on focus/reconnect
setupListeners(store.dispatch);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;