// questApp/src/features/question-form/ui/MediaSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { MediaSourceType } from '../../../entities/QuizState/model/types/question.types';
import { QuestionType, MediaInfo } from '../model/types';
import { ProcessedFileInfo } from '../../../services/speech/FileService';
import { ExternalVideoSection } from './ExternalVideoSection';

interface MediaSectionProps {
    questionType: QuestionType;
    mediaSourceType: MediaSourceType;
    setMediaSourceType: (type: MediaSourceType) => void;
    selectedMedia: ProcessedFileInfo | null;
    uploadedMediaInfo: MediaInfo | null;
    uploadProgress: number;
    isUploading: boolean;
    showMediaOptions: (setQuestionType: (type: QuestionType) => void) => void;
    handleRemoveMedia: () => void;
    handleUploadMedia: () => void;
    setQuestionType: (type: QuestionType) => void;
    
    // External Video Props
    externalUrl: string;
    setExternalUrl: (url: string) => void;
    qStartTime: number;
    setQStartTime: (time: number) => void;
    qEndTime?: number;
    setQEndTime: (time: number | undefined) => void;
    answerMediaType: 'SAME' | 'DIFFERENT' | 'TEXT';
    setAnswerMediaType: (type: 'SAME' | 'DIFFERENT' | 'TEXT') => void;
    answerUrl: string;
    setAnswerUrl: (url: string) => void;
    aStartTime: number;
    setAStartTime: (time: number) => void;
    aEndTime?: number;
    setAEndTime: (time: number | undefined) => void;
    answerTextVerification: string;
    setAnswerTextVerification: (text: string) => void;
}

export const MediaSection: React.FC<MediaSectionProps> = (props) => {
    const { t } = useTranslation();
    const {
        questionType,
        mediaSourceType,
        setMediaSourceType,
        selectedMedia,
        uploadedMediaInfo,
        uploadProgress,
        isUploading,
        showMediaOptions,
        handleRemoveMedia,
        handleUploadMedia,
        setQuestionType,
    } = props;

    if (questionType !== 'IMAGE' && questionType !== 'VIDEO') {
        return null;
    }

    return (
        <View style={styles.formGroup}>
            <Text style={styles.label}>
                {t('mediaQuestion.selectMedia')} ({questionType === 'IMAGE' ? t('questions.image') : t('questions.video')}) *
            </Text>

            {questionType === 'VIDEO' && (
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, mediaSourceType === MediaSourceType.UPLOADED && styles.activeTab]}
                        onPress={() => setMediaSourceType(MediaSourceType.UPLOADED)}
                    >
                        <Text style={styles.tabText}>{t('questionEditor.upload')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, mediaSourceType !== MediaSourceType.UPLOADED && styles.activeTab]}
                        onPress={() => setMediaSourceType(MediaSourceType.EXTERNAL_URL)}
                    >
                        <Text style={styles.tabText}>{t('questionEditor.link')}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {mediaSourceType === MediaSourceType.UPLOADED ? (
                <>
                    {!selectedMedia ? (
                        <TouchableOpacity
                            style={styles.mediaButton}
                            onPress={() => showMediaOptions(setQuestionType)}
                        >
                            <MaterialCommunityIcons name="image-plus" size={24} color="#4CAF50" />
                            <Text style={styles.mediaButtonText}>{t('mediaQuestion.selectMedia')}</Text>
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
                                    <Text style={styles.videoText}>{t('questionEditor.videoFile')}</Text>
                                </View>
                            )}
                            {!selectedMedia.isImage && !selectedMedia.isVideo && (
                                <View style={styles.videoPlaceholder}>
                                    <MaterialCommunityIcons name="music" size={48} color="#666" />
                                    <Text style={styles.videoText}>{t('questionEditor.audioFile')}</Text>
                                </View>
                            )}

                            <View style={styles.mediaInfo}>
                                <Text style={styles.mediaName} numberOfLines={1}>
                                    {selectedMedia.name}
                                </Text>
                                <Text style={styles.mediaSize}>
                                    {selectedMedia.sizeFormatted} • {selectedMedia.isImage ? t('questions.image') : selectedMedia.isVideo ? t('questions.video') : t('questions.audioType')}
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

                    {selectedMedia && !uploadedMediaInfo && !isUploading && (
                        <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={handleUploadMedia}
                        >
                            <MaterialCommunityIcons name="cloud-upload" size={20} color="#fff" />
                            <Text style={styles.buttonText}>{t('questionEditor.upload')}</Text>
                        </TouchableOpacity>
                    )}

                    {uploadedMediaInfo && (
                        <View style={styles.successContainer}>
                            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                            <Text style={styles.successText}>Media uploaded successfully!</Text>
                        </View>
                    )}
                </>
            ) : (
                <ExternalVideoSection
                    externalUrl={props.externalUrl}
                    setExternalUrl={props.setExternalUrl}
                    qStartTime={props.qStartTime}
                    setQStartTime={props.setQStartTime}
                    qEndTime={props.qEndTime}
                    setQEndTime={props.setQEndTime}
                    answerMediaType={props.answerMediaType}
                    setAnswerMediaType={props.setAnswerMediaType}
                    answerUrl={props.answerUrl}
                    setAnswerUrl={props.setAnswerUrl}
                    aStartTime={props.aStartTime}
                    setAStartTime={props.setAStartTime}
                    aEndTime={props.aEndTime}
                    setAEndTime={props.setAEndTime}
                    answerTextVerification={props.answerTextVerification}
                    setAnswerTextVerification={props.setAnswerTextVerification}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        padding: 4
    },
    tab: {
        flex: 1,
        padding: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#fff',
    },
    tabText: {
        fontWeight: '600',
        color: '#333'
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
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
