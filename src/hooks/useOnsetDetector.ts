import { useRef, useState, useCallback } from 'react';
import { Buffer } from 'buffer';

interface UseOnsetDetectorOptions {
  sensitivity: 'percussive' | 'tonal';
  sampleRate?: number;            // default 44100
  bufferLatencyMs?: number;       // default 70, subtracted from detected onset time
  onOnsetDetected: (timestampMs: number) => void;  // callback for each detected onset
}

interface UseOnsetDetectorReturn {
  processAudioChunk: (base64Data: string) => void;  // feed PCM chunks from AudioRecord
  calibrateNoiseFloor: (base64Data: string) => void; // feed chunks during countdown for noise floor
  startDetection: () => void;                         // resets state, starts timing
  stopDetection: () => number[];                      // returns all detected onset timestamps
  resetDetection: () => void;
  onsetCount: number;
  isDetecting: boolean;
  noiseFloorDb: number;
}

/**
 * Hook for real-time sound onset detection from PCM audio stream.
 * Uses a rolling RMS threshold algorithm.
 */
export const useOnsetDetector = (options: UseOnsetDetectorOptions): UseOnsetDetectorReturn => {
  const {
    sensitivity,
    sampleRate = 44100,
    bufferLatencyMs = 70,
    onOnsetDetected
  } = options;

  const [onsetCount, setOnsetCount] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [noiseFloorRms, setNoiseFloorRms] = useState(0.01);

  const sampleCounterRef = useRef<number>(0);
  const lastOnsetTimeRef = useRef<number>(0);
  const detectedOnsetsRef = useRef<number[]>([]);
  
  // Rolling RMS buffer for adaptive thresholding
  const rollingRmsBuffer = useRef<number[]>([]);
  const ROLLING_BUFFER_SIZE = 6;
  
  // Calibration storage
  const calibrationSamples = useRef<number[]>([]);

  const resetDetection = useCallback(() => {
    sampleCounterRef.current = 0;
    lastOnsetTimeRef.current = 0;
    detectedOnsetsRef.current = [];
    rollingRmsBuffer.current = [];
    setOnsetCount(0);
    setIsDetecting(false);
  }, []);

  /**
   * Samples audio during countdown to establish ambient noise level
   */
  const calibrateNoiseFloor = useCallback((base64Data: string) => {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const pcmData = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
      
      if (pcmData.length === 0) return;

      let sumSquares = 0;
      for (let i = 0; i < pcmData.length; i++) {
        const normalized = pcmData[i] / 32768.0;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / pcmData.length);
      calibrationSamples.current.push(rms);
    } catch (error) {
      console.warn('🎤 [OnsetDetector] Calibration chunk failed:', error);
    }
  }, []);

  const startDetection = useCallback(() => {
    resetDetection();
    
    // Set noise floor from calibration samples
    if (calibrationSamples.current.length > 0) {
      const meanRms = calibrationSamples.current.reduce((a, b) => a + b, 0) / calibrationSamples.current.length;
      const calibratedValue = meanRms * 1.5; // Add 50% headroom
      setNoiseFloorRms(calibratedValue);
      console.log(`🎤 [OnsetDetector] Noise floor calibrated: ${calibratedValue.toFixed(6)} (from ${calibrationSamples.current.length} samples)`);
      calibrationSamples.current = [];
    } else {
      setNoiseFloorRms(0.01);
      console.log('🎤 [OnsetDetector] Using default noise floor: 0.01');
    }
    
    setIsDetecting(true);
    console.log(`🎤 [OnsetDetector] Detection started. Sensitivity: ${sensitivity}`);
  }, [resetDetection, sensitivity]);

  /**
   * Core onset detection logic run on every audio chunk
   */
  const processAudioChunk = useCallback((base64Data: string) => {
    // We keep processing sample counter even if not detecting to maintain timeline sync if needed,
    // but the requirement says timestamps are relative to startDetection.
    // However, AudioRecord keeps streaming, so we must be careful.
    
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const pcmData = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
      const numSamples = pcmData.length;

      if (!isDetecting) {
        // If not detecting, we don't process, but we might need to track sampleCounter 
        // if the recording already started. In our flow, startDetection is called 
        // at the end of countdown.
        return;
      }

      // 1. Compute RMS of the current frame
      let sumSquares = 0;
      for (let i = 0; i < numSamples; i++) {
        const normalized = pcmData[i] / 32768.0;
        sumSquares += normalized * normalized;
      }
      const currentRms = Math.sqrt(sumSquares / numSamples);

      // 2. Update Rolling Average
      rollingRmsBuffer.current.push(currentRms);
      if (rollingRmsBuffer.current.length > ROLLING_BUFFER_SIZE) {
        rollingRmsBuffer.current.shift();
      }
      const rollingAverage = rollingRmsBuffer.current.reduce((a, b) => a + b, 0) / rollingRmsBuffer.current.length;

      // 3. Determine Dynamic Threshold
      const multiplier = sensitivity === 'percussive' ? 2.0 : 1.4;
      const threshold = rollingAverage * multiplier + noiseFloorRms;

      // 4. Check for Onset
      if (currentRms > threshold) {
        const timestampMs = (sampleCounterRef.current / sampleRate * 1000) - bufferLatencyMs;
        const minIntervalMs = sensitivity === 'percussive' ? 80 : 150;

        // Debounce and ignore negative timestamps (latency compensation)
        if (timestampMs - lastOnsetTimeRef.current > minIntervalMs && timestampMs > 0) {
          detectedOnsetsRef.current.push(timestampMs);
          lastOnsetTimeRef.current = timestampMs;
          
          // Update React state for UI count (triggers re-render)
          setOnsetCount(detectedOnsetsRef.current.length);
          
          // Trigger callback for beat matching
          onOnsetDetected(timestampMs);
          console.log(`🎤 [OnsetDetector] Onset #${detectedOnsetsRef.current.length} at ${Math.round(timestampMs)}ms (RMS: ${currentRms.toFixed(4)})`);
        }
      }

      // 5. Increment sample counter
      sampleCounterRef.current += numSamples;

    } catch (error) {
      console.warn('🎤 [OnsetDetector] Chunk processing failed:', error);
    }
  }, [isDetecting, noiseFloorRms, onOnsetDetected, sampleRate, sensitivity, bufferLatencyMs]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    console.log(`🎤 [OnsetDetector] Detection stopped. Total onsets: ${detectedOnsetsRef.current.length}`);
    return detectedOnsetsRef.current;
  }, []);

  return {
    processAudioChunk,
    calibrateNoiseFloor,
    startDetection,
    stopDetection,
    resetDetection,
    onsetCount,
    isDetecting,
    noiseFloorDb: noiseFloorRms // Exposing RMS as requested, though named Db in interface
  };
};
