import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Animated, Text, TouchableOpacity, View, Platform} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video, {VideoRef} from 'react-native-video';
import {useTranslation} from 'react-i18next';

import {useAppStyles} from '../../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../../shared/ui/theme';
import {QuizQuestion} from '../../../entities/QuizState/model/slice/quizApi';
import {AudioChallengeSubmission} from '../../../entities/AudioChallengeState/model/slice/audioChallengeApi';
import {AudioChallengeContainer} from '../../components/audio/AudioChallengeContainer';
import {RhythmTapPad} from '../../components/RhythmTapPad';
import {RhythmBeatIndicators} from '../../components/RhythmBeatIndicators';
import AudioChallengeScoreDisplay from '../../../components/AudioChallengeScoreDisplay';
import {useAudioSubmissionPolling} from '../../../hooks/useAudioSubmissionPolling';
import {useRhythmTapCapture} from '../../../hooks/useRhythmTapCapture';
import {useScoreRhythmTapsMutation} from '../../../entities/RhythmChallengeState/model/slice/rhythmApi';
import {AudioChallengeType, getAudioChallengeTypeInfo} from '../../../types/audioChallenge.types';
import {BeatIndicator, RhythmPatternDTO, EnhancedRhythmScoringResult} from '../../../types/rhythmChallenge.types';
import MediaUrlService from '../../../services/media/MediaUrlService';
import {useBeatMatcher, ClientTimingScore} from '../../../hooks/useBeatMatcher';
import {TwoPhaseResultsDisplay} from '../../components/TwoPhaseResultsDisplay';
import {RhythmAudioRecorder} from '../../components/RhythmAudioRecorder';

interface AudioChallengeScoringPhaseProps {
    question: QuizQuestion;
    onSubmissionComplete: (submission: AudioChallengeSubmission) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

type AudioSubPhase = 'ready' | 'listening' | 'performing' | 'relisten' | 'processing' | 'results' | 'completed';

export const AudioChallengeScoringPhase: React.FC<AudioChallengeScoringPhaseProps> = ({
                                                                      question,
                                                                      onSubmissionComplete,
                                                                      onCancel,
                                                                      isSubmitting: isExternalSubmitting,
                                                                  }) => {
    const {t} = useTranslation();
    const {theme} = useAppStyles();
    const styles = themeStyles;

    const [subPhase, setSubPhase] = useState<AudioSubPhase>('ready');
    const [localSubmission, setLocalSubmission] = useState<AudioChallengeSubmission | null>(null);
    const [attemptCount, setAttemptCount] = useState(0);
    
    // Two-phase results state for in-game
    const [clientTimingScore, setClientTimingScore] = useState<ClientTimingScore | null>(null);
    const [serverResult, setServerResult] = useState<EnhancedRhythmScoringResult | null>(null);
    const [isAnalyzingSound, setIsAnalyzingSound] = useState(false);

    // ── Audio playback state (for RHYTHM_REPEAT listening) ──
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [firstPlayDone, setFirstPlayDone] = useState(false);
    const [replaysUsed, setReplaysUsed] = useState(0);
    const [currentBeatIndex, setCurrentBeatIndex] = useState(-1);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const videoRef = useRef<VideoRef>(null);
    const beatTimersRef = useRef<NodeJS.Timeout[]>([]);

    const challengeType = question.audioChallengeType as AudioChallengeType;
    const challengeTypeInfo = getAudioChallengeTypeInfo(challengeType);
    const isRhythm = challengeType === AudioChallengeType.RHYTHM_CREATION ||
        challengeType === AudioChallengeType.RHYTHM_REPEAT;
    
    const inputMode = (question as any)?.answerInputMode === 'AUDIO' ? 'AUDIO' : 'TAP';

    // Question config for replay limits
    const allowReplay = (question as any)?.allowReplay ?? true;
    const maxReplaysAllowed = (question as any)?.maxReplays ?? 3;

    // Resolve audio URL
    const audioUrl = useMemo(() => {
        if (!question?.questionMediaId) return null;
        return MediaUrlService.getInstance().getMediaByIdUrl(question.questionMediaId);
    }, [question?.questionMediaId]);

    // Pulse animation during audio playback
    useEffect(() => {
        if (isAudioPlaying) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isAudioPlaying, pulseAnim]);

    // Cleanup beat timers
    useEffect(() => {
        return () => { beatTimersRef.current.forEach(clearTimeout); };
    }, []);

    // Polling hook for audio recordings (Phase B)
    const {
        submit: submitRecording,
        submission: polledSubmission,
        isSubmitting: isInternalSubmitting,
        isPolling,
        isComplete,
        error: pollingError
    } = useAudioSubmissionPolling({
        onComplete: (sub) => {
            // Convert submission to EnhancedRhythmScoringResult
            const result: EnhancedRhythmScoringResult = {
                // Required RhythmScoringResult fields — use submission data with safe defaults
                overallScore: sub.overallScore ?? 0,
                passed: sub.passed ?? false,
                minimumScoreRequired: sub.minimumScoreRequired ?? null,
                perBeatScores: [],
                timingErrorsMs: [],
                absoluteErrorsMs: [],
                perfectBeats: 0,
                goodBeats: 0,
                missedBeats: 0,
                averageErrorMs: 0,
                maxErrorMs: 0,
                consistencyScore: 0,
                feedback: sub.passed ? 'Passed' : 'Did not pass',
                // Enhanced fields
                soundSimilarityEnabled: false,
                soundSimilarityScore: undefined,
                timingWeight: 1.0,
                soundWeight: 0.0,
                combinedScore: sub.overallScore ?? 0,
            };
            setServerResult(result);
            setIsAnalyzingSound(false);
            
            // Also update local submission for WWW flow
            setLocalSubmission(sub);
        }
    });

    // Parse rhythm pattern if available
    const rhythmPattern: RhythmPatternDTO | null = useMemo(() => {
        if (!question.audioChallengeConfig) return null;
        try {
            return JSON.parse(question.audioChallengeConfig);
        } catch {
            return null;
        }
    }, [question.audioChallengeConfig]);

    // Beat matcher hook
    const beatMatcher = useBeatMatcher({
        referencePattern: rhythmPattern,
        toleranceMs: 150
    });

    // Rhythm hooks
    const {
        tapCount,
        isCapturing,
        startCapture,
        stopCapture,
        recordTap,
        duration,
        resetCapture
    } = useRhythmTapCapture({
        maxDuration: 30000,
        onTapRecorded: (ts) => beatMatcher.matchOnset(ts)
    });

    const [scoreRhythmTaps, {isLoading: isScoringTaps}] = useScoreRhythmTapsMutation();

    // ── Handlers ──

    const canReplayNow = useCallback(() => {
        return allowReplay && (maxReplaysAllowed === 0 || replaysUsed < maxReplaysAllowed);
    }, [allowReplay, maxReplaysAllowed, replaysUsed]);

    const handlePlayReference = useCallback((fromPerforming = false) => {
        if (!audioUrl) {
            Alert.alert(t('common.error'), t('challengeDetails.launcher.audioConfigMissing'));
            return;
        }
        if (firstPlayDone && !canReplayNow()) {
            Alert.alert(t('common.error'), t('rhythmChallenge.noReplaysLeft'));
            return;
        }
        if (firstPlayDone) {
            setReplaysUsed(prev => prev + 1);
        }

        // If called from performing phase, pause tapping first
        if (fromPerforming && isCapturing) {
            stopCapture();
        }

        setSubPhase(fromPerforming ? 'relisten' : 'listening');
        setIsAudioPlaying(true);
        setCurrentBeatIndex(-1);

        // Animate beat indicators
        if (rhythmPattern) {
            beatTimersRef.current.forEach(clearTimeout);
            beatTimersRef.current = [];
            rhythmPattern.onsetTimesMs.forEach((time: number, index: number) => {
                const timer = setTimeout(() => setCurrentBeatIndex(index), time);
                beatTimersRef.current.push(timer);
            });
        }
    }, [audioUrl, firstPlayDone, canReplayNow, isCapturing, stopCapture, rhythmPattern, t]);

    const handleAudioEnd = useCallback(() => {
        setIsAudioPlaying(false);
        setCurrentBeatIndex(-1);
        setFirstPlayDone(true);

        // If we were re-listening during performing, go back to performing
        if (subPhase === 'relisten') {
            setSubPhase('performing');
            if (inputMode === 'TAP') startCapture(); // resume tapping
        } else {
            setSubPhase('ready');
        }
    }, [subPhase, startCapture, inputMode]);

    const handleRelistenFromPerforming = useCallback(() => {
        handlePlayReference(true);
    }, [handlePlayReference]);

    // Handle audio recording completion
    const handleAudioRecordingComplete = useCallback(async (audioFile: { uri: string; name: string; type: string }) => {
        setIsAnalyzingSound(true);
        await submitRecording(question.id, audioFile);
    }, [question.id, submitRecording]);
    
    const handleAudioRecordingStop = useCallback(() => {
        const finalBeats = beatMatcher.finalizeBeats();
        const timingScore = beatMatcher.computeTimingScore(finalBeats, question.minimumScorePercentage || 60);
        setClientTimingScore(timingScore);
        setSubPhase('results');
    }, [beatMatcher, question]);

    // Handle rhythm tap completion
    const handleStopTapping = useCallback(async () => {
        // Phase A: Client-side score
        const finalBeats = beatMatcher.finalizeBeats();
        const timingScore = beatMatcher.computeTimingScore(finalBeats, question.minimumScorePercentage || 60);
        setClientTimingScore(timingScore);
        
        const timestamps = stopCapture();

        if (timestamps.length < 2) {
            Alert.alert(
                t('audioGamePlay.notEnoughTaps'),
                t('audioGamePlay.minTapsRequired'),
                [{text: 'OK', onPress: () => setSubPhase('ready')}]
            );
            return;
        }

        setSubPhase('results');

        // Phase B: Authoritative server score
        try {
            const result = await scoreRhythmTaps({
                questionId: question.id,
                referencePattern: rhythmPattern!,
                userOnsetTimesMs: timestamps,
                toleranceMs: 150,
                minimumScoreRequired: question.minimumScorePercentage || 60,
            }).unwrap();

            const enhancedResult: EnhancedRhythmScoringResult = {
                ...result,
                soundSimilarityEnabled: false,
                timingWeight: 1.0,
                soundWeight: 0.0,
                combinedScore: result.overallScore,
            };
            
            setServerResult(enhancedResult);
            
            const finalSubmission: AudioChallengeSubmission = {
                id: Math.random(),
                questionId: question.id,
                userId: 0,
                processingStatus: 'COMPLETED',
                processingProgress: 100,
                overallScore: result.overallScore,
                rhythmScore: result.overallScore,
                passed: result.passed,
                minimumScoreRequired: question.minimumScorePercentage || 60,
                createdAt: new Date().toISOString(),
                processedAt: new Date().toISOString(),
            };
            setLocalSubmission(finalSubmission);
        } catch (err) {
            console.error('Rhythm scoring failed:', err);
            const fallbackSubmission: AudioChallengeSubmission = {
                id: Math.random(),
                questionId: question.id,
                userId: 0,
                processingStatus: 'COMPLETED',
                processingProgress: 100,
                overallScore: timingScore.overallScore,
                rhythmScore: timingScore.overallScore,
                passed: timingScore.passed,
                minimumScoreRequired: question.minimumScorePercentage || 60,
                createdAt: new Date().toISOString(),
                processedAt: new Date().toISOString(),
            };
            setLocalSubmission(fallbackSubmission);
        }
    }, [beatMatcher, stopCapture, t, scoreRhythmTaps, question, rhythmPattern]);

    const handleStartPerforming = useCallback(() => {
        if (isRhythm && challengeType === AudioChallengeType.RHYTHM_REPEAT && !firstPlayDone) {
            handlePlayReference(false);
            return;
        }
        setSubPhase('performing');
        if (isRhythm && inputMode === 'TAP') {
            startCapture();
        }
        setAttemptCount(prev => prev + 1);
    }, [isRhythm, challengeType, firstPlayDone, handlePlayReference, startCapture, inputMode]);

    const handleFinish = useCallback(() => {
        if (localSubmission) {
            onSubmissionComplete(localSubmission);
        }
    }, [localSubmission, onSubmissionComplete]);
    
    const handleRetry = useCallback(() => {
        resetCapture();
        beatMatcher.resetBeats();
        setClientTimingScore(null);
        setServerResult(null);
        setIsAnalyzingSound(false);
        setSubPhase('ready');
    }, [resetCapture, beatMatcher]);

    const isSubmitting = isExternalSubmitting || isInternalSubmitting || isPolling || isScoringTaps;

    // ── Computed display values ──
    const replayCount = maxReplaysAllowed === 0 ? null : maxReplaysAllowed - replaysUsed;
    const replayLabel = maxReplaysAllowed === 0
        ? t('rhythmChallenge.unlimitedReplays')
        : t('rhythmChallenge.replaysLeft', { count: replayCount ?? 0 });

    // ══════════════════════════════════════════════════════════════
    // RENDER 
    // ══════════════════════════════════════════════════════════════

    if (subPhase === 'results' && clientTimingScore) {
        return (
            <View style={styles.container}>
                <TwoPhaseResultsDisplay
                    clientTimingScore={clientTimingScore}
                    serverResult={serverResult}
                    isAnalyzingSound={isAnalyzingSound}
                    beatIndicators={beatMatcher.beatIndicators}
                    onRetry={handleRetry}
                    onContinue={handleFinish}
                />
            </View>
        );
    }

    if (subPhase === 'completed' && localSubmission) {
        return (
            <View style={styles.container}>
                <AudioChallengeScoreDisplay submission={localSubmission} />
                <TouchableOpacity style={styles.primaryButton} onPress={handleFinish} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="arrow-right-circle" size={22} color={theme.colors.text.inverse} />
                    <Text style={styles.primaryButtonText}>{t('common.continue')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (subPhase === 'processing' && !isRhythm) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={theme.colors.success.main} />
                <Text style={styles.statusText}>{t('audioGamePlay.processing')}</Text>
                {pollingError && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{pollingError}</Text>
                        <TouchableOpacity style={styles.outlineButton} onPress={() => setSubPhase('ready')}>
                            <Text style={styles.outlineButtonText}>{t('audioGamePlay.tryAgain')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* ── Hidden Audio Player ── */}
            {audioUrl && (challengeType === AudioChallengeType.RHYTHM_REPEAT) && (
                <Video
                    ref={videoRef}
                    source={{ uri: audioUrl }}
                    paused={!isAudioPlaying}
                    onEnd={handleAudioEnd}
                    onError={(e) => console.error('Audio playback error:', e)}
                    style={{ height: 0, width: 0 }}
                />
            )}

            {/* ── Compact Header ── */}
            <View style={styles.compactHeader}>
                <View style={styles.headerIconCircle}>
                    <MaterialCommunityIcons
                        name={challengeType === AudioChallengeType.RHYTHM_REPEAT ? 'repeat' : 'music-note-plus'}
                        size={24}
                        color={theme.colors.success.main}
                    />
                </View>
                <View style={styles.headerTextBlock}>
                    <Text style={styles.headerTitle}>
                        {t(`audioChallenge.types.${challengeType}.label`)}
                    </Text>
                    {rhythmPattern && (
                        <Text style={styles.patternMeta}>
                            {t('rhythmChallenge.patternInfo', {
                                beats: rhythmPattern.totalBeats,
                                bpm: rhythmPattern.estimatedBpm,
                                timeSignature: rhythmPattern.timeSignature,
                            })}
                        </Text>
                    )}
                </View>
                {firstPlayDone && allowReplay && (
                    <View style={styles.replayBadge}>
                        <MaterialCommunityIcons name="replay" size={12} color={theme.colors.primary.main} />
                        <Text style={styles.replayBadgeText}>{replayLabel}</Text>
                    </View>
                )}
            </View>

            {/* ── Phase Content ── */}
            {isRhythm ? (
                <View style={styles.rhythmArea}>
                    {subPhase === 'ready' && (
                        <View style={styles.phaseCenter}>
                            {challengeType === AudioChallengeType.RHYTHM_REPEAT && (
                                <RhythmBeatIndicators beats={beatMatcher.beatIndicators} currentBeatIndex={-1} mode="playback" />
                            )}

                            {!firstPlayDone && challengeType === AudioChallengeType.RHYTHM_REPEAT ? (
                                <>
                                    <Text style={styles.instruction}>{t('audioGamePlay.rhythmListenFirst')}</Text>
                                    <TouchableOpacity
                                        style={styles.listenButton}
                                        onPress={() => handlePlayReference(false)}
                                        activeOpacity={0.8}
                                        disabled={isAudioPlaying}
                                    >
                                        <MaterialCommunityIcons name="play-circle" size={36} color={theme.colors.text.inverse} />
                                        <Text style={styles.listenButtonText}>{t('audioGamePlay.listenToPattern')}</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.instruction}>
                                        {challengeType === AudioChallengeType.RHYTHM_REPEAT ? t('audioGamePlay.readyToTap') : t('audioGamePlay.rhythmReady')}
                                    </Text>
                                    <TouchableOpacity style={styles.playButton} onPress={handleStartPerforming} activeOpacity={0.8}>
                                        <View style={styles.playButtonCircle}>
                                            <MaterialCommunityIcons name="play" size={48} color="#FFFFFF" />
                                        </View>
                                        <Text style={styles.playButtonLabel}>{t('common.start')}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    )}

                    {(subPhase === 'listening' || subPhase === 'relisten') && (
                        <View style={styles.phaseCenter}>
                            {subPhase === 'relisten' && <Text style={styles.pausedHint}>{t('audioGamePlay.tappingPaused')}</Text>}
                            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
                                <MaterialCommunityIcons name="volume-high" size={64} color={theme.colors.success.main} />
                            </Animated.View>
                            <Text style={styles.playingLabel}>{t('rhythmChallenge.playingPattern')}</Text>
                            <RhythmBeatIndicators beats={beatMatcher.beatIndicators} currentBeatIndex={currentBeatIndex} mode="playback" />
                        </View>
                    )}

                    {subPhase === 'performing' && (
                        inputMode === 'TAP' ? (
                            <View style={styles.performingArea}>
                                <RhythmBeatIndicators beats={beatMatcher.beatIndicators} mode="recording" />
                                <RhythmTapPad isActive={isCapturing} onTap={recordTap} tapCount={tapCount} totalExpectedTaps={rhythmPattern?.totalBeats} />
                                <View style={styles.performingActions}>
                                    <TouchableOpacity style={styles.stopButton} onPress={handleStopTapping} activeOpacity={0.8}>
                                        <View style={styles.stopButtonCircle}>
                                            <MaterialCommunityIcons name="stop" size={48} color="#FFFFFF" />
                                        </View>
                                        <Text style={styles.stopButtonLabel}>{t('common.done')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <RhythmAudioRecorder
                                isActive={true}
                                onRecordingStart={() => {}}
                                onRecordingStop={handleAudioRecordingStop}
                                onRecordingComplete={handleAudioRecordingComplete}
                                onRecordingCancel={() => setSubPhase('ready')}
                                onOnsetDetected={(ts) => beatMatcher.matchOnset(ts)}
                                onsetSensitivity={challengeTypeInfo?.onsetSensitivity}
                            />
                        )
                    )}
                </View>
            ) : (
                subPhase === 'ready' ? (
                    <View style={styles.phaseCenter}>
                        <AudioChallengeContainer question={{ ...question, audioChallengeType: challengeType }} mode="preview" />
                        <TouchableOpacity style={styles.playButton} onPress={handleStartPerforming} activeOpacity={0.8}>
                            <View style={styles.playButtonCircle}>
                                <MaterialCommunityIcons name="play" size={48} color="#FFFFFF" />
                            </View>
                            <Text style={styles.playButtonLabel}>{t('common.start')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <AudioChallengeContainer
                        question={{ ...question, audioChallengeType: challengeType }}
                        mode="record"
                        onRecordingComplete={handleAudioRecordingComplete}
                        disabled={isSubmitting}
                    />
                )
            )}

            {!isSubmitting && !['performing', 'listening', 'relisten'].includes(subPhase) && (
                <TouchableOpacity style={styles.cancelLink} onPress={onCancel} activeOpacity={0.6}>
                    <Text style={styles.cancelLinkText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
        padding: theme.spacing.lg,
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    compactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.lg,
        marginBottom: theme.spacing.lg,
        ...theme.shadows.small,
    },
    headerIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.success.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    headerTextBlock: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    patternMeta: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    replayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.info.background,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.layout.borderRadius.full,
    },
    replayBadgeText: {
        fontSize: 11,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.primary.main,
    },
    rhythmArea: {
        flex: 1,
        justifyContent: 'center',
    },
    phaseCenter: {
        alignItems: 'center',
        gap: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
    },
    instruction: {
        fontSize: 17,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: theme.spacing.lg,
    },
    listenButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.success.main,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.layout.borderRadius.full,
        ...theme.shadows.medium,
        minHeight: 56,
    },
    listenButtonText: {
        fontSize: 18,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
    playButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButtonCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.medium,
    },
    playButtonLabel: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    chipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.info.background,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.primary.light,
    },
    chipButtonDisabled: {
        borderColor: theme.colors.border.light,
        backgroundColor: theme.colors.background.tertiary,
    },
    chipButtonText: {
        fontSize: 14,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.primary.main,
    },
    chipButtonTextDisabled: {
        color: theme.colors.text.disabled,
    },
    pulseCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.colors.success.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playingLabel: {
        fontSize: 16,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.success.main,
    },
    pausedHint: {
        fontSize: 14,
        color: theme.colors.warning.main,
        fontWeight: theme.typography.fontWeight.medium,
        textAlign: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
    performingArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    performingActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xl,
        marginTop: theme.spacing.lg,
        width: '100%',
    },
    stopButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopButtonCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.colors.error.main,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.medium,
    },
    stopButtonLabel: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.success.main,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.layout.borderRadius.lg,
        marginTop: theme.spacing.xl,
        ...theme.shadows.small,
        minHeight: 52,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
    outlineButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary.main,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outlineButtonText: {
        fontSize: 15,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.primary.main,
    },
    statusText: {
        fontSize: 17,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.lg,
    },
    errorBox: {
        marginTop: theme.spacing.lg,
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    errorText: {
        fontSize: 14,
        color: theme.colors.error.main,
        textAlign: 'center',
    },
    cancelLink: {
        padding: theme.spacing.md,
        alignItems: 'center',
        marginTop: theme.spacing.md,
    },
    cancelLinkText: {
        fontSize: 15,
        color: theme.colors.text.secondary,
    },
}));

export default AudioChallengeScoringPhase;
