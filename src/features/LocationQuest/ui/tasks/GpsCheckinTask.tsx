import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../../shared/ui/theme/createStyles';
import { triggerHaptic } from '../../lib/haptics';
import { HapticFeedbackTypes } from 'react-native-haptic-feedback';

interface GpsCheckinTaskProps {
  onComplete: () => void;
}

const GpsCheckinTask: React.FC<GpsCheckinTaskProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { theme } = useAppStyles();
  const styles = themeStyles;
  
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    triggerHaptic(HapticFeedbackTypes.notificationSuccess);
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete, scaleAnim, opacityAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <MaterialCommunityIcons name="check-decagram" size={100} color={theme.colors.success.main} />
      </Animated.View>
      <Text style={styles.title}>{t('locationQuest.tasks.gpsCheckin.title')}</Text>
      <Text style={styles.subtitle}>{t('locationQuest.tasks.gpsCheckin.subtitle')}</Text>
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.heading.h5,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
}));

export default GpsCheckinTask;
