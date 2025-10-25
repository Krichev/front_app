// src/screens/CreateWWWQuestScreen.tsx

import React, {useEffect, useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Picker} from '@react-native-picker/picker';
import {CreateChallengeRequest, useCreateChallengeMutation} from '../entities/ChallengeState/model/slice/challengeApi';
import {
    getVisibilityDescription,
    getVisibilityIcon,
    getVisibilityLabel,
    QuestionVisibility,
    QuizConfig,
    StartQuizSessionRequest,
    useCreateUserQuestionMutation,
    useDeleteUserQuestionMutation,
    useGetUserQuestionsQuery,
    useStartQuizSessionMutation,
} from '../entities/QuizState/model/slice/quizApi';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {APIDifficulty, QuestionData, QuestionService} from '../services/wwwGame/questionService';
import {CreateQuestionWithMedia, QuestionFormData} from './components/CreateQuestionWithMedia';


export type QuestionType = 'text' | 'audio' | 'video';

interface MediaQuestionData {
    id?: string;
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
    questionType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
    mediaFileId?: number;
    questionMediaUrl?: string;
    questionMediaType?: string;
}

interface MultimediaQuestionData {
    id?: string;
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
    questionType: QuestionType;
}

interface CustomQuestion {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
}

type RootStackParamList = {
    Main: { screen?: string; params?: any };
    WWWGamePlay: {
        sessionId?: string;
        challengeId?: string;
    };
};

type CreateWWWQuestScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateWWWQuestScreen: React.FC = () => {
    const navigation = useNavigation<CreateWWWQuestScreenNavigationProp>();
    const {user} = useSelector((state: RootState) => state.auth);


    const [mediaQuestions, setMediaQuestions] = useState<MediaQuestionData[]>([]);
    // Add this state variable in your component
    const [showMediaQuestionModal, setShowMediaQuestionModal] = useState(false);
    // API hooks
    const [createChallenge, {isLoading: isCreatingChallenge}] = useCreateChallengeMutation();
    const [startQuizSession, {isLoading: isStartingSession}] = useStartQuizSessionMutation();

    // NEW: Question creation and deletion hooks
    const [createQuestion, {isLoading: isCreatingQuestion}] = useCreateUserQuestionMutation();
    const [deleteQuestion] = useDeleteUserQuestionMutation();

    // Basic Info
    const [title, setTitle] = useState('Quiz Challenge');
    const [description, setDescription] = useState('Test your knowledge in this team-based quiz game.');
    const [reward, setReward] = useState('Points and bragging rights!');

    // Quiz Configuration
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
    const [teamMemberInput, setTeamMemberInput] = useState('');

    // Custom Questions (for user-created questions)
    const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
    const [currentCustomQuestion, setCurrentCustomQuestion] = useState<CustomQuestion>({
        question: '',
        answer: '',
        difficulty: 'MEDIUM',
        topic: '',
        additionalInfo: '',
    });

    // Question Source (only 'app' or 'user')
    const [questionSource, setQuestionSource] = useState<'app' | 'user'>('app');

    // NEW: Add Question Modal State
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [newQuestion, setNewQuestion] = useState({
        question: '',
        answer: '',
        difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
        topic: '',
        additionalInfo: '',
        visibility: QuestionVisibility.PRIVATE,
    });

    // User questions query
    const {
        data: userQuestions = [],
        isLoading: isLoadingUserQuestions,
        refetch: refetchUserQuestions
    } = useGetUserQuestionsQuery(undefined, {
        skip: questionSource !== 'user'
    });

    // App questions state
    const [appQuestions, setAppQuestions] = useState<QuestionData[]>([]);
    const [isLoadingAppQuestions, setIsLoadingAppQuestions] = useState(false);
    const [appQuestionsError, setAppQuestionsError] = useState<string | null>(null);

    // Search filters
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchDifficulty, setSearchDifficulty] = useState<APIDifficulty | 'ALL'>('ALL');
    const [searchTopic, setSearchTopic] = useState('');
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);
    const [showTopicPicker, setShowTopicPicker] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);

    // Selection (for app and saved user questions)
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

    // Preview state
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
    const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
    const [previewPage, setPreviewPage] = useState(1);
    const questionsPerPreviewPage = 5;

    const [visibleAnswers, setVisibleAnswers] = useState<Set<string>>(new Set());

    const [selectedAppQuestionIds, setSelectedAppQuestionIds] = useState<Set<string>>(new Set());
    const [selectedUserQuestionIds, setSelectedUserQuestionIds] = useState<Set<string>>(new Set());
    const [newCustomQuestions, setNewCustomQuestions] = useState<MultimediaQuestionData[]>([]);

    // Transform QuizQuestion to QuestionData format
    const transformedUserQuestions = useMemo(() => {
        return (userQuestions ?? []).map(uq => ({
            id: uq.id?.toString() ?? '',
            question: uq.question ?? '',
            answer: uq.answer ?? '',
            difficulty: uq.difficulty === 'EASY' ? 'Easy' as const :
                uq.difficulty === 'MEDIUM' ? 'Medium' as const :
                    uq.difficulty === 'HARD' ? 'Hard' as const : 'Medium' as const,
            topic: uq.topic ?? '',
            additionalInfo: uq.additionalInfo ?? '',
            visibility: uq.visibility, // NEW: Include visibility
        }));
    }, [userQuestions]);

    const toggleAnswerVisibility = (questionId: string) => {
        setVisibleAnswers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const selectedQuestionsArray = useMemo(() => {
        const selectedAppQuestions = (appQuestions ?? []).filter(q =>
            selectedAppQuestionIds.has(q?.id?.toString() ?? '')
        ).map(q => ({...q, source: 'app' as const}));

        const selectedUserQuestionsData = transformedUserQuestions.filter(uq =>
            selectedUserQuestionIds.has(uq.id)
        ).map(uq => ({
            ...uq,
            difficulty: uq.difficulty === 'Easy' ? 'EASY' as const :
                uq.difficulty === 'Medium' ? 'MEDIUM' as const :
                    'HARD' as const,
            source: 'user' as const
        }));

        const newCustomQuestionsData = newCustomQuestions.map((q, idx) => ({
            ...q,
            id: `new-custom-${idx}`,
            source: 'custom' as const
        }));

        return [...selectedAppQuestions, ...selectedUserQuestionsData, ...newCustomQuestionsData];
    }, [selectedAppQuestionIds, selectedUserQuestionIds, newCustomQuestions, appQuestions, transformedUserQuestions]);

    const handleMediaQuestionSubmit = async (questionData: QuestionFormData) => {
        try {
            // Create the question with media using the API
            const questionRequest = {
                question: questionData.question,
                answer: questionData.answer,
                difficulty: questionData.difficulty,
                topic: questionData.topic,
                additionalInfo: questionData.additionalInfo,
                questionType: questionData.questionType,
                mediaFileId: questionData.media?.mediaId ? Number(questionData.media.mediaId) : undefined,
                questionMediaUrl: questionData.media?.mediaUrl,
                questionMediaId: questionData.media?.mediaId,
                questionMediaType: questionData.media?.mediaType,
            };

            // Call your API to save the question
            // You'll need to import your quiz API mutations
            // const result = await createUserQuestionMutation(questionRequest).unwrap();

            // For now, add to local state
            const newQuestion: MultimediaQuestionData = {
                id: `temp_${Date.now()}`,
                question: questionData.question,
                answer: questionData.answer,
                difficulty: questionData.difficulty,
                topic: questionData.topic,
                additionalInfo: questionData.additionalInfo,
                questionType: questionData.questionType === 'TEXT' ? 'text' :
                    questionData.questionType === 'IMAGE' ? 'text' :
                        questionData.questionType === 'VIDEO' ? 'video' : 'audio',
            };

            setNewCustomQuestions(prev => [...prev, newQuestion]);
            setShowMediaQuestionModal(false);
            Alert.alert('Success', 'Question with media added successfully!');
        } catch (error) {
            console.error('Error creating question with media:', error);
            Alert.alert('Error', 'Failed to create question. Please try again.');
        }
    };


    const totalSelectedQuestions = selectedQuestionsArray.length;
    const previewTotalPages = Math.ceil(totalSelectedQuestions / questionsPerPreviewPage);
    const previewStartIndex = (previewPage - 1) * questionsPerPreviewPage;
    const previewEndIndex = Math.min(previewStartIndex + questionsPerPreviewPage, totalSelectedQuestions);
    const previewQuestions = selectedQuestionsArray.slice(previewStartIndex, previewEndIndex);

    useEffect(() => {
        if (questionSource === 'app') {
            fetchAvailableTopics();
            searchAppQuestions();
        }
    }, [questionSource]);

    const fetchAvailableTopics = async () => {
        try {
            const topics = await QuestionService.getAvailableTopics();
            setAvailableTopics(topics);
        } catch (error) {
            console.error('Error fetching topics:', error);
        }
    };

    const searchAppQuestions = async () => {
        setIsLoadingAppQuestions(true);
        setAppQuestionsError(null);
        try {
            const response = await QuestionService.advancedSearchQuestions({
                keyword: searchKeyword || undefined,
                difficulty: searchDifficulty === 'ALL' ? undefined : searchDifficulty,
                topic: searchTopic || undefined,
                page: currentPage,
                size: 20
            });

            if (response.content && response.content.length > 0) {
                setAppQuestions(response.content);
                setTotalPages(response.totalPages);
                setTotalQuestions(response.totalElements);
            } else {
                setAppQuestions([]);
                setTotalPages(0);
                setTotalQuestions(0);
                setAppQuestionsError('No questions found. Try different search criteria.');
            }
        } catch (error: any) {
            console.error('Error searching questions:', error);
            setAppQuestionsError(error.message || 'Failed to search questions. Please try again.');
            setAppQuestions([]);
            setTotalPages(0);
            setTotalQuestions(0);
        } finally {
            setIsLoadingAppQuestions(false);
        }
    };

    const addTeamMember = () => {
        if (teamMemberInput.trim()) {
            setQuizConfig({
                ...quizConfig,
                teamMembers: [...quizConfig.teamMembers, teamMemberInput.trim()]
            });
            setTeamMemberInput('');
        }
    };

    const removeTeamMember = (index: number) => {
        setQuizConfig({
            ...quizConfig,
            teamMembers: quizConfig.teamMembers.filter((_, i) => i !== index)
        });
    };

    // NEW: Handle Add Question
    const handleAddQuestion = async () => {
        if (!newQuestion.question.trim()) {
            Alert.alert('Error', 'Please enter a question');
            return;
        }
        if (!newQuestion.answer.trim()) {
            Alert.alert('Error', 'Please enter an answer');
            return;
        }

        try {
            await createQuestion(newQuestion).unwrap();
            Alert.alert('Success', 'Question added successfully!');
            setShowAddQuestionModal(false);
            resetNewQuestion();
            refetchUserQuestions();
        } catch (error: any) {
            Alert.alert('Error', error?.data?.message || 'Failed to create question');
        }
    };

    // NEW: Reset new question form
    const resetNewQuestion = () => {
        setNewQuestion({
            question: '',
            answer: '',
            difficulty: 'MEDIUM',
            topic: '',
            additionalInfo: '',
            visibility: QuestionVisibility.PRIVATE,
        });
    };

    // NEW: Handle Delete Question
    const handleDeleteUserQuestion = (questionId: string) => {
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
                            await deleteQuestion(questionId).unwrap();
                            Alert.alert('Success', 'Question deleted');
                            refetchUserQuestions();
                        } catch (error: any) {
                            Alert.alert('Error', error?.data?.message || 'Failed to delete question');
                        }
                    }
                }
            ]
        );
    };

    const addCustomQuestion = () => {
        if (!currentCustomQuestion.question.trim()) {
            Alert.alert('Error', 'Please enter a question');
            return;
        }
        if (!currentCustomQuestion.answer.trim()) {
            Alert.alert('Error', 'Please enter an answer');
            return;
        }

        setCustomQuestions([...customQuestions, currentCustomQuestion]);
        setCurrentCustomQuestion({
            question: '',
            answer: '',
            difficulty: 'MEDIUM',
            topic: '',
            additionalInfo: '',
        });
        Alert.alert('Success', 'Question added!');
    };

    const removeCustomQuestion = (index: number) => {
        Alert.alert(
            'Remove Question',
            'Are you sure?',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        setCustomQuestions(customQuestions.filter((_, i) => i !== index));
                        const newTotal = selectedQuestionsArray.length - 1;
                        const newTotalPages = Math.ceil(newTotal / questionsPerPreviewPage);
                        if (previewPage > newTotalPages && newTotalPages > 0) {
                            setPreviewPage(newTotalPages);
                        }
                    }
                }
            ]
        );
    };

    const toggleQuestionSelection = (questionId: string) => {
        const newSelection = new Set(selectedQuestionIds);
        if (newSelection.has(questionId)) {
            newSelection.delete(questionId);
        } else {
            newSelection.add(questionId);
        }
        setSelectedQuestionIds(newSelection);
    };

    const toggleQuestionExpansion = (index: number) => {
        const globalIndex = previewStartIndex + index;
        setExpandedQuestions(prev => {
            const newSet = new Set(prev);
            newSet.has(globalIndex) ? newSet.delete(globalIndex) : newSet.add(globalIndex);
            return newSet;
        });
    };

    const getDifficultyColor = (difficulty: string | undefined) => {
        switch (difficulty) {
            case 'EASY':
                return '#4CAF50';
            case 'MEDIUM':
                return '#FF9800';
            case 'HARD':
                return '#F44336';
            default:
                return '#9E9E9E';
        }
    };

    const handleCreateQuest = async () => {
        if (selectedQuestionsArray.length === 0) {
            Alert.alert('Error', 'Please select at least one question');
            return;
        }

        if (!quizConfig.teamName.trim()) {
            Alert.alert('Error', 'Please enter a team name');
            return;
        }

        if (quizConfig.teamMembers.length === 0) {
            Alert.alert('Error', 'Please add at least one team member');
            return;
        }

        try {
            const challengeData: CreateChallengeRequest = {
                userId: "",
                visibility: "",
                title,
                description,
                reward,
                type: 'WWW',
                status: 'ACTIVE'
            };

            const challengeResult = await createChallenge(challengeData).unwrap();
            const challengeId = challengeResult.id;

            const questionIds = selectedQuestionsArray
                .filter(q => q.id && !q.id.startsWith('new-custom-'))
                .map(q => parseInt(q.id));

            const apiDifficulty: 'EASY' | 'MEDIUM' | 'HARD' =
                quizConfig.difficulty === 'Easy' ? 'EASY' :
                    quizConfig.difficulty === 'Hard' ? 'HARD' : 'MEDIUM';

            const sessionData: StartQuizSessionRequest = {
                challengeId,
                teamName: quizConfig.teamName,
                teamMembers: quizConfig.teamMembers,
                difficulty: apiDifficulty,
                roundTimeSeconds: quizConfig.roundTime,
                totalRounds: selectedQuestionsArray.length,
                timePerRound: quizConfig.roundTime,
                enableAiHost: quizConfig.enableAIHost,
                questionSource: questionSource,
                customQuestionIds: questionIds.length > 0 ? questionIds : undefined
            };

            const sessionResult = await startQuizSession(sessionData).unwrap();

            Alert.alert(
                'Success',
                'Quiz challenge created!',
                [
                    {
                        text: 'Start Game',
                        onPress: () => navigation.navigate('WWWGamePlay', {
                            sessionId: sessionResult.id,
                            challengeId
                        })
                    },
                    {text: 'Go to Home', onPress: () => navigation.navigate('Main', {screen: 'Home'})}
                ]
            );
        } catch (error: any) {
            console.error('Error creating quest:', error);
            Alert.alert('Error', error.data?.message || 'Failed to create quest. Please try again.');
        }
    };

    const isCustomQuestion = (q: any, globalIndex: number): boolean => {
        if (questionSource === 'user') {
            const savedCount = transformedUserQuestions.filter(uq => selectedQuestionIds.has(uq.id)).length;
            return globalIndex >= savedCount;
        }
        return false;
    };

    // Add this render function for media questions preview
    const renderMediaQuestionPreview = (item: MediaQuestionData, index: number) => {
        const isSelected = selectedUserQuestionIds.has(item.id || '');
        const hasMedia = item.questionMediaUrl && item.questionType !== 'TEXT';

        return (
            <TouchableOpacity
                key={item.id || index}
                style={[
                    styles.questionCard,
                    isSelected && styles.questionCardSelected
                ]}
                onPress={() => {
                    if (item.id) {
                        const newSelection = new Set(selectedUserQuestionIds);
                        if (newSelection.has(item.id)) {
                            newSelection.delete(item.id);
                        } else {
                            newSelection.add(item.id);
                        }
                        setSelectedUserQuestionIds(newSelection);
                    }
                }}
            >
                <View style={styles.questionHeader}>
                    <View style={styles.questionBadges}>
                        <View style={[styles.badge, styles.difficultyBadge]}>
                            <Text style={styles.badgeText}>{item.difficulty}</Text>
                        </View>
                        {hasMedia && (
                            <View style={[styles.badge, styles.mediaBadge]}>
                                <MaterialCommunityIcons
                                    name={
                                        item.questionType === 'IMAGE' ? 'image' :
                                            item.questionType === 'VIDEO' ? 'video' :
                                                item.questionType === 'AUDIO' ? 'music' : 'text'
                                    }
                                    size={14}
                                    color="#fff"
                                />
                                <Text style={styles.badgeText}>{item.questionType}</Text>
                            </View>
                        )}
                    </View>
                    {isSelected && (
                        <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50"/>
                    )}
                </View>

                {item.topic && (
                    <Text style={styles.questionTopic}>Topic: {item.topic}</Text>
                )}

                <Text style={styles.questionText}>{item.question}</Text>

                {hasMedia && item.questionMediaUrl && (
                    <View style={styles.mediaPreviewContainer}>
                        {item.questionType === 'IMAGE' && (
                            <Image
                                source={{uri: item.questionMediaUrl}}
                                style={styles.questionMediaPreview}
                                resizeMode="cover"
                            />
                        )}
                        {item.questionType === 'VIDEO' && (
                            <View style={styles.videoPlaceholder}>
                                <MaterialCommunityIcons name="play-circle" size={48} color="#fff"/>
                                <Text style={styles.videoPlaceholderText}>Video attached</Text>
                            </View>
                        )}
                        {item.questionType === 'AUDIO' && (
                            <View style={styles.audioPlaceholder}>
                                <MaterialCommunityIcons name="volume-high" size={32} color="#4CAF50"/>
                                <Text style={styles.audioPlaceholderText}>Audio file attached</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.questionFooter}>
                    <Text style={styles.answerPreview}>Answer: {item.answer}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    // NEW: Render Add Question Modal
    const renderAddQuestionModal = () => (
        <Modal
            visible={showAddQuestionModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowAddQuestionModal(false)}
        >
            <View style={styles.addQuestionModalOverlay}>
                <View style={styles.addQuestionModalContent}>
                    <View style={styles.addQuestionModalHeader}>
                        <Text style={styles.addQuestionModalTitle}>Add New Question</Text>
                        <TouchableOpacity onPress={() => setShowAddQuestionModal(false)}>
                            <MaterialCommunityIcons name="close" size={28} color="#666"/>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.addQuestionModalBody}>
                        {/* Question Text */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Question *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={newQuestion.question}
                                onChangeText={(text) => setNewQuestion({...newQuestion, question: text})}
                                placeholder="Enter your question"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Answer */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Answer *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={newQuestion.answer}
                                onChangeText={(text) => setNewQuestion({...newQuestion, answer: text})}
                                placeholder="Enter the answer"
                                multiline
                                numberOfLines={2}
                            />
                        </View>

                        {/* Difficulty */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Difficulty</Text>
                            <Picker
                                selectedValue={newQuestion.difficulty}
                                onValueChange={(value) => setNewQuestion({...newQuestion, difficulty: value})}
                                style={styles.picker}
                            >
                                <Picker.Item label="Easy" value="EASY"/>
                                <Picker.Item label="Medium" value="MEDIUM"/>
                                <Picker.Item label="Hard" value="HARD"/>
                            </Picker>
                        </View>

                        {/* Topic */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Topic (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={newQuestion.topic}
                                onChangeText={(text) => setNewQuestion({...newQuestion, topic: text})}
                                placeholder="e.g., History, Science"
                            />
                        </View>

                        {/* Visibility / Access Policy */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Who can use this question? *</Text>
                            <Text style={styles.helperText}>
                                Choose who can find and use this question in their quizzes
                            </Text>

                            {[
                                QuestionVisibility.PRIVATE,
                                QuestionVisibility.FRIENDS_FAMILY,
                                QuestionVisibility.PUBLIC
                            ].map((visibility) => (
                                <TouchableOpacity
                                    key={visibility}
                                    style={[
                                        styles.visibilityOption,
                                        newQuestion.visibility === visibility && styles.visibilityOptionSelected
                                    ]}
                                    onPress={() => setNewQuestion({
                                        ...newQuestion,
                                        visibility: visibility as QuestionVisibility
                                    })}
                                >
                                    <View style={styles.visibilityOptionContent}>
                                        <Text style={styles.visibilityIcon}>
                                            {getVisibilityIcon(visibility as QuestionVisibility)}
                                        </Text>
                                        <View style={styles.visibilityTextContainer}>
                                            <Text style={[
                                                styles.visibilityLabel,
                                                newQuestion.visibility === visibility && styles.visibilityLabelSelected
                                            ]}>
                                                {getVisibilityLabel(visibility as QuestionVisibility)}
                                            </Text>
                                            <Text style={styles.visibilityDescription}>
                                                {getVisibilityDescription(visibility as QuestionVisibility)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.radioButton}>
                                        {newQuestion.visibility === visibility && (
                                            <View style={styles.radioButtonInner}/>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Additional Info */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Additional Info (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={newQuestion.additionalInfo}
                                onChangeText={(text) => setNewQuestion({...newQuestion, additionalInfo: text})}
                                placeholder="Any additional context or notes"
                                multiline
                                numberOfLines={2}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.addQuestionModalFooter}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowAddQuestionModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, isCreatingQuestion && styles.saveButtonDisabled]}
                            onPress={handleAddQuestion}
                            disabled={isCreatingQuestion}
                        >
                            {isCreatingQuestion ? (
                                <ActivityIndicator color="#fff"/>
                            ) : (
                                <Text style={styles.saveButtonText}>Add Question</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[styles.addButton, styles.mediaButton]}
                        onPress={() => setShowMediaQuestionModal(true)}
                    >
                        <MaterialCommunityIcons name="image-plus" size={20} color="#fff"/>
                        <Text style={styles.addButtonText}>Add Question with Media</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderQuestionItem = ({item, index}: { item: any; index: number }) => {
        const isSelected = selectedQuestionIds.has(item.id?.toString() || '');
        const qId = item.id?.toString() || '';
        const isAnswerVisible = visibleAnswers.has(qId);

        return (
            <TouchableOpacity
                style={[styles.questionCard, isSelected && styles.questionCardSelected]}
                onPress={() => {
                    if (qId) toggleQuestionSelection(qId);
                }}
            >
                <View style={styles.questionHeader}>
                    <View style={styles.questionBadges}>
                        <View style={[styles.difficultyBadge, {backgroundColor: getDifficultyColor(item.difficulty)}]}>
                            <Text style={styles.badgeText}>{item.difficulty}</Text>
                        </View>
                        {item.topic && (
                            <View style={styles.topicBadge}>
                                <Text style={styles.topicBadgeText}>{item.topic}</Text>
                            </View>
                        )}
                        {/* NEW: Show visibility badge for user questions */}
                        {questionSource === 'user' && item.visibility && (
                            <View style={styles.visibilityBadge}>
                                <Text style={styles.badgeText}>
                                    {getVisibilityIcon(item.visibility)} {getVisibilityLabel(item.visibility)}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={{flexDirection: 'row', gap: 12, alignItems: 'center'}}>
                        {/* NEW: Delete button for user questions */}
                        {questionSource === 'user' && (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleDeleteUserQuestion(qId);
                                }}
                            >
                                <MaterialCommunityIcons name="delete" size={24} color="#ff4444"/>
                            </TouchableOpacity>
                        )}
                        {questionSource === 'app' && (
                            <MaterialCommunityIcons
                                name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                                size={28}
                                color={isSelected ? '#007AFF' : '#999'}
                            />
                        )}
                    </View>
                </View>

                <Text style={styles.questionText}>{item.question}</Text>

                <View style={styles.answerContainer}>
                    <View style={styles.answerRow}>
                        <Text style={[
                            styles.answerPreview,
                            !isAnswerVisible && styles.answerBlurred
                        ]}>
                            Answer: {item.answer}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.showAnswerButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            toggleAnswerVisibility(qId);
                        }}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name={isAnswerVisible ? 'eye-off' : 'eye'}
                            size={20}
                            color="#007AFF"
                        />
                        <Text style={styles.showAnswerText}>
                            {isAnswerVisible ? 'Hide' : 'Show'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Create WWW Quest</Text>
                    <Text style={styles.subtitle}>Build your custom quiz challenge</Text>
                </View>

                <ScrollView style={styles.scrollView}>
                    {/* Basic Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Basic Information</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Enter quest title"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Enter quest description"
                                multiline
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Reward</Text>
                            <TextInput
                                style={styles.input}
                                value={reward}
                                onChangeText={setReward}
                                placeholder="Enter reward"
                            />
                        </View>
                    </View>

                    {/* Quiz Config Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quiz Configuration</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Team Name</Text>
                            <TextInput
                                style={styles.input}
                                value={quizConfig.teamName}
                                onChangeText={(text) => setQuizConfig({...quizConfig, teamName: text})}
                                placeholder="Enter team name"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Team Members</Text>
                            {quizConfig.teamMembers.map((member, index) => (
                                <View key={index} style={styles.memberRow}>
                                    <Text style={styles.memberText}>{member}</Text>
                                    <TouchableOpacity onPress={() => removeTeamMember(index)}>
                                        <MaterialCommunityIcons name="close-circle" size={24} color="#F44336"/>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <View style={styles.addMemberContainer}>
                                <TextInput
                                    style={[styles.input, styles.memberInput]}
                                    value={teamMemberInput}
                                    onChangeText={setTeamMemberInput}
                                    placeholder="Add team member"
                                />
                                <TouchableOpacity style={styles.addButton} onPress={addTeamMember}>
                                    <Text style={styles.addButtonText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Difficulty</Text>
                            <Picker
                                selectedValue={quizConfig.difficulty}
                                onValueChange={(value) => setQuizConfig({...quizConfig, difficulty: value})}
                                style={styles.picker}
                            >
                                <Picker.Item label="Easy" value="Easy"/>
                                <Picker.Item label="Medium" value="Medium"/>
                                <Picker.Item label="Hard" value="Hard"/>
                            </Picker>
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Round Time (seconds)</Text>
                            <TextInput
                                style={styles.input}
                                value={quizConfig.roundTime.toString()}
                                onChangeText={(text) => setQuizConfig({
                                    ...quizConfig,
                                    roundTime: parseInt(text) || 60
                                })}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Round Count</Text>
                            <TextInput
                                style={styles.input}
                                value={quizConfig.roundCount.toString()}
                                onChangeText={(text) => setQuizConfig({
                                    ...quizConfig,
                                    roundCount: parseInt(text) || 10
                                })}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Question Source Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Question Source</Text>
                        <View style={styles.filterContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    questionSource === 'app' && styles.filterChipSelected
                                ]}
                                onPress={() => setQuestionSource('app')}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    questionSource === 'app' && styles.filterChipTextSelected
                                ]}>
                                    App Questions
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    questionSource === 'user' && styles.filterChipSelected
                                ]}
                                onPress={() => setQuestionSource('user')}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    questionSource === 'user' && styles.filterChipTextSelected
                                ]}>
                                    My Questions
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* App Questions Search */}
                    {questionSource === 'app' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Search Questions</Text>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Keyword</Text>
                                <TextInput
                                    style={styles.input}
                                    value={searchKeyword}
                                    onChangeText={setSearchKeyword}
                                    placeholder="Search by keyword..."
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Difficulty</Text>
                                <Picker
                                    selectedValue={searchDifficulty}
                                    onValueChange={(value) => setSearchDifficulty(value as APIDifficulty | 'ALL')}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="All" value="ALL"/>
                                    <Picker.Item label="Easy" value="EASY"/>
                                    <Picker.Item label="Medium" value="MEDIUM"/>
                                    <Picker.Item label="Hard" value="HARD"/>
                                </Picker>
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Topic</Text>
                                <TouchableOpacity
                                    style={styles.input}
                                    onPress={() => setShowTopicPicker(true)}
                                >
                                    <Text>{searchTopic || 'Select topic...'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.searchActions}>
                                <TouchableOpacity
                                    style={styles.searchButton}
                                    onPress={searchAppQuestions}
                                >
                                    <MaterialCommunityIcons name="magnify" size={20} color="#fff"/>
                                    <Text style={styles.searchButtonText}>Search</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.clearButton}
                                    onPress={() => {
                                        setSearchKeyword('');
                                        setSearchDifficulty('ALL');
                                        setSearchTopic('');
                                        setCurrentPage(0);
                                    }}
                                >
                                    <Text style={styles.clearButtonText}>Clear</Text>
                                </TouchableOpacity>
                            </View>

                            {isLoadingAppQuestions ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#007AFF"/>
                                    <Text style={styles.loadingText}>Loading questions...</Text>
                                </View>
                            ) : appQuestionsError ? (
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="alert-circle" size={48} color="#F44336"/>
                                    <Text style={styles.emptyText}>{appQuestionsError}</Text>
                                </View>
                            ) : (
                                <>
                                    {totalQuestions > 0 && (
                                        <Text style={styles.resultsCount}>
                                            Found {totalQuestions} questions
                                        </Text>
                                    )}
                                    <FlatList
                                        data={appQuestions}
                                        renderItem={renderQuestionItem}
                                        keyExtractor={(item) => item.id?.toString() || ''}
                                        scrollEnabled={false}
                                        ListEmptyComponent={
                                            <View style={styles.emptyContainer}>
                                                <MaterialCommunityIcons name="file-question" size={48} color="#999"/>
                                                <Text style={styles.emptyText}>No questions found</Text>
                                                <Text style={styles.emptySubtext}>Try different search criteria</Text>
                                            </View>
                                        }
                                    />
                                    {totalPages > 1 && (
                                        <View style={styles.paginationContainer}>
                                            <TouchableOpacity
                                                style={[styles.paginationButton, currentPage <= 0 && styles.paginationButtonDisabled]}
                                                onPress={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage <= 0}
                                            >
                                                <Text style={styles.paginationButtonText}>← Prev</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.pageInfo}>
                                                Page {currentPage + 1} of {totalPages}
                                            </Text>
                                            <TouchableOpacity
                                                style={[styles.paginationButton, currentPage >= totalPages - 1 && styles.paginationButtonDisabled]}
                                                onPress={() => setCurrentPage(currentPage + 1)}
                                                disabled={currentPage >= totalPages - 1}
                                            >
                                                <Text style={styles.paginationButtonText}>Next →</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    )}

                    {/* User Questions */}
                    {questionSource === 'user' && (
                        <View style={styles.section}>
                            {/* NEW: Header with Add Button */}
                            <View style={styles.sectionHeaderWithButton}>
                                <Text style={styles.sectionTitle}>My Questions</Text>
                                <TouchableOpacity
                                    style={styles.addQuestionButton}
                                    onPress={() => setShowAddQuestionModal(true)}
                                >
                                    <MaterialCommunityIcons name="plus-circle" size={24} color="#007AFF"/>
                                    <Text style={styles.addQuestionButtonText}>Add Question</Text>
                                </TouchableOpacity>
                            </View>

                            {isLoadingUserQuestions ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#007AFF"/>
                                    <Text style={styles.loadingText}>Loading your questions...</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={transformedUserQuestions}
                                    renderItem={renderQuestionItem}
                                    keyExtractor={(item) => item.id?.toString() || ''}
                                    scrollEnabled={false}
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <MaterialCommunityIcons name="file-question" size={48} color="#999"/>
                                            <Text style={styles.emptyText}>No questions yet</Text>
                                            <Text style={styles.emptySubtext}>Create your first question!</Text>
                                        </View>
                                    }
                                />
                            )}
                        </View>
                    )}

                    {/* Selected Questions Preview - Keep your existing preview code */}
                    {totalSelectedQuestions > 0 && (
                        <View style={styles.section}>
                            <TouchableOpacity
                                style={styles.collapseHeader}
                                onPress={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
                            >
                                <Text style={styles.sectionTitle}>
                                    Selected Questions ({totalSelectedQuestions})
                                </Text>
                                <MaterialCommunityIcons
                                    name={isPreviewCollapsed ? 'chevron-down' : 'chevron-up'}
                                    size={28}
                                    color="#333"
                                />
                            </TouchableOpacity>

                            {!isPreviewCollapsed && (
                                <>
                                    {previewQuestions.map((q, displayIndex) => {
                                        const globalIndex = previewStartIndex + displayIndex;
                                        const isExpanded = expandedQuestions.has(globalIndex);
                                        const isCustom = isCustomQuestion(q, globalIndex);

                                        return (
                                            <View key={globalIndex} style={styles.previewCard}>
                                                <View style={styles.previewHeader}>
                                                    <Text style={styles.questionNumber}>
                                                        Q{globalIndex + 1}
                                                    </Text>
                                                    {!isCustom && (
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                const qId = q.id?.toString ? q.id.toString() : '';
                                                                if (qId) toggleQuestionSelection(qId);
                                                            }}
                                                        >
                                                            <MaterialCommunityIcons
                                                                name="close-circle"
                                                                size={24}
                                                                color="#F44336"
                                                            />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>

                                                <Text style={styles.previewQuestionText}>
                                                    {q.question}
                                                </Text>

                                                <View style={styles.previewMetaRow}>
                                                    <View style={[
                                                        styles.difficultyBadge,
                                                        {backgroundColor: getDifficultyColor(q.difficulty)}
                                                    ]}>
                                                        <Text style={styles.badgeText}>{q.difficulty}</Text>
                                                    </View>
                                                    {q.topic && <Text style={styles.topicText}>📚 {q.topic}</Text>}
                                                    {isCustom && (
                                                        <View style={styles.customBadge}>
                                                            <Text style={styles.customBadgeText}>NEW</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                {q.additionalInfo && (
                                                    <>
                                                        <TouchableOpacity
                                                            style={styles.expandButton}
                                                            onPress={() => toggleQuestionExpansion(displayIndex)}
                                                        >
                                                            <Text style={styles.expandButtonText}>
                                                                {isExpanded ? '▲ Hide Details' : '▼ Show Details'}
                                                            </Text>
                                                        </TouchableOpacity>

                                                        {isExpanded && (
                                                            <View style={styles.additionalInfoContainer}>
                                                                <Text style={styles.additionalInfoLabel}>
                                                                    Additional Info:
                                                                </Text>
                                                                <Text style={styles.additionalInfoText}>
                                                                    {q.additionalInfo}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </>
                                                )}
                                            </View>
                                        );
                                    })}

                                    {previewTotalPages > 1 && (
                                        <View style={styles.paginationContainer}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.paginationButton,
                                                    previewPage <= 1 && styles.paginationButtonDisabled
                                                ]}
                                                onPress={() => setPreviewPage(previewPage - 1)}
                                                disabled={previewPage <= 1}
                                            >
                                                <Text style={styles.paginationButtonText}>← Prev</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.pageInfo}>
                                                {previewStartIndex + 1}-{previewEndIndex} of {totalSelectedQuestions}
                                            </Text>
                                            <TouchableOpacity
                                                style={[
                                                    styles.paginationButton,
                                                    previewPage >= previewTotalPages && styles.paginationButtonDisabled
                                                ]}
                                                onPress={() => setPreviewPage(previewPage + 1)}
                                                disabled={previewPage >= previewTotalPages}
                                            >
                                                <Text style={styles.paginationButtonText}>Next →</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    )}

                    <View style={styles.spacer}/>
                </ScrollView>

                {/* Create Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            (isCreatingChallenge || isStartingSession) && styles.createButtonDisabled
                        ]}
                        onPress={handleCreateQuest}
                        disabled={isCreatingChallenge || isStartingSession}
                    >
                        {(isCreatingChallenge || isStartingSession) ? (
                            <>
                                <ActivityIndicator color="#fff"/>
                                <Text style={styles.createButtonText}>Creating...</Text>
                            </>
                        ) : (
                            <>
                                <MaterialCommunityIcons name="check-circle" size={24} color="#fff"/>
                                <Text style={styles.createButtonText}>
                                    Create Quest ({totalSelectedQuestions})
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Topic Picker Modal */}
                <Modal
                    visible={showTopicPicker}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowTopicPicker(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Topic</Text>
                            <ScrollView style={styles.topicList}>
                                <TouchableOpacity
                                    style={styles.topicItem}
                                    onPress={() => {
                                        setSearchTopic('');
                                        setShowTopicPicker(false);
                                    }}
                                >
                                    <Text style={styles.topicItemText}>All Topics</Text>
                                </TouchableOpacity>
                                {availableTopics.map((topic, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.topicItem}
                                        onPress={() => {
                                            setSearchTopic(topic);
                                            setShowTopicPicker(false);
                                        }}
                                    >
                                        <Text style={styles.topicItemText}>{topic}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowTopicPicker(false)}
                            >
                                <Text style={styles.modalCloseButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* NEW: Add Question Modal */}
                {renderAddQuestionModal()}
            </KeyboardAvoidingView>

            <Modal
                visible={showMediaQuestionModal}
                animationType="slide"
                onRequestClose={() => setShowMediaQuestionModal(false)}
            >
                <SafeAreaView style={{flex: 1}}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Create Question with Media</Text>
                        <TouchableOpacity
                            onPress={() => setShowMediaQuestionModal(false)}
                            style={styles.modalCloseButton}
                        >
                            <MaterialCommunityIcons name="close" size={24} color="#333"/>
                        </TouchableOpacity>
                    </View>
                    <CreateQuestionWithMedia
                        onSubmit={handleMediaQuestionSubmit}
                        onCancel={() => setShowMediaQuestionModal(false)}
                    />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // ... Keep ALL your existing styles ...
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 16,
        padding: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    collapseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    inputContainer: {
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
        height: 80,
        textAlignVertical: 'top',
    },
    picker: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    memberText: {
        fontSize: 16,
        color: '#333',
    },
    addMemberContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    memberInput: {
        flex: 1,
    },
    addButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    filterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
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
    searchActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
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
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    resultsCount: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 12,
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
        marginBottom: 8,
    },
    questionBadges: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        flex: 1,
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    topicBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#e0e0e0',
    },
    topicBadgeText: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600',
    },
    customBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
    },
    customBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        lineHeight: 22,
    },
    answerPreview: {
        fontSize: 14,
        color: '#666',
    },
    previewCard: {
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    questionNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2196F3',
    },
    previewQuestionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
        lineHeight: 24,
    },
    previewMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    topicText: {
        fontSize: 13,
        color: '#666',
    },
    answerWrapper: {
        marginTop: 4,
        marginBottom: 8,
    },
    blurredAnswerContainer: {
        position: 'relative',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 12,
        minHeight: 60,
    },
    blurOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(200, 200, 200, 0.8)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
    },
    blurredAnswerText: {
        fontSize: 15,
        color: 'rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        lineHeight: 22,
        letterSpacing: 2,
    },
    blurIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    blurHintText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    answerContainer: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#4CAF50',
        borderRadius: 8,
        padding: 12,
    },
    answerLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4CAF50',
        marginBottom: 4,
    },
    answerText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    expandButton: {
        backgroundColor: '#9E9E9E',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    expandButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    additionalInfoContainer: {
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
        padding: 10,
        marginTop: 8,
    },
    additionalInfoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    additionalInfoText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingHorizontal: 8,
    },
    paginationButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 6,
    },
    paginationButtonDisabled: {
        backgroundColor: '#ccc',
    },
    paginationButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    pageInfo: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
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
        marginTop: 12,
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    emptySubtext: {
        marginTop: 4,
        fontSize: 14,
        color: '#999',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    createButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
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
        height: 100,
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
    answerRow: {
        marginBottom: 8,
    },
    answerBlurred: {
        color: 'transparent',
        textShadowColor: '#666',
        textShadowRadius: 20,
        textShadowOffset: {width: 0, height: 0},
    },
    showAnswerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F0F8FF',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#007AFF',
        gap: 6,
    },
    showAnswerText: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '600',
    },

    // NEW: Add Question Modal Styles
    sectionHeaderWithButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    addQuestionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#E5F1FF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    addQuestionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    addQuestionModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    addQuestionModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    addQuestionModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    addQuestionModalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
    },
    addQuestionModalBody: {
        padding: 20,
        maxHeight: 500,
    },
    helperText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
    },
    visibilityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#fafafa',
    },
    visibilityOptionSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#e5f1ff',
    },
    visibilityOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    visibilityIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    visibilityTextContainer: {
        flex: 1,
    },
    visibilityLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    visibilityLabelSelected: {
        color: '#007AFF',
    },
    visibilityDescription: {
        fontSize: 13,
        color: '#666',
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#007AFF',
    },
    addQuestionModalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    saveButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    visibilityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
    },
    mediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        backgroundColor: '#2196F3',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: 'white',
    },
    addMediaQuestionButton: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 12,
    },
    addMediaQuestionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    mediaQuestionsPreview: {
        marginTop: 20,
    },
    mediaQuestionsList: {
        maxHeight: 400,
    },
    mediaPreviewContainer: {
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    questionMediaPreview: {
        width: '100%',
        height: 150,
        backgroundColor: '#f0f0f0',
    },
    videoPlaceholder: {
        width: '100%',
        height: 150,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoPlaceholderText: {
        color: '#fff',
        marginTop: 8,
        fontSize: 14,
    },
    audioPlaceholder: {
        width: '100%',
        padding: 24,
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
    },
    audioPlaceholderText: {
        color: '#666',
        marginTop: 8,
        fontSize: 14,
    },
    mediaBadge: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        gap: 4,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    questionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    }, badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    questionTopic: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
        marginBottom: 4,
    },


    // modalHeader: {
    //     flexDirection: 'row',
    //     justifyContent: 'space-between',
    //     alignItems: 'center',
    //     padding: 16,
    //     borderBottomWidth: 1,
    //     borderBottomColor: '#e0e0e0',
    //     backgroundColor: 'white',
    // },
    // modalTitle: {
    //     fontSize: 18,
    //     fontWeight: 'bold',
    //     color: '#333',
    // },
    // modalCloseButton: {
    //     padding: 4,
    // },
    // modalTitle: {
    //     fontSize: 18,
    //     fontWeight: 'bold',
    //     color: '#333',
    // },
    // modalCloseButton: {
    //     padding: 4,
    // },
});

export default CreateWWWQuestScreen;