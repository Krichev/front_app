import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AudioChallengeSubmission} from '../entities/ChallengeState/model/types';

interface AudioChallengeScoreDisplayProps {
    submission: AudioChallengeSubmission;
    showDetails?: boolean;
}

const AudioChallengeScoreDisplay: React.FC<AudioChallengeScoreDisplayProps> = ({
    submission,
    showDetails = true
}) => {
    const getStatusIcon = () => {
        switch (submission.processingStatus) {
            case 'PENDING':
                return <ActivityIndicator size="small" color="#FF9800" />;
            case 'PROCESSING':
                return <ActivityIndicator size="small" color="#2196F3" />;
            case 'COMPLETED':
                return submission.passed ? (
                    <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                ) : (
                    <MaterialCommunityIcons name="close-circle" size={24} color="#f44336" />
                );
            case 'FAILED':
                return <MaterialCommunityIcons name="alert-circle" size={24} color="#f44336" />;
            default:
                return null;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#4CAF50';
        if (score >= 60) return '#FF9800';
        return '#f44336';
    };

    const renderScoreBar = (label: string, score: number | undefined, icon: string) => {
        if (score === undefined) return null;

        return (
            <View style={styles.scoreBarContainer}>
                <View style={styles.scoreBarLabel}>
                    <MaterialCommunityIcons
                        name={icon}
                        size={16}
                        color="#666"
                    />
                    <Text style={styles.scoreBarLabelText}>{label}</Text>
                </View>
                <View style={styles.scoreBarTrack}>
                    <View
                        style={[
                            styles.scoreBarFill,
                            {
                                width: `${score}%`,
                                backgroundColor: getScoreColor(score)
                            }
                        ]}
                    />
                </View>
                <Text style={[
                    styles.scoreBarValue,
                    { color: getScoreColor(score) }
                ]}>
                    {Math.round(score)}%
                </Text>
            </View>
        );
    };

    if (submission.processingStatus === 'PENDING' ||
        submission.processingStatus === 'PROCESSING') {
        return (
            <View style={styles.container}>
                <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={styles.processingText}>
                        {submission.processingStatus === 'PENDING'
                            ? 'Waiting to process...'
                            : `Processing... ${submission.processingProgress}%`}
                    </Text>
                    {submission.processingProgress > 0 && (
                        <View style={styles.progressBarTrack}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${submission.processingProgress}%` }
                                ]}
                            />
                        </View>
                    )}
                </View>
            </View>
        );
    }

    if (submission.processingStatus === 'FAILED') {
        return (
            <View style={styles.container}>
                <View style={styles.failedContainer}>
                    <MaterialCommunityIcons
                        name="alert-circle"
                        size={48}
                        color="#f44336"
                    />
                    <Text style={styles.failedText}>
                        Processing Failed
                    </Text>
                    <Text style={styles.failedSubtext}>
                        Please try again
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Overall Score */}
            <View style={styles.overallScoreContainer}>
                <View style={[
                    styles.overallScoreCircle,
                    { borderColor: getScoreColor(submission.overallScore || 0) }
                ]}>
                    <Text style={[
                        styles.overallScoreValue,
                        { color: getScoreColor(submission.overallScore || 0) }
                    ]}>
                        {Math.round(submission.overallScore || 0)}
                    </Text>
                    <Text style={styles.overallScoreLabel}>Score</Text>
                </View>
                <View style={styles.passedBadge}>
                    {getStatusIcon()}
                    <Text style={[
                        styles.passedText,
                        { color: submission.passed ? '#4CAF50' : '#f44336' }
                    ]}>
                        {submission.passed ? 'PASSED!' : 'NOT PASSED'}
                    </Text>
                    <Text style={styles.minimumScoreText}>
                        Minimum: {submission.minimumScoreRequired}%
                    </Text>
                </View>
            </View>

            {/* Detailed Scores */}
            {showDetails && (
                <View style={styles.detailsContainer}>
                    {renderScoreBar('Pitch Accuracy', submission.pitchScore, 'music-note')}
                    {renderScoreBar('Rhythm Timing', submission.rhythmScore, 'metronome')}
                    {renderScoreBar('Voice Quality', submission.voiceScore, 'equalizer')}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    processingContainer: {
        alignItems: 'center',
        padding: 20
    },
    processingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666'
    },
    progressBarTrack: {
        width: '100%',
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        marginTop: 12,
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#2196F3',
        borderRadius: 2
    },
    failedContainer: {
        alignItems: 'center',
        padding: 20
    },
    failedText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#f44336'
    },
    failedSubtext: {
        marginTop: 4,
        fontSize: 14,
        color: '#666'
    },
    overallScoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    overallScoreCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    overallScoreValue: {
        fontSize: 32,
        fontWeight: 'bold'
    },
    overallScoreLabel: {
        fontSize: 12,
        color: '#666'
    },
    passedBadge: {
        flex: 1,
        marginLeft: 20,
        alignItems: 'center'
    },
    passedText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4
    },
    minimumScoreText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4
    },
    detailsContainer: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 16
    },
    scoreBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    scoreBarLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 100,
        gap: 4
    },
    scoreBarLabelText: {
        fontSize: 12,
        color: '#666'
    },
    scoreBarTrack: {
        flex: 1,
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginHorizontal: 8,
        overflow: 'hidden'
    },
    scoreBarFill: {
        height: '100%',
        borderRadius: 4
    },
    scoreBarValue: {
        width: 40,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right'
    }
});

export default AudioChallengeScoreDisplay;
