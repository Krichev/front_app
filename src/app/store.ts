// src/app/store.ts (or create this file if it doesn't exist)
// This file can be used to re-export store types for easier imports

export type {
    RootState,
    AppDispatch
} from './providers/StoreProvider/store';

// Re-export the store itself if needed
export { store } from './providers/StoreProvider/store';