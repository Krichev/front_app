// src/screens/RhythmChallengeScreenV2.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video, { VideoRef } from 'react-native-video';

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

export const RhythmChallengeScreenV2: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<RhythmChallengeRouteProp>();
    const { questionId, onComplete } = route.params;
    const {theme} = useAppStyles();
    const styles = themeStyles;
    
    // API hooks
    const { data: question, isLoading: questionLoading } = useGetAudioQuestionQuery(questionId);
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
    const [timingWeight, setTimingWeight] = useState(0.7);
    const [soundWeight, setSoundWeight] = useState(0.3);
    
    const [countdownValue, setCountdownValue] = useState(3);
    const [listenCount, setListenCount] = useState(0);
    const [attemptCount, setAttemptCount] = useState(0);
    const [scoringResult, setScoringResult] = useState<EnhancedRhythmScoringResult | null>(null);
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
        if (!audioUrl) {
            Alert.alert('Error', 'Reference audio not available');
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
    }, [audioUrl, rhythmPattern]);
    
    const handleAudioEnd = useCallback(() => {
        setIsAudioPlaying(false);
        setCurrentBeatIndex(-1);
        setPhase('READY');
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
                'Not enough taps',
                'Please tap at least 2 times to submit.',
                [{ text: 'OK' }]
            );
            setPhase('READY');
            return;
        }
        
        if (!rhythmPattern) {
            Alert.alert('Error', 'Rhythm pattern not available');
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
            setError(err.message || 'Failed to score rhythm');
            setPhase('READY');
            Alert.alert('Error', 'Failed to score your rhythm. Please try again.');
        }
    }, [stopCapture, rhythmPattern, scoreRhythmTaps, questionId, question]);
    
    const handleAudioRecordingComplete = useCallback(async (audioFile: {uri: string; name: string; type: string}) => {
        setPhase('PROCESSING');
        
        try {
            const result = await scoreRhythmAudio({
                questionId,
                audioFile,
                enableSoundSimilarity,
                toleranceMs: 150,
            }).unwrap();
            
            setScoringResult(result);
            setPhase('RESULTS');
        } catch (err: any) {
            console.error('Scoring error:', err);
            Alert.alert('Error', 'Failed to score your recording');
            setPhase('READY');
        }
    }, [questionId, enableSoundSimilarity, scoreRhythmAudio]);
    
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
                    Tap Mode
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
                    Clap Mode
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
                    <Text style={styles.loadingText}>Loading challenge...</Text>
                </View>
            </SafeAreaView>
        );
    }
    
    if (!question) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error.main} />
                    <Text style={styles.errorText}>Question not found</Text>
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
                <Text style={styles.headerTitle}>Rhythm Challenge</Text>
                <View style={styles.attemptBadge}>
                    <Text style={styles.attemptText}>Attempt {attemptCount}</Text>
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
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Question Text */}
                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>{question.question}</Text>
                    {rhythmPattern && (
                        <Text style={styles.patternInfo}>
                            {rhythmPattern.totalBeats} beats • ~{rhythmPattern.estimatedBpm} BPM • {rhythmPattern.timeSignature}
                        </Text>
                    )}
                </View>
                
                {/* Phase-specific Content */}
                {phase === 'READY' && (
                    <View style={styles.readyContainer}>
                        {renderModeSelector()}
                        
                        {inputMode === 'AUDIO' && (
                            <SoundSimilarityToggle
                                enabled={enableSoundSimilarity}
                                onToggle={setEnableSoundSimilarity}
                                timingWeight={timingWeight}
                                soundWeight={soundWeight}
                                showWeights={true}
                            />
                        )}
                        
                        <RhythmBeatIndicators
                            beats={beatIndicators}
                            currentBeatIndex={-1}
                            mode="playback"
                        />
                        
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.listenButton} onPress={handlePlayReference}>
                                <MaterialCommunityIcons name="play-circle" size={32} color={theme.colors.text.inverse} />
                                <Text style={styles.listenButtonText}>
                                    Listen {listenCount > 0 ? `(${listenCount})` : ''}
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.startButton, listenCount === 0 && styles.startButtonDisabled]}
                                onPress={handleStartRecording}
                                disabled={listenCount === 0}
                            >
                                <MaterialCommunityIcons 
                                    name={inputMode === 'TAP' ? "gesture-tap" : "microphone"} 
                                    size={32} 
                                    color={theme.colors.text.inverse} 
                                />
                                <Text style={styles.startButtonText}>
                                    {inputMode === 'TAP' ? "Start Tapping" : "Start Recording"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        
                        {listenCount === 0 && (
                            <Text style={styles.hintText}>Listen to the pattern first!</Text>
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
                            <Text style={styles.playingText}>Playing pattern...</Text>
                        </View>
                    </View>
                )}
                
                {(phase === 'COUNTDOWN' || phase === 'RECORDING') && inputMode === 'TAP' && (
                    <>
                        {phase === 'COUNTDOWN' && (
                            <View style={styles.countdownContainer}>
                                <Text style={styles.countdownText}>{countdownValue}</Text>
                                <Text style={styles.countdownLabel}>Get ready!</Text>
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
                                    
                                    <TouchableOpacity style={styles.stopButton} onPress={handleStopTapRecording}>
                                        <MaterialCommunityIcons name="stop" size={32} color={theme.colors.text.inverse} />
                                        <Text style={styles.stopButtonText}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </>
                )}
                
                {(phase === 'COUNTDOWN' || phase === 'RECORDING' || (phase === 'PROCESSING' && inputMode === 'AUDIO')) && inputMode === 'AUDIO' && (
                    <View style={styles.audioRecorderContainer}>
                        <RhythmAudioRecorder
                            isActive={true} // Component handles internal phases
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
                        <ActivityIndicator size="large" color={theme.colors.success.main} />
                        <Text style={styles.processingText}>Analyzing your rhythm...</Text>
                    </View>
                )}
                
                {phase === 'RESULTS' && scoringResult && (
                    <EnhancedScoringResults
                        result={scoringResult}
                        onRetry={handleRetry}
                        onContinue={handleContinue}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.neutral.gray[900], // Dark background
    },
    scrollContent: {
        flexGrow: 1,
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
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.lg,
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
    modeSelectorContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.neutral.gray[800],
        borderRadius: theme.layout.borderRadius.lg,
        padding: 4,
        marginBottom: theme.spacing.lg,
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
        backgroundColor: theme.colors.neutral.gray[700],
    },
    modeButtonText: {
        color: theme.colors.text.secondary,
        fontWeight: '600',
        marginLeft: theme.spacing.sm,
    },
    modeButtonTextActive: {
        color: theme.colors.text.inverse,
    },
    readyContainer: {
        flex: 1,
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
    startButtonDisabled: {
        backgroundColor: theme.colors.neutral.gray[800],
        opacity: 0.5,
    },
    startButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: theme.spacing.sm,
    },
    hintText: {
        textAlign: 'center',
        color: theme.colors.warning.main,
        marginTop: theme.spacing.lg,
        fontSize: 14,
    },
    listeningContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
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
        padding: theme.spacing.xl,
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
        padding: theme.spacing.xl,
    },
    processingText: {
        color: theme.colors.text.secondary,
        fontSize: 18,
        marginTop: theme.spacing.lg,
    },
    audioRecorderContainer: {
        flex: 1,
    },
}));

export default RhythmChallengeScreenV2;
