// src/screens/components/CreateQuestionWithMedia.tsx
import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Picker} from '@react-native-picker/picker';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import DocumentPicker from 'react-native-document-picker';
import FileService, {ProcessedFileInfo} from "../../services/speech/FileService";
import MediaUploadService from "../../services/media/MediaUploadService";
import {QuestionService, UserQuestion} from '../../services/wwwGame/questionService';
import {
    getVisibilityDescription,
    getVisibilityLabel,
    QuestionVisibility,
    MediaSourceType
} from "../../entities/QuizState/model/types/question.types.ts";
import {getVisibilityIcon} from "../../entities/ChallengeState/model/types.ts";
import {TopicTreeSelector} from '../../shared/ui/TopicSelector';
import {SelectableTopic} from '../../entities/TopicState';
import AudioChallengeSection, {
    AudioChallengeConfig,
    DEFAULT_AUDIO_CONFIG,
} from './AudioChallengeSection';
import {AudioChallengeType, AUDIO_CHALLENGE_TYPES} from '../../entities/ChallengeState/model/types';
import TimeRangeInput from '../../components/TimeRangeInput';
import ExternalVideoPlayer from '../../components/ExternalVideoPlayer';
import {isValidYouTubeUrl, extractYouTubeVideoId} from '../../utils/youtubeUtils';
import {useTranslation} from 'react-i18next';
import {useAppStyles} from '../../shared/ui/hooks/useAppStyles';
import { LocalizedInput } from '../../shared/ui/LocalizedInput';
import { LocalizedString, EMPTY_LOCALIZED_STRING, getLocalizedValue, isLocalizedStringEmpty, createLocalizedString } from '../../shared/types/localized';
import { useI18n } from '../../app/providers/I18nProvider';

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
 * Media information for uploaded files
 */
export interface MediaInfo {
    mediaId: string | number;
    mediaUrl: string;
    mediaType: string;
    thumbnailUrl?: string;
}

/**
 * Question form data structure
 * This is exported and used by parent components
 */
export interface QuestionFormData {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic: string;
    additionalInfo: string;
    questionLocalized?: LocalizedString;
    answerLocalized?: LocalizedString;
    additionalInfoLocalized?: LocalizedString;
    questionType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
    media?: MediaInfo;
    visibility: QuestionVisibility;
    audioConfig?: AudioChallengeConfig;
    // External Media
    mediaSourceType?: MediaSourceType;
    externalMediaUrl?: string;
    questionVideoStartTime?: number;
    questionVideoEndTime?: number;
    answerMediaUrl?: string;
    answerVideoStartTime?: number;
    answerVideoEndTime?: number;
    answerTextVerification?: string;
}

/**
 * Props for CreateQuestionWithMedia component
 */
interface CreateQuestionWithMediaProps {
    onQuestionSubmit?: (questionData: QuestionFormData) => void;
    onCancel?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CreateQuestionWithMedia: React.FC<CreateQuestionWithMediaProps> = ({
                                                                             onQuestionSubmit,
                                                                             onCancel
                                                                         }) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const { currentLanguage } = useI18n();
    const route = useRoute<CreateQuestionRouteProp>();
    const navigation = useNavigation<CreateQuestionNavigationProp>();

    // Check if we're editing an existing question
    const isEditing = route.name === 'EditUserQuestion';
    const existingQuestion = isEditing ? route.params?.question : undefined;

    // Form state
    const [questionText, setQuestionText] = useState<LocalizedString>(
        existingQuestion?.questionLocalized || (existingQuestion?.question ? createLocalizedString(existingQuestion.question, 'en') : EMPTY_LOCALIZED_STRING)
    );
    const [answer, setAnswer] = useState<LocalizedString>(
        existingQuestion?.answerLocalized || (existingQuestion?.answer ? createLocalizedString(existingQuestion.answer, 'en') : EMPTY_LOCALIZED_STRING)
    );
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>(
        existingQuestion?.difficulty || 'MEDIUM'
    );
    const [topic, setTopic] = useState(existingQuestion?.topic || '');
    const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(undefined);
    const [additionalInfo, setAdditionalInfo] = useState<LocalizedString>(
        existingQuestion?.additionalInfoLocalized || (existingQuestion?.additionalInfo ? createLocalizedString(existingQuestion.additionalInfo, 'en') : EMPTY_LOCALIZED_STRING)
    );
    const [questionType, setQuestionType] = useState<'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO'>('TEXT');
    const [visibility, setVisibility] = useState<QuestionVisibility>(
        (existingQuestion?.visibility as QuestionVisibility) || QuestionVisibility.PRIVATE
    );
    const [audioConfig, setAudioConfig] = useState<AudioChallengeConfig>(DEFAULT_AUDIO_CONFIG);

    // External Media State
    const [mediaSourceType, setMediaSourceType] = useState<MediaSourceType>(MediaSourceType.UPLOADED);
    const [externalUrl, setExternalUrl] = useState('');
    const [qStartTime, setQStartTime] = useState(0);
    const [qEndTime, setQEndTime] = useState<number | undefined>(undefined);
    
    // Answer Media State
    const [answerMediaType, setAnswerMediaType] = useState<'SAME' | 'DIFFERENT' | 'TEXT'>('TEXT');
    const [answerUrl, setAnswerUrl] = useState('');
    const [aStartTime, setAStartTime] = useState(0);
    const [aEndTime, setAEndTime] = useState<number | undefined>(undefined);
    const [answerTextVerification, setAnswerTextVerification] = useState('');

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

    // Media state
    const [selectedMedia, setSelectedMedia] = useState<ProcessedFileInfo | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedMediaInfo, setUploadedMediaInfo] = useState<MediaInfo | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Handle media selection from camera or gallery
     */
    const handleMediaPick = async () => {
        try {
            const result = await FileService.pickImage({
                mediaType: 'mixed',
                allowsEditing: false,
                quality: 0.8,
                maxWidth: 1920,
                maxHeight: 1080,
            }, navigation);

            if (!result) {
                console.log('Media selection cancelled');
                return;
            }

            const validation = FileService.validateFile(result);
            if (!validation.isValid) {
                Alert.alert(t('questionEditor.invalidFile'), validation.error || t('questionEditor.validImage'));
                return;
            }

            setSelectedMedia(result);
            setUploadedMediaInfo(null);

            // Auto-detect question type based on media
            if (result.isImage) {
                setQuestionType('IMAGE');
            } else if (result.isVideo) {
                setQuestionType('VIDEO');
            }

            console.log('Media selected:', result.name, result.sizeFormatted);
        } catch (error) {
            console.error('Error picking media:', error);
            Alert.alert(t('userQuestions.errorTitle'), t('questionEditor.errorMedia'));
        }
    };

    /**
     * Handle video selection
     */
    const handleVideoPick = async () => {
        try {
            const result = await FileService.pickVideo({
                mediaType: 'video',
                allowsEditing: false,
                quality: 0.8,
            }, navigation);

            if (!result) {
                console.log('Video selection cancelled');
                return;
            }

            const validation = FileService.validateFile(result);
            if (!validation.isValid) {
                Alert.alert(t('questionEditor.invalidFile'), validation.error || t('questionEditor.validVideo'));
                return;
            }

            setSelectedMedia(result);
            setUploadedMediaInfo(null);
            setQuestionType('VIDEO');

            console.log('Video selected:', result.name, result.sizeFormatted);
        } catch (error) {
            console.error('Error picking video:', error);
            Alert.alert(t('userQuestions.errorTitle'), t('questionEditor.errorMedia'));
        }
    };

    /**
     * Handle audio selection
     */
    const handleAudioPick = async () => {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.audio],
                allowMultiSelection: false,
            });

            if (!result || result.length === 0) {
                console.log('Audio selection cancelled');
                return;
            }

            const audioFile = result[0];

            // Create ProcessedFileInfo object compatible with FileService
            const processedAudio: ProcessedFileInfo = {
                uri: audioFile.uri,
                name: audioFile.name || 'audio.mp3',
                type: audioFile.type || 'audio/mpeg',
                size: audioFile.size || 0,
                sizeFormatted: FileService.formatFileSize(audioFile.size || 0),
                isImage: false,
                isVideo: false,
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
                extension: FileService.getExtension(audioFile.name || 'mp3'),
            };

            setSelectedMedia(processedAudio);
            setUploadedMediaInfo(null);
            setQuestionType('AUDIO');

            console.log('Audio selected:', processedAudio.name, processedAudio.sizeFormatted);
        } catch (error: any) {
            if (DocumentPicker.isCancel(error)) {
                console.log('Audio selection cancelled');
            } else {
                console.error('Error picking audio:', error);
                Alert.alert(t('userQuestions.errorTitle'), t('questionEditor.errorMedia'));
            }
        }
    };

    /**
     * Upload media to server
     */
    const handleUploadMedia = async () => {
        if (!selectedMedia) {
            Alert.alert('No Media', t('questionEditor.errorMedia'));
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            const response = await MediaUploadService.uploadQuizMedia(
                selectedMedia,
                `temp_${Date.now()}`,  // ✅ Temporary ID
                (progress) => {
                    setUploadProgress(progress.percentage);
                }
            );

            if (response.success && response.mediaId && response.mediaUrl) {
                const mediaInfo: MediaInfo = {
                    mediaId: response.mediaId,
                    mediaUrl: response.mediaUrl,
                    mediaType: selectedMedia.type || 'unknown',
                    thumbnailUrl: response.thumbnailUrl,
                };

                setUploadedMediaInfo(mediaInfo);
                Alert.alert(t('userQuestions.successTitle'), 'Media uploaded successfully!');
                console.log('Upload response:', response);
            } else {
                Alert.alert(t('userQuestions.errorTitle'), response.error || 'Failed to upload media');
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert(t('userQuestions.errorTitle'), 'Failed to upload media. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Validate form before submission
     */
    const validateForm = (): boolean => {
        if (isLocalizedStringEmpty(questionText)) {
            Alert.alert(t('userQuestions.errorTitle'), t('userQuestions.questionRequiredError'));
            return false;
        }

        if (isLocalizedStringEmpty(answer)) {
            Alert.alert(t('userQuestions.errorTitle'), t('userQuestions.answerRequiredError'));
            return false;
        }

        // Image/Video validation
        if ((questionType === 'IMAGE' || questionType === 'VIDEO') && !uploadedMediaInfo && !isEditing) {
            Alert.alert(t('userQuestions.errorTitle'), 'Please upload media first or change question type to TEXT');
            return false;
        }

        // Audio challenge validation
        if (questionType === 'AUDIO') {
            if (!audioConfig.audioChallengeType) {
                Alert.alert(t('userQuestions.errorTitle'), t('audioQuestion.createFailed'));
                return false;
            }

            // Check if reference audio is required
            const typeInfo = AUDIO_CHALLENGE_TYPES.find(t => t.type === audioConfig.audioChallengeType);
            if (typeInfo?.requiresReferenceAudio && !audioConfig.referenceAudioFile) {
                Alert.alert(t('userQuestions.errorTitle'), t('audioQuestion.audioRequired'));
                return false;
            }
        }

        return true;
    };

    /**
     * Handle form submission
     */
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditing && existingQuestion) {
                await QuestionService.updateUserQuestion(existingQuestion.id, {
                    question: getLocalizedValue(questionText, currentLanguage),
                    answer: getLocalizedValue(answer, currentLanguage),
                    difficulty,
                    topic: topic.trim() || undefined,
                    additionalInfo: getLocalizedValue(additionalInfo, currentLanguage) || undefined,
                    visibility,
                    // NOTE: questionLocalized/answerLocalized/additionalInfoLocalized intentionally 
                    // NOT sent — backend DTO does not support localized fields yet.
                });

                Alert.alert(t('userQuestions.successTitle'), t('userQuestions.updateSuccess'));
            } else {
                // Create new question
                const questionData: any = {
                    question: getLocalizedValue(questionText, currentLanguage),
                    answer: getLocalizedValue(answer, currentLanguage),
                    difficulty,
                    topic: topic.trim() || undefined,
                    additionalInfo: getLocalizedValue(additionalInfo, currentLanguage) || undefined,
                    visibility,
                    questionType,
                    // NOTE: questionLocalized/answerLocalized/additionalInfoLocalized intentionally 
                    // NOT sent — backend DTO does not support localized fields yet.
                };

                // Add media info if available for IMAGE/VIDEO
                if (questionType === 'IMAGE' || questionType === 'VIDEO') {
                    if (mediaSourceType === MediaSourceType.UPLOADED && uploadedMediaInfo) {
                        questionData.mediaFileId = uploadedMediaInfo.mediaId;
                        questionData.mediaSourceType = MediaSourceType.UPLOADED;
                    } else if (mediaSourceType !== MediaSourceType.UPLOADED && externalUrl) {
                        // Handle External Media
                        // Determine actual type (YOUTUBE vs EXTERNAL_URL)
                        const isYouTube = isValidYouTubeUrl(externalUrl);
                        questionData.mediaSourceType = isYouTube ? MediaSourceType.YOUTUBE : MediaSourceType.EXTERNAL_URL;
                        questionData.externalMediaUrl = externalUrl;
                        questionData.questionVideoStartTime = qStartTime;
                        questionData.questionVideoEndTime = qEndTime;
                        
                        // Answer Media
                        if (answerMediaType === 'SAME') {
                            questionData.answerMediaUrl = externalUrl; // Same as question
                            questionData.answerVideoStartTime = aStartTime;
                            questionData.answerVideoEndTime = aEndTime;
                        } else if (answerMediaType === 'DIFFERENT' && answerUrl) {
                            questionData.answerMediaUrl = answerUrl;
                            questionData.answerVideoStartTime = aStartTime;
                            questionData.answerVideoEndTime = aEndTime;
                        }
                        
                        questionData.answerTextVerification = answerTextVerification;
                    }
                }

                // Add audio challenge config for AUDIO type
                if (questionType === 'AUDIO' && audioConfig.audioChallengeType) {
                    questionData.audioChallengeType = audioConfig.audioChallengeType;
                    questionData.minimumScorePercentage = audioConfig.minimumScorePercentage;
                    questionData.audioSegmentStart = audioConfig.audioSegmentStart;
                    questionData.audioSegmentEnd = audioConfig.audioSegmentEnd;

                    // Add rhythm settings if applicable
                    if (audioConfig.rhythmBpm) {
                        questionData.rhythmBpm = audioConfig.rhythmBpm;
                    }
                    if (audioConfig.rhythmTimeSignature) {
                        questionData.rhythmTimeSignature = audioConfig.rhythmTimeSignature;
                    }
                }

                // Handle submission based on type
                if (questionType === 'AUDIO' && audioConfig.referenceAudioFile) {
                    // For audio questions with reference file, use multipart upload
                    await submitAudioQuestion(questionData, audioConfig.referenceAudioFile);
                    Alert.alert(t('userQuestions.successTitle'), t('audioQuestion.createSuccess'));
                } else if (onQuestionSubmit) {
                    // Call the custom handler if provided
                    onQuestionSubmit({
                        ...questionData,
                        media: uploadedMediaInfo || undefined,
                        audioConfig: questionType === 'AUDIO' ? audioConfig : undefined,
                    });
                } else {
                    // Default behavior: save to backend
                    await QuestionService.createUserQuestion(questionData);
                    Alert.alert(t('userQuestions.successTitle'), t('userQuestions.createSuccess'));
                }
            }

            // Navigate back
            navigation.navigate('UserQuestions');
        } catch (error) {
            console.error('Error saving question:', error);
            Alert.alert(t('userQuestions.errorTitle'), t('userQuestions.saveFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Submit audio question with multipart form data
     */
    const submitAudioQuestion = async (
        questionData: any,
        audioFile: ProcessedFileInfo
    ): Promise<void> => {
        const formData = new FormData();

        // Add request data as JSON string
        formData.append('request', JSON.stringify({
            question: questionData.question,
            answer: questionData.answer,
            audioChallengeType: questionData.audioChallengeType,
            topic: questionData.topic,
            difficulty: questionData.difficulty,
            visibility: questionData.visibility,
            additionalInfo: questionData.additionalInfo,
            audioSegmentStart: questionData.audioSegmentStart,
            audioSegmentEnd: questionData.audioSegmentEnd,
            minimumScorePercentage: questionData.minimumScorePercentage,
            rhythmBpm: questionData.rhythmBpm,
            rhythmTimeSignature: questionData.rhythmTimeSignature,
        }));

        // Add audio file
        formData.append('referenceAudio', {
            uri: audioFile.uri,
            name: audioFile.name,
            type: audioFile.type,
        } as any);

        // Make API call (you'll need to implement this or use the appropriate API endpoint)
        // For now, using a placeholder - replace with actual implementation
        const response = await fetch('http://10.0.2.2:8082/api/questions/audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data',
                // Add authorization header if needed
                // 'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to create audio question');
        }
    };

    /**
     * Remove selected media
     */
    const handleRemoveMedia = () => {
        setSelectedMedia(null);
        setUploadedMediaInfo(null);
        setUploadProgress(0);
    };

    /**
     * Show media selection options
     */
    const showMediaOptions = () => {
        Alert.alert(
            t('mediaQuestion.selectMedia'),
            'Choose the type of media to upload',
            [
                {
                    text: t('mediaQuestion.uploadImage'),
                    onPress: handleMediaPick,
                },
                {
                    text: t('mediaQuestion.uploadVideo'),
                    onPress: handleVideoPick,
                },
                {
                    text: t('mediaQuestion.uploadAudio'),
                    onPress: handleAudioPick,
                },
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
            ]
        );
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
                        {/* Question Type Selector - Only show when creating new */}
                        {!isEditing && (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>{t('mediaQuestion.questionTypeLabel')} *</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={questionType}
                                        onValueChange={(value) => {
                                            setQuestionType(value);
                                            // Reset audio config when switching away from AUDIO
                                            if (value !== 'AUDIO') {
                                                setAudioConfig(DEFAULT_AUDIO_CONFIG);
                                                // Also clear any selected media if switching from AUDIO
                                                if (questionType === 'AUDIO') {
                                                    setSelectedMedia(null);
                                                    setUploadedMediaInfo(null);
                                                }
                                            }
                                        }}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label={t('mediaQuestion.textQuestion')} value="TEXT" />
                                        <Picker.Item label={t('mediaQuestion.imageQuestion')} value="IMAGE" />
                                        <Picker.Item label={t('mediaQuestion.videoQuestion')} value="VIDEO" />
                                        <Picker.Item label={t('mediaQuestion.audioChallenge')} value="AUDIO" />
                                    </Picker>
                                </View>
                            </View>
                        )}

                        {/* Question Text */}
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

                        {/* Answer */}
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

                        {/* Difficulty */}
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

                        {/* Topic */}
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

                        {/* Visibility / Access Policy */}
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

                        {/* Additional Info */}
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

                        {/* Media Section - For IMAGE and VIDEO only */}
                        {!isEditing && (questionType === 'IMAGE' || questionType === 'VIDEO') && (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>
                                    {t('mediaQuestion.selectMedia')} ({questionType === 'IMAGE' ? t('questions.image') : t('questions.video')}) *
                                </Text>

                                {questionType === 'VIDEO' && (
                                    <View style={{flexDirection: 'row', marginBottom: 16, backgroundColor: '#e0e0e0', borderRadius: 8, padding: 4}}>
                                        <TouchableOpacity 
                                            style={{
                                                flex: 1, 
                                                padding: 8, 
                                                alignItems: 'center', 
                                                borderRadius: 6,
                                                backgroundColor: mediaSourceType === MediaSourceType.UPLOADED ? '#fff' : 'transparent',
                                                shadowOpacity: mediaSourceType === MediaSourceType.UPLOADED ? 0.1 : 0
                                            }}
                                            onPress={() => setMediaSourceType(MediaSourceType.UPLOADED)}
                                        >
                                            <Text style={{fontWeight: '600', color: '#333'}}>{t('questionEditor.upload')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={{
                                                flex: 1, 
                                                padding: 8, 
                                                alignItems: 'center', 
                                                borderRadius: 6,
                                                backgroundColor: mediaSourceType !== MediaSourceType.UPLOADED ? '#fff' : 'transparent',
                                                shadowOpacity: mediaSourceType !== MediaSourceType.UPLOADED ? 0.1 : 0
                                            }}
                                            onPress={() => setMediaSourceType(MediaSourceType.EXTERNAL_URL)}
                                        >
                                            <Text style={{fontWeight: '600', color: '#333'}}>{t('questionEditor.link')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {mediaSourceType === MediaSourceType.UPLOADED ? (
                                    <>
                                        {!selectedMedia ? (
                                            <TouchableOpacity
                                                style={styles.mediaButton}
                                                onPress={showMediaOptions}
                                            >
                                                <MaterialCommunityIcons name="image-plus" size={24} color="#4CAF50" />
                                                <Text style={styles.mediaButtonText}>{t('mediaQuestion.selectMedia')}</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.mediaPreviewContainer}>
                                                {selectedMedia.isImage && (
                                                    <Image
                                                        source={{ uri: selectedMedia.uri }}
                                                        style={styles.mediaPreview}
                                                        resizeMode="cover"
                                                    />
                                                )}
                                                {selectedMedia.isVideo && (
                                                    <View style={styles.videoPlaceholder}>
                                                        <MaterialCommunityIcons name="video" size={48} color="#666" />
                                                        <Text style={styles.videoText}>{t('questionEditor.videoFile')}</Text>
                                                    </View>
                                                )}
                                                {!selectedMedia.isImage && !selectedMedia.isVideo && (
                                                    <View style={styles.videoPlaceholder}>
                                                        <MaterialCommunityIcons name="music" size={48} color="#666" />
                                                        <Text style={styles.videoText}>{t('questionEditor.audioFile')}</Text>
                                                    </View>
                                                )}

                                                <View style={styles.mediaInfo}>
                                                    <Text style={styles.mediaName} numberOfLines={1}>
                                                        {selectedMedia.name}
                                                    </Text>
                                                    <Text style={styles.mediaSize}>
                                                        {selectedMedia.sizeFormatted} • {selectedMedia.isImage ? t('questions.image') : selectedMedia.isVideo ? t('questions.video') : t('questions.audioType')}
                                                    </Text>
                                                </View>

                                                <TouchableOpacity
                                                    style={styles.removeButton}
                                                    onPress={handleRemoveMedia}
                                                >
                                                    <MaterialCommunityIcons name="close" size={24} color="#f44336" />
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        {/* Upload Progress */}
                                        {isUploading && (
                                            <View style={styles.uploadProgressContainer}>
                                                <Text style={styles.uploadProgressText}>
                                                    Uploading... {Math.round(uploadProgress)}%
                                                </Text>
                                                <View style={styles.progressBar}>
                                                    <View
                                                        style={[
                                                            styles.progressFill,
                                                            { width: `${uploadProgress}%` }
                                                        ]}
                                                    />
                                                </View>
                                            </View>
                                        )}

                                        {/* Upload Button */}
                                        {selectedMedia && !uploadedMediaInfo && !isUploading && (
                                            <TouchableOpacity
                                                style={styles.uploadButton}
                                                onPress={handleUploadMedia}
                                            >
                                                <MaterialCommunityIcons name="cloud-upload" size={20} color="#fff" />
                                                <Text style={styles.buttonText}>{t('questionEditor.upload')}</Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Success Message */}
                                        {uploadedMediaInfo && (
                                            <View style={styles.successContainer}>
                                                <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                                                <Text style={styles.successText}>Media uploaded successfully!</Text>
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <View>
                                        <Text style={[styles.label, {fontSize: 14}]}>Video URL (YouTube/Vimeo)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={externalUrl}
                                            onChangeText={setExternalUrl}
                                            placeholder={t('questionEditor.pasteLinkPlaceholder')}
                                            placeholderTextColor="#999"
                                            autoCapitalize="none"
                                        />
                                        
                                        {externalUrl && (
                                            <View style={{marginTop: 12}}>
                                                <ExternalVideoPlayer
                                                    mediaSourceType={isValidYouTubeUrl(externalUrl) ? MediaSourceType.YOUTUBE : MediaSourceType.EXTERNAL_URL}
                                                    videoUrl={externalUrl}
                                                    videoId={extractYouTubeVideoId(externalUrl) || undefined}
                                                    startTime={qStartTime}
                                                    endTime={qEndTime}
                                                    height={200}
                                                />
                                                
                                                <Text style={[styles.label, {marginTop: 12, fontSize: 14}]}>{t('questionEditor.playbackRange')}</Text>
                                                <TimeRangeInput
                                                    startTime={qStartTime}
                                                    endTime={qEndTime}
                                                    onStartTimeChange={setQStartTime}
                                                    onEndTimeChange={setQEndTime}
                                                />
                                            </View>
                                        )}

                                        {/* Answer Configuration */}
                                        <View style={{marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee'}}>
                                            <Text style={styles.label}>Answer Verification</Text>
                                            
                                            <Text style={[styles.label, {fontSize: 14}]}>Answer Video</Text>
                                            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12}}>
                                                {['TEXT', 'SAME', 'DIFFERENT'].map((type) => (
                                                    <TouchableOpacity
                                                        key={type}
                                                        onPress={() => setAnswerMediaType(type as any)}
                                                        style={{
                                                            paddingHorizontal: 12,
                                                            paddingVertical: 6,
                                                            borderRadius: 16,
                                                            backgroundColor: answerMediaType === type ? '#4CAF50' : '#f0f0f0',
                                                        }}
                                                    >
                                                        <Text style={{color: answerMediaType === type ? '#fff' : '#666', fontSize: 12}}>
                                                            {type === 'TEXT' ? 'Text Only' : type === 'SAME' ? 'Same Video' : 'Diff Video'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>

                                            {answerMediaType === 'SAME' && (
                                                <View>
                                                    <Text style={[styles.label, {fontSize: 14}]}>Answer Segment</Text>
                                                    <TimeRangeInput
                                                        startTime={aStartTime}
                                                        endTime={aEndTime}
                                                        onStartTimeChange={setAStartTime}
                                                        onEndTimeChange={setAEndTime}
                                                    />
                                                </View>
                                            )}

                                            {answerMediaType === 'DIFFERENT' && (
                                                <View>
                                                    <TextInput
                                                        style={[styles.input, {marginBottom: 8}]}
                                                        value={answerUrl}
                                                        onChangeText={setAnswerUrl}
                                                        placeholder="Answer Video URL..."
                                                    />
                                                    <TimeRangeInput
                                                        startTime={aStartTime}
                                                        endTime={aEndTime}
                                                        onStartTimeChange={setAStartTime}
                                                        onEndTimeChange={setAEndTime}
                                                    />
                                                </View>
                                            )}

                                            <Text style={[styles.label, {fontSize: 14, marginTop: 12}]}>Text Verification (Optional)</Text>
                                            <TextInput
                                                style={[styles.input, {minHeight: 60}]}
                                                value={answerTextVerification}
                                                onChangeText={setAnswerTextVerification}
                                                placeholder="Explanation shown after answering..."
                                                multiline
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Audio Challenge Section - For AUDIO type */}
                        {!isEditing && questionType === 'AUDIO' && (
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
                        onPress={handleSubmit}
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
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fff',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
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
    // Visibility styles
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
    // Media styles
    mediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 2,
        borderColor: '#4CAF50',
        borderRadius: 8,
        borderStyle: 'dashed',
        gap: 8,
    },
    mediaButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4CAF50',
    },
    mediaPreviewContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        position: 'relative',
    },
    mediaPreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    videoPlaceholder: {
        width: '100%',
        height: 200,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    videoText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
    mediaInfo: {
        marginBottom: 8,
    },
    mediaName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    mediaSize: {
        fontSize: 12,
        color: '#666',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 4,
    },
    uploadProgressContainer: {
        marginTop: 12,
    },
    uploadProgressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F3',
        padding: 14,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
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
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        marginTop: 12,
    },
    successText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
});

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default CreateQuestionWithMedia;