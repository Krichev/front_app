// src/widgets/game-session/lib/hooks.ts
import {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {gameSessionActions, gameSessionSelectors} from '../../../entities/game-session';
import {questionSelectors} from '../../../entities/question';
import {useSpeechToText} from '../../../features/speech-to-text';
import {useWWWDiscussion} from '../../../features/www-game-discussion';
import {useChallengeVerification} from '../../../features/challenge-verification';

export const useGameSessionWidget = () => {
    const dispatch = useDispatch();

    // Entity selectors
    const gameSession = useSelector(gameSessionSelectors.selectCurrentSession);
    const currentRound = useSelector(gameSessionSelectors.selectCurrentRound);
    const isLoading = useSelector(gameSessionSelectors.selectIsLoading);
    const questions = useSelector(questionSelectors.selectQuestions);
    const currentQuestion = useSelector(questionSelectors.selectCurrentQuestion);

    // Feature hooks
    const speechToText = useSpeechToText();
    const wwwDiscussion = useWWWDiscussion(currentQuestion || undefined);
    const verification = useChallengeVerification();

    // Game actions
    const startGame = useCallback((config: any) => {
        dispatch(gameSessionActions.startSession(config));
    }, [dispatch]);

    const nextRound = useCallback(() => {
        dispatch(gameSessionActions.nextRound());
    }, [dispatch]);

    const endGame = useCallback(() => {
        dispatch(gameSessionActions.endSession());
    }, [dispatch]);

    const submitAnswer = useCallback((answer: string) => {
        if (currentQuestion && gameSession) {
            dispatch(gameSessionActions.submitAnswer({
                questionId: currentQuestion.id,
                answer,
                timeSpent: gameSession.currentRound?.timeSpent || 0,
            }));
        }
    }, [currentQuestion, gameSession, dispatch]);

    return {
        // State
        gameSession,
        currentRound,
        currentQuestion,
        isLoading,

        // Features
        speechToText,
        wwwDiscussion,
        verification,

        // Actions
        startGame,
        nextRound,
        endGame,
        submitAnswer,

        // Computed
        isGameActive: gameSession?.status === 'active',
        canSubmitAnswer: currentQuestion !== null,
        gameProgress: gameSession ? (gameSession.currentRoundIndex / gameSession.totalRounds) * 100 : 0,
    };
};