// src/components/AuthenticatedImage.tsx
import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import FastImage, { Source, ResizeMode } from 'react-native-fast-image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MediaUrlService from '../services/media/MediaUrlService';

interface AuthenticatedImageProps {
    questionId?: number;
    mediaId?: string | number;
    uri?: string;  // Direct URI (should be proxy URL)
    isThumbnail?: boolean;
    style?: ImageStyle;
    containerStyle?: ViewStyle;
    resizeMode?: ResizeMode;
    fallbackIcon?: string;
    fallbackIconSize?: number;
    fallbackIconColor?: string;
    onLoad?: () => void;
    onError?: (error: any) => void;
}

/**
 * Image component that handles authentication for media proxy
 * Uses react-native-fast-image to support auth headers
 */
const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
    questionId,
    mediaId,
    uri,
    isThumbnail = false,
    style,
    containerStyle,
    resizeMode = FastImage.resizeMode.cover,
    fallbackIcon = 'image-broken',
    fallbackIconSize = 32,
    fallbackIconColor = '#999',
    onLoad,
    onError,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const mediaService = MediaUrlService.getInstance();

    // Determine the URL to use
    const getImageUrl = (): string | null => {
        // If direct URI provided and it's a proxy URL, use it
        if (uri && mediaService.isProxyUrl(uri)) {
            return uri;
        }

        // Build proxy URL from questionId
        if (questionId) {
            return isThumbnail
                ? mediaService.getQuestionThumbnailUrl(questionId)
                : mediaService.getQuestionMediaUrl(questionId);
        }

        // Build proxy URL from mediaId
        if (mediaId) {
            return isThumbnail
                ? mediaService.getThumbnailByIdUrl(mediaId)
                : mediaService.getMediaByIdUrl(mediaId);
        }

        // Try to convert provided URI
        if (uri) {
            return mediaService.toProxyUrl(uri, undefined, isThumbnail);
        }

        return null;
    };

    const imageUrl = getImageUrl();

    // No valid URL - show fallback
    if (!imageUrl) {
        return (
            <View style={[styles.fallbackContainer, containerStyle, style]}>
                <MaterialCommunityIcons
                    name={fallbackIcon}
                    size={fallbackIconSize}
                    color={fallbackIconColor}
                />
            </View>
        );
    }

    // Build source with auth headers
    const source: Source = {
        uri: imageUrl,
        headers: mediaService.getAuthHeaders(),
        priority: FastImage.priority.normal,
    };

    const handleLoadStart = () => {
        setIsLoading(true);
        setHasError(false);
    };

    const handleLoad = () => {
        setIsLoading(false);
        onLoad?.();
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
        console.error(`Failed to load image: ${imageUrl}`);
        onError?.({ message: 'Failed to load image' });
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {!hasError ? (
                <FastImage
                    style={[styles.image, style] as any}
                    source={source}
                    resizeMode={resizeMode}
                    onLoadStart={handleLoadStart}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            ) : (
                <View style={[styles.errorContainer, style]}>
                    <MaterialCommunityIcons
                        name={fallbackIcon}
                        size={fallbackIconSize}
                        color="#F44336"
                    />
                </View>
            )}

            {isLoading && !hasError && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#007AFF" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackContainer: {
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AuthenticatedImage;
