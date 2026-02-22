import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
    useJoinChallengeMutation,
    useSubmitChallengeCompletionMutation,
    useDeleteQuestMutation,
} from '../../../entities/ChallengeState/model/slice/challengeApi';
import { useCreateInvitationMutation } from '../../../entities/InvitationState/model/slice/invitationApi';
import { CreateQuestInvitationRequest } from '../../../entities/InvitationState/model/types';
import { navigateToTab } from '../../../utils/navigation';

interface ActionsDeps {
    challengeId: string;
    safeRefetch: () => Promise<any>;
}

export function useChallengeActions({ challengeId, safeRefetch }: ActionsDeps) {
    const { t } = useTranslation();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    const [joinChallenge, { isLoading: isJoining }] = useJoinChallengeMutation();
    const [submitCompletion, { isLoading: isSubmitting }] = useSubmitChallengeCompletionMutation();
    const [deleteQuest, { isLoading: isDeleting }] = useDeleteQuestMutation();
    const [createInvitation, { isLoading: isInviting }] = useCreateInvitationMutation();

    const handleJoinChallenge = async () => {
        if (isJoining) return;
        try {
            await joinChallenge({ challengeId }).unwrap();
            Alert.alert(t('common.success'), t('challengeActions.join.success'));
            await safeRefetch();
        } catch (error: any) {
            Alert.alert(t('common.error'), error?.data?.message || t('challengeActions.join.error'));
            console.error('Join challenge error:', error);
        }
    };

    const handleSubmitCompletion = async () => {
        if (isSubmitting) return;
        try {
            await submitCompletion({
                challengeId: challengeId,
                completionData: {
                    verificationData: { completed: true },
                    notes: null,
                },
            }).unwrap();
            Alert.alert(t('common.success'), t('challengeActions.submit.success'));
            await safeRefetch();
        } catch (error) {
            Alert.alert(t('common.error'), t('challengeActions.submit.error'));
            console.error('Submit completion error:', error);
        }
    };

    const handleDeleteChallenge = () => {
        Alert.alert(
            t('challengeActions.delete.title'),
            t('challengeActions.delete.message'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('challengeActions.delete.confirm'),
                    style: 'destructive',
                    onPress: async () => {
                        if (isDeleting) return;
                        try {
                            await deleteQuest(Number(challengeId)).unwrap();
                            Alert.alert(t('common.success'), t('challengeActions.delete.success'), [
                                {
                                    text: t('common.ok'),
                                    onPress: () => navigation.goBack(),
                                },
                            ]);
                        } catch (error: any) {
                            console.error('Delete quest error:', error);
                            let message = t('challengeActions.delete.error');
                            if (error?.status === 403) {
                                message = t('challengeActions.delete.errorForbidden');
                            } else if (error?.status === 404) {
                                message = t('challengeActions.delete.errorNotFound');
                            }
                            Alert.alert(t('common.error'), message);
                        }
                    },
                },
            ]
        );
    };

    const handleInvitationSubmit = async (request: CreateQuestInvitationRequest) => {
        try {
            await createInvitation(request).unwrap();
            Alert.alert(t('common.success'), t('challengeActions.invitation.success'));
            return true;
        } catch (error: any) {
            Alert.alert(t('common.error'), error?.data?.message || t('challengeActions.invitation.error'));
            return false;
        }
    };

    const navigateToVerification = () => {
        navigation.navigate('ChallengeVerification', { challengeId });
    };

    const navigateToCreatorProfile = (creatorId: string | undefined) => {
        if (creatorId) {
            navigation.navigate('UserProfile', { userId: String(creatorId) });
        } else {
            Alert.alert(t('common.error'), t('challengeActions.creator.errorInfoNotAvailable'));
        }
    };

    return {
        handleJoinChallenge,
        handleSubmitCompletion,
        handleDeleteChallenge,
        handleInvitationSubmit,
        navigateToVerification,
        navigateToCreatorProfile,
        isJoining,
        isSubmitting,
        isDeleting,
        isInviting,
    };
}
