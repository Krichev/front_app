// src/entities/ChallengeState/ui/QuizChallengeCard.tsx
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {FormatterService} from '../../../services/verification/ui/Services';
import {Challenge} from "../model/slice/challengeApi.ts";

interface QuizChallengeCardProps {
    challenge: Challenge;
    onPress: () => void;
}

const QuizChallengeCard: React.FC<QuizChallengeCardProps> = ({ challenge, onPress }) => {
    const navigation = useNavigation();

    // Parse quiz configuration if available
    let quizConfig: { gameType: string; difficulty: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; roundCount: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; teamBased: any; } | null = null;
    let isWWWQuiz: null | boolean = false;

    try {
        if (challenge.quizConfig) {
            quizConfig = JSON.parse(challenge.quizConfig);
            isWWWQuiz = quizConfig && quizConfig.gameType === 'WWW';
        }
    } catch (e) {
        console.error('Error parsing quiz config:', e);
    }

    const getQuizIcon = () => {
        if (isWWWQuiz) {
            return 'brain';
        }
        return 'help-circle';
    };

    const getQuizTypeLabel = () => {
        if (isWWWQuiz) {
            return 'What? Where? When?';
        }
        return 'Quiz';
    };

    const renderQuizDetails = () => {
        if (!quizConfig) return null;

        return (
            <View style={styles.quizDetails}>
                {quizConfig.difficulty && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{quizConfig.difficulty}</Text>
                    </View>
                )}

                {quizConfig.roundCount && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{quizConfig.roundCount} Questions</Text>
                    </View>
                )}

                {isWWWQuiz && quizConfig.teamBased && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Team</Text>
                    </View>
                )}
            </View>
        );
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
                <Text style={styles.title}>{challenge.title}</Text>

                <View style={styles.typeContainer}>
                    <Text style={styles.typeLabel}>{getQuizTypeLabel()}</Text>
                    <Text style={styles.date}>
                        {challenge.created_at ? FormatterService.formatDate(challenge.created_at) : ''}
                    </Text>
                </View>

                {renderQuizDetails()}

                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, styles[`status_${challenge.status}`]]}>
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
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#555',
    },
    rewards: {
        fontSize: 12,
        color: '#555',
    },
});

export default QuizChallengeCard;