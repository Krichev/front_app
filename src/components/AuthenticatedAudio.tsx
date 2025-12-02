// src/components/AuthenticatedAudio.tsx
import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    ViewStyle,
    ActivityIndicator
} from 'react-native';
import Video, { VideoRef, OnLoadData, OnProgressData } from 'react-native-video';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import MediaUrlService from '../services/media/MediaUrlService';

interface AuthenticatedAudioProps {
    questionId?: number;
    mediaId?: string | number;
    uri?: string;
    style?: ViewStyle;
    showWaveform?: boolean;
    onLoad?: () => void;
    onError?: (error: any) => void;
}

/**
 * Audio component that handles authentication for media proxy
 * Uses react-native-video in audio mode with custom controls
 */
const AuthenticatedAudio: React.FC<AuthenticatedAudioProps> = ({
    questionId,
    mediaId,
    uri,
    style,
    showWaveform = false,
    onLoad,
    onError,
}) => {
    const audioRef = useRef<VideoRef>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isSeeking, setIsSeeking] = useState(false);

    const mediaService = MediaUrlService.getInstance();

    // Determine the URL to use
    const getAudioUrl = (): string | null => {
        if (uri && mediaService.isProxyUrl(uri)) {
            return uri;
        }

        if (questionId) {
            return mediaService.getQuestionMediaUrl(questionId);
        }

        if (mediaId) {
            return mediaService.getMediaByIdUrl(mediaId);
        }

        if (uri) {
            return mediaService.toProxyUrl(uri, undefined, false);
        }

        return null;
    };

    const audioUrl = getAudioUrl();

    const handleLoad = useCallback((data: OnLoadData) => {
        setDuration(data.duration);
        setIsLoaded(true);
        setIsLoading(false);
        setHasError(false);
        onLoad?.();
    }, [onLoad]);

    const handleProgress = useCallback((data: OnProgressData) => {
        if (!isSeeking) {
            setPosition(data.currentTime);
        }
    }, [isSeeking]);

    const handleEnd = useCallback(() => {
        setIsPlaying(false);
        setPosition(0);
        audioRef.current?.seek(0);
    }, []);

    const handleError = useCallback((error: any) => {
        const errorMsg = error?.error?.errorString || 'Unknown error';
        console.error('🎵 Failed to load audio:', errorMsg, 'URL:', audioUrl);
        setIsLoading(false);
        setHasError(true);
        setErrorMessage(errorMsg);
        onError?.({ message: errorMsg, url: audioUrl });
    }, [audioUrl, onError]);

    const togglePlayPause = useCallback(() => {
        if (!isLoaded) {
            setIsLoading(true);
            // The video will start loading on mount
            return;
        }

        setIsPlaying(!isPlaying);
    }, [isLoaded, isPlaying]);

    const handleSeek = useCallback((value: number) => {
        setIsSeeking(true);
        setPosition(value);
    }, []);

    const handleSlidingComplete = useCallback((value: number) => {
        audioRef.current?.seek(value);
        setIsSeeking(false);
    }, []);

    const formatTime = (seconds: number): string => {
        const totalSeconds = Math.floor(seconds);
        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // No valid URL - show error
    if (!audioUrl) {
        return (
            <View style={[styles.container, styles.errorContainer, style]}>
                <MaterialCommunityIcons name="music-off" size={32} color="#999" />
                <Text style={styles.errorText}>Audio not available</Text>
            </View>
        );
    }

    // Error state
    if (hasError) {
        return (
            <View style={[styles.container, styles.errorContainer, style]}>
                <MaterialCommunityIcons name="music-off" size={32} color="#F44336" />
                <Text style={styles.errorText}>Failed to load audio</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => {
                    setHasError(false);
                    setIsLoading(true);
                }}>
                    <Text style={styles.retryText}>Tap to retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            {/* Hidden video component for audio playback */}
            <Video
                ref={audioRef}
                source={{
                    uri: audioUrl,
                    headers: mediaService.getAuthHeaders(),
                }}
                paused={!isPlaying}
                onLoad={handleLoad}
                onProgress={handleProgress}
                onEnd={handleEnd}
                onError={handleError}
                style={{ height: 0, width: 0 }}
                playInBackground={false}
                playWhenInactive={false}
            />

            {/* Play/Pause Button */}
            <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
                disabled={isLoading}
                activeOpacity={0.7}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                    <MaterialCommunityIcons
                        name={isPlaying ? 'pause-circle' : 'play-circle'}
                        size={48}
                        color="#007AFF"
                    />
                )}
            </TouchableOpacity>

            {/* Progress Section */}
            <View style={styles.progressSection}>
                {/* Slider */}
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={duration || 1}
                    value={position}
                    onValueChange={handleSeek}
                    onSlidingComplete={handleSlidingComplete}
                    minimumTrackTintColor="#007AFF"
                    maximumTrackTintColor="#ddd"
                    thumbTintColor="#007AFF"
                    disabled={!isLoaded}
                />

                {/* Time Display */}
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
            </View>

            {/* Audio icon indicator */}
            <View style={styles.audioIcon}>
                <MaterialCommunityIcons
                    name={isPlaying ? 'volume-high' : 'volume-medium'}
                    size={20}
                    color={isPlaying ? '#007AFF' : '#999'}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    errorContainer: {
        justifyContent: 'center',
        flexDirection: 'column',
        paddingVertical: 20,
    },
    errorText: {
        color: '#999',
        marginTop: 8,
        fontSize: 14,
    },
    retryButton: {
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: '#007AFF',
        borderRadius: 16,
    },
    retryText: {
        color: '#fff',
        fontSize: 12,
    },
    playButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressSection: {
        flex: 1,
        marginLeft: 8,
    },
    slider: {
        width: '100%',
        height: 32,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginTop: -4,
    },
    timeText: {
        fontSize: 11,
        color: '#666',
        fontVariant: ['tabular-nums'],
    },
    audioIcon: {
        marginLeft: 8,
        width: 24,
        alignItems: 'center',
    },
});

export default AuthenticatedAudio;
