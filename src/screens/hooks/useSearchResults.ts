import { useEffect, useState, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSearchChallengesQuery } from '../../entities/ChallengeState/model/slice/challengeApi';
import { useSearchUsersQuery } from '../../entities/UserState/model/slice/userApi';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { UserSearchResult } from '../../entities/QuizState/model/types/question.types';
import { ApiChallenge } from '../../entities/ChallengeState/model/types';

export interface UseSearchResultsReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedQuery: string;
  isLoading: boolean;
  hasResults: boolean;
  totalResults: number;
  users: UserSearchResult[];
  quizResults: ApiChallenge[];
  challengeOnlyResults: ApiChallenge[];
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  recentSearches: string[];
  navigateToUserProfile: (userId: string) => void;
  navigateToChallengeDetails: (challengeId: string) => void;
}

type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const useSearchResults = (): UseSearchResultsReturn => {
    const navigation = useNavigation<SearchScreenNavigationProp>();

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        users: false,
        quizzes: false,
        challenges: false,
    });
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Fetch ALL types when query is valid
    const shouldSearch = debouncedQuery.length >= 2;

    const {
        data: challengeResults,
        isLoading: loadingChallenges,
    } = useSearchChallengesQuery({ q: debouncedQuery }, { skip: !shouldSearch });

    const {
        data: userResults,
        isLoading: loadingUsers,
    } = useSearchUsersQuery(
        { q: debouncedQuery, limit: 20 },
        { skip: !shouldSearch }
    );

    // Separate quizzes from challenges
    const quizResults = useMemo(() => {
        return challengeResults?.filter(c => c.type === 'QUIZ') || [];
    }, [challengeResults]);

    const challengeOnlyResults = useMemo(() => {
        return challengeResults?.filter(c => c.type !== 'QUIZ') || [];
    }, [challengeResults]);

    const users = userResults?.content || [];

    // Debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery.length >= 2) {
                setDebouncedQuery(searchQuery);
                if (!recentSearches.includes(searchQuery)) {
                    setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
                }
            } else {
                setDebouncedQuery('');
            }
        }, 400);
        return () => clearTimeout(handler);
    }, [searchQuery, recentSearches]);

    const isLoading = loadingChallenges || loadingUsers;
    const hasResults = users.length > 0 || quizResults.length > 0 || challengeOnlyResults.length > 0;
    const totalResults = users.length + quizResults.length + challengeOnlyResults.length;

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const navigateToUserProfile = (userId: string) => {
        navigation.navigate('UserProfile', { userId });
    };

    const navigateToChallengeDetails = (challengeId: string) => {
        navigation.navigate('ChallengeDetails', { challengeId });
    };

    return {
        searchQuery,
        setSearchQuery,
        debouncedQuery,
        isLoading,
        hasResults,
        totalResults,
        users,
        quizResults,
        challengeOnlyResults,
        expandedSections,
        toggleSection,
        recentSearches,
        navigateToUserProfile,
        navigateToChallengeDetails,
    };
};
