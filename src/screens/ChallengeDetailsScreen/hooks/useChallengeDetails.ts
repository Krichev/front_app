import { useSelector } from 'react-redux';
import { RootState } from '../../../app/providers/StoreProvider/store';
import {
    useGetChallengeByIdQuery,
    useGetChallengeAudioConfigQuery,
    useGetQuestionsForChallengeQuery,
    useGetPlayedQuestionsForChallengeQuery,
} from '../../../entities/ChallengeState/model/slice/challengeApi';
import { useGetWagersByChallengeQuery } from '../../../entities/WagerState/model/slice/wagerApi';
import { resolveChallengeState } from '../lib/challengeStateResolver';
import { parseQuizConfig } from '../lib/quizConfigParser';
import { getVerificationMethods as getVerificationMethodsFromApi } from '../../../app/types';

export function useChallengeDetails(challengeId: string | undefined) {
    const { user } = useSelector((state: RootState) => state.auth);

    // --- RTK Query hooks ---
    const {
        data: challenge,
        isLoading,
        error,
        refetch,
        isUninitialized,
    } = useGetChallengeByIdQuery(challengeId!, { skip: !challengeId });

    const { data: audioConfig } = useGetChallengeAudioConfigQuery(
        challengeId || '',
        { skip: !challengeId }
    );

    const { data: wagers } = useGetWagersByChallengeQuery(
        Number(challengeId),
        { skip: !challengeId }
    );

    // Parse quiz config
    const quizConfig = parseQuizConfig(challenge?.quizConfig);
    const isCancelled = challenge?.status === 'CANCELLED';

    // Prefetch custom questions (still needed for quest creation flow)
    const { data: customQuestionsRaw } = useGetQuestionsForChallengeQuery(
        { challengeId: challengeId! },
        { skip: !challengeId || isCancelled }
    );

    // Fetch played questions with round context (for review UI)
    const { data: playedRounds } = useGetPlayedQuestionsForChallengeQuery(
        { challengeId: challengeId! },
        { skip: !challengeId || isCancelled }
    );

    // Derive: questions that were actually played (from rounds)
    const playedQuestions = playedRounds?.map(round => round.question) ?? [];

    // Use played questions if available, fall back to customQuestions
    const customQuestions = playedQuestions.length > 0 ? playedQuestions : (customQuestionsRaw ?? []);

    // --- Derived state ---
    const challengeState = resolveChallengeState(challenge, user?.id);

    const safeRefetch = () => {
        if (!isUninitialized) return refetch();
        return Promise.resolve();
    };

    // Verification methods helper
    const verificationMethods = challenge?.verificationMethod
        ? getVerificationMethodsFromApi(challenge.verificationMethod)
        : [];

    // Pending wager invitation - using logic from original file
    const pendingWagerInvitation = wagers?.find(w => 
        w.status === 'PROPOSED' && 
        w.participants?.some((p: any) => p.userId === Number(user?.id) && p.status === 'INVITED')
    ) || null;

    return {
        // Raw data
        challenge,
        audioConfig,
        quizConfig,
        customQuestions,
        playedRounds,
        user,
        pendingWagerInvitation,
        verificationMethods,

        // Loading/error
        isLoading,
        error,

        // Derived booleans
        ...challengeState,

        // Actions
        safeRefetch,
    };
}
