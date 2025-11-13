// src/screens/CreateWWWQuestScreen/components/QuestionMediaViewer.tsx
import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Video, {VideoRef} from 'react-native-video';
import Sound from 'react-native-sound';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {MediaType} from '../../../services/wwwGame/questionService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuestionMediaViewerProps {
    mediaUrl: string;
    mediaType: MediaType;
    thumbnailUrl?: string;
    style?: any;
    compact?: boolean; // If true, shows a smaller inline preview
    enableFullscreen?: boolean; // If true, allows tapping to view fullscreen
}

const QuestionMediaViewer: React.FC<QuestionMediaViewerProps> = ({
                                                                     mediaUrl,
                                                                     mediaType,
                                                                     thumbnailUrl,
                                                                     style,
                                                                     compact = false,
                                                                     enableFullscreen = true,
                                                                 }) => {
    // State
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [sound, setSound] = useState<Sound | null>(null);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [audioDuration, setAudioDuration] = useState<number>(0);
    const [audioPosition, setAudioPosition] = useState<number>(0);
    const [videoPaused, setVideoPaused] = useState(true);

    // Refs
    const videoRef = useRef<VideoRef>(null);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);

    // Enable playback in silent mode (iOS)
    useEffect(() => {
        Sound.setCategory('Playback', false);

        return () => {
            cleanupAudio();
        };
    }, []);

    // Cleanup audio when component unmounts or mediaUrl changes
    useEffect(() => {
        return () => {
            cleanupAudio();
        };
    }, [mediaUrl]);

    const cleanupAudio = () => {
        if (sound) {
            sound.stop();
            sound.release();
            setSound(null);
        }
        if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
        }
        setIsPlaying(false);
        setAudioPosition(0);
    };

    const handlePlayPauseAudio = async () => {
        try {
            if (!sound) {
                // Create new sound instance
                const newSound = new Sound(mediaUrl, '', (error) => {
                    if (error) {
                        console.error('Failed to load audio:', error);
                        setError('Failed to load audio');
                        setIsLoading(false);
                        return;
                    }

                    // Audio loaded successfully
                    setIsLoading(false);
                    setAudioDuration(newSound.getDuration() * 1000); // Convert to ms

                    // Play the audio
                    newSound.play((success) => {
                        if (success) {
                            setIsPlaying(false);
                            setAudioPosition(0);
                            if (progressInterval.current) {
                                clearInterval(progressInterval.current);
                            }
                        }
                    });

                    setIsPlaying(true);

                    // Start progress tracking
                    progressInterval.current = setInterval(() => {
                        newSound.getCurrentTime((seconds) => {
                            setAudioPosition(seconds * 1000); // Convert to ms
                        });
                    }, 100);
                });

                setSound(newSound);
            } else {
                // Toggle existing sound
                if (isPlaying) {
                    sound.pause();
                    setIsPlaying(false);
                    if (progressInterval.current) {
                        clearInterval(progressInterval.current);
                    }
                } else {
                    sound.play((success) => {
                        if (success) {
                            setIsPlaying(false);
                            setAudioPosition(0);
                            if (progressInterval.current) {
                                clearInterval(progressInterval.current);
                            }
                        }
                    });
                    setIsPlaying(true);

                    // Resume progress tracking
                    progressInterval.current = setInterval(() => {
                        sound.getCurrentTime((seconds) => {
                            setAudioPosition(seconds * 1000);
                        });
                    }, 100);
                }
            }
        } catch (err) {
            console.error('Error playing audio:', err);
            setError('Failed to play audio');
            setIsLoading(false);
        }
    };

    const handlePlayPauseVideo = () => {
        setVideoPaused(!videoPaused);
        setIsPlaying(!videoPaused);
    };

    const formatTime = (millis: number): string => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getMediaIcon = (): string => {
        switch (mediaType) {
            case MediaType.IMAGE:
                return 'image';
            case MediaType.VIDEO:
                return 'video';
            case MediaType.AUDIO:
                return 'music';
            default:
                return 'file';
        }
    };

    const getMediaColor = (): string => {
        switch (mediaType) {
            case MediaType.IMAGE:
                return '#4CAF50';
            case MediaType.VIDEO:
                return '#FF5722';
            case MediaType.AUDIO:
                return '#9C27B0';
            default:
                return '#666';
        }
    };

    // Render functions for each media type
    const renderImage = () => (
        <TouchableOpacity
            style={[styles.imageContainer, compact && styles.compactContainer, style]}
            onPress={() => enableFullscreen && setShowFullscreen(true)}
            disabled={!enableFullscreen}
            activeOpacity={enableFullscreen ? 0.7 : 1}
        >
            <Image
                source={{ uri: thumbnailUrl || mediaUrl }}
                style={[styles.image, compact && styles.compactImage]}
                resizeMode="cover"
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                onError={() => {
                    setError('Failed to load image');
                    setIsLoading(false);
                }}
            />
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
            {enableFullscreen && !isLoading && (
                <View style={styles.fullscreenHint}>
                    <MaterialCommunityIcons name="fullscreen" size={24} color="#fff" />
                </View>
            )}
        </TouchableOpacity>
    );

    const renderVideo = () => (
        <View style={[styles.videoContainer, compact && styles.compactContainer, style]}>
            <Video
                ref={videoRef}
                source={{ uri: mediaUrl }}
                style={[styles.video, compact && styles.compactVideo]}
                resizeMode="contain"
                paused={videoPaused}
                controls={false}
                onLoad={() => {
                    setIsLoading(false);
                }}
                onError={(error) => {
                    console.error('Video error:', error);
                    setError('Failed to load video');
                    setIsLoading(false);
                }}
                onBuffer={({ isBuffering }) => {
                    setIsLoading(isBuffering);
                }}
            />
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
            <View style={styles.videoControls}>
                <TouchableOpacity
                    style={styles.playButton}
                    onPress={handlePlayPauseVideo}
                >
                    <MaterialCommunityIcons
                        name={isPlaying ? 'pause-circle' : 'play-circle'}
                        size={compact ? 40 : 60}
                        color="rgba(255, 255, 255, 0.9)"
                    />
                </TouchableOpacity>
                {enableFullscreen && (
                    <TouchableOpacity
                        style={styles.fullscreenButton}
                        onPress={() => setShowFullscreen(true)}
                    >
                        <MaterialCommunityIcons
                            name="fullscreen"
                            size={24}
                            color="#fff"
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderAudio = () => (
        <View style={[styles.audioContainer, compact && styles.compactAudioContainer, style]}>
            <TouchableOpacity
                style={[styles.audioPlayButton, compact && styles.compactAudioButton]}
                onPress={handlePlayPauseAudio}
            >
                <MaterialCommunityIcons
                    name={isPlaying ? 'pause-circle' : 'play-circle'}
                    size={compact ? 40 : 56}
                    color={getMediaColor()}
                />
            </TouchableOpacity>
            <View style={styles.audioInfo}>
                <View style={styles.audioHeader}>
                    <MaterialCommunityIcons
                        name="music"
                        size={20}
                        color={getMediaColor()}
                    />
                    <Text style={styles.audioTitle}>Audio Question</Text>
                </View>
                {audioDuration > 0 && (
                    <View style={styles.audioProgress}>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${(audioPosition / audioDuration) * 100}%`,
                                        backgroundColor: getMediaColor(),
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.audioTime}>
                            {formatTime(audioPosition)} / {formatTime(audioDuration)}
                        </Text>
                    </View>
                )}
                {isLoading && (
                    <View style={styles.audioLoading}>
                        <ActivityIndicator size="small" color={getMediaColor()} />
                        <Text style={styles.loadingText}>Loading audio...</Text>
                    </View>
                )}
            </View>
        </View>
    );

    const renderError = () => (
        <View style={[styles.errorContainer, compact && styles.compactContainer, style]}>
            <MaterialCommunityIcons
                name="alert-circle"
                size={compact ? 32 : 48}
                color="#F44336"
            />
            <Text style={[styles.errorText, compact && styles.compactText]}>
                {error || 'Failed to load media'}
            </Text>
        </View>
    );

    const renderFullscreenModal = () => (
        <Modal
            visible={showFullscreen}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
                setShowFullscreen(false);
                if (mediaType === MediaType.VIDEO) {
                    setVideoPaused(true);
                    setIsPlaying(false);
                }
            }}
        >
            <View style={styles.fullscreenContainer}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                        setShowFullscreen(false);
                        if (mediaType === MediaType.VIDEO) {
                            setVideoPaused(true);
                            setIsPlaying(false);
                        }
                    }}
                >
                    <MaterialCommunityIcons name="close" size={30} color="#fff" />
                </TouchableOpacity>

                {mediaType === MediaType.IMAGE && (
                    <Image
                        source={{ uri: mediaUrl }}
                        style={styles.fullscreenImage}
                        resizeMode="contain"
                    />
                )}

                {mediaType === MediaType.VIDEO && (
                    <Video
                        source={{ uri: mediaUrl }}
                        style={styles.fullscreenVideo}
                        resizeMode="contain"
                        controls={true}
                        paused={false}
                    />
                )}
            </View>
        </Modal>
    );

    // Main render
    if (error) {
        return renderError();
    }

    return (
        <>
            {mediaType === MediaType.IMAGE && renderImage()}
            {mediaType === MediaType.VIDEO && renderVideo()}
            {mediaType === MediaType.AUDIO && renderAudio()}
            {showFullscreen && renderFullscreenModal()}
        </>
    );
};

const styles = StyleSheet.create({
    // Image styles
    imageContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
    },
    compactContainer: {
        height: 120,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    compactImage: {
        height: 120,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenHint: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 8,
    },

    // Video styles
    videoContainer: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000',
        position: 'relative',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    compactVideo: {
        height: 150,
    },
    videoControls: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 50,
        padding: 10,
    },
    fullscreenButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 8,
    },

    // Audio styles
    audioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        gap: 16,
    },
    compactAudioContainer: {
        padding: 12,
        gap: 12,
    },
    audioPlayButton: {
        backgroundColor: '#fff',
        borderRadius: 40,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    compactAudioButton: {
        padding: 6,
    },
    audioInfo: {
        flex: 1,
        gap: 8,
    },
    audioHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    audioTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    audioProgress: {
        gap: 4,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    audioTime: {
        fontSize: 12,
        color: '#666',
    },
    audioLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
    },

    // Error styles
    errorContainer: {
        width: '100%',
        height: 200,
        backgroundColor: '#ffebee',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        padding: 16,
    },
    errorText: {
        fontSize: 14,
        color: '#F44336',
        textAlign: 'center',
    },
    compactText: {
        fontSize: 12,
    },

    // Fullscreen modal styles
    fullscreenContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 25,
        padding: 10,
    },
    fullscreenImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    fullscreenVideo: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
});

export default QuestionMediaViewer;