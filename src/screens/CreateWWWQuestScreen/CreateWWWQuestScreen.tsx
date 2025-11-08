// src/screens/CreateWWWQuestScreen/CreateWWWQuestScreen.tsx
// FULLY FIXED VERSION - All TypeScript errors resolved
import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {RootState} from '../../app/providers/StoreProvider/store';
import {RootStackParamList} from '../../navigation/navigationTypes';

import BasicInfoForm from './components/BasicInfoForm';
import QuizConfigForm from './components/QuizConfigForm';
import QuestionSourceSelector from './components/QuestionSourceSelector';
import QuestionList from './components/QuestionList';
import SelectedQuestionsPreview from './components/SelectedQuestionsPreview';
import UnifiedQuestionModal from './components/UnifiedQuestionModal';

import {useQuestCreator} from './hooks/useQuestCreator';
import {useQuestionsManager} from './hooks/useQuestionsManager';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateWWWQuestScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useSelector((state: RootState) => state.auth);
    const questCreator = useQuestCreator();
    const questionsManager = useQuestionsManager();

    const [showUnifiedQuestionModal, setShowUnifiedQuestionModal] = useState(false);

    // ✅ FIX: Ensure questionSource is never undefined
    const questionSource = questionsManager.questionSource ?? 'app';

    // ✅ FIX: Calculate total selected questions with null safety
    const totalSelectedQuestions =
        (questionsManager.selectedAppQuestionIds?.size || 0) +
        (questionsManager.selectedUserQuestionIds?.size || 0) +
        (questionsManager.newCustomQuestions?.length || 0);

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
            // ✅ FIX: Call with correct signature (userId, selectedQuestions)
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
                                // ✅ FIX: Manually clear selections (no resetSelections method)
                                questionsManager.selectedAppQuestionIds.clear();
                                questionsManager.selectedUserQuestionIds.clear();
                                questionsManager.setNewCustomQuestions([]);

                                navigation.navigate('WWWGamePlay', {
                                    sessionId: result.sessionId,
                                    challengeId: result.challengeId,
                                });
                            },
                        },
                        {
                            text: 'Back to Home',
                            onPress: () => {
                                // ✅ FIX: Manually clear selections
                                questionsManager.selectedAppQuestionIds.clear();
                                questionsManager.selectedUserQuestionIds.clear();
                                questionsManager.setNewCustomQuestions([]);

                                navigation.goBack();
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Quest</Text>
                <View style={{width: 24}} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Basic Info */}
                <BasicInfoForm
                    title={questCreator.title}
                    description={questCreator.description}
                    reward={questCreator.reward}
                    onTitleChange={questCreator.setTitle}
                    onDescriptionChange={questCreator.setDescription}
                    onRewardChange={questCreator.setReward}
                />

                {/* Quiz Config */}
                <QuizConfigForm
                    config={questCreator.quizConfig}
                    teamMemberInput={questCreator.teamMemberInput}
                    onConfigChange={questCreator.setQuizConfig}
                    onTeamMemberInputChange={questCreator.setTeamMemberInput}
                    onAddTeamMember={questCreator.addTeamMember}
                    onRemoveTeamMember={questCreator.removeTeamMember}
                />

                {/* Question Source Selector - ✅ Using local variable with default */}
                <QuestionSourceSelector
                    questionSource={questionSource}
                    onSourceChange={questionsManager.setQuestionSource}
                    onAddQuestion={() => setShowUnifiedQuestionModal(true)}
                />

                {/* Question List - ✅ Using local variable with default */}
                <QuestionList
                    questionSource={questionSource}
                    appQuestions={questionsManager.appQuestions || []}
                    userQuestions={questionsManager.transformedUserQuestions || []}
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

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.createButton,
                        (totalSelectedQuestions === 0 || questCreator.isCreating) &&
                        styles.createButtonDisabled,
                    ]}
                    onPress={handleCreateQuest}
                    disabled={totalSelectedQuestions === 0 || questCreator.isCreating}
                >
                    {questCreator.isCreating ? (
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

            {/* Unified Question Modal */}
            <UnifiedQuestionModal
                visible={showUnifiedQuestionModal}
                onClose={() => setShowUnifiedQuestionModal(false)}
                onSubmit={(questionData) => {
                    questionsManager.handleUnifiedQuestionSubmit(questionData);
                    setShowUnifiedQuestionModal(false);
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