// src/screens/ChallengeDetailsScreen.tsx
import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {
    useGetChallengeByIdQuery,
    useJoinChallengeMutation,
    useSubmitChallengeCompletionMutation,
} from '../entities/ChallengeState/model/slice/challengeApi';
import {NativeStackNavigationProp} from "@react-navigation/native-stack";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import {FormatterService} from '../services/verification/ui/Services';
import {navigateToTab} from "../utils/navigation.ts";
import {QuestionService} from "../services/wwwGame";

// Define the types for the navigation parameters
type RootStackParamList = {
    Home: undefined;
    Challenges: undefined;
    ChallengeDetails: { challengeId: string };
    ChallengeVerification: { challengeId: string };
    CreateChallenge: undefined;
    UserProfile: { userId: string };
    WWWGamePlay: {
        teamName: string;
        teamMembers: string[];
        difficulty: string;
        roundTime: number;
        roundCount: number;
        enableAIHost: boolean;
        challengeId?: string;
    };
};

type ChallengeDetailsRouteProp = RouteProp<RootStackParamList, 'ChallengeDetails'>;
type ChallengeDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChallengeDetails'>;

const ChallengeDetailsScreen: React.FC = () => {
    const route = useRoute<ChallengeDetailsRouteProp>();
    const navigation = useNavigation<ChallengeDetailsNavigationProp>();

    // Add error handling for missing params
    const challengeId = route.params?.challengeId;
    const {user} = useSelector((state: RootState) => state.auth);

    // Handle missing challenge ID
    useEffect(() => {
        if (!challengeId) {
            Alert.alert(
                'Error',
                'Challenge ID not found. Returning to challenges list.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigateToTab(navigation, 'Challenges')
                    }
                ]
            );
        }
    }, [challengeId, navigation]);

    // State for verification upload
    const [proofSubmitted, setProofSubmitted] = useState(false);

    // RTK Query hooks - skip query if no challengeId
    const {data: challenge, isLoading, error, refetch} = useGetChallengeByIdQuery(challengeId!, {
        skip: !challengeId, // Skip the query if challengeId is undefined
    });
    const [joinChallenge, {isLoading: isJoining}] = useJoinChallengeMutation();
    const [submitCompletion, {isLoading: isSubmitting}] = useSubmitChallengeCompletionMutation();

    useEffect(() => {
        if (error) {
            console.error('Error loading challenge details:', error);
        }
    }, [error]);

    // Enhanced debug logging
    useEffect(() => {
        if (challenge && user) {
            console.log('=== Challenge Join Status Debug ===');
            console.log('Challenge ID:', challenge.id);
            console.log('User ID:', user.id);
            console.log('Challenge participants:', challenge.participants);
            console.log('Participants type:', typeof challenge.participants);
            console.log('Is participants array:', Array.isArray(challenge.participants));
            console.log('User in participants:', challenge.participants?.includes(user.id));
            console.log('UserIsCreator flag:', challenge.userIsCreator);
            console.log('Creator ID:', challenge.creator_id);
            console.log('Verification Method (raw):', challenge.verificationMethod);
            console.log('Verification Method type:', typeof challenge.verificationMethod);
            console.log('===================================');
        }
    }, [challenge, user]);

    // Handle join challenge
    const handleJoinChallenge = async () => {
        if (!challengeId) {
            Alert.alert('Error', 'Challenge ID not found');
            return;
        }
        try {
            await joinChallenge({challengeId: challengeId}).unwrap();
            Alert.alert('Success', 'You have joined this challenge!');
            // Force refetch to get updated challenge data
            await refetch();
        } catch (error) {
            Alert.alert('Error', 'Failed to join challenge. Please try again.');
            console.error('Join challenge error:', error);
        }
    };

    // Navigate to verification screen
    const navigateToVerification = () => {
        if (!challengeId) {
            Alert.alert('Error', 'Challenge ID not found');
            return;
        }
        navigation.navigate('ChallengeVerification', {challengeId: challengeId});
    };

    // Handle submit challenge completion - FIXED
    const handleSubmitCompletion = async () => {
        if (!challengeId) {
            Alert.alert('Error', 'Challenge ID not found');
            return;
        }
        try {
            await submitCompletion({
                challengeId: challengeId,  // Changed from 'id' to 'challengeId'
                completionData: {completed: true}  // Changed from 'proof' to 'completionData'
            }).unwrap();
            setProofSubmitted(true);
            Alert.alert('Success', 'Your completion has been submitted for verification!');
            refetch();
        } catch (error) {
            Alert.alert('Error', 'Failed to submit completion. Please try again.');
            console.error('Submit completion error:', error);
        }
    };

    // Handle view creator profile
    const navigateToCreatorProfile = () => {
        if (challenge?.creator_id) {
            navigation.navigate('UserProfile', {userId: String(challenge.creator_id)});
        } else {
            Alert.alert('Error', 'Creator information is not available');
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        return FormatterService.formatDate(dateString);
    };

    const renderQuizContent = () => {
        if (!challenge || challenge.type !== 'QUIZ') return null;

        let quizConfig: {
            gameType?: string;
            difficulty?: string;
            roundCount?: number;
            roundTime?: number;
            teamName?: string;
            teamMembers?: string[];
            enableAIHost?: boolean;
        } | null = null;

        try {
            // Parse quiz configuration if available
            if (challenge.quizConfig) {
                quizConfig = JSON.parse(challenge.quizConfig);
            }
        } catch (e) {
            console.error('Error parsing quiz config:', e);
        }

        // Check if this is a WWW_QUIZ quiz
        const isWWWQuiz = quizConfig && quizConfig.gameType === 'WWW';

        return (
            <View style={styles.quizContainer}>
                <Text style={styles.quizTitle}>Quiz Challenge</Text>

                {quizConfig && (
                    <View style={styles.quizDetails}>
                        {isWWWQuiz ? (
                            <>
                                <View style={styles.quizRow}>
                                    <Text style={styles.quizLabel}>Game Type:</Text>
                                    <Text style={styles.quizValue}>Who? What? Where?</Text>
                                </View>
                                <View style={styles.quizRow}>
                                    <Text style={styles.quizLabel}>Difficulty:</Text>
                                    <Text style={styles.quizValue}>{quizConfig.difficulty || 'Medium'}</Text>
                                </View>
                                <View style={styles.quizRow}>
                                    <Text style={styles.quizLabel}>Rounds:</Text>
                                    <Text style={styles.quizValue}>{quizConfig.roundCount || 5}</Text>
                                </View>
                                <View style={styles.quizRow}>
                                    <Text style={styles.quizLabel}>Time per Round:</Text>
                                    <Text style={styles.quizValue}>{quizConfig.roundTime || 30}s</Text>
                                </View>
                                {quizConfig.teamName && (
                                    <View style={styles.quizRow}>
                                        <Text style={styles.quizLabel}>Team:</Text>
                                        <Text style={styles.quizValue}>{quizConfig.teamName}</Text>
                                    </View>
                                )}
                            </>
                        ) : (
                            <Text style={styles.quizValue}>Standard Quiz</Text>
                        )}
                    </View>
                )}
            </View>
        );
    };

    // Helper function to check if verification methods array exists
    const hasVerificationMethods = () => {
        if (!challenge?.verificationMethod) return false;

        try {
            // If it's already an array
            if (Array.isArray(challenge.verificationMethod)) {
                return challenge.verificationMethod.length > 0;
            }

            // If it's a string, try to parse it
            if (typeof challenge.verificationMethod === 'string') {
                const parsed = JSON.parse(challenge.verificationMethod);
                return Array.isArray(parsed) && parsed.length > 0;
            }

            return false;
        } catch (e) {
            return false;
        }
    };

    // Helper to get verification methods safely
    const getVerificationMethods = (): any[] => {
        if (!challenge?.verificationMethod) return [];

        try {
            // If it's already an array
            if (Array.isArray(challenge.verificationMethod)) {
                return challenge.verificationMethod;
            }

            // If it's a string, try to parse it
            if (typeof challenge.verificationMethod === 'string') {
                const parsed = JSON.parse(challenge.verificationMethod);
                return Array.isArray(parsed) ? parsed : [];
            }

            return [];
        } catch (e) {
            console.error('Error parsing verification methods:', e);
            return [];
        }
    };

    // Determine if user has joined the challenge
    const hasUserJoined = (user?.id && challenge?.participants?.includes(user.id)) || challenge?.userIsCreator;

    // Loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF"/>
                    <Text style={styles.loadingText}>Loading challenge...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error || !challenge) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={64} color="#FF3B30"/>
                    <Text style={styles.errorText}>Failed to load challenge</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const handleStartQuiz = async () => {
        if (!challenge || challenge.type !== 'QUIZ') {
            Alert.alert('Error', 'This is not a quiz challenge');
            return;
        }

        let quizConfig: {
            gameType?: string;
            difficulty?: string;
            roundCount?: number;
            roundTime?: number;
            teamName?: string;
            teamMembers?: string[];
            enableAIHost?: boolean;
        } | null = null;

        try {
            if (challenge.quizConfig) {
                quizConfig = JSON.parse(challenge.quizConfig);
            }
        } catch (e) {
            console.error('Error parsing quiz config:', e);
        }

        // Check if this is a WWW quiz with game configuration
        console.log(quizConfig?.gameType);
        if (quizConfig && quizConfig.gameType === 'WWW') {
            try {
                // Use static methods directly on QuestionService
                const questions = await QuestionService.getQuestionsByDifficulty(
                    quizConfig.difficulty?.toLowerCase() as any || 'Medium',
                    quizConfig.roundCount || 5
                );

                navigation.navigate('WWWGamePlay', {
                    teamName: quizConfig.teamName || 'Team',
                    teamMembers: quizConfig.teamMembers || [],
                    difficulty: quizConfig.difficulty || 'medium',
                    roundTime: quizConfig.roundTime || 30,
                    roundCount: quizConfig.roundCount || 5,
                    enableAIHost: quizConfig.enableAIHost !== false,
                    challengeId: challengeId || undefined,
                });
            } catch (error) {
                console.error('Failed to load quiz questions:', error);
                Alert.alert('Error', 'Failed to load quiz questions. Please try again.');
            }
        } else {
            Alert.alert('Info', 'This quiz type is not yet supported');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>{challenge.title}</Text>

                        {/* Type and Status Badges */}
                        <View style={styles.badgeContainer}>
                            <View style={styles.typeBadge}>
                                <Text style={styles.badgeText}>{challenge.type}</Text>
                            </View>
                            {challenge.status && (
                                <View style={[
                                    styles.statusBadge,
                                    challenge.status === 'ACTIVE' && styles.statusActive,
                                    challenge.status === 'COMPLETED' && styles.statusCompleted,
                                    challenge.status === 'FAILED' && styles.statusFailed,
                                ]}>
                                    <Text style={styles.badgeText}>{challenge.status}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Description */}
                    {challenge.description && (
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.descriptionTitle}>Description</Text>
                            <Text style={styles.descriptionText}>{challenge.description}</Text>
                        </View>
                    )}

                    {/* Debug Container - Remove this in production */}
                    <View style={styles.debugContainer}>
                        <Text style={styles.debugTitle}>Debug Info</Text>
                        <Text style={styles.debugText}>Is Creator: {challenge.userIsCreator ? 'Yes' : 'No'}</Text>
                        <Text style={styles.debugText}>Has joined: {hasUserJoined ? 'Yes' : 'No'}</Text>
                        <Text style={styles.debugText}>Participants: {JSON.stringify(challenge.participants)}</Text>
                    </View>

                    {/* Challenge Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Challenge Info</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Created</Text>
                            <Text style={styles.infoValue}>{formatDate(challenge.created_at)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Visibility</Text>
                            <Text style={styles.infoValue}>{challenge.visibility}</Text>
                        </View>
                        {challenge.reward && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Reward</Text>
                                <Text style={styles.infoValue}>{challenge.reward}</Text>
                            </View>
                        )}
                        {challenge.penalty && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Penalty</Text>
                                <Text style={styles.infoValue}>{challenge.penalty}</Text>
                            </View>
                        )}

                        {/* Show verification methods if available */}
                        {hasVerificationMethods() && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Verification</Text>
                                <View style={styles.verificationMethods}>
                                    {getVerificationMethods().map((method: any, index: number) => (
                                        <View key={index} style={styles.verificationBadge}>
                                            <Text style={styles.verificationText}>
                                                {method?.type ? method.type.charAt(0) + method.type.slice(1).toLowerCase() : 'Unknown'}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {challenge.targetGroup && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Group</Text>
                                <Text style={styles.infoValue}>{challenge.targetGroup}</Text>
                            </View>
                        )}
                    </View>

                    {/* Creator Info */}
                    <TouchableOpacity style={styles.creatorSection} onPress={navigateToCreatorProfile}>
                        <Text style={styles.sectionTitle}>Created By</Text>
                        <View style={styles.creatorInfo}>
                            <Text style={styles.creatorName}>
                                {challenge?.creator_id ? `User ID: ${challenge.creator_id}` : 'Unknown Creator'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Render Quiz Content if applicable */}
                    {renderQuizContent()}

                    {/* Action Buttons - Only show if not a quiz type or if quiz doesn't have game config */}
                    <View style={styles.actionSection}>
                        {challenge.type === 'QUIZ' ? (
                            // Quiz-specific button
                            <TouchableOpacity
                                style={[styles.button, styles.primaryButton]}
                                onPress={handleStartQuiz}
                            >
                                <MaterialCommunityIcons name="play-circle" size={24} color="white"/>
                                <Text style={styles.buttonText}>Start Quiz</Text>
                            </TouchableOpacity>
                        ) : (
                            // Regular challenge buttons
                            <>
                                {!hasUserJoined && !challenge.userIsCreator && (
                                    <TouchableOpacity
                                        style={[styles.button, styles.primaryButton]}
                                        onPress={handleJoinChallenge}
                                        disabled={isJoining}
                                    >
                                        {isJoining ? (
                                            <ActivityIndicator color="white"/>
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons name="account-plus" size={24} color="white"/>
                                                <Text style={styles.buttonText}>Join Challenge</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}

                                {(hasUserJoined || challenge.userIsCreator) && (
                                    <>
                                        <TouchableOpacity
                                            style={[styles.button, styles.secondaryButton]}
                                            onPress={navigateToVerification}
                                        >
                                            <MaterialCommunityIcons name="camera" size={24} color="white"/>
                                            <Text style={styles.buttonText}>Submit Proof</Text>
                                        </TouchableOpacity>

                                        {!proofSubmitted && (
                                            <TouchableOpacity
                                                style={[styles.button, styles.successButton]}
                                                onPress={handleSubmitCompletion}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <ActivityIndicator color="white"/>
                                                ) : (
                                                    <>
                                                        <MaterialCommunityIcons name="check-circle" size={24}
                                                                                color="white"/>
                                                        <Text style={styles.buttonText}>Mark as Complete</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#666',
        marginTop: 16,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        backgroundColor: '#007AFF',
        padding: 20,
        paddingTop: 16,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12,
    },
    badgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusActive: {
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
    },
    statusCompleted: {
        backgroundColor: 'rgba(33, 150, 243, 0.7)',
    },
    statusFailed: {
        backgroundColor: 'rgba(244, 67, 54, 0.7)',
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
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
        shadowOffset: {width: 0, height: 1},
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
    debugContainer: {
        backgroundColor: '#ffe6e6',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ffcccc',
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#cc0000',
        marginBottom: 8,
    },
    debugText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: {width: 0, height: 1},
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'center',
    },
    infoLabel: {
        width: 100,
        fontSize: 14,
        color: '#757575',
        fontWeight: '500',
    },
    infoValue: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    verificationMethods: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    verificationBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    verificationText: {
        fontSize: 12,
        color: '#1976D2',
        fontWeight: '500',
    },
    creatorSection: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: {width: 0, height: 1},
    },
    creatorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    creatorName: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    quizContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: {width: 0, height: 1},
    },
    quizTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    quizDetails: {
        marginTop: 8,
    },
    quizRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    quizLabel: {
        width: 120,
        fontSize: 14,
        color: '#757575',
        fontWeight: '500',
    },
    quizValue: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    actionSection: {
        gap: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        gap: 8,
        elevation: 2,
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: {width: 0, height: 2},
    },
    primaryButton: {
        backgroundColor: '#007AFF',
    },
    secondaryButton: {
        backgroundColor: '#FF9500',
    },
    successButton: {
        backgroundColor: '#34C759',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ChallengeDetailsScreen;