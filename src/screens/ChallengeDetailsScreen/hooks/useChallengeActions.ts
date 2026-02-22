import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    const [joinChallenge, { isLoading: isJoining }] = useJoinChallengeMutation();
    const [submitCompletion, { isLoading: isSubmitting }] = useSubmitChallengeCompletionMutation();
    const [deleteQuest, { isLoading: isDeleting }] = useDeleteQuestMutation();
    const [createInvitation, { isLoading: isInviting }] = useCreateInvitationMutation();

    const handleJoinChallenge = async () => {
        if (isJoining) return;
        try {
            await joinChallenge({ challengeId }).unwrap();
            Alert.alert('Success', 'You have joined the challenge!');
            await safeRefetch();
        } catch (error: any) {
            Alert.alert('Error', error?.data?.message || 'Failed to join challenge.');
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
            Alert.alert('Success', 'Your completion has been submitted for verification!');
            await safeRefetch();
        } catch (error) {
            Alert.alert('Error', 'Failed to submit completion. Please try again.');
            console.error('Submit completion error:', error);
        }
    };

    const handleDeleteChallenge = () => {
        Alert.alert(
            'Delete Quest',
            'Are you sure you want to delete this quest? This action cannot be undone.\n\nNote: Statistics from completed sessions will be preserved.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (isDeleting) return;
                        try {
                            await deleteQuest(Number(challengeId)).unwrap();
                            Alert.alert('Success', 'Quest deleted successfully', [
                                {
                                    text: 'OK',
                                    onPress: () => navigation.goBack(),
                                },
                            ]);
                        } catch (error: any) {
                            console.error('Delete quest error:', error);
                            const message = error?.status === 403
                                ? "You don't have permission to delete this quest"
                                : error?.status === 404
                                ? 'Quest not found'
                                : 'Failed to delete quest. Please try again.';
                            Alert.alert('Error', message);
                        }
                    },
                },
            ]
        );
    };

    const handleInvitationSubmit = async (request: CreateQuestInvitationRequest) => {
        try {
            await createInvitation(request).unwrap();
            Alert.alert('Success', 'Invitation sent successfully!');
            return true;
        } catch (error: any) {
            Alert.alert('Error', error?.data?.message || 'Failed to send invitation.');
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
            Alert.alert('Error', 'Creator information is not available');
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
