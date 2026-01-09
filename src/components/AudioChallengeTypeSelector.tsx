import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    AudioChallengeType,
    AUDIO_CHALLENGE_TYPES,
    AudioChallengeTypeInfo
} from '../entities/ChallengeState/model/types';

interface AudioChallengeTypeSelectorProps {
    selectedType: AudioChallengeType | null;
    onSelectType: (type: AudioChallengeType) => void;
    disabled?: boolean;
}

const AudioChallengeTypeSelector: React.FC<AudioChallengeTypeSelectorProps> = ({
    selectedType,
    onSelectType,
    disabled = false
}) => {
    const renderTypeCard = (typeInfo: AudioChallengeTypeInfo) => {
        const isSelected = selectedType === typeInfo.type;

        return (
            <TouchableOpacity
                key={typeInfo.type}
                style={[
                    styles.typeCard,
                    isSelected && styles.typeCardSelected,
                    disabled && styles.typeCardDisabled
                ]}
                onPress={() => !disabled && onSelectType(typeInfo.type)}
                disabled={disabled}
            >
                <MaterialCommunityIcons
                    name={typeInfo.icon}
                    size={32}
                    color={isSelected ? '#fff' : '#4CAF50'}
                />
                <Text style={[
                    styles.typeLabel,
                    isSelected && styles.typeLabelSelected
                ]}>
                    {typeInfo.label}
                </Text>
                <Text style={[
                    styles.typeDescription,
                    isSelected && styles.typeDescriptionSelected
                ]}>
                    {typeInfo.description}
                </Text>

                {/* Scoring indicators */}
                <View style={styles.scoringIndicators}>
                    {typeInfo.usesPitchScoring && (
                        <View style={[
                            styles.indicator,
                            isSelected && styles.indicatorSelected
                        ]}>
                            <Text style={styles.indicatorText}>Pitch</Text>
                        </View>
                    )}
                    {typeInfo.usesRhythmScoring && (
                        <View style={[
                            styles.indicator,
                            isSelected && styles.indicatorSelected
                        ]}>
                            <Text style={styles.indicatorText}>Rhythm</Text>
                        </View>
                    )}
                    {typeInfo.usesVoiceScoring && (
                        <View style={[
                            styles.indicator,
                            isSelected && styles.indicatorSelected
                        ]}>
                            <Text style={styles.indicatorText}>Voice</Text>
                        </View>
                    )}
                </View>

                {/* Reference audio indicator */}
                {typeInfo.requiresReferenceAudio && (
                    <View style={styles.requiresAudioBadge}>
                        <MaterialCommunityIcons
                            name="music-note"
                            size={12}
                            color="#fff"
                        />
                        <Text style={styles.requiresAudioText}>
                            Requires Reference
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select Challenge Type</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {AUDIO_CHALLENGE_TYPES.map(renderTypeCard)}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        paddingHorizontal: 16
    },
    scrollContent: {
        paddingHorizontal: 12
    },
    typeCard: {
        width: 160,
        padding: 16,
        marginHorizontal: 4,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        alignItems: 'center'
    },
    typeCardSelected: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50'
    },
    typeCardDisabled: {
        opacity: 0.5
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        textAlign: 'center'
    },
    typeLabelSelected: {
        color: '#fff'
    },
    typeDescription: {
        fontSize: 11,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
        lineHeight: 14
    },
    typeDescriptionSelected: {
        color: 'rgba(255,255,255,0.9)'
    },
    scoringIndicators: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 8,
        gap: 4
    },
    indicator: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: '#e8f5e9',
        borderRadius: 4
    },
    indicatorSelected: {
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    indicatorText: {
        fontSize: 9,
        color: '#4CAF50',
        fontWeight: '500'
    },
    requiresAudioBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: '#FF9800',
        borderRadius: 4,
        gap: 2
    },
    requiresAudioText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: '500'
    }
});

export default AudioChallengeTypeSelector;
