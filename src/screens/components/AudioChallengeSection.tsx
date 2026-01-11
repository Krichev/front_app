// src/screens/components/AudioChallengeSection.tsx
/**
 * AudioChallengeSection - Embedded audio challenge configuration
 * 
 * This component is shown inside CreateQuestionWithMedia when the user
 * selects "Audio Question" as the question type. It provides all the
 * audio challenge-specific configuration options.
 */
import React, {useCallback, useMemo} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
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
import FileService, {ProcessedFileInfo} from '../../services/speech/FileService';

// ============================================================================
// TYPES
// ============================================================================

export interface AudioChallengeConfig {
    audioChallengeType: AudioChallengeType | null;
    referenceAudioFile: ProcessedFileInfo | null;
    audioSegmentStart: number;
    audioSegmentEnd: number | null;
    minimumScorePercentage: number;
    rhythmBpm: number | null;
    rhythmTimeSignature: string;
}

interface AudioChallengeSectionProps {
    config: AudioChallengeConfig;
    onConfigChange: (config: AudioChallengeConfig) => void;
    disabled?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIME_SIGNATURES = ['4/4', '3/4', '2/4', '6/8', '12/8', '5/4', '7/8'];

export const DEFAULT_AUDIO_CONFIG: AudioChallengeConfig = {
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

export const AudioChallengeSection: React.FC<AudioChallengeSectionProps> = ({
    config,
    onConfigChange,
    disabled = false,
}) => {
    const [isUploading, setIsUploading] = React.useState(false);

    // ============================================================================
    // DERIVED STATE
    // ============================================================================

    const selectedTypeInfo = useMemo<AudioChallengeTypeInfo | null>(() => {
        if (!config.audioChallengeType) return null;
        return AUDIO_CHALLENGE_TYPES.find(t => t.type === config.audioChallengeType) || null;
    }, [config.audioChallengeType]);

    const requiresReferenceAudio = selectedTypeInfo?.requiresReferenceAudio ?? false;
    const showRhythmSettings = selectedTypeInfo?.usesRhythmScoring ?? false;

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const updateConfig = useCallback(<K extends keyof AudioChallengeConfig>(
        field: K,
        value: AudioChallengeConfig[K]
    ) => {
        onConfigChange({...config, [field]: value});
    }, [config, onConfigChange]);

    const handleTypeSelect = useCallback((type: AudioChallengeType) => {
        // When changing type, reset audio if new type doesn't require it
        const typeInfo = AUDIO_CHALLENGE_TYPES.find(t => t.type === type);
        const newConfig = {...config, audioChallengeType: type};
        
        // Set default values based on type
        if (type === AudioChallengeType.RHYTHM_CREATION || type === AudioChallengeType.RHYTHM_REPEAT) {
            newConfig.rhythmBpm = config.rhythmBpm || 120;
            newConfig.rhythmTimeSignature = config.rhythmTimeSignature || '4/4';
        }
        
        // Lower default score for karaoke (it's harder)
        if (type === AudioChallengeType.SINGING) {
            newConfig.minimumScorePercentage = 50;
        } else {
            newConfig.minimumScorePercentage = 60;
        }
        
        onConfigChange(newConfig);
    }, [config, onConfigChange]);

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
            if (!file) return;

            const processedFile: ProcessedFileInfo = {
                uri: file.fileCopyUri || file.uri,
                name: file.name || `audio_${Date.now()}.mp3`,
                type: file.type || 'audio/mpeg',
                size: file.size || 0,
                isImage: false,
                isVideo: false,
                extension: FileService.getExtension(file.name || ''),
            };

            updateConfig('referenceAudioFile', processedFile);
        } catch (error) {
            if (!DocumentPicker.isCancel(error)) {
                console.error('Audio pick error:', error);
                Alert.alert('Error', 'Failed to select audio file');
            }
        } finally {
            setIsUploading(false);
        }
    }, [updateConfig]);

    const handleRemoveAudio = useCallback(() => {
        onConfigChange({
            ...config,
            referenceAudioFile: null,
            audioSegmentStart: 0,
            audioSegmentEnd: null,
        });
    }, [config, onConfigChange]);

    // ============================================================================
    // RENDER: Challenge Type Selector
    // ============================================================================

    const renderTypeSelector = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>
                <MaterialCommunityIcons name="music-box" size={18} color="#333" />
                {' '}Challenge Type *
            </Text>
            <View style={styles.typeGrid}>
                {AUDIO_CHALLENGE_TYPES.map((typeInfo) => {
                    const isSelected = config.audioChallengeType === typeInfo.type;
                    return (
                        <TouchableOpacity
                            key={typeInfo.type}
                            style={[
                                styles.typeCard,
                                isSelected && styles.typeCardSelected,
                                disabled && styles.typeCardDisabled,
                            ]}
                            onPress={() => !disabled && handleTypeSelect(typeInfo.type)}
                            disabled={disabled}
                        >
                            <View style={[styles.typeIcon, isSelected && styles.typeIconSelected]}>
                                <MaterialCommunityIcons
                                    name={typeInfo.icon}
                                    size={24}
                                    color={isSelected ? '#FFF' : '#666'}
                                />
                            </View>
                            <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                                {typeInfo.label}
                            </Text>
                            <Text style={styles.typeDescription} numberOfLines={2}>
                                {typeInfo.description}
                            </Text>
                            {isSelected && (
                                <MaterialCommunityIcons
                                    name="check-circle"
                                    size={16}
                                    color="#007AFF"
                                    style={styles.typeCheck}
                                />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    // ============================================================================
    // RENDER: Audio Upload
    // ============================================================================

    const renderAudioUpload = () => {
        if (!config.audioChallengeType) return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    <MaterialCommunityIcons name="file-music" size={18} color="#333" />
                    {' '}Reference Audio {requiresReferenceAudio ? '*' : '(Optional)'}
                </Text>

                {config.referenceAudioFile ? (
                    <View style={styles.audioPreview}>
                        <MaterialCommunityIcons name="music-circle" size={36} color="#007AFF" />
                        <View style={styles.audioInfo}>
                            <Text style={styles.audioName} numberOfLines={1}>
                                {config.referenceAudioFile.name}
                            </Text>
                            <Text style={styles.audioSize}>
                                {FileService.formatFileSize(config.referenceAudioFile.size)}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => {/* TODO: Play preview */}}>
                            <MaterialCommunityIcons name="play-circle" size={28} color="#4CAF50" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleRemoveAudio} disabled={disabled}>
                            <MaterialCommunityIcons name="close-circle" size={28} color="#F44336" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.uploadButton, requiresReferenceAudio && styles.uploadButtonRequired]}
                        onPress={handleAudioPick}
                        disabled={disabled || isUploading}
                    >
                        {isUploading ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="upload" size={20} color="#007AFF" />
                                <Text style={styles.uploadButtonText}>Upload Audio File</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Audio Segment Picker */}
                {config.referenceAudioFile && (
                    <View style={styles.segmentRow}>
                        <View style={styles.segmentInput}>
                            <Text style={styles.segmentLabel}>Start (sec)</Text>
                            <TextInput
                                style={styles.segmentField}
                                value={String(config.audioSegmentStart)}
                                onChangeText={(text) => {
                                    const num = parseFloat(text) || 0;
                                    updateConfig('audioSegmentStart', Math.max(0, num));
                                }}
                                keyboardType="numeric"
                                placeholder="0"
                                editable={!disabled}
                            />
                        </View>
                        <MaterialCommunityIcons name="arrow-right" size={16} color="#999" />
                        <View style={styles.segmentInput}>
                            <Text style={styles.segmentLabel}>End (sec)</Text>
                            <TextInput
                                style={styles.segmentField}
                                value={config.audioSegmentEnd !== null ? String(config.audioSegmentEnd) : ''}
                                onChangeText={(text) => {
                                    if (text === '') {
                                        updateConfig('audioSegmentEnd', null);
                                    } else {
                                        const num = parseFloat(text);
                                        updateConfig('audioSegmentEnd', isNaN(num) ? null : num);
                                    }
                                }}
                                keyboardType="numeric"
                                placeholder="Full"
                                editable={!disabled}
                            />
                        </View>
                    </View>
                )}
            </View>
        );
    };

    // ============================================================================
    // RENDER: Passing Score
    // ============================================================================

    const renderPassingScore = () => {
        if (!config.audioChallengeType) return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    <MaterialCommunityIcons name="target" size={18} color="#333" />
                    {' '}Minimum Score to Pass: {config.minimumScorePercentage}%
                </Text>

                <View style={styles.sliderRow}>
                    <Text style={styles.sliderLabel}>0%</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={100}
                        step={5}
                        value={config.minimumScorePercentage}
                        onValueChange={(value) => updateConfig('minimumScorePercentage', value)}
                        minimumTrackTintColor="#007AFF"
                        maximumTrackTintColor="#E0E0E0"
                        thumbTintColor="#007AFF"
                        disabled={disabled}
                    />
                    <Text style={styles.sliderLabel}>100%</Text>
                </View>

                <View style={styles.presets}>
                    {[30, 50, 60, 70, 80].map((score) => (
                        <TouchableOpacity
                            key={score}
                            style={[
                                styles.preset,
                                config.minimumScorePercentage === score && styles.presetActive,
                            ]}
                            onPress={() => updateConfig('minimumScorePercentage', score)}
                            disabled={disabled}
                        >
                            <Text style={[
                                styles.presetText,
                                config.minimumScorePercentage === score && styles.presetTextActive,
                            ]}>
                                {score}%
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    // ============================================================================
    // RENDER: Rhythm Settings
    // ============================================================================

    const renderRhythmSettings = () => {
        if (!showRhythmSettings) return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    <MaterialCommunityIcons name="metronome" size={18} color="#333" />
                    {' '}Rhythm Settings
                </Text>

                {/* BPM */}
                <View style={styles.rhythmRow}>
                    <Text style={styles.rhythmLabel}>BPM:</Text>
                    <View style={styles.bpmControl}>
                        <TouchableOpacity
                            style={styles.bpmButton}
                            onPress={() => {
                                const newBpm = Math.max(40, (config.rhythmBpm || 120) - 5);
                                updateConfig('rhythmBpm', newBpm);
                            }}
                            disabled={disabled}
                        >
                            <MaterialCommunityIcons name="minus" size={20} color="#007AFF" />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.bpmInput}
                            value={config.rhythmBpm !== null ? String(config.rhythmBpm) : ''}
                            onChangeText={(text) => {
                                const num = parseInt(text, 10);
                                updateConfig('rhythmBpm', isNaN(num) ? null : Math.min(240, Math.max(40, num)));
                            }}
                            keyboardType="numeric"
                            editable={!disabled}
                        />
                        <TouchableOpacity
                            style={styles.bpmButton}
                            onPress={() => {
                                const newBpm = Math.min(240, (config.rhythmBpm || 120) + 5);
                                updateConfig('rhythmBpm', newBpm);
                            }}
                            disabled={disabled}
                        >
                            <MaterialCommunityIcons name="plus" size={20} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Time Signature */}
                <View style={styles.rhythmRow}>
                    <Text style={styles.rhythmLabel}>Time Signature:</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={config.rhythmTimeSignature}
                            onValueChange={(value) => updateConfig('rhythmTimeSignature', value)}
                            style={styles.timeSigPicker}
                            enabled={!disabled}
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
        <View style={styles.container}>
            <View style={styles.header}>
                <MaterialCommunityIcons name="music-box-multiple" size={20} color="#4CAF50" />
                <Text style={styles.headerTitle}>Audio Challenge Configuration</Text>
            </View>

            {renderTypeSelector()}
            {renderAudioUpload()}
            {renderPassingScore()}
            {renderRhythmSettings()}

            {/* Scoring Info */}
            {selectedTypeInfo && (
                <View style={styles.scoringInfo}>
                    <Text style={styles.scoringTitle}>Scoring Components:</Text>
                    <View style={styles.scoringBadges}>
                        {selectedTypeInfo.usesPitchScoring && (
                            <View style={styles.scoringBadge}>
                                <MaterialCommunityIcons name="music" size={14} color="#007AFF" />
                                <Text style={styles.scoringBadgeText}>Pitch</Text>
                            </View>
                        )}
                        {selectedTypeInfo.usesRhythmScoring && (
                            <View style={styles.scoringBadge}>
                                <MaterialCommunityIcons name="metronome" size={14} color="#FF9800" />
                                <Text style={styles.scoringBadgeText}>Rhythm</Text>
                            </View>
                        )}
                        {selectedTypeInfo.usesVoiceScoring && (
                            <View style={styles.scoringBadge}>
                                <MaterialCommunityIcons name="account-voice" size={14} color="#9C27B0" />
                                <Text style={styles.scoringBadgeText}>Voice</Text>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F8FFF8',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },

    // Type Grid
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
    },
    typeCard: {
        width: '48%',
        marginHorizontal: '1%',
        marginBottom: 8,
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 10,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        position: 'relative',
    },
    typeCardSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F7FF',
    },
    typeCardDisabled: {
        opacity: 0.5,
    },
    typeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    typeIconSelected: {
        backgroundColor: '#007AFF',
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#333',
    },
    typeLabelSelected: {
        color: '#007AFF',
    },
    typeDescription: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
    },
    typeCheck: {
        position: 'absolute',
        top: 6,
        right: 6,
    },

    // Audio Upload
    audioPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: '#007AFF',
        gap: 10,
    },
    audioInfo: {
        flex: 1,
    },
    audioName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    audioSize: {
        fontSize: 11,
        color: '#666',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F7FF',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
        gap: 6,
    },
    uploadButtonRequired: {
        borderWidth: 2,
    },
    uploadButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },

    // Segment
    segmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        gap: 10,
    },
    segmentInput: {
        flex: 1,
    },
    segmentLabel: {
        fontSize: 11,
        color: '#666',
        marginBottom: 4,
        textAlign: 'center',
    },
    segmentField: {
        backgroundColor: '#FFF',
        borderRadius: 6,
        padding: 8,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },

    // Slider
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    slider: {
        flex: 1,
        height: 36,
    },
    sliderLabel: {
        fontSize: 11,
        color: '#666',
        width: 30,
        textAlign: 'center',
    },
    presets: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: 8,
    },
    preset: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
    },
    presetActive: {
        backgroundColor: '#007AFF',
    },
    presetText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
    },
    presetTextActive: {
        color: '#FFF',
    },

    // Rhythm
    rhythmRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    rhythmLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#333',
        width: 100,
    },
    bpmControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bpmButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    bpmInput: {
        width: 60,
        backgroundColor: '#FFF',
        borderRadius: 6,
        padding: 6,
        textAlign: 'center',
        fontWeight: '700',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    pickerWrapper: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        overflow: 'hidden',
    },
    timeSigPicker: {
        height: 40,
    },

    // Scoring Info
    scoringInfo: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 10,
        marginTop: 8,
    },
    scoringTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
        marginBottom: 6,
    },
    scoringBadges: {
        flexDirection: 'row',
        gap: 8,
    },
    scoringBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    scoringBadgeText: {
        fontSize: 11,
        color: '#333',
        fontWeight: '500',
    },
});

export default AudioChallengeSection;
