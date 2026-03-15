// src/screens/components/SoundSimilarityToggle.tsx
import React from 'react';
import {Switch, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../shared/ui/theme';

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
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = toggleStyles;

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
                        name="equalizer"
                        size={24}
                        color={enabled ? theme.colors.success.main : theme.colors.text.disabled}
                    />
                </View>
                
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{t('rhythmChallenge.soundSimilarity.title')}</Text>
                    <Text style={styles.description}>
                        {enabled
                            ? t('rhythmChallenge.soundSimilarity.enabledDesc')
                            : t('rhythmChallenge.soundSimilarity.disabledDesc')
                        }
                    </Text>
                </View>
                
                <Switch
                    value={enabled}
                    onValueChange={onToggle}
                    disabled={disabled}
                    trackColor={{ false: theme.colors.neutral.gray[700], true: theme.colors.success.light }}
                    thumbColor={enabled ? theme.colors.success.main : theme.colors.text.disabled}
                />
            </TouchableOpacity>
            
            {/* Explanation */}
            {enabled && (
                <View style={styles.explanationContainer}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.explanationText}>
                        {t('rhythmChallenge.soundSimilarity.explanation')}
                    </Text>
                </View>
            )}
            
            {/* Weight Display */}
            {enabled && showWeights && (
                <View style={styles.weightsContainer}>
                    <View style={styles.weightItem}>
                        <MaterialCommunityIcons name="timer-outline" size={20} color={theme.colors.info.main} />
                        <Text style={styles.weightLabel}>{t('rhythmChallenge.soundSimilarity.timing')}</Text>
                        <Text style={styles.weightValue}>{Math.round(timingWeight * 100)}%</Text>
                    </View>
                    
                    <View style={styles.weightDivider} />
                    
                    <View style={styles.weightItem}>
                        <MaterialCommunityIcons name="equalizer" size={20} color={theme.colors.secondary?.main || theme.colors.primary.main} />
                        <Text style={styles.weightLabel}>{t('rhythmChallenge.soundSimilarity.sound')}</Text>
                        <Text style={styles.weightValue}>{Math.round(soundWeight * 100)}%</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const toggleStyles = createStyles(theme => ({
    container: {
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.lg,
        marginVertical: theme.spacing.sm,
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
        backgroundColor: theme.colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.inverse,
    },
    description: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    explanationContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginTop: theme.spacing.md,
    },
    explanationText: {
        flex: 1,
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginLeft: 8,
        lineHeight: 18,
    },
    weightsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.neutral.gray[700],
    },
    weightItem: {
        alignItems: 'center',
        flex: 1,
    },
    weightLabel: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginTop: 4,
    },
    weightValue: {
        ...theme.typography.heading.h5,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
        marginTop: 2,
    },
    weightDivider: {
        width: 1,
        height: 40,
        backgroundColor: theme.colors.neutral.gray[700],
    },
}));

export default SoundSimilarityToggle;
