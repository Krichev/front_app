import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { VerificationMethod, LocationData } from '../../../app/types';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';
import VerificationStatusBadge from './VerificationStatusBadge';

interface LocationVerificationCardProps {
  method: VerificationMethod & { status: string };
  challengeId: string;
  locationData: LocationData | null;
  onNavigateToLocation: () => void;
  isSubmitting?: boolean;
  isProcessing?: boolean;
}

const LocationVerificationCard: React.FC<LocationVerificationCardProps> = ({
  method,
  locationData,
  onNavigateToLocation,
  isSubmitting,
  isProcessing,
}) => {
  const { t } = useTranslation();
  const { theme } = useAppStyles();
  const styles = themeStyles;
  const status = (method.status as any) || 'PENDING';

  const getButtonText = () => {
    if (status === 'COMPLETED') return t('challengeVerification.location.verified');
    return status === 'FAILED' ? t('challengeVerification.location.retry') : t('challengeVerification.location.verify');
  };

  const isDisabled = isSubmitting || isProcessing || status === 'COMPLETED';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('challengeVerification.location.title')}</Text>
        <VerificationStatusBadge status={status} />
      </View>

      <View style={styles.content}>
        <Text style={styles.prompt}>
          {t('challengeVerification.location.verifyAtPrompt', { 
            locationName: method.details.locationName || method.details.locationData?.address || t('challengeVerification.location.requiredLocation') 
          })}
        </Text>

        {locationData && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>{t('challengeVerification.location.currentAddress', { address: locationData.address })}</Text>
            {method.result && method.result.distance !== undefined && (
              <Text style={styles.distanceText}>
                {t('challengeVerification.location.distanceInfo', { 
                  distance: Math.round(method.result.distance),
                  radius: method.details.radius || method.details.locationData?.radius || 100
                })}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionButton, isDisabled && styles.disabledButton]}
          onPress={onNavigateToLocation}
          disabled={isDisabled}
        >
          <MaterialCommunityIcons 
            name="map-marker-radius" 
            size={20} 
            color={theme.colors.text.inverse || 'white'} 
          />
          <Text style={styles.buttonText}>{getButtonText()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  card: {
    backgroundColor: theme.colors.background.primary || 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary || '#333',
  },
  content: {
    marginTop: 4,
  },
  prompt: {
    fontSize: 14,
    color: theme.colors.text.secondary || '#555',
    marginBottom: 12,
  },
  locationInfo: {
    backgroundColor: theme.colors.background.secondary || '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 13,
    color: theme.colors.text.secondary || '#555',
  },
  distanceText: {
    fontSize: 13,
    color: theme.colors.text.secondary || '#555',
    marginTop: 4,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: theme.colors.success.main || '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: theme.colors.text.inverse || 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
}));

export default LocationVerificationCard;
