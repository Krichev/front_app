// src/components/CreateQuestionWithMedia.tsx
import React, {useState} from 'react';
import {ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FileService, {ProcessedFileInfo} from "../../services/speech/FileService.ts";
import MediaUploadService from "../../services/media/MediaUploadService.ts";

interface CreateQuestionWithMediaProps {
    onQuestionCreated?: (question: any) => void;
}

const CreateQuestionWithMedia: React.FC<CreateQuestionWithMediaProps> = ({ onQuestionCreated }) => {
    const [questionText, setQuestionText] = useState('');
    const [answer, setAnswer] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<ProcessedFileInfo | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);

    /**
     * Handle media selection from camera or gallery
     */
    const handleMediaPick = async () => {
        try {
            // ✅ FIX: Use pickImage (not pickMedia) with mediaType: 'mixed'
            const result = await FileService.pickImage({
                mediaType: 'mixed', // Supports both photos and videos
                allowsEditing: false,
                quality: 0.8,
                maxWidth: 1920,
                maxHeight: 1080,
            });

            if (!result) {
                console.log('Media selection cancelled');
                return;
            }

            // Validate the file
            const validation = FileService.validateFile(result);
            if (!validation.isValid) {
                Alert.alert('Invalid File', validation.error || 'Please select a valid file');
                return;
            }

            setSelectedMedia(result);
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
            console.log('Video selected:', result.name, result.sizeFormatted);
        } catch (error) {
            console.error('Error picking video:', error);
            Alert.alert('Error', 'Failed to select video. Please try again.');
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

            // ✅ Now passing ProcessedFileInfo with all required fields
            const response = await MediaUploadService.uploadTempMedia(
                selectedMedia,
                (progress) => {
                    setUploadProgress(progress.percentage);
                }
            );

            if (response.success) {
                setMediaUrl(response.mediaUrl || null);
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
     * Create question with media
     */
    const handleCreateQuestion = () => {
        if (!questionText.trim()) {
            Alert.alert('Validation Error', 'Please enter a question');
            return;
        }

        if (!answer.trim()) {
            Alert.alert('Validation Error', 'Please enter an answer');
            return;
        }

        if (!mediaUrl) {
            Alert.alert('Validation Error', 'Please upload media first');
            return;
        }

        const questionData = {
            questionText: questionText.trim(),
            answer: answer.trim(),
            mediaUrl: mediaUrl,
            mediaType: selectedMedia?.type,
            createdAt: new Date().toISOString(),
        };

        onQuestionCreated?.(questionData);

        // Reset form
        setQuestionText('');
        setAnswer('');
        setSelectedMedia(null);
        setMediaUrl(null);
        setUploadProgress(0);
    };

    /**
     * Remove selected media
     */
    const handleRemoveMedia = () => {
        setSelectedMedia(null);
        setMediaUrl(null);
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
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Question with Media</Text>

            {/* Question Input */}
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

            {/* Answer Input */}
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

            {/* Media Selection */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Media (Image/Video) *</Text>

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
                            <MaterialCommunityIcons name="close-circle" size={24} color="#f44336" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Upload Progress */}
            {isUploading && (
                <View style={styles.uploadProgressContainer}>
                    <Text style={styles.uploadProgressText}>
                        Uploading: {uploadProgress}%
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

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                {selectedMedia && !mediaUrl && (
                    <TouchableOpacity
                        style={[styles.uploadButton, isUploading && styles.buttonDisabled]}
                        onPress={handleUploadMedia}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="cloud-upload" size={20} color="#fff" />
                                <Text style={styles.buttonText}>Upload Media</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {mediaUrl && (
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={handleCreateQuestion}
                    >
                        <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Create Question</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Success Indicator */}
            {mediaUrl && (
                <View style={styles.successContainer}>
                    <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                    <Text style={styles.successText}>Media uploaded successfully!</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
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
        borderRadius: 12,
    },
    uploadProgressContainer: {
        marginBottom: 20,
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
    actionButtons: {
        gap: 12,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 8,
        gap: 8,
    },
    createButton: {
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

export default CreateQuestionWithMedia;