import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { QuizQuestion } from '../../../entities/QuizState/model/slice/quizApi';
import { themeStyles as styles } from '../styles';
import { APIDifficulty } from '../../../services/wwwGame/questionService';
import { useTheme } from '../../../shared/ui/theme';

interface QuestionListItemProps {
    question: QuizQuestion;
    isSelected: boolean;
    onToggleSelect: () => void;
    onDifficultyChange: (newDifficulty: APIDifficulty) => void;
}

const QuestionListItemComponent: React.FC<QuestionListItemProps> = ({ 
    question, 
    isSelected, 
    onToggleSelect, 
    onDifficultyChange 
}) => {
    const { colors } = useTheme();

    const getDifficultyColor = (difficulty?: string) => {
        switch (difficulty?.toUpperCase()) {
            case 'EASY':
                return colors.success.main;
            case 'MEDIUM':
                return colors.warning.main;
            case 'HARD':
                return colors.error.main;
            default:
                return colors.neutral.gray[500];
        }
    };

    const showDifficultySelection = () => {
        Alert.alert(
            'Set Difficulty',
            'Choose difficulty level for this question:',
            [
                { text: 'Easy', onPress: () => onDifficultyChange('EASY') },
                { text: 'Medium', onPress: () => onDifficultyChange('MEDIUM') },
                { text: 'Hard', onPress: () => onDifficultyChange('HARD') },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const showQuestionDetails = () => {
        Alert.alert(
            'Question Details',
            `Q: ${question.question}\n\nA: ${question.answer}${question.additionalInfo ? `\n\nAdditional Info: ${question.additionalInfo}` : ''}${question.source ? `\n\nSource: ${question.source}` : ''}`,
            [
                { text: 'Close' },
                { text: question.difficulty || 'Set Difficulty', onPress: showDifficultySelection }
            ]
        );
    };

    return (
        <TouchableOpacity
            style={[styles.questionItem, isSelected && styles.selectedItem]}
            onPress={onToggleSelect}
            onLongPress={showQuestionDetails}
        >
            <View style={styles.questionHeader}>
                <Text style={[
                    styles.questionDifficulty, 
                    { color: 'white', backgroundColor: getDifficultyColor(question.difficulty) }
                ]}>
                    {question.difficulty || 'Medium'}
                </Text>
                {question.topic && <Text style={styles.questionTopic}>{question.topic}</Text>}
            </View>

            <Text style={styles.questionText} numberOfLines={3}>{question.question}</Text>

            <View style={styles.questionFooter}>
                <Text style={styles.answerPreview}>
                    Answer: {isSelected ? question.answer : question.answer.slice(0, 5) + '...'}
                </Text>

                <TouchableOpacity
                    style={styles.selectButton}
                    onPress={onToggleSelect}
                >
                    <Text style={styles.selectButtonText}>
                        {isSelected ? 'Deselect' : 'Select'}
                    </Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

export const QuestionListItem = memo(QuestionListItemComponent);
