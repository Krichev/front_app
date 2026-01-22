import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecord from 'react-native-audio-record';
import { AudioPlayer } from './AudioPlayer';

/**
 * @deprecated Use AudioResponseRecorder from ./audio/ instead
 */
interface AudioRecorderProps {
  onRecordingComplete: (audioFile: { uri: string; name: string; type: string }) => void;
  maxDuration?: number; // seconds
  disabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 120, // Default 2 minutes max
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedFile, setRecordedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkPermission();
    return () => {
      stopRecording();
    };
  }, []);

  const checkPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'App needs access to your microphone to record audio.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setPermissionGranted(true);
          initRecorder();
        } else {
          console.log('Camera permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
        setPermissionGranted(true);
        initRecorder();
    }
  };

  const initRecorder = () => {
    const options = {
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      wavFile: 'test.wav',
    };
    AudioRecord.init(options);
  };

  const startRecording = async () => {
    if (!permissionGranted) {
        await checkPermission();
        return;
    }

    try {
        setRecordedFile(null); // Clear previous recording
        setDuration(0);
        
        AudioRecord.start();
        setIsRecording(true);
        
        timerRef.current = setInterval(() => {
            setDuration(prev => {
                if (prev >= maxDuration) {
                    stopRecording();
                    return prev;
                }
                return prev + 1;
            });
        }, 1000);
    } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
        const filePath = await AudioRecord.stop();
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsRecording(false);
        
        const file = {
            uri: `file://${filePath}`,
            name: 'recording.wav',
            type: 'audio/wav',
        };
        
        setRecordedFile(file);
        onRecordingComplete(file);
        
    } catch (error) {
        console.error(error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.recorderControls}>
        <TouchableOpacity
          style={[
            styles.recordButton, 
            isRecording && styles.recordingActive,
            disabled && styles.disabledButton
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={disabled}
        >
          <MaterialCommunityIcons
            name={isRecording ? 'stop' : 'microphone'}
            size={32}
            color="#fff"
          />
        </TouchableOpacity>
        
        <Text style={styles.durationText}>
            {isRecording ? 'Recording...' : 'Tap to Record'} {formatTime(duration)}
        </Text>
      </View>

      {recordedFile && !isRecording && (
        <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Review Recording:</Text>
            <AudioPlayer audioUrl={recordedFile.uri} />
            <TouchableOpacity onPress={startRecording} style={styles.rerecordButton}>
                <Text style={styles.rerecordText}>Record Again</Text>
            </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  recorderControls: {
    alignItems: 'center',
    marginBottom: 16,
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  recordingActive: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  durationText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  previewContainer: {
    width: '100%',
    marginTop: 16,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  rerecordButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
  rerecordText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
});
