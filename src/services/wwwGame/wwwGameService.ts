// src/services/wwwGame/wwwGameService.ts
import i18n from '../../shared/config/i18n/i18n';
import {QuizQuestion} from '../../entities/QuizState/model/slice/quizApi';
import {Difficulty} from '../../shared/types/difficulty';

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
    difficulty: Difficulty;
    roundTime: number;
    roundCount: number;
    enableAIHost: boolean;
    enableAiAnswerValidation?: boolean;
    // Add these new properties:
    questionSource?: 'app' | 'user';
    userQuestions?: QuizQuestion[];
    challengeId?: string; // Challenge ID for tracking
}

export type GamePhase = 'question' | 'discussion' | 'answer' | 'feedback';

import {DeepSeekHostService} from './deepseekHostService';

export class WWWGameService {
    /**
     * Initialize a new game
     */
    static initializeGame(settings: GameSettings): {
        gameQuestions: Array<{ question: string, answer: string }>,
        roundsData: RoundData[]
    } {
        return {
            gameQuestions: [],
            roundsData: []
        };
    }

    /**
     * Process a round answer
     */
    static processRoundAnswer(
        answer: string,
        correctAnswer: string,
        playerWhoAnswered: string,
        discussionNotes: string,
        roundsData: RoundData[]
    ): {
        updatedRoundsData: RoundData[],
        isCorrect: boolean
    } {
        const isCorrect = answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
        
        const newRoundData: RoundData = {
            question: '', // Should be filled by caller
            correctAnswer,
            teamAnswer: answer,
            isCorrect,
            playerWhoAnswered,
            discussionNotes
        };

        return {
            updatedRoundsData: [...roundsData, newRoundData],
            isCorrect
        };
    }

    /**
     * Enhanced answer validation with optional AI semantic matching
     */
    static async validateAnswer(
        userAnswer: string,
        correctAnswer: string,
        enableAi: boolean = false,
        language: string = 'en'
    ): Promise<{
        isCorrect: boolean;
        confidence?: number;
        explanation?: string;
        aiUsed?: boolean;
    }> {
        if (!userAnswer) return { isCorrect: false };

        const normalizedUser = userAnswer.trim().toLowerCase();
        const normalizedCorrect = correctAnswer.trim().toLowerCase();

        // 1. Simple exact match or subset check
        if (normalizedUser === normalizedCorrect || normalizedCorrect.includes(normalizedUser)) {
            return { isCorrect: true };
        }

        // 2. AI semantic matching if enabled
        if (enableAi) {
            try {
                const result = await DeepSeekHostService.validateAnswerWithAi(
                    userAnswer,
                    correctAnswer,
                    language
                );
                
                // We consider it correct if AI is confident (e.g. > 0.7)
                return {
                    isCorrect: result.equivalent && result.confidence >= 0.7,
                    confidence: result.confidence,
                    explanation: result.explanation,
                    aiUsed: true
                };
            } catch (error) {
                console.error('AI Answer Validation failed:', error);
                // Fallback to simple comparison already done
            }
        }

        return { isCorrect: false };
    }

    /**
     * Calculate comprehensive game results and player performance
     */
    static calculateResults(
        teamName: string,
        rounds: RoundData[],
        teamMembers: string[]
    ) {
        const totalRounds = rounds.length;
        const correctAnswers = rounds.filter(r => r.isCorrect).length;
        const scorePercentage = totalRounds > 0 ? Math.round((correctAnswers / totalRounds) * 100) : 0;

        // Calculate performance per player
        const playerPerformances: PlayerPerformance[] = teamMembers.map(player => {
            const playerRounds = rounds.filter(r => r.playerWhoAnswered === player);
            const total = playerRounds.length;
            const correct = playerRounds.filter(r => r.isCorrect).length;
            const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

            return {
                player,
                total,
                correct,
                percentage
            };
        });

        return {
            teamName,
            totalRounds,
            correctAnswers,
            scorePercentage,
            playerPerformances
        };
    }

    static calculatePlayerPerformance(rounds: RoundData[]): PlayerPerformance[] {
        const players = Array.from(new Set(rounds.map(r => r.playerWhoAnswered).filter(Boolean)));
        return players.map(player => {
            const playerRounds = rounds.filter(r => r.playerWhoAnswered === player);
            const correct = playerRounds.filter(r => r.isCorrect).length;
            return {
                player,
                total: playerRounds.length,
                correct,
                percentage: Math.round((correct / playerRounds.length) * 100)
            };
        });
    }

    static generateResultsMessage(score: number, total: number): string {
        const percentage = total > 0 ? (score / total) * 100 : 0;
        if (percentage >= 80) return i18n.t('game.results.excellent');
        if (percentage >= 60) return i18n.t('game.results.good');
        if (percentage >= 40) return i18n.t('game.results.fair');
        return i18n.t('game.results.poor');
    }

    static generateGameFeedback(rounds: RoundData[], performances: PlayerPerformance[]): string {
        // Simple local version, could be enhanced with AI
        const bestPlayer = [...performances].sort((a, b) => b.correct - a.correct)[0];
        if (bestPlayer && bestPlayer.correct > 0) {
            return `Great job! ${bestPlayer.player} was the MVP with ${bestPlayer.correct} correct answers.`;
        }
        return "Thanks for playing! Keep practicing to improve your score.";
    }

    /**
     * Generate AI-driven final game summary using DeepSeek
     */
    static async generateFinalSummary(
        teamName: string,
        results: any,
        rounds: RoundData[]
    ): Promise<string> {
        try {
            // Prepare the question/answer data for analysis
            const questionData = rounds.map(r => ({
                question: r.question,
                correctAnswer: r.correctAnswer,
                teamAnswer: r.teamAnswer,
                isCorrect: r.isCorrect
            }));

            // Use DeepSeek to generate encouraging summary
            return await DeepSeekHostService.generateGameFeedback(
                teamName,
                results.correctAnswers,
                results.totalRounds,
                results.playerPerformances,
                questionData
            );
        } catch (error) {
            console.error('Failed to generate AI summary:', error);
            return `Congratulations ${teamName}! You correctly answered ${results.correctAnswers} out of ${results.totalRounds} questions. Well done!`;
        }
    }

    /**
     * Parse and normalize speech-to-text transcriptions for analysis
     */
    static normalizeTranscription(transcript: string): string {
        return transcript
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    }
}
