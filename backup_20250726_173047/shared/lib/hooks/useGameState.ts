// src/shared/lib/hooks/useGameState.ts
import {useCallback, useState} from 'react'

export type GamePhase = 'waiting' | 'question' | 'discussion' | 'answer' | 'feedback'

interface GameStateOptions {
    totalRounds: number
    onGameComplete?: (results: GameResults) => void
}

interface GameResults {
    score: number
    totalRounds: number
    roundsData: RoundResult[]
}

interface RoundResult {
    questionNumber: number
    question: string
    correctAnswer: string
    teamAnswer: string
    isCorrect: boolean
    playerWhoAnswered: string
    discussionNotes: string
}

export const useGameState = ({ totalRounds, onGameComplete }: GameStateOptions) => {
    const [currentRound, setCurrentRound] = useState(0)
    const [gamePhase, setGamePhase] = useState<GamePhase>('waiting')
    const [score, setScore] = useState(0)
    const [roundsData, setRoundsData] = useState<RoundResult[]>([])
    const [gameStartTime, setGameStartTime] = useState<Date | null>(null)

    const startGame = useCallback(() => {
        setGameStartTime(new Date())
        setGamePhase('question')
        setCurrentRound(0)
        setScore(0)
        setRoundsData([])
    }, [])

    const nextPhase = useCallback(() => {
        switch (gamePhase) {
            case 'waiting':
                setGamePhase('question')
                break
            case 'question':
                setGamePhase('discussion')
                break
            case 'discussion':
                setGamePhase('answer')
                break
            case 'answer':
                setGamePhase('feedback')
                break
            case 'feedback':
                if (currentRound + 1 >= totalRounds) {
                    onGameComplete?.({
                        score,
                        totalRounds,
                        roundsData
                    })
                } else {
                    setCurrentRound(prev => prev + 1)
                    setGamePhase('question')
                }
                break
        }
    }, [gamePhase, currentRound, totalRounds, score, roundsData, onGameComplete])

    const submitAnswer = useCallback((
        question: string,
        correctAnswer: string,
        teamAnswer: string,
        playerWhoAnswered: string,
        discussionNotes: string = ''
    ) => {
        const isCorrect = teamAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()

        const roundResult: RoundResult = {
            questionNumber: currentRound + 1,
            question,
            correctAnswer,
            teamAnswer,
            isCorrect,
            playerWhoAnswered,
            discussionNotes
        }

        setRoundsData(prev => [...prev, roundResult])

        if (isCorrect) {
            setScore(prev => prev + 1)
        }

        setGamePhase('feedback')
    }, [currentRound])

    const isGameComplete = currentRound >= totalRounds && gamePhase === 'feedback'

    return {
        currentRound,
        gamePhase,
        score,
        roundsData,
        gameStartTime,
        isGameComplete,
        startGame,
        nextPhase,
        submitAnswer,
        setGamePhase
    }
}