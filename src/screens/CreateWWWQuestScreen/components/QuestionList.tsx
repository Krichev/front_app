// src/screens/CreateWWWQuestScreen/components/QuestionList.tsx
import React from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {APIDifficulty, MediaType, QuestionSource} from '../../../services/wwwGame/questionService';
import {QuizQuestion} from "../../../entities/QuizState/model/slice/quizApi.ts";

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
    selectedAppQuestionIds: Set<string>;
    selectedUserQuestionIds: Set<string>;
    visibleAnswers: Set<string>;
    expandedQuestions: Set<number>;
    onSearchKeywordChange: (text: string) => void;
    onSearchDifficultyChange: (difficulty: APIDifficulty | 'ALL') => void;
    onSearchTopicChange: (topic: string) => void;
    onSearch: () => void;
    onClearSearch: () => void;
    onPageChange: (page: number) => void;
    onToggleSelection: (questionId: string, source: 'app' | 'user') => void;
    onToggleAnswerVisibility: (questionId: string) => void;
    onToggleExpanded: (index: number) => void;
    onDeleteUserQuestion: (questionId: string) => void;
    showTopicPicker: boolean;
    onShowTopicPicker: (show: boolean) => void;
    availableTopics: string[];
    isLoadingTopics: boolean;
}

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
                                                       onDeleteUserQuestion,
                                                       showTopicPicker,
                                                       onShowTopicPicker,
                                                       availableTopics,
                                                       isLoadingTopics,
                                                   }) => {
    const questions = questionSource === 'app' ? appQuestions : userQuestions;
    const selectedQuestionIds = questionSource === 'app' ? selectedAppQuestionIds : selectedUserQuestionIds;
    const isLoading = questionSource === 'app' ? isLoadingApp : isLoadingUser;

    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
                <MaterialCommunityIcons name="magnify" size={24} color="#666"/>
                <TextInput
                    style={styles.searchInput}
                    value={searchKeyword}
                    onChangeText={onSearchKeywordChange}
                    placeholder="Search questions..."
                    placeholderTextColor="#999"
                />
                {searchKeyword.length > 0 && (
                    <TouchableOpacity onPress={onClearSearch}>
                        <MaterialCommunityIcons name="close-circle" size={20} color="#666"/>
                    </TouchableOpacity>
                )}
            </View>

            {questionSource === 'app' && (
                <>
                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => onShowTopicPicker(true)}
                        >
                            <MaterialCommunityIcons name="tag" size={20} color="#007AFF"/>
                            <Text style={styles.filterButtonText}>
                                {searchTopic || 'All Topics'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="#007AFF"/>
                        </TouchableOpacity>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.difficultyScroll}>
                            {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
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

    const renderQuestionItem = (question: QuizQuestion, index: number) => {
        const isSelected = selectedQuestionIds.has(question.id.toString());
        const isAnswerVisible = visibleAnswers.has(question.id.toString());
        const isExpanded = expandedQuestions.has(index);
        const hasMedia = (question as any).questionMediaUrl || (question as any).questionMediaType;
        const mediaType = (question as any).questionMediaType as MediaType | undefined;

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
                            onPress={() => onToggleSelection(question.id.toString(), questionSource)}
                        >
                            {isSelected && (
                                <MaterialCommunityIcons name="check" size={18} color="#fff"/>
                            )}
                        </TouchableOpacity>

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

                        {/* Media Preview */}
                        {hasMedia && (question as any).questionMediaUrl && (
                            <View style={styles.mediaContainer}>
                                {mediaType === MediaType.IMAGE ? (
                                    <Image
                                        source={{uri: (question as any).questionMediaUrl}}
                                        style={styles.mediaImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.mediaPlaceholder}>
                                        <MaterialCommunityIcons
                                            name={getMediaIcon(mediaType)}
                                            size={48}
                                            color={getMediaColor(mediaType)}
                                        />
                                        <Text style={[styles.mediaPlaceholderText, {color: getMediaColor(mediaType)}]}>
                                            {mediaType === MediaType.VIDEO ? 'Video' : 'Audio'} Content
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.answerContainer}>
                            <View style={styles.answerHeader}>
                                <Text style={styles.answerLabel}>Answer:</Text>
                                <TouchableOpacity
                                    onPress={() => onToggleAnswerVisibility(question.id.toString())}
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

                        {question.source && (
                            <Text style={styles.sourceText}>Source: {question.source}</Text>
                        )}

                        {questionSource === 'user' && (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => onDeleteUserQuestion(question.id.toString())}
                            >
                                <MaterialCommunityIcons name="delete" size={20} color="#F44336"/>
                                <Text style={styles.deleteButtonText}>Delete Question</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderPagination = () => {
        if (questionSource !== 'app' || totalPages <= 1) return null;

        return (
            <View style={styles.paginationContainer}>
                <TouchableOpacity
                    style={[
                        styles.paginationButton,
                        currentPage === 0 && styles.paginationButtonDisabled,
                    ]}
                    onPress={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                >
                    <Text style={styles.paginationButtonText}>Previous</Text>
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
                    <Text style={styles.paginationButtonText}>Next</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderTopicPicker = () => (
        <Modal
            visible={showTopicPicker}
            transparent
            animationType="slide"
            onRequestClose={() => onShowTopicPicker(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Topic</Text>

                    {isLoadingTopics ? (
                        <ActivityIndicator size="large" color="#007AFF"/>
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
                                {!searchTopic && (
                                    <MaterialCommunityIcons name="check" size={24} color="#007AFF"/>
                                )}
                            </TouchableOpacity>

                            {availableTopics.map((topic) => (
                                <TouchableOpacity
                                    key={topic}
                                    style={styles.topicItem}
                                    onPress={() => {
                                        onSearchTopicChange(topic);
                                        onShowTopicPicker(false);
                                    }}
                                >
                                    <Text style={styles.topicItemText}>{topic}</Text>
                                    {searchTopic === topic && (
                                        <MaterialCommunityIcons name="check" size={24} color="#007AFF"/>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => onShowTopicPicker(false)}
                    >
                        <Text style={styles.modalCloseButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            {renderSearchBar()}

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF"/>
                    <Text style={styles.loadingText}>Loading questions...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color="#F44336"/>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : questions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="text-box-search" size={64} color="#ccc"/>
                    <Text style={styles.emptyText}>
                        {questionSource === 'app'
                            ? 'No questions found. Try adjusting your search filters.'
                            : 'You haven\'t created any questions yet. Tap "Add Question" to get started!'}
                    </Text>
                </View>
            ) : (
                <>
                    <Text style={styles.resultsText}>
                        {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} found
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
        borderRadius: 8,
        gap: 8,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resultsText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        fontWeight: '600',
    },
    questionsList: {
        flex: 1,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    questionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#007AFF',
    },
    questionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        flex: 1,
        gap: 8,
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
    mediaContainer: {
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
    },
    mediaImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    mediaPlaceholder: {
        width: '100%',
        height: 150,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    mediaPlaceholderText: {
        fontSize: 14,
        fontWeight: '600',
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
        color: '#4CAF50',
        lineHeight: 24,
        fontWeight: '600',
    },
    additionalInfoContainer: {
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#FFF3E0',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    additionalInfoLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#E65100',
        marginBottom: 4,
    },
    additionalInfoText: {
        fontSize: 14,
        color: '#E65100',
    },
    sourceText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        marginTop: 8,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    deleteButtonText: {
        color: '#F44336',
        fontWeight: '600',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        gap: 12,
    },
    paginationButton: {
        flex: 1,
        padding: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        alignItems: 'center',
    },
    paginationButtonDisabled: {
        backgroundColor: '#ccc',
    },
    paginationButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    paginationText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#F44336',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    topicList: {
        maxHeight: 400,
    },
    topicItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    topicItemText: {
        fontSize: 16,
        color: '#333',
    },
    modalCloseButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    modalCloseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default QuestionList;