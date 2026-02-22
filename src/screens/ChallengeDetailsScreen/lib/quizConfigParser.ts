export interface ParsedQuizConfig {
    gameType?: string;           // 'WWW' | 'BLITZ' | 'TRIVIA' | 'CUSTOM' | 'AUDIO'
    gameMode?: string;           // 'STANDARD' | 'BRAIN_RING' | 'BLITZ'
    answerTimeSeconds?: number;
    difficulty?: string;         // 'EASY' | 'MEDIUM' | 'HARD'
    roundCount?: number;
    roundTime?: number;
    teamName?: string;
    teamMembers?: string[];
    enableAIHost?: boolean;
    enableAiAnswerValidation?: boolean;
    teamBased?: boolean;
    audioChallengeType?: string; // For AUDIO: 'RHYTHM_CREATION' | 'RHYTHM_REPEAT' | 'SOUND_MATCH' | 'SINGING'
}

export function parseQuizConfig(quizConfigJson?: string | null): ParsedQuizConfig | null {
    if (!quizConfigJson) return null;
    try {
        return JSON.parse(quizConfigJson) as ParsedQuizConfig;
    } catch (e) {
        console.error('Error parsing quiz config:', e);
        return null;
    }
}

export function isWWWQuiz(config: ParsedQuizConfig | null): boolean {
    return config?.gameType === 'WWW';
}

export function isBlitzQuiz(config: ParsedQuizConfig | null): boolean {
    return config?.gameType === 'BLITZ';
}

export function isTriviaQuiz(config: ParsedQuizConfig | null): boolean {
    return config?.gameType === 'TRIVIA';
}

export function isCustomQuiz(config: ParsedQuizConfig | null): boolean {
    return config?.gameType === 'CUSTOM';
}

export function isAudioQuiz(config: ParsedQuizConfig | null): boolean {
    return config?.gameType === 'AUDIO';
}

export function isPuzzleQuiz(config: ParsedQuizConfig | null): boolean {
    return config?.gameType === 'PUZZLE';
}
