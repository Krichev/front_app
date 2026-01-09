// src/screens/components/CreateQuestionWithMedia.tsx
import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Picker} from '@react-native-picker/picker';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import DocumentPicker from 'react-native-document-picker';
import FileService, {ProcessedFileInfo} from "../../services/speech/FileService";
import MediaUploadService from "../../services/media/MediaUploadService";
import {QuestionService, UserQuestion} from '../../services/wwwGame/questionService';
import {
    getVisibilityDescription,
    getVisibilityLabel,
    QuestionVisibility
} from "../../entities/QuizState/model/types/question.types.ts";
import {getVisibilityIcon} from "../../entities/ChallengeState/model/types.ts";
import {TopicTreeSelector} from '../../shared/ui/TopicSelector';
import {SelectableTopic} from '../../entities/TopicState';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type RootStackParamList = {
    UserQuestions: undefined;
    CreateUserQuestion: undefined;
    EditUserQuestion: { question: UserQuestion };
};

type CreateQuestionRouteProp = RouteProp<RootStackParamList, 'CreateUserQuestion' | 'EditUserQuestion'>;
type CreateQuestionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateUserQuestion' | 'EditUserQuestion'>;

/**
 * Media information for uploaded files
 */
export interface MediaInfo {
    mediaId: string | number;
    mediaUrl: string;
    mediaType: string;
    thumbnailUrl?: string;
}

/**
 * Question form data structure
 * This is exported and used by parent components
 */
export interface QuestionFormData {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic: string;
    additionalInfo: string;
    questionType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
    media?: MediaInfo;
    visibility: QuestionVisibility;
}

/**
 * Props for CreateQuestionWithMedia component
 */
interface CreateQuestionWithMediaProps {
    onQuestionSubmit?: (questionData: QuestionFormData) => void;
    onCancel?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CreateQuestionWithMedia: React.FC<CreateQuestionWithMediaProps> = ({
                                                                             onQuestionSubmit,
                                                                             onCancel
                                                                         }) => {
    const route = useRoute<CreateQuestionRouteProp>();
    const navigation = useNavigation<CreateQuestionNavigationProp>();

    // Check if we're editing an existing question
    const isEditing = route.name === 'EditUserQuestion';
    const existingQuestion = isEditing ? route.params?.question : undefined;

    // Form state
    const [questionText, setQuestionText] = useState(existingQuestion?.question || '');
    const [answer, setAnswer] = useState(existingQuestion?.answer || '');
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>(
        existingQuestion?.difficulty || 'MEDIUM'
    );
    const [topic, setTopic] = useState(existingQuestion?.topic || '');
    const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(undefined);
    const [additionalInfo, setAdditionalInfo] = useState(existingQuestion?.additionalInfo || '');
    const [questionType, setQuestionType] = useState<'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO'>('TEXT');
    const [visibility, setVisibility] = useState<QuestionVisibility>(
        (existingQuestion?.visibility as QuestionVisibility) || QuestionVisibility.PRIVATE
    );

    // Handle topic selection
    const handleSelectTopic = (selectedTopic: SelectableTopic | null) => {
        if (selectedTopic) {
            setTopic(selectedTopic.name);
            setSelectedTopicId(selectedTopic.id);
        } else {
            setTopic('');
            setSelectedTopicId(undefined);
        }
    };

    // Media state
    const [selectedMedia, setSelectedMedia] = useState<ProcessedFileInfo | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedMediaInfo, setUploadedMediaInfo] = useState<MediaInfo | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Handle media selection from camera or gallery
     */
    const handleMediaPick = async () => {
        try {
            const result = await FileService.pickImage({
                mediaType: 'mixed',
                allowsEditing: false,
                quality: 0.8,
                maxWidth: 1920,
                maxHeight: 1080,
            });

            if (!result) {
                console.log('Media selection cancelled');
                return;
            }

            const validation = FileService.validateFile(result);
            if (!validation.isValid) {
                Alert.alert('Invalid File', validation.error || 'Please select a valid file');
                return;
            }

            setSelectedMedia(result);
            setUploadedMediaInfo(null);

            // Auto-detect question type based on media
            if (result.isImage) {
                setQuestionType('IMAGE');
            } else if (result.isVideo) {
                setQuestionType('VIDEO');
            }

            console.log('Media selected:', result.name, result.sizeFormatted);
        } catch (error) {
            console.error('Error picking media:', error);
            Alert.alert('Error', 'Failed to select media. Please try again.');
        }
    };

    /**
     * Handle video selection
     */
    const handleVideoPick = async () => {
        try {
            const result = await FileService.pickVideo({
                mediaType: 'video',
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result) {
                console.log('Video selection cancelled');
                return;
            }

            const validation = FileService.validateFile(result);
            if (!validation.isValid) {
                Alert.alert('Invalid File', validation.error || 'Please select a valid video');
                return;
            }

            setSelectedMedia(result);
            setUploadedMediaInfo(null);
            setQuestionType('VIDEO');

            console.log('Video selected:', result.name, result.sizeFormatted);
        } catch (error) {
            console.error('Error picking video:', error);
            Alert.alert('Error', 'Failed to select video. Please try again.');
        }
    };

    /**
     * Handle audio selection
     */
    const handleAudioPick = async () => {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.audio],
                allowMultiSelection: false,
            });

            if (!result || result.length === 0) {
                console.log('Audio selection cancelled');
                return;
            }

            const audioFile = result[0];

            // Create ProcessedFileInfo object compatible with FileService
            const processedAudio: ProcessedFileInfo = {
                uri: audioFile.uri,
                name: audioFile.name || 'audio.mp3',
                type: audioFile.type || 'audio/mpeg',
                size: audioFile.size || 0,
                sizeFormatted: FileService.formatFileSize(audioFile.size || 0),
                isImage: false,
                isVideo: false,
            };

            setSelectedMedia(processedAudio);
            setUploadedMediaInfo(null);
            setQuestionType('AUDIO');

            console.log('Audio selected:', processedAudio.name, processedAudio.sizeFormatted);
        } catch (error: any) {
            if (DocumentPicker.isCancel(error)) {
                console.log('Audio selection cancelled');
            } else {
                console.error('Error picking audio:', error);
                Alert.alert('Error', 'Failed to select audio. Please try again.');
            }
        }
    };

    /**
     * Upload media to server
     */
    const handleUploadMedia = async () => {
        if (!selectedMedia) {
            Alert.alert('No Media', 'Please select media first');
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            const response = await MediaUploadService.uploadQuizMedia(
                selectedMedia,
                `temp_${Date.now()}`,  // ✅ Temporary ID
                (progress) => {
                    setUploadProgress(progress.percentage);
                }
            );

            if (response.success && response.mediaId && response.mediaUrl) {
                const mediaInfo: MediaInfo = {
                    mediaId: response.mediaId,
                    mediaUrl: response.mediaUrl,
                    mediaType: selectedMedia.type || 'unknown',
                    thumbnailUrl: response.thumbnailUrl,
                };

                setUploadedMediaInfo(mediaInfo);
                Alert.alert('Success', 'Media uploaded successfully!');
                console.log('Upload response:', response);
            } else {
                Alert.alert('Upload Failed', response.error || 'Failed to upload media');
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload media. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Validate form before submission
     */
    const validateForm = (): boolean => {
        if (!questionText.trim()) {
            Alert.alert('Validation Error', 'Please enter a question');
            return false;
        }

        if (!answer.trim()) {
            Alert.alert('Validation Error', 'Please enter an answer');
            return false;
        }

        if (questionType !== 'TEXT' && !uploadedMediaInfo && !isEditing) {
            Alert.alert('Validation Error', 'Please upload media first or change question type to TEXT');
            return false;
        }

        return true;
    };

    /**
     * Handle form submission
     */
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditing && existingQuestion) {
                await QuestionService.updateUserQuestion(existingQuestion.id, {
                    question: questionText.trim(),
                    answer: answer.trim(),
                    difficulty,
                    topic: topic.trim() || undefined,
                    additionalInfo: additionalInfo.trim() || undefined,
                    visibility,
                });

                Alert.alert('Success', 'Question updated successfully');
            } else {
                // Create new question
                const questionData: any = {
                    question: questionText.trim(),
                    answer: answer.trim(),
                    difficulty,
                    topic: topic.trim() || undefined,
                    additionalInfo: additionalInfo.trim() || undefined,
                    visibility,
                };

                // Add media info if available
                if (uploadedMediaInfo) {
                    questionData.questionType = questionType;
                    questionData.mediaFileId = uploadedMediaInfo.mediaId;
                }

                // Call the custom handler if provided
                if (onQuestionSubmit) {
                    onQuestionSubmit({
                        ...questionData,
                        media: uploadedMediaInfo || undefined,
                    });
                } else {
                    // Default behavior: save to backend
                    await QuestionService.createUserQuestion(questionData);
                    Alert.alert('Success', 'Question created successfully');
                }
            }

            // Navigate back
            navigation.navigate('UserQuestions');
        } catch (error) {
            console.error('Error saving question:', error);
            Alert.alert('Error', 'Failed to save question. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Remove selected media
     */
    const handleRemoveMedia = () => {
        setSelectedMedia(null);
        setUploadedMediaInfo(null);
        setUploadProgress(0);
    };

    /**
     * Show media selection options
     */
    const showMediaOptions = () => {
        Alert.alert(
            'Select Media Type',
            'Choose the type of media to upload',
            [
                {
                    text: 'Image',
                    onPress: handleMediaPick,
                },
                {
                    text: 'Video',
                    onPress: handleVideoPick,
                },
                {
                    text: 'Audio',
                    onPress: handleAudioPick,
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
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
                        {/* Question Type Selector - Only show when creating new */}
                        {!isEditing && (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Question Type *</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={questionType}
                                        onValueChange={(value) => setQuestionType(value)}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="Text Only" value="TEXT" />
                                        <Picker.Item label="Image Question" value="IMAGE" />
                                        <Picker.Item label="Video Question" value="VIDEO" />
                                        <Picker.Item label="Audio Question" value="AUDIO" />
                                    </Picker>
                                </View>
                            </View>
                        )}

                        {/* Question Text */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Question *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={questionText}
                                onChangeText={setQuestionText}
                                placeholder="Enter your question here..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Answer */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Answer *</Text>
                            <TextInput
                                style={styles.input}
                                value={answer}
                                onChangeText={setAnswer}
                                placeholder="Enter the answer..."
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* Difficulty */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Difficulty *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={difficulty}
                                    onValueChange={(value) => setDifficulty(value)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Easy" value="EASY" />
                                    <Picker.Item label="Medium" value="MEDIUM" />
                                    <Picker.Item label="Hard" value="HARD" />
                                </Picker>
                            </View>
                        </View>

                        {/* Topic */}
                        <View style={styles.formGroup}>
                            <TopicTreeSelector
                                selectedTopicId={selectedTopicId}
                                selectedTopicName={topic}
                                onSelectTopic={handleSelectTopic}
                                allowCreate={true}
                                placeholder="Select or create a topic..."
                                label="Topic (Optional)"
                                required={false}
                            />
                        </View>

                        {/* Visibility / Access Policy */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Who can use this question? *</Text>
                            <Text style={styles.helperText}>
                                Choose who can find and use this question in their quizzes
                            </Text>

                            {[
                                QuestionVisibility.PRIVATE,
                                QuestionVisibility.FRIENDS_FAMILY,
                                QuestionVisibility.PUBLIC
                            ].map((visibilityOption) => (
                                <TouchableOpacity
                                    key={visibilityOption}
                                    style={[
                                        styles.visibilityOption,
                                        visibility === visibilityOption && styles.visibilityOptionSelected
                                    ]}
                                    onPress={() => setVisibility(visibilityOption as QuestionVisibility)}
                                >
                                    <View style={styles.visibilityOptionContent}>
                                        <Text style={styles.visibilityIcon}>
                                            {getVisibilityIcon(visibilityOption as QuestionVisibility)}
                                        </Text>
                                        <View style={styles.visibilityTextContainer}>
                                            <Text style={[
                                                styles.visibilityLabel,
                                                visibility === visibilityOption && styles.visibilityLabelSelected
                                            ]}>
                                                {getVisibilityLabel(visibilityOption as QuestionVisibility)}
                                            </Text>
                                            <Text style={styles.visibilityDescription}>
                                                {getVisibilityDescription(visibilityOption as QuestionVisibility)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.radioButton}>
                                        {visibility === visibilityOption && (
                                            <View style={styles.radioButtonInner}/>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Additional Info */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Additional Info (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={additionalInfo}
                                onChangeText={setAdditionalInfo}
                                placeholder="Any additional context or notes..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={2}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Media Section - Only show if not TEXT type and not editing */}
                        {!isEditing && questionType !== 'TEXT' && (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>
                                    Media ({questionType === 'IMAGE' ? 'Image' : questionType === 'VIDEO' ? 'Video' : 'Audio'}) *
                                </Text>

                                {!selectedMedia ? (
                                    <TouchableOpacity
                                        style={styles.mediaButton}
                                        onPress={showMediaOptions}
                                    >
                                        <MaterialCommunityIcons name="image-plus" size={24} color="#4CAF50" />
                                        <Text style={styles.mediaButtonText}>Select Media</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.mediaPreviewContainer}>
                                        {selectedMedia.isImage && (
                                            <Image
                                                source={{ uri: selectedMedia.uri }}
                                                style={styles.mediaPreview}
                                                resizeMode="cover"
                                            />
                                        )}
                                        {selectedMedia.isVideo && (
                                            <View style={styles.videoPlaceholder}>
                                                <MaterialCommunityIcons name="video" size={48} color="#666" />
                                                <Text style={styles.videoText}>Video Selected</Text>
                                            </View>
                                        )}
                                        {!selectedMedia.isImage && !selectedMedia.isVideo && (
                                            <View style={styles.videoPlaceholder}>
                                                <MaterialCommunityIcons name="music" size={48} color="#666" />
                                                <Text style={styles.videoText}>Audio Selected</Text>
                                            </View>
                                        )}

                                        <View style={styles.mediaInfo}>
                                            <Text style={styles.mediaName} numberOfLines={1}>
                                                {selectedMedia.name}
                                            </Text>
                                            <Text style={styles.mediaSize}>
                                                {selectedMedia.sizeFormatted} • {selectedMedia.isImage ? 'Image' : selectedMedia.isVideo ? 'Video' : 'Audio'}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={handleRemoveMedia}
                                        >
                                            <MaterialCommunityIcons name="close" size={24} color="#f44336" />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Upload Progress */}
                                {isUploading && (
                                    <View style={styles.uploadProgressContainer}>
                                        <Text style={styles.uploadProgressText}>
                                            Uploading... {Math.round(uploadProgress)}%
                                        </Text>
                                        <View style={styles.progressBar}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    { width: `${uploadProgress}%` }
                                                ]}
                                            />
                                        </View>
                                    </View>
                                )}

                                {/* Upload Button */}
                                {selectedMedia && !uploadedMediaInfo && !isUploading && (
                                    <TouchableOpacity
                                        style={styles.uploadButton}
                                        onPress={handleUploadMedia}
                                    >
                                        <MaterialCommunityIcons name="cloud-upload" size={20} color="#fff" />
                                        <Text style={styles.buttonText}>Upload Media</Text>
                                    </TouchableOpacity>
                                )}

                                {/* Success Message */}
                                {uploadedMediaInfo && (
                                    <View style={styles.successContainer}>
                                        <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                                        <Text style={styles.successText}>Media uploaded successfully!</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {isEditing ? 'Update Question' : 'Create Question'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

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
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
    },
    formContainer: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    helperText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fff',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    // Visibility styles
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
        borderColor: '#4CAF50',
        backgroundColor: '#e8f5e9',
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
        color: '#4CAF50',
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
        borderColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
    },
    // Media styles
    mediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 2,
        borderColor: '#4CAF50',
        borderRadius: 8,
        borderStyle: 'dashed',
        gap: 8,
    },
    mediaButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4CAF50',
    },
    mediaPreviewContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        position: 'relative',
    },
    mediaPreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    videoPlaceholder: {
        width: '100%',
        height: 200,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    videoText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
    mediaInfo: {
        marginBottom: 8,
    },
    mediaName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    mediaSize: {
        fontSize: 12,
        color: '#666',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 4,
    },
    uploadProgressContainer: {
        marginTop: 12,
    },
    uploadProgressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F3',
        padding: 14,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    buttonContainer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        marginTop: 12,
    },
    successText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
});

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default CreateQuestionWithMedia;