// questApp/src/features/question-form/ui/QuestionFormFields.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { LocalizedInput } from '../../../shared/ui/LocalizedInput';
import { TopicTreeSelector } from '../../../shared/ui/TopicSelector';
import { QuestionVisibility, getVisibilityLabel, getVisibilityDescription } from '../../../entities/QuizState/model/types/question.types';
import { getVisibilityIcon } from '../../../entities/ChallengeState/model/types';
import { LocalizedString } from '../../../shared/types/localized';
import { SelectableTopic } from '../../../entities/TopicState';
import { DifficultyLevel } from '../model/types';
import { DIFFICULTY_LEVELS } from '../model/constants';

interface QuestionFormFieldsProps {
    questionText: LocalizedString;
    setQuestionText: (val: LocalizedString) => void;
    answer: LocalizedString;
    setAnswer: (val: LocalizedString) => void;
    difficulty: DifficultyLevel;
    setDifficulty: (val: DifficultyLevel) => void;
    topic: string;
    selectedTopicId?: number;
    handleSelectTopic: (selectedTopic: SelectableTopic | null) => void;
    visibility: QuestionVisibility;
    setVisibility: (val: QuestionVisibility) => void;
    additionalInfo: LocalizedString;
    setAdditionalInfo: (val: LocalizedString) => void;
}

export const QuestionFormFields: React.FC<QuestionFormFieldsProps> = ({
    questionText,
    setQuestionText,
    answer,
    setAnswer,
    difficulty,
    setDifficulty,
    topic,
    selectedTopicId,
    handleSelectTopic,
    visibility,
    setVisibility,
    additionalInfo,
    setAdditionalInfo
}) => {
    const { t } = useTranslation();

    return (
        <View>
            <View style={styles.formGroup}>
                <LocalizedInput
                    label={t('userQuestions.questionRequired')}
                    value={questionText}
                    onChangeLocalized={setQuestionText}
                    placeholder={{
                        en: t('mediaQuestion.questionPlaceholder'),
                        ru: t('mediaQuestion.questionPlaceholder'),
                    }}
                    multiline
                    numberOfLines={3}
                    required
                />
            </View>

            <View style={styles.formGroup}>
                <LocalizedInput
                    label={t('userQuestions.answerRequired')}
                    value={answer}
                    onChangeLocalized={setAnswer}
                    placeholder={{
                        en: t('mediaQuestion.answerPlaceholder'),
                        ru: t('mediaQuestion.answerPlaceholder'),
                    }}
                    required
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>{t('userQuestions.difficultyRequired')}</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={difficulty}
                        onValueChange={(value) => setDifficulty(value)}
                        style={styles.picker}
                    >
                        <Picker.Item label={t('userQuestions.easy')} value="EASY" />
                        <Picker.Item label={t('userQuestions.medium')} value="MEDIUM" />
                        <Picker.Item label={t('userQuestions.hard')} value="HARD" />
                    </Picker>
                </View>
            </View>

            <View style={styles.formGroup}>
                <TopicTreeSelector
                    selectedTopicId={selectedTopicId}
                    selectedTopicName={topic}
                    onSelectTopic={handleSelectTopic}
                    allowCreate={true}
                    placeholder={t('userQuestions.topicPlaceholder')}
                    label={t('userQuestions.topicLabel')}
                    required={false}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>{t('userQuestions.visibilityRequired')}</Text>
                <Text style={styles.helperText}>
                    {t('mediaQuestion.visibilityLabel')}
                </Text>

                {[
                    QuestionVisibility.PRIVATE,
                    QuestionVisibility.FRIENDS_FAMILY,
                    QuestionVisibility.PUBLIC
                ].map((visibilityOption) => (
                    <TouchableOpacity
                        key={visibilityOption}
                        style={[
                            styles.visibilityOption,
                            visibility === visibilityOption && styles.visibilityOptionSelected
                        ]}
                        onPress={() => setVisibility(visibilityOption as QuestionVisibility)}
                    >
                        <View style={styles.visibilityOptionContent}>
                            <Text style={styles.visibilityIcon}>
                                {getVisibilityIcon(visibilityOption as QuestionVisibility)}
                            </Text>
                            <View style={styles.visibilityTextContainer}>
                                <Text style={[
                                    styles.visibilityLabel,
                                    visibility === visibilityOption && styles.visibilityLabelSelected
                                ]}>
                                    {t(`mediaQuestion.${visibilityOption.toLowerCase()}` as any) || getVisibilityLabel(visibilityOption as QuestionVisibility)}
                                </Text>
                                <Text style={styles.visibilityDescription}>
                                    {getVisibilityDescription(visibilityOption as QuestionVisibility)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.radioButton}>
                            {visibility === visibilityOption && (
                                <View style={styles.radioButtonInner}/>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.formGroup}>
                <LocalizedInput
                    label={t('userQuestions.additionalInfoLabel')}
                    value={additionalInfo}
                    onChangeLocalized={setAdditionalInfo}
                    placeholder={{
                        en: t('userQuestions.additionalInfoPlaceholder'),
                        ru: t('userQuestions.additionalInfoPlaceholder'),
                    }}
                    multiline
                    numberOfLines={2}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    helperText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    visibilityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#fafafa',
    },
    visibilityOptionSelected: {
        borderColor: '#4CAF50',
        backgroundColor: '#e8f5e9',
    },
    visibilityOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    visibilityIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    visibilityTextContainer: {
        flex: 1,
    },
    visibilityLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    visibilityLabelSelected: {
        color: '#4CAF50',
    },
    visibilityDescription: {
        fontSize: 13,
        color: '#666',
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
    },
});
