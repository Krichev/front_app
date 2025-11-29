// src/screens/CreateWWWQuestScreen/components/QuestionList.tsx
import React, {useState, useEffect} from 'react';
import {ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {APIDifficulty, MediaType, QuestionSource} from '../../../services/wwwGame/questionService';
import {QuizQuestion} from "../../../entities/QuizState/model/slice/quizApi";
import QuestionMediaViewer from './QuestionMediaViewer';

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
                        <Text style={styles.topicPickerTitle}>Select Topic</Text>
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
                                <Text style={styles.topicItemText}>All Topics</Text>
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
                    Page {currentPage + 1} of {totalPages}
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
                            placeholder="Search questions..."
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
                                {searchTopic || 'All Topics'}
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
                                        {diff === 'ALL' ? 'All' : diff}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#fff"/>
                        <Text style={styles.searchButtonText}>Search</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );

    /**
     * Render collapsed media thumbnail for question header with loading/error states
     */
    const MediaThumbnail: React.FC<{question: QuizQuestion}> = ({question}) => {
        const [isLoading, setIsLoading] = useState(true);
        const [hasError, setHasError] = useState(false);

        const mediaType = question.questionMediaType;
        const thumbnailUrl = question.questionThumbnailUrl || question.questionMediaUrl;

        // Validate URL before attempting to render
        if (!isValidMediaUrl(thumbnailUrl)) {
            console.warn(`Question ${question.id}: Invalid media URL (S3 key not enriched?): ${thumbnailUrl}`);
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

        // Show image thumbnail for images, or video thumbnail if available
        if (mediaType === MediaType.IMAGE || (mediaType === MediaType.VIDEO && question.questionThumbnailUrl)) {
            return (
                <View style={styles.mediaThumbnailContainer}>
                    <Image
                        source={{ uri: thumbnailUrl }}
                        style={styles.mediaThumbnail}
                        resizeMode="cover"
                        onLoadStart={() => {
                            setIsLoading(true);
                            setHasError(false);
                        }}
                        onLoadEnd={() => setIsLoading(false)}
                        onError={(error) => {
                            console.error(`Question ${question.id}: Failed to load thumbnail:`, error.nativeEvent.error);
                            setIsLoading(false);
                            setHasError(true);
                        }}
                    />
                    {isLoading && (
                        <View style={styles.thumbnailLoadingOverlay}>
                            <ActivityIndicator size="small" color="#007AFF" />
                        </View>
                    )}
                    {hasError && (
                        <View style={styles.thumbnailErrorOverlay}>
                            <MaterialCommunityIcons
                                name="image-broken"
                                size={20}
                                color="#F44336"
                            />
                        </View>
                    )}
                    {!hasError && !isLoading && (
                        <View style={styles.mediaTypeOverlay}>
                            <MaterialCommunityIcons
                                name={getMediaIcon(mediaType)}
                                size={12}
                                color="#fff"
                            />
                        </View>
                    )}
                </View>
            );
        }

        // Audio or video without thumbnail - show icon placeholder
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
                                    <MaterialCommunityIcons name="tag" size={14} color="#007AFF"/>
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
                            <Text style={styles.questionLabel}>Question:</Text>
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

                        {/* ✅ Integrated Media Viewer Component with URL validation */}
                        {hasMedia && mediaUrl && mediaType && isValidMediaUrl(mediaUrl) ? (
                            <View style={styles.mediaSection}>
                                <QuestionMediaViewer
                                    mediaUrl={mediaUrl}
                                    mediaType={mediaType}
                                    thumbnailUrl={thumbnailUrl}
                                    compact={false}
                                    enableFullscreen={true}
                                />
                            </View>
                        ) : hasMedia && !isValidMediaUrl(mediaUrl) ? (
                            <View style={styles.mediaErrorSection}>
                                <MaterialCommunityIcons name="alert-circle" size={32} color="#F44336" />
                                <Text style={styles.mediaErrorText}>
                                    Media URL is invalid or expired. Please refresh the question list.
                                </Text>
                            </View>
                        ) : null}

                        <View style={styles.answerContainer}>
                            <View style={styles.answerHeader}>
                                <Text style={styles.answerLabel}>Answer:</Text>
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
                                        {isAnswerVisible ? 'Hide' : 'Show'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {isAnswerVisible && (
                                <Text style={styles.answerText}>{question.answer}</Text>
                            )}
                        </View>

                        {question.additionalInfo && (
                            <View style={styles.additionalInfoContainer}>
                                <Text style={styles.additionalInfoLabel}>Additional Info:</Text>
                                <Text style={styles.additionalInfoText}>{question.additionalInfo}</Text>
                            </View>
                        )}

                        {questionSource === 'user' && (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => onDeleteUserQuestion(question.id)}
                            >
                                <MaterialCommunityIcons name="delete" size={20} color="#fff"/>
                                <Text style={styles.deleteButtonText}>Delete Question</Text>
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
                    <Text style={styles.loadingText}>Loading questions...</Text>
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
                                        ? 'Collapse All'
                                        : 'Expand All'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text style={styles.resultsText}>
                        {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} found
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    filterButtonText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    difficultyScroll: {
        flex: 1,
    },
    difficultyChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
    },
    difficultyChipSelected: {
        backgroundColor: '#007AFF',
    },
    difficultyChipText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    difficultyChipTextSelected: {
        color: '#fff',
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    bulkActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 12,
    },
    bulkActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 8,
    },
    bulkActionText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    resultsText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    questionsList: {
        flex: 1,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    questionHeaderLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#007AFF',
    },
    mediaThumbnailContainer: {
        position: 'relative',
        marginRight: 12,
    },
    mediaThumbnail: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    mediaThumbnailPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    thumbnailLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    thumbnailErrorOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
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
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
    },
    questionPreviewText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyEASY: {
        backgroundColor: '#4CAF50',
    },
    difficultyMEDIUM: {
        backgroundColor: '#FF9800',
    },
    difficultyHARD: {
        backgroundColor: '#F44336',
    },
    difficultyBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    topicBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    topicText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '600',
    },
    mediaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    mediaText: {
        fontSize: 12,
        fontWeight: '600',
    },
    questionContent: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    questionTextContainer: {
        marginBottom: 16,
    },
    questionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    questionText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
    },
    mediaSection: {
        marginBottom: 16,
    },
    mediaErrorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        gap: 12,
    },
    mediaErrorText: {
        flex: 1,
        fontSize: 14,
        color: '#F44336',
        lineHeight: 20,
    },
    answerContainer: {
        marginBottom: 16,
    },
    answerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    answerLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
    },
    toggleAnswerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    toggleAnswerText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    answerText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 8,
    },
    additionalInfoContainer: {
        marginBottom: 16,
    },
    additionalInfoLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    additionalInfoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F44336',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: '#F44336',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    paginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 16,
    },
    paginationButton: {
        padding: 8,
    },
    paginationButtonDisabled: {
        opacity: 0.5,
    },
    paginationText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    topicPickerContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    topicPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    topicPickerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    topicList: {
        maxHeight: 400,
    },
    topicItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    topicItemSelected: {
        backgroundColor: '#E3F2FD',
    },
    topicItemText: {
        fontSize: 16,
        color: '#333',
    },
    topicItemTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
});

export default QuestionList;