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
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
    useGetChallengeByIdQuery,
    useVerifyPhotoChallengeMutation,
} from '../entities/ChallengeState/model/slice/challengeApi';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {ChallengeService, VerificationService} from '../services/verification/ui/Services';

// Define the types for the navigation parameters
type RootStackParamList = {
    PhotoVerification: { challengeId: string; prompt?: string };
    ChallengeDetails: { challengeId: string };
    ChallengeVerification: { challengeId: string };
};

type PhotoVerificationRouteProp = RouteProp<RootStackParamList, 'PhotoVerification'>;
type PhotoVerificationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhotoVerification'>;

const PhotoVerificationScreen: React.FC = () => {
    const { t } = useTranslation();
    const route = useRoute<PhotoVerificationRouteProp>();
    const navigation = useNavigation<PhotoVerificationNavigationProp>();
    
    // Safely access params - Hermes seals objects so destructuring missing optional props throws ReferenceError
    const challengeId = route.params?.challengeId;
    const routePrompt = route.params?.prompt;

    // State for handling the photo capture process
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [verificationResult, setVerificationResult] = useState<{
        isVerified: boolean;
        message: string;
    } | null>(null);

    // RTK Query hooks
    const { data: challenge, isLoading: isLoadingChallenge } = useGetChallengeByIdQuery(challengeId);
    const [verifyPhoto, { isLoading: isVerifying }] = useVerifyPhotoChallengeMutation();

    // Get verification details from challenge data
    const [photoPrompt, setPhotoPrompt] = useState<string>('');

    useEffect(() => {
        if (routePrompt) {
            setPhotoPrompt(routePrompt);
        } else if (challenge && challenge.verificationMethod) {
            try {
                const methods = ChallengeService.getVerificationMethods(challenge);
                const photoMethod = methods.find((m) => m.type === 'PHOTO');
                if (photoMethod && photoMethod.details && photoMethod.details.photoPrompt) {
                    setPhotoPrompt(photoMethod.details.photoPrompt);
                }
            } catch (e) {
                console.error('Error parsing verification methods:', e);
            }
        }
    }, [challenge, routePrompt]);

    // Take a photo using the camera
    const takePhoto = async () => {
        try {
            const result = await VerificationService.takePhotoWithVisionCamera(navigation);
            if (result) {
                setPhotoUri(result);
                setVerificationResult(null); // Reset verification result when taking a new photo
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert(t('common.error'), t('challengeVerification.photo.failedMessage'));
        }
    };

    // Submit the photo for verification
    const submitPhoto = async () => {
        if (!photoUri) {
            Alert.alert(t('common.error'), t('challengeVerification.photo.takePhotoFirst'));
            return;
        }

        try {
            setIsProcessing(true);

            // Call the API to verify the photo
            const response = await verifyPhoto({
                challengeId,
                image: {
                    uri: photoUri,
                    name: 'photo.jpg',
                    type: 'image/jpeg',
                },
                prompt: photoPrompt
            }).unwrap();

            setVerificationResult({
                isVerified: response.isVerified,
                message: response.message || (response.isVerified
                    ? t('challengeVerification.photo.verificationSuccessful')
                    : t('challengeVerification.photo.failedMessage')),
            });

            // If verification is successful, show success message with option to return
            if (response.isVerified) {
                Alert.alert(
                    t('challengeVerification.photo.verificationSuccessful'),
                    response.message || t('challengeVerification.photo.successMessage'),
                    [
                        {
                            text: t('challengeVerification.photo.backToChallenge'),
                            onPress: () => navigation.navigate('ChallengeDetails', { challengeId })
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Error verifying photo:', error);
            Alert.alert(t('common.error'), t('challengeVerification.photo.submitFailed'));
            setVerificationResult({
                isVerified: false,
                message: t('challengeVerification.photo.processingError'),
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
                <Text style={styles.loadingText}>{t('challengeVerification.photo.loadingChallenge')}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('challengeVerification.photo.title')}</Text>
                    {challenge && (
                        <Text style={styles.subtitle}>{challenge.title}</Text>
                    )}
                </View>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsTitle}>{t('challengeVerification.photo.instructions')}</Text>
                    <Text style={styles.instructionsText}>
                        {photoPrompt || t('challengeVerification.photo.defaultInstructions')}
                    </Text>
                </View>

                {/* Photo Preview */}
                <View style={styles.photoContainer}>
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <MaterialIcons name="photo-camera" size={60} color="#CCCCCC" />
                            <Text style={styles.placeholderText}>{t('challengeVerification.photo.noPhotoTaken')}</Text>
                        </View>
                    )}
                </View>

                {/* Camera Button */}
                <TouchableOpacity
                    style={[styles.cameraButton, styles.primaryButton]}
                    onPress={takePhoto}
                    disabled={isProcessing || isVerifying}
                >
                    <MaterialIcons name="camera-alt" size={20} color="white" />
                    <Text style={styles.buttonText}>{t('challengeVerification.photo.take')}</Text>
                </TouchableOpacity>

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
                    </View>
                )}

                {/* Submit Button */}
                {photoUri && !verificationResult?.isVerified && (
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (isProcessing || isVerifying) && styles.disabledButton
                        ]}
                        onPress={submitPhoto}
                        disabled={isProcessing || isVerifying || !photoUri}
                    >
                        {isProcessing || isVerifying ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <MaterialIcons name="check" size={20} color="white" />
                                <Text style={styles.submitButtonText}>{t('challengeVerification.submitVerification')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    disabled={isProcessing || isVerifying}
                >
                    <MaterialIcons name="arrow-back" size={20} color="#555" />
                    <Text style={styles.backButtonText}>{t('challengeVerification.photo.backToChallenge')}</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Processing Overlay */}
            {(isProcessing || isVerifying) && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.overlayText}>{t('challengeVerification.processing')}</Text>
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
    },
    photoContainer: {
        aspectRatio: 4/3,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 10,
        color: '#999',
        fontSize: 16,
    },
    photoPreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cameraButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    resultContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
        marginLeft: 8,
        fontSize: 14,
        flex: 1,
        color: '#333',
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
    disabledButton: {
        backgroundColor: '#A5D6A7',
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

export default PhotoVerificationScreen;