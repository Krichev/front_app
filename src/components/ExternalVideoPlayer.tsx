import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    StyleSheet, View, ViewStyle, Modal, TouchableOpacity,
    Dimensions, StatusBar, BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {MediaSourceType} from '../entities/QuizState/model/types/question.types';
import YouTubePlayer from './YouTubePlayer';
import AuthenticatedVideo from './AuthenticatedVideo';
import Video from 'react-native-video';

interface ExternalVideoPlayerProps {
    mediaSourceType: MediaSourceType;
    videoUrl?: string; // For EXTERNAL_URL or UPLOADED (proxy)
    videoId?: string; // For YOUTUBE
    questionId?: number; // For AuthenticatedVideo
    startTime?: number;
    endTime?: number;
    autoPlay?: boolean;
    showControls?: boolean;
    hideTitle?: boolean;
    onlyPlayButton?: boolean;
    enableFullscreen?: boolean;
    initialFullscreen?: boolean;
    onFullscreenChange?: (isFullscreen: boolean) => void;
    style?: ViewStyle;
    onSegmentEnd?: () => void;
    height?: number;
    // Props for AuthenticatedVideo/Video
    resizeMode?: 'contain' | 'cover' | 'stretch';
    shouldPlay?: boolean;
}

const ExternalVideoPlayer: React.FC<ExternalVideoPlayerProps> = ({
                                                                     mediaSourceType,
                                                                     videoUrl,
                                                                     videoId,
                                                                     questionId,
                                                                     startTime = 0,
                                                                     endTime,
                                                                     autoPlay = false,
                                                                     showControls = true,
                                                                     hideTitle = false,
                                                                     onlyPlayButton = false,
                                                                     enableFullscreen = false,
                                                                     initialFullscreen = false,
                                                                     onFullscreenChange,
                                                                     style,
                                                                     onSegmentEnd,
                                                                     height,
                                                                     resizeMode = 'contain',
                                                                     shouldPlay = false,
                                                                 }) => {
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
        const { width, height } = Dimensions.get('window');
        return width > height ? 'landscape' : 'portrait';
    });
    const isTransitioningRef = useRef(false);

    // Orientation listener
    useEffect(() => {
        const sub = Dimensions.addEventListener('change', ({ window }) => {
            if (window.width === 0 || window.height === 0) return;
            setOrientation(window.width > window.height ? 'landscape' : 'portrait');
        });
        return () => sub.remove();
    }, []);

    // Auto fullscreen on landscape (only for non-YouTube paths since YouTube handles its own)
    useEffect(() => {
        if (mediaSourceType === MediaSourceType.YOUTUBE) return; // YouTube handles its own
        if (!enableFullscreen || isTransitioningRef.current) return;

        const shouldBeFullscreen = orientation === 'landscape';
        if (shouldBeFullscreen && !isFullscreen) {
            isTransitioningRef.current = true;
            setIsFullscreen(true);
            setTimeout(() => { isTransitioningRef.current = false; }, 500);
        } else if (!shouldBeFullscreen && isFullscreen) {
            isTransitioningRef.current = true;
            setIsFullscreen(false);
            setTimeout(() => { isTransitioningRef.current = false; }, 500);
        }
    }, [orientation, enableFullscreen, mediaSourceType, isFullscreen]);

    // StatusBar and back handler for fullscreen
    useEffect(() => {
        if (mediaSourceType === MediaSourceType.YOUTUBE) return;
        StatusBar.setHidden(isFullscreen, 'fade');
        onFullscreenChange?.(isFullscreen);
        return () => StatusBar.setHidden(false, 'fade');
    }, [isFullscreen, mediaSourceType, onFullscreenChange]);

    useEffect(() => {
        if (mediaSourceType === MediaSourceType.YOUTUBE || !isFullscreen) return;
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            setIsFullscreen(false);
            return true;
        });
        return () => backHandler.remove();
    }, [isFullscreen, mediaSourceType]);

    const toggleNativeFullscreen = useCallback(() => {
        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;
        setIsFullscreen(prev => !prev);
        setTimeout(() => { isTransitioningRef.current = false; }, 500);
    }, []);

    if (__DEV__) {
        console.log('🎬 [ExternalVideoPlayer] Render:', {
            mediaSourceType,
            videoId: videoId?.substring(0, 20),
            videoUrl: videoUrl?.substring(0, 60),
            autoPlay,
            showControls,
            shouldPlay,
            onlyPlayButton,
            height,
        });
    }

    // Safe area fullscreen dimensions for non-YouTube videos
    const safeWidth = screenWidth - insets.left - insets.right;
    const safeHeight = screenHeight - insets.top - insets.bottom;

    // Combine style with height if provided
    const combinedStyle = [style, height ? { height, aspectRatio: undefined } : {}];

    const renderFullscreenModal = () => {
        if (mediaSourceType === MediaSourceType.YOUTUBE) return null;
        return (
            <Modal
                visible={isFullscreen}
                transparent={false}
                animationType="fade"
                statusBarTranslucent
                supportedOrientations={['portrait', 'landscape']}
                onRequestClose={toggleNativeFullscreen}
            >
                <View style={fullscreenStyles.container}>
                    <View style={[
                        fullscreenStyles.safeArea,
                        {
                            paddingTop: insets.top,
                            paddingBottom: insets.bottom,
                            paddingLeft: insets.left,
                            paddingRight: insets.right,
                        }
                    ]}>
                        <View style={fullscreenStyles.videoWrapper}>
                            {mediaSourceType === MediaSourceType.EXTERNAL_URL && videoUrl ? (
                                <Video
                                    source={{ uri: videoUrl }}
                                    style={{ width: safeWidth, height: safeHeight }}
                                    resizeMode="contain"
                                    paused={false}
                                    controls={true}
                                    onProgress={(data) => {
                                        if (endTime && data.currentTime >= endTime) {
                                            onSegmentEnd?.();
                                        }
                                    }}
                                />
                            ) : (
                                <AuthenticatedVideo
                                    questionId={questionId}
                                    uri={videoUrl}
                                    style={{ width: safeWidth, height: safeHeight } as any}
                                    resizeMode="contain"
                                    shouldPlay={true}
                                    useNativeControls={showControls}
                                    showPlayButton={showControls}
                                    onEnd={onSegmentEnd}
                                />
                            )}
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[
                            fullscreenStyles.exitButton,
                            { top: insets.top + 12, right: insets.right + 12 }
                        ]}
                        onPress={toggleNativeFullscreen}
                    >
                        <MaterialCommunityIcons name="fullscreen-exit" size={36} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    };

    // 1. YouTube
    if (mediaSourceType === MediaSourceType.YOUTUBE && videoId) {
        if (__DEV__) console.log('🎬 [ExternalVideoPlayer] → YouTubePlayer branch', { videoId });
        return (
            <View style={[styles.container, combinedStyle]}>
                <YouTubePlayer
                    videoId={videoId}
                    startTime={startTime}
                    endTime={endTime}
                    onlyPlayButton={onlyPlayButton}
                    autoPlay={autoPlay || shouldPlay}
                    showControls={showControls}
                    hideTitle={hideTitle} 
                    onSegmentEnd={onSegmentEnd}
                    enableFullscreen={enableFullscreen}
                    initialFullscreen={initialFullscreen}
                    onFullscreenChange={onFullscreenChange}
                />
            </View>
        );
    }

    // 2. Direct External URL (mp4, etc.)
    if (mediaSourceType === MediaSourceType.EXTERNAL_URL && videoUrl) {
        if (__DEV__) console.log('🎬 [ExternalVideoPlayer] → Video (EXTERNAL_URL) branch', { videoUrl: videoUrl?.substring(0, 60) });
        return (
            <View style={[styles.container, combinedStyle]}>
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
                {enableFullscreen && (
                    <TouchableOpacity style={fullscreenStyles.inlineButton} onPress={toggleNativeFullscreen}>
                        <MaterialCommunityIcons name="fullscreen" size={28} color="#fff" />
                    </TouchableOpacity>
                )}
                {renderFullscreenModal()}
            </View>
        );
    }

    // 3. Uploaded (Proxy URL)
    if (mediaSourceType === MediaSourceType.UPLOADED || !mediaSourceType) {
        if (__DEV__) console.log('🎬 [ExternalVideoPlayer] → AuthenticatedVideo (UPLOADED) branch', { videoUrl: videoUrl?.substring(0, 60) });
        return (
            <View style={[styles.container, combinedStyle]}>
                <AuthenticatedVideo
                    questionId={questionId}
                    uri={videoUrl}
                    style={styles.video}
                    resizeMode={resizeMode}
                    shouldPlay={autoPlay || shouldPlay}
                    useNativeControls={showControls}
                    showPlayButton={showControls}
                    onEnd={onSegmentEnd}
                />
                {enableFullscreen && (
                    <TouchableOpacity style={fullscreenStyles.inlineButton} onPress={toggleNativeFullscreen}>
                        <MaterialCommunityIcons name="fullscreen" size={28} color="#fff" />
                    </TouchableOpacity>
                )}
                {renderFullscreenModal()}
            </View>
        );
    }

    if (__DEV__) console.log('🎬 [ExternalVideoPlayer] → No matching branch! Rendering null', { mediaSourceType, videoId, videoUrl });
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

const fullscreenStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', position: 'relative' },
    safeArea: { flex: 1 },
    videoWrapper: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    exitButton: {
        position: 'absolute',
        zIndex: 50,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 30,
    },
    inlineButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 40,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
    },
});

export default ExternalVideoPlayer;
