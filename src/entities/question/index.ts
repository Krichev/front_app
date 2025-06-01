// src/entities/question/index.ts
export { questionApi } from './api';
export { questionSlice, questionActions } from './model/slice';
export type { Question, CreateQuestionRequest, QuestionFilters } from './model/types';
export { QuestionCard } from './ui/question-card';

// Re-export API hooks
export {
    useGetQuestionsQuery,
    useGetUserQuestionsQuery,
    useCreateQuestionMutation,
    useUpdateQuestionMutation,
    useDeleteQuestionMutation,
    useGetQuestionsByDifficultyQuery,
    useSearchQuestionsQuery,
} from './api';