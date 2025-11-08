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
import {QuestionFormData, QuestionType} from '../hooks/useQuestionsManager';
import FileService, {ProcessedFileInfo} from '../../../services/speech/FileService';
import MediaUploadService from '../../../services/media/MediaUploadService';

interface MediaQuestionModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (questionData: QuestionFormData) => void;
    availableTopics: string[];
}

interface MediaInfo {
    mediaId?: string;
    mediaUrl?: string;
    mediaType?: string;
    thumbnailUrl?: string;
}

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
     * Handle media selection based on question type
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
     * Handle image selection
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
            console.log('Video selected:', result.name, result.sizeFormatted);

            // Auto-upload after selection
            await handleUploadMedia(result);
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
            // Show options for audio: Record or Pick from library
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
                                    await handleUploadMedia(audioFile);
                                }
                            } catch (error) {
                                console.error('Error recording audio:', error);
                                Alert.alert('Error', 'Failed to record audio. Please try again.');
                            }
                        },
                    },
                    {
                        text: 'Choose from Library',
                        onPress: () => {
                            Alert.alert(
                                'Coming Soon',
                                'Audio file picker from library is not yet implemented. Please use recording for now.'
                            );
                        },
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                ]
            );
        } catch (error) {
            console.error('Error handling audio:', error);
            Alert.alert('Error', 'Failed to handle audio. Please try again.');
        }
    };
    
    /**
     * Upload media to server
     */
    const handleUploadMedia = async (media: ProcessedFileInfo) => {
        if (!media) {
            Alert.alert('No Media', 'Please select media first');
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            const response = await MediaUploadService.uploadQuizMedia(
                media,
                `temp_${Date.now()}`, // Temporary ID until question is saved
                (progress) => {
                    setUploadProgress(progress.percentage);
                    console.log(`Upload progress: ${progress.percentage}%`);
                }
            );

            if (response.success && response.mediaId && response.mediaUrl) {
                const mediaInfo: MediaInfo = {
                    mediaId: response.mediaId,
                    mediaUrl: response.mediaUrl,
                    mediaType: media.type || 'unknown',
                    thumbnailUrl: response.thumbnailUrl,
                };

                setUploadedMediaInfo(mediaInfo);
                Alert.alert('Success', 'Media uploaded successfully!');
                console.log('Upload response:', response);
            } else {
                Alert.alert('Upload Failed', response.error || 'Failed to upload media');
                setSelectedMedia(null);
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload media. Please try again.');
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

    const handleSubmit = () => {
        if (!question.trim()) {
            Alert.alert('Error', 'Please enter a question');
            return;
        }
        if (!answer.trim()) {
            Alert.alert('Error', 'Please enter an answer');
            return;
        }

        // If media type is selected but no media uploaded
        if (questionType !== 'TEXT' && !uploadedMediaInfo) {
            Alert.alert(
                'No Media',
                'You selected a media question type but haven\'t uploaded any media. Do you want to continue as a text question?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Continue as Text',
                        onPress: () => submitQuestion('TEXT'),
                    },
                ]
            );
            return;
        }

        submitQuestion(questionType);
    };

    const submitQuestion = (finalQuestionType: QuestionType) => {
        onSubmit({
            question: question.trim(),
            answer: answer.trim(),
            difficulty,
            topic: topic.trim(),
            additionalInfo: additionalInfo.trim(),
            questionType: finalQuestionType,
            media: uploadedMediaInfo
                ? {
                    mediaUrl: uploadedMediaInfo.mediaUrl,
                    mediaType: uploadedMediaInfo.mediaType,
                    mediaId: uploadedMediaInfo.mediaId,
                    thumbnailUrl: uploadedMediaInfo.thumbnailUrl,
                }
                : undefined,
        });

        // Reset form
        resetForm();
    };

    const resetForm = () => {
        setQuestion('');
        setAnswer('');
        setDifficulty('MEDIUM');
        setTopic('');
        setAdditionalInfo('');
        setQuestionType('TEXT');
        setSelectedMedia(null);
        setUploadedMediaInfo(null);
        setUploadProgress(0);
        setIsUploading(false);
    };

    const handleClose = () => {
        if (selectedMedia || uploadedMediaInfo) {
            Alert.alert(
                'Discard Changes?',
                'You have unsaved media. Are you sure you want to close?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => {
                            resetForm();
                            onClose();
                        },
                    },
                ]
            );
        } else {
            resetForm();
            onClose();
        }
    };

    /**
     * Render media preview based on type
     */
    const renderMediaPreview = () => {
        if (isUploading) {
            return (
                <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF"/>
                    <Text style={styles.uploadingText}>
                        Uploading... {uploadProgress}%
                    </Text>
                </View>
            );
        }

        if (!uploadedMediaInfo && !selectedMedia) {
            return null;
        }

        return (
            <View style={styles.mediaPreviewContainer}>
                {questionType === 'IMAGE' && uploadedMediaInfo?.mediaUrl ? (
                    <Image
                        source={{uri: uploadedMediaInfo.mediaUrl}}
                        style={styles.imagePreview}
                        resizeMode="cover"
                    />
                ) : questionType === 'IMAGE' && selectedMedia ? (
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
                                            color={questionType === type ? '#fff' : '#666'}
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

                        {/* Media Upload Section */}
                        {questionType !== 'TEXT' && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Media</Text>

                                {/* Upload Button */}
                                {!uploadedMediaInfo && !isUploading && (
                                    <TouchableOpacity
                                        style={styles.mediaButton}
                                        onPress={handleSelectMedia}
                                    >
                                        <MaterialCommunityIcons
                                            name="upload"
                                            size={24}
                                            color="#007AFF"
                                        />
                                        <Text style={styles.mediaButtonText}>
                                            {selectedMedia
                                                ? `Change ${questionType}`
                                                : `Upload ${questionType}`}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Media Preview */}
                                {renderMediaPreview()}
                            </View>
                        )}

                        {/* Question Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Question *</Text>
                            <TextInput
                                style={styles.textInput}
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
                                placeholder="Enter the answer"
                                value={answer}
                                onChangeText={setAnswer}
                                multiline
                                numberOfLines={2}
                            />
                        </View>

                        {/* Difficulty Selector */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Difficulty</Text>
                            <View style={styles.difficultyContainer}>
                                {(['EASY', 'MEDIUM', 'HARD'] as const).map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[
                                            styles.difficultyChip,
                                            difficulty === level && styles.difficultyChipSelected,
                                        ]}
                                        onPress={() => setDifficulty(level)}
                                    >
                                        <Text
                                            style={[
                                                styles.difficultyChipText,
                                                difficulty === level &&
                                                styles.difficultyChipTextSelected,
                                            ]}
                                        >
                                            {level}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Topic Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Topic (Optional)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g., History, Science, Movies"
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

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
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
        fontSize: 14,
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
        minHeight: 50,
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
        backgroundColor: '#f5f5f5',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        gap: 6,
    },
    typeChipSelected: {
        backgroundColor: '#007AFF',
    },
    typeChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    typeChipTextSelected: {
        color: '#fff',
    },
    mediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f8ff',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
        gap: 10,
    },
    mediaButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    uploadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        marginTop: 10,
    },
    uploadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    mediaPlaceholderText: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    mediaFileName: {
        marginTop: 5,
        fontSize: 12,
        color: '#999',
    },
    removeMediaButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 2,
    },
    difficultyContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    difficultyChip: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        paddingVertical: 12,
        borderRadius: 8,
    },
    difficultyChipSelected: {
        backgroundColor: '#34C759',
    },
    difficultyChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    difficultyChipTextSelected: {
        color: '#fff',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
        marginBottom: 20,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    submitButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 8,
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