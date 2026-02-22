import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { VerificationMethod } from '../../../app/types';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';
import VerificationStatusBadge from './VerificationStatusBadge';

interface PhotoVerificationCardProps {
  method: VerificationMethod & { status: string };
  challengeId: string;
  photoUri: string | null;
  onNavigateToPhoto: () => void;
  isSubmitting?: boolean;
  isProcessing?: boolean;
}

const PhotoVerificationCard: React.FC<PhotoVerificationCardProps> = ({
  method,
  photoUri,
  onNavigateToPhoto,
  isSubmitting,
  isProcessing,
}) => {
  const { theme } = useAppStyles();
  const styles = themeStyles;
  const status = (method.status as any) || 'PENDING';

  const getButtonText = () => {
    if (status === 'COMPLETED') return 'Verified ✓'; // TODO: i18n
    return photoUri ? 'Retake Photo' : 'Take Photo'; // TODO: i18n
  };

  const isDisabled = isSubmitting || isProcessing || status === 'COMPLETED';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Photo Verification</Text> {/* TODO: i18n */}
        <VerificationStatusBadge status={status} />
      </View>

      <View style={styles.content}>
        <Text style={styles.prompt}>
          {method.details.photoPrompt || method.details.description || 'Take a photo for verification'} {/* TODO: i18n */}
        </Text>

        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        )}

        <TouchableOpacity
          style={[styles.actionButton, isDisabled && styles.disabledButton]}
          onPress={onNavigateToPhoto}
          disabled={isDisabled}
        >
          <MaterialCommunityIcons 
            name="camera" 
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
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
    resizeMode: 'cover',
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

export default PhotoVerificationCard;
