import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AudioChallengePreview} from './AudioChallengePreview';
import {AudioResponseRecorder} from './AudioResponseRecorder';
import {AudioChallengeType} from '../../../types/audioChallenge.types';

interface AudioChallengeContainerProps {
  question: {
    question?: string;
    questionMediaUrl?: string;
    audioChallengeType?: AudioChallengeType;
    audioSegmentStart?: number;
    audioSegmentEnd?: number;
    minimumScorePercentage?: number;
    additionalInfo?: string;
  };
  mode: 'preview' | 'record';
  onRecordingComplete?: (audioFile: { uri: string; name: string; type: string }) => void;
  disabled?: boolean; // For when submitting
}

export const AudioChallengeContainer: React.FC<AudioChallengeContainerProps> = ({
  question,
  mode,
  onRecordingComplete,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Header and Reference Audio */}
      <AudioChallengePreview question={question} />

      {/* Recorder - Only in record mode */}
      {mode === 'record' && onRecordingComplete && (
        <AudioResponseRecorder 
          onRecordingComplete={onRecordingComplete}
          disabled={disabled}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
