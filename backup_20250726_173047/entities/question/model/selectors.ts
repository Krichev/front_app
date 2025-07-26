// src/entities/question/model/selectors.ts
import {createSelector} from '@reduxjs/toolkit';
import type {RootState} from '../../../app/store';
import type {QuestionDifficulty} from './types';

// Base selectors
export const selectQuestionState = (state: RootState) => state.question;

export const selectQuestions = createSelector(
    [selectQuestionState],
    (questionState) => questionState.questions
);

export const selectCurrentQuestion = createSelector(
    [selectQuestionState],
    (questionState) => questionState.currentQuestion
);

export const selectIsLoading = createSelector(
    [selectQuestionState],
    (questionState) => questionState.isLoading
);

export const selectError = createSelector(
    [selectQuestionState],
    (questionState) => questionState.error
);

export const selectCategories = createSelector(
    [selectQuestionState],
    (questionState) => questionState.categories
);

export const selectSources = createSelector(
    [selectQuestionState],
    (questionState) => questionState.sources
);

export const selectDifficulty = createSelector(
    [selectQuestionState],
    (questionState) => questionState.difficulty
);

export const selectSelectedCategory = createSelector(
    [selectQuestionState],
    (questionState) => questionState.selectedCategory
);

// Computed selectors
export const selectQuestionsByDifficulty = createSelector(
    [selectQuestions, (state: RootState, difficulty: QuestionDifficulty) => difficulty],
    (questions, difficulty) => questions.filter(q => q.difficulty === difficulty)
);

export const selectQuestionsByCategory = createSelector(
    [selectQuestions, (state: RootState, category: string) => category],
    (questions, category) => questions.filter(q => q.category === category)
);

export const selectAnsweredQuestions = createSelector(
    [selectQuestions],
    (questions) => questions.filter(q => q.isAnswered)
);

export const selectUnansweredQuestions = createSelector(
    [selectQuestions],
    (questions) => questions.filter(q => !q.isAnswered)
);

export const selectQuestionStats = createSelector(
    [selectQuestions],
    (questions) => {
        const total = questions.length;
        const answered = questions.filter(q => q.isAnswered).length;
        const byDifficulty = questions.reduce((acc, q) => {
            acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
            return acc;
        }, {} as Record<QuestionDifficulty, number>);

        return {
            total,
            answered,
            unanswered: total - answered,
            byDifficulty,
            completionRate: total > 0 ? (answered / total) * 100 : 0,
        };
    }
);

export const selectFilteredQuestions = createSelector(
    [selectQuestions, selectSelectedCategory, selectDifficulty],
    (questions, selectedCategory, difficulty) => {
        return questions.filter(question => {
            const categoryMatch = !selectedCategory || question.category === selectedCategory;
            const difficultyMatch = !difficulty || question.difficulty === difficulty;
            return categoryMatch && difficultyMatch;
        });
    }
);

export const selectQuestionById = createSelector(
    [selectQuestions, (state: RootState, questionId: string) => questionId],
    (questions, questionId) => questions.find(q => q.id === questionId)
);