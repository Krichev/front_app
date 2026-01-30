// src/screens/CreateWWWQuestScreen/components/RegularQuestionEditor.tsx
import React, {useCallback, useEffect, useState} from 'react';
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
import {QuestionFormData} from '../hooks/useQuestionsManager';
import FileService, {ProcessedFileInfo} from '../../../services/speech/FileService';
import {QuestionType} from "../../../services/wwwGame/questionService";
import {TopicTreeSelector} from '../../../shared/ui/TopicSelector';
import {SelectableTopic} from '../../../entities/TopicState';
import {useAppStyles} from '../../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../../shared/ui/theme';
import {detectVideoPlatform, extractYouTubeVideoId, getYouTubeThumbnail,} from '../../../utils/youtubeUtils';
import { LocalizedInput } from '../../../shared/ui/LocalizedInput';
import { LocalizedString, EMPTY_LOCALIZED_STRING, getLocalizedValue, isLocalizedStringEmpty } from '../../../shared/types/localized';
import { useI18n } from '../../../app/providers/I18nProvider';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RegularQuestionEditorProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (questionData: QuestionFormData) => void;
    isSubmitting?: boolean;
    preSelectedMediaType?: 'image' | 'video' | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Get safe icon name with fallback
 */
const SafeIcon: React.FC<{name: string; size: number; color?: string; style?: any}> = ({name, size, color, style}) => {
    // Fallback to a safe default if name is falsy
    const safeName = name || 'help-circle';
    return <MaterialCommunityIcons name={safeName} size={size} color={color} style={style} />;
};

const RegularQuestionEditor: React.FC<RegularQuestionEditorProps> = ({
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
    const [showVideoModeSelector, setShowVideoModeSelector] = useState(false);

    // Media input mode for video: upload file or paste link
    const [mediaInputMode, setMediaInputMode] = useState<'upload' | 'link'>('upload');

    // External video URL state
    const [externalVideoUrl, setExternalVideoUrl] = useState('');
    const [detectedPlatform, setDetectedPlatform] = useState<'youtube' | 'vimeo' | 'direct' | null>(null);
    const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

    // Video timing (optional, in seconds)
    const [videoStartTime, setVideoStartTime] = useState<string>('');
    const [videoEndTime, setVideoEndTime] = useState<string>('');

    // Validate and detect platform when URL changes
    useEffect(() => {
        if (externalVideoUrl.trim()) {
            const platform = detectVideoPlatform(externalVideoUrl);
            setDetectedPlatform(platform);
            
            if (platform === 'youtube') {
                const videoId = extractYouTubeVideoId(externalVideoUrl);
                setYoutubeVideoId(videoId);
            } else {
                setYoutubeVideoId(null);
            }
        } else {
            setDetectedPlatform(null);
            setYoutubeVideoId(null);
        }
    }, [externalVideoUrl]);

    /**
     * Get safe icon name with fallback
     */
    const getMediaIconName = (questionType: QuestionType): string => {
        switch (questionType) {
            case 'VIDEO':
                return 'video';
            case 'AUDIO':
                return 'music';
            case 'IMAGE':
                return 'image';
            case 'TEXT':
            default:
                return 'file-document';
        }
    };

    /**
     * Determine question type based on selected media (IMPLICIT)
     * Returns TEXT if no media selected
     */
    const getQuestionType = (): QuestionType => {
        // Check for external video URL first
        if (mediaInputMode === 'link' && externalVideoUrl.trim() && detectedPlatform) {
            return 'VIDEO';
        }

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
     * Handle image picking from library
     */
    const handleImagePick = useCallback(async () => {
        try {
            setIsSelectingMedia(true);
            setMediaSelectionType('image');
            const result = await FileService.pickImage();
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
    }, [t]);

    /**
     * Handle video picking from library
     */
    const handleVideoPick = useCallback(async () => {
        try {
            console.log('🎥 Video start');
            setIsSelectingMedia(true);
            setMediaSelectionType('video');
            const result = await FileService.pickVideo();
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
    }, [t]);

    /**
     * Handle audio picking from library
     */
    const handleAudioPick = useCallback(async () => {
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
    }, [t]);

    /**
     * Handle media selection based on type
     */
    const handleSelectMedia = useCallback(async (type: 'image' | 'video' | 'audio') => {
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
    }, [handleImagePick, handleVideoPick, handleAudioPick, t]);

    useEffect(() => {
        if (visible && preSelectedMediaType) {
            handleSelectMedia(preSelectedMediaType);
        }
    }, [visible, preSelectedMediaType, handleSelectMedia]);

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

        // Validate external video if in link mode
        if (questionType === 'VIDEO' && mediaInputMode === 'link') {
            if (!externalVideoUrl.trim()) {
                Alert.alert(t('createQuest.questionEditor.errorTitle'), t('createQuest.questionEditor.enterVideoUrl'));
                return;
            }
            if (!detectedPlatform) {
                Alert.alert(t('createQuest.questionEditor.errorTitle'), t('createQuest.questionEditor.validVideoUrl'));
                return;
            }
            // Validate time range if both provided
            const startTime = videoStartTime ? parseFloat(videoStartTime) : undefined;
            const endTime = videoEndTime ? parseFloat(videoEndTime) : undefined;
            if (startTime !== undefined && endTime !== undefined && endTime <= startTime) {
                Alert.alert(t('createQuest.questionEditor.errorTitle'), t('createQuest.questionEditor.endTimeError'));
                return;
            }
        }

        // DETAILED LOGGING for debugging
        console.log('🎬 [RegularQuestionEditor] handleSubmit called');
        console.log('🎬 [RegularQuestionEditor] selectedMedia:', selectedMedia ? {
            uri: selectedMedia.uri?.substring(0, 100),
            name: selectedMedia.name,
            type: selectedMedia.type,
            size: selectedMedia.size,
            isVideo: selectedMedia.type?.startsWith('video/'),
        } : 'null');
        console.log('🎬 [RegularQuestionEditor] Detected questionType:', questionType);

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
            mediaFile: (mediaInputMode === 'upload' && selectedMedia) ? {
                uri: selectedMedia.uri,
                name: selectedMedia.name || `media_${Date.now()}.${selectedMedia.type?.split('/')[1] || 'mp4'}`,
                type: selectedMedia.type || 'video/mp4',
            } : undefined,
            // External media (new)
            mediaSourceType: mediaInputMode === 'link' && detectedPlatform 
                ? (detectedPlatform === 'youtube' ? 'YOUTUBE' : detectedPlatform === 'vimeo' ? 'VIMEO' : 'EXTERNAL_URL')
                : (selectedMedia ? 'UPLOADED' : undefined),
            externalMediaUrl: mediaInputMode === 'link' ? externalVideoUrl.trim() : undefined,
            questionVideoStartTime: videoStartTime ? parseFloat(videoStartTime) : undefined,
            questionVideoEndTime: videoEndTime ? parseFloat(videoEndTime) : undefined,
        };

        console.log('📤 [RegularQuestionEditor] Submitting with mediaFile:', !!questionData.mediaFile);

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
        // Reset external video state
        setMediaInputMode('upload');
        setExternalVideoUrl('');
        setVideoStartTime('');
        setVideoEndTime('');
        setDetectedPlatform(null);
        setYoutubeVideoId(null);
        setShowVideoModeSelector(false);
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
                        <SafeIcon
                            name={getMediaIconName(currentQuestionType)}
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
                    <SafeIcon
                        name="file-upload"
                        size={16}
                        color={theme.colors.primary.main}
                    />
                    <Text style={styles.mediaStatusText}>
                        {`${getQuestionType()} Selected - will upload when saved`}
                    </Text>
                </View>

                {/* Remove Button */}
                <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={handleRemoveMedia}
                >
                    <SafeIcon name="delete" size={20} color={theme.colors.error.main}/>
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
                        <SafeIcon name="close" size={24} color={isSubmitting ? theme.colors.text.disabled : theme.colors.primary.main}/>
                    </TouchableOpacity>
                    <Text style={modal.headerTitle}>{t('createQuest.questionEditor.title')}</Text>
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
                                    <SafeIcon name="image" size={24} color={theme.colors.primary.main} />
                                )}
                                <Text style={styles.mediaButtonText}>{t('questions.image')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.mediaButton, isSelectingMedia && styles.mediaButtonDisabled]}
                                onPress={() => {
                                    // Show the video mode selector instead of immediately opening picker
                                    // If already showing and in video mode, toggle off
                                    if (showVideoModeSelector) {
                                        setShowVideoModeSelector(false);
                                    } else {
                                        setShowVideoModeSelector(true);
                                        // Default to upload mode if no link present
                                        if (mediaInputMode !== 'link' || !externalVideoUrl) {
                                            setMediaInputMode('upload');
                                        }
                                    }
                                }}
                                disabled={isSelectingMedia}
                            >
                                {isSelectingMedia && mediaSelectionType === 'video' ? (
                                    <ActivityIndicator size="small" color={theme.colors.primary.main} />
                                ) : (
                                    <SafeIcon name="video" size={24} color={theme.colors.primary.main} />
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
                                    <SafeIcon name="music" size={24} color={theme.colors.primary.main} />
                                )}
                                <Text style={styles.mediaButtonText}>{t('questions.audioType')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Video Input Mode Selector - Shows after clicking Video button or when video selected */}
                        {(showVideoModeSelector || getQuestionType() === 'VIDEO' || selectedMedia?.type?.startsWith('video/') || (mediaInputMode === 'link' && externalVideoUrl)) && (
                            <View style={styles.videoModeSection}>
                                <Text style={form.sectionTitle}>{t('createQuest.questionEditor.videoSource')}</Text>
                                
                                {/* Mode Toggle */}
                                <View style={styles.modeToggleContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.modeToggleButton,
                                            mediaInputMode === 'upload' && styles.modeToggleButtonActive
                                        ]}
                                        onPress={() => {
                                            setMediaInputMode('upload');
                                            setExternalVideoUrl('');
                                            setVideoStartTime('');
                                            setVideoEndTime('');
                                            // Only trigger picker if no media selected yet
                                            if (!selectedMedia) {
                                                handleSelectMedia('video');
                                            }
                                        }}
                                    >
                                        <SafeIcon 
                                            name="upload" 
                                            size={18} 
                                            color={mediaInputMode === 'upload' ? '#fff' : theme.colors.primary.main} 
                                        />
                                        <Text style={[
                                            styles.modeToggleText,
                                            mediaInputMode === 'upload' && styles.modeToggleTextActive
                                        ]}>
                                            {t('createQuest.questionEditor.upload')}
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={[
                                            styles.modeToggleButton,
                                            mediaInputMode === 'link' && styles.modeToggleButtonActive
                                        ]}
                                        onPress={() => {
                                            setMediaInputMode('link');
                                            setSelectedMedia(undefined);
                                        }}
                                    >
                                        <SafeIcon 
                                            name="link" 
                                            size={18} 
                                            color={mediaInputMode === 'link' ? '#fff' : theme.colors.primary.main} 
                                        />
                                        <Text style={[
                                            styles.modeToggleText,
                                            mediaInputMode === 'link' && styles.modeToggleTextActive
                                        ]}>
                                            {t('createQuest.questionEditor.link')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Link Input Mode */}
                                {mediaInputMode === 'link' && (
                                    <View style={styles.linkInputSection}>
                                        {/* URL Input */}
                                        <View style={styles.urlInputContainer}>
                                            <TextInput
                                                style={[styles.urlInput, !detectedPlatform && externalVideoUrl.trim().length > 0 && styles.urlInputError]}
                                                placeholder={t('createQuest.questionEditor.pasteLinkPlaceholder')}
                                                placeholderTextColor={theme.colors.text.disabled}
                                                value={externalVideoUrl}
                                                onChangeText={setExternalVideoUrl}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                keyboardType="url"
                                            />
                                            {externalVideoUrl.trim().length > 0 && (
                                                <View style={styles.urlValidationIcon}>
                                                    <SafeIcon
                                                        name={detectedPlatform ? 'check-circle' : 'alert-circle'}
                                                        size={20}
                                                        color={detectedPlatform ? '#4CAF50' : '#F44336'}
                                                    />
                                                </View>
                                            )}
                                        </View>

                                        {/* Platform Detection Badge */}
                                        {detectedPlatform && (
                                            <View style={styles.platformBadge}>
                                                <SafeIcon
                                                    name={detectedPlatform === 'youtube' ? 'youtube' : detectedPlatform === 'vimeo' ? 'vimeo' : 'video'}
                                                    size={16}
                                                    color={detectedPlatform === 'youtube' ? '#FF0000' : theme.colors.primary.main}
                                                />
                                                <Text style={styles.platformBadgeText}>
                                                    {detectedPlatform === 'youtube' ? 'YouTube' : detectedPlatform === 'vimeo' ? 'Vimeo' : 'Direct Video'}
                                                </Text>
                                            </View>
                                        )}

                                        {/* YouTube Thumbnail Preview */}
                                        {youtubeVideoId && (
                                            <View style={styles.thumbnailPreview}>
                                                <Image
                                                    source={{ uri: getYouTubeThumbnail(youtubeVideoId) }}
                                                    style={styles.youtubeThumbnail}
                                                    resizeMode="cover"
                                                />
                                                <View style={styles.playIconOverlay}>
                                                    <SafeIcon name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
                                                </View>
                                            </View>
                                        )}

                                        {/* Time Range Inputs (Optional) */}
                                        <View style={styles.timeRangeSection}>
                                            <Text style={styles.timeRangeLabel}>{t('createQuest.questionEditor.playbackRange')}</Text>
                                            <View style={styles.timeInputsRow}>
                                                <View style={styles.timeInputContainer}>
                                                    <Text style={styles.timeInputLabel}>{t('createQuest.questionEditor.startSec')}</Text>
                                                    <TextInput
                                                        style={styles.timeInput}
                                                        placeholder="0"
                                                        placeholderTextColor={theme.colors.text.disabled}
                                                        value={videoStartTime}
                                                        onChangeText={setVideoStartTime}
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                                <View style={styles.timeInputContainer}>
                                                    <Text style={styles.timeInputLabel}>{t('createQuest.questionEditor.endSec')}</Text>
                                                    <TextInput
                                                        style={styles.timeInput}
                                                        placeholder="auto"
                                                        placeholderTextColor={theme.colors.text.disabled}
                                                        value={videoEndTime}
                                                        onChangeText={setVideoEndTime}
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                            </View>
                                        </View>

                                        {/* Clear Link Button */}
                                        {externalVideoUrl.length > 0 && (
                                            <TouchableOpacity
                                                style={styles.clearLinkButton}
                                                onPress={() => {
                                                    setExternalVideoUrl('');
                                                    setVideoStartTime('');
                                                    setVideoEndTime('');
                                                }}
                                            >
                                                <SafeIcon name="close-circle" size={18} color={theme.colors.error.main} />
                                                <Text style={styles.clearLinkText}>{t('createQuest.questionEditor.clearLink')}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {/* Upload Mode - Show pick button if no media selected */}
                                {mediaInputMode === 'upload' && !selectedMedia && (
                                    <TouchableOpacity
                                        style={styles.pickVideoButton}
                                        onPress={handleVideoPick}
                                        disabled={isSelectingMedia}
                                    >
                                        {isSelectingMedia ? (
                                            <ActivityIndicator size="small" color={theme.colors.primary.main} />
                                        ) : (
                                            <>
                                                <SafeIcon name="file-video-outline" size={24} color={theme.colors.primary.main} />
                                                <Text style={styles.pickVideoButtonText}>{t('createQuest.questionEditor.selectVideoDevice')}</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Media Preview - Only show for non-link modes (image/audio or uploaded video) */}
                        {mediaInputMode !== 'link' && renderMediaPreview()}
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
    // Video mode section styles
    videoModeSection: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
    },
    modeToggleContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        borderRadius: 8,
        backgroundColor: '#e9ecef',
        padding: 4,
    },
    modeToggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        gap: 6,
    },
    modeToggleButtonActive: {
        backgroundColor: '#007AFF',
    },
    modeToggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    modeToggleTextActive: {
        color: '#fff',
    },
    linkInputSection: {
        gap: 12,
    },
    urlInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    urlInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        color: '#333',
    },
    urlInputError: {
        borderColor: '#F44336',
    },
    urlValidationIcon: {
        paddingRight: 12,
    },
    platformBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#e3f2fd',
        borderRadius: 12,
    },
    platformBadgeText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#1976d2',
    },
    thumbnailPreview: {
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
    },
    youtubeThumbnail: {
        width: '100%',
        height: 180,
        backgroundColor: '#000',
    },
    playIconOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    timeRangeSection: {
        marginTop: 8,
    },
    timeRangeLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    timeInputsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    timeInputContainer: {
        flex: 1,
    },
    timeInputLabel: {
        fontSize: 11,
        color: '#888',
        marginBottom: 4,
    },
    timeInput: {
        backgroundColor: '#fff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: '#333',
    },
    clearLinkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    clearLinkText: {
        fontSize: 14,
        color: '#F44336',
    },
    pickVideoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
    },
    pickVideoButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
}));

export default RegularQuestionEditor;

