// src/utils/quizConfigMapper.ts
import {QuizConfig} from "../entities/QuizState/model/slice/quizApi";
import {QuizChallengeConfig} from "../entities/ChallengeState/model/slice/challengeApi";

/**
 * Maps UI QuizConfig to backend QuizChallengeConfig format
 * COMPLETE IMPLEMENTATION - All fields are now mapped correctly
 *
 * @param uiConfig - The quiz configuration from the UI
 * @returns Backend-formatted quiz configuration
 */
export const mapQuizConfigToBackend = (uiConfig: QuizConfig): QuizChallengeConfig => {
    // Normalize difficulty to uppercase for consistent lookup
    const normalizedDifficulty = uiConfig.difficulty?.toUpperCase() || 'MEDIUM';
    
    // Map UI difficulty to backend difficulty format
    const difficultyMap: Record<string, 'EASY' | 'MEDIUM' | 'HARD'> = {
        'EASY': 'EASY',
        'MEDIUM': 'MEDIUM',
        'HARD': 'HARD'
    };

    // Create complete backend config with ALL fields
    const backendConfig: QuizChallengeConfig = {
        // Mapped fields (format conversion)
        defaultDifficulty: difficultyMap[normalizedDifficulty] || 'MEDIUM',
        defaultRoundTimeSeconds: uiConfig.roundTime,
        defaultTotalRounds: uiConfig.roundCount,
        enableAiHost: uiConfig.enableAIHost,
        enableAiAnswerValidation: uiConfig.enableAiAnswerValidation,

        // Default values
        questionSource: 'MIXED',
        allowCustomQuestions: true,

        // Direct pass-through fields (NEW - these were missing!)
        gameType: uiConfig.gameType,
        teamName: uiConfig.teamName || '',  // OK to be empty for challenge creation
        teamMembers: uiConfig.teamMembers || [],  // OK to be empty for challenge creation
        teamBased: uiConfig.teamBased ?? false
    };

    console.log('Mapping UI config to backend:');
    console.log('  UI:', uiConfig);
    console.log('  Backend:', backendConfig);

    return backendConfig;
};

/**
 * Maps backend QuizChallengeConfig to UI QuizConfig format
 * Used when retrieving and displaying quiz challenges
 *
 * @param backendConfig - The quiz configuration from the backend
 * @returns UI-formatted quiz configuration
 */
export const mapQuizConfigFromBackend = (backendConfig: QuizChallengeConfig): QuizConfig => {
    // Map backend difficulty to UI difficulty format
    const difficultyMap: Record<'EASY' | 'MEDIUM' | 'HARD', 'EASY' | 'MEDIUM' | 'HARD'> = {
        'EASY': 'EASY',
        'MEDIUM': 'MEDIUM',
        'HARD': 'HARD'
    };

    // Create complete UI config with ALL fields
    const uiConfig: QuizConfig = {
        gameType: (backendConfig.gameType || 'WWW') as 'WWW',
        teamName: backendConfig.teamName || 'My Team',
        teamMembers: backendConfig.teamMembers || ['Player 1'],
        difficulty: difficultyMap[backendConfig.defaultDifficulty] || 'MEDIUM',
        roundTime: backendConfig.defaultRoundTimeSeconds || 60,
        roundCount: backendConfig.defaultTotalRounds || 10,
        enableAIHost: backendConfig.enableAiHost ?? true,
        enableAiAnswerValidation: backendConfig.enableAiAnswerValidation ?? false,
        teamBased: backendConfig.teamBased ?? false
    };

    console.log('Mapping backend config to UI:');
    console.log('  Backend:', backendConfig);
    console.log('  UI:', uiConfig);

    return uiConfig;
};

/**
 * Creates a default QuizChallengeConfig for backend requests
 * Useful for quick testing or default values
 */
export const createDefaultQuizChallengeConfig = (
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM',
    roundTime: number = 60,
    roundCount: number = 10,
    enableAI: boolean = true,
    teamName: string = 'Default Team',
    teamMembers: string[] = ['Player 1']
): QuizChallengeConfig => {
    return mapQuizConfigToBackend({
        gameType: 'WWW',
        teamName,
        teamMembers,
        difficulty,
        roundTime,
        roundCount,
        enableAIHost: enableAI,
        enableAiAnswerValidation: false,
        teamBased: false
    });
};

/**
 * Validates that all required fields are present in the UI config
 * Returns an array of validation error messages
 */
export const validateQuizConfig = (config: QuizConfig): string[] => {
    const errors: string[] = [];

    if (!config.teamName || config.teamName.trim() === '') {
        errors.push('Team name is required');
    }

    if (!config.teamMembers || config.teamMembers.length === 0) {
        errors.push('At least one team member is required');
    }

    if (config.roundTime < 10) {
        errors.push('Round time must be at least 10 seconds');
    }

    if (config.roundTime > 300) {
        errors.push('Round time must not exceed 300 seconds');
    }

    if (config.roundCount < 1) {
        errors.push('Must have at least 1 question');
    }

    if (config.roundCount > 50) {
        errors.push('Cannot exceed 50 questions');
    }

    return errors;
};

/**
 * Pretty prints the quiz configuration for debugging
 */
export const debugPrintConfig = (config: QuizConfig | QuizChallengeConfig, label: string = 'Config') => {
    console.log(`\n=== ${label} ===`);
    console.log(JSON.stringify(config, null, 2));
    console.log('=================\n');
};