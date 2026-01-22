import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAudioRecorder} from '../../../hooks/useAudioRecorder';

interface AudioResponseRecorderProps {
  onRecordingComplete: (audioFile: { uri: string; name: string; type: string }) => void;
  maxDuration?: number;
  disabled?: boolean;
}

export const AudioResponseRecorder: React.FC<AudioResponseRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 120, // Default 2 min
  disabled = false,
}) => {
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
            <MaterialCommunityIcons name="file-music" size={32} color="#4CAF50" />
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
                color="#007AFF" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.deleteButton]} 
              onPress={handleReset}
            >
              <MaterialCommunityIcons name="delete" size={24} color="#FF3B30" />
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Recorder Styles
  recorderContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  maxDurationText: {
    fontSize: 16,
    color: '#999',
    marginLeft: 4,
  },
  recordButtonWrapper: {
    marginBottom: 16,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  idle: {
    backgroundColor: '#FF3B30',
  },
  recording: {
    backgroundColor: '#D32F2F',
  },
  disabled: {
    backgroundColor: '#BDBDBD',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  // Preview Styles
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  playbackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoText: {
    justifyContent: 'center',
  },
  recordedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  durationText: {
    fontSize: 12,
    color: '#666',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  deleteButton: {
    borderColor: '#FFEBEE',
    backgroundColor: '#FFEBEE',
  },
  rerecordButton: {
    marginTop: 12,
    alignSelf: 'center',
    padding: 8,
  },
  rerecordText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
});
