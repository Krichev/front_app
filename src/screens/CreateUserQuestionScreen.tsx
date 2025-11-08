// src/screens/CreateUserQuestionScreen.tsx
import React, {useState} from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {APIDifficulty, QuestionService, UserQuestion} from '../services/wwwGame/questionService';

type RootStackParamList = {
    UserQuestions: undefined;
    CreateUserQuestion: undefined;
    EditUserQuestion: { question: UserQuestion };
};

type CreateQuestionRouteProp = RouteProp<RootStackParamList, 'CreateUserQuestion' | 'EditUserQuestion'>;
type CreateQuestionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateUserQuestion' | 'EditUserQuestion'>;

const CreateUserQuestionScreen: React.FC = () => {
    const route = useRoute<CreateQuestionRouteProp>();
    const navigation = useNavigation<CreateQuestionNavigationProp>();

    // Check if we're editing an existing question
    const isEditing = route.name === 'EditUserQuestion';
    const existingQuestion = isEditing ? route.params?.question : undefined;

    // Form state
    const [question, setQuestion] = useState<string>(existingQuestion?.question || '');
    const [answer, setAnswer] = useState<string>(existingQuestion?.answer || '');
    const [difficulty, setDifficulty] = useState<APIDifficulty>(
        existingQuestion?.difficulty || 'MEDIUM'
    );
    const [topic, setTopic] = useState<string>(existingQuestion?.topic || '');
    const [additionalInfo, setAdditionalInfo] = useState<string>(
        existingQuestion?.additionalInfo || ''
    );

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async () => {
        // Validate inputs
        if (!question.trim()) {
            Alert.alert('Error', 'Please enter a question');
            return;
        }

        if (!answer.trim()) {
            Alert.alert('Error', 'Please enter an answer');
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditing && existingQuestion) {
                // Update existing question
                await QuestionService.updateUserQuestion({
                    ...existingQuestion,
                    question,
                    answer,
                    difficulty,
                    topic: topic || undefined,
                    additionalInfo: additionalInfo || undefined,
                });

                Alert.alert('Success', 'Question updated successfully');
            } else {
                // Create new question
                await QuestionService.saveUserQuestion({
                    question,
                    answer,
                    difficulty,
                    topic: topic || undefined,
                    additionalInfo: additionalInfo || undefined,
                });

                Alert.alert('Success', 'Question created successfully');
            }

            // Navigate back to the questions list
            navigation.navigate('UserQuestions');
        } catch (error) {
            console.error('Error saving question:', error);
            Alert.alert('Error', 'Failed to save question. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView style={styles.scrollView}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            {isEditing ? 'Edit Question' : 'Create New Question'}
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        {/* Question field */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Question *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={question}
                                onChangeText={setQuestion}
                                placeholder="Enter your question"
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Answer field */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Answer *</Text>
                            <TextInput
                                style={styles.input}
                                value={answer}
                                onChangeText={setAnswer}
                                placeholder="Enter the answer"
                            />
                        </View>

                        {/* Difficulty selection */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Difficulty</Text>
                            <View style={styles.difficultyContainer}>
                                {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                                    <TouchableOpacity
                                        key={diff}
                                        style={[
                                            styles.difficultyButton,
                                            difficulty === diff && styles.selectedDifficulty,
                                        ]}
                                        onPress={() => setDifficulty(diff)}
                                    >
                                        <Text
                                            style={[
                                                styles.difficultyText,
                                                difficulty === diff && styles.selectedDifficultyText,
                                            ]}
                                        >
                                            {diff}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Topic field */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Topic (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={topic}
                                onChangeText={setTopic}
                                placeholder="E.g., History, Science, Geography"
                            />
                        </View>

                        {/* Additional Info field */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Additional Info (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={additionalInfo}
                                onChangeText={setAdditionalInfo}
                                placeholder="Add any extra information about this question"
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Submit button */}
                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.submitButtonText}>
                                {isSubmitting
                                    ? 'Saving...'
                                    : isEditing
                                        ? 'Update Question'
                                        : 'Create Question'
                                }
                            </Text>
                        </TouchableOpacity>

                        {/* Cancel button */}
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => navigation.goBack()}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: '#4CAF50',
        padding: 16,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    formContainer: {
        padding: 16,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#555',
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    difficultyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    difficultyButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        marginHorizontal: 4,
        borderRadius: 8,
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
    submitButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#555',
        fontSize: 16,
    },
    disabledButton: {
        backgroundColor: '#A5D6A7',
        opacity: 0.7,
    },
});

export default CreateUserQuestionScreen;