// src/screens/components/SoundQualityBadge.tsx
import React from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { SoundQuality } from '../../types/rhythmChallenge.types';
import { useAppStyles, createStyles } from '../../shared/ui/theme';

interface SoundQualityBadgeProps {
    quality: SoundQuality;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
    score?: number;
    compact?: boolean;
}

export const SoundQualityBadge: React.FC<SoundQualityBadgeProps> = ({
    quality,
    size = 'medium',
    showLabel = true,
    score,
    compact = false,
}) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    
    const getConfig = (q: SoundQuality) => {
        switch (q) {
            case 'SHARP':
                return {
                    icon: 'lightning-bolt',
                    color: theme.colors.warning.main,
                    label: t('rhythmChallenge.results.timbre'), // Fallback label
                };
            case 'CLEAR':
                return {
                    icon: 'check-circle',
                    color: theme.colors.success.main,
                    label: 'Clear', // Should add to i18n
                };
            case 'MUFFLED':
                return {
                    icon: 'blur',
                    color: theme.colors.text.disabled,
                    label: 'Muffled', // Should add to i18n
                };
            default:
                return {
                    icon: 'help-circle',
                    color: theme.colors.text.disabled,
                    label: 'Unknown',
                };
        }
    };

    const config = getConfig(quality);
    
    if (compact) {
        return (
            <View style={[styles.compactBadge, { backgroundColor: config.color + '20' }]}>
                <MaterialCommunityIcons name={config.icon} size={12} color={config.color} />
                {score !== undefined && (
                    <Text style={[styles.compactText, { color: config.color }]}>{Math.round(score)}</Text>
                )}
            </View>
        );
    }

    return (
        <View style={[
            styles.badge,
            styles[size],
            {
                backgroundColor: config.color + '20',
            }
        ]}>
            <MaterialCommunityIcons
                name={config.icon}
                size={size === 'large' ? 24 : size === 'medium' ? 18 : 14}
                color={config.color}
            />
            {showLabel && (
                <Text style={[
                    styles.label,
                    {
                        color: config.color,
                        fontSize: size === 'large' ? 14 : size === 'medium' ? 12 : 10,
                        marginLeft: size === 'large' ? 8 : 4,
                    }
                ]}>
                    {config.label}
                </Text>
            )}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
    },
    compactBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        gap: 2,
    },
    compactText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    small: {
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    medium: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    large: {
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    label: {
        fontWeight: '600',
    },
}));

export default SoundQualityBadge;
