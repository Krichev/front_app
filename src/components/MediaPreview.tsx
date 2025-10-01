// src/components/MediaPreview.tsx
import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import Sound from 'react-native-sound';

export type MediaType = 'image' | 'video' | 'audio';

export interface MediaPreviewProps {
    mediaUrl: string;
    mediaType: MediaType;
    thumbnailUrl?: string;
    duration?: number;
    fileName?: string;
    onError?: (error: string) => void;
    autoPlay?: boolean;
    showControls?: boolean;
    maxHeight?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const defaultMaxHeight = 200;

const MediaPreview: React.FC<MediaPreviewProps> = ({
                                                       mediaUrl,
                                                       mediaType,
                                                       thumbnailUrl,
                                                       duration,
                                                       fileName,
                                                       onError,
                                                       autoPlay = false,
                                                       showControls = true,
                                                       maxHeight = defaultMaxHeight,
                                                   }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(duration || 0);
    const [volume, setVolume] = useState(1.0);
    const [showFullscreen, setShowFullscreen] = useState(false);

    const videoRef = useRef<Video>(null);
    const soundRef = useRef<Sound | null>(null);

    useEffect(() => {
        if (mediaType === 'audio') {
            initializeAudio();
        }

        return () => {
            cleanupAudio();
        };
    }, [mediaUrl, mediaType]);

    const initializeAudio = () => {
        if (mediaType !== 'audio') return;

        Sound.setCategory('Playback');

        soundRef.current = new Sound(mediaUrl, '', (error) => {
            if (error) {
                console.error('Failed to load audio:', error);
                handleError('Failed to load audio file');
                return;
            }

            setTotalDuration(soundRef.current?.getDuration() || 0);
            setIsLoading(false);
        });
    };

    const cleanupAudio = () => {
        if (soundRef.current) {
            soundRef.current.stop();
            soundRef.current.release();
            soundRef.current = null;
        }
    };

    const handleError = (errorMessage: string) => {
        setError(errorMessage);
        setIsLoading(false);
        onError?.(errorMessage);
    };

    const togglePlayPause = () => {
        if (mediaType === 'video') {
            setIsPlaying(!isPlaying);
        } else if (mediaType === 'audio' && soundRef.current) {
            if (isPlaying) {
                soundRef.current.pause();
            } else {
                soundRef.current.play((success) => {
                    if (!success) {
                        handleError('Failed to play audio');
                    }
                });
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleVideoLoad = (data: any) => {
        setTotalDuration(data.duration);
        setIsLoading(false);
    };

    const handleVideoProgress = (data: any) => {
        setCurrentTime(data.currentTime);
    };

    const handleVideoEnd = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const formatTime = (timeInSeconds: number): string => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const renderImagePreview = () => (
        <View style={[styles.mediaContainer, { maxHeight }]}>
            <Image
                source={{ uri: mediaUrl }}
                style={styles.image}
                onLoad={() => setIsLoading(false)}
                onError={() => handleError('Failed to load image')}
                resizeMode="contain"
            />
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            )}
        </View>
    );

    const renderVideoPreview = () => (
        <View style={[styles.mediaContainer, { maxHeight }]}>
            <Video
                ref={videoRef}
                source={{ uri: mediaUrl }}
                style={styles.video}
                onLoad={handleVideoLoad}
                onProgress={handleVideoProgress}
                onEnd={handleVideoEnd}
                onError={() => handleError('Failed to load video')}
                paused={!isPlaying}
                volume={volume}
                resizeMode="contain"
                poster={thumbnailUrl}
            />

            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            )}

            {showControls && !isLoading && (
                <View style={styles.videoControls}>
                    <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
                        <MaterialCommunityIcons
                            name={isPlaying ? 'pause' : 'play'}
                            size={24}
                            color="#FFF"
                        />
                    </TouchableOpacity>

                    <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>
                            {formatTime(currentTime)} / {formatTime(totalDuration)}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowFullscreen(true)}
                        style={styles.fullscreenButton}
                    >
                        <MaterialCommunityIcons name="fullscreen" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Progress bar */}
            {showControls && !isLoading && totalDuration > 0 && (
                <View style={styles.progressContainer}>
                    <View
                        style={[
                            styles.progressBar,
                            { width: `${(currentTime / totalDuration) * 100}%` }
                        ]}
                    />
                </View>
            )}
        </View>
    );

    const renderAudioPreview = () => (
        <View style={styles.audioContainer}>
            <View style={styles.audioInfo}>
                <MaterialCommunityIcons name="music-note" size={32} color="#007AFF" />
                <View style={styles.audioDetails}>
                    <Text style={styles.audioFileName} numberOfLines={1}>
                        {fileName || 'Audio Question'}
                    </Text>
                    <Text style={styles.audioDuration}>
                        {formatTime(currentTime)} / {formatTime(totalDuration)}
                    </Text>
                </View>
            </View>

            {showControls && !isLoading && (
                <View style={styles.audioControls}>
                    <TouchableOpacity onPress={togglePlayPause} style={styles.audioPlayButton}>
                        <MaterialCommunityIcons
                            name={isPlaying ? 'pause' : 'play'}
                            size={20}
                            color="#FFF"
                        />
                    </TouchableOpacity>
                </View>
            )}

            {isLoading && (
                <ActivityIndicator size="small" color="#007AFF" style={styles.audioLoader} />
            )}

            {/* Audio progress bar */}
            {showControls && !isLoading && totalDuration > 0 && (
                <View style={styles.audioProgressContainer}>
                    <View
                        style={[
                            styles.audioProgressBar,
                            { width: `${(currentTime / totalDuration) * 100}%` }
                        ]}
                    />
                </View>
            )}
        </View>
    );

    const renderErrorState = () => (
        <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={32} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
                onPress={() => {
                    setError(null);
                    setIsLoading(true);
                    if (mediaType === 'audio') {
                        initializeAudio();
                    }
                }}
                style={styles.retryButton}
            >
                <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
        </View>
    );

    if (error) {
        return renderErrorState();
    }

    switch (mediaType) {
        case 'image':
            return renderImagePreview();
        case 'video':
            return renderVideoPreview();
        case 'audio':
            return renderAudioPreview();
        default:
            return renderErrorState();
    }
};

const styles = StyleSheet.create({
    mediaContainer: {
        width: '100%',
        backgroundColor: '#000',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoControls: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    playButton: {
        padding: 8,
    },
    timeContainer: {
        flex: 1,
        marginHorizontal: 8,
    },
    timeText: {
        color: '#FFF',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    fullscreenButton: {
        padding: 8,
    },
    progressContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#007AFF',
    },
    audioContainer: {
        backgroundColor: '#F5F5F7',
        borderRadius: 8,
        padding: 12,
        position: 'relative',
    },
    audioInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    audioDetails: {
        flex: 1,
        marginLeft: 12,
    },
    audioFileName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    audioDuration: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
    },
    audioControls: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    audioPlayButton: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    audioLoader: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    audioProgressContainer: {
        height: 3,
        backgroundColor: '#E5E5E7',
        borderRadius: 1.5,
        marginTop: 8,
    },
    audioProgressBar: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 1.5,
    },
    errorContainer: {
        backgroundColor: '#FFF5F5',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFE5E5',
    },
    errorText: {
        fontSize: 14,
        color: '#FF3B30',
        textAlign: 'center',
        marginVertical: 8,
    },
    retryButton: {
        backgroundColor: '#FF3B30',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '500',
    },
});

export default MediaPreview;