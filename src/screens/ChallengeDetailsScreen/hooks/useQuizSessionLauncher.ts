import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useStartQuizSessionMutation } from '../../../entities/QuizState/model/slice/quizApi';
import { AudioChallengeType } from '../../../entities/ChallengeState/model/types';
import { ParsedQuizConfig } from '../lib/quizConfigParser';

interface LauncherDeps {
    challengeId: string;
    username: string | undefined;
    userId: string | undefined;
    quizConfig: ParsedQuizConfig | null;
    audioConfig: any;
    customQuestions: any;
}

export function useQuizSessionLauncher(deps: LauncherDeps) {
    const { challengeId, username, userId, quizConfig, audioConfig, customQuestions } = deps;
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [startQuizSession] = useStartQuizSessionMutation();
    const [isStartingQuiz, setIsStartingQuiz] = useState(false);
    const { t } = useTranslation();

    const handleStartQuiz = useCallback(async () => {
        if (!quizConfig || isStartingQuiz) return;
        setIsStartingQuiz(true);

        try {
            const gameType = quizConfig.gameType?.toUpperCase();
            console.log('Starting quiz with gameType:', gameType);

            switch (gameType) {
                case 'WWW':
                    await launchWWWQuiz(quizConfig);
                    break;
                case 'BLITZ':
                    await launchBlitzQuiz(quizConfig);
                    break;
                case 'TRIVIA':
                    await launchTriviaQuiz(quizConfig);
                    break;
                case 'CUSTOM':
                    await launchCustomQuiz(quizConfig);
                    break;
                case 'AUDIO':
                    await launchAudioQuiz(quizConfig);
                    break;
                case 'PUZZLE':
                    await launchPuzzleGame(quizConfig);
                    break;
                default:
                    // Fallback to WWW if no type specified
                    if (!gameType) {
                        await launchWWWQuiz(quizConfig);
                    } else {
                        Alert.alert(
                            t('challengeDetails.launcher.comingSoon'),
                            t('challengeDetails.launcher.typeNotSupported', { type: gameType })
                        );
                    }
            }
        } catch (error: any) {
            console.error('Failed to start quiz:', error);
            Alert.alert(
                t('challengeDetails.launcher.error'),
                error?.data?.message || t('challengeDetails.launcher.failedToStart')
            );
        } finally {
            setIsStartingQuiz(false);
        }
    }, [quizConfig, isStartingQuiz, challengeId, username, userId, customQuestions, audioConfig, t]);

    const launchWWWQuiz = async (config: ParsedQuizConfig) => {
        try {
            const gameMode = config.gameMode || 'STANDARD';

            // Extract question IDs from customQuestions (which now prioritizes played questions)
            const customQuestionIds = customQuestions
                ?.map((q: any) => typeof q.id === 'string' ? parseInt(q.id) : q.id)
                .filter((id: any) => !isNaN(id)) ?? [];

            const hasCustomQuestions = customQuestionIds.length > 0;

            const sessionParams = {
                challengeId: challengeId,
                teamName: config.teamName || 'Team',
                teamMembers: config.teamMembers || [],
                difficulty: (config.difficulty?.toUpperCase() as any) || 'MEDIUM',
                gameMode: gameMode as any,
                answerTimeSeconds: config.answerTimeSeconds || 20,
                roundTimeSeconds: config.roundTime || 30,
                totalRounds: config.roundCount || 5,
                enableAiHost: config.enableAIHost !== false,
                enableAiAnswerValidation: config.enableAiAnswerValidation ?? false,
                questionSource: hasCustomQuestions ? ('user' as const) : ('app' as const),
                customQuestionIds: hasCustomQuestions ? customQuestionIds : undefined,
            };

            const session = await startQuizSession(sessionParams).unwrap();

            if (gameMode === 'BRAIN_RING') {
                navigation.navigate('BrainRingGamePlay' as any, {
                    sessionId: session.id,
                    userId: userId,
                });
            } else {
                navigation.navigate('WWWGamePlay', {
                    sessionId: session.id,
                    challengeId: challengeId,
                    teamName: config.teamName || 'Team',
                    teamMembers: config.teamMembers || [],
                    difficulty: config.difficulty || 'MEDIUM',
                    roundTime: config.roundTime || 30,
                    roundCount: config.roundCount || 5,
                    enableAIHost: config.enableAIHost !== false,
                    enableAiAnswerValidation: config.enableAiAnswerValidation ?? false,
                });
            }
        } catch (error) {
            console.error('Failed to create WWW quiz session:', error);
            // Fallback to legacy navigation without session
            navigation.navigate('WWWGamePlay', {
                teamName: config.teamName || 'Team',
                teamMembers: config.teamMembers || [],
                difficulty: config.difficulty || 'medium',
                roundTime: config.roundTime || 30,
                roundCount: config.roundCount || 5,
                enableAIHost: config.enableAIHost !== false,
                enableAiAnswerValidation: config.enableAiAnswerValidation ?? false,
                challengeId: challengeId,
            });
        }
    };

    const launchBlitzQuiz = async (config: ParsedQuizConfig) => {
        const BLITZ_ROUND_TIME = 15;
        const BLITZ_AI_HOST = false;

        const customQuestionIds = customQuestions
            ?.map((q: any) => typeof q.id === 'string' ? parseInt(q.id) : q.id)
            .filter((id: any) => !isNaN(id)) ?? [];
        const hasCustomQuestions = customQuestionIds.length > 0;

        const session = await startQuizSession({
            challengeId,
            teamName: config.teamName || 'Blitz Team',
            teamMembers: config.teamMembers || [],
            difficulty: (config.difficulty?.toUpperCase() as any) || 'HARD',
            roundTimeSeconds: BLITZ_ROUND_TIME,
            totalRounds: config.roundCount || 10,
            enableAiHost: BLITZ_AI_HOST,
            enableAiAnswerValidation: false,
            questionSource: hasCustomQuestions ? ('user' as const) : ('app' as const),
            customQuestionIds: hasCustomQuestions ? customQuestionIds : undefined,
        }).unwrap();

        navigation.navigate('WWWGamePlay', {
            sessionId: session.id,
            challengeId: challengeId,
            teamName: config.teamName || 'Blitz Team',
            teamMembers: config.teamMembers || [],
            difficulty: config.difficulty || 'HARD',
            roundTime: BLITZ_ROUND_TIME,
            roundCount: config.roundCount || 10,
            enableAIHost: BLITZ_AI_HOST,
            enableAiAnswerValidation: false,
        });
    };

    const launchTriviaQuiz = async (config: ParsedQuizConfig) => {
        const customQuestionIds = customQuestions
            ?.map((q: any) => typeof q.id === 'string' ? parseInt(q.id) : q.id)
            .filter((id: any) => !isNaN(id)) ?? [];
        const hasCustomQuestions = customQuestionIds.length > 0;

        const session = await startQuizSession({
            challengeId,
            teamName: username || 'Player',
            teamMembers: [username || 'Player'],
            difficulty: (config.difficulty?.toUpperCase() as any) || 'MEDIUM',
            roundTimeSeconds: config.roundTime || 20,
            totalRounds: config.roundCount || 10,
            enableAiHost: false,
            enableAiAnswerValidation: config.enableAiAnswerValidation ?? false,
            questionSource: hasCustomQuestions ? ('user' as const) : ('app' as const),
            customQuestionIds: hasCustomQuestions ? customQuestionIds : undefined,
        }).unwrap();

        navigation.navigate('WWWGamePlay', {
            sessionId: session.id,
            challengeId: challengeId,
            teamName: username || 'Player',
            teamMembers: [username || 'Player'],
            difficulty: config.difficulty || 'MEDIUM',
            roundTime: config.roundTime || 20,
            roundCount: config.roundCount || 10,
            enableAIHost: false,
            enableAiAnswerValidation: config.enableAiAnswerValidation ?? false,
        });
    };

    const launchCustomQuiz = async (config: ParsedQuizConfig) => {
        const customQuestionIds = customQuestions?.map((q: any) => q.id) || [];

        const session = await startQuizSession({
            challengeId,
            teamName: config.teamName || 'Team',
            teamMembers: config.teamMembers || [],
            difficulty: (config.difficulty?.toUpperCase() as any) || 'MEDIUM',
            roundTimeSeconds: config.roundTime || 30,
            totalRounds: config.roundCount || 5,
            enableAiHost: config.enableAIHost !== false,
            enableAiAnswerValidation: config.enableAiAnswerValidation ?? false,
            questionSource: 'user' as const,
            customQuestionIds: customQuestionIds.length > 0 ? customQuestionIds : undefined,
        }).unwrap();

        navigation.navigate('WWWGamePlay', {
            sessionId: session.id,
            challengeId: challengeId,
            teamName: config.teamName || 'Team',
            teamMembers: config.teamMembers || [],
            difficulty: config.difficulty || 'MEDIUM',
            roundTime: config.roundTime || 30,
            roundCount: config.roundCount || 5,
            enableAIHost: config.enableAIHost !== false,
            enableAiAnswerValidation: config.enableAiAnswerValidation ?? false,
        });
    };

    const launchAudioQuiz = async (config: ParsedQuizConfig) => {
        if (!audioConfig && !config.audioChallengeType) {
            Alert.alert(t('common.error'), t('challengeDetails.launcher.audioConfigMissing'));
            return;
        }

        const audioType = config.audioChallengeType || AudioChallengeType.RHYTHM_CREATION;

        if (
            audioType === AudioChallengeType.RHYTHM_CREATION ||
            audioType === AudioChallengeType.RHYTHM_REPEAT
        ) {
            Alert.alert(t('challengeDetails.launcher.comingSoon'), t('challengeDetails.launcher.rhythmComingSoon'));
        } else if (audioType === AudioChallengeType.SINGING) {
            Alert.alert(t('challengeDetails.launcher.comingSoon'), t('challengeDetails.launcher.singingComingSoon'));
        } else {
            Alert.alert(t('challengeDetails.launcher.audioChallenge'), t('challengeDetails.launcher.audioChallengeInstructions'));
        }
    };

    const launchPuzzleGame = async (_config: ParsedQuizConfig) => {
        navigation.navigate('PuzzleSetup' as any, {
            challengeId: challengeId,
        });
    };

    return {
        handleStartQuiz,
        isStartingQuiz,
    };
}
