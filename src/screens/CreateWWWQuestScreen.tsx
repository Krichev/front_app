// src/screens/CreateWWWQuestScreen.tsx - COMPLETE FIXED VERSION
import React, {useEffect, useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
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
import {CreateChallengeRequest, useCreateChallengeMutation} from '../entities/ChallengeState/model/slice/challengeApi';
import {
    StartQuizSessionRequest,
    useGetUserQuestionsQuery,
    useStartQuizSessionMutation
} from '../entities/QuizState/model/slice/quizApi';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {QuestionData, QuestionService} from '../services/wwwGame/questionService';
import FileService, {ProcessedFileInfo} from '../services/speech/FileService';

// Enhanced question types
export type QuestionType = 'text' | 'audio' | 'video';

// Enhanced interfaces for multimedia questions
interface MediaFile {
    id?: string;
    uri: string;
    type: string;
    name: string;
    size: number;
    uploadedUrl?: string;
    isUploading?: boolean;
    uploadProgress?: number;
}

interface MultimediaQuestionData {
    id?: string;
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
    questionType: QuestionType;
    mediaFile?: MediaFile;
    questionMediaUrl?: string;
}

interface AppQuestionData {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
    externalId?: string;
    source?: string;
    questionType?: QuestionType;
    questionMediaUrl?: string;
}

interface CreateQuestionRequest {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
    questionType?: QuestionType;
    questionMediaUrl?: string;
}

// API configuration
const API_BASE_URL = 'http://10.0.2.2:8080';

// Media upload service
class MediaUploadService {
    static async uploadQuizMedia(file: ProcessedFileInfo, questionId?: string): Promise<string> {
        try {
            const formData = new FormData();

            // Properly format the file for FormData
            formData.append('file', {
                uri: file.uri,
                type: file.type,
                name: file.name,
            } as any);

            if (questionId) {
                formData.append('questionId', questionId);
            }

            const response = await fetch(`${API_BASE_URL}/api/media/upload/quiz-media`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.success) {
                return result.mediaUrl;
            } else {
                throw new Error(result.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Media upload error:', error);
            throw error;
        }
    }

    static async uploadTempMedia(file: ProcessedFileInfo): Promise<string> {
        try {
            const formData = new FormData();

            formData.append('file', {
                uri: file.uri,
                type: file.type,
                name: file.name,
            } as any);

            formData.append('questionId', 'temp_' + Date.now());

            const response = await fetch(`${API_BASE_URL}/api/media/upload/quiz-media`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.success) {
                return result.mediaUrl;
            } else {
                throw new Error(result.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Temp media upload error:', error);
            throw error;
        }
    }
}

// API Difficulty type mapping
type UIDifficulty = 'Easy' | 'Medium' | 'Hard';
type APIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

const DIFFICULTY_MAPPING: Record<UIDifficulty, APIDifficulty> = {
    'Easy': 'EASY',
    'Medium': 'MEDIUM',
    'Hard': 'HARD'
};

type RootStackParamList = {
    Challenges: undefined;
    UserQuestions: undefined;
    WWWGamePlay: {
        sessionId: string;
        challengeId?: string;
    };
};

type CreateWWWQuestScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateWWWQuestScreen: React.FC = () => {
    const navigation = useNavigation<CreateWWWQuestScreenNavigationProp>();
    const { user } = useSelector((state: RootState) => state.auth);

    // API hooks
    const [createChallenge, { isLoading: isCreatingChallenge }] = useCreateChallengeMutation();
    const [startQuizSession, { isLoading: isStartingSession }] = useStartQuizSessionMutation();

    // Question source state
    const [questionSource, setQuestionSource] = useState<'app' | 'user'>('app');

    // User questions query (only when needed)
    const {
        data: userQuestions = [],
        isLoading: isLoadingUserQuestions
    } = useGetUserQuestionsQuery(undefined, {
        skip: questionSource !== 'user'
    });

    // App questions state
    const [appQuestions, setAppQuestions] = useState<QuestionData[]>([]);
    const [isLoadingAppQuestions, setIsLoadingAppQuestions] = useState(false);
    const [appQuestionsError, setAppQuestionsError] = useState<string | null>(null);

    // Selection state
    const [selectedAppQuestionIds, setSelectedAppQuestionIds] = useState<Set<string>>(new Set());
    const [selectedUserQuestionIds, setSelectedUserQuestionIds] = useState<Set<string>>(new Set());
    const [newCustomQuestions, setNewCustomQuestions] = useState<MultimediaQuestionData[]>([]);

    // Form state
    const [title, setTitle] = useState('WWWW Quiz');
    const [description, setDescription] = useState('Test your knowledge in this team-based quiz game.');
    const [reward, setReward] = useState('Points and bragging rights!');
    const [difficulty, setDifficulty] = useState<UIDifficulty>('Medium');
    const [roundTime, setRoundTime] = useState('60');
    const [enableAIHost, setEnableAIHost] = useState(true);

    // Team info state
    const [teamName, setTeamName] = useState('My Quiz Team');
    const [teamMembers, setTeamMembers] = useState<string[]>(['']);

    // Media modal state
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);

    // Load app questions when needed
    useEffect(() => {
        if (questionSource === 'app') {
            loadAppQuestions();
        }
    }, [questionSource]);

    const loadAppQuestions = async () => {
        try {
            setIsLoadingAppQuestions(true);
            setAppQuestionsError(null);
            const questions = await QuestionService.fetchRandomQuestions(50);
            setAppQuestions(questions);
        } catch (error) {
            console.error('Error loading app questions:', error);
            setAppQuestionsError('Failed to load questions. Please try again.');
        } finally {
            setIsLoadingAppQuestions(false);
        }
    };

    // Toggle question selection
    const toggleAppQuestionSelection = (questionId: string) => {
        const newSelection = new Set(selectedAppQuestionIds);
        if (newSelection.has(questionId)) {
            newSelection.delete(questionId);
        } else {
            newSelection.add(questionId);
        }
        setSelectedAppQuestionIds(newSelection);
    };

    const toggleUserQuestionSelection = (questionId: string) => {
        const newSelection = new Set(selectedUserQuestionIds);
        if (newSelection.has(questionId)) {
            newSelection.delete(questionId);
        } else {
            newSelection.add(questionId);
        }
        setSelectedUserQuestionIds(newSelection);
    };

    // Custom question management
    const addCustomQuestion = () => {
        setNewCustomQuestions([
            ...newCustomQuestions,
            {
                question: '',
                answer: '',
                difficulty: 'MEDIUM',
                questionType: 'text'
            }
        ]);
    };

    const updateCustomQuestion = (index: number, field: keyof MultimediaQuestionData, value: any) => {
        const updated = [...newCustomQuestions];
        updated[index] = { ...updated[index], [field]: value };
        setNewCustomQuestions(updated);
    };

    const removeCustomQuestion = (index: number) => {
        setNewCustomQuestions(newCustomQuestions.filter((_, i) => i !== index));
    };

    // Team members management
    const addTeamMember = () => {
        setTeamMembers([...teamMembers, '']);
    };

    const updateTeamMember = (index: number, value: string) => {
        const updated = [...teamMembers];
        updated[index] = value;
        setTeamMembers(updated);
    };

    const removeTeamMember = (index: number) => {
        setTeamMembers(teamMembers.filter((_, i) => i !== index));
    };

    // Media handling - FIXED
    const handleMediaSelection = async (questionIndex: number, mediaType: 'audio' | 'video') => {
        try {
            let processedFile: ProcessedFileInfo | null = null;

            if (mediaType === 'audio') {
                // Use FileService.startRecording for audio
                processedFile = await FileService.startRecording();
            } else {
                // Use FileService.pickVideo for video
                processedFile = await FileService.pickVideo();
            }

            if (processedFile) {
                const updated = [...newCustomQuestions];
                updated[questionIndex] = {
                    ...updated[questionIndex],
                    questionType: mediaType,
                    mediaFile: {
                        uri: processedFile.uri,
                        type: processedFile.type,
                        name: processedFile.name,
                        size: processedFile.size,
                        isUploading: false
                    }
                };
                setNewCustomQuestions(updated);
            }
        } catch (error) {
            console.error('Media selection error:', error);
            Alert.alert('Error', 'Failed to process media file');
        }
    };

    // Computed values
    const totalSelectedQuestions = useMemo(() => {
        if (questionSource === 'app') {
            return selectedAppQuestionIds.size + newCustomQuestions.length;
        } else {
            return selectedUserQuestionIds.size + newCustomQuestions.length;
        }
    }, [questionSource, selectedAppQuestionIds, selectedUserQuestionIds, newCustomQuestions]);

    const validTeamMembers = useMemo(() =>
            teamMembers.filter(member => member.trim() !== ''),
        [teamMembers]
    );

    const canCreateQuest = useMemo(() => {
        return (
            title.trim() !== '' &&
            description.trim() !== '' &&
            totalSelectedQuestions > 0 &&
            teamName.trim() !== '' &&
            validTeamMembers.length > 0 &&
            parseInt(roundTime) >= 10
        );
    }, [title, description, totalSelectedQuestions, teamName, validTeamMembers, roundTime]);

    const isLoading = isCreatingChallenge || isStartingSession;

    // Create quest handler
    const handleCreateQuest = async () => {
        if (!canCreateQuest || !user) return;

        try {
            // Upload any media files for new custom questions
            const questionsToSend: CreateQuestionRequest[] = await Promise.all(
                newCustomQuestions.map(async (q) => {
                    let mediaUrl = q.questionMediaUrl;

                    if (q.mediaFile && !q.mediaFile.uploadedUrl) {
                        try {
                            // Create ProcessedFileInfo from MediaFile
                            const processedFile: ProcessedFileInfo = {
                                uri: q.mediaFile.uri,
                                type: q.mediaFile.type,
                                name: q.mediaFile.name,
                                size: q.mediaFile.size,
                                createdAt: new Date().toISOString(),
                                modifiedAt: new Date().toISOString(),
                                sizeFormatted: FileService.formatFileSize(q.mediaFile.size),
                                isImage: false,
                                isVideo: q.mediaFile.type.startsWith('video/'),
                                extension: FileService.getFileExtension(q.mediaFile.name),
                            };

                            mediaUrl = await MediaUploadService.uploadTempMedia(processedFile);
                        } catch (error) {
                            console.error('Failed to upload media:', error);
                        }
                    }

                    return {
                        question: q.question,
                        answer: q.answer,
                        difficulty: q.difficulty,
                        topic: q.topic,
                        additionalInfo: q.additionalInfo,
                        questionType: q.questionType,
                        questionMediaUrl: mediaUrl,
                    };
                })
            );

            // Create challenge
            const challengeRequest: CreateChallengeRequest = {
                title,
                description,
                reward,
                type: 'QUIZ',
                visibility: 'PUBLIC',
                status: 'ACTIVE',
            };

            const challengeResult = await createChallenge(challengeRequest).unwrap();

            // Start quiz session
            const sessionRequest: StartQuizSessionRequest = {
                challengeId: challengeResult.id,
                teamName,
                teamMembers: validTeamMembers,
                difficulty: DIFFICULTY_MAPPING[difficulty],
                roundTimeSeconds: parseInt(roundTime),
                totalRounds: totalSelectedQuestions,
                enableAiHost: enableAIHost,
                questionSource,
            };

            if (questionSource === 'user') {
                sessionRequest.customQuestionIds = Array.from(selectedUserQuestionIds);
            } else if (questionSource === 'app') {
                sessionRequest.customQuestionIds = Array.from(selectedAppQuestionIds);
            }

            const sessionResult = await startQuizSession(sessionRequest).unwrap();

            Alert.alert(
                'Quest Created!',
                'Your multimedia WWW Quest has been created successfully.',
                [
                    {
                        text: 'Start Game',
                        onPress: () => navigation.navigate('WWWGamePlay', {
                            sessionId: sessionResult.id,
                            challengeId: challengeResult.id,
                        }),
                    },
                ]
            );
        } catch (error) {
            console.error('Error creating quest:', error);
            Alert.alert('Error', 'Failed to create quest. Please try again.');
        }
    };

    // Render functions
    const renderCustomQuestion = ({ item, index }: { item: MultimediaQuestionData; index: number }) => (
        <View style={styles.customQuestionContainer}>
            <View style={styles.customQuestionHeader}>
                <Text style={styles.customQuestionNumber}>Question {index + 1}</Text>
                <View style={styles.customQuestionActions}>
                    <TouchableOpacity
                        style={styles.mediaButton}
                        onPress={() => {
                            setSelectedQuestionIndex(index);
                            setShowMediaModal(true);
                        }}
                    >
                        <MaterialCommunityIcons
                            name={item.questionType === 'video' ? 'video' : item.questionType === 'audio' ? 'microphone' : 'camera-plus'}
                            size={16}
                            color="#007AFF"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => removeCustomQuestion(index)}
                    >
                        <MaterialCommunityIcons name="delete" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Media preview */}
            {item.mediaFile && (
                <View style={styles.mediaPreviewContainer}>
                    {item.mediaFile.isUploading ? (
                        <View style={styles.uploadingContainer}>
                            <ActivityIndicator size="small" color="#007AFF" />
                            <Text style={styles.uploadingText}>Uploading...</Text>
                        </View>
                    ) : (
                        <View style={styles.mediaPreview}>
                            <MaterialCommunityIcons
                                name={item.questionType === 'video' ? 'video' : 'microphone'}
                                size={20}
                                color="#007AFF"
                            />
                            <Text style={styles.mediaFileName}>{item.mediaFile.name}</Text>
                        </View>
                    )}
                </View>
            )}

            <TextInput
                style={styles.input}
                placeholder="Question"
                value={item.question}
                onChangeText={(text) => updateCustomQuestion(index, 'question', text)}
                multiline
            />
            <TextInput
                style={styles.input}
                placeholder="Answer"
                value={item.answer}
                onChangeText={(text) => updateCustomQuestion(index, 'answer', text)}
                multiline
            />
            <TextInput
                style={styles.input}
                placeholder="Topic (optional)"
                value={item.topic || ''}
                onChangeText={(text) => updateCustomQuestion(index, 'topic', text)}
            />
        </View>
    );

    const renderAppQuestion = ({ item }: { item: QuestionData }) => {
        const isSelected = selectedAppQuestionIds.has(item.id);
        return (
            <TouchableOpacity
                style={[styles.questionItem, isSelected && styles.questionItemSelected]}
                onPress={() => toggleAppQuestionSelection(item.id)}
            >
                <View style={styles.questionContent}>
                    <Text style={styles.questionText} numberOfLines={2}>{item.question}</Text>
                    <Text style={styles.questionMeta}>
                        {item.difficulty} • {item.topic || 'General'}
                    </Text>
                </View>
                <MaterialCommunityIcons
                    name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={isSelected ? '#007AFF' : '#999'}
                />
            </TouchableOpacity>
        );
    };

    const renderUserQuestion = ({ item }: { item: any }) => {
        const isSelected = selectedUserQuestionIds.has(item.id.toString());
        return (
            <TouchableOpacity
                style={[styles.questionItem, isSelected && styles.questionItemSelected]}
                onPress={() => toggleUserQuestionSelection(item.id.toString())}
            >
                <View style={styles.questionContent}>
                    <Text style={styles.questionText} numberOfLines={2}>{item.question}</Text>
                    <Text style={styles.questionMeta}>
                        {item.difficulty} • {item.topic || 'General'}
                    </Text>
                </View>
                <MaterialCommunityIcons
                    name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={isSelected ? '#007AFF' : '#999'}
                />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#007AFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Create WWW Quest</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Basic Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Basic Information</Text>

                        <Text style={styles.label}>Quest Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter quest title"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe your quest"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />

                        <Text style={styles.label}>Reward</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="What do participants win?"
                            value={reward}
                            onChangeText={setReward}
                        />
                    </View>

                    {/* Game Settings Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Game Settings</Text>

                        <Text style={styles.label}>Difficulty</Text>
                        <View style={styles.difficultyContainer}>
                            {(['Easy', 'Medium', 'Hard'] as UIDifficulty[]).map((diff) => (
                                <TouchableOpacity
                                    key={diff}
                                    style={[
                                        styles.difficultyButton,
                                        difficulty === diff && styles.difficultyButtonSelected
                                    ]}
                                    onPress={() => setDifficulty(diff)}
                                >
                                    <Text style={[
                                        styles.difficultyButtonText,
                                        difficulty === diff && styles.difficultyButtonTextSelected
                                    ]}>
                                        {diff}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Round Time (seconds)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="60"
                            value={roundTime}
                            onChangeText={setRoundTime}
                            keyboardType="numeric"
                        />

                        <TouchableOpacity
                            style={styles.toggleButton}
                            onPress={() => setEnableAIHost(!enableAIHost)}
                        >
                            <MaterialCommunityIcons
                                name={enableAIHost ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                size={24}
                                color="#007AFF"
                            />
                            <Text style={styles.toggleText}>Enable AI Host</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Question Source Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Question Source</Text>

                        <View style={styles.radioGroup}>
                            <TouchableOpacity
                                style={styles.radioOption}
                                onPress={() => setQuestionSource('app')}
                            >
                                <MaterialCommunityIcons
                                    name={questionSource === 'app' ? 'radiobox-marked' : 'radiobox-blank'}
                                    size={24}
                                    color="#007AFF"
                                />
                                <Text style={styles.radioText}>App Questions</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.radioOption}
                                onPress={() => setQuestionSource('user')}
                            >
                                <MaterialCommunityIcons
                                    name={questionSource === 'user' ? 'radiobox-marked' : 'radiobox-blank'}
                                    size={24}
                                    color="#007AFF"
                                />
                                <Text style={styles.radioText}>My Questions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Questions Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                {questionSource === 'app' ? 'App Questions' : 'My Questions'}
                            </Text>
                            <Text style={styles.selectionCount}>
                                {totalSelectedQuestions} selected
                            </Text>
                        </View>

                        {questionSource === 'app' ? (
                            isLoadingAppQuestions ? (
                                <ActivityIndicator size="large" color="#007AFF" />
                            ) : appQuestionsError ? (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{appQuestionsError}</Text>
                                    <TouchableOpacity
                                        style={styles.retryButton}
                                        onPress={loadAppQuestions}
                                    >
                                        <Text style={styles.retryButtonText}>Retry</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <FlatList
                                    data={appQuestions}
                                    renderItem={renderAppQuestion}
                                    keyExtractor={(item) => item.id}
                                    scrollEnabled={false}
                                />
                            )
                        ) : (
                            isLoadingUserQuestions ? (
                                <ActivityIndicator size="large" color="#007AFF" />
                            ) : userQuestions.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No questions yet</Text>
                                    <TouchableOpacity
                                        style={styles.createButton}
                                        onPress={() => navigation.navigate('UserQuestions')}
                                    >
                                        <Text style={styles.createButtonText}>Create Questions</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <FlatList
                                    data={userQuestions}
                                    renderItem={renderUserQuestion}
                                    keyExtractor={(item) => item.id.toString()}
                                    scrollEnabled={false}
                                />
                            )
                        )}
                    </View>

                    {/* Custom Questions Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Custom Questions</Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={addCustomQuestion}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color="#007AFF" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={newCustomQuestions}
                            renderItem={renderCustomQuestion}
                            keyExtractor={(_, index) => `custom-${index}`}
                            scrollEnabled={false}
                        />
                    </View>

                    {/* Team Information Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Team Information</Text>

                        <Text style={styles.label}>Team Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter team name"
                            value={teamName}
                            onChangeText={setTeamName}
                        />

                        <Text style={styles.label}>Team Members</Text>
                        {teamMembers.map((member, index) => (
                            <View key={index} style={styles.teamMemberRow}>
                                <TextInput
                                    style={[styles.input, styles.teamMemberInput]}
                                    placeholder={`Member ${index + 1}`}
                                    value={member}
                                    onChangeText={(text) => updateTeamMember(index, text)}
                                />
                                {teamMembers.length > 1 && (
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => removeTeamMember(index)}
                                    >
                                        <MaterialCommunityIcons name="close" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        <TouchableOpacity
                            style={styles.addMemberButton}
                            onPress={addTeamMember}
                        >
                            <MaterialCommunityIcons name="plus" size={16} color="#007AFF" />
                            <Text style={styles.addButtonText}>Add Member</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Quest Summary */}
                    <View style={styles.section}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Quest Summary</Text>
                            <Text style={styles.summaryText}>Title: {title || 'Not set'}</Text>
                            <Text style={styles.summaryText}>Questions: {totalSelectedQuestions}</Text>
                            <Text style={styles.summaryText}>Difficulty: {difficulty}</Text>
                            <Text style={styles.summaryText}>Round Time: {roundTime}s</Text>
                            <Text style={styles.summaryText}>Team: {teamName || 'Not set'}</Text>
                            <Text style={styles.summaryText}>Members: {validTeamMembers.length}</Text>
                        </View>
                    </View>

                    {/* Create Button */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[
                                styles.createQuestButton,
                                (!canCreateQuest || isLoading) && styles.createButtonDisabled
                            ]}
                            onPress={handleCreateQuest}
                            disabled={!canCreateQuest || isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Text style={styles.createQuestButtonText}>Create Quest</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Media Selection Modal */}
            <Modal
                visible={showMediaModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowMediaModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Media</Text>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                if (selectedQuestionIndex !== null) {
                                    handleMediaSelection(selectedQuestionIndex, 'audio');
                                }
                                setShowMediaModal(false);
                            }}
                        >
                            <MaterialCommunityIcons name="microphone" size={24} color="#007AFF" />
                            <Text style={styles.modalButtonText}>Record Audio</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                if (selectedQuestionIndex !== null) {
                                    handleMediaSelection(selectedQuestionIndex, 'video');
                                }
                                setShowMediaModal(false);
                            }}
                        >
                            <MaterialCommunityIcons name="video" size={24} color="#007AFF" />
                            <Text style={styles.modalButtonText}>Add Video</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalCancelButton]}
                            onPress={() => setShowMediaModal(false)}
                        >
                            <Text style={styles.modalCancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1D1D1F',
    },
    section: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1D1D1F',
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E5E7',
        marginBottom: 12,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    difficultyContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    difficultyButton: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E5E7',
        alignItems: 'center',
    },
    difficultyButtonSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    difficultyButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    difficultyButtonTextSelected: {
        color: '#FFF',
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
    },
    toggleText: {
        fontSize: 16,
        color: '#333',
    },
    radioGroup: {
        gap: 12,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    radioText: {
        fontSize: 16,
        color: '#333',
    },
    selectionCount: {
        fontSize: 14,
        color: '#666',
    },
    questionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E7',
        marginBottom: 8,
    },
    questionItemSelected: {
        backgroundColor: '#E5F1FF',
        borderColor: '#007AFF',
    },
    questionContent: {
        flex: 1,
        marginRight: 12,
    },
    questionText: {
        fontSize: 16,
        color: '#1D1D1F',
        marginBottom: 4,
    },
    questionMeta: {
        fontSize: 14,
        color: '#666',
    },
    customQuestionContainer: {
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E5E7',
    },
    customQuestionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    customQuestionNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1D1D1F',
    },
    customQuestionActions: {
        flexDirection: 'row',
        gap: 8,
    },
    mediaButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#E5F1FF',
    },
    deleteButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#FFE5E5',
    },
    mediaPreviewContainer: {
        marginBottom: 12,
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#F5F5F7',
        borderRadius: 8,
    },
    uploadingText: {
        fontSize: 14,
        color: '#666',
    },
    mediaPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#E5F1FF',
        borderRadius: 8,
    },
    mediaFileName: {
        fontSize: 14,
        color: '#007AFF',
        flex: 1,
    },
    teamMemberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    teamMemberInput: {
        flex: 1,
        marginBottom: 0,
    },
    removeButton: {
        padding: 8,
    },
    addMemberButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
    },
    addButton: {
        padding: 4,
    },
    addButtonText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    summaryCard: {
        backgroundColor: '#F9F9F9',
        padding: 16,
        borderRadius: 8,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1D1D1F',
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 6,
    },
    createQuestButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    createButtonDisabled: {
        backgroundColor: '#CCC',
    },
    createQuestButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        marginBottom: 12,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
    },
    createButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 24,
        width: '80%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E7',
        marginBottom: 12,
    },
    modalButtonText: {
        fontSize: 16,
        color: '#1D1D1F',
    },
    modalCancelButton: {
        borderColor: '#FF3B30',
    },
    modalCancelButtonText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
    },
});

export default CreateWWWQuestScreen;