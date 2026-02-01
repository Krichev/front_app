import React, {useCallback, useRef, useState, useEffect} from 'react';
import {View, ViewStyle, StyleSheet, Text, TouchableOpacity} from 'react-native';
import YoutubePlayer, {YoutubeIframeRef} from 'react-native-youtube-iframe';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface YouTubePlayerProps {
    videoId: string;
    startTime?: number;
    endTime?: number;
    autoPlay?: boolean;
    showControls?: boolean;
    hideTitle?: boolean;
    onReady?: () => void;
    onStateChange?: (state: string) => void;
    onSegmentEnd?: () => void;
    onPlayingChange?: (isPlaying: boolean) => void;
    style?: ViewStyle;
    height?: number;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
    videoId,
    startTime = 0,
    endTime,
    autoPlay = false,
    showControls = true,
    hideTitle = false,
    onReady,
    onStateChange,
    onSegmentEnd,
    onPlayingChange,
    style,
    height = 200,
}) => {
    const playerRef = useRef<YoutubeIframeRef>(null);
    const [playing, setPlaying] = useState(autoPlay);
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [replayKey, setReplayKey] = useState(0);

    // Calculate crop values if hideTitle is true
    // Crop ~18% from top to hide title bar, ~12% from bottom to hide watermark
    const topCropRatio = hideTitle ? 0.18 : 0;
    const bottomCropRatio = hideTitle ? 0.12 : 0;
    const totalExtraHeight = height * (topCropRatio + bottomCropRatio);
    const enlargedHeight = height + totalExtraHeight;
    const topOffset = -(height * topCropRatio);

    const handleStateChange = useCallback((state: string) => {
        if (state === 'ended') {
            setPlaying(false);
            if (onSegmentEnd) onSegmentEnd();
        }
        if (onStateChange) onStateChange(state);
    }, [onSegmentEnd, onStateChange]);

    const handleReady = useCallback(() => {
        setIsReady(true);
        if (onReady) onReady();
    }, [onReady]);

    const handleError = useCallback((error: any) => {
        console.error('🎬 [YouTube] Failed to load:', videoId, error);
        setHasError(true);
    }, [videoId]);

    const togglePlayPause = useCallback(() => {
        setPlaying(prev => !prev);
    }, []);

    useEffect(() => {
        onPlayingChange?.(playing);
    }, [playing, onPlayingChange]);

    // Monitor playback time to stop at endTime
    useEffect(() => {
        if (!playing || !endTime || !isReady) return;

        const interval = setInterval(async () => {
            try {
                const currentTime = await playerRef.current?.getCurrentTime();
                if (currentTime && currentTime >= endTime) {
                    setPlaying(false);
                    if (onSegmentEnd) onSegmentEnd();
                }
            } catch (e) {
                // Ignore errors
            }
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
        setReplayKey(prev => prev + 1);
    };

    return (
        <View style={[styles.outerContainer, style, { height }]}>
            {hasError ? (
                <View style={[styles.errorContainer, { height }]}>
                    <MaterialCommunityIcons name="youtube" size={48} color="#FF0000" />
                    <Text style={styles.errorText}>YouTube video unavailable</Text>
                    <Text style={styles.errorSubtext}>Video ID: {videoId}</Text>
                    {startTime > 0 && (
                        <Text style={styles.errorSubtext}>
                            Segment: {startTime}s - {endTime || 'end'}
                        </Text>
                    )}
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={handleRetry}
                    >
                        <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <View style={{ height: enlargedHeight, marginTop: topOffset }}>
                        <YoutubePlayer
                            key={replayKey}
                            ref={playerRef}
                            height={enlargedHeight}
                            play={playing}
                            videoId={videoId}
                            onChangeState={handleStateChange}
                            onReady={handleReady}
                            onError={handleError}
                            webViewStyle={{ overflow: 'hidden' }}
                            webViewProps={{
                                allowsInlineMediaPlayback: true,
                                mediaPlaybackRequiresUserAction: !autoPlay,
                                javaScriptEnabled: true,
                                domStorageEnabled: true,
                                mixedContentMode: 'compatibility',
                                scrollEnabled: false,
                                bounces: false,
                                overScrollMode: 'never',
                                nestedScrollEnabled: false,
                                onError: () => setHasError(true),
                            }}
                            initialPlayerParams={{
                                start: startTime,
                                end: endTime,
                                rel: false,
                                controls: hideTitle ? false : showControls,
                                preventFullScreen: hideTitle || !showControls,
                            }}
                        />
                    </View>

                    {/* Custom play/pause overlay when YouTube controls are hidden */}
                    {(!showControls || hideTitle) && isReady && !hasError && (
                        <TouchableOpacity
                            style={styles.playPauseOverlay}
                            onPress={togglePlayPause}
                            activeOpacity={1}
                        >
                            {!playing && (
                                <View style={styles.customPlayButton}>
                                    <MaterialCommunityIcons name="play" size={48} color="#fff" />
                                </View>
                            )}
                            {playing && (
                                // Invisible touch area when playing to allow pause
                                <View style={StyleSheet.absoluteFill} />
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
    errorContainer: {
        width: '100%',
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
    errorSubtext: {
        color: '#aaa',
        fontSize: 12,
        marginTop: 4,
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
});

export default YouTubePlayer;
