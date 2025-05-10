import React, {useState} from 'react';
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
    const { challengeId } = route.params;
    const { user } = useSelector((state: RootState) => state.auth);

    // State for verification upload
    const [proofSubmitted, setProofSubmitted] = useState(false);

    // RTK Query hooks
    const { data: challenge, isLoading, error, refetch } = useGetChallengeByIdQuery(challengeId);
    const [joinChallenge, { isLoading: isJoining }] = useJoinChallengeMutation();
    const [submitCompletion, { isLoading: isSubmitting }] = useSubmitChallengeCompletionMutation();

    // Handle join challenge
    const handleJoinChallenge = async () => {
        try {
            await joinChallenge(challengeId).unwrap();
            Alert.alert('Success', 'You have joined this challenge!');
            refetch();
        } catch (error) {
            Alert.alert('Error', 'Failed to join challenge. Please try again.');
            console.error('Join challenge error:', error);
        }
    };

    // Navigate to verification screen
    const navigateToVerification = () => {
        navigation.navigate('ChallengeVerification', { challengeId });
    };

    // Handle submit challenge completion
    const handleSubmitCompletion = async () => {
        try {
            await submitCompletion({
                id: challengeId,
                proof: { completed: true }
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
            navigation.navigate('UserProfile', { userId: challenge.creator_id });
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        return FormatterService.formatDate(dateString);
    };

    // Render quiz specific content
    const renderQuizContent = () => {
        if (!challenge || challenge.type !== 'QUIZ') return null;

        let quizConfig: { gameType: string; difficulty: any; roundCount: any; roundTime: any; teamName: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; } | null = null;
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

        const handleJoinChallenge = async () => {
            try {
                setIsJoining(true);
                await joinChallenge(challengeId).unwrap();
                Alert.alert('Success', 'You have joined this challenge!');
                refetch(); // Refresh challenge data
            } catch (error) {
                console.error('Error joining challenge:', error);
                Alert.alert('Error', 'Failed to join challenge. Please try again.');
            } finally {
                setIsJoining(false);
            }
        };

// Handler for submitting challenge completion
        const handleSubmitCompletion = async () => {
            try {
                setIsSubmitting(true);
                await submitCompletion({
                    id: challengeId,
                    proof: { completed: true }
                }).unwrap();
                setProofSubmitted(true);
                Alert.alert('Success', 'Your completion has been submitted for verification!');
                refetch(); // Refresh challenge data
            } catch (error) {
                console.error('Error submitting completion:', error);
                Alert.alert('Error', 'Failed to submit completion. Please try again.');
            } finally {
                setIsSubmitting(false);
            }
        };

// Handler for verifying challenge completions (for creators)
        const handleVerifyCompletions = () => {
            // Navigate to a verification screen or show a modal with pending completions
            if (!challenge) return;

            // Option 1: Navigate to dedicated verification screen
            navigation.navigate('VerifyCompletions', {
                challengeId: challenge.id,
                challengeTitle: challenge.title
            });

            // Option 2: Show pending completions in a modal
            /*
            // This would require additional state and components
            setPendingCompletionsVisible(true);
            fetchPendingCompletions(challenge.id);
            */
        };

// Handler for editing the challenge (for creators)
        const handleEditChallenge = () => {
            if (!challenge) return;

            // Navigate to edit challenge screen
            navigation.navigate('EditChallenge', {
                challengeId: challenge.id,
                challenge: challenge // Optionally pass the full challenge object
            });
        };

        const renderActions = () => {
            if (challenge.userIsCreator) {
                return (
                    <View style={styles.actionSection}>
                        <TouchableOpacity style={styles.editButton} onPress={handleEditChallenge}>
                            <MaterialCommunityIcons name="pencil" size={20} color="white" />
                            <Text style={styles.buttonText}>Edit Challenge</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyCompletions}>
                            <MaterialCommunityIcons name="check-all" size={20} color="white" />
                            <Text style={styles.buttonText}>Verify Completions</Text>
                        </TouchableOpacity>
                    </View>
                );
            } else if (userHasJoined) {
                return (
                    <View style={styles.actionSection}>
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitCompletion}>
                            <MaterialCommunityIcons name="check" size={20} color="white" />
                            <Text style={styles.buttonText}>Submit Completion</Text>
                        </TouchableOpacity>
                    </View>
                );
            } else {
                return (
                    <TouchableOpacity style={styles.joinButton} onPress={handleJoinChallenge}>
                        <Text style={styles.buttonText}>Join Challenge</Text>
                    </TouchableOpacity>
                );
            }
        };

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

    // Parse verification methods from challenge data
    const getVerificationMethods = () => {
        if (!challenge?.verificationMethod) return [];

        try {
            return JSON.parse(challenge.verificationMethod);
        } catch (e) {
            console.error('Error parsing verification methods:', e);
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
        if (!challenge) return {};

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



    // Render loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </SafeAreaView>
        );
    }

    // Render error state
    if (error || !challenge) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load challenge details.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Check if the user has already joined (in a real app, you'd check this)
    const userHasJoined = false; // Replace with actual check

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

                {/* Content */}
                <View style={styles.content}>
                    {/* Creator Badge */}
                    {challenge.userIsCreator && (
                        <View style={styles.creatorContainer}>
                            <MaterialCommunityIcons name="crown" size={20} color="#FFD700" />
                            <Text style={styles.creatorText}>You created this challenge</Text>
                        </View>
                    )}

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionTitle}>Challenge Description:</Text>
                        <Text style={styles.descriptionText}>{challenge.description || 'No description provided.'}</Text>
                    </View>

                    {/* Special Quiz Content */}
                    {challenge.type === 'QUIZ' && renderQuizContent()}

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
                                    {getVerificationMethods().map((method, index) => (
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
                            <View style={styles.creatorAvatar}>
                                <Text style={styles.creatorInitials}>
                                    {challenge.creator_id.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.creatorName}>User ID: {challenge.creator_id}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Role-based Action Buttons */}
                    <View style={styles.actionSection}>
                        {challenge.userIsCreator ? (
                            // Creator Actions
                            <>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={handleEditChallenge}
                                >
                                    <MaterialCommunityIcons name="pencil" size={20} color="white" />
                                    <Text style={styles.buttonText}>Edit Challenge</Text>
                                </TouchableOpacity>

                                <View style={styles.buttonSpacing} />

                                <TouchableOpacity
                                    style={styles.verifyButton}
                                    onPress={handleVerifyCompletions}
                                >
                                    <MaterialCommunityIcons name="check-all" size={20} color="white" />
                                    <Text style={styles.buttonText}>Verify Completions</Text>
                                </TouchableOpacity>
                            </>
                        ) : !userHasJoined ? (
                            // Non-joined User Actions
                            <TouchableOpacity
                                style={styles.joinButton}
                                onPress={handleJoinChallenge}
                                disabled={isJoining}
                            >
                                {isJoining ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="account-plus" size={20} color="white" />
                                        <Text style={styles.buttonText}>Join Challenge</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ) : isDailyChallenge() ? (
                            // Daily Challenge Participant Actions
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={navigateToVerification}
                            >
                                <MaterialCommunityIcons name="check-circle" size={20} color="white" />
                                <Text style={styles.buttonText}>Daily Check-In</Text>
                            </TouchableOpacity>
                        ) : proofSubmitted ? (
                            // Completed Challenge Participant Actions
                            <View style={styles.successMessage}>
                                <Text style={styles.successText}>Completion Submitted</Text>
                            </View>
                        ) : (
                            // Standard Challenge Participant Actions
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmitCompletion}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="check" size={20} color="white" />
                                        <Text style={styles.buttonText}>Submit Completion</Text>
                                    </>
                                )}
                            </TouchableOpacity>
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
    section: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
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
        shadowOffset: { width: 0, height: 1 },
    },
    creatorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    creatorAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    creatorInitials: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    creatorName: {
        fontSize: 16,
        color: '#333',
    },
    actionSection: {
        marginTop: 8,
        marginBottom: 24,
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
        shadowOffset: { width: 0, height: 1 },
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
    creatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        padding: 12,
        borderRadius: 8,
        marginVertical: 12,
    },
    creatorText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF9800',
        marginLeft: 8,
    },
    editButton: {
        backgroundColor: '#FF9800',
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    joinButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    submitButton: {
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
});

export default ChallengeDetailsScreen;