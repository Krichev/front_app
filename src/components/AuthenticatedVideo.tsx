// src/components/AuthenticatedVideo.tsx
import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
    Text
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MediaUrlService from '../services/media/MediaUrlService';

interface AuthenticatedVideoProps {
    questionId?: number;
    mediaId?: string | number;
    uri?: string;
    style?: ViewStyle;
    containerStyle?: ViewStyle;
    resizeMode?: ResizeMode;
    shouldPlay?: boolean;
    isLooping?: boolean;
    useNativeControls?: boolean;
    showPlayButton?: boolean;
    onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
    onLoad?: () => void;
    onError?: (error: any) => void;
}

/**
 * Video component that handles authentication for media proxy
 * Uses expo-av Video with auth headers in source
 */
const AuthenticatedVideo: React.FC<AuthenticatedVideoProps> = ({
    questionId,
    mediaId,
    uri,
    style,
    containerStyle,
    resizeMode = ResizeMode.CONTAIN,
    shouldPlay = false,
    isLooping = false,
    useNativeControls = true,
    showPlayButton = true,
    onPlaybackStatusUpdate,
    onLoad,
    onError,
}) => {
    const videoRef = useRef<Video>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(shouldPlay);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const mediaService = MediaUrlService.getInstance();

    // Determine the URL to use
    const getVideoUrl = (): string | null => {
        // If direct URI provided and it's a proxy URL, use it
        if (uri && mediaService.isProxyUrl(uri)) {
            return uri;
        }

        // Build proxy URL from questionId
        if (questionId) {
            return mediaService.getQuestionMediaUrl(questionId);
        }

        // Build proxy URL from mediaId
        if (mediaId) {
            return mediaService.getMediaByIdUrl(mediaId);
        }

        // Try to convert provided URI
        if (uri) {
            return mediaService.toProxyUrl(uri, undefined, false);
        }

        return null;
    };

    const videoUrl = getVideoUrl();

    const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setIsLoading(false);
            setIsPlaying(status.isPlaying);
            setHasError(false);
        } else if (status.error) {
            setHasError(true);
            setErrorMessage(status.error);
            setIsLoading(false);
        }
        onPlaybackStatusUpdate?.(status);
    }, [onPlaybackStatusUpdate]);

    const handleLoad = useCallback(() => {
        setIsLoading(false);
        setHasError(false);
        onLoad?.();
    }, [onLoad]);

    const handleError = useCallback((error: string) => {
        setIsLoading(false);
        setHasError(true);
        setErrorMessage(error);
        console.error('🎬 Video playback error:', error, 'URL:', videoUrl);
        onError?.({ message: error, url: videoUrl });
    }, [onError, videoUrl]);

    const togglePlayPause = useCallback(async () => {
        if (videoRef.current) {
            if (isPlaying) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
        }
    }, [isPlaying]);

    // No valid URL - show fallback
    if (!videoUrl) {
        return (
            <View style={[styles.errorContainer, containerStyle, style]}>
                <MaterialCommunityIcons name="video-off" size={48} color="#999" />
                <Text style={styles.errorText}>Video not available</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, containerStyle]}>
            {!hasError ? (
                <>
                    <Video
                        ref={videoRef}
                        style={[styles.video, style]}
                        source={{
                            uri: videoUrl,
                            headers: mediaService.getAuthHeaders(),
                        }}
                        resizeMode={resizeMode}
                        shouldPlay={shouldPlay}
                        isLooping={isLooping}
                        useNativeControls={useNativeControls}
                        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                        onLoad={handleLoad}
                        onError={(e) => handleError(e)}
                    />

                    {/* Custom play button overlay when not using native controls */}
                    {showPlayButton && !useNativeControls && !isPlaying && !isLoading && (
                        <TouchableOpacity
                            style={styles.playButtonOverlay}
                            onPress={togglePlayPause}
                            activeOpacity={0.8}
                        >
                            <View style={styles.playButtonCircle}>
                                <MaterialCommunityIcons
                                    name="play"
                                    size={40}
                                    color="#fff"
                                />
                            </View>
                        </TouchableOpacity>
                    )}
                </>
            ) : (
                <View style={[styles.errorContainer, style]}>
                    <MaterialCommunityIcons name="video-off" size={48} color="#F44336" />
                    <Text style={styles.errorText}>Failed to load video</Text>
                    {__DEV__ && errorMessage && (
                        <Text style={styles.errorDetail}>{errorMessage}</Text>
                    )}
                </View>
            )}

            {/* Loading overlay */}
            {isLoading && !hasError && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading video...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        backgroundColor: '#000',
        borderRadius: 8,
        overflow: 'hidden',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 8,
        fontSize: 14,
    },
    errorContainer: {
        width: '100%',
        height: '100%',
        minHeight: 150,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    errorText: {
        color: '#999',
        marginTop: 8,
        fontSize: 14,
    },
    errorDetail: {
        color: '#666',
        marginTop: 4,
        fontSize: 10,
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    playButtonOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    playButtonCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 4, // Offset for play icon visual centering
    },
});

export default AuthenticatedVideo;
