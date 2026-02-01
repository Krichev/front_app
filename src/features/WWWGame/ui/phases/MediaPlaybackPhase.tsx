import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { phaseStyles } from './phases.styles';
import { QuizQuestion } from '../../../../entities/QuizState/model/slice/quizApi';
import AuthenticatedVideo from '../../../../components/AuthenticatedVideo';
import AuthenticatedAudio from '../../../../components/AuthenticatedAudio';
import ExternalVideoPlayer from '../../../../components/ExternalVideoPlayer';
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
  const [playbackEnded, setPlaybackEnded] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const handleEnd = useCallback(() => {
    setPlaybackEnded(true);
    // Auto-transition to discussion phase after video ends
    onPlaybackComplete();
  }, [onPlaybackComplete]);

  const handleReplay = useCallback(() => {
    setPlaybackEnded(false);
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
  
  // Determine media source type
  const mediaSourceType = question.mediaSourceType || MediaSourceType.UPLOADED;

  // Check if this is external media (YouTube, Vimeo, etc.)
  const isExternalMedia = question.mediaSourceType 
    && question.mediaSourceType !== MediaSourceType.UPLOADED;

  // For YouTube, extract video ID
  const videoId = mediaSourceType === MediaSourceType.YOUTUBE
    ? (question.externalMediaId || extractYouTubeVideoId(question.externalMediaUrl || '') || undefined)
    : undefined;

  return (
    <View style={styles.mediaPlaybackContainer}>
      <Text style={styles.title}>
        {mediaType === 'VIDEO' ? 'Watch the Video' : 'Listen to the Audio'}
      </Text>

      <View style={[styles.mediaContainer, mediaType === 'VIDEO' && { aspectRatio: 16/9 }]}>
        {mediaType === 'VIDEO' ? (
          isExternalMedia ? (
            <ExternalVideoPlayer
              key={replayKey}
              mediaSourceType={mediaSourceType}
              videoId={videoId}
              videoUrl={question.externalMediaUrl || question.questionMediaUrl}
              startTime={question.questionVideoStartTime}
              endTime={question.questionVideoEndTime}
              onSegmentEnd={handleEnd}
              autoPlay={true}
            />
          ) : (
            <AuthenticatedVideo
              key={replayKey}
              questionId={Number(question.id)}
              shouldPlay={true}
              useNativeControls={true}
              onEnd={handleEnd}
              style={styles.mediaContainer}
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

      {playbackEnded && (
        <View>
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
        </View>
      )}

      {!playbackEnded && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
        >
          <Text style={styles.skipButtonText}>Skip Media</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};