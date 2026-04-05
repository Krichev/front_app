// src/entities/SoloQuestState/ui/ReputationScoreBadge.tsx
import React from 'react';
import { Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme';

interface ReputationScoreBadgeProps {
    score: number | undefined;
    size?: 'small' | 'medium';
}

function getScoreColor(score: number | undefined, theme: any): string {
    if (score === undefined || score === 0) {return theme.colors.text.disabled;}
    if (score >= 3.0) {return theme.colors.success.main;}
    if (score >= 1.0) {return theme.colors.warning.main;}
    return theme.colors.error.main;
}

const ReputationScoreBadge: React.FC<ReputationScoreBadgeProps> = ({ score, size = 'small' }) => {
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const color = getScoreColor(score, theme);
    const iconSize = size === 'small' ? 12 : 16;
    const displayScore = score !== undefined ? score.toFixed(1) : '—';

    return (
        <View style={styles.container}>
            <MaterialCommunityIcons name="star" size={iconSize} color={color} />
            <Text style={[
                size === 'small' ? styles.scoreSmall : styles.scoreMedium,
                { color },
            ]}>
                {displayScore}
            </Text>
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    scoreSmall: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.bold,
    },
    scoreMedium: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.bold,
    },
}));

export default ReputationScoreBadge;
