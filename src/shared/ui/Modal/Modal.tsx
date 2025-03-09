import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    Animated,
    BackHandler,
    Easing,
    GestureResponderEvent,
    Keyboard,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {styles} from './Modal.style.js';
import {useTheme} from "../../../app/providers/ThemeProvider"; // Import styles
import {Portal} from '../Portal/Portal.js';

const ANIMATION_DELAY = 300; // Animation duration in milliseconds

interface ModalProps {
    children?: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
}

export const Modal = (props: ModalProps) => {
    const {children, isOpen, onClose} = props;

    const [isClosing, setIsClosing] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const {theme} = useTheme(); // Get the current theme
    const animation = useRef(new Animated.Value(0)).current;

    // Close handler
    const closeHandler = useCallback(() => {
        if (onClose) {
            setIsClosing(true);
            timerRef.current = setTimeout(() => {
                onClose();
                setIsClosing(false);
            }, ANIMATION_DELAY);
        }
    }, [onClose]);

    // Handle back button press (Android)
    useEffect(() => {
        const backAction = () => {
            if (isOpen) {
                closeHandler();
                return true; // Prevent default back action
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, [isOpen, closeHandler]);

    // Handle keyboard events (Escape key equivalent)
    useEffect(() => {
        const handleKeyDown = () => {
            closeHandler();
        };

        if (isOpen) {
            const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', handleKeyDown);

            return () => {
                keyboardDidHideListener.remove(); // Remove the listener when the component unmounts
            };
        }
    }, [isOpen, closeHandler]);

    // Animation logic
    useEffect(() => {
        if (isOpen) {
            Animated.timing(animation, {
                toValue: 1,
                duration: ANIMATION_DELAY,
                easing: Easing.ease,
                useNativeDriver: true,
            }).start();
        } else if (isClosing) {
            Animated.timing(animation, {
                toValue: 0,
                duration: ANIMATION_DELAY,
                easing: Easing.ease,
                useNativeDriver: true,
            }).start(() => {
                if (onClose) onClose();
            });
        }
    }, [isOpen, isClosing, animation, onClose]);

    // Interpolate animation values
    const opacity = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const scale = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 1],
    });

    const bgColor = theme === 'dark' ? '#090949' : '#fff';
    const textColor = theme === 'dark' ? '#04ff04' : '#000';

    return (
        <Portal>
            <Animated.View
                style={[
                    styles.modal,
                    isOpen && styles.opened,
                    isClosing && styles.isClosing,
                    {opacity},
                ]}
            >
                {/* Overlay */}
                <View
                    style={styles.overlay}
                    onStartShouldSetResponder={(event: GestureResponderEvent) => {
                        closeHandler();
                        return true; // Allow the overlay to handle the touch event
                    }}
                >
                    {/* Modal Content */}
                    <Animated.View
                        style={[
                            styles.content,
                            {backgroundColor: bgColor, transform: [{scale}]},
                        ]}
                        onStartShouldSetResponder={(event: GestureResponderEvent) => {
                            // Prevent the overlay from handling touch events inside the modal content
                            return false;
                        }}
                    >
                        {children}
                        <TouchableOpacity onPress={closeHandler} style={styles.closeButton}>
                            <Text style={[styles.closeButtonText, {color: textColor}]}>Close</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Animated.View>
        </Portal>
    );
};