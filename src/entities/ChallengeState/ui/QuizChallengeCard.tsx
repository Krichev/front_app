// src/entities/ChallengeState/ui/QuizChallengeCard.tsx
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {FormatterService} from '../../../services/verification/ui/Services';
import {ApiChallenge} from "../model/slice/challengeApi.ts";
import {isWWWQuiz, parseQuizConfig} from "../model/types";

interface QuizChallengeCardProps {
    challenge: ApiChallenge;
    onPress: () => void;
}

// Define valid challenge status types
type ChallengeStatus = 'active' | 'completed' | 'failed' | 'open' | 'in_progress';

const QuizChallengeCard: React.FC<QuizChallengeCardProps> = ({ challenge, onPress }) => {
    const navigation = useNavigation();

    // Parse quiz configuration using our new helper function
    const quizConfig = parseQuizConfig(challenge.quizConfig);
    const isWWW = isWWWQuiz(quizConfig);

    const getQuizIcon = () => {
        if (isWWW) {
            return 'brain';
        }
        return 'help-circle';
    };

    const getQuizTypeLabel = () => {
        if (isWWW) {
            return 'What? Where? When?';
        }
        return 'Quiz';
    };

    const renderQuizDetails = () => {
        if (!quizConfig) return null;

        return (
            <View style={styles.quizDetails}>
                {isWWW && quizConfig.difficulty && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{quizConfig.difficulty}</Text>
                    </View>
                )}

                {isWWW && quizConfig.roundCount && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{quizConfig.roundCount} Questions</Text>
                    </View>
                )}

                {isWWW && quizConfig.teamBased && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Team</Text>
                    </View>
                )}
            </View>
        );
    };

    // Get the status style in a type-safe way
    const getStatusStyle = () => {
        const normalizedStatus = challenge.status.toLowerCase();

        // Use specific status checks instead of dynamic property access
        switch (normalizedStatus) {
            case 'active':
                return styles.status_active;
            case 'completed':
                return styles.status_completed;
            case 'failed':
                return styles.status_failed;
            case 'open':
                return styles.status_open;
            case 'in_progress':
                return styles.status_in_progress;
            default:
                return {}; // Default empty style
        }
    };

    const renderCreatorBadge = () => {
        if (challenge.userIsCreator) {
            return (
                <View style={styles.creatorBadge}>
                    <MaterialCommunityIcons name="crown" size={12} color="#FFD700" />
                    <Text style={styles.creatorBadgeText}>Creator</Text>
                </View>
            );
        }
        return null;
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                    name={getQuizIcon()}
                    size={28}
                    color="#4CAF50"
                />
            </View>

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{challenge.title}</Text>
                    {challenge.userIsCreator && (
                        <View style={styles.creatorBadge}>
                            <MaterialCommunityIcons name="crown" size={12} color="#FFD700" />
                            <Text style={styles.creatorBadgeText}>Creator</Text>
                        </View>
                    )}
                </View>

                <View style={styles.typeContainer}>
                    <Text style={styles.typeLabel}>{getQuizTypeLabel()}</Text>
                    <Text style={styles.date}>
                        {challenge.created_at ? FormatterService.formatDate(challenge.created_at) : ''}
                    </Text>
                </View>

                {renderQuizDetails()}

                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, getStatusStyle()]}>
                        <Text style={styles.statusText}>{challenge.status.toUpperCase()}</Text>
                    </View>

                    {challenge.reward && (
                        <Text style={styles.rewards}>Reward: {challenge.reward}</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    typeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    typeLabel: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
    date: {
        fontSize: 12,
        color: '#888',
    },
    quizDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    badge: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 8,
        marginBottom: 4,
    },
    badgeText: {
        fontSize: 12,
        color: '#555',
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
    },
    status_active: {
        backgroundColor: '#E8F5E9',
    },
    status_completed: {
        backgroundColor: '#E3F2FD',
    },
    status_failed: {
        backgroundColor: '#FFEBEE',
    },
    status_open: {
        backgroundColor: '#E8F5E9', // Same as active
    },
    status_in_progress: {
        backgroundColor: '#FFF9C4', // Yellow-ish for in progress
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#555',
    },
    rewards: {
        fontSize: 12,
        color: '#555',
    },

    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    creatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9C4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    creatorBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FF9800',
        marginLeft: 4,
    },
});

export default QuizChallengeCard;