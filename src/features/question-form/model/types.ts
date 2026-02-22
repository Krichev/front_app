// questApp/src/features/question-form/model/types.ts
import { 
    QuestionVisibility, 
    MediaSourceType 
} from "../../../entities/QuizState/model/types/question.types";
import { AudioChallengeConfig } from "../../../screens/components/AudioChallengeSection";
import { LocalizedString } from "../../../shared/types/localized";

/**
 * Media information for uploaded files
 */
export interface MediaInfo {
    mediaId: string | number;
    mediaUrl: string;
    mediaType: string;
    thumbnailUrl?: string;
}

/**
 * Question form data structure
 * This is exported and used by parent components
 */
export interface QuestionFormData {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic: string;
    additionalInfo: string;
    questionLocalized?: LocalizedString;
    answerLocalized?: LocalizedString;
    additionalInfoLocalized?: LocalizedString;
    questionType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
    media?: MediaInfo;
    visibility: QuestionVisibility;
    audioConfig?: AudioChallengeConfig;
    // External Media
    mediaSourceType?: MediaSourceType;
    externalMediaUrl?: string;
    questionVideoStartTime?: number;
    questionVideoEndTime?: number;
    answerMediaUrl?: string;
    answerVideoStartTime?: number;
    answerVideoEndTime?: number;
    answerTextVerification?: string;
}

export type QuestionType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';
