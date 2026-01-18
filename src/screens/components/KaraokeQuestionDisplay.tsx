import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AudioPlayer} from './AudioPlayer';
import {AudioRecorder} from './AudioRecorder';
import {AUDIO_CHALLENGE_TYPES_INFO, AudioChallengeType} from '../../types/audioChallenge.types';

interface KaraokeQuestionDisplayProps {
  question: {
    question: string;
    questionMediaUrl?: string;
    audioChallengeType?: AudioChallengeType;
    audioSegmentStart?: number;
    audioSegmentEnd?: number;
    minimumScorePercentage?: number;
  };
  onRecordingComplete: (audioFile: { uri: string; name: string; type: string }) => void;
  disabled?: boolean;
}

export const KaraokeQuestionDisplay: React.FC<KaraokeQuestionDisplayProps> = ({
  question,
  onRecordingComplete,
  disabled = false,
}) => {
  const challengeTypeInfo = question.audioChallengeType
    ? AUDIO_CHALLENGE_TYPES_INFO[question.audioChallengeType]
    : null;

  return (
    <View style={styles.container}>
      {/* Challenge Type Header */}
      {challengeTypeInfo && (
        <View style={styles.header}>
          <MaterialCommunityIcons name="microphone-variant" size={24} color="#4CAF50" />
          <View style={styles.headerText}>
            <Text style={styles.typeTitle}>
              {challengeTypeInfo.type.replace('_', ' ')}
            </Text>
            <Text style={styles.typeDescription}>
              {question.minimumScorePercentage 
                ? `Pass score: ${question.minimumScorePercentage}%`
                : 'Complete the audio challenge'}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.questionText}>{question.question}</Text>

      {/* Reference Audio Player */}
      {question.questionMediaUrl && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listen to Reference</Text>
          <AudioPlayer 
            audioUrl={question.questionMediaUrl}
            segmentStart={question.audioSegmentStart}
            segmentEnd={question.audioSegmentEnd}
          />
        </View>
      )}

      {/* Audio Recorder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Record Your Response</Text>
        <AudioRecorder
          onRecordingComplete={onRecordingComplete}
          disabled={disabled}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerText: {
    marginLeft: 12,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  typeDescription: {
    fontSize: 12,
    color: '#666',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
});
