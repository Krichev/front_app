import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
    useLazyGetRandomQuestionsQuery, 
    useLazySearchQuestionsByKeywordQuery,
    QuizQuestion
} from '../../../entities/QuizState/model/slice/quizApi';
import { 
    DifficultyFilter, 
    DEFAULT_RECENT_SEARCHES, 
    MAX_RECENT_SEARCHES,
    DEFAULT_QUESTION_COUNT
} from '../lib/questionManagement.types';
import { APIDifficulty } from '../../../services/wwwGame/questionService';

export const useQuestionSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [difficulty, setDifficulty] = useState<DifficultyFilter>('All');
    const [recentSearches, setRecentSearches] = useState<string[]>(DEFAULT_RECENT_SEARCHES);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [noResults, setNoResults] = useState(false);

    const [triggerRandom, { isLoading: isRandomLoading }] = useLazyGetRandomQuestionsQuery();
    const [triggerSearch, { isLoading: isSearchLoading }] = useLazySearchQuestionsByKeywordQuery();

    const isLoading = isRandomLoading || isSearchLoading;

    const loadRandomQuestions = useCallback(async (diff?: DifficultyFilter) => {
        try {
            const apiDifficulty = diff && diff !== 'All' ? diff as APIDifficulty : undefined;
            const result = await triggerRandom({ 
                count: DEFAULT_QUESTION_COUNT, 
                difficulty: apiDifficulty 
            }).unwrap();
            setQuestions(result);
            setNoResults(result.length === 0);
        } catch (error) {
            console.error('Error loading random questions:', error);
            Alert.alert('Error', 'Failed to load questions. Please try again.');
        }
    }, [triggerRandom]);

    const searchQuestions = useCallback(async (query: string = searchQuery, diff: DifficultyFilter = difficulty) => {
        if (!query.trim()) {
            Alert.alert('Error', 'Please enter a search term');
            return;
        }

        try {
            // Update recent searches
            setRecentSearches(prev => {
                const filtered = prev.filter(s => s !== query);
                return [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
            });

            const apiDifficulty = diff !== 'All' ? diff as APIDifficulty : undefined;
            const result = await triggerSearch({ 
                keyword: query, 
                count: DEFAULT_QUESTION_COUNT, 
                difficulty: apiDifficulty 
            }).unwrap();

            if (result.length === 0) {
                setNoResults(true);
            } else {
                setQuestions(result);
                setNoResults(false);
            }
        } catch (error) {
            console.error('Error searching questions:', error);
            Alert.alert('Error', 'Failed to search questions. Please try again.');
        }
    }, [searchQuery, difficulty, triggerSearch]);

    const handleDifficultyChange = useCallback((newDiff: DifficultyFilter) => {
        setDifficulty(newDiff);
        if (searchQuery) {
            searchQuestions(searchQuery, newDiff);
        } else {
            loadRandomQuestions(newDiff);
        }
    }, [searchQuery, searchQuestions, loadRandomQuestions]);

    useEffect(() => {
        loadRandomQuestions();
    }, [loadRandomQuestions]);

    return {
        questions,
        setQuestions,
        isLoading,
        searchQuery,
        setSearchQuery,
        difficulty,
        recentSearches,
        noResults,
        setNoResults,
        searchQuestions,
        loadRandomQuestions,
        handleDifficultyChange,
    };
};
