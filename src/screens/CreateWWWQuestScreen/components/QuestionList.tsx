// src/screens/CreateWWWQuestScreen/components/QuestionList.tsx
import React from 'react';
import {ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {APIDifficulty, QuestionData, QuestionSource} from '../hooks/useQuestionsManager';

interface QuestionListProps {
    questionSource: QuestionSource;
    appQuestions: QuestionData[];
    userQuestions: QuestionData[];
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
    const isLoading = questionSource === 'app' ? isLoadingApp : isLoadingUser;
    const selectedIds = questionSource === 'app' ? selectedAppQuestionIds : selectedUserQuestionIds;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>
                {questionSource === 'app' ? 'Available Questions' : 'My Questions'}
            </Text>

            {/* Search Filters - Only for app questions */}
            {questionSource === 'app' && (
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        value={searchKeyword}
                        onChangeText={onSearchKeywordChange}
                        placeholder="Search by keyword..."
                    />

                    <View style={styles.filterContainer}>
                        <Text style={styles.filterLabel}>Difficulty:</Text>
                        {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((diff) => (
                            <TouchableOpacity
                                key={diff}
                                style={[
                                    styles.filterChip,
                                    searchDifficulty === diff && styles.filterChipSelected,
                                ]}
                                onPress={() => onSearchDifficultyChange(diff as APIDifficulty | 'ALL')}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        searchDifficulty === diff && styles.filterChipTextSelected,
                                    ]}
                                >
                                    {diff}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.topicPickerContainer}>
                        <Text style={styles.filterLabel}>Topic:</Text>
                        <TouchableOpacity
                            style={styles.topicPickerButton}
                            onPress={() => onShowTopicPicker(true)}
                        >
                            <Text style={styles.topicPickerText}>
                                {searchTopic || 'Select Topic'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchActions}>
                        <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
                            <MaterialCommunityIcons name="magnify" size={20} color="#fff" />
                            <Text style={styles.searchButtonText}>Search</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.clearButton} onPress={onClearSearch}>
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Loading State */}
            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading questions...</Text>
                </View>
            )}

            {/* Error State */}
            {error && (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{error}</Text>
                </View>
            )}

            {/* Questions List */}
            {!isLoading && !error && questions.length > 0 && (
                <>
                    {questionSource === 'app' && (
                        <Text style={styles.resultsCount}>
                            Showing {questions.length} of {totalQuestions} questions
                        </Text>
                    )}

                    {questions.map((question, index) => {
                        const questionId = question.id?.toString() || '';
                        const isSelected = selectedIds.has(questionId);
                        const isAnswerVisible = visibleAnswers.has(questionId);
                        const isExpanded = expandedQuestions.has(index);

                        return (
                            <View
                                key={questionId || index}
                                style={[
                                    styles.questionCard,
                                    isSelected && styles.questionCardSelected,
                                ]}
                            >
                                <TouchableOpacity
                                    style={styles.questionHeader}
                                    onPress={() => onToggleSelection(questionId, questionSource)}
                                >
                                    <View style={styles.questionHeaderLeft}>
                                        <MaterialCommunityIcons
                                            name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                            size={24}
                                            color={isSelected ? '#007AFF' : '#999'}
                                        />
                                        <Text style={styles.questionNumber}>Q{index + 1}</Text>
                                        <View
                                            style={[
                                                styles.difficultyBadge,
                                                styles[`difficulty${question.difficulty}`],
                                            ]}
                                        >
                                            <Text style={styles.difficultyText}>
                                                {question.difficulty}
                                            </Text>
                                        </View>
                                    </View>
                                    {questionSource === 'user' && (
                                        <TouchableOpacity
                                            onPress={() => onDeleteUserQuestion(questionId)}
                                            style={styles.deleteButton}
                                        >
                                            <MaterialCommunityIcons name="delete" size={20} color="#F44336" />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>

                                <Text style={styles.questionText} numberOfLines={isExpanded ? undefined : 2}>
                                    {question.question}
                                </Text>

                                {question.topic && (
                                    <Text style={styles.topicText}>Topic: {question.topic}</Text>
                                )}

                                <View style={styles.questionActions}>
                                    <TouchableOpacity
                                        onPress={() => onToggleAnswerVisibility(questionId)}
                                        style={styles.actionButton}
                                    >
                                        <MaterialCommunityIcons
                                            name={isAnswerVisible ? 'eye-off' : 'eye'}
                                            size={20}
                                            color="#007AFF"
                                        />
                                        <Text style={styles.actionButtonText}>
                                            {isAnswerVisible ? 'Hide' : 'Show'} Answer
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => onToggleExpanded(index)}
                                        style={styles.actionButton}
                                    >
                                        <MaterialCommunityIcons
                                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                            size={20}
                                            color="#007AFF"
                                        />
                                        <Text style={styles.actionButtonText}>
                                            {isExpanded ? 'Less' : 'More'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {isAnswerVisible && (
                                    <View style={styles.answerContainer}>
                                        <Text style={styles.answerLabel}>Answer:</Text>
                                        <Text style={styles.answerText}>{question.answer}</Text>
                                    </View>
                                )}

                                {isExpanded && question.additionalInfo && (
                                    <View style={styles.additionalInfoContainer}>
                                        <Text style={styles.additionalInfoLabel}>Additional Info:</Text>
                                        <Text style={styles.additionalInfoText}>
                                            {question.additionalInfo}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}

                    {/* Pagination - Only for app questions */}
                    {questionSource === 'app' && totalPages > 1 && (
                        <View style={styles.paginationContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.paginationButton,
                                    currentPage === 0 && styles.paginationButtonDisabled,
                                ]}
                                onPress={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 0}
                            >
                                <Text style={styles.paginationButtonText}>← Previous</Text>
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
                                <Text style={styles.paginationButtonText}>Next →</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}

            {/* Empty State */}
            {!isLoading && !error && questions.length === 0 && (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="inbox" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No questions available</Text>
                    <Text style={styles.emptySubtext}>
                        {questionSource === 'app'
                            ? 'Try adjusting your search criteria'
                            : 'Create your first question to get started'}
                    </Text>
                </View>
            )}

            {/* Topic Picker Modal */}
            <Modal
                visible={showTopicPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => onShowTopicPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Topic</Text>

                        {isLoadingTopics ? (
                            <ActivityIndicator size="large" color="#007AFF" />
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
                                        style={styles.topicItem}
                                        onPress={() => {
                                            onSearchTopicChange(topic);
                                            onShowTopicPicker(false);
                                        }}
                                    >
                                        <Text style={styles.topicItemText}>{topic}</Text>
                                        {searchTopic === topic && (
                                            <MaterialCommunityIcons
                                                name="check"
                                                size={24}
                                                color="#007AFF"
                                            />
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
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f8f8f8',
        marginBottom: 12,
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginRight: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    filterChipSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    filterChipTextSelected: {
        color: '#fff',
    },
    topicPickerContainer: {
        marginBottom: 12,
    },
    topicPickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#f8f8f8',
    },
    topicPickerText: {
        fontSize: 16,
        color: '#333',
    },
    searchActions: {
        flexDirection: 'row',
        gap: 12,
    },
    searchButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 12,
        gap: 8,
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    clearButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        justifyContent: 'center',
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    resultsCount: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        textAlign: 'center',
    },
    questionCard: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    questionCardSelected: {
        backgroundColor: '#e5f1ff',
        borderColor: '#007AFF',
        borderWidth: 2,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    questionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    questionNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#666',
    },
    difficultyBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyEasy: {
        backgroundColor: '#4CAF50',
    },
    difficultyMedium: {
        backgroundColor: '#FF9800',
    },
    difficultyHard: {
        backgroundColor: '#F44336',
    },
    difficultyText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        padding: 8,
    },
    questionText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    topicText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    questionActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionButtonText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    answerContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    answerLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2E7D32',
        marginBottom: 4,
    },
    answerText: {
        fontSize: 14,
        color: '#1B5E20',
    },
    additionalInfoContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#fff3e0',
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