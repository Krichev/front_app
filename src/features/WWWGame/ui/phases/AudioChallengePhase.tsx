import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../../shared/ui/theme';
import { phaseStyles } from './phases.styles';
import { QuizQuestion } from '../../../../entities/QuizState/model/slice/quizApi';
import { 
  AudioChallengeHeader, 
  ReferenceAudioSection, 
  AudioResponseRecorder 
} from '../../../../screens/components/audio';
import { useAudioChallengeTimer } from '../../hooks/useAudioChallengeTimer';
import { AudioChallengeType } from '../../../../types/audioChallenge.types';
import NetworkConfigManager from '../../../../config/NetworkConfig';

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
  const localStyles = themeStyles;
  
  const [phase, setPhase] = useState<AudioPhaseState>('listening');
  const [hasListenedOnce, setHasListenedOnce] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isBackingTrackPlaying, setIsBackingTrackPlaying] = useState(false);
  
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backingTrackRef = useRef<VideoRef>(null);

  const isSinging = question.audioChallengeType === AudioChallengeType.SINGING || 
                    (question.audioChallengeType as string) === 'SINGING';

  const backingTrackUrl = useMemo(() => {
    if (question.questionMediaUrl) return question.questionMediaUrl;
    const API_BASE_URL = NetworkConfigManager.getInstance().getBaseUrl();
    if (question.audioReferenceMediaId) {
       // Using same pattern as ReferenceAudioSection
       return `${API_BASE_URL}/media/stream/${question.audioReferenceMediaId}`;
    }
    if (question.questionMediaId) {
       return `${API_BASE_URL}/media/stream/${question.questionMediaId}`;
    }
    if (question.id) {
       return `${API_BASE_URL}/media/question/${question.id}/stream`;
    }
    return null;
  }, [question]);

  const timer = useAudioChallengeTimer({
    duration: timeLimitSeconds,
    onAutoSubmit: onSubmit,
  });

  const stopBackingTrack = useCallback(() => {
    setIsBackingTrackPlaying(false);
  }, []);

  const handleStartRecordingPhase = useCallback(() => {
    setCountdownValue(3);
    
    let count = 3;
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setCountdownValue(null);
        setPhase('recording');
        timer.start();
        
        if (isSinging && backingTrackUrl) {
          setIsBackingTrackPlaying(true);
        }
      } else {
        setCountdownValue(count);
      }
    }, 1000);
  }, [timer, isSinging, backingTrackUrl]);

  const handleRecordingDone = useCallback((audioFile: { uri: string; name: string; type: string }) => {
    onRecordingComplete(audioFile);
    setPhase('review');
    stopBackingTrack();
  }, [onRecordingComplete, stopBackingTrack]);

  const handleReRecord = useCallback(() => {
    handleStartRecordingPhase();
  }, [handleStartRecordingPhase]);

  const handlePlaybackComplete = useCallback(() => {
    setHasListenedOnce(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Sync phase with recordedAudio prop if it changes externally
  useEffect(() => {
    if (recordedAudio && phase === 'recording') {
      setPhase('review');
      stopBackingTrack();
    }
  }, [recordedAudio, phase, stopBackingTrack]);

  return (
    <View style={styles.container}>
      {/* Timer Bar - Only visible after listening phase */}
      {phase !== 'listening' && phase !== 'ready' && countdownValue === null && (
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

      {countdownValue === null && (
        <AudioChallengeHeader 
          challengeType={question.audioChallengeType} 
          minimumScorePercentage={question.minimumScorePercentage}
          instructions={question.question}
        />
      )}

      <View style={localStyles.content}>
        {countdownValue === null && (
          <Text style={[styles.text, localStyles.questionText]}>{question.question}</Text>
        )}

        {phase === 'listening' && countdownValue === null && (
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
                localStyles.roundRecordButton, 
                { backgroundColor: theme.colors.primary.main },
                !hasListenedOnce && localStyles.disabledButton
              ]}
              onPress={() => setPhase('ready')}
              disabled={!hasListenedOnce}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="microphone" size={48} color={theme.colors.text.inverse} />
              <Text style={[localStyles.roundButtonLabel, { color: theme.colors.text.inverse }]}>
                {t('audioChallenge.readyToRecord')}
              </Text>
            </TouchableOpacity>
            
            {!hasListenedOnce && (
              <Text style={localStyles.errorTextSmall}>
                {t('audioChallenge.listenAtLeastOnce')}
              </Text>
            )}
          </View>
        )}

        {phase === 'ready' && countdownValue === null && (
           <View style={localStyles.phaseContainer}>
             <Text style={localStyles.instructionText}>
               {t('audioChallenge.prepareYourself')}
             </Text>
             
             <TouchableOpacity
               style={[
                 localStyles.roundRecordButton,
                 { backgroundColor: theme.colors.primary.main }
               ]}
               onPress={handleStartRecordingPhase}
               activeOpacity={0.8}
             >
               <MaterialCommunityIcons 
                 name="microphone" 
                 size={48} 
                 color={theme.colors.text.inverse} 
               />
               <Text style={[localStyles.roundButtonLabel, { color: theme.colors.text.inverse }]}>
                 {t('audioChallenge.tapToRecord')}
               </Text>
             </TouchableOpacity>

             <TouchableOpacity 
               onPress={() => setPhase('listening')}
               style={{ marginTop: theme.spacing.md }}
             >
               <Text style={{ color: theme.colors.primary.main }}>{t('audioChallenge.backToListening')}</Text>
             </TouchableOpacity>
           </View>
        )}

        {countdownValue !== null && (
          <View style={localStyles.countdownContainer}>
            <Text style={[localStyles.countdownNumber, { color: theme.colors.primary.main }]}>
              {countdownValue}
            </Text>
            <Text style={[localStyles.countdownLabel, { color: theme.colors.text.secondary }]}>
              {t('audioChallenge.countdown.getReady')}
            </Text>
          </View>
        )}

        {(phase === 'recording' || phase === 'review') && countdownValue === null && (
          <View style={localStyles.phaseContainer}>
             {phase === 'recording' ? (
               <View style={{ alignItems: 'center' }}>
                 {isSinging && isBackingTrackPlaying && (
                    <View style={localStyles.backingTrackIndicator}>
                      <MaterialCommunityIcons name="music-note" size={16} color={theme.colors.success.main} />
                      <Text style={[localStyles.backingTrackText, { color: theme.colors.success.main }]}>
                        {t('audioChallenge.karaoke.backingTrackPlaying')}
                      </Text>
                    </View>
                  )}
                 <Text style={localStyles.instructionText}>{t('audioChallenge.recording')}</Text>
               </View>
             ) : (
               <Text style={localStyles.instructionText}>{t('audioChallenge.reviewRecording')}</Text>
             )}

             <AudioResponseRecorder
               onRecordingComplete={handleRecordingDone}
               onStop={stopBackingTrack}
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

             {!isSinging && (
               <View style={localStyles.miniReference}>
                  <ReferenceAudioSection question={question} mini />
               </View>
             )}

             {isSinging && backingTrackUrl && (
                <Video
                  ref={backingTrackRef}
                  source={{ uri: backingTrackUrl }}
                  paused={!isBackingTrackPlaying}
                  onEnd={() => {
                    stopBackingTrack();
                  }}
                  onError={(e) => console.error('Backing track error:', e)}
                  style={{ height: 0, width: 0 }}
                />
              )}
          </View>
        )}
      </View>
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: theme.colors.text.primary,
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
    color: theme.colors.text.secondary,
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.text.disabled,
    marginTop: 10,
    fontStyle: 'italic',
  },
  roundRecordButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginVertical: 30,
  },
  roundButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 96,
    fontWeight: '900',
  },
  countdownLabel: {
    fontSize: 20,
    marginTop: 12,
  },
  backingTrackIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    marginBottom: 12,
    alignSelf: 'center',
  },
  backingTrackText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorTextSmall: {
    color: theme.colors.error.main,
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
    borderColor: theme.colors.primary.main,
    flexDirection: 'row',
    gap: 5,
  },
  submitButton: {
    flex: 2,
    backgroundColor: theme.colors.primary.main,
  },
  miniReference: {
    marginTop: 'auto',
    width: '100%',
    paddingTop: 20,
  }
}));

