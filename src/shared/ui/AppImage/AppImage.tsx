import {memo, ReactElement, useEffect, useState} from 'react';
import {Image, ImageProps, ImageStyle, StyleProp} from 'react-native';

interface AppImageProps extends Omit<ImageProps, 'source'> {
    className?: StyleProp<ImageStyle>;
    fallback?: ReactElement;
    errorFallback?: ReactElement;
    src?: string;
}

export const AppImage = memo((props: AppImageProps) => {
    const {
        className,
        src,
        alt = 'image',
        errorFallback,
        fallback,
        ...otherProps
    } = props;
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
    }, [src]);

    useEffect(() => {
        if (!src) {
            setHasError(true);
            setIsLoading(false);
        }
    }, [src]);

    const handleLoad = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    if (!src || hasError) {
        return errorFallback || null;
    }

    if (isLoading) {
        return fallback || null;
    }

    return (
        <Image
            style={className}
            source={{ uri: src }}
            onLoadStart={() => setIsLoading(true)}
            onLoad={handleLoad}
            onError={handleError}
            accessibilityLabel={alt}
            {...otherProps}
        />
    );
});