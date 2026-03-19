import React from 'react';
import {Text, View} from 'react-native';
import {AudioPlayer} from '../AudioPlayer';
import NetworkConfigManager from '../../../config/NetworkConfig';
import {useAppStyles} from '../../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../../shared/ui/theme';

interface ReferenceAudioSectionProps {
  audioUrl?: string;
  segmentStart?: number | null;
  segmentEnd?: number | null;
  title?: string;
  question?: {
    id?: number | string;
    questionMediaUrl?: string;
    questionMediaId?: string | number | null;
    audioSegmentStart?: number | null;
    audioSegmentEnd?: number | null;
    audioReferenceMediaId?: number | string | null;
  };
  onPlaybackComplete?: () => void;
  mini?: boolean;
  autoPlay?: boolean;
}

export const ReferenceAudioSection: React.FC<ReferenceAudioSectionProps> = ({
  audioUrl,
  segmentStart,
  segmentEnd,
  title = 'Listen to Reference',
  question,
  onPlaybackComplete,
  mini = false,
  autoPlay = false,
}) => {
  const {theme} = useAppStyles();
  const styles = themeStyles;
  const API_BASE_URL = NetworkConfigManager.getInstance().getBaseUrl();
  
  // Resolution priority:
  // 1. Explicit audioUrl prop
  // 2. question.questionMediaUrl (direct stream URL)
  // 3. question.audioReferenceMediaId (dedicated reference audio)
  // 4. question.questionMediaId (media library ID)
  // 5. question.id (question-specific media endpoint)

  const getEffectiveUrl = () => {
    const resolveRelative = (url: string | undefined) => {
      if (!url) return undefined;
      if (url.startsWith('http')) return url;
      if (url.startsWith('/')) {
        // If it already has /api, we should be careful not to double it if API_BASE_URL has it
        // However, API_BASE_URL usually includes /api, e.g. http://host/api
        // If url is /api/media/..., we want http://host/api/media/...
        // So we should strip /api from url OR strip /api from API_BASE_URL
        if (url.startsWith('/api/')) {
          const hostPart = API_BASE_URL.replace(/\/api$/, '').replace(/\/api\/$/, '');
          return `${hostPart}${url}`;
        }
        return `${API_BASE_URL}${url}`;
      }
      return url;
    };

    if (audioUrl) return resolveRelative(audioUrl);
    if (question?.questionMediaUrl) return resolveRelative(question.questionMediaUrl);
    
    if (question?.audioReferenceMediaId) {
      return `${API_BASE_URL}/media/audio/${question.audioReferenceMediaId}/playback-url`;
    }
    
    if (question?.questionMediaId) {
      return `${API_BASE_URL}/media/stream/${question.questionMediaId}`;
    }
    
    if (question?.id) {
      return `${API_BASE_URL}/media/question/${question.id}/stream`;
    }
    
    // diagnostic logging
    console.warn('🎵 [ReferenceAudioSection] No audio URL could be resolved. Available fields:', {
      audioUrl,
      questionMediaUrl: question?.questionMediaUrl,
      audioReferenceMediaId: question?.audioReferenceMediaId,
      questionMediaId: question?.questionMediaId,
      questionId: question?.id,
    });
    
    return undefined;
  };

  const effectiveUrl = getEffectiveUrl();
  const effectiveStart = (segmentStart ?? question?.audioSegmentStart) ?? 0;
  const effectiveEnd = (segmentEnd ?? question?.audioSegmentEnd) ?? undefined;

  if (!effectiveUrl) return null;

  return (
    <View style={[styles.container, mini && styles.miniContainer]}>
      {!mini && <Text style={styles.title}>{title}</Text>}
      <AudioPlayer 
        audioUrl={effectiveUrl}
        segmentStart={effectiveStart}
        segmentEnd={effectiveEnd}
        onPlaybackComplete={onPlaybackComplete}
        autoPlay={autoPlay}
      />
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  container: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.md,
    elevation: 2,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  miniContainer: {
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.tertiary,
    elevation: 0,
    shadowOpacity: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
}));
