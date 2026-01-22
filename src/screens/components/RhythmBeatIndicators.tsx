// src/screens/components/RhythmBeatIndicators.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BeatIndicator } from '../../types/rhythmChallenge.types';

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
                    <LegendItem color="#4CAF50" label="Perfect" />
                    <LegendItem color="#8BC34A" label="Good" />
                    <LegendItem color="#FFC107" label="Early/Late" />
                    <LegendItem color="#F44336" label="Missed" />
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
        if (beat.status === 'pending') return '#666';
        if (beat.status === 'hit') {
            if (beat.score && beat.score >= 90) return '#4CAF50'; // Perfect
            if (beat.score && beat.score >= 70) return '#8BC34A'; // Good
            return '#FFC107'; // Early/Late
        }
        if (beat.status === 'missed') return '#F44336';
        if (beat.status === 'early') return '#FF9800';
        if (beat.status === 'late') return '#FF9800';
        return '#666';
    };
    
    const getIcon = () => {
        if (beat.status === 'pending') return 'circle-outline';
        if (beat.status === 'hit') return 'check-circle';
        if (beat.status === 'missed') return 'close-circle';
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
                    color="#fff"
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

const LegendItem: React.FC<LegendItemProps> = ({ color, label }) => (
    <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendText}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        margin: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
    },
    beatsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    beatWrapper: {
        alignItems: 'center',
        margin: 4,
    },
    beatDot: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
    },
    errorText: {
        fontSize: 8,
        color: '#888',
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: 16,
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 4,
    },
    legendText: {
        fontSize: 12,
        color: '#999',
    },
});

export default RhythmBeatIndicators;
