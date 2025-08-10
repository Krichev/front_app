// src/shared/ui/Modal/Modal.tsx
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, BackHandler, Easing, GestureResponderEvent, Text, TouchableOpacity, View} from 'react-native';
import {styles} from './Modal.style.js';
import {useTheme} from "../../../app/providers/ThemeProvider";
import {Portal} from '../Portal/Portal.js';

const ANIMATION_DELAY = 300;

interface ModalProps {
    children?: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
    title?: string;
    showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
                                                children,
                                                isOpen = false,
                                                onClose,
                                                title,
                                                showCloseButton = true,
                                            }) => {
    const { theme } = useTheme();
    const [visible, setVisible] = useState(isOpen);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.7)).current;

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
                    easing: Easing.out(Easing.back(1.1)),
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
                    toValue: 0.7,
                    duration: ANIMATION_DELAY,
                    easing: Easing.in(Easing.back(1.1)),
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

    const handleBackdropPress = useCallback((event: GestureResponderEvent) => {
        if (event.target === event.currentTarget && onClose) {
            onClose();
        }
    }, [onClose]);

    const handleClosePress = useCallback(() => {
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    if (!visible) {
        return null;
    }

    return (
        <Portal>
            <Animated.View
                style={[
                    styles.overlay,
                    styles[theme],
                    { opacity: fadeAnim }
                ]}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={handleBackdropPress}
                >
                    <Animated.View
                        style={[
                            styles.modal,
                            styles[theme],
                            {
                                transform: [{ scale: scaleAnim }],
                                opacity: fadeAnim,
                            }
                        ]}
                    >
                        {title && (
                            <View style={styles.header}>
                                <Text style={[styles.title, styles[`${theme}Text`]]}>
                                    {title}
                                </Text>
                                {showCloseButton && (
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={handleClosePress}
                                    >
                                        <Text style={[styles.closeButtonText, styles[`${theme}Text`]]}>
                                            ×
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                        <View style={styles.content}>
                            {children}
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </Animated.View>
        </Portal>
    );
};