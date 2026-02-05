import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../shared/ui/theme/ThemeProvider';
import { createStyles } from './VibrationButton.styles';

interface VibrationButtonProps {
  isVibrating: boolean;
  onPress: () => void;
  disabled?: boolean;
  canReplay: boolean;
  replaysRemaining: number;
}

export const VibrationButton: React.FC<VibrationButtonProps> = ({
  isVibrating,
  onPress,
  disabled,
  canReplay,
  replaysRemaining,
}) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation when vibrating
  useEffect(() => {
    if (isVibrating) {
      // Loop pulse animation
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
          }),
        ])
      );
      
      // Ripple effect
      const rippleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(rippleAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
          Animated.timing(rippleAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      
      const opacityLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

      pulseLoop.start();
      rippleLoop.start();
      opacityLoop.start();

      return () => {
        pulseLoop.stop();
        rippleLoop.stop();
        opacityLoop.stop();
        scaleAnim.setValue(1);
        rippleAnim.setValue(0);
        opacityAnim.setValue(0);
      };
    } else {
      scaleAnim.setValue(1);
    }
  }, [isVibrating, scaleAnim, rippleAnim, opacityAnim]);

  const buttonColor = isVibrating
    ? theme.colors.secondary.main
    : canReplay
      ? theme.colors.primary.main
      : theme.colors.text.disabled;

  const iconName = isVibrating
    ? 'waveform'
    : replaysRemaining === 0
      ? 'waveform-slash'
      : 'play-circle-outline';

  const label = isVibrating
    ? 'Feeling...'
    : replaysRemaining === 0
      ? 'No Replays'
      : 'Feel Rhythm';

  return (
    <View style={styles.container}>
      {/* Ripple Effect Background */}
      {isVibrating && (
        <Animated.View
          style={[
            styles.ripple,
            {
              transform: [{ scale: rippleAnim }],
              opacity: opacityAnim,
              borderColor: theme.colors.secondary.main,
            },
          ]}
        />
      )}

      {/* Main Button */}
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || (!canReplay && !isVibrating)}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.button,
            {
              backgroundColor: buttonColor,
              borderColor: theme.colors.background.primary,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name={iconName}
            size={64}
            color={theme.colors.primary.contrast}
            style={styles.icon}
          />
          <Text style={[styles.text, { color: theme.colors.primary.contrast }]}>
            {label}
          </Text>
          {canReplay && !isVibrating && (
            <Text style={[styles.subText, { color: theme.colors.primary.contrast }]}>
              {replaysRemaining} left
            </Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};