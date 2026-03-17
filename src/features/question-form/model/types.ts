// questApp/src/features/question-form/model/types.ts
import { 
    QuestionVisibility, 
    MediaSourceType 
} from "../../../entities/QuizState/model/types/question.types";
import { AudioChallengeConfig } from "../../../screens/components/AudioChallengeSection";
import { LocalizedString } from "../../../shared/types/localized";
import { Difficulty, QuestionType } from "../../../shared/types";

export type { DifficultyLevel, QuestionType } from "../../../shared/types";

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
    difficulty: Difficulty;
    topic: string;
    additionalInfo: string;
    questionLocalized: LocalizedString;
    answerLocalized: LocalizedString;
    additionalInfoLocalized: LocalizedString;
    questionType: QuestionType;
    visibility: QuestionVisibility;
    audioConfig: AudioChallengeConfig;
    acceptSimilarAnswers?: boolean;
    
    // Media and external content
    mediaInfo?: MediaInfo;
    mediaFile?: {
        uri: string;
        name: string;
        type: string;
    };
    mediaSourceType?: MediaSourceType;
    externalMediaUrl?: string;
    questionVideoStartTime?: number;
    questionVideoEndTime?: number;
    answerMediaUrl?: string;
    answerVideoStartTime?: number;
    answerVideoEndTime?: number;
    answerTextVerification?: string;
}
