// src/screens/components/RhythmBeatIndicators.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BeatIndicator } from '../../types/rhythmChallenge.types';
import {useAppStyles} from '../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../shared/ui/theme';

interface RhythmBeatIndicatorsProps {
    beats: BeatIndicator[];
    currentBeatIndex?: number;
    mode: 'playback' | 'recording' | 'results';
}

/**
 * Visual representation of beat timing
 * Shows expected beats and user's performance
 */
export const RhythmBeatIndicators: React.FC<RhythmBeatIndicatorsProps> = ({
    beats,
    currentBeatIndex = -1,
    mode,
}) => {
    const {theme} = useAppStyles();
    const styles = themeStyles;
    
    const screenWidth = Dimensions.get('window').width;
    const beatSize = Math.min(40, (screenWidth - 40) / Math.max(beats.length, 1) - 8);
    
    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {mode === 'playback' && 'Listen to the pattern'}
                {mode === 'recording' && 'Tap along!'}
                {mode === 'results' && 'Your timing'}
            </Text>
            
            <View style={styles.beatsContainer}>
                {beats.map((beat, index) => (
                    <BeatDot
                        key={index}
                        beat={beat}
                        size={beatSize}
                        isActive={index === currentBeatIndex}
                        showScore={mode === 'results'}
                    />
                ))}
            </View>
            
            {mode === 'results' && (
                <View style={styles.legendContainer}>
                    <LegendItem color={theme.colors.success.main} label="Perfect" />
                    <LegendItem color={theme.colors.success.light} label="Good" />
                    <LegendItem color={theme.colors.warning.light} label="Early/Late" />
                    <LegendItem color={theme.colors.error.main} label="Missed" />
                </View>
            )}
        </View>
    );
};

interface BeatDotProps {
    beat: BeatIndicator;
    size: number;
    isActive: boolean;
    showScore: boolean;
}

const BeatDot: React.FC<BeatDotProps> = ({ beat, size, isActive, showScore }) => {
    const {theme} = useAppStyles();
    const styles = themeStyles;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    useEffect(() => {
        if (isActive) {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.4,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isActive, scaleAnim]);
    
    const getColor = () => {
        if (beat.status === 'pending') {return theme.colors.text.secondary;}
        if (beat.status === 'hit') {
            if (beat.score && beat.score >= 90) {return theme.colors.success.main;} // Perfect
            if (beat.score && beat.score >= 70) {return theme.colors.success.light;} // Good
            return theme.colors.warning.light; // Early/Late
        }
        if (beat.status === 'missed') {return theme.colors.error.main;}
        if (beat.status === 'early') {return theme.colors.warning.main;}
        if (beat.status === 'late') {return theme.colors.warning.main;}
        return theme.colors.text.secondary;
    };
    
    const getIcon = () => {
        if (beat.status === 'pending') {return 'circle-outline';}
        if (beat.status === 'hit') {return 'check-circle';}
        if (beat.status === 'missed') {return 'close-circle';}
        return 'circle';
    };
    
    return (
        <View style={styles.beatWrapper}>
            <Animated.View
                style={[
                    styles.beatDot,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: getColor(),
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <MaterialCommunityIcons
                    name={getIcon()}
                    size={size * 0.6}
                    color={theme.colors.text.inverse}
                />
            </Animated.View>
            
            {showScore && beat.score !== undefined && (
                <Text style={[styles.scoreText, { color: getColor() }]}>
                    {Math.round(beat.score)}
                </Text>
            )}
            
            {showScore && beat.error !== undefined && (
                <Text style={styles.errorText}>
                    {beat.error > 0 ? '+' : ''}{Math.round(beat.error)}ms
                </Text>
            )}
        </View>
    );
};

interface LegendItemProps {
    color: string;
    label: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label }) => {
    const styles = themeStyles;
    return (
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.neutral.gray[900], // Dark background for game elements
        borderRadius: theme.layout.borderRadius.lg,
        margin: theme.spacing.lg,
    },
    title: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.inverse,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    beatsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    beatWrapper: {
        alignItems: 'center',
        margin: theme.spacing.xs,
    },
    beatDot: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.bold,
        marginTop: theme.spacing.xs,
        fontSize: 10,
    },
    errorText: {
        fontSize: 8,
        color: theme.colors.text.disabled,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: theme.spacing.xs,
    },
    legendText: {
        ...theme.typography.caption,
        color: theme.colors.text.disabled,
    },
}));

export default RhythmBeatIndicators;