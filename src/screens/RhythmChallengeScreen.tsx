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
    
    const [clientTimingScore, setClientTimingScore] = useState<ClientTimingScore | null>(null);
    const [serverResult, setServerResult] = useState<EnhancedRhythmScoringResult | null>(null);
    const [isAnalyzingSound, setIsAnalyzingSound] = useState(false);
    const [enableSoundSimilarity, setEnableSoundSimilarity] = useState(true);
    
    const [currentBeatIndex, setCurrentBeatIndex] = useState(-1);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    
    const videoRef = useRef<VideoRef>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
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
                    Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
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
        
        setPhase('PROCESSING');
        
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
            setPhase('RESULTS');
        } catch (err) {
            console.warn('🎯 Server TAP scoring failed, using client score:', err);
            setPhase('RESULTS');
        }
    }, [beatMatcher, stopCapture, rhythmPattern, scoreRhythmTaps, questionId, question, t]);
    
    const handleAudioRecordingComplete = useCallback(async (audioFile: {uri: string; name: string; type: string}) => {
        setIsAnalyzingSound(true);
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
            
            setServerResult(result);
            setPhase('RESULTS');
        } catch (err) {
            console.error('📊 Server audio scoring failed:', err);
            setPhase('RESULTS');
        } finally {
            setIsAnalyzingSound(false);
        }
    }, [questionId, scoreRhythmAudio, enableSoundSimilarity]);

    const handleRecordingCancel = useCallback(() => {
        setPhase('READY');
        resetCapture();
    }, [resetCapture]);
    
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

    const renderModeSelector = () => (
        <View style={styles.modeToggle}>
            <TouchableOpacity 
                style={[styles.modeOption, inputMode === 'TAP' && styles.modeOptionActive]}
                onPress={() => setInputMode('TAP')}
            >
                <Text style={[styles.modeOptionText, inputMode === 'TAP' && styles.modeOptionTextActive]}>
                    {t('rhythmChallenge.tapMode')}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.modeOption, inputMode === 'AUDIO' && styles.modeOptionActive]}
                onPress={() => setInputMode('AUDIO')}
            >
                <Text style={[styles.modeOptionText, inputMode === 'AUDIO' && styles.modeOptionTextActive]}>
                    {t('rhythmChallenge.clapMode')}
                </Text>
            </TouchableOpacity>
        </View>
    );
    
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
                <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
                    {/* ── READY PHASE ── */}
                    {phase === 'READY' && (
                        <View style={styles.readyContainer}>
                            {/* Mode selector (if BOTH) */}
                            {answerInputMode === 'BOTH' && renderModeSelector()}

                            {/* Sound Similarity Toggle (AUDIO mode) */}
                            {inputMode === 'AUDIO' && (
                                <SoundSimilarityToggle
                                    enabled={enableSoundSimilarity}
                                    onToggle={setEnableSoundSimilarity}
                                    timingWeight={0.7}
                                    soundWeight={0.3}
                                    showWeights={true}
                                />
                            )}

                            {/* Inline playback indicator (visible when isAudioPlaying) */}
                            {isAudioPlaying && (
                                <View style={styles.inlinePlaybackContainer}>
                                    <Animated.View style={[styles.smallPulseCircle, { transform: [{ scale: pulseAnim }] }]}>
                                        <MaterialCommunityIcons name="volume-high" size={40} color={theme.colors.success.main} />
                                    </Animated.View>
                                    <Text style={styles.playingLabel}>{t('rhythmChallenge.playingPattern')}</Text>
                                    <RhythmBeatIndicators
                                        beats={beatMatcher.beatIndicators}
                                        currentBeatIndex={currentBeatIndex}
                                        mode="playback"
                                    />
                                </View>
                            )}

                            {/* Beat indicators (visible when NOT playing) */}
                            {!isAudioPlaying && (
                                <View style={styles.indicatorsWrapper}>
                                    <RhythmBeatIndicators
                                        beats={beatMatcher.beatIndicators}
                                        currentBeatIndex={-1}
                                        mode="playback"
                                    />
                                    {rhythmPattern && (
                                        <Text style={styles.patternMeta}>
                                            {t('rhythmChallenge.patternInfo', {
                                                beats: rhythmPattern.onsetTimesMs.length,
                                                bpm: Math.round(rhythmPattern.estimatedBpm),
                                                timeSignature: `${beatsPerMeasure}/${beatValue}`
                                            })}
                                        </Text>
                                    )}
                                </View>
                            )}

                            {/* Round buttons row */}
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
                                        
                                        {firstPlayDone && allowReplay && (
                                            <View style={styles.replayBadgeAbsolute}>
                                                <Text style={styles.replayBadgeTextAbsolute}>
                                                    {maxReplaysAllowed === 0 ? "∞" : maxReplaysAllowed - replaysUsed}
                                                </Text>
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
                    
                    {/* Countdown */}
                    {phase === 'COUNTDOWN' && (
                        <View style={styles.countdownContainer}>
                            <Text style={styles.countdownText}>{countdownValue}</Text>
                            <Text style={styles.countdownLabel}>{t('rhythmChallenge.getReady')}</Text>
                        </View>
                    )}
                    
                    {/* TAP RECORDING */}
                    {phase === 'RECORDING' && inputMode === 'TAP' && (
                        <View style={styles.recordingContainer}>
                            <RhythmTimeline
                                referencePattern={rhythmPattern!}
                                userTapTimesMs={tapTimestamps}
                                isRecording={isCapturing}
                                toleranceMs={150}
                            />
                            
                            <Text style={styles.tapProgressText}>
                                {t('rhythmChallenge.tapsProgress', {
                                    current: tapCount,
                                    total: rhythmPattern?.onsetTimesMs.length || '?',
                                })}
                            </Text>
                            
                            <Pressable
                                onPress={() => { if (isCapturing) recordTap(); }}
                                style={({pressed}) => [
                                    styles.tapZone,
                                    pressed && styles.tapZonePressed,
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name="gesture-tap"
                                    size={48}
                                    color={theme.colors.text.inverse}
                                />
                                <Text style={styles.tapZoneText}>{t('rhythmChallenge.tapTheRhythm')}</Text>
                            </Pressable>
                            
                            <View style={styles.recordingControls}>
                                <View style={styles.timerContainer}>
                                    <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.text.secondary} />
                                    <Text style={styles.durationText}>
                                        {(duration / 1000).toFixed(1)}s
                                    </Text>
                                </View>
                                
                                <TouchableOpacity style={styles.stopButton} onPress={handleStopTapRecording}>
                                    <MaterialCommunityIcons name="check-circle" size={28} color={theme.colors.text.inverse} />
                                    <Text style={styles.stopButtonText}>{t('rhythmChallenge.done')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    
                    {/* AUDIO RECORDING */}
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
                    {phase === 'RESULTS' && (serverResult || clientTimingScore) && (
                        <EnhancedScoringResults
                            result={serverResult || (clientTimingScore as any)}
                            onRetry={handleRetry}
                            onContinue={handleContinue}
                        />
                    )}
                </Animated.View>
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
        borderRadius: theme.layout.borderRadius.full,
    },
    attemptText: {
        color: theme.colors.text.inverse,
        fontSize: 12,
        fontWeight: 'bold',
    },
    scrollContent: {
        flexGrow: 1,
    },
    readyContainer: {
        flex: 1,
        padding: theme.spacing.md,
        gap: theme.spacing.xl,
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
    indicatorsWrapper: {
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: theme.layout.borderRadius.lg,
    },
    patternMeta: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.md,
        fontStyle: 'italic',
    },
    inlinePlaybackContainer: {
        alignItems: 'center',
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        backgroundColor: 'rgba(76, 175, 80, 0.05)',
        borderRadius: theme.layout.borderRadius.lg,
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
        marginBottom: theme.spacing.sm,
    },
    roundButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'flex-start',
        marginTop: 'auto',
        paddingBottom: theme.spacing.xl,
        paddingTop: theme.spacing.xl,
    },
    roundButtonWrapper: {
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    buttonWithBadge: {
        position: 'relative',
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
    roundButtonDisabled: {
        backgroundColor: theme.colors.neutral.gray[700],
        opacity: 0.5,
    },
    roundButtonLabel: {
        color: theme.colors.text.secondary,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        maxWidth: 100,
        marginTop: 4,
    },
    replayBadgeAbsolute: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: theme.colors.error.main,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.neutral.gray[900],
    },
    replayBadgeTextAbsolute: {
        color: theme.colors.text.inverse,
        fontSize: 10,
        fontWeight: 'bold',
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: theme.colors.neutral.gray[800],
        borderRadius: theme.layout.borderRadius.full,
        padding: 4,
    },
    modeOption: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: theme.layout.borderRadius.full,
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
    countdownContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing['3xl'],
    },
    countdownText: {
        fontSize: 100,
        fontWeight: 'bold',
        color: theme.colors.primary.main,
    },
    countdownLabel: {
        fontSize: 24,
        color: theme.colors.text.secondary,
        marginTop: -10,
    },
    recordingContainer: {
        padding: theme.spacing.md,
    },
    tapProgressText: {
        textAlign: 'right',
        color: theme.colors.text.secondary,
        fontSize: 14,
        fontWeight: '600',
        marginTop: theme.spacing.sm,
    },
    tapZone: {
        backgroundColor: theme.colors.success.main,
        borderRadius: theme.layout.borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 160,
        marginTop: theme.spacing.lg,
        elevation: 8,
        shadowColor: theme.colors.success.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    tapZonePressed: {
        backgroundColor: theme.colors.success.dark || theme.colors.success.main,
        transform: [{ scale: 0.98 }],
        elevation: 2,
    },
    tapZoneText: {
        color: theme.colors.text.inverse,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: theme.spacing.sm,
    },
    recordingControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.xl,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 6,
        borderRadius: theme.layout.borderRadius.sm,
    },
    durationText: {
        color: theme.colors.text.inverse,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 6,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.error.main,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.md,
    },
    stopButtonText: {
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 6,
    },
    audioRecorderContainer: {
        flex: 1,
        padding: theme.spacing.md,
    },
    processingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing['3xl'],
    },
    processingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.text.secondary,
        fontSize: 16,
    },
}));

export default RhythmChallengeScreen;
