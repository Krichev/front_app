import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { phaseStyles } from './phases.styles';
import { QuizQuestion } from '../../../../entities/QuizState/model/slice/quizApi';
import { 
  AudioChallengeHeader, 
  ReferenceAudioSection, 
  AudioResponseRecorder 
} from '../../../../screens/components/audio';
import { useAudioChallengeTimer } from '../../hooks/useAudioChallengeTimer';

export type AudioPhaseState = 'listening' | 'ready' | 'recording' | 'review';

interface AudioChallengePhaseProps {
  question: QuizQuestion;
  timeLimitSeconds: number;
  onRecordingComplete: (audioFile: { uri: string; name: string; type: string }) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  recordedAudio?: { uri: string; name: string; type: string } | null;
}

export const AudioChallengePhase: React.FC<AudioChallengePhaseProps> = ({
  question,
  timeLimitSeconds,
  onRecordingComplete,
  onSubmit,
  isSubmitting,
  recordedAudio,
}) => {
  const { t } = useTranslation();
  const { theme } = useAppStyles();
  const styles = phaseStyles(theme);
  const [phase, setPhase] = useState<AudioPhaseState>('listening');
  const [hasListenedOnce, setHasListenedOnce] = useState(false);

  const timer = useAudioChallengeTimer({
    duration: timeLimitSeconds,
    onAutoSubmit: onSubmit,
  });

  const handleStartRecordingPhase = useCallback(() => {
    setPhase('recording');
    timer.start();
  }, [timer]);

  const handleRecordingDone = useCallback((audioFile: { uri: string; name: string; type: string }) => {
    onRecordingComplete(audioFile);
    setPhase('review');
  }, [onRecordingComplete]);

  const handleReRecord = useCallback(() => {
    setPhase('recording');
  }, []);

  const handlePlaybackComplete = useCallback(() => {
    setHasListenedOnce(true);
  }, []);

  // Sync phase with recordedAudio prop if it changes externally
  useEffect(() => {
    if (recordedAudio && phase === 'recording') {
      setPhase('review');
    }
  }, [recordedAudio, phase]);

  return (
    <View style={styles.container}>
      {/* Timer Bar - Only visible after listening phase */}
      {phase !== 'listening' && phase !== 'ready' && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {t('audioChallenge.timeRemaining', { seconds: timer.timeLeft })}
          </Text>
          <View style={styles.timerBar}>
            <Animated.View
              style={[
                styles.timerProgress,
                {
                  backgroundColor: timer.timeLeft < 10 ? theme.colors.error.main : theme.colors.success.main,
                  width: timer.animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
      )}

      <AudioChallengeHeader 
        challengeType={question.audioChallengeType} 
        minimumScorePercentage={question.minimumScorePercentage}
        instructions={question.question}
      />

      <View style={localStyles.content}>
        <Text style={[styles.text, localStyles.questionText]}>{question.question}</Text>

        {phase === 'listening' && (
          <View style={localStyles.phaseContainer}>
            <Text style={localStyles.instructionText}>
              {t('audioChallenge.listenFirst')}
            </Text>
            <ReferenceAudioSection 
              question={question} 
              onPlaybackComplete={handlePlaybackComplete}
            />
            <Text style={localStyles.hintText}>
              {t('audioChallenge.timerStartsAfterListen')}
            </Text>
            
            <TouchableOpacity
              style={[
                styles.button, 
                !hasListenedOnce && styles.disabledButton,
                localStyles.readyButton
              ]}
              onPress={() => setPhase('ready')}
              disabled={!hasListenedOnce}
            >
              <MaterialCommunityIcons name="microphone" size={24} color={theme.colors.text.inverse} />
              <Text style={styles.buttonText}>{t('audioChallenge.readyToRecord')}</Text>
            </TouchableOpacity>
            
            {!hasListenedOnce && (
              <Text style={localStyles.errorTextSmall}>
                {t('audioChallenge.listenAtLeastOnce')}
              </Text>
            )}
          </View>
        )}

        {phase === 'ready' && (
           <View style={localStyles.phaseContainer}>
             <Text style={localStyles.instructionText}>
               Prepare yourself! The timer will start when you begin recording.
             </Text>
             <TouchableOpacity
               style={[styles.button, localStyles.largeButton]}
               onPress={handleStartRecordingPhase}
             >
               <Text style={styles.buttonText}>START RECORDING PHASE</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => setPhase('listening')}
               style={{ marginTop: theme.spacing.md }}
             >
               <Text style={{ color: theme.colors.primary.main }}>Back to Listening</Text>
             </TouchableOpacity>
           </View>
        )}

        {(phase === 'recording' || phase === 'review') && (
          <View style={localStyles.phaseContainer}>
             {phase === 'recording' ? (
               <Text style={localStyles.instructionText}>{t('audioChallenge.recording')}</Text>
             ) : (
               <Text style={localStyles.instructionText}>{t('audioChallenge.reviewRecording')}</Text>
             )}

             <AudioResponseRecorder
               onRecordingComplete={handleRecordingDone}
               disabled={isSubmitting || !timer.isRunning && phase === 'recording' && timer.timeLeft === 0}
               maxDuration={timer.timeLeft}
             />

             {phase === 'review' && (
               <View style={localStyles.reviewActions}>
                 <TouchableOpacity
                   style={[styles.button, localStyles.reRecordButton]}
                   onPress={handleReRecord}
                   disabled={isSubmitting}
                 >
                   <MaterialCommunityIcons name="refresh" size={20} color={theme.colors.primary.main} />
                   <Text style={[styles.buttonText, { color: theme.colors.primary.main }]}>
                     {t('audioChallenge.reRecord')}
                   </Text>
                 </TouchableOpacity>

                 <TouchableOpacity
                   style={[styles.button, localStyles.submitButton]}
                   onPress={onSubmit}
                   disabled={isSubmitting || !recordedAudio}
                 >
                   <Text style={styles.buttonText}>
                     {isSubmitting ? 'Uploading...' : t('audioChallenge.submitRecording')}
                   </Text>
                 </TouchableOpacity>
               </View>
             )}

             <View style={localStyles.miniReference}>
                <ReferenceAudioSection question={question} mini />
             </View>
          </View>
        )}
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  phaseContainer: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
  readyButton: {
    marginTop: 30,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 30,
  },
  largeButton: {
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  errorTextSmall: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
    width: '100%',
  },
  reRecordButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
    flexDirection: 'row',
    gap: 5,
  },
  submitButton: {
    flex: 2,
  },
  miniReference: {
    marginTop: 'auto',
    width: '100%',
    paddingTop: 20,
  }
});
