// src/screens/components/AudioPlayer.tsx
import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Video, {OnProgressData, VideoRef} from 'react-native-video';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface AudioPlayerProps {
  audioUrl: string;
  segmentStart?: number;
  segmentEnd?: number;
  onPlaybackComplete?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  segmentStart = 0,
  segmentEnd,
  onPlaybackComplete,
}) => {
  const videoRef = useRef<VideoRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(segmentStart);
  const [duration, setDuration] = useState(0);

  const effectiveEnd = segmentEnd || duration;
  const progress = Math.max(0, Math.min(1, (currentTime - segmentStart) / (effectiveEnd - segmentStart || 1)));

  useEffect(() => {
    // Seek to start time initially
    if (videoRef.current) {
        videoRef.current.seek(segmentStart);
    }
  }, [segmentStart]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime);
    
    // Handle segment looping or stopping
    if (segmentEnd && data.currentTime >= segmentEnd) {
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.seek(segmentStart);
        setCurrentTime(segmentStart);
      }
      if (onPlaybackComplete) {
        onPlaybackComplete();
      }
    }
  };

  const handleLoad = (data: any) => {
    setDuration(data.duration);
    if (videoRef.current) {
        videoRef.current.seek(segmentStart);
    }
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

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.container}>
      {/* Hidden Video component for audio playback */}
      <Video
        ref={videoRef}
        source={{ uri: audioUrl }}
        paused={!isPlaying}
        onProgress={handleProgress}
        onLoad={handleLoad}
        onEnd={handleEnd}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        style={{ height: 0, width: 0 }}
      />

      <View style={styles.controls}>
        <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
          <MaterialCommunityIcons
            name={isPlaying ? 'pause' : 'play'}
            size={32}
            color="#4CAF50"
          />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime - segmentStart)}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.timeText}>{formatTime(effectiveEnd - segmentStart)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    marginRight: 12,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    width: 35,
    textAlign: 'center',
  },
});
