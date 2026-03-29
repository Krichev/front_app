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
import { useAudioAnswerScoring } from '../../hooks/useAudioAnswerScoring';
import { AudioScoringInlineResults } from '../components/AudioScoringInlineResults';

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

type InternalPhase = 'listening' | 'recording' | 'scoring' | 'results' | 'text';

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

  // Determine initial internal phase
  const answerMode = question.audioChallengeType ? 'record' : propAnswerMode;
  const initialPhase: InternalPhase = answerMode === 'record' ? 'listening' : 'text';
  const [internalPhase, setInternalPhase] = useState<InternalPhase>(initialPhase);

  // Scoring hook
  const {
    scoringPhase,
    scoringResult,
    error: scoringError,
    isScoring,
    reactionTimeMs,
    scoreUserAudio,
    reset: resetScoring,
    markRecordingStart,
  } = useAudioAnswerScoring({
    question,
  });

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

  // Update internal phase if answerMode changes
  useEffect(() => {
    if (answerMode === 'record' && internalPhase === 'text') {
      setInternalPhase('listening');
    } else if (answerMode === 'text' && internalPhase !== 'text') {
      setInternalPhase('text');
    }
  }, [answerMode]);

  // Sync internal phase with scoring phase
  useEffect(() => {
    if (scoringPhase === 'scoring') {
      setInternalPhase('scoring');
    } else if (scoringPhase === 'completed') {
      setInternalPhase('results');
    } else if (scoringPhase === 'error') {
      setInternalPhase('results'); // Show results screen even on error to allow submission
    }
  }, [scoringPhase]);

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
        setInternalPhase('recording');
        markRecordingStart();
        
        if (isSinging && backingTrackUrl) {
          setIsBackingTrackPlaying(true);
        }
      } else {
        setCountdownValue(count);
      }
    }, 1000);
  }, [isSinging, backingTrackUrl, markRecordingStart]);

  const stopBackingTrack = useCallback(() => {
    setIsBackingTrackPlaying(false);
  }, []);

  const handleRecordingDone = useCallback(async (audioFile: any) => {
    onAudioRecordingComplete?.(audioFile);
    stopBackingTrack();
    
    if (audioFile) {
      await scoreUserAudio(audioFile);
    }
  }, [onAudioRecordingComplete, stopBackingTrack, scoreUserAudio]);

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) return true;
    if (timer.timeLeft === 0) return true;
    if (internalPhase === 'text') {
      return !answer.trim();
    } else if (internalPhase === 'results') {
      return !recordedAudio && !scoringResult;
    } else {
      return true; // Disabled during recording/scoring/listening
    }
  }, [isSubmitting, timer.timeLeft, internalPhase, answer, recordedAudio, scoringResult]);

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

        {/* Phase-based UI */}
        <View style={localStyles.mainArea}>
          {internalPhase === 'text' && (
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
          )}

          {internalPhase === 'listening' && (
            <View style={localStyles.audioSection}>
              {countdownValue === null ? (
                <View>
                  {hasAudio ? (
                    <View>
                      <ReferenceAudioSection 
                        key={replayKey}
                        question={question as any} 
                        onPlaybackComplete={handleAudioEnd}
                        title={t('wwwPhases.audioAnswer.listenToQuestion')}
                      />
                      
                      <View style={localStyles.listenInstructionContainer}>
                        {!hasPlayedAtLeastOnce ? (
                          <Text style={localStyles.listenInstruction}>
                            {t('wwwPhases.audioAnswer.scoring.listenFirst')}
                          </Text>
                        ) : (
                          <Text style={[localStyles.listenInstruction, { color: theme.colors.success.main }]}>
                            {t('wwwPhases.audioAnswer.scoring.readyToRecord')}
                          </Text>
                        )}
                      </View>

                      <View style={localStyles.listeningActions}>
                        {canReplay && (
                          <TouchableOpacity 
                            style={localStyles.replayButton}
                            onPress={handleReplay}
                          >
                            <MaterialCommunityIcons name="replay" size={24} color={theme.colors.text.inverse} />
                            <Text style={localStyles.replayButtonText}>
                                {t('wwwPhases.audioAnswer.listenAgain')}
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[
                            localStyles.recordStartButton,
                            !hasPlayedAtLeastOnce && localStyles.disabledButton
                          ]}
                          onPress={handleStartRecording}
                          disabled={!hasPlayedAtLeastOnce}
                        >
                          <MaterialCommunityIcons name="microphone" size={24} color={theme.colors.text.inverse} />
                          <Text style={localStyles.recordStartButtonText}>
                            {t('audioChallenge.tapToRecord')}
                          </Text>
                        </TouchableOpacity>
                      </View>
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
              ) : (
                <View style={localStyles.countdownContainer}>
                  <Text style={[localStyles.countdownNumber, { color: theme.colors.primary.main }]}>
                    {countdownValue}
                  </Text>
                  <Text style={[localStyles.countdownLabel, { color: theme.colors.text.secondary }]}>
                    {t('audioChallenge.countdown.getReady')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {internalPhase === 'recording' && (
            <View style={localStyles.recordContainer}>
              <View style={{ width: '100%', alignItems: 'center' }}>
                {isSinging && isBackingTrackPlaying && (
                  <View style={localStyles.backingTrackIndicator}>
                    <MaterialCommunityIcons name="music-note" size={16} color={theme.colors.success.main} />
                    <Text style={[localStyles.backingTrackText, { color: theme.colors.success.main }]}>
                      {t('audioChallenge.karaoke.backingTrackPlaying')}
                    </Text>
                  </View>
                )}
                <Text style={localStyles.recordTitle}>
                  {t('wwwPhases.audioAnswer.recordYourAnswer')}
                </Text>
                <AudioResponseRecorder
                  onRecordingComplete={handleRecordingDone}
                  onStop={stopBackingTrack}
                  disabled={isSubmitting || timer.timeLeft === 0}
                  maxDuration={timer.timeLeft}
                />
              </View>
              
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

          {internalPhase === 'scoring' && (
            <View style={localStyles.scoringContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary.main} />
              <Text style={localStyles.scoringText}>
                {t('wwwPhases.audioAnswer.scoring.analyzing')}
              </Text>
            </View>
          )}

          {internalPhase === 'results' && (
            <View style={localStyles.resultsContainer}>
              <Text style={localStyles.recordTitle}>
                {t('wwwPhases.audioAnswer.reviewYourAnswer')}
              </Text>
              
              {scoringResult ? (
                <AudioScoringInlineResults 
                  scoringResult={scoringResult}
                  reactionTimeMs={reactionTimeMs}
                  challengeType={question.audioChallengeType as AudioChallengeType}
                />
              ) : scoringError ? (
                <View style={localStyles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={32} color={theme.colors.error.main} />
                  <Text style={localStyles.errorText}>{scoringError}</Text>
                  <TouchableOpacity 
                    style={localStyles.retryScoringButton}
                    onPress={() => recordedAudio && scoreUserAudio(recordedAudio)}
                  >
                    <Text style={localStyles.retryScoringText}>
                      {t('wwwPhases.audioAnswer.scoring.retry')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={localStyles.scoringContainer}>
                   <ActivityIndicator color={theme.colors.primary.main} />
                </View>
              )}

              <TouchableOpacity
                style={localStyles.reRecordButton}
                onPress={() => {
                  onAudioRecordingComplete?.(null as any);
                  setIsRecordingStarted(false);
                  resetScoring();
                  setInternalPhase('listening');
                  stopBackingTrack();
                }}
                disabled={isSubmitting}
              >
                <MaterialCommunityIcons name="refresh" size={20} color={theme.colors.primary.main} />
                <Text style={localStyles.reRecordText}>
                  {t('wwwPhases.audioAnswer.recordAgain')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
  mainArea: {
    flex: 1,
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
  listenInstructionContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  listenInstruction: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  listeningActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  recordStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success.main,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.layout.borderRadius.md,
    gap: theme.spacing.sm,
    minHeight: 44,
    ...theme.shadows.small,
  },
  recordStartButtonText: {
    color: theme.colors.text.inverse,
    ...theme.typography.button,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: theme.colors.text.disabled,
    opacity: 0.6,
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
  replayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary.main,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.layout.borderRadius.md,
      gap: theme.spacing.sm,
      ...theme.shadows.small,
      minHeight: 44,
  },
  replayButtonText: {
      color: theme.colors.text.inverse,
      ...theme.typography.button,
      fontWeight: 'bold',
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
  scoringContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  scoringText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  errorContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.05)',
    borderRadius: theme.layout.borderRadius.md,
    marginVertical: theme.spacing.md,
    width: '100%',
  },
  errorText: {
    color: theme.colors.error.main,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    ...theme.typography.caption,
  },
  retryScoringButton: {
    marginTop: theme.spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.layout.borderRadius.sm,
    backgroundColor: theme.colors.error.main,
  },
  retryScoringText: {
    color: theme.colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
