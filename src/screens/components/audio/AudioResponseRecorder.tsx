import React, {useEffect, useRef} from 'react';
import {Animated, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAudioRecorder} from '../../../hooks/useAudioRecorder';
import { createStyles, useAppStyles } from '../../../shared/ui/theme';

interface AudioResponseRecorderProps {
  onRecordingComplete: (audioFile: { uri: string; name: string; type: string }) => void;
  onStop?: () => void;
  maxDuration?: number;
  disabled?: boolean;
}

export const AudioResponseRecorder: React.FC<AudioResponseRecorderProps> = ({
  onRecordingComplete,
  onStop,
  maxDuration = 120, // Default 2 min
  disabled = false,
}) => {
  const { theme } = useAppStyles();
  const styles = useStyles();
  const {
    startRecording,
    stopRecording,
    isRecording,
    duration,
    audioPath,
    playAudio,
    stopPlayback,
    isPlaying,
    resetRecording,
    hasPermission,
    initializeRecorder,
  } = useAudioRecorder();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeRecorder();
  }, [initializeRecorder]);

  // Pulse animation effect
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
    }
  }, [isRecording, pulseAnim]);

  // Auto-stop if max duration reached
  useEffect(() => {
    if (isRecording && duration >= maxDuration) {
      handleStopRecording();
    }
  }, [isRecording, duration, maxDuration]);

  const handleStopRecording = async () => {
    onStop?.();
    const path = await stopRecording();
    if (path) {
      const file = {
        uri: `file://${path}`, // Ensure URI scheme
        name: `response_${Date.now()}.wav`,
        type: 'audio/wav',
      };
      onRecordingComplete(file);
    }
  };

  const handleReset = () => {
    resetRecording();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioPath && !isRecording) {
    // PREVIEW MODE
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Your Recording</Text>
        <View style={styles.previewContainer}>
          <View style={styles.playbackInfo}>
            <MaterialCommunityIcons name="file-music" size={32} color={theme.colors.success.main} />
            <View style={styles.infoText}>
              <Text style={styles.recordedLabel}>Recorded Response</Text>
              <Text style={styles.durationText}>{formatDuration(duration)}</Text>
            </View>
          </View>
          
          <View style={styles.controlsRow}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={isPlaying ? stopPlayback : playAudio}
            >
              <MaterialCommunityIcons 
                name={isPlaying ? "stop" : "play"} 
                size={28} 
                color={theme.colors.primary.main} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.deleteButton]} 
              onPress={handleReset}
            >
              <MaterialCommunityIcons name="delete" size={24} color={theme.colors.error.main} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.rerecordButton} onPress={handleReset}>
          <Text style={styles.rerecordText}>Record Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // RECORDING MODE
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Your Response</Text>
      
      <View style={styles.recorderContainer}>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatDuration(duration)}</Text>
          <Text style={styles.maxDurationText}>/ {formatDuration(maxDuration)}</Text>
        </View>
        
        <TouchableOpacity
          onPress={isRecording ? handleStopRecording : startRecording}
          disabled={disabled || !hasPermission}
          style={styles.recordButtonWrapper}
        >
          <Animated.View style={[
            styles.recordButton, 
            isRecording ? styles.recording : styles.idle,
            disabled && styles.disabled,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <MaterialCommunityIcons 
              name={isRecording ? "stop" : "microphone"} 
              size={36} 
              color="white" 
            />
          </Animated.View>
        </TouchableOpacity>
        
        <Text style={styles.statusText}>
          {!hasPermission 
            ? 'Permission Required' 
            : isRecording 
              ? 'Recording...' 
              : 'Tap to Record'}
        </Text>
      </View>
    </View>
  );
};

const useStyles = createStyles(theme => ({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.md,
    elevation: 2,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.caption,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Recorder Styles
  recorderContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.lg,
  },
  timerText: {
    fontSize: theme.typography.fontSize.h3,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  maxDurationText: {
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.text.disabled,
    marginLeft: 4,
  },
  recordButtonWrapper: {
    marginBottom: theme.spacing.md,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  idle: {
    backgroundColor: theme.colors.error.main,
  },
  recording: {
    backgroundColor: theme.colors.error.dark,
  },
  disabled: {
    backgroundColor: theme.colors.text.disabled,
  },
  statusText: {
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  // Preview Styles
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  playbackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  infoText: {
    justifyContent: 'center',
  },
  recordedLabel: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  durationText: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.text.secondary,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  deleteButton: {
    borderColor: theme.colors.error.light,
    backgroundColor: theme.colors.error.background,
  },
  rerecordButton: {
    marginTop: theme.spacing.sm,
    alignSelf: 'center',
    padding: theme.spacing.sm,
  },
  rerecordText: {
    color: theme.colors.primary.main,
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.semibold,
  },
}));
