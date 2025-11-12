// src/screens/CreateWWWQuestScreen/hooks/useQuestCreator.ts
import {useState} from 'react';
import {Alert} from 'react-native';
import {
    CreateChallengeRequest,
    useCreateChallengeMutation
} from '../../../entities/ChallengeState/model/slice/challengeApi';
import {useStartQuizSessionMutation} from '../../../entities/QuizState/model/slice/quizApi';
import {PaymentType} from '../../../entities/ChallengeState/model/types';
import {APIDifficulty} from "../../../services/wwwGame/questionService.ts";

export interface QuizConfig {
    gameType: string;
    teamName: string;
    teamMembers: string[];
    difficulty: APIDifficulty;
    roundTime: number;
    roundCount: number;
    enableAIHost: boolean;
    teamBased: boolean;
}

export interface SelectedQuestion {
    id?: string;
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
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
        difficulty: 'MEDIUM',
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


    const createQuest = async (
        userId: string,
        selectedQuestions: SelectedQuestion[]
    ): Promise<{ success: boolean; sessionId?: string; challengeId?: string }> => {
        try {
            console.log('Creating quest with config:', quizConfig);

            // Step 1: Create Challenge with ALL required fields matching CreateChallengeRequest
            const challengePayload: CreateChallengeRequest = {
                // ===== BASIC REQUIRED FIELDS =====
                title,
                description,
                type: 'QUIZ',
                visibility: 'PUBLIC',
                status: 'ACTIVE',
                userId: userId,

                // ===== OPTIONAL BASIC FIELDS =====
                reward,
                penalty: undefined,
                verificationMethod: undefined,
                verificationDetails: undefined,
                targetGroup: undefined,
                tags: undefined,
                quizConfig: undefined,

                // ===== DATE FIELDS =====
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                frequency: 'ONE_TIME',

                // ===== PAYMENT FIELDS (matching backend defaults) =====
                paymentType: PaymentType.FREE,
                hasEntryFee: false,
                entryFeeAmount: undefined,
                entryFeeCurrency: undefined,
                hasPrize: false,
                prizeAmount: undefined,
                prizeCurrency: undefined,

                // ===== ACCESS CONTROL FIELDS =====
                requiresApproval: false,
                invitedUserIds: undefined,

                // ===== QUIZ-SPECIFIC FIELDS =====
                difficulty: quizConfig.difficulty,
            };

            const challengeResult = await createChallenge(challengePayload).unwrap();
            console.log('Challenge created:', challengeResult);

            if (!challengeResult?.id) {
                throw new Error('Challenge creation failed - no ID returned');
            }

            // Step 2: Prepare custom question IDs (if questions have IDs from app/user)
            const customQuestionIds: number[] = selectedQuestions
                .filter(q => (q.source === 'app' || q.source === 'user') && q.id)
                .map(q => parseInt(q.id!, 10))
                .filter(id => !isNaN(id));

            // Step 3: Determine question source
            const questionSource = customQuestionIds.length > 0 ? 'user' : 'app';

            // Step 4: Create session payload with ALL required fields
            const sessionPayload = {
                challengeId: challengeResult.id,
                teamName: quizConfig.teamName || 'My Team',
                teamMembers: quizConfig.teamMembers.length > 0 ? quizConfig.teamMembers : ['Player 1'],
                difficulty: quizConfig.difficulty,
                totalRounds: Math.min(quizConfig.roundCount, selectedQuestions.length),
                roundTimeSeconds: quizConfig.roundTime,
                enableAiHost: quizConfig.enableAIHost,
                questionSource: questionSource as 'app' | 'user',
                customQuestionIds: customQuestionIds.length > 0 ? customQuestionIds : undefined,
            };

            console.log('Starting quiz session with payload:', sessionPayload);

            // Step 5: Start quiz session
            const sessionResult = await startQuizSession(sessionPayload).unwrap();
            console.log('Quiz session started:', sessionResult);

            return {
                success: true,
                sessionId: sessionResult.id,
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