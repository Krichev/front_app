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
    View
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {RootState} from '../../app/providers/StoreProvider/store';

import BasicInfoForm from './components/BasicInfoForm';
import QuizConfigForm from './components/QuizConfigForm';
import QuestionSourceSelector from './components/QuestionSourceSelector';
import SelectedQuestionsPreview from './components/SelectedQuestionsPreview';

import {useQuestCreator} from './hooks/useQuestCreator';
import {useQuestionsManager} from './hooks/useQuestionsManager';
import {RootStackParamList} from "../../navigation/AppNavigator.tsx";
import RegularQuestionEditor from "./components/RegularQuestionEditor";
import QuestionTypeSelectorModal from './components/QuestionTypeSelectorModal';
import {QuestionCategory} from './types/question.types';
import {APIDifficulty} from '../../services/wwwGame/questionService';
import {QuestionList} from "./index.ts";
import { isLocalizedStringEmpty } from '../../shared/types/localized';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateWWWQuestScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { t } = useTranslation();
    const { user } = useSelector((state: RootState) => state.auth);
    const questCreator = useQuestCreator();
    const questionsManager = useQuestionsManager();

    const [showUnifiedQuestionModal, setShowUnifiedQuestionModal] = useState(false);
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [preSelectedMediaType, setPreSelectedMediaType] = useState<'image' | 'video' | null>(null);

    // Local state for features not yet in hook
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchDifficulty, setSearchDifficulty] = useState<APIDifficulty | 'ALL'>('ALL');
    const [searchTopic, setSearchTopic] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(0);
    const [visibleAnswers, setVisibleAnswers] = useState<Set<number>>(new Set());
    const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);

    const questionSource = questionsManager.questionSource ?? 'app';

    const totalSelectedQuestions =
        (questionsManager.selectedAppQuestionIds?.size || 0) +
        (questionsManager.selectedUserQuestionIds?.size || 0);

    // Helper functions for features not yet in hook
    const toggleAnswerVisibility = (questionId: number) => {
        setVisibleAnswers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const searchAppQuestions = () => {
        // TODO: Implement search functionality
        console.log('Search:', { searchKeyword, searchDifficulty, searchTopic });
    };

    const clearSearch = () => {
        setSearchKeyword('');
        setSearchDifficulty('ALL');
        setSearchTopic('');
    };

    const handleCreateQuest = async () => {
        if (isLocalizedStringEmpty(questCreator.title)) {
            Alert.alert(
                t('createQuest.alerts.validationError'),
                t('createQuest.alerts.titleRequired')
            );
            return;
        }

        if (isLocalizedStringEmpty(questCreator.description)) {
            Alert.alert(
                t('createQuest.alerts.validationError'),
                t('createQuest.alerts.descriptionRequired')
            );
            return;
        }

        const selectedQuestions = questionsManager.getSelectedQuestionsArray();

        if (selectedQuestions.length === 0) {
            Alert.alert(
                t('createQuest.alerts.validationError'),
                t('createQuest.alerts.minQuestions', { min: 1 })
            );
            return;
        }

        if (!user?.id) {
            Alert.alert(t('common.error'), t('createQuest.alerts.loginRequired'));
            return;
        }

        try {
            const result = await questCreator.createQuest(
                user.id,
                selectedQuestions
            );

            if (result.success && result.sessionId) {
                Alert.alert(
                    t('createQuest.alerts.createSuccess'),
                    t('createQuest.alerts.createSuccess'),
                    [
                        {
                            text: t('game.startGame'),
                            onPress: () => {
                                questionsManager.selectedAppQuestionIds.clear();
                                questionsManager.selectedUserQuestionIds.clear();

                                navigation.navigate('WWWGamePlay', {
                                    sessionId: result.sessionId,
                                    challengeId: result.challengeId,
                                });
                            },
                        },
                        {
                            text: t('common.back'),
                            onPress: () => {
                                questionsManager.selectedAppQuestionIds.clear();
                                questionsManager.selectedUserQuestionIds.clear();

                                navigation.goBack();
                            },
                            style: 'cancel',
                        },
                    ]
                );
            }
        } catch (error) {
            console.error('Error creating quest:', error);
            Alert.alert(t('common.error'), t('createQuest.alerts.createError'));
        }
    };

    const handleTypeSelect = (category: QuestionCategory) => {
        setShowTypeSelector(false);
        if (category === 'KARAOKE') {
            navigation.navigate('CreateAudioQuestion', {
                returnTo: 'CreateWWWQuest'
            });
        } else {
            setPreSelectedMediaType(null);
            setShowUnifiedQuestionModal(true);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('createQuest.title')}</Text>
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
                    selectedQuestionsCount={totalSelectedQuestions}
                    onConfigChange={questCreator.setQuizConfig}
                    onTeamMemberInputChange={questCreator.setTeamMemberInput}
                    onAddTeamMember={questCreator.addTeamMember}
                    onRemoveTeamMember={questCreator.removeTeamMember}
                />

                {/* Question Source Selector - ✅ Using local variable with default */}
                <QuestionSourceSelector
                    questionSource={questionSource}
                    onSourceChange={questionsManager.setQuestionSource}
                    onAddQuestion={() => setShowTypeSelector(true)}
                />

                {/* Question List - ✅ Using local variable with default */}
                <QuestionList
                    questionSource={questionSource}
                    appQuestions={questionsManager.appQuestions || []}
                    userQuestions={questionsManager.userQuestions || []}
                    isLoadingApp={questionsManager.isLoadingAppQuestions}
                    isLoadingUser={questionsManager.isLoadingUserQuestions}
                    error={null}
                    searchKeyword={searchKeyword}
                    searchDifficulty={searchDifficulty}
                    searchTopic={searchTopic}
                    currentPage={currentPage}
                    totalPages={1}
                    totalQuestions={(questionsManager.appQuestions || []).length}
                    selectedAppQuestionIds={questionsManager.selectedAppQuestionIds}
                    selectedUserQuestionIds={questionsManager.selectedUserQuestionIds}
                    visibleAnswers={visibleAnswers}
                    expandedQuestions={questionsManager.expandedQuestions}
                    onSearchKeywordChange={setSearchKeyword}
                    onSearchDifficultyChange={setSearchDifficulty}
                    onSearchTopicChange={setSearchTopic}
                    onSearch={searchAppQuestions}
                    onClearSearch={clearSearch}
                    onPageChange={setCurrentPage}
                    onToggleSelection={questionsManager.toggleQuestionSelection}
                    onToggleAnswerVisibility={toggleAnswerVisibility}
                    onToggleExpanded={questionsManager.toggleQuestionExpansion}
                    onExpandAll={questionsManager.expandAllQuestions}
                    onCollapseAll={questionsManager.collapseAllQuestions}
                    onDeleteUserQuestion={questionsManager.deleteUserQuestion}
                    showTopicPicker={questionsManager.showTopicPicker}
                    onShowTopicPicker={questionsManager.setShowTopicPicker}
                    availableTopics={questionsManager.availableTopics}
                    isLoadingTopics={questionsManager.isLoadingTopics}
                />

                {/* Selected Questions Preview */}
                <SelectedQuestionsPreview
                    questions={questionsManager.getSelectedQuestionsArray()}
                    isCollapsed={isPreviewCollapsed}
                    onToggleCollapse={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
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
                            <Text style={styles.createButtonText}>{t('createQuest.creating')}</Text>
                        </>
                    ) : (
                        <>
                            <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
                            <Text style={styles.createButtonText}>
                                {t('createQuest.createButton', { count: totalSelectedQuestions })}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Unified Question Modal */}
            <RegularQuestionEditor
                visible={showUnifiedQuestionModal}
                onClose={() => {
                    setShowUnifiedQuestionModal(false);
                    setPreSelectedMediaType(null);
                }}
                onSubmit={(questionData) => {
                    questionsManager.handleUnifiedQuestionSubmit(questionData);
                    setShowUnifiedQuestionModal(false);
                }}
                preSelectedMediaType={preSelectedMediaType}
            />

            {/* Question Type Selector Modal */}
            <QuestionTypeSelectorModal
                visible={showTypeSelector}
                onClose={() => setShowTypeSelector(false)}
                onSelect={handleTypeSelect}
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
