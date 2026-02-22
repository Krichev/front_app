// questApp/src/features/question-form/lib/questionValidation.ts
import { 
    isLocalizedStringEmpty, 
    LocalizedString 
} from "../../../shared/types/localized";
import { QuestionType, MediaInfo } from "../model/types";
import { AudioChallengeConfig } from "../../../screens/components/AudioChallengeSection";
import { AUDIO_CHALLENGE_TYPES } from "../../../entities/ChallengeState/model/types";

export interface ValidationResult {
    isValid: boolean;
    errorKey?: string;
    errorText?: string; // For cases where we don't have a key but a fallback message
}

export function validateQuestionForm(
    questionText: LocalizedString,
    answer: LocalizedString,
    questionType: QuestionType,
    uploadedMediaInfo: MediaInfo | null,
    audioConfig: AudioChallengeConfig,
    isEditing: boolean
): ValidationResult {
    if (isLocalizedStringEmpty(questionText)) {
        return { isValid: false, errorKey: 'userQuestions.questionRequiredError' };
    }

    if (isLocalizedStringEmpty(answer)) {
        return { isValid: false, errorKey: 'userQuestions.answerRequiredError' };
    }

    // Image/Video validation
    if ((questionType === 'IMAGE' || questionType === 'VIDEO') && !uploadedMediaInfo && !isEditing) {
        return { 
            isValid: false, 
            errorText: 'Please upload media first or change question type to TEXT' 
        };
    }

    // Audio challenge validation
    if (questionType === 'AUDIO') {
        const audioResult = validateAudioConfig(audioConfig);
        if (!audioResult.isValid) {
            return audioResult;
        }
    }

    return { isValid: true };
}

export function validateAudioConfig(config: AudioChallengeConfig): ValidationResult {
    if (!config.audioChallengeType) {
        return { isValid: false, errorKey: 'audioQuestion.createFailed' };
    }

    // Check if reference audio is required
    const typeInfo = AUDIO_CHALLENGE_TYPES.find(t => t.type === config.audioChallengeType);
    if (typeInfo?.requiresReferenceAudio && !config.referenceAudioFile) {
        return { isValid: false, errorKey: 'audioQuestion.audioRequired' };
    }

    return { isValid: true };
}

export function validateVideoTimeRange(startTime?: number, endTime?: number): ValidationResult {
    if (startTime !== undefined && endTime !== undefined && endTime <= startTime) {
        return { 
            isValid: false, 
            errorText: 'End time must be greater than start time' 
        };
    }
    return { isValid: true };
}
