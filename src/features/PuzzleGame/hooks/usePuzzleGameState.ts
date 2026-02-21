// src/features/PuzzleGame/hooks/usePuzzleGameState.ts
import { useState, useEffect, useCallback } from 'react';
import { 
    useGetPuzzleGameQuery, 
    useGetMyPiecesQuery, 
    useSubmitAnswerMutation,
    useStartPuzzleGameMutation,
    useUpdateBoardStateMutation
} from '../../../entities/PuzzleState/model/slice/puzzleApi';
import { 
    PuzzleGameMode, 
    PuzzleGamePhase, 
    AnswerResult 
} from '../../../entities/PuzzleState/model/types';
import { useCountdownTimer } from '../../../shared/hooks/useCountdownTimer';

interface UsePuzzleGameStateOptions {
    puzzleGameId: number;
    gameMode: PuzzleGameMode;
    timeLimitSeconds?: number;
    roomCode?: string;
}

export const usePuzzleGameState = ({
    puzzleGameId,
    gameMode,
    timeLimitSeconds
}: UsePuzzleGameStateOptions) => {
    const [phase, setPhase] = useState<PuzzleGamePhase>('LOADING');
    const [answerText, setAnswerText] = useState('');
    const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);

    const { 
        data: gameStatus, 
        isLoading: isGameLoading, 
        error: gameError 
    } = useGetPuzzleGameQuery(puzzleGameId, {
        pollingInterval: phase === 'WAITING_FOR_START' ? 3000 : 0
    });

    const { 
        data: pieces = [], 
        isLoading: isPiecesLoading 
    } = useGetMyPiecesQuery(puzzleGameId, {
        skip: phase === 'LOADING' || phase === 'WAITING_FOR_START'
    });

    const [submitAnswerMutation, { isLoading: isSubmitting }] = useSubmitAnswerMutation();
    const [startMutation] = useStartPuzzleGameMutation();
    const [updateBoardMutation] = useUpdateBoardStateMutation();

    const { timeLeft, startTimer, stopTimer, resetTimer } = useCountdownTimer({
        initialTime: timeLimitSeconds || 0,
        onTimeUp: () => {
            if (phase === 'PLAYING') {
                // Handle time up
            }
        }
    });

    useEffect(() => {
        if (gameStatus) {
            if (gameStatus.game.status === 'CREATED' || gameStatus.game.status === 'DISTRIBUTING') {
                setPhase('WAITING_FOR_START');
            } else if (gameStatus.game.status === 'IN_PROGRESS' || gameStatus.game.status === 'GUESSING') {
                setPhase('PLAYING');
                if (timeLimitSeconds) startTimer();
            } else if (gameStatus.game.status === 'COMPLETED') {
                setPhase('RESULTS');
            }
        }
    }, [gameStatus, timeLimitSeconds, startTimer]);

    const startGame = useCallback(async () => {
        try {
            await startMutation(puzzleGameId).unwrap();
        } catch (err) {
            console.error('Failed to start game', err);
        }
    }, [puzzleGameId, startMutation]);

    const submitAnswer = useCallback(async () => {
        if (!answerText.trim()) return null;
        try {
            const result = await submitAnswerMutation({ gameId: puzzleGameId, answer: answerText }).unwrap();
            setAnswerResult(result);
            if (result.correct) {
                setPhase('SUBMITTED');
                stopTimer();
            }
            return result;
        } catch (err) {
            console.error('Failed to submit answer', err);
            return null;
        }
    }, [answerText, puzzleGameId, submitAnswerMutation, stopTimer]);

    const syncBoardState = useCallback((pieceIndex: number, row: number, col: number) => {
        updateBoardMutation({
            gameId: puzzleGameId,
            update: { pieceIndex, newRow: row, newCol: col }
        });
    }, [puzzleGameId, updateBoardMutation]);

    return {
        phase,
        setPhase,
        game: gameStatus?.game,
        participants: gameStatus?.participants || [],
        pieces,
        isLoading: isGameLoading || isPiecesLoading,
        error: gameError,
        timeLeft,
        answerText,
        setAnswerText,
        submitAnswer,
        answerResult,
        isSubmitting,
        startGame,
        syncBoardState
    };
};
