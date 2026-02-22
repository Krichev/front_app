// src/screens/components/CreateQuestionWithMedia.tsx
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useI18n } from '../../app/providers/I18nProvider';
import { UserQuestion } from '../../services/wwwGame/questionService';
import AudioChallengeSection, {
    AudioChallengeConfig,
    DEFAULT_AUDIO_CONFIG,
} from './AudioChallengeSection';
import {
    useQuestionForm,
    useMediaPicker,
    useExternalVideo,
    useQuestionSubmit,
    QuestionFormFields,
    MediaSection,
    QuestionTypeSelector,
    QuestionFormData,
    MediaInfo
} from '../../features/question-form';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type RootStackParamList = {
    UserQuestions: undefined;
    CreateUserQuestion: undefined;
    EditUserQuestion: { question: UserQuestion };
};

type CreateQuestionRouteProp = RouteProp<RootStackParamList, 'CreateUserQuestion' | 'EditUserQuestion'>;
type CreateQuestionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateUserQuestion' | 'EditUserQuestion'>;

/**
 * Props for CreateQuestionWithMedia component
 */
interface CreateQuestionWithMediaProps {
    onQuestionSubmit?: (questionData: QuestionFormData) => void;
    onCancel?: () => void;
}

// Re-export for backward compatibility
export type { QuestionFormData, MediaInfo };

// ============================================================================
// COMPONENT
// ============================================================================

const CreateQuestionWithMedia: React.FC<CreateQuestionWithMediaProps> = ({
    onQuestionSubmit,
    onCancel
}) => {
    const { t } = useTranslation();
    const { currentLanguage } = useI18n();
    const route = useRoute<CreateQuestionRouteProp>();
    const navigation = useNavigation<CreateQuestionNavigationProp>();

    // Check if we're editing an existing question
    const isEditing = route.name === 'EditUserQuestion';
    const existingQuestion = isEditing ? route.params?.question : undefined;

    // Use feature hooks
    const { formState, formHandlers } = useQuestionForm({ existingQuestion, isEditing });
    const { mediaState, mediaHandlers } = useMediaPicker(navigation);
    const { videoState, videoHandlers } = useExternalVideo();
    
    // Audio challenge config state
    const [audioConfig, setAudioConfig] = useState<AudioChallengeConfig>(DEFAULT_AUDIO_CONFIG);

    const { isSubmitting, handleSubmit } = useQuestionSubmit({
        isEditing,
        existingQuestion,
        onQuestionSubmit,
        currentLanguage
    });

    const onSubmit = () => {
        handleSubmit({
            ...formState,
            ...videoState,
            uploadedMediaInfo: mediaState.uploadedMediaInfo,
            audioConfig,
        });
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

                    <View style={styles.formContainer}>
                        {/* Question Type Selector */}
                        <QuestionTypeSelector
                            questionType={formState.questionType}
                            setQuestionType={formHandlers.setQuestionType}
                            setAudioConfig={setAudioConfig}
                            handleRemoveMedia={mediaHandlers.handleRemoveMedia}
                            isEditing={isEditing}
                        />

                        {/* Common Question Fields */}
                        <QuestionFormFields
                            {...formState}
                            {...formHandlers}
                        />

                        {/* Media Section (Image/Video) */}
                        <MediaSection
                            questionType={formState.questionType}
                            {...mediaState}
                            {...mediaHandlers}
                            {...videoState}
                            {...videoHandlers}
                            setQuestionType={formHandlers.setQuestionType}
                        />

                        {/* Audio Challenge Section */}
                        {!isEditing && formState.questionType === 'AUDIO' && (
                            <AudioChallengeSection
                                config={audioConfig}
                                onConfigChange={setAudioConfig}
                                disabled={isSubmitting}
                            />
                        )}
                    </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                        onPress={onSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {isEditing ? t('userQuestions.update') : t('userQuestions.create')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

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
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
    },
    formContainer: {
        padding: 20,
    },
    buttonContainer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default CreateQuestionWithMedia;
