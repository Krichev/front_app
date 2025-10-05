// src/screens/CreateQuizChallengeScreen.tsx
import React, {useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {QuizConfig} from '../entities/QuizState/model/slice/quizApi';
import {
    CreateQuizChallengeRequest,
    useCreateQuizChallengeMutation
} from '../entities/ChallengeState/model/slice/challengeApi';
import {mapQuizConfigToBackend} from '../utils/quizConfigMapper';
import {QuizConfigForm} from '../components/QuizConfigForm';

interface Question {
    question: string;
    answer: string;
    topic?: string;
    additionalInfo?: string;
}

export const CreateQuizChallengeScreen = () => {
    const navigation = useNavigation();
    const [createQuizChallenge, { isLoading }] = useCreateQuizChallengeMutation();

    // Basic challenge info
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Quiz configuration with default values
    const [quizConfig, setQuizConfig] = useState<QuizConfig>({
        gameType: 'WWW',
        teamName: '',
        teamMembers: [],
        difficulty: 'Medium',
        roundTime: 60,
        roundCount: 10,
        enableAIHost: true,
        teamBased: false,
    });

    // Custom questions
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<Question>({
        question: '',
        answer: '',
        topic: '',
        additionalInfo: '',
    });

    // Validation
    const validateForm = (): boolean => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a quiz title');
            return false;
        }
        if (!description.trim()) {
            Alert.alert('Error', 'Please enter a quiz description');
            return false;
        }
        if (!quizConfig.teamName.trim()) {
            Alert.alert('Error', 'Please enter a team name');
            return false;
        }
        if (quizConfig.teamMembers.length === 0) {
            Alert.alert('Error', 'Please add at least one team member');
            return false;
        }
        return true;
    };

    // Add a custom question
    const addQuestion = () => {
        if (!currentQuestion.question.trim()) {
            Alert.alert('Error', 'Please enter a question');
            return;
        }
        if (!currentQuestion.answer.trim()) {
            Alert.alert('Error', 'Please enter an answer');
            return;
        }

        setQuestions([...questions, currentQuestion]);
        setCurrentQuestion({
            question: '',
            answer: '',
            topic: '',
            additionalInfo: '',
        });
        Alert.alert('Success', 'Question added!');
    };

    // Remove a question
    const removeQuestion = (index: number) => {
        Alert.alert(
            'Remove Question',
            'Are you sure you want to remove this question?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        setQuestions(questions.filter((_, i) => i !== index));
                    },
                },
            ]
        );
    };

    // Create the quiz challenge
    const handleCreateQuiz = async () => {
        if (!validateForm()) return;

        try {
            console.log('Starting quiz challenge creation...');
            console.log('Quiz Config:', quizConfig);

            // Map the UI quiz config to backend format
            const backendQuizConfig = mapQuizConfigToBackend(quizConfig);
            console.log('Mapped Backend Config:', backendQuizConfig);

            // Prepare custom questions for backend
            const customQuestions = questions
                .filter(q => q.question.trim() && q.answer.trim())
                .map(q => ({
                    question: q.question.trim(),
                    answer: q.answer.trim(),
                    difficulty: backendQuizConfig.defaultDifficulty,
                    topic: q.topic?.trim() || 'General',
                    additionalInfo: q.additionalInfo?.trim(),
                }));

            // Create the request
            const request: CreateQuizChallengeRequest = {
                title: title.trim(),
                description: description.trim(),
                visibility: 'PUBLIC',
                frequency: 'ONE_TIME',
                quizConfig: backendQuizConfig,
                customQuestions: customQuestions,
            };

            console.log('Final Request:', JSON.stringify(request, null, 2));

            // Send request to backend
            const result = await createQuizChallenge(request).unwrap();

            console.log('Challenge created successfully:', result);

            // Success alert
            Alert.alert(
                'Success! 🎉',
                `Quiz challenge "${title}" created successfully!\n\n` +
                `Team: ${quizConfig.teamName}\n` +
                `Members: ${quizConfig.teamMembers.join(', ')}\n` +
                `Difficulty: ${quizConfig.difficulty}\n` +
                `Questions: ${customQuestions.length} custom questions`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Error creating quiz challenge:', error);
            Alert.alert(
                'Error',
                error?.data?.message ||
                error?.message ||
                'Failed to create quiz challenge. Please try again.'
            );
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <Text style={styles.header}>Create Quiz Challenge</Text>
                <Text style={styles.subheader}>
                    Fill in the details below to create your quiz challenge
                </Text>

                {/* Basic Info Section */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Basic Information</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Challenge Title *</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g., Team Trivia Challenge"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Describe your quiz challenge..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </View>

                {/* Quiz Configuration Section */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Quiz Configuration</Text>
                    <QuizConfigForm
                        quizConfig={quizConfig}
                        onConfigChange={setQuizConfig}
                    />
                </View>

                {/* Custom Questions Section */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        Custom Questions (Optional)
                    </Text>
                    <Text style={styles.cardDescription}>
                        Add your own questions or use our question bank
                    </Text>

                    {/* Existing Questions */}
                    {questions.length > 0 && (
                        <View style={styles.questionsList}>
                            <Text style={styles.questionsCount}>
                                {questions.length} question{questions.length !== 1 ? 's' : ''} added
                            </Text>
                            {questions.map((q, index) => (
                                <View key={index} style={styles.questionItem}>
                                    <View style={styles.questionContent}>
                                        <Text style={styles.questionNumber}>Q{index + 1}</Text>
                                        <View style={styles.questionDetails}>
                                            <Text style={styles.questionText}>{q.question}</Text>
                                            <Text style={styles.answerText}>A: {q.answer}</Text>
                                            {q.topic && (
                                                <Text style={styles.topicText}>Topic: {q.topic}</Text>
                                            )}
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removeQuestion(index)}
                                        style={styles.deleteButton}
                                    >
                                        <Text style={styles.deleteButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Add New Question Form */}
                    <View style={styles.addQuestionForm}>
                        <Text style={styles.formSubtitle}>Add New Question</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Question</Text>
                            <TextInput
                                style={styles.input}
                                value={currentQuestion.question}
                                onChangeText={(text) =>
                                    setCurrentQuestion({ ...currentQuestion, question: text })
                                }
                                placeholder="Enter your question"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Answer</Text>
                            <TextInput
                                style={styles.input}
                                value={currentQuestion.answer}
                                onChangeText={(text) =>
                                    setCurrentQuestion({ ...currentQuestion, answer: text })
                                }
                                placeholder="Enter the answer"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Topic (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={currentQuestion.topic}
                                onChangeText={(text) =>
                                    setCurrentQuestion({ ...currentQuestion, topic: text })
                                }
                                placeholder="e.g., History, Science"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Additional Info (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={currentQuestion.additionalInfo}
                                onChangeText={(text) =>
                                    setCurrentQuestion({
                                        ...currentQuestion,
                                        additionalInfo: text,
                                    })
                                }
                                placeholder="Extra context or hints"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={addQuestion}
                            style={styles.addQuestionButton}
                        >
                            <Text style={styles.addQuestionButtonText}>Add Question</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Create Button */}
                <TouchableOpacity
                    onPress={handleCreateQuiz}
                    style={[styles.createButton, isLoading && styles.createButtonDisabled]}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.createButtonText}>Create Quiz Challenge</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.spacer} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
    },
    header: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    subheader: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    questionsList: {
        marginBottom: 16,
    },
    questionsCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4CAF50',
        marginBottom: 12,
    },
    questionItem: {
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    questionContent: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    questionNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2196F3',
        marginRight: 12,
    },
    questionDetails: {
        flex: 1,
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    answerText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    topicText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    deleteButton: {
        backgroundColor: '#ff4444',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    addQuestionForm: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 16,
    },
    formSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    addQuestionButton: {
        backgroundColor: '#4CAF50',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    addQuestionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    createButton: {
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    createButtonDisabled: {
        backgroundColor: '#ccc',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    spacer: {
        height: 40,
    },
});