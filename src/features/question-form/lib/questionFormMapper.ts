// questApp/src/features/question-form/lib/questionFormMapper.ts
import { 
    getLocalizedValue, 
    LocalizedString 
} from "../../../shared/types/localized";
import { QuestionType, DifficultyLevel, QuestionFormData, MediaInfo } from "../model/types";
import { QuestionVisibility, MediaSourceType } from "../../../entities/QuizState/model/types/question.types";
import { AudioChallengeConfig } from "../../../screens/components/AudioChallengeSection";
import { isValidYouTubeUrl } from "../../../utils/youtubeUtils";

export function mapFormStateToPayload(params: {
    questionText: LocalizedString;
    answer: LocalizedString;
    difficulty: DifficultyLevel;
    topic: string;
    additionalInfo: LocalizedString;
    visibility: QuestionVisibility;
    questionType: QuestionType;
    mediaSourceType: MediaSourceType;
    uploadedMediaInfo: MediaInfo | null;
    externalUrl: string;
    qStartTime: number;
    qEndTime?: number;
    answerMediaType: 'SAME' | 'DIFFERENT' | 'TEXT';
    answerUrl: string;
    aStartTime: number;
    aEndTime?: number;
    answerTextVerification: string;
    audioConfig: AudioChallengeConfig;
    currentLanguage: string;
}): QuestionFormData {
    const {
        questionText,
        answer,
        difficulty,
        topic,
        additionalInfo,
        visibility,
        questionType,
        mediaSourceType,
        uploadedMediaInfo,
        externalUrl,
        qStartTime,
        qEndTime,
        answerMediaType,
        answerUrl,
        aStartTime,
        aEndTime,
        answerTextVerification,
        audioConfig,
        currentLanguage
    } = params;

    const payload: QuestionFormData = {
        question: getLocalizedValue(questionText, currentLanguage) || '',
        answer: getLocalizedValue(answer, currentLanguage) || '',
        difficulty,
        topic: topic.trim() || '',
        additionalInfo: getLocalizedValue(additionalInfo, currentLanguage) || '',
        visibility,
        questionType,
        questionLocalized: questionText,
        answerLocalized: answer,
        additionalInfoLocalized: additionalInfo,
    };

    // Media info for IMAGE/VIDEO
    if (questionType === 'IMAGE' || questionType === 'VIDEO') {
        if (mediaSourceType === MediaSourceType.UPLOADED && uploadedMediaInfo) {
            payload.media = uploadedMediaInfo;
            payload.mediaSourceType = MediaSourceType.UPLOADED;
        } else if (mediaSourceType !== MediaSourceType.UPLOADED && externalUrl) {
            const isYouTube = isValidYouTubeUrl(externalUrl);
            payload.mediaSourceType = isYouTube ? MediaSourceType.YOUTUBE : MediaSourceType.EXTERNAL_URL;
            payload.externalMediaUrl = externalUrl;
            payload.questionVideoStartTime = qStartTime;
            payload.questionVideoEndTime = qEndTime;
            
            if (answerMediaType === 'SAME') {
                payload.answerMediaUrl = externalUrl;
                payload.answerVideoStartTime = aStartTime;
                payload.answerVideoEndTime = aEndTime;
            } else if (answerMediaType === 'DIFFERENT' && answerUrl) {
                payload.answerMediaUrl = answerUrl;
                payload.answerVideoStartTime = aStartTime;
                payload.answerVideoEndTime = aEndTime;
            }
            
            payload.answerTextVerification = answerTextVerification;
        }
    }

    // Audio config for AUDIO type
    if (questionType === 'AUDIO' && audioConfig.audioChallengeType) {
        payload.audioConfig = audioConfig;
        // The API might expect flat fields as well based on the submitAudioQuestion multipart logic
        // But for the general QuestionFormData we can keep audioConfig
    }

    return payload;
}
