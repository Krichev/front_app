// src/screens/components/CreateQuestionWithMedia.tsx
import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Picker} from '@react-native-picker/picker';
import FileService, {ProcessedFileInfo} from "../../services/speech/FileService";
import MediaUploadService from "../../services/media/MediaUploadService";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

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

export const CreateQuestionWithMedia: React.FC<CreateQuestionWithMediaProps> = ({
                                                                                    onQuestionSubmit,
                                                                                    onCancel
                                                                                }) => {
    // Form state
    const [questionText, setQuestionText] = useState('');
    const [answer, setAnswer] = useState('');
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
    const [topic, setTopic] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [questionType, setQuestionType] = useState<'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO'>('TEXT');

    // Media state
    const [selectedMedia, setSelectedMedia] = useState<ProcessedFileInfo | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedMediaInfo, setUploadedMediaInfo] = useState<MediaInfo | null>(null);

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
            setUploadedMediaInfo(null); // Reset uploaded media info when new media is selected

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
     * Handle video selection specifically
     */
    const handleVideoPick = async () => {
        try {
            const result = await FileService.pickVideo({
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
            // You may need to implement pickAudio in FileService
            Alert.alert('Coming Soon', 'Audio selection is not yet implemented');
        } catch (error) {
            console.error('Error picking audio:', error);
            Alert.alert('Error', 'Failed to select audio. Please try again.');
        }
    };

    /**
     * Upload media to server
     */
    const handleUploadMedia = async () => {
        if (!selectedMedia) {
            Alert.alert('No Media', 'Please select a media file first');
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

        if (questionType !== 'TEXT' && !uploadedMediaInfo) {
            Alert.alert('Validation Error', 'Please upload media first or change question type to TEXT');
            return false;
        }

        return true;
    };

    /**
     * Handle form submission
     */
    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        const questionData: QuestionFormData = {
            question: questionText.trim(),
            answer: answer.trim(),
            difficulty,
            topic: topic.trim(),
            additionalInfo: additionalInfo.trim(),
            questionType,
            media: uploadedMediaInfo || undefined,
        };

        onQuestionSubmit?.(questionData);

        // Reset form
        resetForm();
    };

    /**
     * Reset form to initial state
     */
    const resetForm = () => {
        setQuestionText('');
        setAnswer('');
        setDifficulty('MEDIUM');
        setTopic('');
        setAdditionalInfo('');
        setQuestionType('TEXT');
        setSelectedMedia(null);
        setUploadedMediaInfo(null);
        setUploadProgress(0);
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
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Create Question with Media</Text>

            {/* Question Type Selector */}
            <View style={styles.inputGroup}>
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

            {/* Question Text */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Question *</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={questionText}
                    onChangeText={setQuestionText}
                    placeholder="Enter your question here..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                />
            </View>

            {/* Answer */}
            <View style={styles.inputGroup}>
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
            <View style={styles.inputGroup}>
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
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Topic</Text>
                <TextInput
                    style={styles.input}
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="e.g., Science, History, Sports..."
                    placeholderTextColor="#999"
                />
            </View>

            {/* Additional Info */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Additional Info (Optional)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={additionalInfo}
                    onChangeText={setAdditionalInfo}
                    placeholder="Any additional context or notes..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={2}
                />
            </View>

            {/* Media Section - Only show if not TEXT type */}
            {questionType !== 'TEXT' && (
                <View style={styles.inputGroup}>
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

                            <View style={styles.mediaInfo}>
                                <Text style={styles.mediaName} numberOfLines={1}>
                                    {selectedMedia.name}
                                </Text>
                                <Text style={styles.mediaSize}>
                                    {selectedMedia.sizeFormatted} • {selectedMedia.isImage ? 'Image' : 'Video'}
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

                    {/* Upload Success Indicator */}
                    {uploadedMediaInfo && (
                        <View style={styles.successContainer}>
                            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                            <Text style={styles.successText}>Media uploaded successfully!</Text>
                        </View>
                    )}

                    {/* Upload Button - Show only if media selected but not uploaded */}
                    {selectedMedia && !uploadedMediaInfo && !isUploading && (
                        <TouchableOpacity
                            style={[styles.uploadButton]}
                            onPress={handleUploadMedia}
                        >
                            <MaterialCommunityIcons name="cloud-upload" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Upload Media</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                {onCancel && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onCancel}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        isUploading && styles.buttonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="check" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Create Question</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
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
        color: '#333',
        backgroundColor: '#f9f9f9',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    mediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 2,
        borderColor: '#4CAF50',
        borderRadius: 8,
        borderStyle: 'dashed',
        backgroundColor: '#f0f8f0',
    },
    mediaButtonText: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '600',
        marginLeft: 8,
    },
    mediaPreviewContainer: {
        position: 'relative',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f9f9f9',
    },
    mediaPreview: {
        width: '100%',
        height: 200,
        backgroundColor: '#000',
    },
    videoPlaceholder: {
        width: '100%',
        height: 200,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 8,
    },
    mediaInfo: {
        padding: 12,
    },
    mediaName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    mediaSize: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#fff',
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
    actionButtons: {
        gap: 12,
        marginTop: 24,
        marginBottom: 40,
    },
    cancelButton: {
        padding: 14,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        gap: 8,
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