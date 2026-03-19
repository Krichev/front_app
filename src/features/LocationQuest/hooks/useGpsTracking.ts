import { useState, useEffect, useRef, useCallback } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { useTranslation } from 'react-i18next';
import { useUpdateLocationMutation } from '../../../entities/LocationQuest';

export const useGpsTracking = () => {
  const { t } = useTranslation();
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeQuestId, setActiveQuestId] = useState<number | null>(null);

  const watchId = useRef<number | null>(null);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);
  const [updateLocation] = useUpdateLocationMutation();

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }
    setIsTracking(false);
    setActiveQuestId(null);
  }, []);

  const startTracking = useCallback((questId: number) => {
    stopTracking();
    setActiveQuestId(questId);
    setIsTracking(true);
    setError(null);

    watchId.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ latitude, longitude, accuracy });
        setError(null);
      },
      (err) => {
        console.error('GPS error:', err);
        setError(t('locationQuest.errors.gpsTimeout'));
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        timeout: 15000,
      }
    );

    // Initial update
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ latitude, longitude, accuracy });
        updateLocation({ questId, latitude, longitude, accuracy });
      },
      (err) => console.error('Initial GPS error:', err),
      { enableHighAccuracy: true, timeout: 15000 }
    );

    // Periodic update every 10 seconds
    updateInterval.current = setInterval(() => {
      if (currentLocation && questId) {
        updateLocation({
          questId,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
        });
      }
    }, 10000);
  }, [currentLocation, stopTracking, t, updateLocation]);

  useEffect(() => {
    return () => stopTracking();
  }, [stopTracking]);

  return {
    currentLocation,
    isTracking,
    error,
    startTracking,
    stopTracking,
  };
};
