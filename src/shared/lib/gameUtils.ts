// src/shared/lib/gameUtils.ts

export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type GamePhase = 'waiting' | 'question' | 'discussion' | 'answer' | 'feedback' | 'results'

/**
 * Game validation utilities
 */
export class GameValidation {
    /**
     * Validate team answer against correct answer with improved language support
     */
    static validateAnswer(teamAnswer: string, correctAnswer: string): boolean {
        if (!teamAnswer || !correctAnswer) return false

        // Normalize strings for comparison
        const normalizeForComparison = (text: string): string => {
            return text
                .toLowerCase()
                .trim()
                // Remove punctuation, but keep Cyrillic and Latin characters
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()""''«»]/g, "")
                .replace(/\s{2,}/g, " ")
        }

        const normalizedTeamAnswer = normalizeForComparison(teamAnswer)
        const normalizedCorrectAnswer = normalizeForComparison(correctAnswer)

        // Direct match after normalization
        if (normalizedTeamAnswer === normalizedCorrectAnswer) {
            return true
        }

        // Check for case where the team answer contains the correct answer or vice versa
        if (normalizedTeamAnswer.includes(normalizedCorrectAnswer) ||
            normalizedCorrectAnswer.includes(normalizedTeamAnswer)) {
            return true
        }

        // For short answers (1-2 words), use approximate matching
        const isShortAnswer = normalizedCorrectAnswer.split(" ").length <= 2
        if (isShortAnswer) {
            return this.isApproximatelyCorrect(teamAnswer, correctAnswer)
        }

        return false
    }

    /**
     * Determine if an answer is approximately correct using Levenshtein distance
     */
    static isApproximatelyCorrect(userAnswer: string, correctAnswer: string): boolean {
        if (!userAnswer || !correctAnswer) return false

        const normalizedUserAnswer = userAnswer.toLowerCase().trim()
        const normalizedCorrectAnswer = correctAnswer.toLowerCase().trim()

        if (!normalizedUserAnswer || !normalizedCorrectAnswer) return false

        // Exact match
        if (normalizedUserAnswer === normalizedCorrectAnswer) return true

        // Check if the answer contains the correct answer
        if (normalizedUserAnswer.includes(normalizedCorrectAnswer) ||
            normalizedCorrectAnswer.includes(normalizedUserAnswer)) {
            return true
        }

        // Calculate similarity ratio using Levenshtein distance
        const distance = this.levenshteinDistance(normalizedUserAnswer, normalizedCorrectAnswer)
        const maxLength = Math.max(normalizedUserAnswer.length, normalizedCorrectAnswer.length)

        if (maxLength === 0) return false

        const similarityRatio = 1 - distance / maxLength
        return similarityRatio >= 0.8 // Accept answers that are at least 80% similar
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    private static levenshteinDistance(a: string, b: string): number {
        if (a.length === 0) return b.length
        if (b.length === 0) return a.length

        const matrix = []

        // Initialize matrix
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i]
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j
        }

        // Fill matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
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

        return matrix[b.length][a.length]
    }

    /**
     * Validate game settings
     */
    static validateGameSettings(settings: {
        teamName: string
        teamMembers: string[]
        roundCount: number
        roundTime: number
    }): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (!settings.teamName.trim()) {
            errors.push('Team name is required')
        }

        if (settings.teamMembers.length === 0) {
            errors.push('At least one team member is required')
        }

        if (settings.roundCount < 1 || settings.roundCount > 50) {
            errors.push('Round count must be between 1 and 50')
        }

        if (settings.roundTime < 10 || settings.roundTime > 300) {
            errors.push('Round time must be between 10 and 300 seconds')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }
}

/**
 * Game calculation utilities
 */
export class GameCalculations {
    /**
     * Calculate player performance statistics
     */
    static calculatePlayerPerformance(roundsData: Array<{
        isCorrect: boolean
        playerWhoAnswered: string
    }>): Array<{
        player: string
        total: number
        correct: number
        percentage: number
    }> {
        const playerStatsMap = new Map<string, { total: number, correct: number }>()

        // Process each round
        roundsData.forEach(round => {
            const player = round.playerWhoAnswered
            if (!player) return

            if (!playerStatsMap.has(player)) {
                playerStatsMap.set(player, { total: 0, correct: 0 })
            }

            const stats = playerStatsMap.get(player)!
            stats.total += 1

            if (round.isCorrect) {
                stats.correct += 1
            }
        })

        // Convert map to array and calculate percentages
        return Array.from(playerStatsMap.entries())
            .map(([player, stats]) => ({
                player,
                total: stats.total,
                correct: stats.correct,
                percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
            }))
            .sort((a, b) => b.correct - a.correct) // Sort by correct answers descending
    }

    /**
     * Calculate overall game score percentage
     */
    static calculateScorePercentage(score: number, total: number): number {
        return total > 0 ? (score / total) * 100 : 0
    }

    /**
     * Calculate game duration in seconds
     */
    static calculateGameDuration(startTime: Date, endTime: Date): number {
        return Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    }

    /**
     * Get performance grade based on percentage
     */
    static getPerformanceGrade(percentage: number): {
        grade: string
        color: string
        message: string
    } {
        if (percentage >= 90) {
            return { grade: 'A+', color: '#4CAF50', message: 'Outstanding!' }
        } else if (percentage >= 80) {
            return { grade: 'A', color: '#4CAF50', message: 'Excellent!' }
        } else if (percentage >= 70) {
            return { grade: 'B', color: '#FF9800', message: 'Great job!' }
        } else if (percentage >= 60) {
            return { grade: 'C', color: '#FF9800', message: 'Good effort!' }
        } else if (percentage >= 50) {
            return { grade: 'D', color: '#F44336', message: 'Keep trying!' }
        } else {
            return { grade: 'F', color: '#F44336', message: 'Need more practice!' }
        }
    }
}

/**
 * Game hint generation utilities
 */
export class GameHints {
    /**
     * Generate a hint based on difficulty level
     */
    static generateHint(
        correctAnswer: string,
        difficulty: Difficulty,
        previousHints: string[] = []
    ): string {
        const words = correctAnswer.split(' ')
        const totalChars = correctAnswer.length

        switch (difficulty) {
            case 'Easy':
                // For easy, give first letters and word count
                const firstLetters = words.map(word => word[0]).join('')
                return `The answer begins with "${firstLetters}" and has ${words.length} word${words.length !== 1 ? 's' : ''}.`

            case 'Medium':
                // For medium, give character count and word count
                return `The answer has ${totalChars} characters in ${words.length} word${words.length !== 1 ? 's' : ''}.`

            case 'Hard':
                // For hard, just give basic structure
                if (words.length > 1) {
                    return `The answer is a ${words.length}-word term.`
                } else {
                    return `The answer is a single word with ${totalChars} letters.`
                }

            default:
                return `The answer contains ${totalChars} characters.`
        }
    }

    /**
     * Check if a hint should be progressive (reveal more information)
     */
    static shouldProvideProgressiveHint(
        attemptCount: number,
        timeRemaining: number,
        totalTime: number
    ): boolean {
        // Provide progressive hints if:
        // - Multiple attempts have been made, OR
        // - Time is running low (less than 25% remaining)
        return attemptCount > 1 || (timeRemaining / totalTime) < 0.25
    }
}

/**
 * Game timer utilities
 */
export class GameTimer {
    /**
     * Format time in MM:SS or SS format
     */
    static formatTime(seconds: number, showMinutes: boolean = true): string {
        if (!showMinutes || seconds < 60) {
            return `${seconds}s`
        }

        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    /**
     * Get timer color based on remaining time percentage
     */
    static getTimerColor(timeRemaining: number, totalTime: number): string {
        const percentage = totalTime > 0 ? timeRemaining / totalTime : 0

        if (percentage > 0.5) return '#4CAF50' // Green
        if (percentage > 0.25) return '#FF9800' // Orange
        return '#F44336' // Red
    }

    /**
     * Check if timer is in warning state
     */
    static isTimerWarning(timeRemaining: number, totalTime: number): boolean {
        const percentage = totalTime > 0 ? timeRemaining / totalTime : 0
        return percentage <= 0.25 && percentage > 0.1
    }

    /**
     * Check if timer is in critical state
     */
    static isTimerCritical(timeRemaining: number, totalTime: number): boolean {
        const percentage = totalTime > 0 ? timeRemaining / totalTime : 0
        return percentage <= 0.1
    }
}

/**
 * Game phase utilities
 */
export class GamePhaseUtils {
    /**
     * Get next phase in the game flow
     */
    static getNextPhase(currentPhase: GamePhase, isLastRound: boolean = false): GamePhase {
        switch (currentPhase) {
            case 'waiting':
                return 'question'
            case 'question':
                return 'discussion'
            case 'discussion':
                return 'answer'
            case 'answer':
                return 'feedback'
            case 'feedback':
                return isLastRound ? 'results' : 'question'
            case 'results':
                return 'results' // Stay in results
            default:
                return 'question'
        }
    }

    /**
     * Check if phase allows user input
     */
    static allowsUserInput(phase: GamePhase): boolean {
        return ['discussion', 'answer'].includes(phase)
    }

    /**
     * Check if phase should show timer
     */
    static showsTimer(phase: GamePhase): boolean {
        return phase === 'discussion'
    }

    /**
     * Get phase display name
     */
    static getPhaseDisplayName(phase: GamePhase): string {
        switch (phase) {
            case 'waiting':
                return 'Ready to Start'
            case 'question':
                return 'Question'
            case 'discussion':
                return 'Team Discussion'
            case 'answer':
                return 'Submit Answer'
            case 'feedback':
                return 'Answer Feedback'
            case 'results':
                return 'Final Results'
            default:
                return 'Game'
        }
    }
}