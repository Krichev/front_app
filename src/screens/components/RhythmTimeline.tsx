import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStyles, createStyles } from '../../shared/ui/theme';
import { RhythmPatternDTO } from '../../types/rhythmChallenge.types';

interface RhythmTimelineProps {
    referencePattern: RhythmPatternDTO;
    userTapTimesMs: number[];
    isRecording: boolean;
    toleranceMs?: number;
    totalDurationMs: number;
}

export const RhythmTimeline: React.FC<RhythmTimelineProps> = ({
    referencePattern,
    userTapTimesMs,
    isRecording,
    toleranceMs = 150,
    totalDurationMs,
}) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    const referenceMarkers = useMemo(() => {
        return referencePattern.onsetTimesMs.map((time, index) => {
            const position = (time / totalDurationMs) * 100;
            return (
                <View
                    key={`ref-${index}`}
                    style={[styles.marker, styles.referenceMarker, { left: `${position}%` }]}
                />
            );
        });
    }, [referencePattern.onsetTimesMs, totalDurationMs, styles]);

    const userMarkers = useMemo(() => {
        return userTapTimesMs.map((time, index) => {
            const position = (time / totalDurationMs) * 100;
            
            // Find closest reference onset to determine color
            let minDiff = Infinity;
            referencePattern.onsetTimesMs.forEach(refTime => {
                minDiff = Math.min(minDiff, Math.abs(time - refTime));
            });

            let markerColor = theme.colors.error.main;
            if (minDiff <= toleranceMs * 0.5) {
                markerColor = theme.colors.success.main;
            } else if (minDiff <= toleranceMs) {
                markerColor = theme.colors.warning.main;
            }

            return (
                <Animated.View
                    key={`user-${index}`}
                    style={[
                        styles.marker,
                        { left: `${position}%`, backgroundColor: markerColor }
                    ]}
                />
            );
        });
    }, [userTapTimesMs, totalDurationMs, referencePattern.onsetTimesMs, toleranceMs, theme, styles]);

    return (
        <View style={styles.container}>
            <View style={styles.laneContainer}>
                <View style={styles.labelContainer}>
                    <Text style={styles.laneLabel}>{t('rhythmChallenge.referenceRhythm')}</Text>
                </View>
                <View style={styles.track}>
                    {referenceMarkers}
                </View>
            </View>

            <View style={[styles.laneContainer, { marginTop: theme.spacing.md }]}>
                <View style={styles.labelContainer}>
                    <Text style={styles.laneLabel}>{t('rhythmChallenge.yourTaps')}</Text>
                </View>
                <View style={styles.track}>
                    {userMarkers}
                </View>
            </View>
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.md,
        marginVertical: theme.spacing.md,
    },
    laneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    labelContainer: {
        width: 80,
    },
    laneLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    track: {
        flex: 1,
        height: 30,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: theme.layout.borderRadius.sm,
        position: 'relative',
        marginLeft: theme.spacing.sm,
        overflow: 'hidden',
    },
    marker: {
        position: 'absolute',
        width: 4,
        height: '70%',
        top: '15%',
        borderRadius: 2,
    },
    referenceMarker: {
        backgroundColor: theme.colors.info.main,
    },
}));

export default React.memo(RhythmTimeline);
