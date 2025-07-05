// src/app/store/middleware/logger.ts
import {Middleware} from '@reduxjs/toolkit';

export const loggerMiddleware: Middleware = (store) => (next) => (action) => {
    if (__DEV__) {
        console.group(`🔥 Action: ${action.type}`);
        console.log('Payload:', action.payload);
        console.log('Previous State:', store.getState());
        const result = next(action);
        console.log('New State:', store.getState());
        console.groupEnd();
        return result;
    }
    return next(action);
};