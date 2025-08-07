// src/utils/quizConfigMapper.ts
import {QuizConfig} from "../entities/QuizState/model/slice/quizApi";
import {QuizChallengeConfig} from "../entities/ChallengeState/model/slice/challengeApi";

/**
 * Maps UI QuizConfig to backend QuizChallengeConfig format
 */
export const mapQuizConfigToBackend = (uiConfig: QuizConfig): QuizChallengeConfig => {
    // Map UI difficulty to backend difficulty format
    const difficultyMap = {
        'Easy': 'EASY' as const,
        'Medium': 'MEDIUM' as const,
        'Hard': 'HARD' as const
    };

    return {
        defaultDifficulty: difficultyMap[uiConfig.difficulty],
        defaultRoundTimeSeconds: uiConfig.roundTime,
        defaultTotalRounds: uiConfig.roundCount,
        enableAiHost: uiConfig.enableAIHost,
        questionSource: 'MIXED', // Default to mixed, can be customized
        allowCustomQuestions: true // Default to true since we're creating custom questions
    };
};

/**
 * Maps backend QuizChallengeConfig to UI QuizConfig format
 */
export const mapQuizConfigFromBackend = (backendConfig: QuizChallengeConfig): QuizConfig => {
    // Map backend difficulty to UI difficulty format
    const difficultyMap = {
        'EASY': 'Easy' as const,
        'MEDIUM': 'Medium' as const,
        'HARD': 'Hard' as const
    };

    return {
        gameType: 'WWW',
        teamName: 'My Team', // Default values since backend doesn't store these
        teamMembers: ['Player 1'],
        difficulty: difficultyMap[backendConfig.defaultDifficulty],
        roundTime: backendConfig.defaultRoundTimeSeconds,
        roundCount: backendConfig.defaultTotalRounds,
        enableAIHost: backendConfig.enableAiHost
    };
};

/**
 * Creates a default QuizChallengeConfig for backend requests
 */
export const createDefaultQuizChallengeConfig = (
    difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium',
    roundTime: number = 60,
    roundCount: number = 10,
    enableAI: boolean = true
): QuizChallengeConfig => {
    return mapQuizConfigToBackend({
        gameType: 'WWW',
        teamName: 'Default Team',
        teamMembers: ['Player 1'],
        difficulty,
        roundTime,
        roundCount,
        enableAIHost: enableAI
    });
};