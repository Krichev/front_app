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
    View,
    ViewStyle,
} from 'react-native';
import YoutubePlayer, {YoutubeIframeRef} from 'react-native-youtube-iframe';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import {useTranslation} from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

import { useDimensions } from '../shared/hooks/useDimensions';

/**
 * Formats seconds as mm:ss, relative to segment start.
 * e.g. formatSegmentTime(75, 30) => "0:45"  (75 - 30 = 45 seconds into segment)
 */
const formatSegmentTime = (currentTime: number, segmentStart: number): string => {
    const relative = Math.max(0, currentTime - segmentStart);
    const minutes = Math.floor(relative / 60);
    const seconds = Math.floor(relative % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

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
    const insets = useSafeAreaInsets();
    const playerRef = useRef<YoutubeIframeRef>(null);
    const { width: screenWidth, height: screenHeight } = useDimensions();

    const [playing, setPlaying] = useState(autoPlay);
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [replayKey, setReplayKey] = useState(0);
    const [playerHeight, setPlayerHeight] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
    const isTransitioningRef = useRef(false);

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
    const overlayOpacity = useRef(new Animated.Value(1)).current;

    // === DIAGNOSTIC LOGGING ===
    useEffect(() => {
        if (__DEV__) {
            console.log('🎬 [YouTubePlayer] State snapshot:', {
                videoId,
                showControls,
                autoPlay,
                onlyPlayButton,
                enableFullscreen,
                playing,
                isReady,
                hasError,
                videoStarted,
                showOverlay,
                controlsVisible,
                isFullscreen,
                currentTime: currentTimeRef.current,
                duration,
            });
        }
    }, [playing, isReady, hasError, videoStarted, showOverlay, controlsVisible, isFullscreen, duration]);

    // Safe area aware fullscreen dimensions
    const safeWidth = screenWidth - insets.left - insets.right;
    const safeHeight = screenHeight - insets.top - insets.bottom;

    // In fullscreen, fit 16:9 video within safe area using "contain" logic
    let fullscreenVideoWidth = safeWidth;
    let fullscreenVideoHeight = safeWidth * 9 / 16;
    if (fullscreenVideoHeight > safeHeight) {
        fullscreenVideoHeight = safeHeight;
        fullscreenVideoWidth = safeHeight * 16 / 9;
    }

    const playerWidth = isFullscreen ? fullscreenVideoWidth : containerWidth;
    const playerHeightFinal = isFullscreen ? fullscreenVideoHeight : playerHeight;

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${thumbnailFailed ? 'hqdefault' : 'maxresdefault'}.jpg`;

    const resetControlsTimeout = useCallback(() => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            setControlsVisible(false);
        }, 4000);
    }, []);

    const toggleControls = useCallback(() => {
        if (__DEV__) console.log('🎬 [YouTubePlayer] toggleControls', { wasVisible: controlsVisible, willBeVisible: !controlsVisible });
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

    // Auto-show custom controls when showControls=true and video has started
    useEffect(() => {
        if (showControls && videoStarted && isReady) {
            if (__DEV__) console.log('🎬 [YouTubePlayer] Auto-showing controls (showControls=true, videoStarted, isReady)');
            setControlsVisible(true);
            resetControlsTimeout();
        }
    }, [showControls, videoStarted, isReady]);

    const handleThumbnailPress = useCallback(() => {
        if (__DEV__) console.log('🎬 [YouTubePlayer] Thumbnail pressed, starting video', { videoId });
        setVideoStarted(true);
        setPlaying(true);
        setShowOverlay(true);
        overlayOpacity.setValue(1);
    }, [overlayOpacity, videoId]);

    const handleThumbnailError = useCallback(() => {
        setThumbnailFailed(true);
    }, []);

    const handleStateChange = useCallback(async (state: string) => {
        if (__DEV__) console.log('🎬 [YouTubePlayer] onChangeState:', state, { videoId, playing, videoStarted, showControls, onlyPlayButton });
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
    }, [onSegmentEnd, onStateChange, autoPlay, showControls, onlyPlayButton, startTime, videoId, playing, videoStarted]);

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
        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;
        await saveCurrentState();
        setIsFullscreen(prev => !prev);
        setTimeout(() => { isTransitioningRef.current = false; }, 500);
    }, [saveCurrentState]);

    const handleSkipBack = useCallback(async () => {
        const minTime = startTime || 0;
        const targetTime = Math.max(minTime, currentTimeRef.current - 10);
        try {
            await playerRef.current?.seekTo(targetTime, true);
            setCurrentTime(targetTime);
            currentTimeRef.current = targetTime;
            resetControlsTimeout();
        } catch { /* silent */ }
    }, [startTime, resetControlsTimeout]);

    const handleSkipForward = useCallback(async () => {
        const maxTime = endTime || duration || Infinity;
        const targetTime = Math.min(maxTime, currentTimeRef.current + 10);
        try {
            await playerRef.current?.seekTo(targetTime, true);
            setCurrentTime(targetTime);
            currentTimeRef.current = targetTime;
            resetControlsTimeout();
        } catch { /* silent */ }
    }, [endTime, duration, resetControlsTimeout]);

    const handleReplayFromStart = useCallback(async () => {
        try {
            const seekTarget = startTime || 0;
            await playerRef.current?.seekTo(seekTarget, true);
            currentTimeRef.current = seekTarget;
            setCurrentTime(seekTarget);
            setPlaying(true);
            resetControlsTimeout();
        } catch { /* seekTo can fail silently */ }
    }, [startTime, resetControlsTimeout]);

    useEffect(() => {
        if (isReady) restoreState();
    }, [isFullscreen, screenWidth, screenHeight, isReady, restoreState]);

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

    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
        screenWidth > screenHeight ? 'landscape' : 'portrait'
    );

    useEffect(() => {
        const sub = Dimensions.addEventListener('change', ({ window }) => {
            if (window.width === 0 || window.height === 0) return; // Guard against nonsensical values
            const newOrientation = window.width > window.height ? 'landscape' : 'portrait';
            setOrientation(newOrientation);
        });
        return () => sub.remove();
    }, []);

    // Auto-fullscreen on landscape, auto-exit on portrait
    useEffect(() => {
        if (!enableFullscreen || !videoStarted || isTransitioningRef.current) return;

        const shouldBeFullscreen = orientation === 'landscape';
        if (shouldBeFullscreen && !isFullscreen) {
            isTransitioningRef.current = true;
            saveCurrentState().then(() => {
                setIsFullscreen(true);
                setTimeout(() => { isTransitioningRef.current = false; }, 500);
            });
        } else if (!shouldBeFullscreen && isFullscreen) {
            isTransitioningRef.current = true;
            saveCurrentState().then(() => {
                setIsFullscreen(false);
                setTimeout(() => { isTransitioningRef.current = false; }, 500);
            });
        }
    }, [orientation, enableFullscreen, videoStarted, isFullscreen, saveCurrentState]);

    const handleLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        if (width) setContainerWidth(width);
        if (height) setPlayerHeight(height);
    };

    const handleReady = useCallback(async () => {
        if (__DEV__) console.log('🎬 [YouTubePlayer] handleReady fired', { videoId, autoPlay, showOverlay, showControls });
        setIsReady(true);
        try {
            const vidDuration = await playerRef.current?.getDuration();
            if (vidDuration) setDuration(vidDuration);
        } catch {}

        onReady?.();
        if (autoPlay) setTimeout(() => setPlaying(true), 100);
        setTimeout(restoreState, 200);
    }, [autoPlay, onReady, restoreState, videoId, showOverlay, showControls]);

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
    }, [isReady, showOverlay, overlayOpacity]);

    // Safety: Force-hide overlay after 5 seconds even if animation glitches
    useEffect(() => {
        if (videoStarted && showOverlay) {
            const safetyTimer = setTimeout(() => {
                if (__DEV__) console.log('🎬 [YouTubePlayer] Safety timer: force-hiding overlay');
                setShowOverlay(false);
                overlayOpacity.setValue(0);
            }, 5000);
            return () => clearTimeout(safetyTimer);
        }
    }, [videoStarted, showOverlay, overlayOpacity]);

    useEffect(() => onPlayingChange?.(playing), [playing, onPlayingChange]);

    // Tighter polling for segment boundaries (250ms)
    useEffect(() => {
        if (!playing || !isReady) return;
        const interval = setInterval(async () => {
            try {
                const ct = await playerRef.current?.getCurrentTime();
                if (ct === undefined) return;

                // 1. End Time Enforcement
                if (endTime && ct >= endTime) {
                    setPlaying(false);
                    onSegmentEnd?.();
                }
                // 2. Start Time Enforcement (Clamping)
                if (startTime > 0 && ct < startTime - 0.5) { // Allow 0.5s buffer
                    await playerRef.current?.seekTo(startTime, true);
                }
            } catch { /* silent */ }
        }, 250);
        return () => clearInterval(interval);
    }, [playing, endTime, startTime, isReady, onSegmentEnd]);

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
        if (__DEV__) console.log('🎬 [YouTubePlayer] renderCustomControls called', { showControls, controlsVisible, playing, videoStarted });
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
        const displayTime = Math.min(Math.max(currentTime, sliderMin), sliderMax);
        const displayDuration = endTime || duration || 0;
        const isSeekDisabled = displayDuration === 0;

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
                            <View style={styles.centerControlsRow}>
                                {/* Replay from start */}
                                <TouchableOpacity
                                    onPress={handleReplayFromStart}
                                    style={styles.controlButton}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    accessibilityLabel={t('wwwPhases.youtube.replay')}
                                >
                                    <MaterialCommunityIcons
                                        name="replay"
                                        size={28}
                                        color="rgba(255,255,255,0.85)"
                                    />
                                </TouchableOpacity>

                                {/* Skip back 10s */}
                                <TouchableOpacity
                                    onPress={handleSkipBack}
                                    style={styles.controlButton}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    accessibilityLabel={t('wwwPhases.youtube.rewind10')}
                                >
                                    <MaterialCommunityIcons
                                        name="rewind-10"
                                        size={36}
                                        color="rgba(255,255,255,0.92)"
                                    />
                                </TouchableOpacity>

                                {/* Play / Pause */}
                                <TouchableOpacity
                                    onPress={() => {
                                        setPlaying(!playing);
                                        resetControlsTimeout();
                                    }}
                                    style={styles.controlButton}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    accessibilityLabel={t('wwwPhases.youtube.playPause')}
                                >
                                    <MaterialCommunityIcons
                                        name={playing ? "pause-circle" : "play-circle"}
                                        size={64}
                                        color="#fff"
                                    />
                                </TouchableOpacity>

                                {/* Skip forward 10s */}
                                <TouchableOpacity
                                    onPress={handleSkipForward}
                                    style={styles.controlButton}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    accessibilityLabel={t('wwwPhases.youtube.forward10')}
                                >
                                    <MaterialCommunityIcons
                                        name="fast-forward-10"
                                        size={36}
                                        color="rgba(255,255,255,0.92)"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.bottomControls}>
                            <View style={styles.bottomControlsRow}>
                                <Text style={styles.timeLabel}>
                                    {formatSegmentTime(displayTime, startTime)}
                                </Text>
                                <Slider
                                    style={styles.seekSlider}
                                    minimumValue={sliderMin}
                                    maximumValue={sliderMax}
                                    value={displayTime}
                                    disabled={isSeekDisabled}
                                    onSlidingStart={() => {
                                        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                                    }}
                                    onSlidingComplete={async (val) => {
                                        const minTime = startTime || 0;
                                        const maxTime = endTime || duration || Infinity;
                                        const clamped = Math.min(Math.max(val, minTime), maxTime);
                                        try {
                                            await playerRef.current?.seekTo(clamped, true);
                                            setCurrentTime(clamped);
                                            currentTimeRef.current = clamped;
                                        } catch { /* silent */ }
                                        resetControlsTimeout();
                                    }}
                                    minimumTrackTintColor="#FF0000"
                                    maximumTrackTintColor="rgba(255,255,255,0.4)"
                                    thumbTintColor="#FF0000"
                                />
                                <Text style={styles.timeLabel}>
                                    {formatSegmentTime(displayDuration, startTime)}
                                </Text>
                            </View>
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
                    <View style={[
                        styles.fullscreenSafeArea,
                        {
                            paddingTop: insets.top,
                            paddingBottom: insets.bottom,
                            paddingLeft: insets.left,
                            paddingRight: insets.right,
                        }
                    ]}>
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
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.exitFullscreenButton,
                            { top: insets.top + 12, right: insets.right + 12 }
                        ]}
                        onPress={toggleFullscreen}
                    >
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
    loadingOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 5, backgroundColor: '#000' },
    loadingOverlayDimmed: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },

    // Z-index bumped to 40 so it stays above the custom controls interceptor Z-index 10
    fullscreenButton: { position: 'absolute', top: 12, right: 12, zIndex: 40, padding: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20 },
    fullscreenContainer: { flex: 1, backgroundColor: '#000', position: 'relative' },
    fullscreenSafeArea: { flex: 1 },
    fullscreenVideoWrapper: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    exitFullscreenButton: {
        position: 'absolute',
        zIndex: 50,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 30,
    },
    thumbnailImage: { width: '100%', height: '100%' },
    thumbnailOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
    bigPlayButtonContainer: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -46 }, { translateY: -46 }], zIndex: 30 },

    // Custom Controls Styles
    customControlsContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    controlsDimmer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    centerControls: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    centerControlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    controlButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomControls: {
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingHorizontal: 8,
    },
    bottomControlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    seekSlider: {
        flex: 1,
        height: 40,
    },
    timeLabel: {
        color: '#fff',
        fontSize: 12,
        fontVariant: ['tabular-nums'],
        minWidth: 40,
        textAlign: 'center',
    },
});

export default YouTubePlayer;