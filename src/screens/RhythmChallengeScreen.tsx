// src/screens/RhythmChallengeScreen.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video, { VideoRef } from 'react-native-video';
import { useTranslation } from 'react-i18next';

import { RhythmTapPad } from './components/RhythmTapPad';
import { RhythmBeatIndicators } from './components/RhythmBeatIndicators';
import { RhythmScoringResults } from './components/RhythmScoringResults';
import { useRhythmTapCapture } from '../hooks/useRhythmTapCapture';
import { useScoreRhythmTapsMutation } from '../entities/RhythmChallengeState/model/slice/rhythmApi';
import { useGetAudioQuestionQuery } from '../entities/AudioChallengeState/model/slice/audioChallengeApi';
import MediaUrlService from '../services/media/MediaUrlService';
import {
    RhythmChallengePhase,
    RhythmPatternDTO,
    RhythmScoringResult,
    BeatIndicator,
} from '../types/rhythmChallenge.types';
import { useAppStyles } from '../shared/ui/theme';
import { createStyles } from '../shared/ui/theme';

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
    const { theme } = useAppStyles();
    const styles = themeStyles;
    
    const navigation = useNavigation();
    const route = useRoute<RhythmChallengeRouteProp>();
    
    // Safely access params - Hermes seals objects so destructuring missing optional props throws ReferenceError
    const questionId = route.params?.questionId;
    const onComplete = route.params?.onComplete;
    
    // API hooks
    const { data: question, isLoading: questionLoading } = useGetAudioQuestionQuery(questionId as number);
    const [scoreRhythm, { isLoading: scoring }] = useScoreRhythmTapsMutation();
    
    // Tap capture hook
    const {
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
    const [countdownValue, setCountdownValue] = useState(3);
    const [listenCount, setListenCount] = useState(0);
    const [attemptCount, setAttemptCount] = useState(0);
    const [scoringResult, setScoringResult] = useState<RhythmScoringResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentBeatIndex, setCurrentBeatIndex] = useState(-1);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    
    // Refs
    const videoRef = useRef<VideoRef>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
    
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
        if (isAudioPlaying) return;

        if (!audioUrl) {
            Alert.alert(t('common.error'), t('challengeDetails.launcher.audioConfigMissing'));
            return;
        }
        
        setPhase('LISTENING');
        setIsAudioPlaying(true);
        setCurrentBeatIndex(-1);
        setListenCount(prev => prev + 1);
        
        // Start beat indicator animation
        if (rhythmPattern) {
            rhythmPattern.onsetTimesMs.forEach((time, index) => {
                setTimeout(() => {
                    setCurrentBeatIndex(index);
                }, time);
            });
        }
    }, [audioUrl, rhythmPattern, isAudioPlaying, t]);
    
    const handleAudioEnd = useCallback(() => {
        setIsAudioPlaying(false);
        setCurrentBeatIndex(-1);
        setPhase('READY');
    }, []);
    
    const handleStartRecording = useCallback(() => {
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
    }, [startCapture]);
    
    const handleStopRecording = useCallback(async () => {
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
            const result = await scoreRhythm({
                questionId,
                referencePattern: rhythmPattern,
                userOnsetTimesMs: timestamps,
                toleranceMs: 150,
                minimumScoreRequired: question?.minimumScorePercentage || 60,
            }).unwrap();
            
            setScoringResult(result);
            setPhase('RESULTS');
        } catch (err: any) {
            console.error('Scoring error:', err);
            setError(err.message || t('rhythmChallenge.errors.scoringFailed'));
            setPhase('READY');
            Alert.alert(t('common.error'), t('rhythmChallenge.errors.scoringFailed'));
        }
    }, [stopCapture, rhythmPattern, scoreRhythm, questionId, question, t]);
    
    const handleRetry = useCallback(() => {
        resetCapture();
        setScoringResult(null);
        setError(null);
        setPhase('READY');
    }, [resetCapture]);
    
    const handleContinue = useCallback(() => {
        if (onComplete && scoringResult) {
            onComplete(scoringResult.passed, scoringResult.overallScore);
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
    // RENDER
    // ============================================================================
    
    if (questionLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.success.main} />
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
                <Text style={styles.headerTitle}>{t('rhythmChallenge.title')}</Text>
                <View style={styles.attemptBadge}>
                    <Text style={styles.attemptText}>{t('rhythmChallenge.attempt', { count: attemptCount })}</Text>
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
            
            {/* Question Text */}
            <View style={styles.questionContainer}>
                <Text style={styles.questionText}>{question.question}</Text>
                {rhythmPattern && (
                    <Text style={styles.patternInfo}>
                        {t('rhythmChallenge.patternInfo', {
                            beats: rhythmPattern.totalBeats,
                            bpm: rhythmPattern.estimatedBpm,
                            timeSignature: rhythmPattern.timeSignature
                        })}
                    </Text>
                )}
            </View>
            
            {/* Phase-specific Content */}
            {phase === 'READY' && (
                <View style={styles.readyContainer}>
                    <RhythmBeatIndicators
                        beats={beatIndicators}
                        currentBeatIndex={-1}
                        mode="playback"
                    />
                    
                    {listenCount === 0 ? (
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
                    ) : (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.listenButton} onPress={handlePlayReference} disabled={isAudioPlaying}>
                                <MaterialCommunityIcons name="play-circle" size={32} color={theme.colors.text.inverse} />
                                <Text style={styles.listenButtonText}>
                                    {t('rhythmChallenge.listenCount', { count: listenCount })}
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={styles.startButton}
                                onPress={handleStartRecording}
                            >
                                <MaterialCommunityIcons name="gesture-tap" size={32} color={theme.colors.text.inverse} />
                                <Text style={styles.startButtonText}>{t('rhythmChallenge.startTapping')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
            
            {phase === 'LISTENING' && (
                <View style={styles.listeningContainer}>
                    <RhythmBeatIndicators
                        beats={beatIndicators}
                        currentBeatIndex={currentBeatIndex}
                        mode="playback"
                    />
                    
                    <View style={styles.playingIndicator}>
                        <MaterialCommunityIcons name="volume-high" size={48} color={theme.colors.success.main} />
                        <Text style={styles.playingText}>{t('rhythmChallenge.playingPattern')}</Text>
                    </View>
                </View>
            )}
            
            {phase === 'COUNTDOWN' && (
                <View style={styles.countdownContainer}>
                    <Text style={styles.countdownText}>{countdownValue}</Text>
                    <Text style={styles.countdownLabel}>{t('rhythmChallenge.getReady')}</Text>
                </View>
            )}
            
            {phase === 'RECORDING' && (
                <View style={styles.recordingContainer}>
                    <RhythmBeatIndicators
                        beats={beatIndicators}
                        currentBeatIndex={-1}
                        mode="recording"
                    />
                    
                    <RhythmTapPad
                        isActive={isCapturing}
                        onTap={recordTap}
                        tapCount={tapCount}
                        totalExpectedTaps={rhythmPattern?.totalBeats}
                    />
                    
                    <View style={styles.recordingControls}>
                        <Text style={styles.durationText}>
                            {(duration / 1000).toFixed(1)}s
                        </Text>
                        
                        <TouchableOpacity style={styles.stopButton} onPress={handleStopRecording}>
                            <MaterialCommunityIcons name="stop" size={32} color={theme.colors.text.inverse} />
                            <Text style={styles.stopButtonText}>{t('rhythmChallenge.done')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            
            {phase === 'PROCESSING' && (
                <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.success.main} />
                    <Text style={styles.processingText}>{t('rhythmChallenge.processing')}</Text>
                </View>
            )}
            
            {phase === 'RESULTS' && scoringResult && (
                <RhythmScoringResults
                    result={scoringResult}
                    onRetry={handleRetry}
                    onContinue={handleContinue}
                />
            )}
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary || theme.colors.neutral.gray[900],
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
    },
    errorText: {
        color: theme.colors.error.main,
        marginTop: theme.spacing.lg,
        fontSize: 18,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.neutral.gray[800],
    },
    backButton: {
        padding: theme.spacing.sm,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.inverse,
        marginLeft: theme.spacing.sm,
    },
    attemptBadge: {
        backgroundColor: theme.colors.neutral.gray[800],
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 4,
        borderRadius: theme.layout.borderRadius.full,
    },
    attemptText: {
        color: theme.colors.text.secondary,
        fontSize: 12,
    },
    questionContainer: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    questionText: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.text.inverse,
        textAlign: 'center',
    },
    patternInfo: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.sm,
    },
    readyContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: theme.spacing.xl,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing['3xl'],
        gap: theme.spacing.lg,
    },
    listenButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.info.main,
        paddingHorizontal: theme.spacing['2xl'],
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.lg,
    },
    listenButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: theme.spacing.sm,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.success.main,
        paddingHorizontal: theme.spacing['2xl'],
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.lg,
    },
    startButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: theme.spacing.sm,
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
    listeningContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playingIndicator: {
        alignItems: 'center',
        marginTop: theme.spacing['3xl'],
    },
    playingText: {
        color: theme.colors.success.main,
        fontSize: 18,
        marginTop: theme.spacing.sm,
    },
    countdownContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 120,
        fontWeight: 'bold',
        color: theme.colors.success.main,
    },
    countdownLabel: {
        fontSize: 24,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.lg,
    },
    recordingContainer: {
        flex: 1,
        justifyContent: 'space-between',
        padding: theme.spacing.xl,
    },
    recordingControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    durationText: {
        fontSize: 24,
        color: theme.colors.text.secondary,
        fontFamily: 'monospace',
    },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.error.main,
        paddingHorizontal: theme.spacing['2xl'],
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
    },
    stopButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 18,
        fontWeight: '600',
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
        marginTop: theme.spacing.lg,
    },
}));

export default RhythmChallengeScreen;
