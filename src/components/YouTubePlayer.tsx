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
        <View style={[styles.container, style]}>
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
                    <YoutubePlayer
                        key={replayKey}
                        ref={playerRef}
                        height={height}
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
                            modestbranding: true,
                            controls: showControls,
                            preventFullScreen: !showControls,
                        }}
                    />
                    {/* Custom play/pause overlay when YouTube controls are hidden */}
                    {!showControls && !playing && isReady && !hasError && (
                        <TouchableOpacity
                            style={styles.customPlayOverlay}
                            onPress={() => setPlaying(true)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.customPlayButton}>
                                <MaterialCommunityIcons name="play" size={48} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
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
    customPlayOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
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