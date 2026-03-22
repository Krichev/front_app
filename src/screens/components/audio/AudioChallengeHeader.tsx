import React from 'react';
import {Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import {AudioChallengeType} from '../../../types/audioChallenge.types';
import {useAppStyles} from '../../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../../shared/ui/theme';

interface AudioChallengeHeaderProps {
  challengeType?: AudioChallengeType | null;
  minimumScorePercentage?: number | null;
  instructions?: string;
}

export const AudioChallengeHeader: React.FC<AudioChallengeHeaderProps> = ({
  challengeType,
  minimumScorePercentage,
  instructions,
}) => {
  const { t } = useTranslation();
  const { theme } = useAppStyles();
  const styles = themeStyles;

  return (
    <View style={styles.container}>
      {/* Header with Icon and Type */}
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name={challengeType === 'RHYTHM_REPEAT' ? 'repeat' : 'music-note-plus'} 
            size={28} 
            color={theme.colors.success.main} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {challengeType ? t(`audioChallenge.types.${challengeType}.label`) : t('audioChallenge.header.title')}
          </Text>
          <Text style={styles.description}>
            {challengeType ? t(`audioChallenge.types.${challengeType}.description`) : t('audioChallenge.header.defaultDescription')}
          </Text>
        </View>
      </View>

      {/* Instructions */}
      {instructions && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>{instructions}</Text>
        </View>
      )}

      {/* Passing Score Badge */}
      {(minimumScorePercentage ?? 0) > 0 && (
        <View style={styles.scoreContainer}>
          <MaterialCommunityIcons name="trophy-outline" size={16} color={theme.colors.warning.main} />
          <Text style={styles.scoreText}>
            {t('audioChallenge.header.passScore', { percentage: minimumScorePercentage })}
          </Text>
        </View>
      )}
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.success.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  instructionsContainer: {
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  instructionsText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.warning.background,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.full,
    alignSelf: 'flex-start',
  },
  scoreText: {
    fontSize: 12,
    color: theme.colors.warning.dark,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: 6,
  },
}));
