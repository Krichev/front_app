import { useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface UseGeolocationResult {
    getCurrentLocation: (onSuccess: (latitude: number, longitude: number) => void) => Promise<void>;
    locationFetching: boolean;
}

export function useGeolocation(): UseGeolocationResult {
    const [locationFetching, setLocationFetching] = useState<boolean>(false);

    const getCurrentLocation = async (onSuccess: (latitude: number, longitude: number) => void) => {
        if (Platform.OS === 'android') {
            const permission = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permission Denied', 'Location permission is required');
                return;
            }
        }

        setLocationFetching(true);

        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                onSuccess(latitude, longitude);
                setLocationFetching(false);
            },
            (error) => {
                console.error('Location error:', error);
                Alert.alert('Error', 'Failed to get current location');
                setLocationFetching(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    return {
        getCurrentLocation,
        locationFetching,
    };
}
