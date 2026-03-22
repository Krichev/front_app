// src/screens/CreateWWWQuestScreen/CreateWWWQuestScreen.tsx
import React, {useCallback, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
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
import { Modal } from '../../shared/ui/Modal/Modal';
import { WagerSetupBottomSheet } from '../../features/Wager/ui/WagerSetupBottomSheet';
import { CreateWagerRequest } from '../../entities/WagerState/model/types';
import { useCreateWagerMutation } from '../../entities/WagerState/model/slice/wagerApi';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../shared/ui/theme/createStyles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateWWWQuestScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const { user } = useSelector((state: RootState) => state.auth);
    const questCreator = useQuestCreator();
    const questionsManager = useQuestionsManager();
    const [createWager] = useCreateWagerMutation();

    // Refetch user questions when screen comes into focus (Bug 4)
    const { refetchUserQuestions } = questionsManager;
    useFocusEffect(
        useCallback(() => {
            refetchUserQuestions();
        }, [refetchUserQuestions])
    );

    const [showUnifiedQuestionModal, setShowUnifiedQuestionModal] = useState(false);
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [showWagerModal, setShowWagerModal] = useState(false);
    const [wagerData, setWagerData] = useState<Partial<CreateWagerRequest> | null>(null);
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
                // Handle Wager creation if data exists
                if (wagerData) {
                    try {
                        await createWager({
                            ...wagerData as CreateWagerRequest,
                            challengeId: parseInt(result.challengeId!),
                            quizSessionId: parseInt(result.sessionId),
                        }).unwrap();
                    } catch (wagerError) {
                        console.error('Wager creation failed:', wagerError);
                        // We don't block quest creation if wager fails, but maybe alert user
                    }
                }

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
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('createQuest.title')}</Text>
                <View style={{width: 24}} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Basic Info */}
                <BasicInfoForm
                    title={questCreator.title}
                    description={questCreator.description}
                    onTitleChange={questCreator.setTitle}
                    onDescriptionChange={questCreator.setDescription}
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

                {/* Question Source Selector */}
                <QuestionSourceSelector
                    questionSource={questionSource}
                    onSourceChange={questionsManager.setQuestionSource}
                    onAddQuestion={() => setShowTypeSelector(true)}
                />

                {/* Question List */}
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

                {/* Wager Setup Section */}
                <View style={styles.wagerSection}>
                    <TouchableOpacity 
                        style={[styles.wagerButton, wagerData && styles.wagerButtonActive]} 
                        onPress={() => setShowWagerModal(true)}
                    >
                        <MaterialCommunityIcons 
                            name={wagerData ? "hand-coin" : "hand-coin-outline"} 
                            size={24} 
                            color={wagerData ? theme.colors.primary.contrastText : theme.colors.primary.main} 
                        />
                        <Text style={[styles.wagerButtonText, wagerData && styles.wagerButtonTextActive]}>
                            {wagerData ? t('createQuest.wager.configuredButton') : t('createQuest.wager.addButton')}
                        </Text>
                    </TouchableOpacity>
                </View>

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
                            <ActivityIndicator color={theme.colors.primary.contrastText} />
                            <Text style={styles.createButtonText}>{t('createQuest.creating')}</Text>
                        </>
                    ) : (
                        <>
                            <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary.contrastText} />
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

            {/* Wager Setup Modal */}
            <Modal
                isOpen={showWagerModal}
                onClose={() => setShowWagerModal(false)}
                title={t('createQuest.wager.title')}
            >
                <WagerSetupBottomSheet 
                    initialData={wagerData || undefined}
                    onSave={(data) => {
                        setWagerData(data);
                        setShowWagerModal(false);
                    }} 
                />
            </Modal>
        </SafeAreaView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: theme.layout.borderWidth.thin,
        borderBottomColor: theme.colors.border.main,
    },
    headerTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    wagerSection: {
        paddingHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
    },
    wagerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: theme.layout.borderWidth.thick,
        borderColor: theme.colors.primary.main,
        borderStyle: 'dashed',
        gap: theme.spacing.sm,
    },
    wagerButtonActive: {
        backgroundColor: theme.colors.primary.main,
        borderStyle: 'solid',
    },
    wagerButtonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.primary.main,
    },
    wagerButtonTextActive: {
        color: theme.colors.primary.contrastText,
    },
    footer: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderTopWidth: theme.layout.borderWidth.thin,
        borderTopColor: theme.colors.border.main,
    },
    createButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary.main,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    createButtonDisabled: {
        backgroundColor: theme.colors.text.disabled,
    },
    createButtonText: {
        color: theme.colors.primary.contrastText,
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
    },
    spacer: {
        height: 100,
    },
}));

export default CreateWWWQuestScreen;
