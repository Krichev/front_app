import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { createStyles } from '../shared/ui/theme/createStyles';
import {
  useGetQuestByIdQuery,
  useGetProgressQuery,
  useReportArrivalMutation,
  useStartQuestMutation,
  useAbandonQuestMutation,
} from '../entities/LocationQuest';
import { useGpsTracking } from '../features/LocationQuest/hooks/useGpsTracking';
import { useQuestWebSocket } from '../features/LocationQuest/hooks/useQuestWebSocket';
import { QuestMapView } from '../widgets/QuestMap/ui/QuestMapView';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type RoutePropType = RouteProp<RootStackParamList, 'QuestActive'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'QuestActive'>;

const QuestActiveScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme, text, button } = useAppStyles();
  const styles = themeStyles;
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();

  const questId = route.params?.questId;
  
  const { data: quest, isLoading: isLoadingQuest } = useGetQuestByIdQuery(questId, { skip: !questId });
  const { data: progress, isLoading: isLoadingProgress } = useGetProgressQuery(questId, { 
    skip: !questId,
    pollingInterval: 30000 
  });

  const { currentLocation, startTracking, stopTracking } = useGpsTracking();
  const { participants, connectionStatus } = useQuestWebSocket(questId);

  const [startQuest] = useStartQuestMutation();
  const [reportArrival, { isLoading: isReporting }] = useReportArrivalMutation();
  const [abandonQuest, { isLoading: isAbandoning }] = useAbandonQuestMutation();

  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (questId) {
      startTracking(questId);
      if (progress?.participation.status === 'JOINED') {
        startQuest(questId);
      }
    }
    return () => stopTracking();
  }, [questId, progress?.participation.status, startQuest, startTracking, stopTracking]);

  useEffect(() => {
    if (quest?.timeLimitMinutes && progress?.participation.startedAt) {
      const timer = setInterval(() => {
        const start = new Date(progress.participation.startedAt!).getTime();
        const limit = quest.timeLimitMinutes! * 60 * 1000;
        const now = new Date().getTime();
        const remaining = limit - (now - start);

        if (remaining <= 0) {
          setTimeLeft('00:00');
          clearInterval(timer);
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quest?.timeLimitMinutes, progress?.participation.startedAt]);

  const currentWaypointIndex = progress?.participation.currentWaypointIndex || 0;
  const currentWaypoint = quest?.waypoints[currentWaypointIndex];
  const completedWaypointIds = useMemo(() => 
    progress?.completedWaypoints.map(cw => cw.waypointId) || [], 
    [progress]
  );

  const isWithinRadius = useMemo(() => {
    if (!currentLocation || !currentWaypoint) return false;
    
    const R = 6371e3; // meters
    const lat1 = currentLocation.latitude * Math.PI / 180;
    const lat2 = currentWaypoint.latitude * Math.PI / 180;
    const dLat = (currentWaypoint.latitude - currentLocation.latitude) * Math.PI / 180;
    const dLon = (currentWaypoint.longitude - currentLocation.longitude) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= currentWaypoint.radiusMeters;
  }, [currentLocation, currentWaypoint]);

  const handleReportArrival = async () => {
    if (!questId || !currentWaypoint) return;
    try {
      await reportArrival({ questId, waypointId: currentWaypoint.id }).unwrap();
      Alert.alert(t('locationQuest.active.arrived'), t('locationQuest.active.confirmArrival'));
    } catch (err) {
      console.error('Arrival error:', err);
    }
  };

  const handleAbandon = () => {
    Alert.alert(
      t('locationQuest.active.abandonConfirmTitle'),
      t('locationQuest.active.abandonConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('locationQuest.active.abandonConfirm'), 
          style: 'destructive',
          onPress: async () => {
            if (questId) {
              try {
                await abandonQuest(questId).unwrap();
                navigation.navigate('QuestDiscovery');
              } catch (err) {
                console.error('Abandon error:', err);
              }
            }
          }
        }
      ]
    );
  };

  if (isLoadingQuest || isLoadingProgress) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={styles.loadingText}>{t('locationQuest.active.connecting')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleAbandon} disabled={isAbandoning}>
          {isAbandoning ? (
            <ActivityIndicator size="small" color={theme.colors.text.primary} />
          ) : (
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.primary} />
          )}
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={text.sectionTitle} numberOfLines={1}>{quest?.title}</Text>
          <Text style={[styles.connectionStatus, { color: connectionStatus === 'CONNECTED' ? theme.colors.success.main : theme.colors.text.disabled }]}>
            {connectionStatus === 'CONNECTED' ? '● Live' : '○ Offline'}
          </Text>
        </View>
        {quest?.timeLimitMinutes && timeLeft && (
          <View style={styles.timerBadge}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.error.main} />
            <Text style={styles.timerText}>{timeLeft}</Text> 
          </View>
        )}
      </View>

      <QuestMapView
        waypoints={quest?.waypoints || []}
        currentWaypointIndex={currentWaypointIndex}
        completedWaypointIds={completedWaypointIds}
        userLocation={currentLocation}
        participants={participants}
        style={styles.map}
      />

      <View style={styles.bottomSheet}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {t('locationQuest.active.progressLabel', { 
              completed: progress?.participation.completedWaypoints || 0, 
              total: quest?.waypointCount || 0 
            })}
          </Text>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${((progress?.participation.completedWaypoints || 0) / (quest?.waypointCount || 1)) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {currentWaypoint ? (
          <View style={styles.waypointCard}>
            <Text style={styles.waypointLabel}>{t('locationQuest.active.currentWaypoint')}</Text>
            <Text style={text.sectionTitle}>{currentWaypoint.name}</Text>
            <Text style={styles.waypointTask}>{currentWaypoint.task?.instructions || currentWaypoint.description}</Text>
            
            <TouchableOpacity
              style={[
                button.primaryButton, 
                styles.arrivalButton,
                (!isWithinRadius || isReporting) && button.disabledButton
              ]}
              onPress={handleReportArrival}
              disabled={!isWithinRadius || isReporting}
            >
              {isReporting ? (
                <ActivityIndicator color={theme.colors.neutral.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="map-marker-check" size={20} color={theme.colors.neutral.white} />
                  <Text style={button.primaryButtonText}>
                    {isWithinRadius ? t('locationQuest.active.confirmArrival') : t('locationQuest.active.distanceRemaining', { distance: '...' })}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.completedCard}>
            <MaterialCommunityIcons name="trophy" size={48} color={theme.colors.warning.main} />
            <Text style={text.sectionTitle}>{t('locationQuest.active.questComplete')}</Text>
            <TouchableOpacity 
              style={[button.primaryButton, styles.arrivalButton]} 
              onPress={() => navigation.navigate('QuestDiscovery')}
            >
              <Text style={button.primaryButtonText}>{t('locationQuest.active.backToDiscovery')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {connectionStatus !== 'CONNECTED' && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>{t('locationQuest.active.wsDisconnected')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const themeStyles = createStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    zIndex: 10,
    ...theme.shadows.small,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  connectionStatus: {
    fontSize: 10,
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.layout.borderRadius.full,
  },
  timerText: {
    marginLeft: 4,
    color: theme.colors.error.dark,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.base,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.layout.borderRadius.lg,
    borderTopRightRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.medium,
  },
  progressRow: {
    marginBottom: theme.spacing.md,
  },
  progressText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.neutral.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.success.main,
  },
  waypointCard: {
    paddingBottom: theme.spacing.sm,
  },
  waypointLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  waypointTask: {
    marginTop: theme.spacing.xs,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  arrivalButton: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  offlineBanner: {
    position: 'absolute',
    top: 80,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.warning.main,
    padding: theme.spacing.xs,
    borderRadius: theme.layout.borderRadius.sm,
    alignItems: 'center',
  },
  offlineText: {
    color: theme.colors.neutral.white,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
}));

export default QuestActiveScreen;
