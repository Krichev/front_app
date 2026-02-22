import React from 'react';
import { View, Text, TextInput, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { styles } from '../styles';
import { Theme } from '../../../shared/ui/theme/types';
import { PhotoDetailsState } from '../hooks/useCreateChallengeForm';

interface PhotoVerificationFieldsProps {
    photoDetails: PhotoDetailsState;
    onUpdate: (details: Partial<PhotoDetailsState>) => void;
    theme: Theme;
}

export const PhotoVerificationFields: React.FC<PhotoVerificationFieldsProps> = ({
    photoDetails,
    onUpdate,
    theme,
}) => {
    return (
        <View style={styles.verificationDetailsContainer}>
            <Text style={styles.label}>Photo Description *</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                value={photoDetails.description}
                onChangeText={(text) => onUpdate({ description: text })}
                placeholder="Describe what the photo should show (e.g., 'Take a photo showing your completed workout')"
                multiline
                numberOfLines={3}
                placeholderTextColor={theme.colors.text.disabled}
            />

            <View style={styles.switchContainer}>
                <Text style={styles.label}>Require Photo Comparison</Text>
                <Switch
                    value={photoDetails.requiresComparison}
                    onValueChange={(value) => onUpdate({ requiresComparison: value })}
                    trackColor={{ false: theme.colors.neutral.gray[400], true: theme.colors.info.light }}
                    thumbColor={photoDetails.requiresComparison ? theme.colors.info.main : theme.colors.neutral.gray[50]}
                />
            </View>

            <Text style={styles.label}>Verification Mode</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={photoDetails.verificationMode}
                    onValueChange={(value) => onUpdate({ verificationMode: value as any })}
                    style={styles.picker}
                >
                    <Picker.Item label="Standard Photo" value="standard" />
                    <Picker.Item label="Selfie" value="selfie" />
                    <Picker.Item label="Comparison" value="comparison" />
                </Picker>
            </View>
        </View>
    );
};
