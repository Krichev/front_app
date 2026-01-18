import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Video, {OnProgressData, VideoRef} from 'react-native-video';
import {QuestAudioResponse} from '../entities/ChallengeState/model/types';

interface QuestAudioPlayerProps {
  audioConfig: QuestAudioResponse;
  autoPlay?: boolean;
  onSegmentComplete?: () => void;
}

export const QuestAudioPlayer: React.FC<QuestAudioPlayerProps> = ({
  audioConfig,
  autoPlay = false,
  onSegmentComplete,
}) => {
  const videoRef = useRef<VideoRef>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(audioConfig.audioStartTime);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const startTime = audioConfig.audioStartTime || 0;
  const endTime = audioConfig.audioEndTime || audioConfig.totalDuration;
  const segmentDuration = endTime - startTime;

  useEffect(() => {
    // Seek to start time when component mounts
    if (videoRef.current) {
      videoRef.current.seek(startTime);
    }
  }, [startTime]);

  const handleProgress = (data: OnProgressData) => {
    const time = data.currentTime;
    setCurrentTime(time);

    // Check if we've reached or passed the end time
    if (endTime && time >= endTime && !hasReachedEnd) {
      setHasReachedEnd(true);
      handlePause();

      // Seek back to start for replay
      if (videoRef.current) {
        videoRef.current.seek(startTime);
        setCurrentTime(startTime);
      }

      // Notify parent that segment completed
      if (onSegmentComplete) {
        onSegmentComplete();
      }
    }
  };

  const handleLoad = () => {
    // Seek to start time after load
    if (videoRef.current) {
      videoRef.current.seek(startTime);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setHasReachedEnd(false);

    // If at the end, restart from beginning
    if (currentTime >= endTime) {
      if (videoRef.current) {
        videoRef.current.seek(startTime);
        setCurrentTime(startTime);
      }
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.seek(startTime);
      setCurrentTime(startTime);
      setHasReachedEnd(false);
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress within segment
  const progressInSegment = Math.max(
    0,
    Math.min(1, (currentTime - startTime) / segmentDuration)
  );
  const progressPercentage = Math.round(progressInSegment * 100);

  return (
    <View style={styles.container}>
      {/* Hidden video player (audio only) */}
      <Video
        ref={videoRef}
        source={{ uri: audioConfig.audioUrl }}
        audioOnly={true}
        paused={!isPlaying}
        onProgress={handleProgress}
        onLoad={handleLoad}
        onError={(error) => console.error('Audio playback error:', error)}
        progressUpdateInterval={100}
        style={{ height: 0, width: 0 }}
      />

      {/* Audio info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>🎵 Quest Audio Track</Text>
        <Text style={styles.subtitle}>
          Segment: {formatTime(startTime)} - {formatTime(endTime)}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progressPercentage}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {formatTime(currentTime - startTime)} / {formatTime(segmentDuration)}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleRestart}
        >
          <Text style={styles.controlButtonText}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.playButton]}
          onPress={handlePlayPause}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? '⏸' : '▶️'}
          </Text>
        </TouchableOpacity>

        <View style={styles.controlButton}>
          <Text style={styles.controlButtonText}>🔊</Text>
        </View>
      </View>

      {/* Minimum score requirement display */}
      {audioConfig.minimumScorePercentage > 0 && (
        <View style={styles.requirementContainer}>
          <Text style={styles.requirementText}>
            ⚠️ Minimum Score Required: {audioConfig.minimumScorePercentage}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
  },
  controlButtonText: {
    fontSize: 20,
  },
  playButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  requirementContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  requirementText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
});

export default QuestAudioPlayer;
