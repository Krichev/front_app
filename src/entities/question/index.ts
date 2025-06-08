// src/entities/question/index.ts
export { questionApi } from './api';
export { questionSlice, questionActions } from './model';
export type { Question, UserQuestion, QuestionDifficulty } from './model/types';
export { QuestionCard, QuestionList } from './ui';

// Re-export API hooks
export {
    useGetQuestionsQuery,
    useCreateQuestionMutation,
    useUpdateQuestionMutation,
    useDeleteQuestionMutation,
    useGetUserQuestionsQuery,
    useSearchQuestionsQuery,
} from './api';