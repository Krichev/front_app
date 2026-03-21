import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking, PermissionsAndroid, Platform, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../../shared/ui/theme/createStyles';
import { triggerHaptic } from '../../lib/haptics';
import { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import { TaskProofFile } from '../../../../entities/LocationQuest/model/types';

interface CoinJingleTaskProps {
  onComplete: (proof: TaskProofFile) => void;
}

type TaskState = 'IDLE' | 'RECORDING' | 'REVIEW' | 'SUBMITTING' | 'PERMISSION_DENIED';

const CoinJingleTask: React.FC<CoinJingleTaskProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { theme, button } = useAppStyles();
  const styles = themeStyles;

  const [taskState, setTaskState] = useState<TaskState>('IDLE');
  const [countdown, setCountdown] = useState(3);
  const [recordedFile, setRecordedFile] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef<Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.release();
      }
    };
  }, []);

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: t('locationQuest.tasks.coinJingle.permissionDenied'),
          message: t('locationQuest.tasks.coinJingle.instructions'),
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const startRecording = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      setTaskState('PERMISSION_DENIED');
      return;
    }

    try {
      AudioRecord.init({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        wavFile: `coin_jingle_${Date.now()}.wav`,
      });

      setTaskState('RECORDING');
      setCountdown(3);
      triggerHaptic(HapticFeedbackTypes.impactLight);
      
      AudioRecord.start();

      // Pulse animation during recording
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Recording error:', error);
      setTaskState('IDLE');
    }
  };

  const stopRecording = async () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    
    const audioFile = await AudioRecord.stop();
    setRecordedFile(audioFile);
    setTaskState('REVIEW');
    triggerHaptic(HapticFeedbackTypes.impactLight);
  };

  const playRecording = () => {
    if (!recordedFile) return;

    if (soundRef.current) {
      soundRef.current.release();
    }

    setIsPlaying(true);
    soundRef.current = new Sound(recordedFile, '', (error) => {
      if (error) {
        console.error('Failed to load sound', error);
        setIsPlaying(false);
        return;
      }
      soundRef.current?.play((success) => {
        setIsPlaying(false);
        if (!success) {
          console.error('Playback failed');
        }
      });
    });
  };

  const handleSubmit = () => {
    if (!recordedFile) return;
    
    setTaskState('SUBMITTING');
    const proof: TaskProofFile = {
      uri: recordedFile,
      name: `coin_jingle_${Date.now()}.wav`,
      type: 'audio/wav',
    };
    onComplete(proof);
  };

  if (taskState === 'PERMISSION_DENIED') {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="microphone-off" size={64} color={theme.colors.error.main} />
        <Text style={styles.errorText}>{t('locationQuest.tasks.coinJingle.permissionDenied')}</Text>
        <TouchableOpacity style={button.primaryButton} onPress={() => Linking.openSettings()}>
          <Text style={button.primaryButtonText}>{t('locationQuest.tasks.coinJingle.openSettings')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('locationQuest.tasks.coinJingle.title')}</Text>
      
      {taskState === 'IDLE' && (
        <>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="microphone" size={80} color={theme.colors.primary.main} />
          </View>
          <Text style={styles.instructions}>{t('locationQuest.tasks.coinJingle.instructions')}</Text>
          <TouchableOpacity style={[button.primaryButton, styles.mainButton]} onPress={startRecording}>
            <Text style={button.primaryButtonText}>{t('locationQuest.tasks.coinJingle.startRecording')}</Text>
          </TouchableOpacity>
        </>
      )}

      {taskState === 'RECORDING' && (
        <View style={styles.recordingContainer}>
          <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </Animated.View>
          <Text style={styles.recordingText}>{t('locationQuest.tasks.coinJingle.recording')}</Text>
        </View>
      )}

      {taskState === 'REVIEW' && (
        <>
          <View style={styles.reviewActions}>
            <TouchableOpacity style={styles.playButton} onPress={playRecording} disabled={isPlaying}>
              {isPlaying ? (
                <ActivityIndicator color={theme.colors.primary.main} />
              ) : (
                <MaterialCommunityIcons name="play-circle" size={80} color={theme.colors.primary.main} />
              )}
              <Text style={styles.actionText}>{t('locationQuest.tasks.coinJingle.playback')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[button.secondaryButton, styles.halfButton]} 
              onPress={() => setTaskState('IDLE')}
            >
              <Text style={button.secondaryButtonText}>{t('locationQuest.tasks.coinJingle.reRecord')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[button.primaryButton, styles.halfButton]} 
              onPress={handleSubmit}
            >
              <Text style={button.primaryButtonText}>{t('locationQuest.tasks.coinJingle.submit')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {taskState === 'SUBMITTING' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>{t('locationQuest.tasks.common.submitting')}</Text>
        </View>
      )}
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  container: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    ...theme.typography.heading.h6,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    marginVertical: theme.spacing.xl,
  },
  instructions: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  mainButton: {
    width: '100%',
  },
  recordingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing['2xl'],
  },
  pulseCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.error.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.error.main,
  },
  recordingText: {
    ...theme.typography.body.large,
    color: theme.colors.error.main,
    fontWeight: 'bold',
  },
  reviewActions: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  playButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: theme.spacing.xs,
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  halfButton: {
    flex: 1,
  },
  loadingContainer: {
    marginVertical: theme.spacing['2xl'],
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
  errorText: {
    ...theme.typography.body.medium,
    color: theme.colors.error.main,
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
  },
}));

export default CoinJingleTask;
