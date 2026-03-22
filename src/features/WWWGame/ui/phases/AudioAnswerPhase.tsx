import React, {useCallback, useEffect, useMemo, useState, useRef} from 'react';
import {ActivityIndicator, Animated, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {useAppStyles} from '../../../../shared/ui/hooks/useAppStyles';
import {phaseStyles} from './phases.styles';
import {QuizQuestion} from '../../../../entities/QuizState/model/slice/quizApi';
import {useAudioChallengeTimer} from '../../hooks/useAudioChallengeTimer';
import {AudioResponseRecorder, ReferenceAudioSection} from '../../../../screens/components/audio';
import {createStyles} from '../../../../shared/ui/theme';
import { AudioChallengeType } from '../../../../types/audioChallenge.types';
import NetworkConfigManager from '../../../../config/NetworkConfig';

interface AudioAnswerPhaseProps {
  question: QuizQuestion;
  answer: string;                    // current text answer (for text mode)
  onAnswerChange: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  gameSettings?: any;                // contains roundTimeSeconds, players, etc.
  answerMode?: 'text' | 'record';   // defaults to 'text' unless question has audioChallengeType
  onAudioRecordingComplete?: (audioFile: { uri: string; name: string; type: string }) => void;
  recordedAudio?: { uri: string; name: string; type: string } | null;
  player?: string;                   // selected player name (for team mode)
  onPlayerChange?: (player: string) => void;
}

export const AudioAnswerPhase: React.FC<AudioAnswerPhaseProps> = ({
  question,
  answer,
  onAnswerChange,
  onSubmit,
  isSubmitting,
  gameSettings,
  answerMode: propAnswerMode = 'text',
  onAudioRecordingComplete,
  recordedAudio,
  player,
  onPlayerChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useAppStyles();
  const styles = phaseStyles(theme);
  const localStyles = themeStyles;

  // Determine answer mode: question config takes precedence
  const answerMode = question.audioChallengeType ? 'record' : propAnswerMode;

  const [replaysUsed, setReplaysUsed] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [hasPlayedAtLeastOnce, setHasPlayedAtLeastOnce] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isRecordingStarted, setIsRecordingStarted] = useState(false);
  const [isBackingTrackPlaying, setIsBackingTrackPlaying] = useState(false);
  
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backingTrackRef = useRef<VideoRef>(null);

  const isSinging = question.audioChallengeType === AudioChallengeType.SINGING || 
                    (question.audioChallengeType as string) === 'SINGING';

  const backingTrackUrl = useMemo(() => {
    if (question.questionMediaUrl) return question.questionMediaUrl;
    const API_BASE_URL = NetworkConfigManager.getInstance().getBaseUrl();
    if (question.audioReferenceMediaId) {
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

  const duration = question.timeLimitSeconds || gameSettings?.roundTimeSeconds || 60;

  const timer = useAudioChallengeTimer({
    duration,
    onAutoSubmit: onSubmit,
  });

  // Replay settings
  const allowReplay = question.allowReplay ?? true;
  const maxReplaysAllowed = question.maxReplays ?? 3;

  // Start timer on mount
  useEffect(() => {
    timer.start();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const handleAudioEnd = useCallback(() => {
    if (!hasPlayedAtLeastOnce) {
        setHasPlayedAtLeastOnce(true);
    }
  }, [hasPlayedAtLeastOnce]);

  const canReplay = useMemo(() => {
      return allowReplay && (maxReplaysAllowed === 0 || replaysUsed < maxReplaysAllowed);
  }, [allowReplay, maxReplaysAllowed, replaysUsed]);

  const handleReplay = useCallback(() => {
      if (canReplay) {
          setReplaysUsed(prev => prev + 1);
          setReplayKey(prev => prev + 1);
      }
  }, [canReplay]);

  const handleStartRecording = useCallback(() => {
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
        setIsRecordingStarted(true);
        
        if (isSinging && backingTrackUrl) {
          setIsBackingTrackPlaying(true);
        }
      } else {
        setCountdownValue(count);
      }
    }, 1000);
  }, [isSinging, backingTrackUrl]);

  const stopBackingTrack = useCallback(() => {
    setIsBackingTrackPlaying(false);
  }, []);

  const handleRecordingDone = useCallback((audioFile: any) => {
    onAudioRecordingComplete?.(audioFile);
    stopBackingTrack();
  }, [onAudioRecordingComplete, stopBackingTrack]);

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) return true;
    if (timer.timeLeft === 0) return true;
    if (answerMode === 'text') {
      return !answer.trim();
    } else {
      return !recordedAudio;
    }
  }, [isSubmitting, timer.timeLeft, answerMode, answer, recordedAudio]);

  const hasAudio = question.questionType === 'AUDIO' || !!(question?.questionMediaUrl || question?.audioReferenceMediaId || question?.questionMediaId);

  return (
    <View style={styles.container}>
      {/* Timer Bar */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          {t('wwwPhases.audioAnswer.timeRemaining', { seconds: timer.timeLeft })}
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

      <View style={localStyles.content}>
        <Text style={styles.title}>{t('wwwPhases.audioAnswer.title')}</Text>
        <Text style={[styles.text, localStyles.questionText]}>{question.question}</Text>

        {/* Audio Player Section */}
        {countdownValue === null && (
          <View style={localStyles.audioSection}>
            {hasAudio ? (
              <View>
                <ReferenceAudioSection 
                  key={replayKey}
                  question={question as any} 
                  onPlaybackComplete={handleAudioEnd}
                  title={t('wwwPhases.audioAnswer.listenToQuestion')}
                />
                
                {hasPlayedAtLeastOnce && !isRecordingStarted && !recordedAudio && (
                    <View style={localStyles.replayContainer}>
                        {canReplay ? (
                            <TouchableOpacity 
                              style={localStyles.replayButton}
                              onPress={handleReplay}
                            >
                              <MaterialCommunityIcons name="replay" size={24} color={theme.colors.text.inverse} />
                              <Text style={localStyles.replayButtonText}>
                                  {t('wwwPhases.audioAnswer.listenAgain')}
                              </Text>
                              <View style={localStyles.replayBadge}>
                                  <Text style={localStyles.replayBadgeText}>
                                      {maxReplaysAllowed === 0 
                                          ? t('wwwPhases.audioAnswer.unlimitedReplays')
                                          : t('wwwPhases.audioAnswer.replaysRemaining', { count: maxReplaysAllowed - replaysUsed })}
                                  </Text>
                              </View>
                            </TouchableOpacity>
                        ) : (
                            <View style={localStyles.noReplaysContainer}>
                                <MaterialCommunityIcons name="timer-off-outline" size={20} color={theme.colors.text.disabled} />
                                <Text style={localStyles.noReplaysText}>
                                    {t('wwwPhases.audioAnswer.noReplaysLeft')}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
              </View>
            ) : (
              <View style={localStyles.fallbackContainer}>
                <MaterialCommunityIcons 
                  name="music-off" 
                  size={32} 
                  color={theme.colors.text.disabled} 
                />
                <Text style={localStyles.fallbackText}>
                  {t('wwwPhases.audioAnswer.audioNotAvailable')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Countdown Area */}
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

        {/* Answer Area */}
        {countdownValue === null && (
          <View style={localStyles.answerArea}>
            {answerMode === 'text' ? (
              <View>
                {gameSettings?.players && gameSettings.players.length > 0 && (
                  <View style={localStyles.playerSelector}>
                    <Text style={styles.label}>{t('wwwPhases.answer.whoIsAnswering')}</Text>
                    <View style={localStyles.playersList}>
                      {gameSettings.players.map((p: string) => (
                        <TouchableOpacity
                          key={p}
                          style={[
                            localStyles.playerChip,
                            player === p && { backgroundColor: theme.colors.success.main }
                          ]}
                          onPress={() => onPlayerChange?.(p)}
                        >
                          <Text style={[
                            localStyles.playerChipText,
                            player === p && { color: theme.colors.text.inverse, fontWeight: 'bold' }
                          ]}>
                            {p}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                <Text style={styles.label}>{t('wwwPhases.answer.teamAnswer')}</Text>
                <TextInput
                  style={styles.input}
                  value={answer}
                  onChangeText={onAnswerChange}
                  placeholder={t('wwwPhases.audioAnswer.answerPlaceholder')}
                  multiline
                  placeholderTextColor={theme.colors.text.disabled}
                  editable={!isSubmitting}
                />
              </View>
            ) : (
              <View style={localStyles.recordContainer}>
                {!isRecordingStarted && !recordedAudio ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={localStyles.recordTitle}>
                      {t('wwwPhases.audioAnswer.recordYourAnswer')}
                    </Text>
                    <TouchableOpacity
                      style={[
                        localStyles.roundRecordButton,
                        { backgroundColor: theme.colors.primary.main }
                      ]}
                      onPress={handleStartRecording}
                      activeOpacity={0.8}
                      disabled={isSubmitting}
                    >
                      <MaterialCommunityIcons name="microphone" size={48} color={theme.colors.text.inverse} />
                      <Text style={[localStyles.roundButtonLabel, { color: theme.colors.text.inverse }]}>
                        {t('audioChallenge.tapToRecord')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ width: '100%', alignItems: 'center' }}>
                    {isRecordingStarted && !recordedAudio && isSinging && isBackingTrackPlaying && (
                      <View style={localStyles.backingTrackIndicator}>
                        <MaterialCommunityIcons name="music-note" size={16} color={theme.colors.success.main} />
                        <Text style={[localStyles.backingTrackText, { color: theme.colors.success.main }]}>
                          {t('audioChallenge.karaoke.backingTrackPlaying')}
                        </Text>
                      </View>
                    )}
                    <Text style={localStyles.recordTitle}>
                      {recordedAudio 
                        ? t('wwwPhases.audioAnswer.reviewYourAnswer') 
                        : t('wwwPhases.audioAnswer.recordYourAnswer')
                      }
                    </Text>
                    <AudioResponseRecorder
                      onRecordingComplete={handleRecordingDone}
                      onStop={stopBackingTrack}
                      disabled={isSubmitting || timer.timeLeft === 0}
                      maxDuration={timer.timeLeft}
                    />
                    {recordedAudio && (
                      <TouchableOpacity
                        style={localStyles.reRecordButton}
                        onPress={() => {
                          onAudioRecordingComplete?.(null as any);
                          setIsRecordingStarted(false);
                          stopBackingTrack();
                        }}
                        disabled={isSubmitting}
                      >
                        <Text style={localStyles.reRecordText}>
                          {t('wwwPhases.audioAnswer.recordAgain')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                
                {isRecordingStarted && !recordedAudio && isSinging && backingTrackUrl && (
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
        )}

        {/* Submit Button */}
        {countdownValue === null && (
          <TouchableOpacity
            style={[styles.button, isSubmitDisabled && styles.disabledButton]}
            onPress={onSubmit}
            disabled={isSubmitDisabled}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.text.inverse} />
            ) : (
              <Text style={styles.buttonText}>
                {t('wwwPhases.audioAnswer.submitAnswer')}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  questionText: {
    ...theme.typography.body.large,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.text.primary,
  },
  audioSection: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  fallbackContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderStyle: 'dashed',
  },
  fallbackText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.text.disabled,
    ...theme.typography.caption,
    fontWeight: theme.typography.fontWeight.medium,
  },
  replayContainer: {
      marginTop: theme.spacing.md,
      alignItems: 'center',
  },
  replayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary.main,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.layout.borderRadius.full,
      gap: theme.spacing.sm,
      ...theme.shadows.small,
      minHeight: 44,
  },
  replayButtonText: {
      color: theme.colors.text.inverse,
      ...theme.typography.button,
      fontWeight: 'bold',
  },
  replayBadge: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.layout.borderRadius.sm,
      marginLeft: theme.spacing.xs,
  },
  replayBadgeText: {
      color: theme.colors.text.inverse,
      fontSize: 10,
      fontWeight: 'bold',
  },
  noReplaysContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      padding: theme.spacing.sm,
  },
  noReplaysText: {
      color: theme.colors.text.disabled,
      ...theme.typography.caption,
      fontStyle: 'italic',
  },
  answerArea: {
    flex: 1,
  },
  recordContainer: {
    alignItems: 'center',
    flex: 1,
  },
  recordTitle: {
    ...theme.typography.body.medium,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.lg,
    color: theme.colors.text.primary,
  },
  roundRecordButton: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginVertical: theme.spacing.lg,
  },
  roundButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
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
  reRecordButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  reRecordText: {
    color: theme.colors.primary.main,
    ...theme.typography.button,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  playerSelector: {
    marginBottom: theme.spacing.md,
  },
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  playerChip: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.full,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  playerChipText: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
  }
}));


