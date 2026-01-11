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
import FileService, {ProcessedFileInfo, FileInfo} from '../../services/speech/FileService';

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
        const newConfig = {...config, audioChallengeType: type};
        
        // Set default values based on type
        if (type === AudioChallengeType.RHYTHM_CREATION || type === AudioChallengeType.RHYTHM_REPEAT) {
            newConfig.rhythmBpm = config.rhythmBpm || 120;
            newConfig.rhythmTimeSignature = config.rhythmTimeSignature || '4/4';
        }
        
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
                type: [DocumentPicker.types.audio],
                copyTo: 'cachesDirectory',
            });
            const file = result[0];
            if (!file) {
                setIsUploading(false);
                return;
            }

            const fileInfo: FileInfo = {
                name: file.name || `audio_${Date.now()}.mp3`,
                size: file.size || 0,
                type: file.type || 'audio/mpeg',
                uri: file.fileCopyUri || file.uri,
            };

            const processedFile = FileService.processFileInfo(fileInfo);

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

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="music-note" size={24} color="#007AFF" />
              <Text style={styles.sectionTitle}>Audio Challenge Configuration</Text>
            </View>

            <View style={styles.typeGrid}>
              {AUDIO_CHALLENGE_TYPES.map((typeInfo) => (
                <TouchableOpacity
                  key={typeInfo.type}
                  style={[
                    styles.typeCard,
                    config.audioChallengeType === typeInfo.type && styles.typeCardSelected,
                    disabled && styles.typeCardDisabled,
                  ]}
                  onPress={() => handleTypeSelect(typeInfo.type)}
                  disabled={disabled}
                >
                  <View style={[
                    styles.typeIconContainer,
                    config.audioChallengeType === typeInfo.type && styles.typeIconContainerSelected
                  ]}>
                    <MaterialCommunityIcons
                      name={typeInfo.icon}
                      size={28}
                      color={config.audioChallengeType === typeInfo.type ? '#FFFFFF' : '#666'}
                    />
                  </View>
                  <Text style={[
                    styles.typeLabel,
                    config.audioChallengeType === typeInfo.type && styles.typeLabelSelected
                  ]}>
                    {typeInfo.label}
                  </Text>
                  {config.audioChallengeType === typeInfo.type && (
                    <View style={styles.checkmarkContainer}>
                      <MaterialCommunityIcons name="check-circle" size={18} color="#007AFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {selectedTypeInfo?.requiresReferenceAudio && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  <MaterialCommunityIcons name="music-box" size={16} color="#333" />
                  {' '}Reference Audio *
                </Text>
                {config.referenceAudioFile ? (
                  <View style={styles.audioPreview}>
                    <MaterialCommunityIcons name="file-music" size={24} color="#4CAF50" />
                    <Text style={styles.audioFileName} numberOfLines={1}>
                      {config.referenceAudioFile.name}
                    </Text>
                    <TouchableOpacity onPress={handleRemoveAudio} disabled={disabled}>
                      <MaterialCommunityIcons name="close-circle" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleAudioPick}
                    disabled={disabled || isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator color="#007AFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="upload" size={24} color="#007AFF" />
                        <Text style={styles.uploadText}>Upload Audio File</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {config.referenceAudioFile && (
              <View style={styles.segmentSection}>
                <Text style={styles.segmentLabel}>Audio Segment (optional)</Text>
                <View style={styles.segmentInputs}>
                  <View style={styles.segmentField}>
                    <Text style={styles.segmentFieldLabel}>Start (sec)</Text>
                    <TextInput
                      style={styles.segmentInput}
                      value={config.audioSegmentStart.toString()}
                      onChangeText={(text) => {
                        const num = parseFloat(text);
                        updateConfig('audioSegmentStart', isNaN(num) ? 0 : num);
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.segmentField}>
                    <Text style={styles.segmentFieldLabel}>End (sec)</Text>
                    <TextInput
                      style={styles.segmentInput}
                      value={config.audioSegmentEnd?.toString() || ''}
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
                    />
                  </View>
                </View>
              </View>
            )}

            {config.audioChallengeType && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  <MaterialCommunityIcons name="target" size={16} color="#333" />
                  {' '}Minimum Score to Pass: {config.minimumScorePercentage}%
                </Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderBound}>0%</Text>
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
                  <Text style={styles.sliderBound}>100%</Text>
                </View>
                <View style={styles.presetRow}>
                  {[30, 50, 60, 70, 80].map((score) => (
                    <TouchableOpacity
                      key={score}
                      style={[
                        styles.presetButton,
                        config.minimumScorePercentage === score && styles.presetButtonActive
                      ]}
                      onPress={() => updateConfig('minimumScorePercentage', score)}
                      disabled={disabled}
                    >
                      <Text style={[
                        styles.presetText,
                        config.minimumScorePercentage === score && styles.presetTextActive
                      ]}>
                        {score}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {showRhythmSettings && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  <MaterialCommunityIcons name="metronome" size={16} color="#333" />
                  {' '}Rhythm Settings
                </Text>
                <View style={styles.rhythmRow}>
                  <Text style={styles.rhythmLabel}>BPM:</Text>
                  <View style={styles.bpmControl}>
                    <TouchableOpacity
                      style={styles.bpmButton}
                      onPress={() => updateConfig('rhythmBpm', Math.max(40, (config.rhythmBpm || 120) - 5))}
                      disabled={disabled}
                    >
                      <MaterialCommunityIcons name="minus" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.bpmInput}
                      value={config.rhythmBpm?.toString() || '120'}
                      onChangeText={(text) => {
                        const bpm = parseInt(text, 10);
                        if (!isNaN(bpm) && bpm >= 40 && bpm <= 240) {
                          updateConfig('rhythmBpm', bpm);
                        }
                      }}
                      keyboardType="numeric"
                      editable={!disabled}
                    />
                    <TouchableOpacity
                      style={styles.bpmButton}
                      onPress={() => updateConfig('rhythmBpm', Math.min(240, (config.rhythmBpm || 120) + 5))}
                      disabled={disabled}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.rhythmRow}>
                  <Text style={styles.rhythmLabel}>Time:</Text>
                  <View style={styles.timeSignatureContainer}>
                    <Picker
                      selectedValue={config.rhythmTimeSignature || '4/4'}
                      onValueChange={(value) => updateConfig('rhythmTimeSignature', value)}
                      style={styles.timeSignaturePicker}
                      enabled={!disabled}
                    >
                      {['4/4', '3/4', '2/4', '6/8', '12/8', '5/4', '7/8'].map((sig) => (
                        <Picker.Item key={sig} label={sig} value={sig} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
      backgroundColor: '#F8F9FA',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#333',
    },
    section: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      marginBottom: 10,
    },
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
    },
    typeCard: {
      width: '48%',
      marginHorizontal: '1%',
      marginBottom: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 14,
      borderWidth: 2,
      borderColor: '#E0E0E0',
      alignItems: 'center',
      minHeight: 120,
      position: 'relative',
    },
    typeCardSelected: {
      borderColor: '#007AFF',
      backgroundColor: '#F0F7FF',
    },
    typeCardDisabled: {
      opacity: 0.5,
    },
    typeIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    typeIconContainerSelected: {
      backgroundColor: '#007AFF',
    },
    typeLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#333',
      textAlign: 'center',
    },
    typeLabelSelected: {
      color: '#007AFF',
    },
    checkmarkContainer: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    uploadButton: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: '#007AFF',
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FAFCFF',
    },
    uploadText: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '600',
      color: '#007AFF',
    },
    audioPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E8F5E9',
      padding: 12,
      borderRadius: 8,
      gap: 10,
    },
    audioFileName: {
      flex: 1,
      fontSize: 14,
      color: '#333',
    },
    sliderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    slider: {
      flex: 1,
      marginHorizontal: 8,
      height: 40,
    },
    sliderBound: {
      fontSize: 12,
      color: '#666',
      width: 35,
      textAlign: 'center',
    },
    presetRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    presetButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: '#F0F0F0',
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    presetButtonActive: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    presetText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#666',
    },
    presetTextActive: {
      color: '#FFFFFF',
    },
    rhythmRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    rhythmLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333',
      width: 60,
    },
    bpmControl: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    bpmButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F0F7FF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#007AFF',
    },
    bpmInput: {
      width: 70,
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 10,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '700',
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    timeSignatureContainer: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      overflow: 'hidden',
    },
    timeSignaturePicker: {
      height: 44,
    },
    segmentSection: {
        marginTop: 16,
    },
    segmentLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    segmentInputs: {
        flexDirection: 'row',
        gap: 16,
    },
    segmentField: {
        flex: 1,
    },
    segmentFieldLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    segmentInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
});

export default AudioChallengeSection;