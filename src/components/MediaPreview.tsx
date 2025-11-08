import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Audio, AVPlaybackStatus, ResizeMode, Video} from 'expo-av';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MediaUploadService from "../services/media/MediaUploadService.ts";

interface MediaPreviewProps {
    mediaId?: string | number;
    mediaUrl?: string;
    thumbnailUrl?: string;
    mediaType?: 'image' | 'video' | 'audio';
    style?: any;
    height?: number;
    width?: number;
    resizeMode?: 'cover' | 'contain' | 'stretch';
    showControls?: boolean;
    autoPlay?: boolean;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
                                                       mediaId,
                                                       mediaUrl: providedMediaUrl,
                                                       thumbnailUrl: providedThumbnailUrl,
                                                       mediaType = 'image',
                                                       style,
                                                       height = 200,
                                                       width = Dimensions.get('window').width - 48,
                                                       resizeMode = 'cover',
                                                       showControls = true,
                                                       autoPlay = false,
                                                   }) => {
    const [mediaUrl, setMediaUrl] = useState<string | null>(providedMediaUrl || null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(providedThumbnailUrl || null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
    const videoRef = React.useRef<Video>(null);
    const [sound, setSound] = React.useState<Audio.Sound | null>(null);

    // Fetch media URLs if mediaId is provided
    useEffect(() => {
        const fetchMediaUrls = async () => {
            if (mediaId && !providedMediaUrl) {
                try {
                    setLoading(true);
                    const urls = await MediaUploadService.getMediaUrl(String(mediaId));

                    if (urls) {
                        setMediaUrl(urls.mediaUrl);
                        setThumbnailUrl(urls.thumbnailUrl);
                        setError(null);
                    } else {
                        setError('Failed to load media');
                    }
                } catch (err) {
                    console.error('Error fetching media URLs:', err);
                    setError('Failed to load media');
                } finally {
                    setLoading(false);
                }
            } else if (providedMediaUrl) {
                setMediaUrl(providedMediaUrl);
                setThumbnailUrl(providedThumbnailUrl || null);
                setLoading(false);
            } else {
                setLoading(false);
            }
        };

        fetchMediaUrls();
    }, [mediaId, providedMediaUrl, providedThumbnailUrl]);

    // Cleanup audio on unmount
    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    const handlePlayPause = async () => {
        if (mediaType === 'video' && videoRef.current) {
            if (isPlaying) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
            setIsPlaying(!isPlaying);
        } else if (mediaType === 'audio') {
            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                } else {
                    await sound.playAsync();
                }
                setIsPlaying(!isPlaying);
            } else if (mediaUrl) {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: mediaUrl },
                    { shouldPlay: true }
                );
                setSound(newSound);
                setIsPlaying(true);
            }
        }
    };

    const renderLoadingState = () => (
        <View style={[styles.container, { height, width }, style]}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading media...</Text>
        </View>
    );

    const renderErrorState = () => (
        <View style={[styles.container, styles.errorContainer, { height, width }, style]}>
            <MaterialCommunityIcons name="alert-circle" size={40} color="#F44336" />
            <Text style={styles.errorText}>{error || 'Failed to load media'}</Text>
        </View>
    );

    const renderImage = () => (
        <View style={[styles.mediaContainer, { height, width }, style]}>
            <Image
                source={{ uri: thumbnailUrl || mediaUrl || '' }}
                style={styles.image}
                resizeMode={resizeMode}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                    setError('Failed to load image');
                    setLoading(false);
                }}
            />
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
        </View>
    );

    const renderVideo = () => (
        <View style={[styles.mediaContainer, { height, width }, style]}>
            <Video
                ref={videoRef}
                source={{ uri: mediaUrl || '' }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls={showControls}
                isLooping={false}
                onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                    if (status.isLoaded) {
                        setIsPlaying(status.isPlaying);
                        setLoading(false);
                    }
                }}
                onError={() => {
                    setError('Failed to load video');
                    setLoading(false);
                }}
            />
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
            {!showControls && (
                <TouchableOpacity
                    style={styles.playPauseButton}
                    onPress={handlePlayPause}
                >
                    <MaterialCommunityIcons
                        name={isPlaying ? 'pause-circle' : 'play-circle'}
                        size={60}
                        color="rgba(255, 255, 255, 0.9)"
                    />
                </TouchableOpacity>
            )}
        </View>
    );

    const renderAudio = () => (
        <View style={[styles.audioContainer, { width }, style]}>
            <TouchableOpacity
                style={styles.audioPlayButton}
                onPress={handlePlayPause}
            >
                <MaterialCommunityIcons
                    name={isPlaying ? 'pause-circle' : 'play-circle'}
                    size={50}
                    color="#007AFF"
                />
            </TouchableOpacity>
            <View style={styles.audioInfo}>
                <Text style={styles.audioTitle}>Audio Question</Text>
                <Text style={styles.audioStatus}>
                    {isPlaying ? 'Playing...' : 'Tap to play'}
                </Text>
            </View>
        </View>
    );

    if (loading && !mediaUrl) {
        return renderLoadingState();
    }

    if (error || !mediaUrl) {
        return renderErrorState();
    }

    switch (mediaType) {
        case 'image':
            return renderImage();
        case 'video':
            return renderVideo();
        case 'audio':
            return renderAudio();
        default:
            return renderErrorState();
    }
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaContainer: {
        backgroundColor: '#000',
        borderRadius: 12,
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
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#F44336',
    },
    errorText: {
        marginTop: 8,
        fontSize: 14,
        color: '#F44336',
        textAlign: 'center',
    },
    playPauseButton: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -30,
        marginLeft: -30,
    },
    audioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    audioPlayButton: {
        marginRight: 16,
    },
    audioInfo: {
        flex: 1,
    },
    audioTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    audioStatus: {
        fontSize: 14,
        color: '#666',
    },
});

export default MediaPreview;