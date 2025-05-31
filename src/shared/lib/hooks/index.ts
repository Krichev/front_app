// src/shared/lib/hooks/index.ts
export { useGameTimer } from './useGameTimer'
export { useGameState } from './useGameState'
export { usePlayerManager } from './usePlayerManager'
export { useQuestionManager } from './useQuestionManager'
export { useVoiceRecording } from './useVoiceRecording'

// src/shared/lib/hooks/useGameTimer.ts
// src/shared/lib/hooks/useGameState.ts
// src/shared/lib/hooks/usePlayerManager.ts
// src/shared/lib/hooks/useQuestionManager.ts
// src/shared/lib/hooks/useVoiceRecording.ts
// src/features/game/lib/hooks/useGameSession.ts
import {useCallback, useEffect, useRef, useState} from 'react'
import {QuestionData, QuestionService} from '../../services/wwwGame/questionService'
import {useGameState} from '../../../../shared/lib/hooks/useGameState'
import {useGameTimer} from '../../../../shared/lib/hooks/useGameTimer'
import {usePlayerManager} from '../../../../shared/lib/hooks/usePlayerManager'
import {useQuestionManager} from '../../../../shared/lib/hooks/useQuestionManager'
// src/features/game/lib/utils/gameUtils.ts
import {GameRound, PlayerPerformance} from '../model/types'

interface UseGameTimerOptions {
    initialTime: number
    onTimeUp?: () => void
    autoStart?: boolean
}

export const useGameTimer = ({
                                 initialTime,
                                 onTimeUp,
                                 autoStart = false
                             }: UseGameTimerOptions) => {
    const [timeRemaining, setTimeRemaining] = useState(initialTime)
    const [isRunning, setIsRunning] = useState(autoStart)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const start = useCallback(() => {
        setIsRunning(true)
    }, [])

    const stop = useCallback(() => {
        setIsRunning(false)
    }, [])

    const reset = useCallback((newTime?: number) => {
        setTimeRemaining(newTime ?? initialTime)
        setIsRunning(false)
    }, [initialTime])

    const addTime = useCallback((seconds: number) => {
        setTimeRemaining(prev => Math.max(0, prev + seconds))
    }, [])

    useEffect(() => {
        if (isRunning && timeRemaining > 0) {
            intervalRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        setIsRunning(false)
                        onTimeUp?.()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isRunning, timeRemaining, onTimeUp])

    return {
        timeRemaining,
        isRunning,
        start,
        stop,
        reset,
        addTime,
        progress: initialTime > 0 ? timeRemaining / initialTime : 0
    }
}

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

export const usePlayerManager = (initialPlayers: string[] = []) => {
    const [players, setPlayers] = useState<string[]>(initialPlayers)
    const [selectedPlayer, setSelectedPlayer] = useState<string>('')

    const addPlayer = useCallback((playerName: string) => {
        const trimmedName = playerName.trim()
        if (trimmedName && !players.includes(trimmedName)) {
            setPlayers(prev => [...prev, trimmedName])
            return true
        }
        return false
    }, [players])

    const removePlayer = useCallback((index: number) => {
        if (players.length > 1 && index >= 0 && index < players.length) {
            const playerToRemove = players[index]
            setPlayers(prev => prev.filter((_, i) => i !== index))

            // If the removed player was selected, clear selection
            if (selectedPlayer === playerToRemove) {
                setSelectedPlayer('')
            }
            return true
        }
        return false
    }, [players, selectedPlayer])

    const selectPlayer = useCallback((playerName: string) => {
        if (players.includes(playerName)) {
            setSelectedPlayer(playerName)
            return true
        }
        return false
    }, [players])

    const clearSelection = useCallback(() => {
        setSelectedPlayer('')
    }, [])

    return {
        players,
        selectedPlayer,
        addPlayer,
        removePlayer,
        selectPlayer,
        clearSelection,
        setPlayers
    }
}

type QuestionSource = 'app' | 'user'
type Difficulty = 'Easy' | 'Medium' | 'Hard'

interface UseQuestionManagerOptions {
    source: QuestionSource
    difficulty: Difficulty
    count: number
}

export const useQuestionManager = ({
                                       source,
                                       difficulty,
                                       count
                                   }: UseQuestionManagerOptions) => {
    const [questions, setQuestions] = useState<QuestionData[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadQuestions = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            let loadedQuestions: QuestionData[]

            if (source === 'user') {
                const userQuestions = await QuestionService.getUserQuestions()
                loadedQuestions = userQuestions.slice(0, count)
            } else {
                loadedQuestions = await QuestionService.getQuestionsByDifficulty(difficulty, count)
            }

            setQuestions(loadedQuestions)
            setCurrentQuestionIndex(0)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load questions')
            setQuestions([])
        } finally {
            setIsLoading(false)
        }
    }, [source, difficulty, count])

    useEffect(() => {
        loadQuestions()
    }, [loadQuestions])

    const getCurrentQuestion = useCallback(() => {
        return questions[currentQuestionIndex] || null
    }, [questions, currentQuestionIndex])

    const nextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
            return true
        }
        return false
    }, [currentQuestionIndex, questions.length])

    const previousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
            return true
        }
        return false
    }, [currentQuestionIndex])

    const goToQuestion = useCallback((index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentQuestionIndex(index)
            return true
        }
        return false
    }, [questions.length])

    return {
        questions,
        currentQuestion: getCurrentQuestion(),
        currentQuestionIndex,
        isLoading,
        error,
        hasNext: currentQuestionIndex < questions.length - 1,
        hasPrevious: currentQuestionIndex > 0,
        loadQuestions,
        nextQuestion,
        previousQuestion,
        goToQuestion
    }
}

interface UseVoiceRecordingOptions {
    onTranscription?: (text: string) => void
    onError?: (error: string) => void
    language?: string
}

export const useVoiceRecording = ({
                                      onTranscription,
                                      onError,
                                      language = 'en-US'
                                  }: UseVoiceRecordingOptions = {}) => {
    const [isRecording, setIsRecording] = useState(false)
    const [isSupported, setIsSupported] = useState(true)
    const [transcription, setTranscription] = useState('')
    const recognitionRef = useRef<any>(null)

    const startRecording = useCallback(async () => {
        try {
            // Check if speech recognition is supported
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                setIsSupported(false)
                onError?.('Speech recognition is not supported in this browser')
                return false
            }

            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            recognitionRef.current = new SpeechRecognition()

            recognitionRef.current.continuous = true
            recognitionRef.current.interimResults = true
            recognitionRef.current.lang = language

            recognitionRef.current.onstart = () => {
                setIsRecording(true)
            }

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = ''
                let finalTranscript = ''

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript
                    } else {
                        interimTranscript += transcript
                    }
                }

                const fullTranscript = finalTranscript || interimTranscript
                setTranscription(fullTranscript)
                onTranscription?.(fullTranscript)
            }

            recognitionRef.current.onerror = (event: any) => {
                onError?.(event.error)
            }

            recognitionRef.current.onend = () => {
                setIsRecording(false)
            }

            recognitionRef.current.start()
            return true
        } catch (error) {
            onError?.(error instanceof Error ? error.message : 'Failed to start recording')
            return false
        }
    }, [language, onTranscription, onError])

    const stopRecording = useCallback(() => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop()
        }
    }, [isRecording])

    const clearTranscription = useCallback(() => {
        setTranscription('')
    }, [])

    return {
        isRecording,
        isSupported,
        transcription,
        startRecording,
        stopRecording,
        clearTranscription
    }
}

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

// src/features/game/model/types.ts
export interface GameSession {
    id: string
    teamName: string
    teamMembers: string[]
    difficulty: 'Easy' | 'Medium' | 'Hard'
    roundTime: number
    totalRounds: number
    currentRound: number
    score: number
    phase: 'waiting' | 'question' | 'discussion' | 'answer' | 'feedback'
    startedAt?: Date
    completedAt?: Date
}

export interface GameRound {
    questionNumber: number
    question: string
    correctAnswer: string
    teamAnswer?: string
    isCorrect?: boolean
    playerWhoAnswered?: string
    discussionNotes?: string
    startedAt?: Date
    answeredAt?: Date
}

export interface GameResult {
    sessionId: string
    score: number
    totalRounds: number
    correctPercentage: number
    rounds: GameRound[]
    playerPerformances: PlayerPerformance[]
    duration: number
}

export interface PlayerPerformance {
    playerName: string
    correctAnswers: number
    totalAnswers: number
    accuracy: number
}

export const calculatePlayerPerformances = (rounds: GameRound[]): PlayerPerformance[] => {
    const playerStats = new Map<string, { correct: number; total: number }>()

    rounds.forEach(round => {
        if (round.playerWhoAnswered) {
            const stats = playerStats.get(round.playerWhoAnswered) || { correct: 0, total: 0 }
            stats.total += 1
            if (round.isCorrect) {
                stats.correct += 1
            }
            playerStats.set(round.playerWhoAnswered, stats)
        }
    })

    return Array.from(playerStats.entries()).map(([playerName, stats]) => ({
        playerName,
        correctAnswers: stats.correct,
        totalAnswers: stats.total,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    })).sort((a, b) => b.accuracy - a.accuracy)
}

export const formatGameDuration = (startTime: Date, endTime: Date): string => {
    const durationMs = endTime.getTime() - startTime.getTime()
    const minutes = Math.floor(durationMs / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
}

export const getScoreMessage = (score: number, total: number): string => {
    const percentage = (score / total) * 100

    if (percentage >= 90) return 'Outstanding! Exceptional knowledge!'
    if (percentage >= 70) return 'Great job! Impressive performance!'
    if (percentage >= 50) return 'Good effort! Well done!'
    if (percentage >= 30) return 'Nice try! Keep learning!'
    return 'Don\'t give up! Every game is a learning opportunity!'
}

export const validateAnswer = (userAnswer: string, correctAnswer: string): boolean => {
    if (!userAnswer || !correctAnswer) return false

    const normalize = (text: string) =>
        text.toLowerCase()
            .trim()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()""''«»]/g, "")
            .replace(/\s{2,}/g, " ")

    const normalizedUser = normalize(userAnswer)
    const normalizedCorrect = normalize(correctAnswer)

    // Direct match
    if (normalizedUser === normalizedCorrect) return true

    // Contains match
    if (normalizedUser.includes(normalizedCorrect) ||
        normalizedCorrect.includes(normalizedUser)) return true

    // For short answers, use fuzzy matching
    if (normalizedCorrect.split(" ").length <= 2) {
        return calculateSimilarity(normalizedUser, normalizedCorrect) >= 0.8
    }

    return false
}

const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const distance = levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
}

const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                )
            }
        }
    }

    return matrix[str2.length][str1.length]
}