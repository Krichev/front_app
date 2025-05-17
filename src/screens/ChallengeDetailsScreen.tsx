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
                        onPress: () =>  navigateToTab(navigation, 'Challenges')
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
            await joinChallenge(challengeId).unwrap();
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
        navigation.navigate('ChallengeVerification', {challengeId});
    };

    // Handle submit challenge completion
    const handleSubmitCompletion = async () => {
        if (!challengeId) {
            Alert.alert('Error', 'Challenge ID not found');
            return;
        }
        try {
            await submitCompletion({
                id: challengeId,
                proof: {completed: true}
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
            navigation.navigate('UserProfile', {userId: challenge.creator_id});
        } else {
            Alert.alert('Error', 'Creator information is not available');
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        return FormatterService.formatDate(dateString);
    };

    // Render quiz specific content
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

        // Check if this is a What? Where? When? quiz
        const isWWWQuiz = quizConfig && quizConfig.gameType === 'WWW';

        return (
            <View style={styles.quizContainer}>
                <Text style={styles.quizTitle}>Quiz Challenge</Text>

                {quizConfig && (
                    <View style={styles.quizDetails}>
                        {isWWWQuiz ? (
                            <>
                                <Text style={styles.quizType}>What? Where? When? Team Quiz</Text>

                                <View style={styles.quizStat}>
                                    <Text style={styles.quizStatLabel}>Difficulty:</Text>
                                    <Text style={styles.quizStatValue}>{quizConfig.difficulty || 'Medium'}</Text>
                                </View>

                                <View style={styles.quizStat}>
                                    <Text style={styles.quizStatLabel}>Questions:</Text>
                                    <Text style={styles.quizStatValue}>{quizConfig.roundCount || 10}</Text>
                                </View>

                                <View style={styles.quizStat}>
                                    <Text style={styles.quizStatLabel}>Time per question:</Text>
                                    <Text style={styles.quizStatValue}>{quizConfig.roundTime || 60} seconds</Text>
                                </View>

                                {quizConfig.teamName && (
                                    <View style={styles.quizStat}>
                                        <Text style={styles.quizStatLabel}>Team:</Text>
                                        <Text style={styles.quizStatValue}>{quizConfig.teamName}</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.playButton}
                                    onPress={() => startWWWGame(quizConfig)}
                                >
                                    <Text style={styles.playButtonText}>Play Quiz Game</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.quizType}>Standard Quiz</Text>
                                {/* Render standard quiz details */}
                                <TouchableOpacity style={styles.playButton}>
                                    <Text style={styles.playButtonText}>Start Quiz</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </View>
        );
    };

    // Start the WWW game
    const startWWWGame = (quizConfig: any) => {
        // Navigate to the WWW game screen with the config
        navigation.navigate('WWWGamePlay', {
            teamName: quizConfig.teamName || 'Team Intellect',
            teamMembers: quizConfig.teamMembers || [user?.name || 'Player'],
            difficulty: quizConfig.difficulty || 'Medium',
            roundTime: quizConfig.roundTime || 60,
            roundCount: quizConfig.roundCount || 10,
            enableAIHost: quizConfig.enableAIHost !== false,
            challengeId: challenge?.id // Pass the challenge ID to track completion
        });
    };

    // Parse verification methods from challenge data with better error handling
    const getVerificationMethods = () => {
        if (!challenge?.verificationMethod) return [];

        try {
            // If it's already an object, return it
            if (typeof challenge.verificationMethod === 'object') {
                return Array.isArray(challenge.verificationMethod)
                    ? challenge.verificationMethod
                    : [challenge.verificationMethod];
            }

            // If it's a string, try to parse it as JSON
            if (typeof challenge.verificationMethod === 'string') {
                // Check if it starts with [ or { (likely JSON)
                if (challenge.verificationMethod.trim().startsWith('[') ||
                    challenge.verificationMethod.trim().startsWith('{')) {
                    return JSON.parse(challenge.verificationMethod);
                } else {
                    // It's a plain string, wrap it in an object
                    return [{
                        type: challenge.verificationMethod,
                        details: {}
                    }];
                }
            }

            return [];
        } catch (e) {
            console.error('Error parsing verification methods:', e);
            console.log('Raw verificationMethod value:', challenge.verificationMethod);

            // Fallback: try to create a basic verification method from the string
            if (typeof challenge.verificationMethod === 'string') {
                return [{
                    type: challenge.verificationMethod,
                    details: {}
                }];
            }

            return [];
        }
    };

    // Check if the challenge has verification methods
    const hasVerificationMethods = () => {
        const methods = getVerificationMethods();
        return methods.length > 0;
    };

    // Check if this is a daily challenge that requires regular verification
    const isDailyChallenge = () => {
        return challenge?.type === 'HABIT_BUILDING' || challenge?.frequency === 'DAILY';
    };

    // Get status badge style
    const getStatusBadgeStyle = () => {
        if (!challenge || !challenge.status) return {};

        switch (challenge.status.toLowerCase()) {
            case 'active':
                return styles.statusActive;
            case 'completed':
                return styles.statusCompleted;
            case 'failed':
                return styles.statusFailed;
            default:
                return {};
        }
    };

    const getCreatorInitial = (creatorId?: string | null): string => {
        if (!creatorId) return '?';
        return creatorId.charAt(0).toUpperCase();
    };

    // Enhanced user has joined check with multiple fallbacks
    const userHasJoined = () => {
        if (!challenge || !user) {
            console.log('No challenge or user data');
            return false;
        }

        // Method 1: Check userIsCreator flag (creator is automatically "joined")
        if (challenge.userIsCreator) {
            console.log('User is creator, treating as joined');
            return true;
        }

        // Method 2: Check if user ID matches creator ID
        if (challenge.creator_id === user.id) {
            console.log('User ID matches creator ID');
            return true;
        }

        // Method 3: Check participants array
        if (challenge.participants) {
            // Handle array of participants
            if (Array.isArray(challenge.participants)) {
                const isInParticipants = challenge.participants.includes(user.id);
                console.log('Checking participants array:', isInParticipants);
                return isInParticipants;
            }

            // Handle string of participants (comma-separated)
            if (typeof challenge.participants === 'string') {
                const participantsList = challenge.participants.split(',').map(p => p.trim());
                const isInStringList = participantsList.includes(user.id);
                console.log('Checking participants as string:', isInStringList);
                return isInStringList;
            }

            // Handle single participant as string
            if (challenge.participants === user.id) {
                console.log('Single participant matches user ID');
                return true;
            }
        }

        console.log('User has not joined the challenge');
        return false;
    };

    // Render loading state
    if (!challengeId) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>Challenge ID not found</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() =>  navigateToTab(navigation, 'Challenges')}
                >
                    <Text style={styles.retryButtonText}>Back to Challenges</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Render loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50"/>
            </SafeAreaView>
        );
    }

    // Render error state
    if (error || !challenge) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>
                    Failed to load challenge details. {error ? `Error: ${JSON.stringify(error)}` : ''}
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const hasUserJoined = userHasJoined();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {/* Challenge Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{challenge.title}</Text>
                    <View style={styles.badgeContainer}>
                        <View style={styles.typeBadge}>
                            <Text style={styles.badgeText}>{challenge.type}</Text>
                        </View>
                        <View style={[styles.statusBadge, getStatusBadgeStyle()]}>
                            <Text style={styles.badgeText}>{challenge.status}</Text>
                        </View>
                    </View>
                </View>

                {/* Challenge Details */}
                <View style={styles.content}>
                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionTitle}>Challenge Description:</Text>
                        <Text
                            style={styles.descriptionText}>{challenge.description || 'No description provided.'}</Text>
                    </View>

                    {/* Special Quiz Content */}
                    {challenge.type === 'QUIZ' && renderQuizContent()}

                    {/* Debug Info - Remove in production */}
                    <View style={styles.debugContainer}>
                        <Text style={styles.debugTitle}>Debug Info:</Text>
                        <Text style={styles.debugText}>User ID: {user?.id}</Text>
                        <Text style={styles.debugText}>Creator ID: {challenge.creator_id}</Text>
                        <Text style={styles.debugText}>User is creator: {challenge.userIsCreator ? 'Yes' : 'No'}</Text>
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
                                                {method.type.charAt(0) + method.type.slice(1).toLowerCase()}
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

                    {/* Action Buttons - Only show if not a quiz type or if quiz doesn't have game config */}
                    {(challenge.type !== 'QUIZ' || !challenge.quizConfig) && (
                        <View style={styles.actionSection}>
                            {!hasUserJoined ? (
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleJoinChallenge}
                                    disabled={isJoining}
                                >
                                    {isJoining ? (
                                        <ActivityIndicator size="small" color="white"/>
                                    ) : (
                                        <Text style={styles.buttonText}>Join Challenge</Text>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                // Show different content when user has joined
                                <View style={styles.joinedSection}>
                                    <Text style={styles.joinedText}>✓ You have joined this challenge</Text>

                                    {/* For daily challenges, show the verification button */}
                                    {isDailyChallenge() ? (
                                        <TouchableOpacity
                                            style={styles.verifyButton}
                                            onPress={navigateToVerification}
                                        >
                                            <MaterialCommunityIcons name="check-circle" size={20} color="white"/>
                                            <Text style={styles.buttonText}>Daily Check-In</Text>
                                        </TouchableOpacity>
                                    ) : proofSubmitted ? (
                                        <View style={styles.successMessage}>
                                            <Text style={styles.successText}>Completion Submitted</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.secondaryButton}
                                            onPress={handleSubmitCompletion}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <ActivityIndicator size="small" color="white"/>
                                            ) : (
                                                <>
                                                    <MaterialCommunityIcons name="check" size={20} color="white"/>
                                                    <Text style={styles.buttonText}>Submit Completion</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        marginBottom: 16,
    },
    retryButton: {
        padding: 10,
        backgroundColor: '#4CAF50',
        borderRadius: 4,
        marginBottom: 8,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    header: {
        padding: 16,
        backgroundColor: '#4CAF50',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    badgeContainer: {
        flexDirection: 'row',
    },
    typeBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 8,
    },
    statusBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
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
    },
    verificationBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 4,
    },
    verificationText: {
        color: '#1976D2',
        fontSize: 12,
        fontWeight: '600',
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
        color: '#333',
    },
    actionSection: {
        marginTop: 8,
        marginBottom: 24,
    },
    joinedSection: {
        alignItems: 'center',
    },
    joinedText: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginBottom: 16,
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    secondaryButton: {
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    verifyButton: {
        backgroundColor: '#FF9800',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    successMessage: {
        backgroundColor: '#4CAD50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    successText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 6,
    },
    quizType: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4CAF50',
        marginBottom: 12,
    },
    quizStat: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    quizStatLabel: {
        fontSize: 14,
        color: '#555',
    },
    quizStatValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    playButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    playButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ChallengeDetailsScreen;