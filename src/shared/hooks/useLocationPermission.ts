// src/shared/hooks/useLocationPermission.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface LocationState {
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

async function requestAndroidPermission(): Promise<boolean> {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            {
                title: 'Location Permission',
                message: 'This app needs access to your location to show nearby quests.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
        return false;
    }
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
        const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'User-Agent': 'ChallengerApp/1.0' } }
        );
        const json = await resp.json();
        return (
            json?.address?.city ||
            json?.address?.town ||
            json?.address?.village ||
            json?.address?.county ||
            null
        );
    } catch {
        return null;
    }
}

export function useLocationPermission(): LocationState {
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [city, setCity] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const fetchLocation = useCallback(async () => {
        if (!mountedRef.current) return;
        setLoading(true);
        setError(null);

        if (Platform.OS === 'android') {
            const granted = await requestAndroidPermission();
            if (!granted) {
                if (mountedRef.current) {
                    setLoading(false);
                    setError('permission_denied');
                }
                return;
            }
        }

        Geolocation.getCurrentPosition(
            async (position) => {
                if (!mountedRef.current) return;
                const { latitude: lat, longitude: lng } = position.coords;
                setLatitude(lat);
                setLongitude(lng);
                const cityName = await reverseGeocode(lat, lng);
                if (mountedRef.current) {
                    setCity(cityName);
                    setLoading(false);
                }
            },
            (err) => {
                if (!mountedRef.current) return;
                setLoading(false);
                setError(err.message || 'location_error');
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
    }, []);

    useEffect(() => {
        fetchLocation();
    }, [fetchLocation]);

    return { latitude, longitude, city, loading, error, refresh: fetchLocation };
}
