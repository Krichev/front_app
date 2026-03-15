import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DownloadProgress, formatFileSize } from '../../../entities/AppUpdate';
import { useTheme, createStyles } from '../../../shared/ui/theme';

interface UpdateProgressBarProps {
    progress: DownloadProgress | null;
}

export const UpdateProgressBar: React.FC<UpdateProgressBarProps> = ({ progress }) => {
    const { t } = useTranslation();
    const { colors } = useTheme();
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
            <View style={[styles.progressBackground, { backgroundColor: colors.background.secondary }]}>
                <Animated.View
                    style={[
                        styles.progressBar,
                        {
                            width: widthInterpolate,
                            backgroundColor: colors.primary.main,
                        },
                    ]}
                />
            </View>
            <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                {t('appUpdate.downloadProgress', {
                    percentage,
                    downloaded,
                    total,
                })}
            </Text>
        </View>
    );
};

const styles = createStyles((theme) => ({
    container: {
        width: '100%',
        marginVertical: theme.spacing.md,
    },
    progressBackground: {
        height: 10,
        borderRadius: theme.layout.borderRadius.full,
        overflow: 'hidden',
        width: '100%',
    },
    progressBar: {
        height: '100%',
    },
    progressText: {
        marginTop: theme.spacing.xs,
        fontSize: theme.typography.fontSize.xs,
        textAlign: 'center',
    },
}));

