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
    Pressable,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video, { VideoRef } from 'react-native-video';
import { useTranslation } from 'react-i18next';

import { RhythmAudioRecorder } from './components/RhythmAudioRecorder';
import { RhythmTimeline } from './components/RhythmTimeline';
import { RhythmBeatIndicators } from './components/RhythmBeatIndicators';
import { EnhancedScoringResults } from './components/EnhancedScoringResults';
import { SoundSimilarityToggle } from './components/SoundSimilarityToggle';
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

export const RhythmChallengeScreen: React.FC = () => {
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

    const { beatsPerMeasure, beatValue } = useMemo(() => {
        const parts = (rhythmPattern?.timeSignature || '4/4').split('/').map(Number);
        return { beatsPerMeasure: parts[0] || 4, beatValue: parts[1] || 4 };
    }, [rhythmPattern?.timeSignature]);

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
    
    const [scoringResult, setScoringResult] = useState<EnhancedRhythmScoringResult | null>(null);
    const [enableSoundSimilarity, setEnableSoundSimilarity] = useState(true);
    
    const [currentBeatIndex, setCurrentBeatIndex] = useState(-1);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    
    const videoRef = useRef<VideoRef>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const beatTimersRef = useRef<NodeJS.Timeout[]>([]);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    useEffect(() => {
        if (isAudioPlaying) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isAudioPlaying, pulseAnim]);

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
            // Clear any existing timers before starting new ones
            beatTimersRef.current.forEach(clearTimeout);
            beatTimersRef.current = [];
            
            rhythmPattern.onsetTimesMs.forEach((time, index) => {
                const timer = setTimeout(() => {
                    setCurrentBeatIndex(index);
                }, time);
                beatTimersRef.current.push(timer);
            });
        }
        // Phase stays as READY — listen zone animates via isAudioPlaying state
    }, [audioUrl, firstPlayDone, allowReplay, maxReplaysAllowed, replaysUsed, rhythmPattern, t]);
    
    const handleAudioEnd = useCallback(() => {
        setIsAudioPlaying(false);
        setCurrentBeatIndex(-1);
        setFirstPlayDone(true);
        // Ensure all animation timers are cleared
        beatTimersRef.current.forEach(clearTimeout);
        beatTimersRef.current = [];
    }, []);
    
    const handleStartRecording = useCallback(() => {
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
        
        setPhase('PROCESSING');
        
        try {
            const result = await scoreRhythmTaps({
                questionId,
                referencePattern: rhythmPattern!,
                userOnsetTimesMs: timestamps,
                toleranceMs: 150,
                minimumScoreRequired: question?.minimumScorePercentage || 60,
            }).unwrap();
            
            setScoringResult({
                ...result,
                soundSimilarityEnabled: false,
                timingWeight: 1.0,
                soundWeight: 0.0,
                combinedScore: result.overallScore,
            });
            setPhase('RESULTS');
        } catch (err) {
            console.warn('🎯 Server TAP scoring failed:', err);
            // In a real app we might show client-side score here if server fails
            setPhase('READY');
        }
    }, [stopCapture, rhythmPattern, scoreRhythmTaps, questionId, question, t]);
    
    const handleAudioRecordingComplete = useCallback(async (audioFile: {uri: string; name: string; type: string}) => {
        setPhase('PROCESSING');
        
        try {
            const validatedUri = Platform.OS === 'android' 
                ? (audioFile.uri.startsWith('file://') ? audioFile.uri : 'file://' + audioFile.uri)
                : audioFile.uri;
            
            const result = await scoreRhythmAudio({
                questionId,
                audioFile: { ...audioFile, uri: validatedUri },
                enableSoundSimilarity: enableSoundSimilarity,
                toleranceMs: 150,
            }).unwrap();
            
            setScoringResult(result);
            setPhase('RESULTS');
        } catch (err) {
            console.error('📊 Server audio scoring failed:', err);
            setPhase('READY');
        }
    }, [questionId, scoreRhythmAudio, enableSoundSimilarity]);

    const handleRecordingCancel = useCallback(() => {
        setPhase('READY');
        resetCapture();
    }, [resetCapture]);
    
    const handleRetry = useCallback(() => {
        resetCapture();
        beatMatcher.resetBeats();
        setScoringResult(null);
        setPhase('READY');
    }, [resetCapture, beatMatcher]);
    
    const handleContinue = useCallback(() => {
        const finalPassed = scoringResult?.passed ?? false;
        const finalScore = scoringResult 
            ? (scoringResult.soundSimilarityEnabled ? scoringResult.combinedScore : scoringResult.overallScore)
            : 0;
            
        if (onComplete) {
            onComplete(finalPassed, finalScore);
        }
        navigation.goBack();
    }, [navigation, onComplete, scoringResult]);
    
    useEffect(() => {
        return () => {
            if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
            }
            beatTimersRef.current.forEach(clearTimeout);
        };
    }, []);
    
    if (questionLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary.main} />
                    <Text style={styles.processingText}>{t('rhythmChallenge.loadingChallenge')}</Text>
                </View>
            </SafeAreaView>
        );
    }
    
    if (!question) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.processingContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error.main} />
                    <Text style={styles.processingText}>{t('rhythmChallenge.questionNotFound')}</Text>
                    <TouchableOpacity style={[styles.roundButton, { backgroundColor: theme.colors.primary.main, width: 120, height: 44, borderRadius: 22, marginTop: 20 }]} onPress={() => navigation.goBack()}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>{t('common.goBack')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const renderModeSelector = () => (
        <View style={styles.modeSelectorContainer}>
            <TouchableOpacity 
                style={[styles.modeButton, inputMode === 'TAP' && styles.modeButtonActive]}
                onPress={() => setInputMode('TAP')}
            >
                <MaterialCommunityIcons 
                    name="gesture-tap" 
                    size={20} 
                    color={inputMode === 'TAP' ? theme.colors.text.inverse : theme.colors.text.secondary} 
                />
                <Text style={[styles.modeButtonText, inputMode === 'TAP' && styles.modeButtonTextActive]}>
                    {t('rhythmChallenge.tapMode')}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.modeButton, inputMode === 'AUDIO' && styles.modeButtonActive]}
                onPress={() => setInputMode('AUDIO')}
            >
                <MaterialCommunityIcons 
                    name="microphone" 
                    size={20} 
                    color={inputMode === 'AUDIO' ? theme.colors.text.inverse : theme.colors.text.secondary} 
                />
                <Text style={[styles.modeButtonText, inputMode === 'AUDIO' && styles.modeButtonTextActive]}>
                    {t('rhythmChallenge.clapMode')}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const beatIndicators = beatMatcher.beatIndicators;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.inverse} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{t('rhythmChallenge.title')}</Text>
                </View>
                <View style={styles.attemptBadge}>
                    <Text style={styles.attemptText}>
                        {t('rhythmChallenge.attempt', { count: attemptCount || 1 })}
                    </Text>
                </View>
            </View>

            {/* Hidden Audio Player */}
            {audioUrl && (
                <Video
                    ref={videoRef}
                    source={{ uri: audioUrl }}
                    paused={!isAudioPlaying}
                    onEnd={handleAudioEnd}
                    onError={(e) => console.error('Audio error:', e)}
                    style={{ height: 0, width: 0 }}
                />
            )}

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

                {/* ═══ READY PHASE CONTENT ═══ */}
                {phase === 'READY' && (
                    <View style={styles.readyContainer}>
                        {/* Pattern info badge */}
                        {rhythmPattern && (
                            <View style={styles.patternInfoBadge}>
                                <MaterialCommunityIcons name="music-note" size={14} color={theme.colors.text.secondary} />
                                <Text style={styles.patternInfo}>
                                    {t('rhythmChallenge.patternInfo', {
                                        beats: rhythmPattern.totalBeats,
                                        bpm: Math.round(rhythmPattern.estimatedBpm),
                                        timeSignature: rhythmPattern.timeSignature,
                                    })}
                                </Text>
                            </View>
                        )}

                        {/* Mode toggle */}
                        {answerInputMode === 'BOTH' && renderModeSelector()}

                        {/* Sound similarity toggle */}
                        {inputMode === 'AUDIO' && (
                            <View style={styles.toggleWrapper}>
                                <SoundSimilarityToggle
                                    enabled={enableSoundSimilarity}
                                    onToggle={setEnableSoundSimilarity}
                                    timingWeight={0.7}
                                    soundWeight={0.3}
                                    showWeights={true}
                                />
                            </View>
                        )}

                        {/* Main Center Area: Inline Playback OR Beat Indicators */}
                        <View style={styles.readyCenterArea}>
                            {isAudioPlaying ? (
                                <View style={styles.inlinePlaybackContainer}>
                                    <Animated.View style={[styles.smallPulseCircle, { transform: [{ scale: pulseAnim }] }]}>
                                        <MaterialCommunityIcons name="volume-high" size={40} color={theme.colors.success.main} />
                                    </Animated.View>
                                    <Text style={styles.playingLabel}>{t('rhythmChallenge.playingPattern')}</Text>
                                    <RhythmBeatIndicators
                                        beats={beatIndicators}
                                        currentBeatIndex={currentBeatIndex}
                                        mode="playback"
                                    />
                                </View>
                            ) : (
                                <View style={styles.idleIndicatorContainer}>
                                    {!firstPlayDone && (
                                        <MaterialCommunityIcons 
                                            name="headphones" 
                                            size={48} 
                                            color={theme.colors.text.secondary} 
                                            style={{ opacity: 0.3, marginBottom: theme.spacing.md }} 
                                        />
                                    )}
                                    <RhythmBeatIndicators
                                        beats={beatIndicators}
                                        currentBeatIndex={-1}
                                        mode="playback"
                                    />
                                    {!firstPlayDone && (
                                        <Text style={styles.hintTitle}>{t('rhythmChallenge.listenFirst')}</Text>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Round Buttons Row */}
                        <View style={styles.roundButtonsRow}>
                            <View style={styles.roundButtonWrapper}>
                                <View style={styles.buttonWithBadge}>
                                    <TouchableOpacity 
                                        style={[
                                            styles.roundListenButton, 
                                            ((!allowReplay && firstPlayDone) || isAudioPlaying) && styles.roundButtonDisabled
                                        ]}
                                        onPress={handlePlayReference}
                                        disabled={(!allowReplay && firstPlayDone) || isAudioPlaying}
                                    >
                                        <MaterialCommunityIcons 
                                            name={isAudioPlaying ? "volume-high" : (firstPlayDone ? "replay" : "play-circle")} 
                                            size={36} 
                                            color={theme.colors.text.inverse} 
                                        />
                                    </TouchableOpacity>
                                    {firstPlayDone && allowReplay && maxReplaysAllowed > 0 && (
                                        <View style={styles.replayBadge}>
                                            <Text style={styles.replayBadgeText}>{maxReplaysAllowed - replaysUsed}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.roundButtonLabel}>
                                    {firstPlayDone ? t('rhythmChallenge.listenAgain') : t('rhythmChallenge.listen')}
                                </Text>
                            </View>
                            
                            <View style={styles.roundButtonWrapper}>
                                <TouchableOpacity 
                                    style={[styles.roundStartButton, (!firstPlayDone || isAudioPlaying) && styles.roundButtonDisabled]}
                                    onPress={handleStartRecording}
                                    disabled={!firstPlayDone || isAudioPlaying}
                                >
                                    <MaterialCommunityIcons 
                                        name={inputMode === 'TAP' ? "gesture-tap" : "microphone"} 
                                        size={44} 
                                        color={theme.colors.text.inverse} 
                                    />
                                </TouchableOpacity>
                                <Text style={styles.roundButtonLabel}>
                                    {inputMode === 'TAP' ? t('rhythmChallenge.startTapping') : t('rhythmChallenge.startRecording')}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Countdown — contained, not full-screen */}
                {phase === 'COUNTDOWN' && inputMode === 'TAP' && (
                    <View style={styles.countdownContainer}>
                        <Animated.Text style={styles.countdownText}>{countdownValue}</Animated.Text>
                        <Text style={styles.countdownLabel}>{t('rhythmChallenge.getReady')}</Text>
                    </View>
                )}

                {/* ═══ TAP RECORDING: timeline + round tap button + controls ═══ */}
                {phase === 'RECORDING' && inputMode === 'TAP' && (
                    <View style={styles.recordingContainer}>
                        {/* Dual-lane timeline */}
                        {rhythmPattern && (
                            <RhythmTimeline
                                referencePattern={rhythmPattern}
                                userTapTimesMs={tapTimestamps?.current || []}
                                isRecording={isCapturing}
                                toleranceMs={150}
                            />
                        )}

                        {/* Tap count */}
                        <Text style={styles.tapProgress}>
                            {t('rhythmChallenge.tapsProgress', { current: tapCount, total: rhythmPattern?.totalBeats || '?' })}
                        </Text>

                        {/* Big round tap button */}
                        <View style={styles.tapButtonWrapper}>
                            <Pressable
                                onPress={() => { if (isCapturing) recordTap(); }}
                                style={({ pressed }) => [
                                    styles.roundButton,
                                    styles.tapRoundButton,
                                    pressed && styles.tapRoundButtonPressed,
                                ]}
                            >
                                <MaterialCommunityIcons name="gesture-tap" size={48} color={theme.colors.text.inverse} />
                                <Text style={styles.tapButtonLabel}>{t('rhythmChallenge.tapTheRhythm')}</Text>
                            </Pressable>
                        </View>

                        {/* Timer + Done */}
                        <View style={styles.recordingControls}>
                            <View style={styles.timerContainer}>
                                <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.text.secondary} />
                                <Text style={styles.durationText}>{(duration / 1000).toFixed(1)}s</Text>
                            </View>
                            <TouchableOpacity style={[styles.roundButton, styles.doneRoundButton]} onPress={handleStopTapRecording}>
                                <MaterialCommunityIcons name="check" size={28} color={theme.colors.text.inverse} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* AUDIO RECORDING — keep existing */}
                {(phase === 'COUNTDOWN' || phase === 'RECORDING' || (phase === 'PROCESSING' && inputMode === 'AUDIO')) && inputMode === 'AUDIO' && (
                    <View style={styles.audioRecorderContainer}>
                        <RhythmAudioRecorder
                            isActive={true}
                            onRecordingStart={() => {}}
                            onRecordingComplete={handleAudioRecordingComplete}
                            onRecordingCancel={handleRecordingCancel}
                            maxDuration={30}
                            countdownSeconds={3}
                        />
                    </View>
                )}

                {/* PROCESSING */}
                {phase === 'PROCESSING' && inputMode === 'TAP' && (
                    <View style={styles.processingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary.main} />
                        <Text style={styles.processingText}>{t('rhythmChallenge.processing')}</Text>
                    </View>
                )}

                {/* RESULTS */}
                {phase === 'RESULTS' && scoringResult && (
                    <EnhancedScoringResults result={scoringResult} onRetry={handleRetry} onContinue={handleContinue} />
                )}
            </Animated.View>
        </SafeAreaView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },

    // ── Header ──
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.secondary,
        ...theme.shadows.medium,
    },
    backButton: {
        padding: theme.spacing.sm,
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: theme.spacing.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.inverse,
    },
    attemptBadge: {
        backgroundColor: theme.colors.primary.main,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 4,
        borderRadius: theme.layout.borderRadius.full,
    },
    attemptText: {
        color: theme.colors.text.inverse,
        fontSize: 12,
        fontWeight: 'bold',
    },

    // ── Main content ──
    content: {
        flex: 1,
    },

    // ── Ready phase ──
    readyContainer: {
        flex: 1,
        paddingVertical: theme.spacing.md,
    },
    readyCenterArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inlinePlaybackContainer: {
        alignItems: 'center',
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        width: '100%',
    },
    smallPulseCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.success.main,
    },
    playingLabel: {
        color: theme.colors.success.main,
        fontSize: 16,
        fontWeight: '600',
        marginTop: theme.spacing.sm,
    },
    idleIndicatorContainer: {
        alignItems: 'center',
        width: '100%',
    },
    patternInfoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 4,
        borderRadius: theme.layout.borderRadius.sm,
        marginTop: theme.spacing.sm,
        gap: 6,
    },
    patternInfo: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },

    // ── Round buttons row ──
    roundButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'flex-start',
        marginTop: 'auto',
        paddingBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.xl,
    },
    roundButtonWrapper: {
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    buttonWithBadge: {
        position: 'relative',
    },
    replayBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: theme.colors.primary.main,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.background.primary,
    },
    replayBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    roundListenButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.info.main,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    roundStartButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.success.main,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    roundButtonLabel: {
        color: theme.colors.text.secondary,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        maxWidth: 100,
        marginTop: 4,
    },

    // ── Round buttons (shared base) ──
    roundButton: {
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    roundButtonDisabled: {
        backgroundColor: theme.colors.neutral.gray[700],
        opacity: 0.5,
    },

    // ── Mode selector (keep existing pattern) ──
    modeSelectorContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.lg,
        padding: 4,
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    modeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
    },
    modeButtonActive: {
        backgroundColor: theme.colors.primary.main,
        ...theme.shadows.small,
    },
    modeButtonText: {
        color: theme.colors.text.secondary,
        fontWeight: '600',
        marginLeft: theme.spacing.sm,
    },
    modeButtonTextActive: {
        color: theme.colors.text.inverse,
    },
    toggleWrapper: {
        marginHorizontal: theme.spacing.md,
    },

    // ── Hint / Idle indicator ──
    hintTitle: {
        fontSize: 18,
        color: theme.colors.text.secondary,
        fontWeight: '500',
        textAlign: 'center',
    },

    // ── Countdown ──
    countdownContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 100,
        fontWeight: '900',
        color: theme.colors.success.main,
    },
    countdownLabel: {
        fontSize: 22,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.md,
        fontWeight: '600',
    },

    // ── TAP Recording ──
    recordingContainer: {
        flex: 1,
        padding: theme.spacing.lg,
        justifyContent: 'space-between',
    },
    tapProgress: {
        textAlign: 'center',
        color: theme.colors.text.secondary,
        fontSize: 14,
        fontWeight: '600',
        marginTop: theme.spacing.md,
    },
    tapButtonWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tapRoundButton: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: theme.colors.primary.main,
        gap: theme.spacing.sm,
    },
    tapRoundButtonPressed: {
        backgroundColor: theme.colors.primary.dark || theme.colors.primary.main,
        transform: [{ scale: 0.93 }],
        opacity: 0.9,
    },
    tapButtonLabel: {
        fontSize: 13,
        color: theme.colors.text.inverse,
        fontWeight: '600',
        textAlign: 'center',
    },
    recordingControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    durationText: {
        fontSize: 24,
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    doneRoundButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.error.main,
    },

    // ── Audio recorder ──
    audioRecorderContainer: {
        flex: 1,
    },

    // ── Processing ──
    processingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: theme.colors.text.secondary,
        fontSize: 18,
        marginTop: theme.spacing.xl,
        fontWeight: '500',
    },

    // ── Loading / Error ──
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.lg,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing['2xl'],
    },
    errorText: {
        color: theme.colors.error.main,
        marginTop: theme.spacing.lg,
        fontSize: 18,
        textAlign: 'center',
        fontWeight: '600',
    },
}));

export default RhythmChallengeScreen;
