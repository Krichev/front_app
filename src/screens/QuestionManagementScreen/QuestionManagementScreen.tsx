import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Text,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuestionSearch } from './hooks/useQuestionSearch';
import { useQuestionSelection } from './hooks/useQuestionSelection';
import { QuestionSearchBar } from './components/QuestionSearchBar';
import { RecentSearchChips } from './components/RecentSearchChips';
import { DifficultyFilterBar } from './components/DifficultyFilterBar';
import { QuestionListItem } from './components/QuestionListItem';
import { SelectionActionBar } from './components/SelectionActionBar';
import { themeStyles as styles } from './styles';

type RootStackParamList = {
    QuestionManagement: undefined;
    CreateWWWQuest: undefined;
};

type QuestionManagementNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'QuestionManagement'
>;

const QuestionManagementScreen: React.FC = () => {
    const navigation = useNavigation<QuestionManagementNavigationProp>();

    const {
        questions,
        setQuestions,
        isLoading,
        searchQuery,
        setSearchQuery,
        difficulty,
        recentSearches,
        noResults,
        setNoResults,
        searchQuestions,
        loadRandomQuestions,
        handleDifficultyChange,
    } = useQuestionSearch();

    const {
        selectedQuestionsArray,
        toggleSelection,
        clearSelection,
        isSelected,
        selectedCount,
        updateQuestionDifficulty,
    } = useQuestionSelection(questions, setQuestions);

    useEffect(() => {
        if (noResults) {
            Alert.alert(
                'No Results',
                'No questions found matching your criteria. Try a different search term or difficulty.',
                [
                    { text: 'OK', onPress: () => setNoResults(false) },
                    { 
                        text: 'Load Random Questions', 
                        onPress: () => {
                            setNoResults(false);
                            loadRandomQuestions();
                        } 
                    }
                ]
            );
        }
    }, [noResults, loadRandomQuestions, setNoResults]);

    const handleUseSelected = () => {
        if (selectedCount === 0) {
            Alert.alert('No Questions Selected', 'Please select at least one question to continue.');
            return;
        }
        // In a real implementation, you might pass selectedQuestionsArray as params or through Redux
        // But the original code said: navigation.navigate('CreateWWWQuest');
        // If it was supposed to pass params, it would be:
        // navigation.navigate('CreateWWWQuest', { selectedQuestions: selectedQuestionsArray });
        navigation.navigate('CreateWWWQuest');
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
                        Selected: {selectedCount} questions
                    </Text>
                </View>

                <QuestionSearchBar 
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    onSearch={() => searchQuestions()}
                />

                <RecentSearchChips 
                    recentSearches={recentSearches}
                    onChipPress={(search) => {
                        setSearchQuery(search);
                        searchQuestions(search);
                    }}
                />

                <DifficultyFilterBar 
                    selectedDifficulty={difficulty}
                    onDifficultyChange={handleDifficultyChange}
                />

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={styles.header.backgroundColor as string} />
                        <Text style={styles.loadingText}>Loading questions...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={questions}
                        renderItem={({ item }) => (
                            <QuestionListItem 
                                question={item}
                                isSelected={isSelected(item.id)}
                                onToggleSelect={() => toggleSelection(item)}
                                onDifficultyChange={(newDiff) => updateQuestionDifficulty(item.id, newDiff)}
                            />
                        )}
                        keyExtractor={item => item.id.toString()}
                        style={styles.questionsList}
                        contentContainerStyle={styles.questionsContainer}
                        keyboardShouldPersistTaps="handled"
                    />
                )}

                <SelectionActionBar 
                    selectedCount={selectedCount}
                    onUseSelected={handleUseSelected}
                    onClearSelection={clearSelection}
                    isDisabled={selectedCount === 0}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default QuestionManagementScreen;
