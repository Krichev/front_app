// src/entities/question/index.ts
export type {
    QuestionData,
    ParsedQuestion,
    QuestionDifficulty,
    QuestionSource,
    QuestionCategory,
    QuestionState,
    AnswerValidationResult,
    QuestionAnalysis,
} from './model/types';

export { questionSlice, questionActions } from './model/slice';
export { questionSelectors } from './model/selectors';

export {
    parseXMLQuestion,
    fetchQuestionsFromSource,
    getFallbackQuestions,
    validateAnswer,
    analyzeDiscussionNotes,
} from './lib/questionService';

export {
    classifyQuestionDifficulty,
    calculateAnswerSimilarity,
    extractPotentialAnswers,
} from './lib/difficultyClassifier';

export {
    normalizeAnswer,
    cleanQuestionText,
    formatQuestionForDisplay,
    isValidQuestion,
} from './lib/utils';
