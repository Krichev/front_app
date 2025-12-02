// src/components/MediaPreview.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthenticatedImage from './AuthenticatedImage';
import AuthenticatedVideo from './AuthenticatedVideo';
import AuthenticatedAudio from './AuthenticatedAudio';

interface MediaPreviewProps {
    // Primary identifiers - use questionId when possible
    questionId?: number;
    mediaId?: string | number;
    // Legacy URL props - will be converted to proxy URLs
    mediaUrl?: string;
    thumbnailUrl?: string;
    // Media type - required to render correct component
    mediaType?: 'image' | 'video' | 'audio' | 'IMAGE' | 'VIDEO' | 'AUDIO';
    // Display options
    style?: ViewStyle;
    height?: number;
    width?: number;
    resizeMode?: 'cover' | 'contain' | 'stretch';
    showControls?: boolean;
    autoPlay?: boolean;
    // Callbacks
    onLoad?: () => void;
    onError?: (error: any) => void;
}

/**
 * Generic media preview component using backend proxy with authentication
 *
 * Usage priority:
 * 1. questionId - Best option, builds proxy URL automatically
 * 2. mediaId - Secondary option, builds proxy URL
 * 3. mediaUrl - Legacy, will attempt proxy conversion
 */
const MediaPreview: React.FC<MediaPreviewProps> = ({
    questionId,
    mediaId,
    mediaUrl,
    thumbnailUrl,
    mediaType,
    style,
    height = 200,
    width,
    resizeMode = 'cover',
    showControls = true,
    autoPlay = false,
    onLoad,
    onError,
}) => {
    // Normalize media type to uppercase
    const normalizedType = mediaType?.toUpperCase();

    // Validate we have enough info to display media
    if (!questionId && !mediaId && !mediaUrl) {
        return (
            <View style={[styles.container, styles.errorContainer, style, { height }]}>
                <MaterialCommunityIcons name="image-off" size={32} color="#999" />
                <Text style={styles.errorText}>No media source provided</Text>
            </View>
        );
    }

    if (!normalizedType) {
        return (
            <View style={[styles.container, styles.errorContainer, style, { height }]}>
                <MaterialCommunityIcons name="file-question" size={32} color="#999" />
                <Text style={styles.errorText}>Unknown media type</Text>
            </View>
        );
    }

    // Common container style
    const containerStyle: ViewStyle = {
        ...styles.container,
        height,
        ...(width ? { width } : {}),
    };

    switch (normalizedType) {
        case 'IMAGE':
            return (
                <AuthenticatedImage
                    questionId={questionId}
                    mediaId={mediaId}
                    uri={mediaUrl}
                    containerStyle={style}
                    style={{ height, width: width || '100%' }}
                    resizeMode={resizeMode === 'cover' ? 'cover' : resizeMode === 'contain' ? 'contain' : 'stretch'}
                    onLoad={onLoad}
                    onError={onError}
                />
            );

        case 'VIDEO':
            return (
                <AuthenticatedVideo
                    questionId={questionId}
                    mediaId={mediaId}
                    uri={mediaUrl}
                    containerStyle={style}
                    style={{ height }}
                    useNativeControls={showControls}
                    shouldPlay={autoPlay}
                    onLoad={onLoad}
                    onError={onError}
                />
            );

        case 'AUDIO':
            return (
                <AuthenticatedAudio
                    questionId={questionId}
                    mediaId={mediaId}
                    uri={mediaUrl}
                    style={style}
                    onLoad={onLoad}
                    onError={onError}
                />
            );

        default:
            return (
                <View style={[containerStyle, styles.errorContainer, style]}>
                    <MaterialCommunityIcons name="file-question" size={32} color="#999" />
                    <Text style={styles.errorText}>Unsupported media type: {normalizedType}</Text>
                </View>
            );
    }
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#999',
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
    },
});

export default MediaPreview;
