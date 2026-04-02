import React from 'react';
import {Text, View} from 'react-native';
import {AudioPlayer} from '../AudioPlayer';
import NetworkConfigManager from '../../../config/NetworkConfig';
import {useAppStyles} from '../../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../../shared/ui/theme';
import {useTranslation} from "react-i18next";

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
  title,
  question,
  onPlaybackComplete,
  mini = false,
  autoPlay = false,
}) => {
  const { t } = useTranslation();
  const {theme} = useAppStyles();
  const styles = themeStyles;
  const API_BASE_URL = NetworkConfigManager.getInstance().getBaseUrl();
  
  
  const isValidPlayableUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    // Relative paths without host won't work for ExoPlayer
    if (url.startsWith('/')) return false;
    // Must start with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    // localhost URLs won't work from Android emulator
    if (url.includes('localhost')) return false;
    return true;
  };

  const getEffectiveUrl = () => {
    // 1. Explicit audioUrl prop (if valid)
    if (audioUrl && isValidPlayableUrl(audioUrl)) return audioUrl;

    // 2. question.questionMediaUrl (if valid)
    if (question?.questionMediaUrl && isValidPlayableUrl(question.questionMediaUrl)) return question.questionMediaUrl;
    
    // 3. question.audioReferenceMediaId
    if (question?.audioReferenceMediaId) {
      return `${API_BASE_URL}/media/stream/${question.audioReferenceMediaId}`;
    }
    
    // 4. question.questionMediaId
    if (question?.questionMediaId) {
      return `${API_BASE_URL}/media/stream/${question.questionMediaId}`;
    }
    
    // 5. question.id
    if (question?.id) {
      return `${API_BASE_URL}/media/question/${question.id}/stream`;
    }
    
    // Last resort: try to fix a relative audioUrl by prepending base URL
    if (audioUrl && audioUrl.startsWith('/')) {
      return `${API_BASE_URL}${audioUrl.startsWith('/api') ? audioUrl.substring(4) : audioUrl}`;
    }
    
    return undefined;
  };

  const effectiveUrl = getEffectiveUrl();

  // diagnostic logging
  console.log('🎵 [ReferenceAudioSection] Resolved audio URL:', { 
    audioUrl, 
    questionId: question?.id,
    questionMediaId: question?.questionMediaId,
    effectiveUrl 
  });

  const effectiveStart = (segmentStart ?? question?.audioSegmentStart) ?? 0;
  const effectiveEnd = (segmentEnd ?? question?.audioSegmentEnd) ?? undefined;

  if (!effectiveUrl) return null;

  const displayTitle = title || t('questionDisplay.karaoke.listenReference');

  return (
    <View style={[styles.container, mini && styles.miniContainer]}>
      {!mini && <Text style={styles.title}>{displayTitle}</Text>}
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
    backgroundColor: theme.colors.background.primary,
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
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
}));
