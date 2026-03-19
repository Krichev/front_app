import React from 'react';
import {Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {ReferenceAudioSection} from './audio/ReferenceAudioSection';
import {AudioRecorder} from './AudioRecorder';
import {AUDIO_CHALLENGE_TYPES_INFO, AudioChallengeType} from '../../types/audioChallenge.types';
import {useAppStyles} from '../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../shared/ui/theme';

/**
 * @deprecated Use AudioChallengeContainer or AudioChallengePreview from ./audio/ instead.
 * This component is currently UNUSED in the project and can be safely deleted in a future cleanup.
 */
interface KaraokeQuestionDisplayProps {
  question: {
    id: number;
    question: string;
    questionMediaUrl?: string;
    questionMediaId?: number | string | null;
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
  const { t } = useTranslation();
  const { theme } = useAppStyles();
  const styles = themeStyles;

  const challengeTypeInfo = question.audioChallengeType
    ? AUDIO_CHALLENGE_TYPES_INFO[question.audioChallengeType]
    : null;

  return (
    <View style={styles.container}>
      {/* Challenge Type Header */}
      {challengeTypeInfo && (
        <View style={styles.header}>
          <MaterialCommunityIcons name="microphone-variant" size={24} color={theme.colors.success.main} />
          <View style={styles.headerText}>
            <Text style={styles.typeTitle}>
              {challengeTypeInfo.type.replace('_', ' ')}
            </Text>
            <Text style={styles.typeDescription}>
              {question.minimumScorePercentage 
                ? t('questionDisplay.karaoke.passScore', { percentage: question.minimumScorePercentage })
                : t('questionDisplay.karaoke.completeChallenge')}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.questionText}>{question.question}</Text>

      {/* Reference Audio Player */}
      {(question.questionMediaUrl || question.questionMediaId || question.id) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('questionDisplay.karaoke.listenReference')}</Text>
          <ReferenceAudioSection
            question={{
              id: question.id,
              questionMediaUrl: question.questionMediaUrl,
              questionMediaId: question.questionMediaId ?? null,
              audioSegmentStart: question.audioSegmentStart ?? null,
              audioSegmentEnd: question.audioSegmentEnd ?? null,
            }}
            title={t('questionDisplay.karaoke.listenReference')}
          />
        </View>
      )}

      {/* Audio Recorder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('questionDisplay.karaoke.recordResponse')}</Text>
        <AudioRecorder
          onRecordingComplete={onRecordingComplete}
          disabled={disabled}
        />
      </View>
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.layout.borderRadius.md,
    elevation: 2,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  headerText: {
    marginLeft: theme.spacing.md,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  typeDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
  },
}));
