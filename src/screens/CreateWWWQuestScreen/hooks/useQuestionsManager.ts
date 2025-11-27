// src/screens/CreateWWWQuestScreen/hooks/useQuestionsManager.ts
import {useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {
    QuizQuestion,
    useCreateQuestionWithMediaMutation,
    useDeleteUserQuestionMutation,
    useGetAvailableTopicsQuery,
    useGetUserQuestionsPaginatedQuery,
} from '../../../entities/QuizState/model/slice/quizApi';
import {QuestionService} from "../../../services/wwwGame";
import {APIDifficulty, MediaType, QuestionSource, QuestionType} from "../../../services/wwwGame/questionService";
import {BaseQuestionForQuest} from "../types/question.types";
import {CreateQuizQuestionRequest, QuestionVisibility} from "../../../entities/QuizState/model/types/question.types";

// ============================================================================
// TYPES
// ============================================================================

export interface CustomQuestion {
    question: string;
    answer: string;
    difficulty: APIDifficulty;
    topic?: string;
    additionalInfo?: string;
}

export interface MultimediaQuestionData {
    id?: string;
    question: string;
    answer: string;
    difficulty: APIDifficulty;
    topic?: string;
    additionalInfo?: string;
    questionType: QuestionType;
}

/**
 * ✅ Updated to match the unified CreateQuestionRequest interface
 */
export interface QuestionFormData {
    question: string;
    answer: string;
    difficulty: APIDifficulty;
    topic?: string;
    additionalInfo?: string;
    questionType: QuestionType;
    media?: {
        mediaId: string;
        mediaUrl: string;
        mediaType: MediaType;
        thumbnailUrl?: string;
    };
}

// ============================================================================
// HOOK
// ============================================================================

export const useQuestionsManager = () => {
    // ✅ API hooks - now using single unified mutation
    const [createQuestion, {isLoading}] = useCreateQuestionWithMediaMutation()
    const [deleteQuestion] = useDeleteUserQuestionMutation();

    const {
        data: availableTopics = [],
        isLoading: isLoadingTopics,
    } = useGetAvailableTopicsQuery();

    // Question source
    const [questionSource, setQuestionSource] = useState<QuestionSource>('app');

    // User questions query
    const {
        data: userQuestionsResponse,
        isLoading: isLoadingUserQuestions,
        refetch: refetchUserQuestions,
    } = useGetUserQuestionsPaginatedQuery({
        page: 0,
        size: 100,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
    }, {
        skip: questionSource !== 'user',
    });

    const userQuestions = userQuestionsResponse?.content ?? [];

    // App questions
    const [appQuestions, setAppQuestions] = useState<QuizQuestion[]>([]);
    const [isLoadingAppQuestions, setIsLoadingAppQuestions] = useState(false);

    // Selection state
    const [selectedAppQuestionIds, setSelectedAppQuestionIds] = useState<Set<number>>(new Set());
    const [selectedUserQuestionIds, setSelectedUserQuestionIds] = useState<Set<number>>(new Set());

    const [showTopicPicker, setShowTopicPicker] = useState(false);
    // UI state
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

    // ============================================================================
    // EFFECTS
    // ============================================================================

    useEffect(() => {
        if (questionSource === 'app') {
            loadAppQuestions();
        }
    }, [questionSource]);

    // ============================================================================
    // QUESTION LOADING
    // ============================================================================

    const loadAppQuestions = async () => {
        setIsLoadingAppQuestions(true);
        try {
            const questions = await QuestionService.advancedSearchQuestions({page: 0, size: 100});
            setAppQuestions(questions.content || []);
        } catch (error) {
            console.error('Error loading app questions:', error);
            Alert.alert('Error', 'Failed to load questions');
        } finally {
            setIsLoadingAppQuestions(false);
        }
    };

    // ============================================================================
    // SELECTION MANAGEMENT
    // ============================================================================

    const toggleQuestionSelection = (questionId: number) => {
        if (questionSource === 'app') {
            setSelectedAppQuestionIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(questionId)) {
                    newSet.delete(questionId);
                } else {
                    newSet.add(questionId);
                }
                return newSet;
            });
        } else {
            setSelectedUserQuestionIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(questionId)) {
                    newSet.delete(questionId);
                } else {
                    newSet.add(questionId);
                }
                return newSet;
            });
        }
    };

    const toggleQuestionExpansion = (index: number) => {
        setExpandedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const clearAllSelections = () => {
        setSelectedAppQuestionIds(new Set());
        setSelectedUserQuestionIds(new Set());
    };

    const expandAllQuestions = () => {
        const questions = questionSource === 'app' ? appQuestions : userQuestions;
        const allIndices = questions.map((_, index) => index);
        setExpandedQuestions(new Set(allIndices));
    };

    const collapseAllQuestions = () => {
        setExpandedQuestions(new Set());
    };

    // ============================================================================
    // QUESTION MANAGEMENT FUNCTIONS
    // ============================================================================

    const deleteUserQuestion = async (questionId: number) => {
        try {
            await deleteQuestion(questionId).unwrap();
            Alert.alert('Success', 'Question deleted successfully');
            refetchUserQuestions();
        } catch (error) {
            console.error('Error deleting question:', error);
            Alert.alert('Error', 'Failed to delete question');
        }
    };

    // ============================================================================
    // ✅ UNIFIED QUESTION SUBMISSION - Works for ALL question types
    // ============================================================================

    /**
     * ✅ Single unified handler for creating questions (text, image, video, audio)
     * This replaces both handleMediaQuestionSubmit and the separate logic
     */
    const handleUnifiedQuestionSubmit = async (data: QuestionFormData) => {
        try {
            const questionData: CreateQuizQuestionRequest = {
                question: data.question,
                answer: data.answer,
                difficulty: data.difficulty,
                topic: data.topic,
                visibility: QuestionVisibility.PRIVATE,
            };

            // ✅ FIX: Properly handle optional media file with explicit null check
            const mediaFile = data.media ? {
                uri: data.media.mediaUrl,
                name: `question_${Date.now()}.${getFileExtension(data.media.mediaType)}`,
                type: getMediaMimeType(data.media.mediaType),
            } : null;

            // ✅ FIX: Use null instead of undefined for optional parameter
            const result = await createQuestion({
                questionData,
                mediaFile: mediaFile ?? undefined, // Convert null to undefined for API
            }).unwrap();

            Alert.alert('Success', 'Question created successfully!');
            // Only refetch if user questions tab is active (query was started)
            if (questionSource === 'user') {
                await refetchUserQuestions();
            }
            return result;
        } catch (error) {
            console.error('Error creating question:', error);
            Alert.alert('Error', 'Failed to create question. Please try again.');
            throw error;
        }
    };

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    /**
     * Get file extension based on media type
     */
    const getFileExtension = (mediaType: MediaType): string => {
        switch (mediaType) {
            case MediaType.IMAGE:
                return 'jpg';
            case MediaType.VIDEO:
                return 'mp4';
            case MediaType.AUDIO:
                return 'mp3';
            default:
                return 'bin';
        }
    };

    /**
     * Get MIME type based on media type
     */
    const getMediaMimeType = (mediaType: MediaType): string => {
        switch (mediaType) {
            case MediaType.IMAGE:
                return 'image/jpeg';
            case MediaType.VIDEO:
                return 'video/mp4';
            case MediaType.AUDIO:
                return 'audio/mpeg';
            default:
                return 'application/octet-stream';
        }
    };

    const getSelectedQuestionsArray = (): BaseQuestionForQuest[] => {
        const selectedAppQuestions = (appQuestions ?? [])
            .filter((q) => selectedAppQuestionIds.has(q.id))
            .map((q) => ({
                id: q.id,
                question: q.question,
                answer: q.answer,
                difficulty: q.difficulty,
                topic: q.topic,
                additionalInfo: q.additionalInfo,
                visibility: q.visibility,
                source: 'app' as const,
            }));

        const selectedUserQuestionsData = (userQuestions ?? [])
            .filter((q) => selectedUserQuestionIds.has(q.id))
            .map((q) => ({
                id: q.id,
                question: q.question,
                answer: q.answer,
                difficulty: q.difficulty,
                topic: q.topic,
                additionalInfo: q.additionalInfo,
                visibility: q.visibility,
                source: 'user' as const,
            }));

        return [...selectedAppQuestions, ...selectedUserQuestionsData];
    };

    // ============================================================================
    // RETURN
    // ============================================================================

    return {
        // State
        questionSource,
        setQuestionSource,

        // Questions
        appQuestions,
        userQuestions,
        availableTopics,

        // Loading states
        isLoading,
        isLoadingAppQuestions,
        isLoadingUserQuestions,
        isLoadingTopics,

        // Selection
        selectedAppQuestionIds,
        selectedUserQuestionIds,
        toggleQuestionSelection,
        clearAllSelections,

        // Expansion
        expandedQuestions,
        toggleQuestionExpansion,
        expandAllQuestions,
        collapseAllQuestions,

        // Actions
        handleUnifiedQuestionSubmit,
        deleteUserQuestion,
        refetchUserQuestions,
        loadAppQuestions,
        getSelectedQuestionsArray,
        showTopicPicker,
        setShowTopicPicker,
    };
};