// src/screens/RhythmChallengeScreen.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video, { VideoRef } from 'react-native-video';

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
    const navigation = useNavigation();
    const route = useRoute<RhythmChallengeRouteProp>();
    const { questionId, onComplete } = route.params;
    
    // API hooks
    const { data: question, isLoading: questionLoading } = useGetAudioQuestionQuery(questionId);
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
        if (!question?.mediaUrl) return null;
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
            setError(err.message || 'Failed to score rhythm');
            setPhase('READY');
            Alert.alert('Error', 'Failed to score your rhythm. Please try again.');
        }
    }, [stopCapture, rhythmPattern, scoreRhythm, questionId, question]);
    
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
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading challenge...</Text>
                </View>
            </SafeAreaView>
        );
    }
    
    if (!question) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color="#F44336" />
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
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
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
                    <RhythmBeatIndicators
                        beats={beatIndicators}
                        currentBeatIndex={-1}
                        mode="playback"
                    />
                    
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.listenButton} onPress={handlePlayReference}>
                            <MaterialCommunityIcons name="play-circle" size={32} color="#fff" />
                            <Text style={styles.listenButtonText}>
                                Listen {listenCount > 0 ? `(${listenCount})` : ''}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.startButton, listenCount === 0 && styles.startButtonDisabled]}
                            onPress={handleStartRecording}
                            disabled={listenCount === 0}
                        >
                            <MaterialCommunityIcons name="gesture-tap" size={32} color="#fff" />
                            <Text style={styles.startButtonText}>Start Tapping</Text>
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
                        <MaterialCommunityIcons name="volume-high" size={48} color="#4CAF50" />
                        <Text style={styles.playingText}>Playing pattern...</Text>
                    </View>
                </View>
            )}
            
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
                        
                        <TouchableOpacity style={styles.stopButton} onPress={handleStopRecording}>
                            <MaterialCommunityIcons name="stop" size={32} color="#fff" />
                            <Text style={styles.stopButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            
            {phase === 'PROCESSING' && (
                <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.processingText}>Analyzing your rhythm...</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#888',
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#F44336',
        marginTop: 16,
        fontSize: 18,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
    },
    attemptBadge: {
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    attemptText: {
        color: '#888',
        fontSize: 12,
    },
    questionContainer: {
        padding: 20,
        alignItems: 'center',
    },
    questionText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    patternInfo: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
    },
    readyContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
        gap: 16,
    },
    listenButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2196F3',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
    },
    listenButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
    },
    startButtonDisabled: {
        backgroundColor: '#333',
        opacity: 0.5,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    hintText: {
        textAlign: 'center',
        color: '#FFC107',
        marginTop: 16,
        fontSize: 14,
    },
    listeningContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playingIndicator: {
        alignItems: 'center',
        marginTop: 32,
    },
    playingText: {
        color: '#4CAF50',
        fontSize: 18,
        marginTop: 8,
    },
    countdownContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 120,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    countdownLabel: {
        fontSize: 24,
        color: '#888',
        marginTop: 16,
    },
    recordingContainer: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 20,
    },
    recordingControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    durationText: {
        fontSize: 24,
        color: '#888',
        fontFamily: 'monospace',
    },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F44336',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    stopButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    processingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: '#888',
        fontSize: 18,
        marginTop: 16,
    },
});

export default RhythmChallengeScreen;
