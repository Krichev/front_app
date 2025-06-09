// src/features/www-game-discussion/ui/AIHostPanel.tsx
import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import type {AIHostConfig, DiscussionQuestion, DiscussionState} from '../model/types';

interface AIHostPanelProps {
    question: DiscussionQuestion;
    discussion: DiscussionState;
    config: AIHostConfig;
    onConfigChange?: (config: Partial<AIHostConfig>) => void;
}

export const AIHostPanel: React.FC<AIHostPanelProps> = ({
                                                            question,
                                                            discussion,
                                                            config,
                                                            onConfigChange,
                                                        }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const getPersonalityEmoji = (personality: AIHostConfig['personality']) => {
        switch (personality) {
            case 'formal': return '🎩';
            case 'casual': return '😊';
            case 'encouraging': return '🌟';
            case 'challenging': return '🔥';
            default: return '🤖';
        }
    };

    const getHostMessage = () => {
        const { phase } = discussion;
        const personality = config.personality;

        const messages = {
            formal: {
                preparation: "Ladies and gentlemen, please prepare for your discussion.",
                discussion: "You may now begin your deliberation. Consider all aspects carefully.",
                analysis: "I am analyzing your discussion. Please wait for results.",
                answer: "Present your final answer when ready.",
                complete: "Discussion concluded. Well done."
            },
            casual: {
                preparation: "Hey team! Get ready to dive into this question! 🚀",
                discussion: "Chat it up! What are your thoughts on this one?",
                analysis: "Let me check out what you discussed... 🤔",
                answer: "Alright, what's your final answer?",
                complete: "Nice work everyone! 👏"
            },
            encouraging: {
                preparation: "You've got this! Take a moment to get ready! ✨",
                discussion: "Great thinking! Keep exploring those ideas! 💭",
                analysis: "Wonderful discussion! Let me analyze your insights... 🌟",
                answer: "You've thought this through well. What's your answer?",
                complete: "Excellent teamwork! I'm proud of your effort! 🎉"
            },
            challenging: {
                preparation: "This won't be easy. Are you ready for the challenge?",
                discussion: "Dig deeper! Don't settle for surface-level thinking! 🔍",
                analysis: "Let's see if your discussion was thorough enough...",
                answer: "Choose wisely. This is your moment of truth.",
                complete: "Interesting approach. There's always room for improvement."
            }
        };

        return messages[personality][phase] || "...";
    };

    const getHints = () => {
        if (!config.realTimeHints || discussion.phase !== 'discussion') return [];

        // Simulated hints based on question category and difficulty
        const hints = [
            `💡 This is a ${question.difficulty} level question about ${question.category}`,
            `🎯 Look for key words in the question that might guide your thinking`,
            `🤝 Make sure everyone on the team contributes their ideas`,
        ];

        if (discussion.timeRemaining <= 30) {
            hints.push('⏰ Time is running short - consider narrowing down your options');
        }

        if (discussion.notes.length < 50) {
            hints.push('📝 Try writing down your thoughts to organize them better');
        }

        return hints;
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.7}
            >
                <View style={styles.hostInfo}>
                    <Text style={styles.hostEmoji}>{getPersonalityEmoji(config.personality)}</Text>
                    <View>
                        <Text style={styles.hostTitle}>AI Host</Text>
                        <Text style={styles.hostSubtitle}>{config.personality} mode</Text>
                    </View>
                </View>

                <View style={styles.headerControls}>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => setShowSettings(true)}
                    >
                        <MaterialCommunityIcons name="cog" size={20} color="#666" />
                    </TouchableOpacity>

                    <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color="#666"
                    />
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.content}>
                    {/* Host Message */}
                    <View style={styles.messageContainer}>
                        <Text style={styles.hostMessage}>{getHostMessage()}</Text>
                    </View>

                    {/* Real-time Hints */}
                    {config.realTimeHints && (
                        <View style={styles.hintsContainer}>
                            <Text style={styles.hintsTitle}>Hints & Tips:</Text>
                            <ScrollView style={styles.hintsList} showsVerticalScrollIndicator={false}>
                                {getHints().map((hint, index) => (
                                    <View key={index} style={styles.hintItem}>
                                        <Text style={styles.hintText}>{hint}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Discussion Stats */}
                    <View style={styles.statsContainer}>
                        <Text style={styles.statsTitle}>Discussion Stats:</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{discussion.notes.split(' ').length}</Text>
                                <Text style={styles.statLabel}>Words</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {Math.max(0, question.timeLimit - discussion.timeRemaining)}s
                                </Text>
                                <Text style={styles.statLabel}>Elapsed</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{discussion.teamMembers.length}</Text>
                                <Text style={styles.statLabel}>Members</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* Settings Modal would go here */}
            {showSettings && (
                <View style={styles.settingsOverlay}>
                    <View style={styles.settingsModal}>
                        <View style={styles.settingsHeader}>
                            <Text style={styles.settingsTitle}>AI Host Settings</Text>
                            <TouchableOpacity onPress={() => setShowSettings(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.settingsContent}>
                            <Text style={styles.settingLabel}>Personality:</Text>
                            <View style={styles.personalityOptions}>
                                {['formal', 'casual', 'encouraging', 'challenging'].map((personality) => (
                                    <TouchableOpacity
                                        key={personality}
                                        style={[
                                            styles.personalityOption,
                                            config.personality === personality && styles.selectedPersonality
                                        ]}
                                        onPress={() => onConfigChange?.({ personality: personality as any })}
                                    >
                                        <Text style={styles.personalityText}>
                                            {getPersonalityEmoji(personality as any)} {personality}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    hostInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    hostEmoji: {
        fontSize: 24,
    },
    hostTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    hostSubtitle: {
        fontSize: 12,
        color: '#666',
        textTransform: 'capitalize',
    },
    headerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingsButton: {
        padding: 4,
    },
    content: {
        padding: 16,
        gap: 16,
    },
    messageContainer: {
        backgroundColor: '#e3f2fd',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#2196f3',
    },
    hostMessage: {
        fontSize: 14,
        color: '#1565c0',
        fontStyle: 'italic',
    },
    hintsContainer: {
        gap: 8,
    },
    hintsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    hintsList: {
        maxHeight: 120,
    },
    hintItem: {
        backgroundColor: '#fff3e0',
        padding: 8,
        borderRadius: 6,
        marginBottom: 4,
    },
    hintText: {
        fontSize: 13,
        color: '#e65100',
    },
    statsContainer: {
        gap: 8,
    },
    statsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4dabf7',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
    settingsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsModal: {
        backgroundColor: 'white',
        borderRadius: 12,
        margin: 20,
        maxWidth: 400,
        width: '90%',
    },
    settingsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    settingsContent: {
        padding: 16,
    },
    settingLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    personalityOptions: {
        gap: 8,
    },
    personalityOption: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectedPersonality: {
        borderColor: '#4dabf7',
        backgroundColor: '#f0f8ff',
    },
    personalityText: {
        fontSize: 14,
        color: '#333',
        textTransform: 'capitalize',
    },
});