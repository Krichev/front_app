import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Slider from '@react-native-community/slider';
import { QuestAudioConfig } from '../../../entities/ChallengeState/model/types';
import AuthenticatedAudio from '../../../components/AuthenticatedAudio';

interface AudioSegmentPickerProps {
  value: QuestAudioConfig | null;
  onChange: (config: QuestAudioConfig | null) => void;
  questId?: number;
}

interface AudioFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export const AudioSegmentPicker: React.FC<AudioSegmentPickerProps> = ({
  value,
  onChange,
  questId,
}) => {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Initialize state from value
  const totalDuration = value?.totalDuration || 0;
  const startTime = value?.audioStartTime || 0;
  const endTime = value?.audioEndTime || totalDuration;

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [
          DocumentPicker.types.audio,
          'audio/mpeg',
          'audio/mp3',
          'audio/wav',
          'audio/aac',
          'audio/m4a',
        ],
        copyTo: 'cachesDirectory',
      });

      if (result) {
        const file: AudioFile = {
          uri: result.fileCopyUri || result.uri,
          name: result.name || 'audio.mp3',
          type: result.type || 'audio/mpeg',
          size: result.size || undefined,
        };

        setAudioFile(file);
        setIsUploading(false);

        // Note: Actual upload will happen when quest is created
        // For now, just store the file reference
        Alert.alert(
          'Audio Selected',
          `Selected: ${file.name}\n\nYou can now select the segment to use and set the minimum score requirement.`
        );
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Error picking audio:', err);
        Alert.alert('Error', 'Failed to select audio file');
      }
    }
  };

  const handleStartTimeChange = (newStartTime: number) => {
    // Round to nearest 0.1 second
    const rounded = Math.round(newStartTime * 10) / 10;

    // Ensure start time doesn't exceed end time
    const safeStartTime = Math.min(rounded, endTime - 1);

    onChange({
      ...value,
      audioStartTime: safeStartTime,
      audioEndTime: endTime,
      minimumScorePercentage: value?.minimumScorePercentage || 0,
      totalDuration,
    } as QuestAudioConfig);
  };

  const handleEndTimeChange = (newEndTime: number) => {
    // Round to nearest 0.1 second
    const rounded = Math.round(newEndTime * 10) / 10;

    // Ensure end time doesn't go below start time
    const safeEndTime = Math.max(rounded, startTime + 1);

    onChange({
      ...value,
      audioStartTime: startTime,
      audioEndTime: safeEndTime,
      minimumScorePercentage: value?.minimumScorePercentage || 0,
      totalDuration,
    } as QuestAudioConfig);
  };

  const handleRemoveAudio = () => {
    Alert.alert(
      'Remove Audio',
      'Are you sure you want to remove the audio track?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setAudioFile(null);
            onChange(null);
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const segmentDuration = endTime - startTime;

  return (
    <View style={styles.container}>
      {!audioFile && !value?.audioUrl ? (
        // No audio selected
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No audio track selected</Text>
          <TouchableOpacity style={styles.pickButton} onPress={handlePickAudio}>
            <Text style={styles.pickButtonText}>📁 Select Audio File</Text>
          </TouchableOpacity>
          <Text style={styles.helpText}>
            Supported formats: MP3, WAV, AAC, M4A (max 100MB)
          </Text>
        </View>
      ) : (
        // Audio selected
        <View style={styles.audioConfigContainer}>
          <View style={styles.audioHeader}>
            <View style={styles.audioInfo}>
              <Text style={styles.audioTitle}>🎵 Audio Track</Text>
              <Text style={styles.audioName}>
                {audioFile?.name || 'Uploaded audio'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemoveAudio}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {totalDuration > 0 && (
            <>
              {/* Segment Selection */}
              <View style={styles.segmentSection}>
                <Text style={styles.sectionTitle}>Select Audio Segment</Text>

                {/* Start Time Slider */}
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Start Time</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={totalDuration - 1}
                    value={startTime}
                    onValueChange={handleStartTimeChange}
                    minimumTrackTintColor="#4CAF50"
                    maximumTrackTintColor="#CCCCCC"
                    thumbTintColor="#4CAF50"
                    step={0.1}
                  />
                  <Text style={styles.timeValue}>{formatTime(startTime)}</Text>
                </View>

                {/* End Time Slider */}
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>End Time</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={startTime + 1}
                    maximumValue={totalDuration}
                    value={endTime}
                    onValueChange={handleEndTimeChange}
                    minimumTrackTintColor="#2196F3"
                    maximumTrackTintColor="#CCCCCC"
                    thumbTintColor="#2196F3"
                    step={0.1}
                  />
                  <Text style={styles.timeValue}>{formatTime(endTime)}</Text>
                </View>

                {/* Segment Summary */}
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryText}>
                    Segment Duration: {formatTime(segmentDuration)}
                  </Text>
                  <Text style={styles.summarySubtext}>
                    Total Duration: {formatTime(totalDuration)}
                  </Text>
                </View>
              </View>

              {/* Preview Section */}
              {value?.audioUrl && (
                <View style={styles.previewSection}>
                  <Text style={styles.sectionTitle}>Preview Segment</Text>
                  <AuthenticatedAudio
                    uri={value.audioUrl}
                    showWaveform={false}
                    onLoad={() => console.log('Audio loaded')}
                    onError={(error) => console.error('Audio error:', error)}
                  />
                  <Text style={styles.previewNote}>
                    ℹ️ Preview plays the selected segment only
                  </Text>
                </View>
              )}
            </>
          )}

          {isUploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.uploadingText}>Uploading audio...</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  pickButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  pickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  audioConfigContainer: {
    gap: 16,
  },
  audioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  audioName: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  segmentSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
  },
  summaryBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#666',
  },
  previewSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  previewNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  uploadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
});

export default AudioSegmentPicker;
