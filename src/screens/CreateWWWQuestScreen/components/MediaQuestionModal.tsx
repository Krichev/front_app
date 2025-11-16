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
import MediaUploadService, {MediaUploadResponse} from '../../../services/media/MediaUploadService';
import {MediaType, QuestionType} from "../../../services/wwwGame/questionService.ts";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Media information for uploaded files - matches QuestionFormData media type
 */
interface MediaInfo {
    mediaId: string;
    mediaUrl: string;
    mediaType: MediaType;
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
    const [showTopicPicker, setShowTopicPicker] = useState(false);

    // Media state
    const [selectedMedia, setSelectedMedia] = useState<ProcessedFileInfo | undefined>(undefined);
    const [uploadedMediaInfo, setUploadedMediaInfo] = useState<MediaInfo | undefined>(undefined);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    /**
     * Determine question type based on selected media (IMPLICIT)
     * Returns TEXT if no media selected
     */
    const getQuestionType = (): QuestionType => {
        if (!selectedMedia && !uploadedMediaInfo) {
            return 'TEXT';
        }

        // Check uploaded media first
        if (uploadedMediaInfo) {
            return uploadedMediaInfo.mediaType as QuestionType;
        }

        // Otherwise detect from selected file
        if (selectedMedia) {
            if (selectedMedia.type.startsWith('image/')) {
                return 'IMAGE';
            } else if (selectedMedia.type.startsWith('video/')) {
                return 'VIDEO';
            } else if (selectedMedia.type.startsWith('audio/')) {
                return 'AUDIO';
            }
        }

        return 'TEXT';
    };

    /**
     * Convert question type to MediaType enum
     */
    const questionTypeToMediaType = (type: QuestionType): MediaType => {
        switch (type) {
            case 'IMAGE':
                return MediaType.IMAGE;
            case 'VIDEO':
                return MediaType.VIDEO;
            case 'AUDIO':
                return MediaType.AUDIO;
            default:
                return MediaType.IMAGE;
        }
    };

    /**
     * Handle media selection based on type
     */
    const handleSelectMedia = async (type: 'image' | 'video' | 'audio') => {
        try {
            switch (type) {
                case 'image':
                    await handleImagePick();
                    break;
                case 'video':
                    await handleVideoPick();
                    break;
                case 'audio':
                    await handleAudioPick();
                    break;
            }
        } catch (error) {
            console.error('Error in handleSelectMedia:', error);
            Alert.alert('Error', 'Failed to select media. Please try again.');
        }
    };

    /**
     * Handle image picking from library
     */
    const handleImagePick = async () => {
        try {
            const result = await FileService.pickImage();
            if (result) {
                console.log('📷 Image selected:', result.name);
                setSelectedMedia(result);
                // Clear any previously uploaded media
                setUploadedMediaInfo(undefined);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    /**
     * Handle video picking from library
     */
    const handleVideoPick = async () => {
        try {
            const result = await FileService.pickVideo();
            if (result) {
                console.log('🎥 Video selected:', result.name);
                setSelectedMedia(result);
                // Clear any previously uploaded media
                setUploadedMediaInfo(undefined);
            }
        } catch (error) {
            console.error('Error picking video:', error);
            Alert.alert('Error', 'Failed to pick video. Please try again.');
        }
    };

    /**
     * Handle audio picking from library
     */
    const handleAudioPick = async () => {
        try {
            const result = await FileService.pickAudio();
            if (result) {
                console.log('🎵 Audio selected:', result.name);
                setSelectedMedia(result);
                // Clear any previously uploaded media
                setUploadedMediaInfo(undefined);
            }
        } catch (error) {
            console.error('Error picking audio:', error);
            Alert.alert('Error', 'Failed to pick audio. Please try again.');
        }
    };

    /**
     * Upload media file to backend with progress tracking
     */
    const uploadMedia = async (file: ProcessedFileInfo): Promise<MediaInfo> => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('🚀 Starting media upload:', {
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                });

                const uploadResult: MediaUploadResponse = await MediaUploadService.uploadQuizMedia(
                    file,
                    undefined, // questionId - optional, not needed for new questions
                    (progress) => {
                        const percentage = Math.round((progress.loaded / progress.total) * 100);
                        setUploadProgress(percentage);
                        console.log(`📊 Upload progress: ${percentage}%`);
                    }
                );

                console.log('✅ Media uploaded successfully:', uploadResult);

                // Ensure the upload was successful and has required fields
                if (!uploadResult.success || !uploadResult.mediaId || !uploadResult.mediaUrl) {
                    throw new Error(uploadResult.error || 'Upload failed - missing required fields');
                }

                const questionType = getQuestionType();
                const mediaType = questionTypeToMediaType(questionType);

                const mediaInfo: MediaInfo = {
                    mediaId: uploadResult.mediaId,
                    mediaUrl: uploadResult.mediaUrl,
                    mediaType: mediaType,
                    thumbnailUrl: uploadResult.thumbnailUrl,
                };

                resolve(mediaInfo);
            } catch (error) {
                console.error('❌ Error uploading media:', error);
                reject(error);
            }
        });
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
                        setSelectedMedia(undefined);
                        setUploadedMediaInfo(undefined);
                        setUploadProgress(0);
                    },
                },
            ]
        );
    };

    /**
     * Validate and submit the question
     * Automatically uploads media if selected but not yet uploaded
     */
    const handleSubmit = async () => {
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

        const questionType = getQuestionType();

        try {
            let finalMediaInfo = uploadedMediaInfo;

            // If media is selected but not uploaded yet, upload it now
            if (selectedMedia && !uploadedMediaInfo) {
                setIsUploading(true);
                console.log('📤 Auto-uploading media before saving question...');

                try {
                    finalMediaInfo = await uploadMedia(selectedMedia);
                    setUploadedMediaInfo(finalMediaInfo);
                    console.log('✅ Media auto-upload completed successfully');
                } catch (uploadError) {
                    console.error('❌ Auto-upload failed:', uploadError);
                    Alert.alert(
                        'Upload Failed',
                        uploadError instanceof Error
                            ? uploadError.message
                            : 'Failed to upload media. Please try again.'
                    );
                    setIsUploading(false);
                    setUploadProgress(0);
                    return; // Abort save if upload fails
                }
            }

            // Submit the question with properly typed data
            const questionData: QuestionFormData = {
                question: question.trim(),
                answer: answer.trim(),
                difficulty,
                topic: topic.trim(),
                additionalInfo: additionalInfo.trim(),
                questionType,
                media: finalMediaInfo,
            };

            console.log('📝 Submitting question:', questionData);
            onSubmit(questionData);

            // Reset form after successful submission
            handleReset();
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
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
        setSelectedMedia(undefined);
        setUploadedMediaInfo(undefined);
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
        if (!selectedMedia && !uploadedMediaInfo) {
            return null;
        }

        const currentQuestionType = getQuestionType();

        return (
            <View style={styles.mediaPreviewContainer}>
                <Text style={styles.sectionTitle}>Media Preview</Text>

                {/* Image Preview */}
                {currentQuestionType === 'IMAGE' && selectedMedia && (
                    <Image
                        source={{uri: selectedMedia.uri}}
                        style={styles.imagePreview}
                        resizeMode="contain"
                    />
                )}

                {/* Video/Audio Placeholder */}
                {(currentQuestionType === 'VIDEO' || currentQuestionType === 'AUDIO') && (
                    <View style={styles.mediaPlaceholder}>
                        <MaterialCommunityIcons
                            name={currentQuestionType === 'VIDEO' ? 'video' : 'music'}
                            size={48}
                            color="#007AFF"
                        />
                        <Text style={styles.mediaPlaceholderText}>
                            {uploadedMediaInfo ? 'Media Ready' : selectedMedia?.name}
                        </Text>
                        {selectedMedia && (
                            <Text style={styles.mediaFileSize}>
                                {(selectedMedia.size / 1024 / 1024).toFixed(2)} MB
                            </Text>
                        )}
                    </View>
                )}

                {/* Upload Progress - shown during save */}
                {isUploading && (
                    <View style={styles.progressContainer}>
                        <ActivityIndicator size="small" color="#007AFF" />
                        <Text style={styles.progressText}>Uploading: {uploadProgress}%</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, {width: `${uploadProgress}%`}]}/>
                        </View>
                    </View>
                )}

                {/* Upload Status */}
                {uploadedMediaInfo && !isUploading && (
                    <View style={styles.uploadedBadge}>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50"/>
                        <Text style={styles.uploadedText}>Media Ready</Text>
                    </View>
                )}

                {/* Remove Button */}
                {!isUploading && (
                    <TouchableOpacity
                        style={styles.removeMediaButton}
                        onPress={handleRemoveMedia}
                    >
                        <MaterialCommunityIcons name="delete" size={20} color="#FF3B30"/>
                        <Text style={styles.removeMediaText}>Remove Media</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} disabled={isUploading}>
                        <MaterialCommunityIcons name="close" size={24} color="#007AFF"/>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Question</Text>
                    <TouchableOpacity onPress={handleSubmit} disabled={isUploading}>
                        {isUploading ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <Text style={styles.saveButton}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Media Selection - Inline Buttons */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Add Media (Optional)</Text>
                        <View style={styles.mediaButtonsContainer}>
                            <TouchableOpacity
                                style={styles.mediaButton}
                                onPress={() => handleSelectMedia('image')}
                                disabled={isUploading}
                            >
                                <MaterialCommunityIcons name="image" size={24} color="#007AFF" />
                                <Text style={styles.mediaButtonText}>Image</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.mediaButton}
                                onPress={() => handleSelectMedia('video')}
                                disabled={isUploading}
                            >
                                <MaterialCommunityIcons name="video" size={24} color="#007AFF" />
                                <Text style={styles.mediaButtonText}>Video</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.mediaButton}
                                onPress={() => handleSelectMedia('audio')}
                                disabled={isUploading}
                            >
                                <MaterialCommunityIcons name="music" size={24} color="#007AFF" />
                                <Text style={styles.mediaButtonText}>Audio</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Media Status Text */}
                        {(selectedMedia || uploadedMediaInfo) && (
                            <View style={styles.mediaStatusBadge}>
                                <MaterialCommunityIcons
                                    name={uploadedMediaInfo ? "check-circle" : "file-upload"}
                                    size={16}
                                    color={uploadedMediaInfo ? "#4CAF50" : "#007AFF"}
                                />
                                <Text style={[
                                    styles.mediaStatusText,
                                    uploadedMediaInfo && styles.mediaStatusTextUploaded
                                ]}>
                                    {uploadedMediaInfo
                                        ? `${getQuestionType()} Question Ready`
                                        : `${getQuestionType()} Selected (will upload on save)`}
                                </Text>
                            </View>
                        )}

                        {/* Media Preview */}
                        {renderMediaPreview()}
                    </View>

                    {/* Question Field */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Question *</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter your question..."
                            placeholderTextColor="#999"
                            value={question}
                            onChangeText={setQuestion}
                            multiline
                            numberOfLines={3}
                            editable={!isUploading}
                        />
                    </View>

                    {/* Answer Field */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Answer *</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter the correct answer..."
                            placeholderTextColor="#999"
                            value={answer}
                            onChangeText={setAnswer}
                            multiline
                            numberOfLines={2}
                            editable={!isUploading}
                        />
                    </View>

                    {/* Difficulty Selector */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Difficulty *</Text>
                        <View style={styles.difficultyContainer}>
                            {(['EASY', 'MEDIUM', 'HARD'] as const).map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.difficultyButton,
                                        difficulty === level && styles.difficultyButtonActive,
                                    ]}
                                    onPress={() => setDifficulty(level)}
                                    disabled={isUploading}
                                >
                                    <Text
                                        style={[
                                            styles.difficultyText,
                                            difficulty === level && styles.difficultyTextActive,
                                        ]}
                                    >
                                        {level}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Topic Field */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Topic *</Text>
                        <View style={styles.topicInputContainer}>
                            <TextInput
                                style={styles.topicInput}
                                placeholder="Enter or select a topic..."
                                placeholderTextColor="#999"
                                value={topic}
                                onChangeText={setTopic}
                                editable={!isUploading}
                            />
                            {availableTopics.length > 0 && (
                                <TouchableOpacity
                                    style={styles.topicPickerButton}
                                    onPress={() => setShowTopicPicker(!showTopicPicker)}
                                    disabled={isUploading}
                                >
                                    <MaterialCommunityIcons
                                        name={showTopicPicker ? 'chevron-up' : 'chevron-down'}
                                        size={24}
                                        color="#007AFF"
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Topic Picker */}
                        {showTopicPicker && availableTopics.length > 0 && (
                            <View style={styles.topicPicker}>
                                <ScrollView style={styles.topicPickerScroll}>
                                    {availableTopics.map((topicOption, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.topicOption}
                                            onPress={() => {
                                                setTopic(topicOption);
                                                setShowTopicPicker(false);
                                            }}
                                            disabled={isUploading}
                                        >
                                            <Text style={styles.topicOptionText}>{topicOption}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    {/* Additional Info Field */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Info (Optional)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Add any helpful context or hints..."
                            placeholderTextColor="#999"
                            value={additionalInfo}
                            onChangeText={setAdditionalInfo}
                            multiline
                            numberOfLines={3}
                            editable={!isUploading}
                        />
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    saveButton: {
        fontSize: 17,
        fontWeight: '600',
        color: '#007AFF',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        backgroundColor: '#FFF',
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        marginBottom: 12,
    },
    mediaButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    mediaButton: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 8,
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    mediaButtonText: {
        fontSize: 12,
        color: '#007AFF',
        marginTop: 6,
        fontWeight: '500',
    },
    mediaStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F0F8FF',
        borderRadius: 6,
        gap: 6,
    },
    mediaStatusText: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '500',
    },
    mediaStatusTextUploaded: {
        color: '#4CAF50',
    },
    mediaPreviewContainer: {
        marginTop: 16,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: '#F0F0F0',
    },
    mediaPlaceholder: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    mediaPlaceholderText: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    mediaFileSize: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    progressContainer: {
        marginTop: 12,
        alignItems: 'center',
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        marginTop: 8,
    },
    progressBar: {
        width: '100%',
        height: 4,
        backgroundColor: '#E5E5E5',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
    },
    uploadedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
    },
    uploadedText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4CAF50',
        marginLeft: 6,
    },
    removeMediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    removeMediaText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FF3B30',
        marginLeft: 6,
    },
    textInput: {
        fontSize: 15,
        color: '#000',
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        backgroundColor: '#FAFAFA',
        textAlignVertical: 'top',
    },
    difficultyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    difficultyButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        backgroundColor: '#FFF',
        alignItems: 'center',
    },
    difficultyButtonActive: {
        backgroundColor: '#007AFF',
    },
    difficultyText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#007AFF',
    },
    difficultyTextActive: {
        color: '#FFF',
    },
    topicInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    topicInput: {
        flex: 1,
        fontSize: 15,
        color: '#000',
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        backgroundColor: '#FAFAFA',
    },
    topicPickerButton: {
        marginLeft: 8,
        padding: 8,
    },
    topicPicker: {
        marginTop: 8,
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        backgroundColor: '#FFF',
    },
    topicPickerScroll: {
        maxHeight: 200,
    },
    topicOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    topicOptionText: {
        fontSize: 15,
        color: '#000',
    },
});

export default MediaQuestionModal;