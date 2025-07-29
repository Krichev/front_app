// src/entities/challenge/ui/challenge-card.tsx
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Badge, CustomCard} from '../../../shared/ui';
import {theme} from '../../../shared/config';
import {ChallengeStatusBadge} from './challenge-status-badge';
import {Challenge} from "../model/types.ts";
import {CustomIcon} from "../../../shared/components/Icon/CustomIcon.tsx";

interface ChallengeCardProps {
    challenge: Challenge;
    onPress?: () => void;
    onJoin?: () => void; // Add the missing onJoin prop
    showCreatorBadge?: boolean;
    showProgress?: boolean;
    style?: any; // Add style prop
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
                                                                challenge,
                                                                onPress,
                                                                onJoin, // Add onJoin to destructuring
                                                                showCreatorBadge = true,
                                                                showProgress = true,
                                                                style, // Add style to destructuring
                                                            }) => {
    const getTypeIcon = () => {
        switch (challenge.type) {
            case 'QUEST': return 'trophy';
            case 'QUIZ': return 'help-circle';
            case 'ACTIVITY_PARTNER': return 'account-group';
            case 'FITNESS_TRACKING': return 'run';
            case 'HABIT_BUILDING': return 'calendar-check';
            default: return 'star';
        }
    };

    const getTypeColor = () => {
        switch (challenge.type) {
            case 'QUEST': return '#FF9800';
            case 'QUIZ': return '#4CAF50';
            case 'ACTIVITY_PARTNER': return '#2196F3';
            case 'FITNESS_TRACKING': return '#F44336';
            case 'HABIT_BUILDING': return '#9C27B0';
            default: return theme.colors.primary;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Check if user has already joined the challenge
    const hasJoined = challenge.participants && challenge.participants.includes('current_user_id'); // You might need to get current user ID from context/store
    const isCreator = challenge.userIsCreator || false; // Safely handle userIsCreator

    const CardContent = () => (
        <CustomCard style={[styles.card, style]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${getTypeColor()}20` }]}>
                    <CustomIcon
                        name={getTypeIcon()}
                        size={24}
                        color={getTypeColor()}
                    />
                </View>

                <View style={styles.headerContent}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={1}>
                            {challenge.title}
                        </Text>
                        {showCreatorBadge && isCreator && (
                            <Badge text="Creator" variant="primary" size="sm" />
                        )}
                    </View>

                    <View style={styles.metaRow}>
                        <ChallengeStatusBadge status={challenge.status} />
                        <Text style={styles.type}>{challenge.type.replace('_', ' ')}</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>
                {challenge.description}
            </Text>

            {showProgress && (
                <View style={styles.progressSection}>
                    <View style={styles.progressInfo}>
                        <Text style={styles.progressLabel}>
                            Participants: {Array.isArray(challenge.participants) ? challenge.participants.length : 0}
                        </Text>
                        {challenge.endDate && (
                            <Text style={styles.progressLabel}>
                                Ends: {formatDate(challenge.endDate)}
                            </Text>
                        )}
                    </View>
                </View>
            )}

            {/* Action buttons */}
            <View style={styles.actionRow}>
                {onPress && (
                    <TouchableOpacity style={styles.viewButton} onPress={onPress}>
                        <Text style={styles.viewButtonText}>View Details</Text>
                    </TouchableOpacity>
                )}

                {onJoin && !isCreator && !hasJoined && (
                    <TouchableOpacity style={styles.joinButton} onPress={onJoin}>
                        <Text style={styles.joinButtonText}>Join Challenge</Text>
                    </TouchableOpacity>
                )}

                {hasJoined && !isCreator && (
                    <View style={styles.joinedIndicator}>
                        <CustomIcon name="check-circle" size={16} color="#4CAF50" />
                        <Text style={styles.joinedText}>Joined</Text>
                    </View>
                )}
            </View>
        </CustomCard>
    );

    return onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <CardContent />
        </TouchableOpacity>
    ) : (
        <CardContent />
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 16,
        marginVertical: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.primary,
        flex: 1,
        marginRight: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    type: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textTransform: 'capitalize',
    },
    description: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    progressSection: {
        marginBottom: 16,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressLabel: {
        fontSize: 12,
        color: theme.colors.text.disabled, // Using 'disabled' instead of 'tertiary'
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    viewButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        alignItems: 'center',
    },
    viewButtonText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    joinButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
    },
    joinButtonText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    joinedIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    joinedText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
});