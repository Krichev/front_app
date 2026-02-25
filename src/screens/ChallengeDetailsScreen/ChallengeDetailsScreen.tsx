import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

// Hooks
import { useChallengeDetails } from './hooks/useChallengeDetails';
import { useChallengeActions } from './hooks/useChallengeActions';
import { useQuizSessionLauncher } from './hooks/useQuizSessionLauncher';
import { useTheme } from '../../shared/ui/theme';

// Components
import { ChallengeHeader } from './components/ChallengeHeader';
import { ChallengeInfoSection } from './components/ChallengeInfoSection';
import { CreatorSection } from './components/CreatorSection';
import { QuizConfigSection } from './components/QuizConfigSection';
import { AudioSection } from './components/AudioSection';
import { WagerSection } from './components/WagerSection';
import { ActionButtons } from './components/ActionButtons';
import { DebugSection } from './components/DebugSection';
import { DescriptionSection } from './components/DescriptionSection';
import { SessionHistorySection } from './ui/SessionHistorySection';
import { InviteUserModal } from '../../features/Invitation/ui/InviteUserModal';

// Utils & Styles
import { navigateToTab } from '../../utils/navigation';
import { styles } from './styles';

type RootStackParamList = {
    Challenges: undefined;
    ChallengeDetails: { challengeId: string };
    ChallengeVerification: { challengeId: string };
    UserProfile: { userId: string };
    WWWGamePlay: any;
};

type ChallengeDetailsRouteProp = RouteProp<RootStackParamList, 'ChallengeDetails'>;
type ChallengeDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChallengeDetails'>;

const ChallengeDetailsScreen: React.FC = () => {
    const route = useRoute<ChallengeDetailsRouteProp>();
    const navigation = useNavigation<ChallengeDetailsNavigationProp>();
    const { colors } = useTheme();
    const { t } = useTranslation();

    const challengeId = route.params?.challengeId;
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [proofSubmitted, setProofSubmitted] = useState(false);

    // Handle missing challenge ID
    useEffect(() => {
        if (!challengeId) {
            Alert.alert(
                t('common.error'),
                t('challengeDetails.messages.idNotFound'),
                [{ text: t('common.ok'), onPress: () => navigateToTab(navigation, 'Challenges') }]
            );
        }
    }, [challengeId, navigation, t]);

    // Data fetching and derived state
    const details = useChallengeDetails(challengeId);

    // Actions (Join, Delete, Submit Proof, etc.)
    const actions = useChallengeActions({
        challengeId: challengeId!,
        safeRefetch: details.safeRefetch,
    });

    // Quiz Session Launcher
    const quizLauncher = useQuizSessionLauncher({
        challengeId: challengeId!,
        username: details.user?.username,
        userId: details.user?.id,
        quizConfig: details.quizConfig,
        audioConfig: details.audioConfig,
        customQuestions: details.customQuestions,
    });

    // Handle invitation submission from modal
    const handleInvitationSubmit = async (request: any) => {
        const success = await actions.handleInvitationSubmit(request);
        if (success) {
            setShowInviteModal(false);
        }
    };

    // Loading State
    if (details.isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary.main} />
                    <Text style={styles.loadingText}>{t('challengeDetails.messages.loading')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error State
    if (details.error || !details.challenge) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error.main} />
                    <Text style={styles.errorText}>{t('challengeDetails.messages.error')}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => details.safeRefetch()}>
                        <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const { challenge } = details;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <ChallengeHeader
                    title={challenge.title}
                    type={challenge.type}
                    status={challenge.status}
                    isCancelled={details.isCancelled}
                    userIsCreator={details.isCreator}
                    isDeleting={actions.isDeleting}
                    onDelete={actions.handleDeleteChallenge}
                />

                <View style={styles.content}>
                    {challenge.description && (
                        <DescriptionSection description={challenge.description} />
                    )}

                    <DebugSection
                        userIsCreator={details.isCreator}
                        hasUserJoined={details.hasUserJoined}
                        participants={challenge.participants}
                    />

                    {details.pendingWagerInvitation && (
                        <WagerSection pendingWagerInvitation={details.pendingWagerInvitation} />
                    )}

                    <ChallengeInfoSection
                        createdAt={challenge.created_at}
                        visibility={challenge.visibility}
                        reward={challenge.reward}
                        penalty={challenge.penalty}
                        verificationMethods={details.verificationMethods}
                        targetGroup={challenge.targetGroup}
                    />

                    <CreatorSection
                        creatorId={challenge.creator_id}
                        onPress={() => actions.navigateToCreatorProfile(challenge.creator_id)}
                    />

                    {details.isQuizType && details.quizConfig && (
                        <QuizConfigSection quizConfig={details.quizConfig} />
                    )}

                    {details.audioConfig && (
                        <AudioSection audioConfig={details.audioConfig} />
                    )}

                    {details.challenge.status === 'COMPLETED' && details.isQuizType && (
                        <SessionHistorySection challengeId={challengeId!} />
                    )}

                    <ActionButtons
                        challengeId={challengeId!}
                        isQuizType={details.isQuizType}
                        userIsCreator={details.isCreator}
                        hasUserJoined={details.hasUserJoined}
                        canReplay={details.canReplay}
                        isStartingQuiz={quizLauncher.isStartingQuiz}
                        isJoining={actions.isJoining}
                        isSubmitting={actions.isSubmitting}
                        proofSubmitted={proofSubmitted}
                        onStartQuiz={quizLauncher.handleStartQuiz}
                        onJoin={actions.handleJoinChallenge}
                        onNavigateToVerification={actions.navigateToVerification}
                        onSubmitCompletion={async () => {
                            await actions.handleSubmitCompletion();
                            setProofSubmitted(true);
                        }}
                        onShowInviteModal={() => setShowInviteModal(true)}
                    />
                </View>
            </ScrollView>

            {challengeId && (
                <InviteUserModal
                    visible={showInviteModal}
                    questId={Number(challengeId)}
                    questTitle={challenge.title}
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={handleInvitationSubmit}
                    isLoading={actions.isInviting}
                />
            )}
        </SafeAreaView>
    );
};

export default ChallengeDetailsScreen;
