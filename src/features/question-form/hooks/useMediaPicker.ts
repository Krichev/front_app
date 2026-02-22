// questApp/src/features/question-form/hooks/useMediaPicker.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { useTranslation } from 'react-i18next';
import FileService, { ProcessedFileInfo } from "../../../services/speech/FileService";
import MediaUploadService from "../../../services/media/MediaUploadService";
import { MediaInfo, QuestionType } from "../model/types";

export function useMediaPicker(navigation: any) {
    const { t } = useTranslation();
    const [selectedMedia, setSelectedMedia] = useState<ProcessedFileInfo | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedMediaInfo, setUploadedMediaInfo] = useState<MediaInfo | null>(null);

    const handleMediaPick = useCallback(async (setQuestionType: (type: QuestionType) => void) => {
        try {
            const result = await FileService.pickImage({
                mediaType: 'mixed',
                allowsEditing: false,
                quality: 0.8,
                maxWidth: 1920,
                maxHeight: 1080,
            }, navigation);

            if (!result) return;

            const validation = FileService.validateFile(result);
            if (!validation.isValid) {
                Alert.alert(t('questionEditor.invalidFile'), validation.error || t('questionEditor.validImage'));
                return;
            }

            setSelectedMedia(result);
            setUploadedMediaInfo(null);

            if (result.isImage) {
                setQuestionType('IMAGE');
            } else if (result.isVideo) {
                setQuestionType('VIDEO');
            }
        } catch (error) {
            console.error('Error picking media:', error);
            Alert.alert(t('userQuestions.errorTitle'), t('questionEditor.errorMedia'));
        }
    }, [navigation, t]);

    const handleVideoPick = useCallback(async (setQuestionType: (type: QuestionType) => void) => {
        try {
            const result = await FileService.pickVideo({
                mediaType: 'video',
                allowsEditing: false,
                quality: 0.8,
            }, navigation);

            if (!result) return;

            const validation = FileService.validateFile(result);
            if (!validation.isValid) {
                Alert.alert(t('questionEditor.invalidFile'), validation.error || t('questionEditor.validVideo'));
                return;
            }

            setSelectedMedia(result);
            setUploadedMediaInfo(null);
            setQuestionType('VIDEO');
        } catch (error) {
            console.error('Error picking video:', error);
            Alert.alert(t('userQuestions.errorTitle'), t('questionEditor.errorMedia'));
        }
    }, [navigation, t]);

    const handleAudioPick = useCallback(async (setQuestionType: (type: QuestionType) => void) => {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.audio],
                allowMultiSelection: false,
            });

            if (!result || result.length === 0) return;

            const audioFile = result[0];
            const processedAudio: ProcessedFileInfo = {
                uri: audioFile.uri,
                name: audioFile.name || 'audio.mp3',
                type: audioFile.type || 'audio/mpeg',
                size: audioFile.size || 0,
                sizeFormatted: FileService.formatFileSize(audioFile.size || 0),
                isImage: false,
                isVideo: false,
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
                extension: FileService.getExtension(audioFile.name || 'mp3'),
            };

            setSelectedMedia(processedAudio);
            setUploadedMediaInfo(null);
            setQuestionType('AUDIO');
        } catch (error: any) {
            if (!DocumentPicker.isCancel(error)) {
                console.error('Error picking audio:', error);
                Alert.alert(t('userQuestions.errorTitle'), t('questionEditor.errorMedia'));
            }
        }
    }, [t]);

    const handleUploadMedia = useCallback(async () => {
        if (!selectedMedia) {
            Alert.alert('No Media', t('questionEditor.errorMedia'));
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            const response = await MediaUploadService.uploadQuizMedia(
                selectedMedia,
                `temp_${Date.now()}`,
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
                Alert.alert(t('userQuestions.successTitle'), 'Media uploaded successfully!');
                return mediaInfo;
            } else {
                Alert.alert(t('userQuestions.errorTitle'), response.error || 'Failed to upload media');
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert(t('userQuestions.errorTitle'), 'Failed to upload media. Please try again.');
        } finally {
            setIsUploading(false);
        }
    }, [selectedMedia, t]);

    const handleRemoveMedia = useCallback(() => {
        setSelectedMedia(null);
        setUploadedMediaInfo(null);
        setUploadProgress(0);
    }, []);

    const showMediaOptions = useCallback((setQuestionType: (type: QuestionType) => void) => {
        Alert.alert(
            t('mediaQuestion.selectMedia'),
            'Choose the type of media to upload',
            [
                { text: t('mediaQuestion.uploadImage'), onPress: () => handleMediaPick(setQuestionType) },
                { text: t('mediaQuestion.uploadVideo'), onPress: () => handleVideoPick(setQuestionType) },
                { text: t('mediaQuestion.uploadAudio'), onPress: () => handleAudioPick(setQuestionType) },
                { text: t('common.cancel'), style: 'cancel' },
            ]
        );
    }, [handleAudioPick, handleMediaPick, handleVideoPick, t]);

    return {
        mediaState: {
            selectedMedia,
            uploadProgress,
            isUploading,
            uploadedMediaInfo,
        },
        mediaHandlers: {
            handleMediaPick,
            handleVideoPick,
            handleAudioPick,
            handleUploadMedia,
            handleRemoveMedia,
            showMediaOptions,
            setSelectedMedia,
            setUploadedMediaInfo,
        }
    };
}
