// src/screens/components/AudioQuestionForm.tsx
import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Picker} from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import DocumentPicker from 'react-native-document-picker';
import {AUDIO_CHALLENGE_TYPES_INFO, AudioChallengeType,} from '../../types/audioChallenge.types';
import {QuestionVisibility} from '../../entities/QuizState/model/types/question.types';
import {TopicTreeSelector} from '../../shared/ui/TopicSelector';
import {SelectableTopic} from '../../entities/TopicState';
import {AudioChallengeTypeSelector} from '../../shared/ui/AudioChallengeTypeSelector/AudioChallengeTypeSelector';
import AnswerModeSelector from './AnswerModeSelector';
import ReplaySettingsSection from './ReplaySettingsSection';
import FileService, {ProcessedFileInfo} from '../../services/speech/FileService';
import {AudioRecorderCard} from '../../components/AudioRecorder/AudioRecorderCard';
import {AudioPlayer} from './AudioPlayer';
import {useAppStyles} from '../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../shared/ui/theme';
import {useTranslation} from 'react-i18next';
import { LocalizedInput } from '../../shared/ui/LocalizedInput';
import { LocalizedString, EMPTY_LOCALIZED_STRING, isLocalizedStringEmpty, createLocalizedString } from '../../shared/types/localized';
import { useI18n } from '../../app/providers/I18nProvider';
import { safeRNFS as RNFS } from '../../shared/lib/fileSystem';

// ============================================================================
// TYPES
// ============================================================================

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface AudioQuestionFormData {
    // Core question fields
    question: LocalizedString;
    answer: LocalizedString;
    difficulty: Difficulty;
    topic: string;
    topicId?: number;
    visibility: QuestionVisibility;
    acceptSimilarAnswers: boolean;
    additionalInfo: LocalizedString;

    // Audio challenge specific
    audioChallengeType: AudioChallengeType | null;
    referenceAudioFile: ProcessedFileInfo | null;
    audioSegmentStart: number;
    audioSegmentEnd: number | null;
    minimumScorePercentage: number;

    // Rhythm-specific
    rhythmBpm: number | null;
    rhythmTimeSignature: string;
    answerInputMode: 'TAP' | 'AUDIO' | 'BOTH';
    allowReplay: boolean;
    maxReplays: number; // 0 = unlimited
    timeLimitSeconds: number | null;
}

interface AudioQuestionFormProps {
    /** Initial values for editing */
    initialValues?: Partial<AudioQuestionFormData>;
    /** Called when form is submitted */
    onSubmit: (data: AudioQuestionFormData) => Promise<void>;
    /** Called when form is cancelled */
    onCancel?: () => void;
    /** Whether we're in edit mode */
    isEditing?: boolean;
    /** Whether form is currently submitting */
    isSubmitting?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIME_SIGNATURES = ['4/4', '3/4', '2/4', '6/8', '12/8', '5/4', '7/8'];

const DEFAULT_FORM_DATA: AudioQuestionFormData = {
    question: EMPTY_LOCALIZED_STRING,
    answer: EMPTY_LOCALIZED_STRING,
    difficulty: 'MEDIUM',
    topic: '',
    topicId: undefined,
    visibility: QuestionVisibility.PRIVATE,
    acceptSimilarAnswers: false,
    additionalInfo: EMPTY_LOCALIZED_STRING,
    audioChallengeType: null,
    referenceAudioFile: null,
    audioSegmentStart: 0,
    audioSegmentEnd: null,
    minimumScorePercentage: 60,
    rhythmBpm: 120,
    rhythmTimeSignature: '4/4',
    answerInputMode: 'BOTH',
    allowReplay: true,
    maxReplays: 3,
    timeLimitSeconds: null,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const AudioQuestionForm: React.FC<AudioQuestionFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    isEditing = false,
    isSubmitting = false,
}) => {
    const {t} = useTranslation();
    const {screen, form, theme} = useAppStyles();
    const styles = themeStyles;
    const { currentLanguage } = useI18n();
    // ============================================================================
    // STATE
    // ============================================================================

    const [formData, setFormData] = useState<AudioQuestionFormData>({
        ...DEFAULT_FORM_DATA,
        ...initialValues,
    });

    const [isUploading, setIsUploading] = useState(false);
    const [audioInputMode, setAudioInputMode] = useState<'upload' | 'record'>('record');
    const [errors, setErrors] = useState<Partial<Record<keyof AudioQuestionFormData, string>>>({});
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [audioError, setAudioError] = useState(false);

    // Audio preview and trim state
    const [audioDuration, setAudioDuration] = useState(0);

    // ============================================================================
    // DERIVED STATE
    // ============================================================================

    const selectedTypeInfo = useMemo(() => {
        if (!formData.audioChallengeType) return null;
        return AUDIO_CHALLENGE_TYPES_INFO[formData.audioChallengeType] || null;
    }, [formData.audioChallengeType]);

    // Derived visibility flags with defaults
    const showRhythmSettings = selectedTypeInfo?.showRhythmSettings ?? false;
    const showClassificationSection = selectedTypeInfo?.showClassificationSection ?? true;
    const showAudioSegmentTrim = selectedTypeInfo?.showAudioSegmentTrim ?? false;
    const requiresReferenceAudio = selectedTypeInfo?.requiresReferenceAudio ?? false;
    const rhythmSettingsHint = selectedTypeInfo?.rhythmSettingsHint;

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const updateField = useCallback(<K extends keyof AudioQuestionFormData>(
        field: K,
        value: AudioQuestionFormData[K]
    ) => {
        setFormData(prev => ({...prev, [field]: value}));
        // Clear error when field is updated
        if (errors[field]) {
            setErrors(prev => ({...prev, [field]: undefined}));
        }
    }, [errors]);

    const handleTypeChange = useCallback((type: AudioChallengeType) => {
        const typeInfo = AUDIO_CHALLENGE_TYPES_INFO[type];
        
        setFormData(prev => {
            const newData = {...prev, audioChallengeType: type};
            
            // Reset fields based on new type configuration
            if (!typeInfo.showRhythmSettings) {
                newData.rhythmBpm = null;
                newData.rhythmTimeSignature = '4/4';
            } else if (prev.rhythmBpm === null) {
                // Restore default BPM if showing settings again
                newData.rhythmBpm = 120;
            }

            if (!typeInfo.showAudioSegmentTrim) {
                newData.audioSegmentStart = 0;
                newData.audioSegmentEnd = null;
            }
            
            return newData;
        });

        // Clear type error
        setErrors(prev => ({...prev, audioChallengeType: undefined}));
    }, []);

    const handleSelectTopic = useCallback((selectedTopic: SelectableTopic | null) => {
        if (selectedTopic) {
            setFormData(prev => ({
                ...prev,
                topic: selectedTopic.name,
                topicId: selectedTopic.id,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                topic: '',
                topicId: undefined,
            }));
        }
    }, []);

    const handleAudioPick = useCallback(async () => {
        try {
            setIsUploading(true);
            setAudioError(false);
            setIsAudioLoading(true);

            const result = await DocumentPicker.pick({
                type: [
                    DocumentPicker.types.audio,
                    'audio/mpeg',
                    'audio/mp3',
                    'audio/wav',
                    'audio/m4a',
                    'audio/aac',
                    'audio/ogg',
                    'audio/webm',
                ],
                copyTo: 'cachesDirectory',
            });

            const file = result[0];
            if (!file) {
                setIsAudioLoading(false);
                throw new Error(t('questionEditor.errorMedia'));
            }

            // Process the file info
            const processedFile: ProcessedFileInfo = {
                uri: file.fileCopyUri || file.uri,
                name: file.name || `audio_${Date.now()}.mp3`,
                type: file.type || 'audio/mpeg',
                size: file.size || 0,
                isImage: false,
                isVideo: false,
                extension: FileService.getExtension(file.name || ''),
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
                sizeFormatted: FileService.formatFileSize(file.size || 0),
            };

            // Validate file
            const validation = FileService.validateFile(processedFile);
            if (!validation.isValid) {
                setIsAudioLoading(false);
                Alert.alert(t('questionEditor.invalidFile'), validation.error || t('questionEditor.validAudio'));
                return;
            }

            updateField('referenceAudioFile', processedFile);
            
            // Clear any audio-related errors
            setErrors(prev => ({...prev, referenceAudioFile: undefined}));

        } catch (error) {
            setIsAudioLoading(false);
            if (!DocumentPicker.isCancel(error)) {
                console.error('Audio pick error:', error);
                Alert.alert(t('userQuestions.errorTitle'), t('questionEditor.errorMedia'));
            }
        } finally {
            setIsUploading(false);
        }
    }, [updateField, t]);

    const handleRecordingComplete = useCallback(async (path: string) => {
        try {
            setAudioError(false);
            setIsAudioLoading(true);
            // Validate file size
            const stats = await RNFS.stat(path);
            console.log('Recording stats:', stats);

            if (stats.size === 0) {
                setIsAudioLoading(false);
                Alert.alert(t('userQuestions.errorTitle'), 'Recording failed: File is empty (0 bytes). Please check microphone permissions and try again.');
                return;
            }

            const processedFile: ProcessedFileInfo = {
                uri: `file://${path}`,
                name: `recording_${Date.now()}.wav`,
                type: 'audio/wav',
                size: stats.size,
                isImage: false,
                isVideo: false,
                extension: 'wav',
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
                sizeFormatted: FileService.formatFileSize(stats.size),
            };
            updateField('referenceAudioFile', processedFile);
            setErrors(prev => ({...prev, referenceAudioFile: undefined}));
        } catch (error) {
            setIsAudioLoading(false);
            console.error('Error processing recording:', error);
            Alert.alert(t('userQuestions.errorTitle'), 'Failed to process recording.');
        }
    }, [updateField, t]);

    const handleRemoveAudio = useCallback(() => {
        updateField('referenceAudioFile', null);
        updateField('audioSegmentStart', 0);
        updateField('audioSegmentEnd', null);
        setAudioError(false);
        setIsAudioLoading(false);
        setAudioDuration(0);
        setPlaybackPosition(0);
        setIsPaused(true);
    }, [updateField]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const validateForm = useCallback((): boolean => {
        const newErrors: Partial<Record<keyof AudioQuestionFormData, string>> = {};

        // Question/Answer are optional for audio challenges (will be auto-filled)
        
        if (!formData.audioChallengeType) {
            newErrors.audioChallengeType = t('audioQuestion.selectChallengeType');
        }

        // Reference audio validation (only if required by type)
        if (requiresReferenceAudio && !formData.referenceAudioFile) {
            newErrors.referenceAudioFile = t('audioQuestion.audioRequired');
        }

        // Segment time validation
        if (formData.audioSegmentEnd !== null && formData.audioSegmentStart >= formData.audioSegmentEnd) {
            newErrors.audioSegmentEnd = t('questionEditor.endTimeError');
        }
        if (audioDuration > 0) {
            if (formData.audioSegmentStart >= audioDuration) {
                newErrors.audioSegmentStart = t('audioQuestion.invalidStartTime');
            }
            if (formData.audioSegmentEnd !== null && formData.audioSegmentEnd > audioDuration) {
                newErrors.audioSegmentEnd = t('audioQuestion.invalidEndTime');
            }
        }

        // Score validation
        if (formData.minimumScorePercentage < 0 || formData.minimumScorePercentage > 100) {
            newErrors.minimumScorePercentage = 'Score must be between 0 and 100';
        }

        // BPM validation (only if section is shown)
        if (showRhythmSettings && formData.rhythmBpm !== null) {
            if (formData.rhythmBpm < 40 || formData.rhythmBpm > 240) {
                newErrors.rhythmBpm = 'BPM must be between 40 and 240';
            }
        } else if (showRhythmSettings && formData.rhythmBpm === null) {
             // If section is shown, BPM is generally expected unless strictly optional
             // For RHYTHM_CREATION it is required. For SINGING it is optional (hint).
             if (formData.audioChallengeType === 'RHYTHM_CREATION') {
                 newErrors.rhythmBpm = 'BPM is required';
             }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, requiresReferenceAudio, showRhythmSettings, t, audioDuration]);

    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            Alert.alert(t('userQuestions.errorTitle'), t('alerts.validationError'));
            return;
        }

        // Auto-fill optional fields for audio challenges
        const submissionData = { ...formData };
        if (isLocalizedStringEmpty(submissionData.question)) {
            // Use instructions from type info if available, or default
            const typeLabel = formData.audioChallengeType ? AUDIO_CHALLENGE_TYPES_INFO[formData.audioChallengeType]?.label : 'Audio Challenge';
            submissionData.question = createLocalizedString(`Complete the ${typeLabel}`, currentLanguage);
        }
        if (isLocalizedStringEmpty(submissionData.answer)) {
            submissionData.answer = createLocalizedString("Audio Response", currentLanguage);
        }

        try {
            await onSubmit(submissionData);
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert(t('userQuestions.errorTitle'), t('userQuestions.saveFailed'));
        }
    }, [formData, validateForm, onSubmit, t, currentLanguage]);

    // ============================================================================
    // RENDER HELPERS
    // ============================================================================

    const renderAudioUploadSection = () => {
        if (!formData.audioChallengeType) return null;
        
        // If type doesn't require reference audio and we don't need to show it
        // (e.g. RHYTHM_CREATION), skip rendering
        if (!requiresReferenceAudio) return null;

        const isRequired = requiresReferenceAudio;

        return (
            <View style={form.section}>
                <View style={form.sectionHeader}>
                    <MaterialCommunityIcons name="file-music" size={20} color={theme.colors.text.primary} />
                    <Text style={form.sectionTitle}>
                        {t('audioQuestion.referenceAudio')} {isRequired ? '*' : `(${t('userQuestions.topicLabel').split(' ')[1]})`}
                    </Text>
                </View>

                {/* Input Mode Tabs */}
                {!formData.referenceAudioFile && (
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, audioInputMode === 'record' && styles.activeTab]}
                            onPress={() => setAudioInputMode('record')}
                        >
                            <MaterialCommunityIcons 
                                name="microphone" 
                                size={20} 
                                color={audioInputMode === 'record' ? theme.colors.primary.main : theme.colors.text.secondary} 
                            />
                            <Text style={[styles.tabText, audioInputMode === 'record' && styles.activeTabText]}>
                                {t('audioQuestion.recordReference')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, audioInputMode === 'upload' && styles.activeTab]}
                            onPress={() => setAudioInputMode('upload')}
                        >
                            <MaterialCommunityIcons 
                                name="upload" 
                                size={20} 
                                color={audioInputMode === 'upload' ? theme.colors.primary.main : theme.colors.text.secondary} 
                            />
                            <Text style={[styles.tabText, audioInputMode === 'upload' && styles.activeTabText]}>
                                {t('createQuest.questionEditor.upload')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {formData.referenceAudioFile ? (
                    <View style={styles.audioPreviewContainer}>
                        <View style={styles.audioPreviewHeader}>
                            <View style={styles.audioInfo}>
                                <MaterialCommunityIcons name="music-circle" size={24} color={theme.colors.primary.main} />
                                <View style={styles.audioDetails}>
                                    <Text style={styles.audioName} numberOfLines={1} ellipsizeMode='middle'>
                                        {formData.referenceAudioFile.name}
                                    </Text>
                                    <Text style={styles.audioSize}>
                                        {formData.referenceAudioFile.sizeFormatted || 'Unknown size'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.audioRemoveButton}
                                onPress={handleRemoveAudio}
                                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                            >
                                <MaterialCommunityIcons name="close-circle" size={28} color={theme.colors.error.main} />
                            </TouchableOpacity>
                        </View>

                        {audioError ? (
                            <View style={styles.audioErrorContainer}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={24} color={theme.colors.error.main} />
                                <Text style={styles.audioErrorText}>{t('audioQuestion.playbackError')}</Text>
                                <TouchableOpacity 
                                    style={styles.retryButton} 
                                    onPress={() => {
                                        setAudioError(false);
                                        setIsAudioLoading(true);
                                    }}
                                >
                                    <Text style={styles.retryText}>{t('common.retry')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.playerWrapper}>
                                {isAudioLoading && (
                                    <View style={styles.playerLoading}>
                                        <ActivityIndicator size="small" color={theme.colors.primary.main} />
                                    </View>
                                )}
                                <AudioPlayer
                                    audioUrl={formData.referenceAudioFile.uri}
                                    segmentStart={formData.audioSegmentStart}
                                    segmentEnd={formData.audioSegmentEnd ?? undefined}
                                    onLoad={(data) => {
                                        setIsAudioLoading(false);
                                        setAudioDuration(data.duration);
                                        if (formData.audioSegmentEnd === null) {
                                            updateField('audioSegmentEnd', data.duration);
                                        }
                                    }}
                                    onError={() => {
                                        setAudioError(true);
                                        setIsAudioLoading(false);
                                    }}
                                    style={styles.themedPlayer}
                                    activeColor={theme.colors.primary.main}
                                />
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.inputArea}>
                        {audioInputMode === 'record' ? (
                            <AudioRecorderCard 
                                onRecordingComplete={handleRecordingComplete}
                            />
                        ) : (
                            <TouchableOpacity
                                style={[
                                    styles.uploadButton,
                                    errors.referenceAudioFile && styles.uploadButtonError,
                                ]}
                                onPress={handleAudioPick}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <ActivityIndicator size="small" color={theme.colors.primary.main} />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="upload" size={24} color={theme.colors.primary.main} />
                                        <Text style={styles.uploadButtonText}>{t('audioQuestion.uploadReference')}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {errors.referenceAudioFile && (
                    <Text style={form.errorText}>{errors.referenceAudioFile}</Text>
                )}

                {/* Audio Segment Picker (moved from separate logic) */}
                {formData.referenceAudioFile && showAudioSegmentTrim && (
                    <View style={styles.segmentSection}>
                        <View style={form.sectionHeader}>
                            <MaterialCommunityIcons name="content-cut" size={20} color={theme.colors.text.primary} />
                            <Text style={form.sectionTitle}>{t('audioQuestion.trimAudio')}</Text>
                        </View>
                        <Text style={form.helperText}>
                            {t('audioQuestion.trimAudioDesc')}
                        </Text>

                        {audioDuration > 0 && (
                            <View style={{marginTop: theme.spacing.md}}>
                                {/* Start Time Slider */}
                                <View style={styles.sliderContainer}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                                        <Text style={form.label}>{t('audioQuestion.segmentStart')}</Text>
                                        <Text style={styles.timeValue}>{formatTime(formData.audioSegmentStart)}</Text>
                                    </View>
                                    <Slider
                                        style={styles.slider}
                                        minimumValue={0}
                                        maximumValue={audioDuration - 1}
                                        value={formData.audioSegmentStart}
                                        onValueChange={(val) => {
                                            const rounded = Math.round(val * 10) / 10;
                                            const safeStartTime = Math.min(rounded, (formData.audioSegmentEnd || audioDuration) - 1);
                                            updateField('audioSegmentStart', safeStartTime);
                                        }}
                                        minimumTrackTintColor={theme.colors.primary.main}
                                        maximumTrackTintColor={theme.colors.border.light}
                                        thumbTintColor={theme.colors.primary.main}
                                        step={0.1}
                                    />
                                </View>

                                {/* End Time Slider */}
                                <View style={styles.sliderContainer}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                                        <Text style={form.label}>{t('audioQuestion.segmentEnd')}</Text>
                                        <Text style={styles.timeValue}>{formatTime(formData.audioSegmentEnd || audioDuration)}</Text>
                                    </View>
                                    <Slider
                                        style={styles.slider}
                                        minimumValue={formData.audioSegmentStart + 1}
                                        maximumValue={audioDuration}
                                        value={formData.audioSegmentEnd || audioDuration}
                                        onValueChange={(val) => {
                                            const rounded = Math.round(val * 10) / 10;
                                            const safeEndTime = Math.max(rounded, formData.audioSegmentStart + 1);
                                            updateField('audioSegmentEnd', safeEndTime);
                                        }}
                                        minimumTrackTintColor={theme.colors.info.main}
                                        maximumTrackTintColor={theme.colors.border.light}
                                        thumbTintColor={theme.colors.info.main}
                                        step={0.1}
                                    />
                                </View>

                                {/* Segment Summary */}
                                <View style={styles.summaryBox}>
                                    <Text style={styles.summaryText}>
                                        {t('audioQuestion.segmentDuration', {
                                            duration: formatTime((formData.audioSegmentEnd || audioDuration) - formData.audioSegmentStart)
                                        })}
                                    </Text>
                                    <Text style={styles.summarySubtext}>
                                        {t('audioQuestion.totalDuration', {
                                            duration: formatTime(audioDuration)
                                        })}
                                    </Text>
                                </View>
                            </View>
                        )}
                        {errors.audioSegmentEnd && (
                            <Text style={form.errorText}>{errors.audioSegmentEnd}</Text>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderPassingScoreSection = () => {
        if (!formData.audioChallengeType) return null;

        return (
            <View style={form.section}>
                <View style={form.sectionHeader}>
                    <MaterialCommunityIcons name="target" size={20} color={theme.colors.text.primary} />
                    <Text style={form.sectionTitle}>{t('audioQuestion.minimumScoreLabel')}</Text>
                </View>

                <Text style={styles.subsectionTitle}>
                    {t('audioQuestion.minimumScoreLabel')}: {formData.minimumScorePercentage}%
                </Text>

                <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>0%</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={100}
                        step={5}
                        value={formData.minimumScorePercentage}
                        onValueChange={(value) => updateField('minimumScorePercentage', value)}
                        minimumTrackTintColor={theme.colors.primary.main}
                        maximumTrackTintColor={theme.colors.border.light}
                        thumbTintColor={theme.colors.primary.main}
                    />
                    <Text style={styles.sliderLabel}>100%</Text>
                </View>

                <View style={styles.scorePresets}>
                    {[30, 50, 60, 70, 80].map((score) => (
                        <TouchableOpacity
                            key={score}
                            style={[
                                styles.scorePreset,
                                formData.minimumScorePercentage === score && styles.scorePresetActive,
                            ]}
                            onPress={() => updateField('minimumScorePercentage', score)}
                        >
                            <Text
                                style={[
                                    styles.scorePresetText,
                                    formData.minimumScorePercentage === score && styles.scorePresetTextActive,
                                ]}
                            >
                                {score}%
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {errors.minimumScorePercentage && (
                    <Text style={form.errorText}>{errors.minimumScorePercentage}</Text>
                )}
            </View>
        );
    };

    const renderTimeLimitSection = () => {
        if (!formData.audioChallengeType) return null;

        const isCustom = formData.timeLimitSeconds !== null;

        return (
            <View style={form.section}>
                <View style={form.sectionHeader}>
                    <MaterialCommunityIcons name="timer-outline" size={20} color={theme.colors.text.primary} />
                    <Text style={form.sectionTitle}>{t('audioChallenge.customTimeLimit')}</Text>
                    <TouchableOpacity 
                        style={[styles.toggleContainer, isCustom && styles.toggleContainerActive]}
                        onPress={() => updateField('timeLimitSeconds', isCustom ? null : 120)}
                    >
                        <View style={[styles.toggleCircle, isCustom && styles.toggleCircleActive]} />
                    </TouchableOpacity>
                </View>

                <Text style={form.helperText}>
                    {t('audioChallenge.customTimeLimitHint')}
                </Text>

                {isCustom && (
                    <View style={styles.bpmContainer}>
                        <TouchableOpacity
                            style={styles.bpmButton}
                            onPress={() => {
                                const newVal = Math.max(30, (formData.timeLimitSeconds || 120) - 10);
                                updateField('timeLimitSeconds', newVal);
                            }}
                        >
                            <MaterialCommunityIcons name="minus" size={24} color={theme.colors.primary.main} />
                        </TouchableOpacity>
                        
                        <View style={styles.bpmInput}>
                            <Text style={theme.typography.heading.h5}>
                                {formData.timeLimitSeconds}s
                            </Text>
                        </View>
                        
                        <TouchableOpacity
                            style={styles.bpmButton}
                            onPress={() => {
                                const newVal = Math.min(300, (formData.timeLimitSeconds || 120) + 10);
                                updateField('timeLimitSeconds', newVal);
                            }}
                        >
                            <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary.main} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const renderRhythmSettingsSection = () => {
        if (!showRhythmSettings) return null;

        return (
            <View style={form.section}>
                <View style={form.sectionHeader}>
                    <MaterialCommunityIcons name="metronome" size={20} color={theme.colors.text.primary} />
                    <Text style={form.sectionTitle}>{t('audioQuestion.bpmLabel')}</Text>
                </View>

                {rhythmSettingsHint && (
                    <Text style={form.helperText}>
                        <MaterialCommunityIcons name="information-outline" size={14} color={theme.colors.text.secondary} /> {rhythmSettingsHint}
                    </Text>
                )}

                {/* BPM Input */}
                <View style={form.formGroup}>
                    <Text style={form.label}>{t('audioQuestion.bpmLabel')}</Text>
                    <View style={styles.bpmContainer}>
                        <TouchableOpacity
                            style={styles.bpmButton}
                            onPress={() => {
                                const newBpm = Math.max(40, (formData.rhythmBpm || 120) - 5);
                                updateField('rhythmBpm', newBpm);
                            }}
                        >
                            <MaterialCommunityIcons name="minus" size={24} color={theme.colors.primary.main} />
                        </TouchableOpacity>
                        
                        <TextInput
                            style={styles.bpmInput}
                            value={formData.rhythmBpm !== null ? String(formData.rhythmBpm) : ''}
                            onChangeText={(text) => {
                                const num = parseInt(text, 10);
                                updateField('rhythmBpm', isNaN(num) ? null : num);
                            }}
                            keyboardType="numeric"
                            placeholder="120"
                            placeholderTextColor={theme.colors.text.disabled}
                        />
                        
                        <TouchableOpacity
                            style={styles.bpmButton}
                            onPress={() => {
                                const newBpm = Math.min(240, (formData.rhythmBpm || 120) + 5);
                                updateField('rhythmBpm', newBpm);
                            }}
                        >
                            <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary.main} />
                        </TouchableOpacity>
                    </View>
                    
                    {/* BPM Presets */}
                    <View style={styles.bpmPresets}>
                        {[60, 90, 120, 140, 180].map((bpm) => (
                            <TouchableOpacity
                                key={bpm}
                                style={[
                                    styles.bpmPreset,
                                    formData.rhythmBpm === bpm && styles.bpmPresetActive,
                                ]}
                                onPress={() => updateField('rhythmBpm', bpm)}
                            >
                                <Text
                                    style={[
                                        styles.bpmPresetText,
                                        formData.rhythmBpm === bpm && styles.bpmPresetTextActive,
                                    ]}
                                >
                                    {bpm}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {errors.rhythmBpm && (
                        <Text style={form.errorText}>{errors.rhythmBpm}</Text>
                    )}
                </View>

                {/* Time Signature Picker */}
                <View style={form.formGroup}>
                    <Text style={form.label}>{t('audioQuestion.timeSignatureLabel')}</Text>
                    <View style={form.pickerContainer}>
                        <Picker
                            selectedValue={formData.rhythmTimeSignature}
                            onValueChange={(value) => updateField('rhythmTimeSignature', value)}
                            style={form.picker}
                        >
                            {TIME_SIGNATURES.map((sig) => (
                                <Picker.Item key={sig} label={sig} value={sig} />
                            ))}
                        </Picker>
                    </View>
                </View>
            </View>
        );
    };

    const renderClassificationSection = () => {
        if (!showClassificationSection) return null;

        return (
            <View style={form.section}>
                <View style={form.sectionHeader}>
                    <MaterialCommunityIcons name="tag" size={20} color={theme.colors.text.primary} />
                    <Text style={form.sectionTitle}>{t('createQuest.questionList.additionalInfo')}</Text>
                </View>

                {/* Difficulty */}
                <View style={form.formGroup}>
                    <Text style={form.label}>{t('userQuestions.difficultyLabel')}</Text>
                    <View style={form.pickerContainer}>
                        <Picker
                            selectedValue={formData.difficulty}
                            onValueChange={(value) => updateField('difficulty', value as Difficulty)}
                            style={form.picker}
                            enabled={!isSubmitting}
                        >
                            <Picker.Item label={t('userQuestions.easy')} value="EASY" />
                            <Picker.Item label={t('userQuestions.medium')} value="MEDIUM" />
                            <Picker.Item label={t('userQuestions.hard')} value="HARD" />
                        </Picker>
                    </View>
                </View>

                {/* Topic */}
                <View style={form.formGroup}>
                    <TopicTreeSelector
                        selectedTopicId={formData.topicId}
                        selectedTopicName={formData.topic}
                        onSelectTopic={handleSelectTopic}
                        allowCreate={true}
                        placeholder={t('userQuestions.topicPlaceholder')}
                        label={t('userQuestions.topicLabel')}
                        required={false}
                    />
                </View>

                {/* Additional Info */}
                <View style={form.formGroup}>
                    <LocalizedInput
                        label={t('userQuestions.additionalInfoLabel')}
                        value={formData.additionalInfo}
                        onChangeLocalized={(value) => updateField('additionalInfo', value)}
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

    // ============================================================================
    // MAIN RENDER
    // ============================================================================

    return (
        <ScrollView style={screen.container} showsVerticalScrollIndicator={false}>
            {/* Challenge Type Selector */}
            <View style={form.section}>
                <AudioChallengeTypeSelector
                    selectedType={formData.audioChallengeType}
                    onSelectType={handleTypeChange}
                    disabled={isSubmitting}
                />
                {errors.audioChallengeType && (
                    <Text style={form.errorText}>{errors.audioChallengeType}</Text>
                )}

                {/* Answer Mode Selector - Shown for all audio challenges */}
                {formData.audioChallengeType !== null && (
                    <View style={{marginTop: theme.spacing.md}}>
                        <AnswerModeSelector
                            selectedMode={formData.answerInputMode}
                            onChange={(mode) => updateField('answerInputMode', mode)}
                            disabled={isSubmitting}
                        />
                    </View>
                )}
            </View>

            {/* Question Text - Hidden for all karaoke types */}
            {formData.audioChallengeType === null && (
                <View style={form.section}>
                    <View style={form.formGroup}>
                        <LocalizedInput
                            label={t('audioQuestion.questionLabel')}
                            value={formData.question}
                            onChangeLocalized={(value) => updateField('question', value)}
                            placeholder={{
                                en: t('audioQuestion.questionPlaceholder'),
                                ru: t('audioQuestion.questionPlaceholder'),
                            }}
                            multiline
                            numberOfLines={3}
                        />
                        {errors.question && (
                            <Text style={form.errorText}>{errors.question}</Text>
                        )}
                    </View>

                    {/* Answer/Description */}
                    <View style={form.formGroup}>
                        <LocalizedInput
                            label={t('userQuestions.answerLabel')}
                            value={formData.answer}
                            onChangeLocalized={(value) => updateField('answer', value)}
                            placeholder={{
                                en: t('userQuestions.answerPlaceholder'),
                                ru: t('userQuestions.answerPlaceholder'),
                            }}
                            multiline
                            numberOfLines={2}
                        />
                        <Text style={form.helperText}>
                            {t('audioQuestion.answerHelperText')}
                        </Text>
                    </View>

                    {/* Accept Similar Answers Toggle - Hidden when audio challenge type is set */}
                    <View style={form.formGroup}>
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleInfo}>
                                <Text style={form.label}>{t('mediaQuestion.acceptSimilarAnswers')}</Text>
                                <Text style={form.helperText}>
                                    {t('mediaQuestion.acceptSimilarAnswersAudioNote')}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.toggle,
                                    formData.acceptSimilarAnswers && styles.toggleActive
                                ]}
                                onPress={() => updateField('acceptSimilarAnswers', !formData.acceptSimilarAnswers)}
                            >
                                <View
                                    style={[
                                        styles.toggleThumb,
                                        formData.acceptSimilarAnswers && styles.toggleThumbActive
                                    ]}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Audio Upload Section */}
            {renderAudioUploadSection()}

            {/* Replay Settings Section */}
            {formData.audioChallengeType && (
                <View style={form.section}>
                    <ReplaySettingsSection
                        allowReplay={formData.allowReplay}
                        maxReplays={formData.maxReplays}
                        onAllowReplayChange={(v) => updateField('allowReplay', v)}
                        onMaxReplaysChange={(v) => updateField('maxReplays', v)}
                        disabled={isSubmitting}
                    />
                </View>
            )}

            {/* Passing Score Section */}
            {renderPassingScoreSection()}

            {/* Time Limit Section */}
            {renderTimeLimitSection()}

            {/* Rhythm Settings Section */}
            {renderRhythmSettingsSection()}

            {/* Classification Section */}
            {renderClassificationSection()}

            {/* Action Buttons */}
            <View style={styles.actions}>
                {onCancel && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onCancel}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[
                        form.submitButton,
                        isSubmitting && form.submitButtonDisabled,
                        { flex: 2 }
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="check" size={20} color={theme.colors.text.inverse} />
                            <Text style={form.submitButtonText}>
                                {isEditing ? t('userQuestions.update') : t('audioQuestion.create')}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Bottom spacing */}
            <View style={{height: 40}} />
        </ScrollView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const themeStyles = createStyles(theme => ({
    subsectionTitle: {
        ...theme.typography.heading.h6,
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    // Audio upload styles
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.info.background,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.lg,
        borderWidth: 2,
        borderColor: theme.colors.primary.main,
        borderStyle: 'dashed',
        gap: theme.spacing.sm,
    },
    uploadButtonError: {
        borderColor: theme.colors.error.main,
        backgroundColor: theme.colors.error.background,
    },
    uploadButtonText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.primary.main,
    },
    audioPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.info.background,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.primary.main,
    },
    audioInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: theme.spacing.md,
    },
    audioDetails: {
        flex: 1,
    },
    audioName: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    audioSize: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
    },
    audioActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    audioActionButton: {
        padding: theme.spacing.xs,
    },
    audioPreviewContainer: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    audioPreviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xs,
    },
    audioRemoveButton: {
        padding: theme.spacing.xs,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerWrapper: {
        position: 'relative',
    },
    playerLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.5)',
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.layout.borderRadius.md,
    },
    themedPlayer: {
        backgroundColor: 'transparent',
        elevation: 0,
        shadowOpacity: 0,
        marginVertical: 0,
        padding: 0,
    },
    audioErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.error.background,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        gap: theme.spacing.sm,
    },
    audioErrorText: {
        flex: 1,
        ...theme.typography.caption,
        color: theme.colors.error.main,
    },
    retryButton: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        backgroundColor: theme.colors.error.main,
        borderRadius: theme.layout.borderRadius.sm,
    },
    retryText: {
        ...theme.typography.caption,
        color: theme.colors.text.inverse,
        fontWeight: '600',
    },

    // Segment picker styles
    segmentSection: {
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
    },
    segmentInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.lg,
    },
    segmentInputGroup: {
        flex: 1,
    },
    segmentInput: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        ...theme.typography.body.medium,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        color: theme.colors.text.primary,
    },
    timeValue: {
        ...theme.typography.body.medium,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    summaryBox: {
        backgroundColor: theme.colors.info.background,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginTop: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.info.main,
    },
    summaryText: {
        ...theme.typography.body.small,
        fontWeight: '600',
        color: theme.colors.info.main,
        marginBottom: 2,
    },
    summarySubtext: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
    },

    // Slider styles
    sliderContainer: {
        marginBottom: theme.spacing.md,
    },
    slider: {
        flex: 1,
        height: 40,
    },
    sliderLabel: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        width: 40,
        textAlign: 'center',
    },
    scorePresets: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    scorePreset: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.xl,
        backgroundColor: theme.colors.neutral.gray[200],
    },
    scorePresetActive: {
        backgroundColor: theme.colors.primary.main,
    },
    scorePresetText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.secondary,
    },
    scorePresetTextActive: {
        color: theme.colors.text.inverse,
    },

    // BPM styles
    bpmContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.md,
    },
    bpmButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.info.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.primary.main,
    },
    bpmInput: {
        width: 80,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        ...theme.typography.heading.h5,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        color: theme.colors.text.primary,
    },
    bpmPresets: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    bpmPreset: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.xl,
        backgroundColor: theme.colors.neutral.gray[200],
    },
    bpmPresetActive: {
        backgroundColor: theme.colors.primary.main,
    },
    bpmPresetText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.secondary,
    },
    bpmPresetTextActive: {
        color: theme.colors.text.inverse,
    },

    // Action buttons
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing['2xl'],
        gap: theme.spacing.md,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background.secondary,
    },
    cancelButtonText: {
        ...theme.typography.button,
        color: theme.colors.text.secondary,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.md,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.sm,
        gap: theme.spacing.xs,
    },
    activeTab: {
        backgroundColor: theme.colors.background.primary,
        ...theme.shadows.small,
    },
    tabText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
    },
    activeTabText: {
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    inputArea: {
        marginBottom: theme.spacing.sm,
    },
    // Toggle styles
    toggleContainer: {
        width: 48,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.neutral.gray[300],
        padding: 2,
        marginLeft: 'auto',
    },
    toggleContainerActive: {
        backgroundColor: theme.colors.success.main,
    },
    toggleCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.text.inverse,
        transform: [{translateX: 0}],
    },
    toggleCircleActive: {
        transform: [{translateX: 24}],
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleInfo: {
        flex: 1,
    },
    toggle: {
        width: 52,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.neutral.gray[300],
        padding: 2,
    },
    toggleActive: {
        backgroundColor: theme.colors.success.main,
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    toggleThumbActive: {
        alignSelf: 'flex-end',
    },
}));

export default AudioQuestionForm;