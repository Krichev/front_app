import i18n from '../../shared/config/i18n/i18n';

export interface RoundData {
    question: string;
    correctAnswer: string;
    teamAnswer: string;
    isCorrect: boolean;
    playerWhoAnswered: string;
    discussionNotes: string;
}

export interface PlayerPerformance {
    player: string;
    total: number;
    correct: number;
    percentage: number;
}

export interface GameSettings {
    teamName: string;
    teamMembers: string[];
    difficulty: 'Easy' | 'Medium' | 'Hard';
    roundTime: number;
    roundCount: number;
    enableAIHost: boolean;
    enableAiAnswerValidation?: boolean;
    // Add these new properties:
    questionSource?: 'app' | 'user';
    userQuestions?: QuizQuestion[] | UserQuestion[];
    challengeId?: string; // Challenge ID for tracking
}

export type GamePhase = 'question' | 'discussion' | 'answer' | 'feedback';

import {DeepSeekHostService} from './deepseekHostService';

export class WWWGameService {
    /**
     * Enhanced answer validation with optional AI semantic matching
     */
    static async validateAnswerEnhanced(
        teamAnswer: string,
        correctAnswer: string,
        enableAiValidation: boolean = false,
        language: string = 'en'
    ): Promise<{
        isCorrect: boolean;
        exactMatch: boolean;
        aiAccepted: boolean;
        aiConfidence: number;
        aiExplanation: string;
    }> {
        // 1. Run existing local validation first
        const isLocallyCorrect = this.validateAnswer(teamAnswer, correctAnswer);

        // 2. If local says correct → return immediately
        if (isLocallyCorrect) {
            return {
                isCorrect: true,
                exactMatch: true,
                aiAccepted: false,
                aiConfidence: 0,
                aiExplanation: ''
            };
        }

        // 3. If enableAiValidation → call DeepSeekHostService.validateAnswerWithAi()
        if (enableAiValidation) {
            try {
                // Check answer length to prevent abuse/errors
                if (teamAnswer.length > 500) {
                    return {
                        isCorrect: false,
                        exactMatch: false,
                        aiAccepted: false,
                        aiConfidence: 0,
                        aiExplanation: ''
                    };
                }

                const aiResult = await DeepSeekHostService.validateAnswerWithAi(
                    teamAnswer,
                    correctAnswer,
                    language
                );

                if (aiResult.equivalent && aiResult.confidence >= 0.7) {
                    return {
                        isCorrect: true,
                        exactMatch: false,
                        aiAccepted: true,
                        aiConfidence: aiResult.confidence,
                        aiExplanation: aiResult.explanation
                    };
                }
            } catch (error) {
                console.error('Error in enhanced validation:', error);
                // Fallthrough to return false
            }
        }

        // 4. Fallback to local result (which was false)
        return {
            isCorrect: false,
            exactMatch: false,
            aiAccepted: false,
            aiConfidence: 0,
            aiExplanation: ''
        };
    }

    /**
     * Initialize a new game with the given settings
     */
    static initializeGame(settings: GameSettings): {
        gameQuestions: Array<{ question: string, answer: string }>,
        roundsData: RoundData[]
    } {
        // Default implementation for initialization
        return {
            gameQuestions: [],
            roundsData: []
        };
    }

    /**
     * Validate team answer against correct answer with improved Russian language support
     */
    static validateAnswer(teamAnswer: string, correctAnswer: string): boolean {
        if (!teamAnswer || !correctAnswer) return false;
        
        const trimmedTeam = teamAnswer.trim();
        const trimmedCorrect = correctAnswer.trim();
        if (!trimmedTeam || !trimmedCorrect) return false;

        // Normalize strings for comparison (trim whitespace, remove punctuation, lowercase)
        const normalizeForComparison = (text: string): string => {
            return text
                .toLowerCase()
                .trim()
                // Use Unicode properties with 'u' flag to keep letters and digits from any language
                .replace(/[^\p{L}\p{N}\s]/gu, "")
                .replace(/\s{2,}/g, " ");
        };

        const normalizedTeamAnswer = normalizeForComparison(teamAnswer);
        const normalizedCorrectAnswer = normalizeForComparison(correctAnswer);

        // Direct match after normalization
        if (normalizedTeamAnswer === normalizedCorrectAnswer) {
            return true;
        }

        // Only use contains check if user answer is substantial (at least 50% of correct answer length)
        // This prevents short generic words from matching everything
        const minLengthForContains = Math.max(3, Math.floor(normalizedCorrectAnswer.length * 0.5));
        
        if (normalizedTeamAnswer.length >= minLengthForContains) {
            if (normalizedTeamAnswer.includes(normalizedCorrectAnswer) ||
                normalizedCorrectAnswer.includes(normalizedTeamAnswer)) {
                return true;
            }
        }

        // For short answers (1-2 words), use approximate matching
        const isShortAnswer = normalizedCorrectAnswer.split(" ").length <= 2;
        if (isShortAnswer) {
            return this.isApproximatelyCorrect(teamAnswer, correctAnswer);
        }

        return false;
    }

    /**
     * Update round data with team's answer
     */
    static processRoundAnswer(
        roundsData: RoundData[],
        currentRound: number,
        teamAnswer: string,
        selectedPlayer: string,
        discussionNotes: string
    ): {
        updatedRoundsData: RoundData[],
        isCorrect: boolean
    } {
        const updatedRoundsData = [...roundsData];
        const isCorrect = this.validateAnswer(
            teamAnswer,
            roundsData[currentRound].correctAnswer
        );

        updatedRoundsData[currentRound] = {
            ...updatedRoundsData[currentRound],
            teamAnswer,
            isCorrect,
            playerWhoAnswered: selectedPlayer,
            discussionNotes
        };

        return {updatedRoundsData, isCorrect};
    }

    /**
     * Calculate player performance statistics
     */
    static calculatePlayerPerformance(roundsData: RoundData[]): PlayerPerformance[] {
        // Create a map to aggregate player stats
        const playerStatsMap = new Map<string, { total: number, correct: number }>();

        // Process each round
        roundsData.forEach(round => {
            const player = round.playerWhoAnswered;
            if (!player) return; // Skip if no player answered

            if (!playerStatsMap.has(player)) {
                playerStatsMap.set(player, {total: 0, correct: 0});
            }

            const stats = playerStatsMap.get(player)!;
            stats.total += 1;

            if (round.isCorrect) {
                stats.correct += 1;
            }
        });

        // Convert map to array and calculate percentages
        return Array.from(playerStatsMap.entries())
            .map(([player, stats]) => ({
                player,
                total: stats.total,
                correct: stats.correct,
                percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
            }))
            .sort((a, b) => b.correct - a.correct); // Sort by correct answers
    }

    /**
     * Generate AI host feedback for a round
     */
    static generateRoundFeedback(
        roundData: RoundData,
        enableAIHost: boolean
    ): string {
        if (!enableAIHost) return '';

        if (!roundData.isCorrect) {
            // Check if correct answer was mentioned in discussion notes
            const wasCorrectAnswerDiscussed =
                roundData.discussionNotes.toLowerCase().includes(
                    roundData.correctAnswer.toLowerCase()
                );

            if (wasCorrectAnswerDiscussed) {
                return i18n.t('wwwGame.feedback.discussedCorrect', { answer: roundData.correctAnswer });
            } else {
                return i18n.t('wwwGame.feedback.notDiscussedCorrect', { answer: roundData.correctAnswer });
            }
        } else {
            return i18n.t('wwwGame.feedback.correct', { answer: roundData.correctAnswer });
        }
    }

    /**
     * Generate an AI hint for the current question
     */
    static generateHint(correctAnswer: string): string {
        let hint = i18n.t('wwwGame.hint.characters', { count: correctAnswer.length });

        if (correctAnswer.includes(' ')) {
            hint += i18n.t('wwwGame.hint.words', { count: correctAnswer.split(' ').length });
        }

        // Could add more sophisticated hints here
        return hint;
    }

    /**
     * Generate comprehensive AI feedback for game results
     */
    static generateGameFeedback(
        roundsData: RoundData[],
        performances: PlayerPerformance[]
    ): string {
        // Best performing player
        const bestPlayer = performances.length > 0 ? performances[0] : null;

        // Identifying what topics the team struggled with
        const incorrectQuestions = roundsData.filter(round => !round.isCorrect);

        let feedback = '';

        if (bestPlayer && bestPlayer.total > 1) {
            feedback += `${bestPlayer.player} was your strongest player, answering ${bestPlayer.correct} out of ${bestPlayer.total} questions correctly. `;
        }

        if (incorrectQuestions.length > 0) {
            feedback += 'The team struggled most with questions about ';
            const topics = incorrectQuestions.map(q => {
                const words = q.question.split(' ');
                // Extract a few words to represent the topic
                return words.length > 3 ? words.slice(1, 4).join(' ') : q.question.substring(0, 15);
            }).slice(0, 3);

            feedback += topics.join(', ');
            feedback += '. Consider studying these topics more for next time!';
        } else {
            feedback += 'Your team showed excellent knowledge across all question categories!';
        }

        return feedback;
    }

    /**
     * Generate overall results message based on score
     */
    static generateResultsMessage(score: number, totalRounds: number): string {
        const correctPercentage = (score / totalRounds) * 100;

        if (correctPercentage >= 90) return i18n.t('wwwGame.performance.outstanding');
        if (correctPercentage >= 70) return i18n.t('wwwGame.performance.great');
        if (correctPercentage >= 50) return i18n.t('wwwGame.performance.good');
        if (correctPercentage >= 30) return i18n.t('wwwGame.performance.niceTry');
        return i18n.t('wwwGame.performance.dontGiveUp');
    }

    /**
     * Determine if an answer is approximately correct
     * This provides more flexibility in accepting answers
     */
    static isApproximatelyCorrect(userAnswer: string, correctAnswer: string): boolean {
        // Handle null/undefined inputs
        if (!userAnswer || !correctAnswer) return false;

        // Normalize strings for comparison (trim whitespace, remove punctuation, lowercase)
        const normalizeForComparison = (text: string): string => {
            return text
                .toLowerCase()
                .trim()
                // Use Unicode properties with 'u' flag to keep letters and digits from any language
                .replace(/[^\p{L}\p{N}\s]/gu, "")
                .replace(/\s{2,}/g, " ");
        };

        const normalizedUserAnswer = normalizeForComparison(userAnswer);
        const normalizedCorrectAnswer = normalizeForComparison(correctAnswer);

        // Handle empty strings after normalization
        if (!normalizedUserAnswer || !normalizedCorrectAnswer) return false;

        // Exact match
        if (normalizedUserAnswer === normalizedCorrectAnswer) return true;

        // Check if the answer contains the correct answer (for partial matches)
        // Only use contains check if user answer is substantial (at least 50% of correct answer length)
        const minLengthForContains = Math.max(3, Math.floor(normalizedCorrectAnswer.length * 0.5));
        
        if (normalizedUserAnswer.length >= minLengthForContains) {
            if (normalizedUserAnswer.includes(normalizedCorrectAnswer) ||
                normalizedCorrectAnswer.includes(normalizedUserAnswer)) {
                return true;
            }
        }

        // Calculate similarity ratio using Levenshtein distance
        // This is a simple implementation that could be improved
        const distance = this.levenshteinDistance(normalizedUserAnswer, normalizedCorrectAnswer);
        const maxLength = Math.max(normalizedUserAnswer.length, normalizedCorrectAnswer.length);

        // Avoid division by zero (though this shouldn't happen after our checks above)
        if (maxLength === 0) return false;

        const similarityRatio = 1 - distance / maxLength;

        // Accept answers that are at least 80% similar
        return similarityRatio >= 0.8;
    }

    /**
     * Calculate Levenshtein distance between two strings
     * (Helper for approximate matching)
     */
    private static levenshteinDistance(a: string, b: string): number {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];

        // Initialize matrix
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    /**
     * Analyze discussion notes to find potential answers
     */
    static analyzeDiscussionNotes(
        notes: string,
        correctAnswer: string
    ): {
        mentionedCorrectAnswer: boolean,
        potentialAnswers: string[]
    } {
        // Split notes into sentences
        const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 0);

        // Extract potential answers (simple approach)
        const potentialAnswers: string[] = [];
        const lowercaseNotes = notes.toLowerCase();
        const lowercaseAnswer = correctAnswer.toLowerCase();

        // Check if correct answer was mentioned
        const mentionedCorrectAnswer = lowercaseNotes.includes(lowercaseAnswer);

        // Extract statements that sound like answers
        for (const sentence of sentences) {
            if (
                sentence.includes('maybe') ||
                sentence.includes('could be') ||
                sentence.includes('I think') ||
                sentence.includes('answer is')
            ) {
                potentialAnswers.push(sentence.trim());
            }
        }

                return {mentionedCorrectAnswer, potentialAnswers};
            }
        }
        