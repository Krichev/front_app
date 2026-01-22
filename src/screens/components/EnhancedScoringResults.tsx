// src/screens/components/EnhancedScoringResults.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { EnhancedRhythmScoringResult, SoundComparisonDetail } from '../../types/rhythmChallenge.types';
import { SoundQualityBadge } from './SoundQualityBadge';

interface EnhancedScoringResultsProps {
    result: EnhancedRhythmScoringResult;
    onRetry: () => void;
    onContinue: () => void;
}

/**
 * Display detailed scoring results including sound similarity
 */
export const EnhancedScoringResults: React.FC<EnhancedScoringResultsProps> = ({
    result,
    onRetry,
    onContinue,
}) => {
    const getScoreColor = (score: number) => {
        if (score >= 90) return '#4CAF50';
        if (score >= 70) return '#8BC34A';
        if (score >= 50) return '#FFC107';
        return '#F44336';
    };
    
    const showSoundDetails = result.soundSimilarityEnabled && result.soundDetails;
    const displayScore = result.soundSimilarityEnabled ? result.combinedScore : result.overallScore;
    
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Main Score Circle */}
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(displayScore) }]}>
                <Text style={[styles.scoreValue, { color: getScoreColor(displayScore) }]}>
                    {Math.round(displayScore)}
                </Text>
                <Text style={styles.scoreLabel}>
                    {result.soundSimilarityEnabled ? 'Combined' : 'Score'}
                </Text>
            </View>
            
            {/* Pass/Fail Badge */}
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
            
            {/* Score Breakdown (when sound similarity enabled) */}
            {result.soundSimilarityEnabled && (
                <View style={styles.breakdownContainer}>
                    <Text style={styles.sectionTitle}>Score Breakdown</Text>
                    
                    <View style={styles.breakdownRow}>
                        {/* Timing Score */}
                        <View style={styles.breakdownItem}>
                            <MaterialCommunityIcons name="timer-outline" size={28} color="#2196F3" />
                            <Text style={styles.breakdownValue}>{Math.round(result.overallScore)}</Text>
                            <Text style={styles.breakdownLabel}>Timing</Text>
                            <Text style={styles.breakdownWeight}>
                                ({Math.round(result.timingWeight * 100)}%)
                            </Text>
                        </View>
                        
                        <View style={styles.breakdownDivider}>
                            <Text style={styles.plusSign}>+</Text>
                        </View>
                        
                        {/* Sound Score */}
                        <View style={styles.breakdownItem}>
                            <MaterialCommunityIcons name="waveform" size={28} color="#9C27B0" />
                            <Text style={styles.breakdownValue}>
                                {result.soundSimilarityScore !== undefined 
                                    ? Math.round(result.soundSimilarityScore) 
                                    : '-'}
                            </Text>
                            <Text style={styles.breakdownLabel}>Sound</Text>
                            <Text style={styles.breakdownWeight}>
                                ({Math.round(result.soundWeight * 100)}%)
                            </Text>
                        </View>
                        
                        <View style={styles.breakdownDivider}>
                            <Text style={styles.equalsSign}>=</Text>
                        </View>
                        
                        {/* Combined Score */}
                        <View style={styles.breakdownItem}>
                            <MaterialCommunityIcons name="star" size={28} color="#4CAF50" />
                            <Text style={[styles.breakdownValue, styles.combinedValue]}>
                                {Math.round(result.combinedScore)}
                            </Text>
                            <Text style={styles.breakdownLabel}>Combined</Text>
                        </View>
                    </View>
                </View>
            )}
            
            {/* Timing Stats */}
            <View style={styles.statsContainer}>
                <Text style={styles.sectionTitle}>Timing Performance</Text>
                <View style={styles.statsGrid}>
                    <StatItem icon="check-bold" value={result.perfectBeats} label="Perfect" color="#4CAF50" />
                    <StatItem icon="thumb-up" value={result.goodBeats} label="Good" color="#8BC34A" />
                    <StatItem icon="close" value={result.missedBeats} label="Missed" color="#F44336" />
                    <StatItem icon="timer-outline" value={`${Math.round(result.averageErrorMs)}ms`} label="Avg Error" color="#2196F3" />
                </View>
            </View>
            
            {/* Sound Quality Details */}
            {showSoundDetails && result.soundDetails && (
                <View style={styles.soundDetailsContainer}>
                    <Text style={styles.sectionTitle}>Sound Quality per Beat</Text>
                    
                    {result.soundFeedback && (
                        <Text style={styles.soundFeedback}>{result.soundFeedback}</Text>
                    )}
                    
                    <View style={styles.beatsList}>
                        {result.soundDetails.map((detail, index) => (
                            <BeatSoundDetail key={index} detail={detail} />
                        ))}
                    </View>
                </View>
            )}
            
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
        </ScrollView>
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

interface BeatSoundDetailProps {
    detail: SoundComparisonDetail;
}

const BeatSoundDetail: React.FC<BeatSoundDetailProps> = ({ detail }) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return '#4CAF50';
        if (score >= 60) return '#FFC107';
        return '#F44336';
    };
    
    return (
        <View style={styles.beatDetailItem}>
            <View style={styles.beatHeader}>
                <Text style={styles.beatNumber}>Beat {detail.beatIndex + 1}</Text>
                <Text style={[styles.beatScore, { color: getScoreColor(detail.overallSoundScore) }]}>
                    {Math.round(detail.overallSoundScore)}
                </Text>
            </View>
            
            <View style={styles.beatContent}>
                <View style={styles.qualityRow}>
                    <Text style={styles.qualityLabel}>Your sound:</Text>
                    {detail.userQuality && (
                        <SoundQualityBadge quality={detail.userQuality} size="small" />
                    )}
                </View>
                
                {detail.feedback && (
                    <Text style={styles.beatFeedback}>{detail.feedback}</Text>
                )}
                
                {/* Mini progress bars */}
                <View style={styles.metricsRow}>
                    <MiniMetric label="Timbre" value={detail.mfccSimilarity} />
                    <MiniMetric label="Brightness" value={detail.brightnessMatch} />
                    <MiniMetric label="Energy" value={detail.energyMatch} />
                </View>
            </View>
        </View>
    );
};

interface MiniMetricProps {
    label: string;
    value: number;
}

const MiniMetric: React.FC<MiniMetricProps> = ({ label, value }) => (
    <View style={styles.miniMetric}>
        <Text style={styles.miniMetricLabel}>{label}</Text>
        <View style={styles.miniMetricBar}>
            <View style={[styles.miniMetricFill, { width: `${value}%` }]} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        alignItems: 'center',
    },
    scoreCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 6,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
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
        marginTop: 16,
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
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 24,
    },
    breakdownContainer: {
        width: '100%',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 16,
    },
    breakdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    breakdownItem: {
        alignItems: 'center',
        flex: 1,
    },
    breakdownValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 4,
    },
    combinedValue: {
        color: '#4CAF50',
    },
    breakdownLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    breakdownWeight: {
        fontSize: 10,
        color: '#666',
    },
    breakdownDivider: {
        paddingHorizontal: 8,
    },
    plusSign: {
        fontSize: 24,
        color: '#666',
    },
    equalsSign: {
        fontSize: 24,
        color: '#4CAF50',
    },
    statsContainer: {
        width: '100%',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    soundDetailsContainer: {
        width: '100%',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    soundFeedback: {
        fontSize: 14,
        color: '#888',
        marginBottom: 16,
    },
    beatsList: {
        gap: 12,
    },
    beatDetailItem: {
        backgroundColor: '#252525',
        borderRadius: 8,
        padding: 12,
    },
    beatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    beatNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    beatScore: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    beatContent: {
        gap: 8,
    },
    qualityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    qualityLabel: {
        fontSize: 12,
        color: '#888',
    },
    beatFeedback: {
        fontSize: 12,
        color: '#aaa',
        fontStyle: 'italic',
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    miniMetric: {
        flex: 1,
    },
    miniMetricLabel: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    miniMetricBar: {
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
        overflow: 'hidden',
    },
    miniMetricFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 2,
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

export default EnhancedScoringResults;
