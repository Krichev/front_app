import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Animated,
    BackHandler,
    Dimensions,
    Image,
    LayoutChangeEvent,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
    ViewStyle,
} from 'react-native';
import YoutubePlayer, {YoutubeIframeRef} from 'react-native-youtube-iframe';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import {useTranslation} from 'react-i18next';

interface YouTubePlayerProps {
    videoId: string;
    startTime?: number;
    endTime?: number;
    autoPlay?: boolean;
    showControls?: boolean;
    hideTitle?: boolean;
    enableFullscreen?: boolean;
    initialFullscreen?: boolean;
    onlyPlayButton?: boolean;
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
                                                         enableFullscreen = false,
                                                         initialFullscreen = false,
                                                         onlyPlayButton = false,
                                                         onFullscreenChange,
                                                         onReady,
                                                         onStateChange,
                                                         onSegmentEnd,
                                                         onPlayingChange,
                                                         style,
                                                     }) => {
    const { t } = useTranslation();
    const playerRef = useRef<YoutubeIframeRef>(null);

    const [playing, setPlaying] = useState(autoPlay);
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [replayKey, setReplayKey] = useState(0);
    const [playerHeight, setPlayerHeight] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);

    // THUMBNAIL MODE
    const [videoStarted, setVideoStarted] = useState(autoPlay || !onlyPlayButton);
    const [thumbnailFailed, setThumbnailFailed] = useState(false);
    const [showOverlay, setShowOverlay] = useState(!autoPlay);

    // CUSTOM CONTROLS STATE
    const [controlsVisible, setControlsVisible] = useState(false);
    const [currentTime, setCurrentTime] = useState(startTime);
    const [duration, setDuration] = useState(0);

    const currentTimeRef = useRef(startTime);
    const wasPlayingRef = useRef(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout>();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const overlayOpacity = useRef(new Animated.Value(1)).current;

    const playerWidth = isFullscreen ? screenWidth : containerWidth;
    const playerHeightFinal = isFullscreen ? screenHeight : playerHeight;

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${thumbnailFailed ? 'hqdefault' : 'maxresdefault'}.jpg`;

    const resetControlsTimeout = useCallback(() => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            setControlsVisible(false);
        }, 3000);
    }, []);

    const toggleControls = useCallback(() => {
        if (controlsVisible) {
            setControlsVisible(false);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        } else {
            setControlsVisible(true);
            resetControlsTimeout();
        }
    }, [controlsVisible, resetControlsTimeout]);

    useEffect(() => {
        if (onlyPlayButton && !autoPlay) {
            setVideoStarted(false);
            setThumbnailFailed(false);
        }
    }, [onlyPlayButton, autoPlay]);

    const handleThumbnailPress = useCallback(() => {
        setVideoStarted(true);
        setPlaying(true);
        setShowOverlay(true);
        overlayOpacity.setValue(1);
    }, [overlayOpacity]);

    const handleThumbnailError = useCallback(() => {
        setThumbnailFailed(true);
    }, []);

    const handleStateChange = useCallback(async (state: string) => {
        if (state === 'ended') {
            setPlaying(false);
            onSegmentEnd?.();
            if (onlyPlayButton) {
                setVideoStarted(false);
                currentTimeRef.current = startTime;
                setCurrentTime(startTime);
            }
        } else if (state === 'paused') {
            if (autoPlay && !showControls) {
                // Ignore autoPlay forcing it back to play if user actively paused it via tap
                setPlaying(false);
            } else if (onlyPlayButton) {
                try {
                    const time = await playerRef.current?.getCurrentTime();
                    if (time !== undefined) {
                        currentTimeRef.current = time;
                        setCurrentTime(time);
                    }
                } catch { }
                setPlaying(false);
                setVideoStarted(false);
            }
        }
        onStateChange?.(state);
    }, [onSegmentEnd, onStateChange, autoPlay, showControls, onlyPlayButton, startTime]);

    useEffect(() => {
        if (!playing || !isReady) return;
        const interval = setInterval(async () => {
            try {
                const time = await playerRef.current?.getCurrentTime();
                if (time !== undefined) {
                    currentTimeRef.current = time;
                    setCurrentTime(time);
                }
            } catch { }
        }, 500);
        return () => clearInterval(interval);
    }, [playing, isReady]);

    const saveCurrentState = useCallback(async () => {
        if (playerRef.current && isReady) {
            try {
                const time = await playerRef.current.getCurrentTime();
                if (time !== undefined) {
                    currentTimeRef.current = time;
                    setCurrentTime(time);
                }
                wasPlayingRef.current = playing;
            } catch { }
        }
    }, [isReady, playing]);

    const restoreState = useCallback(async () => {
        if (!playerRef.current || !isReady) return;
        try {
            if (currentTimeRef.current > startTime) {
                await playerRef.current.seekTo(currentTimeRef.current, true);
            } else {
                await playerRef.current.seekTo(startTime, true);
            }
            if (wasPlayingRef.current || autoPlay) setTimeout(() => setPlaying(true), 300);
        } catch { }
    }, [isReady, autoPlay, startTime]);

    const toggleFullscreen = useCallback(async () => {
        await saveCurrentState();
        setIsFullscreen(prev => !prev);
    }, [saveCurrentState]);

    useEffect(() => {
        if (isReady) restoreState();
    }, [isFullscreen, screenWidth, screenHeight, isReady, restoreState]);

    useEffect(() => {
        const sub = Dimensions.addEventListener('change', ({ window }) => {
            setOrientation(window.width > window.height ? 'landscape' : 'portrait');
        });
        return () => sub.remove();
    }, []);

    useEffect(() => {
        if (!isFullscreen) return;
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            toggleFullscreen();
            return true;
        });
        return () => backHandler.remove();
    }, [isFullscreen, toggleFullscreen]);

    useEffect(() => {
        StatusBar.setHidden(isFullscreen, 'fade');
        onFullscreenChange?.(isFullscreen);
        return () => StatusBar.setHidden(false, 'fade');
    }, [isFullscreen, onFullscreenChange]);

    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
        const { width, height } = Dimensions.get('window');
        return width > height ? 'landscape' : 'portrait';
    });

    const handleLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        if (width) setContainerWidth(width);
        if (height) setPlayerHeight(height);
    };

    const handleReady = useCallback(async () => {
        setIsReady(true);
        try {
            const vidDuration = await playerRef.current?.getDuration();
            if (vidDuration) setDuration(vidDuration);
        } catch {}

        onReady?.();
        if (autoPlay) setTimeout(() => setPlaying(true), 100);
        setTimeout(restoreState, 200);
    }, [autoPlay, onReady, restoreState]);

    const handleError = useCallback((error: any) => {
        setHasError(true);
    }, [videoId]);

    useEffect(() => {
        if (isReady && showOverlay) {
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(({ finished }) => finished && setShowOverlay(false));
        }
    }, [isReady, showOverlay]);

    useEffect(() => onPlayingChange?.(playing), [playing, onPlayingChange]);

    useEffect(() => {
        if (!playing || !endTime || !isReady) return;
        const interval = setInterval(async () => {
            const ct = await playerRef.current?.getCurrentTime();
            if (ct && ct >= endTime) {
                setPlaying(false);
                onSegmentEnd?.();
            }
        }, 600);
        return () => clearInterval(interval);
    }, [playing, endTime, isReady, onSegmentEnd]);

    useEffect(() => {
        if (isReady && startTime > 0) playerRef.current?.seekTo(startTime, true);
    }, [isReady, startTime]);

    const handleRetry = () => {
        setHasError(false);
        setIsReady(false);
        setShowOverlay(!autoPlay);
        overlayOpacity.setValue(1);
        setReplayKey(k => k + 1);
        setIsFullscreen(false);
        currentTimeRef.current = startTime;
        setCurrentTime(startTime);
        setVideoStarted(autoPlay || !onlyPlayButton);
        setThumbnailFailed(false);
    };

    const commonWebViewProps = {
        allowsInlineMediaPlayback: true,
        allowsFullscreenVideo: false,
        mediaPlaybackRequiresUserAction: false,
        javaScriptEnabled: true,
        domStorageEnabled: true,
        scrollEnabled: false,
        bounces: false,
    } as any;

    const commonPlayerParams = {
        start: startTime,
        end: endTime,
        rel: 0,
        controls: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        fs: 0,
        disablekb: 1,
        cc_load_policy: 0,
    } as any;

    const renderCustomControls = () => {
        if (!showControls) {
            return (
                <TouchableOpacity
                    style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]} // Sits below fullscreen button (zIndex 40)
                    activeOpacity={1}
                    // Toggles play/pause invisibly when showControls is false
                    onPress={() => setPlaying(prev => !prev)}
                />
            );
        }

        const sliderMin = startTime || 0;
        const sliderMax = endTime || duration || 1;

        return (
            <View style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]} pointerEvents="box-none">
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={toggleControls}
                />

                {controlsVisible && (
                    <View style={styles.customControlsContainer} pointerEvents="box-none">

                        <View style={styles.controlsDimmer} pointerEvents="none" />

                        <View style={styles.centerControls} pointerEvents="box-none">
                            <TouchableOpacity
                                onPress={() => {
                                    setPlaying(!playing);
                                    resetControlsTimeout();
                                }}
                            >
                                <MaterialCommunityIcons
                                    name={playing ? "pause-circle" : "play-circle"}
                                    size={64}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.bottomControls}>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={sliderMin}
                                maximumValue={sliderMax}
                                value={currentTime < sliderMin ? sliderMin : currentTime}
                                onSlidingStart={() => {
                                    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                                }}
                                onSlidingComplete={async (val) => {
                                    await playerRef.current?.seekTo(val, true);
                                    setCurrentTime(val);
                                    currentTimeRef.current = val;
                                    resetControlsTimeout();
                                }}
                                minimumTrackTintColor="#FF0000"
                                maximumTrackTintColor="#FFFFFF"
                                thumbTintColor="#FF0000"
                            />
                        </View>
                    </View>
                )}
            </View>
        );
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
                <View style={styles.videoWrapper} onLayout={handleLayout}>
                    {onlyPlayButton && !videoStarted && (
                        <TouchableOpacity
                            style={StyleSheet.absoluteFillObject}
                            activeOpacity={0.9}
                            onPress={handleThumbnailPress}
                        >
                            <Image
                                source={{ uri: thumbnailUrl }}
                                style={styles.thumbnailImage}
                                resizeMode="cover"
                                onError={handleThumbnailError}
                            />
                            <View style={styles.thumbnailOverlay} />
                            <View style={styles.bigPlayButtonContainer}>
                                <MaterialCommunityIcons name="play-circle" size={92} color="#FF0000" />
                            </View>
                        </TouchableOpacity>
                    )}

                    {videoStarted && playerHeight > 0 && playerWidth > 0 && (
                        <>
                            <YoutubePlayer
                                key={replayKey}
                                ref={playerRef}
                                videoId={videoId}
                                play={playing}
                                onChangeState={handleStateChange}
                                onReady={handleReady}
                                onError={handleError}
                                height={playerHeightFinal}
                                width={playerWidth}
                                webViewStyle={{ backgroundColor: 'transparent' }}
                                webViewProps={commonWebViewProps}
                                initialPlayerParams={commonPlayerParams}
                            />
                            {renderCustomControls()}
                        </>
                    )}

                    {/* REMOVED showControls check here so fullscreen button ALWAYS works if enabled */}
                    {enableFullscreen && videoStarted && (
                        <TouchableOpacity style={styles.fullscreenButton} onPress={toggleFullscreen}>
                            <MaterialCommunityIcons name="fullscreen" size={28} color="#fff" />
                        </TouchableOpacity>
                    )}

                    {showOverlay && videoStarted && (
                        <Animated.View style={[styles.loadingOverlay, { opacity: overlayOpacity }]}>
                            <View style={styles.loadingOverlayDimmed}>
                                <ActivityIndicator size="large" color="#fff" />
                            </View>
                        </Animated.View>
                    )}
                </View>
            )}

            <Modal
                visible={isFullscreen && videoStarted}
                transparent={false}
                animationType="fade"
                statusBarTranslucent
                supportedOrientations={['portrait', 'landscape']}
                onRequestClose={toggleFullscreen}
            >
                <View style={styles.fullscreenContainer}>
                    <View style={styles.fullscreenVideoWrapper}>
                        <YoutubePlayer
                            key={`${replayKey}-fs`}
                            ref={playerRef}
                            videoId={videoId}
                            play={playing}
                            onChangeState={handleStateChange}
                            onReady={handleReady}
                            onError={handleError}
                            height={playerHeightFinal}
                            width={playerWidth}
                            webViewStyle={{ backgroundColor: 'transparent' }}
                            webViewProps={commonWebViewProps}
                            initialPlayerParams={commonPlayerParams}
                        />
                        {renderCustomControls()}
                    </View>
                    <TouchableOpacity style={styles.exitFullscreenButton} onPress={toggleFullscreen}>
                        <MaterialCommunityIcons name="fullscreen-exit" size={36} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: { width: '100%', backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' },
    videoWrapper: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', position: 'relative', overflow: 'hidden' },
    errorContainer: { width: '100%', aspectRatio: 16 / 9, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 20 },
    errorText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
    retryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 16, gap: 8 },
    retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 20, backgroundColor: '#000' },
    loadingOverlayDimmed: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },

    // Z-index bumped to 40 so it stays above the custom controls interceptor Z-index 10
    fullscreenButton: { position: 'absolute', top: 12, right: 12, zIndex: 40, padding: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20 },
    fullscreenContainer: { flex: 1, backgroundColor: '#000' },
    fullscreenVideoWrapper: { flex: 1, backgroundColor: '#000' },
    exitFullscreenButton: { position: 'absolute', top: 55, right: 20, zIndex: 50, padding: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 30 },
    thumbnailImage: { width: '100%', height: '100%' },
    thumbnailOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
    bigPlayButtonContainer: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -46 }, { translateY: -46 }], zIndex: 30 },

    // Custom Controls Styles
    customControlsContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    controlsDimmer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    centerControls: { position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
    bottomControls: { position: 'absolute', bottom: 15, left: 10, right: 10, zIndex: 20 },
});

export default YouTubePlayer;