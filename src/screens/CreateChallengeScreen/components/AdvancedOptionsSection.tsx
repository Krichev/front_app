import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();

    return (
        <>
            <TouchableOpacity
                style={styles.sectionToggle}
                onPress={onToggle}
            >
                <Text style={styles.sectionToggleText}>
                    {showAdvancedOptions ? t('createChallenge.advanced.hide') : t('createChallenge.advanced.show')}
                </Text>
            </TouchableOpacity>

            {showAdvancedOptions && (
                <View style={styles.advancedContainer}>
                    <Text style={styles.sectionTitle}>{t('createChallenge.advanced.title')}</Text>

                    {/* Target Group */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>{t('createChallenge.advanced.targetGroup')}</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.targetGroup}
                            onChangeText={(text) => onUpdate('targetGroup', text)}
                            placeholder={t('createChallenge.advanced.targetGroupPlaceholder')}
                            placeholderTextColor={theme.colors.text.disabled}
                        />
                    </View>

                    {/* Tags */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>{t('createChallenge.advanced.tags')}</Text>
                        <TextInput
                            style={styles.input}
                            value={tagsInput}
                            onChangeText={onTagsChange}
                            placeholder={t('createChallenge.advanced.tagsPlaceholder')}
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
                        <Text style={styles.label}>{t('createChallenge.advanced.reward')}</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.reward}
                            onChangeText={(text) => onUpdate('reward', text)}
                            placeholder={t('createChallenge.advanced.rewardPlaceholder')}
                            placeholderTextColor={theme.colors.text.disabled}
                        />
                    </View>

                    {/* Penalty */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>{t('createChallenge.advanced.penalty')}</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.penalty}
                            onChangeText={(text) => onUpdate('penalty', text)}
                            placeholder={t('createChallenge.advanced.penaltyPlaceholder')}
                            placeholderTextColor={theme.colors.text.disabled}
                        />
                    </View>
                </View>
            )}
        </>
    );
};
