// src/screens/CreateWWWQuestScreen/hooks/useQuestionsManager.ts
import {useEffect, useMemo, useState} from 'react';
import {Alert} from 'react-native';
import {
    useCreateUserQuestionMutation,
    useCreateUserQuestionWithMediaMutation,
    useDeleteUserQuestionMutation,
    useGetAvailableTopicsQuery,
    useGetUserQuestionsPaginatedQuery,
} from '../../../entities/QuizState/model/slice/quizApi';
import {QuestionData, QuestionService} from "../../../services/wwwGame";
import {APIDifficulty, QuestionSource} from "../../../services/wwwGame/questionService.ts";


// export type APIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
// export type QuestionVisibility = 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
export type QuestionType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';

// export interface QuestionData {
//     id?: string;
//     question: string;
//     answer: string;
//     difficulty: 'Easy' | 'Medium' | 'Hard';
//     topic?: string;
//     additionalInfo?: string;
//     visibility?: QuestionVisibility;
// }

export interface CustomQuestion {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
}

export interface MultimediaQuestionData {
    id?: string;
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
    questionType: string;
}

export interface QuestionFormData {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
    questionType: QuestionType;
    media?: {
        mediaId?: string;
        mediaUrl?: string;
        mediaType?: string;
    };
}

export const useQuestionsManager = () => {
    // API hooks
    const [createQuestion, { isLoading: isCreatingQuestion }] = useCreateUserQuestionMutation();
    const [deleteQuestion] = useDeleteUserQuestionMutation();
    const [createQuestionWithMedia] = useCreateUserQuestionWithMediaMutation();

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
    const [appQuestions, setAppQuestions] = useState<QuestionData[]>([]);
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

    // Selection
    const [selectedAppQuestionIds, setSelectedAppQuestionIds] = useState<Set<string>>(new Set());
    const [selectedUserQuestionIds, setSelectedUserQuestionIds] = useState<Set<string>>(new Set());

    // Preview state
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
    const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
    const [visibleAnswers, setVisibleAnswers] = useState<Set<string>>(new Set());

    // Custom questions
    const [newCustomQuestions, setNewCustomQuestions] = useState<MultimediaQuestionData[]>([]);

    // Transform user questions to display format
    const transformedUserQuestions = useMemo(() => {
        if (!userQuestions || !Array.isArray(userQuestions)) {
            return [];
        }

        return (userQuestions ?? []).map((uq: any) => ({
            id: uq.id?.toString() ?? '',
            question: uq.question ?? '',
            answer: uq.answer ?? '',
            difficulty: uq.difficulty === 'EASY' ? 'Easy' as const :
                uq.difficulty === 'MEDIUM' ? 'Medium' as const :
                    uq.difficulty === 'HARD' ? 'Hard' as const : 'Medium' as const,
            topic: uq.topic ?? '',
            additionalInfo: uq.additionalInfo ?? '',
            visibility: uq.visibility,
        }));
    }, [userQuestions]);

    // Search app questions on mount
    useEffect(() => {
        if (questionSource === 'app') {
            searchAppQuestions();
        }
    }, [questionSource]);

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
        searchAppQuestions();
    };

    const toggleQuestionSelection = (questionId: string, source: 'app' | 'user') => {
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

    const toggleAnswerVisibility = (questionId: string) => {
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

    const deleteUserQuestion = async (questionId: string) => {
        try {
            await deleteQuestion(questionId).unwrap();
            Alert.alert('Success', 'Question deleted successfully');
            refetchUserQuestions();

            // Remove from selection if it was selected
            setSelectedUserQuestionIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(questionId);
                return newSet;
            });
        } catch (error) {
            console.error('Error deleting question:', error);
            Alert.alert('Error', 'Failed to delete question');
        }
    };

    const addNewCustomQuestion = (question: CustomQuestion) => {
        const newQuestion: MultimediaQuestionData = {
            id: `custom_${Date.now()}`,
            question: question.question,
            answer: question.answer,
            difficulty: question.difficulty,
            topic: question.topic,
            additionalInfo: question.additionalInfo,
            questionType: 'text',
        };
        setNewCustomQuestions((prev) => [...prev, newQuestion]);
    };

    const removeNewCustomQuestion = (index: number) => {
        setNewCustomQuestions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleMediaQuestionSubmit = async (questionData: QuestionFormData) => {
        try {
            const newQuestion: MultimediaQuestionData = {
                id: `temp_${Date.now()}`,
                question: questionData.question,
                answer: questionData.answer,
                difficulty: questionData.difficulty,
                topic: questionData.topic,
                additionalInfo: questionData.additionalInfo,
                questionType: questionData.questionType === 'TEXT' ? 'text' :
                    questionData.questionType === 'IMAGE' ? 'text' :
                        questionData.questionType === 'VIDEO' ? 'video' : 'audio',
            };

            setNewCustomQuestions((prev) => [...prev, newQuestion]);
            Alert.alert('Success', 'Question with media added successfully!');
        } catch (error) {
            console.error('Error creating question with media:', error);
            Alert.alert('Error', 'Failed to create question. Please try again.');
        }
    };

    const getSelectedQuestionsArray = () => {
        // Helper function to normalize difficulty
        const normalizeDifficulty = (diff?: 'Easy' | 'Medium' | 'Hard'): 'EASY' | 'MEDIUM' | 'HARD' | 'Easy' | 'Medium' | 'Hard' => {
            if (!diff) return 'MEDIUM'; // Default to MEDIUM if undefined
            return diff; // Return as-is since both formats are accepted
        };

        // Helper function to convert UI difficulty to API difficulty
        const convertToAPIDifficulty = (diff: 'Easy' | 'Medium' | 'Hard'): 'EASY' | 'MEDIUM' | 'HARD' => {
            const mapping: Record<'Easy' | 'Medium' | 'Hard', 'EASY' | 'MEDIUM' | 'HARD'> = {
                'Easy': 'EASY',
                'Medium': 'MEDIUM',
                'Hard': 'HARD'
            };
            return mapping[diff];
        };

        // Map selected app questions and ensure difficulty is defined
        const selectedAppQuestions = (appQuestions ?? [])
            .filter((q) => selectedAppQuestionIds.has(q?.id?.toString() ?? ''))
            .map((q) => ({
                id: q.id,
                question: q.question,
                answer: q.answer,
                difficulty: normalizeDifficulty(q.difficulty),
                topic: q.topic,
                additionalInfo: q.additionalInfo,
                visibility: q.visibility,
                source: 'app' as const,
            }));

        // Map selected user questions and convert difficulty format
        const selectedUserQuestionsData = transformedUserQuestions
            .filter((uq) => selectedUserQuestionIds.has(uq.id))
            .map((uq) => ({
                id: uq.id,
                question: uq.question,
                answer: uq.answer,
                difficulty: convertToAPIDifficulty(uq.difficulty),
                topic: uq.topic,
                additionalInfo: uq.additionalInfo,
                source: 'user' as const,
            }));

        // Map new custom questions (already in correct format)
        const newCustomQuestionsData = newCustomQuestions.map((q, idx) => ({
            id: `new-custom-${idx}`,
            question: q.question,
            answer: q.answer,
            difficulty: q.difficulty, // Already in 'EASY' | 'MEDIUM' | 'HARD' format
            topic: q.topic,
            additionalInfo: q.additionalInfo,
            source: 'custom' as const,
        }));

        return [...selectedAppQuestions, ...selectedUserQuestionsData, ...newCustomQuestionsData];
    };

    return {
        // Question source
        questionSource,
        setQuestionSource,

        // Questions data
        appQuestions,
        userQuestions,
        transformedUserQuestions,
        newCustomQuestions,

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
        addNewCustomQuestion,
        removeNewCustomQuestion,
        handleMediaQuestionSubmit,
        getSelectedQuestionsArray,
        refetchUserQuestions,
    };
};