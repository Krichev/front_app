import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';
import { ParsedQuizConfig } from '../lib/quizConfigParser';

interface QuizConfigSectionProps {
    quizConfig: ParsedQuizConfig | null;
}

export const QuizConfigSection: React.FC<QuizConfigSectionProps> = ({
    quizConfig,
}) => {
    if (!quizConfig) return null;

    const isWWWQuiz = quizConfig.gameType === 'WWW';

    return (
        <View style={styles.quizContainer}>
            <Text style={styles.quizTitle}>Quiz Challenge</Text>

            <View style={styles.quizDetails}>
                {isWWWQuiz ? (
                    <>
                        <View style={styles.quizRow}>
                            <Text style={styles.quizLabel}>Game Type:</Text>
                            <Text style={styles.quizValue}>{quizConfig.gameType || 'Quiz'}</Text>
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
                    <View style={styles.quizRow}>
                        <Text style={styles.quizLabel}>Game Type:</Text>
                        <Text style={styles.quizValue}>{quizConfig.gameType || 'Standard Quiz'}</Text>
                    </View>
                )}
            </View>
        </View>
    );
};
