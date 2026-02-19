import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DownloadProgress, formatFileSize } from '../../../entities/AppUpdate';
import { useTheme } from '../../../shared/ui/theme';

interface UpdateProgressBarProps {
    progress: DownloadProgress | null;
}

export const UpdateProgressBar: React.FC<UpdateProgressBarProps> = ({ progress }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const animatedWidth = useRef(new Animated.Value(0)).current;

    const percentage = progress?.percentage || 0;
    const downloaded = formatFileSize(progress?.bytesWritten || 0);
    const total = formatFileSize(progress?.contentLength || 0);

    useEffect(() => {
        Animated.timing(animatedWidth, {
            toValue: percentage,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [percentage]);

    const widthInterpolate = animatedWidth.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <View style={[styles.progressBackground, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Animated.View
                    style={[
                        styles.progressBar,
                        {
                            width: widthInterpolate,
                            backgroundColor: theme.colors.primary,
                        },
                    ]}
                />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                {t('appUpdate.downloadProgress', {
                    percentage,
                    downloaded,
                    total,
                })}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 15,
    },
    progressBackground: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        width: '100%',
    },
    progressBar: {
        height: '100%',
    },
    progressText: {
        marginTop: 8,
        fontSize: 12,
        textAlign: 'center',
    },
});
