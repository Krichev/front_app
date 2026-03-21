import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../../shared/ui/theme/createStyles';
import { RootStackParamList } from '../../../../navigation/AppNavigator';
import { TaskProofFile } from '../../../../entities/LocationQuest/model/types';
import { CapturedMedia } from '../../../../services/camera/CameraService';

interface VideoSelfieTaskProps {
  onComplete: (proof: TaskProofFile) => void;
}

type TaskNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const VideoSelfieTask: React.FC<VideoSelfieTaskProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { theme, button } = useAppStyles();
  const styles = themeStyles;
  const navigation = useNavigation<TaskNavigationProp>();

  const [videoFile, setVideoFile] = useState<CapturedMedia | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startRecording = () => {
    navigation.navigate('CameraScreen', {
      mode: 'video',
      maxDuration: 5,
      onCapture: (media: CapturedMedia) => {
        setVideoFile(media);
      },
    });
  };

  const handleSubmit = () => {
    if (!videoFile) return;
    
    setIsSubmitting(true);
    const proof: TaskProofFile = {
      uri: videoFile.uri,
      name: videoFile.name,
      type: videoFile.type,
    };
    onComplete(proof);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('locationQuest.tasks.videoSelfie.title')}</Text>
      
      {!videoFile && !isSubmitting && (
        <>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="video-account" size={80} color={theme.colors.primary.main} />
          </View>
          <Text style={styles.instructions}>{t('locationQuest.tasks.videoSelfie.instructions')}</Text>
          <TouchableOpacity style={[button.primaryButton, styles.mainButton]} onPress={startRecording}>
            <Text style={button.primaryButtonText}>{t('locationQuest.tasks.videoSelfie.startRecording')}</Text>
          </TouchableOpacity>
        </>
      )}

      {videoFile && !isSubmitting && (
        <>
          <View style={styles.previewContainer}>
            <Video
              source={{ uri: videoFile.uri }}
              style={styles.previewVideo}
              resizeMode="cover"
              repeat={true}
              muted={false}
            />
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>{t('locationQuest.tasks.videoSelfie.preview')}</Text>
            </View>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[button.secondaryButton, styles.halfButton]} 
              onPress={startRecording}
            >
              <Text style={button.secondaryButtonText}>{t('locationQuest.tasks.videoSelfie.reRecord')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[button.primaryButton, styles.halfButton]} 
              onPress={handleSubmit}
            >
              <Text style={button.primaryButtonText}>{t('locationQuest.tasks.videoSelfie.submit')}</Text>
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
  iconContainer: {
    marginVertical: theme.spacing.xl,
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
  previewContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: theme.layout.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.neutral.black,
    marginBottom: theme.spacing.xl,
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  previewBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: theme.colors.overlay.medium,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.layout.borderRadius.sm,
  },
  previewBadgeText: {
    color: theme.colors.neutral.white,
    fontSize: 12,
    fontWeight: 'bold',
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

export default VideoSelfieTask;
