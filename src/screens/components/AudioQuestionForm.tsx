// src/screens/components/AudioQuestionForm.tsx
import React, {useState, useCallback, useMemo} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Picker} from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import DocumentPicker from 'react-native-document-picker';
import {
    AudioChallengeType,
    AUDIO_CHALLENGE_TYPES,
    AudioChallengeTypeInfo,
} from '../../entities/ChallengeState/model/types';
import {QuestionVisibility} from '../../entities/QuizState/model/types/question.types';
import {TopicTreeSelector} from '../../shared/ui/TopicSelector';
import {SelectableTopic} from '../../entities/TopicState';
import {AudioChallengeTypeSelector} from '../../shared/ui/AudioChallengeTypeSelector/AudioChallengeTypeSelector';
import FileService, {ProcessedFileInfo} from '../../services/speech/FileService';

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
    // ============================================================================
    // STATE
    // ============================================================================

    const [formData, setFormData] = useState<AudioQuestionFormData>({
        ...DEFAULT_FORM_DATA,
        ...initialValues,
    });

    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof AudioQuestionFormData, string>>>({});

    // ============================================================================
    // DERIVED STATE
    // ============================================================================

    const selectedTypeInfo = useMemo<AudioChallengeTypeInfo | null>(() => {
        if (!formData.audioChallengeType) return null;
        return AUDIO_CHALLENGE_TYPES.find(t => t.type === formData.audioChallengeType) || null;
    }, [formData.audioChallengeType]);

    const requiresReferenceAudio = selectedTypeInfo?.requiresReferenceAudio ?? false;
    const showRhythmSettings = selectedTypeInfo?.usesRhythmScoring ?? false;

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
                throw new Error('No file selected');
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
                Alert.alert('Invalid File', validation.error || 'Please select a valid audio file');
                return;
            }

            updateField('referenceAudioFile', processedFile);
            
            // Clear any audio-related errors
            setErrors(prev => ({...prev, referenceAudioFile: undefined}));

        } catch (error) {
            if (!DocumentPicker.isCancel(error)) {
                console.error('Audio pick error:', error);
                Alert.alert('Error', 'Failed to select audio file. Please try again.');
            }
        } finally {
            setIsUploading(false);
        }
    }, [updateField]);

    const handleRemoveAudio = useCallback(() => {
        updateField('referenceAudioFile', null);
        updateField('audioSegmentStart', 0);
        updateField('audioSegmentEnd', null);
    }, [updateField]);

    const validateForm = useCallback((): boolean => {
        const newErrors: Partial<Record<keyof AudioQuestionFormData, string>> = {};

        // Required fields
        if (!formData.question.trim()) {
            newErrors.question = 'Question is required';
        }

        if (!formData.audioChallengeType) {
            newErrors.audioChallengeType = 'Please select a challenge type';
        }

        // Reference audio validation
        if (requiresReferenceAudio && !formData.referenceAudioFile) {
            newErrors.referenceAudioFile = 'Reference audio is required for this challenge type';
        }

        // Segment time validation
        if (formData.audioSegmentEnd !== null && formData.audioSegmentStart >= formData.audioSegmentEnd) {
            newErrors.audioSegmentEnd = 'End time must be greater than start time';
        }

        // Score validation
        if (formData.minimumScorePercentage < 0 || formData.minimumScorePercentage > 100) {
            newErrors.minimumScorePercentage = 'Score must be between 0 and 100';
        }

        // BPM validation
        if (showRhythmSettings && formData.rhythmBpm !== null) {
            if (formData.rhythmBpm < 40 || formData.rhythmBpm > 240) {
                newErrors.rhythmBpm = 'BPM must be between 40 and 240';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, requiresReferenceAudio, showRhythmSettings]);

    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please fix the errors before submitting');
            return;
        }

        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert('Error', 'Failed to save question. Please try again.');
        }
    }, [formData, validateForm, onSubmit]);

    // ============================================================================
    // RENDER HELPERS
    // ============================================================================

    const renderAudioUploadSection = () => {
        if (!formData.audioChallengeType) return null;

        const isRequired = requiresReferenceAudio;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="file-music" size={20} color="#333" />
                    <Text style={styles.sectionTitle}>
                        Reference Audio {isRequired ? '*' : '(Optional)'}
                    </Text>
                </View>

                {formData.referenceAudioFile ? (
                    <View style={styles.audioPreview}>
                        <View style={styles.audioInfo}>
                            <MaterialCommunityIcons name="music-circle" size={40} color="#007AFF" />
                            <View style={styles.audioDetails}>
                                <Text style={styles.audioName} numberOfLines={1}>
                                    {formData.referenceAudioFile.name}
                                </Text>
                                <Text style={styles.audioSize}>
                                    {FileService.formatFileSize(formData.referenceAudioFile.size)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.audioActions}>
                            <TouchableOpacity
                                style={styles.audioActionButton}
                                onPress={() => {/* TODO: Play audio preview */}}
                            >
                                <MaterialCommunityIcons name="play-circle" size={32} color="#4CAF50" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.audioActionButton}
                                onPress={handleRemoveAudio}
                            >
                                <MaterialCommunityIcons name="close-circle" size={32} color="#F44336" />
                            </TouchableOpacity>
                        </View>
                    </View>
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
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="upload" size={24} color="#007AFF" />
                                <Text style={styles.uploadButtonText}>Upload Audio File</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {errors.referenceAudioFile && (
                    <Text style={styles.errorText}>{errors.referenceAudioFile}</Text>
                )}

                {/* Audio Segment Picker */}
                {formData.referenceAudioFile && (
                    <View style={styles.segmentSection}>
                        <Text style={styles.subsectionTitle}>Audio Segment (Optional)</Text>
                        <Text style={styles.helperText}>
                            Specify which portion of the audio to use for the challenge
                        </Text>
                        
                        <View style={styles.segmentInputs}>
                            <View style={styles.segmentInputGroup}>
                                <Text style={styles.inputLabel}>Start (sec)</Text>
                                <TextInput
                                    style={styles.segmentInput}
                                    value={String(formData.audioSegmentStart)}
                                    onChangeText={(text) => {
                                        const num = parseFloat(text) || 0;
                                        updateField('audioSegmentStart', Math.max(0, num));
                                    }}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="#999" />
                            <View style={styles.segmentInputGroup}>
                                <Text style={styles.inputLabel}>End (sec)</Text>
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
                                />
                            </View>
                        </View>

                        {errors.audioSegmentEnd && (
                            <Text style={styles.errorText}>{errors.audioSegmentEnd}</Text>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderPassingScoreSection = () => {
        if (!formData.audioChallengeType) return null;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="target" size={20} color="#333" />
                    <Text style={styles.sectionTitle}>Passing Criteria</Text>
                </View>

                <Text style={styles.subsectionTitle}>
                    Minimum Score to Pass: {formData.minimumScorePercentage}%
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
                        minimumTrackTintColor="#007AFF"
                        maximumTrackTintColor="#E0E0E0"
                        thumbTintColor="#007AFF"
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
                    <Text style={styles.errorText}>{errors.minimumScorePercentage}</Text>
                )}
            </View>
        );
    };

    const renderRhythmSettingsSection = () => {
        if (!showRhythmSettings) return null;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="metronome" size={20} color="#333" />
                    <Text style={styles.sectionTitle}>Rhythm Settings</Text>
                </View>

                {/* BPM Input */}
                <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>BPM (Beats Per Minute)</Text>
                    <View style={styles.bpmContainer}>
                        <TouchableOpacity
                            style={styles.bpmButton}
                            onPress={() => {
                                const newBpm = Math.max(40, (formData.rhythmBpm || 120) - 5);
                                updateField('rhythmBpm', newBpm);
                            }}
                        >
                            <MaterialCommunityIcons name="minus" size={24} color="#007AFF" />
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
                        />
                        
                        <TouchableOpacity
                            style={styles.bpmButton}
                            onPress={() => {
                                const newBpm = Math.min(240, (formData.rhythmBpm || 120) + 5);
                                updateField('rhythmBpm', newBpm);
                            }}
                        >
                            <MaterialCommunityIcons name="plus" size={24} color="#007AFF" />
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
                        <Text style={styles.errorText}>{errors.rhythmBpm}</Text>
                    )}
                </View>

                {/* Time Signature Picker */}
                <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Time Signature</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formData.rhythmTimeSignature}
                            onValueChange={(value) => updateField('rhythmTimeSignature', value)}
                            style={styles.picker}
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

    // ============================================================================
    // MAIN RENDER
    // ============================================================================

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Challenge Type Selector */}
            <View style={styles.section}>
                <AudioChallengeTypeSelector
                    selectedType={formData.audioChallengeType}
                    onSelectType={(type) => updateField('audioChallengeType', type)}
                    disabled={isSubmitting}
                />
                {errors.audioChallengeType && (
                    <Text style={styles.errorText}>{errors.audioChallengeType}</Text>
                )}
            </View>

            {/* Question Text */}
            <View style={styles.section}>
                <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Instructions / Question *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.question}
                        onChangeText={(text) => updateField('question', text)}
                        placeholder="e.g., Repeat the rhythm pattern you hear"
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        editable={!isSubmitting}
                    />
                    {errors.question && (
                        <Text style={styles.errorText}>{errors.question}</Text>
                    )}
                </View>

                {/* Answer/Description */}
                <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Answer / Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.answer}
                        onChangeText={(text) => updateField('answer', text)}
                        placeholder="e.g., 4/4 time, 120 BPM clapping pattern"
                        placeholderTextColor="#999"
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
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="tag" size={20} color="#333" />
                    <Text style={styles.sectionTitle}>Classification</Text>
                </View>

                {/* Difficulty */}
                <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Difficulty</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formData.difficulty}
                            onValueChange={(value) => updateField('difficulty', value as Difficulty)}
                            style={styles.picker}
                            enabled={!isSubmitting}
                        >
                            <Picker.Item label="Easy" value="EASY" />
                            <Picker.Item label="Medium" value="MEDIUM" />
                            <Picker.Item label="Hard" value="HARD" />
                        </Picker>
                    </View>
                </View>

                {/* Topic */}
                <View style={styles.formGroup}>
                    <TopicTreeSelector
                        selectedTopicId={formData.topicId}
                        selectedTopicName={formData.topic}
                        onSelectTopic={handleSelectTopic}
                        allowCreate={true}
                        placeholder="Select or create a topic..."
                        label="Topic (Optional)"
                        required={false}
                    />
                </View>

                {/* Additional Info */}
                <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Additional Info (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.additionalInfo}
                        onChangeText={(text) => updateField('additionalInfo', text)}
                        placeholder="Any hints or additional context..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                        editable={!isSubmitting}
                    />
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                {onCancel && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onCancel}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        isSubmitting && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                            <Text style={styles.submitButtonText}>
                                {isEditing ? 'Update Question' : 'Create Audio Question'}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333333',
    },
    subsectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555555',
        marginBottom: 8,
    },
    formGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    textArea: {
        minHeight: 80,
        paddingTop: 12,
    },
    pickerContainer: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    helperText: {
        fontSize: 12,
        color: '#888888',
        marginBottom: 12,
    },
    errorText: {
        fontSize: 12,
        color: '#F44336',
        marginTop: 4,
    },

    // Audio upload styles
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F7FF',
        borderRadius: 8,
        padding: 16,
        borderWidth: 2,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
        gap: 8,
    },
    uploadButtonError: {
        borderColor: '#F44336',
        backgroundColor: '#FFF5F5',
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    audioPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F0F7FF',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    audioInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    audioDetails: {
        flex: 1,
    },
    audioName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333333',
    },
    audioSize: {
        fontSize: 12,
        color: '#666666',
    },
    audioActions: {
        flexDirection: 'row',
        gap: 8,
    },
    audioActionButton: {
        padding: 4,
    },

    // Segment picker styles
    segmentSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    segmentInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    segmentInputGroup: {
        flex: 1,
    },
    segmentInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },

    // Slider styles
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    slider: {
        flex: 1,
        height: 40,
    },
    sliderLabel: {
        fontSize: 12,
        color: '#666666',
        width: 40,
        textAlign: 'center',
    },
    scorePresets: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    scorePreset: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F0F0F0',
    },
    scorePresetActive: {
        backgroundColor: '#007AFF',
    },
    scorePresetText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666666',
    },
    scorePresetTextActive: {
        color: '#FFFFFF',
    },

    // BPM styles
    bpmContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    bpmButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    bpmInput: {
        width: 80,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    bpmPresets: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
    },
    bpmPreset: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F0F0F0',
    },
    bpmPresetActive: {
        backgroundColor: '#007AFF',
    },
    bpmPresetText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666666',
    },
    bpmPresetTextActive: {
        color: '#FFFFFF',
    },

    // Action buttons
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginTop: 24,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666666',
    },
    submitButton: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        gap: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#A5D6A7',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default AudioQuestionForm;
