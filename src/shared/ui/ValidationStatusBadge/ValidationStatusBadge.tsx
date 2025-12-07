// src/shared/ui/ValidationStatusBadge/ValidationStatusBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    ValidationStatus,
    getValidationStatusLabel,
    getValidationStatusColor,
    getValidationStatusIcon,
} from '../../../entities/TopicState/model/types/topic.types';

interface ValidationStatusBadgeProps {
    status: ValidationStatus;
    size?: 'small' | 'medium';
    showLabel?: boolean;
}

const ValidationStatusBadge: React.FC<ValidationStatusBadgeProps> = ({
    status,
    size = 'medium',
    showLabel = true,
}) => {
    const color = getValidationStatusColor(status);
    const icon = getValidationStatusIcon(status);
    const label = getValidationStatusLabel(status);

    const iconSize = size === 'small' ? 14 : 18;
    const fontSize = size === 'small' ? 11 : 13;

    return (
        <View style={[styles.container, { backgroundColor: `${color}15` }]}>
            <MaterialCommunityIcons name={icon} size={iconSize} color={color} />
            {showLabel && (
                <Text style={[styles.label, { color, fontSize }]}>{label}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    label: {
        fontWeight: '600',
    },
});

export default ValidationStatusBadge;
