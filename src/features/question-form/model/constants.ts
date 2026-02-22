// questApp/src/features/question-form/model/constants.ts
import { QuestionType, DifficultyLevel } from './types';
import { QuestionVisibility } from '../../../entities/QuizState/model/types/question.types';
import { EMPTY_LOCALIZED_STRING } from '../../../shared/types/localized';
import { DEFAULT_AUDIO_CONFIG } from '../../../screens/components/AudioChallengeSection';

export const QUESTION_TYPES: QuestionType[] = ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'];
export const DIFFICULTY_LEVELS: DifficultyLevel[] = ['EASY', 'MEDIUM', 'HARD'];

export const DEFAULT_FORM_DATA = {
    questionText: EMPTY_LOCALIZED_STRING,
    answer: EMPTY_LOCALIZED_STRING,
    difficulty: 'MEDIUM' as DifficultyLevel,
    topic: '',
    additionalInfo: EMPTY_LOCALIZED_STRING,
    questionType: 'TEXT' as QuestionType,
    visibility: QuestionVisibility.PRIVATE,
    audioConfig: DEFAULT_AUDIO_CONFIG,
};
