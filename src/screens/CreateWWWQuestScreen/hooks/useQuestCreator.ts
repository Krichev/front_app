// src/screens/CreateWWWQuestScreen/hooks/useQuestCreator.ts
import {useState} from 'react';
import {Alert} from 'react-native';
import {
    useCreateChallengeMutation,
    useStartQuizSessionMutation,
} from '../../../entities/ChallengeState/model/slice/challengeApi';

export interface QuizConfig {
    gameType: string;
    teamName: string;
    teamMembers: string[];
    difficulty: string;
    roundTime: number;
    roundCount: number;
    enableAIHost: boolean;
    teamBased: boolean;
}

export interface SelectedQuestion {
    id?: string;
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'Easy' | 'Medium' | 'Hard';
    topic?: string;
    additionalInfo?: string;
    source: 'app' | 'user' | 'custom';
}

export const useQuestCreator = () => {
    const [createChallenge, { isLoading: isCreatingChallenge }] = useCreateChallengeMutation();
    const [startQuizSession, { isLoading: isStartingSession }] = useStartQuizSessionMutation();

    // Basic Info
    const [title, setTitle] = useState('Quiz Challenge');
    const [description, setDescription] = useState('Test your knowledge in this team-based quiz game.');
    const [reward, setReward] = useState('Points and bragging rights!');

    // Quiz Configuration
    const [quizConfig, setQuizConfig] = useState<QuizConfig>({
        gameType: 'WWW',
        teamName: '',
        teamMembers: [],
        difficulty: 'Medium',
        roundTime: 60,
        roundCount: 10,
        enableAIHost: true,
        teamBased: false,
    });

    const [teamMemberInput, setTeamMemberInput] = useState('');

    const addTeamMember = () => {
        if (teamMemberInput.trim()) {
            setQuizConfig({
                ...quizConfig,
                teamMembers: [...quizConfig.teamMembers, teamMemberInput.trim()],
            });
            setTeamMemberInput('');
        }
    };

    const removeTeamMember = (index: number) => {
        const updatedMembers = quizConfig.teamMembers.filter((_, i) => i !== index);
        setQuizConfig({ ...quizConfig, teamMembers: updatedMembers });
    };

    const normalizeDifficulty = (diff: string): 'EASY' | 'MEDIUM' | 'HARD' => {
        const normalized = diff.toUpperCase();
        if (normalized === 'EASY') return 'EASY';
        if (normalized === 'HARD') return 'HARD';
        return 'MEDIUM';
    };

    const createQuest = async (
        userId: number,
        selectedQuestions: SelectedQuestion[]
    ): Promise<{ success: boolean; sessionId?: string; challengeId?: string }> => {
        try {
            // Step 1: Create Challenge
            const challengePayload = {
                title,
                description,
                reward,
                challengeType: 'WWW_QUIZ',
                difficulty: quizConfig.difficulty.toUpperCase(),
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                creatorUserId: userId,
            };

            const challengeResult = await createChallenge(challengePayload).unwrap();
            console.log('Challenge created:', challengeResult);

            if (!challengeResult?.id) {
                throw new Error('Challenge creation failed - no ID returned');
            }

            // Step 2: Prepare quiz session
            const questionsForSession = selectedQuestions.map((q) => {
                const questionData: any = {
                    question: q.question,
                    answer: q.answer,
                    difficulty: normalizeDifficulty(q.difficulty),
                    topic: q.topic || '',
                    additionalInfo: q.additionalInfo || '',
                };

                if (q.source === 'app' || q.source === 'user') {
                    questionData.questionId = parseInt(q.id || '0', 10);
                }

                return questionData;
            });

            const sessionPayload = {
                challengeId: challengeResult.id,
                config: {
                    gameType: quizConfig.gameType,
                    teamName: quizConfig.teamName,
                    teamMembers: quizConfig.teamMembers,
                    difficulty: quizConfig.difficulty,
                    roundTime: quizConfig.roundTime,
                    roundCount: Math.min(quizConfig.roundCount, selectedQuestions.length),
                    enableAIHost: quizConfig.enableAIHost,
                    teamBased: quizConfig.teamBased,
                },
                questions: questionsForSession,
            };

            // Step 3: Start quiz session
            const sessionResult = await startQuizSession(sessionPayload).unwrap();
            console.log('Quiz session started:', sessionResult);

            return {
                success: true,
                sessionId: sessionResult.sessionId,
                challengeId: challengeResult.id.toString(),
            };
        } catch (error: any) {
            console.error('Error in createQuest:', error);
            Alert.alert(
                'Error',
                error?.data?.message || 'Failed to create quest. Please try again.'
            );
            return { success: false };
        }
    };

    return {
        // State
        title,
        description,
        reward,
        quizConfig,
        teamMemberInput,
        isCreating: isCreatingChallenge || isStartingSession,

        // Setters
        setTitle,
        setDescription,
        setReward,
        setQuizConfig,
        setTeamMemberInput,

        // Actions
        addTeamMember,
        removeTeamMember,
        createQuest,
    };
};