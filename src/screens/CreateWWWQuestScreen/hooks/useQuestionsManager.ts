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
import {APIDifficulty, MediaType, QuestionSource, QuestionType} from "../../../services/wwwGame/questionService.ts";
import {BaseQuestionForQuest, toBaseQuestion} from "../types/question.types.ts";
import {CreateQuizQuestionRequest} from "../../../entities/QuizState/model/types/question.types.ts";
import createQuestionWithMedia from "../../components/CreateQuestionWithMedia.tsx";

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

    // App questions state
    const [appQuestions, setAppQuestions] = useState<QuizQuestion[]>([]);
    const [isLoadingAppQuestions, setIsLoadingAppQuestions] = useState(false);
    const [appQuestionsError, setAppQuestionsError] = useState<string | null>(null);

    // Search filters
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchDifficulty, setSearchDifficulty] = useState<APIDifficulty | 'ALL'>('ALL');
    const [searchTopic, setSearchTopic] = useState('');
    const [showTopicPicker, setShowTopicPicker] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);

    // Cache tracking to prevent unnecessary refetches
    const [lastSearchParams, setLastSearchParams] = useState<{
        keyword: string;
        difficulty: APIDifficulty | 'ALL';
        topic: string;
        page: number;
    } | null>(null);

    // Selection - ✅ Updated to use number for IDs
    const [selectedAppQuestionIds, setSelectedAppQuestionIds] = useState<Set<number>>(new Set());
    const [selectedUserQuestionIds, setSelectedUserQuestionIds] = useState<Set<number>>(new Set());

    // Preview state
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
    const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
    const [visibleAnswers, setVisibleAnswers] = useState<Set<number>>(new Set());


    // ============================================================================
    // EFFECTS
    // ============================================================================

    // Reset pagination when question source changes
    useEffect(() => {
        console.log('📍 Question source changed to:', questionSource);
        setCurrentPage(0);
        setTotalPages(0);
        setTotalQuestions(0);
        setLastSearchParams(null);
        setAppQuestionsError(null);
    }, [questionSource]);

    // Smart loading that only refetches when necessary
    useEffect(() => {
        if (questionSource === 'app') {
            const currentParams = {
                keyword: searchKeyword,
                difficulty: searchDifficulty,
                topic: searchTopic,
                page: currentPage,
            };

            const paramsChanged = !lastSearchParams ||
                lastSearchParams.keyword !== currentParams.keyword ||
                lastSearchParams.difficulty !== currentParams.difficulty ||
                lastSearchParams.topic !== currentParams.topic ||
                lastSearchParams.page !== currentParams.page;

            const hasData = appQuestions.length > 0;

            if (paramsChanged || !hasData) {
                console.log('🔄 Fetching app questions:', paramsChanged ? 'params changed' : 'first load');
                searchAppQuestions();
            } else {
                console.log('✅ Using cached app questions');
            }
        }
    }, [questionSource, searchKeyword, searchDifficulty, searchTopic, currentPage]);

    // ============================================================================
    // SEARCH & FILTER FUNCTIONS
    // ============================================================================

    const searchAppQuestions = async () => {
        setIsLoadingAppQuestions(true);
        setAppQuestionsError(null);
        try {
            const response = await QuestionService.advancedSearchQuestions({
                keyword: searchKeyword || undefined,
                difficulty: searchDifficulty === 'ALL' ? undefined : searchDifficulty,
                topic: searchTopic || undefined,
                page: currentPage,
                size: 20,
            });

            if (response.content && response.content.length > 0) {
                setAppQuestions(response.content);
                setTotalPages(response.totalPages);
                setTotalQuestions(response.totalElements);

                setLastSearchParams({
                    keyword: searchKeyword,
                    difficulty: searchDifficulty,
                    topic: searchTopic,
                    page: currentPage,
                });
            } else {
                setAppQuestions([]);
                setTotalPages(0);
                setTotalQuestions(0);
                setAppQuestionsError('No questions found. Try different search criteria.');
            }
        } catch (error) {
            console.error('Error searching questions:', error);
            setAppQuestionsError('Failed to load questions. Please try again.');
        } finally {
            setIsLoadingAppQuestions(false);
        }
    };

    const clearSearch = () => {
        setSearchKeyword('');
        setSearchDifficulty('ALL');
        setSearchTopic('');
        setCurrentPage(0);
        setLastSearchParams(null);
        searchAppQuestions();
    };

    // ============================================================================
    // SELECTION FUNCTIONS - ✅ Updated to use number IDs
    // ============================================================================

    const toggleQuestionSelection = (questionId: number, source: 'app' | 'user') => {
        if (source === 'app') {
            setSelectedAppQuestionIds((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(questionId)) {
                    newSet.delete(questionId);
                } else {
                    newSet.add(questionId);
                }
                return newSet;
            });
        } else {
            setSelectedUserQuestionIds((prev) => {
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

    const toggleAnswerVisibility = (questionId: number) => {
        setVisibleAnswers((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const toggleExpanded = (index: number) => {
        setExpandedQuestions((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
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
        const questionData: CreateQuizQuestionRequest = {
            question: data.question,
            answer: data.answer,
            difficulty: data.difficulty,
            topic: data.topic,
            visibility: 'PRIVATE',
        };

        const mediaFile = data.media ? {
            uri: data.media.mediaUrl,
            name: `question_${Date.now()}.jpg`,
            type: 'image/jpeg',
        } : undefined;

        const result = await createQuestionWithMedia({
            questionData,
            mediaFile
        }).unwrap();

        Alert.alert('Success', 'Question created!');
        refetchUserQuestions();
    };

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    const getSelectedQuestionsArray = ():BaseQuestionForQuest[] => {
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
            .filter((uq) => selectedUserQuestionIds.has(uq.id))
            .map((uq) => toBaseQuestion(uq, 'user'));


        return [...selectedAppQuestions, ...selectedUserQuestionsData];
    };

    // ============================================================================
    // RETURN
    // ============================================================================

    return {
        // Question source
        questionSource,
        setQuestionSource,

        // Questions data
        appQuestions,
        userQuestions,
        // Loading states
        isLoadingAppQuestions,
        isLoadingUserQuestions,
        isLoadingTopics,
        isCreatingQuestion,

        // Error states
        appQuestionsError,

        // Search & filters
        searchKeyword,
        searchDifficulty,
        searchTopic,
        showTopicPicker,
        availableTopics,
        setSearchKeyword,
        setSearchDifficulty,
        setSearchTopic,
        setShowTopicPicker,

        // Pagination
        currentPage,
        totalPages,
        totalQuestions,
        setCurrentPage,

        // Selection
        selectedAppQuestionIds,
        selectedUserQuestionIds,
        visibleAnswers,
        expandedQuestions,

        // Preview
        isPreviewCollapsed,
        setIsPreviewCollapsed,

        // Actions
        searchAppQuestions,
        clearSearch,
        toggleQuestionSelection,
        toggleAnswerVisibility,
        toggleExpanded,
        deleteUserQuestion,
        handleUnifiedQuestionSubmit,
        expandAllQuestions,
        collapseAllQuestions,
        getSelectedQuestionsArray,
        refetchUserQuestions,
    };
};