// src/screens/CreateWWWQuestScreen/components/QuestionMediaViewer.tsx
import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    Modal,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    ViewStyle
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MediaType } from '../../../services/wwwGame/questionService';
import AuthenticatedImage from '../../../components/AuthenticatedImage';
import AuthenticatedVideo from '../../../components/AuthenticatedVideo';
import AuthenticatedAudio from '../../../components/AuthenticatedAudio';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface QuestionMediaViewerProps {
    questionId: number;
    mediaType?: MediaType;
    // Legacy props - kept for backward compatibility but not used for URL construction
    mediaUrl?: string;
    thumbnailUrl?: string;
    // Display options
    compact?: boolean;
    showThumbnail?: boolean;
    enableFullscreen?: boolean;
    style?: ViewStyle;
    height?: number;
}

/**
 * Media viewer that uses backend proxy URLs with authentication
 * All media is fetched through /api/media/question/{id}/stream
 *
 * IMPORTANT: This component uses questionId to build proxy URLs.
 * mediaUrl and thumbnailUrl props are ignored - we always use the proxy.
 */
const QuestionMediaViewer: React.FC<QuestionMediaViewerProps> = ({
    questionId,
    mediaType,
    mediaUrl,      // ignored - we use questionId for proxy URL
    thumbnailUrl,  // ignored - we use questionId for proxy URL
    compact = false,
    showThumbnail = false,
    enableFullscreen = true,
    style,
    height = 200,
}) => {
    const [showFullscreen, setShowFullscreen] = useState(false);

    // No question ID means no media to show
    if (!questionId) {
        console.warn('QuestionMediaViewer: No questionId provided');
        return (
            <View style={[styles.container, styles.errorContainer, style, { height: compact ? 80 : height }]}>
                <MaterialCommunityIcons name="image-off" size={24} color="#999" />
                <Text style={styles.errorText}>No media available</Text>
            </View>
        );
    }

    // Get icon for media type
    const getMediaIcon = (): string => {
        switch (mediaType) {
            case MediaType.IMAGE: return 'image';
            case MediaType.VIDEO: return 'video';
            case MediaType.AUDIO: return 'music';
            default: return 'file';
        }
    };

    // Render fullscreen modal for images
    const renderFullscreenModal = () => (
        <Modal
            visible={showFullscreen}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowFullscreen(false)}
        >
            <SafeAreaView style={styles.fullscreenContainer}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowFullscreen(false)}
                >
                    <MaterialCommunityIcons name="close" size={28} color="#fff" />
                </TouchableOpacity>

                <View style={styles.fullscreenContent}>
                    {mediaType === MediaType.IMAGE && (
                        <AuthenticatedImage
                            questionId={questionId}
                            isThumbnail={false}
                            style={styles.fullscreenImage}
                            containerStyle={styles.fullscreenImageContainer}
                            resizeMode="contain"
                        />
                    )}
                    {mediaType === MediaType.VIDEO && (
                        <AuthenticatedVideo
                            questionId={questionId}
                            style={styles.fullscreenVideo}
                            containerStyle={styles.fullscreenVideoContainer}
                            useNativeControls={true}
                            shouldPlay={true}
                        />
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );

    // Compact view - just icon indicator
    if (compact) {
        return (
            <TouchableOpacity
                style={[styles.compactContainer, style]}
                onPress={() => enableFullscreen && setShowFullscreen(true)}
                disabled={!enableFullscreen || mediaType === MediaType.AUDIO}
            >
                <MaterialCommunityIcons
                    name={getMediaIcon()}
                    size={20}
                    color="#007AFF"
                />
                {enableFullscreen && renderFullscreenModal()}
            </TouchableOpacity>
        );
    }

    // Render based on media type
    switch (mediaType) {
        case MediaType.IMAGE:
            return (
                <View style={[styles.container, style]}>
                    <TouchableOpacity
                        onPress={() => enableFullscreen && setShowFullscreen(true)}
                        disabled={!enableFullscreen}
                        activeOpacity={0.9}
                    >
                        <AuthenticatedImage
                            questionId={questionId}
                            isThumbnail={showThumbnail}
                            style={{ height }}
                            containerStyle={styles.mediaContainer}
                            fallbackIcon="image-broken"
                        />

                        {enableFullscreen && (
                            <View style={styles.fullscreenHint}>
                                <MaterialCommunityIcons name="fullscreen" size={20} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                    {enableFullscreen && renderFullscreenModal()}
                </View>
            );

        case MediaType.VIDEO:
            // For thumbnail view, show image thumbnail with play overlay
            if (showThumbnail) {
                return (
                    <View style={[styles.container, style]}>
                        <TouchableOpacity
                            onPress={() => enableFullscreen && setShowFullscreen(true)}
                            disabled={!enableFullscreen}
                            activeOpacity={0.9}
                        >
                            <AuthenticatedImage
                                questionId={questionId}
                                isThumbnail={true}
                                style={{ height }}
                                containerStyle={styles.mediaContainer}
                                fallbackIcon="video"
                            />
                            <View style={styles.videoPlayOverlay}>
                                <MaterialCommunityIcons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
                            </View>
                        </TouchableOpacity>
                        {enableFullscreen && renderFullscreenModal()}
                    </View>
                );
            }

            // Full video player
            return (
                <View style={[styles.container, style]}>
                    <AuthenticatedVideo
                        questionId={questionId}
                        style={{ height }}
                        containerStyle={styles.mediaContainer}
                        useNativeControls={true}
                        shouldPlay={false}
                    />
                </View>
            );

        case MediaType.AUDIO:
            return (
                <View style={[styles.container, style]}>
                    <AuthenticatedAudio
                        questionId={questionId}
                        style={styles.audioPlayer}
                    />
                </View>
            );

        default:
            return (
                <View style={[styles.container, styles.errorContainer, style, { height }]}>
                    <MaterialCommunityIcons name="file-question" size={32} color="#999" />
                    <Text style={styles.errorText}>Unknown media type</Text>
                </View>
            );
    }
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
    },
    compactContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaContainer: {
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    errorContainer: {
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#999',
        marginTop: 8,
        fontSize: 14,
    },
    fullscreenHint: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 4,
        padding: 4,
    },
    videoPlayOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    audioPlayer: {
        width: '100%',
    },
    // Fullscreen modal styles
    fullscreenContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenImageContainer: {
        width: screenWidth,
        height: screenHeight * 0.8,
    },
    fullscreenImage: {
        width: '100%',
        height: '100%',
    },
    fullscreenVideoContainer: {
        width: screenWidth,
        height: screenHeight * 0.5,
    },
    fullscreenVideo: {
        width: '100%',
        height: '100%',
    },
});

export default QuestionMediaViewer;
