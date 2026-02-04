import { useEffect, useCallback, useRef } from 'react';
import { 
    useBuzzMutation, 
    useSubmitBrainRingAnswerMutation, 
    useGetBrainRingStateQuery 
} from '../../../entities/QuizState/model/slice/quizApi';
import { useBrainRingState } from './useBrainRingState';

export function useBrainRingController(sessionId: string, roundId: string, userId: number) {
    const { state, actions } = useBrainRingState(userId);
    const [buzzMutation] = useBuzzMutation();
    const [submitAnswerMutation] = useSubmitBrainRingAnswerMutation();

    const { data: serverState, refetch: refetchState } = useGetBrainRingStateQuery(
        { sessionId, roundId },
        { 
            pollingInterval: state.phase === 'question_display' || state.phase === 'player_answering' ? 1000 : 0,
            skip: !sessionId || !roundId
        }
    );

    // Sync state with server
    useEffect(() => {
        if (serverState) {
            actions.updateState(
                serverState.roundStatus,
                serverState.currentBuzzerUserId || null,
                serverState.lockedOutPlayers,
                serverState.answerDeadline || null
            );
        }
    }, [serverState, actions]);

    const handleBuzz = useCallback(async () => {
        if (!state.canBuzz) return;

        try {
            const timestamp = new Date().toISOString();
            const result = await buzzMutation({
                sessionId,
                roundId,
                request: { userId, timestamp }
            }).unwrap();

            if (result.success) {
                actions.buzzSuccess(result.isFirstBuzzer, result.answerDeadline);
            }
        } catch (error) {
            console.error('Buzz failed', error);
        }
    }, [buzzMutation, sessionId, roundId, userId, state.canBuzz, actions]);

    const handleSubmitAnswer = useCallback(async (answer: string) => {
        if (!state.isAnswering) return;

        try {
            const result = await submitAnswerMutation({
                sessionId,
                roundId,
                request: { userId, answer }
            }).unwrap();

            actions.answerSubmitted(result.isCorrect, result.roundComplete);
            return result;
        } catch (error) {
            console.error('Submit answer failed', error);
        }
    }, [submitAnswerMutation, sessionId, roundId, userId, state.isAnswering, actions]);

    return {
        state,
        actions,
        handleBuzz,
        handleSubmitAnswer,
        refetchState
    };
}
