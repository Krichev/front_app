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
import { LocalizedString } from '../../../shared/types/localized';

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
    questionLocalized?: LocalizedString;
    answerLocalized?: LocalizedString;
    additionalInfoLocalized?: LocalizedString;
    questionType: QuestionType;
    // DEPRECATED: Remove after migration - media is uploaded separately (old flow)
    media?: {
        mediaId: string;
        mediaUrl: string;
        mediaType: MediaType;
        thumbnailUrl?: string;
    };
    // NEW: Raw file for direct upload in atomic operation
    mediaFile?: {
        uri: string;
        name: string;
        type: string;
    };
    // NEW: External media support
    mediaSourceType?: 'UPLOADED' | 'EXTERNAL_URL' | 'YOUTUBE' | 'VIMEO' | 'SOUNDCLOUD';
    externalMediaUrl?: string;
    questionVideoStartTime?: number;
    questionVideoEndTime?: number;
    answerMediaUrl?: string;
    answerVideoStartTime?: number;
    answerVideoEndTime?: number;
    answerTextVerification?: string;
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
     * UNIFIED: Single method for creating questions with or without media
     * Media file is uploaded together with question data in one atomic operation
     */
    const handleUnifiedQuestionSubmit = async (data: QuestionFormData) => {
        try {
            console.log('📝 [useQuestionsManager] handleUnifiedQuestionSubmit:', {
                question: data.question.substring(0, 30),
                questionType: data.questionType,
                hasMediaFile: !!data.mediaFile,
                mediaFileUri: data.mediaFile?.uri?.substring(0, 50),
                mediaFileName: data.mediaFile?.name,
                mediaFileType: data.mediaFile?.type,
                hasExternalUrl: !!data.externalMediaUrl,
                mediaSourceType: data.mediaSourceType,
            });

            // Build request for backend
            const questionData: CreateQuizQuestionRequest = {
                question: data.question,
                answer: data.answer,
                difficulty: data.difficulty,
                topic: data.topic,
                additionalInfo: data.additionalInfo,
                // NOTE: questionLocalized/answerLocalized/additionalInfoLocalized intentionally 
                // NOT sent — backend DTO does not support localized fields yet.
                visibility: QuestionVisibility.PRIVATE,
                questionType: data.questionType,
                // External Media Fields
                mediaSourceType: data.mediaSourceType as any, // Cast if necessary or ensure types match
                externalMediaUrl: data.externalMediaUrl,
                questionVideoStartTime: data.questionVideoStartTime,
                questionVideoEndTime: data.questionVideoEndTime,
                answerMediaUrl: data.answerMediaUrl,
                answerVideoStartTime: data.answerVideoStartTime,
                answerVideoEndTime: data.answerVideoEndTime,
                answerTextVerification: data.answerTextVerification,
            };

            console.log('🚀 [useQuestionsManager] Calling createQuestion mutation');
            console.log('🚀 [useQuestionsManager] mediaFile:', data.mediaFile ? {
                uri: data.mediaFile.uri?.substring(0, 50),
                name: data.mediaFile.name,
                type: data.mediaFile.type,
            } : 'undefined');

            // Call the mutation
            const result = await createQuestion({
                questionData,
                mediaFile: data.mediaFile, // Pass raw file
            }).unwrap();

            console.log('✅ [useQuestionsManager] Question created:', {
                id: result.id,
                questionType: result.questionType,
                mediaId: result.questionMediaId,
            });

            Alert.alert('Success', 'Question created! Switched to "My Questions" to show it.');

            // Always refresh both question sources after creation
            await refetchUserQuestions();
            await loadAppQuestions();

            // Auto-switch to "user" tab to show the newly created question
            setQuestionSource('user');

            return result;
        } catch (error) {
            console.error('❌ [useQuestionsManager] Error:', error);
            Alert.alert('Error', 'Failed to create question. Please try again.');
            throw error;
        }
    };

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

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