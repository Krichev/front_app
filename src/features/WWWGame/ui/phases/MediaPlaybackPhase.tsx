import React, {useCallback, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useAppStyles} from '../../../../shared/ui/hooks/useAppStyles';
import {phaseStyles} from './phases.styles';
import {QuizQuestion} from '../../../../entities/QuizState/model/slice/quizApi';
import AuthenticatedVideo from '../../../../components/AuthenticatedVideo';
import AuthenticatedAudio from '../../../../components/AuthenticatedAudio';
import ExternalVideoPlayer from '../../../../components/ExternalVideoPlayer';
import {MediaType} from '../../../../services/wwwGame/questionService';
import {MediaSourceType} from '../../../../entities/QuizState/model/types/question.types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {extractYouTubeVideoId} from '../../../../utils/youtubeUtils';
import {useTranslation} from 'react-i18next';

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
  const { t } = useTranslation();
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
      <ScrollView 
          style={styles.mediaPlaybackContainer}
          contentContainerStyle={{ 
              flexGrow: 1, 
              justifyContent: 'center',
              padding: theme.spacing.xl
          }}
          showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {mediaType === 'VIDEO' ? t('wwwPhases.mediaPlayback.watchVideo') : t('wwwPhases.mediaPlayback.listenAudio')}
        </Text>

        <View style={[
            { width: '100%', overflow: 'hidden', borderRadius: 8 },
            mediaType === 'VIDEO' && !isExternalMedia && { aspectRatio: 16/9 }
        ]}>
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
                      showControls={false}
                      hideTitle={true}
                      enableFullscreen={true}
                      initialFullscreen={true}
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
                <Text style={styles.skipButtonText}>{t('wwwPhases.mediaPlayback.replay')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  style={styles.continueButton}
                  onPress={onPlaybackComplete}
              >
                <Text style={styles.continueButtonText}>{t('wwwPhases.mediaPlayback.continueToDiscussion')}</Text>
              </TouchableOpacity>
            </View>
        )}

        {!playbackEnded && (
            <TouchableOpacity
                style={styles.skipButton}
                onPress={onSkip}
            >
              <Text style={styles.skipButtonText}>{t('wwwPhases.mediaPlayback.skipMedia')}</Text>
            </TouchableOpacity>
        )}
      </ScrollView>
  );
};
