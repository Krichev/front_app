import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    LayoutChangeEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import YoutubePlayer, {YoutubeIframeRef} from 'react-native-youtube-iframe';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';

interface YouTubePlayerProps {
    videoId: string;
    startTime?: number;
    endTime?: number;
    autoPlay?: boolean;
    showControls?: boolean;
    hideTitle?: boolean;
    onlyPlayButton?: boolean;
    enableFullscreen?: boolean;
    initialFullscreen?: boolean;
    onFullscreenChange?: (isFullscreen: boolean) => void;
    onReady?: () => void;
    onStateChange?: (state: string) => void;
    onSegmentEnd?: () => void;
    onPlayingChange?: (isPlaying: boolean) => void;
    style?: ViewStyle;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
                                                         videoId,
                                                         startTime = 0,
                                                         endTime,
                                                         autoPlay = false,
                                                         showControls = false,
                                                         hideTitle = true,
                                                         onlyPlayButton = false,
                                                         onReady,
                                                         onStateChange,
                                                         onSegmentEnd,
                                                         onPlayingChange,
                                                         style,
                                                     }) => {
    const {t} = useTranslation();
    const playerRef = useRef<YoutubeIframeRef>(null);
    const [playing, setPlaying] = useState(false); // Start false to prevent flash
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [replayKey, setReplayKey] = useState(0);
    const [playerHeight, setPlayerHeight] = useState<number>(0);
    const [orientation, setOrientation] = useState(() => {
        const { width, height } = Dimensions.get('window');
        return width > height ? 'landscape' : 'portrait';
    });

    useEffect(() => {
        const sub = Dimensions.addEventListener('change', ({ window }) => {
            const newOrientation = window.width > window.height ? 'landscape' : 'portrait';
            setOrientation(newOrientation);
        });
        return () => sub.remove();
    }, []);

    // Loading overlay state
    const overlayOpacity = useRef(new Animated.Value(1)).current;
    const [showOverlay, setShowOverlay] = useState(true);

    const handleLayout = (e: LayoutChangeEvent) => {
        const { height } = e.nativeEvent.layout;
        if (height && height !== playerHeight) {
            setPlayerHeight(height);
        }
    };

    const handleStateChange = useCallback(
        (state: string) => {
            if (state === 'ended') {
                setPlaying(false);
                onSegmentEnd?.();
            }
            onStateChange?.(state);
        },
        [onSegmentEnd, onStateChange]
    );

    const handleReady = useCallback(() => {
        setIsReady(true);
        if (autoPlay) {
            // Small delay to ensure iframe is fully rendered before starting playback
            setTimeout(() => setPlaying(true), 150);
        }
        onReady?.();
    }, [onReady, autoPlay]);

    const handleError = useCallback((error: any) => {
        console.error('🎬 [YouTube] Failed to load:', videoId, error);
        setHasError(true);
    }, [videoId]);

    // Fade out overlay when ready
    useEffect(() => {
        if (isReady && showOverlay) {
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) {
                    setShowOverlay(false);
                }
            });
        }
    }, [isReady, showOverlay, overlayOpacity]);

    // Normal toggle (when onlyPlayButton = false)
    const togglePlayPause = useCallback(() => {
        setPlaying(prev => !prev);
    }, []);

    // Only start playing (when onlyPlayButton = true)
    const startPlaying = useCallback(() => {
        if (!playing) setPlaying(true);
    }, [playing]);

    useEffect(() => {
        onPlayingChange?.(playing);
    }, [playing, onPlayingChange]);

    // Stop at endTime
    useEffect(() => {
        if (!playing || !endTime || !isReady) return;

        const interval = setInterval(async () => {
            try {
                const currentTime = await playerRef.current?.getCurrentTime();
                if (currentTime && currentTime >= endTime) {
                    setPlaying(false);
                    onSegmentEnd?.();
                }
            } catch {}
        }, 500);

        return () => clearInterval(interval);
    }, [playing, endTime, isReady, onSegmentEnd]);

    // Initial seek
    useEffect(() => {
        if (isReady && startTime > 0) {
            playerRef.current?.seekTo(startTime, true);
        }
    }, [isReady, startTime]);

    const handleRetry = () => {
        setHasError(false);
        setIsReady(false);
        setShowOverlay(true);
        overlayOpacity.setValue(1);
        setReplayKey(prev => prev + 1);
    };

    return (
        <View style={[styles.outerContainer, style]}>
            {hasError ? (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="youtube" size={48} color="#FF0000" />
                    <Text style={styles.errorText}>{t('wwwPhases.youtube.unavailable')}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                        <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
                        <Text style={styles.retryText}>{t('wwwPhases.youtube.retry')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* 16:9 container */}
                    <View style={styles.videoWrapper} onLayout={handleLayout}>
                        {playerHeight > 0 && (
                            <YoutubePlayer
                                key={`${replayKey}-${orientation}`}
                                ref={playerRef}
                                videoId={videoId}
                                play={playing}
                                onChangeState={handleStateChange}
                                onReady={handleReady}
                                onError={handleError}
                                height={playerHeight}
                                webViewStyle={{ backgroundColor: 'transparent' }}
                                webViewProps={{
                                    allowsInlineMediaPlayback: true,
                                    allowsFullscreenVideo: false, // Prevent YouTube native fullscreen
                                    mediaPlaybackRequiresUserAction: !autoPlay,
                                    javaScriptEnabled: true,
                                    domStorageEnabled: true,
                                    scrollEnabled: false,
                                    bounces: false,
                                    overScrollMode: 'never',
                                    nestedScrollEnabled: false,
                                }}
                                initialPlayerParams={{
                                    start: startTime,
                                    end: endTime,
                                    rel: false,
                                    controls: showControls,
                                    iv_load_policy: 3,
                                    modestbranding: true,
                                    fs: false, // Disable YouTube's own fullscreen
                                    showinfo: 0,
                                } as any}
                            />
                        )}
                    </View>

                    {/* Loading overlay — hides YouTube iframe initialization flash */}
                    {showOverlay && !hasError && (
                        <Animated.View style={[styles.loadingOverlay, { opacity: overlayOpacity }]}>
                            <Image
                                source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                                style={StyleSheet.absoluteFill}
                                resizeMode="contain"
                            />
                            <View style={styles.loadingOverlayDimmed}>
                                <ActivityIndicator size="large" color="#fff" />
                            </View>
                        </Animated.View>
                    )}

                    {/* Custom play overlay */}
                    {!showControls && isReady && !hasError && (
                        <>
                            {/* When onlyPlayButton = true → show ONLY when not playing */}
                            {(!onlyPlayButton || !playing) && (
                                <TouchableOpacity
                                    style={styles.playPauseOverlay}
                                    onPress={onlyPlayButton ? startPlaying : togglePlayPause}
                                    activeOpacity={1}
                                >
                                    {!playing && (
                                        <View style={styles.customPlayButton}>
                                            <MaterialCommunityIcons name="play" size={48} color="#fff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        width: '100%',
        backgroundColor: '#000',
        borderRadius: 8,
        overflow: 'hidden',
    },
    videoWrapper: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
    },
    errorContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: 20,
    },
    errorText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 12,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#444',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 16,
        gap: 8,
    },
    retryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    playPauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    customPlayButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 4,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 20,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    loadingOverlayDimmed: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default YouTubePlayer;
