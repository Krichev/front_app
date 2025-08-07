// src/screens/CreateQuizChallengeScreen.tsx
import React, {useState} from "react";
import {useNavigation} from "@react-navigation/native";
import {Alert, ScrollView, Text, TextInput, TouchableOpacity, View} from "react-native";
import {styles} from "../shared/ui/Modal/Modal.style";

// FIXED: Import both interfaces from ChallengeState
import {
    CreateQuizChallengeRequest,
    useCreateQuizChallengeMutation
} from "../entities/ChallengeState/model/slice/challengeApi";

// Import from QuizState for question and config types
import {CreateQuizQuestionRequest, QuizConfig} from "../entities/QuizState/model/slice/quizApi";
import {mapQuizConfigToBackend} from "../utils/quizConfigMapper.ts";

export const CreateQuizChallengeScreen = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<CreateQuizQuestionRequest[]>([]);
    const [quizConfig, setQuizConfig] = useState<QuizConfig>({
        gameType: 'WWW',
        teamName: 'My Team',
        teamMembers: ['Player 1'],
        difficulty: 'Medium',
        roundTime: 60,
        roundCount: 10,
        enableAIHost: true
    });

    // FIXED: Now properly imported from challengeApi
    const [createQuizChallenge, {isLoading}] = useCreateQuizChallengeMutation();
    const navigation = useNavigation();

    const addQuestion = () => {
        setQuestions([...questions, {
            question: '',
            answer: '',
            difficulty: 'MEDIUM',
            topic: '',
            source: 'USER_CREATED',
            additionalInfo: ''
        }]);
    };

    const updateQuestion = (index: number, field: string, value: string) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index] = {...updatedQuestions[index], [field]: value};
        setQuestions(updatedQuestions);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a quiz title');
            return false;
        }
        if (!description.trim()) {
            Alert.alert('Error', 'Please enter a quiz description');
            return false;
        }
        return true;
    };

    const handleCreateQuiz = async () => {
        if (!validateForm()) return;

        try {
            // FIXED: Use the mapper utility to convert UI config to backend format
            const backendQuizConfig = mapQuizConfigToBackend(quizConfig);

            // FIXED: Use the correct structure matching CreateQuizChallengeRequest from backend
            const request: CreateQuizChallengeRequest = {
                title: title.trim(),
                description: description.trim(),
                visibility: 'PUBLIC',
                frequency: 'ONE_TIME',
                quizConfig: backendQuizConfig, // Now properly typed and mapped
                customQuestions: questions.filter(q => q.question.trim() && q.answer.trim()) // FIXED: Use 'customQuestions'
            };

            console.log('Creating quiz challenge with request:', request);

            const result = await createQuizChallenge(request).unwrap();

            Alert.alert(
                'Success',
                `Quiz challenge created successfully!\n${questions.filter(q => q.question.trim() && q.answer.trim()).length} custom questions added.`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );

        } catch (error: any) {
            console.error('Create quiz error:', error);

            // Better error handling
            let errorMessage = 'Failed to create quiz challenge';
            if (error?.data?.message) {
                errorMessage = error.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            Alert.alert('Error', errorMessage);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy':
                return '#4CAF50';
            case 'Medium':
                return '#FF9800';
            case 'Hard':
                return '#F44336';
            default:
                return '#757575';
        }
    };

    const updateQuizConfig = (field: keyof QuizConfig, value: any) => {
        setQuizConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
                <Text style={styles.title}>Create Quiz Challenge</Text>
                <Text style={styles.subtitle}>Create a custom quiz challenge for others to join</Text>

                {/* Basic Challenge Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Challenge Details</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Quiz Title *"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                    />

                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Description *"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        maxLength={500}
                    />
                </View>

                {/* Quiz Configuration */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quiz Settings</Text>

                    <View style={styles.configSection}>
                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>Game Type:</Text>
                            <Text style={styles.configValue}>{quizConfig.gameType}</Text>
                        </View>

                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>Difficulty:</Text>
                            <Text style={[styles.configValue, {color: getDifficultyColor(quizConfig.difficulty)}]}>
                                {quizConfig.difficulty}
                            </Text>
                        </View>

                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>Round Time:</Text>
                            <Text style={styles.configValue}>{quizConfig.roundTime}s</Text>
                        </View>

                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>Number of Rounds:</Text>
                            <Text style={styles.configValue}>{quizConfig.roundCount}</Text>
                        </View>

                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>AI Host:</Text>
                            <Text style={styles.configValue}>{quizConfig.enableAIHost ? 'Enabled' : 'Disabled'}</Text>
                        </View>
                    </View>
                </View>

                {/* Questions Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Custom Questions ({questions.length})</Text>
                    <Text style={styles.subtitle}>
                        Add your own questions or leave empty to use app questions during gameplay
                    </Text>

                    {questions.map((question, index) => (
                        <View key={index} style={styles.questionCard}>
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                                <TouchableOpacity
                                    onPress={() => removeQuestion(index)}
                                    style={styles.removeButton}
                                >
                                    <Text style={styles.removeButtonText}>×</Text>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Question"
                                value={question.question}
                                onChangeText={(value) => updateQuestion(index, 'question', value)}
                                multiline
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Answer"
                                value={question.answer}
                                onChangeText={(value) => updateQuestion(index, 'answer', value)}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Topic (optional)"
                                value={question.topic || ''}
                                onChangeText={(value) => updateQuestion(index, 'topic', value)}
                            />

                            {/* Difficulty Selection */}
                            <View style={styles.difficultyContainer}>
                                <Text style={styles.difficultyLabel}>Difficulty:</Text>
                                <View style={styles.difficultyButtons}>
                                    {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                                        <TouchableOpacity
                                            key={diff}
                                            style={[
                                                styles.difficultyButton,
                                                question.difficulty === diff && styles.selectedDifficulty
                                            ]}
                                            onPress={() => updateQuestion(index, 'difficulty', diff)}
                                        >
                                            <Text style={[
                                                styles.difficultyButtonText,
                                                question.difficulty === diff && styles.selectedDifficultyText
                                            ]}>
                                                {diff}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addQuestionButton} onPress={addQuestion}>
                        <Text style={styles.addQuestionText}>+ Add Question</Text>
                    </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.createButton, isLoading && styles.disabledButton]}
                        onPress={handleCreateQuiz}
                        disabled={isLoading}
                    >
                        <Text style={styles.createButtonText}>
                            {isLoading ? 'Creating...' : 'Create Quiz'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};