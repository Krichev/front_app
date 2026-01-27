import React, {useCallback, useRef, useState, useEffect} from 'react';
import {View, ViewStyle, StyleSheet} from 'react-native';
import YoutubePlayer, {YoutubeIframeRef} from 'react-native-youtube-iframe';

interface YouTubePlayerProps {
    videoId: string;
    startTime?: number;
    endTime?: number;
    autoPlay?: boolean;
    onReady?: () => void;
    onStateChange?: (state: string) => void;
    onSegmentEnd?: () => void;
    style?: ViewStyle;
    height?: number;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
    videoId,
    startTime = 0,
    endTime,
    autoPlay = false,
    onReady,
    onStateChange,
    onSegmentEnd,
    style,
    height = 200,
}) => {
    const playerRef = useRef<YoutubeIframeRef>(null);
    const [playing, setPlaying] = useState(autoPlay);
    const [isReady, setIsReady] = useState(false);

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

    return (
        <View style={[styles.container, style]}>
            <YoutubePlayer
                ref={playerRef}
                height={height}
                play={playing}
                videoId={videoId}
                onChangeState={handleStateChange}
                onReady={handleReady}
                initialPlayerParams={{
                    start: startTime,
                    end: endTime, // YouTube API supports 'end' parameter but manual check is safer for precise control
                    rel: false, // Don't show related videos
                    modestbranding: true,
                }}
            />
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
});

export default YouTubePlayer;
