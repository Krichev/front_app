import React, {useEffect, useRef, useState, useCallback} from 'react';
import {StyleSheet, Text, TouchableOpacity, View, ActivityIndicator} from 'react-native';
import Video, {OnProgressData, VideoRef} from 'react-native-video';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import MediaUrlService from '../../services/media/MediaUrlService';

interface AudioPlayerProps {
  audioUrl: string;
  segmentStart?: number;
  segmentEnd?: number;
  onPlaybackComplete?: () => void;
  onLoad?: (data: any) => void;
  onError?: (error: any) => void;
  style?: any;
  activeColor?: string;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  segmentStart = 0,
  segmentEnd,
  onPlaybackComplete,
  onLoad,
  onError,
  style,
  activeColor = '#4CAF50',
  autoPlay = false,
}) => {
  const videoRef = useRef<VideoRef>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(segmentStart);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const mediaService = MediaUrlService.getInstance();
  const { t } = useTranslation();

  const effectiveEnd = segmentEnd || duration;

  useEffect(() => {
    if (__DEV__ && audioUrl) {
      if (audioUrl.includes('localhost') || audioUrl.includes(':8082')) {
        console.error(
          '🚨 [AudioPlayer] Suspect URL detected — this may have come from an unsanitized backend DTO:',
          audioUrl.substring(0, 100)
        );
      }
    }
  }, [audioUrl]);

  useEffect(() => {
    // Seek to start time initially
    if (videoRef.current && !isSeeking) {
        videoRef.current.seek(segmentStart);
        setCurrentTime(segmentStart);
    }
  }, [segmentStart, isSeeking]);

  const handlePlayPause = useCallback(() => {
    if (!isPlaying && !isLoaded) {
      // First play — media may need to buffer
      setIsLoading(true);
    }
    // If we're at the end of the segment, restart from the beginning when playing
    if (!isPlaying && segmentEnd && currentTime >= segmentEnd - 0.1) {
        videoRef.current?.seek(segmentStart);
        setCurrentTime(segmentStart);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, isLoaded, segmentEnd, currentTime, segmentStart]);

  const handleProgress = useCallback((data: OnProgressData) => {
    if (!isSeeking) {
        setCurrentTime(data.currentTime);
        
        // Handle segment stopping
        if (segmentEnd && data.currentTime >= segmentEnd) {
          setIsPlaying(false);
          videoRef.current?.seek(segmentStart);
          setCurrentTime(segmentStart);
          
          if (onPlaybackComplete) {
            onPlaybackComplete();
          }
        }
    }
  }, [isSeeking, segmentEnd, segmentStart, onPlaybackComplete]);

  const handleLoad = (data: any) => {
    setDuration(data.duration);
    setIsLoading(false);
    setIsLoaded(true);
    setHasError(false);
    if (videoRef.current) {
        videoRef.current.seek(segmentStart);
        setCurrentTime(segmentStart);
    }
    onLoad?.(data);
  };

  const handleError = (error: any) => {
    console.error('🎵 [AudioPlayer] Playback error:', 
      error?.error?.errorString || 'Unknown', 'URL:', audioUrl);
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  };

  const handleEnd = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.seek(segmentStart);
      setCurrentTime(segmentStart);
    }
    if (onPlaybackComplete) {
      onPlaybackComplete();
    }
  };

  const handleSlidingStart = useCallback(() => {
    setIsSeeking(true);
  }, []);

  const handleSlidingComplete = useCallback((value: number) => {
    setIsSeeking(false);
    videoRef.current?.seek(value);
    setCurrentTime(value);
  }, []);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(Math.max(0, timeInSeconds) / 60);
    const seconds = Math.floor(Math.max(0, timeInSeconds) % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Hidden Video component for audio playback */}
      <Video
        ref={videoRef}
        source={{ 
            uri: audioUrl,
            headers: mediaService.getAuthHeaders(),
        }}
        paused={!isPlaying}
        onProgress={handleProgress}
        onLoad={handleLoad}
        onEnd={handleEnd}
        onError={handleError}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        style={{ height: 0, width: 0 }}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={activeColor} />
          <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
        </View>
      )}

      {hasError && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="music-off" size={24} color="#F44336" />
          <Text style={styles.errorText}>Failed to load audio</Text>
          <TouchableOpacity onPress={() => { setHasError(false); setIsLoading(true); }}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity 
            onPress={handlePlayPause} 
            style={styles.playButton}
            activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={activeColor} />
          ) : (
            <MaterialCommunityIcons
                name={isPlaying ? 'pause-circle' : 'play-circle'}
                size={42}
                color={activeColor}
            />
          )}
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <View style={{flex: 1}} />
            <Text style={styles.timeText}>{formatTime(effectiveEnd)}</Text>
          </View>
          
          <Slider
            style={styles.slider}
            minimumValue={segmentStart}
            maximumValue={effectiveEnd || 1}
            value={currentTime}
            onSlidingStart={handleSlidingStart}
            onSlidingComplete={handleSlidingComplete}
            onValueChange={(val) => isSeeking && setCurrentTime(val)}
            minimumTrackTintColor={activeColor}
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor={activeColor}
            disabled={isLoading}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    backgroundColor: '#FFF0F0',
    padding: 8,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    flex: 1,
  },
  retryText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    marginBottom: -4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeText: {
    fontSize: 11,
    color: '#666',
    fontVariant: ['tabular-nums'],
  },
});

