// src/screens/CreateUserQuestionScreen.tsx
import React, {useState} from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Picker} from '@react-native-picker/picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {APIDifficulty, QuestionService, UserQuestion} from '../services/wwwGame/questionService';
import {
    getVisibilityDescription,
    getVisibilityIcon,
    getVisibilityLabel,
    QuestionVisibility
} from '../entities/QuizState/model/types/question.types';
import {TopicTreeSelector} from '../shared/ui/TopicSelector';
import {SelectableTopic} from '../entities/TopicState';
import {useTranslation} from 'react-i18next';
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import { LocalizedInput } from '../shared/ui/LocalizedInput';
import { LocalizedString, EMPTY_LOCALIZED_STRING, getLocalizedValue, isLocalizedStringEmpty, createLocalizedString } from '../shared/types/localized';
import { useI18n } from '../app/providers/I18nProvider';

type RootStackParamList = {
    UserQuestions: undefined;
    CreateUserQuestion: undefined;
    EditUserQuestion: { question: UserQuestion };
};

type CreateQuestionRouteProp = RouteProp<RootStackParamList, 'CreateUserQuestion' | 'EditUserQuestion'>;
type CreateQuestionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateUserQuestion' | 'EditUserQuestion'>;

const CreateUserQuestionScreen: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const { currentLanguage } = useI18n();
    const route = useRoute<CreateQuestionRouteProp>();
    const navigation = useNavigation<CreateQuestionNavigationProp>();

    // Check if we're editing an existing question
    const isEditing = route.name === 'EditUserQuestion';
    const existingQuestion = isEditing ? route.params?.question : undefined;

    // Form state
    const [question, setQuestion] = useState<LocalizedString>(
        existingQuestion?.questionLocalized || (existingQuestion?.question ? createLocalizedString(existingQuestion.question, 'en') : EMPTY_LOCALIZED_STRING)
    );
    const [answer, setAnswer] = useState<LocalizedString>(
        existingQuestion?.answerLocalized || (existingQuestion?.answer ? createLocalizedString(existingQuestion.answer, 'en') : EMPTY_LOCALIZED_STRING)
    );
    const [difficulty, setDifficulty] = useState<APIDifficulty>(
        existingQuestion?.difficulty || 'MEDIUM'
    );
    const [topic, setTopic] = useState<string>(existingQuestion?.topic || '');
    const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(undefined);
    const [additionalInfo, setAdditionalInfo] = useState<LocalizedString>(
        existingQuestion?.additionalInfoLocalized || (existingQuestion?.additionalInfo ? createLocalizedString(existingQuestion.additionalInfo, 'en') : EMPTY_LOCALIZED_STRING)
    );
    const [visibility, setVisibility] = useState<QuestionVisibility>(
        existingQuestion?.visibility || QuestionVisibility.PRIVATE
    );

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Handle topic selection
    const handleSelectTopic = (selectedTopic: SelectableTopic | null) => {
        if (selectedTopic) {
            setTopic(selectedTopic.name);
            setSelectedTopicId(selectedTopic.id);
        } else {
            setTopic('');
            setSelectedTopicId(undefined);
        }
    };

    const handleSubmit = async () => {
        // Validate inputs
        if (isLocalizedStringEmpty(question)) {
            Alert.alert(t('userQuestions.errorTitle'), t('userQuestions.questionRequiredError'));
            return;
        }

        if (isLocalizedStringEmpty(answer)) {
            Alert.alert(t('userQuestions.errorTitle'), t('userQuestions.answerRequiredError'));
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditing && existingQuestion) {
                // Update existing question - Pass ID as first argument
                await QuestionService.updateUserQuestion(existingQuestion.id, {
                    question: getLocalizedValue(question, currentLanguage),
                    answer: getLocalizedValue(answer, currentLanguage),
                    questionLocalized: question,
                    answerLocalized: answer,
                    difficulty,
                    topic: topic.trim() || undefined,
                    additionalInfo: getLocalizedValue(additionalInfo, currentLanguage) || undefined,
                    additionalInfoLocalized: additionalInfo,
                    visibility,
                });

                Alert.alert(t('userQuestions.successTitle'), t('userQuestions.updateSuccess'));
            } else {
                // Create new question - Use createUserQuestion
                await QuestionService.createUserQuestion({
                    question: getLocalizedValue(question, currentLanguage),
                    answer: getLocalizedValue(answer, currentLanguage),
                    questionLocalized: question,
                    answerLocalized: answer,
                    difficulty,
                    topic: topic.trim() || undefined,
                    additionalInfo: getLocalizedValue(additionalInfo, currentLanguage) || undefined,
                    additionalInfoLocalized: additionalInfo,
                    visibility,
                });

                Alert.alert(t('userQuestions.successTitle'), t('userQuestions.createSuccess'));
            }

            // Navigate back to the questions list
            navigation.navigate('UserQuestions');
        } catch (error) {
            console.error('Error saving question:', error);
            Alert.alert(t('userQuestions.errorTitle'), t('userQuestions.saveFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView style={styles.scrollView}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            {isEditing ? t('userQuestions.editTitle') : t('userQuestions.createTitle')}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {/* Question Input */}
                        <View style={styles.inputGroup}>
                            <LocalizedInput
                                label={t('userQuestions.questionRequired')}
                                value={question}
                                onChangeLocalized={setQuestion}
                                placeholder={{
                                    en: t('userQuestions.questionPlaceholder'),
                                    ru: t('userQuestions.questionPlaceholder'),
                                }}
                                multiline
                                numberOfLines={4}
                                required
                            />
                        </View>

                        {/* Answer Input */}
                        <View style={styles.inputGroup}>
                            <LocalizedInput
                                label={t('userQuestions.answerRequired')}
                                value={answer}
                                onChangeLocalized={setAnswer}
                                placeholder={{
                                    en: t('userQuestions.answerPlaceholder'),
                                    ru: t('userQuestions.answerPlaceholder'),
                                }}
                                multiline
                                numberOfLines={3}
                                required
                            />
                        </View>

                        {/* Difficulty Picker */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('userQuestions.difficultyRequired')}</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={difficulty}
                                    onValueChange={(value) => setDifficulty(value as APIDifficulty)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label={t('userQuestions.easy')} value="EASY" />
                                    <Picker.Item label={t('userQuestions.medium')} value="MEDIUM" />
                                    <Picker.Item label={t('userQuestions.hard')} value="HARD" />
                                </Picker>
                            </View>
                        </View>

                        {/* Visibility Picker */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('userQuestions.visibilityRequired')}</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={visibility}
                                    onValueChange={(value) => setVisibility(value as QuestionVisibility)}
                                    style={styles.picker}
                                >
                                    {Object.values(QuestionVisibility).map((vis) => (
                                        <Picker.Item
                                            key={vis}
                                            label={`${getVisibilityIcon(vis)} ${t(`mediaQuestion.${vis.toLowerCase()}` as any) || getVisibilityLabel(vis)}`}
                                            value={vis}
                                        />
                                    ))}
                                </Picker>
                            </View>
                            <Text style={styles.helpText}>
                                {getVisibilityDescription(visibility)}
                            </Text>
                        </View>

                        {/* Topic Input (Optional) */}
                        <View style={styles.inputGroup}>
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

                        {/* Additional Info Input (Optional) */}
                        <View style={styles.inputGroup}>
                            <LocalizedInput
                                label={t('userQuestions.additionalInfoLabel')}
                                value={additionalInfo}
                                onChangeLocalized={setAdditionalInfo}
                                placeholder={{
                                    en: t('userQuestions.additionalInfoPlaceholder'),
                                    ru: t('userQuestions.additionalInfoPlaceholder'),
                                }}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => navigation.goBack()}
                                disabled={isSubmitting}
                            >
                                <MaterialCommunityIcons name="close" size={20} color="#666" />
                                <Text style={styles.cancelButtonText}>{t('userQuestions.cancel')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.submitButton,
                                    isSubmitting && styles.buttonDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                            >
                                <MaterialCommunityIcons
                                    name={isEditing ? "content-save" : "plus"}
                                    size={20}
                                    color="#fff"
                                />
                                <Text style={styles.submitButtonText}>
                                    {isSubmitting
                                        ? (isEditing ? t('userQuestions.updating') : t('userQuestions.creating'))
                                        : (isEditing ? t('userQuestions.update') : t('userQuestions.create'))
                                    }
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    form: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        minHeight: 80,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    helpText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        fontStyle: 'italic',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        gap: 8,
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    submitButton: {
        backgroundColor: '#007AFF',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});

export default CreateUserQuestionScreen;