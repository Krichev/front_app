import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {MediaSourceType} from '../entities/QuizState/model/types/question.types';
import YouTubePlayer from './YouTubePlayer';
import AuthenticatedVideo from './AuthenticatedVideo';
import Video from 'react-native-video';

interface ExternalVideoPlayerProps {
    mediaSourceType: MediaSourceType;
    videoUrl?: string; // For EXTERNAL_URL or UPLOADED (proxy)
    videoId?: string; // For YOUTUBE
    startTime?: number;
    endTime?: number;
    autoPlay?: boolean;
    style?: ViewStyle;
    onSegmentEnd?: () => void;
    // Props for AuthenticatedVideo/Video
    resizeMode?: 'contain' | 'cover' | 'stretch';
    shouldPlay?: boolean;
}

const ExternalVideoPlayer: React.FC<ExternalVideoPlayerProps> = ({
    mediaSourceType,
    videoUrl,
    videoId,
    startTime = 0,
    endTime,
    autoPlay = false,
    style,
    onSegmentEnd,
    resizeMode = 'contain',
    shouldPlay = false,
}) => {
    // 1. YouTube
    if (mediaSourceType === MediaSourceType.YOUTUBE && videoId) {
        return (
            <YouTubePlayer
                videoId={videoId}
                startTime={startTime}
                endTime={endTime}
                autoPlay={autoPlay || shouldPlay}
                onSegmentEnd={onSegmentEnd}
                style={style}
            />
        );
    }

    // 2. Direct External URL (mp4, etc.)
    if (mediaSourceType === MediaSourceType.EXTERNAL_URL && videoUrl) {
        return (
            <View style={[styles.container, style]}>
                <Video
                    source={{uri: videoUrl}}
                    style={styles.video}
                    resizeMode={resizeMode}
                    paused={!autoPlay && !shouldPlay}
                    controls={true}
                    onProgress={(data) => {
                        if (endTime && data.currentTime >= endTime) {
                            // Can't easily pause from here without ref, but can trigger callback
                            if (onSegmentEnd) onSegmentEnd();
                        }
                    }}
                    // Basic start time handling (seek on load would be needed for true start time)
                    onLoad={(data) => {
                        if (startTime > 0) {
                            // Need ref to seek. 
                            // For simplicity in this iteration, we might assume full playback or 
                            // require a ref-based implementation if precise start is critical for direct files.
                        }
                    }}
                />
            </View>
        );
    }

    // 3. Uploaded (Proxy URL)
    if (mediaSourceType === MediaSourceType.UPLOADED || !mediaSourceType) {
        return (
            <AuthenticatedVideo
                uri={videoUrl}
                style={style}
                resizeMode={resizeMode}
                shouldPlay={autoPlay || shouldPlay}
                // AuthenticatedVideo doesn't support segment timing out of the box yet
                // We'd need to enhance it or accept that uploaded videos play fully for now
            />
        );
    }

    return null;
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 200,
        backgroundColor: '#000',
        borderRadius: 8,
        overflow: 'hidden',
    },
    video: {
        width: '100%',
        height: '100%',
    },
});

export default ExternalVideoPlayer;
