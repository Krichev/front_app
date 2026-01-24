import React from 'react';
import {View} from 'react-native';
import {AudioChallengeHeader} from './AudioChallengeHeader';
import {ReferenceAudioSection} from './ReferenceAudioSection';
import {AudioChallengeType} from '../../../types/audioChallenge.types';
import {createStyles} from '../../../shared/ui/theme';

interface AudioChallengePreviewProps {
  question: {
    question?: string;
    questionMediaUrl?: string;
    audioChallengeType?: AudioChallengeType;
    audioSegmentStart?: number;
    audioSegmentEnd?: number;
    minimumScorePercentage?: number;
    additionalInfo?: string;
  };
}

export const AudioChallengePreview: React.FC<AudioChallengePreviewProps> = ({
  question,
}) => {
  const styles = themeStyles;

  return (
    <View style={styles.container}>
      <AudioChallengeHeader 
        challengeType={question.audioChallengeType}
        minimumScorePercentage={question.minimumScorePercentage}
        instructions={question.question}
      />
      
      <ReferenceAudioSection 
        audioUrl={question.questionMediaUrl}
        segmentStart={question.audioSegmentStart}
        segmentEnd={question.audioSegmentEnd}
        title="Reference Audio"
      />
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  container: {
    marginBottom: theme.spacing.lg,
  },
}));