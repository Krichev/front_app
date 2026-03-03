import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {AudioPlayer} from '../AudioPlayer';
import NetworkConfigManager from '../../../config/NetworkConfig';

interface ReferenceAudioSectionProps {
  audioUrl?: string;
  segmentStart?: number;
  segmentEnd?: number;
  title?: string;
  question?: {
    questionMediaUrl?: string;
    audioSegmentStart?: number;
    audioSegmentEnd?: number;
    audioReferenceMediaId?: number | string;
  };
  onPlaybackComplete?: () => void;
  mini?: boolean;
}

export const ReferenceAudioSection: React.FC<ReferenceAudioSectionProps> = ({
  audioUrl,
  segmentStart,
  segmentEnd,
  title = 'Listen to Reference',
  question,
  onPlaybackComplete,
  mini = false,
}) => {
  const API_BASE_URL = NetworkConfigManager.getInstance().getBaseUrl();
  
  const fallbackUrl = question?.audioReferenceMediaId 
    ? `${API_BASE_URL}/media/audio/${question.audioReferenceMediaId}/playback-url`
    : undefined;

  const effectiveUrl = audioUrl || question?.questionMediaUrl || fallbackUrl;
  const effectiveStart = segmentStart ?? question?.audioSegmentStart ?? 0;
  const effectiveEnd = segmentEnd ?? question?.audioSegmentEnd;

  if (!effectiveUrl) return null;

  return (
    <View style={[styles.container, mini && styles.miniContainer]}>
      {!mini && <Text style={styles.title}>{title}</Text>}
      <AudioPlayer 
        audioUrl={effectiveUrl}
        segmentStart={effectiveStart}
        segmentEnd={effectiveEnd}
        onPlaybackComplete={onPlaybackComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    width: '100%',
  },
  miniContainer: {
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
