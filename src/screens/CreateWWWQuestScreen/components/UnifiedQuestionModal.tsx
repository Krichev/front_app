// src/screens/CreateWWWQuestScreen/components/UnifiedQuestionModal.tsx
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
import {launchImageLibrary} from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

interface MediaInfo {
    id: string;
    filename: string;
    url: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO';
}

interface UnifiedQuestionModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (questionData: {
        question: string;
        answer: string;
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        topic: string;
        additionalInfo: string;
        questionType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
        mediaInfo?: MediaInfo;
    }) => void;
    availableTopics: string[];
}

const UnifiedQuestionModal: React.FC<UnifiedQuestionModalProps> = ({
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
    const [selectedMedia, setSelectedMedia] = useState<{
        uri: string;
        type: string;
        name: string;
    } | null>(null);
    const [uploadedMediaInfo, setUploadedMediaInfo] = useState<MediaInfo | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [uploadMedia] = useUploadMediaMutation();

    // Determine question type based on selected media
    const getQuestionType = (): 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' => {
        if (!selectedMedia && !uploadedMediaInfo) {
            return 'TEXT';
        }

        const mediaType = uploadedMediaInfo?.mediaType ||
            (selectedMedia?.type.startsWith('image/') ? 'IMAGE' :
                selectedMedia?.type.startsWith('video/') ? 'VIDEO' :
                    selectedMedia?.type.startsWith('audio/') ? 'AUDIO' : 'TEXT');

        return mediaType as 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
    };

    const handleSelectImage = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
            });

            if (result.assets && result.assets[0]) {
                const asset = result.assets[0];
                setSelectedMedia({
                    uri: asset.uri!,
                    type: asset.type!,
                    name: asset.fileName || 'image.jpg',
                });
                setUploadedMediaInfo(null); // Clear previous upload
            }
        } catch (error) {
            console.error('Error selecting image:', error);
            Alert.alert('Error', 'Failed to select image');
        }
    };

    const handleSelectVideo = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'video',
            });

            if (result.assets && result.assets[0]) {
                const asset = result.assets[0];
                setSelectedMedia({
                    uri: asset.uri!,
                    type: asset.type!,
                    name: asset.fileName || 'video.mp4',
                });
                setUploadedMediaInfo(null);
            }
        } catch (error) {
            console.error('Error selecting video:', error);
            Alert.alert('Error', 'Failed to select video');
        }
    };

    const handleSelectAudio = async () => {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.audio],
            });

            if (result && result[0]) {
                setSelectedMedia({
                    uri: result[0].uri,
                    type: result[0].type || 'audio/mpeg',
                    name: result[0].name || 'audio.mp3',
                });
                setUploadedMediaInfo(null);
            }
        } catch (error) {
            if (!DocumentPicker.isCancel(error)) {
                console.error('Error selecting audio:', error);
                Alert.alert('Error', 'Failed to select audio');
            }
        }
    };

    const handleUploadMedia = async () => {
        if (!selectedMedia) return;

        try {
            setIsUploading(true);
            setUploadProgress(0);

            const formData = new FormData();
            formData.append('file', {
                uri: selectedMedia.uri,
                type: selectedMedia.type,
                name: selectedMedia.name,
            } as any);
            formData.append('category', 'QUIZ_MEDIA');

            // Simulate progress (since RTK Query doesn't provide real progress)
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const response = await uploadMedia(formData).unwrap();

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Determine media type from response
            const mediaType = selectedMedia.type.startsWith('image/') ? 'IMAGE' :
                selectedMedia.type.startsWith('video/') ? 'VIDEO' : 'AUDIO';

            setUploadedMediaInfo({
                id: response.id,
                filename: response.filename,
                url: response.url,
                mediaType,
            });

            Alert.alert('Success', 'Media uploaded successfully!');
        } catch (error) {
            console.error('Error uploading media:', error);
            Alert.alert('Error', 'Failed to upload media. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveMedia = () => {
        setSelectedMedia(null);
        setUploadedMediaInfo(null);
        setUploadProgress(0);
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

        // If media is selected but not uploaded, require upload
        if (selectedMedia && !uploadedMediaInfo) {
            Alert.alert('Error', 'Please upload the selected media before submitting');
            return;
        }

        const questionType = getQuestionType();

        onSubmit({
            question: question.trim(),
            answer: answer.trim(),
            difficulty,
            topic: topic.trim(),
            additionalInfo: additionalInfo.trim(),
            questionType,
            mediaInfo: uploadedMediaInfo || undefined,
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
        setSelectedMedia(null);
        setUploadedMediaInfo(null);
        setUploadProgress(0);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const renderMediaPreview = () => {
        if (uploadedMediaInfo || selectedMedia) {
            const currentType = getQuestionType();

            return (
                <View style={styles.mediaPreviewContainer}>
                    {currentType === 'IMAGE' && selectedMedia && (
                        <Image source={{ uri: selectedMedia.uri }} style={styles.imagePreview} />
                    )}
                    {(currentType === 'VIDEO' || currentType === 'AUDIO') && (
                        <View style={styles.mediaPlaceholder}>
                            <MaterialCommunityIcons
                                name={currentType === 'VIDEO' ? 'video' : 'music'}
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
                        <MaterialCommunityIcons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            );
        }
        return null;
    };

    const currentQuestionType = getQuestionType();

    return (
        <>
            <Modal
                visible={visible}
                transparent={true}
                animationType="slide"
                onRequestClose={handleClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create Question</Text>
                            <TouchableOpacity onPress={handleClose}>
                                <MaterialCommunityIcons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Media Type Badge */}
                            <View style={styles.typeBadgeContainer}>
                                <View style={[
                                    styles.typeBadge,
                                    currentQuestionType !== 'TEXT' && styles.typeBadgeActive
                                ]}>
                                    <MaterialCommunityIcons
                                        name={
                                            currentQuestionType === 'TEXT' ? 'text' :
                                                currentQuestionType === 'IMAGE' ? 'image' :
                                                    currentQuestionType === 'VIDEO' ? 'video' :
                                                        'music'
                                        }
                                        size={16}
                                        color={currentQuestionType !== 'TEXT' ? '#fff' : '#666'}
                                    />
                                    <Text style={[
                                        styles.typeBadgeText,
                                        currentQuestionType !== 'TEXT' && styles.typeBadgeTextActive
                                    ]}>
                                        {currentQuestionType} Question
                                    </Text>
                                </View>
                            </View>

                            {/* Media Selection Buttons */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Add Media (Optional)</Text>
                                <View style={styles.mediaButtonsContainer}>
                                    <TouchableOpacity
                                        style={styles.mediaTypeButton}
                                        onPress={handleSelectImage}
                                        disabled={isUploading}
                                    >
                                        <MaterialCommunityIcons name="image" size={24} color="#007AFF" />
                                        <Text style={styles.mediaTypeButtonText}>Image</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.mediaTypeButton}
                                        onPress={handleSelectVideo}
                                        disabled={isUploading}
                                    >
                                        <MaterialCommunityIcons name="video" size={24} color="#007AFF" />
                                        <Text style={styles.mediaTypeButtonText}>Video</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.mediaTypeButton}
                                        onPress={handleSelectAudio}
                                        disabled={isUploading}
                                    >
                                        <MaterialCommunityIcons name="music" size={24} color="#007AFF" />
                                        <Text style={styles.mediaTypeButtonText}>Audio</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Upload Button */}
                            {selectedMedia && !uploadedMediaInfo && (
                                <View style={styles.inputContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.uploadButton,
                                            isUploading && styles.uploadButtonDisabled,
                                        ]}
                                        onPress={handleUploadMedia}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <>
                                                <ActivityIndicator color="#fff" size="small" />
                                                <Text style={styles.uploadButtonText}>
                                                    Uploading... {uploadProgress}%
                                                </Text>
                                            </>
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons
                                                    name="upload"
                                                    size={20}
                                                    color="#fff"
                                                />
                                                <Text style={styles.uploadButtonText}>
                                                    Upload {currentQuestionType}
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Media Preview */}
                            {renderMediaPreview()}

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
                                    {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                                        <TouchableOpacity
                                            key={diff}
                                            style={[
                                                styles.difficultyChip,
                                                difficulty === diff && styles.difficultyChipSelected,
                                            ]}
                                            onPress={() => setDifficulty(diff)}
                                        >
                                            <Text
                                                style={[
                                                    styles.difficultyChipText,
                                                    difficulty === diff && styles.difficultyChipTextSelected,
                                                ]}
                                            >
                                                {diff}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Topic Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Topic (Optional)</Text>
                                <TouchableOpacity
                                    style={styles.topicSelector}
                                    onPress={() => setShowTopicPicker(true)}
                                >
                                    <Text style={topic ? styles.topicText : styles.topicPlaceholder}>
                                        {topic || 'Select or enter topic'}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.input}
                                    value={topic}
                                    onChangeText={setTopic}
                                    placeholder="Or type custom topic"
                                />
                            </View>

                            {/* Additional Info */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Additional Info (Optional)</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Any extra information about this question"
                                    value={additionalInfo}
                                    onChangeText={setAdditionalInfo}
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>
                        </ScrollView>

                        {/* Footer Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    (!question || !answer) && styles.submitButtonDisabled,
                                ]}
                                onPress={handleSubmit}
                                disabled={!question || !answer}
                            >
                                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Add Question</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Topic Picker Modal */}
            <Modal
                visible={showTopicPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTopicPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '60%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Topic</Text>
                            <TouchableOpacity onPress={() => setShowTopicPicker(false)}>
                                <MaterialCommunityIcons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {availableTopics.map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={styles.topicOption}
                                    onPress={() => {
                                        setTopic(t);
                                        setShowTopicPicker(false);
                                    }}
                                >
                                    <Text style={styles.topicOptionText}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
    },
    typeBadgeContainer: {
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    typeBadgeActive: {
        backgroundColor: '#007AFF',
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    typeBadgeTextActive: {
        color: '#fff',
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
    mediaButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    mediaTypeButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        paddingVertical: 16,
        borderRadius: 8,
        gap: 4,
    },
    mediaTypeButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#007AFF',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#34C759',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    uploadButtonDisabled: {
        backgroundColor: '#ccc',
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    mediaPreviewContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    mediaPlaceholder: {
        width: '100%',
        height: 150,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mediaPlaceholderText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    mediaFileName: {
        marginTop: 4,
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
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 50,
        textAlignVertical: 'top',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
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
    topicSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    topicText: {
        fontSize: 16,
        color: '#333',
    },
    topicPlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    topicOption: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    topicOptionText: {
        fontSize: 16,
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
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
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
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

export default UnifiedQuestionModal;