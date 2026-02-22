import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles';
import { ParsedQuizConfig } from '../lib/quizConfigParser';

interface QuizConfigSectionProps {
    quizConfig: ParsedQuizConfig | null;
}

export const QuizConfigSection: React.FC<QuizConfigSectionProps> = ({
    quizConfig,
}) => {
    const { t } = useTranslation();

    if (!quizConfig) return null;

    const isWWWQuiz = quizConfig.gameType === 'WWW';

    return (
        <View style={styles.quizContainer}>
            <Text style={styles.quizTitle}>{t('challengeDetails.quiz.title')}</Text>

            <View style={styles.quizDetails}>
                {isWWWQuiz ? (
                    <>
                        <View style={styles.quizRow}>
                            <Text style={styles.quizLabel}>{t('challengeDetails.quiz.gameType')}</Text>
                            <Text style={styles.quizValue}>{quizConfig.gameType || t('challengeDetails.quiz.quiz')}</Text>
                        </View>
                        <View style={styles.quizRow}>
                            <Text style={styles.quizLabel}>{t('challengeDetails.quiz.difficulty')}</Text>
                            <Text style={styles.quizValue}>{quizConfig.difficulty || t('challengeDetails.quiz.medium')}</Text>
                        </View>
                        <View style={styles.quizRow}>
                            <Text style={styles.quizLabel}>{t('challengeDetails.quiz.rounds')}</Text>
                            <Text style={styles.quizValue}>{quizConfig.roundCount || 5}</Text>
                        </View>
                        <View style={styles.quizRow}>
                            <Text style={styles.quizLabel}>{t('challengeDetails.quiz.timePerRound')}</Text>
                            <Text style={styles.quizValue}>{t('common.seconds', { count: quizConfig.roundTime || 30 })}</Text>
                        </View>
                        {quizConfig.teamName && (
                            <View style={styles.quizRow}>
                                <Text style={styles.quizLabel}>{t('challengeDetails.quiz.team')}</Text>
                                <Text style={styles.quizValue}>{quizConfig.teamName}</Text>
                            </View>
                        )}
                    </>
                ) : (
                    <View style={styles.quizRow}>
                        <Text style={styles.quizLabel}>{t('challengeDetails.quiz.gameType')}</Text>
                        <Text style={styles.quizValue}>{quizConfig.gameType || t('challengeDetails.quiz.standardQuiz')}</Text>
                    </View>
                )}
            </View>
        </View>
    );
};
