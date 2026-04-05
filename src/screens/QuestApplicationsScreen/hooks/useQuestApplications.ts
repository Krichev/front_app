// src/screens/QuestApplicationsScreen/hooks/useQuestApplications.ts
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    useGetQuestApplicationsQuery,
    useAcceptApplicationMutation,
    useDeclineApplicationMutation,
    useSendCounterMessageMutation,
} from '../../../entities/SoloQuestState/model/slice/soloQuestApi';

export type ActionModal =
    | { type: 'message'; applicationId: number }
    | { type: 'decline'; applicationId: number }
    | null;

export function useQuestApplications(questId: number) {
    const { t } = useTranslation();
    const { data: applications, isLoading, error, refetch } = useGetQuestApplicationsQuery(questId);

    const [acceptApplication, { isLoading: isAccepting }] = useAcceptApplicationMutation();
    const [declineApplication, { isLoading: isDeclining }] = useDeclineApplicationMutation();
    const [sendCounterMessage, { isLoading: isSending }] = useSendCounterMessageMutation();

    const [activeModal, setActiveModal] = useState<ActionModal>(null);
    const [modalText, setModalText] = useState('');

    const handleAccept = useCallback((applicationId: number) => {
        Alert.alert(
            t('questApplications.acceptConfirmTitle'),
            t('questApplications.acceptConfirmMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('questApplications.acceptButton'),
                    onPress: async () => {
                        try {
                            await acceptApplication({ applicationId, body: {} }).unwrap();
                            Alert.alert(t('common.success'), t('questApplications.acceptSuccess'));
                            refetch();
                        } catch {
                            Alert.alert(t('common.error'), t('questApplications.acceptError'));
                        }
                    },
                },
            ],
        );
    }, [acceptApplication, refetch, t]);

    const handleDeclineSubmit = useCallback(async () => {
        if (activeModal?.type !== 'decline') return;
        if (modalText.length > 500) {
            Alert.alert(t('common.error'), t('questApplications.messageMaxLength'));
            return;
        }
        try {
            await declineApplication({
                applicationId: activeModal.applicationId,
                body: { reason: modalText.trim() || undefined },
            }).unwrap();
            setActiveModal(null);
            setModalText('');
            Alert.alert(t('common.success'), t('questApplications.declineSuccess'));
            refetch();
        } catch {
            Alert.alert(t('common.error'), t('questApplications.declineError'));
        }
    }, [activeModal, modalText, declineApplication, refetch, t]);

    const handleSendMessage = useCallback(async () => {
        if (activeModal?.type !== 'message') return;
        if (modalText.length > 500) {
            Alert.alert(t('common.error'), t('questApplications.messageMaxLength'));
            return;
        }
        try {
            await sendCounterMessage({
                applicationId: activeModal.applicationId,
                body: { message: modalText.trim() || undefined },
            }).unwrap();
            setActiveModal(null);
            setModalText('');
            Alert.alert(t('common.success'), t('questApplications.messageSent'));
            refetch();
        } catch {
            Alert.alert(t('common.error'), t('questApplications.messageError'));
        }
    }, [activeModal, modalText, sendCounterMessage, refetch, t]);

    const openMessageModal = useCallback((applicationId: number) => {
        setModalText('');
        setActiveModal({ type: 'message', applicationId });
    }, []);

    const openDeclineModal = useCallback((applicationId: number) => {
        setModalText('');
        setActiveModal({ type: 'decline', applicationId });
    }, []);

    const closeModal = useCallback(() => {
        setActiveModal(null);
        setModalText('');
    }, []);

    return {
        applications,
        isLoading,
        error,
        refetch,
        activeModal,
        modalText,
        setModalText,
        isAccepting,
        isDeclining,
        isSending,
        handleAccept,
        handleDeclineSubmit,
        handleSendMessage,
        openMessageModal,
        openDeclineModal,
        closeModal,
    };
}
