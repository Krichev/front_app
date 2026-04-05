// src/screens/SoloQuestDetailScreen/hooks/useSoloQuestDetail.ts
import { useSelector } from 'react-redux';
import { RootState } from '../../../app/providers/StoreProvider/store';
import {
    useGetSoloQuestQuery,
    useGetMyApplicationsQuery,
    useApplyToQuestMutation,
    useCancelSoloQuestMutation,
} from '../../../entities/SoloQuestState/model/slice/soloQuestApi';
import { SoloQuestApplication } from '../../../entities/SoloQuestState/model/types';

export function useSoloQuestDetail(questId: number) {
    const user = useSelector((state: RootState) => state.auth.user);

    const { data: quest, isLoading, error, refetch } = useGetSoloQuestQuery(questId);
    const { data: myApplications } = useGetMyApplicationsQuery();

    const [applyToQuest, { isLoading: isApplying }] = useApplyToQuestMutation();
    const [cancelSoloQuest, { isLoading: isCancelling }] = useCancelSoloQuestMutation();

    const isCreator = !!(user && quest && Number(user.id) === quest.creatorId);
    const isMatchedUser = !!(user && quest && quest.matchedUserId !== undefined && Number(user.id) === quest.matchedUserId);

    const myApplication: SoloQuestApplication | undefined =
        myApplications?.find(a => a.soloQuestId === questId);
    const hasApplied = !!myApplication;

    return {
        quest,
        isLoading,
        error,
        refetch,
        user,
        isCreator,
        isMatchedUser,
        myApplication,
        hasApplied,
        isApplying,
        isCancelling,
        applyToQuest,
        cancelSoloQuest,
    };
}
