import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { themeStyles as styles } from '../styles';

interface SelectionActionBarProps {
    selectedCount: number;
    onUseSelected: () => void;
    onClearSelection: () => void;
    isDisabled: boolean;
}

export const SelectionActionBar: React.FC<SelectionActionBarProps> = ({ 
    selectedCount, 
    onUseSelected, 
    onClearSelection,
    isDisabled 
}) => {
    return (
        <View style={styles.actionButtons}>
            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onClearSelection}
            >
                <Text style={styles.secondaryButtonText}>Clear Selection</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.primaryButton,
                    isDisabled && styles.disabledButton
                ]}
                onPress={onUseSelected}
                disabled={isDisabled}
            >
                <Text style={styles.buttonText}>
                    Use Selected ({selectedCount})
                </Text>
            </TouchableOpacity>
        </View>
    );
};
