import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  useSubmitRecordingMutation, 
  useLazyGetSubmissionStatusQuery,
  AudioChallengeSubmission,
  AudioFileInfo
} from '../entities/AudioChallengeState/model/slice/audioChallengeApi';

interface UseAudioSubmissionPollingOptions {
  pollIntervalMs?: number;
  maxPollAttempts?: number;
  onComplete?: (submission: AudioChallengeSubmission) => void;
  onFailed?: (submission: AudioChallengeSubmission) => void;
}

interface UseAudioSubmissionPollingReturn {
  submit: (questionId: number, audioFile: AudioFileInfo) => Promise<void>;
  submission: AudioChallengeSubmission | null;
  isSubmitting: boolean;
  isPolling: boolean;
  isComplete: boolean;
  isFailed: boolean;
  error: string | null;
  reset: () => void;
}

export const useAudioSubmissionPolling = (
  options: UseAudioSubmissionPollingOptions = {}
): UseAudioSubmissionPollingReturn => {
  const { 
    pollIntervalMs = 2000, 
    maxPollAttempts = 30, 
    onComplete, 
    onFailed 
  } = options;

  const [submitRecording, { isLoading: isSubmitting }] = useSubmitRecordingMutation();
  const [getSubmissionStatus] = useLazyGetSubmissionStatusQuery();

  const [submission, setSubmission] = useState<AudioChallengeSubmission | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  const pollCountRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setSubmission(null);
    setError(null);
    setIsComplete(false);
    setIsFailed(false);
    pollCountRef.current = 0;
  }, [stopPolling]);

  const pollStatus = useCallback(async (submissionId: number) => {
    try {
      const { data, error: pollError } = await getSubmissionStatus(submissionId, false);

      if (pollError) {
        throw new Error('Failed to fetch submission status');
      }

      if (data) {
        setSubmission(data);

        if (data.processingStatus === 'COMPLETED') {
          stopPolling();
          setIsComplete(true);
          onComplete?.(data);
        } else if (data.processingStatus === 'FAILED') {
          stopPolling();
          setIsFailed(true);
          onFailed?.(data);
        }
      }

      pollCountRef.current += 1;
      if (pollCountRef.current >= maxPollAttempts) {
        stopPolling();
        setError('Scoring timed out. Please try again.');
        setIsFailed(true);
      }
    } catch (err: any) {
      stopPolling();
      setError(err.message || 'Error while polling status');
      setIsFailed(true);
    }
  }, [getSubmissionStatus, maxPollAttempts, stopPolling, onComplete, onFailed]);

  const submit = useCallback(async (questionId: number, audioFile: AudioFileInfo) => {
    reset();
    try {
      const result = await submitRecording({ questionId, audioFile }).unwrap();
      setSubmission(result);

      if (result.processingStatus === 'COMPLETED') {
        setIsComplete(true);
        onComplete?.(result);
      } else if (result.processingStatus === 'FAILED') {
        setIsFailed(true);
        onFailed?.(result);
      } else {
        // Start polling
        setIsPolling(true);
        pollIntervalRef.current = setInterval(() => {
          pollStatus(result.id);
        }, pollIntervalMs);
      }
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Failed to submit recording');
      setIsFailed(true);
    }
  }, [submitRecording, pollIntervalMs, pollStatus, reset, onComplete, onFailed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return {
    submit,
    submission,
    isSubmitting,
    isPolling,
    isComplete,
    isFailed,
    error,
    reset
  };
};
