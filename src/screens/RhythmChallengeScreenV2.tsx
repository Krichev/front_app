import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Animated,
    Platform,
    ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video, { VideoRef } from 'react-native-video';
import { useTranslation } from 'react-i18next';

import { RhythmTapPad } from './components/RhythmTapPad';
import { RhythmAudioRecorder } from './components/RhythmAudioRecorder';
import { RhythmTimeline } from './components/RhythmTimeline';
import { RhythmListenZone } from './components/RhythmListenZone';
import { TwoPhaseResultsDisplay } from './components/TwoPhaseResultsDisplay';
import { useRhythmTapCapture } from '../hooks/useRhythmTapCapture';
import { useBeatMatcher, ClientTimingScore } from '../hooks/useBeatMatcher';
import { 
    useScoreRhythmTapsMutation, 
    useScoreRhythmAudioMutation 
} from '../entities/RhythmChallengeState/model/slice/rhythmApi';
import { useGetAudioQuestionQuery } from '../entities/AudioChallengeState/model/slice/audioChallengeApi';
import MediaUrlService from '../services/media/MediaUrlService';
import {
    RhythmChallengePhase,
    RhythmInputMode,
    RhythmPatternDTO,
    EnhancedRhythmScoringResult,
} from '../types/rhythmChallenge.types';
import { useAppStyles, createStyles } from '../shared/ui/theme';

type RootStackParamList = {
    RhythmChallenge: {
        questionId: number;
        onComplete?: (passed: boolean, score: number) => void;
    };
};

type RhythmChallengeRouteProp = RouteProp<RootStackParamList, 'RhythmChallenge'>;

export const RhythmChallengeScreenV2: React.FC = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const route = useRoute<RhythmChallengeRouteProp>();
    
    const questionId = route.params?.questionId;
    const onComplete = route.params?.onComplete;

    const { theme } = useAppStyles();
    const styles = themeStyles;
    
    const { data: question, isLoading: questionLoading } = useGetAudioQuestionQuery(questionId as number);
    const [scoreRhythmTaps] = useScoreRhythmTapsMutation();
    const [scoreRhythmAudio] = useScoreRhythmAudioMutation();
    
    const rhythmPattern: RhythmPatternDTO | null = useMemo(() => {
        if (!question?.audioChallengeConfig) return null;
        try {
            return JSON.parse(question.audioChallengeConfig);
        } catch {
            return null;
        }
    }, [question]);

    const beatMatcher = useBeatMatcher({ 
        referencePattern: rhythmPattern, 
        toleranceMs: 150 
    });
    
    const {
        isCapturing,
        startCapture,
        stopCapture,
        recordTap,
        resetCapture,
        tapCount,
        duration,
        tapTimestamps,
    } = useRhythmTapCapture({ 
        maxDuration: 30000,
        onTapRecorded: (relativeTime) => beatMatcher.matchOnset(relativeTime)
    });
    
    const [phase, setPhase] = useState<RhythmChallengePhase>('READY');
    const [inputMode, setInputMode] = useState<RhythmInputMode>('TAP');
    
    const [countdownValue, setCountdownValue] = useState(3);
    const [replaysUsed, setReplaysUsed] = useState(0);
    const [firstPlayDone, setFirstPlayDone] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);
    
    const [clientTimingScore, setClientTimingScore] = useState<ClientTimingScore | null>(null);
    const [serverResult, setServerResult] = useState<EnhancedRhythmScoringResult | null>(null);
    const [isAnalyzingSound, setIsAnalyzingSound] = useState(false);
    
    const [currentBeatIndex, setCurrentBeatIndex] = useState(-1);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    
    const videoRef = useRef<VideoRef>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    const answerInputMode = (question as any)?.answerInputMode || 'BOTH';
    const allowReplay = (question as any)?.allowReplay ?? true;
    const maxReplaysAllowed = (question as any)?.maxReplays ?? 3;
    
    useEffect(() => {
        if (question) {
            if (answerInputMode === 'TAP') setInputMode('TAP');
            else if (answerInputMode === 'AUDIO') setInputMode('AUDIO');
        }
    }, [question, answerInputMode]);

    const audioUrl = useMemo(() => {
        if (!question?.questionMediaId) return null;
        return MediaUrlService.getInstance().getMediaByIdUrl(question.questionMediaId);
    }, [question]);
    
    const handlePlayReference = useCallback(() => {
        if (!audioUrl) {
            Alert.alert(t('common.error'), t('challengeDetails.launcher.audioConfigMissing'));
            return;
        }

        const isReplay = firstPlayDone;
        const canReplay = !isReplay || (allowReplay && (maxReplaysAllowed === 0 || replaysUsed < maxReplaysAllowed));

        if (!canReplay) {
            Alert.alert(t('common.error'), t('rhythmChallenge.noReplaysLeft'));
            return;
        }
        
        setIsAudioPlaying(true);
        setCurrentBeatIndex(-1);
        
        if (isReplay) {
            setReplaysUsed(prev => prev + 1);
        }
        
        if (rhythmPattern) {
            rhythmPattern.onsetTimesMs.forEach((time, index) => {
                setTimeout(() => {
                    setCurrentBeatIndex(index);
                }, time);
            });
        }
    }, [audioUrl, firstPlayDone, allowReplay, maxReplaysAllowed, replaysUsed, rhythmPattern, t]);
    
    const handleAudioEnd = useCallback(() => {
        setIsAudioPlaying(false);
        setCurrentBeatIndex(-1);
        setFirstPlayDone(true);
    }, []);
    
    const handleStartTask = useCallback(() => {
        setPhase('COUNTDOWN');
        setCountdownValue(3);
        
        let count = 3;
        countdownTimerRef.current = setInterval(() => {
            count -= 1;
            setCountdownValue(count);
            
            if (count <= 0) {
                clearInterval(countdownTimerRef.current!);
                setPhase('RECORDING');
                if (inputMode === 'TAP') {
                    startCapture();
                }
                setAttemptCount(prev => prev + 1);
            }
        }, 1000);
    }, [inputMode, startCapture]);
    
    const handleStopTapRecording = useCallback(async () => {
        const finalBeats = beatMatcher.finalizeBeats();
        const timingScore = beatMatcher.computeTimingScore(finalBeats, question?.minimumScorePercentage || 60);
        setClientTimingScore(timingScore);
        
        const timestamps = stopCapture();
        
        if (timestamps.length < 2) {
            Alert.alert(
                t('rhythmChallenge.notEnoughTaps'),
                t('rhythmChallenge.notEnoughTapsMessage'),
                [{ text: t('common.ok') }]
            );
            setPhase('READY');
            return;
        }
        
        setPhase('RESULTS');
        
        try {
            const result = await scoreRhythmTaps({
                questionId,
                referencePattern: rhythmPattern!,
                userOnsetTimesMs: timestamps,
                toleranceMs: 150,
                minimumScoreRequired: question?.minimumScorePercentage || 60,
            }).unwrap();
            
            setServerResult({
                ...result,
                soundSimilarityEnabled: false,
                timingWeight: 1.0,
                soundWeight: 0.0,
                combinedScore: result.overallScore,
            });
        } catch (err) {
            console.warn('🎯 Server TAP scoring failed, using client score:', err);
        }
    }, [beatMatcher, stopCapture, rhythmPattern, scoreRhythmTaps, questionId, question, t]);
    
    const handleAudioRecordingComplete = useCallback(async (audioFile: {uri: string; name: string; type: string}) => {
        setIsAnalyzingSound(true);
        setPhase('RESULTS');
        
        try {
            const validatedUri = Platform.OS === 'android' 
                ? (audioFile.uri.startsWith('file://') ? audioFile.uri : 'file://' + audioFile.uri)
                : audioFile.uri;
            
            const result = await scoreRhythmAudio({
                questionId,
                audioFile: { ...audioFile, uri: validatedUri },
                enableSoundSimilarity: true,
                toleranceMs: 150,
            }).unwrap();
            
            setServerResult(result);
        } catch (err) {
            console.error('📊 Server audio scoring failed:', err);
        } finally {
            setIsAnalyzingSound(false);
        }
    }, [questionId, scoreRhythmAudio]);

    const handleAudioRecordingStop = useCallback(() => {
        const finalBeats = beatMatcher.finalizeBeats();
        const timingScore = beatMatcher.computeTimingScore(finalBeats, question?.minimumScorePercentage || 60);
        setClientTimingScore(timingScore);
    }, [beatMatcher, question]);
    
    const handleRetry = useCallback(() => {
        resetCapture();
        beatMatcher.resetBeats();
        setClientTimingScore(null);
        setServerResult(null);
        setIsAnalyzingSound(false);
        setPhase('READY');
    }, [resetCapture, beatMatcher]);
    
    const handleContinue = useCallback(() => {
        const finalPassed = serverResult?.passed ?? clientTimingScore?.passed ?? false;
        const finalScore = serverResult 
            ? (serverResult.soundSimilarityEnabled ? serverResult.combinedScore : serverResult.overallScore)
            : (clientTimingScore?.overallScore ?? 0);
            
        if (onComplete) {
            onComplete(finalPassed, finalScore);
        }
        navigation.goBack();
    }, [navigation, onComplete, serverResult, clientTimingScore]);
    
    useEffect(() => {
        return () => {
            if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
            }
        };
    }, []);
    
    if (questionLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary.main} />
                    <Text style={styles.loadingText}>{t('rhythmChallenge.loadingChallenge')}</Text>
                </View>
            </SafeAreaView>
        );
    }
    
    if (!question) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error.main} />
                    <Text style={styles.errorText}>{t('rhythmChallenge.questionNotFound')}</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>{t('common.goBack')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.inverse} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('rhythmChallenge.title')}</Text>
                <View style={styles.attemptBadge}>
                    <Text style={styles.attemptText}>
                        {t('rhythmChallenge.attempt', { count: attemptCount || 1 })}
                    </Text>
                </View>
            </View>
            
            {audioUrl && (
                <Video
                    ref={videoRef}
                    source={{ uri: audioUrl }}
                    paused={!isAudioPlaying}
                    onEnd={handleAudioEnd}
                    style={{ height: 0, width: 0 }}
                />
            )}
            
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                <View style={styles.listenSection}>
                    <RhythmListenZone
                        rhythmPattern={rhythmPattern}
                        isPlaying={isAudioPlaying}
                        currentBeatIndex={currentBeatIndex}
                        onPlay={handlePlayReference}
                        firstPlayDone={firstPlayDone}
                        allowReplay={allowReplay}
                        replaysUsed={replaysUsed}
                        maxReplays={maxReplaysAllowed}
                    />
                </View>

                {phase === 'RESULTS' ? (
                    <View style={styles.resultsWrapper}>
                        {clientTimingScore && (
                            <TwoPhaseResultsDisplay
                                clientTimingScore={clientTimingScore}
                                serverResult={serverResult}
                                isAnalyzingSound={isAnalyzingSound}
                                beatIndicators={beatMatcher.beatIndicators}
                                onRetry={handleRetry}
                                onContinue={handleContinue}
                            />
                        )}
                    </View>
                ) : (
                    <View style={styles.interactiveSection}>
                        {answerInputMode === 'BOTH' && phase === 'READY' && (
                            <View style={styles.modeToggle}>
                                <TouchableOpacity 
                                    style={[styles.modeOption, inputMode === 'TAP' && styles.modeOptionActive]}
                                    onPress={() => setInputMode('TAP')}
                                >
                                    <Text style={[styles.modeOptionText, inputMode === 'TAP' && styles.modeOptionTextActive]}>
                                        {t('rhythmChallenge.modeSelector.tap')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.modeOption, inputMode === 'AUDIO' && styles.modeOptionActive]}
                                    onPress={() => setInputMode('AUDIO')}
                                >
                                    <Text style={[styles.modeOptionText, inputMode === 'AUDIO' && styles.modeOptionTextActive]}>
                                        {t('rhythmChallenge.modeSelector.audio')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.phaseContent}>
                            {phase === 'READY' && (
                                <View style={styles.readyPhase}>
                                    {firstPlayDone ? (
                                        <TouchableOpacity style={styles.primaryActionBtn} onPress={handleStartTask}>
                                            <MaterialCommunityIcons 
                                                name={inputMode === 'TAP' ? "gesture-tap" : "microphone"} 
                                                size={28} 
                                                color={theme.colors.text.inverse} 
                                            />
                                            <Text style={styles.primaryActionBtnText}>
                                                {inputMode === 'TAP' ? t('rhythmChallenge.startTapping') : t('rhythmChallenge.startRecording')}
                                            </Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.listenHint}>
                                            <MaterialCommunityIcons name="arrow-up" size={32} color={theme.colors.warning.main} />
                                            <Text style={styles.listenHintText}>{t('rhythmChallenge.listenFirst')}</Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {phase === 'COUNTDOWN' && (
                                <View style={styles.countdownPhase}>
                                    <Text style={styles.countdownNumber}>{countdownValue}</Text>
                                    <Text style={styles.countdownLabel}>{t('rhythmChallenge.getReady')}</Text>
                                </View>
                            )}

                            {phase === 'RECORDING' && (
                                <View style={styles.recordingPhase}>
                                    {inputMode === 'TAP' ? (
                                        <>
                                            <RhythmTimeline
                                                referencePattern={rhythmPattern!}
                                                userTapTimesMs={tapTimestamps}
                                                isRecording={true}
                                                totalDurationMs={rhythmPattern?.totalDurationMs || 5000}
                                            />
                                            <RhythmTapPad
                                                isActive={true}
                                                onTap={recordTap}
                                                tapCount={tapCount}
                                                totalExpectedTaps={rhythmPattern?.onsetTimesMs.length}
                                            />
                                            <View style={styles.recordingActions}>
                                                <View style={styles.timerZone}>
                                                    <Text style={styles.timerText}>{(duration / 1000).toFixed(1)}s</Text>
                                                </View>
                                                <TouchableOpacity style={styles.doneBtn} onPress={handleStopTapRecording}>
                                                    <Text style={styles.doneBtnText}>{t('common.done')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </>
                                    ) : (
                                        <RhythmAudioRecorder
                                            isActive={true}
                                            onRecordingStart={() => {}}
                                            onRecordingStop={handleAudioRecordingStop}
                                            onRecordingComplete={handleAudioRecordingComplete}
                                            onRecordingCancel={() => setPhase('READY')}
                                            onOnsetDetected={(ts) => beatMatcher.matchOnset(ts)}
                                            maxDuration={30}
                                        />
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.neutral.gray[900],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        justifyContent: 'space-between',
    },
    iconButton: {
        padding: theme.spacing.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.inverse,
    },
    attemptBadge: {
        backgroundColor: theme.colors.primary.main,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.layout.borderRadius.pill,
    },
    attemptText: {
        color: theme.colors.text.inverse,
        fontSize: 12,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: theme.spacing.md,
        flexGrow: 1,
    },
    listenSection: {
        marginBottom: theme.spacing.lg,
    },
    interactiveSection: {
        flex: 1,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: theme.colors.neutral.gray[800],
        borderRadius: theme.layout.borderRadius.pill,
        padding: 4,
        marginBottom: theme.spacing.lg,
    },
    modeOption: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: theme.layout.borderRadius.pill,
    },
    modeOptionActive: {
        backgroundColor: theme.colors.primary.main,
    },
    modeOptionText: {
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    modeOptionTextActive: {
        color: theme.colors.text.inverse,
    },
    phaseContent: {
        flex: 1,
        justifyContent: 'center',
    },
    readyPhase: {
        alignItems: 'center',
        paddingVertical: theme.spacing['2xl'],
    },
    primaryActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.success.main,
        paddingHorizontal: theme.spacing['2xl'],
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.lg,
        elevation: 4,
    },
    primaryActionBtnText: {
        color: theme.colors.text.inverse,
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: theme.spacing.sm,
    },
    listenHint: {
        alignItems: 'center',
    },
    listenHintText: {
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.sm,
        fontSize: 16,
    },
    countdownPhase: {
        alignItems: 'center',
    },
    countdownNumber: {
        fontSize: 120,
        fontWeight: 'bold',
        color: theme.colors.primary.main,
    },
    countdownLabel: {
        fontSize: 24,
        color: theme.colors.text.secondary,
        marginTop: -10,
    },
    recordingPhase: {
        flex: 1,
    },
    recordingActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.md,
    },
    timerZone: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 4,
        borderRadius: theme.layout.borderRadius.sm,
    },
    timerText: {
        color: theme.colors.text.inverse,
        fontSize: 18,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    doneBtn: {
        backgroundColor: theme.colors.error.main,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.md,
    },
    doneBtnText: {
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 16,
    },
    resultsWrapper: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.text.secondary,
    },
    errorText: {
        marginTop: theme.spacing.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    backBtn: {
        marginTop: theme.spacing.xl,
        backgroundColor: theme.colors.primary.main,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
    },
    backBtnText: {
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
    },
}));

export default RhythmChallengeScreenV2;
