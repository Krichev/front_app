// questApp/src/features/question-form/hooks/useQuestionSubmit.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { QuestionService, UserQuestion } from "../../../services/wwwGame/questionService";
import { QuestionFormData, MediaInfo, QuestionType, DifficultyLevel } from "../model/types";
import { validateQuestionForm } from "../lib/questionValidation";
import { mapFormStateToPayload } from "../lib/questionFormMapper";
import { LocalizedString } from "../../../shared/types/localized";
import { QuestionVisibility, MediaSourceType } from "../../../entities/QuizState/model/types/question.types";
import { AudioChallengeConfig } from "../../../screens/components/AudioChallengeSection";
import { ProcessedFileInfo } from "../../../services/speech/FileService";

interface UseQuestionSubmitOptions {
    isEditing: boolean;
    existingQuestion?: UserQuestion;
    onQuestionSubmit?: (data: QuestionFormData) => void;
    currentLanguage: string;
}

export function useQuestionSubmit({
    isEditing,
    existingQuestion,
    onQuestionSubmit,
    currentLanguage
}: UseQuestionSubmitOptions) {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitAudioQuestion = async (
        questionData: any,
        audioFile: ProcessedFileInfo
    ): Promise<void> => {
        const formData = new FormData();

        formData.append('request', JSON.stringify({
            question: questionData.question,
            answer: questionData.answer,
            audioChallengeType: questionData.audioChallengeType,
            topic: questionData.topic,
            difficulty: questionData.difficulty,
            visibility: questionData.visibility,
            additionalInfo: questionData.additionalInfo,
            audioSegmentStart: questionData.audioSegmentStart,
            audioSegmentEnd: questionData.audioSegmentEnd,
            minimumScorePercentage: questionData.minimumScorePercentage,
            rhythmBpm: questionData.rhythmBpm,
            rhythmTimeSignature: questionData.rhythmTimeSignature,
        }));

        formData.append('referenceAudio', {
            uri: audioFile.uri,
            name: audioFile.name,
            type: audioFile.type,
        } as any);

        const response = await fetch('http://10.0.2.2:8082/api/questions/audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to create audio question');
        }
    };

    const handleSubmit = useCallback(async (params: {
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
    }) => {
        const validation = validateQuestionForm(
            params.questionText,
            params.answer,
            params.questionType,
            params.uploadedMediaInfo,
            params.audioConfig,
            isEditing
        );

        if (!validation.isValid) {
            Alert.alert(
                t('userQuestions.errorTitle'),
                validation.errorKey ? t(validation.errorKey as any) : validation.errorText
            );
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditing && existingQuestion) {
                // Mapping matching QuestionService.updateUserQuestion DTO
                await QuestionService.updateUserQuestion(existingQuestion.id, {
                    question: params.questionText.en || params.questionText.ru,
                    answer: params.answer.en || params.answer.ru,
                    difficulty: params.difficulty,
                    topic: params.topic.trim() || undefined,
                    additionalInfo: params.additionalInfo.en || params.additionalInfo.ru || undefined,
                    visibility: params.visibility,
                });

                Alert.alert(t('userQuestions.successTitle'), t('userQuestions.updateSuccess'));
            } else {
                const questionData: any = mapFormStateToPayload({
                    ...params,
                    currentLanguage,
                });

                // Flatten audio data for API if needed (multiparts or creation payload)
                if (params.questionType === 'AUDIO' && params.audioConfig.audioChallengeType) {
                    questionData.audioChallengeType = params.audioConfig.audioChallengeType;
                    questionData.minimumScorePercentage = params.audioConfig.minimumScorePercentage;
                    questionData.audioSegmentStart = params.audioConfig.audioSegmentStart;
                    questionData.audioSegmentEnd = params.audioConfig.audioSegmentEnd;

                    if (params.audioConfig.rhythmBpm) {
                        questionData.rhythmBpm = params.audioConfig.rhythmBpm;
                    }
                    if (params.audioConfig.rhythmTimeSignature) {
                        questionData.rhythmTimeSignature = params.audioConfig.rhythmTimeSignature;
                    }
                }

                if (params.questionType === 'AUDIO' && params.audioConfig.referenceAudioFile) {
                    await submitAudioQuestion(questionData, params.audioConfig.referenceAudioFile);
                    Alert.alert(t('userQuestions.successTitle'), t('audioQuestion.createSuccess'));
                } else if (onQuestionSubmit) {
                    onQuestionSubmit({
                        ...questionData,
                        media: params.uploadedMediaInfo || undefined,
                        audioConfig: params.questionType === 'AUDIO' ? params.audioConfig : undefined,
                    });
                } else {
                    const apiPayload = {...questionData};
                    if (params.uploadedMediaInfo && params.questionType !== 'AUDIO') {
                        apiPayload.mediaFileId = params.uploadedMediaInfo.mediaId;
                    }

                    await QuestionService.createUserQuestion(apiPayload);
                    Alert.alert(t('userQuestions.successTitle'), t('userQuestions.createSuccess'));
                }
            }

            navigation.navigate('UserQuestions');
        } catch (error) {
            console.error('Error saving question:', error);
            Alert.alert(t('userQuestions.errorTitle'), t('userQuestions.saveFailed'));
        } finally {
            setIsSubmitting(false);
        }
    }, [isEditing, existingQuestion, currentLanguage, t, navigation, onQuestionSubmit]);

    return {
        isSubmitting,
        handleSubmit,
    };
}
