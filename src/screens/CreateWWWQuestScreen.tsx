// src/screens/CreateWWWQuestScreen.tsx - Enhanced with Video/Audio Support
import React, {useEffect, useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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
import {useGetUserQuestionsQuery, useStartQuizSessionMutation} from '../entities/QuizState/model/slice/quizApi';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {QuestionData, QuestionService} from '../services/wwwGame/questionService';
import {FileService, ProcessedFileInfo} from '../services/speech/FileService';

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

// Enhanced StartQuizSessionRequest with multimedia support
interface EnhancedStartQuizSessionRequest {
    challengeId: string;
    teamName: string;
    teamMembers: string[];
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    roundTimeSeconds: number;
    totalRounds: number;
    enableAiHost: boolean;
    questionSource: 'app' | 'user';
    customQuestionIds?: number[];
    newCustomQuestions?: CreateQuestionRequest[];
    appQuestions?: AppQuestionData[];
}

// API configuration
const API_BASE_URL = 'http://10.0.2.2:8080'; // Update with your actual API URL

// Media upload service
class MediaUploadService {
    static async uploadQuizMedia(file: ProcessedFileInfo, questionId?: string): Promise<string> {
        try {
            const formData = new FormData();
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
        // For new questions without an ID yet, we can use a temporary upload endpoint
        // or store locally until the question is created
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

    // Selection state - which questions are checked/selected
    const [selectedAppQuestionIds, setSelectedAppQuestionIds] = useState<Set<string>>(new Set());
    const [selectedUserQuestionIds, setSelectedUserQuestionIds] = useState<Set<number>>(new Set());
    const [newCustomQuestions, setNewCustomQuestions] = useState<MultimediaQuestionData[]>([]);

    // Form state
    const [title, setTitle] = useState('What? Where? When? Quiz');
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

    // Media handling functions
    const pickMedia = async (mediaType: 'image' | 'video' | 'audio') => {
        try {
            let file: ProcessedFileInfo | null = null;

            if (mediaType === 'audio') {
                // For audio, we would need to implement audio recording
                // For now, let's use file picker for audio files
                Alert.alert('Audio Recording', 'Audio recording feature coming soon!');
                return;
            } else {
                const options = {
                    mediaType: mediaType === 'video' ? 'video' as const : 'photo' as const,
                    quality: 0.8 as any,
                    maxWidth: mediaType === 'video' ? 1920 : 1080,
                    maxHeight: mediaType === 'video' ? 1080 : 1080,
                };

                file = await FileService.pickFile(options);
            }

            if (file && selectedQuestionIndex !== null) {
                await uploadMediaForQuestion(file, selectedQuestionIndex, mediaType);
            }
        } catch (error) {
            console.error('Error picking media:', error);
            Alert.alert('Error', 'Failed to select media. Please try again.');
        }
    };

    const uploadMediaForQuestion = async (file: ProcessedFileInfo, questionIndex: number, mediaType: string) => {
        try {
            // Update question with uploading state
            const updatedQuestions = [...newCustomQuestions];
            if (!updatedQuestions[questionIndex]) return;

            updatedQuestions[questionIndex] = {
                ...updatedQuestions[questionIndex],
                mediaFile: {
                    uri: file.uri,
                    type: file.type,
                    name: file.name,
                    size: file.size,
                    isUploading: true,
                    uploadProgress: 0,
                },
                questionType: mediaType === 'video' ? 'video' : mediaType === 'audio' ? 'audio' : 'text',
            };
            setNewCustomQuestions(updatedQuestions);

            // Upload to S3
            const uploadedUrl = await MediaUploadService.uploadTempMedia(file);

            // Update question with uploaded URL
            updatedQuestions[questionIndex] = {
                ...updatedQuestions[questionIndex],
                mediaFile: {
                    ...updatedQuestions[questionIndex].mediaFile!,
                    isUploading: false,
                    uploadedUrl,
                },
                questionMediaUrl: uploadedUrl,
            };
            setNewCustomQuestions(updatedQuestions);
            setShowMediaModal(false);
            setSelectedQuestionIndex(null);

            Alert.alert('Success', 'Media uploaded successfully!');
        } catch (error) {
            console.error('Error uploading media:', error);
            Alert.alert('Upload Error', 'Failed to upload media. Please try again.');

            // Reset uploading state
            const updatedQuestions = [...newCustomQuestions];
            if (updatedQuestions[questionIndex]) {
                updatedQuestions[questionIndex] = {
                    ...updatedQuestions[questionIndex],
                    mediaFile: undefined,
                    questionType: 'text',
                };
                setNewCustomQuestions(updatedQuestions);
            }
        }
    };

    const removeMediaFromQuestion = (questionIndex: number) => {
        const updatedQuestions = [...newCustomQuestions];
        if (updatedQuestions[questionIndex]) {
            updatedQuestions[questionIndex] = {
                ...updatedQuestions[questionIndex],
                mediaFile: undefined,
                questionType: 'text',
                questionMediaUrl: undefined,
            };
            setNewCustomQuestions(updatedQuestions);
        }
    };

    // Custom question management
    const addCustomQuestion = () => {
        setNewCustomQuestions([...newCustomQuestions, {
            question: '',
            answer: '',
            difficulty: DIFFICULTY_MAPPING[difficulty],
            topic: '',
            additionalInfo: '',
            questionType: 'text',
        }]);
    };

    const updateCustomQuestion = (index: number, field: keyof MultimediaQuestionData, value: any) => {
        const updatedQuestions = [...newCustomQuestions];
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
        setNewCustomQuestions(updatedQuestions);
    };

    const removeCustomQuestion = (index: number) => {
        setNewCustomQuestions(newCustomQuestions.filter((_, i) => i !== index));
    };

    // Team member management
    const addTeamMember = () => {
        setTeamMembers([...teamMembers, '']);
    };

    const updateTeamMember = (index: number, value: string) => {
        const updatedMembers = [...teamMembers];
        updatedMembers[index] = value;
        setTeamMembers(updatedMembers);
    };

    const removeTeamMember = (index: number) => {
        if (teamMembers.length > 1) {
            setTeamMembers(teamMembers.filter((_, i) => i !== index));
        }
    };

    // Computed values
    const totalSelectedQuestions = useMemo(() => {
        if (questionSource === 'app') {
            return selectedAppQuestionIds.size;
        } else {
            return selectedUserQuestionIds.size + newCustomQuestions.length;
        }
    }, [questionSource, selectedAppQuestionIds.size, selectedUserQuestionIds.size, newCustomQuestions.length]);

    const validTeamMembers = useMemo(() => {
        return teamMembers.filter(member => member.trim().length > 0);
    }, [teamMembers]);

    const canCreateQuest = useMemo(() => {
        return (
            title.trim().length > 0 &&
            teamName.trim().length > 0 &&
            validTeamMembers.length > 0 &&
            totalSelectedQuestions > 0 &&
            parseInt(roundTime) > 0
        );
    }, [title, teamName, validTeamMembers.length, totalSelectedQuestions, roundTime]);

    const isLoading = isCreatingChallenge || isStartingSession;

    // Create quest handler
    const handleCreateQuest = async () => {
        if (!canCreateQuest || !user) return;

        try {
            // Prepare questions for the API
            const questionsToSend: CreateQuestionRequest[] = newCustomQuestions.map(q => ({
                question: q.question,
                answer: q.answer,
                difficulty: q.difficulty,
                topic: q.topic,
                additionalInfo: q.additionalInfo,
                questionType: q.questionType,
                questionMediaUrl: q.questionMediaUrl,
            }));

            // Create challenge
            const challengeRequest: CreateChallengeRequest = {
                title,
                description,
                reward,
                difficulty: DIFFICULTY_MAPPING[difficulty],
                createdBy: user.id,
            };

            const challengeResult = await createChallenge(challengeRequest).unwrap();

            // Start quiz session with multimedia questions
            const sessionRequest: EnhancedStartQuizSessionRequest = {
                challengeId: challengeResult.id,
                teamName,
                teamMembers: validTeamMembers,
                difficulty: DIFFICULTY_MAPPING[difficulty],
                roundTimeSeconds: parseInt(roundTime),
                totalRounds: totalSelectedQuestions,
                enableAiHost: enableAIHost,
                questionSource,
                newCustomQuestions: questionsToSend,
            };

            if (questionSource === 'user') {
                sessionRequest.customQuestionIds = Array.from(selectedUserQuestionIds);
            } else {
                sessionRequest.appQuestions = appQuestions
                    .filter(q => selectedAppQuestionIds.has(q.id))
                    .map(q => ({
                        question: q.question,
                        answer: q.answer,
                        difficulty: DIFFICULTY_MAPPING[q.difficulty || 'Medium'],
                        topic: q.topic,
                        additionalInfo: q.additionalInfo,
                        externalId: q.id,
                        source: q.source,
                    }));
            }

            const sessionResult = await startQuizSession(sessionRequest).unwrap();

            Alert.alert(
                'Quest Created!',
                'Your multimedia WWW Quest has been created successfully.',
                [
                    {
                        text: 'Start Game',
                        onPress: () => navigation.navigate('WWWGamePlay', {
                            sessionId: sessionResult.sessionId,
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
                                size={24}
                                color="#007AFF"
                            />
                            <Text style={styles.mediaFileName}>{item.mediaFile.name}</Text>
                            <TouchableOpacity onPress={() => removeMediaFromQuestion(index)}>
                                <MaterialCommunityIcons name="close" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            <TextInput
                style={styles.customQuestionInput}
                placeholder="Enter your question..."
                value={item.question}
                onChangeText={(text) => updateCustomQuestion(index, 'question', text)}
                multiline
            />
            <TextInput
                style={styles.customQuestionInput}
                placeholder="Enter the answer..."
                value={item.answer}
                onChangeText={(text) => updateCustomQuestion(index, 'answer', text)}
            />
            <TextInput
                style={styles.customQuestionInput}
                placeholder="Topic (optional)"
                value={item.topic || ''}
                onChangeText={(text) => updateCustomQuestion(index, 'topic', text)}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Create WWW Quest</Text>
                        <Text style={styles.subtitle}>Set up your multimedia quiz challenge</Text>
                    </View>

                    {/* Basic Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quest Details</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Quest Title"
                            value={title}
                            onChangeText={setTitle}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Description"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Reward"
                            value={reward}
                            onChangeText={setReward}
                        />
                    </View>

                    {/* Game Settings */}
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
                                size={20}
                                color="#007AFF"
                            />
                            <Text style={styles.toggleText}>Enable AI Host</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Question Source Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Question Source</Text>
                        <View style={styles.radioGroup}>
                            <TouchableOpacity
                                style={styles.radioOption}
                                onPress={() => setQuestionSource('app')}
                            >
                                <MaterialCommunityIcons
                                    name={questionSource === 'app' ? 'radio-button-checked' : 'radio-button-unchecked'}
                                    size={20}
                                    color="#007AFF"
                                />
                                <Text style={styles.radioText}>App Questions</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.radioOption}
                                onPress={() => setQuestionSource('user')}
                            >
                                <MaterialCommunityIcons
                                    name={questionSource === 'user' ? 'radio-button-checked' : 'radio-button-unchecked'}
                                    size={20}
                                    color="#007AFF"
                                />
                                <Text style={styles.radioText}>Custom Questions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Questions Section */}
                    {questionSource === 'user' && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Custom Questions</Text>
                                <TouchableOpacity style={styles.addButton} onPress={addCustomQuestion}>
                                    <MaterialCommunityIcons name="plus" size={16} color="#007AFF" />
                                    <Text style={styles.addButtonText}>Add Question</Text>
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={newCustomQuestions}
                                keyExtractor={(_, index) => index.toString()}
                                renderItem={renderCustomQuestion}
                                style={styles.questionsList}
                                scrollEnabled={false}
                            />
                        </View>
                    )}

                    {/* Team Setup */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Team Setup</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Team Name"
                            value={teamName}
                            onChangeText={setTeamName}
                        />

                        <Text style={styles.label}>Team Members</Text>
                        <View style={styles.teamMembersContainer}>
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
                                            style={styles.deleteButton}
                                            onPress={() => removeTeamMember(index)}
                                        >
                                            <MaterialCommunityIcons name="minus" size={16} color="#FF3B30" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                            <TouchableOpacity style={styles.addButton} onPress={addTeamMember}>
                                <MaterialCommunityIcons name="plus" size={16} color="#007AFF" />
                                <Text style={styles.addButtonText}>Add Member</Text>
                            </TouchableOpacity>
                        </View>
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
                                styles.createButton,
                                (!canCreateQuest || isLoading) && styles.createButtonDisabled
                            ]}
                            onPress={handleCreateQuest}
                            disabled={!canCreateQuest || isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <>
                                    <ActivityIndicator size="small" color="#FFF" />
                                    <Text style={styles.createButtonText}>Creating...</Text>
                                </>
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="rocket-launch" size={20} color="#FFF" />
                                    <Text style={styles.createButtonText}>Create Quest</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Media Selection Modal */}
                <Modal
                    visible={showMediaModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowMediaModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Add Media to Question</Text>
                                <TouchableOpacity onPress={() => setShowMediaModal(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.mediaOptionsContainer}>
                                <TouchableOpacity
                                    style={styles.mediaOption}
                                    onPress={() => pickMedia('video')}
                                >
                                    <MaterialCommunityIcons name="video" size={32} color="#007AFF" />
                                    <Text style={styles.mediaOptionText}>Video</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.mediaOption}
                                    onPress={() => pickMedia('audio')}
                                >
                                    <MaterialCommunityIcons name="microphone" size={32} color="#007AFF" />
                                    <Text style={styles.mediaOptionText}>Audio</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.mediaOption}
                                    onPress={() => pickMedia('image')}
                                >
                                    <MaterialCommunityIcons name="image" size={32} color="#007AFF" />
                                    <Text style={styles.mediaOptionText}>Image</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    header: {
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1D1D1F',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    section: {
        marginBottom: 24,
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
    customQuestionContainer: {
        backgroundColor: '#FFF',
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
        marginBottom: 8,
    },
    customQuestionNumber: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    customQuestionActions: {
        flexDirection: 'row',
        gap: 8,
    },
    mediaButton: {
        padding: 8,
        backgroundColor: '#F0F8FF',
        borderRadius: 6,
    },
    customQuestionInput: {
        borderWidth: 1,
        borderColor: '#E5E5E7',
        borderRadius: 6,
        padding: 8,
        fontSize: 14,
        marginBottom: 8,
        minHeight: 40,
    },
    mediaPreviewContainer: {
        marginBottom: 8,
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
        backgroundColor: '#F0F8FF',
        borderRadius: 6,
    },
    uploadingText: {
        fontSize: 14,
        color: '#007AFF',
    },
    mediaPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
        backgroundColor: '#E8F5E8',
        borderRadius: 6,
    },
    mediaFileName: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    teamMembersContainer: {
        marginTop: 8,
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
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 8,
    },
    addButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
    },
    deleteButton: {
        padding: 8,
    },
    summaryCard: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E5E7',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    createButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
    },
    createButtonDisabled: {
        backgroundColor: '#999',
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    questionsList: {
        maxHeight: 400,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
        maxHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    mediaOptionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
    },
    mediaOption: {
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F5F5F7',
        minWidth: 80,
    },
    mediaOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
});

export default CreateWWWQuestScreen;