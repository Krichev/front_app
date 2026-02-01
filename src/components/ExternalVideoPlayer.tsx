import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
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
    showControls?: boolean;
    hideTitle?: boolean;
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
                                                                     showControls = true,
                                                                     hideTitle = false,
                                                                     style,
                                                                     onSegmentEnd,
                                                                     resizeMode = 'contain',
                                                                     shouldPlay = false,
                                                                 }) => {
    // 1. YouTube
    if (mediaSourceType === MediaSourceType.YOUTUBE && videoId) {
        return (
            <View style={[styles.container, style]}>
                <YouTubePlayer
                    videoId={videoId}
                    startTime={startTime}
                    endTime={endTime}
                    autoPlay={autoPlay || shouldPlay}
                    showControls={false} // ✅ FORCE HIDE YOUTUBE CONTROLS
                    hideTitle={true}     // ✅ FORCE HIDE TITLE / UI
                    onSegmentEnd={onSegmentEnd}
                />
            </View>
        );
    }

    // 2. Direct External URL (mp4, etc.)
    if (mediaSourceType === MediaSourceType.EXTERNAL_URL && videoUrl) {
        return (
            <View style={[styles.container, style]}>
                <Video
                    source={{ uri: videoUrl }}
                    style={styles.video}
                    resizeMode={resizeMode}
                    paused={!autoPlay && !shouldPlay}
                    controls={showControls}
                    onProgress={(data) => {
                        if (endTime && data.currentTime >= endTime) {
                            onSegmentEnd?.();
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
            />
        );
    }

    return null;
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 16 / 9, // ✅ keeps correct video ratio, no black bars
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
