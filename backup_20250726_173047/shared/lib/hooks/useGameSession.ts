// src/features/game/lib/hooks/useGameSession.ts
import {useCallback} from 'react'
import {useGameState} from '../../../../shared/lib/hooks/useGameState'
import {useGameTimer} from '../../../../shared/lib/hooks/useGameTimer'
import {usePlayerManager} from '../../../../shared/lib/hooks/usePlayerManager'
import {useQuestionManager} from '../../../../shared/lib/hooks/useQuestionManager'

interface GameSettings {
    teamName: string
    teamMembers: string[]
    difficulty: 'Easy' | 'Medium' | 'Hard'
    roundTime: number
    roundCount: number
    enableAIHost: boolean
    questionSource: 'app' | 'user'
}

export const useGameSession = (settings: GameSettings) => {
    // Initialize game state
    const gameState = useGameState({
        totalRounds: settings.roundCount,
        onGameComplete: (results) => {
            console.log('Game completed:', results)
        }
    })

    // Initialize timer
    const timer = useGameTimer({
        initialTime: settings.roundTime,
        onTimeUp: () => {
            if (gameState.gamePhase === 'discussion') {
                gameState.setGamePhase('answer')
            }
        }
    })

    // Initialize player management
    const playerManager = usePlayerManager(settings.teamMembers)

    // Initialize question management
    const questionManager = useQuestionManager({
        source: settings.questionSource,
        difficulty: settings.difficulty,
        count: settings.roundCount
    })

    // Game flow methods
    const startDiscussion = useCallback(() => {
        gameState.setGamePhase('discussion')
        timer.reset(settings.roundTime)
        timer.start()
    }, [gameState, timer, settings.roundTime])

    const submitAnswer = useCallback((teamAnswer: string, discussionNotes: string = '') => {
        const currentQuestion = questionManager.currentQuestion
        if (!currentQuestion || !playerManager.selectedPlayer) {
            return false
        }

        timer.stop()
        gameState.submitAnswer(
            currentQuestion.question,
            currentQuestion.answer,
            teamAnswer,
            playerManager.selectedPlayer,
            discussionNotes
        )

        return true
    }, [questionManager, playerManager, timer, gameState])

    const nextRound = useCallback(() => {
        questionManager.nextQuestion()
        playerManager.clearSelection()
        timer.reset()
        gameState.nextPhase()
    }, [questionManager, playerManager, timer, gameState])

    return {
        // Game state
        ...gameState,

        // Timer
        timer,

        // Players
        ...playerManager,

        // Questions
        ...questionManager,

        // Game flow
        startDiscussion,
        submitAnswer,
        nextRound,

        // Settings
        settings
    }
}
