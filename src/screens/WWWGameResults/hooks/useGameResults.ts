import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../../app/providers/StoreProvider/store';
import { WWWGameService, PlayerPerformance } from "../../../services/wwwGame/wwwGameService";
import {
    useGetChallengeAudioConfigQuery,
    useSubmitChallengeCompletionMutation
} from '../../../entities/ChallengeState/model/slice/challengeApi';
import { RootStackParamList } from '../../../navigation/AppNavigator';

// Types for game data
export interface RoundData {
    question: string;
    correctAnswer: string;
    teamAnswer: string;
    isCorrect: boolean;
    playerWhoAnswered: string;
    discussionNotes: string;
}

type WWWGameResultsRouteProp = RouteProp<RootStackParamList, 'WWWGameResults'>;
type WWWGameResultsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WWWGameResults'>;

export interface UseGameResultsReturn {
    // Route data
    teamName: string;
    score: number;
    totalRounds: number;
    roundsData: RoundData[];
    challengeId?: string;

    // Derived data
    correctPercentage: number;
    performances: PlayerPerformance[];
    minimumScoreRequired: number;
    meetsMinimumScore: boolean;
    roundCount: number;
    currentRound: number;
    resultMessage: string;
    aiFeedback: string;

    // State
    showEndGameModal: boolean;
    setShowEndGameModal: (show: boolean) => void;
    submittingChallenge: boolean;
    isSubmitting: boolean;

    // Actions
    playAgain: () => void;
    returnHome: () => void;
    submitChallengeWithResults: () => Promise<void>;
    endGame: () => void;
}

export const useGameResults = (): UseGameResultsReturn => {
    const { t } = useTranslation();
    const route = useRoute<WWWGameResultsRouteProp>();
    const navigation = useNavigation<WWWGameResultsNavigationProp>();
    
    // Safely access params - Hermes seals objects so destructuring missing optional props throws ReferenceError
    const { teamName, score, totalRounds, roundsData } = route.params;
    const challengeId = route.params?.challengeId;
    const sessionId = route.params?.sessionId;
    
    // Auth user from Redux store
    const { user } = useSelector((state: RootState) => state.auth);

    // RTK Query: useGetChallengeAudioConfigQuery (with skip logic)
    const { data: audioConfig } = useGetChallengeAudioConfigQuery(
        challengeId || '',
        { skip: !challengeId }
    );

    // RTK Mutation: useSubmitChallengeCompletionMutation (with loading guard)
    const [submitCompletion, { isLoading: isSubmitting }] = useSubmitChallengeCompletionMutation();

    // Local state
    const [showEndGameModal, setShowEndGameModal] = useState(false);
    const [submittingChallenge, setSubmittingChallenge] = useState(false);

    // Derived data
    const roundCount = totalRounds;
    const currentRound = totalRounds;

    const correctPercentage = useMemo(() => (score / totalRounds) * 100, [score, totalRounds]);

    const performances = useMemo(() => 
        WWWGameService.calculatePlayerPerformance(roundsData as any), 
        [roundsData]
    );

    const minimumScoreRequired = useMemo(() => audioConfig?.minimumScorePercentage || 0, [audioConfig]);
    
    const meetsMinimumScore = useMemo(() => 
        minimumScoreRequired === 0 || correctPercentage >= minimumScoreRequired, 
        [minimumScoreRequired, correctPercentage]
    );

    const resultMessage = useMemo(() => 
        WWWGameService.generateResultsMessage(score, totalRounds), 
        [score, totalRounds]
    );

    const aiFeedback = useMemo(() => 
        WWWGameService.generateGameFeedback(roundsData as any, performances), 
        [roundsData, performances]
    );

    // Submit challenge with results
    const submitChallengeWithResults = useCallback(async () => {
        if (!challengeId || isSubmitting || submittingChallenge) return;

        try {
            setSubmittingChallenge(true);

            await submitCompletion({
                challengeId: challengeId,
                completionData: {
                    verificationData: {
                        score,
                        totalRounds,
                        completed: true,
                        teamName,
                        roundsData: roundsData.map(round => ({
                            question: round.question,
                            correctAnswer: round.correctAnswer,
                            teamAnswer: round.teamAnswer,
                            isCorrect: round.isCorrect,
                            playerWhoAnswered: round.playerWhoAnswered
                        }))
                    },
                    notes: t('gameResults.completionNotes', { score, total: totalRounds })
                }
            }).unwrap();

            navigation.navigate('QuizResults', {
                challengeId,
                score,
                totalRounds,
                teamName,
                roundsData: roundsData as any
            });
        } catch (error) {
            console.error('Error completing challenge:', error);
            Alert.alert(
                t('gameResults.alerts.error.title'),
                t('gameResults.alerts.error.submitFailed'),
                [{ text: t('common.ok'), onPress: () => navigation.navigate('Main', { screen: 'Home' }) }]
            );
        } finally {
            setSubmittingChallenge(false);
        }
    }, [challengeId, isSubmitting, submittingChallenge, score, totalRounds, teamName, roundsData, submitCompletion, navigation, t]);

    // Play again button handler
    const playAgain = useCallback(() => {
        if (challengeId) {
            // Navigate to ChallengeDetails so user can see stats and tweak config
            navigation.navigate('ChallengeDetails', { challengeId: String(challengeId) });
        } else {
            // Fallback for standalone games without a challenge
            navigation.navigate('CreateWWWQuest');
        }
    }, [challengeId, navigation]);

    // Return home button handler
    const returnHome = useCallback(() => {
        navigation.navigate('Main', { screen: 'Home' });
    }, [navigation]);

    // End game function
    const endGame = useCallback(() => {
        setShowEndGameModal(false);
        navigation.navigate('Main', { screen: 'Home' });
    }, [navigation]);

    return {
        teamName,
        score,
        totalRounds,
        roundsData: roundsData as RoundData[],
        challengeId,
        correctPercentage,
        performances,
        minimumScoreRequired,
        meetsMinimumScore,
        roundCount,
        currentRound,
        resultMessage,
        aiFeedback,
        showEndGameModal,
        setShowEndGameModal,
        submittingChallenge,
        isSubmitting,
        playAgain,
        returnHome,
        submitChallengeWithResults,
        endGame
    };
};
