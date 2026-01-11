// src/shared/ui/AudioChallengeTypeSelector/AudioChallengeTypeSelector.tsx
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    AudioChallengeType,
    AUDIO_CHALLENGE_TYPES,
    AudioChallengeTypeInfo,
} from '../../../entities/ChallengeState/model/types';

// ============================================================================
// TYPES
// ============================================================================

interface AudioChallengeTypeSelectorProps {
    /** Currently selected challenge type */
    selectedType: AudioChallengeType | null;
    /** Callback when a type is selected */
    onSelectType: (type: AudioChallengeType) => void;
    /** Whether the selector is disabled */
    disabled?: boolean;
    /** Optional label override */
    label?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Visual card-based selector for audio challenge types.
 * Displays all 4 challenge types with icons, labels, and descriptions.
 */
export const AudioChallengeTypeSelector: React.FC<AudioChallengeTypeSelectorProps> = ({
    selectedType,
    onSelectType,
    disabled = false,
    label = 'Challenge Type *',
}) => {
    const renderTypeCard = (typeInfo: AudioChallengeTypeInfo) => {
        const isSelected = selectedType === typeInfo.type;

        return (
            <TouchableOpacity
                key={typeInfo.type}
                style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                    disabled && styles.cardDisabled,
                ]}
                onPress={() => !disabled && onSelectType(typeInfo.type)}
                activeOpacity={disabled ? 1 : 0.7}
                disabled={disabled}
            >
                {/* Icon */}
                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                    <MaterialCommunityIcons
                        name={typeInfo.icon}
                        size={28}
                        color={isSelected ? '#FFFFFF' : '#666666'}
                    />
                </View>

                {/* Label */}
                <Text
                    style={[
                        styles.cardLabel,
                        isSelected && styles.cardLabelSelected,
                    ]}
                    numberOfLines={1}
                >
                    {typeInfo.label}
                </Text>

                {/* Description */}
                <Text
                    style={[
                        styles.cardDescription,
                        isSelected && styles.cardDescriptionSelected,
                    ]}
                    numberOfLines={2}
                >
                    {typeInfo.description}
                </Text>

                {/* Scoring indicators */}
                <View style={styles.scoringIndicators}>
                    {typeInfo.usesPitchScoring && (
                        <View style={[styles.indicator, isSelected && styles.indicatorSelected]}>
                            <MaterialCommunityIcons
                                name="music"
                                size={12}
                                color={isSelected ? '#007AFF' : '#999'}
                            />
                            <Text style={[styles.indicatorText, isSelected && styles.indicatorTextSelected]}>
                                Pitch
                            </Text>
                        </View>
                    )}
                    {typeInfo.usesRhythmScoring && (
                        <View style={[styles.indicator, isSelected && styles.indicatorSelected]}>
                            <MaterialCommunityIcons
                                name="metronome"
                                size={12}
                                color={isSelected ? '#007AFF' : '#999'}
                            />
                            <Text style={[styles.indicatorText, isSelected && styles.indicatorTextSelected]}>
                                Rhythm
                            </Text>
                        </View>
                    )}
                    {typeInfo.usesVoiceScoring && (
                        <View style={[styles.indicator, isSelected && styles.indicatorSelected]}>
                            <MaterialCommunityIcons
                                name="account-voice"
                                size={12}
                                color={isSelected ? '#007AFF' : '#999'}
                            />
                            <Text style={[styles.indicatorText, isSelected && styles.indicatorTextSelected]}>
                                Voice
                            </Text>
                        </View>
                    )}
                </View>

                {/* Reference audio indicator */}
                {typeInfo.requiresReferenceAudio && (
                    <View style={styles.requiresAudioBadge}>
                        <MaterialCommunityIcons
                            name="file-music"
                            size={10}
                            color="#666"
                        />
                        <Text style={styles.requiresAudioText}>Needs audio</Text>
                    </View>
                )}

                {/* Selection checkmark */}
                {isSelected && (
                    <View style={styles.checkmark}>
                        <MaterialCommunityIcons
                            name="check-circle"
                            size={20}
                            color="#007AFF"
                        />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.grid}>
                {AUDIO_CHALLENGE_TYPES.map(renderTypeCard)}
            </View>
        </View>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    card: {
        width: '48%',
        marginHorizontal: '1%',
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        minHeight: 140,
        position: 'relative',
    },
    cardSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F7FF',
    },
    cardDisabled: {
        opacity: 0.5,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainerSelected: {
        backgroundColor: '#007AFF',
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 4,
    },
    cardLabelSelected: {
        color: '#007AFF',
    },
    cardDescription: {
        fontSize: 11,
        color: '#666666',
        lineHeight: 14,
        marginBottom: 8,
    },
    cardDescriptionSelected: {
        color: '#555555',
    },
    scoringIndicators: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    indicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 2,
    },
    indicatorSelected: {
        backgroundColor: '#E0EFFF',
    },
    indicatorText: {
        fontSize: 9,
        color: '#999999',
        fontWeight: '500',
    },
    indicatorTextSelected: {
        color: '#007AFF',
    },
    requiresAudioBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 2,
    },
    requiresAudioText: {
        fontSize: 8,
        color: '#666666',
        fontWeight: '500',
    },
    checkmark: {
        position: 'absolute',
        bottom: 8,
        right: 8,
    },
});

export default AudioChallengeTypeSelector;
