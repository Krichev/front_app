// src/components/AuthenticatedAudio.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    ViewStyle,
    ActivityIndicator
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import MediaUrlService from '../services/media/MediaUrlService';

interface AuthenticatedAudioProps {
    questionId?: number;
    mediaId?: string | number;
    uri?: string;
    style?: ViewStyle;
    showWaveform?: boolean;
    onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
    onLoad?: () => void;
    onError?: (error: any) => void;
}

/**
 * Audio component that handles authentication for media proxy
 * Uses expo-av Audio API with auth headers
 */
const AuthenticatedAudio: React.FC<AuthenticatedAudioProps> = ({
    questionId,
    mediaId,
    uri,
    style,
    showWaveform = false,
    onPlaybackStatusUpdate,
    onLoad,
    onError,
}) => {
    const soundRef = useRef<Audio.Sound | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync().catch(console.error);
            }
        };
    }, []);

    const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            setDuration(status.durationMillis || 0);
            setPosition(status.positionMillis || 0);

            // Auto-reset when finished
            if (status.didJustFinish && !status.isLooping) {
                setIsPlaying(false);
                setPosition(0);
            }
        }
        onPlaybackStatusUpdate?.(status);
    }, [onPlaybackStatusUpdate]);

    const loadAudio = useCallback(async () => {
        if (!audioUrl) return false;

        try {
            setIsLoading(true);
            setHasError(false);
            setErrorMessage('');

            // Unload previous sound if exists
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            // Set audio mode for playback
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });

            // Create and load the sound
            const { sound } = await Audio.Sound.createAsync(
                {
                    uri: audioUrl,
                    headers: mediaService.getAuthHeaders(),
                },
                { shouldPlay: false },
                handlePlaybackStatusUpdate
            );

            soundRef.current = sound;
            setIsLoaded(true);
            setIsLoading(false);
            onLoad?.();
            return true;

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error('🎵 Failed to load audio:', errorMsg, 'URL:', audioUrl);
            setIsLoading(false);
            setHasError(true);
            setErrorMessage(errorMsg);
            onError?.({ message: errorMsg, url: audioUrl });
            return false;
        }
    }, [audioUrl, mediaService, handlePlaybackStatusUpdate, onLoad, onError]);

    const togglePlayPause = useCallback(async () => {
        // Load audio if not loaded yet
        if (!isLoaded && !isLoading) {
            const loaded = await loadAudio();
            if (loaded && soundRef.current) {
                await soundRef.current.playAsync();
            }
            return;
        }

        if (!soundRef.current) return;

        if (isPlaying) {
            await soundRef.current.pauseAsync();
        } else {
            // If at the end, restart from beginning
            if (position >= duration - 100) {
                await soundRef.current.setPositionAsync(0);
            }
            await soundRef.current.playAsync();
        }
    }, [isLoaded, isLoading, isPlaying, position, duration, loadAudio]);

    const handleSeek = useCallback(async (value: number) => {
        if (soundRef.current && isLoaded) {
            await soundRef.current.setPositionAsync(value);
        }
    }, [isLoaded]);

    const formatTime = (millis: number): string => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
                <TouchableOpacity style={styles.retryButton} onPress={loadAudio}>
                    <Text style={styles.retryText}>Tap to retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
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
                    onSlidingComplete={handleSeek}
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
