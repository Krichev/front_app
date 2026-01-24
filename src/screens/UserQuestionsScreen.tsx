// src/screens/UserQuestionsScreen.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {QuestionService, UserQuestion} from '../services/wwwGame/questionService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type RootStackParamList = {
    UserQuestions: undefined;
    CreateUserQuestion: undefined;
    CreateAudioQuestion: undefined;
    EditUserQuestion: { question: UserQuestion };
    CreateWWWQuest: undefined;
};

type UserQuestionsNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'UserQuestions'
>;

const UserQuestionsScreen: React.FC = () => {
    const navigation = useNavigation<UserQuestionsNavigationProp>();
    const [questions, setQuestions] = useState<UserQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuestions, setSelectedQuestions] = useState<UserQuestion[]>([]);

    const loadUserQuestions = useCallback(async () => {
        setLoading(true);
        try {
            const userQuestions = await QuestionService.getUserQuestions();
            setQuestions(userQuestions);
        } catch (error) {
            console.error('Error loading user questions:', error);
            Alert.alert('Error', 'Failed to load your questions');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadUserQuestions();
        }, [loadUserQuestions])
    );

    const handleDeleteQuestion = async (id: number) => {
        Alert.alert(
            'Delete Question',
            'Are you sure you want to delete this question?',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await QuestionService.deleteUserQuestion(id);
                            // Remove from selected questions if it was selected
                            setSelectedQuestions(prev => prev.filter(q => q.id !== id));
                            // Refresh the list
                            loadUserQuestions();
                        } catch (error) {
                            console.error('Error deleting question:', error);
                            Alert.alert('Error', 'Failed to delete question');
                        }
                    }
                }
            ]
        );
    };

    const toggleQuestionSelection = (question: UserQuestion) => {
        const isSelected = selectedQuestions.some(q => q.id === question.id);

        if (isSelected) {
            setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
        } else {
            setSelectedQuestions(prev => [...prev, question]);
        }
    };

    const handleCreateQuestion = () => {
        navigation.navigate('CreateUserQuestion');
    };

    const handleCreateAudioQuestion = () => {
        navigation.navigate('CreateAudioQuestion');
    };

    const handleEditQuestion = (question: UserQuestion) => {
        navigation.navigate('EditUserQuestion', {question});
    };

    const handleUseSelected = () => {
        if (selectedQuestions.length === 0) {
            Alert.alert('No Questions Selected', 'Please select at least one question');
            return;
        }

        // Navigate to CreateWWWQuest instead of WWWGameSetup
        // Note: passing selectedQuestions might need to be handled via a global state or context if CreateWWWQuest doesn't support params
        navigation.navigate('CreateWWWQuest');
    };

    const renderQuestionItem = ({item}: { item: UserQuestion }) => {
        const isSelected = selectedQuestions.some(q => q.id === item.id);

        return (
            <TouchableOpacity
                style={[styles.questionItem, isSelected && styles.selectedItem]}
                onPress={() => toggleQuestionSelection(item)}
            >
                <View style={styles.questionHeader}>
                    <Text style={styles.difficultyBadge}>{item.difficulty || 'Medium'}</Text>
                    <TouchableOpacity
                        onPress={() => handleEditQuestion(item)}
                        style={styles.editButton}
                    >
                        <MaterialCommunityIcons name="pencil" size={20} color="#555"/>
                    </TouchableOpacity>
                </View>

                <Text style={styles.questionText}>{item.question}</Text>

                <View style={styles.answerContainer}>
                    <Text style={styles.answerLabel}>Answer:</Text>
                    <Text style={styles.answerText}>{item.answer}</Text>
                </View>

                <View style={styles.questionFooter}>
                    <Text style={styles.dateText}>
                        Created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => handleDeleteQuestion(item.id)}
                        style={styles.deleteButton}
                    >
                        <MaterialCommunityIcons name="delete" size={20} color="#F44336"/>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Questions</Text>
                <Text style={styles.headerSubtitle}>
                    Selected: {selectedQuestions.length} questions
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50"/>
                    <Text style={styles.loadingText}>Loading your questions...</Text>
                </View>
            ) : questions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="help-circle-outline" size={60} color="#e0e0e0"/>
                    <Text style={styles.emptyText}>
                        You haven't created any questions yet
                    </Text>
                    <View style={styles.emptyButtonContainer}>
                        <TouchableOpacity
                            style={styles.createFirstButton}
                            onPress={handleCreateQuestion}
                        >
                            <Text style={styles.createButtonText}>Create Standard Question</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.createFirstButton, {backgroundColor: '#2196F3', marginTop: 12}]}
                            onPress={handleCreateAudioQuestion}
                        >
                            <Text style={styles.createButtonText}>Create Audio Question</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <FlatList
                    data={questions}
                    renderItem={renderQuestionItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                />
            )}

            <View style={styles.buttonContainer}>
                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                        style={[styles.createButton, {flex: 1, marginRight: 8}]}
                        onPress={handleCreateQuestion}
                    >
                        <MaterialCommunityIcons name="plus" size={20} color="white"/>
                        <Text style={styles.buttonText}>Standard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.createButton, {flex: 1, backgroundColor: '#2196F3'}]}
                        onPress={handleCreateAudioQuestion}
                    >
                        <MaterialCommunityIcons name="microphone" size={20} color="white"/>
                        <Text style={styles.buttonText}>Audio</Text>
                    </TouchableOpacity>
                </View>

                {questions.length > 0 && (
                    <TouchableOpacity
                        style={[
                            styles.useButton,
                            selectedQuestions.length === 0 && styles.disabledButton
                        ]}
                        onPress={handleUseSelected}
                        disabled={selectedQuestions.length === 0}
                    >
                        <MaterialCommunityIcons name="check" size={20} color="white"/>
                        <Text style={styles.buttonText}>Use Selected Questions</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    emptyButtonContainer: {
        width: '100%',
        alignItems: 'center',
    },
    createFirstButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        width: '80%',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
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
    difficultyBadge: {
        fontSize: 12,
        color: 'white',
        backgroundColor: '#9C27B0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
    },
    editButton: {
        padding: 4,
    },
    questionText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
    },
    answerContainer: {
        backgroundColor: '#f9f9f9',
        padding: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    answerLabel: {
        fontSize: 12,
        color: '#757575',
    },
    answerText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    questionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    dateText: {
        fontSize: 12,
        color: '#999',
    },
    deleteButton: {
        padding: 4,
    },
    buttonContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        backgroundColor: 'white',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    createButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    useButton: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    disabledButton: {
        backgroundColor: '#BDBDBD',
    },
});

export default UserQuestionsScreen;