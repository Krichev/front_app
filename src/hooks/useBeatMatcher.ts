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
  difficulty?: string;
  minimumScorePercentage?: number;
  toleranceMs?: number;     // legacy flat tolerance
}

/**
 * Mirror of Karaoke tiered scoring thresholds
 */
export const computeClientTiers = (difficulty: string = 'MEDIUM', minimumScorePercentage: number = 60) => {
  // Base tiers: EASY [150, 250, 400], MEDIUM [100, 200, 300], HARD [80, 150, 250]
  const baseTiers: Record<string, number[]> = {
    'EASY': [150, 250, 400],
    'MEDIUM': [100, 200, 300],
    'HARD': [80, 150, 250]
  };

  const tiers = baseTiers[difficulty] || baseTiers['MEDIUM'];
  
  // Multiplier: 1 - (minimumScorePercentage - 50) / 200, clamped to [0.75, 1.2]
  const multiplier = Math.max(0.75, Math.min(1.2, 1 - (minimumScorePercentage - 50) / 200));
  
  return {
    perfectMs: tiers[0] * multiplier,
    goodMs: tiers[1] * multiplier,
    okMs: tiers[2] * multiplier
  };
};

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
  const { referencePattern, difficulty, minimumScorePercentage = 60, toleranceMs } = options;

  const tiers = useMemo(() => {
    if (difficulty) {
      return computeClientTiers(difficulty, minimumScorePercentage);
    }
    // Fallback to legacy toleranceMs or default
    const flatTol = toleranceMs || 150;
    return {
      perfectMs: flatTol * 0.5,
      goodMs: flatTol * 0.8,
      okMs: flatTol
    };
  }, [difficulty, minimumScorePercentage, toleranceMs]);

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
      let tier: BeatIndicator['tier'];

      // Determine tiered status
      if (absError <= tiers.perfectMs) {
        status = 'hit';
        tier = 'PERFECT';
        // 90-100 range
        score = 100 - (absError / tiers.perfectMs * 10);
      } else if (absError <= tiers.goodMs) {
        status = 'hit';
        tier = 'GOOD';
        // 70-90 range
        const progress = (absError - tiers.perfectMs) / (tiers.goodMs - tiers.perfectMs);
        score = 90 - (progress * 20);
      } else if (absError <= tiers.okMs) {
        status = 'hit';
        tier = 'OK';
        // 30-70 range
        const progress = (absError - tiers.goodMs) / (tiers.okMs - tiers.goodMs);
        score = 70 - (progress * 40);
      } else {
        tier = 'MISS';
        score = Math.max(0, 30 - (absError / (tiers.okMs * 2) * 30));
        if (error < 0) {
          status = 'early';
        } else {
          status = 'late';
        }
      }

      const updatedBeats = [...prev];
      updatedBeats[nearestIndex] = {
        ...updatedBeats[nearestIndex],
        actualTimeMs: timestampMs,
        error,
        score,
        status,
        tier,
      };

      console.log(`🎯 [BeatMatcher] Match: Beat ${nearestIndex}, Error: ${Math.round(error)}ms, Status: ${status}, Tier: ${tier}, Score: ${Math.round(score)}`);
      return updatedBeats;
    });
  }, [tiers]);

  /**
   * Marks all remaining 'pending' beats as 'missed' when recording stops.
   * Returns the final state synchronously.
   */
  const finalizeBeats = useCallback(() => {
    const final = beatIndicators.map(beat => 
      beat.status === 'pending' 
        ? { ...beat, status: 'missed' as const, tier: 'MISS' as const, score: 0 } 
        : beat
    );
    setBeatIndicators(final);
    return final;
  }, [beatIndicators]);

  /**
   * Computes comprehensive timing statistics from the beat indicators.
   */
  const computeTimingScore = useCallback((finalIndicators?: BeatIndicator[], minScorePct: number = 60): ClientTimingScore => {
    const beats = finalIndicators || beatIndicators;
    
    const perBeatScores = beats.map(b => b.score ?? 0);
    const timingErrorsMs = beats.map(b => b.error ?? 0);
    
    // We only consider errors for beats that were actually attempted (hit, early, late)
    const attemptedBeats = beats.filter(b => b.status !== 'pending' && b.status !== 'missed');
    const absoluteErrorsMs = attemptedBeats.map(b => Math.abs(b.error ?? 0));
    
    const perfectBeats = beats.filter(b => b.tier === 'PERFECT').length;
    const goodBeats = beats.filter(b => b.tier === 'GOOD').length;
    const okBeats = beats.filter(b => b.tier === 'OK').length;
    const missedBeats = beats.filter(b => b.tier === 'MISS' || b.status === 'missed' || b.status === 'pending').length;

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
      passed: overallScore >= minScorePct
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
