import { useCallback } from 'react';
import {
  useBeginQuizSessionMutation,
  useSubmitRoundAnswerMutation,
  useCompleteQuizSessionMutation,
  usePauseQuizSessionMutation,
  useResumeQuizSessionMutation,
  useAbandonQuizSessionMutation,
  useGetQuizSessionQuery,
  useGetQuizRoundsQuery,
  PauseQuizSessionRequest,
} from '../../../entities/QuizState/model/slice/quizApi';
import { useSubmitRecordingMutation } from '../../../entities/AudioChallengeState/model/slice/audioChallengeApi';

interface AnswerPayload {
  teamAnswer: string;
  playerWhoAnswered: string;
  discussionNotes: string;
}

export function useWWWGameController(sessionId: string) {
  // Queries
  const { data: session, isLoading: isLoadingSession } = useGetQuizSessionQuery(sessionId, {
    skip: !sessionId,
  });
  const { data: rounds = [], isLoading: isLoadingRounds, refetch: refetchRounds } = useGetQuizRoundsQuery(sessionId, {
    skip: !sessionId,
  });

  // Mutations
  const [beginQuizSession, { isLoading: isBeginningSession }] = useBeginQuizSessionMutation();
  const [submitRoundAnswer, { isLoading: isSubmittingAnswer }] = useSubmitRoundAnswerMutation();
  const [completeQuizSession, { isLoading: isCompletingSession }] = useCompleteQuizSessionMutation();
  const [pauseQuizSession, { isLoading: isPausingSession }] = usePauseQuizSessionMutation();
  const [resumeQuizSession, { isLoading: isResumingSession }] = useResumeQuizSessionMutation();
  const [abandonQuizSession, { isLoading: isAbandoningSession }] = useAbandonQuizSessionMutation();
  const [submitRecording, { isLoading: isSubmittingAudio }] = useSubmitRecordingMutation();

  const startSession = useCallback(async () => {
    return beginQuizSession(sessionId).unwrap();
  }, [beginQuizSession, sessionId]);

  const pauseSession = useCallback(async (pauseData: PauseQuizSessionRequest) => {
    return pauseQuizSession({ sessionId, pauseData }).unwrap();
  }, [pauseQuizSession, sessionId]);

  const resumeGame = useCallback(async () => {
    return resumeQuizSession(sessionId).unwrap();
  }, [resumeQuizSession, sessionId]);

  const abandonGame = useCallback(async () => {
    return abandonQuizSession(sessionId).unwrap();
  }, [abandonQuizSession, sessionId]);

  const submitAnswer = useCallback(async (roundId: number, payload: AnswerPayload) => {
    const result = await submitRoundAnswer({
      sessionId,
      roundId,
      answer: payload,
    }).unwrap();
    await refetchRounds();
    return result;
  }, [submitRoundAnswer, sessionId, refetchRounds]);

  const submitAudioAnswer = useCallback(async (
    roundId: number, 
    questionId: number,
    audioFile: { uri: string; name: string; type: string },
    payload: Omit<AnswerPayload, 'teamAnswer'>
  ) => {
    const audioResult = await submitRecording({ questionId, audioFile }).unwrap();
    const result = await submitRoundAnswer({
      sessionId,
      roundId,
      answer: {
        ...payload,
        teamAnswer: `Audio submission: ${audioResult.id}`,
      },
    }).unwrap();
    await refetchRounds();
    return result;
  }, [submitRecording, submitRoundAnswer, sessionId, refetchRounds]);

  const completeGame = useCallback(async () => {
    return completeQuizSession(sessionId).unwrap();
  }, [completeQuizSession, sessionId]);

  return {
    // Data
    session,
    rounds,
    // Loading states
    isLoading: isLoadingSession || isLoadingRounds,
    isBeginningSession,
    isSubmittingAnswer,
    isSubmittingAudio,
    isCompletingSession,
    isPausingSession,
    isResumingSession,
    isAbandoningSession,
    // Actions
    startSession,
    pauseSession,
    resumeGame,
    abandonGame,
    submitAnswer,
    submitAudioAnswer,
    completeGame,
    refetchRounds,
  };
}
