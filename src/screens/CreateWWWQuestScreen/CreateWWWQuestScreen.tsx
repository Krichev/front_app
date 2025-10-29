// src/screens/CreateWWWQuestScreen/CreateWWWQuestScreen.tsx
import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootState} from '../../app/providers/StoreProvider/store';
import {useQuestCreator} from './hooks/useQuestCreator';
import {useQuestionsManager} from './hooks/useQuestionsManager';
import QuizConfigForm from './components/QuizConfigForm';
import QuestionSourceSelector from './components/QuestionSourceSelector';
import QuestionList from './components/QuestionList';
import SelectedQuestionsPreview from './components/SelectedQuestionsPreview';
import AddQuestionModal from './components/AddQuestionModal';
import MediaQuestionModal from './components/MediaQuestionModal';
import {BasicInfoForm} from '.';

type RootStackParamList = {
    Main: { screen?: string; params?: any };
    WWWGamePlay: {
        sessionId?: string;
        challengeId?: string;
    };
};

type CreateWWWQuestScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateWWWQuestScreen: React.FC = () => {
    const navigation = useNavigation<CreateWWWQuestScreenNavigationProp>();
    const { user } = useSelector((state: RootState) => state.auth);

    // Modal states
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [showMediaQuestionModal, setShowMediaQuestionModal] = useState(false);

    // Use custom hooks for business logic
    const questCreator = useQuestCreator();
    const questionsManager = useQuestionsManager();

    const handleCreateQuest = async () => {
        const selectedQuestions = questionsManager.getSelectedQuestionsArray();

        if (selectedQuestions.length === 0) {
            Alert.alert('No Questions Selected', 'Please select at least one question to create a quest.');
            return;
        }

        if (!user?.id) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        try {
            const result = await questCreator.createQuest(
                user.id,
                selectedQuestions
            );

            if (result.success && result.sessionId) {
                Alert.alert(
                    'Quest Created!',
                    'Your quest has been created successfully.',
                    [
                        {
                            text: 'Start Playing',
                            onPress: () => {
                                navigation.navigate('WWWGamePlay', {
                                    sessionId: result.sessionId,
                                    challengeId: result.challengeId,
                                });
                            },
                        },
                        {
                            text: 'Back to Home',
                            onPress: () => {
                                navigation.navigate('Main', { screen: 'Games' });
                            },
                            style: 'cancel',
                        },
                    ]
                );
            }
        } catch (error) {
            console.error('Error creating quest:', error);
            Alert.alert('Error', 'Failed to create quest. Please try again.');
        }
    };

    const totalSelectedQuestions = questionsManager.getSelectedQuestionsArray().length;
    const isCreating = questCreator.isCreating;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create WWW Quest</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Basic Info Section */}
                <BasicInfoForm
                    title={questCreator.title}
                    description={questCreator.description}
                    reward={questCreator.reward}
                    onTitleChange={questCreator.setTitle}
                    onDescriptionChange={questCreator.setDescription}
                    onRewardChange={questCreator.setReward}
                />

                {/* Quiz Configuration Section */}
                <QuizConfigForm
                    config={questCreator.quizConfig}
                    teamMemberInput={questCreator.teamMemberInput}
                    onConfigChange={questCreator.setQuizConfig}
                    onTeamMemberInputChange={questCreator.setTeamMemberInput}
                    onAddTeamMember={questCreator.addTeamMember}
                    onRemoveTeamMember={questCreator.removeTeamMember}
                />

                {/* Question Source Selector */}
                <QuestionSourceSelector
                    questionSource={questionsManager.questionSource}
                    onSourceChange={questionsManager.setQuestionSource}
                    onAddCustomQuestion={() => setShowAddQuestionModal(true)}
                    onAddMediaQuestion={() => setShowMediaQuestionModal(true)}
                />

                {/* Question List */}
                <QuestionList
                    questionSource={questionsManager.questionSource}
                    appQuestions={questionsManager.appQuestions}
                    userQuestions={questionsManager.transformedUserQuestions}
                    isLoadingApp={questionsManager.isLoadingAppQuestions}
                    isLoadingUser={questionsManager.isLoadingUserQuestions}
                    error={questionsManager.appQuestionsError}
                    searchKeyword={questionsManager.searchKeyword}
                    searchDifficulty={questionsManager.searchDifficulty}
                    searchTopic={questionsManager.searchTopic}
                    currentPage={questionsManager.currentPage}
                    totalPages={questionsManager.totalPages}
                    totalQuestions={questionsManager.totalQuestions}
                    selectedAppQuestionIds={questionsManager.selectedAppQuestionIds}
                    selectedUserQuestionIds={questionsManager.selectedUserQuestionIds}
                    visibleAnswers={questionsManager.visibleAnswers}
                    expandedQuestions={questionsManager.expandedQuestions}
                    onSearchKeywordChange={questionsManager.setSearchKeyword}
                    onSearchDifficultyChange={questionsManager.setSearchDifficulty}
                    onSearchTopicChange={questionsManager.setSearchTopic}
                    onSearch={questionsManager.searchAppQuestions}
                    onClearSearch={questionsManager.clearSearch}
                    onPageChange={questionsManager.setCurrentPage}
                    onToggleSelection={questionsManager.toggleQuestionSelection}
                    onToggleAnswerVisibility={questionsManager.toggleAnswerVisibility}
                    onToggleExpanded={questionsManager.toggleExpanded}
                    onDeleteUserQuestion={questionsManager.deleteUserQuestion}
                    showTopicPicker={questionsManager.showTopicPicker}
                    onShowTopicPicker={questionsManager.setShowTopicPicker}
                    availableTopics={questionsManager.availableTopics}
                    isLoadingTopics={questionsManager.isLoadingTopics}
                />

                {/* Selected Questions Preview */}
                <SelectedQuestionsPreview
                    questions={questionsManager.getSelectedQuestionsArray()}
                    newCustomQuestions={questionsManager.newCustomQuestions}
                    isCollapsed={questionsManager.isPreviewCollapsed}
                    onToggleCollapse={() => questionsManager.setIsPreviewCollapsed(!questionsManager.isPreviewCollapsed)}
                    onRemoveCustomQuestion={questionsManager.removeNewCustomQuestion}
                />

                <View style={styles.spacer} />
            </ScrollView>

            {/* Create Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.createButton,
                        isCreating && styles.createButtonDisabled
                    ]}
                    onPress={handleCreateQuest}
                    disabled={isCreating}
                >
                    {isCreating ? (
                        <>
                            <ActivityIndicator color="#fff" />
                            <Text style={styles.createButtonText}>Creating...</Text>
                        </>
                    ) : (
                        <>
                            <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
                            <Text style={styles.createButtonText}>
                                Create Quest ({totalSelectedQuestions})
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Modals */}
            <AddQuestionModal
                visible={showAddQuestionModal}
                onClose={() => setShowAddQuestionModal(false)}
                onSubmit={(question) => {
                    questionsManager.addNewCustomQuestion(question);
                    setShowAddQuestionModal(false);
                }}
                availableTopics={questionsManager.availableTopics}
            />

            <MediaQuestionModal
                visible={showMediaQuestionModal}
                onClose={() => setShowMediaQuestionModal(false)}
                onSubmit={(questionData) => {
                    questionsManager.handleMediaQuestionSubmit(questionData);
                    setShowMediaQuestionModal(false);
                }}
                availableTopics={questionsManager.availableTopics}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    createButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    createButtonDisabled: {
        backgroundColor: '#ccc',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    spacer: {
        height: 100,
    },
});

export default CreateWWWQuestScreen;