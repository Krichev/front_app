import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Animated } from 'react-native';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { phaseStyles } from './phases.styles';
import { QuizQuestion } from '../../../../entities/QuizState/model/slice/quizApi';
import VoiceRecorder from '../../../../components/VoiceRecorder';
import QuestionMediaViewer from '../../../../screens/CreateWWWQuestScreen/components/QuestionMediaViewer';
import ExternalVideoPlayer from '../../../../components/ExternalVideoPlayer';
import { MediaType } from '../../../../services/wwwGame/questionService';
import { MediaSourceType } from '../../../../entities/QuizState/model/types/question.types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AudioChallengeContainer } from '../../../../screens/components/audio/AudioChallengeContainer';
import { extractYouTubeVideoId } from '../../../../utils/youtubeUtils';

interface DiscussionPhaseProps {
  question: QuizQuestion;
  timeLeft: number;
  animation: Animated.Value;
  notes: string;
  onNotesChange: (text: string) => void;
  onSubmitEarly: () => void;
  isVoiceEnabled?: boolean;
}

export const DiscussionPhase: React.FC<DiscussionPhaseProps> = ({
  question,
  timeLeft,
  animation,
  notes,
  onNotesChange,
  onSubmitEarly,
  isVoiceEnabled = false,
}) => {
  const { theme } = useAppStyles();
  const styles = phaseStyles(theme);
  const [voiceTranscription, setVoiceTranscription] = useState('');

  const handleVoiceTranscription = (text: string) => {
    setVoiceTranscription(text);
    if (text) {
      onNotesChange(notes ? `${notes} ${text}` : text);
    }
  };

  const isAudioChallenge = question.questionType === 'AUDIO' && !!question.audioChallengeType;

  // Helper to determine media type
  const getMediaType = (q: QuizQuestion): MediaType | null => {
    const mediaType = q.questionMediaType?.toUpperCase();
    if (mediaType && ['IMAGE', 'VIDEO', 'AUDIO'].includes(mediaType)) {
      return mediaType as MediaType;
    }
    // Fallback to questionType for external media where questionMediaType may be null
    const qType = q.questionType?.toUpperCase();
    if (qType && ['IMAGE', 'VIDEO', 'AUDIO'].includes(qType)) {
      return qType as MediaType;
    }
    return null;
  };

  const mediaType = getMediaType(question);
  const hasUploadedMedia = !!question.questionMediaId;
  const hasExternalMedia = !!question.mediaSourceType 
      && question.mediaSourceType !== MediaSourceType.UPLOADED
      && question.mediaSourceType !== 'UPLOADED'
      && (!!question.externalMediaUrl || !!question.externalMediaId);
  const showMedia = !!mediaType && !isAudioChallenge && (hasUploadedMedia || hasExternalMedia);

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{timeLeft} seconds</Text>
        <View style={styles.timerBar}>
          <Animated.View
            style={[
              styles.timerProgress,
              {
                width: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      <Text style={styles.title}>Team Discussion</Text>

      {isAudioChallenge ? (
        <AudioChallengeContainer
          question={question as any}
          mode="preview"
        />
      ) : (
        <View style={styles.questionContent}>
          {showMedia && mediaType && (
            <View style={styles.mediaContainer}>
              <View style={styles.mediaHeader}>
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
              {hasExternalMedia && mediaType === 'VIDEO' ? (
                <View style={{ width: '100%', aspectRatio: 16/9, overflow: 'hidden', borderRadius: 8 }}>
                  <ExternalVideoPlayer
                    mediaSourceType={question.mediaSourceType as MediaSourceType}
                    videoId={question.externalMediaId || extractYouTubeVideoId(question.externalMediaUrl || '')}
                    videoUrl={question.externalMediaUrl}
                    startTime={question.questionVideoStartTime || 0}
                    endTime={question.questionVideoEndTime}
                    autoPlay={false}
                    showControls={true}
                  />
                </View>
              ) : (
                <QuestionMediaViewer
                  questionId={Number(question.id)}
                  mediaType={mediaType as MediaType}
                  height={mediaType === 'AUDIO' ? 80 : 200}
                  enableFullscreen={mediaType !== 'AUDIO'}
                />
              )}
            </View>
          )}
          <Text style={styles.text}>{question.question}</Text>
        </View>
      )}

      {isVoiceEnabled && !isAudioChallenge && (
        <View style={styles.voiceRecorderContainer}>
          <VoiceRecorder
            onTranscription={handleVoiceTranscription}
            isActive={true}
          />
          {voiceTranscription ? (
            <View style={styles.transcriptionContainer}>
              <Text style={styles.transcriptionLabel}>
                Latest Transcription:
              </Text>
              <Text style={styles.transcriptionText}>
                {voiceTranscription}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text style={styles.label}>Discussion Notes:</Text>
        <TextInput
          style={styles.input}
          value={notes}
          onChangeText={onNotesChange}
          placeholder="Record your team's discussion..."
          multiline
          textAlignVertical="top"
          placeholderTextColor={theme.colors.text.disabled}
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={onSubmitEarly}
      >
        <Text style={styles.buttonText}>Submit Answer</Text>
      </TouchableOpacity>
    </View>
  );
};