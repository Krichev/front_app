// src/screens/CreateWWWQuestScreen/components/MediaQuestionModal.tsx
import React, {useState} from 'react';
import {Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
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
    const [questionType, setQuestionType] = useState<QuestionType>('TEXT');
    const [showTopicPicker, setShowTopicPicker] = useState(false);

    // Media state - ✅ Changed from null to undefined
    const [selectedMedia, setSelectedMedia] = useState<ProcessedFileInfo | undefined>(undefined);
    const [uploadedMediaInfo, setUploadedMediaInfo] = useState<MediaInfo | undefined>(undefined);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

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
     * Handle image selection and automatic upload
     */
    const handleImagePick = async () => {
        try {
            const result = await FileService.pickImage({
                mediaType: 'mixed',
                allowsEditing: false,
                quality: 0.8,
            });

            if (result) {
                console.log('📸 Image selected:', result);
                setSelectedMedia(result);
                // Automatically upload after selection
                await handleUploadMedia(result);
            }
        } catch (error) {
            console.error('Error in handleImagePick:', error);
            Alert.alert('Error', 'Failed to select image. Please try again.');
        }
    };

    /**
     * Handle video selection and automatic upload
     */
    const handleVideoPick = async () => {
        try {
            const result = await FileService.pickVideo({
                mediaType: 'video',
                allowsEditing: false,
                quality: 0.8,
            });

            if (result) {
                console.log('🎥 Video selected:', result);
                setSelectedMedia(result);
                // Automatically upload after selection
                await handleUploadMedia(result);
            }
        } catch (error) {
            console.error('Error in handleVideoPick:', error);
            Alert.alert('Error', 'Failed to select video. Please try again.');
        }
    };

    /**
     * Handle audio selection with confirmation
     */
    const handleAudioPick = async () => {
        try {
            const result = await FileService.pickAudio();
            if (result) {
                console.log('🎵 Audio selected:', result);
                setSelectedMedia(result);

                Alert.alert(
                    'Audio Selected',
                    `Selected: ${result.name}\nSize: ${(result.size / 1024 / 1024).toFixed(2)} MB\n\nUpload this audio?`,
                    [
                        {
                            text: 'Upload',
                            onPress: async () => {
                                await handleUploadMedia(result);
                            },
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                    ]
                );
            }
        } catch (error) {
            console.error('Error in handleAudioPick:', error);
            Alert.alert('Error', 'Failed to select audio. Please try again.');
        }
    };

    /**
     * ✅ FIXED: Upload media file to backend with progress tracking
     * Now passes the correct parameters to uploadQuizMedia
     */
    const handleUploadMedia = async (file: ProcessedFileInfo) => {
        try {
            setIsUploading(true);
            setUploadProgress(0);

            console.log('🚀 Starting media upload:', {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
            });

            // ✅ FIXED: Call with correct parameters (file object and progress callback)
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

            // ✅ Ensure the upload was successful and has required fields
            if (!uploadResult.success || !uploadResult.mediaId || !uploadResult.mediaUrl) {
                throw new Error(uploadResult.error || 'Upload failed - missing required fields');
            }

            const mediaType = questionTypeToMediaType(questionType);

            const mediaInfo: MediaInfo = {
                mediaId: uploadResult.mediaId,
                mediaUrl: uploadResult.mediaUrl,
                mediaType: mediaType,
                thumbnailUrl: uploadResult.thumbnailUrl,
            };

            setUploadedMediaInfo(mediaInfo);
            Alert.alert('Success', 'Media uploaded successfully!');
        } catch (error) {
            console.error('❌ Error uploading media:', error);
            Alert.alert(
                'Upload Failed',
                error instanceof Error ? error.message : 'Failed to upload media. Please try again.'
            );
            setSelectedMedia(undefined); // ✅ Changed from null to undefined
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
                        setSelectedMedia(undefined); // ✅ Changed from null to undefined
                        setUploadedMediaInfo(undefined); // ✅ Changed from null to undefined
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
            media: uploadedMediaInfo, // ✅ Now properly typed as MediaInfo | undefined
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
        setSelectedMedia(undefined); // ✅ Changed from null to undefined
        setUploadedMediaInfo(undefined); // ✅ Changed from null to undefined
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

        return (
            <View style={styles.mediaPreviewContainer}>
                <Text style={styles.sectionTitle}>Media Preview</Text>

                {/* Image Preview */}
                {questionType === 'IMAGE' && selectedMedia && (
                    <Image
                        source={{uri: selectedMedia.uri}}
                        style={styles.imagePreview}
                        resizeMode="contain"
                    />
                )}

                {/* Video/Audio Placeholder */}
                {(questionType === 'VIDEO' || questionType === 'AUDIO') && (
                    <View style={styles.mediaPlaceholder}>
                        <MaterialCommunityIcons
                            name={questionType === 'VIDEO' ? 'video' : 'music'}
                            size={48}
                            color="#007AFF"
                        />
                        <Text style={styles.mediaPlaceholderText}>
                            {uploadedMediaInfo ? 'Media Uploaded Successfully' : selectedMedia?.name}
                        </Text>
                    </View>
                )}

                {/* Upload Progress */}
                {isUploading && (
                    <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>Uploading: {uploadProgress}%</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, {width: `${uploadProgress}%`}]}/>
                        </View>
                    </View>
                )}

                {/* Upload Status */}
                {uploadedMediaInfo && (
                    <View style={styles.uploadedBadge}>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50"/>
                        <Text style={styles.uploadedText}>Uploaded</Text>
                    </View>
                )}

                {/* Remove Button */}
                <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={handleRemoveMedia}
                    disabled={isUploading}
                >
                    <MaterialCommunityIcons name="delete" size={20} color="#FF3B30"/>
                    <Text style={styles.removeMediaText}>Remove Media</Text>
                </TouchableOpacity>
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
                    <TouchableOpacity onPress={handleClose}>
                        <MaterialCommunityIcons name="close" size={24} color="#007AFF"/>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Media Question</Text>
                    <TouchableOpacity onPress={handleSubmit} disabled={isUploading}>
                        <Text style={[styles.saveButton, isUploading && styles.saveButtonDisabled]}>
                            Save
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Question Type Selector */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Question Type *</Text>
                        <View style={styles.questionTypeContainer}>
                            {(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'] as QuestionType[]).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.questionTypeButton,
                                        questionType === type && styles.questionTypeButtonActive,
                                    ]}
                                    onPress={() => setQuestionType(type)}
                                    disabled={isUploading}
                                >
                                    <MaterialCommunityIcons
                                        name={
                                            type === 'TEXT' ? 'text' :
                                                type === 'IMAGE' ? 'image' :
                                                    type === 'VIDEO' ? 'video' :
                                                        'music'
                                        }
                                        size={24}
                                        color={questionType === type ? '#FFF' : '#007AFF'}
                                    />
                                    <Text
                                        style={[
                                            styles.questionTypeText,
                                            questionType === type && styles.questionTypeTextActive,
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
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Media *</Text>
                            <TouchableOpacity
                                style={styles.selectMediaButton}
                                onPress={handleSelectMedia}
                                disabled={isUploading || !!uploadedMediaInfo}
                            >
                                <MaterialCommunityIcons
                                    name={
                                        questionType === 'IMAGE' ? 'image-plus' :
                                            questionType === 'VIDEO' ? 'video-plus' :
                                                'music-note-plus'
                                    }
                                    size={24}
                                    color={uploadedMediaInfo ? '#4CAF50' : '#007AFF'}
                                />
                                <Text style={styles.selectMediaText}>
                                    {uploadedMediaInfo ? 'Media Uploaded' : `Select ${questionType}`}
                                </Text>
                            </TouchableOpacity>
                            {renderMediaPreview()}
                        </View>
                    )}

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
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter topic or select from suggestions..."
                            placeholderTextColor="#999"
                            value={topic}
                            onChangeText={setTopic}
                            editable={!isUploading}
                        />
                        {availableTopics.length > 0 && (
                            <TouchableOpacity
                                style={styles.showTopicsButton}
                                onPress={() => setShowTopicPicker(!showTopicPicker)}
                            >
                                <Text style={styles.showTopicsText}>
                                    {showTopicPicker ? 'Hide' : 'Show'} available topics
                                </Text>
                            </TouchableOpacity>
                        )}
                        {showTopicPicker && (
                            <View style={styles.topicSuggestions}>
                                {availableTopics.map((suggestedTopic) => (
                                    <TouchableOpacity
                                        key={suggestedTopic}
                                        style={styles.topicChip}
                                        onPress={() => {
                                            setTopic(suggestedTopic);
                                            setShowTopicPicker(false);
                                        }}
                                    >
                                        <Text style={styles.topicChipText}>{suggestedTopic}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Additional Info Field */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Info (Optional)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter additional context or hints..."
                            placeholderTextColor="#999"
                            value={additionalInfo}
                            onChangeText={setAdditionalInfo}
                            multiline
                            numberOfLines={3}
                            editable ={!isUploading}
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
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    saveButton: {
        fontSize: 17,
        color: '#007AFF',
        fontWeight: '600',
    },
    saveButtonDisabled: {
        color: '#999',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        backgroundColor: '#FFF',
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 12,
    },
    questionTypeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    questionTypeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        marginHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        backgroundColor: '#FFF',
    },
    questionTypeButtonActive: {
        backgroundColor: '#007AFF',
    },
    questionTypeText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    questionTypeTextActive: {
        color: '#FFF',
    },
    selectMediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#007AFF',
        backgroundColor: '#F0F8FF',
    },
    selectMediaText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    mediaPreviewContainer: {
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#F8F9FA',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    mediaPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        borderRadius: 8,
        backgroundColor: '#F0F8FF',
    },
    mediaPlaceholderText: {
        marginTop: 8,
        fontSize: 14,
        color: '#007AFF',
    },
    progressContainer: {
        marginTop: 12,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#E5E5EA',
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
        padding: 8,
        marginTop: 12,
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
    },
    uploadedText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    removeMediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        marginTop: 12,
        borderRadius: 8,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    removeMediaText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: '500',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#000',
        backgroundColor: '#FFF',
        textAlignVertical: 'top',
    },
    difficultyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    difficultyButton: {
        flex: 1,
        padding: 12,
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
        color: '#007AFF',
        fontWeight: '500',
    },
    difficultyTextActive: {
        color: '#FFF',
    },
    showTopicsButton: {
        marginTop: 8,
        padding: 8,
    },
    showTopicsText: {
        fontSize: 14,
        color: '#007AFF',
    },
    topicSuggestions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    topicChip: {
        padding: 8,
        marginRight: 8,
        marginBottom: 8,
        borderRadius: 16,
        backgroundColor: '#E5E5EA',
    },
    topicChipText: {
        fontSize: 14,
        color: '#000',
    },
});

export default MediaQuestionModal;