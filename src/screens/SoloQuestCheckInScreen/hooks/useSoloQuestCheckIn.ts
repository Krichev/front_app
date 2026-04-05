// src/screens/SoloQuestCheckInScreen/hooks/useSoloQuestCheckIn.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useSelector } from 'react-redux';
import { RootState } from '../../../app/providers/StoreProvider/store';
import {
    useGetSoloQuestQuery,
    useGetQuestWagerQuery,
    useCheckInMutation,
    useDisputeQuestMutation,
} from '../../../entities/SoloQuestState/model/slice/soloQuestApi';
import { useSafeRefetch } from '../../../shared/hooks/useSafeRefetch';
import { calculateDistance } from '../../../shared/utils/geoUtils';

interface Position {
    latitude: number;
    longitude: number;
    accuracy: number;
}

async function requestFineLocationPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Location Permission',
                message: 'Check-in requires your precise location to verify proximity.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
        return false;
    }
}

export function useSoloQuestCheckIn(questId: number) {
    const user = useSelector((state: RootState) => state.auth.user);

    const {
        data: quest,
        isLoading: questLoading,
        error: questError,
        refetch: refetchRaw,
        isUninitialized: questUninitialized,
    } = useGetSoloQuestQuery(questId);

    const {
        data: wager,
        isLoading: wagerLoading,
    } = useGetQuestWagerQuery(questId);

    const refetchQuest = useSafeRefetch(refetchRaw, questUninitialized);

    const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
    const [disputeQuest, { isLoading: isDisputing }] = useDisputeQuestMutation();

    const [position, setPosition] = useState<Position | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [hasCheckedIn, setHasCheckedIn] = useState(false);
    const [checkInError, setCheckInError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const fetchPosition = useCallback(async () => {
        const granted = await requestFineLocationPermission();
        if (!granted) {
            if (mountedRef.current) setLocationError('permission_denied');
            return;
        }
        Geolocation.getCurrentPosition(
            (pos) => {
                if (!mountedRef.current) return;
                setPosition({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
                setLocationError(null);
            },
            (err) => {
                if (!mountedRef.current) return;
                setLocationError(err.message || 'location_error');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
        );
    }, []);

    // Fetch immediately, then every 10 s
    useEffect(() => {
        fetchPosition();
        const interval = setInterval(fetchPosition, 10_000);
        return () => clearInterval(interval);
    }, [fetchPosition]);

    const currentDistance = useMemo(() => {
        if (!position || !quest) return null;
        return calculateDistance(
            position.latitude,
            position.longitude,
            quest.meetupLatitude,
            quest.meetupLongitude,
        );
    }, [position, quest]);

    const isCreator = !!(user && quest && Number(user.id) === quest.creatorId);
    const isMatchedUser = !!(
        user &&
        quest &&
        quest.matchedUserId !== undefined &&
        Number(user.id) === quest.matchedUserId
    );

    const handleCheckIn = useCallback(async () => {
        if (!position) return;
        setCheckInError(null);
        try {
            const result = await checkIn({
                id: questId,
                body: {
                    latitude: position.latitude,
                    longitude: position.longitude,
                    accuracy: position.accuracy,
                },
            }).unwrap();
            if (result.success) {
                setHasCheckedIn(true);
                refetchQuest();
            } else {
                setCheckInError(result.message ?? 'check_in_failed');
            }
        } catch (e: any) {
            setCheckInError(e?.data?.message ?? 'network_error');
        }
    }, [position, checkIn, questId, refetchQuest]);

    const handleDispute = useCallback(async () => {
        await disputeQuest(questId).unwrap();
    }, [disputeQuest, questId]);

    return {
        quest,
        wager,
        questLoading,
        questError,
        wagerLoading,
        position,
        currentDistance,
        locationError,
        hasCheckedIn,
        checkInError,
        setCheckInError,
        isCheckingIn,
        isDisputing,
        isCreator,
        isMatchedUser,
        handleCheckIn,
        handleDispute,
        refetchQuest,
        fetchPosition,
        user,
    };
}
