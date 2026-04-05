// src/screens/MyApplicationsScreen/hooks/useMyApplications.ts
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    useGetMyApplicationsQuery,
    useWithdrawApplicationMutation,
} from '../../../entities/SoloQuestState/model/slice/soloQuestApi';

export function useMyApplications() {
    const { t } = useTranslation();
    const { data: applications, isLoading, error, refetch } = useGetMyApplicationsQuery();
    const [withdrawApplication, { isLoading: isWithdrawing }] = useWithdrawApplicationMutation();

    const handleWithdraw = useCallback((applicationId: number) => {
        Alert.alert(
            t('myApplications.withdrawConfirmTitle'),
            t('myApplications.withdrawConfirmMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('myApplications.withdrawButton'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await withdrawApplication(applicationId).unwrap();
                            Alert.alert(t('common.success'), t('myApplications.withdrawSuccess'));
                            refetch();
                        } catch {
                            Alert.alert(t('common.error'), t('myApplications.withdrawError'));
                        }
                    },
                },
            ],
        );
    }, [withdrawApplication, refetch, t]);

    return { applications, isLoading, error, refetch, isWithdrawing, handleWithdraw };
}
