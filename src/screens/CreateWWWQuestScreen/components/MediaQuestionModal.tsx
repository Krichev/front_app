// src/screens/CreateWWWQuestScreen/components/MediaQuestionModal.tsx
// TODO: Refactor to use shared hooks from features/question-form
// See: useQuestionForm, useMediaPicker, useExternalVideo, useQuestionSubmit
// These components duplicate logic that has been extracted into the question-form feature module.
import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import {QuestionFormData} from '../hooks/useQuestionsManager';
import FileService, {ProcessedFileInfo} from '../../../services/speech/FileService';
import {QuestionType} from "../../../services/wwwGame/questionService";
import {TopicTreeSelector} from '../../../shared/ui/TopicSelector';
import {SelectableTopic} from '../../../entities/TopicState';
import {useAppStyles} from '../../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../../shared/ui/theme';
import { LocalizedInput } from '../../../shared/ui/LocalizedInput';
import { LocalizedString, EMPTY_LOCALIZED_STRING, getLocalizedValue, isLocalizedStringEmpty } from '../../../shared/types/localized';
import { useI18n } from '../../../app/providers/I18nProvider';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface MediaQuestionModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (questionData: QuestionFormData) => void;
    isSubmitting?: boolean;
    preSelectedMediaType?: 'image' | 'video' | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

const MediaQuestionModal: React.FC<MediaQuestionModalProps> = ({
                                                                   visible,
                                                                   onClose,
                                                                   onSubmit,
                                                                   isSubmitting = false,
                                                                   preSelectedMediaType,
                                                               }) => {
    const {t} = useTranslation();
    const {modal, form, theme} = useAppStyles();
    const styles = themeStyles;
    const { currentLanguage } = useI18n();
    const navigation = useNavigation();

    // Form state
    const [question, setQuestion] = useState<LocalizedString>(EMPTY_LOCALIZED_STRING);
    const [answer, setAnswer] = useState<LocalizedString>(EMPTY_LOCALIZED_STRING);
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
    const [topic, setTopic] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(undefined);
    const [additionalInfo, setAdditionalInfo] = useState<LocalizedString>(EMPTY_LOCALIZED_STRING);

    // Media state
    const [selectedMedia, setSelectedMedia] = useState<ProcessedFileInfo | undefined>(undefined);
    const [isSelectingMedia, setIsSelectingMedia] = useState(false);
    const [mediaSelectionType, setMediaSelectionType] = useState<'image' | 'video' | 'audio' | null>(null);

    useEffect(() => {
        if (visible && preSelectedMediaType) {
            handleSelectMedia(preSelectedMediaType);
        }
    }, [visible, preSelectedMediaType]);

    /**
     * Determine question type based on selected media (IMPLICIT)
     * Returns TEXT if no media selected
     */
    const getQuestionType = (): QuestionType => {
        if (!selectedMedia) {
            return 'TEXT';
        }

        // Detect from selected file type
        if (selectedMedia.type.startsWith('image/')) {
            return 'IMAGE';
        } else if (selectedMedia.type.startsWith('video/')) {
            return 'VIDEO';
        } else if (selectedMedia.type.startsWith('audio/')) {
            return 'AUDIO';
        }

        return 'TEXT';
    };

    /**
     * Handle media selection based on type
     */
    const handleSelectMedia = async (type: 'image' | 'video' | 'audio') => {
        try {
            switch (type) {
                case 'image':
                    await handleImagePick();
                    break;
                case 'video':
                    await handleVideoPick();
                    break;
                case 'audio':
                    await handleAudioPick();
                    break;
            }
        } catch (error) {
            console.error('Error in handleSelectMedia:', error);
            Alert.alert(t('createQuest.questionEditor.errorTitle'), t('createQuest.questionEditor.errorMedia'));
        }
    };

    /**
     * Handle image picking from library
     */
    const handleImagePick = async () => {
        try {
            setIsSelectingMedia(true);
            setMediaSelectionType('image');
            const result = await FileService.pickImage({}, navigation);
            if (result) {
                // Validate file
                const validation = FileService.validateFile(result);
                if (!validation.isValid) {
                    Alert.alert(t('createQuest.questionEditor.invalidFile'), validation.error || t('createQuest.questionEditor.validImage'));
                    return;
                }
                console.log('📷 Image selected:', result.name, result.sizeFormatted);
                setSelectedMedia(result);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert(t('createQuest.questionEditor.errorTitle'), t('createQuest.questionEditor.errorMedia'));
        } finally {
            setIsSelectingMedia(false);
            setMediaSelectionType(null);
        }
    };

    /**
     * Handle video picking from library
     */
    const handleVideoPick = async () => {
        try {
            console.log('🎥 Video start');
            setIsSelectingMedia(true);
            setMediaSelectionType('video');
            const result = await FileService.pickVideo({}, navigation);
            if (result) {
                // Validate file
                const validation = FileService.validateFile(result);
                if (!validation.isValid) {
                    Alert.alert(t('createQuest.questionEditor.invalidFile'), validation.error || t('createQuest.questionEditor.validVideo'));
                    return;
                }
                console.log('🎥 Video selected:', result.name, result.sizeFormatted);
                setSelectedMedia(result);
            }
        } catch (error) {
            console.error('Error picking video:', error);
            Alert.alert(t('createQuest.questionEditor.errorTitle'), t('createQuest.questionEditor.errorMedia'));
        } finally {
            setIsSelectingMedia(false);
            setMediaSelectionType(null);
        }
    };

    /**
     * Handle audio picking from library
     */
    const handleAudioPick = async () => {
        try {
            setIsSelectingMedia(true);
            setMediaSelectionType('audio');
            const result = await FileService.pickAudio();
            if (result) {
                // Validate file
                const validation = FileService.validateFile(result);
                if (!validation.isValid) {
                    Alert.alert(t('createQuest.questionEditor.invalidFile'), validation.error || t('createQuest.questionEditor.validAudio'));
                    return;
                }
                console.log('🎵 Audio selected:', result.name, result.sizeFormatted);
                setSelectedMedia(result);
            }
        } catch (error) {
            console.error('Error picking audio:', error);
            Alert.alert(t('createQuest.questionEditor.errorTitle'), t('createQuest.questionEditor.errorMedia'));
        } finally {
            setIsSelectingMedia(false);
            setMediaSelectionType(null);
        }
    };

    /**
     * Remove selected media
     */
    const handleRemoveMedia = () => {
        Alert.alert(
            t('createQuest.questionEditor.removeMedia'),
            t('createQuest.questionEditor.removeMediaConfirm'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('createQuest.questionEditor.remove'),
                    style: 'destructive',
                    onPress: () => {
                        setSelectedMedia(undefined);
                    },
                },
            ]
        );
    };

    /**
     * Validate and submit the question
     * Passes raw file info - backend handles upload atomically
     */
    const handleSubmit = async () => {
        // Validate required fields
        if (isLocalizedStringEmpty(question)) {
            Alert.alert(t('createQuest.questionEditor.errorTitle'), t('createQuest.questionEditor.errorQuestion'));
            return;
        }
        if (isLocalizedStringEmpty(answer)) {
            Alert.alert(t('createQuest.questionEditor.errorTitle'), t('createQuest.questionEditor.errorAnswer'));
            return;
        }
        if (!topic.trim()) {
            Alert.alert(t('createQuest.questionEditor.errorTitle'), t('createQuest.questionEditor.errorTopic'));
            return;
        }

        const questionType = getQuestionType();

        // DETAILED LOGGING for debugging
        console.log('🎬 [MediaQuestionModal] handleSubmit called');
        console.log('🎬 [MediaQuestionModal] selectedMedia:', selectedMedia ? {
            uri: selectedMedia.uri?.substring(0, 100),
            name: selectedMedia.name,
            type: selectedMedia.type,
            size: selectedMedia.size,
            isVideo: selectedMedia.type?.startsWith('video/'),
        } : 'null');
        console.log('🎬 [MediaQuestionModal] Detected questionType:', questionType);

        // Build question data
        const questionData: QuestionFormData = {
            question: getLocalizedValue(question, currentLanguage),
            answer: getLocalizedValue(answer, currentLanguage),
            questionLocalized: question,
            answerLocalized: answer,
            difficulty,
            topic: topic.trim(),
            additionalInfo: getLocalizedValue(additionalInfo, currentLanguage),
            additionalInfoLocalized: additionalInfo,
            questionType,
            // CRITICAL: Pass the raw file info for the mutation to handle
            mediaFile: selectedMedia ? {
                uri: selectedMedia.uri,
                name: selectedMedia.name || `media_${Date.now()}.${selectedMedia.type?.split('/')[1] || 'mp4'}`,
                type: selectedMedia.type || 'video/mp4',
            } : undefined,
        };

        console.log('📤 [MediaQuestionModal] Submitting with mediaFile:', !!questionData.mediaFile);

        onSubmit(questionData);
        handleReset();
    };

    /**
     * Handle topic selection
     */
    const handleSelectTopic = (selectedTopic: SelectableTopic | null) => {
        if (selectedTopic) {
            setTopic(selectedTopic.name);
            setSelectedTopicId(selectedTopic.id);
        } else {
            setTopic('');
            setSelectedTopicId(undefined);
        }
    };

    /**
     * Reset form to initial state
     */
    const handleReset = () => {
        setQuestion(EMPTY_LOCALIZED_STRING);
        setAnswer(EMPTY_LOCALIZED_STRING);
        setDifficulty('MEDIUM');
        setTopic('');
        setSelectedTopicId(undefined);
        setAdditionalInfo(EMPTY_LOCALIZED_STRING);
        setSelectedMedia(undefined);
    };

    /**
     * Handle modal close with unsaved changes warning
     */
    const handleClose = () => {
        if (selectedMedia || !isLocalizedStringEmpty(question) || !isLocalizedStringEmpty(answer) || topic || !isLocalizedStringEmpty(additionalInfo)) {
            Alert.alert(
                t('createQuest.questionEditor.discardChanges'),
                t('createQuest.questionEditor.discardChangesMessage'),
                [
                    {
                        text: t('common.cancel'),
                        style: 'cancel',
                    },
                    {
                        text: t('createQuest.questionEditor.discard'),
                        style: 'destructive',
                        onPress: () => {
                            handleReset();
                            onClose();
                        },
                    },
                ]
            );
        } else {
            onClose();
        }
    };

    /**
     * Render media preview section
     */
    const renderMediaPreview = () => {
        if (!selectedMedia) {
            return null;
        }

        const currentQuestionType = getQuestionType();

        return (
            <View style={styles.mediaPreviewContainer}>
                <Text style={form.sectionTitle}>{t('createQuest.questionEditor.mediaPreview')}</Text>

                {/* Image Preview */}
                {currentQuestionType === 'IMAGE' && selectedMedia && (
                    <Image
                        source={{uri: selectedMedia.uri}}
                        style={styles.imagePreview}
                        resizeMode="contain"
                    />
                )}

                {/* Video/Audio Placeholder */}
                {(currentQuestionType === 'VIDEO' || currentQuestionType === 'AUDIO') && selectedMedia && (
                    <View style={styles.mediaPlaceholder}>
                        <MaterialCommunityIcons
                            name={currentQuestionType === 'VIDEO' ? 'video' : 'music'}
                            size={48}
                            color={theme.colors.primary.main}
                        />
                        <Text style={styles.mediaPlaceholderText} numberOfLines={2}>
                            {selectedMedia.name}
                        </Text>
                        <Text style={styles.mediaFileSize}>
                            {selectedMedia.sizeFormatted || `${(selectedMedia.size / 1024 / 1024).toFixed(2)} MB`}
                        </Text>
                        <View style={styles.mediaTypeBadge}>
                            <Text style={styles.mediaTypeBadgeText}>
                                {selectedMedia.type?.split('/')[1]?.toUpperCase() || currentQuestionType}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Media Status Badge */}
                <View style={styles.mediaStatusBadge}>
                    <MaterialCommunityIcons
                        name="file-upload"
                        size={16}
                        color={theme.colors.primary.main}
                    />
                    <Text style={styles.mediaStatusText}>
                        {t('createQuest.questionEditor.mediaSelected', { type: getQuestionType() })}
                    </Text>
                </View>

                {/* Remove Button */}
                <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={handleRemoveMedia}
                >
                    <MaterialCommunityIcons name="delete" size={20} color={theme.colors.error.main}/>
                    <Text style={styles.removeMediaText}>{t('createQuest.questionEditor.removeMedia')}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={modal.header}>
                    <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                        <MaterialCommunityIcons name="close" size={24} color={isSubmitting ? theme.colors.text.disabled : theme.colors.primary.main}/>
                    </TouchableOpacity>
                    <Text style={modal.headerTitle}>{t('createQuest.addQuestion.title')}</Text>
                    <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={theme.colors.primary.main} />
                        ) : (
                            <Text style={styles.saveButton}>{t('common.save')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Media Selection - Inline Buttons */}
                    <View style={form.section}>
                        <Text style={form.sectionTitle}>{t('createQuest.questionEditor.addMedia')} (Optional)</Text>
                        <View style={styles.mediaButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.mediaButton, isSelectingMedia && styles.mediaButtonDisabled]}
                                onPress={() => handleSelectMedia('image')}
                                disabled={isSelectingMedia}
                            >
                                {isSelectingMedia && mediaSelectionType === 'image' ? (
                                    <ActivityIndicator size="small" color={theme.colors.primary.main} />
                                ) : (
                                    <MaterialCommunityIcons name="image" size={24} color={theme.colors.primary.main} />
                                )}
                                <Text style={styles.mediaButtonText}>{t('questions.image')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.mediaButton, isSelectingMedia && styles.mediaButtonDisabled]}
                                onPress={() => handleSelectMedia('video')}
                                disabled={isSelectingMedia}
                            >
                                {isSelectingMedia && mediaSelectionType === 'video' ? (
                                    <ActivityIndicator size="small" color={theme.colors.primary.main} />
                                ) : (
                                    <MaterialCommunityIcons name="video" size={24} color={theme.colors.primary.main} />
                                )}
                                <Text style={styles.mediaButtonText}>{t('questions.video')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.mediaButton, isSelectingMedia && styles.mediaButtonDisabled]}
                                onPress={() => handleSelectMedia('audio')}
                                disabled={isSelectingMedia}
                            >
                                {isSelectingMedia && mediaSelectionType === 'audio' ? (
                                    <ActivityIndicator size="small" color={theme.colors.primary.main} />
                                ) : (
                                    <MaterialCommunityIcons name="music" size={24} color={theme.colors.primary.main} />
                                )}
                                <Text style={styles.mediaButtonText}>{t('questions.audioType')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Media Preview */}
                        {renderMediaPreview()}
                    </View>

                    {/* Question Field */}
                    <View style={form.section}>
                        <LocalizedInput
                            label={t('createQuest.addQuestion.questionLabel')}
                            value={question}
                            onChangeLocalized={setQuestion}
                            placeholder={{
                                en: t('createQuest.addQuestion.questionPlaceholder'),
                                ru: t('createQuest.addQuestion.questionPlaceholder'),
                            }}
                            multiline
                            numberOfLines={3}
                            required
                        />
                    </View>

                    {/* Answer Field */}
                    <View style={form.section}>
                        <LocalizedInput
                            label={t('createQuest.addQuestion.answerLabel')}
                            value={answer}
                            onChangeLocalized={setAnswer}
                            placeholder={{
                                en: t('createQuest.addQuestion.answerPlaceholder'),
                                ru: t('createQuest.addQuestion.answerPlaceholder'),
                            }}
                            multiline
                            numberOfLines={2}
                            required
                        />
                    </View>

                    {/* Difficulty Selector */}
                    <View style={form.section}>
                        <Text style={form.sectionTitle}>{t('createQuest.addQuestion.difficultyLabel')} *</Text>
                        <View style={styles.difficultyContainer}>
                            {(['EASY', 'MEDIUM', 'HARD'] as const).map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.difficultyButton,
                                        difficulty === level && styles.difficultyButtonActive,
                                    ]}
                                    onPress={() => setDifficulty(level)}
                                >
                                    <Text
                                        style={[
                                            styles.difficultyText,
                                            difficulty === level && styles.difficultyTextActive,
                                        ]}
                                    >
                                        {t(`createQuest.quizConfig.${level.toLowerCase()}` as any)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Topic Field */}
                    <View style={form.section}>
                        <TopicTreeSelector
                            selectedTopicId={selectedTopicId}
                            selectedTopicName={topic}
                            onSelectTopic={handleSelectTopic}
                            allowCreate={true}
                            placeholder={t('createQuest.addQuestion.topicPlaceholder')}
                            label={t('createQuest.addQuestion.topicLabel')}
                            required={true}
                        />
                    </View>

                    {/* Additional Info Field */}
                    <View style={form.section}>
                        <LocalizedInput
                            label={t('createQuest.addQuestion.additionalInfoLabel')}
                            value={additionalInfo}
                            onChangeLocalized={setAdditionalInfo}
                            placeholder={{
                                en: t('createQuest.addQuestion.additionalInfoPlaceholder'),
                                ru: t('createQuest.addQuestion.additionalInfoPlaceholder'),
                            }}
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.tertiary,
    },
    saveButton: {
        ...theme.typography.button,
        color: theme.colors.primary.main,
    },
    scrollView: {
        flex: 1,
    },
    mediaButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
    },
    mediaButton: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        backgroundColor: theme.colors.background.secondary,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    mediaButtonDisabled: {
        opacity: 0.5,
    },
    mediaButtonText: {
        ...theme.typography.caption,
        color: theme.colors.primary.main,
        marginTop: theme.spacing.sm,
        fontWeight: theme.typography.fontWeight.medium,
    },
    mediaStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.info.background,
        borderRadius: theme.layout.borderRadius.sm,
        gap: theme.spacing.sm,
    },
    mediaStatusText: {
        ...theme.typography.caption,
        color: theme.colors.info.main,
        fontWeight: theme.typography.fontWeight.medium,
    },
    mediaStatusTextUploaded: {
        color: theme.colors.success.main,
    },
    mediaPreviewContainer: {
        marginTop: theme.spacing.lg,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: theme.layout.borderRadius.md,
        backgroundColor: theme.colors.neutral.gray[100],
    },
    mediaPlaceholder: {
        width: '100%',
        height: 150,
        borderRadius: theme.layout.borderRadius.md,
        backgroundColor: theme.colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    mediaPlaceholderText: {
        ...theme.typography.body.small,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
    },
    mediaFileSize: {
        ...theme.typography.caption,
        color: theme.colors.text.disabled,
        marginTop: theme.spacing.xs,
    },
    mediaTypeBadge: {
        marginTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        backgroundColor: theme.colors.neutral.gray[200],
        borderRadius: theme.layout.borderRadius.lg,
    },
    mediaTypeBadgeText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.secondary,
    },
    removeMediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        backgroundColor: theme.colors.background.primary,
        borderWidth: 1,
        borderColor: theme.colors.error.main,
    },
    removeMediaText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.error.main,
        marginLeft: theme.spacing.sm,
    },
    difficultyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    difficultyButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        marginHorizontal: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary.main,
        backgroundColor: theme.colors.background.primary,
        alignItems: 'center',
    },
    difficultyButtonActive: {
        backgroundColor: theme.colors.primary.main,
    },
    difficultyText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.primary.main,
    },
    difficultyTextActive: {
        color: theme.colors.text.inverse,
    },
}));

export default MediaQuestionModal;