// src/entities/question/model/selectors.ts
import type {RootState} from '../../../app/store';

export const questionSelectors = {
    selectQuestions: (state: RootState) => state.question.questions,
    selectCurrentQuestion: (state: RootState) => state.question.currentQuestion,
    selectIsLoading: (state: RootState) => state.question.isLoading,
    selectError: (state: RootState) => state.question.error,
    selectSources: (state: RootState) => state.question.sources,
    selectCategories: (state: RootState) => state.question.categories,
    selectDifficulty: (state: RootState) => state.question.difficulty,
    selectSelectedCategory: (state: RootState) => state.question.selectedCategory,

    selectQuestionsByDifficulty: (difficulty: string) => (state: RootState) =>
        state.question.questions.filter(q => q.difficulty === difficulty),

    selectQuestionsByCategory: (category: string) => (state: RootState) =>
        state.question.questions.filter(q => q.category === category),

    selectFilteredQuestions: (state: RootState) => {
        let filtered = state.question.questions;

        if (state.question.difficulty) {
            filtered = filtered.filter(q => q.difficulty === state.question.difficulty);
        }

        if (state.question.selectedCategory) {
            filtered = filtered.filter(q => q.category === state.question.selectedCategory);
        }

        return filtered;
    },

    selectActiveSources: (state: RootState) =>
        state.question.sources.filter(source => source.isActive),

    selectHasQuestions: (state: RootState) => state.question.questions.length > 0,
    selectHasError: (state: RootState) => state.question.error !== null,
};