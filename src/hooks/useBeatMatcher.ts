import { useState, useCallback, useMemo, useEffect } from 'react';
import { RhythmPatternDTO, BeatIndicator } from '../types/rhythmChallenge.types';

export interface ClientTimingScore {
  overallScore: number;
  perBeatScores: number[];
  timingErrorsMs: number[];
  absoluteErrorsMs: number[];
  perfectBeats: number;
  goodBeats: number;
  missedBeats: number;
  averageErrorMs: number;
  maxErrorMs: number;
  consistencyScore: number;
  passed: boolean;
}

interface UseBeatMatcherOptions {
  referencePattern: RhythmPatternDTO | null;
  toleranceMs?: number;     // default 150
}

interface UseBeatMatcherReturn {
  beatIndicators: BeatIndicator[];
  matchOnset: (timestampMs: number) => void;
  finalizeBeats: () => BeatIndicator[];
  computeTimingScore: (finalIndicators?: BeatIndicator[], minimumScorePercentage?: number) => ClientTimingScore;
  resetBeats: () => void;
}

/**
 * Hook for matching detected sound onsets to expected rhythm pattern beats.
 * Shared between TAP and AUDIO input modes for real-time visual feedback.
 */
export const useBeatMatcher = (options: UseBeatMatcherOptions): UseBeatMatcherReturn => {
  const { referencePattern, toleranceMs = 150 } = options;

  const initialBeats = useMemo(() => {
    if (!referencePattern) return [];
    return referencePattern.onsetTimesMs.map((time, index) => ({
      index,
      expectedTimeMs: time,
      status: 'pending' as const,
    }));
  }, [referencePattern]);

  const [beatIndicators, setBeatIndicators] = useState<BeatIndicator[]>(initialBeats);

  // Re-initialize when pattern changes
  useEffect(() => {
    setBeatIndicators(initialBeats);
  }, [initialBeats]);

  const resetBeats = useCallback(() => {
    setBeatIndicators(initialBeats);
  }, [initialBeats]);

  /**
   * Matches an incoming onset timestamp to the nearest pending beat.
   */
  const matchOnset = useCallback((timestampMs: number) => {
    setBeatIndicators(prev => {
      // Find the nearest unmatched beat
      let nearestIndex = -1;
      let minDiff = Infinity;

      for (let i = 0; i < prev.length; i++) {
        if (prev[i].status === 'pending') {
          const diff = Math.abs(prev[i].expectedTimeMs - timestampMs);
          if (diff < minDiff) {
            minDiff = diff;
            nearestIndex = i;
          }
        }
      }

      // If no pending beats remain, ignore extra onset
      if (nearestIndex === -1) return prev;

      const expectedTimeMs = prev[nearestIndex].expectedTimeMs;
      const error = timestampMs - expectedTimeMs;
      const absError = Math.abs(error);

      let status: BeatIndicator['status'];
      let score: number;

      // Determine hit/early/late status based on tolerance
      if (absError <= toleranceMs) {
        status = 'hit';
        // Linear scoring from 100 at 0ms error to 0 at toleranceMs error
        score = Math.max(0, 100 - (absError / toleranceMs * 100));
      } else if (error < 0) {
        status = 'early';
        score = 0;
      } else {
        status = 'late';
        score = 0;
      }

      const updatedBeats = [...prev];
      updatedBeats[nearestIndex] = {
        ...updatedBeats[nearestIndex],
        actualTimeMs: timestampMs,
        error,
        score,
        status,
      };

      console.log(`🎯 [BeatMatcher] Match: Beat ${nearestIndex}, Error: ${Math.round(error)}ms, Status: ${status}, Score: ${Math.round(score)}`);
      return updatedBeats;
    });
  }, [toleranceMs]);

  /**
   * Marks all remaining 'pending' beats as 'missed' when recording stops.
   * Returns the final state synchronously.
   */
  const finalizeBeats = useCallback(() => {
    const final = beatIndicators.map(beat => 
      beat.status === 'pending' 
        ? { ...beat, status: 'missed' as const, score: 0 } 
        : beat
    );
    setBeatIndicators(final);
    console.log('🎯 [BeatMatcher] Finalized beats summary:', {
      hits: final.filter(b => b.status === 'hit').length,
      missed: final.filter(b => b.status === 'missed').length,
      early: final.filter(b => b.status === 'early').length,
      late: final.filter(b => b.status === 'late').length,
    });
    return final;
  }, [beatIndicators]);

  /**
   * Computes comprehensive timing statistics from the beat indicators.
   */
  const computeTimingScore = useCallback((finalIndicators?: BeatIndicator[], minimumScorePercentage: number = 60): ClientTimingScore => {
    const beats = finalIndicators || beatIndicators;
    
    const perBeatScores = beats.map(b => b.score ?? 0);
    const timingErrorsMs = beats.map(b => b.error ?? 0);
    
    // We only consider errors for beats that were actually attempted (hit, early, late)
    const attemptedBeats = beats.filter(b => b.status !== 'pending' && b.status !== 'missed');
    const absoluteErrorsMs = attemptedBeats.map(b => Math.abs(b.error ?? 0));
    
    const perfectBeats = perBeatScores.filter(s => s >= 90).length;
    const goodBeats = perBeatScores.filter(s => s >= 50 && s < 90).length;
    const missedBeats = beats.filter(b => b.status === 'missed' || b.status === 'pending').length;

    const averageErrorMs = absoluteErrorsMs.length > 0 
      ? absoluteErrorsMs.reduce((a, b) => a + b, 0) / absoluteErrorsMs.length 
      : 0;
    
    const maxErrorMs = absoluteErrorsMs.length > 0 ? Math.max(...absoluteErrorsMs) : 0;

    // Consistency score: 100 - stddev of absolute errors
    let consistencyScore = 100;
    if (absoluteErrorsMs.length > 1) {
      const mean = absoluteErrorsMs.reduce((a, b) => a + b, 0) / absoluteErrorsMs.length;
      const squareDiffs = absoluteErrorsMs.map(v => Math.pow(v - mean, 2));
      const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / absoluteErrorsMs.length);
      consistencyScore = Math.max(0, Math.min(100, 100 - stdDev));
    }

    const overallScore = perBeatScores.length > 0
      ? perBeatScores.reduce((a, b) => a + b, 0) / perBeatScores.length
      : 0;

    return {
      overallScore,
      perBeatScores,
      timingErrorsMs,
      absoluteErrorsMs,
      perfectBeats,
      goodBeats,
      missedBeats,
      averageErrorMs,
      maxErrorMs,
      consistencyScore,
      passed: overallScore >= minimumScorePercentage
    };
  }, [beatIndicators]);

  return {
    beatIndicators,
    matchOnset,
    finalizeBeats,
    computeTimingScore,
    resetBeats,
  };
};
