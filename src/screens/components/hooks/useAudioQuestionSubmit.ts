// src/screens/components/hooks/useAudioQuestionSubmit.ts
import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import { useDispatch } from 'react-redux';
import {
    useCreateAudioQuestionMutation,
    CreateAudioQuestionRequest,
    AudioChallengeType,
} from '../../../entities/AudioChallengeState/model/slice/audioChallengeApi';
import { quizApi } from '../../../entities/QuizState/model/slice/quizApi';
import {ProcessedFileInfo} from '../../../services/speech/FileService';
import {AudioQuestionFormData} from '../AudioQuestionForm';
import {getLocalizedValue, isLocalizedStringEmpty, createLocalizedString} from '../../../shared/types/localized';
import { useI18n } from '../../../app/providers/I18nProvider';

// ============================================================================
// TYPES
// ============================================================================

export interface UseAudioQuestionSubmitOptions {
    /** Callback after successful submission */
    onSuccess?: (questionId: number) => void;
    /** Callback after failed submission */
    onError?: (error: Error) => void;
}

export interface UseAudioQuestionSubmitReturn {
    /** Submit the audio question form */
    submitAudioQuestion: (formData: AudioQuestionFormData) => Promise<void>;
    /** Whether submission is in progress */
    isSubmitting: boolean;
    /** Last error that occurred */
    error: Error | null;
    /** Reset the error state */
    resetError: () => void;
    /** Reset the mutation state */
    resetMutation: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export const useAudioQuestionSubmit = (
    options: UseAudioQuestionSubmitOptions = {}
): UseAudioQuestionSubmitReturn => {
    const {onSuccess, onError} = options;
    const {currentLanguage} = useI18n();
    const dispatch = useDispatch();

    const [createAudioQuestion, {isLoading, reset}] = useCreateAudioQuestionMutation();
    const [error, setError] = useState<Error | null>(null);

    const submitAudioQuestion = useCallback(
        async (formData: AudioQuestionFormData) => {
            try {
                setError(null);

                const questionText = getLocalizedValue(formData.question, currentLanguage);
                const answerText = getLocalizedValue(formData.answer, currentLanguage);
                const additionalInfoText = getLocalizedValue(formData.additionalInfo, currentLanguage);

                // Validate required fields
                if (!questionText.trim()) {
                    throw new Error('Question is required');
                }

                if (!formData.audioChallengeType) {
                    throw new Error('Please select a challenge type');
                }

                // Build the request object
                const request: CreateAudioQuestionRequest = {
                    question: questionText.trim(),
                    answer: answerText?.trim() || undefined,
                    audioChallengeType: formData.audioChallengeType,
                    topic: formData.topic?.trim() || undefined,
                    difficulty: formData.difficulty,
                    visibility: formData.visibility as any,
                    additionalInfo: additionalInfoText?.trim() || undefined,
                    audioSegmentStart: formData.audioSegmentStart,
                    audioSegmentEnd: formData.audioSegmentEnd ?? undefined,
                    minimumScorePercentage: formData.minimumScorePercentage,
                    rhythmBpm: formData.rhythmBpm ?? undefined,
                    rhythmTimeSignature: formData.rhythmTimeSignature || undefined,
                };

                // Prepare reference audio file if present
                const referenceAudio = formData.referenceAudioFile
                    ? {
                          uri: formData.referenceAudioFile.uri,
                          name: formData.referenceAudioFile.name,
                          type: formData.referenceAudioFile.type,
                      }
                    : undefined;

                console.log('📤 Submitting audio question:', {
                    request,
                    hasAudio: !!referenceAudio,
                });

                // Make the API call
                const result = await createAudioQuestion({
                    request,
                    referenceAudio,
                }).unwrap();

                console.log('✅ Audio question created:', result.id);

                // Invalidate quizApi cache so user questions list refreshes
                dispatch(quizApi.util.invalidateTags([
                    { type: 'QuizQuestion', id: 'USER_LIST' },
                    'UserQuestions',
                    'Topics'
                ]));

                // Call success callback
                onSuccess?.(result.id);
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                console.error('❌ Failed to create audio question:', error);

                setError(error);
                onError?.(error);

                // Show user-friendly error message
                Alert.alert(
                    'Error',
                    error.message || 'Failed to create audio question. Please try again.'
                );

                throw error;
            }
        },
        [createAudioQuestion, onSuccess, onError]
    );

    const resetError = useCallback(() => {
        setError(null);
    }, []);

    return {
        submitAudioQuestion,
        isSubmitting: isLoading,
        error,
        resetError,
        resetMutation: reset,
    };
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate audio question form data
 */
export const validateAudioQuestionForm = (
    formData: AudioQuestionFormData
): {isValid: boolean; errors: Record<string, string>} => {
    const errors: Record<string, string> = {};

    // Required fields
    if (isLocalizedStringEmpty(formData.question)) {
        errors.question = 'Question is required';
    }

    if (!formData.audioChallengeType) {
        errors.audioChallengeType = 'Please select a challenge type';
    }

    // Reference audio check
    const requiresAudio =
        formData.audioChallengeType &&
        formData.audioChallengeType !== AudioChallengeType.RHYTHM_CREATION;

    if (requiresAudio && !formData.referenceAudioFile) {
        errors.referenceAudioFile = 'Reference audio is required for this challenge type';
    }

    // Segment time validation
    if (
        formData.audioSegmentEnd !== null &&
        formData.audioSegmentStart >= formData.audioSegmentEnd
    ) {
        errors.audioSegmentEnd = 'End time must be greater than start time';
    }

    // Score validation
    if (formData.minimumScorePercentage < 0 || formData.minimumScorePercentage > 100) {
        errors.minimumScorePercentage = 'Score must be between 0 and 100';
    }

    // BPM validation
    if (formData.rhythmBpm !== null) {
        if (formData.rhythmBpm < 40 || formData.rhythmBpm > 240) {
            errors.rhythmBpm = 'BPM must be between 40 and 240';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Get default form values for a specific challenge type
 */
export const getDefaultsForChallengeType = (
    type: AudioChallengeType
): Partial<AudioQuestionFormData> => {
    const base = {
        audioChallengeType: type,
        minimumScorePercentage: 60,
    };

    switch (type) {
        case AudioChallengeType.RHYTHM_CREATION:
            return {
                ...base,
                question: createLocalizedString('Create your own rhythm pattern by tapping or clapping', 'en'),
                rhythmBpm: 120,
                rhythmTimeSignature: '4/4',
            };
        case AudioChallengeType.RHYTHM_REPEAT:
            return {
                ...base,
                question: createLocalizedString('Listen to the rhythm pattern and repeat it', 'en'),
                rhythmBpm: 120,
                rhythmTimeSignature: '4/4',
            };
        case AudioChallengeType.SOUND_MATCH:
            return {
                ...base,
                question: createLocalizedString('Make sounds as close as possible to what you hear', 'en'),
            };
        case AudioChallengeType.SINGING:
            return {
                ...base,
                question: createLocalizedString('Sing along with the track', 'en'),
                minimumScorePercentage: 50, // Karaoke is harder, lower threshold
            };
        default:
            return base;
    }
};

export default useAudioQuestionSubmit;
