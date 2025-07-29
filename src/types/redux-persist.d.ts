// ===== FILE 1: src/types/redux-persist.d.ts =====
declare module 'redux-persist/integration/react' {
    import {ReactNode} from 'react';
    import {Persistor} from 'redux-persist';

    interface PersistGateProps {
        loading?: ReactNode;
        persistor: Persistor;
        children?: ReactNode;
        onBeforeLift?: () => void | Promise<void>;
    }

    export const PersistGate: React.ComponentType<PersistGateProps>;
}

declare module 'redux-persist' {
    export interface Persistor {
        persist(): Promise<any>;
        purge(): Promise<any>;
        flush(): Promise<any>;
        pause(): void;
        resume(): void;
        getState(): any;
        dispatch(action: any): any;
        subscribe(listener: () => void): () => void;
    }

    export interface PersistConfig {
        key: string;
        version?: number;
        storage: any;
        blacklist?: string[];
        whitelist?: string[];
        transforms?: any[];
        migrate?: (state: any, version: number) => any;
        debug?: boolean;
        stateReconciler?: any;
        serialize?: boolean;
        timeout?: number;
        keyPrefix?: string;
        writeFailHandler?: (err: Error) => void;
    }

    export function persistReducer<S = any, A = any>(
        config: PersistConfig,
        baseReducer: (state: S | undefined, action: A) => S
    ): (state: S | undefined, action: A) => S;

    export function persistStore(store: any, config?: any, callback?: () => void): Persistor;

    export const FLUSH: string;
    export const REHYDRATE: string;
    export const PAUSE: string;
    export const PERSIST: string;
    export const PURGE: string;
    export const REGISTER: string;
}