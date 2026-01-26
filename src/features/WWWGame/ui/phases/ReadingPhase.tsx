import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { phaseStyles } from './phases.styles';
import { QuizQuestion } from '../../../../entities/QuizState/model/slice/quizApi';
import QuestionMediaViewer from '../../../../screens/CreateWWWQuestScreen/components/QuestionMediaViewer';
import { MediaType } from '../../../../services/wwwGame/questionService';

interface ReadingPhaseProps {
  question: QuizQuestion;
  timeLeft: number;
  onSkip: () => void;
  onComplete: () => void;
}

export const ReadingPhase: React.FC<ReadingPhaseProps> = ({
  question,
  timeLeft,
  onSkip,
  onComplete,
}) => {
  const { theme } = useAppStyles();
  const styles = phaseStyles(theme);
  const [secondsRemaining, setSecondsRemaining] = useState(timeLeft);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, onComplete]);

  // Helper to determine media type
  const getMediaType = (q: QuizQuestion): MediaType | null => {
    const mediaType = q.questionMediaType?.toUpperCase();
    if (mediaType && ['IMAGE', 'VIDEO', 'AUDIO'].includes(mediaType)) {
      return mediaType as MediaType;
    }
    return null;
  };

  const mediaType = getMediaType(question);
  const showImage = mediaType === 'IMAGE' && !!question.questionMediaId;

  const progress = (secondsRemaining / timeLeft) * 100;

  return (
    <View style={styles.readingContainer}>
      <Text style={styles.title}>Read the Question</Text>

      <View style={styles.timerContainer}>
        <Text style={styles.readingCountdown}>{secondsRemaining}s</Text>
        <View style={styles.timerBar}>
          <View
            style={[
              styles.timerProgress,
              { width: `${progress}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.questionContent}>
        {showImage && (
          <View style={styles.mediaContainer}>
            <QuestionMediaViewer
              questionId={Number(question.id)}
              mediaType={MediaType.IMAGE}
              height={200}
              enableFullscreen={true}
            />
          </View>
        )}
        <Text style={styles.text}>
          {question.question}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={onSkip}
      >
        <Text style={styles.skipButtonText}>I'm Ready</Text>
      </TouchableOpacity>
    </View>
  );
};
