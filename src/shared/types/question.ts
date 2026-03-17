// src/shared/types/question.ts

/**
 * Type of quiz question based on primary interaction/media
 */
export const QuestionType = {
    TEXT: 'TEXT',
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
    AUDIO: 'AUDIO'
} as const;

export type QuestionType = keyof typeof QuestionType;

/**
 * List of all question types for iteration
 */
export const QUESTION_TYPES: QuestionType[] = ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'];
