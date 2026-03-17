import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { phaseStyles } from './phases.styles';
import { useTranslation } from 'react-i18next';

interface WaitingPhaseProps {
  roundTime: number;
  onStart: () => void;
  isLoading: boolean;
  /** Overall progress of media preloading (0 to 1) */
  mediaPreloadProgress?: number;
  /** Whether there are any questions with media to preload */
  hasMediaQuestions?: boolean;
}

export const WaitingPhase: React.FC<WaitingPhaseProps> = ({
  roundTime,
  onStart,
  isLoading,
  mediaPreloadProgress = 0,
  hasMediaQuestions = false,
}) => {
  const { theme } = useAppStyles();
  const styles = phaseStyles(theme);
  const { t } = useTranslation();
  
  const [showReadyMessage, setShowReadyMessage] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (hasMediaQuestions && mediaPreloadProgress === 1) {
      setShowReadyMessage(true);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowReadyMessage(false);
      });
    }
  }, [mediaPreloadProgress, hasMediaQuestions, fadeAnim]);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="play-circle-outline"
        size={80}
        color={theme.colors.success.main}
        style={styles.icon}
      />
      <Text style={styles.title}>{t('wwwPhases.waiting.readyToStart')}</Text>
      <Text style={styles.text}>
        {t('wwwPhases.waiting.welcomeText', { roundTime })}
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.disabledButton]}
          onPress={onStart}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? t('wwwPhases.waiting.starting') : t('wwwPhases.waiting.startQuiz')}
          </Text>
        </TouchableOpacity>

        {/* Preload Indicator */}
        {hasMediaQuestions && (
          <View style={styles.preloadIndicatorContainer}>
            {mediaPreloadProgress < 1 ? (
              <View style={styles.preparingContainer}>
                <ActivityIndicator size="small" color={theme.colors.text.secondary} style={styles.tinySpinner} />
                <Text style={styles.preloadText}>
                  {t('wwwPhases.waiting.preparingMedia')} {Math.round(mediaPreloadProgress * 100)}%
                </Text>
              </View>
            ) : showReadyMessage ? (
              <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={[styles.preloadText, { color: theme.colors.success.main, fontWeight: '600' }]}>
                  {t('wwwPhases.waiting.mediaReady')}
                </Text>
              </Animated.View>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
};
