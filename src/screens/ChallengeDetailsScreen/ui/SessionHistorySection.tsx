import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { List, Text, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useGetSessionHistoryQuery } from '../../../entities/ChallengeState/model/slice/challengeApi';
import { useTheme } from '../../../shared/ui/theme';
import { FormatterService } from '../../../services/verification/ui/Services';

interface SessionHistorySectionProps {
  challengeId: string;
}

export const SessionHistorySection: React.FC<SessionHistorySectionProps> = ({ challengeId }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(true);
  
  const { data: history, isLoading, error } = useGetSessionHistoryQuery({ 
    challengeId,
    size: 10 
  });

  const getScoreIcon = (percentage: number) => {
    if (percentage >= 80) return { name: 'check-circle', color: colors.success.main };
    if (percentage >= 40) return { name: 'alert-circle', color: colors.warning.main };
    return { name: 'close-circle', color: colors.error.main };
  };

  if (isLoading) {
    return <ActivityIndicator style={{ margin: 20 }} color={colors.primary.main} />;
  }

  const sessions = Array.isArray(history) ? history : [];

  if (error || sessions.length === 0) {
    return null;
  }

  return (
    <List.Accordion
      title={t('challengeDetails.history.title')}
      left={props => <List.Icon {...props} icon="history" color={colors.text.secondary} />}
      expanded={expanded}
      onPress={() => setExpanded(!expanded)}
      style={[styles.accordion, { backgroundColor: colors.background.primary }]}
      titleStyle={{ color: colors.text.primary }}
    >
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        {sessions.map((session, index) => {
          const icon = getScoreIcon(session.scorePercentage);

          return (
            <View key={session.sessionId}>
              <View style={styles.sessionRow}>
                <MaterialCommunityIcons name={icon.name as any} size={20} color={icon.color} />
                <View style={styles.sessionInfo}>
                  <Text style={[styles.sessionTitle, { color: colors.text.primary }]}>
                    {t('challengeDetails.history.sessionNum', { num: sessions.length - index })}
                  </Text>
                  <Text style={[styles.sessionMeta, { color: colors.text.secondary }]}>
                    {FormatterService.formatDate(session.createdAt)} • {session.duration 
                      ? t('challengeDetails.history.minutes', { count: Math.floor(session.duration / 60) }) + ' ' + 
                        t('challengeDetails.history.seconds', { count: session.duration % 60 }) 
                      : t('challengeDetails.history.noDuration')}
                  </Text>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={[styles.scoreText, { color: icon.color }]}>
                    {session.correctAnswers}/{session.totalRounds}
                  </Text>
                  <Text style={[styles.percentageText, { color: colors.text.secondary }]}>
                    ({session.scorePercentage.toFixed(0)}%)
                  </Text>
                </View>
              </View>
              {index < sessions.length - 1 && <Divider style={{ backgroundColor: colors.border.light }} />}
            </View>
          );
        })}
      </View>
    </List.Accordion>
  );
};

const styles = StyleSheet.create({
  accordion: {
    marginTop: 8,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sessionTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  sessionMeta: {
    fontSize: 12,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontWeight: '800',
    fontSize: 16,
  },
  percentageText: {
    fontSize: 10,
  },
});
