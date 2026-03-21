import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../../shared/ui/theme/createStyles';
import { RootStackParamList } from '../../../../navigation/AppNavigator';
import { TaskProofFile, WaypointTask } from '../../../../entities/LocationQuest/model/types';
import { CapturedMedia } from '../../../../services/camera/CameraService';

interface PhotoRecreationTaskProps {
  task: WaypointTask;
  onComplete: (proof: TaskProofFile) => void;
}

type TaskNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PhotoRecreationTask: React.FC<PhotoRecreationTaskProps> = ({ task, onComplete }) => {
  const { t } = useTranslation();
  const { theme, button } = useAppStyles();
  const styles = themeStyles;
  const navigation = useNavigation<TaskNavigationProp>();

  const [capturedPhoto, setCapturedPhoto] = useState<CapturedMedia | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const takePhoto = () => {
    navigation.navigate('CameraScreen', {
      mode: 'photo',
      onCapture: (media: CapturedMedia) => {
        setCapturedPhoto(media);
      },
    });
  };

  const handleSubmit = () => {
    if (!capturedPhoto) return;
    
    setIsSubmitting(true);
    const proof: TaskProofFile = {
      uri: capturedPhoto.uri,
      name: capturedPhoto.name,
      type: capturedPhoto.type,
    };
    onComplete(proof);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('locationQuest.tasks.photoRecreation.title')}</Text>
      
      {!capturedPhoto && !isSubmitting && (
        <>
          <View style={styles.referenceContainer}>
            <Text style={styles.label}>{t('locationQuest.tasks.photoRecreation.referenceImage')}</Text>
            {task.referenceImageUrl && !imageError ? (
              <Image 
                source={{ uri: task.referenceImageUrl }} 
                style={styles.referenceImage} 
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.referenceImage, styles.errorPlaceholder]}>
                <MaterialCommunityIcons name="image-off" size={48} color={theme.colors.text.disabled} />
                <Text style={styles.errorText}>{t('locationQuest.tasks.photoRecreation.imageLoadFailed')}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.instructions}>{t('locationQuest.tasks.photoRecreation.instructions')}</Text>
          <TouchableOpacity style={[button.primaryButton, styles.mainButton]} onPress={takePhoto}>
            <Text style={button.primaryButtonText}>{t('locationQuest.tasks.photoRecreation.takePhoto')}</Text>
          </TouchableOpacity>
        </>
      )}

      {capturedPhoto && !isSubmitting && (
        <>
          <View style={styles.comparisonContainer}>
            <View style={styles.comparisonHalf}>
              <Text style={styles.tinyLabel}>{t('locationQuest.tasks.photoRecreation.referenceImage')}</Text>
              <Image source={{ uri: task.referenceImageUrl }} style={styles.halfImage} />
            </View>
            <View style={styles.comparisonHalf}>
              <Text style={styles.tinyLabel}>{t('locationQuest.tasks.photoRecreation.comparison')}</Text>
              <Image source={{ uri: capturedPhoto.uri }} style={styles.halfImage} />
            </View>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[button.secondaryButton, styles.halfButton]} 
              onPress={takePhoto}
            >
              <Text style={button.secondaryButtonText}>{t('locationQuest.tasks.photoRecreation.retake')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[button.primaryButton, styles.halfButton]} 
              onPress={handleSubmit}
            >
              <Text style={button.primaryButtonText}>{t('locationQuest.tasks.photoRecreation.submit')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {isSubmitting && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>{t('locationQuest.tasks.common.submitting')}</Text>
        </View>
      )}
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  container: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    ...theme.typography.heading.h6,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  referenceContainer: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.body.small,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    fontWeight: 'bold',
  },
  referenceImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.layout.borderRadius.md,
    backgroundColor: theme.colors.background.tertiary,
  },
  errorPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.body.small,
    color: theme.colors.text.disabled,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  instructions: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  mainButton: {
    width: '100%',
  },
  comparisonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  comparisonHalf: {
    flex: 1,
  },
  tinyLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  halfImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: theme.layout.borderRadius.sm,
    backgroundColor: theme.colors.neutral.black,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  halfButton: {
    flex: 1,
  },
  loadingContainer: {
    marginVertical: theme.spacing['2xl'],
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
}));

export default PhotoRecreationTask;
