// src/screens/CreateWWWQuestScreen/components/RegularQuestionEditor.tsx
import React, {useCallback, useEffect, useState} from 'react';
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
import {QuestionType} from "../../../services/wwwGame/questionService";
import {TopicTreeSelector} from '../../../shared/ui/TopicSelector';
import {SelectableTopic} from '../../../entities/TopicState';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RegularQuestionEditorProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (questionData: QuestionFormData) => void;
    isSubmitting?: boolean;
    preSelectedMediaType?: 'image' | 'video' | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

const RegularQuestionEditor: React.FC<RegularQuestionEditorProps> = ({
                                                                   visible,
                                                                   onClose,
                                                                   onSubmit,
                                                                   isSubmitting = false,
                                                                   preSelectedMediaType,
                                                               }) => {
    // Form state
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
    const [topic, setTopic] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(undefined);
    const [additionalInfo, setAdditionalInfo] = useState('');

    // Media state
    const [selectedMedia, setSelectedMedia] = useState<ProcessedFileInfo | undefined>(undefined);
    const [isSelectingMedia, setIsSelectingMedia] = useState(false);
    const [mediaSelectionType, setMediaSelectionType] = useState<'image' | 'video' | 'audio' | null>(null);



    /**
     * Determine question type based on selected media (IMPLICIT)
     * Returns TEXT if no media selected
     */
    const getQuestionType = (): QuestionType => {
        if (!selectedMedia) {
            return 'TEXT';
        }

        // Detect from selected file type
        if (selectedMedia.type.startsWith('image/')) {
            return 'IMAGE';
        } else if (selectedMedia.type.startsWith('video/')) {
            return 'VIDEO';
        } else if (selectedMedia.type.startsWith('audio/')) {
            return 'AUDIO';
        }

        return 'TEXT';
    };

    /**
     * Handle image picking from library
     */
    const handleImagePick = useCallback(async () => {
        try {
            setIsSelectingMedia(true);
            setMediaSelectionType('image');
            const result = await FileService.pickImage();
            if (result) {
                // Validate file
                const validation = FileService.validateFile(result);
                if (!validation.isValid) {
                    Alert.alert('Invalid File', validation.error || 'Please select a valid image');
                    return;
                }
                console.log('📷 Image selected:', result.name, result.sizeFormatted);
                setSelectedMedia(result);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        } finally {
            setIsSelectingMedia(false);
            setMediaSelectionType(null);
        }
    }, []);

    /**
     * Handle video picking from library
     */
    const handleVideoPick = useCallback(async () => {
        try {
            console.log('🎥 Video start');
            setIsSelectingMedia(true);
            setMediaSelectionType('video');
            const result = await FileService.pickVideo();
            if (result) {
                // Validate file
                const validation = FileService.validateFile(result);
                if (!validation.isValid) {
                    Alert.alert('Invalid File', validation.error || 'Please select a valid video');
                    return;
                }
                console.log('🎥 Video selected:', result.name, result.sizeFormatted);
                setSelectedMedia(result);
            }
        } catch (error) {
            console.error('Error picking video:', error);
            Alert.alert('Error', 'Failed to pick video. Please try again.');
        } finally {
            setIsSelectingMedia(false);
            setMediaSelectionType(null);
        }
    }, []);

    /**
     * Handle audio picking from library
     */
    const handleAudioPick = useCallback(async () => {
        try {
            setIsSelectingMedia(true);
            setMediaSelectionType('audio');
            const result = await FileService.pickAudio();
            if (result) {
                // Validate file
                const validation = FileService.validateFile(result);
                if (!validation.isValid) {
                    Alert.alert('Invalid File', validation.error || 'Please select a valid audio');
                    return;
                }
                console.log('🎵 Audio selected:', result.name, result.sizeFormatted);
                setSelectedMedia(result);
            }
        } catch (error) {
            console.error('Error picking audio:', error);
            Alert.alert('Error', 'Failed to pick audio. Please try again.');
        } finally {
            setIsSelectingMedia(false);
            setMediaSelectionType(null);
        }
    }, []);

    /**
     * Handle media selection based on type
     */
    const handleSelectMedia = useCallback(async (type: 'image' | 'video' | 'audio') => {
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
    }, [handleImagePick, handleVideoPick, handleAudioPick]);

    useEffect(() => {
        if (visible && preSelectedMediaType) {
            handleSelectMedia(preSelectedMediaType);
        }
    }, [visible, preSelectedMediaType, handleSelectMedia]);

    /**
     * Remove selected media
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
                    },
                },
            ]
        );
    };

    /**
     * Validate and submit the question
     * Passes raw file info - backend handles upload atomically
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

        // DETAILED LOGGING for debugging
        console.log('🎬 [RegularQuestionEditor] handleSubmit called');
        console.log('🎬 [RegularQuestionEditor] selectedMedia:', selectedMedia ? {
            uri: selectedMedia.uri?.substring(0, 100),
            name: selectedMedia.name,
            type: selectedMedia.type,
            size: selectedMedia.size,
            isVideo: selectedMedia.type?.startsWith('video/'),
        } : 'null');
        console.log('🎬 [RegularQuestionEditor] Detected questionType:', questionType);

        // Build question data
        const questionData: QuestionFormData = {
            question: question.trim(),
            answer: answer.trim(),
            difficulty,
            topic: topic.trim(),
            additionalInfo: additionalInfo.trim(),
            questionType,
            // CRITICAL: Pass the raw file info for the mutation to handle
            mediaFile: selectedMedia ? {
                uri: selectedMedia.uri,
                name: selectedMedia.name || `media_${Date.now()}.${selectedMedia.type?.split('/')[1] || 'mp4'}`,
                type: selectedMedia.type || 'video/mp4',
            } : undefined,
        };

        console.log('📤 [RegularQuestionEditor] Submitting with mediaFile:', !!questionData.mediaFile);

        onSubmit(questionData);
        handleReset();
    };

    /**
     * Handle topic selection
     */
    const handleSelectTopic = (selectedTopic: SelectableTopic | null) => {
        if (selectedTopic) {
            setTopic(selectedTopic.name);
            setSelectedTopicId(selectedTopic.id);
        } else {
            setTopic('');
            setSelectedTopicId(undefined);
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
        setSelectedTopicId(undefined);
        setAdditionalInfo('');
        setSelectedMedia(undefined);
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
        if (!selectedMedia) {
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
                {(currentQuestionType === 'VIDEO' || currentQuestionType === 'AUDIO') && selectedMedia && (
                    <View style={styles.mediaPlaceholder}>
                        <MaterialCommunityIcons
                            name={currentQuestionType === 'VIDEO' ? 'video' : 'music'}
                            size={48}
                            color="#007AFF"
                        />
                        <Text style={styles.mediaPlaceholderText} numberOfLines={2}>
                            {selectedMedia.name}
                        </Text>
                        <Text style={styles.mediaFileSize}>
                            {selectedMedia.sizeFormatted || `${(selectedMedia.size / 1024 / 1024).toFixed(2)} MB`}
                        </Text>
                        <View style={styles.mediaTypeBadge}>
                            <Text style={styles.mediaTypeBadgeText}>
                                {selectedMedia.type?.split('/')[1]?.toUpperCase() || currentQuestionType}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Media Status Badge */}
                <View style={styles.mediaStatusBadge}>
                    <MaterialCommunityIcons
                        name="file-upload"
                        size={16}
                        color="#007AFF"
                    />
                    <Text style={styles.mediaStatusText}>
                        {`${getQuestionType()} Selected - will upload when saved`}
                    </Text>
                </View>

                {/* Remove Button */}
                <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={handleRemoveMedia}
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
                    <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                        <MaterialCommunityIcons name="close" size={24} color={isSubmitting ? "#999" : "#007AFF"}/>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Regular Question</Text>
                    <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
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
                                style={[styles.mediaButton, isSelectingMedia && styles.mediaButtonDisabled]}
                                onPress={() => handleSelectMedia('image')}
                                disabled={isSelectingMedia}
                            >
                                {isSelectingMedia && mediaSelectionType === 'image' ? (
                                    <ActivityIndicator size="small" color="#007AFF" />
                                ) : (
                                    <MaterialCommunityIcons name="image" size={24} color="#007AFF" />
                                )}
                                <Text style={styles.mediaButtonText}>Image</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.mediaButton, isSelectingMedia && styles.mediaButtonDisabled]}
                                onPress={() => handleSelectMedia('video')}
                                disabled={isSelectingMedia}
                            >
                                {isSelectingMedia && mediaSelectionType === 'video' ? (
                                    <ActivityIndicator size="small" color="#007AFF" />
                                ) : (
                                    <MaterialCommunityIcons name="video" size={24} color="#007AFF" />
                                )}
                                <Text style={styles.mediaButtonText}>Video</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.mediaButton, isSelectingMedia && styles.mediaButtonDisabled]}
                                onPress={() => handleSelectMedia('audio')}
                                disabled={isSelectingMedia}
                            >
                                {isSelectingMedia && mediaSelectionType === 'audio' ? (
                                    <ActivityIndicator size="small" color="#007AFF" />
                                ) : (
                                    <MaterialCommunityIcons name="music" size={24} color="#007AFF" />
                                )}
                                <Text style={styles.mediaButtonText}>Audio (Narration)</Text>
                            </TouchableOpacity>
                        </View>

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
                        <TopicTreeSelector
                            selectedTopicId={selectedTopicId}
                            selectedTopicName={topic}
                            onSelectTopic={handleSelectTopic}
                            allowCreate={true}
                            placeholder="Select or create a topic..."
                            label="Topic"
                            required={true}
                        />
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
    mediaButtonDisabled: {
        opacity: 0.5,
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
    mediaTypeBadge: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 12,
    },
    mediaTypeBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
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
});

export default RegularQuestionEditor;
