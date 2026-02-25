import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles';

interface ActionButtonsProps {
    challengeId: string;
    isQuizType: boolean;
    userIsCreator: boolean;
    hasUserJoined: boolean;
    canReplay: boolean;
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
    canReplay,
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
    const { t } = useTranslation();

    return (
        <View style={styles.actionSection}>
            {userIsCreator && (
                <TouchableOpacity
                    style={[styles.button, styles.secondaryButton, { marginBottom: 12 }]}
                    onPress={onShowInviteModal}
                >
                    <MaterialCommunityIcons name="email-plus" size={24} color="white"/>
                    <Text style={styles.buttonText}>{t('challengeDetails.actions.invitePlayers')}</Text>
                </TouchableOpacity>
            )}

            {canReplay && (
                <TouchableOpacity
                    style={[styles.button, styles.primaryButton, { backgroundColor: '#4CAF50', marginBottom: 12 }]}
                    onPress={onStartQuiz}
                    disabled={isStartingQuiz}
                >
                    {isStartingQuiz ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="refresh" size={24} color="white"/>
                            <Text style={styles.buttonText}>Replay Quiz 🔄</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}

            {isQuizType ? (
                // Quiz-specific button (only show if not replaying or replaying is handled separately)
                !canReplay && (
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
                                <Text style={styles.buttonText}>{t('challengeDetails.actions.startQuiz')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )
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
                                    <Text style={styles.buttonText}>{t('challengeDetails.actions.joinChallenge')}</Text>
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
                                <Text style={styles.buttonText}>{t('challengeDetails.actions.submitProof')}</Text>
                            </TouchableOpacity>

                            {!proofSubmitted ? (
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
                                            <Text style={styles.buttonText}>{t('challengeDetails.actions.markAsComplete')}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.button, styles.buttonDisabled, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
                                    <MaterialCommunityIcons name="check-decagram" size={24} color="rgba(255,255,255,0.7)"/>
                                    <Text style={[styles.buttonText, { color: 'rgba(255,255,255,0.7)', marginLeft: 8 }]}>
                                        {t('challengeDetails.actions.proofSubmitted')}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </>
            )}
        </View>
    );
};
