import React from 'react';
import {View} from 'react-native';
import {AudioChallengeHeader} from './AudioChallengeHeader';
import {ReferenceAudioSection} from './ReferenceAudioSection';
import {AudioChallengeType} from '../../../types/audioChallenge.types';
import {createStyles} from '../../../shared/ui/theme';

interface AudioChallengePreviewProps {
  question: {
    id?: number | string;
    question?: string;
    questionMediaUrl?: string;
    questionMediaId?: string | number | null;
    audioReferenceMediaId?: number | string | null;
    audioChallengeType?: AudioChallengeType | null;
    audioSegmentStart?: number | null;
    audioSegmentEnd?: number | null;
    minimumScorePercentage?: number | null;
    additionalInfo?: string;
  };
  onPlaybackComplete?: () => void;
}

export const AudioChallengePreview: React.FC<AudioChallengePreviewProps> = ({
  question,
  onPlaybackComplete,
}) => {
  const styles = themeStyles;

  return (
    <View style={styles.container}>
      <AudioChallengeHeader 
        challengeType={question.audioChallengeType ?? undefined}
        minimumScorePercentage={question.minimumScorePercentage ?? undefined}
        instructions={question.question}
      />
      
      <ReferenceAudioSection 
        question={question}
        segmentStart={question.audioSegmentStart ?? undefined}
        segmentEnd={question.audioSegmentEnd ?? undefined}
        title="Reference Audio"
        onPlaybackComplete={onPlaybackComplete}
      />
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  container: {
    marginBottom: theme.spacing.lg,
  },
}));