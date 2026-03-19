import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Animated, Text, TouchableOpacity, View, Platform, ScrollView, StyleSheet} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';

import {useAppStyles} from '../../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../../shared/ui/theme';
import {QuizQuestion} from '../../../entities/QuizState/model/slice/quizApi';
import {AudioChallengeSubmission} from '../../../entities/AudioChallengeState/model/slice/audioChallengeApi';
import {AudioChallengeContainer} from '../../components/audio/AudioChallengeContainer';
import {ReferenceAudioSection} from '../../components/audio/ReferenceAudioSection';
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

    // ── Audio playback state ──
    const challengeType = question.audioChallengeType as AudioChallengeType;
    const hasReferenceAudio = challengeType !== AudioChallengeType.RHYTHM_CREATION && 
        (!!question.questionMediaUrl || !!question.questionMediaId || !!question.audioReferenceMediaId);
    
    const [hasListenedOnce, setHasListenedOnce] = useState(!hasReferenceAudio);

    const [currentBeatIndex, setCurrentBeatIndex] = useState(-1);
    const beatTimersRef = useRef<NodeJS.Timeout[]>([]);

    // Parse rhythm pattern if available
    const rhythmPattern: RhythmPatternDTO | null = useMemo(() => {
        if (!question.audioChallengeConfig) return null;
        try {
            return JSON.parse(question.audioChallengeConfig);
        } catch {
            return null;
        }
    }, [question.audioChallengeConfig]);

    const challengeTypeInfo = getAudioChallengeTypeInfo(challengeType);
    const isRhythm = challengeType === AudioChallengeType.RHYTHM_CREATION ||
        challengeType === AudioChallengeType.RHYTHM_REPEAT;
    
    const inputMode = (question as any)?.answerInputMode === 'AUDIO' ? 'AUDIO' : 'TAP';

    // Cleanup beat timers
    useEffect(() => {
        return () => { beatTimersRef.current.forEach(clearTimeout); };
    }, []);

    const {
        submit: submitRecording,
        isSubmitting: isInternalSubmitting,
        isPolling,
        error: pollingError
    } = useAudioSubmissionPolling({
        onComplete: (sub) => {
            const result: EnhancedRhythmScoringResult = {
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
                soundSimilarityEnabled: false,
                soundSimilarityScore: undefined,
                timingWeight: 1.0,
                soundWeight: 0.0,
                combinedScore: sub.overallScore ?? 0,
            };
            setServerResult(result);
            setIsAnalyzingSound(false);
            setLocalSubmission(sub);
        }
    });

    // Beat matcher hook
    const beatMatcher = useBeatMatcher({ 
        referencePattern: rhythmPattern, 
        difficulty: question?.difficulty || 'MEDIUM',
        minimumScorePercentage: question?.minimumScorePercentage || 60,
    });
    // Rhythm hooks
    const {
        tapCount,
        isCapturing,
        startCapture,
        stopCapture,
        recordTap,
        resetCapture
    } = useRhythmTapCapture({
        maxDuration: 30000,
        onTapRecorded: (ts) => beatMatcher.matchOnset(ts)
    });

    const [scoreRhythmTaps, {isLoading: isScoringTaps}] = useScoreRhythmTapsMutation();

    // ── Handlers ──

    const handlePlaybackComplete = useCallback(() => {
        setHasListenedOnce(true);
        setCurrentBeatIndex(-1);
        beatTimersRef.current.forEach(clearTimeout);
        beatTimersRef.current = [];
    }, []);

    const isAnswerDisabled = !hasListenedOnce;

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

        try {
            const result = await scoreRhythmTaps({
                questionId: question.id,
                referencePattern: rhythmPattern!,
                userOnsetTimesMs: timestamps,
                difficulty: question.difficulty || 'MEDIUM',
                minimumScorePercentage: question.minimumScorePercentage || 60,
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
        setSubPhase('performing');
        if (isRhythm && inputMode === 'TAP') {
            startCapture();
        }
        setAttemptCount(prev => prev + 1);
    }, [isRhythm, startCapture, inputMode]);

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
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <AudioChallengeScoreDisplay submission={localSubmission} />

                {hasReferenceAudio && (
                    <View style={styles.miniReferenceContainer}>
                        <ReferenceAudioSection 
                            question={question}
                            segmentStart={question.audioSegmentStart}
                            segmentEnd={question.audioSegmentEnd}
                            mini 
                        />
                    </View>
                )}

                <TouchableOpacity style={styles.primaryButton} onPress={handleFinish} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="arrow-right-circle" size={22} color={theme.colors.text.inverse} />
                    <Text style={styles.primaryButtonText}>{t('common.continue')}</Text>
                </TouchableOpacity>
            </ScrollView>
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
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.titleText}>{question.question}</Text>

            {/* === DISABLED OVERLAY HINT (before first listen) === */}
            {!hasListenedOnce && hasReferenceAudio && (
                <Text style={styles.listenFirstHint}>
                    {t('audioChallenge.listenAtLeastOnce')}
                </Text>
            )}

            {/* === ANSWER CONTROLS === */}
            <View style={[styles.answerSection, isAnswerDisabled && styles.answerSectionDisabled]}>
                {isRhythm ? (
                    <View style={styles.rhythmArea}>
                        {challengeType === AudioChallengeType.RHYTHM_REPEAT && (
                            <RhythmBeatIndicators
                                beats={beatMatcher.beatIndicators}
                                currentBeatIndex={currentBeatIndex}
                                mode={subPhase === 'performing' ? 'recording' : 'playback'}
                            />
                        )}

                        {subPhase === 'ready' ? (
                            <View style={styles.phaseCenter}>
                                {challengeType === AudioChallengeType.RHYTHM_REPEAT && (
                                    <View style={styles.referenceSection}>
                                        <ReferenceAudioSection
                                            question={question}
                                            segmentStart={question.audioSegmentStart}
                                            segmentEnd={question.audioSegmentEnd}
                                            onPlaybackComplete={handlePlaybackComplete}
                                        />
                                    </View>
                                )}
                                <Text style={styles.instruction}>
                                    {challengeType === AudioChallengeType.RHYTHM_REPEAT
                                        ? t('audioGamePlay.readyToTap')
                                        : t('audioGamePlay.rhythmReady')}
                                </Text>
                                <TouchableOpacity 
                                    style={[styles.playButton, isAnswerDisabled && styles.disabledButton]} 
                                    onPress={handleStartPerforming} 
                                    activeOpacity={0.8}
                                    disabled={isAnswerDisabled}
                                >
                                    <View style={[styles.playButtonCircle, isAnswerDisabled && styles.disabledButtonCircle]}>
                                        <MaterialCommunityIcons 
                                            name="play" 
                                            size={48} 
                                            color={isAnswerDisabled ? theme.colors.text.disabled || theme.colors.text.secondary : theme.colors.text.inverse} 
                                        />
                                    </View>
                                    <Text style={[styles.playButtonLabel, isAnswerDisabled && styles.disabledText]}>
                                        {t('common.start')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            inputMode === 'TAP' ? (
                                <View style={styles.performingArea}>
                                    <RhythmTapPad isActive={isCapturing} onTap={recordTap} tapCount={tapCount} totalExpectedTaps={rhythmPattern?.totalBeats} />
                                    <View style={styles.performingActions}>
                                        <TouchableOpacity style={styles.stopButton} onPress={handleStopTapping} activeOpacity={0.8}>
                                            <View style={styles.stopButtonCircle}>
                                                <MaterialCommunityIcons name="stop" size={48} color={theme.colors.text.inverse} />
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
                    <AudioChallengeContainer
                        question={{ ...question, audioChallengeType: challengeType }}
                        mode="record"
                        onRecordingComplete={handleAudioRecordingComplete}
                        onPlaybackComplete={handlePlaybackComplete}
                        disabled={isSubmitting || isAnswerDisabled}
                    />
                )}
            </View>

            {!isSubmitting && subPhase !== 'performing' && (
                <TouchableOpacity style={styles.cancelLink} onPress={onCancel} activeOpacity={0.6}>
                    <Text style={styles.cancelLinkText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    scrollContent: {
        flexGrow: 1,
        padding: theme.spacing.lg,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleText: {
        fontSize: 20,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    referenceSection: {
        marginBottom: theme.spacing.lg,
        width: '100%',
    },
    relistenButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        marginTop: theme.spacing.sm,
        gap: theme.spacing.xs,
        minHeight: 44,
    },
    relistenText: {
        color: theme.colors.primary.main,
        fontSize: 14,
        fontWeight: '500',
    },
    playingHint: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginTop: theme.spacing.xs,
        fontStyle: 'italic',
    },
    listenFirstHint: {
        fontSize: 13,
        color: theme.colors.warning?.main || theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
        fontWeight: '500',
    },
    answerSection: {
        width: '100%',
        flex: 1,
    },
    answerSectionDisabled: {
        opacity: 0.45,
    },
    rhythmArea: {
        flex: 1,
        justifyContent: 'center',
    },
    phaseCenter: {
        alignItems: 'center',
        gap: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
    },
    instruction: {
        fontSize: 16,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: theme.spacing.md,
    },
    playButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButtonCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
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
    disabledButton: {
        opacity: 0.5,
    },
    disabledButtonCircle: {
        backgroundColor: theme.colors.background.tertiary,
    },
    disabledText: {
        color: theme.colors.text.disabled || theme.colors.text.secondary,
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
    miniReferenceContainer: {
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.background.tertiary,
        width: '100%',
    },
}));


export default AudioChallengeScoringPhase;
