// src/entities/question/model/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
    QuestionCategory,
    QuestionData,
    QuestionDifficulty,
    QuestionFilters,
    QuestionSortField,
    QuestionSource,
    QuestionState,
} from './types';

const initialState: QuestionState = {
    questions: [],
    currentQuestion: null,
    selectedQuestions: [],
    isLoading: false,
    error: null,
    sources: [],
    categories: [],
    difficulty: null,
    selectedCategory: null,
    filters: {
        difficulty: undefined,
        topic: undefined,
        category: undefined,
        tags: undefined,
        isUserCreated: undefined,
        creatorId: undefined,
        source: undefined,
        search: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        minUsageCount: undefined,
        maxUsageCount: undefined,
        hasHints: undefined,
        hasAlternativeAnswers: undefined,
        isActive: undefined,
        limit: 20,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
    },
    searchQuery: '',
    totalCount: 0,
    hasNextPage: false,
    currentPage: 1,
};

export const questionSlice = createSlice({
    name: 'question',
    initialState,
    reducers: {
        // Loading and error states
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
            if (action.payload) {
                state.error = null;
            }
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.isLoading = false;
        },

        // Question management
        setQuestions: (state, action: PayloadAction<QuestionData[]>) => {
            state.questions = action.payload;
            state.isLoading = false;
            state.error = null;
        },

        addQuestions: (state, action: PayloadAction<QuestionData[]>) => {
            // Avoid duplicates
            const existingIds = new Set(state.questions.map(q => q.id));
            const newQuestions = action.payload.filter(q => !existingIds.has(q.id));
            state.questions.push(...newQuestions);
        },

        addQuestion: (state, action: PayloadAction<QuestionData>) => {
            // Check if question already exists
            const exists = state.questions.find(q => q.id === action.payload.id);
            if (!exists) {
                state.questions.unshift(action.payload); // Add to beginning
                state.totalCount += 1;
            }
        },

        updateQuestion: (state, action: PayloadAction<QuestionData>) => {
            const index = state.questions.findIndex(q => q.id === action.payload.id);
            if (index !== -1) {
                state.questions[index] = { ...state.questions[index], ...action.payload };
            }

            // Update current question if it's the same
            if (state.currentQuestion?.id === action.payload.id) {
                state.currentQuestion = { ...state.currentQuestion, ...action.payload };
            }

            // Update selected questions if they include this question
            const selectedIndex = state.selectedQuestions.findIndex(q => q.id === action.payload.id);
            if (selectedIndex !== -1) {
                state.selectedQuestions[selectedIndex] = { ...state.selectedQuestions[selectedIndex], ...action.payload };
            }
        },

        removeQuestion: (state, action: PayloadAction<string>) => {
            state.questions = state.questions.filter(q => q.id !== action.payload);
            state.selectedQuestions = state.selectedQuestions.filter(q => q.id !== action.payload);

            if (state.currentQuestion?.id === action.payload) {
                state.currentQuestion = null;
            }

            state.totalCount = Math.max(0, state.totalCount - 1);
        },

        // Current question
        setCurrentQuestion: (state, action: PayloadAction<QuestionData | null>) => {
            state.currentQuestion = action.payload;
        },

        incrementQuestionUsage: (state, action: PayloadAction<string>) => {
            const question = state.questions.find(q => q.id === action.payload);
            if (question) {
                question.usageCount += 1;
                question.lastUsed = new Date().toISOString();
            }

            if (state.currentQuestion?.id === action.payload) {
                state.currentQuestion.usageCount += 1;
                state.currentQuestion.lastUsed = new Date().toISOString();
            }
        },

        // Question selection
        selectQuestion: (state, action: PayloadAction<QuestionData>) => {
            const exists = state.selectedQuestions.find(q => q.id === action.payload.id);
            if (!exists) {
                state.selectedQuestions.push(action.payload);
            }
        },

        deselectQuestion: (state, action: PayloadAction<string>) => {
            state.selectedQuestions = state.selectedQuestions.filter(q => q.id !== action.payload);
        },

        toggleQuestionSelection: (state, action: PayloadAction<QuestionData>) => {
            const existingIndex = state.selectedQuestions.findIndex(q => q.id === action.payload.id);
            if (existingIndex !== -1) {
                state.selectedQuestions.splice(existingIndex, 1);
            } else {
                state.selectedQuestions.push(action.payload);
            }
        },

        selectAllQuestions: (state) => {
            state.selectedQuestions = [...state.questions];
        },

        clearSelectedQuestions: (state) => {
            state.selectedQuestions = [];
        },

        // Filters and search
        setFilters: (state, action: PayloadAction<Partial<QuestionFilters>>) => {
            state.filters = { ...state.filters, ...action.payload };
            // Reset pagination when filters change
            state.currentPage = 1;
            state.filters.offset = 0;
        },

        updateFilter: (state, action: PayloadAction<{ key: keyof QuestionFilters; value: any }>) => {
            const { key, value } = action.payload;
            (state.filters as any)[key] = value;
            // Reset pagination when filters change
            state.currentPage = 1;
            state.filters.offset = 0;
        },

        clearFilters: (state) => {
            state.filters = {
                ...initialState.filters,
                limit: state.filters.limit, // Keep current limit
                sortBy: state.filters.sortBy, // Keep current sort
                sortOrder: state.filters.sortOrder,
            };
            state.currentPage = 1;
        },

        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
            state.filters.search = action.payload;
            // Reset pagination when search changes
            state.currentPage = 1;
            state.filters.offset = 0;
        },

        // Sorting
        setSortBy: (state, action: PayloadAction<QuestionSortField>) => {
            state.filters.sortBy = action.payload;
            // Reset pagination when sort changes
            state.currentPage = 1;
            state.filters.offset = 0;
        },

        setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
            state.filters.sortOrder = action.payload;
            // Reset pagination when sort changes
            state.currentPage = 1;
            state.filters.offset = 0;
        },

        toggleSortOrder: (state) => {
            state.filters.sortOrder = state.filters.sortOrder === 'asc' ? 'desc' : 'asc';
            // Reset pagination when sort changes
            state.currentPage = 1;
            state.filters.offset = 0;
        },

        // Pagination
        setCurrentPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
            const limit = state.filters.limit || 20;
            state.filters.offset = (action.payload - 1) * limit;
        },

        setPageSize: (state, action: PayloadAction<number>) => {
            state.filters.limit = action.payload;
            // Recalculate offset based on current page
            state.filters.offset = (state.currentPage - 1) * action.payload;
        },

        setTotalCount: (state, action: PayloadAction<number>) => {
            state.totalCount = action.payload;
            // Update hasNextPage based on current pagination
            const limit = state.filters.limit || 20;
            const currentOffset = state.filters.offset || 0;
            state.hasNextPage = currentOffset + limit < action.payload;
        },

        setHasNextPage: (state, action: PayloadAction<boolean>) => {
            state.hasNextPage = action.payload;
        },

        nextPage: (state) => {
            if (state.hasNextPage) {
                state.currentPage += 1;
                const limit = state.filters.limit || 20;
                state.filters.offset = (state.currentPage - 1) * limit;
            }
        },

        previousPage: (state) => {
            if (state.currentPage > 1) {
                state.currentPage -= 1;
                const limit = state.filters.limit || 20;
                state.filters.offset = (state.currentPage - 1) * limit;
            }
        },

        // Category and difficulty filters
        setDifficulty: (state, action: PayloadAction<QuestionDifficulty | null>) => {
            state.difficulty = action.payload;
            state.filters.difficulty = action.payload ? [action.payload] : undefined;
            // Reset pagination when difficulty changes
            state.currentPage = 1;
            state.filters.offset = 0;
        },

        setSelectedCategory: (state, action: PayloadAction<string | null>) => {
            state.selectedCategory = action.payload;
            state.filters.category = action.payload ? [action.payload] : undefined;
            // Reset pagination when category changes
            state.currentPage = 1;
            state.filters.offset = 0;
        },

        // Sources and categories management
        setSources: (state, action: PayloadAction<QuestionSource[]>) => {
            state.sources = action.payload;
        },

        addSource: (state, action: PayloadAction<QuestionSource>) => {
            const exists = state.sources.find(s => s.id === action.payload.id);
            if (!exists) {
                state.sources.push(action.payload);
            }
        },

        updateSource: (state, action: PayloadAction<QuestionSource>) => {
            const index = state.sources.findIndex(s => s.id === action.payload.id);
            if (index !== -1) {
                state.sources[index] = action.payload;
            }
        },

        removeSource: (state, action: PayloadAction<string>) => {
            state.sources = state.sources.filter(s => s.id !== action.payload);
        },

        setCategories: (state, action: PayloadAction<QuestionCategory[]>) => {
            state.categories = action.payload;
        },

        addCategory: (state, action: PayloadAction<QuestionCategory>) => {
            const exists = state.categories.find(c => c.id === action.payload.id);
            if (!exists) {
                state.categories.push(action.payload);
            }
        },

        updateCategory: (state, action: PayloadAction<QuestionCategory>) => {
            const index = state.categories.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.categories[index] = action.payload;
            }
        },

        removeCategory: (state, action: PayloadAction<string>) => {
            state.categories = state.categories.filter(c => c.id !== action.payload);
        },

        // Bulk operations
        bulkUpdateQuestions: (state, action: PayloadAction<{ ids: string[]; updates: Partial<QuestionData> }>) => {
            const { ids, updates } = action.payload;

            state.questions = state.questions.map(question =>
                ids.includes(question.id)
                    ? { ...question, ...updates, updatedAt: new Date().toISOString() }
                    : question
            );

            // Update selected questions if they're affected
            state.selectedQuestions = state.selectedQuestions.map(question =>
                ids.includes(question.id)
                    ? { ...question, ...updates, updatedAt: new Date().toISOString() }
                    : question
            );

            // Update current question if it's affected
            if (state.currentQuestion && ids.includes(state.currentQuestion.id)) {
                state.currentQuestion = { ...state.currentQuestion, ...updates, updatedAt: new Date().toISOString() };
            }
        },

        bulkDeleteQuestions: (state, action: PayloadAction<string[]>) => {
            const idsToDelete = new Set(action.payload);

            state.questions = state.questions.filter(q => !idsToDelete.has(q.id));
            state.selectedQuestions = state.selectedQuestions.filter(q => !idsToDelete.has(q.id));

            if (state.currentQuestion && idsToDelete.has(state.currentQuestion.id)) {
                state.currentQuestion = null;
            }

            state.totalCount = Math.max(0, state.totalCount - action.payload.length);
        },

        // Reset state
        reset: () => initialState,

        resetPagination: (state) => {
            state.currentPage = 1;
            state.filters.offset = 0;
            state.hasNextPage = false;
        },

        resetFiltersAndPagination: (state) => {
            state.filters = { ...initialState.filters };
            state.searchQuery = '';
            state.currentPage = 1;
            state.difficulty = null;
            state.selectedCategory = null;
            state.hasNextPage = false;
        },
    },
});

export const questionActions = questionSlice.actions;
export const questionReducer = questionSlice.reducer;

// Action creators for common operations
export const createQuestionActionCreators = (dispatch: any) => ({
    // Convenient action creators that combine multiple actions
    searchQuestions: (query: string) => {
        dispatch(questionActions.setSearchQuery(query));
        dispatch(questionActions.setLoading(true));
    },

    filterByDifficulty: (difficulty: QuestionDifficulty | null) => {
        dispatch(questionActions.setDifficulty(difficulty));
        dispatch(questionActions.setLoading(true));
    },

    filterByCategory: (category: string | null) => {
        dispatch(questionActions.setSelectedCategory(category));
        dispatch(questionActions.setLoading(true));
    },

    loadPage: (page: number) => {
        dispatch(questionActions.setCurrentPage(page));
        dispatch(questionActions.setLoading(true));
    },

    refreshQuestions: () => {
        dispatch(questionActions.resetPagination());
        dispatch(questionActions.setLoading(true));
    },
});