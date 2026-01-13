// src/screens/CreateWWWQuestScreen/types/question.types.ts
import {QuizQuestion} from '../../../entities/QuizState/model/slice/quizApi';
import {APIDifficulty} from '../../../services/wwwGame/questionService';

/**
 * Question for quest creation - all questions must be from database
 * Supports only 'app' and 'user' sources
 */
export interface BaseQuestionForQuest {
    id: number;  // Always numeric - from database
    question: string;
    answer: string;
    difficulty: APIDifficulty;
    topic?: string;
    additionalInfo?: string;
    source: 'app' | 'user';  // ✅ Only two sources
}

/**
 * Helper to convert QuizQuestion to BaseQuestionForQuest
 */
export function toBaseQuestion(
    question: QuizQuestion,
    source: 'app' | 'user'
): BaseQuestionForQuest {
    return {
        id: question.id,
        question: question.question,
        answer: question.answer,
        difficulty: question.difficulty,
        topic: question.topic,
        additionalInfo: question.additionalInfo,
        source,
    };
}

/**
 * Helper to extract question IDs for API calls
 */
export function extractQuestionIds(questions: BaseQuestionForQuest[]): number[] {
    return questions.map(q => q.id);
}

// ============================================================================
// NEW TYPES FOR QUESTION CREATION
// ============================================================================

export type QuestionCategory = 'REGULAR' | 'KARAOKE';

export interface RegularQuestionData {
    question: string;
    answer: string;
    topic?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    sources?: string;
    additionalInfo?: string;
    // Optional media - can have ONE of these
    mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | null;
    mediaFile?: {uri: string; type: string; name: string} | null;
}

export interface KaraokeQuestionData {
    question: string;
    answer: string;
    audioChallengeType: 'RHYTHM_CREATION' | 'RHYTHM_REPEAT' | 'SOUND_MATCH' | 'SINGING';
    referenceAudio: {uri: string; type: string; name: string};
    audioSegmentStart?: number;
    audioSegmentEnd?: number;
    minimumScorePercentage?: number;
    rhythmBpm?: number;
    rhythmTimeSignature?: string;
    topic?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}
