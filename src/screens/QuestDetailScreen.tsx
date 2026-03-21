import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { createStyles } from '../shared/ui/theme/createStyles';
import { useGetQuestByIdQuery, useJoinQuestMutation, WaypointTaskType } from '../entities/LocationQuest';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type RoutePropType = RouteProp<RootStackParamList, 'QuestDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'QuestDetail'>;

const QuestDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme, screen, text, button, card } = useAppStyles();
  const styles = themeStyles;
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  
  const questId = route.params?.questId;

  const {
    data: quest,
    isLoading,
    error,
    refetch,
  } = useGetQuestByIdQuery(questId, { skip: !questId });

  const [joinQuest, { isLoading: isJoining }] = useJoinQuestMutation();

  const handleJoin = async () => {
    if (!questId) return;
    try {
      const participation = await joinQuest(questId).unwrap();
      navigation.navigate('QuestActive', { 
        questId, 
        participationId: participation.id 
      });
    } catch (err) {
      console.error('Join error:', err);
      Alert.alert(t('common.error'), t('locationQuest.detail.joinFailed'));
    }
  };

  const getTaskIcon = (type: WaypointTaskType) => {
    switch (type) {
      case 'PHOTO_RECREATION': return 'camera';
      case 'TRIVIA_QUESTION': return 'help-circle';
      case 'GPS_CHECKIN': return 'map-marker-check';
      case 'COIN_JINGLE': return 'microphone';
      case 'VIDEO_SELFIE': return 'video';
      case 'AUDIO_RECORD': return 'music-note';
      case 'CUSTOM': return 'dots-horizontal';
      default: return 'help-circle-outline';
    }
  };

  if (isLoading) {
    return (
      <View style={[screen.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  if (error || !quest) {
    return (
      <View style={[screen.container, styles.centerContent]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={theme.colors.error.main} />
        <Text style={[text.bodyText, styles.messageText]}>{t('locationQuest.detail.errorLoading')}</Text>
        <TouchableOpacity style={button.primaryButton} onPress={refetch}>
          <Text style={button.primaryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={screen.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={text.pageTitle}>{quest.title}</Text>
          <Text style={styles.creatorText}>
            {t('locationQuest.detail.createdBy', { username: quest.creatorUsername })}
          </Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="clock-outline" size={24} color={theme.colors.primary.main} />
            <Text style={styles.infoLabel}>{t('locationQuest.detail.estimatedTime')}</Text>
            <Text style={styles.infoValue}>{quest.estimatedDurationMinutes} min</Text>
          </View>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="map-marker-distance" size={24} color={theme.colors.primary.main} />
            <Text style={styles.infoLabel}>{t('locationQuest.detail.totalDistance')}</Text>
            <Text style={styles.infoValue}>{quest.estimatedDistanceMeters} m</Text>
          </View>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="map-marker-path" size={24} color={theme.colors.primary.main} />
            <Text style={styles.infoLabel}>{t('locationQuest.detail.waypoints')}</Text>
            <Text style={styles.infoValue}>{quest.waypointCount}</Text>
          </View>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary.main} />
            <Text style={styles.infoLabel}>{t('locationQuest.detail.participants')}</Text>
            <Text style={styles.infoValue}>{quest.currentParticipantCount || 0}</Text>
          </View>
        </View>

        {quest.prizePool ? (
          <View style={[card.base, styles.prizeCard]}>
            <MaterialCommunityIcons name="trophy" size={32} color={theme.colors.warning.main} />
            <View style={styles.prizeInfo}>
              <Text style={styles.prizeLabel}>{t('locationQuest.detail.prizePool')}</Text>
              <Text style={styles.prizeValue}>{quest.prizePool} pts</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={text.sectionTitle}>{t('common.description')}</Text>
          <Text style={[text.bodyText, styles.description]}>{quest.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={text.sectionTitle}>{t('locationQuest.detail.waypointList')}</Text>
          {quest.waypoints.map((wp, index) => (
            <View key={wp.id} style={styles.waypointItem}>
              <View style={styles.waypointNumber}>
                <Text style={styles.waypointNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.waypointInfo}>
                <Text style={text.bodyText} numberOfLines={1}>{wp.name}</Text>
                <View style={styles.taskTypeRow}>
                  <MaterialCommunityIcons 
                    name={getTaskIcon(wp.taskType)} 
                    size={14} 
                    color={theme.colors.text.secondary} 
                  />
                  <Text style={styles.taskTypeText}>{wp.taskType}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[button.primaryButton, isJoining && button.disabledButton]}
          onPress={handleJoin}
          disabled={isJoining}
        >
          {isJoining ? (
            <ActivityIndicator color={theme.colors.neutral.white} />
          ) : (
            <Text style={button.primaryButtonText}>
              {quest.status === 'ACTIVE' ? t('locationQuest.detail.joinQuest') : t('locationQuest.detail.continueQuest')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  creatorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  infoCard: {
    width: '48%',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.sm,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  prizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.warning.background,
    borderColor: theme.colors.warning.light,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  prizeInfo: {
    marginLeft: theme.spacing.md,
  },
  prizeLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.warning.dark,
  },
  prizeValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.warning.dark,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  description: {
    marginTop: theme.spacing.sm,
    lineHeight: 22,
    marginBottom: 0,
  },
  waypointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  waypointNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary.light + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  waypointNumberText: {
    color: theme.colors.primary.dark,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.base,
  },
  waypointInfo: {
    flex: 1,
  },
  taskTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  taskTypeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  messageText: {
    textAlign: 'center',
    marginVertical: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
}));

export default QuestDetailScreen;
