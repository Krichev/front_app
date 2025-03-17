import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from "react-native-screens/native-stack";
import {
    useGetChallengeByIdQuery,
    useSubmitChallengeCompletionMutation,
    useVerifyLocationChallengeMutation,
    useVerifyPhotoChallengeMutation
} from '../entities/ChallengeState/model/slice/challengeApi';
import {FormatterService, VerificationService} from '../services/verification/ui/Services.ts';
import {LocationData, VerificationMethod, VerificationStatus} from '../app/types';
// import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Define type for navigation parameters
type RootStackParamList = {
    ChallengeVerification: { challengeId: string };
    ChallengeDetails: { challengeId: string };
};

type ChallengeVerificationRouteProp = RouteProp<RootStackParamList, 'ChallengeVerification'>;
type ChallengeVerificationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChallengeVerification'>;

const ChallengeVerificationScreen: React.FC = () => {
    const route = useRoute<ChallengeVerificationRouteProp>();
    const navigation = useNavigation<ChallengeVerificationNavigationProp>();
    const { challengeId } = route.params;

    // State
    const [verificationMethods, setVerificationMethods] = useState<VerificationMethod[]>([]);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [locationData, setLocationData] = useState<LocationData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // API Hooks
    const { data: challenge, isLoading, error } = useGetChallengeByIdQuery(challengeId);
    const [submitCompletion, { isLoading: isSubmitting }] = useSubmitChallengeCompletionMutation();
    const [verifyPhoto] = useVerifyPhotoChallengeMutation();
    const [verifyLocation] = useVerifyLocationChallengeMutation();

    // Parse verification methods when challenge data loads
    useEffect(() => {
        if (challenge && challenge.verificationMethod) {
            // Parse methods using the service and initialize status
            const parsedMethods = VerificationService.parseVerificationMethods(challenge.verificationMethod)
                .map(method => ({
                    ...method,
                    status: 'PENDING' as VerificationStatus
                }));
            setVerificationMethods(parsedMethods);
        }
    }, [challenge]);

    // Handle photo verification
    const handlePhotoVerification = async () => {
        const photoUri = await VerificationService.takePhoto();
        if (!photoUri) return;

        setPhotoUri(photoUri);

        // Get the photo verification method
        const photoMethod = verificationMethods.find(method => method.type === 'PHOTO');
        if (!photoMethod) return;

        try {
            setIsProcessing(true);

            // Create form data for API call
            const formData = VerificationService.createPhotoFormData(
                photoUri,
                challengeId,
                photoMethod.details.photoPrompt,
                photoMethod.details.aiPrompt
            );

            // Call API to verify photo
            const result = await verifyPhoto(formData).unwrap();

            // Update verification status based on result
            const updatedMethods = verificationMethods.map((method) => {
                if (method.type === 'PHOTO') {
                    return {
                        ...method,
                        status: result.isVerified ? 'COMPLETED' : 'FAILED' as VerificationStatus,
                        result: result,
                    };
                }
                return method;
            });

            setVerificationMethods(updatedMethods);

            // Show result to user
            if (result.isVerified) {
                Alert.alert('Photo Verified', result.message || 'Your photo has been verified successfully.');
            } else {
                Alert.alert('Verification Failed', result.message || 'Your photo could not be verified.');
            }

            setIsProcessing(false);
        } catch (error) {
            console.error('Error verifying photo:', error);
            setIsProcessing(false);
            Alert.alert('Error', 'Failed to verify photo. Please try again.');
        }
    };

    // Handle location verification
    const handleLocationVerification = async () => {
        try {
            setIsProcessing(true);

            // Get current location
            const location = await VerificationService.getCurrentLocation();
            if (!location) {
                setIsProcessing(false);
                return;
            }

            setLocationData(location);

            // Get the location verification method
            const locationMethod = verificationMethods.find(method => method.type === 'LOCATION');
            if (!locationMethod) {
                setIsProcessing(false);
                return;
            }

            // Call API to verify location
            const result = await verifyLocation({
                challengeId,
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: location.timestamp
            }).unwrap();

            // Update verification status based on result
            const updatedMethods = verificationMethods.map(method => {
                if (method.type === 'LOCATION') {
                    return {
                        ...method,
                        status: result.isVerified ? 'COMPLETED' : 'FAILED' as VerificationStatus,
                        result: result
                    };
                }
                return method;
            });

            setVerificationMethods(updatedMethods);

            // Show result to user
            if (result.isVerified) {
                Alert.alert('Location Verified', result.message || 'Your location has been verified successfully.');
            } else {
                Alert.alert('Verification Failed', result.message || 'Your location could not be verified.');
            }

            setIsProcessing(false);
        } catch (error) {
            console.error('Error verifying location:', error);
            setIsProcessing(false);
            Alert.alert('Error', 'Failed to verify location. Please try again.');
        }
    };

    // Submit all verifications
    const submitVerifications = async () => {
        try {
            // Check if all required verifications are completed
            const allCompleted = verificationMethods.every(method => method.status === 'COMPLETED');

            if (!allCompleted) {
                const pending = verificationMethods.filter(method => method.status === 'PENDING');
                if (pending.length > 0) {
                    Alert.alert('Incomplete Verification', 'Please complete all verification methods before submitting.');
                    return;
                }

                const failed = verificationMethods.filter(method => method.status === 'FAILED');
                if (failed.length > 0) {
                    Alert.alert(
                        'Failed Verification',
                        'Some verification methods have failed. Do you want to try again?',
                        [
                            { text: 'Try Again', style: 'cancel' },
                            { text: 'Submit Anyway', onPress: () => submitToServer() }
                        ]
                    );
                    return;
                }
            }

            await submitToServer();
        } catch (error) {
            console.error('Error submitting verifications:', error);
            Alert.alert('Error', 'Failed to submit your challenge verification. Please try again.');
        }
    };

    // Submit verification data to server
    const submitToServer = async () => {
        try {
            const verificationData = {
                photo: photoUri,
                location: locationData,
                verificationMethods: verificationMethods.map(method => ({
                    type: method.type,
                    status: method.status,
                    result: method.result
                }))
            };

            await submitCompletion({
                id: challengeId,
                proof: verificationData
            }).unwrap();

            Alert.alert(
                'Verification Submitted',
                'Your challenge verification has been submitted successfully.',
                [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]
            );
        } catch (error) {
            console.error('Error submitting to server:', error);
            Alert.alert('Error', 'Failed to submit your verification. Please try again.');
        }
    };

    // Render verification method item
    const renderVerificationMethod = (method: VerificationMethod) => {
        // Get status display information
        const getStatusInfo = () => {
            switch (method.status) {
                case 'COMPLETED':
                    return {
                        color: '#4CAF50',
                        text: 'Verified',
                        icon: 'check-circle'
                    };
                case 'FAILED':
                    return {
                        color: '#F44336',
                        text: 'Failed',
                        icon: 'error'
                    };
                default:
                    return {
                        color: '#FFC107',
                        text: 'Pending',
                        icon: 'pending'
                    };
            }
        };

        const statusInfo = getStatusInfo();

        return (
            <View style={styles.methodItem} key={method.type}>
                <View style={styles.methodHeader}>
                    <Text style={styles.methodTitle}>
                        {FormatterService.camelCaseToTitleCase(method.type)} Verification
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                        {/*<MaterialIcons name={statusInfo.icon} size={16} color="white" />*/}
                        <Text style={styles.statusText}>{statusInfo.text}</Text>
                    </View>
                </View>

                <View style={styles.methodContent}>
                    {method.type === 'PHOTO' && (
                        <View>
                            <Text style={styles.promptText}>{method.details.photoPrompt || 'Take a photo for verification'}</Text>

                            {photoUri ? (
                                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                            ) : null}

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handlePhotoVerification}
                                disabled={isSubmitting || isProcessing}
                            >
                                {/*<MaterialIcons name="camera-alt" size={20} color="white" />*/}
                                <Text style={styles.buttonText}>
                                    {photoUri ? 'Retake Photo' : 'Take Photo'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {method.type === 'LOCATION' && (
                        <View>
                            <Text style={styles.promptText}>
                                Verify you're at: {method.details.locationData?.address || 'required location'}
                            </Text>

                            {locationData && (
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationText}>Current location: {locationData.address}</Text>

                                    {method.result && (
                                        <Text style={styles.distanceText}>
                                            Distance: {Math.round(method.result.distance)}m
                                            (Required: within {method.details.locationData?.radius || 100}m)
                                        </Text>
                                    )}
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleLocationVerification}
                                disabled={isSubmitting || isProcessing}
                            >
                                {/*<MaterialIcons name="location-on" size={20} color="white" />*/}
                                <Text style={styles.buttonText}>Verify Location</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    // Loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading challenge verification...</Text>
            </SafeAreaView>
        );
    }

    // Error state
    if (error || !challenge) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                {/*<MaterialIcons name="error-outline" size={48} color="#F44336" />*/}
                <Text style={styles.errorText}>Failed to load challenge details.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>{challenge.title}</Text>
                    <Text style={styles.subtitle}>Verification</Text>
                </View>

                {/* Show loader if processing */}
                {isProcessing && (
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.processingText}>Processing verification...</Text>
                    </View>
                )}

                <View style={styles.content}>
                    {/* Challenge description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionTitle}>Challenge Description:</Text>
                        <Text style={styles.descriptionText}>{challenge.description}</Text>
                    </View>

                    {/* Verification methods */}
                    <View style={styles.methodsContainer}>
                        <Text style={styles.sectionTitle}>Verification Required</Text>

                        {verificationMethods.length > 0 ? (
                            verificationMethods.map(renderVerificationMethod)
                        ) : (
                            <Text style={styles.noMethodsText}>No verification methods found for this challenge.</Text>
                        )}
                    </View>

                    {/* Submit button */}
                    {verificationMethods.length > 0 && (
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (isSubmitting || isProcessing) && styles.disabledButton
                            ]}
                            onPress={submitVerifications}
                            disabled={isSubmitting || isProcessing}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    {/*<MaterialIcons name="check-circle" size={20} color="white" />*/}
                                    <Text style={styles.submitButtonText}>Submit Verification</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#555',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
        color: '#555',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    header: {
        padding: 16,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    content: {
        padding: 16,
    },
    descriptionContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    descriptionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    descriptionText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    methodsContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    methodItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    methodHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    methodTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    methodContent: {
        marginLeft: 0,
    },
    promptText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 12,
    },
    actionButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    photoPreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginVertical: 10,
        resizeMode: 'cover',
    },
    locationInfo: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    locationText: {
        fontSize: 14,
        color: '#555',
    },
    distanceText: {
        fontSize: 14,
        color: '#555',
        marginTop: 5,
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        marginTop: 20,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    disabledButton: {
        backgroundColor: '#A5D6A7',
        opacity: 0.7,
    },
    processingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    processingText: {
        color: 'white',
        marginTop: 16,
        fontSize: 16,
        fontWeight: 'bold',
    },
    noMethodsText: {
        fontSize: 14,
        color: '#757575',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 20,
    },
});

export default ChallengeVerificationScreen;