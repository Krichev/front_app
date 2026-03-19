import React from 'react';
import {Text, View} from 'react-native';
import {AudioPlayer} from '../AudioPlayer';
import MediaUrlService from '../../../services/media/MediaUrlService';
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
  const mediaService = MediaUrlService.getInstance();
  
  // Resolution priority:
  // 1. Explicit audioUrl prop
  // 2. question.questionMediaUrl (direct stream URL)
  // 3. question.audioReferenceMediaId (dedicated reference audio)
  // 4. question.questionMediaId (media library ID)
  // 5. question.id (question-specific media endpoint)

  const getEffectiveUrl = () => {
    // 1. Explicit audioUrl prop (caller knows best)
    if (audioUrl) return audioUrl;

    // 2. Resolve through MediaUrlService (prioritizes IDs, ignores uploaded media URL)
    const resolvedUrl = mediaService.resolveQuestionAudioUrl(question || {});
    if (resolvedUrl) return resolvedUrl;

    // 3. Last resort: questionMediaUrl — only if it looks like a relative path
    //    (after backend fix, these will be relative like /api/media/question/44/stream)
    if (question?.questionMediaUrl) {
      if (question.questionMediaUrl.startsWith('/')) {
        // Relative path from new backend — prepend our base URL
        // We need to reach private getBaseUrl or use another service method
        // But getQuestionMediaUrl already uses getBaseUrl() internally.
        // Actually, we can just use the fact that resolveQuestionAudioUrl already tried to build it.
        // If it's a relative path, we can prepend base URL manually if we had it, 
        // but it's better to trust resolveQuestionAudioUrl more.
        
        const baseUrl = (mediaService as any).getBaseUrl?.() || NetworkConfigManager.getInstance().getBaseUrl();
        return `${baseUrl.replace('/api', '')}${question.questionMediaUrl}`;
      }
      
      // Old absolute URL — log a warning but try to use it
      console.warn('⚠️ [ReferenceAudioSection] Received absolute questionMediaUrl, should build from IDs:', question.questionMediaUrl);
      return question.questionMediaUrl;
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
