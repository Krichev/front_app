import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenTimeBudget, SyncTimeRequest } from '../../../entities/WagerState/model/types';

const KEYS = {
    PENDING_SYNCS: '@screen_time_pending_syncs',
    LAST_KNOWN_BUDGET: '@screen_time_last_budget',
    ACCUMULATED_SECONDS: '@screen_time_accumulated',
};

export const screenTimeStorage = {
    // Store accumulated seconds for sync
    saveAccumulatedSeconds: async (seconds: number) => {
        try {
            await AsyncStorage.setItem(KEYS.ACCUMULATED_SECONDS, String(seconds));
        } catch (e) {
            console.error('Failed to save accumulated seconds', e);
        }
    },

    getAccumulatedSeconds: async (): Promise<number> => {
        try {
            const val = await AsyncStorage.getItem(KEYS.ACCUMULATED_SECONDS);
            return val ? parseInt(val, 10) : 0;
        } catch (e) {
            console.error('Failed to get accumulated seconds', e);
            return 0;
        }
    },

    clearAccumulatedSeconds: async () => {
        try {
            await AsyncStorage.removeItem(KEYS.ACCUMULATED_SECONDS);
        } catch (e) {
            console.error('Failed to clear accumulated seconds', e);
        }
    },
    
    // Store last known budget for offline display
    saveLastKnownBudget: async (budget: ScreenTimeBudget) => {
        try {
            await AsyncStorage.setItem(KEYS.LAST_KNOWN_BUDGET, JSON.stringify(budget));
        } catch (e) {
            console.error('Failed to save last budget', e);
        }
    },

    getLastKnownBudget: async (): Promise<ScreenTimeBudget | null> => {
        try {
            const val = await AsyncStorage.getItem(KEYS.LAST_KNOWN_BUDGET);
            return val ? JSON.parse(val) : null;
        } catch (e) {
            console.error('Failed to get last budget', e);
            return null;
        }
    },
    
    // Store pending sync queue
    addPendingSync: async (sync: SyncTimeRequest) => {
        try {
            const current = await screenTimeStorage.getPendingSyncs();
            const updated = [...current, sync];
            await AsyncStorage.setItem(KEYS.PENDING_SYNCS, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to add pending sync', e);
        }
    },

    getPendingSyncs: async (): Promise<SyncTimeRequest[]> => {
        try {
            const val = await AsyncStorage.getItem(KEYS.PENDING_SYNCS);
            return val ? JSON.parse(val) : [];
        } catch (e) {
            console.error('Failed to get pending syncs', e);
            return [];
        }
    },

    clearPendingSyncs: async () => {
        try {
            await AsyncStorage.removeItem(KEYS.PENDING_SYNCS);
        } catch (e) {
            console.error('Failed to clear pending syncs', e);
        }
    },
};
