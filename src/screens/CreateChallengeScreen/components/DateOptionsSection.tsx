import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { styles } from '../styles';
import { CreateChallengeFormData } from '../hooks/useCreateChallengeForm';

interface DateOptionsSectionProps {
    formData: CreateChallengeFormData;
    showDateOptions: boolean;
    onToggle: () => void;
}

export const DateOptionsSection: React.FC<DateOptionsSectionProps> = ({
    formData,
    showDateOptions,
    onToggle,
}) => {
    return (
        <>
            <TouchableOpacity
                style={styles.sectionToggle}
                onPress={onToggle}
            >
                <Text style={styles.sectionToggleText}>
                    {showDateOptions ? 'Hide Date Options' : 'Show Date Options'}
                </Text>
            </TouchableOpacity>

            {showDateOptions && (
                <View style={styles.dateContainer}>
                    <Text style={styles.sectionTitle}>Challenge Schedule</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Start Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => {
                                // TODO: Implement date picker
                                Alert.alert('Info', 'Date picker will be implemented');
                            }}
                        >
                            <Text style={styles.dateButtonText}>
                                {formData.startDate
                                    ? formData.startDate.toLocaleDateString()
                                    : 'Select Start Date'
                                }
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>End Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => {
                                // TODO: Implement date picker
                                Alert.alert('Info', 'Date picker will be implemented');
                            }}
                        >
                            <Text style={styles.dateButtonText}>
                                {formData.endDate
                                    ? formData.endDate.toLocaleDateString()
                                    : 'Select End Date'
                                }
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </>
    );
};
