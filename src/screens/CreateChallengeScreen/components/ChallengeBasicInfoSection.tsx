import React from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { LocalizedInput } from '../../../shared/ui/LocalizedInput';
import { styles } from '../styles';
import { CreateChallengeFormData } from '../hooks/useCreateChallengeForm';
import { ChallengeType, ChallengeVisibility, ChallengeFrequency } from '../../../app/types';

interface ChallengeBasicInfoSectionProps {
    formData: CreateChallengeFormData;
    onUpdate: (field: keyof CreateChallengeFormData, value: any) => void;
}

export const ChallengeBasicInfoSection: React.FC<ChallengeBasicInfoSectionProps> = ({
    formData,
    onUpdate,
}) => {
    const { t } = useTranslation();

    const CHALLENGE_TYPE_OPTIONS = [
        { label: t('createChallenge.basicInfo.types.QUEST'), value: 'QUEST' },
        { label: t('createChallenge.basicInfo.types.QUIZ'), value: 'QUIZ' },
        { label: t('createChallenge.basicInfo.types.ACTIVITY_PARTNER'), value: 'ACTIVITY_PARTNER' },
        { label: t('createChallenge.basicInfo.types.FITNESS_TRACKING'), value: 'FITNESS_TRACKING' },
        { label: t('createChallenge.basicInfo.types.HABIT_BUILDING'), value: 'HABIT_BUILDING' },
    ];

    const VISIBILITY_OPTIONS = [
        { label: t('createChallenge.basicInfo.visibilityOptions.PUBLIC'), value: 'PUBLIC' },
        { label: t('createChallenge.basicInfo.visibilityOptions.PRIVATE'), value: 'PRIVATE' },
        { label: t('createChallenge.basicInfo.visibilityOptions.GROUP_ONLY'), value: 'GROUP_ONLY' },
    ];

    const FREQUENCY_OPTIONS = [
        { label: t('createChallenge.basicInfo.frequencyOptions.ONE_TIME'), value: 'ONE_TIME' },
        { label: t('createChallenge.basicInfo.frequencyOptions.DAILY'), value: 'DAILY' },
        { label: t('createChallenge.basicInfo.frequencyOptions.WEEKLY'), value: 'WEEKLY' },
    ];

    return (
        <>
            {/* Title */}
            <View style={styles.formGroup}>
                <LocalizedInput
                    label={t('createChallenge.basicInfo.title')}
                    value={formData.title}
                    onChangeLocalized={(text) => onUpdate('title', text)}
                    placeholder={{
                        en: t('createChallenge.basicInfo.titlePlaceholder', { lng: 'en' }),
                        ru: t('createChallenge.basicInfo.titlePlaceholder', { lng: 'ru' })
                    }}
                    required
                />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
                <LocalizedInput
                    label={t('createChallenge.basicInfo.description')}
                    value={formData.description}
                    onChangeLocalized={(text) => onUpdate('description', text)}
                    placeholder={{
                        en: t('createChallenge.basicInfo.descriptionPlaceholder', { lng: 'en' }),
                        ru: t('createChallenge.basicInfo.descriptionPlaceholder', { lng: 'ru' })
                    }}
                    multiline
                    numberOfLines={3}
                    required
                />
            </View>

            {/* Type */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>{t('createChallenge.basicInfo.type')}</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.type}
                        onValueChange={(value) => onUpdate('type', value)}
                        style={styles.picker}
                    >
                        {CHALLENGE_TYPE_OPTIONS.map((option) => (
                            <Picker.Item key={option.value} label={option.label} value={option.value} />
                        ))}
                    </Picker>
                </View>
            </View>

            {/* Visibility */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>{t('createChallenge.basicInfo.visibility')}</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.visibility}
                        onValueChange={(value) => onUpdate('visibility', value)}
                        style={styles.picker}
                    >
                        {VISIBILITY_OPTIONS.map((option) => (
                            <Picker.Item key={option.value} label={option.label} value={option.value} />
                        ))}
                    </Picker>
                </View>
            </View>

            {/* Frequency */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>{t('createChallenge.basicInfo.frequency')}</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.frequency}
                        onValueChange={(value) => onUpdate('frequency', value)}
                        style={styles.picker}
                    >
                        {FREQUENCY_OPTIONS.map((option) => (
                            <Picker.Item key={option.value} label={option.label} value={option.value} />
                        ))}
                    </Picker>
                </View>
            </View>
        </>
    );
};
