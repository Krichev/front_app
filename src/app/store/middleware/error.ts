// src/app/store/middleware/error.ts
import {Middleware} from '@reduxjs/toolkit';

export const errorMiddleware: Middleware = (store) => (next) => (action) => {
    try {
        return next(action);
    } catch (error) {
        console.error('Store Error:', error);

        // You could dispatch an error action here
        // store.dispatch(globalErrorActions.setError(error.message));

        throw error;
    }
};