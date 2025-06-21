// src/features/speech-to-text/ui/SpeechButton.tsx
import React from 'react';
import {StyleSheet, TouchableOpacity, ViewStyle} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useSpeechToText} from '../lib/hooks';

interface SpeechButtonProps {
    size?: number;
    style?: ViewStyle;
    onPress?: () => void;
    disabled?: boolean;
    showQuality?: boolean;
}

export const SpeechButton: React.FC<SpeechButtonProps> = ({
                                                              size = 60,
                                                              style,
                                                              onPress,
                                                              disabled = false,
                                                              showQuality = false,
                                                          }) => {
    const { isRecording, toggleRecording, quality, hasError } = useSpeechToText();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            toggleRecording();
        }
    };

    const getIconName = () => {
        if (hasError) return 'microphone-off';
        return isRecording ? 'stop' : 'microphone';
    };

    const getButtonColor = () => {
        if (disabled) return '#ccc';
        if (hasError) return '#ff4444';
        if (isRecording) return '#ff6b6b';
        return '#4dabf7';
    };

    const qualityColor = quality > 0.8 ? '#51cf66' : quality > 0.5 ? '#ffd43b' : '#ff6b6b';

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: getButtonColor(),
                },
                showQuality && isRecording && { borderWidth: 3, borderColor: qualityColor },
                style,
            ]}
            onPress={handlePress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            <CustomIcon
                name={getIconName()}
                size={size * 0.4}
                color="white"
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
