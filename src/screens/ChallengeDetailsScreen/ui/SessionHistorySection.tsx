import React, { useState } from 'react';
import { View } from 'react-native';
import { List, Text, Divider, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useGetSessionHistoryQuery } from '../../../entities/ChallengeState/model/slice/challengeApi';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme';

interface SessionHistorySectionProps {
  challengeId: string;
}

export const SessionHistorySection: React.FC<SessionHistorySectionProps> = ({ challengeId }) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const { theme } = useAppStyles();
  const styles = themeStyles;

  const { data: history, isLoading, error } = useGetSessionHistoryQuery({
    challengeId,
    size: 10,
  });

  const getScoreIcon = (percentage: number) => {
    if (percentage >= 80) return { name: 'check-circle', color: theme.colors.success.main };
    if (percentage >= 40) return { name: 'alert-circle', color: theme.colors.warning.main };
    return { name: 'close-circle', color: theme.colors.error.main };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (durationSeconds: number | null): string => {
    if (durationSeconds == null || durationSeconds <= 0) {
      return t('challengeDetails.sessionHistory.noDuration');
    }
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return t('challengeDetails.sessionHistory.durationFormat', { minutes, seconds });
  };

  // Ensure history is an array before attempting to use it
  const sessions = Array.isArray(history) ? history : [];

  if (isLoading) {
    return <ActivityIndicator style={{ margin: 20 }} />;
  }

  if (error || sessions.length === 0) {
    return null;
  }

  return (
    <List.Accordion
      title={t('challengeDetails.sessionHistory.title')}
      left={props => <List.Icon {...props} icon="history" />}
      expanded={expanded}
      onPress={() => setExpanded(!expanded)}
      style={styles.accordion}
    >
      <View style={styles.container}>
        {sessions.map((session, index) => {
          const icon = getScoreIcon(session.scorePercentage);

          return (
            <View key={session.sessionId}>
              <View style={styles.sessionRow}>
                <MaterialCommunityIcons
                  name={icon.name as any}
                  size={20}
                  color={icon.color}
                />
                <View style={styles.sessionInfo}>
                  <Text variant="bodyMedium" style={styles.sessionTitle}>
                    {t('challengeDetails.sessionHistory.sessionNumber', {
                      number: sessions.length - index,
                    })}
                  </Text>
                  <Text variant="bodySmall" style={styles.sessionMeta}>
                    {formatDate(session.createdAt)} • {formatDuration(session.duration)}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={[styles.scoreText, { color: icon.color }]}>
                  {t('challengeDetails.sessionHistory.score', {
                    correct: session.correctAnswers,
                    total: session.totalRounds,
                    percentage: Math.round(session.scorePercentage),
                  })}
                </Text>
              </View>
              {index < sessions.length - 1 && <Divider style={styles.divider} />}
            </View>
          );
        })}
      </View>
    </List.Accordion>
  );
};

const themeStyles = createStyles(theme => ({
  accordion: {
    backgroundColor: theme.colors.background.primary,
    marginTop: theme.spacing.sm,
  },
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  sessionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    color: theme.colors.text.primary,
    fontWeight: '600' as const,
  },
  sessionMeta: {
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  scoreText: {
    fontWeight: '600' as const,
    fontSize: 13,
  },
  divider: {
    backgroundColor: theme.colors.divider,
  },
}));
