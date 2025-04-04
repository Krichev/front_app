// src/screens/QuestionManagementScreen.tsx
import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {QuestionData, QuestionService} from '../services/wwwGame/questionService';
import {ScrollView} from 'react-native-gesture-handler';

// Define navigation types
type RootStackParamList = {
    QuestionManagement: undefined;
    WWWGameSetup: { selectedQuestions?: QuestionData[] };
};

type QuestionManagementNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'QuestionManagement'
>;

const QuestionManagementScreen: React.FC = () => {
    const navigation = useNavigation<QuestionManagementNavigationProp>();

    // State variables
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<QuestionData[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'All'>('All');
    const [theme, setTheme] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Load questions when component mounts
    useEffect(() => {
        loadRandomQuestions();

        // Load recent searches from storage (implementation placeholder)
        const loadRecentSearches = async () => {
            // In a real app, load from AsyncStorage or similar
            setRecentSearches(['History', 'Science', 'Literature', 'Geography', 'Sports']);
        };

        loadRecentSearches();
    }, []);

    // Load random questions
    const loadRandomQuestions = async () => {
        setLoading(true);
        try {
            const randomQuestions = await QuestionService.fetchRandomQuestions(20);
            setQuestions(randomQuestions);
        } catch (error) {
            console.error('Error loading random questions:', error);
            Alert.alert('Error', 'Failed to load questions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Search questions by keyword/theme
    const searchQuestions = async () => {
        if (!searchQuery && !theme) {
            Alert.alert('Error', 'Please enter a search term or select a theme');
            return;
        }

        setLoading(true);

        try {
            const query = searchQuery || theme;

            // Add to recent searches if not already there
            if (!recentSearches.includes(query)) {
                const updatedSearches = [query, ...recentSearches.slice(0, 4)];
                setRecentSearches(updatedSearches);
                // In a real app, save to AsyncStorage
            }

            let difficultyFilter: 'Easy' | 'Medium' | 'Hard' | undefined =
                difficulty === 'All' ? undefined : difficulty;

            const searchResults = await QuestionService.searchQuestions(
                query,
                20,
                difficultyFilter
            );

            if (searchResults.length === 0) {
                Alert.alert(
                    'No Results',
                    'No questions found matching your criteria. Try a different search term or difficulty.',
                    [
                        { text: 'OK' },
                        { text: 'Load Random Questions', onPress: loadRandomQuestions }
                    ]
                );
            } else {
                setQuestions(searchResults);
            }
        } catch (error) {
            console.error('Error searching questions:', error);
            Alert.alert('Error', 'Failed to search questions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load questions by difficulty
    const loadQuestionsByDifficulty = async (diff: 'Easy' | 'Medium' | 'Hard') => {
        setLoading(true);

        try {
            const difficultyQuestions = await QuestionService.getQuestionsByDifficulty(diff, 20);
            setQuestions(difficultyQuestions);
            setDifficulty(diff);
        } catch (error) {
            console.error('Error loading questions by difficulty:', error);
            Alert.alert('Error', 'Failed to load questions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Toggle question selection
    const toggleQuestionSelection = (question: QuestionData) => {
        const isSelected = selectedQuestions.some(q => q.id === question.id);

        if (isSelected) {
            setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id));
        } else {
            // Limit to 15 questions
            if (selectedQuestions.length >= 15) {
                Alert.alert('Selection Limit', 'You can select up to 15 questions for a game.');
                return;
            }

            setSelectedQuestions([...selectedQuestions, question]);
        }
    };

    // Continue to game setup with selected questions
    const continueToGameSetup = () => {
        if (selectedQuestions.length === 0) {
            Alert.alert('No Questions Selected', 'Please select at least one question to continue.');
            return;
        }

        navigation.navigate('WWWGameSetup', {
            selectedQuestions
        });
    };

    // Render each question item
    const renderQuestionItem = ({ item }: { item: QuestionData }) => {
        const isSelected = selectedQuestions.some(q => q.id === item.id);

        return (
            <TouchableOpacity
                style={[styles.questionItem, isSelected && styles.selectedItem]}
                onPress={() => toggleQuestionSelection(item)}
                onLongPress={() => showQuestionDetails(item)}
            >
                <View style={styles.questionHeader}>
                    <Text style={styles.questionDifficulty}>{item.difficulty || 'Medium'}</Text>
                    {item.topic && <Text style={styles.questionTopic}>{item.topic}</Text>}
                </View>

                <Text style={styles.questionText} numberOfLines={3}>{item.question}</Text>

                <View style={styles.questionFooter}>
                    <Text style={styles.answerPreview}>
                        Answer: {isSelected ? item.answer : item.answer.slice(0, 5) + '...'}
                    </Text>

                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => toggleQuestionSelection(item)}
                    >
                        <Text style={styles.selectButtonText}>
                            {isSelected ? 'Deselect' : 'Select'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    // Show detailed question information
    const showQuestionDetails = (question: QuestionData) => {
        Alert.alert(
            'Question Details',
            `Q: ${question.question}\n\nA: ${question.answer}${question.additionalInfo ? `\n\nAdditional Info: ${question.additionalInfo}` : ''}${question.source ? `\n\nSource: ${question.source}` : ''}`,
            [
                { text: 'Close' },
                { text: question.difficulty || 'Set Difficulty', onPress: () => showDifficultySelection(question) }
            ]
        );
    };

    // Show difficulty selection dialog
    const showDifficultySelection = (question: QuestionData) => {
        Alert.alert(
            'Set Difficulty',
            'Choose difficulty level for this question:',
            [
                { text: 'Easy', onPress: () => updateQuestionDifficulty(question, 'Easy') },
                { text: 'Medium', onPress: () => updateQuestionDifficulty(question, 'Medium') },
                { text: 'Hard', onPress: () => updateQuestionDifficulty(question, 'Hard') },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    // Update question difficulty
    const updateQuestionDifficulty = (question: QuestionData, newDifficulty: 'Easy' | 'Medium' | 'Hard') => {
        // Update in questions list
        const updatedQuestions = questions.map(q =>
            q.id === question.id ? { ...q, difficulty: newDifficulty } : q
        );
        setQuestions(updatedQuestions);

        // Update in selected questions list if present
        if (selectedQuestions.some(q => q.id === question.id)) {
            const updatedSelected = selectedQuestions.map(q =>
                q.id === question.id ? { ...q, difficulty: newDifficulty } : q
            );
            setSelectedQuestions(updatedSelected);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidContainer}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Question Manager</Text>
                    <Text style={styles.headerSubtitle}>
                        Selected: {selectedQuestions.length} questions
                    </Text>
                </View>

                {/* Search Section */}
                <View style={styles.searchSection}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search questions by keyword..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={searchQuestions}
                    />

                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={searchQuestions}
                    >
                        <Text style={styles.buttonText}>Search</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Searches */}
                <View style={styles.recentSearches}>
                    <Text style={styles.sectionLabel}>Recent Searches:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {recentSearches.map((search, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.recentSearchItem}
                                onPress={() => {
                                    setSearchQuery(search);
                                    setTheme(search);
                                    searchQuestions();
                                }}
                            >
                                <Text style={styles.recentSearchText}>{search}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Difficulty Filter */}
                <View style={styles.difficultyFilter}>
                    <Text style={styles.sectionLabel}>Filter by Difficulty:</Text>
                    <View style={styles.difficultyButtons}>
                        {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                            <TouchableOpacity
                                key={diff}
                                style={[
                                    styles.difficultyButton,
                                    difficulty === diff && styles.selectedDifficulty
                                ]}
                                onPress={() => {
                                    setDifficulty(diff);
                                    if (diff !== 'All') {
                                        loadQuestionsByDifficulty(diff);
                                    }
                                }}
                            >
                                <Text
                                    style={[
                                        styles.difficultyText,
                                        difficulty === diff && styles.selectedDifficultyText
                                    ]}
                                >
                                    {diff}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Questions List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingText}>Loading questions...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={questions}
                        renderItem={renderQuestionItem}
                        keyExtractor={item => item.id}
                        style={styles.questionsList}
                        contentContainerStyle={styles.questionsContainer}
                    />
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={loadRandomQuestions}
                    >
                        <Text style={styles.secondaryButtonText}>Load Random</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            selectedQuestions.length === 0 && styles.disabledButton
                        ]}
                        onPress={continueToGameSetup}
                        disabled={selectedQuestions.length === 0}
                    >
                        <Text style={styles.buttonText}>Continue to Game Setup</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardAvoidContainer: {
        flex: 1,
    },
    header: {
        backgroundColor: '#4CAF50',
        padding: 16,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    searchSection: {
        padding: 16,
        flexDirection: 'row',
    },
    searchInput: {
        flex: 1,
        height: 44,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchButton: {
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginLeft: 8,
        borderRadius: 8,
    },
    recentSearches: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 8,
    },
    recentSearchItem: {
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    recentSearchText: {
        fontSize: 14,
        color: '#333',
    },
    difficultyFilter: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    difficultyButtons: {
        flexDirection: 'row',
    },
    difficultyButton: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
    },
    selectedDifficulty: {
        backgroundColor: '#4CAF50',
    },
    difficultyText: {
        fontSize: 14,
        color: '#555',
    },
    selectedDifficultyText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#555',
    },
    questionsList: {
        flex: 1,
    },
    questionsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    questionItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectedItem: {
        borderColor: '#4CAF50',
        borderWidth: 2,
        backgroundColor: '#f0fff0',
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    questionDifficulty: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#555',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    questionTopic: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
    questionText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
    },
    questionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    answerPreview: {
        fontSize: 14,
        color: '#555',
        fontStyle: 'italic',
    },
    selectButton: {
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    selectButtonText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        backgroundColor: 'white',
    },
    primaryButton: {
        flex: 2,
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginRight: 12,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default QuestionManagementScreen;