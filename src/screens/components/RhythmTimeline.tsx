import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, Animated, LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStyles, createStyles } from '../../shared/ui/theme';
import { RhythmPatternDTO } from '../../types/rhythmChallenge.types';

interface RhythmTimelineProps {
    referencePattern: RhythmPatternDTO;
    userTapTimesMs: number[];
    isRecording: boolean;
    toleranceMs?: number;
}

const TimelineTick: React.FC<{ 
    position: number; 
    color: string; 
    animate?: boolean 
}> = ({ position, color, animate }) => {
    const scaleAnim = useRef(new Animated.Value(animate ? 0 : 1)).current;

    useEffect(() => {
        if (animate) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }).start();
        }
    }, [animate, scaleAnim]);

    const styles = themeStyles;

    return (
        <Animated.View
            style={[
                styles.tick,
                { 
                    left: position, 
                    backgroundColor: color,
                    transform: [{ scaleY: scaleAnim }]
                },
            ]}
        />
    );
};

export const RhythmTimeline: React.FC<RhythmTimelineProps> = ({
    referencePattern,
    userTapTimesMs,
    isRecording,
    toleranceMs = 150,
}) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    const [laneWidth, setLaneWidth] = useState(0);

    const onLaneLayout = (e: LayoutChangeEvent) => {
        setLaneWidth(e.nativeEvent.layout.width);
    };

    // Calculate timeline total duration: last onset + 20% padding
    const totalDurationMs = useMemo(() => {
        if (!referencePattern.onsetTimesMs.length) return 5000;
        const lastOnset = referencePattern.onsetTimesMs[referencePattern.onsetTimesMs.length - 1];
        return lastOnset * 1.2;
    }, [referencePattern]);

    // Helper: color a user tap by timing accuracy
    const getTapColor = (tapTimeMs: number): string => {
        let minError = Infinity;
        for (const refTime of referencePattern.onsetTimesMs) {
            const error = Math.abs(tapTimeMs - refTime);
            if (error < minError) minError = error;
        }
        
        if (minError <= toleranceMs * 0.4) return theme.colors.success.main;  // on time
        if (minError <= toleranceMs) return theme.colors.warning.main;        // slightly off
        return theme.colors.error.main;                                        // missed
    };

    const getPosition = (timeMs: number) => {
        if (totalDurationMs === 0 || laneWidth === 0) return 0;
        return (timeMs / totalDurationMs) * laneWidth;
    };

    return (
        <View style={styles.container}>
            {/* Reference lane */}
            <Text style={styles.laneLabel}>{t('rhythmChallenge.referenceRhythm')}</Text>
            <View 
                style={styles.lane} 
                onLayout={onLaneLayout}
            >
                {referencePattern.onsetTimesMs.map((time, i) => (
                    <View
                        key={`ref-${i}`}
                        style={[
                            styles.tick,
                            styles.refTick,
                            { left: getPosition(time) },
                        ]}
                    />
                ))}
            </View>
            
            {/* Divider */}
            <View style={styles.divider} />
            
            {/* User lane */}
            <Text style={styles.laneLabel}>{t('rhythmChallenge.yourTaps')}</Text>
            <View style={styles.lane}>
                {userTapTimesMs.map((time, i) => (
                    <TimelineTick
                        key={`tap-${i}`}
                        position={getPosition(time)}
                        color={getTapColor(time)}
                        animate={isRecording}
                    />
                ))}
            </View>
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        backgroundColor: theme.colors.neutral.gray[800],
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.lg,
        width: '100%',
    },
    laneLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 4,
        fontWeight: '600',
    },
    lane: {
        height: 28,
        position: 'relative',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: theme.layout.borderRadius.sm,
        marginBottom: 4,
    },
    tick: {
        position: 'absolute',
        width: 3,
        height: 20,
        borderRadius: 1.5,
        top: 4,
    },
    refTick: {
        backgroundColor: theme.colors.success.main,
    },
    divider: {
        height: 1,
        borderTopWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.text.disabled,
        marginVertical: theme.spacing.sm,
        opacity: 0.5,
    },
}));

export default React.memo(RhythmTimeline);
