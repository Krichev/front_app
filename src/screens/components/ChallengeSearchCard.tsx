import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ApiChallenge } from '../../entities/ChallengeState/model/types';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../shared/ui/theme/createStyles';

/**
 * Props for the ChallengeSearchCard component
 */
export interface ChallengeSearchCardProps {
  /** The challenge data to display */
  challenge: ApiChallenge;
  /** Whether the challenge is a quiz */
  isQuiz: boolean;
  /** Callback function when the card is pressed */
  onPress: (challengeId: string) => void;
}

/**
 * Component to display a challenge or quiz in search results
 */
export const ChallengeSearchCard: React.FC<ChallengeSearchCardProps> = React.memo(({ challenge, isQuiz, onPress }) => {
    const { theme } = useAppStyles();
    const styles = themeStyles;

    return (
        <TouchableOpacity
            style={styles.resultCard}
            onPress={() => onPress(challenge.id)}
        >
            <View style={[styles.iconContainer, isQuiz ? styles.quizIcon : styles.challengeIcon]}>
                <MaterialCommunityIcons
                    name={isQuiz ? 'brain' : 'trophy'}
                    size={24}
                    color={theme.colors.neutral.white}
                />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{challenge.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {challenge.description || (isQuiz ? 'Quiz Challenge' : 'Challenge')}
                </Text>
            </View>
            <MaterialCommunityIcons 
                name='chevron-right' 
                size={20} 
                color={theme.colors.text.disabled} 
            />
        </TouchableOpacity>
    );
});

const themeStyles = createStyles(theme => ({
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: theme.layout.borderWidth.thin,
        borderBottomColor: theme.colors.background.secondary,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    quizIcon: {
        backgroundColor: theme.colors.accent.main,
    },
    challengeIcon: {
        backgroundColor: theme.colors.warning.main,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    cardSubtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
}));
