// store.ts
import {configureStore} from '@reduxjs/toolkit';
import {authApi} from "../../../entities/AuthState/model/slice/authApi.ts";
import authReducer from "../../../entities/AuthState/model/slice/authSlice.ts";
import {challengeApi} from "../../../entities/ChallengeState/model/slice/challengeApi.ts";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        [authApi.reducerPath]: authApi.reducer,
        [challengeApi.reducerPath]: challengeApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(authApi.middleware)
            .concat(challengeApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


// export const store = configureStore({
//     reducer: {
//         [authApi.reducerPath]: authApi.reducer,
//         auth: authReducer,
//     },
//
//     middleware: (getDefaultMiddleware) =>
//         getDefaultMiddleware().concat(authApi.middleware),
//     devTools: true,
// });
