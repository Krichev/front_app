import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';
import { QuestWaypoint, ParticipantLocationDTO } from '../../../entities/LocationQuest';

interface QuestMapViewProps {
  waypoints: QuestWaypoint[];
  currentWaypointIndex: number;
  completedWaypointIds: number[];
  userLocation?: { latitude: number; longitude: number } | null;
  participants?: ParticipantLocationDTO[];
  onWaypointPress?: (waypoint: QuestWaypoint) => void;
  style?: any;
}

export const QuestMapView: React.FC<QuestMapViewProps> = ({
  waypoints,
  currentWaypointIndex,
  completedWaypointIds,
  userLocation,
  participants = [],
  onWaypointPress,
  style,
}) => {
  const { theme } = useAppStyles();
  const styles = themeStyles;
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (waypoints.length > 0 && mapRef.current) {
      const coords = waypoints.map(wp => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
      }));
      if (userLocation) {
        coords.push(userLocation);
      }
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [waypoints, userLocation]);

  const getMarkerColor = (wp: QuestWaypoint, index: number) => {
    if (completedWaypointIds.includes(wp.id)) {
      return theme.colors.success.main;
    }
    if (index === currentWaypointIndex) {
      return theme.colors.primary.main;
    }
    return theme.colors.text.disabled;
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation={true}
        followsUserLocation={false}
      >
        {waypoints.map((wp, index) => (
          <Marker
            key={wp.id}
            coordinate={{ latitude: wp.latitude, longitude: wp.longitude }}
            onPress={() => onWaypointPress?.(wp)}
          >
            <View style={[styles.markerLabel, { backgroundColor: getMarkerColor(wp, index) }]}>
              <Text style={styles.markerText}>{wp.sequenceNumber || index + 1}</Text>
            </View>
          </Marker>
        ))}

        {participants.map((p) => (
          <Marker
            key={p.userId}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={p.username}
          >
            <View style={styles.participantMarker} />
          </Marker>
        ))}

        <Polyline
          coordinates={waypoints.map(wp => ({
            latitude: wp.latitude,
            longitude: wp.longitude,
          }))}
          strokeColor={theme.colors.primary.main}
          strokeWidth={3}
          lineDashPattern={[5, 5]}
        />
      </MapView>
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerLabel: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 24,
  },
  markerText: {
    color: theme.colors.neutral.white,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  participantMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.warning.main,
    borderWidth: 2,
    borderColor: theme.colors.neutral.white,
  },
}));
