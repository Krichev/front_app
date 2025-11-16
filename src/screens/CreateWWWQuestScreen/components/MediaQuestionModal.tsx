// src/screens/CreateWWWQuestScreen/components/MediaQuestionModal.tsx
import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {QuestionFormData} from '../hooks/useQuestionsManager';
import FileService, {ProcessedFileInfo} from '../../../services/speech/FileService';
import MediaUploadService from '../../../services/media/MediaUploadService';
import {MediaType, QuestionType} from "../../../services/wwwGame/questionService.ts"; // ✅ Import MediaType enum

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// ❌ REMOVED - Now using MediaType enum from questionService
// export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO';

/**
 * Media information for uploaded files - matches QuestionFormData media type
 */
interface MediaInfo {
    mediaId: string;
    mediaUrl: string;
    mediaType: MediaType; // ✅ Now uses imported enum
    thumbnailUrl?: string;
}

interface MediaQuestionModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (questionData: QuestionFormData) => void;
    availableTopics: string[];
}

// ============================================================================
// COMPONENT
// ============================================================================

const MediaQuestionModal: React.FC<MediaQuestionModalProps> = ({
                                                                   visible,
                                                                   onClose,
                                                                   onSubmit,
                                                                   availableTopics,
                                                               }) => {
    // Form state
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
    const [topic, setTopic] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [questionType, setQuestionType] = useState<QuestionType>('TEXT');
    const [showTopicPicker, setShowTopicPicker] = useState(false);

    // Media state
    const [selectedMedia, setSelectedMedia] = useState<ProcessedFileInfo | null>(null);
    const [uploadedMediaInfo, setUploadedMediaInfo] = useState<MediaInfo | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    /**
     * Convert question type to MediaType enum
     */
    const questionTypeToMediaType = (type: QuestionType): MediaType => {
        switch (type) {
            case 'IMAGE':
                return MediaType.IMAGE; // ✅ Use enum values
            case 'VIDEO':
                return MediaType.VIDEO;
            case 'AUDIO':
                return MediaType.AUDIO;
            default:
                return MediaType.IMAGE; // Fallback
        }
    };

    /**
     * Handle media selection based on question type
     * Automatically uploads after selection from library
     */
    const handleSelectMedia = async () => {
        try {
            switch (questionType) {
                case 'IMAGE':
                    await handleImagePick();
                    break;
                case 'VIDEO':
                    await handleVideoPick();
                    break;
                case 'AUDIO':
                    await handleAudioPick();
                    break;
                default:
                    Alert.alert('Info', 'Please select a media type first (IMAGE, VIDEO, or AUDIO)');
            }
        } catch (error) {
            console.error('Error in handleSelectMedia:', error);
            Alert.alert('Error', 'Failed to select media. Please try again.');
        }
    };

    /**
     * Handle image selection - automatically uploads after selection
     */
    const handleImagePick = async () => {
        try {
            const result = await FileService.pickImage({
                mediaType: 'mixed',
                allowsEditing: false,
                quality: 0.8,
                maxWidth: 1920,
                maxHeight: 1080,
            });

            if (!result) {
                console.log('Image selection cancelled');
                return;
            }

            const validation = FileService.validateFile(result);
            if (!validation.isValid) {
                Alert.alert('Invalid File', validation.error || 'Please select a valid image');
                return;
            }

            setSelectedMedia(result);
            setUploadedMediaInfo(null); // Clear previous upload
            console.log('Image selected:', result.name, result.sizeFormatted);

            // Auto-upload after selection
            await handleUploadMedia(result);
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to select image. Please try again.');
        }
    };

    /**
     * Handle video selection - automatically uploads after selection
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
            console.log('Video selected:', result.name, result.sizeFormatted);

            // Auto-upload after selection
            await handleUploadMedia(result);
        } catch (error) {
            console.error('Error picking video:', error);
            Alert.alert('Error', 'Failed to select video. Please try again.');
        }
    };

    /**
     * Handle audio selection - supports both recording and library
     * Automatically uploads after selection
     */
    const handleAudioPick = async () => {
        try {
            Alert.alert(
                'Audio Source',
                'Choose audio source',
                [
                    {
                        text: 'Record Audio',
                        onPress: async () => {
                            try {
                                const audioFile = await FileService.startRecording();
                                if (audioFile) {
                                    setSelectedMedia(audioFile);
                                    setUploadedMediaInfo(null);
                                    // Auto-upload after recording
                                    await handleUploadMedia(audioFile);
                                }
                            } catch (error) {
                                console.error('Error recording audio:', error);
                                Alert.alert('Error', 'Failed to record audio. Please try again.');
                            }
                        },
                    },
                    {
                        text: 'Select from Library',
                        onPress: async () => {
                            try {
                                const result = await FileService.pickAudio();
                                if (result) {
                                    const validation = FileService.validateFile(result);
                                    if (!validation.isValid) {
                                        Alert.alert('Invalid File', validation.error || 'Please select a valid audio file');
                                        return;
                                    }

                                    setSelectedMedia(result);
                                    setUploadedMediaInfo(null);
                                    console.log('Audio selected:', result.name, result.sizeFormatted);

                                    // Auto-upload after selection
                                    await handleUploadMedia(result);
                                }
                            } catch (error) {
                                console.error('Error selecting audio:', error);
                                Alert.alert('Error', 'Failed to select audio. Please try again.');
                            }
                        },
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                ]
            );
        } catch (error) {
            console.error('Error in handleAudioPick:', error);
            Alert.alert('Error', 'Failed to select audio. Please try again.');
        }
    };

    /**
     * Upload media file to backend with progress tracking
     */
    const handleUploadMedia = async (file: ProcessedFileInfo) => {
        try {
            setIsUploading(true);
            setUploadProgress(0);

            const mediaType = questionTypeToMediaType(questionType);

            console.log('🚀 Starting media upload:', {
                fileName: file.name,
                fileType: file.type,
                mediaType: mediaType,
                fileSize: file.size,
            });

            const uploadResult = await MediaUploadService.uploadQuizMedia(
                file.uri,
                file.name,
                file.type,
                mediaType,
                (progress) => {
                    setUploadProgress(progress);
                    console.log(`📊 Upload progress: ${progress}%`);
                }
            );

            console.log('✅ Media uploaded successfully:', uploadResult);

            const mediaInfo: MediaInfo = {
                mediaId: uploadResult.id,
                mediaUrl: uploadResult.url,
                mediaType: mediaType, // ✅ Uses enum value
                thumbnailUrl: uploadResult.thumbnailUrl,
            };

            setUploadedMediaInfo(mediaInfo);
            Alert.alert('Success', 'Media uploaded successfully!');
        } catch (error) {
            console.error('❌ Error uploading media:', error);
            Alert.alert(
                'Upload Failed',
                'Failed to upload media. Please try again.'
            );
            setSelectedMedia(null);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    /**
     * Remove selected/uploaded media
     */
    const handleRemoveMedia = () => {
        Alert.alert(
            'Remove Media',
            'Are you sure you want to remove this media?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        setSelectedMedia(null);
                        setUploadedMediaInfo(null);
                        setUploadProgress(0);
                    },
                },
            ]
        );
    };

    /**
     * Validate and submit the question
     */
    const handleSubmit = () => {
        // Validate required fields
        if (!question.trim()) {
            Alert.alert('Error', 'Please enter a question');
            return;
        }
        if (!answer.trim()) {
            Alert.alert('Error', 'Please enter an answer');
            return;
        }
        if (!topic.trim()) {
            Alert.alert('Error', 'Please select or enter a topic');
            return;
        }

        // Validate media upload for media questions
        if (questionType !== 'TEXT' && !uploadedMediaInfo) {
            Alert.alert('Error', 'Please select and upload media for this question type');
            return;
        }

        // Submit the question with properly typed data
        const questionData: QuestionFormData = {
            question: question.trim(),
            answer: answer.trim(),
            difficulty,
            topic: topic.trim(),
            additionalInfo: additionalInfo.trim(),
            questionType,
            media: uploadedMediaInfo, // ✅ Now properly typed with MediaType enum
        };

        console.log('📝 Submitting question:', questionData);
        onSubmit(questionData);
        handleReset();
    };

    /**
     * Reset form to initial state
     */
    const handleReset = () => {
        setQuestion('');
        setAnswer('');
        setDifficulty('MEDIUM');
        setTopic('');
        setAdditionalInfo('');
        setQuestionType('TEXT');
        setSelectedMedia(null);
        setUploadedMediaInfo(null);
        setUploadProgress(0);
        setShowTopicPicker(false);
    };

    /**
     * Handle modal close with unsaved changes warning
     */
    const handleClose = () => {
        if (selectedMedia || question || answer || topic || additionalInfo) {
            Alert.alert(
                'Discard Changes?',
                'You have unsaved changes. Are you sure you want to close?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => {
                            handleReset();
                            onClose();
                        },
                    },
                ]
            );
        } else {
            onClose();
        }
    };

    /**
     * Render media preview section
     */
    const renderMediaPreview = () => {
        if (!selectedMedia && !uploadedMediaInfo) return null;

        return (
            <View style={styles.mediaPreviewContainer}>
                {questionType === 'IMAGE' && selectedMedia?.uri ? (
                    <Image
                        source={{uri: selectedMedia.uri}}
                        style={styles.imagePreview}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.mediaPlaceholder}>
                        <MaterialCommunityIcons
                            name={questionType === 'VIDEO' ? 'video' : 'music'}
                            size={48}
                            color="#007AFF"
                        />
                        <Text style={styles.mediaPlaceholderText}>
                            {uploadedMediaInfo ? 'Media Uploaded' : 'Media Selected'}
                        </Text>
                        {selectedMedia && (
                            <Text style={styles.mediaFileName}>{selectedMedia.name}</Text>
                        )}
                    </View>
                )}
                <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={handleRemoveMedia}
                >
                    <MaterialCommunityIcons name="close-circle" size={24} color="#FF3B30"/>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Media Question</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <MaterialCommunityIcons name="close" size={28} color="#333"/>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Question Type Selector */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Question Type</Text>
                            <View style={styles.typeContainer}>
                                {(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'] as const).map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.typeChip,
                                            questionType === type && styles.typeChipSelected,
                                        ]}
                                        onPress={() => {
                                            setQuestionType(type);
                                            // Clear media when switching types
                                            if (type === 'TEXT') {
                                                setSelectedMedia(null);
                                                setUploadedMediaInfo(null);
                                            }
                                        }}
                                        disabled={isUploading}
                                    >
                                        <MaterialCommunityIcons
                                            name={
                                                type === 'TEXT'
                                                    ? 'text'
                                                    : type === 'IMAGE'
                                                        ? 'image'
                                                        : type === 'VIDEO'
                                                            ? 'video'
                                                            : 'music'
                                            }
                                            size={20}
                                            color={questionType === type ? '#fff' : '#007AFF'}
                                        />
                                        <Text
                                            style={[
                                                styles.typeChipText,
                                                questionType === type && styles.typeChipTextSelected,
                                            ]}
                                        >
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Media Selection for non-TEXT questions */}
                        {questionType !== 'TEXT' && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Media *</Text>
                                {!uploadedMediaInfo && (
                                    <TouchableOpacity
                                        style={styles.mediaButton}
                                        onPress={handleSelectMedia}
                                        disabled={isUploading}
                                    >
                                        <MaterialCommunityIcons
                                            name={uploadedMediaInfo ? 'check-circle' : 'folder-open'}
                                            size={24}
                                            color="#007AFF"
                                        />
                                        <Text style={styles.mediaButtonText}>
                                            {selectedMedia
                                                ? `Selected: ${selectedMedia.name}`
                                                : `Select ${questionType}`}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Upload Progress */}
                                {isUploading && (
                                    <View style={styles.uploadContainer}>
                                        <ActivityIndicator size="large" color="#007AFF"/>
                                        <Text style={styles.uploadText}>
                                            Uploading... {uploadProgress}%
                                        </Text>
                                        <View style={styles.progressBar}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    {width: `${uploadProgress}%`},
                                                ]}
                                            />
                                        </View>
                                    </View>
                                )}

                                {/* Media Preview */}
                                {renderMediaPreview()}
                            </View>
                        )}

                        {/* Question Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Question *</Text>
                            <TextInput
                                style={[styles.textInput, styles.questionInput]}
                                placeholder="Enter your question"
                                value={question}
                                onChangeText={setQuestion}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Answer Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Answer *</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter the correct answer"
                                value={answer}
                                onChangeText={setAnswer}
                            />
                        </View>

                        {/* Difficulty Selector */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Difficulty *</Text>
                            <View style={styles.difficultyContainer}>
                                {(['EASY', 'MEDIUM', 'HARD'] as const).map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[
                                            styles.difficultyChip,
                                            difficulty === level && styles.difficultyChipSelected,
                                        ]}
                                        onPress={() => setDifficulty(level)}
                                        disabled={isUploading}
                                    >
                                        <Text
                                            style={[
                                                styles.difficultyText,
                                                difficulty === level && styles.difficultyTextSelected,
                                            ]}
                                        >
                                            {level}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Topic Input/Picker */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Topic *</Text>
                            {availableTopics.length > 0 ? (
                                <View>
                                    <TouchableOpacity
                                        style={styles.topicPicker}
                                        onPress={() => setShowTopicPicker(!showTopicPicker)}
                                    >
                                        <Text style={styles.topicPickerText}>
                                            {topic || 'Select or enter topic'}
                                        </Text>
                                        <MaterialCommunityIcons
                                            name={showTopicPicker ? 'chevron-up' : 'chevron-down'}
                                            size={24}
                                            color="#666"
                                        />
                                    </TouchableOpacity>
                                    {showTopicPicker && (
                                        <View style={styles.topicList}>
                                            {availableTopics.map((t) => (
                                                <TouchableOpacity
                                                    key={t}
                                                    style={styles.topicItem}
                                                    onPress={() => {
                                                        setTopic(t);
                                                        setShowTopicPicker(false);
                                                    }}
                                                >
                                                    <Text style={styles.topicItemText}>{t}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ) : null}
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter topic"
                                value={topic}
                                onChangeText={setTopic}
                            />
                        </View>

                        {/* Additional Info */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Additional Info (Optional)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Any hints or additional context"
                                value={additionalInfo}
                                onChangeText={setAdditionalInfo}
                                multiline
                                numberOfLines={2}
                            />
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleClose}
                                disabled={isUploading}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    isUploading && styles.submitButtonDisabled,
                                ]}
                                onPress={handleSubmit}
                                disabled={isUploading}
                            >
                                <Text style={styles.submitButtonText}>
                                    {isUploading ? 'Uploading...' : 'Add Question'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fff',
    },
    questionInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    typeChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        backgroundColor: '#fff',
    },
    typeChipSelected: {
        backgroundColor: '#007AFF',
    },
    typeChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    typeChipTextSelected: {
        color: '#fff',
    },
    mediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        backgroundColor: '#f0f8ff',
    },
    mediaButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    uploadContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        marginTop: 10,
    },
    uploadText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    progressBar: {
        width: '100%',
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        marginTop: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 3,
    },
    mediaPreviewContainer: {
        marginTop: 10,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    mediaPlaceholder: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
    },
    mediaPlaceholderText: {
        marginTop: 10,
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    mediaFileName: {
        marginTop: 5,
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    removeMediaButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    difficultyContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    difficultyChip: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    difficultyChipSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    difficultyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    difficultyTextSelected: {
        color: '#fff',
    },
    topicPicker: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    topicPickerText: {
        fontSize: 16,
        color: '#333',
    },
    topicList: {
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    topicItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    topicItemText: {
        fontSize: 16,
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    submitButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default MediaQuestionModal;