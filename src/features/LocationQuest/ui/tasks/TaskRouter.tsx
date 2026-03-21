import React, { useState, useEffect } from 'react';
import { View, Text, Animated, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../../shared/ui/theme/createStyles';
import { triggerHaptic } from '../../lib/haptics';
import { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import { WaypointTask, TaskProofFile } from '../../../../entities/LocationQuest/model/types';
import { useCompleteTaskMutation } from '../../../../entities/LocationQuest/model/slice/locationQuestApi';

import GpsCheckinTask from './GpsCheckinTask';
import CoinJingleTask from './CoinJingleTask';
import VideoSelfieTask from './VideoSelfieTask';
import PhotoRecreationTask from './PhotoRecreationTask';
import TriviaQuestionTask from './TriviaQuestionTask';
import CustomTask from './CustomTask';

interface TaskRouterProps {
  questId: number;
  task: WaypointTask;
  onFinished: (hint?: string) => void;
}

type TaskStatus = 'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'FAILED';

const TaskRouter: React.FC<TaskRouterProps> = ({ questId, task, onFinished }) => {
  const { t } = useTranslation();
  const { theme, button } = useAppStyles();
  const styles = themeStyles;

  const [status, setStatus] = useState<TaskStatus>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completeTask] = useCompleteTaskMutation();
  
  const successScale = React.useRef(new Animated.Value(0)).current;
  const hintOpacity = React.useRef(new Animated.Value(0)).current;

  const handleTaskComplete = async (proofFile?: TaskProofFile, textAnswer?: string) => {
    setStatus('SUBMITTING');
    setErrorMessage(null);

    try {
      const metadata = JSON.stringify({
        taskType: task.type,
        waypointId: task.waypointId,
        questId: questId,
      });

      // Prepare URI for Android
      let fileUri = proofFile?.uri;
      if (fileUri && Platform.OS === 'android') {
        if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
          fileUri = 'file://' + fileUri;
        }
      }

      await completeTask({
        questId,
        waypointId: task.waypointId,
        answer: textAnswer,
        fileUri: fileUri,
        fileName: proofFile?.name,
        fileType: proofFile?.type,
        metadata: metadata,
      }).unwrap();

      handleSuccess();
    } catch (error: any) {
      console.error('Task submission failed:', error);
      setStatus('FAILED');
      setErrorMessage(error?.data?.message || t('locationQuest.tasks.common.failed'));
      triggerHaptic(HapticFeedbackTypes.notificationError);
    }
  };

  const handleSuccess = () => {
    setStatus('SUCCESS');
    triggerHaptic(HapticFeedbackTypes.notificationSuccess);
    
    Animated.sequence([
      Animated.spring(successScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(hintOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderTaskComponent = () => {
    switch (task.type) {
      case 'GPS_CHECKIN':
        return <GpsCheckinTask onComplete={() => handleTaskComplete()} />;
      case 'COIN_JINGLE':
        return <CoinJingleTask onComplete={(proof) => handleTaskComplete(proof)} />;
      case 'VIDEO_SELFIE':
        return <VideoSelfieTask onComplete={(proof) => handleTaskComplete(proof)} />;
      case 'PHOTO_RECREATION':
        return <PhotoRecreationTask task={task} onComplete={(proof) => handleTaskComplete(proof)} />;
      case 'TRIVIA_QUESTION':
        return <TriviaQuestionTask task={task} onComplete={(_, answer) => handleTaskComplete(undefined, answer)} />;
      case 'CUSTOM':
      default:
        return <CustomTask task={task} onComplete={(_, note) => handleTaskComplete(undefined, note)} />;
    }
  };

  if (status === 'SUCCESS') {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.successIcon, { transform: [{ scale: successScale }] }]}>
          <MaterialCommunityIcons name="check-circle" size={80} color={theme.colors.success.main} />
        </Animated.View>
        <Text style={styles.successTitle}>{t('locationQuest.tasks.common.completed')}</Text>
        
        {task.hintOnComplete && (
          <Animated.View style={[styles.hintContainer, { opacity: hintOpacity }]}>
            <View style={styles.hintBadge}>
              <MaterialCommunityIcons name="lightbulb-on" size={16} color={theme.colors.warning.main} />
              <Text style={styles.hintBadgeText}>{t('locationQuest.tasks.common.hintRevealed')}</Text>
            </View>
            <Text style={styles.hintText}>{task.hintOnComplete}</Text>
          </Animated.View>
        )}

        <TouchableOpacity 
          style={[button.primaryButton, styles.continueButton]} 
          onPress={() => onFinished(task.hintOnComplete)}
        >
          <Text style={button.primaryButtonText}>{t('locationQuest.tasks.common.continue')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'FAILED') {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="alert-circle" size={80} color={theme.colors.error.main} />
        <Text style={styles.errorTitle}>{t('locationQuest.tasks.common.failed')}</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <TouchableOpacity 
          style={[button.primaryButton, styles.continueButton]} 
          onPress={() => setStatus('IDLE')}
        >
          <Text style={button.primaryButtonText}>{t('locationQuest.tasks.common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.routerContainer}>
      {status === 'SUBMITTING' ? (
        <View style={styles.submittingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.submittingText}>{t('locationQuest.tasks.common.submitting')}</Text>
        </View>
      ) : (
        renderTaskComponent()
      )}
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  routerContainer: {
    width: '100%',
  },
  container: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  successIcon: {
    marginVertical: theme.spacing.xl,
  },
  successTitle: {
    ...theme.typography.heading.h5,
    color: theme.colors.success.main,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xl,
  },
  hintContainer: {
    backgroundColor: theme.colors.warning.background,
    padding: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.md,
    width: '100%',
    marginBottom: theme.spacing['2xl'],
    borderWidth: 1,
    borderColor: theme.colors.warning.light,
  },
  hintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.warning.dark,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  hintText: {
    ...theme.typography.body.medium,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  continueButton: {
    width: '100%',
  },
  errorTitle: {
    ...theme.typography.heading.h6,
    color: theme.colors.error.main,
    marginTop: theme.spacing.md,
  },
  errorMessage: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
  },
  submittingContainer: {
    padding: theme.spacing['3xl'],
    alignItems: 'center',
  },
  submittingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
}));

export default TaskRouter;
