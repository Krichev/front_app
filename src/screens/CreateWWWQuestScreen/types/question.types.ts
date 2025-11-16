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