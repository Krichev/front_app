// src/screens/components/SoundQualityBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SoundQuality } from '../../types/rhythmChallenge.types';

interface SoundQualityBadgeProps {
    quality: SoundQuality;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
}

const QUALITY_CONFIG: Record<SoundQuality, {
    icon: string;
    color: string;
    backgroundColor: string;
    label: string;
    description: string;
}> = {
    SHARP: {
        icon: 'lightning-bolt',
        color: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.15)',
        label: 'Sharp',
        description: 'Bright, crisp sound',
    },
    CLEAR: {
        icon: 'check-circle',
        color: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        label: 'Clear',
        description: 'Balanced, clean sound',
    },
    MUFFLED: {
        icon: 'blur',
        color: '#9E9E9E',
        backgroundColor: 'rgba(158, 158, 158, 0.15)',
        label: 'Muffled',
        description: 'Dull, soft sound',
    },
};

const SIZE_CONFIG = {
    small: { iconSize: 14, fontSize: 10, padding: 4 },
    medium: { iconSize: 18, fontSize: 12, padding: 6 },
    large: { iconSize: 24, fontSize: 14, padding: 8 },
};

export const SoundQualityBadge: React.FC<SoundQualityBadgeProps> = ({
    quality,
    size = 'medium',
    showLabel = true,
}) => {
    const config = QUALITY_CONFIG[quality];
    const sizeConfig = SIZE_CONFIG[size];
    
    return (
        <View style={[
            styles.badge,
            {
                backgroundColor: config.backgroundColor,
                paddingHorizontal: sizeConfig.padding * 1.5,
                paddingVertical: sizeConfig.padding,
            }
        ]}>
            <MaterialCommunityIcons
                name={config.icon}
                size={sizeConfig.iconSize}
                color={config.color}
            />
            {showLabel && (
                <Text style={[
                    styles.label,
                    {
                        color: config.color,
                        fontSize: sizeConfig.fontSize,
                        marginLeft: sizeConfig.padding,
                    }
                ]}>
                    {config.label}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
    },
    label: {
        fontWeight: '600',
    },
});

export default SoundQualityBadge;
