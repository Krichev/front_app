import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { phaseStyles } from './phases.styles';
import { QuizQuestion } from '../../../../entities/QuizState/model/slice/quizApi';
import AuthenticatedAudio from '../../../../components/AuthenticatedAudio';
import ExternalVideoPlayer from '../../../../components/ExternalVideoPlayer';
import QuestionMediaViewer from '../../../../screens/CreateWWWQuestScreen/components/QuestionMediaViewer';
import { MediaType } from '../../../../services/wwwGame/questionService';
import { MediaSourceType } from '../../../../entities/QuizState/model/types/question.types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { extractYouTubeVideoId } from '../../../../utils/youtubeUtils';

interface MediaPlaybackPhaseProps {
  question: QuizQuestion;
  onPlaybackComplete: () => void;
  onSkip: () => void;
}

export const MediaPlaybackPhase: React.FC<MediaPlaybackPhaseProps> = ({
  question,
  onPlaybackComplete,
  onSkip,
}) => {
  const { theme } = useAppStyles();
  const styles = phaseStyles(theme);
  const [replayKey, setReplayKey] = useState(0);

  const handleEnd = useCallback(() => {
    // Media finished naturally — no auto-transition since autoPlay is false
    // User will click "Continue to Discussion" manually
  }, []);

  const handleReplay = useCallback(() => {
    setReplayKey(prev => prev + 1);
  }, []);

  const getMediaType = (q: QuizQuestion): MediaType | null => {
    const mediaType = q.questionMediaType?.toUpperCase();
    if (mediaType && ['VIDEO', 'AUDIO'].includes(mediaType)) {
      return mediaType as MediaType;
    }
    // Fallback to questionType for external media where questionMediaType may be null
    const qType = q.questionType?.toUpperCase();
    if (qType && ['VIDEO', 'AUDIO'].includes(qType)) {
      return qType as MediaType;
    }
    return null;
  };

  const mediaType = getMediaType(question);
  
  const hasUploadedMedia = !!question.questionMediaId;
  const hasExternalMedia = !!question.mediaSourceType 
      && question.mediaSourceType !== MediaSourceType.UPLOADED
      && (!!question.externalMediaUrl || !!question.externalMediaId);

  // For YouTube, extract video ID
  const mediaSourceType = question.mediaSourceType || MediaSourceType.UPLOADED;
  const videoId = mediaSourceType === MediaSourceType.YOUTUBE
    ? (question.externalMediaId || extractYouTubeVideoId(question.externalMediaUrl || '') || undefined)
    : undefined;

  return (
    <View style={styles.mediaPlaybackContainer}>
      <Text style={styles.title}>
        {mediaType === 'VIDEO' ? 'Watch the Video' : 'Listen to the Audio'}
      </Text>

      <View style={styles.mediaContainer}>
        {/* Media header with icon and label — same as DiscussionPhase */}
        <View style={styles.mediaHeader}>
          <MaterialCommunityIcons
            name={mediaType === 'AUDIO' ? 'music' : 'video'}
            size={16}
            color={theme.colors.text.secondary}
          />
          <Text style={{ 
            ...theme.typography.body.small, 
            color: theme.colors.text.secondary, 
            fontWeight: theme.typography.fontWeight.medium 
          }}>
            {mediaType === 'AUDIO' ? 'Listen to the audio' : 'Watch the video'}
          </Text>
        </View>

        {/* Media player — DiscussionPhase pattern */}
        {mediaType === 'VIDEO' ? (
          hasExternalMedia ? (
            <View style={{ width: '100%', aspectRatio: 16/9, overflow: 'hidden', borderRadius: 8 }}>
              <ExternalVideoPlayer
                key={replayKey}
                mediaSourceType={mediaSourceType}
                videoId={videoId}
                videoUrl={question.externalMediaUrl || question.questionMediaUrl}
                startTime={question.questionVideoStartTime}
                endTime={question.questionVideoEndTime}
                onSegmentEnd={handleEnd}
                autoPlay={false}
                showControls={false}
                hideTitle={true}
              />
            </View>
          ) : (
            <QuestionMediaViewer
              key={replayKey}
              questionId={Number(question.id)}
              mediaType={mediaType as MediaType}
              height={200}
              enableFullscreen={true}
            />
          )
        ) : (
          <AuthenticatedAudio
            key={replayKey}
            questionId={Number(question.id)}
            onEnd={handleEnd}
          />
        )}
      </View>

      {/* Action buttons — always visible since no auto-play */}
      <View style={{ marginTop: theme.spacing.lg }}>
        <TouchableOpacity
          style={styles.replayButton}
          onPress={handleReplay}
        >
          <MaterialCommunityIcons name="replay" size={24} color={theme.colors.text.secondary} />
          <Text style={styles.skipButtonText}>Replay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={onPlaybackComplete}
        >
          <Text style={styles.continueButtonText}>Continue to Discussion</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
        >
          <Text style={styles.skipButtonText}>Skip Media</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};