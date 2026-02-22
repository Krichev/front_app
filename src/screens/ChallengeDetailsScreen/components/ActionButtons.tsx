import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from '../styles';

interface ActionButtonsProps {
    challengeId: string;
    isQuizType: boolean;
    userIsCreator: boolean;
    hasUserJoined: boolean;
    isStartingQuiz: boolean;
    isJoining: boolean;
    isSubmitting: boolean;
    proofSubmitted: boolean;
    onStartQuiz: () => void;
    onJoin: () => void;
    onNavigateToVerification: () => void;
    onSubmitCompletion: () => void;
    onShowInviteModal: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
    isQuizType,
    userIsCreator,
    hasUserJoined,
    isStartingQuiz,
    isJoining,
    isSubmitting,
    proofSubmitted,
    onStartQuiz,
    onJoin,
    onNavigateToVerification,
    onSubmitCompletion,
    onShowInviteModal,
}) => {
    return (
        <View style={styles.actionSection}>
            {userIsCreator && (
                <TouchableOpacity
                    style={[styles.button, styles.secondaryButton, { marginBottom: 12 }]}
                    onPress={onShowInviteModal}
                >
                    <MaterialCommunityIcons name="email-plus" size={24} color="white"/>
                    <Text style={styles.buttonText}>Invite Players</Text>
                </TouchableOpacity>
            )}

            {isQuizType ? (
                // Quiz-specific button
                <TouchableOpacity
                    style={[styles.button, styles.primaryButton, isStartingQuiz && styles.buttonDisabled]}
                    onPress={onStartQuiz}
                    disabled={isStartingQuiz}
                >
                    {isStartingQuiz ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="play-circle" size={24} color="white"/>
                            <Text style={styles.buttonText}>Start Quiz</Text>
                        </>
                    )}
                </TouchableOpacity>
            ) : (
                // Regular challenge buttons
                <>
                    {!hasUserJoined && !userIsCreator && (
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={onJoin}
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

                    {(hasUserJoined || userIsCreator) && (
                        <>
                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton]}
                                onPress={onNavigateToVerification}
                            >
                                <MaterialCommunityIcons name="camera" size={24} color="white"/>
                                <Text style={styles.buttonText}>Submit Proof</Text>
                            </TouchableOpacity>

                            {!proofSubmitted && (
                                <TouchableOpacity
                                    style={[styles.button, styles.successButton]}
                                    onPress={onSubmitCompletion}
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
    );
};
