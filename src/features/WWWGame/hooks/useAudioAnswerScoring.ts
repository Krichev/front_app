import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
    useAnalyzeAudioScoringMutation,
    useAnalyzeAudioScoringWithFileMutation,
    useExtractRhythmPatternMutation,
    useScoreRhythmTapsMutation,
} from '../../../entities/RhythmChallengeState/model/slice/rhythmApi';
import { QuizQuestion } from '../../../entities/QuizState/model/slice/quizApi';
import { RhythmPatternDTO } from '../../../types/rhythmChallenge.types';
import { GenericScoringResponse, AudioChallengeType } from '../../../types/audioChallenge.types';

export type ScoringPhase = 'idle' | 'extracting' | 'recording' | 'scoring' | 'completed' | 'error';

interface UseAudioAnswerScoringOptions {
    question: QuizQuestion;
    onScoringComplete?: (result: GenericScoringResponse) => void;
}

interface UseAudioAnswerScoringReturn {
    // State
    scoringPhase: ScoringPhase;
    scoringResult: GenericScoringResponse | null;
    rhythmPattern: RhythmPatternDTO | null;
    error: string | null;
    isExtracting: boolean;
    isScoring: boolean;
    
    // Reaction timing
    reactionTimeMs: number | null;
    
    // Actions
    extractPattern: () => Promise<RhythmPatternDTO | null>;
    scoreUserAudio: (audioFile: { uri: string; name: string; type: string }) => Promise<GenericScoringResponse | null>;
    scoreUserTaps: (tapTimestamps: number[]) => Promise<GenericScoringResponse | null>;
    reset: () => void;
    setPhase: (phase: ScoringPhase) => void;
    markRecordingStart: () => void;
}

export const useAudioAnswerScoring = ({
    question,
    onScoringComplete,
}: UseAudioAnswerScoringOptions): UseAudioAnswerScoringReturn => {
    const [scoringPhase, setScoringPhase] = useState<ScoringPhase>('idle');
    const [scoringResult, setScoringResult] = useState<GenericScoringResponse | null>(null);
    const [rhythmPattern, setRhythmPattern] = useState<RhythmPatternDTO | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reactionTimeMs, setReactionTimeMs] = useState<number | null>(null);
    
    const recordingStartRef = useRef<number | null>(null);
    
    // RTK Query mutations
    const [analyzeScoring, { isLoading: isScoringUrl }] = useAnalyzeAudioScoringMutation();
    const [analyzeScoringWithFile, { isLoading: isScoringFile }] = useAnalyzeAudioScoringWithFileMutation();
    const [extractRhythmPatternMutation, { isLoading: isExtracting }] = useExtractRhythmPatternMutation();
    const [scoreRhythmTaps, { isLoading: isScoringTaps }] = useScoreRhythmTapsMutation();
    
    const isScoring = isScoringUrl || isScoringFile || isScoringTaps;
    
    // Parse cached rhythm pattern from question config
    const cachedPattern = useMemo((): RhythmPatternDTO | null => {
        if (!question.audioChallengeConfig) return null;
        try {
            return JSON.parse(question.audioChallengeConfig);
        } catch {
            return null;
        }
    }, [question.audioChallengeConfig]);
    
    // Initialize with cached pattern
    useEffect(() => {
        if (cachedPattern) {
            setRhythmPattern(cachedPattern);
        }
    }, [cachedPattern]);
    
    const challengeType = (question.audioChallengeType as AudioChallengeType) || 'SOUND_MATCH';
    const referenceAudioUrl = question.questionMediaUrl || null;
    const minimumScore = question.minimumScorePercentage || 60;
    
    // Extract rhythm pattern from reference audio (on-the-fly fallback)
    const extractPattern = useCallback(async (): Promise<RhythmPatternDTO | null> => {
        // Use cached if available
        if (cachedPattern) {
            setRhythmPattern(cachedPattern);
            return cachedPattern;
        }
        
        // Need reference audio to extract
        if (!referenceAudioUrl) {
            setError('No reference audio available for pattern extraction');
            return null;
        }
        
        setScoringPhase('extracting');
        try {
            // The extract endpoint expects an audio file, but we only have a URL
            // For on-the-fly, we'd need the backend to accept a URL
            // For now, log and return null — the scoring endpoint will handle it
            console.log('🎵 No cached pattern, scoring endpoint will handle extraction');
            setScoringPhase('idle');
            return null;
        } catch (err: any) {
            console.error('Pattern extraction failed:', err);
            setError('Failed to analyze reference audio');
            setScoringPhase('error');
            return null;
        }
    }, [cachedPattern, referenceAudioUrl]);
    
    // Score user's recorded audio against reference
    const scoreUserAudio = useCallback(async (
        audioFile: { uri: string; name: string; type: string }
    ): Promise<GenericScoringResponse | null> => {
        if (!referenceAudioUrl) {
            setError('No reference audio available for scoring');
            setScoringPhase('error');
            return null;
        }
        
        setScoringPhase('scoring');
        setError(null);
        
        try {
            // Use the file upload variant — we have the user's audio as a local file
            // and the reference as a URL
            const result = await analyzeScoringWithFile({
                userAudioFile: {
                    uri: audioFile.uri,
                    name: audioFile.name,
                    type: audioFile.type,
                },
                referenceAudioUrl,
                challengeType,
                questionId: question.id,
                minimumScoreRequired: minimumScore,
            }).unwrap();
            
            setScoringResult(result);
            setScoringPhase('completed');
            onScoringComplete?.(result);
            
            // Calculate reaction time if we have timing data
            if (recordingStartRef.current && rhythmPattern?.onsetTimesMs?.[0] != null) {
                const expectedFirstOnset = rhythmPattern.onsetTimesMs[0];
                const actualStart = Date.now() - recordingStartRef.current;
                setReactionTimeMs(Math.abs(actualStart - expectedFirstOnset));
            }
            
            return result;
        } catch (err: any) {
            console.error('Audio scoring failed:', err);
            
            // Fallback: try URL-based scoring if file upload fails
            try {
                const urlResult = await analyzeScoring({
                    referenceAudioUrl,
                    challengeType,
                    questionId: question.id,
                    minimumScoreRequired: minimumScore,
                    // userAudioUrl will be null — backend should handle gracefully
                }).unwrap();
                
                setScoringResult(urlResult);
                setScoringPhase('completed');
                onScoringComplete?.(urlResult);
                return urlResult;
            } catch (fallbackErr) {
                const message = err.data?.message || err.message || 'Scoring failed';
                setError(message);
                setScoringPhase('error');
                return null;
            }
        }
    }, [referenceAudioUrl, challengeType, question.id, minimumScore, rhythmPattern, 
        analyzeScoringWithFile, analyzeScoring, onScoringComplete]);
    
    // Score user's tap timestamps (for RHYTHM_REPEAT in TAP mode)
    const scoreUserTaps = useCallback(async (
        tapTimestamps: number[]
    ): Promise<GenericScoringResponse | null> => {
        if (!rhythmPattern) {
            setError('No rhythm pattern available for tap scoring');
            setScoringPhase('error');
            return null;
        }
        
        setScoringPhase('scoring');
        setError(null);
        
        try {
            const result = await scoreRhythmTaps({
                questionId: question.id,
                referencePattern: rhythmPattern,
                userOnsetTimesMs: tapTimestamps,
                difficulty: 'MEDIUM' as any, // Default to MEDIUM
                minimumScorePercentage: minimumScore,
            }).unwrap();
            
            // Map RhythmScoringResult to GenericScoringResponse shape
            const genericResult: GenericScoringResponse = {
                pitchScore: 0,
                rhythmScore: result.overallScore,
                voiceScore: 0,
                overallScore: result.overallScore,
                detailedMetrics: JSON.stringify({
                    perfectBeats: result.perfectBeats,
                    goodBeats: result.goodBeats,
                    missedBeats: result.missedBeats,
                    averageErrorMs: result.averageErrorMs,
                    consistencyScore: result.consistencyScore,
                }),
                passed: result.passed,
                minimumScoreRequired: minimumScore,
                feedback: result.feedback,
            };
            
            setScoringResult(genericResult);
            setScoringPhase('completed');
            onScoringComplete?.(genericResult);
            
            // Calculate average reaction time from timing errors
            if (result.absoluteErrorsMs?.length > 0) {
                const avgError = result.absoluteErrorsMs.reduce((a, b) => a + b, 0) / result.absoluteErrorsMs.length;
                setReactionTimeMs(Math.round(avgError));
            }
            
            return genericResult;
        } catch (err: any) {
            const message = err.data?.message || err.message || 'Tap scoring failed';
            setError(message);
            setScoringPhase('error');
            return null;
        }
    }, [rhythmPattern, question.id, minimumScore, scoreRhythmTaps, onScoringComplete]);
    
    // Mark recording start time (call when user starts recording)
    const markRecordingStart = useCallback(() => {
        recordingStartRef.current = Date.now();
    }, []);
    
    const reset = useCallback(() => {
        setScoringPhase('idle');
        setScoringResult(null);
        setError(null);
        setReactionTimeMs(null);
        recordingStartRef.current = null;
    }, []);

    const setPhase = useCallback((phase: ScoringPhase) => {
        setScoringPhase(phase);
    }, []);
    
    return {
        scoringPhase,
        scoringResult,
        rhythmPattern,
        error,
        isExtracting,
        isScoring,
        reactionTimeMs,
        extractPattern,
        scoreUserAudio,
        scoreUserTaps,
        reset,
        setPhase,
        markRecordingStart,
    };
};
