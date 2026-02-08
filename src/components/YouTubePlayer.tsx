import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    LayoutChangeEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
    ActivityIndicator,
    Animated,
    Image,
    Modal,
    SafeAreaView,
    Dimensions,
    StatusBar,
} from 'react-native';
import YoutubePlayer, {YoutubeIframeRef} from 'react-native-youtube-iframe';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
                                                         enableFullscreen = false,
                                                         initialFullscreen = false,
                                                         onFullscreenChange,
                                                         onReady,
                                                         onStateChange,
                                                         onSegmentEnd,
                                                         onPlayingChange,
                                                         style,
                                                     }) => {
    const playerRef = useRef<YoutubeIframeRef>(null);
    const [playing, setPlaying] = useState(false); // Start false to prevent flash
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [replayKey, setReplayKey] = useState(0);
    const [playerHeight, setPlayerHeight] = useState<number>(0);

    // Fullscreen state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const hasTriggeredInitialFullscreen = useRef(false);
    const [fullscreenStartTime, setFullscreenStartTime] = useState(startTime);

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
                if (isFullscreen) {
                    setIsFullscreen(false);
                    onFullscreenChange?.(false);
                }
                onSegmentEnd?.();
            }
            onStateChange?.(state);
        },
        [onSegmentEnd, onStateChange, isFullscreen, onFullscreenChange]
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
        if (!playing || !endTime || !isReady || isFullscreen) return;

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
    }, [playing, endTime, isReady, onSegmentEnd, isFullscreen]);

    // Initial seek
    useEffect(() => {
        if (isReady && startTime > 0) {
            playerRef.current?.seekTo(startTime, true);
        }
    }, [isReady, startTime]);

    // Initial Fullscreen effect
    useEffect(() => {
        if (isReady && initialFullscreen && !hasTriggeredInitialFullscreen.current) {
            hasTriggeredInitialFullscreen.current = true;
            openFullscreen();
        }
    }, [isReady, initialFullscreen]);

    const handleRetry = () => {
        setHasError(false);
        setIsReady(false);
        setShowOverlay(true);
        overlayOpacity.setValue(1);
        setReplayKey(prev => prev + 1);
    };

    const openFullscreen = useCallback(async () => {
        let currentTime = startTime;
        try {
            if (playerRef.current) {
                currentTime = await playerRef.current.getCurrentTime();
            }
        } catch (e) {}
        
        setFullscreenStartTime(currentTime);
        setIsFullscreen(true);
        setPlaying(false); // Pause inline player
        onFullscreenChange?.(true);
    }, [startTime, onFullscreenChange]);

    const closeFullscreen = useCallback(async () => {
        setIsFullscreen(false);
        onFullscreenChange?.(false);
        // The inline player will be re-synced if needed, but for now we just resume if it was playing
        setPlaying(true);
    }, [onFullscreenChange]);

    return (
        <View style={[styles.outerContainer, style]}>
            {hasError ? (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="youtube" size={48} color="#FF0000" />
                    <Text style={styles.errorText}>YouTube video unavailable</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                        <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* 16:9 container */}
                    <View style={styles.videoWrapper} onLayout={handleLayout}>
                        {playerHeight > 0 && (
                            <YoutubePlayer
                                key={replayKey}
                                ref={playerRef}
                                videoId={videoId}
                                play={playing && !isFullscreen}
                                onChangeState={handleStateChange}
                                onReady={handleReady}
                                onError={handleError}
                                height={playerHeight}
                                webViewStyle={{ backgroundColor: 'transparent' }}
                                webViewProps={{
                                    allowsInlineMediaPlayback: true,
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
                                }}
                            />
                        )}
                    </View>

                    {/* Loading overlay — hides YouTube iframe initialization flash */}
                    {showOverlay && !hasError && (
                        <Animated.View style={[styles.loadingOverlay, { opacity: overlayOpacity }]}>
                            <Image
                                source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                                style={StyleSheet.absoluteFill}
                                resizeMode="cover"
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

                    {/* Fullscreen Toggle Button */}
                    {enableFullscreen && isReady && !hasError && (
                        <TouchableOpacity 
                            style={styles.fullscreenButton} 
                            onPress={openFullscreen}
                        >
                            <MaterialCommunityIcons name="fullscreen" size={24} color="#fff" />
                        </TouchableOpacity>
                    )}

                    {/* Fullscreen Modal */}
                    <Modal
                        visible={isFullscreen}
                        transparent={false}
                        animationType="fade"
                        onRequestClose={closeFullscreen}
                        supportedOrientations={['portrait', 'landscape']}
                    >
                        <StatusBar hidden />
                        <SafeAreaView style={styles.fullscreenContainer}>
                            <TouchableOpacity style={styles.fullscreenCloseButton} onPress={closeFullscreen}>
                                <MaterialCommunityIcons name="close" size={28} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.fullscreenVideoWrapper}>
                                <YoutubePlayer
                                    key={`fullscreen-${replayKey}`}
                                    videoId={videoId}
                                    play={true}
                                    onChangeState={handleStateChange}
                                    onReady={() => {}}
                                    onError={handleError}
                                    height={Dimensions.get('window').width * (9/16)}
                                    initialPlayerParams={{
                                        start: fullscreenStartTime,
                                        end: endTime,
                                        rel: false,
                                        controls: true, // Always show controls in fullscreen
                                        iv_load_policy: 3,
                                    }}
                                    webViewProps={{
                                        allowsInlineMediaPlayback: true,
                                        javaScriptEnabled: true,
                                        domStorageEnabled: true,
                                    }}
                                />
                            </View>
                        </SafeAreaView>
                    </Modal>
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
    fullscreenButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 15,
    },
    fullscreenContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenCloseButton: {
        position: 'absolute',
        top: 44,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    fullscreenVideoWrapper: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
});

export default YouTubePlayer;
