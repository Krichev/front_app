import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { createStyles } from '../shared/ui/theme/createStyles';
import { useDiscoverQuestsQuery, LocationQuest } from '../entities/LocationQuest';
import { QuestMapView } from '../widgets/QuestMap/ui/QuestMapView';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'QuestDiscovery'>;

const QuestDiscoveryScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme, screen, card, text, button } = useAppStyles();
  const styles = themeStyles;
  const navigation = useNavigation<NavigationProp>();

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [permissionError, setPermissionDenied] = useState(false);

  const {
    data: quests,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDiscoverQuestsQuery(
    { latitude: userLocation?.latitude || 0, longitude: userLocation?.longitude || 0 },
    { skip: !userLocation }
  );

  const getLocation = useCallback(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setPermissionDenied(false);
      },
      (err) => {
        console.error('Location error:', err);
        if (err.code === 1) {
          setPermissionDenied(true);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const renderQuestCard = ({ item }: { item: LocationQuest }) => (
    <TouchableOpacity
      style={card.base}
      onPress={() => navigation.navigate('QuestDetail', { questId: item.id })}
    >
      <View style={card.content}>
        <View style={styles.cardHeader}>
          <Text style={[text.sectionTitle, styles.title]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.participantBadge}>
            <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.primary.main} />
            <Text style={styles.participantCount}>{item.currentParticipantCount || 0}</Text>
          </View>
        </View>

        <Text style={text.bodyText}>{item.city}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="map-marker-path" size={18} color={theme.colors.text.secondary} />
            <Text style={styles.infoText}>
              {t('locationQuest.discovery.waypoints', { count: item.waypointCount })}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.text.secondary} />
            <Text style={styles.infoText}>
              {t('locationQuest.discovery.estimatedTime', { minutes: item.estimatedDurationMinutes })}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (permissionError) {
    return (
      <View style={screen.container}>
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="map-marker-off" size={64} color={theme.colors.text.disabled} />
          <Text style={[text.bodyText, styles.messageText]}>
            {t('locationQuest.discovery.permissionDenied')}
          </Text>
          <TouchableOpacity style={button.primaryButton} onPress={() => Linking.openSettings()}>
            <Text style={button.primaryButtonText}>{t('locationQuest.discovery.openSettings')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading && !isFetching) {
    return (
      <View style={screen.container}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={screen.container}>
      <View style={styles.mapContainer}>
        <QuestMapView
          waypoints={(quests || []).map(q => ({
            id: q.id,
            questId: q.id,
            latitude: q.latitude,
            longitude: q.longitude,
            name: q.title,
            sequenceNumber: 1,
            radiusMeters: 50,
            taskType: 'LOCATION_CHECKIN'
          })) as any}
          currentWaypointIndex={-1}
          completedWaypointIds={[]}
          userLocation={userLocation}
        />
      </View>

      <FlatList
        data={quests}
        renderItem={renderQuestCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              getLocation();
              refetch();
            }}
            colors={[theme.colors.primary.main]}
          />
        }
        ListEmptyComponent={
          <View style={styles.centerContent}>
            <MaterialCommunityIcons name="map-search-outline" size={64} color={theme.colors.text.disabled} />
            <Text style={[text.bodyText, styles.emptyTitle]}>{t('locationQuest.discovery.noQuests')}</Text>
            <Text style={[text.caption, styles.emptySubtitle]}>{t('locationQuest.discovery.noQuestsHint')}</Text>
            <TouchableOpacity style={[button.secondaryButton, styles.retryButton]} onPress={() => {
              getLocation();
              refetch();
            }}>
              <Text style={button.secondaryButtonText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  mapContainer: {
    height: '40%',
    width: '100%',
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  title: {
    flex: 1,
    marginRight: theme.spacing.sm,
    marginBottom: 0,
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.light + '20',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.layout.borderRadius.sm,
  },
  participantCount: {
    marginLeft: 4,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.dark,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  infoText: {
    marginLeft: 4,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  loader: {
    flex: 1,
  },
  messageText: {
    textAlign: 'center',
    marginVertical: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
  emptyTitle: {
    marginTop: theme.spacing.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    color: theme.colors.text.secondary,
  },
  retryButton: {
    marginTop: theme.spacing.lg,
    minWidth: 120,
  },
}));

export default QuestDiscoveryScreen;
