// src/shared/ui/Modal/Modal.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  GestureResponderEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { PortalCustom } from '../Portal/Portal.tsx';
import { createModalStyles, styles as fallbackStyles } from './Modal.style';

const ANIMATION_DELAY = 300;

interface ModalProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  showCloseButton?: boolean;
  scrollable?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  isOpen = false,
  onClose,
  title,
  showCloseButton = true,
  scrollable = true,
}) => {
  const { theme, mode } = useTheme();
  const [visible, setVisible] = useState(isOpen);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Create theme-aware styles, fallback to static styles if theme unavailable
  const styles = theme ? createModalStyles(theme) : fallbackStyles;
  const themeMode = mode || 'light';

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DELAY,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: ANIMATION_DELAY,
          easing: Easing.out(Easing.back(1.05)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DELAY,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: ANIMATION_DELAY,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
      });
    }
  }, [isOpen, fadeAnim, scaleAnim]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isOpen && onClose) {
        onClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isOpen, onClose]);

  const handleBackdropPress = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleClosePress = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleContentPress = useCallback((event: GestureResponderEvent) => {
    // Prevent backdrop press when clicking on modal content
    event.stopPropagation();
  }, []);

  if (!visible) {
    return null;
  }

  const ContentWrapper = scrollable ? ScrollView : View;
  const contentWrapperProps = scrollable
    ? { showsVerticalScrollIndicator: false, bounces: false }
    : {};

  return (
    <PortalCustom>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback onPress={handleContentPress}>
              <Animated.View
                style={[
                  styles.modal,
                  styles[themeMode],
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                {/* Header with title and close button */}
                {title && (
                  <View style={styles.header}>
                    <Text
                      style={[styles.title, styles[`${themeMode}Text`]]}
                      numberOfLines={1}
                    >
                      {title}
                    </Text>
                    {showCloseButton && (
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClosePress}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={[styles.closeButtonText, styles[`${themeMode}Text`]]}>
                          ×
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Content area */}
                <ContentWrapper style={styles.content} {...contentWrapperProps}>
                  {children}
                </ContentWrapper>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </PortalCustom>
  );
};
