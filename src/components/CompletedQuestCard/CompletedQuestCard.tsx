import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, ProgressBar, useTheme, Badge } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { CompletedChallenge } from '../../entities/ChallengeState/model/types';

interface CompletedQuestCardProps {
  challenge: CompletedChallenge;
  onPress: () => void;
}

export const CompletedQuestCard: React.FC<CompletedQuestCardProps> = ({
  challenge,
  onPress,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  
  const scorePercentage = challenge.bestScorePercentage || 0;
  const progress = scorePercentage / 100;
  
  const getScoreColor = () => {
    if (scorePercentage >= 80) return theme.colors.primary; // Success
    if (scorePercentage >= 40) return theme.colors.tertiary; // Warning/Accent
    return theme.colors.error; // Error
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('completedQuestCard.never');
    const date = new Date(dateString);
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    return date.toLocaleDateString(locale);
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text variant="titleMedium" numberOfLines={1} style={[styles.title, { color: theme.colors.onSurface }]}>
              {challenge.title}
            </Text>
            <Badge style={styles.typeBadge} size={20}>{t('completedQuestCard.typeBadge')}</Badge>
          </View>
          <MaterialCommunityIcons name="trophy" size={24} color={theme.colors.secondary} />
        </View>

        <View style={styles.scoreSection}>
          <View style={styles.scoreHeader}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{t('completedQuestCard.bestScore')}</Text>
            <Text variant="bodyLarge" style={[styles.scoreText, { color: getScoreColor() }]}>
              {challenge.bestScore || 0}/{challenge.totalRounds || 10} ({scorePercentage.toFixed(0)}%)
            </Text>
          </View>
          <ProgressBar
            progress={progress}
            color={getScoreColor()}
            style={styles.progressBar}
          />
        </View>

        <View style={[styles.statsRow, { borderTopColor: theme.colors.outlineVariant }]}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="play-circle-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              {t('completedQuestCard.played', { count: challenge.sessionCount })}
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              {t('completedQuestCard.lastPlayed', { date: formatDate(challenge.lastPlayedAt) })}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    marginHorizontal: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    marginRight: 8,
  },
  typeBadge: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    fontWeight: '700',
    alignSelf: 'center',
  },
  scoreSection: {
    marginBottom: 12,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  scoreText: {
    fontWeight: '800',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
  },
});
