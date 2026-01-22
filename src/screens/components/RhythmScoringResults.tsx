// src/screens/components/RhythmScoringResults.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RhythmScoringResult, BeatIndicator } from '../../types/rhythmChallenge.types';
import { RhythmBeatIndicators } from './RhythmBeatIndicators';

interface RhythmScoringResultsProps {
    result: RhythmScoringResult;
    onRetry: () => void;
    onContinue: () => void;
}

/**
 * Display detailed rhythm scoring results
 */
export const RhythmScoringResults: React.FC<RhythmScoringResultsProps> = ({
    result,
    onRetry,
    onContinue,
}) => {
    // Build beat indicators from results
    const beatIndicators: BeatIndicator[] = result.perBeatScores.map((score, index) => ({
        index,
        expectedTimeMs: 0, // Not needed for results display
        actualTimeMs: undefined,
        error: result.timingErrorsMs[index],
        score,
        status: score >= 90 ? 'hit' : score >= 50 ? 'hit' : 'missed',
    }));
    
    const getScoreColor = (score: number) => {
        if (score >= 90) return '#4CAF50';
        if (score >= 70) return '#8BC34A';
        if (score >= 50) return '#FFC107';
        return '#F44336';
    };
    
    const getScoreEmoji = (score: number) => {
        if (score >= 90) return '🎉';
        if (score >= 70) return '👏';
        if (score >= 50) return '👍';
        return '💪';
    };
    
    return (
        <View style={styles.container}>
            {/* Main Score */}
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(result.overallScore) }]}>
                <Text style={styles.scoreEmoji}>{getScoreEmoji(result.overallScore)}</Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(result.overallScore) }]}>
                    {Math.round(result.overallScore)}
                </Text>
                <Text style={styles.scoreLabel}>Score</Text>
            </View>
            
            {/* Pass/Fail Status */}
            <View style={[styles.statusBadge, result.passed ? styles.passedBadge : styles.failedBadge]}>
                <MaterialCommunityIcons
                    name={result.passed ? 'check-circle' : 'alert-circle'}
                    size={20}
                    color="#fff"
                />
                <Text style={styles.statusText}>
                    {result.passed ? 'PASSED!' : 'TRY AGAIN'}
                </Text>
            </View>
            
            {/* Feedback */}
            <Text style={styles.feedback}>{result.feedback}</Text>
            
            {/* Beat Indicators */}
            <RhythmBeatIndicators
                beats={beatIndicators}
                mode="results"
            />
            
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <StatItem
                    icon="check-bold"
                    value={result.perfectBeats}
                    label="Perfect"
                    color="#4CAF50"
                />
                <StatItem
                    icon="thumb-up"
                    value={result.goodBeats}
                    label="Good"
                    color="#8BC34A"
                />
                <StatItem
                    icon="close"
                    value={result.missedBeats}
                    label="Missed"
                    color="#F44336"
                />
                <StatItem
                    icon="timer-outline"
                    value={`${Math.round(result.averageErrorMs)}ms`}
                    label="Avg Error"
                    color="#2196F3"
                />
            </View>
            
            {/* Consistency Score */}
            <View style={styles.consistencyContainer}>
                <Text style={styles.consistencyLabel}>Rhythm Consistency</Text>
                <View style={styles.consistencyBar}>
                    <View
                        style={[
                            styles.consistencyFill,
                            {
                                width: `${result.consistencyScore}%`,
                                backgroundColor: getScoreColor(result.consistencyScore),
                            },
                        ]}
                    />
                </View>
                <Text style={styles.consistencyValue}>{Math.round(result.consistencyScore)}%</Text>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <MaterialCommunityIcons name="refresh" size={24} color="#fff" />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
                
                {result.passed && (
                    <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
                        <Text style={styles.continueButtonText}>Continue</Text>
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

interface StatItemProps {
    icon: string;
    value: number | string;
    label: string;
    color: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label, color }) => (
    <View style={styles.statItem}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    scoreCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 6,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        marginBottom: 16,
    },
    scoreEmoji: {
        fontSize: 32,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    scoreLabel: {
        fontSize: 14,
        color: '#888',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 12,
    },
    passedBadge: {
        backgroundColor: '#4CAF50',
    },
    failedBadge: {
        backgroundColor: '#F44336',
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    feedback: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginVertical: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
    },
    consistencyContainer: {
        width: '100%',
        marginVertical: 16,
    },
    consistencyLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 8,
    },
    consistencyBar: {
        height: 8,
        backgroundColor: '#333',
        borderRadius: 4,
        overflow: 'hidden',
    },
    consistencyFill: {
        height: '100%',
        borderRadius: 4,
    },
    consistencyValue: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'right',
        marginTop: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 24,
        gap: 16,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
});

export default RhythmScoringResults;
