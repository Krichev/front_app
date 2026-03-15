// src/screens/components/EnhancedScoringResults.tsx
import React from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import {EnhancedRhythmScoringResult, SoundComparisonDetail} from '../../types/rhythmChallenge.types';
import {SoundQualityBadge} from './SoundQualityBadge';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../shared/ui/theme';

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
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = scoringStyles;

    const getScoreColor = (score: number) => {
        if (score >= 90) return theme.colors.success.main;
        if (score >= 70) return theme.colors.success.light;
        if (score >= 50) return theme.colors.warning.main;
        return theme.colors.error.main;
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
                    {result.soundSimilarityEnabled ? t('rhythmChallenge.results.combined') : t('rhythmChallenge.results.score')}
                </Text>
            </View>
            
            {/* Pass/Fail Badge */}
            <View style={[styles.statusBadge, result.passed ? styles.passedBadge : styles.failedBadge]}>
                <MaterialCommunityIcons
                    name={result.passed ? 'check-circle' : 'alert-circle'}
                    size={20}
                    color={theme.colors.text.inverse}
                />
                <Text style={styles.statusText}>
                    {result.passed ? t('rhythmChallenge.results.passed') : t('rhythmChallenge.results.tryAgain')}
                </Text>
            </View>
            
            {/* Feedback */}
            <Text style={styles.feedback}>{result.feedback}</Text>
            
            {/* Score Breakdown (when sound similarity enabled) */}
            {result.soundSimilarityEnabled && (
                <View style={styles.breakdownContainer}>
                    <Text style={styles.sectionTitle}>{t('rhythmChallenge.results.scoreBreakdown')}</Text>
                    
                    <View style={styles.breakdownRow}>
                        {/* Timing Score */}
                        <View style={styles.breakdownItem}>
                            <MaterialCommunityIcons name="timer-outline" size={28} color={theme.colors.info.main} />
                            <Text style={styles.breakdownValue}>{Math.round(result.overallScore)}</Text>
                            <Text style={styles.breakdownLabel}>{t('rhythmChallenge.results.timing')}</Text>
                            <Text style={styles.breakdownWeight}>
                                ({Math.round(result.timingWeight * 100)}%)
                            </Text>
                        </View>
                        
                        <View style={styles.breakdownDivider}>
                            <Text style={styles.plusSign}>+</Text>
                        </View>
                        
                        {/* Sound Score */}
                        <View style={styles.breakdownItem}>
                            <MaterialCommunityIcons name="equalizer" size={28} color={theme.colors.secondary?.main || theme.colors.primary.main} />
                            <Text style={styles.breakdownValue}>
                                {result.soundSimilarityScore !== undefined 
                                    ? Math.round(result.soundSimilarityScore) 
                                    : '-'}
                            </Text>
                            <Text style={styles.breakdownLabel}>{t('rhythmChallenge.results.sound')}</Text>
                            <Text style={styles.breakdownWeight}>
                                ({Math.round(result.soundWeight * 100)}%)
                            </Text>
                        </View>
                        
                        <View style={styles.breakdownDivider}>
                            <Text style={styles.equalsSign}>=</Text>
                        </View>
                        
                        {/* Combined Score */}
                        <View style={styles.breakdownItem}>
                            <MaterialCommunityIcons name="star" size={28} color={theme.colors.success.main} />
                            <Text style={[styles.breakdownValue, styles.combinedValue]}>
                                {Math.round(result.combinedScore)}
                            </Text>
                            <Text style={styles.breakdownLabel}>{t('rhythmChallenge.results.combined')}</Text>
                        </View>
                    </View>
                </View>
            )}
            
            {/* Timing Stats */}
            <View style={styles.statsContainer}>
                <Text style={styles.sectionTitle}>{t('rhythmChallenge.results.timingPerformance')}</Text>
                <View style={styles.statsGrid}>
                    <StatItem icon="check-bold" value={result.perfectBeats} label={t('rhythmChallenge.results.perfect')} color={theme.colors.success.main} />
                    <StatItem icon="thumb-up" value={result.goodBeats} label={t('rhythmChallenge.results.good')} color={theme.colors.success.light} />
                    <StatItem icon="close" value={result.missedBeats} label={t('rhythmChallenge.results.missed')} color={theme.colors.error.main} />
                    <StatItem icon="timer-outline" value={`${Math.round(result.averageErrorMs)}ms`} label={t('rhythmChallenge.results.avgError')} color={theme.colors.info.main} />
                </View>
            </View>
            
            {/* Sound Quality Details */}
            {showSoundDetails && result.soundDetails && (
                <View style={styles.soundDetailsContainer}>
                    <Text style={styles.sectionTitle}>{t('rhythmChallenge.results.soundQualityPerBeat')}</Text>
                    
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
                    <MaterialCommunityIcons name="refresh" size={24} color={theme.colors.text.inverse} />
                    <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                </TouchableOpacity>
                
                {result.passed && (
                    <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
                        <Text style={styles.continueButtonText}>{t('rhythmChallenge.results.continue')}</Text>
                        <MaterialCommunityIcons name="arrow-right" size={24} color={theme.colors.text.inverse} />
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

const StatItem: React.FC<StatItemProps> = ({ icon, value, label, color }) => {
    const styles = scoringStyles;
    return (
        <View style={styles.statItem}>
            <MaterialCommunityIcons name={icon} size={24} color={color} />
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
};

interface BeatSoundDetailProps {
    detail: SoundComparisonDetail;
}

const BeatSoundDetail: React.FC<BeatSoundDetailProps> = ({ detail }) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = scoringStyles;

    const getScoreColor = (score: number) => {
        if (score >= 80) return theme.colors.success.main;
        if (score >= 60) return theme.colors.warning.main;
        return theme.colors.error.main;
    };
    
    return (
        <View style={styles.beatDetailItem}>
            <View style={styles.beatHeader}>
                <Text style={styles.beatNumber}>{t('rhythmChallenge.results.beat', { number: detail.beatIndex + 1 })}</Text>
                <Text style={[styles.beatScore, { color: getScoreColor(detail.overallSoundScore) }]}>
                    {Math.round(detail.overallSoundScore)}
                </Text>
            </View>
            
            <View style={styles.beatContent}>
                <View style={styles.qualityRow}>
                    <Text style={styles.qualityLabel}>{t('rhythmChallenge.results.yourSound')}</Text>
                    {detail.userQuality && (
                        <SoundQualityBadge quality={detail.userQuality} size="small" />
                    )}
                </View>
                
                {detail.feedback && (
                    <Text style={styles.beatFeedback}>{detail.feedback}</Text>
                )}
                
                {/* Mini progress bars */}
                <View style={styles.metricsRow}>
                    <MiniMetric label={t('rhythmChallenge.results.timbre')} value={detail.mfccSimilarity} />
                    <MiniMetric label={t('rhythmChallenge.results.brightness')} value={detail.brightnessMatch} />
                    <MiniMetric label={t('rhythmChallenge.results.energy')} value={detail.energyMatch} />
                </View>
            </View>
        </View>
    );
};

interface MiniMetricProps {
    label: string;
    value: number;
}

const MiniMetric: React.FC<MiniMetricProps> = ({ label, value }) => {
    const { theme } = useAppStyles();
    const styles = scoringStyles;
    return (
        <View style={styles.miniMetric}>
            <Text style={styles.miniMetricLabel}>{label}</Text>
            <View style={styles.miniMetricBar}>
                <View style={[styles.miniMetricFill, { width: `${value}%`, backgroundColor: theme.colors.success.main }]} />
            </View>
        </View>
    );
};

const scoringStyles = createStyles(theme => ({
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
        backgroundColor: theme.colors.background.secondary,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    scoreLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
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
        backgroundColor: theme.colors.success.main,
    },
    failedBadge: {
        backgroundColor: theme.colors.error.main,
    },
    statusText: {
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    feedback: {
        fontSize: 16,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 24,
    },
    breakdownContainer: {
        width: '100%',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
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
        color: theme.colors.text.primary,
        marginTop: 4,
    },
    combinedValue: {
        color: theme.colors.success.main,
    },
    breakdownLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    breakdownWeight: {
        fontSize: 10,
        color: theme.colors.text.disabled,
    },
    breakdownDivider: {
        paddingHorizontal: 8,
    },
    plusSign: {
        fontSize: 24,
        color: theme.colors.text.disabled,
    },
    equalsSign: {
        fontSize: 24,
        color: theme.colors.success.main,
    },
    statsContainer: {
        width: '100%',
        backgroundColor: theme.colors.background.secondary,
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
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    soundDetailsContainer: {
        width: '100%',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    soundFeedback: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 16,
    },
    beatsList: {
        gap: 12,
    },
    beatDetailItem: {
        backgroundColor: theme.colors.background.primary,
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
        color: theme.colors.text.primary,
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
        color: theme.colors.text.secondary,
    },
    beatFeedback: {
        fontSize: 12,
        color: theme.colors.text.secondary,
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
        color: theme.colors.text.disabled,
        marginBottom: 2,
    },
    miniMetricBar: {
        height: 4,
        backgroundColor: theme.colors.neutral.gray[700],
        borderRadius: 2,
        overflow: 'hidden',
    },
    miniMetricFill: {
        height: '100%',
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
        backgroundColor: theme.colors.neutral.gray[700],
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.success.main,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    continueButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
}));

export default EnhancedScoringResults;
