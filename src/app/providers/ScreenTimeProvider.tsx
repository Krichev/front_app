import React, { createContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { 
    useGetScreenTimeBudgetQuery, 
    useSyncScreenTimeMutation,
    useGetMyLockConfigQuery,
    useUseEmergencyBypassMutation
} from '../../entities/WagerState/model/slice/wagerApi';
import { ScreenTimeBudget, ScreenTimeStatus, SyncTimeRequest } from '../../entities/WagerState/model/types';
import { screenTimeStorage } from '../../features/ScreenTime/utils/screenTimeStorage';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/providers/StoreProvider/store';
import { DeviceLockService, LockConfig } from '../../services/deviceLock/DeviceLockService';

interface ScreenTimeContextValue {
    // State
    budget: ScreenTimeBudget | null;
    status: ScreenTimeStatus | null;
    isLocked: boolean;
    availableSeconds: number; // For live countdown
    isTracking: boolean;
    
    // Actions
    startTracking: () => void;
    pauseTracking: () => void;
    syncNow: () => Promise<void>;
    refreshBudget: () => void;
    
    // Computed
    formattedTimeRemaining: string;
    urgencyLevel: 'normal' | 'warning' | 'critical';
}

export const ScreenTimeContext = createContext<ScreenTimeContextValue | null>(null);

export const ScreenTimeProvider: React.FC<{children: ReactNode}> = ({children}) => {
    const { isAuthenticated, user: authUser } = useSelector((state: RootState) => state.auth);
    // RTK Query hooks
    const { 
        data: budget, 
        refetch: refreshBudget,
        isLoading: isBudgetLoading,
        isError: isBudgetError,
        isUninitialized: isBudgetUninitialized
    } = useGetScreenTimeBudgetQuery(undefined, { skip: !isAuthenticated });
    
    const { data: lockConfig } = useGetMyLockConfigQuery(undefined, { skip: !isAuthenticated });
    const [useEmergencyBypass] = useUseEmergencyBypassMutation();
    const [syncTime] = useSyncScreenTimeMutation();
    
    // Local state
    const [availableSeconds, setAvailableSeconds] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [status, setStatus] = useState<ScreenTimeStatus | null>(null);
    const [dismissAttempts, setDismissAttempts] = useState(0);
    
    // Refs for mutable tracking
    const accumulatedSecondsRef = useRef(0);
    const lastTickTimeRef = useRef<number>(Date.now());
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const appStateRef = useRef(AppState.currentState);

    // Load initial accumulated seconds from storage
    useEffect(() => {
        const loadStorage = async () => {
            const stored = await screenTimeStorage.getAccumulatedSeconds();
            accumulatedSecondsRef.current = stored;
        };
        loadStorage();
    }, []);

    // Initialize from budget
    useEffect(() => {
        if (!isAuthenticated) {
            // Don't process budget when not authenticated
            return;
        }

        if (isBudgetError) {
            setIsLocked(false);
            if (Platform.OS === 'android') DeviceLockService.deactivateLock();
            return;
        }

        if (isBudgetLoading) return;

        if (budget) {
            setAvailableSeconds(budget.availableMinutes * 60);
            
            const shouldLock = budget.availableMinutes <= 0 || budget.lockedMinutes > 0;
            const wasLocked = isLocked;
            setIsLocked(shouldLock);
            
            if (shouldLock && !wasLocked && Platform.OS === 'android' && lockConfig) {
                const config: LockConfig = {
                    lockType: lockConfig.escalationEnabled ? 'both' : 'overlay',
                    resetTime: new Date(budget.lastResetDate).toISOString(), // Simplified
                    lockReason: budget.availableMinutes <= 0 ? 'screen_time_expired' : 'penalty',
                    allowEmergencyBypass: lockConfig.allowEmergencyBypass,
                    maxEmergencyBypasses: lockConfig.maxEmergencyBypassesPerMonth,
                    accountType: authUser?.childAccount ? 'child' : 'adult',
                    escalateAfterDismissAttempts: lockConfig.escalationAfterAttempts
                };
                DeviceLockService.activateLock(config);
            } else if (!shouldLock && wasLocked && Platform.OS === 'android') {
                DeviceLockService.deactivateLock();
            }
            
            setStatus({
                isLocked: shouldLock,
                availableMinutes: budget.availableMinutes,
                lockedMinutes: budget.lockedMinutes,
                dailyBudgetMinutes: budget.dailyBudgetMinutes,
                lastResetDate: budget.lastResetDate,
            });

            screenTimeStorage.saveLastKnownBudget(budget);
        } else {
             const loadLocalBudget = async () => {
                const localBudget = await screenTimeStorage.getLastKnownBudget();
                if (localBudget && !budget) {
                     setAvailableSeconds(localBudget.availableMinutes * 60);
                     setIsLocked(localBudget.availableMinutes <= 0 || localBudget.lockedMinutes > 0);
                }
             };
             loadLocalBudget();
        }
    }, [budget, isBudgetError, isBudgetLoading, lockConfig, authUser, isAuthenticated]);

    // Reset state when user logs out or is not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            setIsLocked(false);
            setAvailableSeconds(0);
            setIsTracking(false);
            setStatus(null);
            accumulatedSecondsRef.current = 0;
            // Clear stored data to prevent stale lock state on next login
            screenTimeStorage.clearAll();
            console.log('[ScreenTime] Reset state - user not authenticated');
        }
    }, [isAuthenticated]);

    // Native Event Listeners
    useEffect(() => {
        if (Platform.OS !== 'android') return;

        const unlockSub = DeviceLockService.onUnlockRequested(() => {
            console.log('[ScreenTime] Unlock requested via native overlay');
            // Logic to navigate to unlock request screen or show modal
        });

        const bypassSub = DeviceLockService.onEmergencyBypassUsed(async (data) => {
            console.log('[ScreenTime] Emergency bypass used via native overlay', data);
            try {
                await useEmergencyBypass().unwrap();
                if (!isBudgetUninitialized) {
                    refreshBudget();
                }
            } catch (e) {
                console.error('[ScreenTime] Failed to sync emergency bypass', e);
            }
        });

        const attemptSub = DeviceLockService.onLockDismissAttempt(({ attemptCount }) => {
            setDismissAttempts(attemptCount);
            if (lockConfig?.escalationEnabled && attemptCount >= (lockConfig.escalationAfterAttempts || 3)) {
                DeviceLockService.escalateToHardLock();
            }
        });

        return () => {
            unlockSub.remove();
            bypassSub.remove();
            attemptSub.remove();
        };
    }, [lockConfig, refreshBudget, useEmergencyBypass]);

    // Format time helper
    const getFormattedTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 
            ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            : `${m}:${String(s).padStart(2, '0')}`;
    };

    // Urgency level helper
    const getUrgencyLevel = (seconds: number) => {
        const minutes = seconds / 60;
        if (minutes <= 5) return 'critical';
        if (minutes <= 15) return 'warning';
        return 'normal';
    };

    // Sync logic
    const syncNow = useCallback(async () => {
        if (!isAuthenticated) return;
        const secondsToSync = accumulatedSecondsRef.current;
        if (secondsToSync < 60) return; // Only sync if we have at least 1 minute (or maybe less? Requirements say "Track time... max 60 per sync"?)
        // Requirement: "Sync accumulated usage with backend every 1-5 minutes".
        
        const minutesToSync = Math.floor(secondsToSync / 60); // Integer minutes
        if (minutesToSync === 0) return;

        const request: SyncTimeRequest = {
            usedMinutes: minutesToSync,
            clientTimestamp: new Date().toISOString(),
        };

        try {
            console.log(`[ScreenTime] Syncing ${minutesToSync} minutes`);
            await syncTime(request).unwrap();
            
            // If successful, reduce accumulated seconds by the amount synced
            accumulatedSecondsRef.current -= (minutesToSync * 60);
            await screenTimeStorage.saveAccumulatedSeconds(accumulatedSecondsRef.current);
        } catch (error) {
            console.log('[ScreenTime] Sync failed, queuing', error);
            // Queue for later
            await screenTimeStorage.addPendingSync(request);
            // Reset accumulated seconds since we queued the request (avoid double counting)
             accumulatedSecondsRef.current -= (minutesToSync * 60);
             await screenTimeStorage.saveAccumulatedSeconds(accumulatedSecondsRef.current);
        }
    }, [syncTime, isAuthenticated]);

    // Process pending syncs (e.g. on reconnect)
    const processPendingSyncs = async () => {
        const pending = await screenTimeStorage.getPendingSyncs();
        if (pending.length === 0) return;

        console.log(`[ScreenTime] Processing ${pending.length} pending syncs`);
        
        // We can batch them or send one by one. Let's send one by one for simplicity.
        // Or aggregate them? The API takes one request.
        // Let's aggregate if possible, or just loop.
        
        // Aggregating:
        let totalMinutes = 0;
        for (const p of pending) {
            totalMinutes += p.usedMinutes;
        }

        if (totalMinutes > 0) {
             const request: SyncTimeRequest = {
                usedMinutes: totalMinutes,
                clientTimestamp: new Date().toISOString(),
            };
            try {
                await syncTime(request).unwrap();
                await screenTimeStorage.clearPendingSyncs();
            } catch (e) {
                console.error('[ScreenTime] Failed to process pending syncs', e);
            }
        } else {
             await screenTimeStorage.clearPendingSyncs();
        }
    };

    // Countdown logic
    useEffect(() => {
        if (isTracking && !isLocked) {
            lastTickTimeRef.current = Date.now();
            countdownIntervalRef.current = setInterval(() => {
                const now = Date.now();
                const delta = now - lastTickTimeRef.current;
                
                // Only count if delta is reasonable (e.g. not waking from sleep with huge delta)
                // Although for accurate tracking we might want to count it?
                // But requirement says "Pause tracking when app goes to background".
                // If the interval fires, we are likely in foreground.
                
                if (delta >= 1000) {
                    const secondsPassed = Math.floor(delta / 1000);
                    lastTickTimeRef.current = now;

                    setAvailableSeconds(prev => {
                        const next = Math.max(0, prev - secondsPassed);
                        if (next === 0) {
                            setIsLocked(true);
                            syncNow(); // Final sync
                        }
                        return next;
                    });
                    
                    accumulatedSecondsRef.current += secondsPassed;
                    screenTimeStorage.saveAccumulatedSeconds(accumulatedSecondsRef.current);
                }
            }, 1000);
        } else {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        }
        return () => {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [isTracking, isLocked, syncNow]);

    // Sync interval
    useEffect(() => {
        if (isTracking) {
            syncIntervalRef.current = setInterval(() => {
                syncNow();
            }, 3 * 60 * 1000); // 3 minutes
        } else {
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        }
        return () => {
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        };
    }, [isTracking, syncNow]);

    // AppState handling
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (appStateRef.current.match(/active/) && nextAppState.match(/inactive|background/)) {
                // Going to background
                console.log('[ScreenTime] App going background');
                setIsTracking(false);
                syncNow();
            } else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                // Coming to foreground
                console.log('[ScreenTime] App active');
                setIsTracking(true);
                if (!isBudgetUninitialized) {
                    refreshBudget();
                }
            }
            appStateRef.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // Initial check
        if (AppState.currentState === 'active') {
            setIsTracking(true);
        }

        return () => subscription.remove();
    }, [syncNow, refreshBudget]);

    // NetInfo handling
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected) {
                processPendingSyncs();
            }
        });
        return () => unsubscribe();
    }, []);

    // Explicit start/pause actions
    const startTracking = () => setIsTracking(true);
    const pauseTracking = () => setIsTracking(false);

    const contextValue: ScreenTimeContextValue = {
        budget: budget || null,
        status,
        isLocked,
        availableSeconds,
        isTracking,
        startTracking,
        pauseTracking,
        syncNow,
        refreshBudget,
        formattedTimeRemaining: getFormattedTime(availableSeconds),
        urgencyLevel: getUrgencyLevel(availableSeconds),
    };

    return (
        <ScreenTimeContext.Provider value={contextValue}>
            {children}
        </ScreenTimeContext.Provider>
    );
};
