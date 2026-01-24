import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { phaseStyles } from './phases.styles';
import { QuizQuestion } from '../../model/types';
import QuestionMediaViewer from '../../../../screens/CreateWWWQuestScreen/components/QuestionMediaViewer';
import { MediaType } from '../../../../services/wwwGame/questionService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AudioChallengeContainer } from '../../../../screens/components/audio';

interface QuestionPhaseProps {
  question: QuizQuestion;
  onStartDiscussion: () => void;
}

export const QuestionPhase: React.FC<QuestionPhaseProps> = ({
  question,
  onStartDiscussion,
}) => {
  const { theme } = useAppStyles();
  const styles = phaseStyles(theme);

  const isAudioChallenge = question.questionType === 'AUDIO' && !!question.audioChallengeType;

  // Helper to determine media type
  const getMediaType = (q: QuizQuestion): MediaType | null => {
    const mediaType = q.questionMediaType?.toUpperCase();
    if (mediaType && ['IMAGE', 'VIDEO', 'AUDIO'].includes(mediaType)) {
      return mediaType as MediaType;
    }
    const qType = q.questionType?.toUpperCase();
    if (qType && ['IMAGE', 'VIDEO', 'AUDIO'].includes(qType)) {
      return qType as MediaType;
    }
    return null;
  };

  const mediaType = getMediaType(question);
  const showMedia = !!mediaType && !isAudioChallenge && !!question.questionMediaId;

  return (
    <View style={styles.container}>
      {isAudioChallenge ? (
        <AudioChallengeContainer
          question={question as any}
          mode="preview"
        />
      ) : (
        <View style={{ width: '100%', marginBottom: theme.spacing.lg }}>
          {showMedia && mediaType && (
            <View style={{ marginBottom: theme.spacing.lg, backgroundColor: theme.colors.background.tertiary, borderRadius: theme.layout.borderRadius.lg, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, backgroundColor: theme.colors.background.tertiary, gap: theme.spacing.sm }}>
                <MaterialCommunityIcons
                  name={mediaType === 'AUDIO' ? 'music' : mediaType === 'VIDEO' ? 'video' : 'image'}
                  size={16}
                  color={theme.colors.text.secondary}
                />
                <Text style={{ ...theme.typography.body.small, color: theme.colors.text.secondary, fontWeight: theme.typography.fontWeight.medium }}>
                  {mediaType === 'AUDIO' ? 'Listen to the audio' :
                   mediaType === 'VIDEO' ? 'Watch the video' : 'View the image'}
                </Text>
              </View>
              <QuestionMediaViewer
                questionId={Number(question.id)}
                mediaType={mediaType as MediaType}
                height={mediaType === 'AUDIO' ? 80 : 200}
                enableFullscreen={mediaType !== 'AUDIO'}
              />
            </View>
          )}
          <Text style={styles.title}>{question.question}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={onStartDiscussion}
      >
        <Text style={styles.buttonText}>
          {isAudioChallenge ? 'Ready to Record' : 'Start Discussion'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
