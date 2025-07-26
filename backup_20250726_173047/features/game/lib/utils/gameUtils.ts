// src/features/game/lib/utils/gameUtils.ts
import {GameRound, PlayerPerformance} from '../model/types'

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