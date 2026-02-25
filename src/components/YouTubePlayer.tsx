import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Animated,
    BackHandler,
    Dimensions,
    LayoutChangeEvent,
    StatusBar,
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
                                                         enableFullscreen = false,
                                                         initialFullscreen = false,
                                                         onFullscreenChange,
                                                         onReady,
                                                         onStateChange,
                                                         onSegmentEnd,
                                                         onPlayingChange,
                                                         style,
                                                     }) => {
    const {t} = useTranslation();
    const playerRef = useRef<YoutubeIframeRef>(null);
    const [playing, setPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [replayKey, setReplayKey] = useState(0);
    const [playerHeight, setPlayerHeight] = useState<number>(0);

    // Screen dimensions tracking
    const [screenDims, setScreenDims] = useState(() => Dimensions.get('window'));

    useEffect(() => {
        const sub = Dimensions.addEventListener('change', ({ window }) => {
            setScreenDims(window);
        });
        return () => sub.remove();
    }, []);

    // Fullscreen state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const hasTriggeredInitialFullscreen = useRef(false);
    const [showFullscreenControls, setShowFullscreenControls] = useState(true);
    const [fullscreenProgress, setFullscreenProgress] = useState(0);
    const [fullscreenCurrentTime, setFullscreenCurrentTime] = useState(0);
    const [fullscreenDuration, setFullscreenDuration] = useState(0);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Loading overlay state
    const overlayOpacity = useRef(new Animated.Value(1)).current;
    const [showOverlay, setShowOverlay] = useState(true);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const showControlsFunc = useCallback(() => {
        setShowFullscreenControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (playing) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowFullscreenControls(false);
            }, 3000);
        }
    }, [playing]);

    const openFullscreen = useCallback(() => {
        setIsFullscreen(true);
        setShowFullscreenControls(true);
        onFullscreenChange?.(true);
    }, [onFullscreenChange]);

    const closeFullscreen = useCallback(() => {
        setIsFullscreen(false);
        setShowOverlay(false);
        onFullscreenChange?.(false);
    }, [onFullscreenChange]);

    // Android back button
    useEffect(() => {
        if (!isFullscreen) return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            closeFullscreen();
            return true;
        });
        return () => sub.remove();
    }, [isFullscreen, closeFullscreen]);

    // StatusBar toggle
    useEffect(() => {
        StatusBar.setHidden(isFullscreen, 'fade');
        return () => {
            if (isFullscreen) StatusBar.setHidden(false, 'fade');
        };
    }, [isFullscreen]);

    const handleFullscreenTap = useCallback(() => {
        if (showFullscreenControls) {
            setShowFullscreenControls(false);
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        } else {
            showControlsFunc();
        }
    }, [showFullscreenControls, showControlsFunc]);

    // Unified progress tracking
    useEffect(() => {
        if (!playing || !isReady) return;

        const interval = setInterval(async () => {
            try {
                const currentTime = await playerRef.current?.getCurrentTime();
                const duration = await playerRef.current?.getDuration();
                
                if (currentTime !== undefined && duration) {
                    if (isFullscreen) {
                        setFullscreenCurrentTime(currentTime);
                        setFullscreenDuration(duration);
                        const effectiveEnd = endTime || duration;
                        const effectiveStart = startTime || 0;
                        const range = effectiveEnd - effectiveStart;
                        const progress = range > 0 ? (currentTime - effectiveStart) / range : 0;
                        setFullscreenProgress(Math.min(Math.max(progress, 0), 1));
                    }

                    // Check endTime
                    if (endTime && currentTime >= endTime) {
                        setPlaying(false);
                        if (isFullscreen) {
                            closeFullscreen();
                        }
                        onSegmentEnd?.();
                    }
                }
            } catch {}
        }, 500);

        return () => clearInterval(interval);
    }, [isFullscreen, playing, isReady, endTime, startTime, onSegmentEnd, closeFullscreen]);

    // Compute the correct player height for the current mode
    const computedPlayerHeight = (() => {
        if (!isFullscreen) return playerHeight;
        const { width: sw, height: sh } = screenDims;
        const isLandscape = sw > sh;
        if (isLandscape) {
            // Landscape: fill the screen height, player width auto-fills container
            return sh;
        } else {
            // Portrait: width fills screen, height = width * 9/16 (letterboxed vertically)
            return sw * (9 / 16);
        }
    })();

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
                    closeFullscreen();
                }
                onSegmentEnd?.();
            }
            onStateChange?.(state);
        },
        [onSegmentEnd, onStateChange, isFullscreen, closeFullscreen]
    );

    const handleReady = useCallback(() => {
        setIsReady(true);
        if (initialFullscreen) {
            overlayOpacity.setValue(0);
            setShowOverlay(false);
        }
        if (autoPlay) {
            setTimeout(() => setPlaying(true), 150);
        }
        onReady?.();
    }, [onReady, autoPlay, initialFullscreen, overlayOpacity]);

    const handleError = useCallback((error: any) => {
        console.error('🎬 [YouTube] Failed to load:', videoId, error);
        setHasError(true);
    }, [videoId]);

    // Fade out overlay when ready
    useEffect(() => {
        if (isReady && showOverlay && !initialFullscreen) {
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
    }, [isReady, showOverlay, overlayOpacity, initialFullscreen]);

    const togglePlayPause = useCallback(() => {
        setPlaying(prev => !prev);
    }, []);

    const startPlaying = useCallback(() => {
        if (!playing) setPlaying(true);
    }, [playing]);

    useEffect(() => {
        onPlayingChange?.(playing);
    }, [playing, onPlayingChange]);

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
            overlayOpacity.setValue(0);
            setShowOverlay(false);
            setIsFullscreen(true);
            setShowFullscreenControls(true);
            onFullscreenChange?.(true);
            if (autoPlay) {
                setTimeout(() => setPlaying(true), 150);
            }
        }
    }, [isReady, initialFullscreen, autoPlay, onFullscreenChange, overlayOpacity]);

    const handleRetry = () => {
        setHasError(false);
        setIsReady(false);
        setShowOverlay(true);
        overlayOpacity.setValue(1);
        setReplayKey(prev => prev + 1);
    };

    return (
        <View
            style={[
                styles.outerContainer,
                style,
                isFullscreen && {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: screenDims.width,
                    height: screenDims.height,
                    backgroundColor: '#000',
                    zIndex: 9999,
                    elevation: 9999,
                },
            ]}
        >
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
                    {/* Video container — adapts to fullscreen or inline */}
                    <View
                        style={[
                            styles.videoWrapper,
                            isFullscreen && {
                                width: screenDims.width,
                                height: screenDims.height,
                                aspectRatio: undefined,
                                justifyContent: 'center',
                                alignItems: 'center',
                            },
                        ]}
                        onLayout={!isFullscreen ? handleLayout : undefined}
                    >
                        {(isFullscreen || playerHeight > 0) && (
                            <YoutubePlayer
                                key={replayKey}
                                ref={playerRef}
                                videoId={videoId}
                                play={playing}
                                onChangeState={handleStateChange}
                                onReady={handleReady}
                                onError={handleError}
                                height={computedPlayerHeight}
                                webViewStyle={{
                                    backgroundColor: 'transparent',
                                    opacity: isReady ? 1 : 0,
                                }}
                                webViewProps={{
                                    allowsInlineMediaPlayback: true,
                                    allowsFullscreenVideo: false,
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
                                    controls: isFullscreen ? false : showControls,
                                    iv_load_policy: 3,
                                    modestbranding: true,
                                    fs: false,
                                    showinfo: 0,
                                } as any}
                            />
                        )}
                    </View>

                    {/* Loading overlay — inline only */}
                    {showOverlay && !isFullscreen && (
                        <Animated.View
                            style={[styles.loadingOverlay, { opacity: overlayOpacity }]}
                            pointerEvents={isReady ? 'none' : 'auto'}
                        >
                            <ActivityIndicator size="large" color="#FF0000" />
                        </Animated.View>
                    )}

                    {/* Inline play/pause overlay — NOT in fullscreen */}
                    {!isFullscreen && isReady && !hasError && (
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

                    {/* Fullscreen toggle button — inline only */}
                    {!isFullscreen && enableFullscreen && isReady && !hasError && (
                        <TouchableOpacity
                            style={styles.fullscreenButton}
                            onPress={openFullscreen}
                        >
                            <MaterialCommunityIcons name="fullscreen" size={24} color="#fff" />
                        </TouchableOpacity>
                    )}

                    {/* ===== FULLSCREEN CONTROLS OVERLAY ===== */}
                    {isFullscreen && (
                        <TouchableOpacity
                            style={StyleSheet.absoluteFill}
                            activeOpacity={1}
                            onPress={handleFullscreenTap}
                        >
                            {showFullscreenControls && (
                                <View style={styles.fullscreenControlsOverlay}>
                                    {/* Close button */}
                                    <TouchableOpacity
                                        style={styles.fullscreenCloseButton}
                                        onPress={closeFullscreen}
                                    >
                                        <MaterialCommunityIcons name="close" size={28} color="#fff" />
                                    </TouchableOpacity>

                                    {/* Center play/pause */}
                                    <TouchableOpacity
                                        style={styles.fullscreenCenterButton}
                                        onPress={() => {
                                            togglePlayPause();
                                            showControlsFunc();
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name={playing ? 'pause' : 'play'}
                                            size={56}
                                            color="#fff"
                                        />
                                    </TouchableOpacity>

                                    {/* Bottom progress bar */}
                                    <View style={styles.fullscreenBottomBar}>
                                        <Text style={styles.fullscreenTimeText}>
                                            {formatTime(fullscreenCurrentTime)}
                                        </Text>
                                        <View style={styles.fullscreenProgressBar}>
                                            <View
                                                style={[
                                                    styles.fullscreenProgressFill,
                                                    { width: `${fullscreenProgress * 100}%` },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.fullscreenTimeText}>
                                            {formatTime(endTime || fullscreenDuration)}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>
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
        zIndex: 25,
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
    fullscreenControlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    fullscreenCenterButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenBottomBar: {
        position: 'absolute',
        bottom: 40,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fullscreenProgressBar: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    fullscreenProgressFill: {
        height: '100%',
        backgroundColor: '#ff0000',
        borderRadius: 2,
    },
    fullscreenTimeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        minWidth: 40,
        textAlign: 'center',
    },
});

export default YouTubePlayer;
