import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';

import {useAppStyles} from '../../../shared/ui/hooks/useAppStyles';
import {QuizQuestion} from '../../../entities/QuizState/model/slice/quizApi';
import {AudioChallengeSubmission} from '../../../entities/AudioChallengeState/model/slice/audioChallengeApi';
import {AudioChallengeContainer} from '../../components/audio/AudioChallengeContainer';
import RhythmTapPad from '../../components/RhythmTapPad';
import RhythmBeatIndicators from '../../components/RhythmBeatIndicators';
import AudioChallengeScoreDisplay from '../../../components/AudioChallengeScoreDisplay';
import {useAudioSubmissionPolling} from '../../../hooks/useAudioSubmissionPolling';
import {useRhythmTapCapture} from '../../../hooks/useRhythmTapCapture';
import {useScoreRhythmTapsMutation} from '../../../entities/RhythmChallengeState/model/slice/rhythmApi';
import {AudioChallengeType} from '../../../types/audioChallenge.types';
import {BeatIndicator, RhythmPatternDTO} from '../../../types/rhythmChallenge.types';

interface AudioChallengeScoringPhaseProps {
    question: QuizQuestion;
    onSubmissionComplete: (submission: AudioChallengeSubmission) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

type AudioSubPhase = 'ready' | 'listening' | 'performing' | 'processing' | 'completed';

export const AudioChallengeScoringPhase: React.FC<AudioChallengeScoringPhaseProps> = ({
                                                                      question,
                                                                      onSubmissionComplete,
                                                                      onCancel,
                                                                      isSubmitting: isExternalSubmitting,
                                                                  }) => {
    const {t} = useTranslation();
    const {theme} = useAppStyles();

    const [subPhase, setSubPhase] = useState<AudioSubPhase>('ready');
    const [localSubmission, setLocalSubmission] = useState<AudioChallengeSubmission | null>(null);

    const challengeType = question.audioChallengeType as AudioChallengeType;
    const isRhythm = challengeType === AudioChallengeType.RHYTHM_CREATION ||
        challengeType === AudioChallengeType.RHYTHM_REPEAT;

    // Polling hook for audio recordings
    const {
        submit: submitRecording,
        submission: polledSubmission,
        isSubmitting: isInternalSubmitting,
        isPolling,
        isComplete,
        error: pollingError
    } = useAudioSubmissionPolling({
        onComplete: (sub) => {
            setLocalSubmission(sub);
            setSubPhase('completed');
        }
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
    } = useRhythmTapCapture({maxDuration: 30000});

    const [scoreRhythmTaps, {isLoading: isScoringTaps}] = useScoreRhythmTapsMutation();

    // Parse rhythm pattern if available
    const rhythmPattern: RhythmPatternDTO | null = useMemo(() => {
        if (!question.audioChallengeConfig) return null;
        try {
            return JSON.parse(question.audioChallengeConfig);
        } catch {
            return null;
        }
    }, [question.audioChallengeConfig]);

    // Build beat indicators for rhythm challenges
    const beatIndicators: BeatIndicator[] = useMemo(() => {
        if (!rhythmPattern) return [];
        return rhythmPattern.onsetTimesMs.map((time, index) => ({
            index,
            expectedTimeMs: time,
            status: 'pending' as const,
        }));
    }, [rhythmPattern]);

    // Handle audio recording completion (for SOUND_MATCH, SINGING, or AUDIO-based RHYTHM)
    const handleAudioRecordingComplete = useCallback(async (audioFile: { uri: string; name: string; type: string }) => {
        setSubPhase('processing');
        await submitRecording(question.id, audioFile);
    }, [question.id, submitRecording]);

    // Handle rhythm tap completion
    const handleStopTapping = useCallback(async () => {
        const timestamps = stopCapture();

        if (timestamps.length < 2) {
            Alert.alert(
                t('audioGamePlay.notEnoughTaps'),
                t('audioGamePlay.minTapsRequired'),
                [{text: 'OK', onPress: () => setSubPhase('ready')}]
            );
            return;
        }

        setSubPhase('processing');

        try {
            // For MVP, we use the direct rhythm scoring API
            // In a real flow, we might want to also "submit" this to the audio_submissions table
            // but if we only have taps (no audio), the current backend expects an audio file.
            // So we'll map the direct result to a partial AudioChallengeSubmission for display.

            const result = await scoreRhythmTaps({
                questionId: question.id,
                referencePattern: rhythmPattern!,
                userOnsetTimesMs: timestamps,
                toleranceMs: 150,
                minimumScoreRequired: question.minimumScorePercentage || 60,
            }).unwrap();

            const mockSubmission: AudioChallengeSubmission = {
                id: Math.random(), // Temporary
                questionId: question.id,
                userId: 0, // Should be from auth
                processingStatus: 'COMPLETED',
                processingProgress: 100,
                overallScore: result.overallScore,
                rhythmScore: result.overallScore,
                passed: result.passed,
                minimumScoreRequired: question.minimumScorePercentage || 60,
                createdAt: new Date().toISOString(),
                processedAt: new Date().toISOString(),
            };

            setLocalSubmission(mockSubmission);
            setSubPhase('completed');
        } catch (err) {
            console.error('Rhythm scoring failed:', err);
            Alert.alert('Error', 'Failed to score rhythm');
            setSubPhase('ready');
        }
    }, [stopCapture, t, scoreRhythmTaps, question.id, rhythmPattern, question.minimumScorePercentage]);

    const handleStartPerforming = useCallback(() => {
        if (isRhythm) {
            setSubPhase('performing');
            startCapture();
        } else {
            setSubPhase('performing');
        }
    }, [isRhythm, startCapture]);

    const handleFinish = useCallback(() => {
        if (localSubmission) {
            onSubmissionComplete(localSubmission);
        }
    }, [localSubmission, onSubmissionComplete]);

    // Auto-start listening for RHYTHM_REPEAT or SOUND_MATCH/SINGING if needed
    useEffect(() => {
        if (subPhase === 'ready' && challengeType === AudioChallengeType.RHYTHM_REPEAT) {
            // We could auto-transition to listening here
        }
    }, [subPhase, challengeType]);

    const isSubmitting = isExternalSubmitting || isInternalSubmitting || isPolling || isScoringTaps;

    // RENDER PHASES

    if (subPhase === 'completed' && localSubmission) {
        return (
            <View style={styles.container}>
                <AudioChallengeScoreDisplay submission={localSubmission}/>
                <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
                    <Text style={styles.finishButtonText}>{t('common.continue')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (subPhase === 'processing') {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={theme.colors.primary.main}/>
                <Text style={styles.processingText}>{t('audioGamePlay.processing')}</Text>
                {pollingError && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{pollingError}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => setSubPhase('ready')}>
                            <Text style={styles.retryButtonText}>{t('audioGamePlay.tryAgain')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{question.question}</Text>

            {isRhythm ? (
                <View style={styles.rhythmContainer}>
                    {challengeType === AudioChallengeType.RHYTHM_REPEAT && (
                        <RhythmBeatIndicators
                            beats={beatIndicators}
                            mode={subPhase === 'performing' ? 'recording' : 'playback'}
                        />
                    )}

                    {subPhase === 'ready' ? (
                        <View style={styles.readyContainer}>
                            <Text style={styles.instructionText}>
                                {challengeType === AudioChallengeType.RHYTHM_REPEAT
                                    ? t('audioGamePlay.rhythmListenFirst')
                                    : t('audioGamePlay.rhythmReady')}
                            </Text>
                            <TouchableOpacity style={styles.startButton} onPress={handleStartPerforming}>
                                <MaterialCommunityIcons name="play-circle" size={48} color={theme.colors.success.main}/>
                                <Text style={styles.startButtonText}>{t('common.start')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.performingContainer}>
                            <RhythmTapPad
                                isActive={isCapturing}
                                onTap={recordTap}
                                tapCount={tapCount}
                                totalExpectedTaps={rhythmPattern?.totalBeats}
                            />
                            <TouchableOpacity style={styles.stopButton} onPress={handleStopTapping}>
                                <MaterialCommunityIcons name="stop-circle" size={48} color={theme.colors.error.main}/>
                                <Text style={styles.stopButtonText}>{t('common.done')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            ) : (
                subPhase === 'ready' ? (
                    <View style={styles.readyContainer}>
                        <AudioChallengeContainer
                            question={{
                                ...question,
                                audioChallengeType: challengeType
                            }}
                            mode="preview"
                        />
                        <TouchableOpacity style={styles.startButton} onPress={handleStartPerforming}>
                            <MaterialCommunityIcons name="play-circle" size={48} color={theme.colors.success.main}/>
                            <Text style={styles.startButtonText}>{t('common.start')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <AudioChallengeContainer
                        question={{
                            ...question,
                            audioChallengeType: challengeType
                        }}
                        mode="record"
                        onRecordingComplete={handleAudioRecordingComplete}
                        disabled={isSubmitting}
                    />
                )
            )}

            {!isSubmitting && subPhase !== 'performing' && (
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    centered: {
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#333',
    },
    instructionText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    processingText: {
        marginTop: 20,
        fontSize: 18,
        color: '#666',
    },
    rhythmContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    readyContainer: {
        alignItems: 'center',
    },
    performingContainer: {
        width: '100%',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startButton: {
        alignItems: 'center',
    },
    startButtonText: {
        marginTop: 10,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    stopButton: {
        alignItems: 'center',
        marginTop: 20,
    },
    stopButtonText: {
        marginTop: 5,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#F44336',
    },
    finishButton: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
    },
    finishButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelButton: {
        padding: 15,
        alignItems: 'center',
        marginTop: 20,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
    },
    errorContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    errorText: {
        color: '#F44336',
        marginBottom: 10,
    },
    retryButton: {
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    retryButtonText: {
        color: '#333',
    }
});
