import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { List, Text, useTheme, Divider, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGetSessionHistoryQuery } from '../../../entities/ChallengeState/model/slice/challengeApi';

interface SessionHistorySectionProps {
  challengeId: string;
}

export const SessionHistorySection: React.FC<SessionHistorySectionProps> = ({ challengeId }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);
  
  const { data: history, isLoading, error } = useGetSessionHistoryQuery({ 
    challengeId,
    size: 10 
  });

  const getScoreIcon = (percentage: number) => {
    if (percentage >= 80) return { name: 'check-circle', color: '#4CAF50' };
    if (percentage >= 40) return { name: 'alert-circle', color: '#FF9800' };
    return { name: 'close-circle', color: '#F44336' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return <ActivityIndicator style={{ margin: 20 }} />;
  }

  if (error || !history || history.length === 0) {
    return null; // Don't show if no history or error
  }

  return (
    <List.Accordion
      title="Session History"
      left={props => <List.Icon {...props} icon="history" />}
      expanded={expanded}
      onPress={() => setExpanded(!expanded)}
      style={styles.accordion}
    >
      <View style={styles.container}>
        {history.map((session, index) => {
          const icon = getScoreIcon(session.scorePercentage);

          return (
            <View key={session.sessionId}>
              <View style={styles.sessionRow}>
                <MaterialCommunityIcons name={icon.name as any} size={20} color={icon.color} />
                <View style={styles.sessionInfo}>
                  <Text variant="bodyMedium" style={styles.sessionTitle}>
                    Session #{history.length - index}
                  </Text>
                  <Text variant="bodySmall" style={styles.sessionMeta}>
                    {formatDate(session.createdAt)} • {session.duration ? Math.floor(session.duration / 60) + 'm ' + (session.duration % 60) + 's' : 'N/A'}
                  </Text>
                </View>
                <View style={styles.scoreContainer}>
                  <Text variant="bodyLarge" style={[styles.scoreText, { color: icon.color }]}>
                    {session.correctAnswers}/{session.totalRounds}
                  </Text>
                  <Text variant="bodySmall" style={styles.percentageText}>
                    ({session.scorePercentage.toFixed(0)}%)
                  </Text>
                </View>
              </View>
              {index < history.length - 1 && <Divider style={styles.divider} />}
            </View>
          );
        })}
      </View>
    </List.Accordion>
  );
};

const styles = StyleSheet.create({
  accordion: {
    backgroundColor: '#fff',
    marginTop: 8,
  },
  container: {
    backgroundColor: '#fafafa',
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
  },
  sessionMeta: {
    color: '#666',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontWeight: '800',
  },
  percentageText: {
    fontSize: 10,
    color: '#666',
  },
  divider: {
    backgroundColor: '#eee',
  },
});
