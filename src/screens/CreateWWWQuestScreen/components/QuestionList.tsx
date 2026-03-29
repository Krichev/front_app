// src/screens/CreateWWWQuestScreen/components/QuestionList.tsx
import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {useAppStyles} from '../../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../../shared/ui/theme';
import {APIDifficulty, QuestionSource} from '../../../services/wwwGame/questionService';
import { MediaType } from '../../../shared/types';
import {QuizQuestion} from "../../../entities/QuizState/model/slice/quizApi";
import QuestionMediaViewer from './QuestionMediaViewer';
import AuthenticatedImage from '../../../components/AuthenticatedImage';
import {Theme} from '../../../shared/ui/theme/types';

interface QuestionListProps {
    questionSource: QuestionSource;
    appQuestions: QuizQuestion[];
    userQuestions: QuizQuestion[];
    isLoadingApp: boolean;
    isLoadingUser: boolean;
    error: string | null;
    searchKeyword: string;
    searchDifficulty: APIDifficulty | 'ALL';
    searchTopic: string;
    currentPage: number;
    totalPages: number;
    totalQuestions: number;
    selectedAppQuestionIds: Set<number>;
    selectedUserQuestionIds: Set<number>;
    visibleAnswers: Set<number>;
    expandedQuestions: Set<number>;
    onSearchKeywordChange: (text: string) => void;
    onSearchDifficultyChange: (difficulty: APIDifficulty | 'ALL') => void;
    onSearchTopicChange: (topic: string) => void;
    onSearch: () => void;
    onClearSearch: () => void;
    onPageChange: (page: number) => void;
    onToggleSelection: (questionId: number, source: 'app' | 'user') => void;
    onToggleAnswerVisibility: (questionId: number) => void;
    onToggleExpanded: (index: number) => void;
    onExpandAll?: () => void;
    onCollapseAll?: () => void;
    onDeleteUserQuestion: (questionId: number) => void;
    showTopicPicker: boolean;
    onShowTopicPicker: (show: boolean) => void;
    availableTopics: string[];
    isLoadingTopics: boolean;
}

/**
 * Validate that media URL is a proper presigned URL (not an S3 key)
 */
const isValidMediaUrl = (url?: string): boolean => {
    if (!url || url.trim() === '') return false;
    return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Helper function to get the appropriate icon for media type
 */
const getMediaIcon = (mediaType?: MediaType): string => {
    if (!mediaType) return 'text';

    switch (mediaType) {
        case MediaType.IMAGE:
            return 'image';
        case MediaType.VIDEO:
            return 'video';
        case MediaType.AUDIO:
            return 'music';
        default:
            return 'text';
    }
};

/**
 * Helper function to get the appropriate color for media type from theme
 */
const getMediaColor = (theme: Theme, mediaType?: MediaType): string => {
    if (!mediaType) return theme.colors.text.secondary;

    switch (mediaType) {
        case MediaType.IMAGE:
            return theme.colors.success.main;
        case MediaType.VIDEO:
            return theme.colors.warning.main;
        case MediaType.AUDIO:
            return theme.colors.accent.main;
        default:
            return theme.colors.text.secondary;
    }
};

/**
 * Helper function to truncate question text
 */
const getTruncatedQuestion = (text: string, maxLength: number = 80): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

const QuestionList: React.FC<QuestionListProps> = ({
                                                       questionSource,
                                                       appQuestions,
                                                       userQuestions,
                                                       isLoadingApp,
                                                       isLoadingUser,
                                                       error,
                                                       searchKeyword,
                                                       searchDifficulty,
                                                       searchTopic,
                                                       currentPage,
                                                       totalPages,
                                                       totalQuestions,
                                                       selectedAppQuestionIds,
                                                       selectedUserQuestionIds,
                                                       visibleAnswers,
                                                       expandedQuestions,
                                                       onSearchKeywordChange,
                                                       onSearchDifficultyChange,
                                                       onSearchTopicChange,
                                                       onSearch,
                                                       onClearSearch,
                                                       onPageChange,
                                                       onToggleSelection,
                                                       onToggleAnswerVisibility,
                                                       onToggleExpanded,
                                                       onExpandAll,
                                                       onCollapseAll,
                                                       onDeleteUserQuestion,
                                                       showTopicPicker,
                                                       onShowTopicPicker,
                                                       availableTopics,
                                                       isLoadingTopics,
                                                   }) => {
    const {t} = useTranslation();
    const {theme} = useAppStyles();
    const styles = themeStyles;
    const questions = questionSource === 'app' ? appQuestions : userQuestions;
    const selectedQuestionIds = questionSource === 'app' ? selectedAppQuestionIds : selectedUserQuestionIds;
    const isLoading = questionSource === 'app' ? isLoadingApp : isLoadingUser;

    const [topicSearchQuery, setTopicSearchQuery] = useState('');

    const difficulties: Array<APIDifficulty | 'ALL'> = ['ALL', 'EASY', 'MEDIUM', 'HARD'];

    // Debug: Log questions data on mount and when props change
    useEffect(() => {
        if (__DEV__) {
            console.log('📋 [QuestionList] Props received:', {
                questionSource,
                appQuestionsCount: appQuestions?.length ?? 0,
                userQuestionsCount: userQuestions?.length ?? 0,
            });
        }
    }, [questionSource, appQuestions, userQuestions]);

    const filteredTopics = useMemo(() => {
        if (!topicSearchQuery) return availableTopics;
        return availableTopics.filter(topic =>
            topic.toLowerCase().includes(topicSearchQuery.toLowerCase())
        );
    }, [availableTopics, topicSearchQuery]);

    const renderTopicPicker = () => (
        <Modal
            visible={showTopicPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => onShowTopicPicker(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => onShowTopicPicker(false)}
            >
                <View style={styles.topicPickerContainer}>
                    <View style={styles.topicPickerHeader}>
                        <Text style={styles.topicPickerTitle}>{t('createQuest.questionList.filterByTopic')}</Text>
                        <TouchableOpacity onPress={() => onShowTopicPicker(false)}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.primary}/>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.topicPickerSearchContainer}>
                        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.text.secondary} />
                        <TextInput
                            style={styles.topicPickerSearchInput}
                            placeholder={t('createQuest.questionList.searchTopicsPlaceholder')}
                            value={topicSearchQuery}
                            onChangeText={setTopicSearchQuery}
                            placeholderTextColor={theme.colors.text.disabled}
                        />
                        {topicSearchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setTopicSearchQuery('')}>
                                <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.text.secondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {isLoadingTopics ? (
                        <ActivityIndicator style={{padding: 20}} size="large" color={theme.colors.primary.main}/>
                    ) : (
                        <FlatList
                            style={styles.topicList}
                            data={['', ...filteredTopics]}
                            keyExtractor={(item) => item || 'all'}
                            renderItem={({ item: topic }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.topicItem,
                                        searchTopic === topic && styles.topicItemSelected,
                                    ]}
                                    onPress={() => {
                                        onSearchTopicChange(topic);
                                        onShowTopicPicker(false);
                                        setTopicSearchQuery('');
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.topicItemText,
                                            searchTopic === topic && styles.topicItemTextSelected,
                                        ]}
                                    >
                                        {topic || t('createQuest.questionList.allTopics')}
                                    </Text>
                                    {searchTopic === topic && (
                                        <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary.main} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyTopicsContainer}>
                                    <Text style={styles.emptyTopicsText}>{t('createQuest.questionList.noTopicsFound')}</Text>
                                </View>
                            }
                        />
                    )}
                    <View style={styles.topicPickerFooter}>
                        <Text style={styles.topicCountText}>
                            {t('createQuest.questionList.topicCount', { count: filteredTopics.length })}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <View style={styles.paginationContainer}>
                <TouchableOpacity
                    style={[styles.paginationButton, currentPage === 0 && styles.paginationButtonDisabled]}
                    onPress={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                >
                    <MaterialCommunityIcons
                        name="chevron-left"
                        size={24}
                        color={currentPage === 0 ? theme.colors.text.disabled : theme.colors.primary.main}
                    />
                </TouchableOpacity>

                <Text style={styles.paginationText}>
                    {t('createQuest.questionList.page', { current: currentPage + 1, total: totalPages })}
                </Text>

                <TouchableOpacity
                    style={[
                        styles.paginationButton,
                        currentPage >= totalPages - 1 && styles.paginationButtonDisabled,
                    ]}
                    onPress={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                >
                    <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color={currentPage >= totalPages - 1 ? theme.colors.text.disabled : theme.colors.primary.main}
                    />
                </TouchableOpacity>
            </View>
        );
    };

    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
            {questionSource === 'app' && (
                <>
                    <View style={styles.searchInputContainer}>
                        <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.text.secondary}/>
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('createQuest.questionList.searchPlaceholder')}
                            value={searchKeyword}
                            onChangeText={onSearchKeywordChange}
                            placeholderTextColor={theme.colors.text.disabled}
                        />
                        {searchKeyword?.length > 0 && (
                            <TouchableOpacity onPress={onClearSearch}>
                                <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.text.secondary}/>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => onShowTopicPicker(true)}
                        >
                            <MaterialCommunityIcons name="tag" size={20} color={theme.colors.primary.main}/>
                            <Text style={styles.filterButtonText}>
                                {searchTopic || t('createQuest.questionList.allTopics')}
                            </Text>
                        </TouchableOpacity>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.difficultyScroll}
                        >
                            {difficulties.map((diff) => (
                                <TouchableOpacity
                                    key={diff}
                                    style={[
                                        styles.difficultyChip,
                                        searchDifficulty === diff && styles.difficultyChipSelected,
                                    ]}
                                    onPress={() => onSearchDifficultyChange(diff)}
                                >
                                    <Text
                                        style={[
                                            styles.difficultyChipText,
                                            searchDifficulty === diff && styles.difficultyChipTextSelected,
                                        ]}
                                    >
                                        {diff === 'ALL' ? t('createQuest.questionList.allDifficulties') : diff}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
                        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.neutral.white}/>
                        <Text style={styles.searchButtonText}>{t('createQuest.questionList.search')}</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );

    const renderMediaThumbnail = (question: QuizQuestion) => {
        if (!question.questionMediaUrl || !question.id) return null;
        
        const mediaType = question.questionMediaType;

        if (mediaType === MediaType.IMAGE || mediaType === MediaType.VIDEO) {
            return (
                <View style={styles.mediaThumbnailContainer}>
                    <AuthenticatedImage
                        questionId={question.id}
                        isThumbnail={true}
                        style={styles.mediaThumbnail}
                        containerStyle={styles.mediaThumbnailWrapper}
                        fallbackIcon={getMediaIcon(mediaType)}
                        fallbackIconSize={20}
                        fallbackIconColor={getMediaColor(theme, mediaType)}
                    />
                    <View style={styles.mediaTypeOverlay}>
                        <MaterialCommunityIcons
                            name={getMediaIcon(mediaType)}
                            size={12}
                            color={theme.colors.neutral.white}
                        />
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.mediaThumbnailPlaceholder}>
                <MaterialCommunityIcons
                    name={getMediaIcon(mediaType)}
                    size={24}
                    color={getMediaColor(theme, mediaType)}
                />
            </View>
        );
    };

    const renderQuestionItem = (question: QuizQuestion, index: number) => {
        const isSelected = selectedQuestionIds?.has(question.id);
        const isAnswerVisible = visibleAnswers?.has(question.id);
        const isExpanded = expandedQuestions?.has(index);
        const hasMedia = !!question.questionMediaUrl;
        const mediaType = question.questionMediaType;

        return (
            <View key={question.id} style={styles.questionCard}>
                <TouchableOpacity
                    style={styles.questionHeader}
                    onPress={() => onToggleExpanded(index)}
                    activeOpacity={0.7}
                >
                    <View style={styles.questionHeaderLeft}>
                        <TouchableOpacity
                            style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                            onPress={() => onToggleSelection(question.id, questionSource)}
                        >
                            {isSelected && (
                                <MaterialCommunityIcons name="check" size={18} color={theme.colors.neutral.white}/>
                            )}
                        </TouchableOpacity>

                        {!isExpanded && renderMediaThumbnail(question)}

                        <View style={styles.questionInfo}>
                            {question.difficulty && (
                                <View
                                    style={[
                                        styles.difficultyBadge,
                                        question.difficulty === 'EASY' && styles.difficultyEASY,
                                        question.difficulty === 'MEDIUM' && styles.difficultyMEDIUM,
                                        question.difficulty === 'HARD' && styles.difficultyHARD,
                                    ]}
                                >
                                    <Text style={styles.difficultyBadgeText}>
                                        {question.difficulty}
                                    </Text>
                                </View>
                            )}

                            {!isExpanded && (
                                <Text style={styles.questionPreviewText} numberOfLines={2}>
                                    {getTruncatedQuestion(question.question)}
                                </Text>
                            )}

                            {question.topic && (
                                <View style={styles.topicBadge}>
                                    <MaterialCommunityIcons name="tag" size={14} color={theme.colors.primary.main}/>
                                    <Text style={styles.topicText}>{question.topic}</Text>
                                </View>
                            )}

                            {hasMedia && (
                                <View style={styles.mediaBadge}>
                                    <MaterialCommunityIcons
                                        name={getMediaIcon(mediaType)}
                                        size={14}
                                        color={getMediaColor(theme, mediaType)}
                                    />
                                    <Text style={[styles.mediaText, {color: getMediaColor(theme, mediaType)}]}>
                                        {mediaType || 'Media'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.questionHeaderRight}>
                        {!isExpanded && (
                            <Text style={styles.swipeHint}>{t('createQuest.questionList.swipeForMore')}</Text>
                        )}
                        <MaterialCommunityIcons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={24}
                            color={theme.colors.text.secondary}
                        />
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.questionContent}>
                        <View style={styles.questionTextContainer}>
                            <Text style={styles.questionLabel}>{t('createQuest.questionList.question')}</Text>
                            <Text style={styles.questionText}>{question.question}</Text>
                        </View>

                        {question.topic && (
                            <View style={styles.topicInfoContainer}>
                                <Text style={styles.topicLabel}>{t('createQuest.questionList.topic')}:</Text>
                                <Text style={styles.topicValueText}>{question.topic}</Text>
                            </View>
                        )}

                        {hasMedia && mediaType && question.id ? (
                            <View style={styles.mediaSection}>
                                <QuestionMediaViewer
                                    questionId={question.id}
                                    mediaType={mediaType}
                                    compact={false}
                                    enableFullscreen={true}
                                />
                            </View>
                        ) : hasMedia && !question.id ? (
                            <View style={styles.mediaErrorSection}>
                                <MaterialCommunityIcons name="alert-circle" size={32} color={theme.colors.error.main} />
                                <Text style={styles.mediaErrorText}>
                                    Cannot load media: Question ID missing.
                                </Text>
                            </View>
                        ) : null}

                        <View style={styles.answerContainer}>
                            <View style={styles.answerHeader}>
                                <Text style={styles.answerLabel}>{t('createQuest.questionList.answer')}</Text>
                                <TouchableOpacity
                                    onPress={() => onToggleAnswerVisibility(question.id)}
                                    style={styles.toggleAnswerButton}
                                >
                                    <MaterialCommunityIcons
                                        name={isAnswerVisible ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={theme.colors.primary.main}
                                    />
                                    <Text style={styles.toggleAnswerText}>
                                        {isAnswerVisible ? t('createQuest.questionList.hideAnswer') : t('createQuest.questionList.showAnswer')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {isAnswerVisible && (
                                <Text style={styles.answerText}>{question.answer}</Text>
                            )}
                        </View>

                        {question.additionalInfo && (
                            <View style={styles.additionalInfoContainer}>
                                <Text style={styles.additionalInfoLabel}>{t('createQuest.questionList.additionalInfo')}</Text>
                                <Text style={styles.additionalInfoText}>{question.additionalInfo}</Text>
                            </View>
                        )}

                        {questionSource === 'user' && (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => onDeleteUserQuestion(question.id)}
                            >
                                <MaterialCommunityIcons name="delete" size={20} color={theme.colors.neutral.white}/>
                                <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {renderSearchBar()}

            {error && (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={24} color={theme.colors.error.main}/>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary.main}/>
                    <Text style={styles.loadingText}>{t('createQuest.questionList.loading')}</Text>
                </View>
            ) : (
                <>
                    {onExpandAll && onCollapseAll && questions.length > 0 && (
                        <View style={styles.bulkActionsContainer}>
                            <TouchableOpacity
                                style={styles.bulkActionButton}
                                onPress={expandedQuestions.size === questions.length ? onCollapseAll : onExpandAll}
                            >
                                <MaterialCommunityIcons
                                    name={expandedQuestions.size === questions.length ? 'chevron-up-circle' : 'chevron-down-circle'}
                                    size={20}
                                    color={theme.colors.primary.main}
                                />
                                <Text style={styles.bulkActionText}>
                                    {expandedQuestions.size === questions.length
                                        ? t('createQuest.questionList.collapse') + ' ' + t('common.all', {defaultValue: 'All'})
                                        : t('createQuest.questionList.expand') + ' ' + t('common.all', {defaultValue: 'All'})}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text style={styles.resultsText}>
                        {t('createQuest.quizConfig.summaryQuestions', { count: totalQuestions })}
                    </Text>
                    <ScrollView style={styles.questionsList} showsVerticalScrollIndicator={false}>
                        {questions.map((question, index) => renderQuestionItem(question, index))}
                    </ScrollView>
                    {renderPagination()}
                </>
            )}

            {renderTopicPicker()}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    searchContainer: {
        marginBottom: theme.spacing.md,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        paddingVertical: theme.spacing.sm,
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary.main,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        gap: theme.spacing.sm,
    },
    searchButtonText: {
        color: theme.colors.neutral.white,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.md,
        gap: theme.spacing.xs,
        flexShrink: 1,
    },
    filterButtonText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    difficultyScroll: {
        flex: 1,
    },
    difficultyChip: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.full,
        backgroundColor: theme.colors.background.secondary,
        marginRight: theme.spacing.sm,
    },
    difficultyChipSelected: {
        backgroundColor: theme.colors.primary.main,
    },
    difficultyChipText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    difficultyChipTextSelected: {
        color: theme.colors.neutral.white,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay.medium,
        justifyContent: 'flex-end',
    },
    topicPickerContainer: {
        backgroundColor: theme.colors.background.primary,
        borderTopLeftRadius: theme.layout.borderRadius.lg,
        borderTopRightRadius: theme.layout.borderRadius.lg,
        maxHeight: '80%',
    },
    topicPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: theme.layout.borderWidth.thin,
        borderBottomColor: theme.colors.border.light,
    },
    topicPickerTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    topicPickerSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        margin: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        height: 44,
    },
    topicPickerSearchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
    },
    topicList: {
        maxHeight: 400,
    },
    topicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        borderBottomWidth: theme.layout.borderWidth.thin,
        borderBottomColor: theme.colors.border.light,
    },
    topicItemSelected: {
        backgroundColor: theme.colors.primary.light + '20',
    },
    topicItemText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
    },
    topicItemTextSelected: {
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    emptyTopicsContainer: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    emptyTopicsText: {
        color: theme.colors.text.disabled,
        fontSize: theme.typography.fontSize.base,
    },
    topicPickerFooter: {
        padding: theme.spacing.md,
        alignItems: 'center',
        borderTopWidth: theme.layout.borderWidth.thin,
        borderTopColor: theme.colors.border.light,
    },
    topicCountText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.disabled,
    },
    paginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.md,
    },
    paginationButton: {
        padding: theme.spacing.sm,
    },
    paginationButtonDisabled: {
        opacity: 0.3,
    },
    paginationText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    bulkActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: theme.spacing.sm,
    },
    bulkActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        padding: theme.spacing.sm,
    },
    bulkActionText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    resultsText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    questionsList: {
        flex: 1,
    },
    questionCard: {
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.borderRadius.lg,
        marginBottom: theme.spacing.md,
        borderWidth: theme.layout.borderWidth.thin,
        borderColor: theme.colors.border.light,
        overflow: 'hidden',
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
    },
    questionHeaderLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    questionHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: theme.layout.borderRadius.sm,
        borderWidth: theme.layout.borderWidth.thick,
        borderColor: theme.colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: theme.colors.primary.main,
    },
    mediaThumbnailContainer: {
        width: 48,
        height: 48,
        borderRadius: theme.layout.borderRadius.sm,
        overflow: 'hidden',
        backgroundColor: theme.colors.background.secondary,
        position: 'relative',
    },
    mediaThumbnailWrapper: {
        width: 48,
        height: 48,
    },
    mediaThumbnail: {
        width: 48,
        height: 48,
    },
    mediaThumbnailPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: theme.layout.borderRadius.sm,
        backgroundColor: theme.colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaTypeOverlay: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: theme.colors.overlay.dark,
        borderRadius: 10,
        padding: 2,
    },
    questionInfo: {
        flex: 1,
        gap: theme.spacing.xs,
    },
    questionPreviewText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
    },
    difficultyBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.layout.borderRadius.full,
        alignSelf: 'flex-start',
    },
    difficultyEASY: {
        backgroundColor: theme.colors.success.main,
    },
    difficultyMEDIUM: {
        backgroundColor: theme.colors.warning.main,
    },
    difficultyHARD: {
        backgroundColor: theme.colors.error.main,
    },
    difficultyBadgeText: {
        color: theme.colors.neutral.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
    },
    topicBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary.main + '15',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.layout.borderRadius.full,
        alignSelf: 'flex-start',
        gap: 4,
    },
    topicText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    mediaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    mediaText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
    },
    swipeHint: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.disabled,
        fontStyle: 'italic',
    },
    questionContent: {
        padding: theme.spacing.md,
        borderTopWidth: theme.layout.borderWidth.thin,
        borderTopColor: theme.colors.border.light,
        backgroundColor: theme.colors.background.secondary + '30',
    },
    questionTextContainer: {
        marginBottom: theme.spacing.md,
    },
    questionLabel: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    questionText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        lineHeight: 22,
    },
    topicInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.md,
    },
    topicLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    topicValueText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    mediaSection: {
        marginBottom: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        overflow: 'hidden',
    },
    mediaErrorSection: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.error.light,
        borderRadius: theme.layout.borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    mediaErrorText: {
        color: theme.colors.error.main,
        fontSize: theme.typography.fontSize.sm,
    },
    answerContainer: {
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
    },
    answerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    answerLabel: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
    },
    toggleAnswerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    toggleAnswerText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.bold,
    },
    answerText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.success.main,
        fontWeight: theme.typography.fontWeight.bold,
    },
    additionalInfoContainer: {
        marginBottom: theme.spacing.md,
    },
    additionalInfoLabel: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    additionalInfoText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.error.main,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    deleteButtonText: {
        color: theme.colors.neutral.white,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.error.light,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginBottom: theme.spacing.md,
    },
    errorText: {
        color: theme.colors.error.main,
        fontSize: theme.typography.fontSize.sm,
        flex: 1,
    },
    loadingContainer: {
        padding: theme.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.md,
    },
    loadingText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.fontSize.base,
    },
}));

export default QuestionList;
