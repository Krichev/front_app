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