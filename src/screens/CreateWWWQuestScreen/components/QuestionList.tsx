// src/screens/CreateWWWQuestScreen/components/QuestionList.tsx
import React, {useEffect} from 'react';
import {ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {useAppStyles} from '../../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../../shared/ui/theme';
import {APIDifficulty, MediaType, QuestionSource} from '../../../services/wwwGame/questionService';
import {QuizQuestion} from "../../../entities/QuizState/model/slice/quizApi";
import QuestionMediaViewer from './QuestionMediaViewer';
import AuthenticatedImage from '../../../components/AuthenticatedImage';

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
 * Presigned URLs should start with http:// or https://
 * S3 keys that weren't enriched will be relative paths like "quiz-questions/123/image.jpg"
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
 * Helper function to get the appropriate color for media type
 */
const getMediaColor = (mediaType?: MediaType): string => {
    if (!mediaType) return '#666';

    switch (mediaType) {
        case MediaType.IMAGE:
            return '#4CAF50';
        case MediaType.VIDEO:
            return '#FF5722';
        case MediaType.AUDIO:
            return '#9C27B0';
        default:
            return '#666';
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
    const {screen, form, theme} = useAppStyles();
    const styles = themeStyles;
    const questions = questionSource === 'app' ? appQuestions : userQuestions;
    const selectedQuestionIds = questionSource === 'app' ? selectedAppQuestionIds : selectedUserQuestionIds;
    const isLoading = questionSource === 'app' ? isLoadingApp : isLoadingUser;

    const difficulties: Array<APIDifficulty | 'ALL'> = ['ALL', 'EASY', 'MEDIUM', 'HARD'];

    // Debug: Log questions data on mount and when props change
    useEffect(() => {
        console.log('📋 [QuestionList] Props received:', {
            questionSource,
            appQuestionsCount: appQuestions?.length ?? 0,
            userQuestionsCount: userQuestions?.length ?? 0,
            selectedAppIds: Array.from(selectedAppQuestionIds),
            selectedUserIds: Array.from(selectedUserQuestionIds),
            expandedIndices: Array.from(expandedQuestions),
        });

        // Log questions with media
        const questionsWithMedia = (questionSource === 'app' ? appQuestions : userQuestions)
            ?.filter(q => q.questionMediaUrl || q.questionMediaType) ?? [];

        console.log('🎬 [QuestionList] Questions with media:', questionsWithMedia.map(q => ({
            id: q.id,
            mediaType: q.questionMediaType,
            mediaUrl: q.questionMediaUrl?.substring(0, 80) + '...',
            thumbnailUrl: q.questionThumbnailUrl?.substring(0, 80) + '...',
            isValidUrl: isValidMediaUrl(q.questionMediaUrl),
        })));
    }, [questionSource, appQuestions, userQuestions, selectedAppQuestionIds, selectedUserQuestionIds, expandedQuestions]);

    // Debug: Log when selection changes - show selected questions' media state
    useEffect(() => {
        const currentQuestions = questionSource === 'app' ? appQuestions : userQuestions;
        const selectedIds = questionSource === 'app' ? selectedAppQuestionIds : selectedUserQuestionIds;

        if (selectedIds.size > 0) {
            const selectedQuestions = currentQuestions?.filter(q => selectedIds.has(q.id)) ?? [];
            console.log('✅ [QuestionList] Selected questions media state:',
                selectedQuestions.map(q => ({
                    id: q.id,
                    question: q.question?.substring(0, 40) + '...',
                    hasMedia: !!q.questionMediaUrl,
                    mediaType: q.questionMediaType ?? 'NONE',
                    mediaUrl: q.questionMediaUrl ?? 'EMPTY',
                    isPresignedUrl: q.questionMediaUrl?.includes('X-Amz-Signature') ?? false,
                    isValidUrl: isValidMediaUrl(q.questionMediaUrl),
                }))
            );
        }
    }, [questionSource, appQuestions, userQuestions, selectedAppQuestionIds, selectedUserQuestionIds]);

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
                            <MaterialCommunityIcons name="close" size={24} color="#333"/>
                        </TouchableOpacity>
                    </View>

                    {isLoadingTopics ? (
                        <ActivityIndicator style={{padding: 20}} size="large" color="#007AFF"/>
                    ) : (
                        <ScrollView style={styles.topicList}>
                            <TouchableOpacity
                                style={styles.topicItem}
                                onPress={() => {
                                    onSearchTopicChange('');
                                    onShowTopicPicker(false);
                                }}
                            >
                                <Text style={styles.topicItemText}>{t('createQuest.questionList.allTopics')}</Text>
                            </TouchableOpacity>

                            {availableTopics.map((topic) => (
                                <TouchableOpacity
                                    key={topic}
                                    style={[
                                        styles.topicItem,
                                        searchTopic === topic && styles.topicItemSelected,
                                    ]}
                                    onPress={() => {
                                        onSearchTopicChange(topic);
                                        onShowTopicPicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.topicItemText,
                                            searchTopic === topic && styles.topicItemTextSelected,
                                        ]}
                                    >
                                        {topic}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
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
                        color={currentPage === 0 ? '#ccc' : '#007AFF'}
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
                        color={currentPage >= totalPages - 1 ? '#ccc' : '#007AFF'}
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
                        <MaterialCommunityIcons name="magnify" size={24} color="#666"/>
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('createQuest.questionList.searchPlaceholder')}
                            value={searchKeyword}
                            onChangeText={onSearchKeywordChange}
                            placeholderTextColor="#999"
                        />
                        {searchKeyword?.length > 0 && (
                            <TouchableOpacity onPress={onClearSearch}>
                                <MaterialCommunityIcons name="close-circle" size={20} color="#666"/>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => onShowTopicPicker(true)}
                        >
                            <MaterialCommunityIcons name="tag" size={20} color="#007AFF"/>
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
                        <MaterialCommunityIcons name="magnify" size={20} color="#fff"/>
                        <Text style={styles.searchButtonText}>{t('createQuest.questionList.search')}</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );

    /**
     * Render collapsed media thumbnail for question header with loading/error states
     * Uses AuthenticatedImage with proxy URLs - no more direct MinIO URLs!
     */
    const MediaThumbnail: React.FC<{question: QuizQuestion}> = ({question}) => {
        const mediaType = question.questionMediaType;

        // Must have question.id for proxy URL
        if (!question.id) {
            console.warn('MediaThumbnail: Question has no ID');
            return (
                <View style={styles.mediaThumbnailPlaceholder}>
                    <MaterialCommunityIcons
                        name="alert-circle"
                        size={24}
                        color="#FF9800"
                    />
                </View>
            );
        }

        // Show image thumbnail for images and videos
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
                        fallbackIconColor={getMediaColor(mediaType)}
                    />
                    {/* Media type indicator overlay */}
                    <View style={styles.mediaTypeOverlay}>
                        <MaterialCommunityIcons
                            name={getMediaIcon(mediaType)}
                            size={12}
                            color="#fff"
                        />
                    </View>
                </View>
            );
        }

        // Audio - show icon placeholder
        if (mediaType === MediaType.AUDIO) {
            return (
                <View style={styles.mediaThumbnailPlaceholder}>
                    <MaterialCommunityIcons
                        name="music"
                        size={24}
                        color="#9C27B0"
                    />
                </View>
            );
        }

        // Unknown type - show generic icon
        return (
            <View style={styles.mediaThumbnailPlaceholder}>
                <MaterialCommunityIcons
                    name={getMediaIcon(mediaType)}
                    size={24}
                    color={getMediaColor(mediaType)}
                />
            </View>
        );
    };

    /**
     * Render collapsed media thumbnail for question header
     */
    const renderMediaThumbnail = (question: QuizQuestion) => {
        if (!question.questionMediaUrl) return null;
        return <MediaThumbnail question={question} />;
    };

    const renderQuestionItem = (question: QuizQuestion, index: number) => {
        const isSelected = selectedQuestionIds?.has(question.id);
        const isAnswerVisible = visibleAnswers?.has(question.id);
        const isExpanded = expandedQuestions?.has(index);

        // Access media properties directly from QuizQuestion
        const hasMedia = !!question.questionMediaUrl;
        const mediaType = question.questionMediaType;
        const mediaUrl = question.questionMediaUrl;
        const thumbnailUrl = question.questionThumbnailUrl;

        // Enhanced debug logging for media URLs
        if (hasMedia) {
            console.log(`🔍 [Question ${question.id}] Media debug:`, {
                hasMedia,
                mediaType,
                mediaUrlLength: mediaUrl?.length ?? 0,
                mediaUrlStart: mediaUrl?.substring(0, 100),
                thumbnailUrlStart: thumbnailUrl?.substring(0, 100),
                isValidMediaUrl: isValidMediaUrl(mediaUrl),
                isValidThumbnailUrl: isValidMediaUrl(thumbnailUrl),
                urlStartsWithHttp: mediaUrl?.startsWith('http'),
                containsS3Signature: mediaUrl?.includes('X-Amz-'),
                isSelected,
                isExpanded,
            });

            // Specific warning if URL looks like an S3 key instead of presigned URL
            if (mediaUrl && !mediaUrl.startsWith('http')) {
                console.error(`❌ [Question ${question.id}] CRITICAL: mediaUrl is S3 key, not presigned URL!`, {
                    rawUrl: mediaUrl,
                    expectedFormat: 'https://minio.../bucket/key?X-Amz-Signature=...',
                    possibleCause: 'Backend QuizQuestionDTOEnricher not enriching URLs with presigned signatures',
                });
            }
        }

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
                                <MaterialCommunityIcons name="check" size={18} color="#fff"/>
                            )}
                        </TouchableOpacity>

                        {/* Media Thumbnail - shown when collapsed and media exists */}
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
                                    <MaterialCommunityIcons name="tag" size={14} color="#FFFFFF"/>
                                    <Text style={styles.topicText}>{question.topic}</Text>
                                </View>
                            )}

                            {hasMedia && (
                                <View style={styles.mediaBadge}>
                                    <MaterialCommunityIcons
                                        name={getMediaIcon(mediaType)}
                                        size={14}
                                        color={getMediaColor(mediaType)}
                                    />
                                    <Text style={[styles.mediaText, {color: getMediaColor(mediaType)}]}>
                                        {mediaType || 'Media'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color="#666"
                    />
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.questionContent}>
                        <View style={styles.questionTextContainer}>
                            <Text style={styles.questionLabel}>{t('createQuest.questionList.question')}</Text>
                            <Text style={styles.questionText}>{question.question}</Text>
                        </View>

                        {/* Log media rendering decision */}
                        {(() => {
                            console.log(`🎥 [Question ${question.id}] Media render decision:`, {
                                hasMedia,
                                mediaUrl: mediaUrl?.substring(0, 50),
                                mediaType,
                                isValidUrl: isValidMediaUrl(mediaUrl),
                                willRenderViewer: hasMedia && mediaUrl && mediaType && isValidMediaUrl(mediaUrl),
                                willShowError: hasMedia && !isValidMediaUrl(mediaUrl),
                            });
                            return null;
                        })()}

                        {/* ✅ Integrated Media Viewer Component with proxy URLs */}
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
                                <MaterialCommunityIcons name="alert-circle" size={32} color="#F44336" />
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
                                        color="#007AFF"
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
                                <MaterialCommunityIcons name="delete" size={20} color="#fff"/>
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
                    <MaterialCommunityIcons name="alert-circle" size={24} color="#F44336"/>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF"/>
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
                                    color="#007AFF"
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

                        {/* Debug: Summary log */}
                        {(() => {
                            const withMedia = questions?.filter(q => q.questionMediaUrl) ?? [];
                            const withValidMedia = withMedia.filter(q => isValidMediaUrl(q.questionMediaUrl));
                            console.log('📊 [QuestionList] Render summary:', {
                                totalQuestions: questions?.length ?? 0,
                                questionsWithMedia: withMedia.length,
                                questionsWithValidUrls: withValidMedia.length,
                                invalidUrlQuestions: withMedia.length - withValidMedia.length,
                            });
                            return null;
                        })()}
                    </ScrollView>
                    {renderPagination()}
                </>
            )}

            {renderTopicPicker()}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    // Container styles
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    
    // Search styles
    searchContainer: {
        marginBottom: theme.spacing.md,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
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
    
    // Filter styles
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
    
    // Topic picker modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    topicPickerContainer: {
        backgroundColor: theme.colors.background.primary,
        borderTopLeftRadius: theme.layout.borderRadius.lg,
        borderTopRightRadius: theme.layout.borderRadius.lg,
        maxHeight: '70%',
    },
    topicPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    topicPickerTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    topicList: {
        maxHeight: 400,
    },
    topicItem: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.background.tertiary,
    },
    topicItemSelected: {
        backgroundColor: theme.colors.primary.light,
    },
    topicItemText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
    },
    topicItemTextSelected: {
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    
    // Pagination styles
    paginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    paginationButton: {
        padding: theme.spacing.sm,
    },
    paginationButtonDisabled: {
        opacity: 0.5,
    },
    paginationText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    
    // Bulk actions
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
    
    // Results
    resultsText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    questionsList: {
        flex: 1,
    },
    
    // Question item styles
    questionCard: {
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.borderRadius.lg,
        marginBottom: theme.spacing.md,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        minHeight: 72,
    },
    questionHeaderLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        overflow: 'hidden',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: theme.colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: theme.colors.primary.main,
    },
    
    // Media Thumbnail
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
        borderRadius: theme.layout.borderRadius.sm,
        overflow: 'hidden',
    },
    mediaThumbnail: {
        width: 48,
        height: 48,
        borderRadius: theme.layout.borderRadius.sm,
        backgroundColor: theme.colors.background.secondary,
    },
    mediaThumbnailPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: theme.layout.borderRadius.sm,
        backgroundColor: theme.colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaTypeOverlay: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        padding: 2,
    },
    
    questionInfo: {
        flex: 1,
        flexShrink: 1,
        minWidth: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    questionPreviewText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        lineHeight: 20,
        flexShrink: 1,
    },
    
    // Badges
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.layout.borderRadius.lg,
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
        backgroundColor: theme.colors.primary.light,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.layout.borderRadius.lg,
        gap: 4,
    },
    topicText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.neutral.white,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    mediaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.layout.borderRadius.lg,
        gap: 4,
    },
    mediaText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    
    // Question content (expanded)
    questionContent: {
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
    },
    questionTextContainer: {
        marginBottom: theme.spacing.md,
    },
    questionLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    questionText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        lineHeight: 24,
    },
    
    // Media section
    mediaSection: {
        marginBottom: theme.spacing.md,
    },
    mediaErrorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.error.light,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginBottom: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    mediaErrorText: {
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.error.main,
        lineHeight: 20,
    },
    
    // Answer styles
    answerContainer: {
        marginBottom: theme.spacing.md,
    },
    answerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    answerLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    toggleAnswerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    toggleAnswerText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    answerText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        lineHeight: 24,
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.md,
    },
    
    // Additional info
    additionalInfoContainer: {
        marginBottom: theme.spacing.md,
    },
    additionalInfoLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    additionalInfoText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    
    // Delete button
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.error.main,
        paddingVertical: 10,
        borderRadius: theme.layout.borderRadius.md,
        gap: theme.spacing.sm,
    },
    deleteButtonText: {
        color: theme.colors.neutral.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
    },
    
    // Error container
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.error.light,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginBottom: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    errorText: {
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.error.main,
    },
    
    // Loading container
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    loadingText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
}));

export default QuestionList;