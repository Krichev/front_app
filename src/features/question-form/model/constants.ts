// questApp/src/features/question-form/model/constants.ts
import { QuestionType, QUESTION_TYPES } from '../../../shared/types';
import { Difficulty, DIFFICULTY_LEVELS } from '../../../shared/types/difficulty';
import { QuestionVisibility } from '../../../entities/QuizState/model/types/question.types';
import { EMPTY_LOCALIZED_STRING } from '../../../shared/types/localized';
import { DEFAULT_AUDIO_CONFIG } from '../../../screens/components/AudioChallengeSection';

export { DIFFICULTY_LEVELS, QUESTION_TYPES };

export const DEFAULT_FORM_DATA = {
    questionText: EMPTY_LOCALIZED_STRING,
    answer: EMPTY_LOCALIZED_STRING,
    difficulty: 'MEDIUM' as Difficulty,
    topic: '',
    additionalInfo: EMPTY_LOCALIZED_STRING,
    questionType: 'TEXT' as QuestionType,
    visibility: QuestionVisibility.PRIVATE,
    audioConfig: DEFAULT_AUDIO_CONFIG,
};
