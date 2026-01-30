// src/screens/components/SoundSimilarityToggle.tsx
import React from 'react';
import {StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface SoundSimilarityToggleProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    timingWeight: number;
    soundWeight: number;
    onWeightChange?: (timing: number, sound: number) => void;
    showWeights?: boolean;
    disabled?: boolean;
}

/**
 * Toggle for enabling sound similarity evaluation
 * Shows explanation and optional weight configuration
 */
export const SoundSimilarityToggle: React.FC<SoundSimilarityToggleProps> = ({
    enabled,
    onToggle,
    timingWeight,
    soundWeight,
    onWeightChange,
    showWeights = false,
    disabled = false,
}) => {
    return (
        <View style={[styles.container, disabled && styles.disabled]}>
            {/* Main Toggle */}
            <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => !disabled && onToggle(!enabled)}
                activeOpacity={0.7}
            >
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                        name={enabled ? 'equalizer' : 'equalizer'}
                        size={24}
                        color={enabled ? '#4CAF50' : '#666'}
                    />
                </View>
                
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Sound Similarity</Text>
                    <Text style={styles.description}>
                        {enabled
                            ? 'Evaluate both timing AND sound quality'
                            : 'Evaluate timing only'
                        }
                    </Text>
                </View>
                
                <Switch
                    value={enabled}
                    onValueChange={onToggle}
                    disabled={disabled}
                    trackColor={{ false: '#333', true: '#81C784' }}
                    thumbColor={enabled ? '#4CAF50' : '#888'}
                />
            </TouchableOpacity>
            
            {/* Explanation */}
            {enabled && (
                <View style={styles.explanationContainer}>
                    <MaterialCommunityIcons name="information-outline" size={16} color="#888" />
                    <Text style={styles.explanationText}>
                        Your claps will be analyzed for clarity, brightness, and consistency.
                        Try to match the sound quality of the reference pattern.
                    </Text>
                </View>
            )}
            
            {/* Weight Display */}
            {enabled && showWeights && (
                <View style={styles.weightsContainer}>
                    <View style={styles.weightItem}>
                        <MaterialCommunityIcons name="timer-outline" size={20} color="#2196F3" />
                        <Text style={styles.weightLabel}>Timing</Text>
                        <Text style={styles.weightValue}>{Math.round(timingWeight * 100)}%</Text>
                    </View>
                    
                    <View style={styles.weightDivider} />
                    
                    <View style={styles.weightItem}>
                        <MaterialCommunityIcons name="equalizer" size={20} color="#9C27B0" />
                        <Text style={styles.weightLabel}>Sound</Text>
                        <Text style={styles.weightValue}>{Math.round(soundWeight * 100)}%</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
    },
    disabled: {
        opacity: 0.5,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#252525',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    description: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    explanationContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#252525',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    explanationText: {
        flex: 1,
        fontSize: 12,
        color: '#888',
        marginLeft: 8,
        lineHeight: 18,
    },
    weightsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    weightItem: {
        alignItems: 'center',
        flex: 1,
    },
    weightLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    weightValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 2,
    },
    weightDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#333',
    },
});

export default SoundSimilarityToggle;
