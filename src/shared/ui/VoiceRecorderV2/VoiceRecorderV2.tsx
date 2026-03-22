import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Theme} from '../theme/types';
import {useAppStyles} from '../hooks/useAppStyles';

interface VoiceRecorderV2Props {
    onTranscription: (text: string) => void;
    isActive?: boolean;
    language?: string;
}

/**
 * Placeholder for VoiceRecorderV2 component.
 * In a real implementation, this would handle speech-to-text.
 */
export const VoiceRecorderV2: React.FC<VoiceRecorderV2Props> = ({
    onTranscription,
    isActive = false,
    language = 'en-US',
}) => {
    const {theme} = useAppStyles();
    const styles = createStyles(theme);

    const simulateTranscription = () => {
        onTranscription('Simulated team discussion text...');
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={[styles.button, isActive && styles.activeButton]}
                onPress={simulateTranscription}
            >
                <MaterialCommunityIcons 
                    name={isActive ? "microphone" : "microphone-off"} 
                    size={24} 
                    color={theme.colors.text.inverse} 
                />
                <Text style={styles.text}>
                    {isActive ? 'Voice Recognition Active' : 'Voice Recognition Off'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: theme.spacing.md,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        gap: theme.spacing.sm,
    },
    activeButton: {
        backgroundColor: theme.colors.primary.main,
    },
    text: {
        ...theme.typography.body.medium,
        color: theme.colors.text.inverse,
        fontWeight: theme.typography.fontWeight.bold,
    },
});
