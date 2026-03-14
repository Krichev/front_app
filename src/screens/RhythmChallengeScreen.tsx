// src/screens/RhythmChallengeScreen.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Animated,
    Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video, { VideoRef } from 'react-native-video';
import { useTranslation } from 'react-i18next';

import { RhythmTapPad } from './components/RhythmTapPad';
import { RhythmAudioRecorder } from './components/RhythmAudioRecorder';
import { RhythmBeatIndicators } from './components/RhythmBeatIndicators';
import { EnhancedScoringResults } from './components/EnhancedScoringResults';
import { SoundSimilarityToggle } from './components/SoundSimilarityToggle';
import { useRhythmTapCapture } from '../hooks/useRhythmTapCapture';
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
    BeatIndicator,
} from '../types/rhythmChallenge.types';
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import {createStyles} from '../shared/ui/theme';

// ============================================================================
// TYPES
// ============================================================================

type RootStackParamList = {
    RhythmChallenge: {
        questionId: number;
        onComplete?: (passed: boolean, score: number) => void;
    };
};

type RhythmChallengeRouteProp = RouteProp<RootStackParamList, 'RhythmChallenge'>;

// ============================================================================
// COMPONENT
// ============================================================================

export const RhythmChallengeScreen: React.FC = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const route = useRoute<RhythmChallengeRouteProp>();
    
    // Safely access params
    const questionId = route.params?.questionId;
    const onComplete = route.params?.onComplete;

    const {theme} = useAppStyles();
    const styles = themeStyles;
    
    // API hooks
    const { data: question, isLoading: questionLoading } = useGetAudioQuestionQuery(questionId as number);
    const [scoreRhythmTaps] = useScoreRhythmTapsMutation();
    const [scoreRhythmAudio] = useScoreRhythmAudioMutation();
    
    // Tap capture hook
    const {
        tapTimestamps,
        isCapturing,
        startCapture,
        stopCapture,
        recordTap,
        resetCapture,
        tapCount,
        duration,
    } = useRhythmTapCapture({ maxDuration: 30000 });
    
    // State
    const [phase, setPhase] = useState<RhythmChallengePhase>('READY');
    const [inputMode, setInputMode] = useState<RhythmInputMode>('TAP');
    const [enableSoundSimilarity, setEnableSoundSimilarity] = useState(false);
    
    const [countdownValue, setCountdownValue] = useState(3);
    const [replaysUsed, setReplaysUsed] = useState(0);
    const [firstPlayDone, setFirstPlayDone] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);
    const [scoringResult, setScoringResult] = useState<EnhancedRhythmScoringResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentBeatIndex, setCurrentBeatIndex] = useState(-1);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    
    // Animated values
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    
    // Refs
    const videoRef = useRef<VideoRef>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    // Derived configuration
    const answerInputMode = (question as any)?.answerInputMode || 'BOTH';
    const allowReplay = (question as any)?.allowReplay ?? true;
    const maxReplaysAllowed = (question as any)?.maxReplays ?? 3;
    
    // Set initial input mode based on question
    useEffect(() => {
        if (question) {
            if (answerInputMode === 'TAP') setInputMode('TAP');
            else if (answerInputMode === 'AUDIO') setInputMode('AUDIO');
        }
    }, [question, answerInputMode]);

    // Handle pulse animation during listening
    useEffect(() => {
        if (isAudioPlaying) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isAudioPlaying, pulseAnim]);

    // Phase transition animation
    useEffect(() => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [phase, fadeAnim]);
    
    // Parse rhythm pattern from question config
    const rhythmPattern: RhythmPatternDTO | null = React.useMemo(() => {
        if (!question?.audioChallengeConfig) return null;
        try {
            return JSON.parse(question.audioChallengeConfig);
        } catch {
            return null;
        }
    }, [question]);
    
    // Build beat indicators
    const beatIndicators: BeatIndicator[] = React.useMemo(() => {
        if (!rhythmPattern) return [];
        return rhythmPattern.onsetTimesMs.map((time, index) => ({
            index,
            expectedTimeMs: time,
            status: 'pending' as const,
        }));
    }, [rhythmPattern]);
    
    // Get audio URL
    const audioUrl = React.useMemo(() => {
        if (!question?.questionMediaId) return null;
        return MediaUrlService.getInstance().getMediaByIdUrl(question.questionMediaId);
    }, [question]);
    
    // ============================================================================
    // HANDLERS
    // ============================================================================
    
    const handlePlayReference = useCallback(() => {
        if (!audioUrl) {
            Alert.alert(t('common.error'), t('challengeDetails.launcher.audioConfigMissing'));
            return;
        }

        // Check if replay is allowed
        const isReplay = firstPlayDone;
        const canReplay = !isReplay || (allowReplay && (maxReplaysAllowed === 0 || replaysUsed < maxReplaysAllowed));

        if (!canReplay) {
            Alert.alert(t('common.error'), t('rhythmChallenge.noReplaysLeft'));
            return;
        }
        
        setPhase('LISTENING');
        setIsAudioPlaying(true);
        setCurrentBeatIndex(-1);
        
        if (isReplay) {
            setReplaysUsed(prev => prev + 1);
        }
        
        // Start beat indicator animation
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
        setPhase('READY');
        setFirstPlayDone(true);
    }, []);
    
    const handleStartRecording = useCallback(() => {
        if (inputMode === 'TAP') {
            setPhase('COUNTDOWN');
            setCountdownValue(3);
            
            // Countdown timer
            let count = 3;
            countdownTimerRef.current = setInterval(() => {
                count -= 1;
                setCountdownValue(count);
                
                if (count <= 0) {
                    clearInterval(countdownTimerRef.current!);
                    setPhase('RECORDING');
                    startCapture();
                    setAttemptCount(prev => prev + 1);
                }
            }, 1000);
        } else {
            // Audio recording component handles countdown internally
            setPhase('RECORDING'); // Just transition, component handles the rest
            setAttemptCount(prev => prev + 1);
        }
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
        
        if (!rhythmPattern) {
            Alert.alert(t('common.error'), t('audioChallenge.config.errorPick'));
            setPhase('READY');
            return;
        }
        
        setPhase('PROCESSING');
        
        try {
            const result = await scoreRhythmTaps({
                questionId,
                referencePattern: rhythmPattern,
                userOnsetTimesMs: timestamps,
                toleranceMs: 150,
                minimumScoreRequired: question?.minimumScorePercentage || 60,
            }).unwrap();
            
            // Cast to Enhanced type (tap mode has basic result)
            const enhancedResult: EnhancedRhythmScoringResult = {
                ...result,
                soundSimilarityEnabled: false,
                timingWeight: 1.0,
                soundWeight: 0.0,
                combinedScore: result.overallScore,
            };
            
            setScoringResult(enhancedResult);
            setPhase('RESULTS');
        } catch (err: any) {
            console.error('Scoring error:', err);
            setError(err.message || t('rhythmChallenge.errors.scoringFailed'));
            setPhase('READY');
            Alert.alert(t('common.error'), t('rhythmChallenge.errors.scoringFailed'));
        }
    }, [stopCapture, rhythmPattern, scoreRhythmTaps, questionId, question, t]);
    
    const handleAudioRecordingComplete = useCallback(async (audioFile: {uri: string; name: string; type: string}) => {
        setPhase('PROCESSING');
        setError(null);
        
        try {
            // Validate file exists and has content
            // On Android, verify file:// URI is correct (already handled in recorder, but double check)
            const validatedUri = Platform.OS === 'android' 
                ? (audioFile.uri.startsWith('file://') ? audioFile.uri : 'file://' + audioFile.uri)
                : audioFile.uri;
            
            console.log('📤 Uploading rhythm audio:', validatedUri);

            const result = await scoreRhythmAudio({
                questionId,
                audioFile: { ...audioFile, uri: validatedUri },
                enableSoundSimilarity,
                toleranceMs: 150,
            }).unwrap();
            
            setScoringResult(result);
            setPhase('RESULTS');
        } catch (err: any) {
            console.error('Audio scoring error:', err);
            
            let errorMessage = t('rhythmChallenge.errors.scoringFailed');
            if (err.status === 413) {
                errorMessage = t('rhythmChallenge.errors.fileTooLarge');
            } else if (err.status === 400) {
                errorMessage = t('rhythmChallenge.errors.invalidAudio');
            } else if (!err.status) {
                errorMessage = t('rhythmChallenge.errors.networkError');
            }
            
            setError(errorMessage);
            Alert.alert(t('common.error'), errorMessage);
            setPhase('READY');
        }
    }, [questionId, enableSoundSimilarity, scoreRhythmAudio, t]);
    
    const handleRecordingCancel = useCallback(() => {
        setPhase('READY');
    }, []);
    
    const handleRetry = useCallback(() => {
        resetCapture();
        setScoringResult(null);
        setError(null);
        setPhase('READY');
    }, [resetCapture]);
    
    const handleContinue = useCallback(() => {
        if (onComplete && scoringResult) {
            const finalScore = scoringResult.soundSimilarityEnabled 
                ? scoringResult.combinedScore 
                : scoringResult.overallScore;
            onComplete(scoringResult.passed, finalScore);
        }
        navigation.goBack();
    }, [navigation, onComplete, scoringResult]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
            }
        };
    }, []);
    
    // ============================================================================
    // RENDER HELPERS
    // ============================================================================
    
    const renderModeSelector = () => (
        <View style={styles.modeSelectorContainer}>
            <TouchableOpacity
                style={[styles.modeButton, inputMode === 'TAP' && styles.modeButtonActive]}
                onPress={() => setInputMode('TAP')}
                disabled={phase !== 'READY'}
            >
                <MaterialCommunityIcons 
                    name="gesture-tap" 
                    size={24} 
                    color={inputMode === 'TAP' ? theme.colors.text.inverse : theme.colors.text.disabled} 
                />
                <Text style={[styles.modeButtonText, inputMode === 'TAP' && styles.modeButtonTextActive]}>
                    {t('rhythmChallenge.tapMode')}
                </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={[styles.modeButton, inputMode === 'AUDIO' && styles.modeButtonActive]}
                onPress={() => setInputMode('AUDIO')}
                disabled={phase !== 'READY'}
            >
                <MaterialCommunityIcons 
                    name="microphone" 
                    size={24} 
                    color={inputMode === 'AUDIO' ? theme.colors.text.inverse : theme.colors.text.disabled} 
                />
                <Text style={[styles.modeButtonText, inputMode === 'AUDIO' && styles.modeButtonTextActive]}>
                    {t('rhythmChallenge.clapMode')}
                </Text>
            </TouchableOpacity>
        </View>
    );
    
    // ============================================================================
    // RENDER
    // ============================================================================
    
    if (questionLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary.main} />
                    <Text style={styles.loadingText}>{t('rhythmChallenge.loadingChallenge')}</Text>
                </View>
            </SafeAreaView>
        );
    }
    
    if (!question) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error.main} />
                    <Text style={styles.errorText}>{t('rhythmChallenge.questionNotFound')}</Text>
                </View>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.inverse} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{t('rhythmChallenge.title')}</Text>
                    <Text style={styles.headerSubtitle}>{question.audioChallengeType}</Text>
                </View>
                <View style={styles.attemptBadge}>
                    <Text style={styles.attemptText}>
                        {t('createQuest.quizConfig.rounds', {count: attemptCount || 1})}
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
            
            <Animated.View style={[styles.scrollContent, {opacity: fadeAnim}]}>
                {/* Question Text */}
                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>{question.question}</Text>
                    {rhythmPattern && (
                        <View style={styles.patternInfoBadge}>
                            <MaterialCommunityIcons name="music-note" size={14} color={theme.colors.text.secondary} />
                            <Text style={styles.patternInfo}>
                                {rhythmPattern.totalBeats} beats • {rhythmPattern.estimatedBpm} BPM • {rhythmPattern.timeSignature}
                            </Text>
                        </View>
                    )}
                </View>
                
                {/* Phase-specific Content */}
                {phase === 'READY' && (
                    <View style={styles.readyContainer}>
                        {answerInputMode === 'BOTH' && renderModeSelector()}
                        
                        {inputMode === 'AUDIO' && (
                            <SoundSimilarityToggle
                                enabled={enableSoundSimilarity}
                                onToggle={setEnableSoundSimilarity}
                                timingWeight={0.7}
                                soundWeight={0.3}
                                showWeights={true}
                            />
                        )}
                        
                        <View style={styles.indicatorsWrapper}>
                            <RhythmBeatIndicators
                                beats={beatIndicators}
                                currentBeatIndex={-1}
                                mode="playback"
                            />
                        </View>
                        
                        <View style={styles.actionButtons}>
                            <View style={styles.buttonWithBadge}>
                                <TouchableOpacity 
                                    style={[
                                        styles.listenButton,
                                        (!allowReplay && firstPlayDone) && styles.listenButtonDisabled
                                    ]} 
                                    onPress={handlePlayReference}
                                    disabled={!allowReplay && firstPlayDone}
                                >
                                    <MaterialCommunityIcons 
                                        name={firstPlayDone ? "replay" : "play-circle"} 
                                        size={32} 
                                        color={theme.colors.text.inverse} 
                                    />
                                    <Text style={styles.listenButtonText}>
                                        {firstPlayDone ? t('rhythmChallenge.listenAgain') : t('questionDisplay.karaoke.listenReference')}
                                    </Text>
                                </TouchableOpacity>
                                
                                {firstPlayDone && allowReplay && (
                                    <View style={styles.replayBadge}>
                                        <Text style={styles.replayBadgeText}>
                                            {maxReplaysAllowed === 0 
                                                ? '∞' 
                                                : t('rhythmChallenge.replaysLeft', {count: maxReplaysAllowed - replaysUsed})}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.startButton, !firstPlayDone && styles.startButtonDisabled]}
                                onPress={handleStartRecording}
                                disabled={!firstPlayDone}
                            >
                                <MaterialCommunityIcons 
                                    name={inputMode === 'TAP' ? "gesture-tap" : "microphone"} 
                                    size={32} 
                                    color={theme.colors.text.inverse} 
                                />
                                <Text style={styles.startButtonText}>
                                    {inputMode === 'TAP' ? t('rhythmChallenge.startTapping') : t('rhythmChallenge.startRecording')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        
                        {!firstPlayDone ? (
                            <TouchableOpacity 
                                style={styles.listenHintButton} 
                                onPress={handlePlayReference}
                                activeOpacity={0.7}
                                disabled={isAudioPlaying}
                            >
                                <MaterialCommunityIcons 
                                    name="play-circle-outline" 
                                    size={28} 
                                    color={theme.colors.text.inverse} 
                                />
                                <Text style={styles.listenHintButtonText}>
                                    {t('rhythmChallenge.listenToPatternFirst')}
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}
                
                {phase === 'LISTENING' && (
                    <View style={styles.listeningContainer}>
                        <Animated.View style={[styles.pulseCircle, {transform: [{scale: pulseAnim}]}]}>
                            <MaterialCommunityIcons name="volume-high" size={80} color={theme.colors.success.main} />
                        </Animated.View>
                        
                        <View style={styles.playingIndicator}>
                            <Text style={styles.playingText}>{t('rhythmChallenge.tapAlong')}</Text>
                        </View>

                        <View style={styles.indicatorsWrapperFixed}>
                            <RhythmBeatIndicators
                                beats={beatIndicators}
                                currentBeatIndex={currentBeatIndex}
                                mode="playback"
                            />
                        </View>
                    </View>
                )}
                
                {(phase === 'COUNTDOWN' || phase === 'RECORDING') && inputMode === 'TAP' && (
                    <>
                        {phase === 'COUNTDOWN' && (
                            <View style={styles.countdownContainer}>
                                <Animated.Text style={styles.countdownText}>{countdownValue}</Animated.Text>
                                <Text style={styles.countdownLabel}>{t('rhythmChallenge.getReady')}</Text>
                            </View>
                        )}
                        
                        {phase === 'RECORDING' && (
                            <View style={styles.recordingContainer}>
                                <View style={styles.indicatorsWrapper}>
                                    <RhythmBeatIndicators
                                        beats={beatIndicators}
                                        currentBeatIndex={-1}
                                        mode="recording"
                                    />
                                </View>
                                
                                <View style={styles.tapPadWrapper}>
                                    <RhythmTapPad
                                        isActive={isCapturing}
                                        onTap={recordTap}
                                        tapCount={tapCount}
                                        totalExpectedTaps={rhythmPattern?.totalBeats}
                                    />
                                    <View style={styles.tapCounterOverlay}>
                                        <Text style={styles.tapCounterText}>
                                            {t('rhythmChallenge.tapsProgress', {current: tapCount, total: rhythmPattern?.totalBeats || '?'})}
                                        </Text>
                                    </View>
                                </View>
                                
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
                    </>
                )}
                
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
                
                {phase === 'PROCESSING' && inputMode === 'TAP' && (
                    <View style={styles.processingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary.main} />
                        <Text style={styles.processingText}>{t('rhythmChallenge.processing')}</Text>
                    </View>
                )}
                
                {phase === 'RESULTS' && scoringResult && (
                    <EnhancedScoringResults
                        result={scoringResult}
                        onRetry={handleRetry}
                        onContinue={handleContinue}
                    />
                )}
            </Animated.View>
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.neutral.gray[900],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.neutral.gray[800],
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
    headerSubtitle: {
        fontSize: 12,
        color: theme.colors.text.disabled,
        textTransform: 'uppercase',
        letterSpacing: 1,
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
    scrollContent: {
        flexGrow: 1,
    },
    questionContainer: {
        padding: theme.spacing.xl,
        alignItems: 'center',
        backgroundColor: theme.colors.neutral.gray[800],
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...theme.shadows.small,
    },
    questionText: {
        fontSize: 22,
        fontWeight: '600',
        color: theme.colors.text.inverse,
        textAlign: 'center',
        lineHeight: 30,
    },
    patternInfoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 4,
        borderRadius: theme.layout.borderRadius.sm,
        marginTop: theme.spacing.md,
        gap: 6,
    },
    patternInfo: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    readyContainer: {
        flex: 1,
        padding: theme.spacing.xl,
    },
    modeSelectorContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.neutral.gray[800],
        borderRadius: theme.layout.borderRadius.lg,
        padding: 4,
        marginBottom: theme.spacing.xl,
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
    listenHintButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.info.main,
        paddingHorizontal: theme.spacing['2xl'],
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.lg,
        marginTop: theme.spacing.xl,
        minHeight: 52,
        elevation: 4,
        shadowColor: theme.colors.info.main,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    listenHintButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 16,
        fontWeight: '700',
        marginLeft: theme.spacing.sm,
    },
    indicatorsWrapper: {
        marginVertical: theme.spacing.xl,
        padding: theme.spacing.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: theme.layout.borderRadius.lg,
    },
    indicatorsWrapperFixed: {
        width: '100%',
        marginTop: theme.spacing['2xl'],
    },
    actionButtons: {
        gap: theme.spacing.lg,
        marginTop: 'auto',
        paddingBottom: theme.spacing.xl,
    },
    buttonWithBadge: {
        position: 'relative',
    },
    listenButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.info.main,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.lg,
        ...theme.shadows.medium,
    },
    listenButtonDisabled: {
        backgroundColor: theme.colors.neutral.gray[700],
        opacity: 0.5,
    },
    listenButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: theme.spacing.sm,
    },
    replayBadge: {
        position: 'absolute',
        top: -10,
        right: 10,
        backgroundColor: theme.colors.warning.main,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.neutral.gray[900],
    },
    replayBadgeText: {
        color: theme.colors.text.primary,
        fontSize: 10,
        fontWeight: '900',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.success.main,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.lg,
        ...theme.shadows.medium,
    },
    startButtonDisabled: {
        backgroundColor: theme.colors.neutral.gray[700],
        opacity: 0.5,
    },
    startButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: theme.spacing.sm,
    },
    hintText: {
        textAlign: 'center',
        color: theme.colors.warning.main,
        marginTop: theme.spacing.md,
        fontSize: 14,
        fontStyle: 'italic',
    },
    listeningContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    pulseCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.success.main,
    },
    playingIndicator: {
        marginTop: theme.spacing.xl,
    },
    playingText: {
        color: theme.colors.success.main,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    countdownContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 150,
        fontWeight: '900',
        color: theme.colors.success.main,
        ...theme.shadows.large,
    },
    countdownLabel: {
        fontSize: 28,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.lg,
        fontWeight: '600',
    },
    recordingContainer: {
        flex: 1,
        padding: theme.spacing.xl,
    },
    tapPadWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    tapCounterOverlay: {
        position: 'absolute',
        top: '10%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    tapCounterText: {
        color: theme.colors.text.inverse,
        fontSize: 18,
        fontWeight: 'bold',
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
        gap: 8,
    },
    durationText: {
        fontSize: 28,
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.error.main,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.lg,
        ...theme.shadows.medium,
    },
    stopButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: theme.spacing.sm,
    },
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
    audioRecorderContainer: {
        flex: 1,
    },
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
