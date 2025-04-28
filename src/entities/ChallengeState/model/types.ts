// Add this to a types file (e.g., src/entities/ChallengeState/model/types.ts)

/**
 * Type definition for What? Where? When? quiz configuration
 */
export interface WWWQuizConfig {
    /** The game type identifier */
    gameType: 'WWW';
    /** The team name */
    teamName: string;
    /** List of team member names */
    teamMembers: string[];
    /** Difficulty level of quiz questions */
    difficulty: 'Easy' | 'Medium' | 'Hard';
    /** Time allowed for discussion in seconds */
    roundTime: number;
    /** Number of questions in the quiz */
    roundCount: number;
    /** Whether AI host features are enabled */
    enableAIHost: boolean;
    /** Whether the quiz is team-based (optional) */
    teamBased?: boolean;
}

/**
 * Union type to support different quiz types in the future
 */
export type QuizConfig = WWWQuizConfig | OtherQuizConfig;

/**
 * Placeholder for other quiz types we might add in the future
 */
interface OtherQuizConfig {
    gameType: string;
    [key: string]: any;
}

/**
 * Helper function to parse quiz configuration from JSON string
 */
export function parseQuizConfig(quizConfigJson: string | undefined): QuizConfig | null {
    if (!quizConfigJson) return null;

    try {
        const config = JSON.parse(quizConfigJson);
        return config;
    } catch (e) {
        console.error('Error parsing quiz config:', e);
        return null;
    }
}

/**
 * Type guard to check if a quiz config is a WWW quiz
 */
export function isWWWQuiz(config: QuizConfig | null): config is WWWQuizConfig {
    return !!config && config.gameType === 'WWW';
}