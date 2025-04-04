import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  useGetChallengeByIdQuery,
  useVerifyLocationChallengeMutation,
} from '../entities/ChallengeState/model/slice/challengeApi';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {ChallengeService, VerificationService} from '../services/verification/ui/Services';
import {LocationData} from '../app/types';

// Define the types for the navigation parameters
type RootStackParamList = {
  LocationVerification: { challengeId: string };
  ChallengeDetails: { challengeId: string };
  ChallengeVerification: { challengeId: string };
};

type LocationVerificationRouteProp = RouteProp<RootStackParamList, 'LocationVerification'>;
type LocationVerificationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LocationVerification'>;

// Location interface
interface LocationDetails {
  latitude: number;
  longitude: number;
  address?: string;
  radius: number;
}

const LocationVerificationScreen: React.FC = () => {
  const route = useRoute<LocationVerificationRouteProp>();
  const navigation = useNavigation<LocationVerificationNavigationProp>();
  const { challengeId } = route.params;

  // State for handling the location verification process
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [targetLocation, setTargetLocation] = useState<LocationDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isVerified: boolean;
    message: string;
    distance?: number;
  } | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // RTK Query hooks
  const { data: challenge, isLoading: isLoadingChallenge } = useGetChallengeByIdQuery(challengeId);
  const [verifyLocation, { isLoading: isVerifying }] = useVerifyLocationChallengeMutation();

  // Parse verification methods when challenge data loads
  useEffect(() => {
    if (challenge && challenge.verificationMethod) {
      try {
        const methods = ChallengeService.getVerificationMethods(challenge);
        const locationMethod = methods.find((m) => m.type === 'LOCATION');
        if (locationMethod && locationMethod.details && locationMethod.details.locationData) {
          setTargetLocation(locationMethod.details.locationData);
        }
      } catch (e) {
        console.error('Error parsing verification methods:', e);
      }
    }
  }, [challenge]);

  // Request location permissions
  useEffect(() => {
    checkLocationPermission();
  }, []);

  // Check location permission
  const checkLocationPermission = async () => {
    try {
      const hasPermission = await VerificationService.requestLocationPermission();
      setPermissionGranted(hasPermission);
    } catch (err) {
      console.warn(err);
      setPermissionGranted(false);
    }
  };

  // Open device settings
  const openSettings = () => {
    Linking.openSettings();
  };

  // Get current location
  const getCurrentLocation = async () => {
    if (!permissionGranted) {
      Alert.alert(
          'Permission Required',
          'Location permissions are required for verification.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings }
          ]
      );
      return;
    }

    try {
      setIsCheckingLocation(true);
      const location = await VerificationService.getCurrentLocation();

      if (location) {
        setUserLocation(location);
      } else {
        Alert.alert('Error', 'Failed to get your location. Please try again.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    } finally {
      setIsCheckingLocation(false);
    }
  };

  // Submit location for verification
  const submitLocation = async () => {
    if (!userLocation || !targetLocation) {
      Alert.alert('Error', !userLocation
          ? 'Please check your location first.'
          : 'Target location information is missing.');
      return;
    }

    try {
      setIsProcessing(true);

      // Calculate the distance (for local preview)
      const distanceMeters = VerificationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          targetLocation.latitude,
          targetLocation.longitude
      );

      // Create the verification request
      const verificationRequest = {
        challengeId,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        timestamp: new Date().toISOString(),
      };

      // Call the API to verify the location
      const response = await verifyLocation(verificationRequest).unwrap();

      // Set the verification result
      setVerificationResult({
        isVerified: response.isVerified,
        message: response.message || (response.isVerified
            ? 'Location verification successful!'
            : 'Location verification failed. You are not at the required location.'),
        // distance: response.distance || distanceMeters,
      });

      // If verification is successful, show success message with option to return
      if (response.isVerified) {
        Alert.alert(
            'Verification Successful',
            response.message || 'Your location has been verified successfully!',
            [
              {
                text: 'Back to Challenge',
                onPress: () => navigation.navigate('ChallengeDetails', { challengeId })
              }
            ]
        );
      }
    } catch (error) {
      console.error('Error verifying location:', error);
      Alert.alert('Error', 'Failed to verify location. Please try again.');
      setVerificationResult({
        isVerified: false,
        message: 'Error: Could not process verification request.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (isLoadingChallenge) {
    return (
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading challenge details...</Text>
        </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Location Verification</Text>
            {challenge && (
                <Text style={styles.subtitle}>{challenge.title}</Text>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Instructions:</Text>
            <Text style={styles.instructionsText}>
              You need to be physically present at the challenge location to verify your participation.
              {targetLocation?.address ? ` Location: ${targetLocation.address}` : ''}
            </Text>
            {targetLocation && (
                <Text style={styles.radiusText}>
                  You must be within {targetLocation.radius || 100} meters of the target location.
                </Text>
            )}
          </View>

          {/* Current Location */}
          <View style={styles.locationContainer}>
            <Text style={styles.locationTitle}>Your Current Location:</Text>
            {userLocation ? (
                <View style={styles.locationInfo}>
                  <Text style={styles.locationText}>
                    Latitude: {userLocation.latitude.toFixed(6)}
                  </Text>
                  <Text style={styles.locationText}>
                    Longitude: {userLocation.longitude.toFixed(6)}
                  </Text>
                  {targetLocation && (
                      <Text style={styles.locationText}>
                        Distance to target: {Math.round(VerificationService.calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          targetLocation.latitude,
                          targetLocation.longitude
                      ))} meters
                      </Text>
                  )}
                </View>
            ) : (
                <Text style={styles.noLocationText}>
                  {permissionGranted === false
                      ? 'Location permission denied. Please enable location services.'
                      : 'No location data. Tap "Check My Location" to begin.'}
                </Text>
            )}
          </View>

          {/* Target Location Info */}
          {targetLocation && (
              <View style={styles.targetContainer}>
                <Text style={styles.locationTitle}>Target Location:</Text>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationText}>
                    Latitude: {targetLocation.latitude.toFixed(6)}
                  </Text>
                  <Text style={styles.locationText}>
                    Longitude: {targetLocation.longitude.toFixed(6)}
                  </Text>
                  {targetLocation.address && (
                      <Text style={styles.locationText}>
                        Address: {targetLocation.address}
                      </Text>
                  )}
                </View>
              </View>
          )}

          {/* Verification Result */}
          {verificationResult && (
              <View style={[
                styles.resultContainer,
                verificationResult.isVerified ? styles.successContainer : styles.failureContainer
              ]}>
                <MaterialIcons
                    name={verificationResult.isVerified ? "check-circle" : "error"}
                    size={24}
                    color={verificationResult.isVerified ? "#4CAF50" : "#F44336"}
                />
                <Text style={styles.resultText}>{verificationResult.message}</Text>
                {verificationResult.distance && (
                    <Text style={styles.distanceText}>
                      Distance to target: {Math.round(verificationResult.distance)} meters
                      {verificationResult.isVerified
                          ? ' (Within range)'
                          : ` (Required: ${targetLocation?.radius || 100} meters)`}
                    </Text>
                )}
              </View>
          )}

          {/* Location Check Button */}
          <TouchableOpacity
              style={[
                styles.checkButton,
                isCheckingLocation && styles.disabledButton
              ]}
              onPress={getCurrentLocation}
              disabled={isCheckingLocation || permissionGranted === false}
          >
            {isCheckingLocation ? (
                <ActivityIndicator color="white" size="small" />
            ) : (
                <>
                  <MaterialIcons name="my-location" size={20} color="white" />
                  <Text style={styles.buttonText}>Check My Location</Text>
                </>
            )}
          </TouchableOpacity>

          {/* Submit Button */}
          {userLocation && targetLocation && !verificationResult?.isVerified && (
              <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (isProcessing || isVerifying) && styles.disabledButton
                  ]}
                  onPress={submitLocation}
                  disabled={isProcessing || isVerifying || !userLocation}
              >
                {isProcessing || isVerifying ? (
                    <ActivityIndicator color="white" size="small" />
                ) : (
                    <>
                      <MaterialIcons name="check" size={20} color="white" />
                      <Text style={styles.submitButtonText}>Submit for Verification</Text>
                    </>
                )}
              </TouchableOpacity>
          )}

          {/* Permission Button (if needed) */}
          {permissionGranted === false && (
              <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={openSettings}
              >
                <MaterialIcons name="settings" size={20} color="white" />
                <Text style={styles.buttonText}>Open Location Settings</Text>
              </TouchableOpacity>
          )}

          {/* Back Button */}
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={isProcessing || isVerifying}
          >
            <MaterialIcons name="arrow-back" size={20} color="#555" />
            <Text style={styles.backButtonText}>Back to Challenge</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Processing Overlay */}
        {(isProcessing || isVerifying) && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.overlayText}>Processing verification...</Text>
            </View>
        )}
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  instructionsContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 8,
  },
  radiusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  locationContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  targetContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  locationInfo: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 4,
  },
  locationText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  noLocationText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
    padding: 12,
  },
  checkButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultContainer: {
    flexDirection: 'column',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
  },
  failureContainer: {
    backgroundColor: '#FFEBEE',
  },
  resultText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  permissionButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#555',
    fontSize: 14,
    marginLeft: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlayText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
});

export default LocationVerificationScreen;