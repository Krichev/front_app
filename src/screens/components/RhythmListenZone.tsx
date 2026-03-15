import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useAppStyles, createStyles } from '../../shared/ui/theme';
import { RhythmPatternDTO } from '../../types/rhythmChallenge.types';
import RhythmBeatIndicators from './RhythmBeatIndicators';

interface RhythmListenZoneProps {
    rhythmPattern: RhythmPatternDTO | null;
    isPlaying: boolean;
    currentBeatIndex: number;
    onPlay: () => void;
    firstPlayDone: boolean;
    allowReplay: boolean;
    replaysUsed: number;
    maxReplays: number;
}

export const RhythmListenZone: React.FC<RhythmListenZoneProps> = ({
    rhythmPattern,
    isPlaying,
    currentBeatIndex,
    onPlay,
    firstPlayDone,
    allowReplay,
    replaysUsed,
    maxReplays,
}) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    const replaysRemaining = maxReplays > 0 ? maxReplays - replaysUsed : Infinity;
    const canReplay = allowReplay && (maxReplays === 0 || replaysRemaining > 0);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {rhythmPattern ? t('rhythmChallenge.patternInfo', {
                            beats: rhythmPattern.beatsPerMeasure * (rhythmPattern.onsetTimesMs.length / rhythmPattern.beatsPerMeasure), // Approximate
                            bpm: Math.round(rhythmPattern.bpm),
                            timeSignature: `${rhythmPattern.beatsPerMeasure}/${rhythmPattern.beatValue}`
                        }) : '---'}
                    </Text>
                </View>
                
                {maxReplays > 0 && (
                    <Text style={styles.replayText}>
                        {replaysRemaining > 0 
                            ? t('rhythmChallenge.replaysLeft', { count: replaysRemaining })
                            : t('rhythmChallenge.noReplaysLeft')}
                    </Text>
                )}
            </View>

            <View style={styles.visualizerZone}>
                <RhythmBeatIndicators
                    totalBeats={rhythmPattern?.onsetTimesMs.length || 0}
                    activeBeatIndex={currentBeatIndex}
                    isPlaying={isPlaying}
                />
            </View>

            <TouchableOpacity
                style={[
                    styles.playButton,
                    (!canReplay && firstPlayDone) || isPlaying ? styles.playButtonDisabled : null
                ]}
                onPress={onPlay}
                disabled={isPlaying || (!canReplay && firstPlayDone)}
            >
                {isPlaying ? (
                    <ActivityIndicator color={theme.colors.text.inverse} size="small" />
                ) : (
                    <>
                        <MaterialCommunityIcons 
                            name={firstPlayDone ? "replay" : "play"} 
                            size={24} 
                            color={theme.colors.text.inverse} 
                        />
                        <Text style={styles.playButtonText}>
                            {firstPlayDone ? t('rhythmChallenge.listenAgain') : t('rhythmChallenge.listen')}
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            {!firstPlayDone && (
                <Text style={styles.hintText}>{t('rhythmChallenge.listenFirst')}</Text>
            )}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        width: '100%',
        backgroundColor: theme.colors.neutral.gray[800],
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    badge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.layout.borderRadius.sm,
    },
    badgeText: {
        fontSize: 12,
        color: theme.colors.text.inverse,
        fontWeight: '600',
    },
    replayText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    visualizerZone: {
        width: '100%',
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary.main,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.pill,
        minWidth: 160,
    },
    playButtonDisabled: {
        backgroundColor: theme.colors.neutral.gray[600],
        opacity: 0.7,
    },
    playButtonText: {
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
        marginLeft: theme.spacing.sm,
        fontSize: 16,
    },
    hintText: {
        marginTop: theme.spacing.md,
        color: theme.colors.warning.main,
        fontSize: 14,
        fontStyle: 'italic',
    },
}));

export default RhythmListenZone;
