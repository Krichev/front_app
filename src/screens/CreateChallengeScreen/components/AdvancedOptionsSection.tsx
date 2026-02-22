import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { Theme } from '../../../shared/ui/theme/types';
import { CreateChallengeFormData } from '../hooks/useCreateChallengeForm';

interface AdvancedOptionsSectionProps {
    formData: CreateChallengeFormData;
    tagsInput: string;
    onUpdate: (field: keyof CreateChallengeFormData, value: any) => void;
    onTagsChange: (text: string) => void;
    showAdvancedOptions: boolean;
    onToggle: () => void;
    theme: Theme;
}

export const AdvancedOptionsSection: React.FC<AdvancedOptionsSectionProps> = ({
    formData,
    tagsInput,
    onUpdate,
    onTagsChange,
    showAdvancedOptions,
    onToggle,
    theme,
}) => {
    return (
        <>
            <TouchableOpacity
                style={styles.sectionToggle}
                onPress={onToggle}
            >
                <Text style={styles.sectionToggleText}>
                    {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
                </Text>
            </TouchableOpacity>

            {showAdvancedOptions && (
                <View style={styles.advancedContainer}>
                    <Text style={styles.sectionTitle}>Advanced Options</Text>

                    {/* Target Group */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Target Group</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.targetGroup}
                            onChangeText={(text) => onUpdate('targetGroup', text)}
                            placeholder="Choose group (optional)"
                            placeholderTextColor={theme.colors.text.disabled}
                        />
                    </View>

                    {/* Tags */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tags</Text>
                        <TextInput
                            style={styles.input}
                            value={tagsInput}
                            onChangeText={onTagsChange}
                            placeholder="Enter tags separated by commas (e.g., fitness, daily, workout)"
                            placeholderTextColor={theme.colors.text.disabled}
                        />
                        {formData.tags.length > 0 && (
                            <View style={styles.tagsPreview}>
                                {formData.tags.map((tag, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Reward */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Reward</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.reward}
                            onChangeText={(text) => onUpdate('reward', text)}
                            placeholder="What's the reward for completing this challenge?"
                            placeholderTextColor={theme.colors.text.disabled}
                        />
                    </View>

                    {/* Penalty */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Penalty</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.penalty}
                            onChangeText={(text) => onUpdate('penalty', text)}
                            placeholder="What's the penalty for failing?"
                            placeholderTextColor={theme.colors.text.disabled}
                        />
                    </View>
                </View>
            )}
        </>
    );
};
