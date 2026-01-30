// src/screens/components/AudioQuestionForm.tsx
import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Picker} from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import DocumentPicker from 'react-native-document-picker';
import {AUDIO_CHALLENGE_TYPES_INFO, AudioChallengeType,} from '../../types/audioChallenge.types';
import {QuestionVisibility} from '../../entities/QuizState/model/types/question.types';
import {TopicTreeSelector} from '../../shared/ui/TopicSelector';
import {SelectableTopic} from '../../entities/TopicState';
import {AudioChallengeTypeSelector} from '../../shared/ui/AudioChallengeTypeSelector/AudioChallengeTypeSelector';
import FileService, {ProcessedFileInfo} from '../../services/speech/FileService';
import {AudioRecorderCard} from '../../components/AudioRecorder/AudioRecorderCard';
import {useAppStyles} from '../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../shared/ui/theme';
import {useTranslation} from 'react-i18next';

// ============================================================================
// TYPES
// ============================================================================

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface AudioQuestionFormData {
    // Core question fields
    question: string;
    answer: string;
    difficulty: Difficulty;
    topic: string;
    topicId?: number;
    visibility: QuestionVisibility;
    additionalInfo: string;

    // Audio challenge specific
    audioChallengeType: AudioChallengeType | null;
    referenceAudioFile: ProcessedFileInfo | null;
    audioSegmentStart: number;
    audioSegmentEnd: number | null;
    minimumScorePercentage: number;

    // Rhythm-specific
    rhythmBpm: number | null;
    rhythmTimeSignature: string;
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
    question: '',
    answer: '',
    difficulty: 'MEDIUM',
    topic: '',
    topicId: undefined,
    visibility: QuestionVisibility.PRIVATE,
    additionalInfo: '',
    audioChallengeType: null,
    referenceAudioFile: null,
    audioSegmentStart: 0,
    audioSegmentEnd: null,
    minimumScorePercentage: 60,
    rhythmBpm: 120,
    rhythmTimeSignature: '4/4',
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
            };

            // Validate file
            const validation = FileService.validateFile(processedFile);
            if (!validation.isValid) {
                Alert.alert(t('questionEditor.invalidFile'), validation.error || t('questionEditor.validAudio'));
                return;
            }

            updateField('referenceAudioFile', processedFile);
            
            // Clear any audio-related errors
            setErrors(prev => ({...prev, referenceAudioFile: undefined}));

        } catch (error) {
            if (!DocumentPicker.isCancel(error)) {
                console.error('Audio pick error:', error);
                Alert.alert(t('userQuestions.errorTitle'), t('questionEditor.errorMedia'));
            }
        } finally {
            setIsUploading(false);
        }
    }, [updateField, t]);

    const handleRecordingComplete = useCallback((path: string) => {
        const processedFile: ProcessedFileInfo = {
            uri: `file://${path}`,
            name: `recording_${Date.now()}.wav`,
            type: 'audio/wav',
            size: 0, // Should ideally get size
            isImage: false,
            isVideo: false,
            extension: 'wav',
        };
        updateField('referenceAudioFile', processedFile);
        setErrors(prev => ({...prev, referenceAudioFile: undefined}));
    }, [updateField]);

    const handleRemoveAudio = useCallback(() => {
        updateField('referenceAudioFile', null);
        updateField('audioSegmentStart', 0);
        updateField('audioSegmentEnd', null);
    }, [updateField]);

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
    }, [formData, requiresReferenceAudio, showRhythmSettings, t]);

    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            Alert.alert(t('userQuestions.errorTitle'), t('alerts.validationError'));
            return;
        }

        // Auto-fill optional fields for audio challenges
        const submissionData = { ...formData };
        if (!submissionData.question.trim()) {
            // Use instructions from type info if available, or default
            const typeLabel = formData.audioChallengeType ? AUDIO_CHALLENGE_TYPES_INFO[formData.audioChallengeType]?.label : 'Audio Challenge';
            submissionData.question = `Complete the ${typeLabel}`;
        }
        if (!submissionData.answer.trim()) {
            submissionData.answer = "Audio Response";
        }

        try {
            await onSubmit(submissionData);
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert(t('userQuestions.errorTitle'), t('userQuestions.saveFailed'));
        }
    }, [formData, validateForm, onSubmit, t]);

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
                                {t('questionEditor.upload')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {formData.referenceAudioFile ? (
                    <View style={styles.audioPreview}>
                        <View style={styles.audioInfo}>
                            <MaterialCommunityIcons name="music-circle" size={40} color={theme.colors.primary.main} />
                            <View style={styles.audioDetails}>
                                <Text style={styles.audioName} numberOfLines={1}>
                                    {formData.referenceAudioFile.name}
                                </Text>
                                <Text style={styles.audioSize}>
                                    {formData.referenceAudioFile.sizeFormatted || 'Unknown size'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.audioActions}>
                            <TouchableOpacity
                                style={styles.audioActionButton}
                                onPress={() => {/* TODO: Play audio preview */}}
                            >
                                <MaterialCommunityIcons name="play-circle" size={32} color={theme.colors.success.main} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.audioActionButton}
                                onPress={handleRemoveAudio}
                            >
                                <MaterialCommunityIcons name="close-circle" size={32} color={theme.colors.error.main} />
                            </TouchableOpacity>
                        </View>
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
                        <Text style={styles.subsectionTitle}>{t('audioQuestion.segmentLabel')} ({t('userQuestions.topicLabel').split(' ')[1]})</Text>
                        <Text style={form.helperText}>
                            Specify which portion of the audio to use for the challenge
                        </Text>
                        
                        <View style={styles.segmentInputs}>
                            <View style={styles.segmentInputGroup}>
                                <Text style={form.label}>{t('audioQuestion.startTime')}</Text>
                                <TextInput
                                    style={styles.segmentInput}
                                    value={String(formData.audioSegmentStart)}
                                    onChangeText={(text) => {
                                        const num = parseFloat(text) || 0;
                                        updateField('audioSegmentStart', Math.max(0, num));
                                    }}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={theme.colors.text.disabled}
                                />
                            </View>
                            <MaterialCommunityIcons name="arrow-right" size={20} color={theme.colors.text.disabled} />
                            <View style={styles.segmentInputGroup}>
                                <Text style={form.label}>{t('audioQuestion.endTime')}</Text>
                                <TextInput
                                    style={styles.segmentInput}
                                    value={formData.audioSegmentEnd !== null ? String(formData.audioSegmentEnd) : ''}
                                    onChangeText={(text) => {
                                        if (text === '') {
                                            updateField('audioSegmentEnd', null);
                                        } else {
                                            const num = parseFloat(text);
                                            updateField('audioSegmentEnd', isNaN(num) ? null : num);
                                        }
                                    }}
                                    keyboardType="numeric"
                                    placeholder="Full"
                                    placeholderTextColor={theme.colors.text.disabled}
                                />
                            </View>
                        </View>

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
                    <Text style={form.sectionTitle}>{t('questionList.additionalInfo')}</Text>
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
                    <Text style={form.label}>{t('userQuestions.additionalInfoLabel')}</Text>
                    <TextInput
                        style={[form.input, form.textArea]}
                        value={formData.additionalInfo}
                        onChangeText={(text) => updateField('additionalInfo', text)}
                        placeholder={t('userQuestions.additionalInfoPlaceholder')}
                        placeholderTextColor={theme.colors.text.disabled}
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                        editable={!isSubmitting}
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
            </View>

            {/* Question Text */}
            <View style={form.section}>
                <View style={form.formGroup}>
                    <Text style={form.label}>{t('audioQuestion.questionLabel')}</Text>
                    <TextInput
                        style={[form.input, form.textArea]}
                        value={formData.question}
                        onChangeText={(text) => updateField('question', text)}
                        placeholder={t('audioQuestion.questionPlaceholder')}
                        placeholderTextColor={theme.colors.text.disabled}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        editable={!isSubmitting}
                    />
                    {errors.question && (
                        <Text style={form.errorText}>{errors.question}</Text>
                    )}
                </View>

                {/* Answer/Description */}
                <View style={form.formGroup}>
                    <Text style={form.label}>{t('userQuestions.answerLabel')}</Text>
                    <TextInput
                        style={[form.input, form.textArea]}
                        value={formData.answer}
                        onChangeText={(text) => updateField('answer', text)}
                        placeholder={t('userQuestions.answerPlaceholder')}
                        placeholderTextColor={theme.colors.text.disabled}
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                        editable={!isSubmitting}
                    />
                </View>
            </View>

            {/* Audio Upload Section */}
            {renderAudioUploadSection()}

            {/* Passing Score Section */}
            {renderPassingScoreSection()}

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

    // Slider styles
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
    }
}));

export default AudioQuestionForm;