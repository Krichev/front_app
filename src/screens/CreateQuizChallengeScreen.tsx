import {useState} from "react";
import {
    CreateQuizChallengeRequest,
    CreateQuizQuestionRequest,
    QuizConfig
} from "../entities/QuizState/model/slice/quizApi.ts";
import {useNavigation} from "@react-navigation/native";
import {Alert, ScrollView, Text, TextInput, TouchableOpacity, View} from "react-native";
import {styles} from "../shared/ui/Modal/Modal.style";

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

    const [createQuizChallenge] = useCreateQuizChallengeMutation();
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

    const handleCreateQuiz = async () => {
        try {
            const request: CreateQuizChallengeRequest = {
                title,
                description,
                type: 'QUIZ',
                visibility: 'PUBLIC',
                frequency: 'ONE_TIME',
                quizConfig,
                userQuestions: questions.filter(q => q.question.trim() && q.answer.trim())
            };

            const result = await createQuizChallenge(request).unwrap();

            Alert.alert('Success',
                `Quiz challenge created! ${questions.length} questions saved for reuse.`);
            navigation.goBack();

        } catch (error) {
            Alert.alert('Error', 'Failed to create quiz challenge');
            console.error('Create quiz error:', error);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Create Quiz Challenge</Text>

            {/* Basic Challenge Info */}
            <TextInput
                style={styles.input}
                placeholder="Quiz Title"
                value={title}
                onChangeText={setTitle}
            />

            <TextInput
                style={styles.textArea}
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
            />

            {/* Quiz Configuration */}
            <Text style={styles.sectionTitle}>Quiz Settings</Text>
            <View style={styles.configSection}>
                <Text>Difficulty: {quizConfig.difficulty}</Text>
                <Text>Round Time: {quizConfig.roundTime}s</Text>
                <Text>Number of Rounds: {quizConfig.roundCount}</Text>
            </View>

            {/* Questions Section */}
            <Text style={styles.sectionTitle}>Custom Questions (Optional)</Text>
            <Text style={styles.subtitle}>
                Add your own questions or use app questions during gameplay
            </Text>

            {questions.map((question, index) => (
                <View key={index} style={styles.questionCard}>
                    <TextInput
                        style={styles.input}
                        placeholder="Question"
                        value={question.question}
                        onChangeText={(value) => updateQuestion(index, 'question', value)}
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
                        value={question.topic}
                        onChangeText={(value) => updateQuestion(index, 'topic', value)}
                    />
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeQuestion(index)}>
                        <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
                <Text style={styles.addButtonText}>+ Add Question</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.createButton} onPress={handleCreateQuiz}>
                <Text style={styles.createButtonText}>Create Quiz Challenge</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};